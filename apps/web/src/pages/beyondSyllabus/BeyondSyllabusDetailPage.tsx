import { FormEvent, ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, PageHeader, Select, StatusBadge, Surface, Textarea, Input, useToast } from '../../components/ui';

type Plan = {
  id: number;
  status: string;
  subjectName: string;
  courseCode: string;
  courseId: number;
  schemeLabel?: string | null;
  programName?: string | null;
  semesterLabel?: string | null;
  academicYearLabel?: string | null;
  preparedBy?: string | null;
  summary: {
    totalItems: number;
    planned: number;
    delivered: number;
    assessed: number;
    completed: number;
    plannedHours: number;
    actualHours: number;
    byOrigin: Record<string, number>;
  };
  items: Array<{
    id: number;
    cbsId: string;
    serialNo: number;
    title: string;
    originLabel: string;
    originType: string;
    relatedGapId?: string | null;
    moduleUnit?: string | null;
    primaryCo?: string | null;
    deliveryMethod?: string | null;
    plannedHours?: number | null;
    actualHours?: number | null;
    assessmentType?: string | null;
    assessmentRequired: boolean;
    status: string;
    rationale?: string | null;
    contentDescription?: string | null;
    actualOutcome?: string | null;
    outcomes: Array<{ outcomeType: string; outcomeCode: string; strength: number }>;
    assessments: Array<{ kind: string; quizId?: number | null; assignmentId?: number | null }>;
    evidence: Array<{ id: number; title: string; evidenceType: string }>;
  }>;
  availableRecommendations: Array<{
    cbsId: string;
    title: string;
    originLabel: string;
    moduleUnit?: string | null;
    suggestedCo?: string | null;
  }>;
};

const TABS = ['Overview', 'Plan', 'Assessments', 'Evidence', 'Report', 'Activity'] as const;

