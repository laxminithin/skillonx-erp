import { useEffect, useState, useCallback } from 'react';
import { PageHeader, Surface, Button, Input, Select, Field, Drawer, Modal, StatusBadge, Badge, EmptyState, Skeleton, useToast } from '../../components/ui';
import { labApi, canLab, type Lab } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useLabMeta } from './shared';

export function LabsPage() {
  useDocumentTitle('Labs');
  const meta = useLabMeta();
  const { toast } = useToast();
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    labApi.labs().then(setLabs).catch(() => setLabs([])).finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const canManage = canLab(meta, 'lab.master.manage');

  return (
    <div>
      <PageHeader title="Labs" subtitle="Laboratories you are responsible for" actions={canManage ? <Button onClick={() => setCreating(true)}>New lab</Button> : undefined} />
      {loading ? <Skeleton className="h-40" /> : labs.length === 0 ? (
        <EmptyState title="No labs" body="No laboratories are assigned to you yet." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {labs.map((l) => (
            <Surface key={l.id} className="cursor-pointer transition hover:border-accent/40" >
              <button type="button" className="w-full text-left" onClick={() => setDetailId(l.id)}>
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-semibold text-ink">{l.name}</p><p className="font-mono text-xs text-ink-muted">{l.code}</p></div>
                  <StatusBadge status={l.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-ink-muted">
                  <Badge>{l.labType}</Badge>
                  {l.departmentName && <Badge>{l.departmentName}</Badge>}
                  {l.roomName && <Badge>{l.roomName}</Badge>}
                  {l.capacity != null && <span className="self-center">Cap {l.capacity}</span>}
                </div>
              </button>
            </Surface>
          ))}
        </div>
      )}

      {detailId != null && <LabDetail id={detailId} canManage={canManage} onClose={() => setDetailId(null)} onChanged={load} />}
      {creating && <LabCreate onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load(); toast('Lab created'); }} />}
    </div>
  );
}

function LabDetail({ id, canManage, onClose, onChanged }: { id: number; canManage: boolean; onClose: () => void; onChanged: () => void }) {
  const { toast } = useToast();
  const [lab, setLab] = useState<Lab | null>(null);
  const [assignFac, setAssignFac] = useState('');
  const [assignRole, setAssignRole] = useState<'LAB_ASSISTANT' | 'LAB_INCHARGE'>('LAB_ASSISTANT');
  const load = useCallback(() => { labApi.lab(id).then(setLab).catch(() => setLab(null)); }, [id]);
  useEffect(() => { load(); }, [load]);
  const canAssign = canManage; // assignment.manage overlaps with master.manage for admin/HOD

  const addAssignment = async () => {
    if (!assignFac) { toast('Faculty id required', 'error'); return; }
    try { await labApi.assignLab(id, { facultyId: Number(assignFac), assignmentRole: assignRole }); toast('Assigned'); setAssignFac(''); load(); onChanged(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };
  const endAssignment = async (aid: number) => {
    try { await labApi.endAssignment(aid); toast('Assignment ended'); load(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };

  return (
    <Drawer open title={lab?.name ?? 'Lab'} description={lab?.code} onClose={onClose} width="md">
      {!lab ? <Skeleton className="h-40" /> : (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2"><StatusBadge status={lab.status} /><Badge>{lab.labType}</Badge>{lab.departmentName && <Badge>{lab.departmentName}</Badge>}</div>
          {lab.description && <p className="text-sm text-ink-secondary">{lab.description}</p>}
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-xs uppercase text-ink-muted">Room</dt><dd>{lab.roomName ?? '—'}{lab.building ? ` · ${lab.building}` : ''}</dd></div>
            <div><dt className="text-xs uppercase text-ink-muted">Capacity</dt><dd>{lab.capacity ?? '—'}</dd></div>
          </dl>
          <div>
            <p className="mb-2 text-sm font-semibold">Assignments</p>
            {(lab.assignments ?? []).length === 0 ? <p className="text-sm text-ink-muted">No active assignments.</p> : (
              <ul className="space-y-2">
                {(lab.assignments ?? []).map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm">
                    <span><span className="font-medium">{a.facultyName}</span> <Badge className="ml-1">{a.assignmentRole === 'LAB_INCHARGE' ? 'In-charge' : 'Assistant'}</Badge></span>
                    {canAssign && <Button size="sm" variant="danger-soft" onClick={() => endAssignment(a.id)}>End</Button>}
                  </li>
                ))}
              </ul>
            )}
            {canAssign && (
              <div className="mt-3 flex flex-wrap items-end gap-2">
                <Field label="Faculty ID"><Input value={assignFac} onChange={(e) => setAssignFac(e.target.value)} className="w-32" placeholder="faculty id" /></Field>
                <Field label="Role"><Select value={assignRole} onChange={(e) => setAssignRole(e.target.value as any)}><option value="LAB_ASSISTANT">Assistant</option><option value="LAB_INCHARGE">In-charge</option></Select></Field>
                <Button size="sm" onClick={addAssignment}>Assign</Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}

function LabCreate({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<{ id: number; name: string }[]>([]);
  const [f, setF] = useState({ name: '', code: '', labType: 'COMPUTING', roomId: '', capacity: '', description: '' });
  const [saving, setSaving] = useState(false);
  useEffect(() => { labApi.rooms().then((r) => setRooms(r)).catch(() => setRooms([])); }, []);
  const submit = async () => {
    if (!f.name || !f.code) { toast('Name and code are required', 'error'); return; }
    setSaving(true);
    try {
      await labApi.createLab({ name: f.name, code: f.code, labType: f.labType, roomId: f.roomId ? Number(f.roomId) : null, capacity: f.capacity ? Number(f.capacity) : null, description: f.description || null });
      onCreated();
    } catch (e) { toast(e instanceof Error ? e.message : 'Create failed', 'error'); } finally { setSaving(false); }
  };
  return (
    <Modal open title="New lab" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={submit} disabled={saving}>Create</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name"><Input value={f.name} onChange={(e) => setF((v) => ({ ...v, name: e.target.value }))} /></Field>
        <Field label="Code"><Input value={f.code} onChange={(e) => setF((v) => ({ ...v, code: e.target.value }))} /></Field>
        <Field label="Type"><Input value={f.labType} onChange={(e) => setF((v) => ({ ...v, labType: e.target.value }))} /></Field>
        <Field label="Room"><Select value={f.roomId} onChange={(e) => setF((v) => ({ ...v, roomId: e.target.value }))}><option value="">— none —</option>{rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</Select></Field>
        <Field label="Capacity"><Input type="number" value={f.capacity} onChange={(e) => setF((v) => ({ ...v, capacity: e.target.value }))} /></Field>
      </div>
      <div className="mt-3"><Field label="Description"><Input value={f.description} onChange={(e) => setF((v) => ({ ...v, description: e.target.value }))} /></Field></div>
    </Modal>
  );
}
