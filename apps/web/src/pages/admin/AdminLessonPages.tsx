import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, ConfirmDangerModal, Field, Input, Modal, PageHeader, Select, StatusBadge, Surface, useToast } from '../../components/ui';
import { formatISODate } from '../../lib/utils';
import { Trash2 } from 'lucide-react';

type PlanRow = {
  id: number;
  courseName: string;
  facultyName: string;
  departmentName?: string;
  semesterLabel?: string;
  sectionLabel?: string;
  status: string;
  progress: { hoursPercent: number; completedHours: number; totalHours: number };
};

type MasterSubject = {
  courseId: number;
  courseName: string;
  moduleCount: number;
  topicCount: number;
  subtopicCount: number;
  hours: number;
};

type Calendar = {
  id: number;
  name: string;
  academicYearId: number;
  academicYearLabel?: string;
  startDate: string;
  endDate: string;
  isDefault: boolean;
  exceptions: Array<{ id: number; date: string; type: string; label?: string }>;
};

export function AdminLessonPlansPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [status, setStatus] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    const qs = status ? `?status=${status}` : '';
    api<{ plans: PlanRow[] }>(`/api/lesson-plans/admin/plans${qs}`)
      .then((r) => setPlans(r.plans))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Lesson Plans" subtitle="Institution-wide progress. Faculty own their generated plans." />
      <div className="mb-4">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All status</option>
          {['DRAFT', 'ACTIVE', 'ARCHIVED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </div>
      <Surface className="!p-0 overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[12px] uppercase text-ink-muted">
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Faculty</th>
              <th className="px-4 py-3">Class</th>
              <th className="px-4 py-3">Progress</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id} className="border-b border-border/70">
                <td className="px-4 py-3">
                  <Link className="font-medium text-accent" to={`/lesson-plans/${p.id}`}>
                    {p.courseName}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.facultyName}</td>
                <td className="px-4 py-3 text-ink-muted">
                  {p.semesterLabel} {p.sectionLabel}
                </td>
                <td className="px-4 py-3 tabular-nums">
                  {p.progress.completedHours}/{p.progress.totalHours} · {p.progress.hoursPercent}%
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3">
                  <Button variant="danger-soft" size="sm" onClick={() => setDeleteId(p.id)}>
                    <Trash2 size={14} /> Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>
      <ConfirmDangerModal
        open={deleteId != null}
        title="Delete this lesson plan?"
        description="This permanently removes the lesson plan and its scheduled topics. This cannot be undone."
        confirmLabel="Delete Lesson Plan"
        loading={deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId == null) return;
          setDeleting(true);
          try {
            await api(`/api/lesson-plans/${deleteId}`, { method: 'DELETE' });
            toast('Lesson plan deleted');
            setDeleteId(null);
            load();
          } catch (e) {
            toast(e instanceof Error ? e.message : 'Could not delete lesson plan', 'error');
          } finally {
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}

