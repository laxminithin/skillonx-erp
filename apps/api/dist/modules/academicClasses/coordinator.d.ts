import type { ClassActor } from './access.js';
/**
 * Class Coordinator workspace (spec §3).
 *
 * Reads authoritative sources only — the coordinator assignment comes from
 * `academic_classes.coordinator_id` / `academic_class_coordinators` (never
 * hardcoded), and the cohort analytics reuse the mentoring risk engine so the
 * attendance / CIE / backlog thresholds match everywhere. Scope is enforced:
 * a lecturer sees a class workspace only when they are that class's coordinator
 * (admins/HOD-of-department are allowed for oversight).
 */
type Row = Record<string, unknown>;
/** Classes for which the acting faculty is the coordinator. */
export declare function coordinatorClasses(actor: ClassActor): Promise<{
    id: number;
    code: any;
    name: any;
    departmentId: number | null;
    departmentName: any;
}[]>;
/**
 * Coordinator info for any class context (spec §3 banner). Returns the
 * authoritative coordinator identity + policy-permitted contact. Any faculty who
 * can see the class context may read the banner.
 */
export declare function classCoordinatorInfo(actor: ClassActor, classId: number): Promise<{
    classId: number;
    coordinator: {
        facultyId: number;
        name: any;
        department: any;
        email: any;
        phone: any;
    } | null;
    isCoordinator: boolean;
}>;
/** Full coordinator workspace for a class the actor coordinates. */
export declare function coordinatorWorkspace(actor: ClassActor, classId: number): Promise<{
    class: {
        id: number;
        code: unknown;
        name: unknown;
    };
    strength: number;
    attendance: {
        averagePct: number | null;
        belowThreshold: Row[];
    };
    academicExceptions: Row[];
    backlogs: {
        studentsWithBacklogs: number;
        totalBacklogs: number;
    };
    mentorAllocation: {
        assigned: number;
        unassigned: number;
        studentsWithoutMentor: {
            name?: unknown;
            usn?: unknown;
            studentId: number;
        }[];
    };
    pendingRequests: number;
    alerts: {
        id: number;
        studentId: number;
        type: unknown;
        severity: unknown;
        title: unknown;
    }[];
    completion: {
        assignments: number | null;
        quizzes: number | null;
        cieSheets: number;
    };
    issues: {
        escalations: number;
        grievances: number;
    };
}>;
export {};
