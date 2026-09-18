import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { AcademicPrintCover } from '../../components/academic/AcademicPrintCover';

type PrintModel = {
  cover: {
    documentTitle: string;
    documentSubtitle?: string;
    collegeName?: string | null;
    logoUrl?: string | null;
    departmentName?: string | null;
    programName?: string | null;
    subjectName: string;
    courseCode: string;
    schemeLabel?: string | null;
    semesterLabel?: string | null;
    academicYearLabel?: string | null;
    preparedBy?: string | null;
  };
  summary: {
    totalItems: number;
    delivered: number;
    assessed: number;
    completed: number;
    plannedHours: number;
    actualHours: number;
  };
  items: Array<{
    serialNo: number;
    cbsId: string;
    title: string;
    contentDescription?: string | null;
    originLabel: string;
    relatedGapId?: string | null;
    rationale?: string | null;
    expectedBenefit?: string | null;
    moduleUnit?: string | null;
    primaryCo?: string | null;
    deliveryMethod?: string | null;
    plannedHours?: number | null;
    actualHours?: number | null;
    actualDate?: string | null;
    assessmentType?: string | null;
    status: string;
    actualOutcome?: string | null;
    outcomes: Array<{ outcomeType: string; outcomeCode: string; strength: number }>;
    evidence: Array<{ evidenceType: string; title: string }>;
  }>;
  evidence: Array<{ itemId?: number | null; evidenceType: string; title: string; uploadedAt?: string }>;
  meta: { status?: string | null };
};

