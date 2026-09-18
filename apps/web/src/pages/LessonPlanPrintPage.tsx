import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { formatISODate } from '../lib/utils';
import { AcademicPrintCover } from '../components/academic/AcademicPrintCover';

type Entry = {
  serialNo: number;
  moduleLabel: string | null;
  moduleName: string | null;
  topicName: string;
  subtopicName: string | null;
  plannedDate: string | null;
  actualDate: string | null;
  plannedHours: number;
  actualHours: number;
  status: string;
  remarks: string | null;
};

type Payload = {
  plan: {
    collegeName?: string;
    collegeLogoUrl?: string | null;
    departmentName?: string;
    programName?: string;
    semesterLabel?: string;
    sectionLabel?: string;
    courseName: string;
    courseCode: string;
    facultyName?: string;
    academicYearLabel?: string;
    status?: string;
  };
  entries: Entry[];
};

export function LessonPlanPrintPage() {
  const { id } = useParams();
  const [data, setPayload] = useState<Payload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<Payload>(`/api/lesson-plans/${id}`).then((res) => {
      setPayload(res);
      setReady(true);
    });
  }, [id]);

  if (!data) return <p className="p-8 text-ink-muted">Loading…</p>;
  const p = data.plan;

  return (
    <div className="academic-print-root mx-auto max-w-5xl bg-white p-8 text-black print:p-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          nav, aside, button, .no-print { display: none !important; }
          .academic-print-cover { page-break-after: always; }
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
      `}</style>

      <div className="no-print mb-4 flex justify-end">
        <button
          type="button"
          disabled={!ready}
          onClick={() => window.print()}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          PRINT DOCUMENT
        </button>
      </div>

      <AcademicPrintCover
        documentTitle="LESSON PLAN"
        institutionName={p.collegeName}
        logoUrl={p.collegeLogoUrl}
        departmentName={p.departmentName}
        programName={p.programName}
        subjectName={p.courseName}
        subjectCode={p.courseCode}
        schemeName={p.sectionLabel ? `Section ${p.sectionLabel}` : null}
        semesterLabel={p.semesterLabel}
        academicYearLabel={p.academicYearLabel}
        preparedBy={p.facultyName}
        status={p.status || 'ACTIVE'}
        dateLabel={new Date().toLocaleDateString('en-IN')}
      />

      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            {['Sl. No.', 'Module / Unit', 'Topic', 'Subtopic', 'Planned Date', 'Actual Date', 'Hours', 'Status', 'Remarks'].map((h) => (
              <th key={h} className="border-b border-black/30 py-2 pr-2 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.entries.map((e) => (
            <tr key={e.serialNo}>
              <td className="border-b border-black/10 py-2 pr-2">{e.serialNo}</td>
              <td className="border-b border-black/10 py-2 pr-2">
                {e.moduleLabel} {e.moduleName}
              </td>
              <td className="border-b border-black/10 py-2 pr-2">{e.topicName}</td>
              <td className="border-b border-black/10 py-2 pr-2">{e.subtopicName}</td>
              <td className="border-b border-black/10 py-2 pr-2 whitespace-nowrap">{formatISODate(e.plannedDate)}</td>
              <td className="border-b border-black/10 py-2 pr-2 whitespace-nowrap">{formatISODate(e.actualDate)}</td>
              <td className="border-b border-black/10 py-2 pr-2">{e.actualHours}</td>
              <td className="border-b border-black/10 py-2 pr-2">{e.status}</td>
              <td className="border-b border-black/10 py-2 pr-2">{e.remarks}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
