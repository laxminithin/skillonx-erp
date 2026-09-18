import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, EmptyState, PageHeader, StatusBadge, Surface, useToast } from '../../components/ui';

type MasterPayload = {
  subjects: Array<{
    id: number;
    subjectName: string;
    courseCode: string;
    schemeLabel?: string | null;
    programName?: string | null;
    semesterLabel?: string | null;
    courseType?: string | null;
    coCount: number;
    componentCount: number;
    assessmentComponentsLabel?: string | null;
    officialStructureStatus?: string | null;
    standardEvaluationStatus?: string | null;
    evaluationPercentTotal?: number | null;
    componentTotalValidation?: string | null;
    sourceStatus?: string | null;
    reviewItems?: number | null;
    readyForImport?: boolean;
    isEvaluable?: boolean;
    isBlocked?: boolean;
    blockedReason?: string | null;
    verificationStatus?: string | null;
  }>;
  reviews: Array<{
    reviewId: string;
    subjectName?: string | null;
    courseCode?: string | null;
    issueType?: string | null;
    reason?: string | null;
    reviewStatus?: string | null;
    priority?: string | null;
  }>;
};

export function AdminCoEvalMasterPage() {
  useDocumentTitle('CO Evaluation Master');
  const { toast } = useToast();
  const [data, setData] = useState<MasterPayload | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api<MasterPayload>('/api/co-evaluation/admin/master')
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load master', 'error'));
  };

  useEffect(() => {
    load();
  }, []);

  const reimport = async () => {
    setBusy(true);
    try {
      const res = await api<{ summary: Record<string, unknown> }>('/api/co-evaluation/admin/master/import', {
        method: 'POST',
        body: JSON.stringify({ dryRun: false }),
      });
      toast(`Import complete · batch ${res.summary.batchId ?? 'recorded'}`);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Import failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const totals = data
    ? {
        subjects: data.subjects.length,
        evaluable: data.subjects.filter((s) => s.isEvaluable).length,
        blocked: data.subjects.filter((s) => s.isBlocked).length,
        cos: data.subjects.reduce((n, s) => n + Number(s.coCount || 0), 0),
        components: data.subjects.reduce((n, s) => n + Number(s.componentCount || 0), 0),
        reviews: data.reviews.length,
      }
    : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="CO Evaluation Master"
        subtitle="Read-oriented view of imported CO Evaluation masters. Excel/import remains the source of truth."
        actions={
          <Button onClick={reimport} disabled={busy}>
            {busy ? 'Importing…' : 'Import Master'}
          </Button>
        }
      />

      {!data ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : !data.subjects.length ? (
        <EmptyState
          title="No CO Evaluation master data imported"
          body="Place the CO Evaluation master workbook in public and run Import Master, or use the API import script."
          action={
            <Button onClick={reimport} disabled={busy}>
              Import Master
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Subjects" value={totals!.subjects} />
            <Metric label="Evaluable" value={totals!.evaluable} />
            <Metric label="Blocked" value={totals!.blocked} />
            <Metric label="COs" value={totals!.cos} />
            <Metric label="Components" value={totals!.components} />
            <Metric label="Review Queue" value={totals!.reviews} />
          </div>

          <div className="mb-8 space-y-3">
            {data.subjects.map((s) => (
              <Surface key={s.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-ink">{s.subjectName}</h2>
                    <p className="text-sm text-ink-secondary">
                      {s.courseCode}
                      {s.schemeLabel ? ` · ${s.schemeLabel}` : ''}
                      {s.programName ? ` · ${s.programName}` : ''}
                      {s.semesterLabel ? ` · ${s.semesterLabel}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">
                      {[s.courseType, s.assessmentComponentsLabel].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {s.isBlocked ? <StatusBadge status="BLOCKED" /> : null}
                    {s.isEvaluable ? <StatusBadge status="READY" /> : null}
                    {s.verificationStatus ? <StatusBadge status={s.verificationStatus} /> : null}
                    <span className="text-xs text-ink-muted">
                      {s.coCount} COs · {s.componentCount} components
                    </span>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-ink-secondary sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    Structure · {(s.officialStructureStatus || '—').replace(/_/g, ' ')}
                  </div>
                  <div>
                    Standard · {(s.standardEvaluationStatus || '—').replace(/_/g, ' ')}
                  </div>
                  <div>
                    Eval % · {s.evaluationPercentTotal == null ? '—' : `${s.evaluationPercentTotal}%`}
                  </div>
                  <div>
                    Validation · {(s.componentTotalValidation || '—').replace(/_/g, ' ')}
                  </div>
                </div>
                {s.isBlocked && s.blockedReason ? (
                  <p className="mt-3 text-sm text-ink-secondary">
                    <span className="font-medium text-ink">Blocked · </span>
                    {s.blockedReason}
                  </p>
                ) : null}
              </Surface>
            ))}
          </div>

          <Surface>
            <h2 className="text-base font-semibold text-ink">Review Queue</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Review-marked lineage is preserved. Blocked subjects remain non-evaluable until CO Master is resolved.
            </p>
            <div className="mt-4 space-y-3">
              {data.reviews.map((r, idx) => (
                <div key={`${r.reviewId}-${r.courseCode}-${idx}`} className="border-t border-border pt-3 text-sm">
                  <div className="font-medium text-ink">
                    {r.reviewId} · {r.courseCode} · {r.subjectName}
                  </div>
                  <div className="text-ink-secondary">{(r.issueType || '').replace(/_/g, ' ')}</div>
                  <div className="text-xs text-ink-muted">
                    {[r.reason, r.priority, r.reviewStatus].filter(Boolean).join(' · ')}
                  </div>
                </div>
              ))}
              {!data.reviews.length ? <p className="text-sm text-ink-muted">No open review items.</p> : null}
            </div>
          </Surface>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <Surface className="!p-3">
      <div className="text-[11px] uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-1 text-lg font-semibold text-ink">{value}</div>
    </Surface>
  );
}
