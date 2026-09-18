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
  courseType?: string | null;
  summary: {
    courseOutcomes: number;
    assessmentComponents: number;
    allocatedMarks: number;
    expectedMarks: number | null;
    evaluationAllocation: number;
    modifiedValues: number;
    status: string;
  };
  matrix: {
    columns: Array<{ id: string; name: string; officialMaxMarks: number | null }>;
    rows: Array<{
      coCode: string;
      coStatement?: string | null;
      values: Array<{ assessmentComponentId: string; value: number | null }>;
      marksDistribution: number | null;
      evaluationPercent: number | null;
    }>;
    totals: Array<{ assessmentComponentId: string; allocated: number; expected: number | null }>;
    evaluationPercentTotal: number;
  };
  assessmentStructure?: {
    structure?: Record<string, unknown> | null;
    courseComponents?: Array<Record<string, unknown>>;
    sources?: Array<Record<string, unknown>>;
  } | null;
  justifications: Array<{
    coCode: string;
    assessmentComponentId: string;
    componentName: string;
    standardValue: number | null;
    currentValue: number | null;
    masterJustification?: string | null;
    lecturerChangeJustification?: string | null;
    modified: boolean;
  }>;
  sourceNotes: {
    verificationStatus?: string | null;
    sourceStatus?: string | null;
    snapshotMeta?: Record<string, unknown> | null;
  };
};

function dash(n: number | null | undefined) {
  if (n == null || !Number.isFinite(Number(n)) || Number(n) === 0) return '—';
  return String(n);
}

