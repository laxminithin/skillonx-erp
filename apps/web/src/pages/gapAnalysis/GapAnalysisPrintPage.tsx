import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { AcademicPrintCover } from '../../components/academic/AcademicPrintCover';

type PrintModel = {
  documentTitle: string;
  institutionName?: string | null;
  logoUrl?: string | null;
  departmentName?: string | null;
  programName?: string | null;
  subjectName: string;
  subjectCode: string;
  schemeName?: string | null;
  semesterLabel?: string | null;
  academicYearLabel?: string | null;
  preparedBy?: string | null;
  status?: string | null;
  summary: {
    totalGaps: number;
    applicable: number;
    closed: number;
    open: number;
    coveragePercent: number | null;
  };
  gaps: Array<{
    serialNo: number;
    gapId: string;
    gapStatement: string;
    gapType: string;
    moduleUnit?: string | null;
    relatedCos: string;
    expectedCoverage?: string | null;
    actualCoverage?: string | null;
    action: string;
    outcome: string;
    status: string;
    justification?: string | null;
    sourceBasis?: string | null;
    evidence: string[];
    traceability: {
      gapId: string;
      cos: Array<{ code: string; statement?: string | null }>;
      outcomes: Array<{ outcomeType: string; outcomeCode: string; strength?: number | null }>;
    };
  }>;
  evidenceIndex: Array<{
    slNo: number;
    gapId: string;
    action: string;
    evidenceType: string;
    title: string;
    date: string;
  }>;
};

