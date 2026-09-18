import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { AcademicPrintCover } from '../../components/academic/AcademicPrintCover';
import { Button } from '../../components/ui';

type PrintModel = {
  documentTitle: string;
  institutionPolicy: string;
  formulaVersion: string;
  courseName: string;
  courseCode: string;
  programName?: string | null;
  academicYearLabel?: string | null;
  semesterLabel?: string | null;
  facultyName?: string | null;
  seeMethod?: string | null;
  seeEstimated?: boolean;
  cos: Array<{ coCode: string; statement: string | null; target: number | null; cie: number | null; see: number | null; direct: number | null; indirect: number | null; final: number | null; gap: number | null; status: string }>;
  po: Array<{ poCode: string; target: number | null; attainment: number | null; gap: number | null; status: string }>;
  nba?: { rows?: Array<Record<string, unknown>> } | null;
};

export function AttainmentPrintPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const kind = params.get('kind') || 'CO ATTAINMENT REPORT';
  const [model, setModel] = useState<PrintModel | null>(null);

  useEffect(() => {
    api<{ documentTitle: string } & PrintModel>(`/api/attainment/runs/${id}/print-model?kind=${encodeURIComponent(kind)}`).then(setModel);
  }, [id, kind]);

  if (!model) return <p className="p-6">Loading…</p>;

  return (
    <div className="academic-print-page mx-auto max-w-4xl bg-white p-8 text-black">
      <style>{`
        @media print { .no-print { display: none !important; } }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: left; }
      `}</style>
      <div className="no-print mb-4">
        <Button onClick={() => window.print()}>Print</Button>
      </div>
      <AcademicPrintCover
        documentTitle={model.documentTitle}
        subjectName={model.courseName}
        subjectCode={model.courseCode}
        programName={model.programName}
        academicYearLabel={model.academicYearLabel}
        semesterLabel={model.semesterLabel}
        preparedBy={model.facultyName}
      />
      <p className="mt-4 text-sm">
        Methodology: {model.institutionPolicy} · Formula {model.formulaVersion}
        {model.seeMethod ? ` · SEE ${model.seeMethod}${model.seeEstimated ? ' (estimated)' : ''}` : ''}
      </p>
      <h2 className="mt-6 text-base font-semibold">CO attainment</h2>
      <table className="mt-2">
        <thead>
          <tr>
            <th>CO</th>
            <th>Target</th>
            <th>CIE</th>
            <th>SEE</th>
            <th>Direct</th>
            <th>Indirect</th>
            <th>Final</th>
            <th>Gap</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {model.cos.map((c) => (
            <tr key={c.coCode}>
              <td>{c.coCode}</td>
              <td>{c.target}</td>
              <td>{c.cie}</td>
              <td>{c.see}</td>
              <td>{c.direct}</td>
              <td>{c.indirect}</td>
              <td>{c.final}</td>
              <td>{c.gap}</td>
              <td>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {model.po?.length ? (
        <>
          <h2 className="mt-6 text-base font-semibold">PO attainment</h2>
          <table className="mt-2">
            <thead>
              <tr>
                <th>PO</th>
                <th>Target</th>
                <th>Attainment</th>
                <th>Gap</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {model.po.map((p) => (
                <tr key={p.poCode}>
                  <td>{p.poCode}</td>
                  <td>{p.target}</td>
                  <td>{p.attainment}</td>
                  <td>{p.gap}</td>
                  <td>{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
      {model.nba?.rows?.length ? (
        <>
          <h2 className="mt-6 text-base font-semibold">Continuous improvement</h2>
          <table className="mt-2">
            <thead>
              <tr>
                {Object.keys(model.nba.rows[0] || {})
                  .filter((k) => k !== 'cycleId')
                  .map((k) => (
                    <th key={k}>{k}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {model.nba.rows.map((row, i) => (
                <tr key={i}>
                  {Object.entries(row)
                    .filter(([k]) => k !== 'cycleId')
                    .map(([k, v]) => (
                      <td key={k}>{v == null ? '—' : String(v)}</td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : null}
    </div>
  );
}
