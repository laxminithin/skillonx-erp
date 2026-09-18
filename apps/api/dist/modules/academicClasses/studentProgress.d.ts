import { type ProgressCounts } from './studentProgressMath.js';
type Row = Record<string, any>;
export declare function recordProgress(input: {
    studentId: number;
    collegeId: number;
    classId?: number | null;
    courseId: number;
    moduleId?: number | null;
    topicId?: number | null;
    activityType: string;
    activityId: string | number;
    status?: string;
    progressPercentage?: number;
}): Promise<void>;
export declare function rememberPosition(input: {
    studentId: number;
    collegeId: number;
    classId?: number | null;
    courseId: number;
    moduleId?: number | null;
    topicId?: number | null;
    path: string;
    label: string;
}): Promise<void>;
export declare function progressForCourses(studentId: number, collegeId: number, classId: number, courseIds: number[], classSectionId: number | null): Promise<{
    byCourse: Map<number, {
        progress: number;
        topics: ProgressCounts;
        assignments: ProgressCounts;
        quizzes: ProgressCounts;
        activities: ProgressCounts;
        pendingTasks: number;
    }>;
    overall: number;
    work: {
        assignments: Row[];
        quizzes: Row[];
    };
}>;
export declare function continueLearning(studentId: number, classId: number | null): Promise<{
    courseId: number;
    courseName: any;
    courseCode: any;
    moduleId: number | null;
    moduleName: any;
    topicId: number | null;
    topicName: any;
    path: any;
    label: any;
} | null>;
export declare function completeTopic(studentId: number, courseId: number, topicId: number): Promise<{
    completed: boolean;
    topicId: number;
}>;
export declare function dashboardProgress(studentId: number): Promise<{
    overall: number;
    byCourse: Map<any, any>;
    work: {
        assignments: never[];
        quizzes: never[];
    };
    continueLearning: null;
} | {
    continueLearning: {
        courseId: number;
        courseName: any;
        courseCode: any;
        moduleId: number | null;
        moduleName: any;
        topicId: number | null;
        topicName: any;
        path: any;
        label: any;
    } | null;
    byCourse: Map<number, {
        progress: number;
        topics: ProgressCounts;
        assignments: ProgressCounts;
        quizzes: ProgressCounts;
        activities: ProgressCounts;
        pendingTasks: number;
    }>;
    overall: number;
    work: {
        assignments: Row[];
        quizzes: Row[];
    };
}>;
export {};
