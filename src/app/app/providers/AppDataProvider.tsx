"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useState,
  useEffect,
} from "react";
import type { AssignmentItem, AssignmentStatus } from "@/components/AssignmentsTable";

export type CourseItem = {
  id: string;
  name: string;
};

export type AddAssignmentInput = {
  title: string;
  courseId: string;
  dueDate: string;
  isCompleted: boolean;
  score: string;
};

export type ActivityItem = {
  id: string;
  assignmentId: string;
  type: "assignment_created" | "assignment_completed" | "assignment_uncompleted";
  title: string;
  courseName: string;
  createdAt: string;
  dueDate: string; // fallback if assignment removed
  status: AssignmentStatus;
};

export type AppDataState = {
  courses: CourseItem[];
  assignments: AssignmentItem[];
  activity: ActivityItem[];
};

type AppDataContextValue = {
  courses: CourseItem[];
  assignments: AssignmentItem[];
  activity: ActivityItem[];
  addCourse: (name: string) => void;
  addAssignment: (assignmentData: AddAssignmentInput) => void;
  updateAssignment: (id: string, updatedData: Partial<AssignmentItem>) => void;
  toggleAssignmentCompletion: (id: string) => void;
};

const initialCourses: CourseItem[] = [
  { id: "course-operating-systems", name: "Operating Systems" },
  { id: "course-datapipelines", name: "Datapipelines" },
  { id: "course-finnish-society", name: "Finnish Society" },
];

const initialAssignments: AssignmentItem[] = [
  {
    id: "assignment-1",
    title: "Operating Systems Exercise 4",
    courseId: "course-operating-systems",
    course: "Operating Systems",
    dueDate: "2026-02-25",
    isCompleted: true,
    score: "9/10",
    createdAt: "2026-02-15T10:00:00.000Z",
  },
  {
    id: "assignment-2",
    title: "Datapipelines Project",
    courseId: "course-datapipelines",
    course: "Datapipelines",
    dueDate: "2026-03-10",
    isCompleted: false,
    score: "24/30",
    createdAt: "2026-02-18T14:30:00.000Z",
  },
  {
    id: "assignment-3",
    title: "Finnish Society Quiz",
    courseId: "course-finnish-society",
    course: "Finnish Society",
    dueDate: "2026-02-20",
    isCompleted: false,
    score: "8/10",
    createdAt: "2026-02-10T09:15:00.000Z",
  },
];

import { getAssignmentStatus } from "@/lib/assignmentStatus";

const initialActivity: ActivityItem[] = [
  {
    id: "activity-1",
    assignmentId: "assignment-2",
    type: "assignment_created",
    title: "Datapipelines Project",
    courseName: "Datapipelines",
    createdAt: "2026-02-18T14:30:00.000Z",
    dueDate: "2026-03-10",
    status: "Upcoming",
  },
  {
    id: "activity-2",
    assignmentId: "assignment-1",
    type: "assignment_created",
    title: "Operating Systems Exercise 4",
    courseName: "Operating Systems",
    createdAt: "2026-02-15T10:00:00.000Z",
    dueDate: "2026-02-25",
    status: "Completed",
  },
  {
    id: "activity-3",
    assignmentId: "assignment-3",
    type: "assignment_created",
    title: "Finnish Society Quiz",
    courseName: "Finnish Society",
    createdAt: "2026-02-10T09:15:00.000Z",
    dueDate: "2026-02-20",
    status: "Overdue",
  }
];

const AppDataContext = createContext<AppDataContextValue | undefined>(undefined);

type AppDataProviderProps = {
  children: ReactNode;
};

function createCourseId(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `course-${slug || "new"}-${Date.now()}`;
}