export function BeyondSyllabusPrintPage() {
  const { id } = useParams();
  const [print, setPrint] = useState<PrintModel | null>(null);

  useEffect(() => {
    api<{ print: PrintModel }>(`/api/beyond-syllabus/${id}/print-model`).then((res) => setPrint(res.print));
  }, [id]);

  if (!print) return <p className="p-8 text-ink-muted">Loading…</p>;

  return (
    <div className="academic-print-root mx-auto max-w-5xl bg-white p-8 text-black print:p-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          nav, aside, button, .no-print { display: none !important; }
          .academic-print-cover { page-break-after: always; }
          .cbs-print-break { page-break-before: always; }
        }
        table.cbs-print-table { width:100%; border-collapse:collapse; font-size:11px; }
        table.cbs-print-table th, table.cbs-print-table td { border:1px solid rgba(0,0,0,.2); padding:6px 8px; vertical-align:top; }
        table.cbs-print-table th { background:#f5f5f5; text-align:left; }
        h2.cbs-print-h { font-size:1.1rem; margin:1.5rem 0 .75rem; }
      `}</style>

      <div className="no-print mb-4 flex justify-end">
        <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={() => window.print()}>
          Print
        </button>
      </div>

      <AcademicPrintCover
        documentTitle={`${print.cover.documentTitle}${print.cover.documentSubtitle ? `\n${print.cover.documentSubtitle}` : ''}`}
        institutionName={print.cover.collegeName}
        logoUrl={print.cover.logoUrl}
        departmentName={print.cover.departmentName}
        programName={print.cover.programName}
        subjectName={print.cover.subjectName}
        subjectCode={print.cover.courseCode}
        schemeName={print.cover.schemeLabel}
        semesterLabel={print.cover.semesterLabel}
        academicYearLabel={print.cover.academicYearLabel}
        preparedBy={print.cover.preparedBy}
        status={print.meta.status}
      />

      <section className="cbs-print-break">
        <h2 className="cbs-print-h">CONTENT BEYOND SYLLABUS</h2>
        <p>
          {print.cover.subjectName} · {print.cover.courseCode} · {print.cover.academicYearLabel}
        </p>

        <h2 className="cbs-print-h">SUMMARY</h2>
        <table className="cbs-print-table">
          <tbody>
            <tr>
              <td>Total Items</td>
              <td>{print.summary.totalItems}</td>
              <td>Delivered</td>
              <td>{print.summary.delivered}</td>
            </tr>
            <tr>
              <td>Assessed</td>
              <td>{print.summary.assessed}</td>
              <td>Completed</td>
              <td>{print.summary.completed}</td>
            </tr>
            <tr>
              <td>Planned Hours</td>
              <td>{print.summary.plannedHours}</td>
              <td>Actual Hours</td>
              <td>{print.summary.actualHours}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="cbs-print-h">BEYOND-SYLLABUS PLAN</h2>
        <table className="cbs-print-table">
          <thead>
            <tr>
              <th>Sl No</th>
              <th>Module</th>
              <th>Beyond-Syllabus Content</th>
              <th>Origin / Gap</th>
              <th>Rationale</th>
              <th>CO</th>
              <th>Delivery</th>
              <th>Hours</th>
              <th>Assessment</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {print.items.map((item) => (
              <tr key={item.cbsId}>
                <td>{item.serialNo}</td>
                <td>{item.moduleUnit || '—'}</td>
                <td>{item.title}</td>
                <td>
                  {item.originLabel}
                  {item.relatedGapId ? ` / ${item.relatedGapId}` : ''}
                </td>
                <td>{item.rationale || '—'}</td>
                <td>{item.primaryCo || '—'}</td>
                <td>{(item.deliveryMethod || '—').replace(/_/g, ' ')}</td>
                <td>{item.actualHours ?? item.plannedHours ?? '—'}</td>
                <td>{item.assessmentType || '—'}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="cbs-print-break">
        <h2 className="cbs-print-h">CONTENT DETAILS</h2>
        {print.items.map((item) => (
          <div key={item.cbsId} style={{ marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1rem', margin: '0 0 .35rem' }}>
              {item.cbsId} — {item.title}
            </h3>
            <p style={{ margin: '0 0 .35rem', fontSize: 12 }}>{item.contentDescription}</p>
            <p style={{ margin: '0 0 .25rem', fontSize: 12 }}>
              <strong>Rationale:</strong> {item.rationale || '—'}
            </p>
            <p style={{ margin: '0 0 .25rem', fontSize: 12 }}>
              <strong>Expected Benefit:</strong> {item.expectedBenefit || '—'}
            </p>
            <p style={{ margin: '0 0 .25rem', fontSize: 12 }}>
              <strong>Related Gap:</strong> {item.relatedGapId || '—'}
            </p>
            <p style={{ margin: '0 0 .25rem', fontSize: 12 }}>
              <strong>CO / Traceability:</strong> {item.primaryCo || '—'}
              {item.outcomes.length
                ? ` → ${item.outcomes.map((o) => `${o.outcomeCode} (${o.strength})`).join(', ')}`
                : ''}
            </p>
            <p style={{ margin: '0 0 .25rem', fontSize: 12 }}>
              <strong>Delivery:</strong> {(item.deliveryMethod || '—').replace(/_/g, ' ')}
              {item.actualDate ? ` · ${item.actualDate}` : ''} · {item.actualHours ?? item.plannedHours ?? '—'} h
            </p>
            <p style={{ margin: '0 0 .25rem', fontSize: 12 }}>
              <strong>Assessment:</strong> {item.assessmentType || 'NONE'}
            </p>
            <p style={{ margin: '0 0 .25rem', fontSize: 12 }}>
              <strong>Outcome:</strong> {item.actualOutcome || '—'}
            </p>
            <p style={{ margin: 0, fontSize: 12 }}>
              <strong>Evidence:</strong>{' '}
              {item.evidence.length ? item.evidence.map((e) => e.title).join('; ') : '—'}
            </p>
          </div>
        ))}
      </section>

      <section className="cbs-print-break">
        <h2 className="cbs-print-h">EVIDENCE INDEX</h2>
        <table className="cbs-print-table">
          <thead>
            <tr>
              <th>Sl No</th>
              <th>CBS ID</th>
              <th>Evidence Type</th>
              <th>Title</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {print.evidence.map((e, idx) => {
              const item = print.items.find((i) => i.evidence.some((x) => x.title === e.title));
              return (
                <tr key={`${e.title}-${idx}`}>
                  <td>{idx + 1}</td>
                  <td>{item?.cbsId || '—'}</td>
                  <td>{e.evidenceType}</td>
                  <td>{e.title}</td>
                  <td>{e.uploadedAt ? new Date(e.uploadedAt).toLocaleDateString() : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
