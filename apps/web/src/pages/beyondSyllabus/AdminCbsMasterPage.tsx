import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, EmptyState, PageHeader, StatusBadge, Surface, useToast } from '../../components/ui';

type Rec = {
  cbsId: string;
  subjectName: string;
  courseCode: string;
  title: string;
  originLabel: string;
  moduleUnit?: string | null;
  suggestedCo?: string | null;
  suggestedDeliveryMethod?: string | null;
  suggestedHours?: number | null;
  suggestedAssessment?: string | null;
  relatedGapId?: string | null;
  sourceType?: string | null;
  verificationStatus?: string | null;
  isActive: boolean;
};

export function AdminCbsMasterPage() {
  useDocumentTitle('Beyond-Syllabus Master');
  const { toast } = useToast();
  const [rows, setRows] = useState<Rec[]>([]);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api<{ recommendations: Rec[] }>('/api/beyond-syllabus/admin/master')
      .then((r) => setRows(r.recommendations || []))
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load master', 'error'));
  };

  useEffect(() => {
    load();
  }, []);

  const bySubject = useMemo(() => {
    const map = new Map<string, Rec[]>();
    for (const r of rows) {
      const key = r.courseCode;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    return Array.from(map.entries());
  }, [rows]);

  const needsReview = rows.filter((r) =>
    ['NEEDS_REVIEW', 'SOURCE_MISSING', 'ACADEMIC_ANALYSIS'].includes(String(r.verificationStatus || '').toUpperCase()),
  );

  const reimport = async () => {
    setBusy(true);
    try {
      const res = await api<{ summary: { batchId: string; inserted: number; updated: number; unchanged: number } }>(
        '/api/beyond-syllabus/admin/master/import',
        { method: 'POST', body: JSON.stringify({}) },
      );
      toast(
        `Import complete · inserted ${res.summary.inserted}, updated ${res.summary.updated}, unchanged ${res.summary.unchanged}`,
      );
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
        title="Beyond-Syllabus Master"
        subtitle="Institutional enrichment recommendations. Excel/import remains the source of truth."
        actions={
          <Button onClick={reimport} disabled={busy}>
            {busy ? 'Importing…' : 'Re-import Master'}
          </Button>
        }
      />

      {!rows.length ? (
        <EmptyState
          title="No Beyond-Syllabus master data"
          body="Run npm run import:cbs-master or Re-import Master after updating SkillonX_Academic_Mapping_Master.xlsx."
          action={
            <Button onClick={reimport} disabled={busy}>
              Import Master
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Metric label="Subjects" value={bySubject.length} />
            <Metric label="Recommendations" value={rows.length} />
            <Metric label="Review-marked" value={needsReview.length} />
            <Metric label="Active" value={rows.filter((r) => r.isActive).length} />
          </div>

          {needsReview.length ? (
            <Surface className="mb-6">
              <h2 className="text-sm font-semibold text-ink">Review Queue (provenance)</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Faculty may still use academically reviewed enrichment content; provenance is preserved.
              </p>
              <ul className="mt-3 max-h-48 space-y-1 overflow-auto text-sm">
                {needsReview.slice(0, 40).map((r) => (
                  <li key={r.cbsId}>
                    {r.cbsId} · {r.courseCode} · {r.verificationStatus}
                  </li>
                ))}
              </ul>
            </Surface>
          ) : null}

          <div className="space-y-3">
            {bySubject.map(([code, list]) => (
              <Surface key={code}>
                <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base font-semibold text-ink">{list[0].subjectName}</h2>
                    <p className="text-sm text-ink-secondary">
                      {code} · {list.length} recommendations
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {list.map((r) => (
                    <div key={r.cbsId} className="border-t border-line pt-2 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <span className="font-medium text-ink">{r.title}</span>
                          <span className="text-ink-muted"> · {r.cbsId}</span>
                        </div>
                        <StatusBadge status={r.verificationStatus || '—'} />
                      </div>
                      <p className="mt-1 text-ink-secondary">
                        {r.originLabel}
                        {r.relatedGapId ? ` · Gap ${r.relatedGapId}` : ''} · {r.moduleUnit || '—'} · {r.suggestedCo || '—'} ·{' '}
                        {(r.suggestedDeliveryMethod || '—').replace(/_/g, ' ')} · {r.suggestedHours ?? '—'}h ·{' '}
                        {r.suggestedAssessment || 'NONE'}
                      </p>
                    </div>
                  ))}
                </div>
              </Surface>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{value ?? '—'}</div>
    </div>
  );
}
