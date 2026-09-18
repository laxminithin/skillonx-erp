import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';

type Derived = { pos?: Array<{ code: string } | string>; psos?: Array<{ code: string } | string>; sdgs?: Array<{ code: string } | string> };

function codes(list?: Array<{ code: string } | string>) {
  return (list || []).map((x) => (typeof x === 'string' ? x : x.code)).join(', ');
}

type Item = {
  questionNumber: number;
  subLetter?: string | null;
  questionText: string;
  maxMarks: number;
  moduleOrUnit?: string | null;
  primaryCo?: string | null;
  bloomLevel?: string | null;
  rbtLevel?: string | null;
  orGroupId?: string | null;
  orAlternative?: string | null;
  isOrChoice?: boolean;
  derivedOutcomes?: Derived;
  scheme?: Array<{ label: string; maxMarks: number }>;
  modelAnswer?: string | null;
  expectedKeyPoints?: string | null;
};

type PrintModel = {
  variant?: string;
  paper: {
    collegeName?: string | null;
    departmentName?: string | null;
    academicYearLabel?: string | null;
    subjectName: string;
    courseCode: string;
    programName?: string | null;
    semesterLabel?: string | null;
    examType: string;
    examTypeLabel?: string | null;
    examDate?: string | null;
    durationMinutes?: number | null;
    maxMarks: number;
    requiredAnswerMarks?: number;
    instructions?: string | null;
    facultyName?: string | null;
    title: string;
  };
  items: Item[];
  academicProvenance?: Array<{
    questionLabel: string;
    questionSource: string;
    marksSource: string;
    co: string | null;
    poPso: string | null;
    solutionSource: string | null;
    schemeSource: string | null;
  }>;
  blueprint?: { coTargets?: Array<{ coCode: string; marks: number }> } | null;
};

function rbtOf(it: Item) {
  return it.rbtLevel || it.bloomLevel || '';
}

