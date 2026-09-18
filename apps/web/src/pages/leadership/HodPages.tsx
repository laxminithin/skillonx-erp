import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api } from '../../lib/api';
import { Button, PageHeader, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { AlertList, MetricGrid, Panel, SimpleTable } from './leadershipUi';

type HodDash = {
  department: { id: number; name: string; code: string | null };
  metrics: Record<string, number | null>;
  alerts: Array<{ severity: 'high' | 'medium' | 'low'; title: string; count: number }>;
};

function useResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let live = true;
    setLoading(true);
    api<T>(path)
      .then((d) => {
        if (live) {
          setData(d);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (live) setError(err.message || 'Unable to load');
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, [path]);
  return { data, error, loading };
}

export function HodDashboardPage() {
  useDocumentTitle('Department dashboard');
  const { data, error, loading } = useResource<HodDash>('/api/academic-leadership/hod/dashboard');
  const m = data?.metrics ?? {};
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={data?.department.name || 'Department'}
        subtitle="Live department operations — faculty, leave, continuity and teaching"
      />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <MetricGrid
        loading={loading}
        items={[
          { label: 'Faculty', value: m.facultyCount },
          { label: 'Students', value: m.studentCount },
          { label: 'Programs', value: m.programCount },
          { label: 'Classes today', value: m.todayClasses },
          { label: 'Faculty absent', value: m.facultyAbsentToday },
          { label: 'On leave today', value: m.facultyOnApprovedLeave },
          { label: 'Pending leave', value: m.pendingFacultyLeave },
          { label: 'Faculty attendance', value: m.facultyAttendancePct != null ? `${m.facultyAttendancePct}%` : null },
          { label: 'Academic progress', value: m.academicProgressPct != null ? `${m.academicProgressPct}%` : null },
          { label: 'Assessments', value: m.assessmentsPending },
          { label: 'Continuity exceptions', value: m.continuityExceptions },
          { label: 'Pending HOD actions', value: m.pendingHodActions },
        ]}
      />
      <Panel title="Needs attention">
        <AlertList alerts={data?.alerts ?? []} />
      </Panel>
    </div>
  );
}

type FacultyRow = {
  id: number;
  employeeNumber: string;
  name: string;
  designation: string | null;
  employmentStatus: string;
  departmentName?: string | null;
  weeklyHours: number;
  attendanceToday: string | null;
  currentLeave: { leaveType: string } | null;
  teaching: Array<{ courseCode: string; classCode: string }>;
};

export function HodFacultyPage() {
  useDocumentTitle('Department faculty');
  const { data, error, loading } = useResource<FacultyRow[]>('/api/academic-leadership/hod/faculty');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Department faculty" subtitle="Employment and teaching snapshot — not a full HR file" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <Surface className="h-40 animate-pulse">{' '}</Surface> : (
        <SimpleTable
          headers={['Employee', 'Designation', 'Status', 'Teaching', 'Hours', 'Today', 'Leave']}
          empty="No faculty in this department"
          rows={(data ?? []).map((f) => [
            <span key="n" className="block">
              <span className="font-medium">{f.name}</span>
              <span className="mt-0.5 block text-xs text-ink-muted">{f.employeeNumber}</span>
            </span>,
            f.designation || '—',
            f.employmentStatus,
            f.teaching.map((t) => t.courseCode).join(', ') || '—',
            f.weeklyHours,
            f.attendanceToday || '—',
            f.currentLeave?.leaveType || '—',
          ])}
        />
      )}
    </div>
  );
}

export function HodWorkloadPage() {
  useDocumentTitle('Faculty workload');
  const { data, error } = useResource<Array<{
    employeeId: number;
    name: string;
    designation: string | null;
    assignedSubjects: string[];
    classes: string[];
    weeklyTeachingLoad: number;
  }>>('/api/academic-leadership/hod/workload');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Faculty workload" subtitle="Calculated from timetable assignments — not a compliance verdict" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Faculty', 'Designation', 'Subjects', 'Classes', 'Weekly hours']}
        empty="No workload rows"
        rows={(data ?? []).map((r) => [r.name, r.designation || '—', r.assignedSubjects.join(', ') || '—', r.classes.join(', ') || '—', r.weeklyTeachingLoad])}
      />
    </div>
  );
}

