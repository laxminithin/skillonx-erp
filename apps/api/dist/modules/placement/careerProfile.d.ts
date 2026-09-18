export declare function ensureCollegePlacementDefaults(collegeId: number): Promise<void>;
export declare function refreshProfileCompletion(studentId: number, collegeId: number): Promise<number>;
export declare function getOrCreateCareerProfile(studentId: number, collegeId: number): Promise<any>;
export declare function getStudentPlacementHome(studentId: number, collegeId: number): Promise<{
    profileCompletion: number;
    placementStatus: any;
    academicSummary: {
        usn: string;
        program: string | null;
        branch: string | null;
        cgpa: number | null;
        activeBacklogs: number;
        graduationYear: number | null;
    };
    applicationCount: number;
    offerCount: number;
    openOpportunityCount: number;
}>;
export declare function getFullCareerProfile(studentId: number, collegeId: number): Promise<{
    profile: {
        id: number;
        headline: any;
        careerObjective: any;
        preferredRoles: any;
        preferredLocations: any;
        higherStudiesInterest: boolean;
        entrepreneurshipInterest: boolean;
        placementStatus: any;
        profileCompletionPercentage: number;
        linkedinUrl: any;
        githubUrl: any;
        portfolioUrl: any;
        leetcodeUrl: any;
    };
    academic: import("./academicProfile.js").StudentPlacementAcademicProfile;
    skills: any[];
    projects: any[];
    certifications: any[];
    education: any[];
    experiences: any[];
    achievements: any[];
    resumeVersions: any[];
}>;
export declare function updateCareerProfile(studentId: number, collegeId: number, body: Record<string, unknown>): Promise<{
    profile: {
        id: number;
        headline: any;
        careerObjective: any;
        preferredRoles: any;
        preferredLocations: any;
        higherStudiesInterest: boolean;
        entrepreneurshipInterest: boolean;
        placementStatus: any;
        profileCompletionPercentage: number;
        linkedinUrl: any;
        githubUrl: any;
        portfolioUrl: any;
        leetcodeUrl: any;
    };
    academic: import("./academicProfile.js").StudentPlacementAcademicProfile;
    skills: any[];
    projects: any[];
    certifications: any[];
    education: any[];
    experiences: any[];
    achievements: any[];
    resumeVersions: any[];
}>;
export declare function registerForPlacement(studentId: number, collegeId: number, body: {
    placementSeasonId: number;
    dataConsentGiven: boolean;
    consentVersion?: string;
}): Promise<any>;
