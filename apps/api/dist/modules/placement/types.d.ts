import { z } from 'zod';
export type PlacementPermission = 'placement.view' | 'placement.student.manage' | 'placement.company.manage' | 'placement.opportunity.manage' | 'placement.eligibility.override' | 'placement.application.manage' | 'placement.drive.manage' | 'placement.offer.manage' | 'placement.training.manage' | 'placement.report.view' | 'placement.config.manage' | 'placement.coordinator.view' | 'placement.trainer.view' | 'placement.management.view';
export type PlacementActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string;
    employeeId?: number | null;
    tpRoles?: string[];
    tpDepartmentIds?: number[];
    extraPermissions?: PlacementPermission[];
};
export type StudentActor = {
    studentId: number;
    collegeId: number;
    usn?: string;
    name?: string;
};
export type RecruiterActor = {
    recruiterAccountId: number;
    collegeId: number;
    companyId: number;
    email: string;
    name: string;
};
export declare const PLACEMENT_STATUSES: readonly ["NOT_REGISTERED", "REGISTERED", "ACTIVE", "PLACED", "MULTIPLE_OFFERS", "HIGHER_STUDIES", "ENTREPRENEURSHIP", "OPTED_OUT", "ALUMNI"];
export declare const ELIGIBILITY_REASONS: readonly ["CGPA_BELOW_MINIMUM", "ACTIVE_BACKLOG", "HISTORICAL_BACKLOG", "PROGRAM_NOT_ELIGIBLE", "GRADUATION_YEAR_MISMATCH", "TENTH_PERCENTAGE_BELOW_MINIMUM", "TWELFTH_PERCENTAGE_BELOW_MINIMUM", "REQUIRED_SKILL_MISSING", "REGISTRATION_REQUIRED", "PROFILE_INCOMPLETE"];
export declare const careerProfileSchema: z.ZodObject<{
    headline: z.ZodOptional<z.ZodString>;
    careerObjective: z.ZodOptional<z.ZodString>;
    preferredRoles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    preferredLocations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    higherStudiesInterest: z.ZodOptional<z.ZodBoolean>;
    entrepreneurshipInterest: z.ZodOptional<z.ZodBoolean>;
    linkedinUrl: z.ZodOptional<z.ZodString>;
    githubUrl: z.ZodOptional<z.ZodString>;
    portfolioUrl: z.ZodOptional<z.ZodString>;
    leetcodeUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    headline?: string | undefined;
    careerObjective?: string | undefined;
    preferredRoles?: string[] | undefined;
    preferredLocations?: string[] | undefined;
    higherStudiesInterest?: boolean | undefined;
    entrepreneurshipInterest?: boolean | undefined;
    linkedinUrl?: string | undefined;
    githubUrl?: string | undefined;
    portfolioUrl?: string | undefined;
    leetcodeUrl?: string | undefined;
}, {
    headline?: string | undefined;
    careerObjective?: string | undefined;
    preferredRoles?: string[] | undefined;
    preferredLocations?: string[] | undefined;
    higherStudiesInterest?: boolean | undefined;
    entrepreneurshipInterest?: boolean | undefined;
    linkedinUrl?: string | undefined;
    githubUrl?: string | undefined;
    portfolioUrl?: string | undefined;
    leetcodeUrl?: string | undefined;
}>;
export declare const priorEducationSchema: z.ZodObject<{
    qualificationType: z.ZodEnum<["SSLC_10TH", "PUC_12TH", "DIPLOMA", "UG_PREVIOUS", "OTHER"]>;
    institution: z.ZodOptional<z.ZodString>;
    boardUniversity: z.ZodOptional<z.ZodString>;
    yearOfCompletion: z.ZodOptional<z.ZodNumber>;
    percentage: z.ZodOptional<z.ZodNumber>;
    cgpa: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    qualificationType: "OTHER" | "SSLC_10TH" | "PUC_12TH" | "DIPLOMA" | "UG_PREVIOUS";
    institution?: string | undefined;
    boardUniversity?: string | undefined;
    yearOfCompletion?: number | undefined;
    percentage?: number | undefined;
    cgpa?: number | undefined;
}, {
    qualificationType: "OTHER" | "SSLC_10TH" | "PUC_12TH" | "DIPLOMA" | "UG_PREVIOUS";
    institution?: string | undefined;
    boardUniversity?: string | undefined;
    yearOfCompletion?: number | undefined;
    percentage?: number | undefined;
    cgpa?: number | undefined;
}>;
export declare const studentSkillSchema: z.ZodObject<{
    skillId: z.ZodOptional<z.ZodNumber>;
    skillName: z.ZodString;
    level: z.ZodOptional<z.ZodEnum<["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]>>;
}, "strip", z.ZodTypeAny, {
    skillName: string;
    skillId?: number | undefined;
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | undefined;
}, {
    skillName: string;
    skillId?: number | undefined;
    level?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT" | undefined;
}>;
export declare const projectSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    projectType: z.ZodOptional<z.ZodEnum<["ACADEMIC", "MINI_PROJECT", "MAJOR_PROJECT", "HACKATHON", "PERSONAL", "INTERNSHIP", "OTHER"]>>;
    technologies: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    teamType: z.ZodOptional<z.ZodEnum<["INDIVIDUAL", "TEAM"]>>;
    role: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    repositoryUrl: z.ZodOptional<z.ZodString>;
    demoUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    title: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
    description?: string | undefined;
    role?: string | undefined;
    projectType?: "OTHER" | "ACADEMIC" | "MINI_PROJECT" | "MAJOR_PROJECT" | "HACKATHON" | "PERSONAL" | "INTERNSHIP" | undefined;
    technologies?: string[] | undefined;
    teamType?: "INDIVIDUAL" | "TEAM" | undefined;
    repositoryUrl?: string | undefined;
    demoUrl?: string | undefined;
}, {
    title: string;
    startDate?: string | undefined;
    endDate?: string | undefined;
    description?: string | undefined;
    role?: string | undefined;
    projectType?: "OTHER" | "ACADEMIC" | "MINI_PROJECT" | "MAJOR_PROJECT" | "HACKATHON" | "PERSONAL" | "INTERNSHIP" | undefined;
    technologies?: string[] | undefined;
    teamType?: "INDIVIDUAL" | "TEAM" | undefined;
    repositoryUrl?: string | undefined;
    demoUrl?: string | undefined;
}>;
export declare const certificationSchema: z.ZodObject<{
    provider: z.ZodOptional<z.ZodString>;
    certificateName: z.ZodString;
    issueDate: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodOptional<z.ZodString>;
    credentialId: z.ZodOptional<z.ZodString>;
    credentialUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    certificateName: string;
    provider?: string | undefined;
    issueDate?: string | undefined;
    expiryDate?: string | undefined;
    credentialId?: string | undefined;
    credentialUrl?: string | undefined;
}, {
    certificateName: string;
    provider?: string | undefined;
    issueDate?: string | undefined;
    expiryDate?: string | undefined;
    credentialId?: string | undefined;
    credentialUrl?: string | undefined;
}>;
export declare const resumeVersionSchema: z.ZodObject<{
    name: z.ZodString;
    template: z.ZodOptional<z.ZodString>;
    careerObjective: z.ZodOptional<z.ZodString>;
    selectedProjects: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    selectedSkills: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    selectedCertifications: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    careerObjective?: string | undefined;
    template?: string | undefined;
    selectedProjects?: number[] | undefined;
    selectedSkills?: number[] | undefined;
    selectedCertifications?: number[] | undefined;
    isDefault?: boolean | undefined;
}, {
    name: string;
    careerObjective?: string | undefined;
    template?: string | undefined;
    selectedProjects?: number[] | undefined;
    selectedSkills?: number[] | undefined;
    selectedCertifications?: number[] | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const registrationSchema: z.ZodObject<{
    placementSeasonId: z.ZodNumber;
    dataConsentGiven: z.ZodBoolean;
    consentVersion: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    placementSeasonId: number;
    dataConsentGiven: boolean;
    consentVersion?: string | undefined;
}, {
    placementSeasonId: number;
    dataConsentGiven: boolean;
    consentVersion?: string | undefined;
}>;
export declare const companySchema: z.ZodObject<{
    name: z.ZodString;
    legalName: z.ZodOptional<z.ZodString>;
    industry: z.ZodOptional<z.ZodString>;
    website: z.ZodOptional<z.ZodString>;
    companyType: z.ZodOptional<z.ZodEnum<["PRODUCT", "SERVICE", "STARTUP", "CORE", "CONSULTING", "GOVERNMENT", "OTHER"]>>;
    description: z.ZodOptional<z.ZodString>;
    headquarters: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description?: string | undefined;
    legalName?: string | undefined;
    industry?: string | undefined;
    website?: string | undefined;
    companyType?: "OTHER" | "PRODUCT" | "SERVICE" | "STARTUP" | "CORE" | "CONSULTING" | "GOVERNMENT" | undefined;
    headquarters?: string | undefined;
}, {
    name: string;
    description?: string | undefined;
    legalName?: string | undefined;
    industry?: string | undefined;
    website?: string | undefined;
    companyType?: "OTHER" | "PRODUCT" | "SERVICE" | "STARTUP" | "CORE" | "CONSULTING" | "GOVERNMENT" | undefined;
    headquarters?: string | undefined;
}>;
export declare const opportunitySchema: z.ZodObject<{
    companyId: z.ZodNumber;
    placementSeasonId: z.ZodOptional<z.ZodNumber>;
    opportunityType: z.ZodOptional<z.ZodEnum<["PLACEMENT", "INTERNSHIP", "APPRENTICESHIP", "PPO", "OFF_CAMPUS", "POOL_CAMPUS", "HIGHER_STUDIES_EVENT", "OTHER"]>>;
    title: z.ZodString;
    role: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    workMode: z.ZodOptional<z.ZodString>;
    employmentType: z.ZodOptional<z.ZodString>;
    ctcMin: z.ZodOptional<z.ZodNumber>;
    ctcMax: z.ZodOptional<z.ZodNumber>;
    stipend: z.ZodOptional<z.ZodNumber>;
    currency: z.ZodOptional<z.ZodString>;
    openDate: z.ZodOptional<z.ZodString>;
    deadline: z.ZodOptional<z.ZodString>;
    driveDate: z.ZodOptional<z.ZodString>;
    locations: z.ZodOptional<z.ZodArray<z.ZodObject<{
        city: z.ZodString;
        state: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        city: string;
        state?: string | undefined;
    }, {
        city: string;
        state?: string | undefined;
    }>, "many">>;
    eligibilityRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        ruleType: z.ZodString;
        operator: z.ZodOptional<z.ZodString>;
        value: z.ZodString;
        isMandatory: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        value: string;
        ruleType: string;
        operator?: string | undefined;
        isMandatory?: boolean | undefined;
    }, {
        value: string;
        ruleType: string;
        operator?: string | undefined;
        isMandatory?: boolean | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    title: string;
    companyId: number;
    description?: string | undefined;
    role?: string | undefined;
    placementSeasonId?: number | undefined;
    opportunityType?: "OTHER" | "INTERNSHIP" | "PLACEMENT" | "APPRENTICESHIP" | "PPO" | "OFF_CAMPUS" | "POOL_CAMPUS" | "HIGHER_STUDIES_EVENT" | undefined;
    workMode?: string | undefined;
    employmentType?: string | undefined;
    ctcMin?: number | undefined;
    ctcMax?: number | undefined;
    stipend?: number | undefined;
    currency?: string | undefined;
    openDate?: string | undefined;
    deadline?: string | undefined;
    driveDate?: string | undefined;
    locations?: {
        city: string;
        state?: string | undefined;
    }[] | undefined;
    eligibilityRules?: {
        value: string;
        ruleType: string;
        operator?: string | undefined;
        isMandatory?: boolean | undefined;
    }[] | undefined;
}, {
    title: string;
    companyId: number;
    description?: string | undefined;
    role?: string | undefined;
    placementSeasonId?: number | undefined;
    opportunityType?: "OTHER" | "INTERNSHIP" | "PLACEMENT" | "APPRENTICESHIP" | "PPO" | "OFF_CAMPUS" | "POOL_CAMPUS" | "HIGHER_STUDIES_EVENT" | undefined;
    workMode?: string | undefined;
    employmentType?: string | undefined;
    ctcMin?: number | undefined;
    ctcMax?: number | undefined;
    stipend?: number | undefined;
    currency?: string | undefined;
    openDate?: string | undefined;
    deadline?: string | undefined;
    driveDate?: string | undefined;
    locations?: {
        city: string;
        state?: string | undefined;
    }[] | undefined;
    eligibilityRules?: {
        value: string;
        ruleType: string;
        operator?: string | undefined;
        isMandatory?: boolean | undefined;
    }[] | undefined;
}>;
export declare const applySchema: z.ZodObject<{
    resumeVersionId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    resumeVersionId?: number | undefined;
}, {
    resumeVersionId?: number | undefined;
}>;
export declare const offerSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    opportunityId: z.ZodNumber;
    applicationId: z.ZodOptional<z.ZodNumber>;
    role: z.ZodOptional<z.ZodString>;
    ctc: z.ZodOptional<z.ZodNumber>;
    joiningLocation: z.ZodOptional<z.ZodString>;
    joiningDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    studentId: number;
    opportunityId: number;
    role?: string | undefined;
    applicationId?: number | undefined;
    ctc?: number | undefined;
    joiningLocation?: string | undefined;
    joiningDate?: string | undefined;
}, {
    studentId: number;
    opportunityId: number;
    role?: string | undefined;
    applicationId?: number | undefined;
    ctc?: number | undefined;
    joiningLocation?: string | undefined;
    joiningDate?: string | undefined;
}>;
export declare const trainingProgramSchema: z.ZodObject<{
    title: z.ZodString;
    provider: z.ZodOptional<z.ZodString>;
    category: z.ZodOptional<z.ZodEnum<["APTITUDE", "TECHNICAL", "CODING", "SOFT_SKILL", "COMMUNICATION", "INTERVIEW", "DOMAIN", "COMPANY_SPECIFIC"]>>;
    description: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
    hours: z.ZodOptional<z.ZodNumber>;
    mode: z.ZodOptional<z.ZodEnum<["ONLINE", "OFFLINE", "HYBRID"]>>;
    capacity: z.ZodOptional<z.ZodNumber>;
    opportunityId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    title: string;
    hours?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    description?: string | undefined;
    provider?: string | undefined;
    opportunityId?: number | undefined;
    category?: "APTITUDE" | "TECHNICAL" | "CODING" | "SOFT_SKILL" | "COMMUNICATION" | "INTERVIEW" | "DOMAIN" | "COMPANY_SPECIFIC" | undefined;
    mode?: "ONLINE" | "OFFLINE" | "HYBRID" | undefined;
    capacity?: number | undefined;
}, {
    title: string;
    hours?: number | undefined;
    startDate?: string | undefined;
    endDate?: string | undefined;
    description?: string | undefined;
    provider?: string | undefined;
    opportunityId?: number | undefined;
    category?: "APTITUDE" | "TECHNICAL" | "CODING" | "SOFT_SKILL" | "COMMUNICATION" | "INTERVIEW" | "DOMAIN" | "COMPANY_SPECIFIC" | undefined;
    mode?: "ONLINE" | "OFFLINE" | "HYBRID" | undefined;
    capacity?: number | undefined;
}>;
export type EligibilityResult = {
    status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'ELIGIBLE_WITH_OVERRIDE';
    reasons: Array<{
        code: string;
        message: string;
        passed: boolean;
    }>;
};
