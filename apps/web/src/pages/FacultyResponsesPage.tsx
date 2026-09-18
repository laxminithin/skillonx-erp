import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { EmptyState, PageHeader, Skeleton, StatusBadge, Surface } from '../components/ui';
import { formatDateTime, SURVEY_TYPE_LABELS } from '../lib/utils';

type Row = {
  id: number;
  title: string;
  surveyType: string;
  status: string;
  effectiveStatus?: string;
  responseCount?: number;
  createdAt: string;
};

export function FacultyResponsesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ surveys: Row[] }>('/api/surveys')
      .then((r) => setRows(r.surveys || []))
      .finally(() => setLoading(false));
  }, []);

  const withResponses = rows.filter((r) => Number(r.responseCount ?? 0) > 0);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Responses"
        subtitle="Open a survey to review submissions and analytics."
      />
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : withResponses.length ? (
        <Surface className="!p-0 overflow-hidden">
          <ul className="divide-y divide-border">
            {withResponses.map((s) => (
              <li key={s.id}>
                <Link
                  to={`/surveys/${s.id}?tab=responses`}
                  className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-surface-muted/60"
                >
                  <div>
                    <p className="font-medium text-ink">{s.title}</p>
                    <p className="text-xs text-ink-muted">
                      {SURVEY_TYPE_LABELS[s.surveyType] || s.surveyType} ·{' '}
                      {formatDateTime(s.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-ink-secondary">
                      {s.responseCount}
                    </span>
                    <StatusBadge status={s.effectiveStatus || s.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Surface>
      ) : (
        <EmptyState
          title="No responses yet"
          body="Publish a survey and share the link to start collecting student feedback."
          action={
            <Link to="/surveys/create" className="text-sm font-medium text-accent hover:underline">
              Create Survey
            </Link>
          }
        />
      )}
    </div>
  );
}
