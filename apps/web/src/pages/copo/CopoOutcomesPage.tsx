import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Field, PageHeader, Select, Surface, useToast } from '../../components/ui';
import type { CopoCatalog, CourseOutcome, CopoSubject } from '../../types/copo';

export function CopoOutcomesPage() {
  useDocumentTitle('Course Outcomes');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [courseId, setCourseId] = useState('');
  const [outcomes, setOutcomes] = useState<CourseOutcome[]>([]);
  const subjects: CopoSubject[] = catalog?.subjects ?? [];

  useEffect(() => {
    api<CopoCatalog>('/api/copo/catalog').then(setCatalog).catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [toast]);

  useEffect(() => {
    if (!courseId) return;
    api<{ outcomes: CourseOutcome[] }>(`/api/copo/course-outcomes?courseId=${courseId}`)
      .then((r) => setOutcomes(r.outcomes))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [courseId, toast]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Course Outcomes" subtitle="Official subject-wise CO master. Faculty cannot edit these statements here." />
      <Field label="Subject">
        <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.code} — {s.name}
            </option>
          ))}
        </Select>
      </Field>
      <Surface className="mt-4">
        {outcomes.length ? (
          <ul className="space-y-4">
            {outcomes.map((co) => (
              <li key={co.id}>
                <p className="font-medium">
                  {co.code} {co.bloomsLabel ? `· ${co.bloomsLabel}` : ''}
                </p>
                <p className="mt-1 text-sm text-ink-secondary">{co.statement}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {co.source || 'Official Data Pending'} {co.sourcePage ? `· p. ${co.sourcePage}` : ''}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">{courseId ? 'Official Data Pending' : 'Select a subject to view official COs.'}</p>
        )}
      </Surface>
    </div>
  );
}

export function CopoProgrammeOutcomesPage() {
  useDocumentTitle('Programme Outcomes');
  const { toast } = useToast();
  const [frameworks, setFrameworks] = useState<
    Array<{
      id: number;
      schemeName: string;
      versionNumber: number;
      outcomes: Array<{ id: number; code: string; shortTitle?: string | null; officialStatement?: string | null; officialTextPending: boolean }>;
    }>
  >([]);

  useEffect(() => {
    api<{ frameworks: typeof frameworks }>('/api/copo/program-outcomes')
      .then((r) => setFrameworks(r.frameworks))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [toast]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Programme Outcomes"
        subtitle="Official PO wording is stored centrally. Faculty use this master while mapping and cannot type PO definitions."
      />
      {frameworks.map((fw) => (
        <Surface key={fw.id} className="mb-4">
          <h2 className="text-sm font-semibold">
            {fw.schemeName} · Version {fw.versionNumber}
          </h2>
          <ul className="mt-3 space-y-3">
            {fw.outcomes.map((po) => (
              <li key={po.id} className="text-sm">
                <p className="font-medium">
                  {po.code} — {po.shortTitle || 'Short title pending'}
                </p>
                <p className="mt-1 text-ink-secondary">{po.officialStatement || 'Official Data Pending'}</p>
              </li>
            ))}
          </ul>
          {fw.outcomes.length === 0 ? <p className="mt-2 text-sm text-ink-muted">Official Data Pending</p> : null}
        </Surface>
      ))}
    </div>
  );
}

export function CopoProgramSpecificOutcomesPage() {
  useDocumentTitle('Program Specific Outcomes');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [schemeId, setSchemeId] = useState('');
  const [programId, setProgramId] = useState('');
  const [outcomes, setOutcomes] = useState<
    Array<{
      id: number;
      code: string;
      shortTitle?: string | null;
      displayStatement?: string;
      versionNumber: number;
      status: string;
      officialTextPending: boolean;
    }>
  >([]);

  useEffect(() => {
    api<CopoCatalog>('/api/copo/catalog').then(setCatalog).catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [toast]);

  useEffect(() => {
    const qs = new URLSearchParams();
    if (schemeId) qs.set('schemeId', schemeId);
    if (programId) qs.set('programId', programId);
    api<{ outcomes: typeof outcomes }>(`/api/copo/program-specific-outcomes?${qs}`)
      .then((r) => setOutcomes(r.outcomes))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [schemeId, programId, toast]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Program Specific Outcomes"
        subtitle="Approved PSO wording is stored by scheme and program. Faculty cannot edit official PSO statements."
      />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Field label="Scheme">
          <Select value={schemeId} onChange={(e) => setSchemeId(e.target.value)}>
            <option value="">All</option>
            {catalog?.schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Program">
          <Select value={programId} onChange={(e) => setProgramId(e.target.value)}>
            <option value="">All</option>
            {catalog?.programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Surface>
        {outcomes.length ? (
          <ul className="space-y-4">
            {outcomes.map((pso) => (
              <li key={pso.id}>
                <p className="font-medium">
                  {pso.code} — {pso.shortTitle || 'Short title pending'} · v{pso.versionNumber}
                </p>
                <p className="mt-1 text-sm text-ink-secondary">{pso.displayStatement || 'Official / Approved PSO Data Pending'}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">Official / Approved PSO Data Pending</p>
        )}
      </Surface>
    </div>
  );
}

export function CopoSdgPage() {
  useDocumentTitle('Sustainable Development Goals');
  const { toast } = useToast();
  const [sdgs, setSdgs] = useState<
    Array<{ id: number; code: string; officialTitle: string; officialDescription: string; source: string }>
  >([]);

  useEffect(() => {
    api<{ sdgs: typeof sdgs }>('/api/copo/sdgs')
      .then((r) => setSdgs(r.sdgs))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [toast]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Sustainable Development Goals"
        subtitle="United Nations SDG master. Faculty map course outcomes to these goals; the 17 titles cannot be edited."
      />
      <Surface>
        <ul className="space-y-4">
          {sdgs.map((sdg) => (
            <li key={sdg.id}>
              <p className="font-medium">
                {sdg.code} — {sdg.officialTitle}
              </p>
              <p className="mt-1 text-sm text-ink-secondary">{sdg.officialDescription}</p>
              <p className="mt-1 text-xs text-ink-muted">{sdg.source}</p>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}
