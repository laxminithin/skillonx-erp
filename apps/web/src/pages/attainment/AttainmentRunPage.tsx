import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, PageHeader, StatusBadge, Surface, useToast } from '../../components/ui';

type RunDetail = {
  run: {
    id: number;
    courseName: string;
    courseCode: string;
    formulaVersion: string;
    seeMethod: string;
    seeConfidence: string;
    seeEstimated: boolean;
    policy: { name: string; version: string };
    academicYearLabel?: string | null;
    programName?: string | null;
  };
  cos: Array<{
    id: number;
    coCode: string;
    statement: string | null;
    target: number | null;
    cie: number | null;
    see: number | null;
    direct: number | null;
    indirect: number | null;
    final: number | null;
    gap: number | null;
    status: string;
    studentCount: number;
    weakStudentCount: number;
    formula: { cie?: string; see?: string; direct?: string; final?: string };
    detail: { recommendation?: { summary?: string; causes?: Array<{ label: string; rationale: string }>; actions?: Array<{ code: string; label: string }> } };
  }>;
  po: Array<{ poCode: string; attainment: number | null; target: number | null; gap: number | null; status: string; formula: string }>;
  pso: Array<{ psoCode: string; attainment: number | null; target: number | null; gap: number | null; status: string }>;
  co?: {
    students: Array<{ usn: string; belowThreshold: boolean; finalLevel: number | null }>;
    sources: Array<{ sourceLabel: string; category: string; attainment: number | null; confidence: string }>;
    steps: Array<{ step: string; formula: string; output: number | null }>;
    cycleId: number | null;
  };
};

function n(v: number | null | undefined) {
  return v == null ? '—' : Number(v).toFixed(2);
}

export function AttainmentRunPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const coCode = params.get('co');
  const { toast } = useToast();
  const [data, setData] = useState<RunDetail | null>(null);
  const [calcOpen, setCalcOpen] = useState(false);

  const load = () =>
    api<RunDetail>(`/api/attainment/runs/${id}${coCode ? `?co=${encodeURIComponent(coCode)}` : ''}`)
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load run', 'error'));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, coCode]);

  useDocumentTitle(data?.run.courseName || 'CO attainment');
  if (!data) return <p className="text-ink-muted">Loading…</p>;
  const selected = coCode ? data.cos.find((c) => c.coCode === coCode) : null;

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/attainment" className="hover:text-accent">
            Attainment
          </Link>
        }
        title={data.run.courseName}
        subtitle={`${data.run.courseCode} · ${data.run.policy.name} v${data.run.policy.version} · ${data.run.formulaVersion}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={`/attainment/runs/${id}/print`}>
              <Button variant="secondary">Print</Button>
            </Link>
            <Button variant="secondary" onClick={() => downloadCopoExport(`/api/attainment/runs/${id}/export`, 'obe.xlsx')}>
              Export
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
        <StatusBadge status={data.run.seeMethod} />
        {data.run.seeEstimated ? (
          <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[11px] font-medium text-warning">
            {data.run.seeConfidence} confidence · estimated SEE
          </span>
        ) : (
          <span className="text-xs text-ink-muted">SEE {data.run.seeConfidence} confidence</span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.cos.map((co) => (
          <button
            key={co.coCode}
            type="button"
            onClick={() => setParams({ co: co.coCode })}
            className="text-left"
          >
            <Surface className={coCode === co.coCode ? 'border-accent' : ''}>
              <div className="flex items-center justify-between">
                <p className="font-semibold">{co.coCode}</p>
                <StatusBadge status={co.status} />
              </div>
              <p className="mt-2 line-clamp-2 text-xs text-ink-muted">{co.statement}</p>
              <p className="mt-3 text-sm">
                {n(co.final)} / {n(co.target)} · gap {n(co.gap)}
              </p>
              {co.status === 'GREEN' && co.weakStudentCount > 0 ? (
                <p className="mt-1 text-xs text-warning">
                  CO attained — student intervention recommended ({co.weakStudentCount}/{co.studentCount})
                </p>
              ) : null}
              {co.status === 'RED' ? (
                <p className="mt-1 text-xs text-danger">
                  {co.weakStudentCount}/{co.studentCount} students below expected performance
                </p>
              ) : null}
            </Surface>
          </button>
        ))}
      </div>

      {selected ? (
        <Surface className="mt-6 space-y-4">
          <h2 className="text-lg font-semibold">
            {selected.coCode} diagnostic
          </h2>
          <p className="text-sm text-ink-muted">{selected.statement}</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <p className="text-[11px] uppercase text-ink-muted">CIE</p>
              <p className="font-medium">{n(selected.cie)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-ink-muted">SEE</p>
              <p className="font-medium">{n(selected.see)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-ink-muted">Indirect</p>
              <p className="font-medium">{n(selected.indirect)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-ink-muted">Final</p>
              <p className="font-medium">{n(selected.final)}</p>
            </div>
          </div>
          {selected.detail?.recommendation?.summary ? (
            <div className="rounded-lg bg-surface-muted p-3 text-sm">
              <p className="font-medium">SkillOnX recommendation</p>
              <p className="mt-1 text-ink-muted">{selected.detail.recommendation.summary}</p>
              <p className="mt-2 text-[11px] text-ink-muted">Suggested based on assessment evidence — not automatic causality.</p>
              {selected.detail.recommendation.actions?.length ? (
                <ul className="mt-2 list-disc pl-5">
                  {selected.detail.recommendation.actions.map((a) => (
                    <li key={a.code}>{a.label}</li>
                  ))}
                </ul>
              ) : null}
              {data.co?.cycleId ? (
                <Link to={`/attainment/cycles/${data.co.cycleId}`}>
                  <Button className="mt-3">Review recommended plan</Button>
                </Link>
              ) : null}
            </div>
          ) : null}

          <button type="button" className="text-sm text-accent" onClick={() => setCalcOpen((v) => !v)}>
            {calcOpen ? 'Hide calculation' : 'View calculation'}
          </button>
          {calcOpen ? (
            <div className="space-y-2 text-sm">
              <p>CIE: {selected.formula.cie}</p>
              <p>SEE: {selected.formula.see}</p>
              <p>Direct: {selected.formula.direct}</p>
              <p>Final: {selected.formula.final}</p>
              {data.co?.sources.map((s) => (
                <p key={s.sourceLabel} className="text-ink-muted">
                  {s.category} · {s.sourceLabel}: {n(s.attainment)} ({s.confidence})
                </p>
              ))}
            </div>
          ) : null}

          {data.co?.students?.filter((s) => s.belowThreshold).length ? (
            <div>
              <p className="text-sm font-medium">Students below expected performance</p>
              <ul className="mt-2 columns-2 text-xs sm:columns-3">
                {data.co.students
                  .filter((s) => s.belowThreshold)
                  .map((s) => (
                    <li key={s.usn}>{s.usn}</li>
                  ))}
              </ul>
            </div>
          ) : null}
        </Surface>
      ) : null}

      {data.po.length ? (
        <div className="mt-8">
          <h2 className="mb-3 text-sm font-semibold">PO attainment (from approved CO–PO mapping)</h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.po.map((p) => (
              <Surface key={p.poCode} className="!p-3">
                <div className="flex justify-between">
                  <span className="font-medium">{p.poCode}</span>
                  <StatusBadge status={p.status} />
                </div>
                <p className="mt-1 text-sm">
                  {n(p.attainment)} / {n(p.target)}
                </p>
              </Surface>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
