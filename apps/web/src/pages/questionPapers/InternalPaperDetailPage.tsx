import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, Input, PageHeader, StatusBadge, Surface, Textarea, useToast } from '../../components/ui';

type Detail = {
  paper: {
    id: number;
    title: string;
    subjectName: string;
    courseCode: string;
    examType: string;
    status: string;
    maxMarks: number;
    durationMinutes?: number | null;
    modifiedFromCoEval?: boolean;
  };
  items: Array<{
    id: number;
    questionNumber: number;
    questionText: string;
    maxMarks: number;
    moduleOrUnit?: string | null;
    primaryCo?: string | null;
    sourceKind: string;
    fingerprint?: string | null;
    scheme?: Array<{ code?: string; label: string; maxMarks: number }>;
    modelAnswer?: string | null;
    expectedKeyPoints?: string | null;
    textbookCitation?: string | null;
    provenance?: { questionSource?: string; marksSource?: string; solutionSource?: string; sourceBadge?: string | null } | null;
  }>;
  academicProvenance?: Array<{
    questionLabel: string;
    questionSource: string;
    marksSource: string;
    co: string | null;
    poPso: string | null;
    solutionSource: string | null;
    schemeSource: string | null;
  }>;
  validation: { ok: boolean; errors: string[] };
  quality?: {
    okToPublish: boolean;
    score: number;
    version: string;
    checks: Array<{ code: string; label: string; severity: string; passed: boolean; detail: string }>;
    criticalFailures: Array<{ code: string; label: string; detail: string }>;
  };
  coverage: { totalMarks: number; byCo: Array<{ coCode: string; marks: number }>; bySource: Array<{ source: string; count: number }> };
  sourceSummary?: {
    total: number;
    vtuSeePyq: number;
    moduleQuestionBank: number;
    seeComponents?: number;
    moduleBankComponents?: number;
    label: string;
    fallbackReasons: string[];
  };
};

function sourceBadgeLabel(sourceKind: string | null | undefined, provenanceBadge?: string | null) {
  if (provenanceBadge) return provenanceBadge;
  const s = String(sourceKind || '').toUpperCase();
  if (s === 'MODULE_QUESTION_BANK') return 'Module Question Bank';
  if (s === 'VTU_SEE_PYQ') return 'VTU SEE PYQ';
  return sourceKind || '—';
}

