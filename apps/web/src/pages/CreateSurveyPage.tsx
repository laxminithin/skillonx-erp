import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Field, Input, PageHeader, Select, Surface, Textarea } from '../components/ui';
import { DEFAULT_TIMEZONE, zonedLocalToUtcIso } from '../lib/timezone';

type Lookups = {
  departments: Array<{ id: number; name: string; code: string }>;
  academicYears: Array<{ id: number; label: string }>;
  semesters: Array<{ id: number; label: string }>;
  courses: Array<{ id: number; name: string; code: string; department_id: number | null }>;
  sections: Array<{ id: number; label: string; department_id: number | null }>;
  faculty: Array<{ id: number; name: string }>;
  surveyTypes: Array<{ value: string; label: string }>;
  responsePolicies: Array<{ value: string; label: string }>;
  identityModes: Array<{ value: string; label: string }>;
  timezone?: string;
};

const emptyForm = {
  title: '',
  description: '',
  surveyType: 'COURSE_END',
  academicYearId: '',
  semesterId: '',
  departmentId: '',
  courseId: '',
  subjectFacultyId: '',
  classSectionId: '',
  startAt: '',
  endAt: '',
  responsePolicy: 'ONE_PER_STUDENT',
  identityMode: 'IDENTIFIED',
};

export function CreateSurveyPage() {
  const navigate = useNavigate();
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Lookups>('/api/meta/lookups').then(setLookups).catch(console.error);
  }, []);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        surveyType: form.surveyType,
        academicYearId: form.academicYearId ? Number(form.academicYearId) : null,
        semesterId: form.semesterId ? Number(form.semesterId) : null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        courseId: form.courseId ? Number(form.courseId) : null,
        subjectFacultyId: form.subjectFacultyId ? Number(form.subjectFacultyId) : null,
        classSectionId: form.classSectionId ? Number(form.classSectionId) : null,
        startAt: form.startAt
          ? zonedLocalToUtcIso(form.startAt, lookups?.timezone || DEFAULT_TIMEZONE)
          : null,
        endAt: form.endAt
          ? zonedLocalToUtcIso(form.endAt, lookups?.timezone || DEFAULT_TIMEZONE)
          : null,
        responsePolicy: form.responsePolicy,
        identityMode: form.identityMode,
      };
      const res = await api<{ survey: { id: number } }>('/api/surveys', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      navigate(`/surveys/${res.survey.id}?tab=questions`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create survey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Create Survey"
        subtitle="Start with the details. You’ll add sections and questions next."
      />

      <form onSubmit={onSubmit}>
        <Surface className="max-w-3xl space-y-5">
          <div className="flex gap-2 text-[12px] font-medium text-ink-muted">
            <span className="rounded-full bg-ink px-2.5 py-1 text-white">1 · Details</span>
            <span className="rounded-full bg-surface-muted px-2.5 py-1">2 · Questions</span>
            <span className="rounded-full bg-surface-muted px-2.5 py-1">3 · Publish</span>
          </div>

          <Field label="Survey Title">
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </Field>
          <Field label="Description" optional>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Survey Type">
              <Select value={form.surveyType} onChange={(e) => set('surveyType', e.target.value)}>
                {(lookups?.surveyTypes ?? []).map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Academic Year">
              <Select value={form.academicYearId} onChange={(e) => set('academicYearId', e.target.value)}>
                <option value="">Select</option>
                {(lookups?.academicYears ?? []).map((y) => (
                  <option key={y.id} value={y.id}>
                    {y.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Semester">
              <Select value={form.semesterId} onChange={(e) => set('semesterId', e.target.value)}>
                <option value="">Select</option>
                {(lookups?.semesters ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Department">
              <Select value={form.departmentId} onChange={(e) => set('departmentId', e.target.value)}>
                <option value="">Select</option>
                {(lookups?.departments ?? []).map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.code} — {d.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Course">
              <Select value={form.courseId} onChange={(e) => set('courseId', e.target.value)}>
                <option value="">Select</option>
                {(lookups?.courses ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} — {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Faculty">
              <Select
                value={form.subjectFacultyId}
                onChange={(e) => set('subjectFacultyId', e.target.value)}
              >
                <option value="">Select</option>
                {(lookups?.faculty ?? []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Section">
              <Select value={form.classSectionId} onChange={(e) => set('classSectionId', e.target.value)}>
                <option value="">Select</option>
                {(lookups?.sections ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Response Policy">
              <Select
                value={form.responsePolicy}
                onChange={(e) => set('responsePolicy', e.target.value)}
              >
                {(lookups?.responsePolicies ?? []).map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Identity Mode">
              <Select value={form.identityMode} onChange={(e) => set('identityMode', e.target.value)}>
                {(lookups?.identityModes ?? []).map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Start Date"
              hint={`Institution timezone: ${lookups?.timezone || 'Asia/Kolkata'} (IST)`}
            >
              <Input
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => set('startAt', e.target.value)}
              />
            </Field>
            <Field label="End Date" hint="Stored in UTC; displayed in institution timezone.">
              <Input
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => set('endAt', e.target.value)}
              />
            </Field>
          </div>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="tertiary" onClick={() => navigate('/surveys')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating…' : 'Continue to Questions'}
            </Button>
          </div>
        </Surface>
      </form>
    </div>
  );
}
