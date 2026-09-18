import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { api } from '../lib/api';
import {
  Button,
  EmptyState,
  FilterChip,
  Input,
  PageHeader,
  Skeleton,
  StatusBadge,
  Surface,
  useToast,
} from '../components/ui';
import { formatDate, SURVEY_TYPE_LABELS } from '../lib/utils';

type Survey = {
  id: number;
  title: string;
  surveyType: string;
  effectiveStatus: string;
  responseCount?: number;
  createdAt: string;
  endAt?: string | null;
  departmentName?: string;
  courseName?: string;
  semesterLabel?: string;
};

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'CLOSED', label: 'Closed' },
  { id: 'ARCHIVED', label: 'Archived' },
];

export function SurveysPage() {
  useDocumentTitle('My Surveys');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [menuId, setMenuId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    const qs = status ? `?status=${status}` : '';
    try {
      const d = await api<{ surveys: Survey[] }>(`/api/surveys${qs}`);
      setSurveys(d.surveys);
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
    if (!q) return surveys;
    return surveys.filter((s) =>
      [s.title, s.departmentName, s.courseName, SURVEY_TYPE_LABELS[s.surveyType]]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q),
    );
  }, [surveys, query]);

  const setStatus = (next: string) => {
    const p = new URLSearchParams(params);
    if (next) p.set('status', next);
    else p.delete('status');
    setParams(p);
  };

  const duplicate = async (id: number) => {
    try {
      const res = await api<{ survey: { id: number } }>(`/api/surveys/${id}/duplicate`, {
        method: 'POST',
      });
      toast('Survey duplicated');
      navigate(`/surveys/${res.survey.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not duplicate', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Surveys"
        subtitle="Surveys you created — publish, share, and review responses."
        actions={
          <Link to="/surveys/create">
            <Button>
              <Plus size={16} />
              Create Survey
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Search surveys…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <FilterChip key={f.id || 'all'} active={status === f.id} onClick={() => setStatus(f.id)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {loading ? (
        <Surface padded={false} className="p-5 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </Surface>
      ) : !filtered.length ? (
        <EmptyState
          title={query || status ? 'No matching surveys' : 'Create your first survey'}
          body={
            query || status
              ? 'Try a different search or clear filters.'
              : 'Build a survey, share it with students, and start collecting structured feedback.'
          }
          action={
            !query && !status ? (
              <Link to="/surveys/create">
                <Button>
                  <Plus size={16} /> Create Survey
                </Button>
              </Link>
            ) : (
              <Button variant="secondary" onClick={() => { setQuery(''); setStatus(''); }}>
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <Surface padded={false}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[12px] uppercase tracking-wide text-ink-muted">
                  <th className="px-5 py-3 font-medium">Survey</th>
                  <th className="px-5 py-3 font-medium">Responses</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Ends</th>
                  <th className="px-5 py-3 font-medium"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="group border-b border-border last:border-0 hover:bg-surface-muted/50"
                  >
                    <td className="px-5 py-3.5">
                      <Link to={`/surveys/${s.id}`} className="block min-w-0">
                        <p className="font-medium text-ink group-hover:text-accent">{s.title}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">
                          {[
                            SURVEY_TYPE_LABELS[s.surveyType] ?? s.surveyType,
                            s.departmentName,
                            s.semesterLabel ? `Semester ${s.semesterLabel}` : null,
                          ]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-ink-secondary">
                      {s.responseCount ?? 0}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={s.effectiveStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-ink-muted">{formatDate(s.endAt)}</td>
                    <td className="relative px-5 py-3.5 text-right">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-ink-muted hover:bg-surface-muted hover:text-ink"
                        onClick={() => setMenuId((id) => (id === s.id ? null : s.id))}
                        aria-label="Survey actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuId === s.id ? (
                        <div className="absolute right-5 z-20 mt-1 w-40 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface py-1 shadow-md">
                          <MenuItem onClick={() => navigate(`/surveys/${s.id}`)}>Open</MenuItem>
                          <MenuItem onClick={() => navigate(`/surveys/${s.id}?tab=share`)}>
                            Share
                          </MenuItem>
                          <MenuItem onClick={() => duplicate(s.id)}>Duplicate</MenuItem>
                          <MenuItem onClick={() => navigate(`/surveys/${s.id}?tab=analytics`)}>
                            Analytics
                          </MenuItem>
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
    </div>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      className="block w-full px-3 py-2 text-left text-sm text-ink hover:bg-surface-muted"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
