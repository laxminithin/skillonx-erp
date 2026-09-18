import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, PageHeader, Skeleton, StatusBadge, Surface, useToast } from '../../components/ui';

type Detail = {
  paper: {
    id: number;
    paperId: string;
    subjectName: string;
    courseCode: string;
    scheme?: string | null;
    examType: string;
    examDate?: string | null;
    maxMarks?: number | null;
    durationMinutes?: number | null;
    sourceUrl: string;
    sourceType: string;
    extractionStatus: string;
    mappingStatus?: string | null;
    solutionReadiness?: string | null;
    university?: string | null;
    startPage?: number | null;
  };
  questions: Array<{
    id: number;
    questionNumber: number;
    questionText: string;
    maxMarks?: number | null;
    moduleOrUnit?: string | null;
    primaryCo?: string | null;
    isOrChoice: boolean;
    orGroupId?: string | null;
    orAlternative?: string | null;
    appearances: { count: number; years: number[] };
    readinessStatus?: string | null;
    solutionStatus?: string | null;
    mappingBasis?: string | null;
    verificationStatus?: string | null;
    subquestions: Array<{ letter: string; questionText: string; maxMarks?: number | null }>;
  }>;
};

export function PreviousYearPaperDetailPage() {
  const { id } = useParams();
  const { toast } = useToast();
  const [data, setData] = useState<Detail | null>(null);

  useEffect(() => {
    api<Detail>(`/api/question-papers/library/${id}`)
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load paper', 'error'));
  }, [id, toast]);

  useDocumentTitle(data?.paper.subjectName || 'Question Paper');

  if (!data) return <Skeleton className="h-64 w-full" />;
  const p = data.paper;

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/previous-year-papers" className="hover:text-accent">
            Previous Year Question Papers
          </Link>
        }
        title={p.subjectName}
        subtitle={`${p.courseCode} · ${p.examType} · ${p.examDate || ''} · ${p.maxMarks ?? '—'} Marks`}
        actions={
          <a href={p.sourceUrl} target="_blank" rel="noreferrer">
            <Button variant="secondary">Download Original</Button>
          </a>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge status={p.extractionStatus} />
        {p.mappingStatus ? <StatusBadge status={p.mappingStatus} /> : null}
        {p.solutionReadiness ? <StatusBadge status={p.solutionReadiness} /> : null}
        <span className="text-ink-muted">{p.university}</span>
      </div>

      {p.sourceType === 'PDF' ? (
        <Surface className="mb-6 overflow-hidden p-0">
          <iframe
            title="Original question paper"
            src={`${p.sourceUrl}${p.startPage ? `#page=${p.startPage}` : ''}`}
            className="h-[80vh] w-full border-0"
          />
        </Surface>
      ) : (
        <Surface className="mb-6">
          <p className="text-sm text-ink-secondary">
            In-app preview is not available for {p.sourceType}. Use Download Original to open the file.
          </p>
        </Surface>
      )}

      <h2 id="questions" className="mb-3 text-lg font-semibold">
        Extracted questions
      </h2>
      <div className="space-y-3">
        {data.questions.map((q) => (
          <Surface key={q.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-ink-muted">
                  Q{q.questionNumber}
                {q.orGroupId ? ` · ${q.orGroupId}` : ''}
                {q.orAlternative ? ` · Alt ${q.orAlternative}` : ''}
                  {q.moduleOrUnit ? ` · ${q.moduleOrUnit}` : ''}
                  {q.primaryCo ? ` · ${q.primaryCo}` : ''}
                </p>
                <p className="mt-1 text-sm text-ink">{q.questionText}</p>
                {q.subquestions.map((s) => (
                  <p key={s.letter} className="mt-1 text-sm text-ink-secondary">
                    ({s.letter}) {s.questionText} {s.maxMarks != null ? `— ${s.maxMarks} Marks` : ''}
                  </p>
                ))}
                {q.appearances.count > 1 ? (
                  <p className="mt-2 text-xs text-ink-muted">
                    Appeared {q.appearances.count} times · {q.appearances.years.join(', ')}
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-ink-muted">
                  Mapping {q.mappingBasis || q.verificationStatus || 'pending'} · Solution {q.solutionStatus || 'pending'} · {q.readinessStatus || 'PYQ_EXTRACTED'}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-sm font-medium">{q.maxMarks ?? '—'} Marks</span>
                <Link to={`/previous-year-papers/questions/${q.id}`}>
                  <Button size="sm" variant="secondary">
                    Details
                  </Button>
                </Link>
                {q.readinessStatus === 'READY_FOR_INTERNAL_PAPER' || q.readinessStatus === 'READY' ? (
                  <Link to={`/internal-question-papers/create?useQuestion=${q.id}`}>
                    <Button size="sm">Use in question paper</Button>
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
      </div>
    </div>
  );
}
