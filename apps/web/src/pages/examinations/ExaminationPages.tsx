import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';

type Exam = {
  id: number;
  name: string;
  code: string;
  examType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  subjects: Array<{
    id: number;
    courseName: string;
    courseCode: string;
    examDate: string | null;
    startTime: string | null;
    status: string;
  }>;
};

type Duty = {
  dutyDate: string;
  startTime: string;
  roomCode: string;
  courseName: string;
  role: string;
  examName: string;
};

type MarkRow = {
  studentId: number;
  studentName: string;
  usn: string;
  marks: number | null;
  status: string;
};

type CoeDashboard = {
  kpis: Record<string, number>;
  examsByStatus: Record<string, number>;
  eligibilityByStatus: Record<string, number>;
  marksSheetsByStatus: Record<string, number>;
  revaluationsByStatus: Record<string, number>;
  recentExams: Exam[];
  upcomingSubjects: Array<{
    id: number;
    examId: number;
    examName: string;
    courseCode: string | null;
    courseName: string | null;
    examDate: string | null;
    startTime: string | null;
    status: string;
    seatsLocked: boolean;
  }>;
};

type QuestionPaperStatus = {
  total: number;
  byStatus: Record<string, number>;
  papers: Array<{
    id: number;
    title: string;
    status: string;
    examType: string;
    examDate: string | null;
    courseCode: string | null;
    courseName: string | null;
    totalMarks: number | null;
    durationMinutes: number | null;
  }>;
};

function statusList(items: Record<string, number>) {
  const entries = Object.entries(items);
  if (!entries.length) return <p className="text-sm text-ink-muted">No records yet.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <span key={key} className="rounded-full border border-border px-3 py-1 text-xs text-ink-secondary">
          {key}: <span className="font-semibold text-ink">{value}</span>
        </span>
      ))}
    </div>
  );
}

export function CoeDashboardPage() {
  useDocumentTitle('COE Dashboard');
  const [dashboard, setDashboard] = useState<CoeDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<CoeDashboard>('/api/examinations/dashboard')
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!dashboard) return <p className="text-danger">COE dashboard is unavailable.</p>;

  const kpis = [
    ['Active exams', dashboard.kpis.activeExams],
    ['Scheduled subjects', dashboard.kpis.scheduledSubjects],
    ['Unscheduled subjects', dashboard.kpis.unscheduledSubjects],
    ['Pending eligibility', dashboard.kpis.pendingEligibility],
    ['Locked marks sheets', dashboard.kpis.lockedMarksSheets],
    ['Unlocked marks sheets', dashboard.kpis.unlockedMarksSheets],
    ['Pending revaluations', dashboard.kpis.pendingRevaluations],
    ['Question papers ready', dashboard.kpis.questionPapersReady],
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="COE Dashboard" subtitle="Exam office operations, readiness, and result controls" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value]) => (
          <Surface key={label}>
            <p className="text-sm text-ink-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{value ?? 0}</p>
          </Surface>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface>
          <p className="mb-3 font-medium">Upcoming timetable</p>
          <div className="space-y-3">
            {dashboard.upcomingSubjects.map((subject) => (
              <div key={subject.id} className="rounded-[var(--radius-md)] border border-border p-3">
                <p className="font-medium">{subject.courseName || subject.courseCode || 'Subject'}</p>
                <p className="text-sm text-ink-muted">
                  {subject.examName} · {subject.examDate ? formatDate(subject.examDate) : 'Unscheduled'} ·{' '}
                  {subject.startTime ? String(subject.startTime).slice(0, 5) : 'Time pending'} · {subject.status}
                </p>
              </div>
            ))}
            {dashboard.upcomingSubjects.length === 0 ? <p className="text-sm text-ink-muted">No upcoming exam subjects.</p> : null}
          </div>
        </Surface>
        <Surface>
          <p className="mb-3 font-medium">Operational status</p>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-ink-muted">Exams</p>
              {statusList(dashboard.examsByStatus)}
            </div>
            <div>
              <p className="mb-2 text-sm text-ink-muted">Eligibility</p>
              {statusList(dashboard.eligibilityByStatus)}
            </div>
            <div>
              <p className="mb-2 text-sm text-ink-muted">Marks sheets</p>
              {statusList(dashboard.marksSheetsByStatus)}
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function CoeQuestionPapersPage() {
  useDocumentTitle('Question Papers');
  const [status, setStatus] = useState<QuestionPaperStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<QuestionPaperStatus>('/api/examinations/question-papers/status')
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Question Papers" subtitle="Confidential readiness tracking without exposing paper contents" />
      <Surface>
        <p className="mb-3 font-medium">Readiness by status</p>
        {statusList(status?.byStatus ?? {})}
      </Surface>
      <div className="grid gap-3">
        {(status?.papers ?? []).map((paper) => (
          <Surface key={paper.id}>
            <p className="font-medium">{paper.title}</p>
            <p className="text-sm text-ink-muted">
              {paper.courseCode || paper.courseName || 'Course'} · {paper.examType} · {paper.status}
              {paper.examDate ? ` · ${formatDate(paper.examDate)}` : ''}
            </p>
          </Surface>
        ))}
        {status?.papers.length === 0 ? <p className="text-sm text-ink-muted">No internal question papers found.</p> : null}
      </div>
    </div>
  );
}

