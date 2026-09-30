import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, EmptyState, PageHeader, Skeleton, Surface, Tabs, useToast } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatWhen, studentEventsApi, type Paged, type StudentEventDetail, type StudentEventItem } from '../../lib/eventsApi';
import { EventStatusBadge, Pager, errorText, isPast } from '../events/shared';

export function StudentEventsPage() {
  useDocumentTitle('Campus events');
  const [tab, setTab] = useState('upcoming');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Paged<StudentEventItem> | null>(null);
  const [mine, setMine] = useState<Awaited<ReturnType<typeof studentEventsApi.mine>> | null>(null);

  useEffect(() => {
    if (tab !== 'upcoming') return;
    setData(null);
    studentEventsApi.list(page).then(setData).catch(() => setData({ page: 1, pageSize: 20, total: 0, items: [] }));
  }, [tab, page]);
  useEffect(() => {
    if (tab === 'mine') studentEventsApi.mine().then(setMine).catch(() => setMine([]));
  }, [tab]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Campus events" subtitle="Seminars, workshops, fests and talks open to you. Register where seats are limited." />
      <div className="mb-4">
        <Tabs tabs={[{ id: 'upcoming', label: 'Upcoming' }, { id: 'mine', label: 'My registrations' }]} value={tab} onChange={setTab} />
      </div>
      {tab === 'upcoming' ? (
        !data ? <Skeleton className="h-40" /> : !data.items.length ? (
          <EmptyState title="No upcoming events" body="Scheduled events open to you will appear here." />
        ) : (
          <>
            <Surface className="!p-0 overflow-hidden">
              <ul className="divide-y divide-border">
                {data.items.map((e) => (
                  <li key={e.id}>
                    <Link to={`/lms/events/${e.id}`} className="flex flex-col gap-1.5 px-4 py-3.5 hover:bg-surface-muted/60 sm:flex-row sm:items-center sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-ink">{e.title}</p>
                        <p className="text-xs text-ink-muted">{formatWhen(e.startsAt, e.endsAt)} · {e.departmentName ?? e.organizerUnitName ?? 'Institution'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-ink-muted">{e.eventType.replaceAll('_', ' ').toLowerCase()}</span>
                        {e.myRegistrationStatus === 'REGISTERED' ? <EventStatusBadge status="REGISTERED" /> : e.registrationEnabled ? <span className="text-xs font-medium text-accent">Registration open</span> : null}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Surface>
            <Pager page={data.page} pageSize={data.pageSize} total={data.total} onPage={setPage} />
          </>
        )
      ) : !mine ? <Skeleton className="h-40" /> : !mine.length ? (
        <EmptyState title="You have not registered for any events" />
      ) : (
        <Surface className="!p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {mine.map((r) => (
              <li key={r.registrationId}>
                <Link to={`/lms/events/${r.event.id}`} className="flex flex-col gap-1.5 px-4 py-3.5 hover:bg-surface-muted/60 sm:flex-row sm:items-center sm:gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-ink">{r.event.title}</p>
                    <p className="text-xs text-ink-muted">{formatWhen(r.event.startsAt, r.event.endsAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {['CANCELLED', 'COMPLETED', 'CLOSED'].includes(r.event.status) ? <EventStatusBadge status={r.event.status} /> : null}
                    <EventStatusBadge status={r.status === 'REGISTERED' && r.attendanceStatus !== 'NOT_MARKED' ? r.attendanceStatus : r.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Surface>
      )}
    </div>
  );
}

export function StudentEventDetailPage() {
  const { id } = useParams();
  const eventId = Number(id);
  const { toast } = useToast();
  const [ev, setEv] = useState<StudentEventDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useDocumentTitle(ev?.title ?? 'Event');

  const load = useCallback(() => {
    studentEventsApi.get(eventId).then(setEv).catch((e) => setError(errorText(e)));
  }, [eventId]);
  useEffect(() => { load(); }, [load]);

  async function act(fn: () => Promise<StudentEventDetail>, ok: string) {
    setBusy(true);
    try {
      setEv(await fn());
      toast(ok);
    } catch (err) {
      toast(errorText(err), 'error');
      load();
    } finally {
      setBusy(false);
    }
  }

  if (error) return <EmptyState title="Event not available" body={error} action={<Link to="/lms/events" className="text-sm text-accent hover:underline">Back to events</Link>} />;
  if (!ev) return <Skeleton className="h-64" />;

  const registered = ev.myRegistration?.status === 'REGISTERED';
  const closesAt = ev.registrationClosesAt ?? ev.startsAt;
  const open = ev.status === 'SCHEDULED' && ev.registrationEnabled && ev.registrationAudience !== 'STAFF' && !isPast(closesAt);
  const full = ev.seatsRemaining === 0;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={ev.title}
        breadcrumb={<Link to="/lms/events" className="hover:underline">Campus events</Link>}
        subtitle={`${formatWhen(ev.startsAt, ev.endsAt)} · ${ev.departmentName ?? ev.organizerUnitName ?? 'Institution'}`}
        actions={<EventStatusBadge status={ev.status} />}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Surface className="lg:col-span-2">
          {ev.description ? <p className="whitespace-pre-line text-sm text-ink">{ev.description}</p> : <p className="text-sm text-ink-muted">No description.</p>}
          {ev.objective ? <p className="mt-3 text-sm"><span className="font-medium">Objective: </span>{ev.objective}</p> : null}
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div><dt className="text-xs text-ink-muted">Venue</dt><dd>{ev.venues.length ? ev.venues.join(', ') : ev.externalVenue ?? 'To be announced'}</dd></div>
            <div><dt className="text-xs text-ink-muted">Type</dt><dd>{ev.eventType.replaceAll('_', ' ').toLowerCase()}</dd></div>
            {ev.organizerName ? <div><dt className="text-xs text-ink-muted">Organiser</dt><dd>{ev.organizerName}</dd></div> : null}
            {ev.registrationCapacity != null ? <div><dt className="text-xs text-ink-muted">Seats left</dt><dd>{ev.seatsRemaining} of {ev.registrationCapacity}</dd></div> : null}
          </dl>
        </Surface>
        <Surface>
          <h2 className="mb-2 text-sm font-semibold text-ink">Registration</h2>
          {!ev.registrationEnabled ? (
            <p className="text-sm text-ink-muted">No registration needed — just attend.</p>
          ) : registered ? (
            <>
              <p className="mb-3 text-sm text-success">You are registered.</p>
              {ev.myRegistration && ev.myRegistration.attendanceStatus !== 'NOT_MARKED' ? <p className="mb-3 text-sm">Participation: <EventStatusBadge status={ev.myRegistration.attendanceStatus} /></p> : null}
              {ev.status === 'SCHEDULED' && !isPast(ev.startsAt) ? (
                <Button variant="secondary" size="sm" disabled={busy} onClick={() => act(() => studentEventsApi.cancel(ev.id), 'Registration cancelled')}>Cancel registration</Button>
              ) : null}
            </>
          ) : open ? (
            <>
              <p className="mb-3 text-sm text-ink-muted">Closes {new Date(`${closesAt}:00`).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}.</p>
              <Button size="sm" disabled={busy || full} onClick={() => act(() => studentEventsApi.register(ev.id), 'You are registered')}>{full ? 'Event is full' : 'Register'}</Button>
            </>
          ) : (
            <p className="text-sm text-ink-muted">Registration is closed.</p>
          )}
        </Surface>
      </div>
    </div>
  );
}
