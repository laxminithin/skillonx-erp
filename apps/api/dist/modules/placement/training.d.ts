import type { PlacementActor } from './types.js';
export declare function listTrainingPrograms(actor: PlacementActor): Promise<any[]>;
export declare function createTrainingProgram(actor: PlacementActor, body: Record<string, unknown>): Promise<any>;
export declare function enrollStudents(actor: PlacementActor, programId: number, studentIds: number[]): Promise<{
    enrolled: number;
}>;
export declare function registerStudentForTraining(studentId: number, collegeId: number, programId: number): Promise<any>;
export declare function listOpenTrainingPrograms(collegeId: number): Promise<any[]>;
export declare function listStudentTraining(studentId: number, collegeId: number): Promise<{
    id: number;
    programId: number;
    title: any;
    category: any;
    status: any;
    completionStatus: any;
    startDate: any;
    endDate: any;
    mode: any;
}[]>;
export declare function createTrainingSession(actor: PlacementActor, programId: number, body: Record<string, unknown>): Promise<any>;
export declare function markTrainingAttendance(actor: PlacementActor, sessionId: number, records: Array<{
    studentId: number;
    status: string;
}>): Promise<{
    updated: number;
}>;
export declare function recordTrainingAssessment(actor: PlacementActor, programId: number, body: {
    studentId: number;
    assessmentType: string;
    score?: number;
    maxScore?: number;
    feedback?: string;
}): Promise<any>;
export declare function getTrainerDashboard(actor: PlacementActor): Promise<{
    programs: {
        id: number;
        title: any;
        category: any;
    }[];
    enrollments: number;
    sessions: number;
}>;
