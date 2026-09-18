/**
 * Pure helpers for lecturer dashboard aggregation — unit-tested without DB.
 */

export type AttentionSeverity = 'high' | 'medium' | 'low';

export type AttentionItemInput = {
  kind: string;
  severity: AttentionSeverity;
  title: string;
  count?: number;
  courseId?: number | null;
  courseCode?: string | null;
  href: string;
};

export type UpcomingItemInput = {
  at: string;
  kind: string;
  title: string;
  courseId?: number | null;
  courseCode?: string | null;
  href: string;
};

/** Faculty isolation: only the owner's id may appear in scoped queries. */
export function facultyScopeFilter(
  role: string,
  facultyUserId: number,
): { createdBy: number | null } {
  if (role === 'SUPER_ADMIN' || role === 'COLLEGE_ADMIN') {
    return { createdBy: null };
  }
  return { createdBy: facultyUserId };
}

export function mapMappingStatus(dbStatus?: string | null): 'MISSING' | 'DRAFT' | 'FINALIZED' | 'IN_PROGRESS' {
  if (!dbStatus) return 'MISSING';
  const s = String(dbStatus).toUpperCase();
  if (s === 'APPROVED' || s === 'SUBMITTED' || s === 'FINALIZED') return 'FINALIZED';
  if (s === 'NEEDS_REVISION') return 'IN_PROGRESS';
  if (s === 'DRAFT' || s === 'NOT_STARTED') return 'DRAFT';
  return 'DRAFT';
}

export function isActiveAssessmentStatus(effective: string) {
  return effective === 'ACTIVE';
}

export function countReadyPlans(params: {
  courseCount: number;
  lessonPlansCreated: number;
  mappingsFinalized: number;
  gapCompleted: number;
  cbsCompleted: number;
  coEvalFinalized: number;
}) {
  const totalSlots = Math.max(params.courseCount, 0) * 5;
  const ready =
    Math.min(params.lessonPlansCreated, params.courseCount) +
    Math.min(params.mappingsFinalized, params.courseCount) +
    Math.min(params.gapCompleted, params.courseCount) +
    Math.min(params.cbsCompleted, params.courseCount) +
    Math.min(params.coEvalFinalized, params.courseCount);
  return { ready, total: totalSlots || 0 };
}

export function sortAttentionItems(items: AttentionItemInput[]) {
  const rank: Record<AttentionSeverity, number> = { high: 0, medium: 1, low: 2 };
  return [...items].sort((a, b) => {
    const d = rank[a.severity] - rank[b.severity];
    if (d !== 0) return d;
    return (b.count ?? 0) - (a.count ?? 0);
  });
}

export function sortUpcomingItems(items: UpcomingItemInput[], limit = 8) {
  return [...items]
    .filter((i) => i.at)
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(0, limit);
}

export function resolveAcademicContext(rows: Array<{
  academicYearId?: number | null;
  academicYearLabel?: string | null;
  programId?: number | null;
  programName?: string | null;
  semesterId?: number | null;
  semesterLabel?: string | null;
}>) {
  const years = new Set(rows.map((r) => r.academicYearId).filter(Boolean));
  const programs = new Set(rows.map((r) => r.programId).filter(Boolean));
  const semesters = new Set(rows.map((r) => r.semesterId).filter(Boolean));
  const multiContext = years.size > 1 || programs.size > 1 || semesters.size > 1;

  const first = rows.find((r) => r.academicYearId || r.programId || r.semesterId) ?? rows[0];

  return {
    academicYearId: !multiContext && years.size === 1 ? (first?.academicYearId ?? null) : null,
    academicYearLabel:
      !multiContext && years.size === 1 ? (first?.academicYearLabel ?? null) : null,
    programId: !multiContext && programs.size === 1 ? (first?.programId ?? null) : null,
    programName: !multiContext && programs.size === 1 ? (first?.programName ?? null) : null,
    semesterId: !multiContext && semesters.size === 1 ? (first?.semesterId ?? null) : null,
    semesterLabel:
      !multiContext && semesters.size === 1 ? (first?.semesterLabel ?? null) : null,
    multiContext,
  };
}

export function assertFacultyIsolation(
  ownerId: number,
  resourceOwnerIds: number[],
): boolean {
  return resourceOwnerIds.every((id) => id === ownerId);
}

export function pendingEvaluationTotal(parts: {
  assignmentPending: number;
  quizManual: number;
  coEvalDrafts: number;
  openGaps: number;
}) {
  return (
    Number(parts.assignmentPending || 0) +
    Number(parts.quizManual || 0) +
    Number(parts.coEvalDrafts || 0) +
    Number(parts.openGaps || 0)
  );
}
