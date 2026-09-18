import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, AlertTriangle, CheckCircle2, ClipboardCheck } from 'lucide-react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, EmptyState, PageHeader, Skeleton, StatusBadge, Surface, useToast } from '../../components/ui';

type Dash = {
  summary: {
    courses: number;
    cosMonitored: number;
    green: number;
    amber: number;
    red: number;
    openCycles: number;
    awaitingReassessment: number;
    awaitingApproval: number;
    closedSuccessfully: number;
    evidenceCompleteness: number;
  };
  courses: Array<{
    id: number;
    courseId: number;
    courseCode: string;
    courseName: string;
    green: number;
    amber: number;
    red: number;
    coCount: number;
    seeEstimated?: boolean;
    seeMethod?: string;
    coStatuses?: Array<{ coCode: string; status: string }>;
  }>;
  cycles: Array<{
    id: number;
    outcomeCode: string;
    state: string;
    actual: number | null;
    target: number | null;
    gap: number | null;
  }>;
};

function HealthDot({ status }: { status: 'GREEN' | 'AMBER' | 'RED' | string }) {
  const cls =
    status === 'GREEN' ? 'bg-success' : status === 'AMBER' ? 'bg-warning' : status === 'RED' ? 'bg-danger' : 'bg-ink-muted';
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${cls}`} />;
}

function Stat({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <Surface className="!p-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-ink-muted">{hint}</p> : null}
    </Surface>
  );
}

export function AttainmentDashboardPage({ admin = false }: { admin?: boolean }) {
  useDocumentTitle(admin ? 'Programme attainment' : 'Attainment & Improvement');
  const { toast } = useToast();
  const [data, setData] = useState<Dash | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = admin ? '/api/attainment/programme' : '/api/attainment/dashboard';
    api<Dash>(path)
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load attainment', 'error'))
      .finally(() => setLoading(false));
  }, [admin, toast]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const s = data?.summary;
  return (
    <div className="animate-fade-in">
      <PageHeader
        title={admin ? 'Programme CO / PO health' : 'Attainment & Improvement'}
        subtitle="SkillOnX calculates CO attainment, finds weak spots, and recommends the next academic action."
        actions={
          admin ? undefined : (
            <div className="flex flex-wrap gap-2">
              <Link to="/attainment/calculate">
                <Button>Calculate attainment</Button>
              </Link>
              <Link to="/attainment/marks">
                <Button variant="secondary">Marks</Button>
              </Link>
            </div>
          )
        }
      />
      {s ? (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat label="Courses" value={s.courses} />
          <Stat label="COs monitored" value={s.cosMonitored} />
          <Stat label="Green COs" value={s.green} />
          <Stat label="Amber COs" value={s.amber} />
          <Stat label="Red COs" value={s.red} hint="Mandatory improvement" />
          <Stat label="Open cycles" value={s.openCycles} />
          <Stat label="Awaiting reassessment" value={s.awaitingReassessment} />
          <Stat label="Awaiting approval" value={s.awaitingApproval} />
          <Stat label="Closed successfully" value={s.closedSuccessfully} />
          <Stat label="Evidence completeness" value={`${s.evidenceCompleteness}%`} hint="Required items only" />
        </div>
      ) : null}

      {!data?.courses.length ? (
        <EmptyState
          icon={<ClipboardCheck size={22} />}
          title="No attainment yet"
          body="Open a course, enter or import marks, then let SkillOnX calculate attainment."
          action={
            <Link to="/courses">
              <Button>Go to courses</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {data.courses.map((c) => {
            const health = c.coCount ? Math.round(((c.green + c.amber * 0.5) / c.coCount) * 100) : 0;
            return (
              <Surface key={c.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{c.courseName}</p>
                  <p className="text-xs text-ink-muted">{c.courseCode}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {(c.coStatuses?.length
                      ? c.coStatuses
                      : Array.from({ length: c.coCount || 0 }).map((_, i) => ({
                          coCode: `CO${i + 1}`,
                          status: i < c.green ? 'GREEN' : i < c.green + c.amber ? 'AMBER' : 'RED',
                        }))
                    ).map((co) => (
                      <Link
                        key={co.coCode}
                        to={`/attainment/runs/${c.id}?co=${encodeURIComponent(co.coCode)}`}
                        className="inline-flex items-center gap-1 hover:text-accent"
                      >
                        {co.coCode} <HealthDot status={co.status} />
                      </Link>
                    ))}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Overall CO health: {health}%</p>
                  {c.red > 0 ? (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-danger">
                      <AlertTriangle size={12} /> {c.red} mandatory intervention{c.red === 1 ? '' : 's'}
                    </p>
                  ) : (
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-success">
                      <CheckCircle2 size={12} /> On track
                    </p>
                  )}
                  {c.seeEstimated ? <p className="mt-1 text-[11px] text-warning">SEE estimated</p> : null}
                  <Link to={`/attainment/runs/${c.id}`}>
                    <Button className="mt-2" variant="secondary" size="sm">
                      Open diagnostics
                    </Button>
                  </Link>
                </div>
              </Surface>
            );
          })}
        </div>
      )}

      {data?.cycles.length ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">Open improvement work</h2>
          <div className="space-y-2">
            {data.cycles.map((c) => (
              <Link key={c.id} to={`/attainment/cycles/${c.id}`} className="block">
                <Surface className="flex items-center justify-between !p-3">
                  <div>
                    <p className="text-sm font-medium">{c.outcomeCode}</p>
                    <p className="text-xs text-ink-muted">
                      Target {c.target ?? '—'} · Actual {c.actual ?? '—'} · Gap {c.gap ?? '—'}
                    </p>
                  </div>
                  <StatusBadge status={c.state} />
                </Surface>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <p className="mt-6 text-xs text-ink-muted">
        <Activity size={12} className="mr-1 inline" />
        Calculations follow SkillOnX Academic Standard v1.0. Expand any CO to see the formula.
      </p>
    </div>
  );
}
