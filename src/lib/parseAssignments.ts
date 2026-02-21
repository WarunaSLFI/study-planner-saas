export type ParsedAssignmentRow = {
    subjectCode: string | null;
    subjectName: string | null;
    title: string;
    dueDate: string | null; // ISO YYYY-MM-DD
};

// Map of month names to their numeric representation
const monthsMap: Record<string, string> = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
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

    // Date matchers
    const numericDateRegex = /\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b|\b(\d{4})-(\d{1,2})-(\d{1,2})\b/;
    const globalDateRegex = /^(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday),\s+(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i;

    // Subject extraction regex
    const subjectCodeRegex = /\b(?:[A-Z0-9]{2}\d{2}[A-Z0-9]{2}\d{2}|\d[A-Z0-9]{7}|[A-Z0-9]{2,}\d{2,}[A-Z0-9]{2,})\b/;
    const exactSubjectLineRegex = /\b([A-Z0-9]{6,10})(?:-\d{2,6})?\s+(.+)$/i;

    const noiseHeaders = new Set(["study type", "status", "assessor", "completed studies", "no completed studies", "kpl"]);

    let currentSubjectCode: string | null = null;
    let currentSubjectName: string | null = null;

    let globalDueDate: string | null = null;

    let isParsingBlock = false;
    let blockTitle = "";
    let blockSubjectCode: string | null = null;
    let blockSubjectName: string | null = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const lowerLine = line.toLowerCase();

        // Check if it's the start of an Activity event block
        if (lowerLine === "activity event") {
            if (isParsingBlock) {
                // Save previous block before starting a new one
                if (!blockTitle) blockTitle = "Untitled assignment";
                parsedAssignments.push({
                    subjectCode: blockSubjectCode || currentSubjectCode,
                    subjectName: blockSubjectName || currentSubjectName,
                    title: blockTitle,
                    dueDate: globalDueDate
                });
            }
            isParsingBlock = true;
            blockTitle = "";
            blockSubjectCode = null;
            blockSubjectName = null;
            continue; // Next line will be the title
        }

        if (isParsingBlock) {
            if (!blockTitle) {
                // First non-empty line after "Activity event" is the title
                blockTitle = line;
                continue;
            }

            // Check for subject definition within the block
            if (lowerLine.includes("assignment is due") || lowerLine.includes("file requires action") || line.includes("·")) {
                const parts = line.split("·");
                if (parts.length > 1) {
                    const subjectPart = parts[1].trim();
                    const match = subjectPart.match(exactSubjectLineRegex);
                    if (match) {
                        blockSubjectCode = match[1];
                        blockSubjectName = match[2].trim();
                    } else {
                        // Fallback to simpler regex if the pattern doesn't match perfectly
                        const codeMatch = subjectPart.match(subjectCodeRegex);
                        if (codeMatch) {
                            blockSubjectCode = codeMatch[0];
                            blockSubjectName = subjectPart.substring(codeMatch[0].length).trim().replace(/^-/, "").trim();
                        } else {
                            blockSubjectName = subjectPart;
                        }
                    }
                }
            }
            continue;
        }

        // --- Not inside an Activity block (Legacy Fallback Parsing + Global Date) ---

        // Check for global date
        const globalDateMatch = line.match(globalDateRegex);
        if (globalDateMatch) {
            const d = globalDateMatch[1].padStart(2, '0');
            const mName = globalDateMatch[2].toLowerCase();
            const y = globalDateMatch[3];

            if (monthsMap[mName]) {
                globalDueDate = `${y}-${monthsMap[mName]}-${d}`;
            }
            continue;
        }

        // Skip noise
        if (noiseHeaders.has(lowerLine)) continue;

        // Check if this line defines a fallback subject globally
        const subjectMatch = line.match(subjectCodeRegex);
        if (subjectMatch) {
            currentSubjectCode = subjectMatch[0];
            const namePart = line.substring(0, subjectMatch.index).trim();
            currentSubjectName = namePart.replace(/\s+/g, " ") || null;
            // Note: we don't 'continue' here because the code could be part of a single-line legacy assignment
        }

        // Check if line looks like an assignment (legacy approach)
        const isAssignment = assignmentKeywords.some(kw => lowerLine.includes(kw));
        const hasDateKeyword = lowerLine.includes("due") || lowerLine.includes("deadline") || lowerLine.includes("palautus");
        const dateMatch = line.match(numericDateRegex);

        if (isAssignment || hasDateKeyword || dateMatch) {
            let title = line;
            let dueDateIso: string | null = globalDueDate;

            if (dateMatch) {
                if (dateMatch[1] && dateMatch[2] && dateMatch[3]) {
                    const d = dateMatch[1].padStart(2, '0');
                    const m = dateMatch[2].padStart(2, '0');
                    const y = dateMatch[3];
                    dueDateIso = `${y}-${m}-${d}`;
                } else if (dateMatch[4] && dateMatch[5] && dateMatch[6]) {
                    const y = dateMatch[4];
                    const m = dateMatch[5].padStart(2, '0');
                    const d = dateMatch[6].padStart(2, '0');
                    dueDateIso = `${y}-${m}-${d}`;
                }
                title = title.replace(dateMatch[0], "").trim();
                title = title.replace(/(?:\b|)(due|deadline|palautus(?:päivä)?|date)(?:\b|:|-)/gi, "").trim();
                title = title.replace(/^[-:.,\s]+|[-:.,\s]+$/g, "");
            }

            if (!title) {
                title = "Untitled assignment";
            }

            // Only push if it has some meat to it, to avoid noise lines getting grabbed
            if (title !== "Untitled assignment" || dueDateIso) {
                parsedAssignments.push({
                    subjectCode: currentSubjectCode,
                    subjectName: currentSubjectName,
                    title: title,
                    dueDate: dueDateIso,
                });
            }
        }
    }

    // Handle the final block if the text ends on an Activity Event block
    if (isParsingBlock) {
        if (!blockTitle) blockTitle = "Untitled assignment";
        parsedAssignments.push({
            subjectCode: blockSubjectCode || currentSubjectCode,
            subjectName: blockSubjectName || currentSubjectName,
            title: blockTitle,
            dueDate: globalDueDate
        });
    }

    return parsedAssignments;
}

/*
// Test Examples showing parsing behavior:

// Example Input:
// Tuesday, 3 March 2026
// 08:30
// Activity event
// A-class member: return here exercise solutions for this week.
// Assignment is due · 5G00DL97-3012 Programming Languages 2

// Expected Output:
// [
//   {
//     "title": "A-class member: return here exercise solutions for this week.",
//     "subjectCode": "5G00DL97",
//     "subjectName": "Programming Languages 2",
//     "dueDate": "2026-03-03"
//   }
// ]
*/
