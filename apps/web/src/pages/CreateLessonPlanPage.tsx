import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Field, Input, Modal, PageHeader, Select, Surface, useToast } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

type Lookups = {
  departments: Array<{ id: number; name: string }>;
  academicYears: Array<{ id: number; label: string; is_current?: boolean }>;
  semesters: Array<{ id: number; label: string; number?: number }>;
  courses: Array<{ id: number; name: string; code: string; department_id: number | null }>;
  sections: Array<{ id: number; label: string; department_id: number | null }>;
  programs?: Array<{ id: number; name: string; department_id?: number | null }>;
};

type CatalogSubject = {
  courseId: number;
  courseName: string;
  moduleCount: number;
  topicCount: number;
  subtopicCount: number;
  hours: number;
};

type CatalogDetail = {
  moduleCount: number;
  topicCount: number;
  subtopicCount: number;
  hours: number;
  modules: Array<{
    id: number;
    name: string;
    unitKind: string;
    topicCount: number;
    subtopicCount: number;
    hours: number;
    topics: Array<{
      id: number;
      name: string;
      subtopics: Array<{ id: number; name: string; hours: number }>;
    }>;
  }>;
};

const WEEKDAYS = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const defaultSlots = [
  { weekday: 1, startTime: '10:00', endTime: '11:00', hours: 1 },
  { weekday: 3, startTime: '11:00', endTime: '12:00', hours: 1 },
  { weekday: 4, startTime: '14:00', endTime: '15:00', hours: 1 },
];

