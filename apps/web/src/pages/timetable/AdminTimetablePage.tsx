import { FormEvent, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, downloadTimetableExport } from '../../lib/api';
import { Button, Field, Input, Modal, PageHeader, Select, Surface, useToast } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Occurrence, OccurrenceCard, Period, WeekAgenda, WeekGrid, formatClock } from './timetableUi';

type ClassRow = { id: number; name: string; displayName?: string; code: string; academicYearId: number; programId: number; departmentId: number; semesterId: number };
type Subject = { id: number; courseId: number; code: string; name: string; faculty: Array<{ facultyId: number; name: string }>; facultyAssigned: boolean };
type Room = { id: number; name: string; code: string; type: string };

export function FacultyTimetablePage() {
  useDocumentTitle('My Timetable');
  const [tab, setTab] = useState<'today' | 'week' | 'calendar'>('today');
  const [data, setData] = useState<{ today: string; occurrences: Occurrence[]; periods: Period[]; nextClass?: Occurrence | null } | null>(null);
  const [calendar, setCalendar] = useState<Array<{ id: string; kind: string; title: string; date: string }>>([]);
  const [workload, setWorkload] = useState<{ rows: Array<{ subject: string; className: string; periods: number; hours: number }>; totalPeriods: number; totalHours: number } | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = () => {
    if (tab === 'calendar') {
      api<{ events: typeof calendar }>('/api/faculty/calendar')
        .then((r) => setCalendar(r.events))
        .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load calendar'));
      return;
    }
    const path = tab === 'today' ? '/api/faculty/timetable/today' : '/api/faculty/timetable/week';
    api<typeof data>(path)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load timetable'));
  };

  useEffect(() => {
    load();
    api<NonNullable<typeof workload>>('/api/faculty/workload').then(setWorkload).catch(() => setWorkload(null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const takeAttendance = async (occ: Occurrence) => {
    setBusy(occ.id);
    try {
      const session = await api<{ session: { id: number; courseId: number; academicClassId: number } }>('/api/timetable/attendance', {
        method: 'POST',
        body: JSON.stringify({
          date: occ.date,
          slotId: occ.slotId,
          overrideId: occ.overrideId,
          topicLabel: occ.plannedTopic?.topicName,
          lessonPlanEntryId: occ.plannedTopic?.entryId,
          topicId: occ.plannedTopic?.topicId,
        }),
      });
      window.location.assign(
        `/courses/${session.session.courseId}/attendance?classId=${session.session.academicClassId}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open attendance');
    } finally {
      setBusy(null);
    }
  };

  const cancelClass = async (occ: Occurrence) => {
    const reason = window.prompt('Reason for cancellation');
    if (reason == null) return;
    setBusy(occ.id);
    try {
      await api('/api/timetable/overrides', {
        method: 'POST',
        body: JSON.stringify({
          slotId: occ.slotId,
          academicClassId: occ.academicClassId,
          classSubjectId: occ.classSubjectId,
          date: occ.date,
          kind: 'CANCELLED',
          reason,
        }),
      });
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not cancel class');
    } finally {
      setBusy(null);
    }
  };

  const list = data?.occurrences ?? [];

  return (
    <div className="animate-fade-in print:block">
      <PageHeader
        title="My Timetable"
        subtitle="Today’s teaching schedule comes from the class timetable. Take attendance from a scheduled class."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant={tab === 'today' ? 'primary' : 'secondary'} onClick={() => setTab('today')}>
              Today
            </Button>
            <Button variant={tab === 'week' ? 'primary' : 'secondary'} onClick={() => setTab('week')}>
              Week
            </Button>
            <Button variant={tab === 'calendar' ? 'primary' : 'secondary'} onClick={() => setTab('calendar')}>
              Calendar
            </Button>
            <Button variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
          </div>
        }
      />
      {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}
      {workload ? (
        <p className="mb-4 text-sm text-ink-muted">
          Weekly teaching load: {workload.totalPeriods} periods · {workload.totalHours} hours
        </p>
      ) : null}
      {tab === 'today' ? (
        <div className="space-y-3">
          {list.length ? (
            list.map((occ) => (
              <OccurrenceCard
                key={occ.id}
                occ={occ}
                showClass
                actions={
                  occ.courseId && occ.state !== 'HOLIDAY' && occ.state !== 'CANCELLED' ? (
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/courses/${occ.courseId}`}>
                        <Button variant="secondary">Open Course</Button>
                      </Link>
                      <Button disabled={busy === occ.id} onClick={() => takeAttendance(occ)}>
                        Take Attendance
                      </Button>
                      {occ.slotId ? (
                        <Button variant="secondary" disabled={busy === occ.id} onClick={() => cancelClass(occ)}>
                          Cancel this date
                        </Button>
                      ) : null}
                    </div>
                  ) : undefined
                }
              />
            ))
          ) : (
            <p className="text-sm text-ink-muted">No classes scheduled today.</p>
          )}
        </div>
      ) : tab === 'week' ? (
        <>
          <div className="mb-4 hidden md:block">
            <WeekGrid periods={data?.periods ?? []} occurrences={list} readOnly />
          </div>
          <div className="md:hidden">
            <WeekAgenda
              occurrences={list}
              hrefFor={(o) => (o.courseId ? `/courses/${o.courseId}` : undefined)}
            />
          </div>
        </>
      ) : (
        <Surface padded={false}>
          {calendar.length ? (
            calendar.map((e) => (
              <div key={e.id} className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0">
                <div>
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs text-ink-muted">
                    {e.kind} · {e.date}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="px-5 py-6 text-sm text-ink-muted">No calendar events in this window.</p>
          )}
        </Surface>
      )}
    </div>
  );
}

