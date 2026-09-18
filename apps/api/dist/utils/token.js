import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
export function isStudentPayload(payload) {
    return payload.kind === 'student';
}
export function isApplicantPayload(payload) {
    return payload.kind === 'applicant';
}
export function isParentPayload(payload) {
    return payload.kind === 'parent';
}
export function isAlumniPayload(payload) {
    return payload.kind === 'alumni';
}
export function isFacultyPayload(payload) {
    return !isStudentPayload(payload) && !isApplicantPayload(payload) && !isParentPayload(payload) && !isAlumniPayload(payload) && typeof payload.facultyUserId === 'number';
}
export function signToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}
export function verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
