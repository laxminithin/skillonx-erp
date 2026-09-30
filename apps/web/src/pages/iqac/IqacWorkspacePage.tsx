import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  Button,
  Field,
  Input,
  PageHeader,
  Select,
  StatStrip,
  StatusBadge,
  Surface,
  Tabs,
  Textarea,
  useToast,
} from '../../components/ui';

type Dashboard = {
  evidencePendingVerification: number;
  metricsNeedingAttention: number;
  actionPlansOverdue: number;
  auditFindingsOpen: number;
  complianceDeadlinesOverdue: number;
  activeCycles: Array<{ id: number; name: string; status: string; academic_year: string }>;
};

type Cycle = { id: number; name: string; academic_year: string; status: string; framework_version_id: number };
type Framework = { id: number; name: string; code: string };
type FrameworkVersion = { id: number; framework_id: number; version_label: string; status: string };
type ActionPlan = { id: number; source_type: string; finding: string; action: string; status: string; target_date: string | null; created_at: string };
type ComplianceItem = { id: number; requirement: string; authority: string; due_date: string; status: string; isOverdue: boolean };

const TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'frameworks', label: 'Frameworks' },
  { id: 'cycles', label: 'Cycles' },
  { id: 'actionPlans', label: 'Action Plans' },
  { id: 'compliance', label: 'Compliance' },
];

