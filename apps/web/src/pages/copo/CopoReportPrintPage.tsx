import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { AcademicPrintCover } from '../../components/academic/AcademicPrintCover';
import { domainsFromType, labelForType, type AcademicMappingType } from './mappingKind';

type TargetCol = {
  id: number;
  code: string;
  shortTitle?: string | null;
  officialStatement?: string | null;
  officialTitle?: string | null;
  officialDescription?: string | null;
};

type Cell = {
  id: number;
  domain?: 'PO' | 'PSO' | 'SDG';
  courseOutcomeId: number;
  programOutcomeId?: number | null;
  programSpecificOutcomeId?: number | null;
  sdgId?: number | null;
  targetId?: number | null;
  currentValue: 1 | 2 | 3 | null;
  rationale?: string | null;
  overrideJustification?: string | null;
  mappingOrigin?: string | null;
  verificationStatus?: string | null;
};

type MatrixGroup = {
  type: 'PO' | 'PSO' | 'SDG';
  label: string;
  colSpan: number;
  targets: TargetCol[];
};

type PrintPayload = {
  mapping: {
    id: number;
    mappingType?: AcademicMappingType;
    mappingTypeLabel?: string;
    includePo?: boolean;
    includePso?: boolean;
    includeSdg?: boolean;
    status: string;
    createdAt: string;
    finalizedAt?: string | null;
    createdByName?: string;
    showAllSdgs?: boolean;
  };
  institution?: {
    collegeName?: string | null;
    logoUrl?: string | null;
    departmentName?: string | null;
  };
  context: {
    subjectName: string;
    subjectCode: string;
    schemeName?: string | null;
    academicYearLabel?: string | null;
    programName?: string | null;
    semesterLabel?: string | null;
  };
  courseOutcomes: Array<{ id: number; code: string; statement: string }>;
  programOutcomes: TargetCol[];
  programSpecificOutcomes?: TargetCol[];
  sdgs?: TargetCol[];
  relevantSdgIds?: number[];
  groups?: MatrixGroup[];
  cells: Cell[];
};

function formatDate(value?: string | null) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return value;
  }
}

function inferDomain(c: Cell): 'PO' | 'PSO' | 'SDG' {
  if (c.domain) return c.domain;
  if (c.programSpecificOutcomeId != null) return 'PSO';
  if (c.sdgId != null) return 'SDG';
  return 'PO';
}

