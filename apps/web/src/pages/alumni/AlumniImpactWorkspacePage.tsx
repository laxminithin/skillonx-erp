import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageHeader, Skeleton, Surface, Button } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

const VIEWS = [
  { id: 'EXECUTIVE', label: 'Executive' },
  { id: 'PRINCIPAL', label: 'Principal' },
  { id: 'MANAGEMENT', label: 'Management' },
  { id: 'HOD', label: 'HOD' },
  { id: 'OPERATIONS', label: 'Operations' },
  { id: 'IQAC', label: 'IQAC' },
  { id: 'DEPARTMENT', label: 'Departments' },
  { id: 'TRENDS', label: 'Trends' },
  { id: 'FUNNELS', label: 'Funnels' },
  { id: 'EVIDENCE', label: 'Evidence' },
  { id: 'GAPS', label: 'Gaps' },
  { id: 'ACCREDITATION', label: 'Accreditation' },
  { id: 'REPORTS', label: 'Reports' },
  { id: 'REGISTRY', label: 'Registry' },
] as const;

function formatMetric(m: any) {
  if (m == null) return '—';
  if (m.noData) return 'No data';
  if (m.unit === 'percent' && m.numerator != null && m.denominator != null) {
    return `${m.numerator} / ${m.denominator} (${m.value ?? '—'}%)`;
  }
  if (m.numerator != null && m.denominator != null && m.unit !== 'count') {
    return `${m.numerator} / ${m.denominator}`;
  }
  return m.value == null ? '—' : String(m.value);
}

