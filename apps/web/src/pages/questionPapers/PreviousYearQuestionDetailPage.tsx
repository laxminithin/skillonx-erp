import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, PageHeader, Surface, useToast } from '../../components/ui';

type Q = {
  id: number;
  questionText: string;
  originalQuestionText?: string | null;
  maxMarks?: number | null;
  moduleOrUnit?: string | null;
  primaryCo?: string | null;
  coStatement?: string | null;
  difficulty?: string | null;
  bloomLevel?: string | null;
  sourcePage?: number | null;
  mappingBasis?: string | null;
  verificationStatus?: string | null;
  readinessStatus?: string | null;
  printedCo?: string | null;
  derivedCo?: string | null;
  printedRbt?: string | null;
  solutionStatus?: string | null;
  textbookCitation?: string | null;
  coMappingBlocked?: boolean;
  derivedOutcomes?: { pos?: Array<{ code: string }>; psos?: Array<{ code: string }>; sdgs?: Array<{ code: string }>; provenance?: string };
  paper: { paperId: string; subjectName: string; courseCode: string; examType: string; examYear?: number | null; examDate?: string | null; sourceUrl: string };
  appearances: { count: number; years: number[] };
};

export function PreviousYearQuestionDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [q, setQ] = useState<Q | null>(null);
  useDocumentTitle('Question');

  useEffect(() => {
    api<{ question: Q }>(`/api/question-papers/library/questions/${id}`)
      .then((r) => setQ(r.question))
      .catch((e) => toast(e instanceof Error ? e.message : 'Not found', 'error'));
  }, [id, toast]);

  if (!q) return <p className="text-ink-muted">Loading…</p>;
  const d = q.derivedOutcomes || {};

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/previous-year-papers/questions" className="hover:text-accent">
            Questions
          </Link>
        }
        title={`Q · ${q.paper.courseCode}`}
        subtitle={`${q.paper.subjectName} · ${q.paper.examType} · ${q.paper.examDate || q.paper.examYear}`}
        actions={
          q.readinessStatus === 'READY_FOR_INTERNAL_PAPER' || q.readinessStatus === 'READY' ? (
            <Link to={`/internal-question-papers/create?useQuestion=${q.id}`}>
              <Button>Use in question paper</Button>
            </Link>
          ) : (
            <Button disabled>Not READY for internal paper</Button>
          )
        }
      />
      <Surface className="mb-4">
        <p className="text-sm leading-relaxed text-ink">{q.questionText}</p>
        {q.originalQuestionText && q.originalQuestionText !== q.questionText ? (
          <p className="mt-2 text-xs text-ink-muted">Original PYQ text: {q.originalQuestionText}</p>
        ) : null}
        <p className="mt-3 text-sm text-ink-secondary">
          {q.maxMarks ?? '—'} Marks · {q.moduleOrUnit || 'Module n/a'} · {q.difficulty || 'Difficulty n/a'} · {q.bloomLevel || 'Bloom n/a'} · {q.readinessStatus || q.verificationStatus || 'PYQ_EXTRACTED'}
        </p>
      </Surface>
      <Surface className="mb-4 space-y-1 text-sm">
        <p>
          <span className="text-ink-muted">Primary CO</span> {q.primaryCo || '—'} {q.coMappingBlocked ? '· CO_MAPPING_BLOCKED' : ''}
        </p>
        {q.coStatement ? <p className="text-ink-secondary">{q.coStatement}</p> : null}
        <p>
          <span className="text-ink-muted">Derived PO</span> {(d.pos || []).map((p) => p.code).join(', ') || '—'}
        </p>
        <p>
          <span className="text-ink-muted">PSO</span> {(d.psos || []).map((p) => p.code).join(', ') || '—'}
        </p>
        <p>
          <span className="text-ink-muted">SDG</span> {(d.sdgs || []).map((p) => p.code).join(', ') || '—'}
        </p>
        <p className="text-xs text-ink-muted">Provenance {d.provenance || 'DERIVED_FROM_CO_MAPPING'}</p>
        <p className="text-xs text-ink-muted">Mapping {q.mappingBasis} · {q.verificationStatus}</p>
        <p className="text-xs text-ink-muted">Source page {q.sourcePage ?? '—'}</p>
        <p className="text-xs text-ink-muted">
          Previous appearances {q.appearances.count} · {q.appearances.years.join(', ') || '—'}
        </p>
        <p className="text-xs text-ink-muted">Solution {q.solutionStatus || 'TEXTBOOK_SOURCE_REQUIRED'}</p>
        {q.textbookCitation ? <p className="text-xs text-ink-muted">Reference: {q.textbookCitation}</p> : null}
      </Surface>
    </div>
  );
}