export function HodAllocationPage() {
  useDocumentTitle('Teaching allocation');
  const { data, error } = useResource<Array<{
    id: number;
    facultyName: string;
    courseCode: string;
    courseName: string;
    className: string;
    classCode: string;
  }>>('/api/academic-leadership/hod/allocation');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Teaching allocation" subtitle="Canonical class-subject faculty assignments" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Faculty', 'Course', 'Class']}
        empty="No teaching allocations"
        rows={(data ?? []).map((r) => [r.facultyName, `${r.courseCode} ${r.courseName}`, `${r.classCode} ${r.className}`])}
      />
    </div>
  );
}

export function HodTimetablePage() {
  useDocumentTitle('Department timetable');
  const { data, error } = useResource<Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    className: string;
    courseCode: string;
    facultyName: string;
  }>>('/api/academic-leadership/hod/timetable');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Department timetable" subtitle="Effective timetable slots for this department" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Day', 'Time', 'Class', 'Course', 'Faculty']}
        empty="No timetable slots"
        rows={(data ?? []).map((r) => [days[r.dayOfWeek] ?? r.dayOfWeek, `${String(r.startTime).slice(0, 5)}–${String(r.endTime).slice(0, 5)}`, r.className, r.courseCode, r.facultyName || '—'])}
      />
    </div>
  );
}

export function HodAttendancePage() {
  useDocumentTitle('Faculty attendance');
  const { data, error } = useResource<Array<{
    employeeName: string;
    employeeNumber: string;
    date: string;
    status: string;
  }>>('/api/academic-leadership/hod/attendance');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Faculty attendance" subtitle="Read-only HR attendance for the department" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Employee', 'Number', 'Date', 'Status']}
        empty="No attendance rows for the current window"
        rows={(data ?? []).map((r) => [r.employeeName, r.employeeNumber, r.date, r.status])}
      />
    </div>
  );
}

type LeaveInbox = {
  items: Array<{
    id: number;
    employeeName: string;
    designation: string | null;
    leaveTypeName: string;
    fromDate: string;
    toDate: string;
    requestedDays: number;
    reason: string | null;
    status: string;
  }>;
};

export function HodLeavePage() {
  useDocumentTitle('Faculty leave');
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'calendar' | 'history'>('pending');
  const { data, error, loading } = useResource<LeaveInbox>(`/api/academic-leadership/hod/leave?tab=${tab}`);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function act(id: number, kind: 'approve' | 'reject') {
    setBusy(id);
    setMessage(null);
    try {
      await api(`/api/hr/manager/leave/${id}/${kind}`, { method: 'POST', body: JSON.stringify({ notes: kind }) });
      setMessage(kind === 'approve' ? 'Sent to HR' : 'Rejected');
      window.location.reload();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Faculty leave" subtitle="Academic approval only — HR completes final leave approval" />
      <div className="flex flex-wrap gap-2">
        {(['pending', 'approved', 'rejected', 'calendar', 'history'] as const).map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'secondary'} onClick={() => setTab(t)}>
            {t === 'pending' ? 'Pending' : t === 'approved' ? 'Approved by me' : t === 'rejected' ? 'Rejected by me' : t === 'calendar' ? 'Calendar' : 'History'}
          </Button>
        ))}
      </div>
      {message ? <p className="text-sm text-ink-secondary">{message}</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {loading ? <Surface className="h-40 animate-pulse">{' '}</Surface> : (
        <SimpleTable
          headers={['Faculty', 'Type', 'Dates', 'Days', 'Reason', 'Status', '']}
          empty="No leave in this view"
          rows={(data?.items ?? []).map((r) => [
            <span key="n" className="block">
              <span className="font-medium">{r.employeeName}</span>
              <span className="mt-0.5 block text-xs text-ink-muted">{r.designation || '—'}</span>
            </span>,
            r.leaveTypeName,
            `${r.fromDate} → ${r.toDate}`,
            r.requestedDays,
            r.reason || '—',
            r.status,
            tab === 'pending' ? (
              <span key="a" className="flex flex-wrap gap-1">
                <Button size="sm" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}>Approve</Button>
                <Button size="sm" variant="danger-soft" disabled={busy === r.id} onClick={() => act(r.id, 'reject')}>Reject</Button>
              </span>
            ) : (
              ''
            ),
          ])}
        />
      )}
    </div>
  );
}

