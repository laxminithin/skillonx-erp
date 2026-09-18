import { z } from 'zod';
export declare const studentRegisterSchema: z.ZodObject<{
    name: z.ZodString;
    usn: z.ZodEffects<z.ZodEffects<z.ZodString, string, string>, string, string>;
    email: z.ZodEffects<z.ZodString, string, string>;
    password: z.ZodEffects<z.ZodString, string, string>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    programId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    semesterId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    classSectionId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    schemeId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    academicYearId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    usn: string;
    departmentId?: number | null | undefined;
    phone?: string | null | undefined;
    academicYearId?: number | null | undefined;
    semesterId?: number | null | undefined;
    classSectionId?: number | null | undefined;
    programId?: number | null | undefined;
    schemeId?: number | null | undefined;
}, {
    name: string;
    email: string;
    password: string;
    usn: string;
    departmentId?: number | null | undefined;
    phone?: string | null | undefined;
    academicYearId?: number | null | undefined;
    semesterId?: number | null | undefined;
    classSectionId?: number | null | undefined;
    programId?: number | null | undefined;
    schemeId?: number | null | undefined;
}>;
export declare const studentLoginSchema: z.ZodObject<{
    email: z.ZodOptional<z.ZodString>;
    usn: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
    collegeId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    password: string;
    collegeId?: number | undefined;
    email?: string | undefined;
    usn?: string | undefined;
}, {
    password: string;
    collegeId?: number | undefined;
    email?: string | undefined;
    usn?: string | undefined;
}>;
export declare const studentProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | null | undefined;
}, {
    name?: string | undefined;
    phone?: string | null | undefined;
}>;
export declare const studentForgotSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const studentResetSchema: z.ZodObject<{
    token: z.ZodString;
    password: z.ZodEffects<z.ZodString, string, string>;
}, "strip", z.ZodTypeAny, {
    password: string;
    token: string;
}, {
    password: string;
    token: string;
}>;
export declare const studentChangePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodEffects<z.ZodString, string, string>;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>;
export declare const correctionSchema: z.ZodObject<{
    field: z.ZodEnum<["USN", "PROGRAM", "BRANCH", "SEMESTER", "SECTION", "SCHEME", "ACADEMIC_YEAR"]>;
    requestedValue: z.ZodString;
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    field: "USN" | "PROGRAM" | "SCHEME" | "SEMESTER" | "ACADEMIC_YEAR" | "SECTION" | "BRANCH";
    requestedValue: string;
    reason?: string | null | undefined;
}, {
    field: "USN" | "PROGRAM" | "SCHEME" | "SEMESTER" | "ACADEMIC_YEAR" | "SECTION" | "BRANCH";
    requestedValue: string;
    reason?: string | null | undefined;
}>;
export declare function serializeStudent(studentId: number): Promise<{
    id: number;
    kind: "student";
    role: string;
    roleLabel: string;
    name: any;
    usn: any;
    email: any;
    phone: any;
    collegeId: number;
    collegeName: any;
    departmentId: number | null;
    departmentName: any;
    departmentCode: any;
    programId: number | null;
    programName: any;
    programCode: any;
    semesterId: number | null;
    semesterLabel: any;
    semesterNumber: number | null;
    classSectionId: number | null;
    sectionLabel: any;
    schemeId: number | null;
    schemeName: any;
    academicYearId: number | null;
    academicYearLabel: any;
    profileComplete: boolean;
    isActive: boolean;
}>;
export declare function registerForClass(code: string, input: z.infer<typeof studentRegisterSchema>): Promise<{
    membership: {
        enrollment: {
            id: number;
            studentId: number;
            classId: number;
            status: any;
            requestedAt: any;
            approvedAt: any;
            approvedBy: any;
            rejectedAt: any;
            rejectedBy: any;
            remarks: any;
            usn: any;
            name: any;
            email: any;
        };
        alreadyMember: boolean;
    };
    token: string;
    user: {
        id: number;
        kind: "student";
        role: string;
        roleLabel: string;
        name: any;
        usn: any;
        email: any;
        phone: any;
        collegeId: number;
        collegeName: any;
        departmentId: number | null;
        departmentName: any;
        departmentCode: any;
        programId: number | null;
        programName: any;
        programCode: any;
        semesterId: number | null;
        semesterLabel: any;
        semesterNumber: number | null;
        classSectionId: number | null;
        sectionLabel: any;
        schemeId: number | null;
        schemeName: any;
        academicYearId: number | null;
        academicYearLabel: any;
        profileComplete: boolean;
        isActive: boolean;
    };
}>;
export declare function loginStudent(input: z.infer<typeof studentLoginSchema>): Promise<{
    token: string;
    user: {
        id: number;
        kind: "student";
        role: string;
        roleLabel: string;
        name: any;
        usn: any;
        email: any;
        phone: any;
        collegeId: number;
        collegeName: any;
        departmentId: number | null;
        departmentName: any;
        departmentCode: any;
        programId: number | null;
        programName: any;
        programCode: any;
        semesterId: number | null;
        semesterLabel: any;
        semesterNumber: number | null;
        classSectionId: number | null;
        sectionLabel: any;
        schemeId: number | null;
        schemeName: any;
        academicYearId: number | null;
        academicYearLabel: any;
        profileComplete: boolean;
        isActive: boolean;
    };
}>;
export declare function loginAndJoinClass(code: string, input: z.infer<typeof studentLoginSchema>): Promise<{
    membership: {
        enrollment: {
            id: number;
            studentId: number;
            classId: number;
            status: any;
            requestedAt: any;
            approvedAt: any;
            approvedBy: any;
            rejectedAt: any;
            rejectedBy: any;
            remarks: any;
            usn: any;
            name: any;
            email: any;
        };
        alreadyMember: boolean;
    };
    token: string;
    user: {
        id: number;
        kind: "student";
        role: string;
        roleLabel: string;
        name: any;
        usn: any;
        email: any;
        phone: any;
        collegeId: number;
        collegeName: any;
        departmentId: number | null;
        departmentName: any;
        departmentCode: any;
        programId: number | null;
        programName: any;
        programCode: any;
        semesterId: number | null;
        semesterLabel: any;
        semesterNumber: number | null;
        classSectionId: number | null;
        sectionLabel: any;
        schemeId: number | null;
        schemeName: any;
        academicYearId: number | null;
        academicYearLabel: any;
        profileComplete: boolean;
        isActive: boolean;
    };
}>;
export declare function joinClassAsStudent(studentId: number, code: string): Promise<{
    enrollment: {
        id: number;
        studentId: number;
        classId: number;
        status: any;
        requestedAt: any;
        approvedAt: any;
        approvedBy: any;
        rejectedAt: any;
        rejectedBy: any;
        remarks: any;
        usn: any;
        name: any;
        email: any;
    };
    alreadyMember: boolean;
}>;
export declare function updateStudentProfile(studentId: number, input: z.infer<typeof studentProfileSchema>): Promise<{
    id: number;
    kind: "student";
    role: string;
    roleLabel: string;
    name: any;
    usn: any;
    email: any;
    phone: any;
    collegeId: number;
    collegeName: any;
    departmentId: number | null;
    departmentName: any;
    departmentCode: any;
    programId: number | null;
    programName: any;
    programCode: any;
    semesterId: number | null;
    semesterLabel: any;
    semesterNumber: number | null;
    classSectionId: number | null;
    sectionLabel: any;
    schemeId: number | null;
    schemeName: any;
    academicYearId: number | null;
    academicYearLabel: any;
    profileComplete: boolean;
    isActive: boolean;
}>;
export declare function forgotStudentPassword(email: string): Promise<{
    message: string;
}>;
export declare function resetStudentPassword(token: string, password: string): Promise<{
    message: string;
}>;
export declare function changeStudentPassword(studentId: number, input: {
    currentPassword: string;
    newPassword: string;
}): Promise<{
    message: string;
}>;
export declare function requestProfileCorrection(studentId: number, input: z.infer<typeof correctionSchema>): Promise<{
    request: {
        id: number;
        field: "USN" | "PROGRAM" | "SCHEME" | "SEMESTER" | "ACADEMIC_YEAR" | "SECTION" | "BRANCH";
        status: string;
    };
}>;
