export type ParsedSubjectRow = {
    name: string;
    code: string;
};

export function parseSubjectsFromText(input: string): ParsedSubjectRow[] {
    if (!input) return [];

    const lines = input.split(/\r?\n/).map((line) => line.trim());
    const parsedRows: ParsedSubjectRow[] = [];
    const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

    // Known noise lines to ignore
    const noiseRegex = /^(course category|course implementations?|course progress|course name|other|kpl|status|study type|assessor|completed studies|no completed studies)$/i;
    const continuationBlockRegex = /(?:\b(?:course implementations?|course progress|course category|status|study type|assessor|tamk)\b|%|\bcomplete(?:d)?\b)/i;
    const trailingSingleLettersRegex = /(?:\s+[A-Za-z]){2,}\s*$/;
    const trailingLowercaseAfterNumberRegex = /(\d)\s+(?:[a-z]{4,}\s+){1,}[a-z]{4,}\s*$/;
    const continuationConnectorRegex = /^(?:and|or|of|to|for|in|on|with|the|a|an)\b/i;

    // We want to globally match a code and non-greedily capture everything after it up to the next code or EOL
    // A valid code generally has uppercase/numbers, at least two digits, optional -1234
    const codeRegex = /([A-Z0-9]{2,}\d{2,}[A-Z0-9]*(?:-\d{3,5})?)\s+((?:(?![A-Z0-9]{2,}\d{2,}[A-Z0-9]*(?:-\d{3,5})?).)*)/gi;

    // Heuristics: if a parsed name ends with noisy OCR fluff or separator chars, strip them
    const trailingNoiseRegex = /(?:\b\d{1,3}%\s*complete(?:d)?\b.*$|\b(?:course implementations?|course name|course category|course progress|study type|assessor|status)\b.*$|\s*-\s*TAMK\b.*$|~~.*$|@@.*$)/i;

    const sanitizeName = (name: string) => {
        let cleaned = normalizeWhitespace(name);
        cleaned = cleaned.replace(trailingNoiseRegex, "").trim();
        cleaned = cleaned.replace(trailingSingleLettersRegex, "").trim();
        cleaned = cleaned.replace(trailingLowercaseAfterNumberRegex, "$1").trim();
        // Remove trailing non-alphanumeric trailing symbols like -, ~, @
        cleaned = cleaned.replace(/[-~@]+$/, "").trim();
        return cleaned;
    };

    const isLikelyContinuationLine = (line: string) => {
        const cleaned = normalizeWhitespace(line);
        if (!cleaned) return false;
        if (noiseRegex.test(cleaned)) return false;
        if (continuationBlockRegex.test(cleaned)) return false;
        if (/\d/.test(cleaned)) return false;

        const words = cleaned.split(" ");
        if (words.length > 4) return false;

        const lowercaseWords = words.filter((word) => /^[a-z]{3,}$/.test(word));
        const titleCaseWords = words.filter((word) => /^[A-Z][A-Za-z'-]*$/.test(word));
        if (lowercaseWords.length >= 2 && titleCaseWords.length === 0) return false;

        return /^[A-Z]/.test(cleaned) || continuationConnectorRegex.test(cleaned);
    };

    let allowContinuationForLastRow = false;

    for (const line of lines) {
        if (!line) continue;
        if (noiseRegex.test(line)) {
            allowContinuationForLastRow = false;
            continue;
        }

        let foundCodesOnLine = false;
        let match: RegExpExecArray | null;

        // Use matchAll or reset lastIndex to find all occurrences
        codeRegex.lastIndex = 0;
        while ((match = codeRegex.exec(line)) !== null) {
            const code = match[1];
            const namePart = match[2];

            const cleanName = sanitizeName(namePart);

            if (code && code.length >= 5 && code.length <= 16) {
                foundCodesOnLine = true;
                parsedRows.push({
                    name: cleanName || "Unknown Subject",
                    code: code.toUpperCase(),
                });
            }
        }

        if (foundCodesOnLine) {
            allowContinuationForLastRow = true;
            continue;
        }

        const cleanName = sanitizeName(line);
        if (!cleanName || cleanName.length <= 2) {
            allowContinuationForLastRow = false;
            continue;
        }

        if (parsedRows.length > 0 && allowContinuationForLastRow && isLikelyContinuationLine(cleanName)) {
            parsedRows[parsedRows.length - 1].name = sanitizeName(parsedRows[parsedRows.length - 1].name + " " + cleanName);
            continue;
        }

        if (parsedRows.length === 0 && !continuationBlockRegex.test(cleanName)) {
            // It didn't match any code.
            parsedRows.push({
                name: cleanName,
                code: "",
            });
        }

        allowContinuationForLastRow = false;
    }

    return parsedRows;
}