export function GapAnalysisPrintPage() {
  const { id } = useParams();
  const [print, setPrint] = useState<PrintModel | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ print: PrintModel }>(`/api/gap-analysis/${id}/print-model`).then((res) => {
      setPrint(res.print);
      setReady(true);
    });
  }, [id]);

  if (!print) return <p className="p-8 text-ink-muted">Loading…</p>;

  return (
    <div className="academic-print-root mx-auto max-w-5xl bg-white p-8 text-black print:p-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          nav, aside, button, .no-print { display: none !important; }
          .academic-print-cover { page-break-after: always; }
          .gap-print-break { page-break-before: always; }
        }
        .academic-print-cover {
          border: 1px solid rgba(0,0,0,0.18);
          padding: 2rem;
          margin-bottom: 1.5rem;
        }
        .academic-print-cover__brand { display:flex; gap:1rem; align-items:center; margin-bottom:1.5rem; }
        .academic-print-cover__logo { width:64px; height:64px; object-fit:contain; }
        .academic-print-cover__logo-placeholder { width:64px; height:64px; border:1px solid rgba(0,0,0,.2); border-radius:8px; }
        .academic-print-cover__institution { font-size:1.25rem; font-weight:700; margin:0; }
        .academic-print-cover__dept { margin:.25rem 0 0; color:rgba(0,0,0,.65); }
        .academic-print-cover__title { font-size:1.5rem; margin:0 0 1.25rem; }
        .academic-print-cover__meta { display:grid; grid-template-columns:1fr 1fr; gap:.75rem 1.25rem; margin:0; }
        .academic-print-cover__meta dt { font-size:.75rem; text-transform:uppercase; color:rgba(0,0,0,.55); }
        .academic-print-cover__meta dd { margin:.15rem 0 0; font-weight:600; }
        table.gap-print-table { width:100%; border-collapse:collapse; font-size:11px; }
        table.gap-print-table th, table.gap-print-table td { border:1px solid rgba(0,0,0,.2); padding:6px 8px; vertical-align:top; }
        table.gap-print-table th { background:#f5f5f5; text-align:left; }
        h2.gap-print-h { font-size:1.1rem; margin:1.5rem 0 .75rem; }
      `}</style>

      <div className="no-print mb-4 flex justify-end">
        <button
          type="button"
          disabled={!ready}
          onClick={() => window.print()}
          className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          Print
        </button>
      </div>

      <AcademicPrintCover
        documentTitle="GAP ANALYSIS"
        institutionName={print.institutionName}
        logoUrl={print.logoUrl}
        departmentName={print.departmentName}
        programName={print.programName}
        subjectName={print.subjectName}
        subjectCode={print.subjectCode}
        schemeName={print.schemeName}
        semesterLabel={print.semesterLabel}
        academicYearLabel={print.academicYearLabel}
        preparedBy={print.preparedBy}
        status={print.status}
      />

      <section>
        <h2 className="gap-print-h">GAP ANALYSIS</h2>
        <dl className="mb-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs uppercase text-black/55">Subject</dt>
            <dd className="font-semibold">{print.subjectName}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-black/55">Course Code</dt>
            <dd className="font-semibold">{print.subjectCode}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-black/55">Scheme</dt>
            <dd className="font-semibold">{print.schemeName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-black/55">Program</dt>
            <dd className="font-semibold">{print.programName || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-black/55">Semester</dt>
            <dd className="font-semibold">{print.semesterLabel || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-black/55">Academic Year</dt>
            <dd className="font-semibold">{print.academicYearLabel || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-black/55">Prepared By</dt>
            <dd className="font-semibold">{print.preparedBy || '—'}</dd>
          </div>
        </dl>

        <h2 className="gap-print-h">SUMMARY</h2>
        <table className="gap-print-table mb-6">
          <tbody>
            <tr>
              <th>Total Gaps</th>
              <td>{print.summary.totalGaps}</td>
              <th>Applicable</th>
              <td>{print.summary.applicable}</td>
            </tr>
            <tr>
              <th>Closed</th>
              <td>{print.summary.closed}</td>
              <th>Open</th>
              <td>{print.summary.open}</td>
            </tr>
            <tr>
              <th>Coverage %</th>
              <td colSpan={3}>{print.summary.coveragePercent == null ? '—' : `${print.summary.coveragePercent}%`}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="gap-print-h">GAP ANALYSIS TABLE</h2>
        <table className="gap-print-table">
          <thead>
            <tr>
              <th>Sl No</th>
              <th>Gap Identified</th>
              <th>Gap Type</th>
              <th>Module</th>
              <th>Related CO</th>
              <th>Expected</th>
              <th>Actual</th>
              <th>Gap-Filling Action</th>
              <th>Outcome</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {print.gaps.map((g) => (
              <tr key={g.gapId}>
                <td>{g.serialNo}</td>
                <td>{g.gapStatement}</td>
                <td>{g.gapType.replace(/_/g, ' ')}</td>
                <td>{g.moduleUnit || '—'}</td>
                <td>{g.relatedCos || '—'}</td>
                <td>{g.expectedCoverage || '—'}</td>
                <td>{g.actualCoverage || '—'}</td>
                <td>{g.action}</td>
                <td>{g.outcome}</td>
                <td>{g.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="gap-print-break">
        <h2 className="gap-print-h">GAP DETAILS & JUSTIFICATION</h2>
        {print.gaps.map((g) => (
          <article key={`d-${g.gapId}`} className="mb-6 border-b border-black/15 pb-4 text-sm">
            <h3 className="font-semibold">{g.gapId}</h3>
            <p className="mt-2">
              <strong>Gap Identified</strong>
              <br />
              {g.gapStatement}
            </p>
            <p className="mt-2">
              <strong>Gap Type</strong> · {g.gapType.replace(/_/g, ' ')}
            </p>
            <p className="mt-2">
              <strong>Related CO</strong> · {g.relatedCos || '—'}
            </p>
            {g.justification ? (
              <p className="mt-2">
                <strong>Justification</strong>
                <br />
                {g.justification}
              </p>
            ) : null}
            {g.sourceBasis ? (
              <p className="mt-2">
                <strong>Source/Basis</strong>
                <br />
                {g.sourceBasis}
              </p>
            ) : null}
            <p className="mt-2">
              <strong>Gap-Filling Action</strong> · {g.action}
            </p>
            <p className="mt-2">
              <strong>Outcome</strong> · {g.outcome}
            </p>
            <p className="mt-2">
              <strong>Evidence</strong> · {g.evidence.length ? g.evidence.join('; ') : '—'}
            </p>
            <p className="mt-2">
              <strong>Status</strong> · {g.status}
            </p>
            {g.traceability.outcomes.length ? (
              <p className="mt-2">
                <strong>Academic Traceability</strong>
                <br />
                {g.gapId} → {g.traceability.cos.map((c) => c.code).join(', ') || 'CO'} →{' '}
                {g.traceability.outcomes
                  .map((o) => `${o.outcomeType}${o.outcomeCode}${o.strength != null ? ` (${o.strength})` : ''}`)
                  .join(', ')}
              </p>
            ) : null}
          </article>
        ))}
      </section>

      <section className="gap-print-break">
        <h2 className="gap-print-h">EVIDENCE INDEX</h2>
        <table className="gap-print-table">
          <thead>
            <tr>
              <th>Sl No</th>
              <th>Gap ID</th>
              <th>Action</th>
              <th>Evidence Type</th>
              <th>Evidence Title</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {print.evidenceIndex.length ? (
              print.evidenceIndex.map((e) => (
                <tr key={e.slNo}>
                  <td>{e.slNo}</td>
                  <td>{e.gapId}</td>
                  <td>{e.action}</td>
                  <td>{e.evidenceType}</td>
                  <td>{e.title}</td>
                  <td>{e.date}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>No evidence recorded.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
