export declare function buildResumeSnapshot(studentId: number, collegeId: number, resumeVersionId?: number): Promise<{
    capturedAt: string;
    resumeVersionId: number | null;
    headline: any;
    careerObjective: any;
    academic: import("./academicProfile.js").StudentPlacementAcademicProfile;
    skills: any[];
    projects: any[];
    certifications: any[];
    education: any[];
    experiences: any[];
}>;
export declare function getResumePreview(studentId: number, collegeId: number, resumeVersionId?: number): Promise<{
    personal: {
        name: any;
        usn: any;
        email: any;
        phone: any;
    };
    sections: {
        capturedAt: string;
        resumeVersionId: number | null;
        headline: any;
        careerObjective: any;
        academic: import("./academicProfile.js").StudentPlacementAcademicProfile;
        skills: any[];
        projects: any[];
        certifications: any[];
        education: any[];
        experiences: any[];
    };
}>;
export declare function createResumeVersion(studentId: number, collegeId: number, body: Record<string, unknown>): Promise<any>;
export declare function addStudentSkill(studentId: number, collegeId: number, body: Record<string, unknown>): Promise<any>;
export declare function addStudentProject(studentId: number, collegeId: number, body: Record<string, unknown>): Promise<any>;
export declare function upsertPriorEducation(studentId: number, collegeId: number, body: Record<string, unknown>): Promise<any>;
