import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Surface, Button, StatusBadge, EmptyState, Skeleton, Modal, Select, Textarea, useToast } from '../../components/ui';
import { labApi, canLab, type LabSession } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useLabMeta, fmtDate } from './shared';

const READINESS = ['NOT_STARTED', 'IN_PREPARATION', 'READY', 'ISSUE_REPORTED', 'COMPLETED'];

export function LabSessionsPage() {
  useDocumentTitle('Lab Sessions');
  const meta = useLabMeta();
  const { toast } = useToast();
  const [rows, setRows] = useState<LabSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<LabSession | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    labApi.upcomingSessions(7).then(setRows).catch(() => setRows([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);
  const canManage = canLab(meta, 'lab.session.manage');

  return (
    <div>
      <PageHeader title="Practical Sessions" subtitle="Upcoming practical sessions from the timetable, with readiness preparation" />
      {loading ? <Skeleton className="h-40" /> : rows.length === 0 ? <EmptyState title="No sessions" body="No practical sessions are scheduled in your labs this week." /> : (
        <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
              <th className="px-4 py-2.5">Date</th><th className="px-4 py-2.5">Time</th><th className="px-4 py-2.5">Lab</th>
              <th className="px-4 py-2.5">Course</th><th className="px-4 py-2.5">Batch</th><th className="px-4 py-2.5">Faculty</th>
              <th className="px-4 py-2.5">Readiness</th><th className="px-4 py-2.5"></th>
            </tr></thead>
            <tbody>
              {rows.map((s, i) => (
                <tr key={`${s.slotId}-${s.sessionDate}-${i}`} className="border-b border-border/60">
                  <td className="px-4 py-2.5 whitespace-nowrap">{fmtDate(s.sessionDate)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">{String(s.startTime).slice(0, 5)}–{String(s.endTime).slice(0, 5)}</td>
                  <td className="px-4 py-2.5">{s.labName}</td>
                  <td className="px-4 py-2.5">{s.courseTitle ?? '—'}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{s.batchName ?? '—'}</td>
                  <td className="px-4 py-2.5 text-ink-muted">{s.facultyName ?? '—'}</td>
                  <td className="px-4 py-2.5"><StatusBadge status={s.readinessStatus} /></td>
                  <td className="px-4 py-2.5 text-right">{canManage && <Button size="sm" variant="secondary" onClick={() => setActive(s)}>Prepare</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div></Surface>
      )}
      {active && <PrepareSession session={active} onClose={() => setActive(null)} onDone={() => { setActive(null); load(); toast('Readiness updated'); }} />}
    </div>
  );
}

function PrepareSession({ session, onClose, onDone }: { session: LabSession; onClose: () => void; onDone: () => void }) {
  const { toast } = useToast();
  const [checklist, setChecklist] = useState(session.checklist ?? []);
  const [status, setStatus] = useState(session.readinessStatus);
  const [notes, setNotes] = useState(session.notes ?? '');
  const [readinessId, setReadinessId] = useState<number | null>(session.readinessId);
  const [busy, setBusy] = useState(false);

  const ensure = useCallback(async () => {
    if (readinessId) return readinessId;
    const created = await labApi.prepareSession({ slotId: session.slotId, sessionDate: session.sessionDate });
    setReadinessId(created.id); setChecklist(created.checklist ?? checklist); setStatus(created.readinessStatus);
    return created.id as number;
  }, [readinessId, session, checklist]);
  useEffect(() => { ensure().catch(() => {}); }, [ensure]);

  const toggle = (key: string) => setChecklist((c) => c.map((it) => it.key === key ? { ...it, done: !it.done } : it));
  const save = async () => {
    setBusy(true);
    try { const id = await ensure(); await labApi.updateReadiness(id, { readinessStatus: status, checklist, notes: notes || null }); onDone(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); } finally { setBusy(false); }
  };

  return (
    <Modal open title={`Prepare — ${session.labName}`} description={`${fmtDate(session.sessionDate)} · ${String(session.startTime).slice(0, 5)}`} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} disabled={busy}>Save</Button></>}>
      <div className="space-y-2">
        {checklist.map((it) => (
          <label key={it.key} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={it.done} onChange={() => toggle(it.key)} className="h-4 w-4 rounded border-border" />
            <span>{it.label}</span>
          </label>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        <label className="text-sm"><span className="mb-1 block text-xs uppercase text-ink-muted">Readiness status</span>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>{READINESS.map((r) => <option key={r} value={r}>{r.replaceAll('_', ' ')}</option>)}</Select>
        </label>
        <label className="text-sm"><span className="mb-1 block text-xs uppercase text-ink-muted">Notes</span>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Equipment unavailable, replacements, issues…" />
        </label>
      </div>
    </Modal>
  );
}
