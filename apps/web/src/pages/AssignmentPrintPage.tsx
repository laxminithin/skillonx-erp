import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { getAssignmentPrintModel } from '../lib/api';
import { AcademicPrintCover } from '../components/academic/AcademicPrintCover';
import { formatDate } from '../lib/utils';
import {
  PRINT_MODES,
  schemeFromQuestion,
  type AssignmentPrintMode,
  type AssignmentPrintModel,
  type EvaluationScheme,
} from '../types/assignment';

const MODE_TITLES: Record<AssignmentPrintMode, string> = {
  ASSIGNMENT: 'ASSIGNMENT',
  EVALUATION_SCHEME: 'EVALUATION SCHEME',
  MODEL_SOLUTION: 'MODEL SOLUTION',
  FACULTY_COPY: 'FACULTY COPY',
};

export function AssignmentPrintPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const modeParam = (params.get('mode') || 'ASSIGNMENT').toUpperCase();
  const mode = (PRINT_MODES.includes(modeParam as AssignmentPrintMode)
    ? modeParam
    : 'ASSIGNMENT') as AssignmentPrintMode;
  const [model, setModel] = useState<AssignmentPrintModel | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getAssignmentPrintModel(id!)
      .then((d) => {
        setModel(d.printModel as AssignmentPrintModel);
        setReady(true);
      })
      .catch(console.error);
  }, [id]);

  const documentTitle = useMemo(() => MODE_TITLES[mode], [mode]);

  if (!model) return <p className="p-8 text-ink-muted">Loading…</p>;

  const showScheme = mode === 'EVALUATION_SCHEME' || mode === 'FACULTY_COPY';
  const showSolution = mode === 'MODEL_SOLUTION' || mode === 'FACULTY_COPY';
  const studentSafe = mode === 'ASSIGNMENT';

  return (
    <div className="academic-print-root mx-auto max-w-5xl bg-white p-8 text-black print:p-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          nav, aside, button, .no-print { display: none !important; }
          .academic-print-cover { page-break-after: always; }
          .print-q { page-break-inside: avoid; }
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

      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {PRINT_MODES.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setParams({ mode: m })}
              className={`rounded px-3 py-1.5 text-xs font-medium ${
                mode === m ? 'bg-black text-white' : 'border border-black/20'
              }`}
            >
              {MODE_TITLES[m]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Link to={`/assignments/${id}`} className="rounded border border-black/20 px-3 py-1.5 text-sm">
            Back
          </Link>
          <button
            type="button"
            disabled={!ready}
            onClick={() => window.print()}
            className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            PRINT DOCUMENT
          </button>
        </div>
      </div>

      <AcademicPrintCover
        documentTitle={documentTitle}
        departmentName={model.departmentName}
        subjectName={model.courseName || 'Subject'}
        subjectCode={model.courseCode || '—'}
        schemeName={model.moduleName}
        semesterLabel={model.semesterLabel}
        academicYearLabel={model.academicYearLabel}
        status={studentSafe ? 'Student copy' : mode.replace(/_/g, ' ')}
        dateLabel={new Date().toLocaleDateString('en-IN')}
      />

      <header className="mb-6">
        <h2 className="text-xl font-semibold">{model.title}</h2>
        {model.assignmentNumber ? (
          <p className="text-sm text-black/70">Assignment No. {model.assignmentNumber}</p>
        ) : null}
        <p className="mt-1 text-sm text-black/70">
          Total marks: {model.totalMarks}
          {model.dueAt ? ` · Due ${formatDate(String(model.dueAt))}` : ''}
          {model.passPercentage != null ? ` · Pass ${model.passPercentage}%` : ''}
        </p>
        {model.instructions ? (
          <p className="mt-3 whitespace-pre-wrap text-sm">{model.instructions}</p>
        ) : null}
      </header>

      <ol className="space-y-6">
        {model.questions.map((q) => {
          const scheme = (q.evaluationScheme ||
            schemeFromQuestion({ evaluationScheme: q.evaluationScheme })) as EvaluationScheme | null;
          return (
            <li key={q.number} className="print-q">
              <p className="font-semibold">
                Q{q.number}. ({q.marks} marks)
                {!studentSafe && q.primaryCoCode ? (
                  <span className="ml-2 text-sm font-normal text-black/60">{q.primaryCoCode}</span>
                ) : null}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{q.questionText}</p>
              {studentSafe ? (
                <div className="mt-3 min-h-[4.5rem] border border-dashed border-black/25" aria-hidden />
              ) : null}
              {showScheme && scheme?.criteria?.length ? (
                <div className="mt-3 text-sm">
                  <p className="font-medium">Evaluation scheme</p>
                  <ul className="mt-1 list-disc pl-5">
                    {scheme.criteria.map((c) => (
                      <li key={c.id}>
                        {c.label} — {c.maxMarks} marks
                        {c.guidance ? <span className="text-black/60"> ({c.guidance})</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {showSolution && q.modelSolution ? (
                <div className="mt-3 text-sm">
                  <p className="font-medium">Model solution</p>
                  <pre className="mt-1 whitespace-pre-wrap font-sans text-black/80">{q.modelSolution}</pre>
                </div>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