export function CoeStatusPage({ title, subtitle }: { title: string; subtitle: string }) {
  useDocumentTitle(title);
  const [dashboard, setDashboard] = useState<CoeDashboard | null>(null);
  const [revaluations, setRevaluations] = useState<{ requests: Array<{ id: number; studentName: string; usn: string; courseCode: string; requestType: string; status: string }> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<CoeDashboard>('/api/examinations/dashboard').then(setDashboard),
      api<{ requests: Array<{ id: number; studentName: string; usn: string; courseCode: string; requestType: string; status: string }> }>('/api/examinations/revaluation').then(setRevaluations).catch(() => null),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface>
          <p className="mb-3 font-medium">Exam status</p>
          {statusList(dashboard?.examsByStatus ?? {})}
        </Surface>
        <Surface>
          <p className="mb-3 font-medium">Eligibility status</p>
          {statusList(dashboard?.eligibilityByStatus ?? {})}
        </Surface>
        <Surface>
          <p className="mb-3 font-medium">Marks status</p>
          {statusList(dashboard?.marksSheetsByStatus ?? {})}
        </Surface>
        <Surface>
          <p className="mb-3 font-medium">Revaluation status</p>
          {statusList(dashboard?.revaluationsByStatus ?? {})}
        </Surface>
      </div>
      <Surface>
        <p className="mb-3 font-medium">Recent revaluation requests</p>
        <div className="space-y-2">
          {(revaluations?.requests ?? []).slice(0, 8).map((request) => (
            <div key={request.id} className="flex flex-col gap-1 border-t border-border py-2 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium">{request.studentName} · {request.usn}</span>
              <span className="text-sm text-ink-muted">{request.courseCode} · {request.requestType} · {request.status}</span>
            </div>
          ))}
          {revaluations?.requests.length === 0 ? <p className="text-sm text-ink-muted">No revaluation requests.</p> : null}
        </div>
      </Surface>
    </div>
  );
}

export function ExaminationsAdminPage({ basePath = '/examinations' }: { basePath?: string }) {
  useDocumentTitle('Examinations');
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ exams: Exam[] }>('/api/examinations')
      .then((d) => setExams(d.exams))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Examinations" subtitle="Schedule exams, eligibility, rooms, marks, and results" />
      <div className="grid gap-3">
        {exams.map((e) => (
          <Surface key={e.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{e.name}</p>
              <p className="text-sm text-ink-muted">
                {e.code} · {e.examType} · {e.status}
              </p>
              {e.startDate && (
                <p className="text-sm text-ink-muted">
                  {formatDate(e.startDate)}
                  {e.endDate ? ` – ${formatDate(e.endDate)}` : ''}
                </p>
              )}
            </div>
            <Button size="sm" onClick={() => navigate(`${basePath}/${e.id}`)}>
              Manage
            </Button>
          </Surface>
        ))}
        {exams.length === 0 && <p className="text-sm text-ink-muted">No examinations created yet.</p>}
      </div>
    </div>
  );
}

