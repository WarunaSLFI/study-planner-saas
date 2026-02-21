export type ParsedAssignmentRow = {
    subjectCode: string | null;
    subjectName: string | null;
    title: string;
    dueDate: string | null; // ISO YYYY-MM-DD
};

/**
 * Parses raw text pasted from university sites to extract assignments.
 * Looks for assignment keywords, due dates, and subject details.
 */
export function parseAssignmentsFromText(input: string): ParsedAssignmentRow[] {
    if (!input) return [];

    const lines = input.split(/\r?\n/).map((line) => line.trim());
    const parsedAssignments: ParsedAssignmentRow[] = [];

    // Keywords and regex
    const assignmentKeywords = ["assignment", "exercise", "task", "project", "tehtävä", "harjoitus"];
    const dateRegex = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b|\b(\d{4})-(\d{1,2})-(\d{1,2})\b/;
    const codeRegex = /\b(?:[A-Z0-9]{2}\d{2}[A-Z0-9]{2}\d{2}|\d[A-Z0-9]{7}|[A-Z0-9]{2,}\d{2,}[A-Z0-9]{2,})\b/;
    const noiseHeaders = new Set(["study type", "status", "assessor", "completed studies", "no completed studies", "kpl"]);

    let currentSubjectCode: string | null = null;
    let currentSubjectName: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const lowerLine = line.toLowerCase();

        // Skip noise
        if (noiseHeaders.has(lowerLine)) continue;

        // Check if this line defines a subject (has a subject code)
        const subjectMatch = line.match(codeRegex);
        if (subjectMatch) {
            currentSubjectCode = subjectMatch[0];
            const namePart = line.substring(0, subjectMatch.index).trim();
            currentSubjectName = namePart.replace(/\s+/g, " ") || null;
            continue; // Move to next line, assuming this line is just the course header
        }

        // Check if line looks like an assignment
        const isAssignment = assignmentKeywords.some(kw => lowerLine.includes(kw));

        // We also consider it an assignment if it has a due date keyword OR just matches the date format in a strong way
        const hasDateKeyword = lowerLine.includes("due") || lowerLine.includes("deadline") || lowerLine.includes("palautus");
        const dateMatch = line.match(dateRegex);

        if (isAssignment || hasDateKeyword || dateMatch) {
            // It's likely an assignment

            let title = line;
            let dueDateIso: string | null = null;

            if (dateMatch) {
                // Extract and format date
                if (dateMatch[1] && dateMatch[2] && dateMatch[3]) {
                    // format DD.MM.YYYY
                    const d = dateMatch[1].padStart(2, '0');
                    const m = dateMatch[2].padStart(2, '0');
                    const y = dateMatch[3];
                    dueDateIso = `${y}-${m}-${d}`;
                } else if (dateMatch[4] && dateMatch[5] && dateMatch[6]) {
                    // format YYYY-MM-DD
                    const y = dateMatch[4];
                    const m = dateMatch[5].padStart(2, '0');
                    const d = dateMatch[6].padStart(2, '0');
                    dueDateIso = `${y}-${m}-${d}`;
                }

                // Try to clean the title by removing the date part, and date keywords
                title = title.replace(dateMatch[0], "").trim();
                title = title.replace(/(?:\b|)(due|deadline|palautus(?:päivä)?|date)(?:\b|:|-)/gi, "").trim();
                // Remove trailing/leading punctuation
                title = title.replace(/^[-:.,\s]+|[-:.,\s]+$/g, "");
            }

            if (!title) {
                title = "Untitled assignment";
            }

            parsedAssignments.push({
                subjectCode: currentSubjectCode,
                subjectName: currentSubjectName,
                title: title,
                dueDate: dueDateIso,
            });
        }
    }

    return parsedAssignments;
}