export function InternalPaperDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<Detail | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    api<Detail>(`/api/question-papers/internal/${id}`)
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load', 'error'));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useDocumentTitle(data?.paper.title || 'Internal Question Paper');

  const act = async (path: string, method = 'POST', body?: unknown) => {
    setBusy(true);
    try {
      await api(path, { method, body: body ? JSON.stringify(body) : undefined });
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Action failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <p className="text-ink-muted">Loading…</p>;
  const draft = data.paper.status === 'DRAFT';

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/internal-question-papers" className="hover:text-accent">
            Internal Question Papers
          </Link>
        }
        title={data.paper.title}
        subtitle={`${data.paper.subjectName} · ${data.paper.courseCode} · ${data.paper.examType} · ${data.paper.maxMarks} Marks`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/internal-question-papers/${id}/print?variant=PAPER`}>
              <Button variant="secondary">Print paper</Button>
            </Link>
            <Link to={`/internal-question-papers/${id}/print?variant=SCHEME`}>
              <Button variant="secondary">Print scheme</Button>
            </Link>
            <Link to={`/internal-question-papers/${id}/print?variant=SOLUTION`}>
              <Button variant="secondary">Print solution</Button>
            </Link>
            <Link to={`/internal-question-papers/${id}/print?variant=MAPPING`}>
              <Button variant="secondary">Print CO mapping</Button>
            </Link>
            <Link to={`/internal-question-papers/${id}/print?variant=PROVENANCE`}>
              <Button variant="secondary">Academic provenance</Button>
            </Link>
            <Button variant="secondary" onClick={() => downloadCopoExport(`/api/question-papers/internal/${id}/export`, 'question-paper.xlsx')}>
              Export
            </Button>
            {draft ? (
              <Link to={`/internal-question-papers/${id}/edit`}>
                <Button variant="secondary">Continue preparation</Button>
              </Link>
            ) : null}
            {draft ? (
              <Button disabled={busy} onClick={() => act(`/api/question-papers/internal/${id}/finalize`)}>
                Finalize
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3 text-sm">
        <StatusBadge status={data.paper.status} />
        <span>
          Total {data.coverage.totalMarks} / {data.paper.maxMarks} {data.validation.ok ? '✓' : ''}
        </span>
        {data.coverage.byCo.map((c) => (
          <span key={c.coCode}>
            {c.coCode} {c.marks}
          </span>
        ))}
        {data.coverage.bySource.map((s) => (
          <span key={s.source} className="text-ink-muted">
            {s.source} {s.count}
          </span>
        ))}
        {data.paper.modifiedFromCoEval ? <span>Modified from CO Evaluation Plan</span> : null}
      </div>
      {data.sourceSummary ? (
        <Surface className="mb-4">
          <div className="text-sm font-semibold">Question Selection Summary</div>
          <div className="mt-1 text-sm">
            VTU SEE: {data.sourceSummary.seeComponents ?? data.sourceSummary.vtuSeePyq} components · Module Question Bank:{' '}
            {data.sourceSummary.moduleBankComponents ?? data.sourceSummary.moduleQuestionBank} components
          </div>
          {data.sourceSummary.fallbackReasons.length ? (
            <ul className="mt-2 list-disc pl-5 text-xs text-ink-muted">
              {data.sourceSummary.fallbackReasons.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : null}
        </Surface>
      ) : null}
      {!data.validation.ok ? (
        <Surface className="mb-4 border-danger/40">
          <ul className="list-disc pl-5 text-sm text-danger">
            {data.validation.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </Surface>
      ) : null}

      {data.quality ? (
        <Surface className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">Academic quality / validation</h2>
            <span className="text-xs text-ink-muted">
              Score {data.quality.score} · {data.quality.version}
            </span>
          </div>
          <p className="mt-1 text-sm">
            {data.quality.okToPublish ? 'Ready to finalize' : 'Critical checks must pass before publishing'}
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {data.quality.checks.map((c) => (
              <li key={c.code} className={c.passed ? 'text-ink-muted' : c.severity === 'CRITICAL' ? 'text-danger' : 'text-warning'}>
                {c.passed ? '✓' : '•'} {c.label}: {c.detail}
              </li>
            ))}
          </ul>
          {!draft ? (
            <Button
              className="mt-3"
              size="sm"
              variant="secondary"
              onClick={() => act(`/api/attainment/sheets/from-paper/${id}`)}
            >
              Open question-wise marks
            </Button>
          ) : null}
        </Surface>
      ) : null}

      {data.academicProvenance?.length ? (
        <Surface className="mb-4">
          <h2 className="text-sm font-semibold">Academic Provenance</h2>
          <ul className="mt-2 space-y-2 text-xs">
            {data.academicProvenance.map((p) => (
              <li key={p.questionLabel}>
                <span className="font-semibold">{p.questionLabel}</span> · Question: {p.questionSource} · Marks: {p.marksSource} · CO: {p.co || '—'} · PO/PSO: {p.poPso} · Solution: {p.solutionSource || 'Textbook source required'} · Scheme: {p.schemeSource}
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      {draft ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button disabled={busy} variant="secondary" onClick={() => act(`/api/question-papers/internal/${id}/generate`)}>
            Build remaining from PYQ Bank
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        {data.items.map((item) => (
          <Surface key={item.id} className="flex flex-col gap-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
              <div>
                <p className="text-xs text-ink-muted">
                  Q{item.questionNumber} · {item.maxMarks} Marks · {item.moduleOrUnit || 'Module n/a'} · {item.primaryCo || 'CO n/a'} ·{' '}
                  {sourceBadgeLabel(item.sourceKind, item.provenance?.sourceBadge)}
                </p>
                <p className="mt-1 text-sm">{item.questionText}</p>
              </div>
              {draft ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => act(`/api/question-papers/internal/${id}/items/${item.id}/replace`)}>
                    Replace
                  </Button>
                  <Button size="sm" variant="danger-soft" disabled={busy} onClick={() => act(`/api/question-papers/internal/${id}/items/${item.id}`, 'DELETE')}>
                    Remove
                  </Button>
                </div>
              ) : null}
            </div>
            {item.scheme?.length ? (
              <ul className="text-xs text-ink-muted">
                {item.scheme.map((s, i) => (
                  <li key={i}>
                    {s.label} — {s.maxMarks}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-warning">Marking scheme missing</p>
            )}
            {item.modelAnswer ? <p className="text-xs text-ink-muted">Solution: {item.modelAnswer.slice(0, 160)}</p> : <p className="text-xs text-warning">Prescribed textbook source is required to generate the model solution.</p>}
            {item.textbookCitation ? <p className="text-xs text-ink-muted">Reference: {item.textbookCitation}</p> : null}
            {draft ? (
              <ItemSchemeEditor
                key={`${item.id}-${item.scheme?.length || 0}-${item.modelAnswer || ''}`}
                paperId={String(id)}
                item={item}
                busy={busy}
                onSave={act}
              />
            ) : null}
          </Surface>
        ))}
      </div>

      {draft ? (
        <Surface className="mt-6 space-y-2">
          <h2 className="font-semibold">PYQ source policy</h2>
          <p className="text-sm text-ink-muted">
            Internal papers are built only from READY previous-year questions. New AI or lecturer-authored questions are not allowed.
            Browse the <Link to="/previous-year-papers/questions" className="text-accent">PYQ Master Question Bank</Link> to add an eligible alternative.
          </p>
        </Surface>
      ) : null}
    </div>
  );
}

function ItemSchemeEditor({
  paperId,
  item,
  busy,
  onSave,
}: {
  paperId: string;
  item: Detail['items'][number];
  busy: boolean;
  onSave: (path: string, method?: string, body?: unknown) => Promise<void>;
}) {
  const [modelAnswer, setModelAnswer] = useState(item.modelAnswer || '');
  const [expectedKeyPoints, setExpectedKeyPoints] = useState(item.expectedKeyPoints || '');
  const [rows, setRows] = useState(
    item.scheme?.length
      ? item.scheme.map((s, i) => ({ code: s.code || `c${i + 1}`, label: s.label, maxMarks: String(s.maxMarks) }))
      : [{ code: 'full', label: 'Complete answer', maxMarks: String(item.maxMarks) }],
  );
  const total = rows.reduce((s, r) => s + Number(r.maxMarks || 0), 0);
  return (
    <div className="space-y-2 rounded-md border border-border p-3">
      <p className="text-xs font-semibold">Scheme and model solution</p>
      {rows.map((row, i) => (
        <div key={i} className="grid gap-2 sm:grid-cols-3">
          <Input
            value={row.label}
            onChange={(e) => setRows((prev) => prev.map((p, j) => (j === i ? { ...p, label: e.target.value } : p)))}
            placeholder="Component"
          />
          <Input
            value={row.maxMarks}
            onChange={(e) => setRows((prev) => prev.map((p, j) => (j === i ? { ...p, maxMarks: e.target.value } : p)))}
            placeholder="Marks"
          />
          <Button
            size="sm"
            variant="tertiary"
            type="button"
            onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
            disabled={rows.length === 1}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        size="sm"
        variant="secondary"
        type="button"
        onClick={() => setRows((prev) => [...prev, { code: `c${prev.length + 1}`, label: '', maxMarks: '0' }])}
      >
        Add scheme component
      </Button>
      <p className={total === item.maxMarks ? 'text-xs text-ink-muted' : 'text-xs text-danger'}>
        Scheme total {total} / {item.maxMarks}
      </p>
      <Field label="Model solution">
        <Textarea value={modelAnswer} onChange={(e) => setModelAnswer(e.target.value)} />
      </Field>
      <Field label="Expected key points">
        <Textarea value={expectedKeyPoints} onChange={(e) => setExpectedKeyPoints(e.target.value)} />
      </Field>
      <Button
        size="sm"
        disabled={busy || total !== item.maxMarks || !modelAnswer.trim()}
        onClick={() =>
          onSave(`/api/question-papers/internal/${paperId}/items/${item.id}/scheme`, 'POST', {
            modelAnswer,
            expectedKeyPoints,
            components: rows.map((r, i) => ({
              code: r.code || `c${i + 1}`,
              label: r.label || `Component ${i + 1}`,
              maxMarks: Number(r.maxMarks),
            })),
          })
        }
      >
        Save scheme and solution
      </Button>
    </div>
  );
}
