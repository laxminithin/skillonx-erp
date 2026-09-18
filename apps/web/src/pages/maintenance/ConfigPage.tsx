import { useCallback, useEffect, useState } from 'react';
import { PageHeader, Surface, Tabs, Button, Input, Select, Field, Modal, Badge, Skeleton, useToast } from '../../components/ui';
import { maintApi, type Category, type Team, type RoutingRule } from '../../lib/maintenanceApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

export function MaintenanceConfigPage() {
  useDocumentTitle('Maintenance Configuration');
  const [tab, setTab] = useState('teams');
  return (
    <div>
      <PageHeader title="Configuration" subtitle="Teams, categories and deterministic routing rules for the service desk." />
      <div className="mb-4"><Tabs tabs={[{ id: 'teams', label: 'Teams' }, { id: 'categories', label: 'Categories' }, { id: 'routing', label: 'Routing rules' }]} value={tab} onChange={setTab} /></div>
      {tab === 'teams' && <TeamsTab />}
      {tab === 'categories' && <CategoriesTab />}
      {tab === 'routing' && <RoutingTab />}
    </div>
  );
}

function TeamsTab() {
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Team | 'new' | null>(null);
  const load = useCallback(() => { setLoading(true); maintApi.teams().then(setTeams).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <Skeleton className="h-40" />;
  return (
    <div>
      <div className="mb-3 flex justify-end"><Button onClick={() => setModal('new')}>Add team</Button></div>
      <div className="grid gap-3 sm:grid-cols-2">
        {teams.map((t) => (
          <Surface key={t.id}>
            <div className="flex items-center justify-between">
              <div><span className="font-medium">{t.name}</span> <Badge>{t.kind}</Badge>{t.isTriage && <Badge className="ml-1 bg-warning-soft text-warning">Triage</Badge>}</div>
              <Button size="sm" variant="ghost" onClick={() => setModal(t)}>Edit members</Button>
            </div>
            <div className="mt-2 text-sm text-ink-muted">
              {t.members.length === 0 ? 'No members assigned.' : t.members.map((m) => `${m.name}${m.isLead ? ' (lead)' : ''}`).join(', ')}
            </div>
          </Surface>
        ))}
      </div>
      {modal && <TeamModal team={modal === 'new' ? null : modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); toast('Saved'); }} />}
    </div>
  );
}

