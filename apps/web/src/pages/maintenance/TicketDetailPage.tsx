import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  PageHeader, Surface, Button, Input, Select, Textarea, Field, Modal, Badge, Skeleton, useToast, SectionTitle,
} from '../../components/ui';
import { maintApi, type TicketDetail, type Team, SLA_TONE, fmtDateTime, relDue } from '../../lib/maintenanceApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useMaintMeta } from './shared';
import { PriorityBadge, StatusPill } from './components';

export function TicketDetailPage() {
  const { id } = useParams();
  const ticketId = Number(id);
  const nav = useNavigate();
  const { toast } = useToast();
  const meta = useMaintMeta();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [comment, setComment] = useState('');
  const [commentInternal, setCommentInternal] = useState(false);
  const [modal, setModal] = useState<'assign' | 'resolve' | 'reopen' | 'part' | 'work' | 'priority' | 'escalate' | null>(null);

  useDocumentTitle(ticket ? ticket.ticketNo : 'Ticket');

  const load = useCallback(() => {
    setLoading(true);
    maintApi.ticket(ticketId).then(setTicket).catch(() => setTicket(null)).finally(() => setLoading(false));
  }, [ticketId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (meta?.isManager) maintApi.teams().then(setTeams).catch(() => {}); }, [meta]);

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    try { await fn(); toast(ok); setModal(null); load(); }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed', 'error'); }
  };

  if (loading) return <Skeleton className="h-64" />;
  if (!ticket) return <Surface><p className="text-sm text-ink-muted">Ticket not found or you don’t have access.</p></Surface>;

  const canWork = ticket.canWork;
  const isManager = meta?.isManager;
  const isReq = ticket.isRequester;
  const openish = !['CLOSED', 'CANCELLED'].includes(ticket.status);

  return (
    <div>
      <PageHeader
        title={`${ticket.ticketNo}`}
        subtitle={ticket.title}
        actions={<Button variant="secondary" onClick={() => nav(-1)}>Back</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-4 lg:col-span-2">
          <Surface>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <StatusPill status={ticket.status} />
              <PriorityBadge priority={ticket.priority} />
              {ticket.sla.overall !== 'NONE' && <Badge className={SLA_TONE[ticket.sla.overall]}>{ticket.sla.overall === 'BREACHED' ? 'SLA breached' : ticket.sla.overall === 'PAUSED' ? 'SLA paused' : `Resolve ${relDue(ticket.sla.resolveDueAt)}`}</Badge>}
              {ticket.escalationLevel !== 'NONE' && <Badge className="bg-danger-soft text-danger">Escalated: {ticket.escalationLevel}</Badge>}
              {ticket.reopenCount > 0 && <Badge className="bg-warning-soft text-warning">Reopened ×{ticket.reopenCount}</Badge>}
            </div>
            {ticket.description && <p className="whitespace-pre-wrap text-sm text-ink">{ticket.description}</p>}
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <Meta label="Category" value={ticket.categoryName} />
              <Meta label="Location" value={[ticket.roomName, ticket.building].filter(Boolean).join(' · ') || ticket.locationNote} />
              <Meta label="Source" value={ticket.sourceModule + (ticket.assetRef ? ` · ${ticket.assetRef}` : '')} />
              <Meta label="Team" value={ticket.teamName} />
              <Meta label="Assignee" value={ticket.assigneeName} />
              <Meta label="Requester" value={ticket.requesterName} />
              {ticket.erpModule && <Meta label="ERP module" value={`${ticket.erpModule}${ticket.erpRoute ? ` (${ticket.erpRoute})` : ''}`} />}
            </dl>
            {ticket.routingExplanation && <p className="mt-3 rounded-md bg-surface-muted/50 p-2 text-xs text-ink-muted">Routing: {ticket.routingExplanation}</p>}
            {ticket.resolutionSummary && <div className="mt-3 rounded-md border border-success/30 bg-success-soft/30 p-3 text-sm"><b>Resolution:</b> {ticket.resolutionSummary}</div>}
          </Surface>

          {/* Conversation */}
          <Surface>
            <SectionTitle title="Updates & comments" />
            <div className="space-y-3">
              {ticket.comments.length === 0 && <p className="text-sm text-ink-muted">No comments yet.</p>}
              {ticket.comments.map((c) => (
                <div key={c.id} className={`rounded-lg border p-3 text-sm ${c.visibility === 'INTERNAL' ? 'border-warning/40 bg-warning-soft/20' : 'border-border'}`}>
                  <div className="mb-1 flex items-center gap-2 text-xs text-ink-muted">
                    <span className="font-medium text-ink">{c.authorName ?? 'User'}</span>
                    {c.visibility === 'INTERNAL' && <Badge className="bg-warning-soft text-warning">Internal note</Badge>}
                    <span>{fmtDateTime(c.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{c.body}</p>
                </div>
              ))}
            </div>
            {openish && (
              <div className="mt-4 space-y-2">
                <Textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={commentInternal ? 'Internal note (staff only)…' : 'Add a comment…'} />
                <div className="flex items-center justify-between">
                  {canWork ? (
                    <label className="flex items-center gap-2 text-xs text-ink-muted">
                      <input type="checkbox" checked={commentInternal} onChange={(e) => setCommentInternal(e.target.checked)} /> Internal note (hidden from requester)
                    </label>
                  ) : <span />}
                  <Button size="sm" disabled={!comment.trim()} onClick={() => act(async () => { await maintApi.comment(ticketId, { body: comment, visibility: commentInternal ? 'INTERNAL' : 'REQUESTER' }); setComment(''); }, 'Posted')}>Post</Button>
                </div>
              </div>
            )}
          </Surface>

          {/* Work notes & parts (staff only) */}
          {canWork && (
            <Surface>
              <div className="flex items-center justify-between"><SectionTitle title="Work log & parts" /></div>
              <div className="mb-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => setModal('work')}>Add work note</Button>
                <Button size="sm" variant="secondary" onClick={() => setModal('part')}>Request part</Button>
              </div>
              {ticket.parts.length > 0 && (
                <div className="mb-3 space-y-1 text-sm">
                  {ticket.parts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between rounded-md bg-surface-muted/40 px-3 py-1.5">
                      <span>{p.quantity} × {p.item} {p.estimatedCost != null && <span className="text-ink-muted">· ₹{p.estimatedCost}</span>}</span>
                      <span className="flex items-center gap-2"><Badge>{p.status}</Badge>
                        {meta?.permissions.includes('maint.parts.approve') && p.status === 'REQUESTED' && (
                          <>
                            <Button size="sm" onClick={() => act(() => maintApi.decidePart(ticketId, p.id, { status: 'APPROVED' }), 'Approved')}>Approve</Button>
                            <Button size="sm" variant="danger-soft" onClick={() => act(() => maintApi.decidePart(ticketId, p.id, { status: 'REJECTED' }), 'Rejected')}>Reject</Button>
                          </>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="space-y-2">
                {ticket.workLogs.length === 0 && <p className="text-sm text-ink-muted">No work logged yet.</p>}
                {ticket.workLogs.map((w) => (
                  <div key={w.id} className="rounded-lg border border-border p-3 text-sm">
                    <div className="mb-1 text-xs text-ink-muted">{w.technicianName} · {fmtDateTime(w.createdAt)}{w.minutesSpent ? ` · ${w.minutesSpent} min` : ''}</div>
                    <p className="whitespace-pre-wrap">{w.workPerformed}</p>
                    {w.diagnosis && <p className="text-xs text-ink-muted">Diagnosis: {w.diagnosis}</p>}
                    {w.nextStep && <p className="text-xs text-ink-muted">Next: {w.nextStep}</p>}
                  </div>
                ))}
              </div>
            </Surface>
          )}
        </div>

        {/* Sidebar: actions + timeline */}
        <div className="space-y-4">
          <Surface>
            <SectionTitle title="Actions" />
            <div className="flex flex-col gap-2">
              {canWork && openish && ticket.status !== 'RESOLVED' && (
                <>
                  {!ticket.acknowledgedAt && <Button size="sm" variant="secondary" onClick={() => act(() => maintApi.acknowledge(ticketId), 'Acknowledged')}>Acknowledge</Button>}
                  {ticket.status !== 'IN_PROGRESS' && <Button size="sm" variant="secondary" onClick={() => act(() => maintApi.start(ticketId), 'Work started')}>Start work</Button>}
                  <Button size="sm" onClick={() => setModal('resolve')}>Mark resolved</Button>
                  <div className="grid grid-cols-3 gap-1">
                    <Button size="sm" variant="ghost" onClick={() => act(() => maintApi.setStatus(ticketId, { status: 'WAITING_APPROVAL' }), 'Updated')}>Wait: approval</Button>
                    <Button size="sm" variant="ghost" onClick={() => act(() => maintApi.setStatus(ticketId, { status: 'WAITING_REQUESTER' }), 'Updated')}>Wait: requester</Button>
                    <Button size="sm" variant="ghost" onClick={() => setModal('escalate')}>Escalate</Button>
                  </div>
                </>
              )}
              {isManager && openish && <Button size="sm" variant="secondary" onClick={() => setModal('assign')}>Assign / reassign</Button>}
              {isManager && openish && <Button size="sm" variant="ghost" onClick={() => setModal('priority')}>Change priority</Button>}
              {isReq && ticket.status === 'RESOLVED' && <Button size="sm" onClick={() => act(() => maintApi.confirm(ticketId), 'Confirmed & closed')}>Confirm fixed</Button>}
              {isReq && ['RESOLVED', 'CLOSED'].includes(ticket.status) && <Button size="sm" variant="danger-soft" onClick={() => setModal('reopen')}>Reopen</Button>}
              {!canWork && !isManager && !isReq && <p className="text-sm text-ink-muted">Oversight view — read only.</p>}
            </div>
          </Surface>

          <Surface>
            <SectionTitle title="Timeline" />
            <ol className="space-y-3">
              {ticket.timeline.map((e) => (
                <li key={e.id} className="flex gap-2 text-sm">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" aria-hidden />
                  <div>
                    <div className="text-xs text-ink-muted">{fmtDateTime(e.createdAt)} · {e.actorName ?? 'System'}{e.visibility === 'INTERNAL' ? ' · internal' : ''}</div>
                    <div>{labelEvent(e.type)}{e.note ? <span className="text-ink-muted"> — {e.note}</span> : ''}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Surface>
        </div>
      </div>

      {modal === 'assign' && <AssignModal teams={teams} onClose={() => setModal(null)} onSubmit={(b) => act(() => maintApi.assign(ticketId, b), 'Assigned')} />}
      {modal === 'resolve' && <ResolveModal onClose={() => setModal(null)} onSubmit={(b) => act(() => maintApi.resolve(ticketId, b), 'Resolved')} />}
      {modal === 'reopen' && <TextModal title="Reopen ticket" label="Why is it not fixed?" onClose={() => setModal(null)} onSubmit={(reason) => act(() => maintApi.reopen(ticketId, { reason }), 'Reopened')} />}
      {modal === 'part' && <PartModal onClose={() => setModal(null)} onSubmit={(b) => act(() => maintApi.requestPart(ticketId, b), 'Part requested')} />}
      {modal === 'work' && <WorkModal onClose={() => setModal(null)} onSubmit={(b) => act(() => maintApi.workLog(ticketId, b), 'Work logged')} />}
      {modal === 'priority' && <PriorityModal current={ticket.priority} onClose={() => setModal(null)} onSubmit={(priority, reason) => act(() => maintApi.setPriority(ticketId, { priority, reason }), 'Priority updated')} />}
      {modal === 'escalate' && <EscalateModal onClose={() => setModal(null)} onSubmit={(level, reason) => act(() => maintApi.escalate(ticketId, { level, reason }), 'Escalated')} />}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string | null | undefined }) {
  return <div><dt className="text-xs uppercase tracking-wide text-ink-muted">{label}</dt><dd className="mt-0.5">{value || '—'}</dd></div>;
}
function labelEvent(type: string) {
  const m: Record<string, string> = {
    CREATED: 'Ticket raised', ROUTED: 'Auto-routed', ASSIGNED: 'Assigned', REASSIGNED: 'Reassigned',
    ACKNOWLEDGED: 'Acknowledged', STARTED: 'Work started', STATUS_CHANGE: 'Status changed', PRIORITY_CHANGE: 'Priority changed',
    WORK_LOG: 'Work logged', PART_REQUEST: 'Part requested', APPROVAL: 'Part decision', RESOLVED: 'Resolved',
    CONFIRMED: 'Confirmed by requester', REOPENED: 'Reopened', CLOSED: 'Closed', ESCALATED: 'Escalated',
    SLA_PAUSE: 'SLA paused', SLA_RESUME: 'SLA resumed', COMMENT: 'Comment', VENDOR: 'Vendor update',
  };
  return m[type] ?? type;
}

function AssignModal({ teams, onClose, onSubmit }: { teams: Team[]; onClose: () => void; onSubmit: (b: Record<string, unknown>) => void }) {
  const [teamId, setTeamId] = useState('');
  const [techId, setTechId] = useState('');
  const team = teams.find((t) => String(t.id) === teamId);
  return (
    <Modal open title="Assign / reassign" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSubmit({ teamId: teamId ? Number(teamId) : undefined, technicianId: techId ? Number(techId) : null })}>Save</Button></>}>
      <div className="grid gap-3">
        <Field label="Team"><Select value={teamId} onChange={(e) => { setTeamId(e.target.value); setTechId(''); }}><option value="">Keep current</option>{teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</Select></Field>
        <Field label="Technician"><Select value={techId} onChange={(e) => setTechId(e.target.value)}><option value="">Unassigned (team queue)</option>{team?.members.map((m) => <option key={m.facultyId} value={m.facultyId}>{m.name}{m.isLead ? ' (lead)' : ''}</option>)}</Select></Field>
      </div>
    </Modal>
  );
}
function ResolveModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (b: Record<string, unknown>) => void }) {
  const [summary, setSummary] = useState('');
  return (
    <Modal open title="Mark resolved" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={summary.trim().length < 3} onClick={() => onSubmit({ resolutionSummary: summary })}>Resolve</Button></>}>
      <Field label="Resolution summary"><Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What was done to fix it?" /></Field>
    </Modal>
  );
}
function TextModal({ title, label, onClose, onSubmit }: { title: string; label: string; onClose: () => void; onSubmit: (v: string) => void }) {
  const [v, setV] = useState('');
  return <Modal open title={title} onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!v.trim()} onClick={() => onSubmit(v)}>Submit</Button></>}><Field label={label}><Textarea rows={2} value={v} onChange={(e) => setV(e.target.value)} /></Field></Modal>;
}
function PartModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (b: Record<string, unknown>) => void }) {
  const [f, setF] = useState({ item: '', quantity: '1', reason: '', estimatedCost: '' });
  return (
    <Modal open title="Request part / material" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!f.item.trim()} onClick={() => onSubmit({ item: f.item, quantity: Number(f.quantity) || 1, reason: f.reason || undefined, estimatedCost: f.estimatedCost ? Number(f.estimatedCost) : undefined })}>Request</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Item"><Input value={f.item} onChange={(e) => setF((v) => ({ ...v, item: e.target.value }))} /></Field>
        <Field label="Quantity"><Input type="number" value={f.quantity} onChange={(e) => setF((v) => ({ ...v, quantity: e.target.value }))} /></Field>
        <Field label="Est. cost (₹)"><Input type="number" value={f.estimatedCost} onChange={(e) => setF((v) => ({ ...v, estimatedCost: e.target.value }))} /></Field>
      </div>
      <div className="mt-3"><Field label="Reason"><Input value={f.reason} onChange={(e) => setF((v) => ({ ...v, reason: e.target.value }))} /></Field></div>
      <p className="mt-2 text-xs text-ink-muted">Approved parts hand off to Stores/Purchase when that module goes live.</p>
    </Modal>
  );
}
function WorkModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (b: Record<string, unknown>) => void }) {
  const [f, setF] = useState({ workPerformed: '', diagnosis: '', nextStep: '', minutesSpent: '' });
  return (
    <Modal open title="Add work note" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button disabled={!f.workPerformed.trim()} onClick={() => onSubmit({ workPerformed: f.workPerformed, diagnosis: f.diagnosis || undefined, nextStep: f.nextStep || undefined, minutesSpent: f.minutesSpent ? Number(f.minutesSpent) : undefined })}>Log</Button></>}>
      <div className="grid gap-3">
        <Field label="Work performed"><Textarea rows={2} value={f.workPerformed} onChange={(e) => setF((v) => ({ ...v, workPerformed: e.target.value }))} /></Field>
        <Field label="Diagnosis (optional)"><Input value={f.diagnosis} onChange={(e) => setF((v) => ({ ...v, diagnosis: e.target.value }))} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Next step (optional)"><Input value={f.nextStep} onChange={(e) => setF((v) => ({ ...v, nextStep: e.target.value }))} /></Field>
          <Field label="Minutes spent"><Input type="number" value={f.minutesSpent} onChange={(e) => setF((v) => ({ ...v, minutesSpent: e.target.value }))} /></Field>
        </div>
      </div>
    </Modal>
  );
}
function PriorityModal({ current, onClose, onSubmit }: { current: string; onClose: () => void; onSubmit: (p: string, r: string) => void }) {
  const [p, setP] = useState(current); const [r, setR] = useState('');
  return <Modal open title="Change priority" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSubmit(p, r)}>Save</Button></>}>
    <Field label="Priority"><Select value={p} onChange={(e) => setP(e.target.value)}>{['LOW', 'NORMAL', 'HIGH', 'CRITICAL'].map((x) => <option key={x}>{x}</option>)}</Select></Field>
    <div className="mt-3"><Field label="Reason"><Input value={r} onChange={(e) => setR(e.target.value)} /></Field></div>
  </Modal>;
}
function EscalateModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (l: 'MANAGER' | 'PRINCIPAL', r: string) => void }) {
  const [l, setL] = useState<'MANAGER' | 'PRINCIPAL'>('MANAGER'); const [r, setR] = useState('');
  return <Modal open title="Escalate ticket" onClose={onClose} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={() => onSubmit(l, r)}>Escalate</Button></>}>
    <Field label="Escalate to"><Select value={l} onChange={(e) => setL(e.target.value as 'MANAGER' | 'PRINCIPAL')}><option value="MANAGER">Maintenance Manager</option><option value="PRINCIPAL">Principal</option></Select></Field>
    <div className="mt-3"><Field label="Reason"><Textarea rows={2} value={r} onChange={(e) => setR(e.target.value)} /></Field></div>
  </Modal>;
}
