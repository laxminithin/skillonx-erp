import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, PageHeader, StatusBadge, Surface, useToast } from '../../components/ui';

type Master = {
  summary: {
    papers: number;
    questions: number;
    subquestions: number;
    unmatchedSubjects: number;
    needsReview: number;
    ocrRequired: number;
  };
  sources: Array<{
    id: number;
    fileName: string;
    folder: string;
    extractionStatus: string;
    paperCount: number;
    ocrRequired: boolean;
    pageCount?: number | null;
  }>;
  unmatched: Array<{ courseCode?: string | null; subjectName?: string | null }>;
  reviews: Array<{ reviewId: string; issueType: string; reason?: string | null; paperId?: string | null; priority?: string | null }>;
};

export function AdminQpMasterPage() {
  useDocumentTitle('Previous Year QP Master');
  const { toast } = useToast();
  const [data, setData] = useState<Master | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api<Master>('/api/question-papers/admin/master')
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load master', 'error'));
  };

  useEffect(() => {
    load();
  }, []);

  const reimport = async () => {
    setBusy(true);
    try {
      const res = await api<{ summary: Record<string, unknown> }>('/api/question-papers/admin/master/import', {
        method: 'POST',
        body: JSON.stringify({ dryRun: false }),
      });
      toast(`Import complete · ${res.summary.papers ?? ''} papers`);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Import failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Previous Year QP Master"
        subtitle="PYQ extraction is the only question source. Textbooks are used only for schemes and solutions. Original PDFs are never altered."
        actions={
          <>
            <Link to="/admin/course-textbooks">
              <Button variant="secondary">Course textbooks</Button>
            </Link>
            <Button disabled={busy} variant="secondary" onClick={reimport}>
              Extract & import
            </Button>
            <Button
              disabled={busy}
              variant="secondary"
              onClick={async () => {
                setBusy(true);
                try {
                  const res = await api<{ previousYearQuestions: number; assignmentBankQuestions: number; quizBankQuestions: number; note: string }>(
                    '/api/question-papers/admin/master/classify',
                    { method: 'POST' },
                  );
                  toast(`Classified · PYQ ${res.previousYearQuestions} · assignment ${res.assignmentBankQuestions} · quiz ${res.quizBankQuestions}`);
                } catch (e) {
                  toast(e instanceof Error ? e.message : 'Classify failed', 'error');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Classify existing sources
            </Button>
          </>
        }
      />
      {data ? (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
            {Object.entries(data.summary).map(([k, v]) => (
              <Surface key={k}>
                <p className="text-xs uppercase text-ink-muted">{k}</p>
                <p className="text-2xl font-semibold">{v}</p>
              </Surface>
            ))}
          </div>
          <Surface className="mb-6">
            <h2 className="mb-3 font-semibold">Source files</h2>
            <div className="space-y-2 text-sm">
              {data.sources.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {s.folder} / {s.fileName} · {s.paperCount} papers · {s.pageCount ?? '—'} pages
                  </span>
                  <StatusBadge status={s.ocrRequired ? 'OCR_REQUIRED' : s.extractionStatus} />
                </div>
              ))}
            </div>
          </Surface>
          <Surface className="mb-6">
            <h2 className="mb-3 font-semibold">Unmatched subjects</h2>
            <ul className="text-sm">
              {data.unmatched.slice(0, 40).map((u, i) => (
                <li key={`${u.courseCode}-${i}`}>
                  {u.courseCode} {u.subjectName}
                </li>
              ))}
            </ul>
          </Surface>
          <Surface>
            <h2 className="mb-3 font-semibold">Extraction review</h2>
            <ul className="space-y-2 text-sm">
              {data.reviews.slice(0, 60).map((r) => (
                <li key={r.reviewId}>
                  <span className="font-medium">{r.issueType}</span> · {r.reason} {r.paperId ? `· ${r.paperId}` : ''}
                </li>
              ))}
            </ul>
          </Surface>
        </>
      ) : (
        <p className="text-ink-muted">Loading…</p>
      )}
    </div>
  );
}
