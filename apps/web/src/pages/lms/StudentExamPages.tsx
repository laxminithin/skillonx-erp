import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { StatusPill, statusToneFor, StudentEmpty } from './studentUi';

type UpcomingExam = {
  examId: number;
  examName: string;
  examType: string;
  courseCode: string;
  courseName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  eligibilityStatus: string;
  room: string | null;
  seatNumber: string | null;
};

type EligibilityRow = {
  examName: string;
  courseCode: string;
  courseName: string;
  status: string;
  reasonDetail?: string | null;
  examDate?: string | null;
};

type ResultSemester = {
  examName: string;
  semesterLabel: string;
  sgpa: number | null;
  status: string;
  subjects: Array<{
    courseCode: string;
    courseName: string;
    internalMarks: number | null;
    externalMarks: number | null;
    totalMarks: number | null;
    grade: string;
    resultStatus: string;
  }>;
};

type AcademicRecord = {
  cgpa: number | null;
  totalCreditsEarned: number;
  semesters: Array<{ semesterLabel: string; sgpa: number | null; creditsEarned: number | null }>;
  backlogs: Array<{ code: string; name: string }>;
};

type HallTicket = {
  institution: string;
  student: { name: string; usn: string; program: string; branch: string; semester: string };
  exam: { name: string; code: string };
  subjects: Array<{ courseCode: string; courseName: string; examDate: string; startTime: string; room: string | null; status: string }>;
  withheldSubjects: Array<{ courseCode: string; courseName: string; reason: string }>;
};

function eligTone(status: string): 'success' | 'warning' | 'danger' | 'muted' {
  if (status === 'ELIGIBLE' || status === 'CONDONED') return 'success';
  if (status === 'WITHHELD') return 'warning';
  if (status === 'NOT_ELIGIBLE') return 'danger';
  return 'muted';
}

