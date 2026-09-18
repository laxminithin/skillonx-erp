import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../../lib/api';
import { useDocumentTitle } from '../../../lib/useDocumentTitle';
import { Button, Field, Input, Modal, PageHeader, Select, Surface, Tabs, Textarea, useToast } from '../../../components/ui';
import { BLOOMS, COURSE_TYPES, type CopoCatalog, type CourseOutcome, type CopoSubject, type ProgramSpecificOutcome, type SdgGoal } from '../../../types/copo';

type Framework = {
  id: number;
  schemeId: number;
  schemeName: string;
  versionNumber: number;
  outcomes: Array<{
    id: number;
    number: number;
    code: string;
    shortTitle?: string | null;
    officialStatement?: string | null;
    officialTextPending: boolean;
  }>;
};

export function AdminCopoMasterPage() {
  useDocumentTitle('Academic Master', 'CO–PO');
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') || 'schemes';
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [subjects, setSubjects] = useState<CopoSubject[]>([]);
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [psos, setPsos] = useState<ProgramSpecificOutcome[]>([]);
  const [sdgs, setSdgs] = useState<SdgGoal[]>([]);
  const [psoSchemeId, setPsoSchemeId] = useState('');
  const [psoProgramId, setPsoProgramId] = useState('');
  const [cos, setCos] = useState<CourseOutcome[]>([]);
  const [coCourseId, setCoCourseId] = useState('');
  const [modal, setModal] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [psoHistory, setPsoHistory] = useState<ProgramSpecificOutcome[] | null>(null);
  const [psoUsage, setPsoUsage] = useState<{
    pso: ProgramSpecificOutcome;
    referencedByApproved: boolean;
    usage: Array<{ subjectCode: string; subjectName: string; coCode: string; mappingStatus: string; strength: number | null }>;
  } | null>(null);

  const load = async () => {
    const [cat, sub, fw, pso, sdg] = await Promise.all([
      api<CopoCatalog>('/api/copo/catalog'),
      api<{ subjects: CopoSubject[] }>('/api/copo/subjects'),
      api<{ frameworks: Framework[] }>('/api/copo/program-outcomes'),
      api<{ outcomes: ProgramSpecificOutcome[] }>('/api/copo/program-specific-outcomes'),
      api<{ sdgs: SdgGoal[] }>('/api/copo/sdgs'),
    ]);
    setCatalog(cat);
    setSubjects(sub.subjects);
    setFrameworks(fw.frameworks);
    setPsos(pso.outcomes);
    setSdgs(sdg.sdgs);
  };

  useEffect(() => {
    load().catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!coCourseId) {
      setCos([]);
      return;
    }
    api<{ outcomes: CourseOutcome[] }>(`/api/copo/course-outcomes?courseId=${coCourseId}`)
      .then((r) => setCos(r.outcomes))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [coCourseId, toast]);

  const submit = async () => {
    setBusy(true);
    try {
      if (modal === 'scheme') {
        await api('/api/copo/schemes', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            university: form.university || 'Visvesvaraya Technological University',
            startYear: form.startYear ? Number(form.startYear) : null,
            endYear: form.endYear ? Number(form.endYear) : null,
            effectiveAcademicYear: form.effectiveAcademicYear || null,
            status: form.status || 'ACTIVE',
          }),
        });
      } else if (modal === 'program') {
        await api('/api/copo/programs', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            departmentId: form.departmentId ? Number(form.departmentId) : null,
            schemeId: form.schemeId ? Number(form.schemeId) : null,
            degree: form.degree || 'B.E.',
            durationYears: form.durationYears ? Number(form.durationYears) : 4,
          }),
        });
      } else if (modal === 'subject') {
        await api('/api/copo/subjects', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name,
            code: form.code,
            departmentId: form.departmentId ? Number(form.departmentId) : null,
            schemeId: form.schemeId ? Number(form.schemeId) : null,
            semesterId: form.semesterId ? Number(form.semesterId) : null,
            courseType: form.courseType || null,
            lectureHours: form.lectureHours ? Number(form.lectureHours) : null,
            tutorialHours: form.tutorialHours ? Number(form.tutorialHours) : null,
            practicalHours: form.practicalHours ? Number(form.practicalHours) : null,
            credits: form.credits ? Number(form.credits) : null,
            cieMarks: form.cieMarks ? Number(form.cieMarks) : null,
            seeMarks: form.seeMarks ? Number(form.seeMarks) : null,
            programIds: form.programId ? [Number(form.programId)] : [],
          }),
        });
      } else if (modal === 'co') {
        await api('/api/copo/course-outcomes', {
          method: 'POST',
          body: JSON.stringify({
            courseId: Number(form.courseId || coCourseId),
            number: Number(form.number),
            code: form.code || undefined,
            statement: form.statement,
            bloomsLevel: form.bloomsLevel || null,
            source: form.source || 'VTU Official Syllabus',
            sourcePage: form.sourcePage || null,
          }),
        });
      } else if (modal === 'po') {
        await api('/api/copo/program-outcomes', {
          method: 'POST',
          body: JSON.stringify({
            schemeId: Number(form.schemeId),
            number: Number(form.number),
            code: form.code || undefined,
            shortTitle: form.shortTitle || null,
            officialStatement: form.officialStatement || null,
            source: form.source || 'Official programme outcome framework',
          }),
        });
      } else if (modal === 'pso') {
        await api('/api/copo/program-specific-outcomes', {
          method: 'POST',
          body: JSON.stringify({
            schemeId: Number(form.schemeId),
            programId: Number(form.programId),
            number: form.number ? Number(form.number) : undefined,
            code: form.code || undefined,
            shortTitle: form.shortTitle || null,
            officialStatement: form.officialStatement || null,
            effectiveAcademicYear: form.effectiveAcademicYear || null,
            source: form.source || null,
            approvalReference: form.approvalReference || null,
          }),
        });
      } else if (modal === 'pso-edit' || modal === 'pso-version') {
        await api(`/api/copo/program-specific-outcomes/${form.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            shortTitle: form.shortTitle || null,
            officialStatement: form.officialStatement || null,
            effectiveAcademicYear: form.effectiveAcademicYear || null,
            source: form.source || null,
            approvalReference: form.approvalReference || null,
            mode: modal === 'pso-version' ? 'NEW_VERSION' : 'IN_PLACE',
          }),
        });
      }
      toast('Saved');
      setModal(null);
      setForm({});
      await load();
      if (coCourseId) {
        const r = await api<{ outcomes: CourseOutcome[] }>(`/api/copo/course-outcomes?courseId=${coCourseId}`);
        setCos(r.outcomes);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const currentFramework = useMemo(
    () => frameworks.find((f) => String(f.schemeId) === form.schemeId) || frameworks[0],
    [frameworks, form.schemeId],
  );

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Academic Master"
        subtitle="Administrator-controlled schemes, programs, subjects, official COs, and official POs. Faculty cannot edit these statements from the mapping workspace."
        actions={
          <Button
            onClick={() =>
              setModal(
                tab === 'pos'
                  ? 'po'
                  : tab === 'psos'
                    ? 'pso'
                    : tab === 'cos'
                      ? 'co'
                      : tab === 'subjects'
                        ? 'subject'
                        : tab === 'programs'
                          ? 'program'
                          : tab === 'sdgs'
                            ? null
                            : 'scheme',
              )
            }
            disabled={tab === 'sdgs'}
          >
            Add {tab === 'pos' ? 'PO' : tab === 'psos' ? 'PSO' : tab === 'cos' ? 'CO' : tab === 'sdgs' ? 'SDG' : tab.slice(0, -1)}
          </Button>
        }
      />
      <Tabs
        value={tab}
        onChange={(id) => setParams({ tab: id })}
        tabs={[
          { id: 'schemes', label: 'Schemes' },
          { id: 'programs', label: 'Programs' },
          { id: 'subjects', label: 'Subjects' },
          { id: 'cos', label: 'Course Outcomes' },
          { id: 'pos', label: 'Programme Outcomes' },
          { id: 'psos', label: 'Program Specific Outcomes' },
          { id: 'sdgs', label: 'SDGs' },
        ]}
      />

      <div className="mt-5">
        {tab === 'schemes' ? (
          <Surface className="!p-0 overflow-hidden">
            <ul className="divide-y divide-border">
              {(catalog?.schemes || []).map((s) => (
                <li key={s.id} className="flex justify-between px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-xs text-ink-muted">
                      {s.university || 'University pending'} · {s.startYear || '—'}
                      {s.endYear ? `–${s.endYear}` : ''}
                    </p>
                  </div>
                  <span className="text-ink-muted">{s.code}</span>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}

        {tab === 'programs' ? (
          <Surface className="!p-0 overflow-hidden">
            <ul className="divide-y divide-border">
              {(catalog?.programs || []).map((p) => (
                <li key={p.id} className="flex justify-between px-5 py-3.5 text-sm">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-ink-muted">
                      {p.schemeName || 'Scheme not linked'} · {p.degree || 'B.E.'}
                    </p>
                  </div>
                  <span className="text-ink-muted">{p.code}</span>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}

        {tab === 'subjects' ? (
          <Surface className="!p-0 overflow-hidden">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs uppercase text-ink-muted">
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Scheme</th>
                  <th className="px-4 py-3">Sem</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Credits</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((s) => (
                  <tr key={s.id} className="border-b border-border/70">
                    <td className="px-4 py-3">{s.code}</td>
                    <td className="px-4 py-3">{s.name}</td>
                    <td className="px-4 py-3">{s.schemeName || '—'}</td>
                    <td className="px-4 py-3">{s.semesterLabel || '—'}</td>
                    <td className="px-4 py-3">{s.courseType || '—'}</td>
                    <td className="px-4 py-3">{s.credits ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        ) : null}

        {tab === 'cos' ? (
          <div className="space-y-4">
            <Field label="Subject">
              <Select value={coCourseId} onChange={(e) => setCoCourseId(e.target.value)}>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} — {s.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Surface className="!p-0 overflow-hidden">
              <ul className="divide-y divide-border">
                {cos.map((co) => (
                  <li key={co.id} className="px-5 py-3.5 text-sm">
                    <p className="font-medium">
                      {co.code} {co.bloomsLabel ? `· ${co.bloomsLabel}` : ''}
                    </p>
                    <p className="mt-1 text-ink-secondary">{co.statement}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {co.source || 'Source pending'} {co.sourcePage ? `· p. ${co.sourcePage}` : ''} · v{co.versionNumber}
                    </p>
                  </li>
                ))}
              </ul>
              {coCourseId && cos.length === 0 ? (
                <p className="px-5 py-6 text-sm text-ink-muted">Official Data Pending — paste COs exactly from the syllabus. Do not paraphrase.</p>
              ) : null}
            </Surface>
          </div>
        ) : null}

        {tab === 'pos' ? (
          <div className="space-y-4">
            {(frameworks.length ? frameworks : [{ id: 0, schemeName: 'No framework yet', versionNumber: 0, schemeId: 0, outcomes: [] }]).map((fw) => (
              <Surface key={fw.id || 'empty'}>
                <h3 className="text-sm font-semibold">
                  {fw.schemeName} · Version {fw.versionNumber || '—'}
                </h3>
                <ul className="mt-3 divide-y divide-border">
                  {fw.outcomes.map((po) => (
                    <li key={po.id} className="py-3 text-sm">
                      <p className="font-medium">
                        {po.code} — {po.shortTitle || 'Short title pending'}
                      </p>
                      <p className="mt-1 text-ink-secondary">
                        {po.officialStatement || 'Official Data Pending'}
                      </p>
                    </li>
                  ))}
                </ul>
              </Surface>
            ))}
          </div>
        ) : null}

        {tab === 'psos' ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Scheme">
                <Select value={psoSchemeId} onChange={(e) => setPsoSchemeId(e.target.value)}>
                  <option value="">All</option>
                  {catalog?.schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Program">
                <Select value={psoProgramId} onChange={(e) => setPsoProgramId(e.target.value)}>
                  <option value="">All</option>
                  {catalog?.programs.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Surface className="!p-0 overflow-hidden">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase text-ink-muted">
                    <th className="px-4 py-3">PSO</th>
                    <th className="px-4 py-3">Short title</th>
                    <th className="px-4 py-3">Statement</th>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {psos
                    .filter((p) => !psoSchemeId || String(p.schemeId) === psoSchemeId)
                    .filter((p) => !psoProgramId || String(p.programId) === psoProgramId)
                    .map((pso) => (
                      <tr key={pso.id} className="border-b border-border/70 align-top">
                        <td className="px-4 py-3 font-medium">{pso.code}</td>
                        <td className="px-4 py-3">{pso.shortTitle || '—'}</td>
                        <td className="px-4 py-3 text-ink-secondary">{pso.displayStatement || 'Official / Approved PSO Data Pending'}</td>
                        <td className="px-4 py-3">{pso.versionNumber}</td>
                        <td className="px-4 py-3">{pso.status}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex flex-wrap justify-end gap-2 text-xs">
                            <button
                              className="text-accent"
                              onClick={() => {
                                setForm({
                                  id: String(pso.id),
                                  schemeId: String(pso.schemeId),
                                  programId: String(pso.programId),
                                  shortTitle: pso.shortTitle || '',
                                  officialStatement: pso.officialStatement || '',
                                  effectiveAcademicYear: pso.effectiveAcademicYear || '',
                                  source: pso.source || '',
                                  approvalReference: pso.approvalReference || '',
                                });
                                setModal('pso-edit');
                              }}
                            >
                              Edit
                            </button>
                            <button
                              className="text-accent"
                              onClick={() => {
                                setForm({
                                  id: String(pso.id),
                                  schemeId: String(pso.schemeId),
                                  programId: String(pso.programId),
                                  shortTitle: pso.shortTitle || '',
                                  officialStatement: pso.officialStatement || '',
                                  effectiveAcademicYear: pso.effectiveAcademicYear || '',
                                  source: pso.source || '',
                                  approvalReference: pso.approvalReference || '',
                                });
                                setModal('pso-version');
                              }}
                            >
                              New version
                            </button>
                            <button
                              className="text-accent"
                              onClick={async () => {
                                const r = await api<{ outcomes: ProgramSpecificOutcome[] }>(
                                  `/api/copo/program-specific-outcomes/${pso.id}/history`,
                                );
                                setPsoHistory(r.outcomes);
                              }}
                            >
                              History
                            </button>
                            <button
                              className="text-accent"
                              onClick={async () => {
                                const r = await api<NonNullable<typeof psoUsage>>(`/api/copo/program-specific-outcomes/${pso.id}/usage`);
                                setPsoUsage(r);
                              }}
                            >
                              Usage
                            </button>
                            {pso.status !== 'ARCHIVED' ? (
                              <button
                                className="text-ink-muted"
                                onClick={async () => {
                                  await api(`/api/copo/program-specific-outcomes/${pso.id}/archive`, { method: 'POST', body: '{}' });
                                  await load();
                                }}
                              >
                                Archive
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {psos.length === 0 ? (
                <p className="px-4 py-6 text-sm text-ink-muted">Official / Approved PSO Data Pending. Do not fabricate PSO statements.</p>
              ) : null}
            </Surface>
          </div>
        ) : null}

        {tab === 'sdgs' ? (
          <Surface>
            <p className="mb-3 text-sm text-ink-muted">United Nations Sustainable Development Goals — institution-wide master. Titles are not edited here.</p>
            <ul className="space-y-3">
              {sdgs.map((sdg) => (
                <li key={sdg.id} className="text-sm">
                  <p className="font-medium">
                    {sdg.code} — {sdg.officialTitle}
                  </p>
                  <p className="mt-1 text-ink-secondary">{sdg.officialDescription}</p>
                </li>
              ))}
            </ul>
          </Surface>
        ) : null}
      </div>

      <Modal
        open={Boolean(modal)}
        onClose={() => setModal(null)}
        title={
          modal === 'pso-version'
            ? 'Create new PSO version'
            : modal === 'pso-edit'
              ? 'Edit PSO'
              : `Add ${modal}`
        }
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModal(null)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {modal === 'scheme' || modal === 'program' || modal === 'subject' || modal === 'co' || modal === 'po' || modal === 'pso' || modal === 'pso-edit' || modal === 'pso-version' ? (
            <>
              {modal !== 'co' && modal !== 'po' && modal !== 'pso' && modal !== 'pso-edit' && modal !== 'pso-version' ? (
                <>
                  <Field label="Name">
                    <Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  </Field>
                  <Field label="Code">
                    <Input value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} />
                  </Field>
                </>
              ) : null}
              {modal === 'scheme' ? (
                <>
                  <Field label="University" optional>
                    <Input value={form.university || ''} onChange={(e) => setForm({ ...form, university: e.target.value })} />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Start year" optional>
                      <Input value={form.startYear || ''} onChange={(e) => setForm({ ...form, startYear: e.target.value })} />
                    </Field>
                    <Field label="End year" optional>
                      <Input value={form.endYear || ''} onChange={(e) => setForm({ ...form, endYear: e.target.value })} />
                    </Field>
                  </div>
                </>
              ) : null}
              {modal === 'program' || modal === 'subject' || modal === 'po' || modal === 'pso' ? (
                <Field label="Scheme">
                  <Select value={form.schemeId || ''} onChange={(e) => setForm({ ...form, schemeId: e.target.value })}>
                    <option value="">Select</option>
                    {catalog?.schemes.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
              {modal === 'subject' ? (
                <>
                  <Field label="Semester" optional>
                    <Select value={form.semesterId || ''} onChange={(e) => setForm({ ...form, semesterId: e.target.value })}>
                      <option value="">Unassigned</option>
                      {catalog?.semesters.map((s) => (
                        <option key={s.id} value={s.id}>
                          Semester {s.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Course type" optional>
                    <Select value={form.courseType || ''} onChange={(e) => setForm({ ...form, courseType: e.target.value })}>
                      <option value="">Select</option>
                      {COURSE_TYPES.map(([v, l]) => (
                        <option key={v} value={v}>
                          {v} — {l}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <div className="grid grid-cols-4 gap-2">
                    {['lectureHours', 'tutorialHours', 'practicalHours', 'credits'].map((k) => (
                      <Field key={k} label={k.replace('Hours', '')}>
                        <Input value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                      </Field>
                    ))}
                  </div>
                </>
              ) : null}
              {modal === 'co' ? (
                <>
                  <Field label="Subject">
                    <Select value={form.courseId || coCourseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
                      <option value="">Select</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.code} — {s.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="CO number">
                    <Input value={form.number || ''} onChange={(e) => setForm({ ...form, number: e.target.value })} />
                  </Field>
                  <Field label="Official CO statement">
                    <Textarea
                      value={form.statement || ''}
                      onChange={(e) => setForm({ ...form, statement: e.target.value })}
                      placeholder="Paste the official VTU statement exactly. Do not rewrite or shorten it."
                    />
                  </Field>
                  <Field label="Bloom’s level" optional>
                    <Select value={form.bloomsLevel || ''} onChange={(e) => setForm({ ...form, bloomsLevel: e.target.value })}>
                      <option value="">Not specified in syllabus</option>
                      {BLOOMS.map(([v, l]) => (
                        <option key={v} value={v}>
                          {v} — {l}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Source page" optional>
                    <Input value={form.sourcePage || ''} onChange={(e) => setForm({ ...form, sourcePage: e.target.value })} />
                  </Field>
                </>
              ) : null}
              {modal === 'po' ? (
                <>
                  <Field label="PO number">
                    <Input value={form.number || ''} onChange={(e) => setForm({ ...form, number: e.target.value })} />
                  </Field>
                  <Field label="Short title" optional>
                    <Input value={form.shortTitle || ''} onChange={(e) => setForm({ ...form, shortTitle: e.target.value })} />
                  </Field>
                  <Field label="Official PO statement">
                    <Textarea
                      value={form.officialStatement || ''}
                      onChange={(e) => setForm({ ...form, officialStatement: e.target.value })}
                      placeholder="Paste the official statement. Leave empty to mark Official Data Pending."
                    />
                  </Field>
                  <p className="text-xs text-ink-muted">
                    Current framework: {currentFramework?.schemeName || 'will be created with this PO'}
                  </p>
                </>
              ) : null}
              {modal === 'pso' || modal === 'pso-edit' || modal === 'pso-version' ? (
                <>
                  {modal === 'pso' ? (
                    <>
                  <Field label="Program">
                    <Select value={form.programId || ''} onChange={(e) => setForm({ ...form, programId: e.target.value })}>
                      <option value="">Select</option>
                      {catalog?.programs.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="PSO number" optional>
                    <Input value={form.number || ''} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="Leave blank to append the next PSO" />
                  </Field>
                  <Field label="Code" optional>
                    <Input value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="PSO1" />
                  </Field>
                    </>
                  ) : (
                    <p className="text-xs text-ink-muted">
                      {modal === 'pso-version'
                        ? 'Creates a new PSO version. Existing mappings continue to point at the previous version.'
                        : 'In-place edit for wording that has not yet been used in approved mappings. Prefer a new version after mappings exist.'}
                    </p>
                  )}
                  <Field label="Short title" optional>
                    <Input value={form.shortTitle || ''} onChange={(e) => setForm({ ...form, shortTitle: e.target.value })} />
                  </Field>
                  <Field label="Official PSO statement">
                    <Textarea
                      value={form.officialStatement || ''}
                      onChange={(e) => setForm({ ...form, officialStatement: e.target.value })}
                      placeholder="Paste the approved PSO statement. Leave empty to show Official / Approved PSO Data Pending."
                    />
                  </Field>
                  <Field label="Effective academic year" optional>
                    <Input value={form.effectiveAcademicYear || ''} onChange={(e) => setForm({ ...form, effectiveAcademicYear: e.target.value })} />
                  </Field>
                  <Field label="Source" optional>
                    <Input value={form.source || ''} onChange={(e) => setForm({ ...form, source: e.target.value })} />
                  </Field>
                  <Field label="Approval / source reference" optional>
                    <Input value={form.approvalReference || ''} onChange={(e) => setForm({ ...form, approvalReference: e.target.value })} />
                  </Field>
                </>
              ) : null}
            </>
          ) : null}
        </div>
      </Modal>
      <Modal open={Boolean(psoHistory)} onClose={() => setPsoHistory(null)} title="PSO version history">
        <ul className="space-y-3 text-sm">
          {(psoHistory || []).map((row) => (
            <li key={row.id} className="border-b border-border pb-3">
              <p className="font-medium">
                {row.code} · Version {row.versionNumber} · {row.status}
              </p>
              <p className="mt-1 text-ink-secondary">{row.displayStatement || row.officialStatement || 'Official / Approved PSO Data Pending'}</p>
              <p className="mt-1 text-xs text-ink-muted">
                {row.effectiveAcademicYear || 'Effective year pending'} {row.source ? `· ${row.source}` : ''}
              </p>
            </li>
          ))}
        </ul>
      </Modal>
      <Modal open={Boolean(psoUsage)} onClose={() => setPsoUsage(null)} title="PSO mapping usage">
        {psoUsage?.referencedByApproved ? (
          <p className="mb-3 text-sm text-warning">This PSO is referenced by approved mappings and cannot be deleted.</p>
        ) : null}
        {psoUsage?.usage.length ? (
          <ul className="space-y-2 text-sm">
            {psoUsage.usage.map((row, i) => (
              <li key={`${row.subjectCode}-${row.coCode}-${i}`}>
                {row.subjectCode} — {row.subjectName} · {row.coCode} · {row.mappingStatus} · {row.strength ?? '–'}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-muted">No mapping usage yet.</p>
        )}
      </Modal>
    </div>
  );
}
