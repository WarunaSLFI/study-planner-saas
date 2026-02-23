export type ParsedSubjectRow = {
    name: string;
    code: string;
};

export function parseSubjectsFromText(input: string): ParsedSubjectRow[] {
    if (!input) return [];

    const lines = input.split(/\r?\n/).map((line) => line.trim());
    const parsedRows: ParsedSubjectRow[] = [];

    // Known noise lines to ignore
    const noiseRegex = /^(course category|course implementations|course progress|course name|other|kpl|status|study type|assessor|completed studies|no completed studies)/i;

    // We want to globally match a code and non-greedily capture everything after it up to the next code or EOL
    // A valid code generally has uppercase/numbers, at least two digits, optional -1234
    const codeRegex = /([A-Z0-9]{2,}\d{2,}[A-Z0-9]*(?:-\d{3,5})?)\s+((?:(?![A-Z0-9]{2,}\d{2,}[A-Z0-9]*(?:-\d{3,5})?).)*)/gi;

    // Heuristics: if a parsed name ends with noisy OCR fluff or separator chars, strip them
    const trailingNoiseRegex = /(?:studies course implementations|course implementations|course name|course category|course progress|study type|assessor|status|- TAMK|~~|@@).*$/i;

    const sanitizeName = (name: string) => {
        let cleaned = name.replace(/\s+/g, " ").trim();
        cleaned = cleaned.replace(trailingNoiseRegex, "").trim();
        // Remove trailing non-alphanumeric trailing symbols like -, ~, @
        cleaned = cleaned.replace(/[-~@]+$/, "").trim();
        return cleaned;
    };

    for (const line of lines) {
        if (!line) continue;
        if (noiseRegex.test(line)) continue;

        let foundCodesOnLine = false;
        let match;

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

        if (!foundCodesOnLine) {
            // It didn't match any code.
            // If we have a recently added course, this line might be a continuation of its name.
            const cleanName = sanitizeName(line);
            if (cleanName.length > 2) {
                if (parsedRows.length > 0) {
                    parsedRows[parsedRows.length - 1].name = sanitizeName(parsedRows[parsedRows.length - 1].name + " " + cleanName);
                } else {
                    parsedRows.push({
                        name: cleanName,
                        code: "",
                    });
                }
            }
        }
    }

    return parsedRows;
}
