export type ParsedSubjectRow = {
    name: string;
    code: string;
};

export function parseSubjectsFromText(input: string): ParsedSubjectRow[] {
    if (!input) return [];

    const lines = input.split(/\r?\n/).map((line) => line.trim());
    const parsedRows: ParsedSubjectRow[] = [];

    // Covers standard university codes e.g. 5G00DL86, NN00FC85, 5G00GC28
    const codeRegex = /\b(?:[A-Z0-9]{2}\d{2}[A-Z0-9]{2}\d{2}|\d[A-Z0-9]{7}|[A-Z0-9]{2,}\d{2,}[A-Z0-9]{2,})\b/;

    // Known noise lines to ignore
    const noiseHeaders = new Set([
        "study type",
        "status",
        "assessor",
        "completed studies",
        "no completed studies",
        "kpl",
    ]);

    for (const line of lines) {
        if (!line) continue;

        const lowerLine = line.toLowerCase();
        if (noiseHeaders.has(lowerLine)) continue;

        const match = line.match(codeRegex);
        if (match) {
            const code = match[0];
            // The name is usually everything before the code
            const namePart = line.substring(0, match.index).trim();

            // Collapse multiple spaces into one
            const cleanName = namePart.replace(/\s+/g, " ");

            if (cleanName && code) {
                parsedRows.push({
                    name: cleanName,
                    code,
                });
            }
        }
    }

    return parsedRows;
}