export default function AppDataProvider({ children }: AppDataProviderProps) {
  const [courses, setCourses] = useState<CourseItem[]>(initialCourses);
  const [assignments, setAssignments] =
    useState<AssignmentItem[]>(initialAssignments);
  const [activity, setActivity] = useState<ActivityItem[]>(initialActivity);
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedData = localStorage.getItem("assignment-tracker-data");
      if (storedData) {
        const parsed: AppDataState = JSON.parse(storedData);
        if (parsed.courses) setCourses(parsed.courses);
        if (parsed.assignments) setAssignments(parsed.assignments);
        if (parsed.activity) setActivity(parsed.activity);
      }
    } catch (e) {
      console.error("Failed to parse local storage data:", e);
      localStorage.removeItem("assignment-tracker-data");
    } finally {
      setIsHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem(
        "assignment-tracker-data",
        JSON.stringify({ courses, assignments, activity }),
      );
    }
  }, [courses, assignments, activity, isClient]);

  const addCourse = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    setCourses((previousCourses) => [
      ...previousCourses,
      { id: createCourseId(trimmedName), name: trimmedName },
    ]);
  };

  const addAssignment = (assignmentData: AddAssignmentInput) => {
    const relatedCourse = courses.find(
      (course) => course.id === assignmentData.courseId,
    );
    const courseName = relatedCourse?.name ?? "Unknown Course";
    const now = new Date().toISOString();
    const newAssignmentId = `assignment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setAssignments((previousAssignments) => [
      {
        id: newAssignmentId,
        title: assignmentData.title.trim(),
        courseId: assignmentData.courseId,
        course: courseName,
        dueDate: assignmentData.dueDate,
        isCompleted: assignmentData.isCompleted,
        score: assignmentData.score,
        createdAt: now,
      },
      ...previousAssignments,
    ]);

    setActivity((previousActivity) => {
      const newActivity: ActivityItem = {
        id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        assignmentId: newAssignmentId,
        type: "assignment_created",
        title: assignmentData.title.trim(),
        courseName,
        createdAt: now,
        dueDate: assignmentData.dueDate,
        status: getAssignmentStatus(assignmentData.dueDate, assignmentData.isCompleted),
      };
      return [newActivity, ...previousActivity].slice(0, 8);
    });
  };

  const updateAssignment = (id: string, updatedData: Partial<AssignmentItem>) => {
    setAssignments((previousAssignments) =>
      previousAssignments.map((assignment) =>
        assignment.id === id
          ? {
            ...assignment,
            ...updatedData,
            // Update course name if courseId changes
            course:
              updatedData.courseId && updatedData.courseId !== assignment.courseId
                ? courses.find((c) => c.id === updatedData.courseId)?.name ?? "Unknown Course"
                : updatedData.course ?? assignment.course,
          }
          : assignment,
      ),
    );
  };

  const toggleAssignmentCompletion = (id: string) => {
    let updatedAssignment: AssignmentItem | undefined;

    setAssignments((previousAssignments) =>
      previousAssignments.map((assignment) => {
        if (assignment.id === id) {
          updatedAssignment = {
            ...assignment,
            isCompleted: !assignment.isCompleted,
          };
          return updatedAssignment;
        }
        return assignment;
      }),
    );

    if (updatedAssignment) {
      setActivity((previousActivity) => {
        const now = new Date().toISOString();
        const actionType = updatedAssignment!.isCompleted ? "assignment_completed" : "assignment_uncompleted";

        const newActivity: ActivityItem = {
          id: `activity-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          assignmentId: updatedAssignment!.id,
          type: actionType,
          title: updatedAssignment!.title,
          courseName: updatedAssignment!.course,
          createdAt: now,
          dueDate: updatedAssignment!.dueDate,
          status: getAssignmentStatus(updatedAssignment!.dueDate, updatedAssignment!.isCompleted),
        };
        return [newActivity, ...previousActivity].slice(0, 8);
      });
    }
  };

  const value: AppDataContextValue = {
    courses,
    assignments,
    activity,
    addCourse,
    addAssignment,
    updateAssignment,
    toggleAssignmentCompletion,
  };

  if (!isHydrated) {
    return <div className="p-6 text-sm text-gray-500">Loading...</div>;
  }

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider.");
  }

  return context;
}
