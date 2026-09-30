import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, Download, MapPin } from 'lucide-react';
import { Button, EmptyState, Field, Input, Modal, PageHeader, SectionTitle, Select, Skeleton, Surface, Textarea, useToast } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  eventsApi,
  formatWhen,
  type Blocker,
  type EventDetail,
  type EventDocument,
  type EventInternal,
  type Paged,
  type Registration,
  type Resource,
} from '../../lib/eventsApi';
import { EventStatusBadge, downloadWithAuth, errorText, fileToBase64, isPast, useEventsMeta } from './shared';

type Dialog =
  | { kind: 'review'; action: 'APPROVE' | 'RETURN' | 'REJECT' }
  | { kind: 'cancel' }
  | { kind: 'reschedule' }
  | { kind: 'override' }
  | { kind: 'complete' }
  | { kind: 'resources' }
  | { kind: 'external' }
  | null;

function Info({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

export function EventDetailPage() {
  const { id } = useParams();
  const eventId = Number(id);
  const nav = useNavigate();
  const { toast } = useToast();
  const { meta, can } = useEventsMeta();
  const [ev, setEv] = useState<EventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(ev?.title ?? 'Event');

  const load = useCallback(() => {
    eventsApi.get(eventId).then(setEv).catch((e) => setError(errorText(e)));
  }, [eventId]);
  useEffect(() => { load(); }, [load]);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast(ok);
      setDialog(null);
      load();
    } catch (err) {
      toast(errorText(err), 'error');
      load();
    } finally {
      setBusy(false);
    }
  }

  if (error) return <EmptyState title="Event not available" body={error} action={<Button variant="secondary" onClick={() => nav('/events')}>Back to events</Button>} />;
  if (!ev) return <Skeleton className="h-96" />;

  const internal = ev.view === 'INTERNAL' ? (ev as EventInternal) : null;
  const manage = !!internal?.canManage;
  const isOrganizer = internal ? internal.organizerFacultyId === meta?.facultyUserId : false;
  const reviewer = !!internal && ev.status === 'UNDER_REVIEW' && can('events.event.review') && !isOrganizer
    && (internal.workflow?.currentStep?.allowedRoles.includes(meta?.role ?? '') || meta?.role === 'COLLEGE_ADMIN' || meta?.role === 'SUPER_ADMIN');
  const frozen = ['COMPLETED', 'CLOSED', 'REJECTED', 'CANCELLED'].includes(ev.status);
  const started = isPast(ev.startsAt);
  const ended = isPast(ev.endsAt);

  return (
    <div>
      <PageHeader
        title={ev.title}
        breadcrumb={<Link to="/events" className="hover:underline">Events & Resources</Link>}
        subtitle={`${formatWhen(ev.startsAt, ev.endsAt)} · ${ev.departmentName ?? ev.organizerUnitName ?? 'Institution'}${ev.organizerName ? ` · Organiser: ${ev.organizerName}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <EventStatusBadge status={ev.status} />
            {manage && ['DRAFT', 'RETURNED'].includes(ev.status) ? (
              <>
                <Button variant="secondary" size="sm" onClick={() => nav(`/events/${ev.id}/edit`)}>Edit</Button>
                <Button size="sm" disabled={busy} onClick={() => run(() => eventsApi.submit(ev.id), 'Submitted for approval')}>Submit for approval</Button>
              </>
            ) : null}
            {manage && ev.status === 'APPROVED' ? (
              <Button size="sm" disabled={busy} onClick={() => run(() => eventsApi.schedule(ev.id), 'Event scheduled')}>Retry scheduling</Button>
            ) : null}
            {manage && ['APPROVED', 'SCHEDULED'].includes(ev.status) && !started ? (
              <Button variant="secondary" size="sm" onClick={() => setDialog({ kind: 'reschedule' })}>Reschedule</Button>
            ) : null}
            {manage && ev.status === 'SCHEDULED' && ended ? (
              <Button size="sm" onClick={() => setDialog({ kind: 'complete' })}>Complete & report</Button>
            ) : null}
            {manage && ev.status === 'COMPLETED' ? (
              <Button variant="secondary" size="sm" onClick={() => setDialog({ kind: 'complete' })}>Correct report</Button>
            ) : null}
            {internal && ev.status === 'COMPLETED' && can('events.event.close') && !isOrganizer ? (
              <Button size="sm" disabled={busy} onClick={() => run(() => eventsApi.close(ev.id), 'Event closed')}>Close event</Button>
            ) : null}
            {reviewer ? (
              <>
                <Button size="sm" onClick={() => setDialog({ kind: 'review', action: 'APPROVE' })}>Approve</Button>
                <Button variant="secondary" size="sm" onClick={() => setDialog({ kind: 'review', action: 'RETURN' })}>Return</Button>
                <Button variant="danger-soft" size="sm" onClick={() => setDialog({ kind: 'review', action: 'REJECT' })}>Reject</Button>
              </>
            ) : null}
            {internal && !frozen && ev.status !== 'UNDER_REVIEW' && (manage || (can('events.event.close') && !['DRAFT', 'RETURNED'].includes(ev.status))) ? (
              <Button variant="danger-soft" size="sm" onClick={() => setDialog({ kind: 'cancel' })}>Cancel event</Button>
            ) : null}
          </div>
        }
      />

      {internal?.lastSchedulingError && ev.status === 'APPROVED' ? (
        <div role="alert" className="mb-4 flex gap-2 rounded-md border border-warning/40 bg-warning/5 px-3 py-2.5 text-sm text-ink">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden />
          <div>
            <p className="font-medium">Approved, but not scheduled — the venue could not be confirmed.</p>
            <p className="text-ink-secondary">{internal.lastSchedulingError}</p>
            <p className="mt-1 text-ink-muted">Change the venue or reschedule, then retry scheduling. The event is not published until it is scheduled.</p>
          </div>
        </div>
      ) : null}
      {internal?.reviewRemarks && ['RETURNED', 'REJECTED'].includes(ev.status) ? (
        <div className="mb-4 rounded-md border border-border bg-surface-muted/60 px-3 py-2.5 text-sm"><span className="font-medium">Reviewer remarks: </span>{internal.reviewRemarks}</div>
      ) : null}
      {internal?.cancellationReason && ev.status === 'CANCELLED' ? (
        <div className="mb-4 rounded-md border border-danger/30 bg-danger/5 px-3 py-2.5 text-sm"><span className="font-medium">Cancelled: </span>{internal.cancellationReason}</div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Surface>
            <SectionTitle title="About" />
            {ev.description ? <p className="whitespace-pre-line text-sm text-ink">{ev.description}</p> : <p className="text-sm text-ink-muted">No description.</p>}
            {ev.objective ? <p className="mt-3 text-sm text-ink"><span className="font-medium">Objective: </span>{ev.objective}</p> : null}
            <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Info label="Type">{ev.eventType.replaceAll('_', ' ').toLowerCase()}</Info>
              <Info label="Visible to">{ev.visibility === 'INSTITUTION' ? 'Institution' : 'Department'}</Info>
              <Info label="Venue">{ev.venues.length ? ev.venues.join(', ') : ev.externalVenue ?? 'Not confirmed'}</Info>
              <Info label="Registration">{ev.registrationEnabled ? `${ev.registrationAudience === 'ALL' ? 'Students & staff' : ev.registrationAudience.toLowerCase()}` : 'Not required'}</Info>
              {ev.registrationCapacity != null ? <Info label="Seats left">{ev.seatsRemaining} / {ev.registrationCapacity}</Info> : null}
              {internal ? <Info label="Expected">{internal.expectedParticipants ?? '—'}</Info> : null}
              {internal?.plannedBudget != null ? <Info label="Planned budget">₹{internal.plannedBudget.toLocaleString()}</Info> : null}
              {internal?.capacityOverride ? <Info label="Capacity override">{internal.capacityOverrideReason}</Info> : null}
              {internal?.rescheduleCount ? <Info label="Rescheduled">{internal.rescheduleCount}×</Info> : null}
            </dl>
            {internal?.outcomeSummary ? (
              <div className="mt-4 border-t border-border pt-3">
                <p className="text-xs text-ink-muted">Event report · {internal.actualParticipants ?? 0} attended</p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink">{internal.outcomeSummary}</p>
              </div>
            ) : null}
          </Surface>

          {internal ? (
            <Surface>
              <SectionTitle
                title="Venue & resources"
                action={
                  <div className="flex flex-wrap gap-2">
                    {can('events.capacity.override') && !frozen && !internal.capacityOverride ? (
                      <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: 'override' })}>Override capacity</Button>
                    ) : null}
                    {manage && ['DRAFT', 'RETURNED', 'APPROVED', 'SCHEDULED'].includes(ev.status) ? (
                      <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: 'resources' })}>Add resource</Button>
                    ) : null}
                  </div>
                }
              />
              {!internal.reservations.length ? (
                <p className="text-sm text-ink-muted">No venue or equipment requested yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {internal.reservations.map((r) => (
                    <li key={r.id} className="flex flex-wrap items-center gap-2 py-2.5 text-sm">
                      <MapPin size={14} className="text-ink-muted" aria-hidden />
                      <span className="min-w-0 flex-1 font-medium text-ink">{r.resourceName}</span>
                      <EventStatusBadge status={r.status} />
                      {manage && ['REQUESTED', 'CONFIRMED'].includes(r.status) && !frozen && ev.status !== 'UNDER_REVIEW' ? (
                        <Button size="sm" variant="ghost" disabled={busy} onClick={() => run(() => eventsApi.removeReservation(ev.id, r.id), 'Released')}>Release</Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs text-ink-muted">Requested resources do not hold the slot; they are confirmed atomically when the event is approved.</p>
            </Surface>
          ) : null}

          {internal ? <Participants ev={internal} manage={manage} started={started} onChanged={load} openExternal={() => setDialog({ kind: 'external' })} /> : null}
          {internal ? <Documents ev={internal} manage={manage} frozen={['CLOSED', 'REJECTED', 'CANCELLED'].includes(ev.status)} /> : null}
        </div>

        <div className="space-y-4">
          {!internal && ev.status === 'SCHEDULED' && ev.registrationEnabled && ev.registrationAudience !== 'STUDENTS' ? (
            <Surface>
              <SectionTitle title="Registration" />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" disabled={busy} onClick={() => run(() => eventsApi.register(ev.id), 'You are registered')}>Register</Button>
                <Button size="sm" variant="secondary" disabled={busy} onClick={() => run(() => eventsApi.unregister(ev.id), 'Registration cancelled')}>Cancel my registration</Button>
              </div>
            </Surface>
          ) : null}
          {internal?.workflow ? (
            <Surface>
              <SectionTitle title="Approval trail" />
              {internal.workflow.currentStep && ev.status === 'UNDER_REVIEW' ? (
                <p className="mb-3 text-sm text-ink">Waiting at <span className="font-medium">{internal.workflow.currentStep.name}</span></p>
              ) : null}
              <ol className="space-y-2 text-sm">
                {internal.workflow.history.map((h, i) => (
                  <li key={i} className="border-l-2 border-border pl-3">
                    <p className="text-ink"><span className="font-medium">{h.action.toLowerCase()}</span> · {h.actorName ?? h.role}</p>
                    {h.remarks ? <p className="text-ink-secondary">“{h.remarks}”</p> : null}
                    <p className="text-xs text-ink-muted">{new Date(h.at).toLocaleString()}</p>
                  </li>
                ))}
              </ol>
            </Surface>
          ) : null}
          {internal ? (
            <Surface>
              <SectionTitle title="Participation" />
              <dl className="grid grid-cols-2 gap-3">
                <Info label="Registered">{internal.registeredCount}</Info>
                <Info label="Attended">{internal.attendedCount}</Info>
              </dl>
            </Surface>
          ) : null}
        </div>
      </div>

      {dialog?.kind === 'review' ? (
        <ReasonDialog
          title={dialog.action === 'APPROVE' ? 'Approve event' : dialog.action === 'RETURN' ? 'Return for changes' : 'Reject event'}
          label="Remarks"
          required={dialog.action !== 'APPROVE'}
          busy={busy}
          confirmLabel={dialog.action === 'APPROVE' ? 'Approve' : dialog.action === 'RETURN' ? 'Return' : 'Reject'}
          description={dialog.action === 'APPROVE' ? 'If this is the final step, the venue is confirmed atomically. If it was taken meanwhile, the event stays approved but unscheduled.' : undefined}
          onClose={() => setDialog(null)}
          onConfirm={(remarks) => run(() => eventsApi.review(ev.id, dialog.action, remarks), dialog.action === 'APPROVE' ? 'Approved' : dialog.action === 'RETURN' ? 'Returned to organiser' : 'Rejected')}
        />
      ) : null}
      {dialog?.kind === 'cancel' ? (
        <ReasonDialog title="Cancel event" label="Reason" required busy={busy} confirmLabel="Cancel event" danger
          description="Confirmed venues are released immediately. Registered participants are notified in-app."
          onClose={() => setDialog(null)} onConfirm={(reason) => run(() => eventsApi.cancel(ev.id, reason), 'Event cancelled')} />
      ) : null}
      {dialog?.kind === 'override' ? (
        <ReasonDialog title="Override venue capacity" label="Reason (audited)" required minLength={5} busy={busy} confirmLabel="Override"
          onClose={() => setDialog(null)} onConfirm={(reason) => run(() => eventsApi.overrideCapacity(ev.id, reason), 'Capacity override recorded')} />
      ) : null}
      {dialog?.kind === 'complete' ? (
        <ReasonDialog title="Event report" label="Outcome summary" required minLength={10} busy={busy} confirmLabel="Save report" initial={internal?.outcomeSummary ?? ''}
          description="Actual participation is taken from marked attendance." onClose={() => setDialog(null)}
          onConfirm={(summary) => run(() => eventsApi.complete(ev.id, summary), 'Report saved')} />
      ) : null}
      {dialog?.kind === 'reschedule' ? (
        <RescheduleDialog ev={ev} busy={busy} onClose={() => setDialog(null)} onConfirm={(body) => run(() => eventsApi.reschedule(ev.id, body), 'Event rescheduled')} />
      ) : null}
      {dialog?.kind === 'resources' && internal ? (
        <ResourcePicker ev={internal} onClose={() => setDialog(null)} onAdded={() => { setDialog(null); load(); }} canOverride={can('events.capacity.override')} />
      ) : null}
      {dialog?.kind === 'external' ? (
        <ExternalDialog busy={busy} onClose={() => setDialog(null)} onConfirm={(body) => run(() => eventsApi.addExternal(ev.id, body), 'Guest added')} />
      ) : null}
    </div>
  );
}

function ReasonDialog(props: {
  title: string; label: string; required?: boolean; minLength?: number; busy: boolean; confirmLabel: string; danger?: boolean;
  description?: string; initial?: string; onClose: () => void; onConfirm: (value: string) => void;
}) {
  const [value, setValue] = useState(props.initial ?? '');
  const min = props.minLength ?? (props.required ? 3 : 0);
  const invalid = props.required && value.trim().length < min;
  return (
    <Modal open onClose={props.onClose} title={props.title} description={props.description}
      footer={<>
        <Button variant="secondary" onClick={props.onClose}>Back</Button>
        <Button variant={props.danger ? 'danger' : 'primary'} disabled={props.busy || invalid} onClick={() => props.onConfirm(value.trim())}>{props.confirmLabel}</Button>
      </>}>
      <Field label={props.label} optional={!props.required} hint={props.required ? `At least ${min} characters.` : undefined}>
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} aria-label={props.label} autoFocus />
      </Field>
    </Modal>
  );
}

function RescheduleDialog({ ev, busy, onClose, onConfirm }: { ev: EventDetail; busy: boolean; onClose: () => void; onConfirm: (b: { startsAt: string; endsAt: string; reason: string }) => void }) {
  const [startsAt, setStartsAt] = useState(ev.startsAt);
  const [endsAt, setEndsAt] = useState(ev.endsAt);
  const [reason, setReason] = useState('');
  const invalid = !startsAt || !endsAt || endsAt <= startsAt || reason.trim().length < 3;
  return (
    <Modal open onClose={onClose} title="Reschedule event" description="Every venue and resource is re-checked for the new time. If any conflict exists, nothing changes."
      footer={<><Button variant="secondary" onClick={onClose}>Back</Button><Button disabled={busy || invalid} onClick={() => onConfirm({ startsAt, endsAt, reason: reason.trim() })}>Reschedule</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New start"><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} aria-label="New start" /></Field>
        <Field label="New end"><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} aria-label="New end" /></Field>
      </div>
      <div className="mt-4"><Field label="Reason (audited)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" /></Field></div>
    </Modal>
  );
}

function ExternalDialog({ busy, onClose, onConfirm }: { busy: boolean; onClose: () => void; onConfirm: (b: { name: string; email: string | null; organization: string | null }) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [org, setOrg] = useState('');
  return (
    <Modal open onClose={onClose} title="Add external guest"
      footer={<><Button variant="secondary" onClick={onClose}>Back</Button><Button disabled={busy || name.trim().length < 2} onClick={() => onConfirm({ name: name.trim(), email: email.trim() || null, organization: org.trim() || null })}>Add</Button></>}>
      <div className="space-y-3">
        <Field label="Name"><Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Guest name" /></Field>
        <Field label="Email" optional><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Guest email" /></Field>
        <Field label="Organisation" optional><Input value={org} onChange={(e) => setOrg(e.target.value)} aria-label="Guest organisation" /></Field>
      </div>
    </Modal>
  );
}

function ResourcePicker({ ev, onClose, onAdded, canOverride }: { ev: EventInternal; onClose: () => void; onAdded: () => void; canOverride: boolean }) {
  const { toast } = useToast();
  const [kind, setKind] = useState('');
  const [items, setItems] = useState<Array<{ resource: Resource; available: boolean; blockers: Blocker[] }> | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  useEffect(() => {
    setItems(null);
    eventsApi.availability({ startsAt: ev.startsAt, endsAt: ev.endsAt, kind: kind || undefined, minCapacity: ev.capacityOverride ? undefined : ev.expectedParticipants ?? undefined })
      .then((r) => setItems(r.items))
      .catch((e) => { toast(errorText(e), 'error'); setItems([]); });
  }, [ev, kind, toast]);
  const taken = new Set(ev.reservations.filter((r) => ['REQUESTED', 'CONFIRMED'].includes(r.status)).map((r) => r.resourceId));
  const approvedAlready = ['APPROVED', 'SCHEDULED'].includes(ev.status);
  async function add(resourceId: number) {
    setBusyId(resourceId);
    try {
      await eventsApi.addResource(ev.id, resourceId);
      toast(ev.status === 'SCHEDULED' ? 'Confirmed' : 'Requested — confirmed on approval');
      onAdded();
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setBusyId(null);
    }
  }
  return (
    <Modal open size="lg" onClose={onClose} title="Add venue or equipment" description={`Live availability for ${formatWhen(ev.startsAt, ev.endsAt)} — checked against bookings, the academic timetable, examinations, asset status and capacity.`}>
      <div className="mb-3 flex items-center gap-2">
        <label htmlFor="res-kind" className="text-sm text-ink-muted">Show</label>
        <Select id="res-kind" value={kind} onChange={(e) => setKind(e.target.value)} className="w-44">
          <option value="">Rooms & equipment</option>
          <option value="ROOM">Rooms</option>
          <option value="ASSET">Equipment</option>
        </Select>
      </div>
      {!items ? <Skeleton className="h-40" /> : !items.length ? (
        <p className="text-sm text-ink-muted">No bookable resources are configured yet. Ask the facilities officer to enable rooms or equipment.</p>
      ) : (
        <ul className="max-h-[50vh] divide-y divide-border overflow-y-auto">
          {items.map(({ resource: r, available, blockers }) => {
            const disabledByApproval = approvedAlready && r.requiresApproval;
            return (
              <li key={r.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{r.name}{r.code ? <span className="text-ink-muted"> · {r.code}</span> : null}</p>
                  <p className="text-xs text-ink-muted">
                    {r.resourceKind === 'ROOM' ? `${(r.roomType ?? 'Room').replaceAll('_', ' ').toLowerCase()}${r.capacity != null ? ` · seats ${r.capacity}` : ''}${r.building ? ` · ${r.building}` : ''}` : 'Equipment'}
                    {r.requiresApproval ? ' · needs facilities approval' : ''}
                  </p>
                  {!available ? <p className="mt-0.5 text-xs text-danger">{blockers.map((b) => b.message).join(' · ')}</p> : null}
                  {disabledByApproval ? <p className="mt-0.5 text-xs text-warning">Cannot be added after approval.</p> : null}
                </div>
                {taken.has(r.id) ? <span className="text-xs text-ink-muted">Added</span> : (
                  <Button size="sm" disabled={!available || disabledByApproval || busyId === r.id} onClick={() => add(r.id)}>
                    {busyId === r.id ? 'Adding…' : 'Add'}
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {!ev.capacityOverride && ev.expectedParticipants ? (
        <p className="mt-3 text-xs text-ink-muted">Rooms smaller than {ev.expectedParticipants} expected participants are hidden as unavailable.{canOverride ? ' You can record a capacity override from the event page.' : ''}</p>
      ) : null}
    </Modal>
  );
}

function Participants({ ev, manage, started, onChanged, openExternal }: { ev: EventInternal; manage: boolean; started: boolean; onChanged: () => void; openExternal: () => void }) {
  const { toast } = useToast();
  const [data, setData] = useState<Paged<Registration> | null>(null);
  const [page, setPage] = useState(1);
  const load = useCallback(() => {
    eventsApi.registrations(ev.id, page).then(setData).catch(() => setData(null));
  }, [ev.id, page]);
  useEffect(() => { load(); }, [load]);
  const canMark = manage && started && ['SCHEDULED', 'COMPLETED'].includes(ev.status);
  async function mark(r: Registration, attendance: 'ATTENDED' | 'ABSENT') {
    try {
      const next = await eventsApi.markAttendance(ev.id, [{ registrationId: r.id, attendance }]);
      setData(next);
      onChanged();
    } catch (err) {
      toast(errorText(err), 'error');
    }
  }
  if (!ev.registrationEnabled && !ev.hasExternalParticipants) return null;
  return (
    <Surface>
      <SectionTitle title="Participants" action={manage && ev.hasExternalParticipants && ev.status === 'SCHEDULED' ? <Button size="sm" variant="secondary" onClick={openExternal}>Add guest</Button> : undefined} />
      <p className="mb-2 text-xs text-ink-muted">Visible only to the organiser and approvers. Event participation is separate from academic attendance.</p>
      {!data ? <Skeleton className="h-20" /> : !data.items.length ? <p className="text-sm text-ink-muted">No registrations yet.</p> : (
        <ul className="divide-y divide-border">
          {data.items.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-ink">{r.name ?? '—'}{r.usn ? <span className="text-ink-muted"> · {r.usn}</span> : null}{r.participantType !== 'STUDENT' ? <span className="text-ink-muted"> · {r.participantType.toLowerCase()}</span> : null}</span>
              {r.status === 'CANCELLED' ? <EventStatusBadge status="CANCELLED" /> : <EventStatusBadge status={r.attendanceStatus} />}
              {canMark && r.status === 'REGISTERED' ? (
                <span className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => mark(r, 'ATTENDED')} aria-label={`Mark ${r.name ?? 'participant'} attended`}>Attended</Button>
                  <Button size="sm" variant="ghost" onClick={() => mark(r, 'ABSENT')} aria-label={`Mark ${r.name ?? 'participant'} absent`}>Absent</Button>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      {data && data.total > data.pageSize ? (
        <div className="mt-2 flex justify-end gap-2 text-sm">
          <Button size="sm" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <Button size="sm" variant="ghost" disabled={page * data.pageSize >= data.total} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      ) : null}
    </Surface>
  );
}

const DOC_CATEGORIES = ['BROCHURE', 'APPROVAL', 'PHOTO', 'ATTENDANCE_EVIDENCE', 'REPORT', 'OUTCOME', 'OTHER'];

function Documents({ ev, manage, frozen }: { ev: EventInternal; manage: boolean; frozen: boolean }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState<EventDocument[] | null>(null);
  const [category, setCategory] = useState('BROCHURE');
  const [uploading, setUploading] = useState(false);
  const load = useCallback(() => {
    eventsApi.documents(ev.id).then(setDocs).catch(() => setDocs([]));
  }, [ev.id]);
  useEffect(() => { load(); }, [load]);
  async function upload(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      await eventsApi.uploadDocument(ev.id, { category, fileName: file.name, mimeType: file.type || 'application/octet-stream', contentBase64: await fileToBase64(file) });
      toast('Document uploaded');
      load();
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setUploading(false);
    }
  }
  return (
    <Surface>
      <SectionTitle title="Documents & evidence" />
      {manage && !frozen ? (
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="doc-cat" className="sr-only">Document category</label>
          <Select id="doc-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="sm:w-52">
            {DOC_CATEGORIES.map((c) => <option key={c} value={c}>{c.replaceAll('_', ' ').toLowerCase()}</option>)}
          </Select>
          <label className="inline-flex cursor-pointer items-center justify-center rounded-md border border-border px-3 py-2 text-sm text-ink hover:bg-surface-muted">
            {uploading ? 'Uploading…' : 'Upload file'}
            <input type="file" className="sr-only" disabled={uploading} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xlsx,.txt" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </div>
      ) : null}
      {!docs ? <Skeleton className="h-12" /> : !docs.length ? <p className="text-sm text-ink-muted">No documents yet.</p> : (
        <ul className="divide-y divide-border">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center gap-2 py-2 text-sm">
              <span className="min-w-0 flex-1 truncate text-ink">{d.originalFilename ?? d.fileName}</span>
              <span className="text-xs text-ink-muted">{d.category.replaceAll('_', ' ').toLowerCase()}</span>
              <Button size="sm" variant="ghost" aria-label={`Download ${d.originalFilename ?? 'document'}`}
                onClick={() => downloadWithAuth(eventsApi.documentUrl(ev.id, d.id), d.originalFilename ?? `document-${d.id}`).catch((e) => toast(errorText(e), 'error'))}>
                <Download size={14} />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Surface>
  );
}