export function StudentExaminationsPage() {
  useDocumentTitle('Examinations');
  const navigate = useNavigate();
  const [upcoming, setUpcoming] = useState<UpcomingExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ upcoming: UpcomingExam[] }>('/api/student/exams/upcoming')
      .then((d) => setUpcoming(d.upcoming ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (error) return <p className="text-sm text-danger">{error}</p>;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Examinations"
        subtitle="Upcoming exams, hall ticket, eligibility, and results"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/lms/exams/eligibility')}>
              Eligibility
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate('/lms/exams/hall-ticket')}>
              Hall Ticket
            </Button>
            <Button size="sm" onClick={() => navigate('/lms/exams/results')}>
              Results
            </Button>
          </div>
        }
      />
      {upcoming.length === 0 ? (
        <StudentEmpty title="No upcoming exams" body="Scheduled exams will appear here." />
      ) : (
        <div className="grid gap-3">
          {upcoming.map((e, i) => (
            <Surface key={`${e.examId}-${e.courseCode}-${i}`} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">{e.courseName}</p>
                <p className="text-sm text-ink-muted">
                  {e.courseCode} · {e.examName}
                </p>
                <p className="mt-1 text-sm">
                  {formatDate(e.examDate)} · {String(e.startTime).slice(0, 5)}
                  {e.room ? ` · ${e.room}` : ''}
                </p>
              </div>
              <StatusPill tone={eligTone(e.eligibilityStatus)}>{e.eligibilityStatus}</StatusPill>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentExamEligibilityPage() {
  useDocumentTitle('Exam Eligibility');
  const [rows, setRows] = useState<EligibilityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ eligibility: EligibilityRow[] }>('/api/student/exams/eligibility')
      .then((d) => setRows(d.eligibility))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Exam Eligibility" subtitle="Subject-wise eligibility for upcoming examinations" />
      {rows.length === 0 ? (
        <StudentEmpty title="No eligibility records" body="Eligibility will appear after the exam cell processes your subjects." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-surface-2 text-left text-ink-muted">
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Exam</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 sm:table-cell">Reason</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{r.courseName}</div>
                    <div className="text-ink-muted">{r.courseCode}</div>
                  </td>
                  <td className="px-4 py-3">{r.examName}</td>
                  <td className="px-4 py-3">
                    <StatusPill tone={eligTone(r.status)}>{r.status}</StatusPill>
                  </td>
                  <td className="hidden px-4 py-3 text-ink-muted sm:table-cell">{r.reasonDetail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function StudentHallTicketPage() {
  useDocumentTitle('Hall Ticket');
  const [ticket, setTicket] = useState<HallTicket | null>(null);
  const [examId, setExamId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ upcoming: UpcomingExam[] }>('/api/student/exams/upcoming')
      .then((d) => {
        const list = d.upcoming ?? [];
        if (list[0]) setExamId(list[0].examId);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!examId) return;
    api<HallTicket>(`/api/student/hall-ticket?examId=${examId}`).then(setTicket).catch(() => setTicket(null));
  }, [examId]);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!ticket) return <StudentEmpty title="Hall ticket unavailable" body="No active examination found." />;

  return (
    <div className="animate-fade-in space-y-6 print:space-y-4">
      <PageHeader
        title="Hall Ticket"
        subtitle={ticket.exam.name}
        actions={
          <Button size="sm" onClick={() => window.print()}>
            Print
          </Button>
        }
      />
      <Surface className="space-y-4 print:border-0 print:shadow-none">
        <div className="text-center">
          <p className="text-lg font-semibold">{ticket.institution}</p>
          <p className="text-sm text-ink-muted">Hall Ticket / Admit Card</p>
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <p>
            <span className="text-ink-muted">Name:</span> {ticket.student.name}
          </p>
          <p>
            <span className="text-ink-muted">USN:</span> {ticket.student.usn}
          </p>
          <p>
            <span className="text-ink-muted">Program:</span> {ticket.student.program}
          </p>
          <p>
            <span className="text-ink-muted">Branch:</span> {ticket.student.branch}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-ink-muted">
                <th className="py-2">Subject</th>
                <th className="py-2">Date</th>
                <th className="py-2">Time</th>
                <th className="py-2">Room</th>
              </tr>
            </thead>
            <tbody>
              {ticket.subjects.map((s, i) => (
                <tr key={i} className="border-b border-border/60">
                  <td className="py-2">{s.courseName}</td>
                  <td className="py-2">{formatDate(s.examDate)}</td>
                  <td className="py-2">{String(s.startTime).slice(0, 5)}</td>
                  <td className="py-2">{s.room ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {ticket.withheldSubjects.length > 0 && (
          <div className="rounded-lg border border-warning/30 bg-warning/5 p-3 text-sm">
            <p className="font-medium text-warning">Withheld / Ineligible subjects</p>
            <ul className="mt-2 list-disc pl-5">
              {ticket.withheldSubjects.map((s, i) => (
                <li key={i}>
                  {s.courseCode} — {s.reason}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Surface>
    </div>
  );
}

export function StudentExamResultsPage() {
  useDocumentTitle('Results');
  const navigate = useNavigate();
  const [results, setResults] = useState<ResultSemester[]>([]);
  const [record, setRecord] = useState<AcademicRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ results: ResultSemester[] }>('/api/student/results'),
      api<AcademicRecord>('/api/student/academic-record'),
    ])
      .then(([r, a]) => {
        setResults(r.results);
        setRecord(a);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Results"
        subtitle={record?.cgpa != null ? `CGPA: ${record.cgpa}` : 'Published semester results'}
        actions={
          <Button variant="secondary" size="sm" onClick={() => navigate('/lms/exams/academic-record')}>
            Academic Record
          </Button>
        }
      />
      {results.length === 0 ? (
        <StudentEmpty title="No published results" body="Results will appear here after official publication." />
      ) : (
        results.map((sem, i) => (
          <Surface key={i} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-semibold">{sem.semesterLabel}</p>
                <p className="text-sm text-ink-muted">{sem.examName}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums">{sem.sgpa ?? '—'}</p>
                <p className="text-xs text-ink-muted">SGPA</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-ink-muted">
                  <tr>
                    <th className="py-2">Subject</th>
                    <th className="py-2">IA</th>
                    <th className="py-2">SEE</th>
                    <th className="py-2">Total</th>
                    <th className="py-2">Grade</th>
                    <th className="py-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.subjects.map((s, j) => (
                    <tr key={j} className="border-t border-border/60">
                      <td className="py-2">
                        <div>{s.courseName}</div>
                        <div className="text-ink-muted">{s.courseCode}</div>
                      </td>
                      <td className="py-2 tabular-nums">{s.internalMarks ?? '—'}</td>
                      <td className="py-2 tabular-nums">{s.externalMarks ?? '—'}</td>
                      <td className="py-2 tabular-nums">{s.totalMarks ?? '—'}</td>
                      <td className="py-2">{s.grade}</td>
                      <td className="py-2">
                        <StatusPill tone={s.resultStatus === 'PASS' ? 'success' : 'danger'}>{s.resultStatus}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
        ))
      )}
    </div>
  );
}

export function StudentAcademicRecordPage() {
  useDocumentTitle('Academic Record');
  const [record, setRecord] = useState<AcademicRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<AcademicRecord>('/api/student/academic-record')
      .then(setRecord)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!record) return null;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Academic Record" subtitle="Semester-wise SGPA and cumulative CGPA" />
      <Surface className="flex flex-wrap gap-6">
        <div>
          <p className="text-xs uppercase text-ink-muted">CGPA</p>
          <p className="text-3xl font-semibold tabular-nums">{record.cgpa ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-ink-muted">Credits earned</p>
          <p className="text-3xl font-semibold tabular-nums">{record.totalCreditsEarned}</p>
        </div>
      </Surface>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {record.semesters.map((s, i) => (
          <Surface key={i}>
            <p className="font-medium">{s.semesterLabel}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{s.sgpa ?? '—'}</p>
            <p className="text-sm text-ink-muted">{s.creditsEarned ?? 0} credits</p>
          </Surface>
        ))}
      </div>
      {record.backlogs.length > 0 && (
        <Surface>
          <p className="font-medium">Backlog subjects</p>
          <ul className="mt-2 space-y-1 text-sm">
            {record.backlogs.map((b, i) => (
              <li key={i}>
                {b.code} — {b.name}
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </div>
  );
}

type RegCourse = { exam_subject_id: number; code: string; name: string; eligibility_status: string; registration_status: string | null };
type RegWindow = { windowId: number; examId: number; examName: string; examCode: string; closesAt: string | null; courses: RegCourse[] };

/**
 * Student examination registration (§2). Eligibility, windows and submission state are
 * server-authoritative; the browser only selects among eligible courses and reads back
 * the submitted registration. Manipulated course IDs remain server-denied.
 */
export function StudentExamRegistrationPage() {
  useDocumentTitle('Exam Registration');
  const [windows, setWindows] = useState<RegWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [message, setMessage] = useState('');

  const load = () =>
    api<{ windows: RegWindow[] }>('/api/student/examination-registration')
      .then((d) => setWindows(d.windows))
      .catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to load registration'))
      .finally(() => setLoading(false));
  useEffect(() => {
    void load();
  }, []);

  const toggle = (windowId: number, subjectId: number) =>
    setSelected((s) => {
      const cur = s[windowId] ?? [];
      return { ...s, [windowId]: cur.includes(subjectId) ? cur.filter((x) => x !== subjectId) : [...cur, subjectId] };
    });

  const submit = async (w: RegWindow) => {
    const ids = selected[w.windowId] ?? [];
    if (!ids.length) {
      setMessage('Select at least one eligible course.');
      return;
    }
    try {
      await api(`/api/student/examination-registration/${w.windowId}`, {
        method: 'POST',
        body: JSON.stringify({ examSubjectIds: ids, attemptType: 'REGULAR' }),
      });
      setMessage('Registration submitted. Awaiting COE review.');
      setSelected((s) => ({ ...s, [w.windowId]: [] }));
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Submission failed');
    }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Exam Registration" subtitle="Register for open examination windows in the courses you are eligible for" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}
      {windows.length === 0 ? (
        <StudentEmpty title="No open registration windows" body="Registration opens here when the COE opens an examination window you are eligible for." />
      ) : (
        windows.map((w) => (
          <Surface key={w.windowId}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="font-semibold">{w.examName}</h2>
                <p className="text-sm text-ink-muted">{w.examCode}{w.closesAt ? ` · closes ${formatDate(w.closesAt)}` : ''}</p>
              </div>
              <Button size="sm" onClick={() => submit(w)}>Submit registration</Button>
            </div>
            <div className="mt-3 space-y-2">
              {w.courses.map((c) => {
                const submitted = c.registration_status != null;
                const checked = (selected[w.windowId] ?? []).includes(c.exam_subject_id);
                return (
                  <label key={c.exam_subject_id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-border px-3 py-2 text-sm">
                    <span className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={submitted}
                        checked={submitted || checked}
                        onChange={() => toggle(w.windowId, c.exam_subject_id)}
                        aria-label={`Select ${c.code}`}
                      />
                      <span className="font-medium">{c.code}</span> · {c.name}
                    </span>
                    <span className="flex items-center gap-2">
                      <StatusPill tone={statusToneFor(c.eligibility_status)}>{c.eligibility_status}</StatusPill>
                      {submitted ? <StatusPill tone={statusToneFor(c.registration_status!)}>{c.registration_status}</StatusPill> : null}
                    </span>
                  </label>
                );
              })}
              {w.courses.length === 0 ? <p className="text-sm text-ink-muted">No eligible courses for this window.</p> : null}
            </div>
          </Surface>
        ))
      )}
    </div>
  );
}
