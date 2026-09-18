export type FacultyJwtPayload = {
    kind?: 'faculty';
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    email: string;
    name: string;
};
export type StudentJwtPayload = {
    kind: 'student';
    studentId: number;
    collegeId: number;
    departmentId: number | null;
    role: 'STUDENT';
    email: string;
    name: string;
};
export type ApplicantJwtPayload = {
    kind: 'applicant';
    applicantId: number;
    collegeId: number;
    role: 'APPLICANT';
    email: string;
    name: string;
};
export type ParentJwtPayload = {
    kind: 'parent';
    parentUserId: number;
    collegeId: number;
    role: 'PARENT';
    email: string;
    name: string;
};
export type AlumniJwtPayload = {
    kind: 'alumni';
    alumniProfileId: number;
    studentId: number;
    collegeId: number;
    departmentId: number | null;
    role: 'ALUMNI';
    email: string;
    name: string;
};
export type JwtPayload = FacultyJwtPayload | StudentJwtPayload | ApplicantJwtPayload | ParentJwtPayload | AlumniJwtPayload;
export declare function isStudentPayload(payload: JwtPayload): payload is StudentJwtPayload;
export declare function isApplicantPayload(payload: JwtPayload): payload is ApplicantJwtPayload;
export declare function isParentPayload(payload: JwtPayload): payload is ParentJwtPayload;
export declare function isAlumniPayload(payload: JwtPayload): payload is AlumniJwtPayload;
export declare function isFacultyPayload(payload: JwtPayload): payload is FacultyJwtPayload;
export declare function signToken(payload: JwtPayload): string;
export declare function verifyToken(token: string): JwtPayload;