export function ExaminationDetailPage({ basePath = '/examinations' }: { basePath?: string }) {
  const { examId } = useParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  useDocumentTitle(exam?.name ?? 'Examination');

  const load = () => {
    api<Exam>(`/api/examinations/${examId}`)
      .then(setExam)
      .finally(() => setLoading(false));
  };

  useEffect(load, [examId]);

  const run = async (path: string, label: string) => {
    try {
      await api(`/api/examinations/${examId}${path}`, { method: 'POST' });
      alert(`${label} completed`);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!exam) return <p className="text-danger">Exam not found</p>;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={exam.name} subtitle={`${exam.code} · ${exam.status}`} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => run('/eligibility/compute', 'Eligibility computation')}>
          Compute eligibility
        </Button>
        <Button size="sm" variant="secondary" onClick={() => run('/results/process', 'Result processing')}>
          Process results
        </Button>
        <Button size="sm" onClick={() => run('/results/publish', 'Result publication')}>
          Publish results
        </Button>
      </div>
      <Surface>
        <p className="mb-3 font-medium">Scheduled subjects</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-ink-muted">
              <tr>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exam.subjects.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="py-2 pr-4">
                    {s.courseName}
                    <div className="text-ink-muted">{s.courseCode}</div>
                  </td>
                  <td className="py-2 pr-4">{s.examDate ? formatDate(s.examDate) : '—'}</td>
                  <td className="py-2 pr-4">{s.startTime ? String(s.startTime).slice(0, 5) : '—'}</td>
                  <td className="py-2">
                    <Link className="text-accent hover:underline" to={`${basePath}/subjects/${s.id}/marks`}>
                      Marks
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

export function ExamMarksEntryPage() {
  const { examSubjectId } = useParams();
  const [rows, setRows] = useState<MarkRow[]>([]);
  const [sheetStatus, setSheetStatus] = useState('');
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Marks Entry');

  const load = () => {
    api<{ marks: MarkRow[]; sheet: { status: string; locked: boolean } }>(
      `/api/examinations/subjects/${examSubjectId}/marks`,
    )
      .then((d) => {
        setRows(d.marks);
        setSheetStatus(d.sheet.status);
        setLocked(d.sheet.locked);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [examSubjectId]);

  const save = async () => {
    await api(`/api/examinations/subjects/${examSubjectId}/marks`, {
      method: 'PUT',
      body: JSON.stringify({
        entries: rows.map((r) => ({ studentId: r.studentId, marks: r.marks, status: r.status })),
      }),
    });
    load();
  };

  const action = async (path: string) => {
    await api(`/api/examinations/subjects/${examSubjectId}/marks/${path}`, { method: 'POST' });
    load();
  };

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Marks Entry" subtitle={`Sheet: ${sheetStatus}${locked ? ' (locked)' : ''}`} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={save} disabled={locked}>
          Save
        </Button>
        <Button size="sm" variant="secondary" onClick={() => action('submit')} disabled={locked}>
          Submit
        </Button>
        <Button size="sm" variant="secondary" onClick={() => action('verify')} disabled={locked}>
          Verify
        </Button>
        <Button size="sm" variant="secondary" onClick={() => action('lock')} disabled={locked}>
          Lock
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-[640px] w-full text-sm">
          <thead className="bg-surface-2 text-left text-ink-muted">
            <tr>
              <th className="px-3 py-2">USN</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Marks</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studentId} className="border-t border-border">
                <td className="px-3 py-2">{r.usn}</td>
                <td className="px-3 py-2">{r.studentName}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    className="w-20 rounded border border-border bg-surface px-2 py-1"
                    value={r.marks ?? ''}
                    disabled={locked}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.studentId === r.studentId ? { ...x, marks: e.target.value ? Number(e.target.value) : null } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    className="rounded border border-border bg-surface px-2 py-1"
                    value={r.status}
                    disabled={locked}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) => (x.studentId === r.studentId ? { ...x, status: e.target.value } : x)),
                      )
                    }
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="MALPRACTICE">Malpractice</option>
                    <option value="WITHHELD">Withheld</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FacultyExamDutiesPage() {
  useDocumentTitle('Exam Duties');
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ duties: Duty[] }>('/api/examinations/faculty/my-duties')
      .then((d) => setDuties(d.duties))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Exam Duties" subtitle="Invigilation and examination responsibilities" />
      {duties.length === 0 ? (
        <p className="text-sm text-ink-muted">No examination duties assigned.</p>
      ) : (
        <div className="grid gap-3">
          {duties.map((d, i) => (
            <Surface key={i}>
              <p className="font-medium">{d.courseName}</p>
              <p className="text-sm text-ink-muted">
                {formatDate(d.dutyDate)} · {String(d.startTime).slice(0, 5)} · Room {d.roomCode} · {d.role}
              </p>
              <p className="text-sm text-ink-muted">{d.examName}</p>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
