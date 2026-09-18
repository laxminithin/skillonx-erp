import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

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

export function isStudentPayload(payload: JwtPayload): payload is StudentJwtPayload {
  return payload.kind === 'student';
}

export function isApplicantPayload(payload: JwtPayload): payload is ApplicantJwtPayload {
  return payload.kind === 'applicant';
}

export function isParentPayload(payload: JwtPayload): payload is ParentJwtPayload {
  return payload.kind === 'parent';
}

export function isAlumniPayload(payload: JwtPayload): payload is AlumniJwtPayload {
  return payload.kind === 'alumni';
}

export function isFacultyPayload(payload: JwtPayload): payload is FacultyJwtPayload {
  return !isStudentPayload(payload) && !isApplicantPayload(payload) && !isParentPayload(payload) && !isAlumniPayload(payload) && typeof (payload as FacultyJwtPayload).facultyUserId === 'number';
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
