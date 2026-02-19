"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
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
  status: AssignmentStatus;
  score: string;
};

type AppDataContextValue = {
  courses: CourseItem[];
  assignments: AssignmentItem[];
  addCourse: (name: string) => void;
  addAssignment: (assignmentData: AddAssignmentInput) => void;
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
    status: "Completed",
    score: "9/10",
  },
  {
    id: "assignment-2",
    title: "Datapipelines Project",
    courseId: "course-datapipelines",
    course: "Datapipelines",
    dueDate: "2026-03-10",
    status: "Upcoming",
    score: "24/30",
  },
  {
    id: "assignment-3",
    title: "Finnish Society Quiz",
    courseId: "course-finnish-society",
    course: "Finnish Society",
    dueDate: "2026-02-20",
    status: "Overdue",
    score: "8/10",
  },
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

    setAssignments((previousAssignments) => [
      {
        id: `assignment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: assignmentData.title.trim(),
        courseId: assignmentData.courseId,
        course: relatedCourse?.name ?? "Unknown Course",
        dueDate: assignmentData.dueDate,
        status: assignmentData.status,
        score: assignmentData.score,
      },
      ...previousAssignments,
    ]);
  };

  const value = useMemo<AppDataContextValue>(
    () => ({
      courses,
      assignments,
      addCourse,
      addAssignment,
    }),
    [courses, assignments],
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataContextValue {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider.");
  }

  return context;
}
