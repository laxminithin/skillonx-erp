import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader, Surface, Button, Input, Select, Textarea, Field, useToast, Badge } from '../../components/ui';
import { maintApi } from '../../lib/maintenanceApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useMaintMeta, useRooms } from './shared';

const GRIEVANCE_HINT = /harass|ragging|discrimin|abuse|grievance|complaint against|misconduct/i;

export function CreateTicketPage() {
  useDocumentTitle('Raise a Request');
  const nav = useNavigate();
  const { toast } = useToast();
  const meta = useMaintMeta();
  const rooms = useRooms();
  const [f, setF] = useState({
    categoryCode: '', title: '', description: '', priority: '', roomId: '', building: '',
    locationNote: '', sourceModule: 'GENERAL', erpModule: '', erpRoute: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const category = useMemo(() => meta?.categories.find((c) => c.code === f.categoryCode), [meta, f.categoryCode]);
  const isIt = category?.kind === 'IT';
  const isErp = f.categoryCode === 'ERP_APP';

  useEffect(() => {
    if (category) {
      setF((v) => ({
        ...v,
        sourceModule: isErp ? 'ERP' : ['PROJECTOR', 'COMPUTER'].includes(category.code) ? 'CLASSROOM' : v.sourceModule,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f.categoryCode]);

  const grievanceWarn = GRIEVANCE_HINT.test(`${f.title} ${f.description}`);

  const submit = async () => {
    if (!f.categoryCode) { toast('Choose a category', 'error'); return; }
    if (f.title.trim().length < 3) { toast('Add a short title', 'error'); return; }
    setSubmitting(true);
    try {
      const t = await maintApi.createTicket({
        categoryCode: f.categoryCode, title: f.title, description: f.description || undefined,
        priority: f.priority || undefined, roomId: f.roomId ? Number(f.roomId) : undefined,
        building: f.building || undefined, locationNote: f.locationNote || undefined,
        sourceModule: f.sourceModule, erpModule: isErp ? f.erpModule || undefined : undefined,
        erpRoute: isErp ? f.erpRoute || undefined : undefined,
      });
      toast(`Request ${t.ticketNo} created`);
      nav(`/maintenance/tickets/${t.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally { setSubmitting(false); }
  };

  return (
    <div>
      <PageHeader title="Raise a Service Request" subtitle="Report anything broken or needing service on campus — IT or facilities. Routing to the right team is automatic." />
      <Surface className="max-w-3xl">
        {grievanceWarn && (
          <div className="mb-4 rounded-lg border border-warning/40 bg-warning-soft/40 p-3 text-sm text-warning">
            This looks like it may be a personal grievance or welfare concern. Maintenance handles physical/IT service only —
            please use the Grievance / Student Welfare channel for those matters.
          </div>
        )}
        <div className="grid gap-4">
          <Field label="What kind of issue is it?">
            <Select value={f.categoryCode} onChange={(e) => setF((v) => ({ ...v, categoryCode: e.target.value }))}>
              <option value="">Select a category…</option>
              <optgroup label="IT / Systems">
                {meta?.categories.filter((c) => c.kind === 'IT').map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </optgroup>
              <optgroup label="Facilities">
                {meta?.categories.filter((c) => c.kind === 'FACILITIES').map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </optgroup>
            </Select>
          </Field>

          <Field label="Title"><Input value={f.title} onChange={(e) => setF((v) => ({ ...v, title: e.target.value }))} placeholder="e.g. Projector won’t switch on in Room 204" /></Field>
          <Field label="Describe the problem"><Textarea rows={3} value={f.description} onChange={(e) => setF((v) => ({ ...v, description: e.target.value }))} placeholder="What is happening? Since when? Anything you already tried." /></Field>

          {isErp ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Which module?"><Input value={f.erpModule} onChange={(e) => setF((v) => ({ ...v, erpModule: e.target.value }))} placeholder="e.g. Examination, Finance" /></Field>
              <Field label="Page / route (optional)"><Input value={f.erpRoute} onChange={(e) => setF((v) => ({ ...v, erpRoute: e.target.value }))} placeholder="e.g. /examinations/marks" /></Field>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Location (room)">
                <Select value={f.roomId} onChange={(e) => setF((v) => ({ ...v, roomId: e.target.value }))}>
                  <option value="">Not sure / not applicable</option>
                  {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}{r.building ? ` — ${r.building}` : ''}</option>)}
                </Select>
              </Field>
              <Field label="Location note (optional)"><Input value={f.locationNote} onChange={(e) => setF((v) => ({ ...v, locationNote: e.target.value }))} placeholder="e.g. near the entrance, 2nd bench" /></Field>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Priority">
              <Select value={f.priority} onChange={(e) => setF((v) => ({ ...v, priority: e.target.value }))}>
                <option value="">Auto ({category?.defaultPriority ?? 'Normal'})</option>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High — operations affected</option>
              </Select>
            </Field>
            {category && (
              <div className="flex items-end pb-1 text-xs text-ink-muted">
                <span>Routes to <Badge>{category.defaultTeamName ?? 'Triage'}</Badge> · target {category.resolveSlaMins ? `${Math.round(category.resolveSlaMins / 60)}h` : 'n/a'}</span>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => nav('/maintenance')}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit request'}</Button>
          </div>
        </div>
      </Surface>
    </div>
  );
}
