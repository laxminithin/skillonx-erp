import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import {
  Button,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  SectionTitle,
  Select,
  Skeleton,
  StatStrip,
  Surface,
  Tabs,
  Textarea,
  useToast,
} from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import {
  EVENT_STATUS_LABEL,
  eventsApi,
  formatWhen,
  type EventInput,
  type EventInternal,
  type EventListItem,
  type Paged,
  type Reservation,
} from '../../lib/eventsApi';
import { api } from '../../lib/api';
import { EventStatusBadge, Pager, errorText, todayIso, useEventsMeta } from './shared';

// ── Events list ───────────────────────────────────────────────────────────
export function EventsHomePage() {
  useDocumentTitle('Events & Resources');
  const nav = useNavigate();
  const { can } = useEventsMeta();
  const [tab, setTab] = useState('upcoming');
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<EventListItem> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q.trim()), 300);
    return () => window.clearTimeout(t);
  }, [q]);
  useEffect(() => setPage(1), [tab, debounced, status]);

  useEffect(() => {
    setLoading(true);
    eventsApi
      .list({ q: debounced || undefined, status: status || undefined, mine: tab === 'mine' || undefined, from: tab === 'upcoming' ? todayIso() : undefined, page, pageSize: 20 })
      .then(setData)
      .catch(() => setData({ page: 1, pageSize: 20, total: 0, items: [] }))
      .finally(() => setLoading(false));
  }, [tab, debounced, status, page]);

  return (
    <div>
      <PageHeader
        title="Events & Resources"
        subtitle="Plan institutional events, book venues and equipment without double-booking, and route approvals through the institution's workflow."
        actions={can('events.event.create') ? <Button onClick={() => nav('/events/new')}>New event</Button> : undefined}
      />
      <div className="mb-4">
        <Tabs
          tabs={[
            { id: 'upcoming', label: 'Upcoming' },
            { id: 'mine', label: 'My events' },
            { id: 'all', label: 'All visible' },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <SearchInput value={q} onChange={setQ} placeholder="Search events by title" />
        <label className="sr-only" htmlFor="events-status-filter">Status</label>
        <Select id="events-status-filter" value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-56">
          <option value="">All statuses</option>
          {Object.entries(EVENT_STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>
      {loading ? (
        <Skeleton className="h-48" />
      ) : !data?.items.length ? (
        <EmptyState
          title={tab === 'mine' ? 'You have not organised any events yet' : 'No events match'}
          body={can('events.event.create') ? 'Create an event, pick a venue from live availability and submit it for approval.' : 'Scheduled events visible to you will appear here.'}
          action={can('events.event.create') ? <Button onClick={() => nav('/events/new')}>New event</Button> : undefined}
        />
      ) : (
        <Surface className="!p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {data.items.map((ev) => (
              <li key={ev.id}>
                <Link to={`/events/${ev.id}`} className="flex flex-col gap-2 px-4 py-3.5 transition hover:bg-surface-muted/60 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{ev.title}</p>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {formatWhen(ev.startsAt, ev.endsAt)} · {ev.departmentName ?? ev.organizerUnitName ?? 'Institution'}
                      {ev.organizerName ? ` · ${ev.organizerName}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-ink-muted">{ev.eventType.replaceAll('_', ' ').toLowerCase()}</span>
                    {ev.isMine ? <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[11px] text-accent">Mine</span> : null}
                    <EventStatusBadge status={ev.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Surface>
      )}
      {data ? <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} /> : null}
    </div>
  );
}

// ── Create / edit ─────────────────────────────────────────────────────────
type FormState = {
  title: string;
  eventType: string;
  description: string;
  objective: string;
  organizerUnitType: string;
  organizerUnitName: string;
  departmentId: string;
  startsAt: string;
  endsAt: string;
  externalVenue: string;
  expectedParticipants: string;
  visibility: 'DEPARTMENT' | 'INSTITUTION';
  registrationEnabled: boolean;
  registrationAudience: 'ALL' | 'STUDENTS' | 'STAFF';
  registrationCapacity: string;
  registrationClosesAt: string;
  hasExternalParticipants: boolean;
  plannedBudget: string;
};

const EMPTY_FORM: FormState = {
  title: '',
  eventType: 'SEMINAR',
  description: '',
  objective: '',
  organizerUnitType: 'DEPARTMENT',
  organizerUnitName: '',
  departmentId: '',
  startsAt: '',
  endsAt: '',
  externalVenue: '',
  expectedParticipants: '',
  visibility: 'INSTITUTION',
  registrationEnabled: false,
  registrationAudience: 'ALL',
  registrationCapacity: '',
  registrationClosesAt: '',
  hasExternalParticipants: false,
  plannedBudget: '',
};

const UNIT_TYPES = [
  ['DEPARTMENT', 'Department'],
  ['INSTITUTION', 'Institution'],
  ['CELL', 'Cell / Committee'],
  ['CLUB', 'Club'],
  ['PLACEMENT', 'Training & Placement'],
  ['IQAC', 'IQAC'],
  ['RESEARCH', 'Research'],
  ['OTHER', 'Other'],
] as const;

function numOrNull(v: string) {
  return v.trim() === '' ? null : Number(v);
}

export function EventFormPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  useDocumentTitle(editing ? 'Edit event' : 'New event');
  const nav = useNavigate();
  const { toast } = useToast();
  const { meta } = useEventsMeta();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [types, setTypes] = useState<Array<{ code: string; name: string; isActive: boolean }>>([]);
  const [departments, setDepartments] = useState<Array<{ id: number; name: string }>>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    eventsApi.types().then((t) => setTypes(t.filter((x) => x.isActive))).catch(() => setTypes([]));
    api<{ departments: Array<{ id: number; name: string }> }>('/api/meta/lookups')
      .then((d) => setDepartments(d.departments ?? []))
      .catch(() => setDepartments([]));
  }, []);

  useEffect(() => {
    if (!editing && meta?.departmentId && !form.departmentId) setForm((f) => ({ ...f, departmentId: String(meta.departmentId) }));
  }, [meta, editing, form.departmentId]);

  useEffect(() => {
    if (!id) return;
    eventsApi.get(Number(id)).then((ev) => {
      if (ev.view !== 'INTERNAL') return;
      setForm({
        title: ev.title,
        eventType: ev.eventType,
        description: ev.description ?? '',
        objective: ev.objective ?? '',
        organizerUnitType: ev.organizerUnitType,
        organizerUnitName: ev.organizerUnitName ?? '',
        departmentId: ev.departmentId ? String(ev.departmentId) : '',
        startsAt: ev.startsAt,
        endsAt: ev.endsAt,
        externalVenue: ev.externalVenue ?? '',
        expectedParticipants: ev.expectedParticipants != null ? String(ev.expectedParticipants) : '',
        visibility: ev.visibility,
        registrationEnabled: ev.registrationEnabled,
        registrationAudience: ev.registrationAudience,
        registrationCapacity: ev.registrationCapacity != null ? String(ev.registrationCapacity) : '',
        registrationClosesAt: ev.registrationClosesAt ?? '',
        hasExternalParticipants: ev.hasExternalParticipants,
        plannedBudget: ev.plannedBudget != null ? String(ev.plannedBudget) : '',
      });
    }).catch((e) => setError(errorText(e)));
  }, [id]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (form.endsAt && form.startsAt && form.endsAt <= form.startsAt) {
      setError('End time must be after the start time.');
      return;
    }
    const body: EventInput = {
      title: form.title.trim(),
      eventType: form.eventType,
      description: form.description.trim() || null,
      objective: form.objective.trim() || null,
      organizerUnitType: form.organizerUnitType,
      organizerUnitName: form.organizerUnitName.trim() || null,
      departmentId: form.departmentId ? Number(form.departmentId) : null,
      startsAt: form.startsAt,
      endsAt: form.endsAt,
      externalVenue: form.externalVenue.trim() || null,
      expectedParticipants: numOrNull(form.expectedParticipants),
      visibility: form.visibility,
      registrationEnabled: form.registrationEnabled,
      registrationAudience: form.registrationAudience,
      registrationCapacity: form.registrationEnabled ? numOrNull(form.registrationCapacity) : null,
      registrationClosesAt: form.registrationEnabled && form.registrationClosesAt ? form.registrationClosesAt : null,
      hasExternalParticipants: form.hasExternalParticipants,
      plannedBudget: numOrNull(form.plannedBudget),
    };
    setSaving(true);
    try {
      const saved = editing ? await eventsApi.update(Number(id), body) : await eventsApi.create(body);
      toast(editing ? 'Event updated' : 'Draft created — now add a venue and submit for approval');
      nav(`/events/${saved.id}`);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={editing ? 'Edit event' : 'New event'}
        subtitle="Drafts are private to you until submitted. Venue and equipment are picked from live availability on the next screen."
        breadcrumb={<Link to="/events" className="hover:underline">Events & Resources</Link>}
      />
      <form onSubmit={submit} className="space-y-5" noValidate>
        {error ? <div role="alert" className="rounded-md border border-danger/30 bg-danger/5 px-3 py-2 text-sm text-danger">{error}</div> : null}
        <Surface className="space-y-4">
          <SectionTitle title="Basics" />
          <Field label="Title">
            <Input id="ev-title" aria-label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} required minLength={3} maxLength={255} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Event type">
              <Select value={form.eventType} onChange={(e) => set('eventType', e.target.value)} aria-label="Event type">
                {types.map((t) => <option key={t.code} value={t.code}>{t.name}</option>)}
              </Select>
            </Field>
            <Field label="Organised by">
              <Select value={form.organizerUnitType} onChange={(e) => set('organizerUnitType', e.target.value)} aria-label="Organised by">
                {UNIT_TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Department" optional={form.organizerUnitType !== 'DEPARTMENT'} hint="Department events are reviewed by the HOD first.">
              <Select value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)} aria-label="Department">
                <option value="">— None (institution-level) —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Unit / club / cell name" optional>
              <Input value={form.organizerUnitName} onChange={(e) => set('organizerUnitName', e.target.value)} maxLength={191} aria-label="Unit, club or cell name" />
            </Field>
          </div>
          <Field label="Description" optional>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} maxLength={10000} aria-label="Description" />
          </Field>
          <Field label="Objective" optional>
            <Textarea value={form.objective} onChange={(e) => set('objective', e.target.value)} maxLength={5000} aria-label="Objective" />
          </Field>
        </Surface>

        <Surface className="space-y-4">
          <SectionTitle title="When & who" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Starts">
              <Input type="datetime-local" value={form.startsAt} onChange={(e) => set('startsAt', e.target.value)} required aria-label="Starts" />
            </Field>
            <Field label="Ends">
              <Input type="datetime-local" value={form.endsAt} onChange={(e) => set('endsAt', e.target.value)} required aria-label="Ends" />
            </Field>
            <Field label="Expected participants" optional hint="Checked against venue capacity on the server.">
              <Input type="number" min={1} value={form.expectedParticipants} onChange={(e) => set('expectedParticipants', e.target.value)} aria-label="Expected participants" />
            </Field>
            <Field label="Visible to">
              <Select value={form.visibility} onChange={(e) => set('visibility', e.target.value as FormState['visibility'])} aria-label="Visible to">
                <option value="INSTITUTION">Whole institution</option>
                <option value="DEPARTMENT">Department only</option>
              </Select>
            </Field>
            <Field label="Off-campus venue" optional hint="Only if the event is not held in a campus room.">
              <Input value={form.externalVenue} onChange={(e) => set('externalVenue', e.target.value)} maxLength={255} aria-label="Off-campus venue" />
            </Field>
            <Field label="Planned budget (₹)" optional hint="Planning figure only — no Finance posting.">
              <Input type="number" min={0} step="0.01" value={form.plannedBudget} onChange={(e) => set('plannedBudget', e.target.value)} aria-label="Planned budget" />
            </Field>
          </div>
        </Surface>

        <Surface className="space-y-4">
          <SectionTitle title="Registration" />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.registrationEnabled} onChange={(e) => set('registrationEnabled', e.target.checked)} />
            Participants register for this event
          </label>
          {form.registrationEnabled ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Open to">
                <Select value={form.registrationAudience} onChange={(e) => set('registrationAudience', e.target.value as FormState['registrationAudience'])} aria-label="Open to">
                  <option value="ALL">Students & staff</option>
                  <option value="STUDENTS">Students</option>
                  <option value="STAFF">Staff</option>
                </Select>
              </Field>
              <Field label="Seat limit" optional>
                <Input type="number" min={1} value={form.registrationCapacity} onChange={(e) => set('registrationCapacity', e.target.value)} aria-label="Seat limit" />
              </Field>
              <Field label="Registration closes" optional>
                <Input type="datetime-local" value={form.registrationClosesAt} onChange={(e) => set('registrationClosesAt', e.target.value)} aria-label="Registration closes" />
              </Field>
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={form.hasExternalParticipants} onChange={(e) => set('hasExternalParticipants', e.target.checked)} />
            External guests / participants will attend
          </label>
        </Surface>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => nav(editing ? `/events/${id}` : '/events')}>Cancel</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create draft'}</Button>
        </div>
      </form>
    </div>
  );
}

// ── Approvals ─────────────────────────────────────────────────────────────
export function EventsApprovalsPage() {
  useDocumentTitle('Event approvals');
  const { can } = useEventsMeta();
  const { toast } = useToast();
  const [queue, setQueue] = useState<Awaited<ReturnType<typeof eventsApi.queue>> | null>(null);
  const [resQueue, setResQueue] = useState<Reservation[] | null>(null);
  const [decide, setDecide] = useState<{ r: Reservation; action: 'CONFIRM' | 'REJECT' } | null>(null);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    eventsApi.queue().then(setQueue).catch(() => setQueue([]));
    if (can('events.reservation.decide')) eventsApi.reservationQueue().then(setResQueue).catch(() => setResQueue([]));
  }, [can]);
  useEffect(() => { load(); }, [load]);

  async function confirmDecision() {
    if (!decide) return;
    setBusy(true);
    try {
      await eventsApi.decideReservation(decide.r.id, decide.action, remarks);
      toast(decide.action === 'CONFIRM' ? 'Reservation confirmed' : 'Reservation rejected');
      setDecide(null);
      setRemarks('');
      load();
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Approvals" subtitle="Events waiting at your approval step and resource requests that need a decision. You never see your own requests here." />
      <SectionTitle title="Events awaiting your review" />
      {!queue ? <Skeleton className="h-32" /> : !queue.length ? (
        <EmptyState title="Nothing waiting for you" body="Events appear here when they reach your approval step." />
      ) : (
        <Surface className="!p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {queue.map((q) => (
              <li key={q.id}>
                <Link to={`/events/${q.id}`} className="flex flex-col gap-1 px-4 py-3.5 hover:bg-surface-muted/60 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{q.title}</p>
                    <p className="text-xs text-ink-muted">{formatWhen(q.startsAt, q.endsAt)} · {q.departmentName ?? 'Institution'} · {q.organizerName ?? '—'}</p>
                  </div>
                  <span className="text-xs font-medium text-info">{q.step.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Surface>
      )}

      {can('events.reservation.decide') ? (
        <div className="mt-8">
          <SectionTitle title="Resource requests" />
          {!resQueue ? <Skeleton className="h-32" /> : !resQueue.length ? (
            <EmptyState title="No pending resource requests" body="Requests for resources that need approval appear here." />
          ) : (
            <Surface className="!p-0 overflow-hidden">
              <ul className="divide-y divide-border">
                {resQueue.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-ink">{r.resourceName}</p>
                      <p className="text-xs text-ink-muted">{formatWhen(r.startsAt, r.endsAt)} · {r.requesterName ?? '—'} · {r.purpose}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setDecide({ r, action: 'CONFIRM' })}>Confirm</Button>
                      <Button size="sm" variant="danger-soft" onClick={() => setDecide({ r, action: 'REJECT' })}>Reject</Button>
                    </div>
                  </li>
                ))}
              </ul>
            </Surface>
          )}
        </div>
      ) : null}

      <Modal
        open={!!decide}
        onClose={() => setDecide(null)}
        title={decide?.action === 'CONFIRM' ? 'Confirm reservation' : 'Reject reservation'}
        description="Confirming re-checks every conflict on the server; if the slot was taken meanwhile it will be refused."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDecide(null)}>Back</Button>
            <Button variant={decide?.action === 'REJECT' ? 'danger' : 'primary'} disabled={busy} onClick={confirmDecision}>
              {decide?.action === 'CONFIRM' ? 'Confirm' : 'Reject'}
            </Button>
          </>
        }
      >
        <Field label="Remarks" optional>
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} maxLength={500} aria-label="Remarks" />
        </Field>
      </Modal>
    </div>
  );
}

// ── Calendar (agenda projection) ──────────────────────────────────────────
function monthRange(offset: number) {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  const last = new Date(first.getFullYear(), first.getMonth() + 1, 0);
  const iso = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
  return { from: iso(first), to: iso(last), label: first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) };
}

export function EventsCalendarPage() {
  useDocumentTitle('Events calendar');
  const [offset, setOffset] = useState(0);
  const range = useMemo(() => monthRange(offset), [offset]);
  const [data, setData] = useState<Awaited<ReturnType<typeof eventsApi.calendar>> | null>(null);

  useEffect(() => {
    setData(null);
    eventsApi.calendar(range.from, range.to).then(setData).catch(() => setData({ from: range.from, to: range.to, events: [], reservations: [] }));
  }, [range]);

  const days = useMemo(() => {
    const map = new Map<string, { events: EventListItem[]; bookings: Reservation[] }>();
    const add = (date: string) => {
      if (!map.has(date)) map.set(date, { events: [], bookings: [] });
      return map.get(date)!;
    };
    data?.events.forEach((e) => add(e.startsAt.slice(0, 10)).events.push(e));
    data?.reservations.filter((r) => r.eventId == null).forEach((r) => add(r.startsAt.slice(0, 10)).bookings.push(r));
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [data]);

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Events visible to you and confirmed resource bookings. Academic classes stay in the timetable — they are checked for conflicts, not copied here."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setOffset((o) => o - 1)} aria-label="Previous month"><ChevronLeft size={16} /></Button>
            <span className="min-w-36 text-center text-sm font-medium text-ink">{range.label}</span>
            <Button variant="secondary" size="sm" onClick={() => setOffset((o) => o + 1)} aria-label="Next month"><ChevronRight size={16} /></Button>
          </div>
        }
      />
      {!data ? <Skeleton className="h-64" /> : !days.length ? (
        <EmptyState icon={<CalendarDays size={22} />} title="Nothing on the calendar this month" />
      ) : (
        <div className="space-y-4">
          {days.map(([date, d]) => (
            <Surface key={date}>
              <h2 className="mb-2 text-sm font-semibold text-ink">
                {new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
              </h2>
              <ul className="space-y-2">
                {d.events.map((e) => (
                  <li key={`e${e.id}`} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="w-28 shrink-0 text-xs text-ink-muted">{e.startsAt.slice(11)}–{e.endsAt.slice(11)}</span>
                    <Link to={`/events/${e.id}`} className="min-w-0 flex-1 truncate font-medium text-accent hover:underline">{e.title}</Link>
                    <EventStatusBadge status={e.status} />
                  </li>
                ))}
                {d.bookings.map((r) => (
                  <li key={`r${r.id}`} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="w-28 shrink-0 text-xs text-ink-muted">{r.startsAt.slice(11)}–{r.endsAt.slice(11)}</span>
                    <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-ink"><MapPin size={14} aria-hidden /> {r.resourceName}{r.purpose ? ` — ${r.purpose}` : ' — booked'}</span>
                  </li>
                ))}
              </ul>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Reports (aggregates only) ─────────────────────────────────────────────
export function EventsReportsPage() {
  useDocumentTitle('Events reports');
  const [data, setData] = useState<Awaited<ReturnType<typeof eventsApi.report>> | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    eventsApi.report().then(setData).catch((e) => setError(errorText(e)));
  }, []);
  if (error) return <div><PageHeader title="Reports" /><EmptyState title="Reports unavailable" body={error} /></div>;
  const total = data?.byStatus.reduce((s, x) => s + x.count, 0) ?? 0;
  return (
    <div>
      <PageHeader title="Reports" subtitle={data?.scope === 'DEPARTMENT' ? 'Your department only. Aggregates — no individual rankings.' : 'Institution-wide aggregates — no individual rankings.'} />
      <StatStrip
        loading={!data}
        items={[
          { label: 'Events', value: total },
          { label: 'Completed / closed', value: data?.completedEvents ?? 0 },
          { label: 'Participants (recorded)', value: data?.totalParticipants ?? 0 },
        ]}
      />
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Surface>
          <SectionTitle title="By status" />
          <ul className="space-y-1 text-sm">{data?.byStatus.map((s) => <li key={s.status} className="flex justify-between"><EventStatusBadge status={s.status} /><span>{s.count}</span></li>)}</ul>
        </Surface>
        <Surface>
          <SectionTitle title="By type" />
          <ul className="space-y-1 text-sm">{data?.byType.map((s) => <li key={s.eventType} className="flex justify-between"><span>{s.eventType.replaceAll('_', ' ').toLowerCase()}</span><span>{s.count}</span></li>)}</ul>
        </Surface>
        <Surface>
          <SectionTitle title="By department" />
          <ul className="space-y-1 text-sm">{data?.byDepartment.map((s) => <li key={s.departmentId ?? 0} className="flex justify-between"><span>{s.name}</span><span>{s.count}</span></li>)}</ul>
        </Surface>
        <Surface>
          <SectionTitle title="Resource utilisation (confirmed)" />
          {!data?.resourceUtilization.length ? <p className="text-sm text-ink-muted">No confirmed bookings in range.</p> : (
            <ul className="space-y-1 text-sm">{data.resourceUtilization.map((r) => <li key={r.resourceId} className="flex justify-between gap-2"><span className="truncate">{r.name}</span><span className="shrink-0 text-ink-muted">{r.bookings} bookings · {r.hours} h</span></li>)}</ul>
          )}
        </Surface>
      </div>
    </div>
  );
}

export type { EventInternal };