function TeamModal({ team, onClose, onDone }: { team: Team | null; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({ code: team?.code ?? '', name: team?.name ?? '', kind: team?.kind ?? 'FACILITIES' });
  const [memberIds, setMemberIds] = useState<string>((team?.members.map((m) => m.facultyId) ?? []).join(','));
  const submit = async () => {
    try {
      const ids = memberIds.split(',').map((x) => Number(x.trim())).filter((n) => Number.isFinite(n) && n > 0);
      const body = { code: f.code, name: f.name, kind: f.kind, memberFacultyIds: ids };
      if (team) await maintApi.updateTeam(team.id, body); else await maintApi.createTeam(body);
      onDone();
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title={team ? `Edit ${team.name}` : 'Add team'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Code"><Input value={f.code} onChange={(e) => setF((v) => ({ ...v, code: e.target.value }))} disabled={!!team} /></Field>
        <Field label="Name"><Input value={f.name} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} /></Field>
        <Field label="Kind"><Select value={f.kind} onChange={(e) => setF((v) => ({ ...v, kind: e.target.value }))}><option>FACILITIES</option><option>IT</option></Select></Field>
      </div>
      <div className="mt-3"><Field label="Member faculty IDs (comma-separated)"><Input value={memberIds} onChange={(e) => setMemberIds(e.target.value)} placeholder="e.g. 12, 34" /></Field></div>
      <p className="mt-2 text-xs text-ink-muted">Technicians must be members of a team before they can be assigned its tickets.</p>
    </Modal>
  );
}

function CategoriesTab() {
  const { toast } = useToast();
  const [cats, setCats] = useState<Category[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<Category | 'new' | null>(null);
  const load = useCallback(() => { setLoading(true); Promise.all([maintApi.categories(), maintApi.teams()]).then(([c, t]) => { setCats(c); setTeams(t); }).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  if (loading) return <Skeleton className="h-40" />;
  return (
    <div>
      <div className="mb-3 flex justify-end"><Button onClick={() => setModal('new')}>Add category</Button></div>
      <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted"><th className="px-4 py-2">Name</th><th className="px-4 py-2">Kind</th><th className="px-4 py-2">Default team</th><th className="px-4 py-2">Priority</th><th className="px-4 py-2">Resolve SLA</th><th className="px-4 py-2">Active</th><th /></tr></thead>
          <tbody>
            {cats.map((c) => (
              <tr key={c.id} className="border-b border-border/60">
                <td className="px-4 py-2">{c.name}</td><td className="px-4 py-2">{c.kind}</td>
                <td className="px-4 py-2">{c.defaultTeamName ?? '—'}</td><td className="px-4 py-2">{c.defaultPriority}</td>
                <td className="px-4 py-2">{c.resolveSlaMins ? `${Math.round(c.resolveSlaMins / 60)}h` : '—'}</td>
                <td className="px-4 py-2">{c.isActive ? <Badge className="bg-success-soft text-success">Active</Badge> : <Badge>Off</Badge>}</td>
                <td className="px-4 py-2 text-right"><Button size="sm" variant="ghost" onClick={() => setModal(c)}>Edit</Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></Surface>
      {modal && <CategoryModal cat={modal === 'new' ? null : modal} teams={teams} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); toast('Saved'); }} />}
    </div>
  );
}

function CategoryModal({ cat, teams, onClose, onDone }: { cat: Category | null; teams: Team[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({
    code: cat?.code ?? '', name: cat?.name ?? '', kind: cat?.kind ?? 'FACILITIES',
    defaultTeamId: cat?.defaultTeamId ? String(cat.defaultTeamId) : '', defaultPriority: cat?.defaultPriority ?? 'NORMAL',
    ackSlaMins: cat?.ackSlaMins != null ? String(cat.ackSlaMins) : '', resolveSlaMins: cat?.resolveSlaMins != null ? String(cat.resolveSlaMins) : '',
    isActive: cat?.isActive ?? true,
  });
  const submit = async () => {
    try {
      const body = { code: f.code, name: f.name, kind: f.kind, defaultTeamId: f.defaultTeamId ? Number(f.defaultTeamId) : null, defaultPriority: f.defaultPriority, ackSlaMins: f.ackSlaMins ? Number(f.ackSlaMins) : null, resolveSlaMins: f.resolveSlaMins ? Number(f.resolveSlaMins) : null, isActive: f.isActive };
      if (cat) await maintApi.updateCategory(cat.id, body); else await maintApi.createCategory(body);
      onDone();
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title={cat ? `Edit ${cat.name}` : 'Add category'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Code"><Input value={f.code} onChange={(e) => setF((v) => ({ ...v, code: e.target.value }))} disabled={!!cat} /></Field>
        <Field label="Name"><Input value={f.name} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} /></Field>
        <Field label="Kind"><Select value={f.kind} onChange={(e) => setF((v) => ({ ...v, kind: e.target.value }))}><option>FACILITIES</option><option>IT</option></Select></Field>
        <Field label="Default team"><Select value={f.defaultTeamId} onChange={(e) => setF((v) => ({ ...v, defaultTeamId: e.target.value }))}><option value="">Triage</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
        <Field label="Default priority"><Select value={f.defaultPriority} onChange={(e) => setF((v) => ({ ...v, defaultPriority: e.target.value }))}>{['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].map((p) => <option key={p}>{p}</option>)}</Select></Field>
        <Field label="Ack SLA (mins)"><Input type="number" value={f.ackSlaMins} onChange={(e) => setF((v) => ({ ...v, ackSlaMins: e.target.value }))} /></Field>
        <Field label="Resolve SLA (mins)"><Input type="number" value={f.resolveSlaMins} onChange={(e) => setF((v) => ({ ...v, resolveSlaMins: e.target.value }))} /></Field>
        <Field label="Active"><Select value={f.isActive ? '1' : '0'} onChange={(e) => setF((v) => ({ ...v, isActive: e.target.value === '1' }))}><option value="1">Active</option><option value="0">Inactive</option></Select></Field>
      </div>
    </Modal>
  );
}

function RoutingTab() {
  const { toast } = useToast();
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'new' | RoutingRule | null>(null);
  const load = useCallback(() => { setLoading(true); Promise.all([maintApi.routingRules(), maintApi.teams(), maintApi.categories()]).then(([r, t, c]) => { setRules(r); setTeams(t); setCats(c); }).catch(() => {}).finally(() => setLoading(false)); }, []);
  useEffect(() => { load(); }, [load]);
  if (loading) return <Skeleton className="h-40" />;
  return (
    <div>
      <p className="mb-3 text-sm text-ink-muted">Rules are evaluated in ascending priority. The first rule whose predicates all match wins; otherwise the category default team, then Triage. Every route is explained on the ticket.</p>
      <div className="mb-3 flex justify-end"><Button onClick={() => setModal('new')}>Add rule</Button></div>
      <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted"><th className="px-4 py-2">#</th><th className="px-4 py-2">Rule</th><th className="px-4 py-2">Match</th><th className="px-4 py-2">→ Team</th><th className="px-4 py-2">Active</th><th /></tr></thead>
          <tbody>
            {rules.length === 0 && <tr><td className="px-4 py-4 text-ink-muted" colSpan={6}>No custom rules — category defaults + triage apply.</td></tr>}
            {rules.map((r) => (
              <tr key={r.id} className="border-b border-border/60">
                <td className="px-4 py-2">{r.priority}</td>
                <td className="px-4 py-2">{r.name}</td>
                <td className="px-4 py-2 text-xs">{[r.matchCategoryName && `cat=${r.matchCategoryName}`, r.matchSourceModule && `src=${r.matchSourceModule}`, r.matchBuilding && `bldg=${r.matchBuilding}`].filter(Boolean).join(', ') || 'any'}</td>
                <td className="px-4 py-2">{r.targetTeamName}</td>
                <td className="px-4 py-2">{r.isActive ? <Badge className="bg-success-soft text-success">On</Badge> : <Badge>Off</Badge>}</td>
                <td className="px-4 py-2 text-right"><div className="flex justify-end gap-1"><Button size="sm" variant="ghost" onClick={() => setModal(r)}>Edit</Button><Button size="sm" variant="danger-soft" onClick={async () => { try { await maintApi.deleteRoutingRule(r.id); load(); toast('Deleted'); } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); } }}>Delete</Button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div></Surface>
      {modal && <RuleModal rule={modal === 'new' ? null : modal} teams={teams} cats={cats} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); toast('Saved'); }} />}
    </div>
  );
}

function RuleModal({ rule, teams, cats, onClose, onDone }: { rule: RoutingRule | null; teams: Team[]; cats: Category[]; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [f, setF] = useState({
    name: rule?.name ?? '', priority: rule?.priority != null ? String(rule.priority) : '100',
    matchCategoryId: rule?.matchCategoryId ? String(rule.matchCategoryId) : '', matchSourceModule: rule?.matchSourceModule ?? '',
    matchBuilding: rule?.matchBuilding ?? '', targetTeamId: rule?.targetTeamId ? String(rule.targetTeamId) : '', explanation: rule?.explanation ?? '',
  });
  const submit = async () => {
    if (!f.targetTeamId) { toast('Choose a target team', 'error'); return; }
    try {
      const body = { name: f.name, priority: Number(f.priority) || 100, matchCategoryId: f.matchCategoryId ? Number(f.matchCategoryId) : null, matchSourceModule: f.matchSourceModule || null, matchBuilding: f.matchBuilding || null, targetTeamId: Number(f.targetTeamId), explanation: f.explanation || undefined };
      if (rule) await maintApi.updateRoutingRule(rule.id, body); else await maintApi.createRoutingRule(body);
      onDone();
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  return (
    <Modal open title={rule ? 'Edit rule' : 'Add routing rule'} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit}>Save</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><Input value={f.name} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} /></Field>
        <Field label="Priority (lower first)"><Input type="number" value={f.priority} onChange={(e) => setF((v) => ({ ...v, priority: e.target.value }))} /></Field>
        <Field label="Match category"><Select value={f.matchCategoryId} onChange={(e) => setF((v) => ({ ...v, matchCategoryId: e.target.value }))}><option value="">Any</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</Select></Field>
        <Field label="Match source"><Select value={f.matchSourceModule} onChange={(e) => setF((v) => ({ ...v, matchSourceModule: e.target.value }))}><option value="">Any</option>{['GENERAL', 'LAB', 'HOSTEL', 'LIBRARY', 'TRANSPORT', 'CLASSROOM', 'ERP'].map((s) => <option key={s}>{s}</option>)}</Select></Field>
        <Field label="Match building"><Input value={f.matchBuilding} onChange={(e) => setF((v) => ({ ...v, matchBuilding: e.target.value }))} placeholder="Any" /></Field>
        <Field label="Route to team"><Select value={f.targetTeamId} onChange={(e) => setF((v) => ({ ...v, targetTeamId: e.target.value }))}><option value="">Select…</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
      </div>
      <div className="mt-3"><Field label="Explanation (shown on ticket)"><Input value={f.explanation} onChange={(e) => setF((v) => ({ ...v, explanation: e.target.value }))} /></Field></div>
    </Modal>
  );
}