export function IqacWorkspacePage() {
  useDocumentTitle('IQAC & Accreditation');
  const { toast } = useToast();
  const [tab, setTab] = useState('dashboard');

  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [versionsByFramework, setVersionsByFramework] = useState<Record<number, FrameworkVersion[]>>({});
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([]);
  const [complianceItems, setComplianceItems] = useState<ComplianceItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [newFrameworkName, setNewFrameworkName] = useState('');
  const [newFrameworkCode, setNewFrameworkCode] = useState('');
  const [newCycleName, setNewCycleName] = useState('');
  const [newCycleYear, setNewCycleYear] = useState('');
  const [newCycleVersionId, setNewCycleVersionId] = useState<number | ''>('');
  const [newPlanFinding, setNewPlanFinding] = useState('');
  const [newPlanAction, setNewPlanAction] = useState('');
  const [newRequirement, setNewRequirement] = useState('');
  const [newAuthority, setNewAuthority] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [d, f, c, ap, ci] = await Promise.all([
        api<Dashboard>('/api/iqac/dashboard'),
        api<Framework[]>('/api/iqac/frameworks'),
        api<Cycle[]>('/api/iqac/cycles'),
        api<ActionPlan[]>('/api/iqac/action-plans'),
        api<ComplianceItem[]>('/api/iqac/compliance-items'),
      ]);
      setDashboard(d);
      setFrameworks(f);
      setCycles(c);
      setActionPlans(ap);
      setComplianceItems(ci);
      const versionEntries = await Promise.all(f.map((fw) => api<FrameworkVersion[]>(`/api/iqac/frameworks/${fw.id}/versions`).then((v) => [fw.id, v] as const)));
      setVersionsByFramework(Object.fromEntries(versionEntries));
    } catch (err: any) {
      toast(`Failed to load IQAC data: ${err?.message ?? ''}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const allVersions = Object.values(versionsByFramework).flat();

  async function createFramework() {
    if (!newFrameworkName.trim() || !newFrameworkCode.trim()) return;
    try {
      await api('/api/iqac/frameworks', { method: 'POST', body: JSON.stringify({ name: newFrameworkName.trim(), code: newFrameworkCode.trim() }) });
      setNewFrameworkName('');
      setNewFrameworkCode('');
      toast('Framework created');
      await refresh();
    } catch (err: any) {
      toast(`Could not create framework: ${err?.message ?? ''}`, 'error');
    }
  }

  async function createVersion(frameworkId: number, label: string) {
    if (!label.trim()) return;
    try {
      const version = await api<FrameworkVersion>(`/api/iqac/frameworks/${frameworkId}/versions`, { method: 'POST', body: JSON.stringify({ versionLabel: label.trim() }) });
      await api(`/api/iqac/framework-versions/${version.id}/activate`, { method: 'POST' });
      toast('Version created and activated');
      await refresh();
    } catch (err: any) {
      toast(`Could not create version: ${err?.message ?? ''}`, 'error');
    }
  }

  async function createCycle() {
    if (!newCycleName.trim() || !newCycleYear.trim() || !newCycleVersionId) return;
    try {
      await api('/api/iqac/cycles', {
        method: 'POST',
        body: JSON.stringify({ frameworkVersionId: Number(newCycleVersionId), name: newCycleName.trim(), academicYear: newCycleYear.trim() }),
      });
      setNewCycleName('');
      setNewCycleYear('');
      toast('Accreditation cycle created');
      await refresh();
    } catch (err: any) {
      toast(`Could not create cycle: ${err?.message ?? ''}`, 'error');
    }
  }

  async function advanceCycle(id: number, toStatus: string) {
    try {
      const endpoint = toStatus === 'FROZEN' ? `/api/iqac/cycles/${id}/freeze`
        : toStatus === 'SUBMITTED' ? `/api/iqac/cycles/${id}/submit`
        : toStatus === 'CLOSED' ? `/api/iqac/cycles/${id}/close`
        : `/api/iqac/cycles/${id}/advance`;
      const body = toStatus === 'SUBMITTED' ? { submissionReference: `SUB-${id}-${Date.now()}` }
        : toStatus === 'FROZEN' || toStatus === 'CLOSED' ? {}
        : { toStatus };
      await api(endpoint, { method: 'POST', body: JSON.stringify(body) });
      toast(`Cycle moved to ${toStatus}`);
      await refresh();
    } catch (err: any) {
      toast(`Transition failed: ${err?.message ?? ''}`, 'error');
    }
  }

  async function createActionPlan() {
    if (!newPlanFinding.trim() || !newPlanAction.trim()) return;
    try {
      await api('/api/iqac/action-plans', {
        method: 'POST',
        body: JSON.stringify({ sourceType: 'MANAGEMENT_REVIEW', finding: newPlanFinding.trim(), action: newPlanAction.trim() }),
      });
      setNewPlanFinding('');
      setNewPlanAction('');
      toast('Action plan created');
      await refresh();
    } catch (err: any) {
      toast(`Could not create action plan: ${err?.message ?? ''}`, 'error');
    }
  }

  async function advancePlan(id: number, status: 'IN_PROGRESS' | 'COMPLETED') {
    try {
      await api(`/api/iqac/action-plans/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await refresh();
    } catch (err: any) {
      toast(`Could not update action plan: ${err?.message ?? ''}`, 'error');
    }
  }

  async function closePlan(id: number) {
    try {
      await api(`/api/iqac/action-plans/${id}/close`, { method: 'POST', body: JSON.stringify({}) });
      toast('Action plan closed');
      await refresh();
    } catch (err: any) {
      toast(`Could not close action plan: ${err?.message ?? ''}`, 'error');
    }
  }

  async function createComplianceItem() {
    if (!newRequirement.trim() || !newAuthority.trim() || !newDueDate) return;
    try {
      await api('/api/iqac/compliance-items', {
        method: 'POST',
        body: JSON.stringify({ requirement: newRequirement.trim(), authority: newAuthority.trim(), dueDate: newDueDate }),
      });
      setNewRequirement('');
      setNewAuthority('');
      setNewDueDate('');
      toast('Compliance item added');
      await refresh();
    } catch (err: any) {
      toast(`Could not add compliance item: ${err?.message ?? ''}`, 'error');
    }
  }

  return (
    <div>
      <PageHeader title="IQAC & Accreditation" subtitle="Institutional quality, evidence, accreditation cycles, and continuous improvement — sourced from authoritative SkillonX modules, never duplicated here." />
      <Tabs tabs={TABS} value={tab} onChange={setTab} />

      <div className="mt-6 space-y-6">
        {tab === 'dashboard' && (
          <>
            <StatStrip
              loading={loading}
              items={[
                { label: 'Evidence Pending Verification', value: dashboard?.evidencePendingVerification ?? '—' },
                { label: 'Metrics Needing Attention', value: dashboard?.metricsNeedingAttention ?? '—' },
                { label: 'Action Plans Overdue', value: dashboard?.actionPlansOverdue ?? '—' },
                { label: 'Audit Findings Open', value: dashboard?.auditFindingsOpen ?? '—' },
                { label: 'Compliance Deadlines Overdue', value: dashboard?.complianceDeadlinesOverdue ?? '—' },
              ]}
            />
            <Surface>
              <h2 className="mb-3 text-sm font-semibold text-ink">Active accreditation cycles</h2>
              {(dashboard?.activeCycles ?? []).length === 0 ? (
                <p className="text-sm text-ink-muted">No cycle currently in progress.</p>
              ) : (
                <ul className="space-y-2">
                  {dashboard!.activeCycles.map((c) => (
                    <li key={c.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                      <span>{c.name} · {c.academic_year}</span>
                      <StatusBadge status={c.status} />
                    </li>
                  ))}
                </ul>
              )}
            </Surface>
          </>
        )}

        {tab === 'frameworks' && (
          <Surface>
            <h2 className="mb-3 text-sm font-semibold text-ink">Accreditation frameworks</h2>
            <p className="mb-4 text-xs text-ink-muted">Configuration-driven — no NAAC/NBA/NIRF content is pre-loaded. Define the frameworks and criteria your institution actually uses.</p>
            <div className="mb-4 flex flex-wrap items-end gap-2">
              <Field label="Framework name"><Input value={newFrameworkName} onChange={(e) => setNewFrameworkName(e.target.value)} placeholder="e.g. NAAC" /></Field>
              <Field label="Code"><Input value={newFrameworkCode} onChange={(e) => setNewFrameworkCode(e.target.value)} placeholder="NAAC" /></Field>
              <Button onClick={createFramework}>Add framework</Button>
            </div>
            <ul className="space-y-3">
              {frameworks.map((fw) => (
                <li key={fw.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{fw.name} ({fw.code})</span>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {(versionsByFramework[fw.id] ?? []).map((v) => (
                      <li key={v.id} className="flex items-center justify-between text-xs text-ink-muted">
                        <span>{v.version_label}</span>
                        <StatusBadge status={v.status} />
                      </li>
                    ))}
                  </ul>
                  <VersionCreator onCreate={(label) => createVersion(fw.id, label)} />
                </li>
              ))}
              {frameworks.length === 0 && <p className="text-sm text-ink-muted">No frameworks configured yet.</p>}
            </ul>
          </Surface>
        )}

        {tab === 'cycles' && (
          <Surface>
            <h2 className="mb-3 text-sm font-semibold text-ink">Accreditation cycles</h2>
            <div className="mb-4 flex flex-wrap items-end gap-2">
              <Field label="Name"><Input value={newCycleName} onChange={(e) => setNewCycleName(e.target.value)} placeholder="AQAR 2025-26" /></Field>
              <Field label="Academic year"><Input value={newCycleYear} onChange={(e) => setNewCycleYear(e.target.value)} placeholder="2025-26" /></Field>
              <Field label="Framework version">
                <Select value={newCycleVersionId} onChange={(e) => setNewCycleVersionId(e.target.value ? Number(e.target.value) : '')}>
                  <option value="">Select…</option>
                  {allVersions.map((v) => <option key={v.id} value={v.id}>{v.version_label}</option>)}
                </Select>
              </Field>
              <Button onClick={createCycle}>Create cycle</Button>
            </div>
            <ul className="space-y-2">
              {cycles.map((c) => (
                <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                  <span>{c.name} · {c.academic_year} — <StatusBadge status={c.status} /></span>
                  <div className="flex gap-2">
                    {c.status === 'DRAFT' && <Button size="sm" variant="secondary" onClick={() => advanceCycle(c.id, 'DATA_COLLECTION')}>Start data collection</Button>}
                    {c.status === 'DATA_COLLECTION' && <Button size="sm" variant="secondary" onClick={() => advanceCycle(c.id, 'REVIEW')}>Send for review</Button>}
                    {c.status === 'REVIEW' && <Button size="sm" variant="secondary" onClick={() => advanceCycle(c.id, 'APPROVED')}>Approve</Button>}
                    {c.status === 'APPROVED' && <Button size="sm" onClick={() => advanceCycle(c.id, 'FROZEN')}>Freeze</Button>}
                    {c.status === 'FROZEN' && <Button size="sm" onClick={() => advanceCycle(c.id, 'SUBMITTED')}>Submit</Button>}
                    {c.status === 'SUBMITTED' && <Button size="sm" onClick={() => advanceCycle(c.id, 'CLOSED')}>Close</Button>}
                  </div>
                </li>
              ))}
              {cycles.length === 0 && <p className="text-sm text-ink-muted">No accreditation cycles yet.</p>}
            </ul>
          </Surface>
        )}

        {tab === 'actionPlans' && (
          <Surface>
            <h2 className="mb-3 text-sm font-semibold text-ink">Continuous improvement — action plans</h2>
            <p className="mb-4 text-xs text-ink-muted">Shared by NBA gaps, NAAC observations, academic-audit findings, and survey feedback — one engine.</p>
            <div className="mb-4 grid gap-2 sm:grid-cols-2">
              <Field label="Finding"><Textarea value={newPlanFinding} onChange={(e) => setNewPlanFinding(e.target.value)} rows={2} /></Field>
              <Field label="Action"><Textarea value={newPlanAction} onChange={(e) => setNewPlanAction(e.target.value)} rows={2} /></Field>
            </div>
            <Button onClick={createActionPlan}>Add action plan</Button>
            <ul className="mt-4 space-y-2">
              {actionPlans.map((p) => (
                <li key={p.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{p.finding}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-1 text-ink-muted">{p.action}</p>
                  <div className="mt-2 flex gap-2">
                    {p.status === 'PLANNED' && <Button size="sm" variant="secondary" onClick={() => advancePlan(p.id, 'IN_PROGRESS')}>Start</Button>}
                    {p.status === 'IN_PROGRESS' && <Button size="sm" variant="secondary" onClick={() => advancePlan(p.id, 'COMPLETED')}>Mark complete</Button>}
                    {p.status === 'COMPLETED' && <Button size="sm" onClick={() => closePlan(p.id)}>Close</Button>}
                  </div>
                </li>
              ))}
              {actionPlans.length === 0 && <p className="text-sm text-ink-muted">No action plans yet.</p>}
            </ul>
          </Surface>
        )}

        {tab === 'compliance' && (
          <Surface>
            <h2 className="mb-3 text-sm font-semibold text-ink">Compliance calendar</h2>
            <div className="mb-4 flex flex-wrap items-end gap-2">
              <Field label="Requirement"><Input value={newRequirement} onChange={(e) => setNewRequirement(e.target.value)} placeholder="AICTE EOA submission" /></Field>
              <Field label="Authority"><Input value={newAuthority} onChange={(e) => setNewAuthority(e.target.value)} placeholder="AICTE" /></Field>
              <Field label="Due date"><Input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} /></Field>
              <Button onClick={createComplianceItem}>Add</Button>
            </div>
            <ul className="space-y-2">
              {complianceItems.map((i) => (
                <li key={i.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                  <span>{i.requirement} — {i.authority} (due {i.due_date?.toString().slice(0, 10)})</span>
                  <StatusBadge status={i.isOverdue ? 'OVERDUE' : i.status} />
                </li>
              ))}
              {complianceItems.length === 0 && <p className="text-sm text-ink-muted">No compliance items tracked yet.</p>}
            </ul>
          </Surface>
        )}
      </div>
    </div>
  );
}

function VersionCreator({ onCreate }: { onCreate: (label: string) => void }) {
  const [label, setLabel] = useState('');
  return (
    <div className="mt-2 flex gap-2">
      <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Version label (e.g. 2025)" className="max-w-[200px]" />
      <Button size="sm" variant="secondary" onClick={() => { onCreate(label); setLabel(''); }}>Add version</Button>
    </div>
  );
}
