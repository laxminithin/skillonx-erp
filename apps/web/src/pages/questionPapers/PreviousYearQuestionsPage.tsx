import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, Input, PageHeader, Select, StatusBadge, Surface, useToast } from '../../components/ui';

type BankQuestion = {
  id: number;
  questionNumber: number;
  questionText: string;
  maxMarks?: number | null;
  moduleOrUnit?: string | null;
  primaryCo?: string | null;
  rbt?: string | null;
  orPairId?: string | null;
  orAlternative?: string | null;
  readinessStatus?: string | null;
  schemeStatus?: string | null;
  solutionStatus?: string | null;
  paperId: string;
  subjectName: string;
  courseCode: string;
  examYear?: number | null;
  examType?: string | null;
  appearanceCount: number;
  yearsAppeared?: number[];
  lastAskedYear?: number | null;
  subquestions?: Array<{ letter: string | null; questionText: string; maxMarks?: number | null }>;
};

type ModuleBank = {
  subjectName: string | null;
  courseCode: string | null;
  total: number;
  modules: Array<{ module: number; name: string; questions: BankQuestion[] }>;
};

export function PreviousYearQuestionsPage() {
  useDocumentTitle('PYQ Question Bank');
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [bank, setBank] = useState<ModuleBank | null>(null);
  const [subjects, setSubjects] = useState<Array<{ courseCode: string; subjectName: string }>>([]);
  const [courseCode, setCourseCode] = useState(params.get('courseCode') || '');
  const [tab, setTab] = useState(Number(params.get('module') || 1));
  const [q, setQ] = useState('');

  useEffect(() => {
    api<{ papers: Array<{ courseCode: string; subjectName: string }> }>('/api/question-papers/library')
      .then((res) => {
        const seen = new Map<string, { courseCode: string; subjectName: string }>();
        for (const p of res.papers || []) {
          if (!p.courseCode) continue;
          seen.set(p.courseCode, { courseCode: p.courseCode, subjectName: p.subjectName });
        }
        const list = [...seen.values()].sort((a, b) => a.courseCode.localeCompare(b.courseCode));
        setSubjects(list);
        if (!courseCode && list.length) setCourseCode(list[0].courseCode);
      })
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load subjects', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!courseCode) return;
    api<ModuleBank>(`/api/question-papers/library/module-bank?courseCode=${encodeURIComponent(courseCode)}`)
      .then(setBank)
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load module bank', 'error'));
  }, [courseCode, toast]);

  const active = useMemo(() => bank?.modules.find((m) => m.module === tab) || bank?.modules[0], [bank, tab]);
  const filtered = useMemo(() => {
    const rows = active?.questions || [];
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.questionText.toLowerCase().includes(term) ||
        String(r.primaryCo || '').toLowerCase().includes(term) ||
        String(r.examYear || '').includes(term),
    );
  }, [active, q]);

  const title = bank?.subjectName ? `${bank.subjectName} PYQ Question Bank` : 'PYQ Question Bank';

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/previous-year-papers" className="hover:text-accent">
            Previous Year Question Papers
          </Link>
        }
        title={title}
        subtitle="Module-wise historical Q1/Q2 pairs. Internal papers query only the selected module bank."
      />
      <Surface className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Subject">
            <Select value={courseCode} onChange={(e) => setCourseCode(e.target.value)}>
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.courseCode} value={s.courseCode}>
                  {s.courseCode} · {s.subjectName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Search in this module">
            <Input placeholder="normalization, CO4, 2024" value={q} onChange={(e) => setQ(e.target.value)} />
          </Field>
        </div>
      </Surface>

      <div className="mb-4 flex flex-wrap gap-2">
        {(bank?.modules || [{ module: 1, name: 'Module 1', questions: [] }]).map((m) => (
          <button
            key={m.module}
            type="button"
            onClick={() => setTab(m.module)}
            className={`rounded-full px-3 py-1 text-sm ${
              tab === m.module ? 'bg-accent text-white' : 'bg-surface-muted text-ink-secondary'
            }`}
          >
            {m.name} ({m.questions.length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((r) => (
          <Surface key={r.id}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs text-ink-muted">
                  {r.examType || 'PYQ'} {r.examYear || ''} · Q{r.questionNumber}
                  {r.orAlternative ? ` · Alternative ${r.orAlternative}` : ''}
                  {r.orPairId ? ` · ${r.orPairId}` : ''}
                </p>
                <p className="mt-1 text-sm text-ink">{r.questionText}</p>
                {(r.subquestions || []).map((s) => (
                  <p key={s.letter || s.questionText} className="mt-1 text-sm text-ink-secondary">
                    ({s.letter}) {s.questionText} {s.maxMarks != null ? `— ${s.maxMarks} Marks` : ''}
                  </p>
                ))}
                <p className="mt-2 flex flex-wrap gap-2 text-xs text-ink-muted">
                  <span>{r.maxMarks ?? '—'} Marks</span>
                  <span>{r.primaryCo || 'CO n/a'}</span>
                  <span>{r.rbt || 'RBT n/a'}</span>
                  <span>Asked {r.appearanceCount}×{r.yearsAppeared?.length ? ` (${r.yearsAppeared.join(', ')})` : ''}</span>
                  <span>Scheme {r.schemeStatus || 'pending'}</span>
                  <span>Solution {r.solutionStatus || 'pending'}</span>
                  {r.readinessStatus ? <StatusBadge status={r.readinessStatus} /> : null}
                </p>
              </div>
              <div className="flex gap-2">
                <Link to={`/previous-year-papers/questions/${r.id}`}>
                  <Button size="sm" variant="secondary">
                    Open
                  </Button>
                </Link>
                {r.readinessStatus === 'READY_FOR_INTERNAL_PAPER' || r.readinessStatus === 'READY' ? (
                  <Link to={`/internal-question-papers/create?useQuestion=${r.id}`}>
                    <Button size="sm">Use question</Button>
                  </Link>
                ) : (
                  <Button size="sm" disabled>
                    Not READY
                  </Button>
                )}
              </div>
            </div>
          </Surface>
        ))}
        {!filtered.length ? <p className="text-sm text-ink-muted">No PYQ questions in this module bank yet.</p> : null}
      </div>
    </div>
  );
}
