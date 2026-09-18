import type { Response, NextFunction } from 'express';
import type { Request } from 'express';
import { type AlumniJwtPayload, type ApplicantJwtPayload, type FacultyJwtPayload, type ParentJwtPayload, type StudentJwtPayload } from '../utils/token.js';
export type AuthedRequest = Request & {
    user?: FacultyJwtPayload;
};
export type StudentAuthedRequest = Request & {
    user?: StudentJwtPayload;
};
export type ApplicantAuthedRequest = Request & {
    user?: ApplicantJwtPayload;
};
export type ParentAuthedRequest = Request & {
    user?: ParentJwtPayload;
};
export type AlumniAuthedRequest = Request & {
    user?: AlumniJwtPayload;
};
export declare function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction): void;
export declare function requireAlumniAuth(req: AlumniAuthedRequest, _res: Response, next: NextFunction): Promise<void>;
export declare function requireApplicantAuth(req: ApplicantAuthedRequest, _res: Response, next: NextFunction): Promise<void>;
export declare function requireParentAuth(req: ParentAuthedRequest, _res: Response, next: NextFunction): Promise<void>;
export declare function requireStudentAuth(req: StudentAuthedRequest, _res: Response, next: NextFunction): Promise<void>;
export declare function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction): void;
export declare function requireSuperAdmin(req: AuthedRequest, _res: Response, next: NextFunction): void;
/** Resolve the college scope for an admin request. Super admins may pass ?collegeId= */
export declare function resolveAdminCollegeId(req: AuthedRequest, options?: {
    required?: boolean;
    allowAll?: boolean;
}): number | null;
export declare function assertCollegeAccess(req: AuthedRequest, collegeId: number): void;
