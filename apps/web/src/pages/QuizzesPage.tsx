import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import {
  Button,
  ConfirmDangerModal,
  EmptyState,
  FilterChip,
  Input,
  PageHeader,
  Skeleton,
  StatusBadge,
  Surface,
  useToast,
} from '../components/ui';
import { formatDate } from '../lib/utils';

type QuizRow = {
  id: number;
  title: string;
  courseName?: string;
  moduleName?: string;
  questionCount?: number;
  totalMarks?: number;
  attemptCount?: number;
  effectiveStatus: string;
  createdAt: string;
};

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'CLOSED', label: 'Closed' },
  { id: 'ARCHIVED', label: 'Archived' },
];

export function QuizzesPage() {
  useDocumentTitle('My Quizzes');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<QuizRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [menuId, setMenuId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    try {
      const d = await api<{ quizzes: QuizRow[] }>(`/api/quizzes${qs}`);
      setQuizzes(d.quizzes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter((s) =>
      [s.title, s.courseName, s.moduleName].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [quizzes, query]);

  const setStatus = (next: string) => {
    const p = new URLSearchParams(params);
    if (next) p.set('status', next);
    else p.delete('status');
    setParams(p);
  };

  const duplicate = async (id: number) => {
    try {
      const res = await api<{ quiz: { id: number } }>(`/api/quizzes/${id}/duplicate`, { method: 'POST' });
      toast('Quiz duplicated');
      navigate(`/quizzes/${res.quiz.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not duplicate', 'error');
    }
  };

  const remove = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api(`/api/quizzes/${deleteId}`, { method: 'DELETE' });
      toast('Quiz deleted');
      setDeleteId(null);
      setMenuId(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete quiz', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Quizzes"
        subtitle="Create subject-wise quizzes, share a link, and review marks."
        actions={
          <div className="flex gap-2">
            <Link to="/quizzes/bank">
              <Button variant="secondary">Question Bank</Button>
            </Link>
            <Link to="/quizzes/create">
              <Button>
                <Plus size={16} />
                Create Quiz
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input className="pl-9" placeholder="Search quizzes…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <FilterChip key={f.id} active={status === f.id} onClick={() => setStatus(f.id)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<Plus size={22} />}
          title="No quizzes yet"
          body="Create a quiz from your subject question bank."
          action={
            <Link to="/quizzes/create">
              <Button>
                <Plus size={16} /> Create Quiz
              </Button>
            </Link>
          }
        />
      ) : (
        <Surface className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[12px] uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-medium">Quiz</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Questions</th>
                  <th className="px-5 py-3 font-medium">Marks</th>
                  <th className="px-5 py-3 font-medium">Attempts</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((q) => (
                  <tr key={q.id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                    <td className="px-5 py-3.5">
                      <Link to={`/quizzes/${q.id}`} className="font-medium text-ink hover:text-accent">
                        {q.title}
                      </Link>
                      {q.moduleName ? <p className="text-xs text-ink-muted">{q.moduleName}</p> : null}
                    </td>
                    <td className="px-5 py-3.5 text-ink-secondary">{q.courseName || '—'}</td>
                    <td className="px-5 py-3.5 tabular-nums">{q.questionCount ?? 0}</td>
                    <td className="px-5 py-3.5 tabular-nums">{q.totalMarks ?? 0}</td>
                    <td className="px-5 py-3.5 tabular-nums">{q.attemptCount ?? 0}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={q.effectiveStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted">{formatDate(q.createdAt)}</td>
                    <td className="relative px-5 py-3.5">
                      <button
                        type="button"
                        className="rounded-[var(--radius-sm)] p-1 text-ink-muted hover:bg-surface-muted"
                        onClick={() => setMenuId(menuId === q.id ? null : q.id)}
                        aria-label="Quiz actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuId === q.id ? (
                        <div className="absolute right-5 z-10 mt-1 w-40 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface py-1 shadow-lg">
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
                            onClick={() => duplicate(q.id)}
                          >
                            Duplicate
                          </button>
                          <Link
                            to={`/quizzes/${q.id}?tab=results`}
                            className="block px-3 py-2 text-sm hover:bg-surface-muted"
                          >
                            Results
                          </Link>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
                            onClick={async () => {
                              setMenuId(null);
                              try {
                                await api(`/api/quizzes/${q.id}/archive`, { method: 'POST' });
                                toast('Quiz archived');
                                await load();
                              } catch (e) {
                                toast(e instanceof Error ? e.message : 'Could not archive', 'error');
                              }
                            }}
                          >
                            Archive
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
                            onClick={() => {
                              setMenuId(null);
                              setDeleteId(q.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}
      <ConfirmDangerModal
        open={deleteId != null}
        title="Delete this quiz?"
        description="This removes the quiz from your list. Quizzes with student attempts cannot be deleted — archive them instead."
        confirmLabel="Delete Quiz"
        loading={deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          void remove();
        }}
      />
    </div>
  );
}