const PRINT_STYLES = `
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  html, body { background: white !important; }
  nav, aside, header.app-shell, .no-print, button { display: none !important; }
  .academic-print-root { padding: 0 !important; max-width: none !important; }
  .academic-print-cover { page-break-after: always; break-after: page; }
  .academic-print-section { page-break-inside: avoid; }
  .academic-print-combined table { page-break-inside: auto; font-size: 0.72rem; }
  .academic-print-combined tr { page-break-inside: avoid; }
}
.academic-print-root {
  margin: 0 auto;
  max-width: 1200px;
  background: white;
  color: #111;
  padding: 2rem;
  font-family: "Source Serif 4", "Iowan Old Style", Georgia, serif;
}
.academic-print-cover {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border: 1px solid rgba(0,0,0,0.18);
  padding: 2.5rem;
}
.academic-print-cover__brand { display: flex; gap: 1rem; align-items: center; margin-bottom: 2.5rem; }
.academic-print-cover__logo { width: 72px; height: 72px; object-fit: contain; }
.academic-print-cover__logo-placeholder { width: 72px; height: 72px; border: 1px solid rgba(0,0,0,0.2); border-radius: 8px; }
.academic-print-cover__institution { font-size: 1.35rem; font-weight: 700; margin: 0; }
.academic-print-cover__dept { margin: 0.25rem 0 0; color: rgba(0,0,0,0.65); font-size: 0.95rem; }
.academic-print-cover__title { font-size: 1.75rem; margin: 0 0 2rem; letter-spacing: 0.02em; }
.academic-print-cover__meta { display: grid; grid-template-columns: 1fr 1fr; gap: 0.85rem 1.5rem; margin: 0; }
.academic-print-cover__meta dt { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: rgba(0,0,0,0.55); }
.academic-print-cover__meta dd { margin: 0.15rem 0 0; font-size: 0.98rem; font-weight: 600; }
.academic-print-section h2 {
  font-size: 1.05rem;
  margin: 1.75rem 0 0.75rem;
  border-bottom: 1px solid rgba(0,0,0,0.2);
  padding-bottom: 0.35rem;
}
.academic-print-section ol { list-style: none; padding: 0; margin: 0; }
.academic-print-section li { margin-bottom: 0.55rem; font-size: 0.92rem; line-height: 1.45; }
.academic-print-combined table { width: 100%; border-collapse: collapse; text-align: center; }
.academic-print-combined th, .academic-print-combined td {
  border: 1px solid rgba(0,0,0,0.28);
  padding: 0.28rem 0.2rem;
}
.academic-print-combined th.group { background: #f3f3f3; font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.03em; }
.academic-print-combined td.text-left, .academic-print-combined th.text-left { text-align: left; }
.academic-print-legend { font-size: 0.78rem; color: rgba(0,0,0,0.65); margin: 0.5rem 0 0.75rem; }
.academic-print-justification { font-size: 0.85rem; }
.academic-print-justification h3 { font-size: 0.95rem; margin: 1rem 0 0.35rem; }
.academic-print-justification p { margin: 0.2rem 0 0.45rem; }
.academic-print-toolbar { display: flex; justify-content: flex-end; gap: 0.75rem; margin-bottom: 1rem; }
.academic-print-toolbar button {
  border: 1px solid rgba(0,0,0,0.25);
  background: #111;
  color: white;
  padding: 0.55rem 1rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}
.academic-print-error { color: #b91c1c; padding: 2rem; }
`;

/**
 * Unified print: title page, definitions, ONE combined matrix, then justifications.
 */
