import { z } from 'zod';
import { DEFAULT_FACULTY_PERMISSIONS, type FacultyPermissions } from '../../utils/permissions.js';
export declare const createFacultySchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    employeeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    collegeId: z.ZodNumber;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    designation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    role: z.ZodDefault<z.ZodEnum<["FACULTY", "ACCOUNTANT", "ADMISSIONS_OFFICER", "ADMISSIONS_MANAGER", "COE", "OFFICE_ADMIN", "OFFICE_SUPERINTENDENT", "HOD", "PRINCIPAL", "MANAGEMENT", "CHAIRMAN", "IQAC_COORDINATOR", "NBA_COORDINATOR", "COLLEGE_ADMIN", "SUPER_ADMIN"]>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
    permissions: z.ZodOptional<z.ZodObject<{
        createSurvey: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        publishSurvey: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        viewResponses: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        exportReports: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        manageQuestionBank: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        viewStudentInformation: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        createSurvey?: boolean | undefined;
        publishSurvey?: boolean | undefined;
        viewResponses?: boolean | undefined;
        exportReports?: boolean | undefined;
        manageQuestionBank?: boolean | undefined;
        viewStudentInformation?: boolean | undefined;
    }, {
        createSurvey?: boolean | undefined;
        publishSurvey?: boolean | undefined;
        viewResponses?: boolean | undefined;
        exportReports?: boolean | undefined;
        manageQuestionBank?: boolean | undefined;
        viewStudentInformation?: boolean | undefined;
    }>>;
    authMode: z.ZodDefault<z.ZodEnum<["TEMP_PASSWORD", "SETUP_LINK"]>>;
    temporaryPassword: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    collegeId: number;
    authMode: "TEMP_PASSWORD" | "SETUP_LINK";
    name: string;
    role: "FACULTY" | "ACCOUNTANT" | "ADMISSIONS_OFFICER" | "ADMISSIONS_MANAGER" | "COE" | "OFFICE_ADMIN" | "OFFICE_SUPERINTENDENT" | "HOD" | "PRINCIPAL" | "MANAGEMENT" | "CHAIRMAN" | "IQAC_COORDINATOR" | "NBA_COORDINATOR" | "COLLEGE_ADMIN" | "SUPER_ADMIN";
    email: string;
    isActive: boolean;
    departmentId?: number | null | undefined;
    phone?: string | null | undefined;
    employeeId?: string | null | undefined;
    designation?: string | null | undefined;
    permissions?: {
        createSurvey?: boolean | undefined;
        publishSurvey?: boolean | undefined;
        viewResponses?: boolean | undefined;
        exportReports?: boolean | undefined;
        manageQuestionBank?: boolean | undefined;
        viewStudentInformation?: boolean | undefined;
    } | undefined;
    temporaryPassword?: string | undefined;
}, {
    collegeId: number;
    name: string;
    email: string;
    departmentId?: number | null | undefined;
    authMode?: "TEMP_PASSWORD" | "SETUP_LINK" | undefined;
    phone?: string | null | undefined;
    employeeId?: string | null | undefined;
    role?: "FACULTY" | "ACCOUNTANT" | "ADMISSIONS_OFFICER" | "ADMISSIONS_MANAGER" | "COE" | "OFFICE_ADMIN" | "OFFICE_SUPERINTENDENT" | "HOD" | "PRINCIPAL" | "MANAGEMENT" | "CHAIRMAN" | "IQAC_COORDINATOR" | "NBA_COORDINATOR" | "COLLEGE_ADMIN" | "SUPER_ADMIN" | undefined;
    isActive?: boolean | undefined;
    designation?: string | null | undefined;
    permissions?: {
        createSurvey?: boolean | undefined;
        publishSurvey?: boolean | undefined;
        viewResponses?: boolean | undefined;
        exportReports?: boolean | undefined;
        manageQuestionBank?: boolean | undefined;
        viewStudentInformation?: boolean | undefined;
    } | undefined;
    temporaryPassword?: string | undefined;
}>;
export declare const updateFacultySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    employeeId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    designation: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    role: z.ZodOptional<z.ZodEnum<["FACULTY", "ACCOUNTANT", "ADMISSIONS_OFFICER", "ADMISSIONS_MANAGER", "COE", "OFFICE_ADMIN", "OFFICE_SUPERINTENDENT", "HOD", "PRINCIPAL", "MANAGEMENT", "CHAIRMAN", "IQAC_COORDINATOR", "NBA_COORDINATOR", "COLLEGE_ADMIN", "SUPER_ADMIN"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    permissions: z.ZodOptional<z.ZodObject<{
        createSurvey: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        publishSurvey: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        viewResponses: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        exportReports: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        manageQuestionBank: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
        viewStudentInformation: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    }, "strip", z.ZodTypeAny, {
        createSurvey?: boolean | undefined;
        publishSurvey?: boolean | undefined;
        viewResponses?: boolean | undefined;
        exportReports?: boolean | undefined;
        manageQuestionBank?: boolean | undefined;
        viewStudentInformation?: boolean | undefined;
    }, {
        createSurvey?: boolean | undefined;
        publishSurvey?: boolean | undefined;
        viewResponses?: boolean | undefined;
        exportReports?: boolean | undefined;
        manageQuestionBank?: boolean | undefined;
        viewStudentInformation?: boolean | undefined;
    }>>;
    collegeId: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    collegeId?: number | undefined;
    departmentId?: number | null | undefined;
    name?: string | undefined;
    phone?: string | null | undefined;
    employeeId?: string | null | undefined;
    role?: "FACULTY" | "ACCOUNTANT" | "ADMISSIONS_OFFICER" | "ADMISSIONS_MANAGER" | "COE" | "OFFICE_ADMIN" | "OFFICE_SUPERINTENDENT" | "HOD" | "PRINCIPAL" | "MANAGEMENT" | "CHAIRMAN" | "IQAC_COORDINATOR" | "NBA_COORDINATOR" | "COLLEGE_ADMIN" | "SUPER_ADMIN" | undefined;
    email?: string | undefined;
    isActive?: boolean | undefined;
    designation?: string | null | undefined;
    permissions?: {
        createSurvey?: boolean | undefined;
        publishSurvey?: boolean | undefined;
        viewResponses?: boolean | undefined;
        exportReports?: boolean | undefined;
        manageQuestionBank?: boolean | undefined;
        viewStudentInformation?: boolean | undefined;
    } | undefined;
}, {
    collegeId?: number | undefined;
    departmentId?: number | null | undefined;
    name?: string | undefined;
    phone?: string | null | undefined;
    employeeId?: string | null | undefined;
    role?: "FACULTY" | "ACCOUNTANT" | "ADMISSIONS_OFFICER" | "ADMISSIONS_MANAGER" | "COE" | "OFFICE_ADMIN" | "OFFICE_SUPERINTENDENT" | "HOD" | "PRINCIPAL" | "MANAGEMENT" | "CHAIRMAN" | "IQAC_COORDINATOR" | "NBA_COORDINATOR" | "COLLEGE_ADMIN" | "SUPER_ADMIN" | undefined;
    email?: string | undefined;
    isActive?: boolean | undefined;
    designation?: string | null | undefined;
    permissions?: {
        createSurvey?: boolean | undefined;
        publishSurvey?: boolean | undefined;
        viewResponses?: boolean | undefined;
        exportReports?: boolean | undefined;
        manageQuestionBank?: boolean | undefined;
        viewStudentInformation?: boolean | undefined;
    } | undefined;
}>;
export declare const createInstitutionSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    domain: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    logoUrl: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    isActive: boolean;
    address?: string | null | undefined;
    domain?: string | null | undefined;
    logoUrl?: string | null | undefined;
}, {
    code: string;
    name: string;
    address?: string | null | undefined;
    isActive?: boolean | undefined;
    domain?: string | null | undefined;
    logoUrl?: string | null | undefined;
}>;
export declare const updateInstitutionSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    code: z.ZodOptional<z.ZodString>;
    domain: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    address: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    logoUrl: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    isActive: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    name?: string | undefined;
    address?: string | null | undefined;
    isActive?: boolean | undefined;
    domain?: string | null | undefined;
    logoUrl?: string | null | undefined;
}, {
    code?: string | undefined;
    name?: string | undefined;
    address?: string | null | undefined;
    isActive?: boolean | undefined;
    domain?: string | null | undefined;
    logoUrl?: string | null | undefined;
}>;
export declare const createDepartmentSchema: z.ZodObject<{
    collegeId: z.ZodNumber;
    name: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    collegeId: number;
    name: string;
}, {
    code: string;
    collegeId: number;
    name: string;
}>;
export declare const createAcademicYearSchema: z.ZodObject<{
    collegeId: z.ZodNumber;
    label: z.ZodString;
    isCurrent: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    collegeId: number;
    label: string;
    isCurrent: boolean;
}, {
    collegeId: number;
    label: string;
    isCurrent?: boolean | undefined;
}>;
export declare const createSemesterSchema: z.ZodObject<{
    collegeId: z.ZodNumber;
    label: z.ZodString;
    number: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    collegeId: number;
    label: string;
    number?: number | null | undefined;
}, {
    collegeId: number;
    label: string;
    number?: number | null | undefined;
}>;
export declare const createCourseSchema: z.ZodObject<{
    collegeId: z.ZodNumber;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    code: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    collegeId: number;
    name: string;
    departmentId?: number | null | undefined;
}, {
    code: string;
    collegeId: number;
    name: string;
    departmentId?: number | null | undefined;
}>;
export declare const createSectionSchema: z.ZodObject<{
    collegeId: z.ZodNumber;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    label: z.ZodString;
}, "strip", z.ZodTypeAny, {
    collegeId: number;
    label: string;
    departmentId?: number | null | undefined;
}, {
    collegeId: number;
    label: string;
    departmentId?: number | null | undefined;
}>;
export declare const createProgramSchema: z.ZodObject<{
    collegeId: z.ZodNumber;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    name: z.ZodString;
    code: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    collegeId: number;
    name: string;
    departmentId?: number | null | undefined;
}, {
    code: string;
    collegeId: number;
    name: string;
    departmentId?: number | null | undefined;
}>;
export declare function getOverview(scopeCollegeId: number | null): Promise<{
    metrics: {
        institutions: number;
        faculty: number;
        students: number;
        surveys: number;
        activeSurveys: number;
        responses: number;
    };
    recentSurveys: any[];
    facultyActivity: any[];
    responseActivity: any[];
    statusOverview: {
        status: string;
        count: number;
    }[];
    institutionUsage: {
        id: any;
        name: any;
        code: any;
        faculty: number;
        surveys: number;
        responses: number;
    }[];
}>;
export declare function listFaculty(params: {
    collegeId: number | null;
    q?: string;
    departmentId?: number;
    role?: string;
    status?: 'active' | 'inactive' | 'all';
}): Promise<{
    id: unknown;
    name: unknown;
    email: unknown;
    employeeId: {} | null;
    phone: {} | null;
    designation: {} | null;
    role: unknown;
    isActive: boolean;
    collegeId: unknown;
    collegeName: {} | null;
    collegeCode: {} | null;
    departmentId: {} | null;
    departmentName: {} | null;
    permissions: FacultyPermissions;
    surveyCount: number;
    lastLoginAt: {} | null;
    createdAt: unknown;
    archivedAt: {} | null;
}[]>;
export declare function getFaculty(id: number, scopeCollegeId: number | null): Promise<{
    responseCount: number;
    surveys: any[];
    id: unknown;
    name: unknown;
    email: unknown;
    employeeId: {} | null;
    phone: {} | null;
    designation: {} | null;
    role: unknown;
    isActive: boolean;
    collegeId: unknown;
    collegeName: {} | null;
    collegeCode: {} | null;
    departmentId: {} | null;
    departmentName: {} | null;
    permissions: FacultyPermissions;
    surveyCount: number;
    lastLoginAt: {} | null;
    createdAt: unknown;
    archivedAt: {} | null;
}>;
export declare function createFaculty(input: z.infer<typeof createFacultySchema>): Promise<{
    faculty: {
        responseCount: number;
        surveys: any[];
        id: unknown;
        name: unknown;
        email: unknown;
        employeeId: {} | null;
        phone: {} | null;
        designation: {} | null;
        role: unknown;
        isActive: boolean;
        collegeId: unknown;
        collegeName: {} | null;
        collegeCode: {} | null;
        departmentId: {} | null;
        departmentName: {} | null;
        permissions: FacultyPermissions;
        surveyCount: number;
        lastLoginAt: {} | null;
        createdAt: unknown;
        archivedAt: {} | null;
    };
    credentials: {
        mode: "TEMP_PASSWORD";
        temporaryPassword: string;
        setupToken?: undefined;
    } | {
        mode: "SETUP_LINK";
        setupToken: string;
        temporaryPassword?: undefined;
    };
}>;
export declare function updateFaculty(id: number, scopeCollegeId: number | null, input: z.infer<typeof updateFacultySchema>, actorRole: string): Promise<{
    responseCount: number;
    surveys: any[];
    id: unknown;
    name: unknown;
    email: unknown;
    employeeId: {} | null;
    phone: {} | null;
    designation: {} | null;
    role: unknown;
    isActive: boolean;
    collegeId: unknown;
    collegeName: {} | null;
    collegeCode: {} | null;
    departmentId: {} | null;
    departmentName: {} | null;
    permissions: FacultyPermissions;
    surveyCount: number;
    lastLoginAt: {} | null;
    createdAt: unknown;
    archivedAt: {} | null;
}>;
export declare function setFacultyActive(id: number, scopeCollegeId: number | null, isActive: boolean): Promise<{
    responseCount: number;
    surveys: any[];
    id: unknown;
    name: unknown;
    email: unknown;
    employeeId: {} | null;
    phone: {} | null;
    designation: {} | null;
    role: unknown;
    isActive: boolean;
    collegeId: unknown;
    collegeName: {} | null;
    collegeCode: {} | null;
    departmentId: {} | null;
    departmentName: {} | null;
    permissions: FacultyPermissions;
    surveyCount: number;
    lastLoginAt: {} | null;
    createdAt: unknown;
    archivedAt: {} | null;
}>;
export declare function archiveFaculty(id: number, scopeCollegeId: number | null): Promise<{
    ok: boolean;
}>;
export declare function resetFacultyPassword(id: number, scopeCollegeId: number | null): Promise<{
    temporaryPassword: string;
    setupToken: string;
    message: string;
}>;
export declare function listInstitutions(scopeCollegeId: number | null): Promise<{
    id: any;
    name: any;
    code: any;
    domain: any;
    address: any;
    logoUrl: any;
    isActive: boolean;
    departmentCount: number;
    facultyCount: number;
    studentCount: number;
    surveyCount: number;
    createdAt: any;
}[]>;
export declare function getInstitution(id: number, scopeCollegeId: number | null): Promise<{
    institution: {
        id: any;
        name: any;
        code: any;
        domain: any;
        address: any;
        logoUrl: any;
        isActive: boolean;
        departmentCount: number;
        facultyCount: number;
        studentCount: number;
        surveyCount: number;
        createdAt: any;
    };
    departments: any[];
    faculty: {
        id: unknown;
        name: unknown;
        email: unknown;
        employeeId: {} | null;
        phone: {} | null;
        designation: {} | null;
        role: unknown;
        isActive: boolean;
        collegeId: unknown;
        collegeName: {} | null;
        collegeCode: {} | null;
        departmentId: {} | null;
        departmentName: {} | null;
        permissions: FacultyPermissions;
        surveyCount: number;
        lastLoginAt: {} | null;
        createdAt: unknown;
        archivedAt: {} | null;
    }[];
    recentSurveys: any[];
}>;
export declare function createInstitution(input: z.infer<typeof createInstitutionSchema>): Promise<{
    id: any;
    name: any;
    code: any;
    domain: any;
    address: any;
    logoUrl: any;
    isActive: boolean;
    departmentCount: number;
    facultyCount: number;
    studentCount: number;
    surveyCount: number;
    createdAt: any;
}>;
export declare function updateInstitution(id: number, scopeCollegeId: number | null, input: z.infer<typeof updateInstitutionSchema>): Promise<{
    id: any;
    name: any;
    code: any;
    domain: any;
    address: any;
    logoUrl: any;
    isActive: boolean;
    departmentCount: number;
    facultyCount: number;
    studentCount: number;
    surveyCount: number;
    createdAt: any;
}>;
export declare function listDepartments(collegeId: number): Promise<any[]>;
export declare function createDepartment(input: z.infer<typeof createDepartmentSchema>): Promise<any>;
export declare function updateDepartment(id: number, collegeId: number, data: {
    name?: string;
    code?: string;
}): Promise<any>;
export declare function deleteDepartment(id: number, collegeId: number): Promise<{
    ok: boolean;
}>;
export declare function academicBundle(collegeId: number): Promise<{
    years: any[];
    semesters: any[];
    courses: any[];
    sections: any[];
    programs: any[];
    departments: any[];
}>;
export declare function createAcademicYear(input: z.infer<typeof createAcademicYearSchema>): Promise<any>;
export declare function createSemester(input: z.infer<typeof createSemesterSchema>): Promise<any>;
export declare function createCourse(input: z.infer<typeof createCourseSchema>): Promise<any>;
export declare function createSection(input: z.infer<typeof createSectionSchema>): Promise<any>;
export declare function createProgram(input: z.infer<typeof createProgramSchema>): Promise<any>;
export declare function listAdminSurveys(params: {
    collegeId: number | null;
    q?: string;
    departmentId?: number;
    facultyId?: number;
    surveyType?: string;
    status?: string;
    academicYearId?: number;
}): Promise<any[]>;
export declare function listAdminStudents(params: {
    collegeId: number | null;
    q?: string;
    departmentId?: number;
}): Promise<any[]>;
export declare function listAdminResponses(params: {
    collegeId: number | null;
    surveyId?: number;
    q?: string;
}): Promise<{
    id: any;
    submittedAt: any;
    attemptNumber: any;
    surveyId: any;
    surveyTitle: any;
    identityMode: any;
    createdBy: any;
    student: {
        id: any;
        name: any;
        usn: any;
    } | null;
}[]>;
export declare function getAdminAnalytics(collegeId: number | null): Promise<{
    overall: {
        totalSurveys: number;
        totalResponses: number;
        activeSurveys: number;
        averageCompletionRate: number;
    };
    byDepartment: {
        department: any;
        responses: number;
    }[];
    byType: {
        surveyType: any;
        surveys: number;
        responses: number;
    }[];
    trend: {
        day: any;
        responses: number;
    }[];
}>;
export declare function getAdminReports(collegeId: number | null): Promise<{
    summary: {
        totalSurveys: number;
        totalResponses: number;
        activeSurveys: number;
        averageCompletionRate: number;
    };
    facultyActivity: {
        id: unknown;
        name: unknown;
        department: {} | null;
        surveys: number;
        status: string;
        lastActive: {} | null;
    }[];
    departmentParticipation: {
        department: any;
        responses: number;
    }[];
    surveys: any[];
}>;
export declare function listAdminQuizzes(params: {
    collegeId: number | null;
    q?: string;
    status?: string;
}): Promise<any[]>;
export { DEFAULT_FACULTY_PERMISSIONS };
