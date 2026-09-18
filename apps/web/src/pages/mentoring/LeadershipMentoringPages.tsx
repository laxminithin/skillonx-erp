import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Badge, Button, EmptyState, PageHeader, StatStrip, Surface, useToast } from '../../components/ui';
import { AttentionBadge } from './MentoringPages';

type Attention = 'NORMAL' | 'WATCH' | 'ATTENTION' | 'HIGH';

type Hod = {
  pulse: { totalStudents: number; assignedStudents: number; unassignedStudents: number; coveragePct: number; mentors: number; requiringAttention: number; overdueFollowUps: number; openEscalations: number };
  mentors: Array<{ mentorFacultyId: number; mentorName: string; department: string | null; mentees: number; imbalance: string }>;
  studentsRequiringAttention: Array<{ studentId: number; name: string; usn: string; mentor: string | null; attention: Attention; reasons: string[] }>;
  escalations: Array<{ id: number; studentName: string; usn: string; mentorName: string | null; reasonCode: string; reason: string; targetLevel: string; status: string }>;
  unassignedSample: Array<{ studentId: number; name: string; usn: string; department: string | null; semester: string | null }>;
};

export function HodMentoringPage() {
  useDocumentTitle('Department Mentoring');
  const [data, setData] = useState<Hod | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    api<Hod>('/api/mentoring/hod').then(setData).catch((e) => toast(String((e as { message?: string })?.message ?? 'Failed'), 'error')).finally(() => setLoading(false));
  }, [toast]);
  useEffect(() => { load(); }, [load]);

  async function resolve(id: number) {
    try {
      await api(`/api/mentoring/oversight/escalations/${id}/resolve`, { method: 'POST', body: JSON.stringify({ action: 'RESOLVE', resolution: 'Reviewed by HOD' }) });
      toast('Escalation resolved', 'success');
      load();
    } catch (e) {
      toast(String((e as { message?: string })?.message ?? 'Failed'), 'error');
    }
  }

  const p = data?.pulse;
  return (
    <div>
      <PageHeader title="Department Mentoring" subtitle="Coverage, workload and students requiring attention" />
      <StatStrip
        loading={loading}
        items={[
          { label: 'Students', value: p?.totalStudents ?? '—' },
          { label: 'Coverage', value: p != null ? `${p.coveragePct}%` : '—' },
          { label: 'Unassigned', value: p?.unassignedStudents ?? '—' },
          { label: 'Mentors', value: p?.mentors ?? '—' },
          { label: 'Need attention', value: p?.requiringAttention ?? '—' },
          { label: 'Open escalations', value: p?.openEscalations ?? '—' },
        ]}
      />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold text-ink">Students requiring attention</h2>
          <Surface className="!p-0 overflow-hidden">
            {!data?.studentsRequiringAttention.length ? (
              <div className="p-5"><EmptyState title="All clear" body="No students flagged in this department." /></div>
            ) : (
              <ul className="divide-y divide-border">
                {data.studentsRequiringAttention.map((s) => (
                  <li key={s.studentId} className="px-4 py-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{s.name} <span className="text-xs text-ink-muted">{s.usn}</span></span>
                      <AttentionBadge level={s.attention} />
                    </div>
                    <div className="text-xs text-ink-muted">Mentor: {s.mentor ?? 'Unassigned'} · {s.reasons.slice(0, 2).join('; ')}</div>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </section>

        <section className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold text-ink">Mentor workload</h2>
          <Surface className="!p-0 overflow-hidden">
            {!data?.mentors.length ? (
              <div className="p-5"><EmptyState title="No mentors" body="No active mentor assignments." /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="border-b border-border text-xs uppercase text-ink-muted"><tr><th className="px-4 py-2">Mentor</th><th className="px-4 py-2">Mentees</th><th className="px-4 py-2">Balance</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {data.mentors.map((m) => (
                      <tr key={m.mentorFacultyId}>
                        <td className="px-4 py-2">{m.mentorName}</td>
                        <td className="px-4 py-2 tabular-nums">{m.mentees}</td>
                        <td className="px-4 py-2"><Badge className={m.imbalance === 'OVERLOADED' ? 'bg-rose-50 text-rose-700' : m.imbalance === 'LIGHT' ? 'bg-sky-50 text-sky-700' : 'bg-emerald-50 text-emerald-700'}>{m.imbalance}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>
        </section>
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Escalations</h2>
        <Surface className="!p-0 overflow-hidden">
          {!data?.escalations.length ? (
            <div className="p-5"><EmptyState title="No open escalations" body="Escalations from mentors will appear here." /></div>
          ) : (
            <ul className="divide-y divide-border">
              {data.escalations.map((e) => (
                <li key={e.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <span className="font-medium">{e.studentName}</span> <span className="text-xs text-ink-muted">{e.usn}</span>
                    <div className="text-xs text-ink-muted">{e.reasonCode.replace(/_/g, ' ')} · from {e.mentorName ?? 'mentor'} · {e.reason}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-surface-muted text-ink-muted">{e.status}</Badge>
                    <Button size="sm" variant="secondary" onClick={() => resolve(e.id)}>Resolve</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Surface>
      </section>

      {data?.unassignedSample.length ? (
        <section className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-ink">Unassigned students ({data.pulse.unassignedStudents})</h2>
          <Surface>
            <div className="flex flex-wrap gap-2 text-sm">
              {data.unassignedSample.map((s) => (
                <span key={s.studentId} className="rounded-md border border-border px-2 py-1">{s.name} · {s.usn}</span>
              ))}
            </div>
          </Surface>
        </section>
      ) : null}
    </div>
  );
}

type Principal = {
  summary: { totalStudents: number; coveragePct: number; unassignedStudents: number; highAttention: number; requiringAttention: number; openEscalations: number; resolvedEscalations: number; interventionVolume: number; followUpCompliancePct: number | null };
  departments: Array<{ departmentId: number | null; department: string; totalStudents: number; coveragePct: number; requiringAttention: number; highAttention: number }>;
};

export function PrincipalMentoringPage() {
  useDocumentTitle('Institution Mentoring');
  const [data, setData] = useState<Principal | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api<Principal>('/api/mentoring/principal').then(setData).finally(() => setLoading(false)); }, []);
  const s = data?.summary;
  return (
    <div>
      <PageHeader title="Institution Mentoring Oversight" subtitle="Coverage, attention and follow-up compliance across departments" />
      <StatStrip
        loading={loading}
        items={[
          { label: 'Students', value: s?.totalStudents ?? '—' },
          { label: 'Coverage', value: s != null ? `${s.coveragePct}%` : '—' },
          { label: 'High attention', value: s?.highAttention ?? '—' },
          { label: 'Follow-up compliance', value: s?.followUpCompliancePct != null ? `${s.followUpCompliancePct}%` : '—' },
          { label: 'Interventions', value: s?.interventionVolume ?? '—' },
          { label: 'Open escalations', value: s?.openEscalations ?? '—' },
        ]}
      />
      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-ink">Department comparison</h2>
        <Surface className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-border text-xs uppercase text-ink-muted"><tr><th className="px-4 py-2">Department</th><th className="px-4 py-2">Students</th><th className="px-4 py-2">Coverage</th><th className="px-4 py-2">Need attention</th><th className="px-4 py-2">High</th></tr></thead>
              <tbody className="divide-y divide-border">
                {data?.departments.map((d) => (
                  <tr key={d.departmentId ?? 'none'}>
                    <td className="px-4 py-2">{d.department}</td>
                    <td className="px-4 py-2 tabular-nums">{d.totalStudents}</td>
                    <td className="px-4 py-2 tabular-nums">{d.coveragePct}%</td>
                    <td className="px-4 py-2 tabular-nums">{d.requiringAttention}</td>
                    <td className="px-4 py-2 tabular-nums">{d.highAttention}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      </section>
    </div>
  );
}

type Mgmt = {
  coveragePct: number;
  studentsReceivingMentoring: number;
  totalStudents: number;
  attentionDistribution: Record<Attention, number>;
  followUpCompliancePct: number | null;
  interventionVolume: number;
  openEscalations: number;
  resolvedEscalations: number;
  departments: Array<{ department: string; coveragePct: number; requiringAttention: number; highAttention: number }>;
};

export function ManagementMentoringPage() {
  useDocumentTitle('Mentoring Analytics');
  const [data, setData] = useState<Mgmt | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api<Mgmt>('/api/mentoring/management').then(setData).finally(() => setLoading(false)); }, []);
  const dist = data?.attentionDistribution;
  const total = dist ? dist.NORMAL + dist.WATCH + dist.ATTENTION + dist.HIGH : 0;
  return (
    <div>
      <PageHeader title="Mentoring & Student Advisory Analytics" subtitle="Institution-level, de-identified aggregate metrics" />
      <StatStrip
        loading={loading}
        items={[
          { label: 'Coverage', value: data != null ? `${data.coveragePct}%` : '—' },
          { label: 'Receiving mentoring', value: data?.studentsReceivingMentoring ?? '—' },
          { label: 'Interventions', value: data?.interventionVolume ?? '—' },
          { label: 'Follow-up compliance', value: data?.followUpCompliancePct != null ? `${data.followUpCompliancePct}%` : '—' },
          { label: 'Open escalations', value: data?.openEscalations ?? '—' },
          { label: 'Resolved escalations', value: data?.resolvedEscalations ?? '—' },
        ]}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold text-ink">Attention distribution</h2>
          <Surface className="space-y-2">
            {(['HIGH', 'ATTENTION', 'WATCH', 'NORMAL'] as Attention[]).map((k) => {
              const v = dist?.[k] ?? 0;
              const pct = total ? Math.round((v / total) * 100) : 0;
              return (
                <div key={k}>
                  <div className="mb-0.5 flex items-center justify-between text-xs"><span className="flex items-center gap-2"><AttentionBadge level={k} /></span><span className="tabular-nums text-ink-muted">{v} ({pct}%)</span></div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"><div className="h-full bg-accent" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
          </Surface>
        </section>
        <section className="min-w-0">
          <h2 className="mb-3 text-sm font-semibold text-ink">Department coverage</h2>
          <Surface className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase text-ink-muted"><tr><th className="px-4 py-2">Department</th><th className="px-4 py-2">Coverage</th><th className="px-4 py-2">Need attention</th></tr></thead>
                <tbody className="divide-y divide-border">
                  {data?.departments.map((d) => (
                    <tr key={d.department}><td className="px-4 py-2">{d.department}</td><td className="px-4 py-2 tabular-nums">{d.coveragePct}%</td><td className="px-4 py-2 tabular-nums">{d.requiringAttention}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Surface>
        </section>
      </div>
    </div>
  );
}
