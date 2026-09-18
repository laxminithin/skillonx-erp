import type { LeadershipContext } from '../academicLeadership/types.js';
import type { MentoringActor } from './types.js';
/** Assign (or reassign) a primary mentor. Preserves history — prior active row is closed, not deleted. */
export declare function assignMentor(actor: MentoringActor, ctx: LeadershipContext, studentId: number, mentorFacultyId: number, academicYearId?: number | null): Promise<{
    assignmentId: number;
    reassigned: boolean;
}>;
export declare function bulkAssignMentor(actor: MentoringActor, ctx: LeadershipContext, studentIds: number[], mentorFacultyId: number, academicYearId?: number | null): Promise<{
    assigned: number;
    reassigned: number;
    skipped: number;
}>;
/** Mentor workload rollup for a department (or the whole college). */
export declare function mentorWorkload(actor: MentoringActor, departmentIds: number[] | null): Promise<{
    imbalance: string;
    mentorFacultyId: number;
    mentorName: unknown;
    department: unknown;
    mentees: number;
}[]>;
/** Students in scope with no active primary mentor. */
export declare function unassignedStudents(actor: MentoringActor, departmentIds: number[] | null, limit?: number): Promise<{
    total: number;
    students: {
        studentId: number;
        name: any;
        usn: any;
        department: any;
        semester: any;
    }[];
}>;
/** Full assignment history for a student (all assignments, newest first). */
export declare function assignmentHistory(collegeId: number, studentId: number): Promise<{
    id: number;
    mentorFacultyId: number;
    mentorName: any;
    status: any;
    isPrimary: boolean;
    effectiveFrom: any;
    effectiveTo: any;
    createdAt: any;
}[]>;
