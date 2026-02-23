"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useAppData } from "@/app/app/providers/AppDataProvider";
import { getAssignmentStatus } from "@/lib/assignmentStatus";

type NotificationContextValue = {
    permission: NotificationPermission;
    requestPermission: () => Promise<void>;
};

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

export default function NotificationProvider({ children }: { children: ReactNode }) {
    const { assignments } = useAppData();
    const [permission, setPermission] = useState<NotificationPermission>("default");

    useEffect(() => {
        if (typeof window !== "undefined") {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (typeof window !== "undefined" && "Notification" in window) {
            const res = await Notification.requestPermission();
            setPermission(res);
        }
    };

    // 1. Tab Badge Logic (Overdue Count)
    useEffect(() => {
        const overdueCount = assignments.filter(
            (a) => getAssignmentStatus(a.dueDate, a.isCompleted) === "Overdue"
        ).length;

        const baseTitle = "Study Planner"; // Fallback if we can't get current title
        const currentTitle = document.title.replace(/^\(\d+\) /, "");

        if (overdueCount > 0) {
            document.title = `(${overdueCount}) Overdue | ${currentTitle || baseTitle}`;
        } else {
            document.title = currentTitle || baseTitle;
        }
    }, [assignments]);

    // 2. Browser Alerts (Due Soon)
    useEffect(() => {
        if (permission !== "granted") return;

        const dueSoonAssignments = assignments.filter(
            (a) => getAssignmentStatus(a.dueDate, a.isCompleted) === "Due Soon"
        );

        const notifiedIds = JSON.parse(localStorage.getItem("notified_assignment_ids") || "[]");
        let newNotified = [...notifiedIds];
        let alerted = false;

        dueSoonAssignments.forEach((a) => {
            if (!notifiedIds.includes(a.id)) {
                new Notification("Assignment Due Soon", {
                    body: `${a.subject}: ${a.title} is due on ${a.dueDate}`,
                    icon: "/favicon.ico", // Fallback to favicon
                });
                newNotified.push(a.id);
                alerted = true;
            }
        });

        if (alerted) {
            localStorage.setItem("notified_assignment_ids", JSON.stringify(newNotified));
        }
    }, [assignments, permission]);

    return (
        <NotificationContext.Provider value={{ permission, requestPermission }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotification() {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error("useNotification must be used within a NotificationProvider");
    }
    return context;
}
