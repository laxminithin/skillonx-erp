import ExcelJS from 'exceljs';
import { sanitizeFilename } from '../../utils/filename.js';
import { AppError } from '../../utils/errors.js';
import { CORRELATION_LABELS } from './types.js';
import { getUnifiedWorkspace, getWorkspaceByVersion, programCoverage, bloomsDistribution } from './mappingService.js';
import * as analytics from './analytics.js';
function strengthLabel(value) {
    if (value == null)
        return '–';
    return `${value} — ${CORRELATION_LABELS[value] ?? ''}`.trim();
}
export async function exportMappingWorkbook(actor, versionId, kind = 'all') {
    const data = await getWorkspaceByVersion(actor, versionId);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SkillonX Academic Portal';
    if (kind === 'matrix' || kind === 'all') {
        const sheet = wb.addWorksheet('CO-PO Matrix');
        sheet.addRow(['Institution CO–PO Mapping']);
        sheet.addRow(['Subject', `${data.course.code} — ${data.course.name}`]);
        sheet.addRow(['Scheme', data.course.schemeName || 'Official Data Pending']);
        sheet.addRow(['Program', data.program?.name || '—']);
        sheet.addRow(['Academic Year', data.academicYear?.label || '—']);
        sheet.addRow(['Version', data.mapping.versionNumber]);
        sheet.addRow(['Status', data.mapping.status]);
        sheet.addRow([]);
        sheet.addRow(['Mapping scale', '3 = High', '2 = Moderate', '1 = Low', '– = No correlation']);
        sheet.addRow([]);
        const header = ['CO', 'Statement', 'Bloom’s', ...data.programOutcomes.map((p) => p.code)];
        sheet.addRow(header);
        for (const co of data.courseOutcomes) {
            sheet.addRow([
                co.code,
                co.statement,
                co.bloomsLabel || '—',
                ...data.programOutcomes.map((po) => {
                    const item = data.items.find((i) => i.courseOutcomeId === co.id && i.programOutcomeId === po.id);
                    return item?.strength ?? '–';
                }),
            ]);
        }
        sheet.addRow([]);
        sheet.addRow(['Programme Outcomes']);
        for (const po of data.programOutcomes) {
            sheet.addRow([po.code, po.shortTitle || '', po.officialTextPending ? 'Official Data Pending' : po.officialStatement || '']);
        }
        sheet.columns = header.map((_, i) => ({ width: i === 1 ? 70 : 18 }));
    }
    if (kind === 'justification' || kind === 'all') {
        const sheet = wb.addWorksheet('Justifications');
        sheet.addRow(['CO', 'PO', 'Correlation', 'Justification', 'Status']);
        for (const co of data.courseOutcomes) {
            for (const po of data.programOutcomes) {
                const item = data.items.find((i) => i.courseOutcomeId === co.id && i.programOutcomeId === po.id);
                if (!item?.strength)
                    continue;
                sheet.addRow([
                    co.code,
                    po.code,
                    strengthLabel(item.strength),
                    item.justification || '',
                    item.justification ? 'Complete' : 'Missing',
                ]);
            }
        }
        sheet.columns = [{ width: 10 }, { width: 10 }, { width: 24 }, { width: 80 }, { width: 14 }];
    }
    const body = Buffer.from(await wb.xlsx.writeBuffer());
    return {
        filename: `${sanitizeFilename(`${data.course.name}-CO-PO-Mapping`)}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body,
    };
}
export async function exportCoverageWorkbook(actor, schemeId, programId, academicYearId) {
    const data = await programCoverage(actor, schemeId, programId, academicYearId);
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('PO Coverage');
    sheet.addRow(['PO', 'Title', 'Subjects contributing', 'High', 'Moderate', 'Low']);
    for (const row of data.rows) {
        sheet.addRow([
            row.po.code,
            row.po.shortTitle || (row.po.officialTextPending ? 'Official Data Pending' : ''),
            row.subjectsContributing,
            row.high,
            row.moderate,
            row.low,
        ]);
    }
    const detail = wb.addWorksheet('Drilldown');
    detail.addRow(['PO', 'Semester', 'Subject', 'CO', 'Strength', 'Justification']);
    for (const row of data.rows) {
        for (const d of row.drilldown) {
            detail.addRow([row.po.code, d.semesterLabel, `${d.subjectCode} ${d.subjectName}`, d.coCode, d.strength, d.justification || '']);
        }
    }
    const body = Buffer.from(await wb.xlsx.writeBuffer());
    return {
        filename: `${sanitizeFilename('PO-Coverage')}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body,
    };
}
export async function exportBloomsWorkbook(collegeId, schemeId, semesterId) {
    const data = await bloomsDistribution(collegeId, { schemeId, semesterId });
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('Bloom Distribution');
    sheet.addRow(['Subject', 'Code', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'Not specified']);
    for (const course of data.courses) {
        sheet.addRow([
            course.name,
            course.code,
            course.levels.L1 || 0,
            course.levels.L2 || 0,
            course.levels.L3 || 0,
            course.levels.L4 || 0,
            course.levels.L5 || 0,
            course.levels.L6 || 0,
            course.levels.UNSET || 0,
        ]);
    }
    const body = Buffer.from(await wb.xlsx.writeBuffer());
    return {
        filename: `${sanitizeFilename('Blooms-Taxonomy-Distribution')}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body,
    };
}
export async function reportPayload(actor, versionId) {
    return getWorkspaceByVersion(actor, versionId);
}
function matrixSheet(wb, title, data, columns, targetOf) {
    const sheet = wb.addWorksheet(title);
    sheet.addRow([title]);
    sheet.addRow(['Subject', `${data.course.code} — ${data.course.name}`]);
    sheet.addRow(['Scheme', data.course.schemeName || 'Official Data Pending']);
    sheet.addRow(['Program', data.program?.name || '—']);
    sheet.addRow(['Academic Year', data.academicYear?.label || '—']);
    sheet.addRow(['Version', data.mapping.versionNumber]);
    sheet.addRow(['Status', data.mapping.status]);
    sheet.addRow(['Note', 'Alignment mapping — not attainment']);
    sheet.addRow([]);
    sheet.addRow(['Mapping scale', '3 = High', '2 = Moderate', '1 = Low', '– = No correlation']);
    sheet.addRow([]);
    const header = ['CO', 'Statement', 'Bloom’s', ...columns.map((c) => c.code)];
    sheet.addRow(header);
    for (const co of data.courseOutcomes) {
        sheet.addRow([
            co.code,
            co.statement,
            co.bloomsLabel || '—',
            ...columns.map((col) => {
                const item = data.items.find((i) => i.courseOutcomeId === co.id && targetOf(i) === col.id);
                return item?.strength ?? '–';
            }),
        ]);
    }
    const just = wb.addWorksheet('Justifications');
    just.addRow(['CO', 'Target', 'Correlation', 'Justification']);
    for (const item of data.items.filter((i) => i.strength)) {
        const co = data.courseOutcomes.find((c) => c.id === item.courseOutcomeId);
        const col = columns.find((c) => c.id === targetOf(item));
        just.addRow([co?.code, col?.code, strengthLabel(item.strength), item.justification || '']);
    }
}
export async function exportKindWorkbook(actor, versionId) {
    // Prefer operational instance (faculty-owned auth + snapshot cells) when applicable.
    let operational = null;
    try {
        const instances = await import('./instanceService.js');
        operational = await instances.getInstance(actor, versionId);
    }
    catch (err) {
        // Only fall back to workspace for non-operational / missing instances.
        // Ownership denials must propagate.
        if (err instanceof AppError && err.status === 404)
            operational = null;
        else
            throw err;
    }
    if (operational) {
        const wb = new ExcelJS.Workbook();
        wb.creator = 'SkillonX Academic Portal';
        const summary = wb.addWorksheet('SUMMARY');
        summary.addRow([operational.mapping.mappingTypeLabel || 'Academic Mapping']);
        summary.addRow(['Institution', operational.institution.collegeName || '']);
        summary.addRow(['Subject', `${operational.context.subjectCode} — ${operational.context.subjectName}`]);
        summary.addRow(['Scheme', operational.context.schemeName || '—']);
        summary.addRow(['Program', operational.context.programName || '—']);
        summary.addRow(['Academic Year', operational.context.academicYearLabel || '—']);
        summary.addRow(['Prepared By', operational.mapping.createdByName || '—']);
        summary.addRow(['Status', operational.mapping.status]);
        summary.addRow(['Active correlations', operational.summary.activeCorrelations]);
        summary.addRow(['PO Coverage', operational.summary.poCoverage ?? '—']);
        summary.addRow(['PSO Coverage', operational.summary.psoCoverage ?? '—']);
        summary.addRow(['Relevant SDGs', operational.summary.relevantSdgs ?? '—']);
        const coSheet = wb.addWorksheet('COURSE_OUTCOMES');
        coSheet.addRow(['CO', 'Statement', 'Bloom’s']);
        for (const co of operational.courseOutcomes) {
            coSheet.addRow([co.code, co.statement, co.bloomsLabel || '—']);
        }
        const groups = operational.groups?.length
            ? operational.groups
            : [
                operational.mapping.includePo
                    ? { type: 'PO', label: 'PROGRAM OUTCOMES', colSpan: operational.programOutcomes.length, targets: operational.programOutcomes }
                    : null,
                operational.mapping.includePso
                    ? {
                        type: 'PSO',
                        label: 'PROGRAM SPECIFIC OUTCOMES',
                        colSpan: operational.programSpecificOutcomes.length,
                        targets: operational.programSpecificOutcomes,
                    }
                    : null,
                operational.mapping.includeSdg
                    ? {
                        type: 'SDG',
                        label: 'SUSTAINABLE DEVELOPMENT GOALS',
                        colSpan: (operational.mapping.showAllSdgs
                            ? operational.sdgs
                            : operational.sdgs.filter((sdg) => operational.relevantSdgIds.includes(sdg.id) || !operational.relevantSdgIds.length)).length,
                        targets: operational.mapping.showAllSdgs
                            ? operational.sdgs
                            : operational.sdgs.filter((sdg) => operational.relevantSdgIds.includes(sdg.id) || !operational.relevantSdgIds.length),
                    }
                    : null,
            ].filter((g) => Boolean(g && g.colSpan > 0));
        const flat = groups.flatMap((g) => g.targets.map((t) => ({ ...t, domain: g.type })));
        const combined = wb.addWorksheet('COMBINED_MAPPING');
        combined.addRow(['CO', ...flat.map((c) => c.code)]);
        // Group labels row for readability
        combined.insertRow(1, [
            'COURSE OUTCOME',
            ...groups.flatMap((g) => {
                const labels = Array(g.colSpan).fill('');
                labels[0] = g.label;
                return labels;
            }),
        ]);
        for (const co of operational.courseOutcomes) {
            combined.addRow([
                co.code,
                ...flat.map((col) => {
                    const cell = operational.cells.find((candidate) => candidate.domain === col.domain &&
                        candidate.courseOutcomeId === co.id &&
                        Number(candidate.targetId) === col.id);
                    return cell?.currentValue ?? '–';
                }),
            ]);
        }
        const justifications = wb.addWorksheet('JUSTIFICATIONS');
        justifications.addRow([
            'CO',
            'Domain',
            'Target',
            'Correlation',
            'Master Rationale',
            'Override Justification',
            'Origin',
            'Verification',
        ]);
        for (const cell of operational.cells.filter((c) => c.currentValue != null)) {
            const co = operational.courseOutcomes.find((c) => c.id === cell.courseOutcomeId);
            const domain = cell.domain || 'PO';
            const targets = domain === 'PSO'
                ? operational.programSpecificOutcomes
                : domain === 'SDG'
                    ? operational.sdgs
                    : operational.programOutcomes;
            const target = targets.find((t) => t.id === Number(cell.targetId));
            justifications.addRow([
                co?.code,
                domain,
                target?.code,
                strengthLabel(cell.currentValue),
                cell.rationale || '',
                cell.overrideJustification || '',
                cell.mappingOrigin || '',
                cell.verificationStatus || '',
            ]);
        }
        const body = Buffer.from(await wb.xlsx.writeBuffer());
        return {
            filename: `${sanitizeFilename(`${operational.context.subjectName}-Academic-Mapping-${operational.context.academicYearLabel || 'draft'}`)}.xlsx`,
            contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            body,
        };
    }
    const data = await getWorkspaceByVersion(actor, versionId);
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SkillonX Academic Portal';
    if (data.mappingKind === 'PSO') {
        const cover = wb.addWorksheet('Cover');
        cover.addRow(['CO–PSO Mapping']);
        cover.addRow(['Subject', `${data.course.code} — ${data.course.name}`]);
        cover.addRow(['Scheme', data.course.schemeName || '—']);
        cover.addRow(['Program', data.program?.name || '—']);
        cover.addRow(['Academic Year', data.academicYear?.label || '—']);
        cover.addRow(['Status', data.mapping.status]);
        cover.addRow(['Legend', '3 = High', '2 = Medium', '1 = Low', '– = No Mapping']);
        matrixSheet(wb, 'CO-PSO Matrix', data, data.programSpecificOutcomes || [], (i) => i.programSpecificOutcomeId ?? i.targetId ?? null);
        const psoSheet = wb.addWorksheet('Program Specific Outcomes');
        psoSheet.addRow(['PSO', 'Title', 'Statement']);
        for (const p of data.programSpecificOutcomes || []) {
            psoSheet.addRow([p.code, p.shortTitle || '', p.officialStatement || '']);
        }
    }
    else if (data.mappingKind === 'SDG') {
        const cover = wb.addWorksheet('Cover');
        cover.addRow(['CO–SDG Mapping']);
        cover.addRow(['Subject', `${data.course.code} — ${data.course.name}`]);
        cover.addRow(['Scheme', data.course.schemeName || '—']);
        cover.addRow(['Program', data.program?.name || '—']);
        cover.addRow(['Academic Year', data.academicYear?.label || '—']);
        cover.addRow(['Status', data.mapping.status]);
        cover.addRow(['Legend', '3 = Strong Relevance', '2 = Moderate Relevance', '1 = Low Relevance', '– = No Mapping']);
        cover.addRow(['Note', 'SDG relevance is curriculum alignment — not attainment.']);
        const cols = (data.sdgs || []).filter((s) => (data.relevantSdgIds || []).includes(s.id) || data.showAllSdgs);
        matrixSheet(wb, 'CO-SDG Matrix', data, cols, (i) => i.sdgId ?? i.targetId ?? null);
        const full = wb.addWorksheet('Full CO-SDG Matrix');
        full.addRow(['CO', ...(data.sdgs || []).map((s) => s.code)]);
        for (const co of data.courseOutcomes) {
            full.addRow([
                co.code,
                ...(data.sdgs || []).map((s) => {
                    const item = data.items.find((i) => i.courseOutcomeId === co.id && (i.sdgId ?? i.targetId) === s.id);
                    return item?.strength ?? '–';
                }),
            ]);
        }
        const meta = wb.addWorksheet('Rationales');
        meta.addRow(['CO', 'SDG', 'Relevance', 'Rationale', 'Origin', 'Verification']);
        for (const item of data.items.filter((i) => i.strength)) {
            const co = data.courseOutcomes.find((c) => c.id === item.courseOutcomeId);
            const sdg = (data.sdgs || []).find((s) => s.id === (item.sdgId ?? item.targetId));
            meta.addRow([
                co?.code,
                sdg?.code,
                strengthLabel(item.strength),
                item.justification || '',
                item.mappingOrigin || '',
                item.verificationStatus || '',
            ]);
        }
    }
    else {
        return exportMappingWorkbook(actor, versionId, 'all');
    }
    const body = Buffer.from(await wb.xlsx.writeBuffer());
    const label = data.mappingKind === 'PSO' ? 'CO-PSO' : 'CO-SDG';
    return {
        filename: `${sanitizeFilename(`${data.course.name}-${label}-Mapping-${data.academicYear?.label || 'draft'}`)}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body,
    };
}
export async function exportAlignmentWorkbook(actor, query) {
    const data = await getUnifiedWorkspace(actor, { ...query, mappingKind: 'PO' });
    const wb = new ExcelJS.Workbook();
    const cover = wb.addWorksheet('Course Outcome Alignment');
    cover.addRow(['Course Outcome Alignment Report']);
    cover.addRow(['Subject', `${data.course.code} — ${data.course.name}`]);
    cover.addRow(['Scheme', data.course.schemeName || 'Official Data Pending']);
    cover.addRow(['Program', data.program?.name || '—']);
    cover.addRow(['Academic Year', data.academicYear?.label || '—']);
    cover.addRow(['CO–PO', `${data.po.mapping.status} v${data.po.mapping.versionNumber}`]);
    cover.addRow(['CO–PSO', `${data.pso.mapping.status} v${data.pso.mapping.versionNumber}`]);
    cover.addRow(['CO–SDG', `${data.sdg.mapping.status} v${data.sdg.mapping.versionNumber}`]);
    cover.addRow(['Note', 'Mapping / alignment only — not attainment']);
    cover.addRow([]);
    cover.addRow(['CO', 'Statement', 'Bloom’s', 'PO', 'PSO', 'SDG']);
    for (const row of data.alignment) {
        cover.addRow([
            row.courseOutcome.code,
            row.courseOutcome.statement,
            row.courseOutcome.bloomsLabel || '—',
            row.po.map((p) => `${p.code}(${p.strength})`).join(', ') || '–',
            row.pso.map((p) => `${p.code}(${p.strength})`).join(', ') || '–',
            row.sdg.map((p) => `${p.code}(${p.strength})`).join(', ') || '–',
        ]);
    }
    matrixSheet(wb, 'CO-PO Matrix', data.po, data.po.programOutcomes, (i) => i.programOutcomeId ?? i.targetId ?? null);
    matrixSheet(wb, 'CO-PSO Matrix', data.pso, data.pso.programSpecificOutcomes || [], (i) => i.programSpecificOutcomeId ?? i.targetId ?? null);
    matrixSheet(wb, 'CO-SDG Matrix', data.sdg, (data.sdg.visibleSdgs || data.sdg.sdgs || []).map((s) => ({ id: s.id, code: s.code })), (i) => i.sdgId ?? i.targetId ?? null);
    const just = wb.addWorksheet('Justifications');
    just.addRow(['CO', 'Mapping', 'Target', 'Correlation', 'Justification', 'Status']);
    for (const slice of [
        { kind: 'CO–PO', ws: data.po, targetOf: (i) => i.programOutcomeId ?? i.targetId, cols: data.po.programOutcomes },
        { kind: 'CO–PSO', ws: data.pso, targetOf: (i) => i.programSpecificOutcomeId ?? i.targetId, cols: data.pso.programSpecificOutcomes || [] },
        { kind: 'CO–SDG', ws: data.sdg, targetOf: (i) => i.sdgId ?? i.targetId, cols: data.sdg.sdgs || [] },
    ]) {
        for (const item of slice.ws.items.filter((i) => i.strength)) {
            const co = slice.ws.courseOutcomes.find((c) => c.id === item.courseOutcomeId);
            const col = slice.cols.find((c) => c.id === Number(slice.targetOf(item)));
            just.addRow([co?.code, slice.kind, col?.code, strengthLabel(item.strength), item.justification || '', slice.ws.mapping.status]);
        }
    }
    const body = Buffer.from(await wb.xlsx.writeBuffer());
    return {
        filename: `${sanitizeFilename(`${data.course.code}-outcome-alignment`)}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body,
    };
}
export async function exportPsoCoverageWorkbook(actor, schemeId, programId, academicYearId) {
    const data = await analytics.psoCoverage(actor, schemeId, programId, academicYearId);
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('PSO Coverage');
    sheet.addRow([data.disclaimer]);
    sheet.addRow(['PSO', 'Title', 'Subjects', 'Contributing COs', 'High', 'Moderate', 'Low']);
    for (const row of data.rows) {
        sheet.addRow([
            row.pso.code,
            row.pso.shortTitle || (row.pso.officialTextPending ? 'Official / Approved PSO Data Pending' : ''),
            row.subjectsContributing,
            row.contributingCos,
            row.high,
            row.moderate,
            row.low,
        ]);
    }
    const body = Buffer.from(await wb.xlsx.writeBuffer());
    return {
        filename: `${sanitizeFilename('PSO-Coverage')}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body,
    };
}
export async function exportSdgCoverageWorkbook(actor, filters) {
    const data = await analytics.sdgCoverage(actor, filters);
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('SDG Coverage');
    sheet.addRow([data.disclaimer]);
    sheet.addRow(['SDG', 'Title', 'Subjects', 'Contributing COs', 'High', 'Moderate', 'Low']);
    for (const row of data.rows) {
        sheet.addRow([row.sdg.code, row.sdg.officialTitle, row.subjectsContributing, row.contributingCos, row.high, row.moderate, row.low]);
    }
    const body = Buffer.from(await wb.xlsx.writeBuffer());
    return {
        filename: `${sanitizeFilename('SDG-Coverage')}.xlsx`,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body,
    };
}