export function BeyondSyllabusDetailPage({ basePath = '/beyond-syllabus' }: { basePath?: string }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Plan');
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [deliverForm, setDeliverForm] = useState({ actualDate: '', actualHours: '', deliveryNotes: '', participants: '' });
  const [completeForm, setCompleteForm] = useState({ actualOutcome: '', assessmentResult: '', impactBenefit: '' });
  const [evidenceForm, setEvidenceForm] = useState({ evidenceType: 'TEACHING_MATERIAL', title: '', externalUrl: '' });
  const [customOpen, setCustomOpen] = useState(false);
  const [customForm, setCustomForm] = useState({
    title: '',
    originType: 'FACULTY_ENRICHMENT',
    primaryCo: 'CO1',
    deliveryMethod: 'ADDITIONAL_LECTURE',
    plannedHours: '2',
    assessmentType: 'NONE',
    rationale: '',
    contentDescription: '',
    moduleUnit: '',
  });
  const [cos, setCos] = useState<Array<{ coCode: string }>>([]);
  const [audit, setAudit] = useState<Array<{ id: number; action: string; actorName?: string; createdAt: string }>>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await api<{ plan: Plan }>(`/api/beyond-syllabus/${id}`);
    setPlan(res.plan);
    if (!selectedItemId && res.plan.items[0]) setSelectedItemId(res.plan.items[0].id);
  };

  useEffect(() => {
    if (!id) return;
    load().catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));
    api<{ audit: typeof audit }>(`/api/beyond-syllabus/${id}/audit`)
      .then((r) => setAudit(r.audit || []))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!plan) return;
    api<{ subjects: Array<{ id: number; outcomes?: Array<{ coCode: string }> }> }>('/api/beyond-syllabus/catalog')
      .then((c) => {
        const subject = (c as { subjects?: Array<{ id: number; cos?: Array<{ coCode: string; code?: string }> }> }).subjects?.find(
          (s) => s.id === plan.courseId,
        );
        const list =
          subject?.cos?.map((co) => ({ coCode: co.coCode || co.code || '' })).filter((c) => c.coCode) ||
          plan.items.map((i) => ({ coCode: i.primaryCo || 'CO1' }));
        setCos(Array.from(new Map(list.map((c) => [c.coCode, c])).values()));
      })
      .catch(() => setCos([{ coCode: 'CO1' }, { coCode: 'CO2' }, { coCode: 'CO3' }, { coCode: 'CO4' }]));
  }, [plan]);

  useDocumentTitle(plan ? `${plan.subjectName} · Beyond Syllabus` : 'Beyond Syllabus');

  const selected = useMemo(() => plan?.items.find((i) => i.id === selectedItemId) || null, [plan, selectedItemId]);

  const refresh = async () => {
    await load();
    const r = await api<{ audit: typeof audit }>(`/api/beyond-syllabus/${id}/audit`);
    setAudit(r.audit || []);
  };

  const addRecommended = async (cbsIds: string[]) => {
    setBusy(true);
    try {
      await api(`/api/beyond-syllabus/${id}/items`, { method: 'POST', body: JSON.stringify({ cbsIds }) });
      toast('Recommended content added');
      await refresh();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const addCustom = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/api/beyond-syllabus/${id}/items`, {
        method: 'POST',
        body: JSON.stringify({
          title: customForm.title,
          contentDescription: customForm.contentDescription,
          originType: customForm.originType,
          moduleUnit: customForm.moduleUnit || null,
          primaryCo: customForm.primaryCo,
          deliveryMethod: customForm.deliveryMethod,
          plannedHours: Number(customForm.plannedHours) || null,
          assessmentRequired: customForm.assessmentType !== 'NONE',
          assessmentType: customForm.assessmentType,
          rationale: customForm.rationale,
        }),
      });
      toast('Custom content added');
      setCustomOpen(false);
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const markDelivered = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/api/beyond-syllabus/${id}/items/${selected.id}/deliver`, {
        method: 'POST',
        body: JSON.stringify({
          actualDate: deliverForm.actualDate,
          actualHours: Number(deliverForm.actualHours),
          deliveryNotes: deliverForm.deliveryNotes || null,
          participants: deliverForm.participants ? Number(deliverForm.participants) : null,
        }),
      });
      toast('Marked delivered');
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const completeItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/api/beyond-syllabus/${id}/items/${selected.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          actualOutcome: completeForm.actualOutcome,
          assessmentResult: completeForm.assessmentResult || null,
          impactBenefit: completeForm.impactBenefit || null,
        }),
      });
      toast('Item completed');
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const addEvidence = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/api/beyond-syllabus/${id}/items/${selected.id}/evidence`, {
        method: 'POST',
        body: JSON.stringify({
          evidenceType: evidenceForm.evidenceType,
          title: evidenceForm.title,
          externalUrl: evidenceForm.externalUrl || null,
        }),
      });
      toast('Evidence attached');
      setEvidenceForm({ evidenceType: 'TEACHING_MATERIAL', title: '', externalUrl: '' });
      await refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!plan) return <p className="p-6 text-ink-muted">Loading…</p>;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={plan.subjectName}
        subtitle={`Content Beyond Syllabus · ${plan.courseCode}${plan.schemeLabel ? ` · ${plan.schemeLabel}` : ''}${
          plan.programName ? ` · ${plan.programName}` : ''
        }${plan.semesterLabel ? ` · ${plan.semesterLabel}` : ''}${plan.academicYearLabel ? ` · ${plan.academicYearLabel}` : ''}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={plan.status} />
            <Button variant="secondary" onClick={() => navigate(`${basePath}/${id}/print`)}>
              Print
            </Button>
            <Button
              variant="ghost"
              onClick={() =>
                downloadCopoExport(`/api/beyond-syllabus/${id}/export`, 'beyond-syllabus.xlsx').catch((e) =>
                  toast(e instanceof Error ? e.message : 'Export failed', 'error'),
                )
              }
            >
              Export
            </Button>
          </div>
        }
      />

      <p className="mb-4 text-sm text-ink-secondary">Prepared By: {plan.preparedBy || '—'}</p>

      <Surface className="mb-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          <Metric label="Total Items" value={plan.summary.totalItems} />
          <Metric label="Planned" value={plan.summary.planned} />
          <Metric label="Delivered" value={plan.summary.delivered} />
          <Metric label="Assessed" value={plan.summary.assessed} />
          <Metric label="Completed" value={plan.summary.completed} />
          <Metric label="Planned Hours" value={plan.summary.plannedHours} />
          <Metric label="Actual Hours" value={plan.summary.actualHours} />
        </div>
      </Surface>

      <div className="mb-4 flex flex-wrap gap-2 border-b border-line pb-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm ${tab === t ? 'bg-ink text-white' : 'text-ink-secondary hover:bg-surface-muted'}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Overview' ? (
        <Surface>
          <h3 className="text-sm font-semibold text-ink">Origin breakdown</h3>
          <div className="mt-3 space-y-1 text-sm text-ink-secondary">
            {Object.entries(plan.summary.byOrigin).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span>{k.replace(/_/g, ' ')}</span>
                <span className="font-medium text-ink">{v}</span>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      {tab === 'Plan' ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                disabled={!plan.availableRecommendations.length || busy}
                onClick={() => addRecommended(plan.availableRecommendations.map((r) => r.cbsId))}
              >
                Add Recommended Content
              </Button>
              <Button variant="ghost" onClick={() => setCustomOpen((v) => !v)}>
                Add Custom Content
              </Button>
            </div>

            {customOpen ? (
              <Surface>
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={addCustom}>
                  <Field label="Title">
                    <Input required value={customForm.title} onChange={(e) => setCustomForm((f) => ({ ...f, title: e.target.value }))} />
                  </Field>
                  <Field label="Origin">
                    <Select value={customForm.originType} onChange={(e) => setCustomForm((f) => ({ ...f, originType: e.target.value }))}>
                      <option value="FACULTY_ENRICHMENT">Faculty Enrichment</option>
                      <option value="INDUSTRY_REQUIREMENT">Industry Requirement</option>
                      <option value="EMERGING_TECHNOLOGY">Emerging Technology</option>
                      <option value="ADVANCED_LEARNING">Advanced Learning</option>
                      <option value="PRACTICAL_EXPOSURE">Practical Exposure</option>
                      <option value="INTERDISCIPLINARY_ENRICHMENT">Interdisciplinary Enrichment</option>
                      <option value="GAP_ANALYSIS">Gap Analysis</option>
                    </Select>
                  </Field>
                  <Field label="Primary CO">
                    <Select value={customForm.primaryCo} onChange={(e) => setCustomForm((f) => ({ ...f, primaryCo: e.target.value }))}>
                      {(cos.length ? cos : [{ coCode: 'CO1' }]).map((c) => (
                        <option key={c.coCode} value={c.coCode}>
                          {c.coCode}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Delivery Method">
                    <Select
                      value={customForm.deliveryMethod}
                      onChange={(e) => setCustomForm((f) => ({ ...f, deliveryMethod: e.target.value }))}
                    >
                      <option value="ADDITIONAL_LECTURE">Additional Lecture</option>
                      <option value="DEMONSTRATION">Demonstration</option>
                      <option value="HANDS_ON_SESSION">Hands-on Session</option>
                      <option value="CASE_STUDY">Case Study</option>
                      <option value="SEMINAR">Seminar</option>
                      <option value="WORKSHOP">Workshop</option>
                      <option value="OTHER">Other</option>
                    </Select>
                  </Field>
                  <Field label="Module">
                    <Input value={customForm.moduleUnit} onChange={(e) => setCustomForm((f) => ({ ...f, moduleUnit: e.target.value }))} />
                  </Field>
                  <Field label="Planned Hours">
                    <Input
                      value={customForm.plannedHours}
                      onChange={(e) => setCustomForm((f) => ({ ...f, plannedHours: e.target.value }))}
                    />
                  </Field>
                  <Field label="Assessment">
                    <Select
                      value={customForm.assessmentType}
                      onChange={(e) => setCustomForm((f) => ({ ...f, assessmentType: e.target.value }))}
                    >
                      <option value="NONE">None</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="ASSIGNMENT">Assignment</option>
                      <option value="ACTIVITY">Activity</option>
                    </Select>
                  </Field>
                  <div className="sm:col-span-2">
                    <Field label="Rationale">
                      <Textarea
                        required
                        rows={3}
                        value={customForm.rationale}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          setCustomForm((f) => ({ ...f, rationale: e.target.value }))
                        }
                      />
                    </Field>
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="submit" disabled={busy}>
                      Save Custom Content
                    </Button>
                  </div>
                </form>
              </Surface>
            ) : null}

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase text-ink-muted">
                  <tr>
                    <th className="py-2 pr-3">No.</th>
                    <th className="py-2 pr-3">Beyond-Syllabus Content</th>
                    <th className="py-2 pr-3">Origin</th>
                    <th className="py-2 pr-3">Module</th>
                    <th className="py-2 pr-3">CO</th>
                    <th className="py-2 pr-3">Method</th>
                    <th className="py-2 pr-3">Hours</th>
                    <th className="py-2 pr-3">Assessment</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.items.map((item) => (
                    <tr
                      key={item.id}
                      className={`cursor-pointer border-t border-line ${selectedItemId === item.id ? 'bg-surface-muted' : ''}`}
                      onClick={() => setSelectedItemId(item.id)}
                    >
                      <td className="py-2 pr-3">{item.serialNo}</td>
                      <td className="py-2 pr-3 font-medium text-ink">{item.title}</td>
                      <td className="py-2 pr-3">{item.originLabel}</td>
                      <td className="py-2 pr-3">{item.moduleUnit || '—'}</td>
                      <td className="py-2 pr-3">{item.primaryCo || '—'}</td>
                      <td className="py-2 pr-3">{(item.deliveryMethod || '—').replace(/_/g, ' ')}</td>
                      <td className="py-2 pr-3">{item.plannedHours ?? '—'}</td>
                      <td className="py-2 pr-3">{item.assessmentType || '—'}</td>
                      <td className="py-2">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 md:hidden">
              {plan.items.map((item) => (
                <div
                  key={item.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedItemId(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') setSelectedItemId(item.id);
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <Surface>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-ink-muted">{item.cbsId}</p>
                      <h3 className="font-medium text-ink">{item.title}</h3>
                      <p className="mt-1 text-sm text-ink-secondary">
                        {item.originLabel} · {item.moduleUnit || '—'} · {item.primaryCo || '—'}
                      </p>
                      <p className="mt-1 text-sm text-ink-secondary">
                        {item.plannedHours ?? '—'} Hours · {(item.deliveryMethod || '—').replace(/_/g, ' ')} ·{' '}
                        {item.assessmentType || '—'}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                </Surface>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {selected ? (
              <Surface>
                <p className="text-xs uppercase tracking-wide text-ink-muted">{selected.cbsId}</p>
                <h3 className="mt-1 text-lg font-semibold text-ink">{selected.title}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{selected.contentDescription}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="text-ink-muted">Origin</dt>
                    <dd>{selected.originLabel}</dd>
                  </div>
                  {selected.relatedGapId ? (
                    <div>
                      <dt className="text-ink-muted">Related Gap</dt>
                      <dd>
                        <Link className="text-accent underline" to={`/gap-analysis`}>
                          {selected.relatedGapId}
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                  <div>
                    <dt className="text-ink-muted">Rationale</dt>
                    <dd>{selected.rationale || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-ink-muted">Traceability</dt>
                    <dd>
                      {selected.primaryCo || '—'}
                      {selected.outcomes.length
                        ? ` → ${selected.outcomes.map((o) => `${o.outcomeCode} (${o.strength})`).join(', ')}`
                        : ''}
                    </dd>
                  </div>
                </dl>

                {selected.status === 'PLANNED' ? (
                  <form className="mt-4 space-y-3 border-t border-line pt-4" onSubmit={markDelivered}>
                    <h4 className="text-sm font-semibold">Mark Delivered</h4>
                    <Field label="Actual Date">
                      <Input
                        type="date"
                        required
                        value={deliverForm.actualDate}
                        onChange={(e) => setDeliverForm((f) => ({ ...f, actualDate: e.target.value }))}
                      />
                    </Field>
                    <Field label="Actual Hours">
                      <Input
                        required
                        value={deliverForm.actualHours}
                        onChange={(e) => setDeliverForm((f) => ({ ...f, actualHours: e.target.value }))}
                      />
                    </Field>
                    <Field label="Delivery Notes">
                      <Textarea
                        rows={2}
                        value={deliverForm.deliveryNotes}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          setDeliverForm((f) => ({ ...f, deliveryNotes: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Students Participated">
                      <Input
                        value={deliverForm.participants}
                        onChange={(e) => setDeliverForm((f) => ({ ...f, participants: e.target.value }))}
                      />
                    </Field>
                    <Button type="submit" disabled={busy}>
                      Mark Delivered
                    </Button>
                  </form>
                ) : null}

                {['DELIVERED', 'ASSESSED'].includes(selected.status) ? (
                  <form className="mt-4 space-y-3 border-t border-line pt-4" onSubmit={completeItem}>
                    <h4 className="text-sm font-semibold">Complete with Outcome</h4>
                    <Field label="Actual Outcome">
                      <Textarea
                        required
                        rows={3}
                        value={completeForm.actualOutcome}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          setCompleteForm((f) => ({ ...f, actualOutcome: e.target.value }))
                        }
                      />
                    </Field>
                    <Field label="Assessment Result">
                      <Input
                        value={completeForm.assessmentResult}
                        onChange={(e) => setCompleteForm((f) => ({ ...f, assessmentResult: e.target.value }))}
                      />
                    </Field>
                    <Field label="Impact / Benefit">
                      <Textarea
                        rows={2}
                        value={completeForm.impactBenefit}
                        onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                          setCompleteForm((f) => ({ ...f, impactBenefit: e.target.value }))
                        }
                      />
                    </Field>
                    <Button type="submit" disabled={busy}>
                      Mark Completed
                    </Button>
                  </form>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
                  <Link
                    to={`/quizzes/create?courseId=${plan.courseId}&cbsPlanId=${plan.id}&cbsItemId=${selected.id}&co=${selected.primaryCo || ''}&module=${encodeURIComponent(selected.moduleUnit || '')}&cbsRef=${selected.cbsId}`}
                  >
                    <Button variant="secondary">Create Quiz</Button>
                  </Link>
                  <Link
                    to={`/assignments/create?courseId=${plan.courseId}&cbsPlanId=${plan.id}&cbsItemId=${selected.id}&co=${selected.primaryCo || ''}&cbsRef=${selected.cbsId}`}
                  >
                    <Button variant="secondary">Create Assignment</Button>
                  </Link>
                </div>
              </Surface>
            ) : (
              <Surface>
                <p className="text-sm text-ink-muted">Select an item to manage delivery and outcomes.</p>
              </Surface>
            )}
          </div>
        </div>
      ) : null}

      {tab === 'Assessments' ? (
        <Surface>
          <div className="space-y-3">
            {plan.items.map((item) => (
              <div key={item.id} className="border-b border-line pb-3 last:border-0">
                <div className="font-medium text-ink">{item.title}</div>
                <p className="text-sm text-ink-secondary">
                  Required: {item.assessmentRequired ? 'Yes' : 'No'} · Type: {item.assessmentType || 'NONE'}
                </p>
                {item.assessments.length ? (
                  <ul className="mt-1 text-sm text-ink-secondary">
                    {item.assessments.map((a, i) => (
                      <li key={i}>
                        {a.kind}
                        {a.quizId ? ` #${a.quizId}` : ''}
                        {a.assignmentId ? ` #${a.assignmentId}` : ''}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-sm text-ink-muted">No linked assessments yet.</p>
                )}
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      {tab === 'Evidence' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface>
            <h3 className="mb-3 text-sm font-semibold">Evidence index</h3>
            {plan.items.flatMap((i) => i.evidence.map((e) => ({ ...e, cbsId: i.cbsId }))).length ? (
              <ul className="space-y-2 text-sm">
                {plan.items.flatMap((i) =>
                  i.evidence.map((e) => (
                    <li key={e.id}>
                      <span className="text-ink-muted">{i.cbsId}</span> · {e.evidenceType} · {e.title}
                    </li>
                  )),
                )}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No evidence uploaded yet.</p>
            )}
          </Surface>
          {selected ? (
            <Surface>
              <h3 className="mb-3 text-sm font-semibold">Attach evidence · {selected.cbsId}</h3>
              <form className="space-y-3" onSubmit={addEvidence}>
                <Field label="Type">
                  <Select
                    value={evidenceForm.evidenceType}
                    onChange={(e) => setEvidenceForm((f) => ({ ...f, evidenceType: e.target.value }))}
                  >
                    <option value="TEACHING_MATERIAL">Teaching Material</option>
                    <option value="ATTENDANCE">Attendance</option>
                    <option value="PPT">PPT</option>
                    <option value="PHOTOS">Photos</option>
                    <option value="QUIZ_RESULT">Quiz Result</option>
                    <option value="ASSIGNMENT_RESULT">Assignment Result</option>
                    <option value="URL">URL</option>
                    <option value="OTHER">Other</option>
                  </Select>
                </Field>
                <Field label="Title">
                  <Input required value={evidenceForm.title} onChange={(e) => setEvidenceForm((f) => ({ ...f, title: e.target.value }))} />
                </Field>
                <Field label="URL (optional)">
                  <Input
                    value={evidenceForm.externalUrl}
                    onChange={(e) => setEvidenceForm((f) => ({ ...f, externalUrl: e.target.value }))}
                  />
                </Field>
                <Button type="submit" disabled={busy}>
                  Upload Evidence
                </Button>
              </form>
            </Surface>
          ) : null}
        </div>
      ) : null}

      {tab === 'Report' ? (
        <Surface>
          <p className="text-sm text-ink-secondary">
            Use Print for the academic title page + detail report, or Export for Excel workbooks used in Course Delivery Plan
            documentation.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={() => navigate(`${basePath}/${id}/print`)}>Open Print Report</Button>
          </div>
        </Surface>
      ) : null}

      {tab === 'Activity' ? (
        <Surface>
          <ul className="space-y-2 text-sm">
            {audit.map((a) => (
              <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b border-line py-2 last:border-0">
                <span>
                  <span className="font-medium text-ink">{a.action}</span>
                  {a.actorName ? ` · ${a.actorName}` : ''}
                </span>
                <span className="text-ink-muted">{new Date(a.createdAt).toLocaleString()}</span>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{value ?? '—'}</div>
    </div>
  );
}