export function CoEvaluationPrintPage() {
  const { id } = useParams();
  const [print, setPrint] = useState<PrintModel | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ print: PrintModel }>(`/api/co-evaluation/${id}/print-model`).then((res) => {
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
          .co-eval-print-break { page-break-before: always; }
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
        table.co-eval-print-table { width:100%; border-collapse:collapse; font-size:11px; }
        table.co-eval-print-table th, table.co-eval-print-table td { border:1px solid rgba(0,0,0,.2); padding:6px 8px; vertical-align:top; }
        table.co-eval-print-table th { background:#f5f5f5; text-align:left; }
        h2.co-eval-print-h { font-size:1.1rem; margin:1.5rem 0 .75rem; }
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
        documentTitle="CO EVALUATION"
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
        <h2 className="co-eval-print-h">COURSE OUTCOMES EVALUATION</h2>
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
            <dt className="text-xs uppercase text-black/55">Course Type</dt>
            <dd className="font-semibold">{print.courseType || '—'}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-black/55">Prepared By</dt>
            <dd className="font-semibold">{print.preparedBy || '—'}</dd>
          </div>
        </dl>

        <h2 className="co-eval-print-h">SUMMARY</h2>
        <table className="co-eval-print-table mb-6">
          <tbody>
            <tr>
              <th>Course Outcomes</th>
              <td>{print.summary.courseOutcomes}</td>
              <th>Assessment Components</th>
              <td>{print.summary.assessmentComponents}</td>
            </tr>
            <tr>
              <th>Allocated Marks</th>
              <td>
                {print.summary.expectedMarks == null
                  ? print.summary.allocatedMarks
                  : `${print.summary.allocatedMarks}/${print.summary.expectedMarks}`}
              </td>
              <th>Evaluation Allocation %</th>
              <td>{Number(print.summary.evaluationAllocation || 0).toFixed(1)}%</td>
            </tr>
            <tr>
              <th>Modified Values</th>
              <td>{print.summary.modifiedValues}</td>
              <th>Status</th>
              <td>{print.summary.status}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="co-eval-print-h">EVALUATION MATRIX</h2>
        <table className="co-eval-print-table">
          <thead>
            <tr>
              <th>CO</th>
              {print.matrix.columns.map((c) => (
                <th key={c.id}>
                  {c.name}
                  {c.officialMaxMarks != null ? ` (${c.officialMaxMarks})` : ''}
                </th>
              ))}
              <th>Marks Distribution</th>
              <th>% Assigned</th>
            </tr>
          </thead>
          <tbody>
            {print.matrix.rows.map((row) => (
              <tr key={row.coCode}>
                <td>
                  <strong>{row.coCode}</strong>
                  {row.coStatement ? (
                    <>
                      <br />
                      <span style={{ fontSize: 10 }}>{row.coStatement}</span>
                    </>
                  ) : null}
                </td>
                {row.values.map((v) => (
                  <td key={v.assessmentComponentId}>{dash(v.value)}</td>
                ))}
                <td>{dash(row.marksDistribution)}</td>
                <td>{dash(row.evaluationPercent)}</td>
              </tr>
            ))}
            <tr>
              <td>
                <strong>TOTAL</strong>
              </td>
              {print.matrix.totals.map((t) => (
                <td key={t.assessmentComponentId}>
                  {t.expected == null ? t.allocated : `${t.allocated}/${t.expected}`}
                </td>
              ))}
              <td>
                {print.summary.expectedMarks == null
                  ? print.summary.allocatedMarks
                  : `${print.summary.allocatedMarks}/${print.summary.expectedMarks}`}
              </td>
              <td>{Number(print.matrix.evaluationPercentTotal || 0).toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="co-eval-print-break">
        <h2 className="co-eval-print-h">OFFICIAL ASSESSMENT STRUCTURE</h2>
        {print.assessmentStructure?.structure ? (
          <table className="co-eval-print-table mb-4">
            <tbody>
              {Object.entries(print.assessmentStructure.structure)
                .filter(([k]) => !['id', 'college_id', 'created_at', 'updated_at', 'import_batch'].includes(k))
                .map(([k, v]) => (
                  <tr key={k}>
                    <th>{k.replace(/_/g, ' ')}</th>
                    <td>{v == null || v === '' ? '—' : String(v)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        ) : (
          <p className="mb-4 text-sm">No assessment structure recorded.</p>
        )}
        {(print.assessmentStructure?.courseComponents || []).length ? (
          <table className="co-eval-print-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Max Marks</th>
                <th>Mandatory</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {(print.assessmentStructure?.courseComponents || []).map((c, idx) => (
                <tr key={idx}>
                  <td>{String(c.component_name || c.component_id || '—')}</td>
                  <td>{c.max_marks == null ? '—' : String(c.max_marks)}</td>
                  <td>{c.mandatory ? 'Yes' : 'No'}</td>
                  <td>{String(c.verification_status || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>

      <section className="co-eval-print-break">
        <h2 className="co-eval-print-h">JUSTIFICATIONS</h2>
        {print.justifications.length ? (
          print.justifications.map((j, idx) => (
            <article key={`${j.coCode}-${j.assessmentComponentId}-${idx}`} className="mb-4 border-b border-black/15 pb-3 text-sm">
              <h3 className="font-semibold">
                {j.coCode} → {j.componentName}
                {j.modified ? ' (Modified)' : ''}
              </h3>
              <p className="mt-1">
                Standard {dash(j.standardValue)} · Current {dash(j.currentValue)}
              </p>
              {j.masterJustification ? (
                <p className="mt-1">
                  <strong>Master justification</strong>
                  <br />
                  {j.masterJustification}
                </p>
              ) : null}
              {j.lecturerChangeJustification ? (
                <p className="mt-1">
                  <strong>Lecturer change</strong>
                  <br />
                  {j.lecturerChangeJustification}
                </p>
              ) : null}
            </article>
          ))
        ) : (
          <p className="text-sm">No justifications recorded.</p>
        )}
      </section>

      <section className="co-eval-print-break">
        <h2 className="co-eval-print-h">SOURCE NOTES</h2>
        <table className="co-eval-print-table">
          <tbody>
            <tr>
              <th>Verification Status</th>
              <td>{(print.sourceNotes.verificationStatus || '—').replace(/_/g, ' ')}</td>
            </tr>
            <tr>
              <th>Source Status</th>
              <td>{(print.sourceNotes.sourceStatus || '—').replace(/_/g, ' ')}</td>
            </tr>
          </tbody>
        </table>
        {(print.assessmentStructure?.sources || []).length ? (
          <table className="co-eval-print-table mt-4">
            <thead>
              <tr>
                <th>Source</th>
                <th>Type</th>
                <th>File</th>
                <th>Section</th>
                <th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {(print.assessmentStructure?.sources || []).map((s, idx) => (
                <tr key={idx}>
                  <td>{String(s.source_id || '—')}</td>
                  <td>{String(s.source_type || '—')}</td>
                  <td>{String(s.source_file || '—')}</td>
                  <td>{String(s.source_page_section || '—')}</td>
                  <td>{String(s.verification_status || '—')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : null}
      </section>
    </div>
  );
}
