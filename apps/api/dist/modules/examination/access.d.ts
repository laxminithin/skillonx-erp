import type { ExamPermission } from './types.js';
export type ExamActor = {
    facultyUserId: number;
    collegeId: number;
    role: string;
    departmentId?: number | null;
};
export declare function examPermissionsForRole(role: string): ExamPermission[];
export declare function hasExamPermission(actor: ExamActor, permission: ExamPermission): boolean;
export declare function assertExamPermission(actor: ExamActor, permission: ExamPermission): void;
export declare function canManageExams(actor: ExamActor): boolean;
export declare function canVerifyMarks(actor: ExamActor): boolean;
export declare function canPublishResults(actor: ExamActor): boolean;
export declare function assertExamCollege(examId: number, collegeId: number): Promise<any>;
export declare function assertExamSubjectCollege(examSubjectId: number, collegeId: number): Promise<any>;
export declare function assertFacultySubjectAccess(actor: ExamActor, examSubjectId: number): Promise<void>;
export declare function assertStudentOwnsResult(studentId: number, semesterResultId: number, collegeId: number): Promise<any>;