export function HodProgressPage() {
  useDocumentTitle('Academic progress');
  const { data, error } = useResource<Array<{
    courseCode: string;
    courseName: string;
    facultyName: string;
    plannedProgress: number;
    actualProgress: number;
    completionPct: number;
    pendingUnits: number;
  }>>('/api/academic-leadership/hod/progress');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Academic progress" subtitle="Lesson-plan completion from canonical plans" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Course', 'Faculty', 'Planned', 'Actual', 'Pending']}
        empty="No lesson plans to monitor"
        rows={(data ?? []).map((r) => [`${r.courseCode} ${r.courseName}`, r.facultyName, `${r.plannedProgress}%`, `${r.actualProgress}%`, r.pendingUnits])}
      />
    </div>
  );
}

export function HodAssessmentsPage() {
  useDocumentTitle('Assessment monitoring');
  const { data, error } = useResource<Array<{ kind: string; title: string; status: string; facultyName: string; courseCode: string }>>(
    '/api/academic-leadership/hod/assessments',
  );
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Assessment monitoring" subtitle="Quizzes and assignments owned by department faculty" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Kind', 'Title', 'Course', 'Faculty', 'Status']}
        empty="No assessments found"
        rows={(data ?? []).map((r) => [r.kind, r.title, r.courseCode || '—', r.facultyName || '—', r.status])}
      />
    </div>
  );
}

export function HodResultsPage() {
  useDocumentTitle('Results monitoring');
  const { data, error } = useResource<Array<{ courseCode: string; courseName: string; facultyName: string; status: string }>>(
    '/api/academic-leadership/hod/results',
  );
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Results / performance" subtitle="Attainment runs for the department" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Course', 'Faculty', 'Status']}
        empty="No attainment runs"
        rows={(data ?? []).map((r) => [`${r.courseCode || ''} ${r.courseName || ''}`.trim() || '—', r.facultyName || '—', r.status])}
      />
    </div>
  );
}

export function HodContinuityPage() {
  useDocumentTitle('Academic continuity');
  const { data, error } = useResource<Array<{
    employeeName: string;
    affectedDate: string;
    coverageType: string;
    status: string;
    subjectName: string;
    leaveStatus: string;
  }>>('/api/academic-leadership/hod/continuity');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Academic continuity" subtitle="Department view of the frozen coverage engine" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Faculty', 'Date', 'Type', 'Coverage', 'Leave', 'Subject']}
        empty="No continuity rows"
        rows={(data ?? []).map((r) => [r.employeeName, r.affectedDate, r.coverageType || '—', r.status, r.leaveStatus, r.subjectName || '—'])}
      />
    </div>
  );
}

export function HodExceptionsPage() {
  useDocumentTitle('Exceptions');
  const { data, error } = useResource<Array<{ employeeName: string; affectedDate: string; status: string; coverageType: string }>>(
    '/api/academic-leadership/hod/exceptions',
  );
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Exceptions / pending actions" subtitle="Unresolved coverage and HOD arrangement items" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Faculty', 'Date', 'Type', 'Status']}
        empty="No open exceptions"
        rows={(data ?? []).map((r) => [r.employeeName, r.affectedDate, r.coverageType || '—', r.status])}
      />
    </div>
  );
}

export function HodReportsPage() {
  useDocumentTitle('Department reports');
  const { data, error } = useResource<HodDash>('/api/academic-leadership/hod/reports');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Department reports" subtitle="Snapshot of live department indicators" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <MetricGrid
        items={[
          { label: 'Faculty', value: data?.metrics.facultyCount },
          { label: 'Students', value: data?.metrics.studentCount },
          { label: 'Pending leave', value: data?.metrics.pendingFacultyLeave },
          { label: 'Exceptions', value: data?.metrics.continuityExceptions },
        ]}
      />
    </div>
  );
}

type PrincipalDash = {
  metrics: Record<string, number | null>;
  departmentComparison: Array<{
    departmentId: number;
    departmentName: string;
    attendancePct: number | null;
    academicProgressPct: number | null;
    assessmentPending: number;
    exceptions: number;
  }>;
};