export function InternalPaperPrintPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const variant = (params.get('variant') || 'PAPER').toUpperCase();
  const [print, setPrint] = useState<PrintModel | null>(null);

  useEffect(() => {
    api<{ print: PrintModel }>(`/api/question-papers/internal/${id}/print-model?variant=${variant}`).then((r) => setPrint(r.print));
  }, [id, variant]);

  const groups = useMemo(() => {
    if (!print) return [];
    const byQ = new Map<number, Item[]>();
    for (const it of print.items) {
      const list = byQ.get(it.questionNumber) ?? [];
      list.push(it);
      byQ.set(it.questionNumber, list);
    }
    return [...byQ.entries()].sort((a, b) => a[0] - b[0]);
  }, [print]);

  if (!print) return <p className="p-8 text-ink-muted">Loading…</p>;
  const p = print.paper;
  const hours = p.durationMinutes ? `${(p.durationMinutes / 60).toFixed(p.durationMinutes % 60 ? 1 : 0)} Hour(s)` : '—';
  const cos = [...new Map(print.items.filter((i) => i.primaryCo).map((i) => [i.primaryCo, i.primaryCo])).keys()];

  return (
    <div className="mx-auto max-w-[860px] bg-white p-8 text-black print:p-0">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          nav, aside, button, .no-print { display: none !important; }
        }
        table.qp { width:100%; border-collapse:collapse; font-size:12px; }
        table.qp th, table.qp td { border:1px solid #222; padding:6px 8px; vertical-align:top; }
        table.qp th { background:#f4f4f4; text-align:left; }
      `}</style>
      <div className="no-print mb-4 flex flex-wrap gap-2">
        <button type="button" className="rounded border px-3 py-1.5 text-sm" onClick={() => window.print()}>
          Print / PDF
        </button>
        <a className="rounded border px-3 py-1.5 text-sm" href={`?variant=PAPER`}>
          Question paper
        </a>
        <a className="rounded border px-3 py-1.5 text-sm" href={`?variant=SCHEME`}>
          Scheme of evaluation
        </a>
        <a className="rounded border px-3 py-1.5 text-sm" href={`?variant=SOLUTION`}>
          Model solution
        </a>
        <a className="rounded border px-3 py-1.5 text-sm" href={`?variant=MAPPING`}>
          CO mapping
        </a>
        <a className="rounded border px-3 py-1.5 text-sm" href={`?variant=FACULTY`}>
          Faculty copy
        </a>
        <a className="rounded border px-3 py-1.5 text-sm" href={`?variant=PROVENANCE`}>
          Academic provenance
        </a>
      </div>

      <header className="mb-5 border-b-2 border-black pb-3 text-center">
        <p className="text-lg font-semibold uppercase tracking-wide">{p.collegeName || 'Institution'}</p>
        <p className="text-sm">{p.departmentName}</p>
        <p className="mt-2 text-base font-semibold">
          {p.examTypeLabel || p.examType} {variant === 'SCHEME' ? '— Scheme of Evaluation' : variant === 'SOLUTION' ? '— Model Solution' : variant === 'PROVENANCE' ? '— Academic Provenance' : ''}
        </p>
        <p className="text-sm">{p.academicYearLabel}</p>
      </header>

      <table className="qp mb-4">
        <tbody>
          <tr>
            <td><strong>Subject</strong></td>
            <td>{p.subjectName}</td>
            <td><strong>Subject Code</strong></td>
            <td>{p.courseCode}</td>
          </tr>
          <tr>
            <td><strong>Branch / Programme</strong></td>
            <td>{p.programName || '—'}</td>
            <td><strong>Semester</strong></td>
            <td>{p.semesterLabel || '—'}</td>
          </tr>
          <tr>
            <td><strong>Date</strong></td>
            <td>{p.examDate || '___________'}</td>
            <td><strong>Time</strong></td>
            <td>{hours}</td>
          </tr>
          <tr>
            <td><strong>Maximum Marks</strong></td>
            <td colSpan={3}>{p.requiredAnswerMarks || p.maxMarks}</td>
          </tr>
        </tbody>
      </table>

      {p.instructions ? (
        <p className="mb-4 text-sm">
          <strong>Note:</strong> {p.instructions}
        </p>
      ) : null}

      {variant === 'PROVENANCE' ? (
        <table className="qp">
          <thead>
            <tr>
              <th>Q</th>
              <th>Question source</th>
              <th>Marks source</th>
              <th>CO</th>
              <th>PO/PSO</th>
              <th>Solution source</th>
              <th>Scheme</th>
            </tr>
          </thead>
          <tbody>
            {(print.academicProvenance || []).map((row) => (
              <tr key={row.questionLabel}>
                <td>{row.questionLabel}</td>
                <td>{row.questionSource}</td>
                <td>{row.marksSource}</td>
                <td>{row.co}</td>
                <td>{row.poPso}</td>
                <td>{row.solutionSource}</td>
                <td>{row.schemeSource}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : variant === 'MAPPING' || variant === 'FACULTY' ? (
        <table className="qp">
          <thead>
            <tr>
              <th>Q.No</th>
              <th>Questions</th>
              <th>Marks</th>
              <th>RBT</th>
              <th>CO</th>
              <th>PO</th>
              <th>PSO</th>
            </tr>
          </thead>
          <tbody>
            {print.items.map((it) => {
              const d = it.derivedOutcomes || {};
              return (
                <tr key={`${it.questionNumber}-${it.subLetter}-${it.orAlternative}`}>
                  <td>
                    {it.questionNumber}
                    {it.subLetter || ''}
                    {it.orAlternative === 'B' ? ' OR' : ''}
                  </td>
                  <td>{it.questionText}</td>
                  <td>{it.maxMarks}</td>
                  <td>{rbtOf(it)}</td>
                  <td>{it.primaryCo}</td>
                  <td>{codes(d.pos)}</td>
                  <td>{codes(d.psos)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <table className="qp">
          <thead>
            <tr>
              <th style={{ width: '8%' }}>Q.No</th>
              <th>Questions</th>
              <th style={{ width: '8%' }}>Marks</th>
              {variant === 'PAPER' ? (
                <>
                  <th style={{ width: '7%' }}>RBT</th>
                  <th style={{ width: '7%' }}>CO</th>
                  <th style={{ width: '8%' }}>PO</th>
                  <th style={{ width: '8%' }}>PSO</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody>
            {groups.map(([num, parts]) => {
              const main = parts.filter((x) => x.orAlternative !== 'B');
              const alt = parts.filter((x) => x.orAlternative === 'B');
              return (
                <QuestionBlock
                  key={num}
                  number={num}
                  parts={main}
                  orParts={alt}
                  variant={variant}
                />
              );
            })}
          </tbody>
        </table>
      )}

      {variant === 'PAPER' && cos.length ? (
        <section className="mt-6 text-sm">
          <p className="font-semibold">Course Outcomes</p>
          <p className="mt-1 text-xs">COs assessed in this paper: {cos.join(', ')}</p>
        </section>
      ) : null}

      {variant === 'FACULTY' ? <p className="mt-6 text-xs">Prepared by {p.facultyName || 'Faculty'}</p> : null}
    </div>
  );
}

function QuestionBlock({
  number,
  parts,
  orParts,
  variant,
}: {
  number: number;
  parts: Item[];
  orParts: Item[];
  variant: string;
}) {
  const render = (list: Item[], or: boolean) =>
    list.map((it, idx) => {
      const d = it.derivedOutcomes || {};
      return (
        <tr key={`${number}-${it.subLetter}-${it.orAlternative}-${idx}`}>
          <td>
            {idx === 0 && !or ? number : ''}
            {or && idx === 0 ? 'OR' : ''}
            {it.subLetter ? ` ${it.subLetter})` : ''}
          </td>
          <td>
            <p>{it.questionText}</p>
            {variant === 'SCHEME' && it.scheme?.length ? (
              <ul className="mt-2 list-disc pl-4 text-xs">
                {it.scheme.map((s, i) => (
                  <li key={i}>
                    {s.label} — {s.maxMarks}
                  </li>
                ))}
              </ul>
            ) : null}
            {variant === 'SOLUTION' ? (
              <div className="mt-2 whitespace-pre-wrap text-xs italic">
                {it.modelAnswer || 'Model solution to be completed.'}
                {it.expectedKeyPoints ? `\nKey points: ${it.expectedKeyPoints}` : ''}
              </div>
            ) : null}
          </td>
          <td>{it.maxMarks}</td>
          {variant === 'PAPER' ? (
            <>
              <td>{rbtOf(it)}</td>
              <td>{it.primaryCo}</td>
              <td>{codes(d.pos)}</td>
              <td>{codes(d.psos)}</td>
            </>
          ) : null}
        </tr>
      );
    });

  return (
    <>
      {render(parts, false)}
      {orParts.length ? render(orParts, true) : null}
    </>
  );
}