export function AdminLessonMasterPage() {
  const { toast } = useToast();
  const [subjects, setSubjects] = useState<MasterSubject[]>([]);
  const [courseId, setCourseId] = useState<number | null>(null);
  const [detail, setDetail] = useState<{
    modules: Array<{
      id: number;
      name: string;
      topics: Array<{
        id: number;
        name: string;
        subtopics: Array<{ id: number; name: string; hours: number; hoursSource: string; sourceReference?: string }>;
      }>;
    }>;
  } | null>(null);

  useEffect(() => {
    api<{ subjects: MasterSubject[] }>('/api/lesson-plans/admin/master')
      .then((r) => setSubjects(r.subjects))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [toast]);

  useEffect(() => {
    if (!courseId) return;
    api<{
      modules: Array<{
        id: number;
        name: string;
        topics: Array<{
          id: number;
          name: string;
          subtopics: Array<{ id: number; name: string; hours: number; hoursSource: string; sourceReference?: string }>;
        }>;
      }>;
    }>(`/api/lesson-plans/admin/master/${courseId}`)
      .then(setDetail)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [courseId, toast]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Lesson Plan Master" subtitle="Imported academic content. Faculty copies are separate." />
      <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
        <Surface className="!p-0">
          <ul>
            {subjects.map((s) => (
              <li key={s.courseId}>
                <button
                  type="button"
                  onClick={() => setCourseId(s.courseId)}
                  className={`w-full px-4 py-3 text-left text-sm ${courseId === s.courseId ? 'bg-accent-soft' : ''}`}
                >
                  <p className="font-medium">{s.courseName}</p>
                  <p className="text-xs text-ink-muted">
                    {s.moduleCount} modules · {s.subtopicCount} units · {s.hours}h
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Surface>
        <div className="space-y-4">
          {detail?.modules.map((m) => (
            <Surface key={m.id}>
              <h3 className="font-medium">{m.name}</h3>
              {m.topics.map((t) => (
                <div key={t.id} className="mt-3">
                  <p className="text-sm font-medium">{t.name}</p>
                  <ul className="mt-1 space-y-1 text-xs text-ink-secondary">
                    {t.subtopics.map((s) => (
                      <li key={s.id}>
                        {s.name} · {s.hours}h · {s.hoursSource}
                        {s.sourceReference ? ` · ${s.sourceReference}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Surface>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AdminCalendarPage() {
  const { toast } = useToast();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [lookups, setLookups] = useState<{ academicYears: Array<{ id: number; label: string }> } | null>(null);
  const [open, setOpen] = useState(false);
  const [holiday, setHoliday] = useState<{ calendarId: number; date: string; label: string; type: string } | null>(null);
  const [form, setForm] = useState({ name: '', academicYearId: '', startDate: '', endDate: '' });

  const load = () => {
    api<{ calendars: Calendar[] }>('/api/lesson-plans/admin/calendars')
      .then((r) => setCalendars(r.calendars))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  };

  useEffect(() => {
    load();
    api<{ academicYears: Array<{ id: number; label: string }> }>('/api/meta/lookups').then(setLookups);
  }, []);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    await api('/api/lesson-plans/admin/calendars', {
      method: 'POST',
      body: JSON.stringify({
        name: form.name,
        academicYearId: Number(form.academicYearId),
        startDate: form.startDate,
        endDate: form.endDate,
        isDefault: calendars.length === 0,
      }),
    });
    setOpen(false);
    load();
  };

  const addHoliday = async () => {
    if (!holiday) return;
    const blocking = holiday.type === 'HOLIDAY' || holiday.type === 'VACATION';
    let res: { affectedPlans: number } = { affectedPlans: 0 };
    if (blocking) {
      res = await api<{ affectedPlans: number }>(`/api/lesson-plans/admin/calendars/${holiday.calendarId}/exceptions`, {
        method: 'POST',
        body: JSON.stringify({
          exceptionDate: holiday.date,
          exceptionType: holiday.type === 'VACATION' ? 'NON_TEACHING' : 'HOLIDAY',
          label: holiday.label || holiday.type || 'Holiday',
        }),
      });
    }
    await api('/api/timetable/calendar/events', {
      method: 'POST',
      body: JSON.stringify({
        calendarId: holiday.calendarId,
        eventType: holiday.type || 'HOLIDAY',
        title: holiday.label || holiday.type || 'Holiday',
        startDate: holiday.date,
        endDate: holiday.date,
      }),
    }).catch(() => undefined);
    toast(
      res.affectedPlans
        ? `Holiday added. ${res.affectedPlans} lesson plan(s) have a scheduled class on this date.`
        : 'Holiday added',
    );
    setHoliday(null);
    load();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Academic Calendar"
        subtitle="Working days, holidays and blocked teaching dates. Existing faculty plans are not rewritten automatically."
        actions={<Button onClick={() => setOpen(true)}>Add calendar</Button>}
      />
      <div className="space-y-4">
        {calendars.map((c) => (
          <Surface key={c.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-medium">{c.name}</h3>
                <p className="text-xs text-ink-muted">
                  {c.academicYearLabel} · {formatISODate(c.startDate)} – {formatISODate(c.endDate)}
                  {c.isDefault ? ' · Default' : ''}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setHoliday({ calendarId: c.id, date: '', label: '', type: 'HOLIDAY' })}>
                Add holiday
              </Button>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              {c.exceptions.map((ex) => (
                <li key={ex.id} className="flex justify-between">
                  <span>
                    {formatISODate(ex.date)} · {ex.label || ex.type}
                  </span>
                  <button
                    type="button"
                    className="text-xs text-danger"
                    onClick={() =>
                      api(`/api/lesson-plans/admin/calendars/${c.id}/exceptions/${ex.id}`, { method: 'DELETE' }).then(load)
                    }
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          </Surface>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New academic calendar" footer={<Button form="cal-form">Create</Button>}>
        <form id="cal-form" onSubmit={create} className="space-y-3">
          <Field label="Name">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Academic year">
            <Select required value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })}>
              <option value="">Select</option>
              {(lookups?.academicYears ?? []).map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start">
            <Input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </Field>
          <Field label="End">
            <Input type="date" required value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </Field>
        </form>
      </Modal>

      <Modal
        open={Boolean(holiday)}
        onClose={() => setHoliday(null)}
        title="Add calendar event"
        footer={<Button onClick={addHoliday}>Save</Button>}
      >
        <div className="space-y-3">
          <Field label="Type">
            <Select
              value={holiday?.type || 'HOLIDAY'}
              onChange={(e) => setHoliday(holiday ? { ...holiday, type: e.target.value } : null)}
            >
              {['HOLIDAY', 'VACATION', 'WORKING_DAY', 'CIE', 'SEE', 'REGISTRATION', 'RESULT', 'EVENT', 'SEMESTER_START', 'SEMESTER_END'].map((t) => (
                <option key={t} value={t}>
                  {t.replaceAll('_', ' ')}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date">
            <Input type="date" value={holiday?.date || ''} onChange={(e) => setHoliday(holiday ? { ...holiday, date: e.target.value } : null)} />
          </Field>
          <Field label="Label">
            <Input value={holiday?.label || ''} onChange={(e) => setHoliday(holiday ? { ...holiday, label: e.target.value } : null)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
