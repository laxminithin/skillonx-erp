import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, downloadExport } from '../lib/api';
import { Button, PageHeader, Surface } from '../components/ui';
import { SURVEY_TYPE_LABELS } from '../lib/utils';
import { useAuth } from '../auth/AuthContext';

type Survey = {
  id: number;
  title: string;
  surveyType: string;
  effectiveStatus: string;
  responseCount?: number;
};

export function AnalyticsPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    api<{ surveys: Survey[] }>('/api/surveys')
      .then((d) =>
        setSurveys(
          d.surveys.filter(
            (s) =>
              (s.responseCount ?? 0) > 0 ||
              s.effectiveStatus === 'ACTIVE' ||
              s.effectiveStatus === 'CLOSED',
          ),
        ),
      )
      .catch(console.error);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Analytics"
        subtitle="Open a survey to review question-level insights and overall averages."
      />
      <div className="space-y-2">
        {surveys.map((s) => (
          <Link
            key={s.id}
            to={`/surveys/${s.id}?tab=analytics`}
            className="block rounded-[var(--radius-lg)] border border-border bg-surface px-5 py-4 transition hover:border-accent/40"
          >
            <p className="font-medium text-ink">{s.title}</p>
            <p className="mt-0.5 text-sm text-ink-muted">
              {SURVEY_TYPE_LABELS[s.surveyType] ?? s.surveyType} · {s.responseCount ?? 0} responses ·{' '}
              {s.effectiveStatus}
            </p>
          </Link>
        ))}
        {!surveys.length ? (
          <p className="text-sm text-ink-muted">No surveys with analytics yet.</p>
        ) : null}
      </div>
    </div>
  );
}

export function ReportsPage() {
  const [surveys, setSurveys] = useState<Survey[]>([]);

  useEffect(() => {
    api<{ surveys: Survey[] }>('/api/surveys').then((d) => setSurveys(d.surveys)).catch(console.error);
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Export CSV or Excel response datasets. PDF evidence packs come later."
      />
      <Surface padded={false}>
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[12px] uppercase tracking-wide text-ink-muted">
              <th className="px-5 py-3 font-medium">Survey</th>
              <th className="px-5 py-3 font-medium">Responses</th>
              <th className="px-5 py-3 font-medium">Export</th>
            </tr>
          </thead>
          <tbody>
            {surveys.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0">
                <td className="px-5 py-3.5">
                  <Link to={`/surveys/${s.id}`} className="font-medium text-ink hover:text-accent">
                    {s.title}
                  </Link>
                </td>
                <td className="px-5 py-3.5 tabular-nums">{s.responseCount ?? 0}</td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" size="sm" onClick={() => downloadExport(s.id, 'csv')}>
                      CSV
                    </Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => downloadExport(s.id, 'xlsx')}>
                      Excel
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const tz = user?.timezone || 'Asia/Kolkata';
  const zoneLabel = tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta' ? `IST (${tz})` : tz;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Settings" subtitle="Manage your account and review workspace defaults." />

      <Surface>
        <h2 className="text-sm font-semibold text-ink">Account</h2>
        <p className="mt-0.5 text-xs text-ink-muted">Your personal details and sign-in security.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/profile')}>
            My Profile
          </Button>
          <Button variant="secondary" size="sm" onClick={() => navigate('/profile?tab=security')}>
            Change Password
          </Button>
        </div>
      </Surface>

      <Surface>
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Institution</h2>
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
            Managed by administrator
          </span>
        </div>
        <div className="mt-2 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <div className="py-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-ink-muted">Institution</p>
            <p className="mt-0.5 text-sm text-ink">{user?.collegeName || '—'}</p>
          </div>
          <div className="py-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-ink-muted">Department</p>
            <p className="mt-0.5 text-sm text-ink">{user?.departmentName || '—'}</p>
          </div>
          <div className="py-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-ink-muted">
              Survey Timezone
            </p>
            <p className="mt-0.5 text-sm text-ink">{zoneLabel}</p>
          </div>
        </div>
      </Surface>

      <Surface>
        <h2 className="text-sm font-semibold text-ink">Survey defaults</h2>
        <ul className="mt-2 space-y-1.5 text-sm text-ink-secondary">
          <li>Response identity (identified or anonymous) is chosen per survey at creation.</li>
          <li>Identified surveys collect student Name, USN, and Email.</li>
          <li>Anonymous surveys never link a response back to a student.</li>
          <li>Scheduling uses the institution timezone shown above.</li>
        </ul>
      </Surface>
    </div>
  );
}