export function PrincipalDashboardPage() {
  useDocumentTitle('Institution dashboard');
  const { data, error, loading } = useResource<PrincipalDash>('/api/academic-leadership/principal/dashboard');
  const m = data?.metrics ?? {};
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Institution academic overview" subtitle="College-scoped leadership — not platform administration" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <MetricGrid
        loading={loading}
        items={[
          { label: 'Departments', value: m.departmentCount },
          { label: 'Faculty', value: m.facultyCount },
          { label: 'Students', value: m.studentCount },
          { label: 'Programs', value: m.programCount },
          { label: 'Faculty attendance', value: m.facultyAttendancePct != null ? `${m.facultyAttendancePct}%` : null },
          { label: 'Progress', value: m.academicProgressPct != null ? `${m.academicProgressPct}%` : null },
          { label: 'Pending approvals', value: m.pendingApprovals },
          { label: 'Continuity exceptions', value: m.continuityExceptions },
          { label: 'Faculty absent', value: m.facultyAbsentToday },
          { label: 'Active HODs', value: m.activeHodCount },
        ]}
      />
      <Panel title="Department comparison">
        {data?.departmentComparison?.length ? (
          <div className="h-72 min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.departmentComparison} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                <XAxis dataKey="departmentName" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={48} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="attendancePct" name="Attendance %" fill="#0c6b54" radius={[4, 4, 0, 0]} />
                <Bar dataKey="academicProgressPct" name="Progress %" fill="#175cd3" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exceptions" name="Exceptions" fill="#b42318" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No department comparison data yet.</p>
        )}
        <div className="mt-4">
          <SimpleTable
            headers={['Department', 'Attendance', 'Progress', 'Assessments', 'Exceptions']}
            empty="No departments"
            rows={(data?.departmentComparison ?? []).map((d) => [
              d.departmentName,
              d.attendancePct != null ? `${d.attendancePct}%` : '—',
              d.academicProgressPct != null ? `${d.academicProgressPct}%` : '—',
              d.assessmentPending,
              d.exceptions,
            ])}
          />
        </div>
      </Panel>
    </div>
  );
}

export function PrincipalDepartmentsPage() {
  useDocumentTitle('Departments');
  const { data, error } = useResource<Array<{
    id: number;
    name: string;
    code: string;
    hod: { employeeName: string | null } | null;
    facultyCount: number;
    studentCount: number;
    pendingLeave: number;
    exceptions: number;
  }>>('/api/academic-leadership/principal/departments');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Departments" subtitle="Open a department for a leadership view" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Department', 'HOD', 'Faculty', 'Students', 'Leave', 'Exceptions', '']}
        empty="No departments"
        rows={(data ?? []).map((d) => [
          `${d.code} ${d.name}`,
          d.hod?.employeeName || '—',
          d.facultyCount,
          d.studentCount,
          d.pendingLeave,
          d.exceptions,
          <Link key="o" to={`/principal/departments/${d.id}`} className="text-accent">
            Open
          </Link>,
        ])}
      />
    </div>
  );
}

export function PrincipalDepartmentDetailPage() {
  const { id } = useParams();
  useDocumentTitle('Department overview');
  const { data, error } = useResource<{
    department: { name: string };
    metrics: Record<string, number | null>;
    hods: Array<{ employeeName: string | null }>;
    alerts: Array<{ severity: 'high' | 'medium' | 'low'; title: string; count: number }>;
  }>(`/api/academic-leadership/principal/departments/${id}`);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={data?.department.name || 'Department'} subtitle="Leadership view" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <p className="text-sm text-ink-secondary">HOD: {data?.hods?.[0]?.employeeName || 'Not assigned'}</p>
      <MetricGrid
        items={[
          { label: 'Faculty', value: data?.metrics.facultyCount },
          { label: 'Students', value: data?.metrics.studentCount },
          { label: 'Pending leave', value: data?.metrics.pendingFacultyLeave },
          { label: 'Exceptions', value: data?.metrics.continuityExceptions },
        ]}
      />
      <Panel title="Alerts">
        <AlertList alerts={data?.alerts ?? []} />
      </Panel>
    </div>
  );
}

