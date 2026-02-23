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

    const codeRegex = /([A-Z0-9]{2,}\d{2,}[A-Z0-9]*(?:-\d{3,5})?)/gi;

    // Heuristics: if a parsed name ends with noisy OCR fluff or separator chars, strip them
    const exactNoise = /\b(?:course implementations?|course name|course category|course progress|study type|assessor|status|- TAMK)\b/gi;
    const percentages = /\b\d{1,3}%\s*complete(?:d)?\b/gi;

    const sanitizeName = (name: string) => {
        let cleaned = name.replace(exactNoise, " ").replace(percentages, " ");
        cleaned = normalizeWhitespace(cleaned);
        cleaned = cleaned.replace(trailingSingleLettersRegex, "").trim();
        cleaned = cleaned.replace(trailingLowercaseAfterNumberRegex, "$1").trim();
        // Remove trailing non-alphanumeric trailing symbols like -, ~, @
        cleaned = cleaned.replace(/^[-\~@\s]+/, "").trim(); // leading
        cleaned = cleaned.replace(/[-~@]+$/, "").trim(); // trailing
        return normalizeWhitespace(cleaned);
    };

    const isLikelyContinuationLine = (line: string) => {
        const cleaned = sanitizeName(line);
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

    let codesParsedOnLastLine = 0;

    for (const line of lines) {
        if (!line) continue;
        if (noiseRegex.test(line)) {
            codesParsedOnLastLine = 0;
            continue;
        }

        const codes: { code: string; index: number; end: number }[] = [];
        codeRegex.lastIndex = 0;
        let match: RegExpExecArray | null;

        while ((match = codeRegex.exec(line)) !== null) {
            codes.push({ code: match[1], index: match.index, end: match.index + match[0].length });
        }

        if (codes.length > 0) {
            let isNameCodeFormat = false;
            const textBefore = line.substring(0, codes[0].index).trim();
            if (textBefore.length > 2 && /[a-zA-Z]/.test(textBefore)) {
                isNameCodeFormat = true;
            }

            let foundCodesOnLine = 0;
            if (isNameCodeFormat) {
                // NAME CODE layout
                for (let i = 0; i < codes.length; i++) {
                    const startIdx = i === 0 ? 0 : codes[i - 1].end;
                    let rawName = line.substring(startIdx, codes[i].index).trim();
                    rawName = rawName.replace(/^[\d\s]+/, "").trim(); // Strip potential trailing credits from previous code
                    const cleanName = sanitizeName(rawName);

                    if (codes[i].code.length >= 5 && codes[i].code.length <= 16) {
                        foundCodesOnLine++;
                        parsedRows.push({
                            name: cleanName || "Unknown Subject",
                            code: codes[i].code.toUpperCase(),
                        });
                    }
                }
            } else {
                // CODE NAME layout
                for (let i = 0; i < codes.length; i++) {
                    const startIdx = codes[i].end;
                    const endIdx = i < codes.length - 1 ? codes[i + 1].index : line.length;
                    const rawName = line.substring(startIdx, endIdx).trim();
                    const cleanName = sanitizeName(rawName);

                    if (codes[i].code.length >= 5 && codes[i].code.length <= 16) {
                        foundCodesOnLine++;
                        parsedRows.push({
                            name: cleanName || "Unknown Subject",
                            code: codes[i].code.toUpperCase(),
                        });
                    }
                }
            }

            codesParsedOnLastLine = foundCodesOnLine;
            continue;
        }

        const cleanName = sanitizeName(line);
        if (!cleanName || cleanName.length <= 2) {
            codesParsedOnLastLine = 0;
            continue;
        }

        if (parsedRows.length > 0 && codesParsedOnLastLine === 1 && isLikelyContinuationLine(cleanName)) {
            parsedRows[parsedRows.length - 1].name = sanitizeName(parsedRows[parsedRows.length - 1].name + " " + cleanName);
            continue;
        } else if (parsedRows.length > 0 && codesParsedOnLastLine > 1) {
            // Multi-column continuation! Use the raw line (with noise removed) to split by larger visual gaps (>= 2 spaces)
            const chunks = line.replace(exactNoise, " ").replace(percentages, " ").split(/\s{2,}/).map(s => s.trim()).filter(s => s);

            // Distribute these chunks to the last N parsed subjects, aligning them rightwards.
            const rowsToUpdate = parsedRows.slice(-codesParsedOnLastLine);
            const offset = Math.max(0, codesParsedOnLastLine - chunks.length);

            for (let i = 0; i < chunks.length; i++) {
                const targetRow = rowsToUpdate[offset + i];
                const sanitizedChunk = sanitizeName(chunks[i]);
                if (targetRow && sanitizedChunk && sanitizedChunk.length > 2) {
                    targetRow.name = sanitizeName(targetRow.name + " " + sanitizedChunk);
                }
            }
            continue;
        }

        if (parsedRows.length === 0 && !continuationBlockRegex.test(cleanName)) {
            // It didn't match any code.
            parsedRows.push({
                name: cleanName,
                code: "",
            });
        }

        codesParsedOnLastLine = 0;
    }

    // Deduplicate logic: prioritize keeping the first subject that has a particular name.
    const uniqueRows: ParsedSubjectRow[] = [];
    const seenNames = new Set<string>();

    for (const row of parsedRows) {
        const normalizedName = row.name.toLowerCase().replace(/\s+/g, " ").trim();
        if (normalizedName === "unknown subject" || normalizedName.length === 0) {
            uniqueRows.push(row);
        } else if (!seenNames.has(normalizedName)) {
            seenNames.add(normalizedName);
            uniqueRows.push(row);
        }
    }

    return uniqueRows;
}
