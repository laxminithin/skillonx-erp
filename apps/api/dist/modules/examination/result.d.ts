import type { ExamActor } from './access.js';
export declare function processResults(actor: ExamActor, examId: number): Promise<{
    studentsProcessed: number;
}>;
export declare function publishResults(actor: ExamActor, examId: number): Promise<{
    published: number;
}>;
export declare function studentResults(studentId: number, collegeId: number, semesterId?: number): Promise<{
    semesterResultId: number;
    examId: number;
    examName: any;
    examType: any;
    semesterId: number;
    semesterLabel: any;
    sgpa: number | null;
    status: any;
    resultVersion: number;
    publishedAt: any;
    subjects: {
        courseId: number;
        courseCode: any;
        courseName: any;
        internalMarks: number | null;
        externalMarks: number | null;
        totalMarks: number | null;
        grade: any;
        gradePoints: number | null;
        credits: number | null;
        resultStatus: any;
    }[];
}[]>;
export declare function studentAcademicRecord(studentId: number, collegeId: number): Promise<{
    semesters: {
        semesterId: number;
        semesterLabel: any;
        semesterNumber: any;
        academicYearLabel: any;
        sgpa: number | null;
        creditsEarned: number | null;
        status: any;
    }[];
    cgpa: number | null;
    totalCreditsEarned: any;
    backlogs: {
        code: any;
        name: any;
        grade: any;
    }[];
}>;
export declare function subjectAnalytics(actor: ExamActor, examSubjectId: number): Promise<{
    appeared: number;
    passed: number;
    failed: number;
    passPercentage: number;
    average: number | null;
    highest: number | null;
    lowest: number | null;
}>;