export function AlumniImpactWorkspacePage() {
  useDocumentTitle('Alumni Impact');
  const [params, setParams] = useSearchParams();
  const view = (params.get('view') || 'EXECUTIVE').toUpperCase();
  const [data, setData] = useState<any>(null);
  const [drill, setDrill] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [frameworkForm, setFrameworkForm] = useState({ code: '', label: '', description: '' });
  const [reportType, setReportType] = useState('ANNUAL_IMPACT');

  function setView(id: string) {
    const next = new URLSearchParams(params);
    next.set('view', id);
    next.delete('metric');
    setParams(next);
    setDrill(null);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api(`/api/alumni-admin/impact?view=${encodeURIComponent(view)}`)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || 'Failed to load impact workspace');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [view]);

  async function openDrilldown(metricKey: string) {
    setBusy('drill');
    setError('');
    try {
      const res = await api(`/api/alumni-admin/impact/metrics/${encodeURIComponent(metricKey)}/drilldown`);
      setDrill(res);
      const next = new URLSearchParams(params);
      next.set('metric', metricKey);
      setParams(next);
    } catch (e: any) {
      setError(e?.message || 'Drill-down failed');
    } finally {
      setBusy('');
    }
  }

  async function syncEvidence() {
    setBusy('sync');
    try {
      await api('/api/alumni-admin/impact/evidence/sync', { method: 'POST', body: JSON.stringify({}) });
      const res = await api('/api/alumni-admin/impact?view=EVIDENCE');
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Evidence sync failed');
    } finally {
      setBusy('');
    }
  }

  async function createFramework() {
    setBusy('framework');
    try {
      await api('/api/alumni-admin/impact/accreditation/frameworks', {
        method: 'POST',
        body: JSON.stringify(frameworkForm),
      });
      setFrameworkForm({ code: '', label: '', description: '' });
      const res = await api('/api/alumni-admin/impact?view=ACCREDITATION');
      setData(res);
    } catch (e: any) {
      setError(e?.message || 'Framework create failed');
    } finally {
      setBusy('');
    }
  }

  async function buildReport(createSnapshot = false) {
    setBusy('report');
    try {
      const res = await api('/api/alumni-admin/impact/reports/build', {
        method: 'POST',
        body: JSON.stringify({ reportType, createSnapshot }),
      });
      setDrill({ type: 'report', ...(res as Record<string, unknown>) });
    } catch (e: any) {
      setError(e?.message || 'Report build failed');
    } finally {
      setBusy('');
    }
  }

  async function exportCsv() {
    setBusy('export');
    try {
      const res = await api<{ csv: string; filename: string }>('/api/alumni-admin/impact/reports/export', {
        method: 'POST',
        body: JSON.stringify({ reportType }),
      });
      const blob = new Blob([res.csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename || 'alumni-impact.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || 'Export failed');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
      <PageHeader
        title="Alumni Institutional Impact"
        subtitle="Evidence-backed measurement layer. Activity is not impact. Every rate shows numerator / denominator."
      />

      <div className="flex flex-wrap gap-2">
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin">Alumni Admin</Link>
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/crm">CRM</Link>
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/matching">Matching</Link>
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/recognition">Recognition</Link>
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/impact">Impact</Link>
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/assistant">Assistant</Link>
      </div>

      <div className="flex flex-wrap gap-2">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setView(v.id)}
            className={`rounded-[var(--radius-md)] px-3 py-1.5 text-sm ${
              view === v.id ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-surface-muted'
            }`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {data?.period ? (
        <Surface className="space-y-1 p-4 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">Period:</span>
            <span>{data.period.periodLabel || data.period.periodType}</span>
            <StatusPill tone={data.period.complete ? 'success' : 'warning'}>
              {data.period.complete ? 'Complete' : 'Partial'}
            </StatusPill>
          </div>
          {data.period.coverageNote ? (
            <p className="text-muted-foreground">{data.period.coverageNote}</p>
          ) : null}
          {data.privacyNote ? <p className="text-muted-foreground">{data.privacyNote}</p> : null}
          {data.note ? <p className="text-muted-foreground">{data.note}</p> : null}
        </Surface>
      ) : null}

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          {data?.sections?.map((section: any) => (
            <Surface key={section.title} className="space-y-3 p-4">
              <h2 className="text-lg font-semibold">{section.title}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {section.metrics?.map((m: any) => (
                  <button
                    key={m.metricKey}
                    type="button"
                    onClick={() => openDrilldown(m.metricKey)}
                    className="rounded-[var(--radius-md)] border border-border p-3 text-left hover:bg-surface-muted"
                  >
                    <div className="text-xs text-muted-foreground">{m.metricKey} · v{m.version}</div>
                    <div className="font-medium">{m.name}</div>
                    <div className="mt-1 text-2xl font-semibold tabular-nums">{formatMetric(m)}</div>
                    {m.dataQualityNote ? (
                      <p className="mt-1 text-xs text-muted-foreground">{m.dataQualityNote}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      Attribution default: {m.attributionDefault} · {m.sourceModules?.join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            </Surface>
          ))}

          {view === 'FUNNELS' && data?.engagementFunnel ? (
            <Surface className="space-y-4 p-4">
              <h2 className="text-lg font-semibold">Engagement funnel</h2>
              <FunnelList items={data.engagementFunnel} />
              <h2 className="text-lg font-semibold">C4 program funnel</h2>
              <FunnelList items={data.programFunnel} />
              <h2 className="text-lg font-semibold">Need-to-impact funnel (C5)</h2>
              <FunnelList items={data.needFunnel} />
            </Surface>
          ) : null}

          {view === 'TRENDS' && data?.series ? (
            <Surface className="space-y-3 p-4">
              <h2 className="text-lg font-semibold">Trends by academic year</h2>
              <p className="text-sm text-muted-foreground">{data.note}</p>
              {data.series.map((s: any) => (
                <div key={s.academicYearId} className="rounded border border-border p-3">
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    {s.label}
                    {s.isCurrent ? <StatusPill tone="warning">Current / partial</StatusPill> : null}
                  </div>
                  <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
                    {s.metrics?.map((m: any) => (
                      <li key={m.metricKey}>
                        {m.metricKey}: {m.value ?? '—'}
                        {m.numerator != null ? ` (${m.numerator}/${m.denominator})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Surface>
          ) : null}

          {view === 'DEPARTMENT' && data?.departments ? (
            <Surface className="space-y-3 p-4">
              <h2 className="text-lg font-semibold">Department comparison</h2>
              <p className="text-sm text-muted-foreground">{data.note}</p>
              {data.departments.map((d: any) => (
                <div key={d.departmentId} className="rounded border border-border p-3">
                  <div className="font-medium">{d.departmentName} ({d.departmentCode})</div>
                  <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    {d.metrics?.slice(0, 9).map((m: any) => (
                      <li key={m.metricKey}>
                        {m.name}: {formatMetric(m)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </Surface>
          ) : null}

          {view === 'EVIDENCE' ? (
            <Surface className="space-y-3 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">Evidence ledger</h2>
                <Button disabled={busy === 'sync'} onClick={syncEvidence}>
                  {busy === 'sync' ? 'Syncing…' : 'Sync from C2 outcomes'}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">{data?.note}</p>
              <ul className="space-y-2 text-sm">
                {(data?.items || []).map((item: any) => (
                  <li key={item.id} className="rounded border border-border p-2">
                    <div className="font-medium">{item.metricKey || item.impactDomain}</div>
                    <div className="text-muted-foreground">
                      {item.sourceType}:{item.sourceReference} · {item.verificationStatus} ·{' '}
                      {item.attributionLevel}
                      {item.alumniName ? ` · ${item.alumniName}` : ''}
                    </div>
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}

          {view === 'GAPS' ? (
            <Surface className="space-y-3 p-4">
              <h2 className="text-lg font-semibold">Evidence gap analysis</h2>
              <p className="text-sm text-muted-foreground">{data?.note}</p>
              <div className="flex flex-wrap gap-2 text-sm">
                {Object.entries(data?.byType || {}).map(([k, v]) => (
                  <StatusPill key={k} tone="warning">
                    {k}: {String(v)}
                  </StatusPill>
                ))}
              </div>
              <ul className="space-y-2 text-sm">
                {(data?.gaps || []).slice(0, 50).map((g: any, i: number) => (
                  <li key={`${g.sourceReference}-${i}`} className="rounded border border-border p-2">
                    <span className="font-medium">{g.gapType}</span> · {g.detail}
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}

          {view === 'ACCREDITATION' ? (
            <Surface className="space-y-4 p-4">
              <h2 className="text-lg font-semibold">Accreditation mapping</h2>
              <p className="text-sm text-muted-foreground">{data?.note}</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  className="rounded border border-border px-3 py-2 text-sm"
                  placeholder="Framework code"
                  value={frameworkForm.code}
                  onChange={(e) => setFrameworkForm({ ...frameworkForm, code: e.target.value })}
                />
                <input
                  className="rounded border border-border px-3 py-2 text-sm"
                  placeholder="Label"
                  value={frameworkForm.label}
                  onChange={(e) => setFrameworkForm({ ...frameworkForm, label: e.target.value })}
                />
                <Button disabled={busy === 'framework' || !frameworkForm.code || !frameworkForm.label} onClick={createFramework}>
                  Add framework
                </Button>
              </div>
              <ul className="space-y-2 text-sm">
                {(data?.frameworks || []).map((f: any) => (
                  <li key={f.id} className="rounded border border-border p-2">
                    <span className="font-medium">{f.code}</span> — {f.label}
                  </li>
                ))}
                {(data?.frameworks || []).length === 0 ? (
                  <li className="text-muted-foreground">No frameworks configured — criteria are not fabricated.</li>
                ) : null}
              </ul>
              <h3 className="font-medium">Mappings</h3>
              <ul className="space-y-2 text-sm">
                {(data?.mappings || []).map((m: any) => (
                  <li key={m.id} className="rounded border border-border p-2">
                    {m.frameworkCode} / {m.criterionCode} → {m.metricKey || m.impactDomain || m.outcomeType} (
                    {m.verificationStatus})
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}

          {view === 'REPORTS' ? (
            <Surface className="space-y-4 p-4">
              <h2 className="text-lg font-semibold">Report builder</h2>
              <div className="flex flex-wrap gap-2">
                <select
                  className="rounded border border-border px-3 py-2 text-sm"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  {(data?.reportTypes || []).map((t: string) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <Button disabled={!!busy} onClick={() => buildReport(false)}>
                  Build
                </Button>
                <Button disabled={!!busy} onClick={() => buildReport(true)}>
                  Build + snapshot
                </Button>
                <Button disabled={!!busy} onClick={exportCsv}>
                  Export CSV
                </Button>
              </div>
              <h3 className="font-medium">Snapshots</h3>
              <ul className="space-y-2 text-sm">
                {(data?.snapshots || []).map((s: any) => (
                  <li key={s.id} className="rounded border border-border p-2">
                    #{s.id} {s.title} · {s.periodLabel} · {s.generatedAt}
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}

          {view === 'REGISTRY' && data?.registry ? (
            <Surface className="space-y-3 p-4">
              <h2 className="text-lg font-semibold">Metric registry</h2>
              <p className="text-sm text-muted-foreground">{data.registry.versioningNote}</p>
              <ul className="space-y-2 text-sm">
                {data.registry.metrics?.map((m: any) => (
                  <li key={`${m.metricKey}-v${m.version}`} className="rounded border border-border p-2">
                    <div className="font-medium">
                      {m.metricKey} v{m.version} — {m.name}
                    </div>
                    <div className="text-muted-foreground">
                      {m.impactDomain} · {m.calculationType} · {m.sourceModules?.join(', ')}
                    </div>
                    <p className="mt-1">{m.description}</p>
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}

          {view === 'OPERATIONS' && data?.workspaceLinks ? (
            <Surface className="space-y-2 p-4">
              <h2 className="text-lg font-semibold">Operational workspaces</h2>
              <div className="flex flex-wrap gap-2">
                {data.workspaceLinks.map((href: string) => (
                  <Link key={href} className="rounded border border-border px-3 py-2 text-sm hover:bg-surface-muted" to={href}>
                    {href}
                  </Link>
                ))}
              </div>
            </Surface>
          ) : null}
        </>
      )}

      {drill ? (
        <Surface className="space-y-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {drill.type === 'report' ? 'Report result' : `Drill-down: ${drill.metricKey}`}
            </h2>
            <Button variant="ghost" onClick={() => setDrill(null)}>
              Close
            </Button>
          </div>
          {drill.definition ? (
            <p className="text-sm text-muted-foreground">
              v{drill.definition.version}: {drill.definition.description}
            </p>
          ) : null}
          {drill.privacy?.suppressed ? (
            <p className="text-sm text-destructive">{drill.privacy.reason}</p>
          ) : null}
          {drill.correctionHint ? <p className="text-sm text-muted-foreground">{drill.correctionHint}</p> : null}
          {drill.rows ? (
            <ul className="max-h-80 space-y-2 overflow-auto text-sm">
              {drill.rows.map((r: any, i: number) => (
                <li key={i} className="rounded border border-border p-2">
                  <pre className="whitespace-pre-wrap break-words font-sans text-xs">{JSON.stringify(r, null, 0)}</pre>
                </li>
              ))}
            </ul>
          ) : null}
          {drill.report ? (
            <pre className="max-h-96 overflow-auto rounded border border-border p-2 text-xs">
              {JSON.stringify(drill.report, null, 2)}
            </pre>
          ) : null}
          {drill.pack ? (
            <pre className="max-h-96 overflow-auto rounded border border-border p-2 text-xs">
              {JSON.stringify(drill.pack, null, 2)}
            </pre>
          ) : null}
        </Surface>
      ) : null}
    </div>
  );
}

function FunnelList({ items }: { items: Array<{ stage: string; value: number; note?: string }> }) {
  return (
    <ol className="space-y-1 text-sm">
      {items.map((item) => (
        <li key={item.stage} className="flex flex-wrap items-baseline gap-2 rounded border border-border px-3 py-2">
          <span className="font-medium">{item.stage}</span>
          <span className="tabular-nums text-lg">{item.value}</span>
          {item.note ? <span className="text-muted-foreground">{item.note}</span> : null}
        </li>
      ))}
    </ol>
  );
}