export function PrincipalHodsPage() {
  useDocumentTitle('HODs');
  const { data, error } = useResource<Array<{
    employeeName: string | null;
    departmentName: string | null;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: string;
  }>>('/api/academic-leadership/principal/hods');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Heads of department" subtitle="Active and historical HOD assignments" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['HOD', 'Department', 'From', 'To', 'Status']}
        empty="No HOD assignments"
        rows={(data ?? []).map((r) => [r.employeeName || '—', r.departmentName || '—', r.effectiveFrom, r.effectiveTo || 'Open', r.status])}
      />
    </div>
  );
}

export function PrincipalFacultyPage() {
  useDocumentTitle('Faculty overview');
  const { data, error } = useResource<FacultyRow[]>('/api/academic-leadership/principal/faculty');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Faculty overview" subtitle="College-wide teaching staff" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Faculty', 'Department', 'Designation', 'Hours', 'Today']}
        empty="No faculty"
        rows={(data ?? []).map((f) => [f.name, f.departmentName || '—', f.designation || '—', f.weeklyHours, f.attendanceToday || '—'])}
      />
    </div>
  );
}

export function PrincipalStudentsPage() {
  useDocumentTitle('Students overview');
  const { data, error } = useResource<{ count: number; classes: Array<{ className: string; classCode: string; studentCount: number }> }>(
    '/api/academic-leadership/principal/students',
  );
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Students overview" subtitle={`${data?.count ?? 0} enrolled across classes`} />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Class', 'Code', 'Students']}
        empty="No class enrollments"
        rows={(data?.classes ?? []).map((c) => [c.className, c.classCode, c.studentCount])}
      />
    </div>
  );
}

export function PrincipalApprovalsPage() {
  useDocumentTitle('Approvals');
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected' | 'calendar'>('pending');
  const { data, error } = useResource<LeaveInbox>(`/api/academic-leadership/principal/approvals?tab=${tab}`);
  const [busy, setBusy] = useState<number | null>(null);

  async function act(id: number, kind: 'approve' | 'reject') {
    setBusy(id);
    try {
      await api(`/api/hr/manager/leave/${id}/${kind}`, { method: 'POST', body: JSON.stringify({ notes: kind }) });
      window.location.reload();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Leadership approvals" subtitle="HOD leave and other principal academic approvals" />
      <div className="flex flex-wrap gap-2">
        {(['pending', 'approved', 'rejected', 'calendar'] as const).map((t) => (
          <Button key={t} variant={tab === t ? 'primary' : 'secondary'} onClick={() => setTab(t)}>
            {t}
          </Button>
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Employee', 'Type', 'Dates', 'Days', 'Status', '']}
        empty="Nothing waiting"
        rows={(data?.items ?? []).map((r) => [
          r.employeeName,
          r.leaveTypeName,
          `${r.fromDate} → ${r.toDate}`,
          r.requestedDays,
          r.status,
          tab === 'pending' ? (
            <span key="a" className="flex flex-wrap gap-1">
              <Button size="sm" disabled={busy === r.id} onClick={() => act(r.id, 'approve')}>Approve</Button>
              <Button size="sm" variant="danger-soft" disabled={busy === r.id} onClick={() => act(r.id, 'reject')}>Reject</Button>
            </span>
          ) : (
            ''
          ),
        ])}
      />
    </div>
  );
}

export function PrincipalProgressPage() {
  useDocumentTitle('Academic progress');
  const { data, error } = useResource<Array<{
    courseCode: string;
    courseName: string;
    facultyName: string;
    plannedProgress: number;
    actualProgress: number;
    pendingUnits: number;
  }>>('/api/academic-leadership/principal/progress');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Academic progress" subtitle="Institution lesson-plan completion" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Course', 'Faculty', 'Planned', 'Actual', 'Pending']}
        empty="No lesson plans to monitor"
        rows={(data ?? []).map((r) => [`${r.courseCode} ${r.courseName}`, r.facultyName, `${r.plannedProgress}%`, `${r.actualProgress}%`, r.pendingUnits])}
      />
    </div>
  );
}

export function PrincipalAttendancePage() {
  useDocumentTitle('Attendance overview');
  const { data, error } = useResource<Array<{
    employeeName: string;
    employeeNumber: string;
    date: string;
    status: string;
  }>>('/api/academic-leadership/principal/attendance');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Attendance overview" subtitle="College faculty attendance" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Employee', 'Number', 'Date', 'Status']}
        empty="No attendance rows"
        rows={(data ?? []).map((r) => [r.employeeName, r.employeeNumber, r.date, r.status])}
      />
    </div>
  );
}

export function PrincipalTimetablePage() {
  useDocumentTitle('Timetable overview');
  const { data, error } = useResource<Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    className: string;
    courseCode: string;
    facultyName: string;
  }>>('/api/academic-leadership/principal/timetable');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Timetable overview" subtitle="College timetable slots" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Day', 'Time', 'Class', 'Course', 'Faculty']}
        empty="No timetable slots"
        rows={(data ?? []).map((r) => [days[r.dayOfWeek] ?? r.dayOfWeek, `${String(r.startTime).slice(0, 5)}–${String(r.endTime).slice(0, 5)}`, r.className, r.courseCode, r.facultyName || '—'])}
      />
    </div>
  );
}

