import { z } from 'zod';
export type AlumniActor = {
    alumniProfileId: number;
    studentId: number;
    collegeId: number;
    role: 'ALUMNI';
    email: string;
    name: string;
};
export type AlumniAdminActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name: string;
};
export declare const alumniLoginSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const alumniClaimSchema: z.ZodObject<{
    usn: z.ZodEffects<z.ZodString, string, string>;
    email: z.ZodEffects<z.ZodString, string, string>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    graduationYear: z.ZodNumber;
    password: z.ZodEffects<z.ZodString, string, string>;
    currentCity: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
    usn: string;
    graduationYear: number;
    phone?: string | null | undefined;
    currentCity?: string | null | undefined;
}, {
    email: string;
    password: string;
    usn: string;
    graduationYear: number;
    phone?: string | null | undefined;
    currentCity?: string | null | undefined;
}>;
export declare const alumniForgotSchema: z.ZodObject<{
    email: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const alumniProfileUpdateSchema: z.ZodObject<{
    headline: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    biography: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    profilePhotoUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currentCity: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    currentCountry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    skills: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    interests: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    linkedinUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    websiteUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    networkingAvailable: z.ZodOptional<z.ZodBoolean>;
    mentorshipAvailable: z.ZodOptional<z.ZodBoolean>;
    mentorshipAreas: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    emailVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    phoneVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    bioVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    employmentVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    socialVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
    networkingVisibility: z.ZodOptional<z.ZodEnum<["PRIVATE", "INSTITUTION_ONLY", "ALUMNI_NETWORK", "PUBLIC"]>>;
}, "strict", z.ZodTypeAny, {
    headline?: string | null | undefined;
    linkedinUrl?: string | null | undefined;
    skills?: string[] | undefined;
    currentCity?: string | null | undefined;
    biography?: string | null | undefined;
    profilePhotoUrl?: string | null | undefined;
    currentCountry?: string | null | undefined;
    interests?: string[] | undefined;
    websiteUrl?: string | null | undefined;
    networkingAvailable?: boolean | undefined;
    mentorshipAvailable?: boolean | undefined;
    mentorshipAreas?: string[] | undefined;
    emailVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    phoneVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    bioVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    employmentVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    socialVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    networkingVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
}, {
    headline?: string | null | undefined;
    linkedinUrl?: string | null | undefined;
    skills?: string[] | undefined;
    currentCity?: string | null | undefined;
    biography?: string | null | undefined;
    profilePhotoUrl?: string | null | undefined;
    currentCountry?: string | null | undefined;
    interests?: string[] | undefined;
    websiteUrl?: string | null | undefined;
    networkingAvailable?: boolean | undefined;
    mentorshipAvailable?: boolean | undefined;
    mentorshipAreas?: string[] | undefined;
    emailVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    phoneVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    bioVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    employmentVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    socialVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
    networkingVisibility?: "PUBLIC" | "PRIVATE" | "INSTITUTION_ONLY" | "ALUMNI_NETWORK" | undefined;
}>;
export declare const employmentSchema: z.ZodObject<{
    organization: z.ZodString;
    designation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    industry: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    endDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isCurrent: z.ZodOptional<z.ZodBoolean>;
    employmentType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    organization: string;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    industry?: string | null | undefined;
    employmentType?: string | null | undefined;
    designation?: string | null | undefined;
    isCurrent?: boolean | undefined;
    location?: string | null | undefined;
}, {
    organization: string;
    startDate?: string | null | undefined;
    endDate?: string | null | undefined;
    description?: string | null | undefined;
    industry?: string | null | undefined;
    employmentType?: string | null | undefined;
    designation?: string | null | undefined;
    isCurrent?: boolean | undefined;
    location?: string | null | undefined;
}>;
export declare const higherStudySchema: z.ZodObject<{
    institution: z.ZodString;
    programName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    specialization: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    country: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    completionYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["CURRENT", "COMPLETED", "DEFERRED"]>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    institution: string;
    status?: "COMPLETED" | "CURRENT" | "DEFERRED" | undefined;
    description?: string | null | undefined;
    startYear?: number | null | undefined;
    programName?: string | null | undefined;
    location?: string | null | undefined;
    specialization?: string | null | undefined;
    country?: string | null | undefined;
    completionYear?: number | null | undefined;
}, {
    institution: string;
    status?: "COMPLETED" | "CURRENT" | "DEFERRED" | undefined;
    description?: string | null | undefined;
    startYear?: number | null | undefined;
    programName?: string | null | undefined;
    location?: string | null | undefined;
    specialization?: string | null | undefined;
    country?: string | null | undefined;
    completionYear?: number | null | undefined;
}>;
export declare const entrepreneurshipSchema: z.ZodObject<{
    organization: z.ZodString;
    role: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sector: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    websiteUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    yearFounded: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    organization: string;
    description?: string | null | undefined;
    role?: string | null | undefined;
    location?: string | null | undefined;
    websiteUrl?: string | null | undefined;
    sector?: string | null | undefined;
    yearFounded?: number | null | undefined;
}, {
    organization: string;
    description?: string | null | undefined;
    role?: string | null | undefined;
    location?: string | null | undefined;
    websiteUrl?: string | null | undefined;
    sector?: string | null | undefined;
    yearFounded?: number | null | undefined;
}>;
export declare const achievementSchema: z.ZodObject<{
    achievementType: z.ZodString;
    title: z.ZodString;
    issuer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    achievementDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    achievementType: string;
    description?: string | null | undefined;
    issuer?: string | null | undefined;
    achievementDate?: string | null | undefined;
}, {
    title: string;
    achievementType: string;
    description?: string | null | undefined;
    issuer?: string | null | undefined;
    achievementDate?: string | null | undefined;
}>;
export declare const transitionSchema: z.ZodObject<{
    studentId: z.ZodNumber;
    graduationYear: z.ZodNumber;
    batchLabel: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    admissionYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    email: z.ZodOptional<z.ZodString>;
    initialPassword: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    verifyNow: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    studentId: number;
    graduationYear: number;
    email?: string | undefined;
    batchLabel?: string | null | undefined;
    admissionYear?: number | null | undefined;
    initialPassword?: string | undefined;
    verifyNow?: boolean | undefined;
}, {
    studentId: number;
    graduationYear: number;
    email?: string | undefined;
    batchLabel?: string | null | undefined;
    admissionYear?: number | null | undefined;
    initialPassword?: string | undefined;
    verifyNow?: boolean | undefined;
}>;
export declare const verificationSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
export declare const eventSchema: z.ZodObject<{
    title: z.ZodString;
    eventType: z.ZodOptional<z.ZodString>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    startsAt: z.ZodString;
    endsAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    venue: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    visibility: z.ZodOptional<z.ZodEnum<["ALUMNI_NETWORK", "PUBLIC", "PRIVATE"]>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED", "CLOSED", "CANCELLED"]>>;
    capacity: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    registrationOpensAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    registrationClosesAt: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    startsAt: string;
    status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" | undefined;
    description?: string | null | undefined;
    capacity?: number | null | undefined;
    eventType?: string | undefined;
    visibility?: "PUBLIC" | "PRIVATE" | "ALUMNI_NETWORK" | undefined;
    venue?: string | null | undefined;
    registrationOpensAt?: string | null | undefined;
    registrationClosesAt?: string | null | undefined;
    endsAt?: string | null | undefined;
}, {
    title: string;
    startsAt: string;
    status?: "DRAFT" | "PUBLISHED" | "CLOSED" | "CANCELLED" | undefined;
    description?: string | null | undefined;
    capacity?: number | null | undefined;
    eventType?: string | undefined;
    visibility?: "PUBLIC" | "PRIVATE" | "ALUMNI_NETWORK" | undefined;
    venue?: string | null | undefined;
    registrationOpensAt?: string | null | undefined;
    registrationClosesAt?: string | null | undefined;
    endsAt?: string | null | undefined;
}>;
export declare const opportunitySchema: z.ZodObject<{
    title: z.ZodString;
    opportunityType: z.ZodEnum<["JOB", "INTERNSHIP", "REFERRAL", "MENTORSHIP", "PROJECT", "COLLABORATION"]>;
    organization: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    location: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    applicationUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    deadline: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    opportunityType: "INTERNSHIP" | "PROJECT" | "REFERRAL" | "JOB" | "MENTORSHIP" | "COLLABORATION";
    description?: string | null | undefined;
    deadline?: string | null | undefined;
    organization?: string | null | undefined;
    location?: string | null | undefined;
    applicationUrl?: string | null | undefined;
}, {
    title: string;
    opportunityType: "INTERNSHIP" | "PROJECT" | "REFERRAL" | "JOB" | "MENTORSHIP" | "COLLABORATION";
    description?: string | null | undefined;
    deadline?: string | null | undefined;
    organization?: string | null | undefined;
    location?: string | null | undefined;
    applicationUrl?: string | null | undefined;
}>;
export declare const contributionSchema: z.ZodObject<{
    purpose: z.ZodEnum<["SCHOLARSHIP", "DEPARTMENT_DEVELOPMENT", "LAB_SUPPORT", "STUDENT_SUPPORT", "EVENT_SPONSORSHIP", "GENERAL"]>;
    amount: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    idempotencyKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    note: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    purpose: "GENERAL" | "SCHOLARSHIP" | "DEPARTMENT_DEVELOPMENT" | "LAB_SUPPORT" | "STUDENT_SUPPORT" | "EVENT_SPONSORSHIP";
    note?: string | null | undefined;
    amount?: number | null | undefined;
    idempotencyKey?: string | null | undefined;
}, {
    purpose: "GENERAL" | "SCHOLARSHIP" | "DEPARTMENT_DEVELOPMENT" | "LAB_SUPPORT" | "STUDENT_SUPPORT" | "EVENT_SPONSORSHIP";
    note?: string | null | undefined;
    amount?: number | null | undefined;
    idempotencyKey?: string | null | undefined;
}>;
export declare const noticeSchema: z.ZodObject<{
    title: z.ZodString;
    body: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    audienceScope: z.ZodOptional<z.ZodEnum<["ALL_ALUMNI", "DEPARTMENT", "PROGRAM", "GRADUATION_YEAR"]>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    graduationYear: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PUBLISHED"]>>;
}, "strict", z.ZodTypeAny, {
    title: string;
    status?: "DRAFT" | "PUBLISHED" | undefined;
    departmentId?: number | null | undefined;
    programId?: number | null | undefined;
    body?: string | null | undefined;
    graduationYear?: number | null | undefined;
    audienceScope?: "PROGRAM" | "GRADUATION_YEAR" | "DEPARTMENT" | "ALL_ALUMNI" | undefined;
}, {
    title: string;
    status?: "DRAFT" | "PUBLISHED" | undefined;
    departmentId?: number | null | undefined;
    programId?: number | null | undefined;
    body?: string | null | undefined;
    graduationYear?: number | null | undefined;
    audienceScope?: "PROGRAM" | "GRADUATION_YEAR" | "DEPARTMENT" | "ALL_ALUMNI" | undefined;
}>;
export declare function alumniMe(profileId: number): Promise<{
    id: number;
    studentId: number;
    collegeId: number;
    collegeName: any;
    collegeCode: any;
    role: string;
    kind: string;
    roleLabel: string;
    name: any;
    email: any;
    phone: any;
    usn: any;
    departmentId: number | null;
    departmentName: any;
    departmentCode: any;
    programId: number | null;
    programName: any;
    programCode: any;
    batchLabel: any;
    admissionYear: any;
    graduationYear: number;
    lifecycleState: any;
    verificationState: any;
    isActive: boolean;
    headline: any;
    biography: any;
    profilePhotoUrl: any;
    currentCity: any;
    currentCountry: any;
    skills: string[];
    interests: string[];
    linkedinUrl: any;
    websiteUrl: any;
    networkingAvailable: boolean;
    mentorshipAvailable: boolean;
    mentorshipAreas: string[];
    privacy: {
        email: any;
        phone: any;
        biography: any;
        employment: any;
        social: any;
        networking: any;
    } | undefined;
}>;
export declare function loginAlumni(email: string, password: string): Promise<{
    token: string;
    user: {
        id: number;
        studentId: number;
        collegeId: number;
        collegeName: any;
        collegeCode: any;
        role: string;
        kind: string;
        roleLabel: string;
        name: any;
        email: any;
        phone: any;
        usn: any;
        departmentId: number | null;
        departmentName: any;
        departmentCode: any;
        programId: number | null;
        programName: any;
        programCode: any;
        batchLabel: any;
        admissionYear: any;
        graduationYear: number;
        lifecycleState: any;
        verificationState: any;
        isActive: boolean;
        headline: any;
        biography: any;
        profilePhotoUrl: any;
        currentCity: any;
        currentCountry: any;
        skills: string[];
        interests: string[];
        linkedinUrl: any;
        websiteUrl: any;
        networkingAvailable: boolean;
        mentorshipAvailable: boolean;
        mentorshipAreas: string[];
        privacy: {
            email: any;
            phone: any;
            biography: any;
            employment: any;
            social: any;
            networking: any;
        } | undefined;
    };
}>;
export declare function claimAlumni(input: z.infer<typeof alumniClaimSchema>): Promise<{
    id: number;
    verificationState: string;
    message: string;
}>;
export declare function forgotAlumniPassword(email: string): Promise<{
    message: string;
}>;
export declare function dashboard(actor: AlumniActor): Promise<{
    profile: {
        id: number;
        studentId: number;
        collegeId: number;
        collegeName: any;
        collegeCode: any;
        role: string;
        kind: string;
        roleLabel: string;
        name: any;
        email: any;
        phone: any;
        usn: any;
        departmentId: number | null;
        departmentName: any;
        departmentCode: any;
        programId: number | null;
        programName: any;
        programCode: any;
        batchLabel: any;
        admissionYear: any;
        graduationYear: number;
        lifecycleState: any;
        verificationState: any;
        isActive: boolean;
        headline: any;
        biography: any;
        profilePhotoUrl: any;
        currentCity: any;
        currentCountry: any;
        skills: string[];
        interests: string[];
        linkedinUrl: any;
        websiteUrl: any;
        networkingAvailable: boolean;
        mentorshipAvailable: boolean;
        mentorshipAreas: string[];
        privacy: {
            email: any;
            phone: any;
            biography: any;
            employment: any;
            social: any;
            networking: any;
        } | undefined;
    };
    profileCompletion: number;
    employment: any[];
    higherStudies: any[];
    events: any[];
    opportunities: any[];
    contributions: any[];
    notices: any[];
}>;
export declare function updateOwnProfile(actor: AlumniActor, input: z.infer<typeof alumniProfileUpdateSchema>): Promise<{
    id: number;
    studentId: number;
    collegeId: number;
    collegeName: any;
    collegeCode: any;
    role: string;
    kind: string;
    roleLabel: string;
    name: any;
    email: any;
    phone: any;
    usn: any;
    departmentId: number | null;
    departmentName: any;
    departmentCode: any;
    programId: number | null;
    programName: any;
    programCode: any;
    batchLabel: any;
    admissionYear: any;
    graduationYear: number;
    lifecycleState: any;
    verificationState: any;
    isActive: boolean;
    headline: any;
    biography: any;
    profilePhotoUrl: any;
    currentCity: any;
    currentCountry: any;
    skills: string[];
    interests: string[];
    linkedinUrl: any;
    websiteUrl: any;
    networkingAvailable: boolean;
    mentorshipAvailable: boolean;
    mentorshipAreas: string[];
    privacy: {
        email: any;
        phone: any;
        biography: any;
        employment: any;
        social: any;
        networking: any;
    } | undefined;
}>;
export declare function listEmployment(actor: AlumniActor): Promise<any[]>;
export declare function upsertEmployment(actor: AlumniActor, body: z.infer<typeof employmentSchema>, id?: number): Promise<any>;
export declare function listHigherStudies(actor: AlumniActor): Promise<any[]>;
export declare function upsertHigherStudy(actor: AlumniActor, body: z.infer<typeof higherStudySchema>, id?: number): Promise<any>;
export declare function listEntrepreneurship(actor: AlumniActor): Promise<any[]>;
export declare function createEntrepreneurship(actor: AlumniActor, body: z.infer<typeof entrepreneurshipSchema>): Promise<any>;
export declare function createAchievement(actor: AlumniActor, body: z.infer<typeof achievementSchema>): Promise<any>;
export declare function directory(actor: AlumniActor, filters: Record<string, any>): Promise<{
    page: number;
    limit: number;
    alumni: {
        id: number;
        studentId: number;
        collegeId: number;
        collegeName: any;
        collegeCode: any;
        role: string;
        kind: string;
        roleLabel: string;
        name: any;
        email: any;
        phone: any;
        usn: any;
        departmentId: number | null;
        departmentName: any;
        departmentCode: any;
        programId: number | null;
        programName: any;
        programCode: any;
        batchLabel: any;
        admissionYear: any;
        graduationYear: number;
        lifecycleState: any;
        verificationState: any;
        isActive: boolean;
        headline: any;
        biography: any;
        profilePhotoUrl: any;
        currentCity: any;
        currentCountry: any;
        skills: string[];
        interests: string[];
        linkedinUrl: any;
        websiteUrl: any;
        networkingAvailable: boolean;
        mentorshipAvailable: boolean;
        mentorshipAreas: string[];
        privacy: {
            email: any;
            phone: any;
            biography: any;
            employment: any;
            social: any;
            networking: any;
        } | undefined;
    }[];
}>;
export declare function publicProfile(actor: AlumniActor, profileId: number): Promise<{
    profile: {
        id: number;
        studentId: number;
        collegeId: number;
        collegeName: any;
        collegeCode: any;
        role: string;
        kind: string;
        roleLabel: string;
        name: any;
        email: any;
        phone: any;
        usn: any;
        departmentId: number | null;
        departmentName: any;
        departmentCode: any;
        programId: number | null;
        programName: any;
        programCode: any;
        batchLabel: any;
        admissionYear: any;
        graduationYear: number;
        lifecycleState: any;
        verificationState: any;
        isActive: boolean;
        headline: any;
        biography: any;
        profilePhotoUrl: any;
        currentCity: any;
        currentCountry: any;
        skills: string[];
        interests: string[];
        linkedinUrl: any;
        websiteUrl: any;
        networkingAvailable: boolean;
        mentorshipAvailable: boolean;
        mentorshipAreas: string[];
        privacy: {
            email: any;
            phone: any;
            biography: any;
            employment: any;
            social: any;
            networking: any;
        } | undefined;
    };
    employment: any[];
}>;
export declare function listEvents(actor: AlumniActor, filters: {
    limit?: number;
}): Promise<{
    events: any[];
}>;
export declare function registerEvent(actor: AlumniActor, eventId: number): Promise<any>;
export declare function listOpportunities(actor: AlumniActor, filters: {
    limit?: number;
}): Promise<{
    opportunities: any[];
}>;
export declare function submitOpportunity(actor: AlumniActor, body: z.infer<typeof opportunitySchema>): Promise<any>;
export declare function createContributionIntent(actor: AlumniActor, body: z.infer<typeof contributionSchema>): Promise<any>;
export declare function listContributions(actor: AlumniActor): Promise<any[]>;
export declare function listNotices(actor: AlumniActor): Promise<{
    notices: any[];
}>;
export declare function adminOverview(actor: AlumniAdminActor): Promise<{
    totals: {
        alumni: number;
        verified: number;
        pendingVerification: number;
        active: number;
        employed: number;
        higherStudies: number;
        entrepreneurs: number;
        opportunities: number;
        contributionIntents: number;
    };
    byDepartment: {
        count?: string | number | undefined;
    }[];
    byGraduationYear: {
        count?: string | number | undefined;
    }[];
}>;
export declare function transitionStudent(actor: AlumniAdminActor, body: z.infer<typeof transitionSchema>): Promise<any>;
export declare function adminListProfiles(actor: AlumniAdminActor, filters: Record<string, any>): Promise<{
    page: number;
    limit: number;
    profiles: {
        id: number;
        studentId: number;
        collegeId: number;
        collegeName: any;
        collegeCode: any;
        role: string;
        kind: string;
        roleLabel: string;
        name: any;
        email: any;
        phone: any;
        usn: any;
        departmentId: number | null;
        departmentName: any;
        departmentCode: any;
        programId: number | null;
        programName: any;
        programCode: any;
        batchLabel: any;
        admissionYear: any;
        graduationYear: number;
        lifecycleState: any;
        verificationState: any;
        isActive: boolean;
        headline: any;
        biography: any;
        profilePhotoUrl: any;
        currentCity: any;
        currentCountry: any;
        skills: string[];
        interests: string[];
        linkedinUrl: any;
        websiteUrl: any;
        networkingAvailable: boolean;
        mentorshipAvailable: boolean;
        mentorshipAreas: string[];
        privacy: {
            email: any;
            phone: any;
            biography: any;
            employment: any;
            social: any;
            networking: any;
        } | undefined;
    }[];
}>;
export declare function verifyProfile(actor: AlumniAdminActor, profileId: number): Promise<any>;
export declare function rejectProfile(actor: AlumniAdminActor, profileId: number, reason?: string | null): Promise<any>;
export declare function adminCreateEvent(actor: AlumniAdminActor, body: z.infer<typeof eventSchema>): Promise<any>;
export declare function adminModerateOpportunity(actor: AlumniAdminActor, opportunityId: number, status: 'APPROVED' | 'REJECTED'): Promise<any>;
export declare function adminCreateNotice(actor: AlumniAdminActor, body: z.infer<typeof noticeSchema>): Promise<any>;
export declare function adminAnalytics(actor: AlumniAdminActor): Promise<{
    totals: {
        alumni: number;
        verified: number;
        pendingVerification: number;
        active: number;
        employed: number;
        higherStudies: number;
        entrepreneurs: number;
        opportunities: number;
        contributionIntents: number;
    };
    byDepartment: {
        count?: string | number | undefined;
    }[];
    byGraduationYear: {
        count?: string | number | undefined;
    }[];
}>;