export function CopoReportPrintPage() {
  const { id } = useParams();
  const [data, setData] = useState<PrintPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [logoReady, setLogoReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    setError(null);
    setReady(false);
    api<PrintPayload>(`/api/copo/academic-mappings/${id}`)
      .then((res) => {
        setData(res);
        if (!res.institution?.logoUrl) setLogoReady(true);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Could not load mapping for print');
      });
  }, [id]);

  useEffect(() => {
    if (!data) return;
    const t = window.setTimeout(() => setReady(true), 50);
    return () => window.clearTimeout(t);
  }, [data, logoReady]);

  const flags = useMemo(() => {
    if (!data) return { po: false, pso: false, sdg: false };
    if (data.mapping.mappingType) return domainsFromType(data.mapping.mappingType);
    return {
      po: Boolean(data.mapping.includePo ?? data.programOutcomes?.length),
      pso: Boolean(data.mapping.includePso ?? data.programSpecificOutcomes?.length),
      sdg: Boolean(data.mapping.includeSdg ?? data.sdgs?.length),
    };
  }, [data]);

  const groups = useMemo((): MatrixGroup[] => {
    if (!data) return [];
    if (data.groups?.length) {
      // Print always uses relevant SDGs in the primary matrix (not all 17).
      return data.groups.map((g) => {
        if (g.type !== 'SDG' || !data.mapping.showAllSdgs) return g;
        const active = new Set(
          data.cells
            .filter((c) => inferDomain(c) === 'SDG' && c.currentValue != null)
            .map((c) => Number(c.targetId ?? c.sdgId)),
        );
        const targets = active.size
          ? g.targets.filter((t) => active.has(t.id))
          : data.relevantSdgIds?.length
            ? g.targets.filter((t) => data.relevantSdgIds!.includes(t.id))
            : g.targets;
        return { ...g, targets, colSpan: targets.length };
      });
    }
    const built: MatrixGroup[] = [];
    if (flags.po && data.programOutcomes.length) {
      built.push({
        type: 'PO',
        label: 'PROGRAM OUTCOMES',
        colSpan: data.programOutcomes.length,
        targets: data.programOutcomes,
      });
    }
    if (flags.pso && (data.programSpecificOutcomes || []).length) {
      const targets = data.programSpecificOutcomes || [];
      built.push({ type: 'PSO', label: 'PROGRAM SPECIFIC OUTCOMES', colSpan: targets.length, targets });
    }
    if (flags.sdg) {
      const all = data.sdgs || [];
      const active = new Set(
        data.cells
          .filter((c) => inferDomain(c) === 'SDG' && c.currentValue != null)
          .map((c) => Number(c.targetId ?? c.sdgId)),
      );
      let targets = all;
      if (active.size) targets = all.filter((s) => active.has(s.id));
      else if (data.relevantSdgIds?.length) {
        const rel = new Set(data.relevantSdgIds);
        targets = all.filter((s) => rel.has(s.id));
      }
      if (targets.length) {
        built.push({ type: 'SDG', label: 'SUSTAINABLE DEVELOPMENT GOALS', colSpan: targets.length, targets });
      }
    }
    return built;
  }, [data, flags]);

  const flatColumns = useMemo(
    () => groups.flatMap((g) => g.targets.map((t) => ({ ...t, domain: g.type }))),
    [groups],
  );

  const cellValue = (domain: 'PO' | 'PSO' | 'SDG', coId: number, targetId: number) => {
    const item = data?.cells.find(
      (i) =>
        inferDomain(i) === domain &&
        i.courseOutcomeId === coId &&
        Number(i.targetId ?? i.programOutcomeId ?? i.programSpecificOutcomeId ?? i.sdgId) === targetId,
    );
    return item?.currentValue ?? null;
  };

  if (error) return <p className="academic-print-error">{error}</p>;
  if (!data) return <p className="p-8 text-ink-muted">Loading print document…</p>;

  const typeLabel = data.mapping.mappingTypeLabel || labelForType(data.mapping.mappingType);
  const documentTitle = `ACADEMIC MAPPING — ${typeLabel.toUpperCase()}`;
  const dateLabel = formatDate(data.mapping.finalizedAt || data.mapping.createdAt);

  const justificationsByCo = data.courseOutcomes.map((co) => {
    const rows = data.cells
      .filter((c) => c.courseOutcomeId === co.id && c.currentValue != null)
      .map((c) => {
        const domain = inferDomain(c);
        const targets =
          domain === 'PSO'
            ? data.programSpecificOutcomes || []
            : domain === 'SDG'
              ? data.sdgs || []
              : data.programOutcomes;
        const target = targets.find((t) => t.id === Number(c.targetId ?? c.programOutcomeId ?? c.programSpecificOutcomeId ?? c.sdgId));
        return { domain, target, cell: c };
      });
    return { co, rows };
  });

  return (
    <div className="academic-print-root">
      <style>{PRINT_STYLES}</style>

      <div className="academic-print-toolbar no-print">
        <button type="button" disabled={!ready} onClick={() => window.print()}>
          {ready ? 'PRINT DOCUMENT' : 'Preparing…'}
        </button>
      </div>

      <AcademicPrintCover
        documentTitle={documentTitle}
        institutionName={data.institution?.collegeName}
        logoUrl={data.institution?.logoUrl}
        departmentName={data.institution?.departmentName}
        programName={data.context.programName}
        subjectName={data.context.subjectName}
        subjectCode={data.context.subjectCode}
        schemeName={data.context.schemeName}
        semesterLabel={data.context.semesterLabel}
        academicYearLabel={data.context.academicYearLabel}
        preparedBy={data.mapping.createdByName}
        status={data.mapping.status}
        dateLabel={dateLabel}
      />

      {data.institution?.logoUrl ? (
        <img
          src={data.institution.logoUrl}
          alt=""
          className="hidden"
          onLoad={() => setLogoReady(true)}
          onError={() => setLogoReady(true)}
        />
      ) : null}

      <section className="academic-print-section">
        <h2>COURSE OUTCOMES</h2>
        <ol>
          {data.courseOutcomes.map((co) => (
            <li key={co.id}>
              <strong>{co.code}</strong> — {co.statement}
            </li>
          ))}
        </ol>
      </section>

      {flags.po ? (
        <section className="academic-print-section">
          <h2>PROGRAMME OUTCOMES</h2>
          <ol>
            {data.programOutcomes.map((col) => (
              <li key={col.id}>
                <strong>{col.code}</strong>
                {col.shortTitle ? ` — ${col.shortTitle}` : ''}
                {col.officialStatement ? ` — ${col.officialStatement}` : ''}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {flags.pso ? (
        <section className="academic-print-section">
          <h2>PROGRAM SPECIFIC OUTCOMES</h2>
          <ol>
            {(data.programSpecificOutcomes || []).map((col) => (
              <li key={col.id}>
                <strong>{col.code}</strong>
                {col.shortTitle ? ` — ${col.shortTitle}` : ''}
                {col.officialStatement ? ` — ${col.officialStatement}` : ''}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {flags.sdg ? (
        <section className="academic-print-section">
          <h2>RELEVANT SUSTAINABLE DEVELOPMENT GOALS</h2>
          <ol>
            {(groups.find((g) => g.type === 'SDG')?.targets || []).map((col) => (
              <li key={col.id}>
                <strong>{col.code}</strong>
                {col.shortTitle || col.officialTitle ? ` — ${col.shortTitle || col.officialTitle}` : ''}
                {col.officialStatement || col.officialDescription
                  ? ` — ${col.officialStatement || col.officialDescription}`
                  : ''}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="academic-print-section academic-print-combined">
        <h2>COMBINED ACADEMIC MAPPING MATRIX</h2>
        <p className="academic-print-legend">
          PO / PSO: 3 High · 2 Medium · 1 Low · — No Mapping
          {flags.sdg ? ' · SDG: 3 Strong · 2 Moderate · 1 Low · — No Mapping' : ''}
        </p>
        <table>
          <thead>
            <tr>
              <th rowSpan={2} className="text-left">
                CO
              </th>
              {groups.map((g) => (
                <th key={g.type} className="group" colSpan={g.colSpan}>
                  {g.label}
                </th>
              ))}
            </tr>
            <tr>
              {flatColumns.map((col) => (
                <th key={`${col.domain}-${col.id}`}>{col.code}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.courseOutcomes.map((co) => (
              <tr key={co.id}>
                <td className="text-left">
                  <strong>{co.code}</strong>
                </td>
                {flatColumns.map((col) => {
                  const v = cellValue(col.domain, co.id, col.id);
                  return <td key={`${col.domain}-${col.id}`}>{v ?? '—'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="academic-print-section academic-print-justification">
        <h2>MAPPING JUSTIFICATIONS</h2>
        {justificationsByCo.map(({ co, rows }) =>
          rows.length ? (
            <div key={co.id}>
              <h3>{co.code}</h3>
              {rows.map(({ domain, target, cell }) => (
                <p key={cell.id}>
                  <strong>
                    {target?.code || domain} — {cell.currentValue}
                  </strong>
                  <br />
                  {cell.rationale || 'Justification not available in master data.'}
                  {cell.overrideJustification ? (
                    <>
                      <br />
                      Change note: {cell.overrideJustification}
                    </>
                  ) : null}
                  {domain === 'SDG' && (cell.mappingOrigin || cell.verificationStatus) ? (
                    <>
                      <br />
                      {[cell.mappingOrigin, cell.verificationStatus].filter(Boolean).join(' · ')}
                    </>
                  ) : null}
                </p>
              ))}
            </div>
          ) : null,
        )}
      </section>
    </div>
  );
}
