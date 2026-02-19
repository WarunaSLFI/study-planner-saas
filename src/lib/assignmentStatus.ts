export type AssignmentComputedStatus = "Upcoming" | "Overdue" | "Completed" | "Due Soon";

export function getAssignmentStatus(
    dueDate: string,
    isCompleted: boolean,
): AssignmentComputedStatus {
    if (isCompleted) {
        return "Completed";
    }

    // Create Date objects representing the due date and today at midnight local time
    // to avoid timezone offset issues when comparing just the YYYY-MM-DD parts.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [year, month, day] = dueDate.split("-").map(Number);
    const due = new Date(year, month - 1, day);
    due.setHours(0, 0, 0, 0);

    if (due < today) {
        return "Overdue";
    }

    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    if (due <= threeDaysFromNow) {
        return "Due Soon";
    }

    return "Upcoming";
}
