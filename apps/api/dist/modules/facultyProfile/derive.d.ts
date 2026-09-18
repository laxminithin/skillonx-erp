import type { EmployeeScope } from './access.js';
import type { FacultyProfileActor } from './types.js';
/**
 * Derived (read-only) academic contributions. These are PROJECTED from the
 * authoritative modules (academic classes/LMS, mentoring, coordinator,
 * academic leadership, student projects) and never duplicated as writable
 * faculty records (spec §B6/§B16/§B18 "derive where an authoritative
 * assignment already exists"). Keyed on the faculty_users id, which is stable
 * across HRMS designation/department changes so history is preserved.
 */
export declare function derivedTeaching(actor: FacultyProfileActor, employee: EmployeeScope): Promise<{
    id: number;
    academicYear: any;
    isCurrent: boolean;
    semester: any;
    section: any;
    program: any;
    courseCode: any;
    courseName: any;
    courseType: any;
    credits: number | null;
    isPrimary: boolean;
    status: any;
    source: string;
}[]>;
export declare function derivedMentoring(actor: FacultyProfileActor, employee: EmployeeScope): Promise<{
    academicYear: string | null;
    isCurrent: boolean;
    active: number;
    total: number;
}[]>;
export declare function derivedCoordination(actor: FacultyProfileActor, employee: EmployeeScope): Promise<{
    id: number;
    className: any;
    academicYear: any;
    isCurrent: boolean;
    semester: any;
    section: any;
    program: any;
    status: any;
    role: string;
    source: string;
}[]>;
export declare function derivedLeadership(actor: FacultyProfileActor, employee: EmployeeScope): Promise<{
    id: number;
    role: any;
    department: any;
    effectiveFrom: any;
    effectiveTo: any;
    status: any;
    isCurrent: boolean;
    source: string;
}[]>;
/** Student projects the faculty mentors (spec §B16 — project, don't duplicate). */
export declare function derivedStudentProjects(actor: FacultyProfileActor, employee: EmployeeScope): Promise<{
    id: number;
    title: any;
    projectType: any;
    teamType: any;
    startDate: any;
    endDate: any;
    student: any;
    usn: any;
    source: string;
}[]>;
export declare function allDerived(actor: FacultyProfileActor, employee: EmployeeScope): Promise<{
    teaching: {
        id: number;
        academicYear: any;
        isCurrent: boolean;
        semester: any;
        section: any;
        program: any;
        courseCode: any;
        courseName: any;
        courseType: any;
        credits: number | null;
        isPrimary: boolean;
        status: any;
        source: string;
    }[];
    mentoring: {
        academicYear: string | null;
        isCurrent: boolean;
        active: number;
        total: number;
    }[];
    coordination: {
        id: number;
        className: any;
        academicYear: any;
        isCurrent: boolean;
        semester: any;
        section: any;
        program: any;
        status: any;
        role: string;
        source: string;
    }[];
    leadership: {
        id: number;
        role: any;
        department: any;
        effectiveFrom: any;
        effectiveTo: any;
        status: any;
        isCurrent: boolean;
        source: string;
    }[];
    studentProjects: {
        id: number;
        title: any;
        projectType: any;
        teamType: any;
        startDate: any;
        endDate: any;
        student: any;
        usn: any;
        source: string;
    }[];
}>;
