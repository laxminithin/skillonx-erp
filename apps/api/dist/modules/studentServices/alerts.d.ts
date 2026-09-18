import type { ServicesActor } from './types.js';
export declare function generateAcademicAlerts(collegeId: number, studentId?: number): Promise<{
    collegeId: number;
    studentId: number;
    alertType: string;
    severity: string;
    title: string;
    message: string;
    relatedType?: string;
    relatedId?: number;
    dedupeKey: string;
    visibleToStudent?: boolean;
    visibleToMentor?: boolean;
    id: number;
}[]>;
export declare function listStudentAlerts(studentId: number, collegeId: number): Promise<{
    id: number;
    alertType: any;
    severity: any;
    title: any;
    message: any;
    createdAt: any;
}[]>;
export declare function listMenteeAlerts(actor: ServicesActor, studentId: number): Promise<{
    id: number;
    alertType: any;
    severity: any;
    title: any;
    message: any;
    createdAt: any;
}[]>;