export function CreateLessonPlanPage() {
  useDocumentTitle('Create Lesson Plan');
  const navigate = useNavigate();
  const { toast } = useToast();
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [catalog, setCatalog] = useState<CatalogSubject[]>([]);
  const [detail, setDetail] = useState<CatalogDetail | null>(null);
  const [form, setForm] = useState({
    academicYearId: '',
    semesterId: '',
    departmentId: '',
    programId: '',
    classSectionId: '',
    courseId: '',
  });
  const [slots, setSlots] = useState(defaultSlots);
  const [busy, setBusy] = useState(false);
  const [shortfall, setShortfall] = useState<{ requiredHours: number; availableHours: number; shortfallHours: number } | null>(null);

  useEffect(() => {
    Promise.all([api<Lookups>('/api/meta/lookups'), api<{ subjects: CatalogSubject[] }>('/api/lesson-plans/catalog')])
      .then(([l, c]) => {
        setLookups(l);
        setCatalog(c.subjects);
        const year = l.academicYears.find((y) => y.is_current) ?? l.academicYears[0];
        const sem = l.semesters.find((s) => s.number === 7) ?? l.semesters[0];
        setForm((f) => ({
          ...f,
          academicYearId: year ? String(year.id) : '',
          semesterId: sem ? String(sem.id) : '',
          departmentId: l.departments[0] ? String(l.departments[0].id) : '',
          programId: l.programs?.[0] ? String(l.programs[0].id) : '',
          classSectionId: l.sections[0] ? String(l.sections[0].id) : '',
        }));
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));
  }, [toast]);

  useEffect(() => {
    if (!form.courseId) {
      setDetail(null);
      return;
    }
    api<CatalogDetail>(`/api/lesson-plans/catalog/${form.courseId}`)
      .then(setDetail)
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load subject content', 'error'));
  }, [form.courseId, toast]);

  const selected = useMemo(
    () => catalog.find((s) => String(s.courseId) === form.courseId),
    [catalog, form.courseId],
  );

  const payload = (continueWithShortfall = false) => ({
    courseId: Number(form.courseId),
    academicYearId: Number(form.academicYearId),
    semesterId: form.semesterId ? Number(form.semesterId) : null,
    departmentId: form.departmentId ? Number(form.departmentId) : null,
    programId: form.programId ? Number(form.programId) : null,
    classSectionId: form.classSectionId ? Number(form.classSectionId) : null,
    includeSupplementary: false,
    continueWithShortfall,
    teachingSlots: slots,
  });

  const generate = async (continueWithShortfall = false) => {
    setBusy(true);
    try {
      const res = await api<{ plan: { plan: { id: number } } }>('/api/lesson-plans', {
        method: 'POST',
        body: JSON.stringify(payload(continueWithShortfall)),
      });
      toast('Lesson plan generated');
      navigate(`/lesson-plans/${res.plan.plan.id}`);
    } catch (err) {
      const e = err as Error & { status?: number; details?: { requiredHours: number; availableHours: number; shortfallHours: number } };
      if (e.status === 409 && e.details) {
        setShortfall(e.details);
      } else {
        toast(e.message || 'Could not generate', 'error');
      }
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    generate(false);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Create Lesson Plan" subtitle="Select the class and subject. The imported syllabus is scheduled for you." />
      <form onSubmit={onSubmit} className="space-y-5">
        <Surface className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Academic Year">
            <Select value={form.academicYearId} onChange={(e) => setForm({ ...form, academicYearId: e.target.value })} required>
              <option value="">Select</option>
              {(lookups?.academicYears ?? []).map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Semester">
            <Select value={form.semesterId} onChange={(e) => setForm({ ...form, semesterId: e.target.value })}>
              <option value="">Select</option>
              {(lookups?.semesters ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Department">
            <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Select</option>
              {(lookups?.departments ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Program">
            <Select value={form.programId} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
              <option value="">Select</option>
              {(lookups?.programs ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Section">
            <Select value={form.classSectionId} onChange={(e) => setForm({ ...form, classSectionId: e.target.value })}>
              <option value="">Select</option>
              {(lookups?.sections ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subject">
            <Select value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })} required>
              <option value="">Select imported subject</option>
              {catalog.map((s) => (
                <option key={s.courseId} value={s.courseId}>
                  {s.courseName}
                </option>
              ))}
            </Select>
          </Field>
        </Surface>

        {selected && detail ? (
          <Surface>
            <h2 className="text-sm font-semibold text-ink">{selected.courseName}</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              {detail.moduleCount} {detail.modules[0]?.unitKind === 'UNIT' ? 'Units' : 'Modules'} · {detail.topicCount} Topics · {detail.subtopicCount} Subtopics · {detail.hours} Teaching Hours
            </p>
            <div className="mt-4 space-y-4">
              {detail.modules.map((mod) => (
                <div key={mod.id}>
                  <p className="text-sm font-medium text-ink">{mod.name}</p>
                  <p className="text-xs text-ink-muted">
                    {mod.topicCount} topics · {mod.subtopicCount} subtopics · {mod.hours} hours
                  </p>
                  <ul className="mt-2 space-y-1 text-sm">
                    {mod.topics.map((t) => (
                      <li key={t.id}>
                        <span className="font-medium">{t.name}</span>
                        <ul className="ml-4 list-disc text-xs text-ink-secondary">
                          {t.subtopics.map((s) => (
                            <li key={s.id}>
                              {s.name} <span className="text-ink-muted">({s.hours}h)</span>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Surface>
        ) : null}

        <Surface>
          <h2 className="text-sm font-semibold text-ink">Teaching schedule</h2>
          <p className="mt-1 text-xs text-ink-muted">Used with the academic calendar to place every topic automatically.</p>
          <div className="mt-3 space-y-2">
            {slots.map((slot, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-4">
                <Select
                  value={slot.weekday}
                  onChange={(e) => {
                    const next = [...slots];
                    next[i] = { ...slot, weekday: Number(e.target.value) };
                    setSlots(next);
                  }}
                >
                  {WEEKDAYS.map((d) => (
                    <option key={d.value} value={d.value}>
                      {d.label}
                    </option>
                  ))}
                </Select>
                <Input
                  type="time"
                  value={slot.startTime}
                  onChange={(e) => {
                    const next = [...slots];
                    next[i] = { ...slot, startTime: e.target.value };
                    setSlots(next);
                  }}
                />
                <Input
                  type="time"
                  value={slot.endTime}
                  onChange={(e) => {
                    const next = [...slots];
                    next[i] = { ...slot, endTime: e.target.value };
                    setSlots(next);
                  }}
                />
                <Input
                  type="number"
                  min={1}
                  max={3}
                  value={slot.hours}
                  onChange={(e) => {
                    const next = [...slots];
                    next[i] = { ...slot, hours: Number(e.target.value) || 1 };
                    setSlots(next);
                  }}
                />
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="secondary"
            className="mt-3"
            onClick={() => setSlots([...slots, { weekday: 1, startTime: '10:00', endTime: '11:00', hours: 1 }])}
          >
            Add additional class
          </Button>
        </Surface>

        <div className="flex justify-end">
          <Button type="submit" disabled={busy || !form.courseId}>
            {busy ? 'Generating…' : 'Generate'}
          </Button>
        </div>
      </form>

      <Modal
        open={Boolean(shortfall)}
        onClose={() => setShortfall(null)}
        title="Schedule shortfall"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShortfall(null)}>
              Adjust teaching schedule
            </Button>
            <Button
              onClick={() => {
                setShortfall(null);
                generate(true);
              }}
            >
              Continue with warning
            </Button>
          </>
        }
      >
        {shortfall ? (
          <div className="space-y-2 text-sm">
            <p>Required {shortfall.requiredHours} hours</p>
            <p>Available {shortfall.availableHours} hours</p>
            <p className="font-medium text-warning">Shortfall {shortfall.shortfallHours} hours</p>
            <p className="text-ink-muted">Topics will not be dropped. Remaining items stay unscheduled until you add classes.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