export function PrincipalAssessmentsPage() {
  useDocumentTitle('Assessment monitoring');
  const { data, error } = useResource<Array<{ kind: string; title: string; status: string; facultyName: string; courseCode: string }>>(
    '/api/academic-leadership/principal/assessments',
  );
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Assessment monitoring" subtitle="Institution assessments" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Kind', 'Title', 'Course', 'Faculty', 'Status']}
        empty="No assessments found"
        rows={(data ?? []).map((r) => [r.kind, r.title, r.courseCode || '—', r.facultyName || '—', r.status])}
      />
    </div>
  );
}

export function PrincipalResultsPage() {
  useDocumentTitle('Results / performance');
  const { data, error } = useResource<Array<{ courseCode: string; courseName: string; facultyName: string; status: string }>>(
    '/api/academic-leadership/principal/results',
  );
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Results / performance" subtitle="College attainment runs" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Course', 'Faculty', 'Status']}
        empty="No attainment runs"
        rows={(data ?? []).map((r) => [`${r.courseCode || ''} ${r.courseName || ''}`.trim() || '—', r.facultyName || '—', r.status])}
      />
    </div>
  );
}

export function PrincipalContinuityPage() {
  useDocumentTitle('Academic continuity');
  const { data, error } = useResource<Array<{
    employeeName: string;
    affectedDate: string;
    coverageType: string;
    status: string;
    subjectName: string;
    leaveStatus: string;
  }>>('/api/academic-leadership/principal/continuity');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Academic continuity" subtitle="Institution-wide frozen coverage engine" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Faculty', 'Date', 'Type', 'Coverage', 'Leave', 'Subject']}
        empty="No continuity rows"
        rows={(data ?? []).map((r) => [r.employeeName, r.affectedDate, r.coverageType || '—', r.status, r.leaveStatus, r.subjectName || '—'])}
      />
    </div>
  );
}

export function PrincipalExceptionsPage() {
  useDocumentTitle('Exceptions');
  const { data, error } = useResource<Array<{ employeeName: string; affectedDate: string; status: string; coverageType: string }>>(
    '/api/academic-leadership/principal/exceptions',
  );
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Institutional exceptions" subtitle="Unresolved coverage across departments" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <SimpleTable
        headers={['Faculty', 'Date', 'Type', 'Status']}
        empty="No open exceptions"
        rows={(data ?? []).map((r) => [r.employeeName, r.affectedDate, r.coverageType || '—', r.status])}
      />
    </div>
  );
}

export function PrincipalReportsPage() {
  useDocumentTitle('Reports');
  const { data, error } = useResource<PrincipalDash>('/api/academic-leadership/principal/reports');
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Institution reports" subtitle="College academic snapshot" />
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <MetricGrid
        items={[
          { label: 'Departments', value: data?.metrics.departmentCount },
          { label: 'Faculty', value: data?.metrics.facultyCount },
          { label: 'Pending approvals', value: data?.metrics.pendingApprovals },
          { label: 'Exceptions', value: data?.metrics.continuityExceptions },
        ]}
      />
    </div>
  );
}
