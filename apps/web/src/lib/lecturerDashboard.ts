/** Shared types for Lecturer LMS dashboard (mirrors API response). */

export type LecturerDashboard = {
  context: {
    academicYearId: number | null;
    academicYearLabel: string | null;
    programId: number | null;
    programName: string | null;
    semesterId: number | null;
    semesterLabel: string | null;
    courseCount: number;
    multiContext: boolean;
  };
  metrics: {
    myCourses: number;
    activeAssessments: number;
    pendingEvaluations: number;
    academicPlans: { ready: number; total: number };
  };
  courses: LecturerCourseCard[];
  attentionItems: Array<{
    kind: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    count?: number;
    courseId?: number;
    courseCode?: string;
    href: string;
  }>;
  upcoming: Array<{
    at: string;
    kind: string;
    title: string;
    courseId?: number;
    courseCode?: string;
    href: string;
  }>;
  assessments: {
    quizzes: { active: number; completed: number };
    assignments: { active: number; pendingEvaluation: number };
    surveys: { active: number; responses: number };
  };
  academicPlanning: {
    lessonPlans: { created: number; expected: number };
    academicMapping: { finalized: number; draft: number; missing: number };
    gapAnalysis: { inProgress: number; completed: number };
    beyondSyllabus: { inProgress: number; completed: number };
    coEvaluation: { draft: number; finalized: number };
    attainment: { committed: number; redCos: number };
  };
  engagement: {
    quizAttempts: number;
    assignmentSubmissions: number;
    surveyResponses: number;
  };
  recentActivity: Array<{
    at: string;
    kind: string;
    summary: string;
    href?: string;
  }>;
  nextClass?: {
    date: string;
    startTime: string;
    endTime: string;
    courseName: string | null;
    className: string;
    roomName: string | null;
    courseId: number | null;
    academicClassId: number;
    slotId: number | null;
    overrideId?: number | null;
    attendanceStatus: string;
  } | null;
};

export type LecturerCourseCard = {
  courseId: number;
  code: string;
  name: string;
  programName?: string | null;
  programCode?: string | null;
  semesterLabel?: string | null;
  academicYearLabel?: string | null;
  departmentName?: string | null;
  source: 'ASSIGNMENT' | 'INFERRED' | 'BOTH';
  modules: {
    lessonPlan: {
      status: string | null;
      planId?: number;
      completedUnits?: number;
      totalUnits?: number;
      progressPercent?: number;
      statusLabel?: string | null;
    };
    quizzes: { active: number };
    assignments: { active: number; pendingEvaluation: number };
    surveys: { active: number };
    academicMapping: { status: string; mappingId?: number };
    gapAnalysis: { status: string | null; openGaps: number; analysisId?: number };
    beyondSyllabus: { status: string | null; planId?: number };
    coEvaluation: { status: string | null; evaluationId?: number };
    attainment: { status: string | null; runId?: number; red: number };
  };
};
