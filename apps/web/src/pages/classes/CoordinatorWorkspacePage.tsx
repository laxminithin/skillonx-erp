import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge, EmptyState, PageHeader, Select, StatStrip, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type CoordClass = { id: number; code: string; name: string; departmentName: string | null };

type NamedStudent = { studentId: number; name?: string | null; usn?: string | null; attendancePct?: number; ciePct?: number; reason?: string | null };

type Workspace = {
  class: { id: number; code: string; name: string };
  strength: number;
  attendance: { averagePct: number | null; belowThreshold: NamedStudent[] };
  academicExceptions: NamedStudent[];
  backlogs: { studentsWithBacklogs: number; totalBacklogs: number };
  mentorAllocation: { assigned: number; unassigned: number; studentsWithoutMentor: NamedStudent[] };
  pendingRequests: number;
  alerts: Array<{ id: number; studentId: number; type: string; severity: string; title: string }>;
  completion: { assignments: number | null; quizzes: number | null; cieSheets: number };
  issues: { escalations: number; grievances: number };
};

export function CoordinatorWorkspacePage() {
  useDocumentTitle('Class Coordinator');
  const [classes, setClasses] = useState<CoordClass[]>([]);
  const [classId, setClassId] = useState<number | null>(null);
  const [ws, setWs] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ classes: CoordClass[] }>('/api/classes/coordinator/classes')
      .then((d) => {
        setClasses(d.classes);
        if (d.classes.length) setClassId(d.classes[0].id);
        else setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const load = useCallback(() => {
    if (!classId) return;
    setLoading(true);
    api<Workspace>(`/api/classes/coordinator/${classId}/workspace`)
      .then(setWs)
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(() => { load(); }, [load]);

  if (!loading && !classes.length) {
    return (
      <div>
        <PageHeader title="Class Coordinator" subtitle="Class-level academic oversight." />
        <EmptyState title="You are not a Class Coordinator" body="This workspace appears when you are assigned as a class coordinator." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Class Coordinator Workspace"
        subtitle={ws ? `${ws.class.name}` : 'Class-level academic oversight'}
        actions={
          classes.length > 1 ? (
            <Select value={classId ?? ''} onChange={(e) => setClassId(Number(e.target.value))}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.code}</option>)}
            </Select>
          ) : null
        }
      />

      <StatStrip
        loading={loading}
        items={[
          { label: 'Class strength', value: ws?.strength ?? '—' },
          { label: 'Avg attendance', value: ws?.attendance.averagePct != null ? `${ws.attendance.averagePct}%` : '—' },
          { label: 'Below threshold', value: ws?.attendance.belowThreshold.length ?? '—' },
          { label: 'Without mentor', value: ws?.mentorAllocation.unassigned ?? '—' },
          { label: 'Pending requests', value: ws?.pendingRequests ?? '—' },
          { label: 'Open issues', value: ws ? ws.issues.escalations + ws.issues.grievances : '—' },
        ]}
      />

      {ws ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Panel title="Students below attendance threshold" icon={<AlertTriangle className="h-4 w-4 text-rose-600" aria-hidden />}>
            <StudentList
              rows={ws.attendance.belowThreshold}
              render={(s) => `${s.attendancePct}%`}
              empty="All students are above the attendance threshold."
            />
          </Panel>

          <Panel title="Academic performance exceptions">
            <StudentList
              rows={ws.academicExceptions}
              render={(s) => s.reason ?? (s.ciePct != null ? `CIE ${s.ciePct}%` : '')}
              empty="No academic exceptions flagged."
            />
          </Panel>

          <Panel title="Mentor allocation" icon={<Users className="h-4 w-4" aria-hidden />}>
            <p className="mb-2 text-sm">
              <strong>{ws.mentorAllocation.assigned}</strong> assigned · <strong>{ws.mentorAllocation.unassigned}</strong> without a mentor
            </p>
            <StudentList rows={ws.mentorAllocation.studentsWithoutMentor} render={() => 'No mentor'} empty="Every student has a mentor." />
          </Panel>

          <Panel title="Backlog snapshot">
            <p className="text-sm">
              <strong>{ws.backlogs.studentsWithBacklogs}</strong> students with backlogs · <strong>{ws.backlogs.totalBacklogs}</strong> total backlogs
            </p>
          </Panel>

          <Panel title="Assessment & work completion">
            <ul className="space-y-1 text-sm">
              <li>Assignments submitted: <strong>{ws.completion.assignments != null ? `${ws.completion.assignments}%` : '—'}</strong></li>
              <li>Quiz submissions: <strong>{ws.completion.quizzes ?? '—'}</strong></li>
              <li>Internal assessment sheets: <strong>{ws.completion.cieSheets}</strong></li>
            </ul>
          </Panel>

          <Panel title="Academic alerts & issues">
            <p className="mb-2 text-sm">
              <strong>{ws.issues.escalations}</strong> open escalations · <strong>{ws.issues.grievances}</strong> open grievances
            </p>
            {ws.alerts.length ? (
              <ul className="space-y-1 text-sm">
                {ws.alerts.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-center gap-2">
                    <Badge className={/CRIT|HIGH|DANGER/i.test(a.severity) ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-800'}>{a.severity}</Badge>
                    {a.title}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-ink-muted">No active alerts.</p>}
          </Panel>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-ink-muted">
        Scope is limited to your coordinated class. <Link to="/classes" className="text-accent hover:underline">Open class reports</Link>.
      </p>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink">{icon}{title}</h2>
      <Surface>{children}</Surface>
    </section>
  );
}

function StudentList({ rows, render, empty }: { rows: NamedStudent[]; render: (s: NamedStudent) => React.ReactNode; empty: string }) {
  if (!rows.length) return <p className="text-sm text-ink-muted">{empty}</p>;
  return (
    <ul className="divide-y divide-border">
      {rows.slice(0, 12).map((s) => (
        <li key={s.studentId} className="flex items-center justify-between gap-2 py-1.5 text-sm">
          <Link to={`/mentoring/students/${s.studentId}`} className="text-accent hover:underline">{s.name ?? `Student ${s.studentId}`}</Link>
          <span className="text-ink-muted">{s.usn ? `${s.usn} · ` : ''}{render(s)}</span>
        </li>
      ))}
      {rows.length > 12 ? <li className="py-1.5 text-xs text-ink-muted">+{rows.length - 12} more</li> : null}
    </ul>
  );
}
