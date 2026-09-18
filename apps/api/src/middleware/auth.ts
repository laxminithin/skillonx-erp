import type { Response, NextFunction } from 'express';
import type { Request } from 'express';
import {
  isApplicantPayload,
  isAlumniPayload,
  isFacultyPayload,
  isParentPayload,
  isStudentPayload,
  verifyToken,
  type AlumniJwtPayload,
  type ApplicantJwtPayload,
  type FacultyJwtPayload,
  type ParentJwtPayload,
  type StudentJwtPayload,
} from '../utils/token.js';
import { AppError } from '../utils/errors.js';
import { isAdminRole, isSuperAdmin } from '../utils/permissions.js';

export type AuthedRequest = Request & { user?: FacultyJwtPayload };
export type StudentAuthedRequest = Request & { user?: StudentJwtPayload };
export type ApplicantAuthedRequest = Request & { user?: ApplicantJwtPayload };
export type ParentAuthedRequest = Request & { user?: ParentJwtPayload };
export type AlumniAuthedRequest = Request & { user?: AlumniJwtPayload };

function readBearer(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required');
  }
  try {
    return verifyToken(header.slice(7));
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  try {
    const payload = readBearer(req);
    if (isStudentPayload(payload) || isApplicantPayload(payload) || isParentPayload(payload) || isAlumniPayload(payload) || !isFacultyPayload(payload)) {
      return next(new AppError(403, 'Use the Student LMS to continue.'));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAlumniAuth(req: AlumniAuthedRequest, _res: Response, next: NextFunction) {
  try {
    const payload = readBearer(req);
    if (!isAlumniPayload(payload)) {
      return next(new AppError(403, 'Alumni access required'));
    }
    const { db } = await import('../db/index.js');
    const profile = await db('alumni_profiles')
      .where({ id: payload.alumniProfileId, college_id: payload.collegeId, student_id: payload.studentId })
      .select('id', 'college_id', 'student_id', 'is_active', 'verification_state', 'lifecycle_state')
      .first();
    if (!profile || !profile.is_active || ['SUSPENDED', 'ARCHIVED'].includes(String(profile.lifecycle_state))) {
      return next(new AppError(403, 'This alumni account is not active', undefined, 'ACCOUNT_DEACTIVATED'));
    }
    if (profile.verification_state !== 'VERIFIED') {
      return next(new AppError(403, 'This alumni account is not verified', undefined, 'ALUMNI_NOT_VERIFIED'));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireApplicantAuth(req: ApplicantAuthedRequest, _res: Response, next: NextFunction) {
  try {
    const payload = readBearer(req);
    if (!isApplicantPayload(payload)) {
      return next(new AppError(403, 'Applicant access required'));
    }
    const { db } = await import('../db/index.js');
    const applicant = await db('admission_applicants')
      .where({ id: payload.applicantId, college_id: payload.collegeId })
      .select('id', 'college_id', 'portal_status')
      .first();
    if (!applicant || applicant.portal_status === 'DISABLED') {
      return next(new AppError(403, 'This applicant account is not active', undefined, 'ACCOUNT_DEACTIVATED'));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireParentAuth(req: ParentAuthedRequest, _res: Response, next: NextFunction) {
  try {
    const payload = readBearer(req);
    if (!isParentPayload(payload)) {
      return next(new AppError(403, 'Parent access required'));
    }
    const { db } = await import('../db/index.js');
    const parent = await db('parent_users')
      .where({ id: payload.parentUserId, college_id: payload.collegeId })
      .select('id', 'college_id', 'is_active', 'identity_verified')
      .first();
    if (!parent || !parent.is_active) {
      return next(new AppError(403, 'This parent account is deactivated', undefined, 'ACCOUNT_DEACTIVATED'));
    }
    if (!parent.identity_verified) {
      return next(new AppError(403, 'This parent account is not verified', undefined, 'PARENT_NOT_VERIFIED'));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireStudentAuth(req: StudentAuthedRequest, _res: Response, next: NextFunction) {
  try {
    const payload = readBearer(req);
    if (!isStudentPayload(payload)) {
      return next(new AppError(403, 'Student access required'));
    }
    const { db } = await import('../db/index.js');
    const student = await db('students').where({ id: payload.studentId }).select('id', 'college_id', 'is_active').first();
    if (!student || !student.is_active) {
      return next(new AppError(403, 'This student account is deactivated', undefined, 'ACCOUNT_DEACTIVATED'));
    }
    if (Number(student.college_id) !== Number(payload.collegeId)) {
      return next(new AppError(403, 'You cannot access this institution', undefined, 'TENANT_MISMATCH'));
    }
    req.user = payload;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError(401, 'Authentication required'));
  if (!isAdminRole(req.user.role)) {
    return next(new AppError(403, 'Administrator access required'));
  }
  next();
}

export function requireSuperAdmin(req: AuthedRequest, _res: Response, next: NextFunction) {
  if (!req.user) return next(new AppError(401, 'Authentication required'));
  if (!isSuperAdmin(req.user.role)) {
    return next(new AppError(403, 'Platform administrator access required'));
  }
  next();
}

/** Resolve the college scope for an admin request. Super admins may pass ?collegeId= */
export function resolveAdminCollegeId(
  req: AuthedRequest,
  options?: { required?: boolean; allowAll?: boolean },
): number | null {
  const user = req.user!;
  if (isSuperAdmin(user.role)) {
    const raw = req.query.collegeId ?? req.body?.collegeId;
    if (raw === undefined || raw === null || raw === '' || raw === 'all') {
      if (options?.required) throw new AppError(400, 'collegeId is required');
      return options?.allowAll ? null : user.collegeId;
    }
    const id = Number(raw);
    if (!Number.isFinite(id)) throw new AppError(400, 'Invalid collegeId');
    return id;
  }
  return user.collegeId;
}

export function assertCollegeAccess(req: AuthedRequest, collegeId: number) {
  const user = req.user!;
  if (isSuperAdmin(user.role)) return;
  if (user.collegeId !== collegeId) {
    throw new AppError(403, 'You do not have access to this institution');
  }
}
