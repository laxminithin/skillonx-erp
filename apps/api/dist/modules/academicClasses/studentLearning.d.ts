import { z } from 'zod';
import { facultyName } from './studentAccess.js';
type Row = Record<string, any>;
export declare const bookmarkSchema: z.ZodObject<{
    kind: z.ZodEnum<["TOPIC", "MATERIAL", "PYQ", "ANNOUNCEMENT"]>;
    refId: z.ZodUnion<[z.ZodString, z.ZodNumber]>;
    courseId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    title: z.ZodString;
    path: z.ZodString;
}, "strip", z.ZodTypeAny, {
    path: string;
    title: string;
    kind: "ANNOUNCEMENT" | "PYQ" | "TOPIC" | "MATERIAL";
    refId: string | number;
    courseId?: number | null | undefined;
}, {
    path: string;
    title: string;
    kind: "ANNOUNCEMENT" | "PYQ" | "TOPIC" | "MATERIAL";
    refId: string | number;
    courseId?: number | null | undefined;
}>;
export declare const searchSchema: z.ZodObject<{
    q: z.ZodString;
}, "strip", z.ZodTypeAny, {
    q: string;
}, {
    q: string;
}>;
export declare function subjectModules(studentId: number, courseId: number): Promise<{
    course: {
        id: any;
        name: any;
        code: any;
    };
    historical: boolean;
    moduleCount: number;
    topicCount: number;
    hours: any;
    modules: {
        topics: {
            completed: boolean;
            id: number;
            name: string;
            sortOrder: number;
            subtopics: {
                id: number;
                name: string;
                hours: number;
                hoursSource: any;
                classification: any;
                sourceReference: any;
            }[];
        }[];
        completedTopics: number;
        progress: number;
        id: number;
        name: string;
        unitKind: any;
        sortOrder: number;
        topicCount: number;
        subtopicCount: number;
        hours: any;
    }[];
}>;
export declare function subjectTopic(studentId: number, courseId: number, topicId: number): Promise<{
    historical: boolean;
    topic: {
        id: number;
        name: any;
        moduleId: number | null;
        moduleName: any;
        hours: any;
        completed: boolean;
        subtopics: {
            id: number;
            name: any;
            hours: number;
            classification: any;
        }[];
    };
    previous: {
        id: number;
        name: any;
    } | null;
    next: {
        id: number;
        name: any;
    } | null;
    assignments: {
        id: number;
        title: any;
        dueAt: any;
    }[];
    quizzes: {
        id: number;
        title: any;
        endAt: any;
    }[];
}>;
export declare function subjectMaterials(studentId: number, courseId: number): Promise<{
    historical: boolean;
    materials: {
        id: string;
        title: string;
        type: string;
        moduleName: string | null;
        topicName?: string | null;
        date: string | null;
        kind: string;
        path: string;
    }[];
}>;
export declare function subjectBeyondSyllabus(studentId: number, courseId: number): Promise<{
    items: Row[];
    historical?: undefined;
} | {
    historical: boolean;
    items: {
        id: number;
        title: any;
        whyItMatters: any;
        learningObjective: any;
        resources: any;
        activity: any;
        module: any;
        relatedTopic: any;
        hours: number | null;
    }[];
}>;
export declare function subjectOutcomes(studentId: number, courseId: number): Promise<{
    outcomes: {
        id: number;
        code: any;
        statement: any;
        number: number | null;
    }[];
}>;
export declare function subjectAnnouncements(studentId: number, courseId: number): Promise<{
    announcements: {
        unread: boolean;
        faculty: any;
        id: number;
        scope: any;
        title: any;
        body: any;
        courseId: number | null;
        courseCode: any;
        courseName: any;
        authorName: any;
        publishedAt: any;
    }[];
}>;
export declare function studentPyqs(studentId: number, filters?: {
    courseId?: number;
    year?: number;
    scheme?: string;
    examType?: string;
    semester?: string;
}): Promise<{
    papers: {
        id: number;
        paperId: any;
        subjectName: any;
        courseCode: any;
        courseId: number | null;
        scheme: any;
        semester: any;
        examType: any;
        examYear: number | null;
        academicYear: any;
        sourceUrl: string | null;
    }[];
}>;
export declare function studentPyq(studentId: number, paperId: number): Promise<{
    paper: {
        id: number;
        paperId: any;
        subjectName: any;
        courseCode: any;
        scheme: any;
        examType: any;
        examYear: number | null;
        sourceUrl: string;
        questions: {
            id: number;
            questionNumber: number;
            questionText: any;
            maxMarks: number | null;
            moduleOrUnit: any;
        }[];
    };
}>;
export declare function searchStudentContent(studentId: number, query: string): Promise<{
    results: Row[];
} | {
    results: {
        kind: string;
        id: number;
        title: any;
        subtitle: any;
        path: string;
    }[];
}>;
export declare function listBookmarks(studentId: number): Promise<{
    bookmarks: {
        id: number;
        kind: any;
        refId: any;
        courseId: number | null;
        title: any;
        path: any;
        createdAt: any;
    }[];
}>;
export declare function addBookmark(studentId: number, input: z.infer<typeof bookmarkSchema>): Promise<{
    bookmark: {
        id: number;
        kind: any;
        title: any;
        path: any;
        refId?: undefined;
    };
} | {
    bookmark: {
        id: number;
        kind: "ANNOUNCEMENT" | "PYQ" | "TOPIC" | "MATERIAL";
        title: string;
        path: string;
        refId: string;
    };
}>;
export declare function removeBookmark(studentId: number, id: number): Promise<{
    ok: boolean;
}>;
export declare function markMaterialViewed(studentId: number, courseId: number, materialId: string): Promise<{
    ok: boolean;
}>;
export { facultyName };
