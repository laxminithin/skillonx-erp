import type { EmployeeScope } from './access.js';
import type { FacultyProfileActor } from './types.js';
export declare function profileOverview(actor: FacultyProfileActor, employee: EmployeeScope): Promise<{
    identity: {
        fullName: unknown;
        employeeNumber: unknown;
        department: {} | null;
        designation: {} | null;
        employmentType: {} | null;
        employmentStatus: unknown;
        photoReference: string;
    };
    academicSummary: {
        highestQualification: {
            recordType: string | null;
            title: string;
        } | null;
        teachingExperienceYears: number;
        industryExperienceYears: number;
        researchExperienceYears: number;
        institutionalExperienceYears: number | null;
        overallExperienceYears: number;
    };
    currentResponsibilities: {
        courses: number;
        totalCourses: number;
        mentees: number;
        classCoordination: number;
        leadershipRoles: any[];
    };
    researchSnapshot: {
        publications: number;
        patents: number;
        fundedProjects: number;
        researchGuidance: number;
    };
    professionalDevelopment: {
        fdpTraining: number;
        certifications: number;
        memberships: number;
    };
    evidence: {
        complete: number;
        missing: number;
        pendingVerification: number;
        returned: number;
    };
    completenessPercent: number;
    recentActivity: {
        id: number;
        domain: unknown;
        title: unknown;
        verificationStatus: unknown;
        updatedAt: unknown;
    }[];
}>;
