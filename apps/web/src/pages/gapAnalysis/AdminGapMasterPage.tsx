import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, EmptyState, PageHeader, StatusBadge, Surface, useToast } from '../../components/ui';

type MasterPayload = {
  subjects: Array<{
    courseCode: string;
    subjectName: string;
    schemeLabel?: string | null;
    programName?: string | null;
    gapCount: number;
    highPriority: number;
    needsReview: boolean;
    gaps: Array<{
      gapId: string;
      gapType: string;
      gapStatement: string;
      moduleUnit?: string | null;
      priority?: string | null;
      verificationStatus?: string | null;
      mappingOrigin?: string | null;
      coLinks: Array<{ co_code: string }>;
      actions: Array<{ action_type: string; recommended_action: string }>;
    }>;
  }>;
  reviewQueue: Array<{
    review_id: string;
    subject_name?: string | null;
    course_code?: string | null;
    entity_type?: string | null;
    entity_id?: string | null;
    issue?: string | null;
    reason?: string | null;
    review_status?: string | null;
    source?: string | null;
  }>;
  totals: {
    subjects: number;
    gaps: number;
    coLinks: number;
    actions: number;
    sources: number;
    reviewItems: number;
  };
};

export function AdminGapMasterPage() {
  useDocumentTitle('Gap Analysis Master');
  const { toast } = useToast();
  const [data, setData] = useState<MasterPayload | null>(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api<MasterPayload>('/api/gap-analysis/admin/master')
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load master', 'error'));
  };

  useEffect(() => {
    load();
  }, []);

  const reimport = async () => {
    setBusy(true);
    try {
      const res = await api<{ summary: Record<string, unknown> }>('/api/gap-analysis/admin/master/import', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast(`Import complete · inserted/updated recorded in batch ${res.summary.batchId}`);
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
        title="Gap Analysis Master"
        subtitle="Read-oriented view of imported master gaps. Excel/import remains the source of truth."
        actions={
          <Button onClick={reimport} disabled={busy}>
            {busy ? 'Importing…' : 'Re-import Master'}
          </Button>
        }
      />

      {!data ? (
        <p className="text-sm text-ink-muted">Loading…</p>
      ) : !data.subjects.length ? (
        <EmptyState
          title="No Gap master data imported"
          body="Run npm run import:gap-master or use Re-import Master after placing SkillonX_Academic_Mapping_Master.xlsx in public."
          action={
            <Button onClick={reimport} disabled={busy}>
              Import Master
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Metric label="Subjects" value={data.totals.subjects} />
            <Metric label="Gaps" value={data.totals.gaps} />
            <Metric label="CO Links" value={data.totals.coLinks} />
            <Metric label="Actions" value={data.totals.actions} />
            <Metric label="Sources" value={data.totals.sources} />
            <Metric label="Review Queue" value={data.totals.reviewItems} />
          </div>

          <div className="mb-8 space-y-3">
            {data.subjects.map((s) => (
              <Surface key={s.courseCode}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-ink">{s.subjectName}</h2>
                    <p className="text-sm text-ink-secondary">
                      {s.courseCode}
                      {s.schemeLabel ? ` · ${s.schemeLabel}` : ''}
                      {s.programName ? ` · ${s.programName}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {s.needsReview ? <StatusBadge status="REVIEW" /> : null}
                    <span className="text-xs text-ink-muted">
                      {s.gapCount} gaps · {s.highPriority} high
                    </span>
                  </div>
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  {s.gaps.map((g) => (
                    <li key={g.gapId} className="border-t border-border pt-2">
                      <div className="font-medium text-ink">
                        {g.gapId} · {g.gapStatement}
                      </div>
                      <div className="text-xs text-ink-muted">
                        {g.gapType.replace(/_/g, ' ')}
                        {g.moduleUnit ? ` · ${g.moduleUnit}` : ''}
                        {g.priority ? ` · ${g.priority}` : ''}
                        {g.verificationStatus ? ` · ${g.verificationStatus}` : ''}
                        {g.coLinks.length ? ` · COs ${g.coLinks.map((c) => c.co_code).join(', ')}` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              </Surface>
            ))}
          </div>

          <Surface>
            <h2 className="text-base font-semibold text-ink">Review Queue</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Review-marked lineage is preserved. These conditions do not block Gap Analysis usage.
            </p>
            <div className="mt-4 space-y-3">
              {data.reviewQueue.map((r, idx) => (
                <div key={`${r.review_id}-${r.entity_id}-${idx}`} className="border-t border-border pt-3 text-sm">
                  <div className="font-medium text-ink">
                    {r.review_id} · {r.course_code} · {r.entity_id}
                  </div>
                  <div className="text-ink-secondary">{r.issue}</div>
                  <div className="text-xs text-ink-muted">
                    {r.reason} · {r.source} · {r.review_status}
                  </div>
                </div>
              ))}
              {!data.reviewQueue.length ? <p className="text-sm text-ink-muted">No open review items.</p> : null}
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