export function AdminTimetablePage() {
  useDocumentTitle('Timetable');
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const classId = params.get('classId') ? Number(params.get('classId')) : 0;
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [context, setContext] = useState<{
    canEdit: boolean;
    subjects: Subject[];
    unassignedSubjects: Array<{ name: string; code: string }>;
    periods: Period[];
    rooms: Room[];
  } | null>(null);
  const [week, setWeek] = useState<{ occurrences: Occurrence[]; periods: Period[]; today: string } | null>(null);
  const [overview, setOverview] = useState<{
    classesWithTimetable: number;
    classesMissingTimetable: Array<{ id: number; name: string; code: string }>;
    unassignedSubjects: Array<{ className: string; subject: string; code: string }>;
    conflicts: Array<{ message: string }>;
    attendanceNotTakenToday: Occurrence[];
  } | null>(null);
  const [edit, setEdit] = useState<{
    dayOfWeek: number;
    period: Period;
    occ?: Occurrence;
    classSubjectId: string;
    facultyIds: number[];
    roomId: string;
    endPeriodId: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [extra, setExtra] = useState<{
    date: string;
    classSubjectId: string;
    facultyId: string;
    roomId: string;
    startTime: string;
    endTime: string;
    reason: string;
  } | null>(null);
  const [overrideDate, setOverrideDate] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [substituteId, setSubstituteId] = useState('');

  const refreshWeek = () => {
    if (!classId) return;
    api<NonNullable<typeof week>>(`/api/timetable/classes/${classId}/week`).then(setWeek);
    api<NonNullable<typeof overview>>('/api/timetable/overview').then(setOverview).catch(() => undefined);
  };

  useEffect(() => {
    api<{ classes: ClassRow[] }>('/api/classes').then((r) => setClasses(r.classes)).catch(() => setClasses([]));
    api<NonNullable<typeof overview>>('/api/timetable/overview').then(setOverview).catch(() => setOverview(null));
    api('/api/timetable/periods/defaults', { method: 'POST' }).catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!classId) return;
    api<NonNullable<typeof context>>(`/api/timetable/classes/${classId}/context`).then(setContext);
    api<NonNullable<typeof week>>(`/api/timetable/classes/${classId}/week`).then(setWeek);
  }, [classId]);

  const subjects = context?.subjects ?? [];
  const teachingPeriods = context?.periods.filter((p) => p.kind === 'PERIOD') ?? [];

  const openCell = (dayOfWeek: number, period: Period, occ?: Occurrence) => {
    const subject = occ ? subjects.find((s) => s.id === occ.classSubjectId) : undefined;
    setEdit({
      dayOfWeek,
      period,
      occ,
      classSubjectId: occ?.classSubjectId ? String(occ.classSubjectId) : '',
      facultyIds: occ?.faculty.map((f) => f.facultyId) ?? [],
      roomId: occ?.roomId ? String(occ.roomId) : '',
      endPeriodId: occ?.endPeriodNumber
        ? String(teachingPeriods.find((p) => p.periodNumber === occ.endPeriodNumber)?.id ?? period.id)
        : String(period.id),
    });
    setOverrideDate(week?.today || '');
    setOverrideReason('');
    setSubstituteId('');
    if (subject && !occ?.faculty.length) {
      setEdit((cur) => cur && { ...cur, facultyIds: subject.faculty.map((f) => f.facultyId).slice(0, 1) });
    }
  };

  const selectedSubject = subjects.find((s) => String(s.id) === edit?.classSubjectId);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!edit || !classId) return;
    if (!edit.classSubjectId) {
      toast('Select a mapped subject', 'error');
      return;
    }
    if (!selectedSubject?.faculty.length) {
      toast('Faculty Not Assigned', 'error');
      return;
    }
    const facultyIds = edit.facultyIds.length ? edit.facultyIds : selectedSubject.faculty.slice(0, 1).map((f) => f.facultyId);
    setSaving(true);
    try {
      const body = {
        academicClassId: classId,
        classSubjectId: Number(edit.classSubjectId),
        facultyIds,
        roomId: edit.roomId ? Number(edit.roomId) : null,
        dayOfWeek: edit.dayOfWeek,
        startPeriodId: edit.period.id,
        endPeriodId: Number(edit.endPeriodId || edit.period.id),
        effectiveFrom: week?.today || new Date().toISOString().slice(0, 10),
      };
      if (edit.occ?.slotId) {
        await api(`/api/timetable/slots/${edit.occ.slotId}`, { method: 'PATCH', body: JSON.stringify(body) });
      } else {
        await api('/api/timetable/slots', { method: 'POST', body: JSON.stringify(body) });
      }
      setEdit(null);
      refreshWeek();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save slot', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Academic Timetable"
        subtitle="Schedule subjects against Academic Classes. Conflicts are blocked, never overwritten."
        actions={
          classId ? (
            <button
              type="button"
              className="text-sm font-medium text-accent"
              onClick={() => downloadTimetableExport('class', classId)}
            >
              Export CSV
            </button>
          ) : null
        }
      />

      {overview ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Timetable complete</p>
            <p className="mt-1 text-2xl font-semibold">{overview.classesWithTimetable}</p>
          </Surface>
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Missing timetable</p>
            <p className="mt-1 text-2xl font-semibold">{overview.classesMissingTimetable.length}</p>
          </Surface>
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Faculty / room conflicts</p>
            <p className="mt-1 text-2xl font-semibold">{overview.conflicts.length}</p>
          </Surface>
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Attendance not taken today</p>
            <p className="mt-1 text-2xl font-semibold">{overview.attendanceNotTakenToday.length}</p>
          </Surface>
        </div>
      ) : null}

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Field label="Academic class">
          <Select
            value={classId || ''}
            onChange={(e) => setParams(e.target.value ? { classId: e.target.value } : {})}
          >
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.displayName || c.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end gap-2">
          <Link to="/admin/calendar">
            <Button variant="secondary">Academic Calendar</Button>
          </Link>
          <Link to="/admin/timetable/rooms">
            <Button variant="secondary">Rooms & Periods</Button>
          </Link>
          {classId ? (
            <Button
              variant="secondary"
              onClick={() =>
                setExtra({
                  date: week?.today || '',
                  classSubjectId: subjects[0] ? String(subjects[0].id) : '',
                  facultyId: subjects[0]?.faculty[0] ? String(subjects[0].faculty[0].facultyId) : '',
                  roomId: '',
                  startTime: '16:30',
                  endTime: '17:30',
                  reason: '',
                })
              }
            >
              Extra class
            </Button>
          ) : null}
        </div>
      </div>

      {context?.unassignedSubjects.length ? (
        <p className="mb-3 text-sm text-warning">
          Faculty Not Assigned: {context.unassignedSubjects.map((s) => s.code).join(', ')}
        </p>
      ) : null}

      {classId && week ? (
        <>
          <div className="mb-4 hidden md:block print:block">
            <WeekGrid periods={context?.periods ?? week.periods} occurrences={week.occurrences} onCell={openCell} />
          </div>
          <div className="md:hidden print:hidden">
            <WeekAgenda occurrences={week.occurrences} />
          </div>
          {week.occurrences.some((o) => o.state === 'EXTRA' || o.state === 'MAKEUP' || o.state === 'SPECIAL') ? (
            <div className="mt-4 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Extra / special classes</h3>
              {week.occurrences
                .filter((o) => o.state === 'EXTRA' || o.state === 'MAKEUP' || o.state === 'SPECIAL')
                .map((o) => (
                  <OccurrenceCard key={o.id} occ={o} showClass />
                ))}
            </div>
          ) : null}
          <div className="mt-4 flex gap-2 print:hidden">
            <Button variant="secondary" onClick={() => window.print()}>
              Print class timetable
            </Button>
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-muted">Choose a class to build or review its weekly timetable.</p>
      )}

      <Modal
        open={Boolean(edit)}
        onClose={() => setEdit(null)}
        title={edit?.occ ? 'Edit period' : 'Assign period'}
        footer={
          <Button form="slot-form" disabled={saving}>
            Save
          </Button>
        }
      >
        {edit ? (
          <form id="slot-form" className="space-y-3" onSubmit={save}>
            <p className="text-sm text-ink-muted">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][edit.dayOfWeek - 1]} · {edit.period.name} ·{' '}
              {formatClock(edit.period.startTime)}
            </p>
            <Field label="Subject">
              <Select
                value={edit.classSubjectId}
                onChange={(e) => {
                  const subject = subjects.find((s) => String(s.id) === e.target.value);
                  setEdit({
                    ...edit,
                    classSubjectId: e.target.value,
                    facultyIds: subject?.faculty[0] ? [subject.faculty[0].facultyId] : [],
                  });
                }}
              >
                <option value="">Select</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} disabled={!s.facultyAssigned}>
                    {s.code} {s.name}
                    {!s.facultyAssigned ? ' — Faculty Not Assigned' : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Faculty">
              <Select
                value={edit.facultyIds[0] ? String(edit.facultyIds[0]) : ''}
                onChange={(e) => setEdit({ ...edit, facultyIds: e.target.value ? [Number(e.target.value)] : [] })}
              >
                <option value="">Select mapped faculty</option>
                {(selectedSubject?.faculty || []).map((f) => (
                  <option key={f.facultyId} value={f.facultyId}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Field>
            {(selectedSubject?.faculty.length || 0) > 1 ? (
              <Field label="Additional faculty (lab)">
                <Select
                  value={edit.facultyIds[1] ? String(edit.facultyIds[1]) : ''}
                  onChange={(e) => {
                    const added = e.target.value ? Number(e.target.value) : null;
                    setEdit({
                      ...edit,
                      facultyIds: added ? [...edit.facultyIds.slice(0, 1), added] : edit.facultyIds.slice(0, 1),
                    });
                  }}
                >
                  <option value="">None</option>
                  {(selectedSubject?.faculty || [])
                    .filter((f) => f.facultyId !== edit.facultyIds[0])
                    .map((f) => (
                      <option key={f.facultyId} value={f.facultyId}>
                        {f.name}
                      </option>
                    ))}
                </Select>
              </Field>
            ) : null}
            <Field label="Through period (lab block)">
              <Select value={edit.endPeriodId} onChange={(e) => setEdit({ ...edit, endPeriodId: e.target.value })}>
                {teachingPeriods
                  .filter((p) => (p.periodNumber ?? 0) >= (edit.period.periodNumber ?? 0))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Room / Lab">
              <Select value={edit.roomId} onChange={(e) => setEdit({ ...edit, roomId: e.target.value })}>
                <option value="">Unassigned</option>
                {(context?.rooms || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} · {r.name} ({r.type})
                  </option>
                ))}
              </Select>
            </Field>
            {edit.occ?.slotId ? (
              <div className="space-y-3 rounded-[var(--radius-md)] border border-border p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">This date only</p>
                <Field label="Date">
                  <Input type="date" value={overrideDate} onChange={(e) => setOverrideDate(e.target.value)} />
                </Field>
                <Field label="Reason">
                  <Input value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Optional" />
                </Field>
                <Field label="Substitute faculty">
                  <Select value={substituteId} onChange={(e) => setSubstituteId(e.target.value)}>
                    <option value="">None</option>
                    {(selectedSubject?.faculty || [])
                      .filter((f) => f.facultyId !== edit.facultyIds[0])
                      .map((f) => (
                        <option key={f.facultyId} value={f.facultyId}>
                          {f.name}
                        </option>
                      ))}
                  </Select>
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving || !overrideDate}
                    onClick={async () => {
                      if (!edit.occ?.slotId || !classId || !overrideDate) return;
                      setSaving(true);
                      try {
                        await api('/api/timetable/overrides', {
                          method: 'POST',
                          body: JSON.stringify({
                            slotId: edit.occ.slotId,
                            academicClassId: classId,
                            classSubjectId: edit.occ.classSubjectId,
                            date: overrideDate,
                            kind: 'CANCELLED',
                            reason: overrideReason || 'Class cancelled',
                          }),
                        });
                        setEdit(null);
                        refreshWeek();
                      } catch (err) {
                        toast(err instanceof Error ? err.message : 'Could not cancel', 'error');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Cancel this date
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={saving || !overrideDate || !substituteId}
                    onClick={async () => {
                      if (!edit.occ?.slotId || !classId || !overrideDate || !substituteId) return;
                      setSaving(true);
                      try {
                        await api('/api/timetable/overrides', {
                          method: 'POST',
                          body: JSON.stringify({
                            slotId: edit.occ.slotId,
                            academicClassId: classId,
                            classSubjectId: edit.occ.classSubjectId,
                            date: overrideDate,
                            kind: 'SUBSTITUTION',
                            substituteFacultyId: Number(substituteId),
                            reason: overrideReason || 'Authorized substitution',
                          }),
                        });
                        setEdit(null);
                        refreshWeek();
                      } catch (err) {
                        toast(err instanceof Error ? err.message : 'Could not substitute', 'error');
                      } finally {
                        setSaving(false);
                      }
                    }}
                  >
                    Substitute
                  </Button>
                </div>
              </div>
            ) : null}
          </form>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(extra)}
        onClose={() => setExtra(null)}
        title="Schedule extra class"
        footer={
          <Button form="extra-form" disabled={saving}>
            Add extra class
          </Button>
        }
      >
        {extra ? (
          <form
            id="extra-form"
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!classId || !extra.classSubjectId) return;
              const subject = subjects.find((s) => String(s.id) === extra.classSubjectId);
              setSaving(true);
              try {
                await api('/api/timetable/overrides', {
                  method: 'POST',
                  body: JSON.stringify({
                    academicClassId: classId,
                    classSubjectId: Number(extra.classSubjectId),
                    courseId: subject?.courseId,
                    facultyId: extra.facultyId ? Number(extra.facultyId) : subject?.faculty[0]?.facultyId,
                    roomId: extra.roomId ? Number(extra.roomId) : null,
                    date: extra.date,
                    kind: 'EXTRA',
                    startTime: extra.startTime,
                    endTime: extra.endTime,
                    reason: extra.reason || 'Extra class',
                  }),
                });
                setExtra(null);
                refreshWeek();
              } catch (err) {
                toast(err instanceof Error ? err.message : 'Could not add extra class', 'error');
              } finally {
                setSaving(false);
              }
            }}
          >
            <Field label="Date">
              <Input type="date" value={extra.date} onChange={(e) => setExtra({ ...extra, date: e.target.value })} required />
            </Field>
            <Field label="Subject">
              <Select
                value={extra.classSubjectId}
                onChange={(e) => {
                  const subject = subjects.find((s) => String(s.id) === e.target.value);
                  setExtra({
                    ...extra,
                    classSubjectId: e.target.value,
                    facultyId: subject?.faculty[0] ? String(subject.faculty[0].facultyId) : '',
                  });
                }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} disabled={!s.facultyAssigned}>
                    {s.code} {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Faculty">
              <Select value={extra.facultyId} onChange={(e) => setExtra({ ...extra, facultyId: e.target.value })}>
                {(subjects.find((s) => String(s.id) === extra.classSubjectId)?.faculty || []).map((f) => (
                  <option key={f.facultyId} value={f.facultyId}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Room">
              <Select value={extra.roomId} onChange={(e) => setExtra({ ...extra, roomId: e.target.value })}>
                <option value="">Unassigned</option>
                {(context?.rooms || []).map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code} · {r.name}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Start">
                <Input value={extra.startTime} onChange={(e) => setExtra({ ...extra, startTime: e.target.value })} required />
              </Field>
              <Field label="End">
                <Input value={extra.endTime} onChange={(e) => setExtra({ ...extra, endTime: e.target.value })} required />
              </Field>
            </div>
            <Field label="Reason">
              <Input value={extra.reason} onChange={(e) => setExtra({ ...extra, reason: e.target.value })} />
            </Field>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

export function AdminRoomsPeriodsPage() {
  useDocumentTitle('Rooms & Periods');
  const { toast } = useToast();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [room, setRoom] = useState({ name: '', code: '', type: 'CLASSROOM', building: '', floor: '', capacity: '' });
  const [periodForm, setPeriodForm] = useState({
    name: '',
    periodNumber: '',
    startTime: '',
    endTime: '',
    kind: 'PERIOD',
  });

  const load = () => {
    api<{ periods: Period[] }>('/api/timetable/periods').then((r) => setPeriods(r.periods));
    api<{ rooms: Room[] }>('/api/timetable/rooms').then((r) => setRooms(r.rooms));
  };
  useEffect(() => {
    api('/api/timetable/periods/defaults', { method: 'POST' }).finally(load);
  }, []);

  const addRoom = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api('/api/timetable/rooms', {
        method: 'POST',
        body: JSON.stringify({
          ...room,
          capacity: room.capacity ? Number(room.capacity) : null,
        }),
      });
      setRoom({ name: '', code: '', type: 'CLASSROOM', building: '', floor: '', capacity: '' });
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <PageHeader title="Rooms & Periods" subtitle="College-level timetable configuration. Period timings are not hardcoded globally." />
      <Surface>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Periods</h2>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-5"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await api('/api/timetable/periods', {
                method: 'POST',
                body: JSON.stringify({
                  name: periodForm.name,
                  periodNumber: periodForm.periodNumber ? Number(periodForm.periodNumber) : null,
                  startTime: periodForm.startTime,
                  endTime: periodForm.endTime,
                  kind: periodForm.kind,
                }),
              });
              setPeriodForm({ name: '', periodNumber: '', startTime: '', endTime: '', kind: 'PERIOD' });
              load();
            } catch (err) {
              toast(err instanceof Error ? err.message : 'Failed to save period', 'error');
            }
          }}
        >
          <Input placeholder="Name" value={periodForm.name} onChange={(e) => setPeriodForm({ ...periodForm, name: e.target.value })} required />
          <Input placeholder="No." value={periodForm.periodNumber} onChange={(e) => setPeriodForm({ ...periodForm, periodNumber: e.target.value })} />
          <Input placeholder="Start HH:MM" value={periodForm.startTime} onChange={(e) => setPeriodForm({ ...periodForm, startTime: e.target.value })} required />
          <Input placeholder="End HH:MM" value={periodForm.endTime} onChange={(e) => setPeriodForm({ ...periodForm, endTime: e.target.value })} required />
          <div className="flex gap-2">
            <Select value={periodForm.kind} onChange={(e) => setPeriodForm({ ...periodForm, kind: e.target.value })}>
              {['PERIOD', 'BREAK', 'LUNCH'].map((k) => (
                <option key={k}>{k}</option>
              ))}
            </Select>
            <Button type="submit">Add</Button>
          </div>
        </form>
        <ul className="mt-3 divide-y divide-border">
          {periods.map((p) => (
            <li key={p.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {p.name} {p.kind !== 'PERIOD' ? `(${p.kind})` : ''}
              </span>
              <span className="tabular-nums text-ink-muted">
                {formatClock(p.startTime)}–{formatClock(p.endTime)}
              </span>
            </li>
          ))}
        </ul>
      </Surface>
      <Surface>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Rooms / Labs</h2>
        <form className="mt-3 grid gap-3 sm:grid-cols-3" onSubmit={addRoom}>
          <Input placeholder="Name" value={room.name} onChange={(e) => setRoom({ ...room, name: e.target.value })} required />
          <Input placeholder="Code" value={room.code} onChange={(e) => setRoom({ ...room, code: e.target.value })} required />
          <Select value={room.type} onChange={(e) => setRoom({ ...room, type: e.target.value })}>
            {['CLASSROOM', 'LAB', 'SEMINAR_HALL', 'AUDITORIUM', 'OTHER'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
          <Input placeholder="Building" value={room.building} onChange={(e) => setRoom({ ...room, building: e.target.value })} />
          <Input placeholder="Floor" value={room.floor} onChange={(e) => setRoom({ ...room, floor: e.target.value })} />
          <Input placeholder="Capacity" value={room.capacity} onChange={(e) => setRoom({ ...room, capacity: e.target.value })} />
          <Button type="submit">Add room</Button>
        </form>
        <ul className="mt-4 divide-y divide-border text-sm">
          {rooms.map((r) => (
            <li key={r.id} className="flex justify-between py-2">
              <span>
                {r.code} · {r.name}
              </span>
              <span className="text-ink-muted">{r.type}</span>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
