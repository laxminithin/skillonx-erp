import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Button, EmptyState, Field, Input, Modal, PageHeader, SectionTitle, Select, Skeleton, Surface, useToast } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { eventsApi, formatWhen, newIdempotencyKey, type Blocker, type Reservation, type Resource } from '../../lib/eventsApi';
import { EventStatusBadge, errorText, nowLocalInput, useEventsMeta } from './shared';

// ── Availability search + ad-hoc booking ──────────────────────────────────
export function EventsAvailabilityPage() {
  useDocumentTitle('Find a venue');
  const { toast } = useToast();
  const { can } = useEventsMeta();
  const [startsAt, setStartsAt] = useState(nowLocalInput(24));
  const [endsAt, setEndsAt] = useState(nowLocalInput(25));
  const [kind, setKind] = useState('');
  const [roomType, setRoomType] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [items, setItems] = useState<Array<{ resource: Resource; available: boolean; blockers: Blocker[] }> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<Resource | null>(null);
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState(false);
  const keyRef = useRef<string>(newIdempotencyKey());

  async function search(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    if (!startsAt || !endsAt || endsAt <= startsAt) {
      setError('Choose an end time after the start time.');
      return;
    }
    setLoading(true);
    try {
      const r = await eventsApi.availability({ startsAt, endsAt, kind: kind || undefined, roomType: roomType || undefined, minCapacity: minCapacity ? Number(minCapacity) : undefined });
      setItems(r.items);
    } catch (err) {
      setError(errorText(err));
      setItems(null);
    } finally {
      setLoading(false);
    }
  }

  async function book() {
    if (!booking) return;
    setBusy(true);
    try {
      const r = await eventsApi.createReservation({ resourceId: booking.id, startsAt, endsAt, purpose: purpose.trim(), idempotencyKey: keyRef.current });
      toast(r.status === 'CONFIRMED' ? 'Booked and confirmed' : 'Requested — awaiting facilities approval');
      keyRef.current = newIdempotencyKey();
      setBooking(null);
      setPurpose('');
      search();
    } catch (err) {
      toast(errorText(err), 'error');
      search();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Find a venue or equipment" subtitle="Live availability, checked on the server against confirmed bookings, the academic timetable, examinations, asset status, capacity and configured buffers." />
      <Surface>
        <form onSubmit={search} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end" noValidate>
          <Field label="From"><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} aria-label="From" /></Field>
          <Field label="To"><Input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} aria-label="To" /></Field>
          <Field label="Kind">
            <Select value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Kind">
              <option value="">Rooms & equipment</option>
              <option value="ROOM">Rooms</option>
              <option value="ASSET">Equipment</option>
            </Select>
          </Field>
          <Field label="Room type" optional>
            <Select value={roomType} onChange={(e) => setRoomType(e.target.value)} aria-label="Room type">
              <option value="">Any</option>
              <option value="SEMINAR_HALL">Seminar hall</option>
              <option value="AUDITORIUM">Auditorium</option>
              <option value="CLASSROOM">Classroom</option>
              <option value="LAB">Lab</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field label="Min. seats" optional>
            <Input type="number" min={1} value={minCapacity} onChange={(e) => setMinCapacity(e.target.value)} aria-label="Minimum seats" />
          </Field>
          <div className="sm:col-span-2 lg:col-span-5">
            <Button type="submit" disabled={loading}>{loading ? 'Checking…' : 'Check availability'}</Button>
          </div>
        </form>
        {error ? <p role="alert" className="mt-3 text-sm text-danger">{error}</p> : null}
      </Surface>

      <div className="mt-5">
        {loading ? <Skeleton className="h-40" /> : items == null ? null : !items.length ? (
          <EmptyState title="No bookable resources configured" body="Facilities decides which rooms and equipment are bookable." />
        ) : (
          <Surface className="!p-0 overflow-hidden">
            <ul className="divide-y divide-border">
              {items.map(({ resource: r, available, blockers }) => (
                <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{r.name}{r.code ? <span className="text-ink-muted"> · {r.code}</span> : null}</p>
                    <p className="text-xs text-ink-muted">
                      {r.resourceKind === 'ROOM' ? `${(r.roomType ?? 'Room').replaceAll('_', ' ').toLowerCase()}${r.capacity != null ? ` · seats ${r.capacity}` : ''}${r.building ? ` · ${r.building}` : ''}` : 'Equipment'}
                      {r.setupBufferMinutes || r.cleanupBufferMinutes ? ` · buffer ${r.setupBufferMinutes}/${r.cleanupBufferMinutes} min` : ''}
                      {r.requiresApproval ? ' · needs approval' : ''}
                    </p>
                    {!available ? <p className="mt-0.5 text-xs text-danger">{blockers.map((b) => b.message).join(' · ')}</p> : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={available ? 'text-xs font-medium text-success' : 'text-xs font-medium text-danger'}>{available ? 'Available' : 'Unavailable'}</span>
                    {can('events.reservation.request') ? (
                      <Button size="sm" disabled={!available} onClick={() => setBooking(r)}>Book</Button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </Surface>
        )}
      </div>

      <Modal open={!!booking} onClose={() => setBooking(null)} title={`Book ${booking?.name ?? ''}`} description={`${startsAt && endsAt ? formatWhen(startsAt, endsAt) : ''}. For events with registration and approvals, create an event instead.`}
        footer={<><Button variant="secondary" onClick={() => setBooking(null)}>Back</Button><Button disabled={busy || purpose.trim().length < 3} onClick={book}>{busy ? 'Booking…' : booking?.requiresApproval ? 'Request' : 'Book'}</Button></>}>
        <Field label="Purpose" hint="Visible to facilities and you only.">
          <Input value={purpose} onChange={(e) => setPurpose(e.target.value)} maxLength={255} aria-label="Purpose" autoFocus />
        </Field>
      </Modal>
    </div>
  );
}

// ── My ad-hoc bookings ────────────────────────────────────────────────────
export function EventsBookingsPage() {
  useDocumentTitle('My bookings');
  const { toast } = useToast();
  const [rows, setRows] = useState<Reservation[] | null>(null);
  const load = useCallback(() => {
    eventsApi.myReservations().then(setRows).catch(() => setRows([]));
  }, []);
  useEffect(() => { load(); }, [load]);
  async function cancel(r: Reservation) {
    try {
      await eventsApi.cancelReservation(r.id);
      toast('Booking cancelled');
      load();
    } catch (err) {
      toast(errorText(err), 'error');
    }
  }
  return (
    <div>
      <PageHeader title="My bookings" subtitle="Rooms and equipment you booked outside an event. Event venues are managed on each event." />
      {!rows ? <Skeleton className="h-40" /> : !rows.length ? (
        <EmptyState title="No bookings yet" body="Use Find a venue to book a room or equipment." />
      ) : (
        <Surface className="!p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{r.resourceName}</p>
                  <p className="text-xs text-ink-muted">{formatWhen(r.startsAt, r.endsAt)} · {r.purpose}</p>
                  {r.decisionRemarks ? <p className="text-xs text-ink-secondary">Remarks: {r.decisionRemarks}</p> : null}
                </div>
                <div className="flex items-center gap-2">
                  <EventStatusBadge status={r.status} />
                  {['REQUESTED', 'CONFIRMED'].includes(r.status) ? <Button size="sm" variant="ghost" onClick={() => cancel(r)}>Cancel</Button> : null}
                </div>
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </div>
  );
}

// ── Resource configuration (facilities) ───────────────────────────────────
export function EventsResourcesPage() {
  useDocumentTitle('Bookable resources');
  const { toast } = useToast();
  const { can, meta } = useEventsMeta();
  const [rows, setRows] = useState<Resource[] | null>(null);
  const [cands, setCands] = useState<Awaited<ReturnType<typeof eventsApi.candidates>> | null>(null);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [types, setTypes] = useState<Array<{ code: string; name: string; isActive: boolean }>>([]);
  const [newType, setNewType] = useState({ code: '', name: '' });
  const manage = can('events.resource.manage');

  const load = useCallback(() => {
    eventsApi.resources().then(setRows).catch(() => setRows([]));
    eventsApi.types().then(setTypes).catch(() => setTypes([]));
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (manage) eventsApi.candidates().then(setCands).catch(() => setCands(null));
  }, [manage, rows]);

  async function enable(body: Parameters<typeof eventsApi.configureResource>[0]) {
    try {
      await eventsApi.configureResource(body);
      toast('Resource is now bookable');
      load();
    } catch (err) {
      toast(errorText(err), 'error');
    }
  }
  async function saveType(e: FormEvent) {
    e.preventDefault();
    try {
      setTypes(await eventsApi.saveType({ code: newType.code.trim().toUpperCase(), name: newType.name.trim() }));
      setNewType({ code: '', name: '' });
      toast('Event type saved');
    } catch (err) {
      toast(errorText(err), 'error');
    }
  }

  if (meta && !manage) return <div><PageHeader title="Bookable resources" /><EmptyState title="Facilities only" body="Only the facilities officer or an administrator configures bookable resources." /></div>;

  return (
    <div>
      <PageHeader title="Bookable resources" subtitle="Rooms come from the timetable room master and equipment from the asset register — nothing is duplicated. Only resources enabled here can be booked." />
      <SectionTitle title="Enabled resources" />
      {!rows ? <Skeleton className="h-32" /> : !rows.length ? <EmptyState title="Nothing is bookable yet" body="Enable rooms or equipment below." /> : (
        <Surface className="!p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">{r.name}{r.code ? <span className="text-ink-muted"> · {r.code}</span> : null}</p>
                  <p className="text-xs text-ink-muted">
                    {r.resourceKind === 'ROOM' ? `Room${r.capacity != null ? ` · seats ${r.capacity}` : ''}` : 'Equipment'} · source status {r.sourceStatus ?? '—'} · buffer {r.setupBufferMinutes}/{r.cleanupBufferMinutes} min{r.requiresApproval ? ' · needs approval' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={r.isActive ? 'text-xs text-success' : 'text-xs text-ink-muted'}>{r.isActive ? 'Bookable' : 'Disabled'}</span>
                  <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>Settings</Button>
                </div>
              </li>
            ))}
          </ul>
        </Surface>
      )}

      {cands ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          <Surface>
            <SectionTitle title="Rooms (timetable master)" />
            {!cands.rooms.length ? <p className="text-sm text-ink-muted">All active rooms are enabled.</p> : (
              <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                {cands.rooms.map((r) => (
                  <li key={r.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{r.name} <span className="text-ink-muted">· {r.type.replaceAll('_', ' ').toLowerCase()}{r.capacity != null ? ` · ${r.capacity}` : ''}</span></span>
                    <Button size="sm" variant="ghost" onClick={() => enable({ resourceKind: 'ROOM', roomId: r.id })}>Enable</Button>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
          <Surface>
            <SectionTitle title="Equipment (asset register)" />
            {!cands.assets.length ? <p className="text-sm text-ink-muted">No eligible assets.</p> : (
              <ul className="max-h-80 divide-y divide-border overflow-y-auto">
                {cands.assets.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 py-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{a.name} <span className="text-ink-muted">· {a.assetTag} · {a.category}</span></span>
                    <Button size="sm" variant="ghost" onClick={() => enable({ resourceKind: 'ASSET', assetId: a.id, requiresApproval: true })}>Enable</Button>
                  </li>
                ))}
              </ul>
            )}
          </Surface>
        </div>
      ) : null}

      <div className="mt-8">
        <SectionTitle title="Event types" />
        <Surface>
          <ul className="mb-4 flex flex-wrap gap-2">
            {types.map((t) => <li key={t.code} className={t.isActive ? 'rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink' : 'rounded-full bg-surface-muted px-2.5 py-1 text-xs text-ink-muted line-through'}>{t.name}</li>)}
          </ul>
          <form onSubmit={saveType} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
            <Field label="Code"><Input value={newType.code} onChange={(e) => setNewType((t) => ({ ...t, code: e.target.value }))} placeholder="ALUMNI_MEET" aria-label="Event type code" /></Field>
            <Field label="Name"><Input value={newType.name} onChange={(e) => setNewType((t) => ({ ...t, name: e.target.value }))} placeholder="Alumni meet" aria-label="Event type name" /></Field>
            <Button type="submit" disabled={newType.code.trim().length < 2 || !newType.name.trim()}>Add type</Button>
          </form>
        </Surface>
      </div>

      {editing ? <ResourceSettings resource={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} /> : null}
    </div>
  );
}

function ResourceSettings({ resource, onClose, onSaved }: { resource: Resource; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [isActive, setIsActive] = useState(resource.isActive);
  const [requiresApproval, setRequiresApproval] = useState(resource.requiresApproval);
  const [setup, setSetup] = useState(String(resource.setupBufferMinutes));
  const [cleanup, setCleanup] = useState(String(resource.cleanupBufferMinutes));
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    try {
      await eventsApi.updateResource(resource.id, { isActive, requiresApproval, setupBufferMinutes: Number(setup) || 0, cleanupBufferMinutes: Number(cleanup) || 0 });
      toast('Saved');
      onSaved();
    } catch (err) {
      toast(errorText(err), 'error');
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal open onClose={onClose} title={resource.name} description="Buffers block time before and after each booking for setup and cleanup."
      footer={<><Button variant="secondary" onClick={onClose}>Back</Button><Button disabled={busy} onClick={save}>Save</Button></>}>
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} /> Bookable</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={requiresApproval} onChange={(e) => setRequiresApproval(e.target.checked)} /> Bookings need facilities approval</label>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Setup buffer (min)"><Input type="number" min={0} max={240} value={setup} onChange={(e) => setSetup(e.target.value)} aria-label="Setup buffer minutes" /></Field>
          <Field label="Cleanup buffer (min)"><Input type="number" min={0} max={240} value={cleanup} onChange={(e) => setCleanup(e.target.value)} aria-label="Cleanup buffer minutes" /></Field>
        </div>
      </div>
    </Modal>
  );
}
