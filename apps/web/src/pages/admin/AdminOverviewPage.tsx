import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { api } from '../../lib/api';
import {
  PageHeader,
  StatStrip,
  Surface,
  StatusBadge,
  Skeleton,
  EmptyState,
} from '../../components/ui';
import { formatDate, formatDateTime, SURVEY_TYPE_LABELS } from '../../lib/utils';
import { useAuth } from '../../auth/AuthContext';

type Overview = {
  metrics: {
    institutions: number;
    faculty: number;
    students: number;
    surveys: number;
    activeSurveys: number;
    responses: number;
  };
  recentSurveys: Array<{
    id: number;
    title: string;
    surveyType: string;
    status: string;
    createdAt: string;
    createdBy?: string;
    departmentName?: string;
    collegeName?: string;
    responses: number;
  }>;
  facultyActivity: Array<{
    id: number;
    name: string;
    email: string;
    departmentName?: string;
    collegeName?: string;
    lastLoginAt?: string;
    isActive: boolean;
  }>;
  responseActivity: Array<{
    id: number;
    submittedAt: string;
    surveyId: number;
    surveyTitle: string;
    studentName?: string | null;
  }>;
  statusOverview: Array<{ status: string; count: number }>;
  institutionUsage: Array<{
    id: number;
    name: string;
    code: string;
    faculty: number;
    surveys: number;
    responses: number;
  }>;
};

export function AdminOverviewPage() {
  useDocumentTitle('Overview', 'Admin');
  const { user } = useAuth();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Overview>('/api/admin/overview')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Overview"
        subtitle={`Platform activity across ${user?.role === 'SUPER_ADMIN' ? 'institutions' : user?.collegeName || 'your institution'}.`}
      />

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <StatStrip
        loading={loading}
        items={[
          { label: 'Institutions', value: data?.metrics.institutions ?? 0 },
          { label: 'Faculty', value: data?.metrics.faculty ?? 0 },
          { label: 'Students', value: data?.metrics.students ?? 0 },
          { label: 'Surveys', value: data?.metrics.surveys ?? 0 },
          { label: 'Active', value: data?.metrics.activeSurveys ?? 0 },
          { label: 'Responses', value: data?.metrics.responses ?? 0 },
        ]}
      />

      <div className="grid min-w-0 gap-6 lg:grid-cols-2">
        <Surface className="min-w-0">
          <h2 className="mb-4 text-sm font-semibold text-ink">Recent Surveys</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data?.recentSurveys.length ? (
            <ul className="divide-y divide-border">
              {data.recentSurveys.map((s) => (
                <li key={s.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link to={`/admin/surveys`} className="font-medium text-ink hover:text-accent">
                      {s.title}
                    </Link>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      {s.createdBy || '—'} · {SURVEY_TYPE_LABELS[s.surveyType] || s.surveyType} ·{' '}
                      {formatDate(s.createdAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={s.status} />
                    <span className="text-xs text-ink-muted tabular-nums">{s.responses} resp.</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No surveys yet" body="Faculty surveys will appear here once created." />
          )}
        </Surface>

        <Surface className="min-w-0">
          <h2 className="mb-4 text-sm font-semibold text-ink">Recent Faculty Activity</h2>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : data?.facultyActivity.length ? (
            <ul className="divide-y divide-border">
              {data.facultyActivity.map((f) => (
                <li key={f.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <Link to={`/admin/faculty/${f.id}`} className="font-medium text-ink hover:text-accent">
                      {f.name}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-ink-muted">
                      {f.departmentName || 'No department'} · {f.email}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-ink-muted">
                    {f.lastLoginAt ? formatDateTime(f.lastLoginAt) : 'Never'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No faculty yet" body="Add faculty accounts to get started." />
          )}
        </Surface>

        <Surface className="min-w-0">
          <h2 className="mb-4 text-sm font-semibold text-ink">Response Activity</h2>
          {data?.responseActivity.length ? (
            <ul className="divide-y divide-border">
              {data.responseActivity.map((r) => (
                <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                  <p className="font-medium text-ink">{r.surveyTitle}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {r.studentName || 'Anonymous'} · {formatDateTime(r.submittedAt)}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">No completed responses yet.</p>
          )}
        </Surface>

        <Surface className="min-w-0">
          <h2 className="mb-4 text-sm font-semibold text-ink">Survey Status Overview</h2>
          {data?.statusOverview.length ? (
            <div className="space-y-3">
              {data.statusOverview.map((s) => (
                <div key={s.status} className="flex items-center justify-between">
                  <StatusBadge status={s.status} />
                  <span className="text-sm font-semibold tabular-nums text-ink">{s.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No status data yet.</p>
          )}

          {data && data.institutionUsage.length > 1 ? (
            <div className="mt-6 border-t border-border pt-4">
              <h3 className="mb-3 text-sm font-semibold text-ink">Institution Usage</h3>
              <ul className="space-y-2">
                {data.institutionUsage.map((i) => (
                  <li key={i.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink">{i.name}</span>
                    <span className="text-ink-muted tabular-nums">
                      {i.faculty} faculty · {i.surveys} surveys · {i.responses} resp.
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Surface>
      </div>
    </div>
  );
}
