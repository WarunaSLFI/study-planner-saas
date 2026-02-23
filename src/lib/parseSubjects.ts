export type ParsedSubjectRow = {
    name: string;
    code: string;
};

export function parseSubjectsFromText(input: string): ParsedSubjectRow[] {
    if (!input) return [];

    const lines = input.split(/\\r?\\n/).map((line) => line.trim());
    const parsedRows: ParsedSubjectRow[] = [];

    // Known noise lines to ignore
    const noiseRegex = /^(course category|course implementations|course progress|course name|other|kpl|status|study type|assessor|completed studies|no completed studies)/i;

    // Code must start the line, contain uppercase/numbers, have at least two digits, and optional -1234
    // Usually length before hyphen is 5 to 12 chars
    const codeRegex = /^([A-Z0-9]*\\d{2,}[A-Z0-9]*(?:-\\d{3,5})?)\\s+(.*)$/i;

    for (const line of lines) {
        if (!line) continue;

        if (noiseRegex.test(line)) continue;

        const match = line.match(codeRegex);
        if (match) {
            const code = match[1];
            // Collapse multiple spaces into one
            const cleanName = match[2].replace(/\\s+/g, " ");

            // Ensure the code looks like a real code (at least 5 chars)
            if (cleanName && code && code.length >= 5 && code.length <= 16) {
                parsedRows.push({
                    name: cleanName,
                    code: code.toUpperCase(),
                });
            }
        } else {
            // It might be a valid course without a code
            // Only add it if it's not noise
            const cleanName = line.replace(/\\s+/g, " ");
            if (cleanName.length > 3) {
                // If the app requires a code, we can just leave it empty
                parsedRows.push({
                    name: cleanName,
                    code: "",
                });
            }
        }
    }

    return parsedRows;
}
