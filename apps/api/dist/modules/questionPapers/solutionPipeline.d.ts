import { computeReadiness } from './sourcePolicy.js';
export type GroundedSolution = {
    textbookId: number;
    textbookTitle: string;
    authors: string | null;
    edition: string | null;
    chapter: string | null;
    section: string | null;
    pageRange: string | null;
    extractedSourceReference: string | null;
    modelSolution: string;
    expectedKeyPoints: string;
    scheme: Array<{
        code: string;
        label: string;
        maxMarks: number;
    }>;
    schemeStatus: 'READY' | 'SCHEME_NEEDS_REVIEW' | 'SCHEME_PENDING';
    verificationStatus: 'TEXTBOOK_GROUNDED' | 'TEXTBOOK_SOURCE_REQUIRED' | 'SOLUTION_PENDING';
    textbookGrounded: boolean;
    citation: string | null;
};
export declare function locateTextbookExcerpt(collegeId: number, courseId: number, questionText: string): Promise<{
    book: null;
    excerpt: null;
    reason: "TEXTBOOK_SOURCE_REQUIRED";
} | {
    book: {
        id: number;
        courseId: number;
        schemeId: number | null;
        title: string;
        authors: string | null;
        edition: string | null;
        publisher: string | null;
        year: number | null;
        isbn: string | null;
        status: string;
        priority: number;
        isPrimary: boolean;
        isActive: boolean;
        sourceFile: string | null;
        sourceReference: string | null;
        notes: string | null;
    };
    excerpt: null;
    reason: "TEXTBOOK_SOURCE_REQUIRED";
} | {
    book: {
        id: number;
        courseId: number;
        schemeId: number | null;
        title: string;
        authors: string | null;
        edition: string | null;
        publisher: string | null;
        year: number | null;
        isbn: string | null;
        status: string;
        priority: number;
        isPrimary: boolean;
        isActive: boolean;
        sourceFile: string | null;
        sourceReference: string | null;
        notes: string | null;
    };
    excerpt: null;
    reason: "SOLUTION_PENDING";
} | {
    book: {
        id: number;
        courseId: number;
        schemeId: number | null;
        title: string;
        authors: string | null;
        edition: string | null;
        publisher: string | null;
        year: number | null;
        isbn: string | null;
        status: string;
        priority: number;
        isPrimary: boolean;
        isActive: boolean;
        sourceFile: string | null;
        sourceReference: string | null;
        notes: string | null;
    };
    excerpt: any;
    reason: null;
}>;
export declare function generateTextbookGroundedSolution(opts: {
    collegeId: number;
    courseId: number;
    questionText: string;
    marks: number;
    rbt?: string | null;
    bloomLevel?: string | null;
}): Promise<GroundedSolution>;
export declare function persistQuestionSolution(opts: {
    collegeId: number;
    questionRowId: number;
    courseId: number | null;
    questionText: string;
    marks: number | null;
    rbt?: string | null;
    bloomLevel?: string | null;
}): Promise<GroundedSolution | {
    status: string;
} | null>;
export declare function refreshQuestionReadiness(questionRowId: number): Promise<{
    status: "READY" | "PYQ_EXTRACTED" | "MARKS_UNRESOLVED" | "MODULE_MAPPING_NEEDS_REVIEW" | "CO_MAPPING_NEEDS_REVIEW" | "MAPPING_DISCREPANCY" | "TEXTBOOK_SOURCE_REQUIRED" | "SOLUTION_PENDING" | "SCHEME_PENDING" | "SCHEME_NEEDS_REVIEW" | "READY_FOR_INTERNAL_PAPER";
    ready: boolean;
    checks: {
        pyqSource: boolean;
        originalQuestion: boolean;
        marksFromPyq: boolean;
        moduleMapped: boolean;
        coVerified: boolean;
        poPsoVerified: boolean;
        rbt: boolean;
        textbookSource: boolean;
        textbookSolution: boolean;
        scheme: boolean;
        orPaired: boolean;
        subquestionPresent: boolean;
    };
    reason: string | null;
} | null>;
export { computeReadiness };
