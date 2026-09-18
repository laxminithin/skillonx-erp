import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  ClipboardList,
  GitMerge,
  GraduationCap,
  ListChecks,
  PenLine,
  ScanSearch,
  Sparkles,
  LibraryBig,
  FileStack,
  Activity,
  CalendarCheck2,
} from 'lucide-react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { api } from '../lib/api';
import type { LecturerCourseCard, LecturerDashboard } from '../lib/lecturerDashboard';
import { Button, EmptyState, PageHeader, Skeleton, Surface } from '../components/ui';

function courseMeta(c: LecturerCourseCard) {
  return [c.code, c.programCode || c.programName, c.semesterLabel].filter(Boolean).join(' · ');
}

export function CoursesPage() {
  useDocumentTitle('Courses');
  const [courses, setCourses] = useState<LecturerCourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<LecturerDashboard>('/api/dashboard/lecturer')
      .then((d) => setCourses(d.courses || []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Courses"
        subtitle="Course workspaces for teaching, assessments, and academic quality."
      />
      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : !courses.length ? (
        <EmptyState
          icon={<GraduationCap size={22} />}
          title="No courses yet"
          body="Courses appear when you are assigned subjects or create academic work linked to a subject."
        />
      ) : (
        <Surface padded={false}>
          {courses.map((c) => (
            <div key={c.courseId} className="border-b border-border px-5 py-4 last:border-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-ink">{c.name}</h2>
                  <p className="mt-0.5 text-xs text-ink-muted">{courseMeta(c)}</p>
                </div>
                <Link to={`/courses/${c.courseId}`}>
                  <Button variant="secondary">
                    Open Course <ArrowRight size={14} />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </Surface>
      )}
    </div>
  );
}

export function CourseWorkspacePage() {
  const { courseId } = useParams();
  const id = Number(courseId);
  const [course, setCourse] = useState<LecturerCourseCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [classStudents, setClassStudents] = useState<
    Array<{ id: number; usn: string; name: string; className: string; classId?: number }>
  >([]);

  useDocumentTitle(course?.name || 'Course');

  useEffect(() => {
    if (!Number.isFinite(id)) {
      setError('Course not found');
      setLoading(false);
      return;
    }
    api<LecturerDashboard>('/api/dashboard/lecturer')
      .then((d) => {
        const found = (d.courses || []).find((c) => c.courseId === id) ?? null;
        setCourse(found);
        if (!found) setError('Course not found or not available in your workspace.');
        if (found) {
          api<{ students: Array<{ id: number; usn: string; name: string; className: string; classId?: number }> }>(
            `/api/classes/course/${id}/students`,
          )
            .then((r) => setClassStudents(r.students || []))
            .catch(() => setClassStudents([]));
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load course'))
      .finally(() => setLoading(false));
  }, [id]);

  const m = course?.modules;

  const links = m
    ? [
        {
          label: 'Overview',
          description: 'Course summary and status',
          to: `/courses/${id}`,
          icon: GraduationCap,
          current: true,
        },
        {
          label: 'Lesson Plan',
          description:
            m.lessonPlan.planId && m.lessonPlan.totalUnits
              ? `${m.lessonPlan.completedUnits ?? 0} / ${m.lessonPlan.totalUnits} sessions`
              : m.lessonPlan.status || 'Not created',
          to: m.lessonPlan.planId ? `/lesson-plans/${m.lessonPlan.planId}` : '/lesson-plans/create',
          icon: BookOpen,
        },
        {
          label: 'Quizzes',
          description: `${m.quizzes.active} active`,
          to: '/quizzes',
          icon: ListChecks,
        },
        {
          label: 'Assignments',
          description:
            m.assignments.pendingEvaluation > 0
              ? `${m.assignments.pendingEvaluation} pending evaluation`
              : `${m.assignments.active} active`,
          to: '/assignments',
          icon: PenLine,
        },
        {
          label: 'Attendance',
          description: classStudents.length
            ? `${classStudents.length} students from class roll`
            : 'Mark class-derived attendance',
          to: `/courses/${id}/attendance${
            classStudents[0]?.classId ? `?classId=${classStudents[0].classId}` : ''
          }`,
          icon: CalendarCheck2,
        },
        {
          label: 'Surveys',
          description: `${m.surveys.active} active`,
          to: '/surveys',
          icon: ClipboardList,
        },
        {
          label: 'Academic Mapping',
          description: m.academicMapping.status.replaceAll('_', ' '),
          to: m.academicMapping.mappingId
            ? `/copo/mappings/${m.academicMapping.mappingId}`
            : '/copo/create',
          icon: GitMerge,
        },
        {
          label: 'Gap Analysis',
          description: m.gapAnalysis.status
            ? `${m.gapAnalysis.openGaps} open gaps`
            : 'Not created',
          to: m.gapAnalysis.analysisId
            ? `/gap-analysis/${m.gapAnalysis.analysisId}`
            : '/gap-analysis/create',
          icon: ScanSearch,
        },
        {
          label: 'Beyond Syllabus',
          description: m.beyondSyllabus.status || 'Not created',
          to: m.beyondSyllabus.planId
            ? `/beyond-syllabus/${m.beyondSyllabus.planId}`
            : '/beyond-syllabus/create',
          icon: Sparkles,
        },
        {
          label: 'CO Evaluation',
          description: m.coEvaluation.status || 'Not created',
          to: m.coEvaluation.evaluationId
            ? `/co-evaluation/${m.coEvaluation.evaluationId}`
            : '/co-evaluation/create',
          icon: ClipboardCheck,
        },
        {
          label: 'Attainment & Improvement',
          description: m.attainment?.runId
            ? m.attainment.red
              ? `${m.attainment.red} CO${m.attainment.red === 1 ? '' : 's'} need improvement`
              : 'Calculated'
            : 'Calculate from assessments',
          to: m.attainment?.runId ? `/attainment/runs/${m.attainment.runId}` : '/attainment/calculate',
          icon: Activity,
        },
        {
          label: 'Previous Year QPs',
          description: 'Digital library',
          to: `/previous-year-papers?courseCode=${encodeURIComponent(course.code)}`,
          icon: LibraryBig,
        },
        {
          label: 'Course textbooks',
          description: 'Prescribed sources for schemes and solutions',
          to: '/course-textbooks',
          icon: BookOpen,
        },
        {
          label: 'Internal Question Papers',
          description: 'Create IA / CIE paper',
          to: '/internal-question-papers/create',
          icon: FileStack,
        },
      ]
    : [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/courses" className="hover:text-accent">
            Courses
          </Link>
        }
        title={loading ? 'Course' : course?.name || 'Course'}
        subtitle={course ? courseMeta(course) : 'Course workspace'}
      />

      {error ? <p className="mb-4 text-sm text-danger">{error}</p> : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : course ? (
        <>
        <div className="divide-y divide-border border-y border-border">
          {links.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="flex items-center gap-3 py-3.5 transition hover:bg-surface-muted/60"
            >
              <item.icon size={18} className="shrink-0 text-ink-muted" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.label}</p>
                <p className="text-xs capitalize text-ink-muted">{item.description}</p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-ink-muted" />
            </Link>
          ))}
        </div>
        {classStudents.length ? (
          <div className="mt-8">
            <h2 className="mb-2 text-sm font-semibold">Students</h2>
            <p className="mb-3 text-xs text-ink-muted">
              Derived from approved class enrollments. This subject does not have a separate student list.
            </p>
            <Surface padded={false}>
              {classStudents.map((s) => (
                <div key={s.id} className="flex justify-between border-b border-border px-5 py-3 text-sm last:border-0">
                  <span className="font-medium">{s.usn}</span>
                  <span>{s.name}</span>
                  <span className="text-ink-muted">{s.className}</span>
                </div>
              ))}
            </Surface>
          </div>
        ) : null}
        </>
      ) : null}
    </div>
  );
}
