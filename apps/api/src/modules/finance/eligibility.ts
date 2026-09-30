import { db } from '../../db/index.js';
import { studentAcademicRecord } from '../examination/result.js';
import { studentAttendanceSummary } from '../attendance/service.js';

/**
 * Structured, deterministic eligibility criteria only — no executable code
 * or eval (directive §18). Every field is optional; an absent field is not
 * evaluated at all (it neither passes nor fails anything).
 */
export type EligibilityCriteria = {
  programIds?: number[];
  minSemester?: number;
  minCgpa?: number;
  maxIncome?: number;
  categories?: string[];
  minAttendancePercent?: number;
  requiredDocumentCategories?: string[];
};

export type EligibilityStatus = 'ELIGIBLE' | 'INELIGIBLE' | 'PENDING_DATA' | 'SOURCE_ERROR';

export type EligibilityCheck = {
  criterion: string;
  status: EligibilityStatus;
  detail: string;
};

export type EligibilityResult = {
  status: EligibilityStatus;
  checks: EligibilityCheck[];
  snapshot: Record<string, unknown>;
};

/**
 * Evaluate one student against one frozen criteria set. Missing source data
 * is reported as PENDING_DATA/SOURCE_ERROR, never silently treated as
 * INELIGIBLE, ELIGIBLE, or zero (directive §21). The overall status is the
 * worst of: any INELIGIBLE -> INELIGIBLE; else any SOURCE_ERROR ->
 * SOURCE_ERROR; else any PENDING_DATA -> PENDING_DATA; else ELIGIBLE.
 */
export async function evaluateEligibility(
  studentId: number,
  collegeId: number,
  criteria: EligibilityCriteria,
  selfDeclared: { income?: number | null; category?: string | null },
): Promise<EligibilityResult> {
  const checks: EligibilityCheck[] = [];
  const snapshot: Record<string, unknown> = { criteria, evaluatedAt: new Date().toISOString() };

  const student = await db('students')
    .where({ id: studentId, college_id: collegeId })
    .select('id', 'program_id', 'semester_id', 'semester')
    .first();
  if (!student) {
    return { status: 'SOURCE_ERROR', checks: [{ criterion: 'student', status: 'SOURCE_ERROR', detail: 'Student record not found' }], snapshot };
  }

  if (criteria.programIds?.length) {
    const programId = student.program_id != null ? Number(student.program_id) : null;
    if (programId == null) {
      checks.push({ criterion: 'programIds', status: 'PENDING_DATA', detail: 'Student has no programme assigned' });
    } else if (criteria.programIds.includes(programId)) {
      checks.push({ criterion: 'programIds', status: 'ELIGIBLE', detail: `Programme ${programId} is in scheme scope` });
    } else {
      checks.push({ criterion: 'programIds', status: 'INELIGIBLE', detail: `Programme ${programId} is outside scheme scope` });
    }
  }

  if (criteria.minSemester != null) {
    const semesterNumber = student.semester != null ? Number(student.semester) : null;
    if (semesterNumber == null) {
      checks.push({ criterion: 'minSemester', status: 'PENDING_DATA', detail: 'Student has no current semester recorded' });
    } else if (semesterNumber >= criteria.minSemester) {
      checks.push({ criterion: 'minSemester', status: 'ELIGIBLE', detail: `Semester ${semesterNumber} >= ${criteria.minSemester}` });
    } else {
      checks.push({ criterion: 'minSemester', status: 'INELIGIBLE', detail: `Semester ${semesterNumber} < ${criteria.minSemester}` });
    }
  }

  if (criteria.minCgpa != null) {
    try {
      const record = await studentAcademicRecord(studentId, collegeId);
      const cgpa = (record as { cgpa?: number | null }).cgpa;
      snapshot.cgpa = cgpa ?? null;
      if (cgpa == null) {
        checks.push({ criterion: 'minCgpa', status: 'PENDING_DATA', detail: 'No published academic record yet' });
      } else if (cgpa >= criteria.minCgpa) {
        checks.push({ criterion: 'minCgpa', status: 'ELIGIBLE', detail: `CGPA ${cgpa} >= ${criteria.minCgpa}` });
      } else {
        checks.push({ criterion: 'minCgpa', status: 'INELIGIBLE', detail: `CGPA ${cgpa} < ${criteria.minCgpa}` });
      }
    } catch {
      checks.push({ criterion: 'minCgpa', status: 'SOURCE_ERROR', detail: 'Could not read academic record from Examination' });
    }
  }

  if (criteria.minAttendancePercent != null) {
    try {
      const summary = await studentAttendanceSummary(studentId);
      const percentage = (summary as { overall?: number | null }).overall ?? null;
      snapshot.attendancePercentage = percentage;
      if (percentage == null) {
        checks.push({ criterion: 'minAttendancePercent', status: 'PENDING_DATA', detail: 'No attendance data available yet' });
      } else if (percentage >= criteria.minAttendancePercent) {
        checks.push({ criterion: 'minAttendancePercent', status: 'ELIGIBLE', detail: `Attendance ${percentage}% >= ${criteria.minAttendancePercent}%` });
      } else {
        checks.push({ criterion: 'minAttendancePercent', status: 'INELIGIBLE', detail: `Attendance ${percentage}% < ${criteria.minAttendancePercent}%` });
      }
    } catch {
      checks.push({ criterion: 'minAttendancePercent', status: 'SOURCE_ERROR', detail: 'Could not read attendance summary' });
    }
  }

  if (criteria.maxIncome != null) {
    // Self-declared, unverified income is distinguished from a verified fact
    // (directive §32) — it only ever yields PENDING_DATA until a staff
    // verifier confirms it against uploaded evidence during verification.
    if (selfDeclared.income == null) {
      checks.push({ criterion: 'maxIncome', status: 'PENDING_DATA', detail: 'No self-declared income provided' });
    } else if (selfDeclared.income <= criteria.maxIncome) {
      checks.push({ criterion: 'maxIncome', status: 'PENDING_DATA', detail: `Self-declared income ${selfDeclared.income} within limit — pending document verification` });
    } else {
      checks.push({ criterion: 'maxIncome', status: 'INELIGIBLE', detail: `Self-declared income ${selfDeclared.income} exceeds limit ${criteria.maxIncome}` });
    }
  }

  if (criteria.categories?.length) {
    if (!selfDeclared.category) {
      checks.push({ criterion: 'categories', status: 'PENDING_DATA', detail: 'No self-declared category provided' });
    } else if (criteria.categories.includes(selfDeclared.category)) {
      checks.push({ criterion: 'categories', status: 'PENDING_DATA', detail: `Self-declared category ${selfDeclared.category} in scope — pending document verification` });
    } else {
      checks.push({ criterion: 'categories', status: 'INELIGIBLE', detail: `Self-declared category ${selfDeclared.category} out of scope` });
    }
  }

  snapshot.checks = checks;

  const status: EligibilityStatus = checks.some((c) => c.status === 'INELIGIBLE')
    ? 'INELIGIBLE'
    : checks.some((c) => c.status === 'SOURCE_ERROR')
      ? 'SOURCE_ERROR'
      : checks.some((c) => c.status === 'PENDING_DATA')
        ? 'PENDING_DATA'
        : 'ELIGIBLE';

  return { status, checks, snapshot };
}

export function parseCriteria(raw: unknown): EligibilityCriteria {
  if (raw == null) return {};
  if (typeof raw === 'object') return raw as EligibilityCriteria;
  try {
    return JSON.parse(String(raw)) as EligibilityCriteria;
  } catch {
    return {};
  }
}
