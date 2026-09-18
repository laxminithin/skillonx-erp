import ExcelJS from 'exceljs';
import { SKILLONX_STANDARD_V1 } from './policy.js';
export function buildPrintModel(detail, extra) {
    return {
        documentTitle: extra?.kind || 'CO ATTAINMENT REPORT',
        institutionPolicy: detail.run.policy?.name || SKILLONX_STANDARD_V1.name,
        formulaVersion: detail.run.formulaVersion,
        courseName: detail.run.courseName,
        courseCode: detail.run.courseCode,
        programName: detail.run.programName,
        academicYearLabel: detail.run.academicYearLabel,
        semesterLabel: detail.run.semesterLabel,
        facultyName: detail.run.facultyName,
        seeMethod: detail.run.seeMethod,
        seeConfidence: detail.run.seeConfidence,
        seeEstimated: detail.run.seeEstimated,
        calculatedAt: detail.run.calculatedAt,
        cos: detail.cos,
        po: detail.po,
        pso: detail.pso,
        seeWeights: detail.seeWeights,
        nba: extra?.nba ?? null,
    };
}
export async function exportAttainmentXlsx(detail, extra) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SkillonX';
    const summary = wb.addWorksheet('CO Attainment');
    summary.addRow(['Field', 'Value']);
    summary.addRow(['Course', `${detail.run.courseCode} ${detail.run.courseName}`]);
    summary.addRow(['Programme', detail.run.programName]);
    summary.addRow(['Academic Year', detail.run.academicYearLabel]);
    summary.addRow(['Semester', detail.run.semesterLabel]);
    summary.addRow(['Policy', detail.run.policy?.name]);
    summary.addRow(['Policy version', detail.run.policy?.version]);
    summary.addRow(['Formula version', detail.run.formulaVersion]);
    summary.addRow(['SEE method', detail.run.seeMethod]);
    summary.addRow(['SEE confidence', detail.run.seeConfidence]);
    summary.addRow(['SEE estimated', detail.run.seeEstimated ? 'Yes' : 'No']);
    summary.getRow(1).font = { bold: true };
    const coSheet = wb.addWorksheet('CO Detail');
    coSheet.addRow(['CO', 'Statement', 'Target', 'CIE', 'SEE', 'Direct', 'Indirect', 'Final', 'Gap', 'Status', 'Students', 'Weak students']);
    coSheet.getRow(1).font = { bold: true };
    for (const co of detail.cos) {
        coSheet.addRow([
            co.coCode,
            co.statement,
            co.target,
            co.cie,
            co.see,
            co.direct,
            co.indirect,
            co.final,
            co.gap,
            co.status,
            co.studentCount,
            co.weakStudentCount,
        ]);
    }
    const calc = wb.addWorksheet('Calculation');
    calc.addRow(['CO', 'CIE formula', 'SEE formula', 'Direct formula', 'Final formula']);
    calc.getRow(1).font = { bold: true };
    for (const co of detail.cos) {
        const f = co.formula;
        calc.addRow([co.coCode, f.cie, f.see, f.direct, f.final]);
    }
    const poSheet = wb.addWorksheet('PO Attainment');
    poSheet.addRow(['PO', 'Target', 'Attainment', 'Gap', 'Status', 'Formula']);
    poSheet.getRow(1).font = { bold: true };
    for (const po of detail.po)
        poSheet.addRow([po.poCode, po.target, po.attainment, po.gap, po.status, po.formula]);
    const psoSheet = wb.addWorksheet('PSO Attainment');
    psoSheet.addRow(['PSO', 'Target', 'Attainment', 'Gap', 'Status', 'Formula']);
    psoSheet.getRow(1).font = { bold: true };
    for (const pso of detail.pso)
        psoSheet.addRow([pso.psoCode, pso.target, pso.attainment, pso.gap, pso.status, pso.formula]);
    if (extra?.nba811) {
        const n = wb.addWorksheet('NBA 8.1.1');
        n.addRow(['Course', 'CO', 'Target', 'Actual', 'Gap', 'Root Cause', 'Action Planned', 'Action Implemented', 'Students Benefited', 'Evidence', 'Revised', 'Improvement']);
        n.getRow(1).font = { bold: true };
        for (const row of extra.nba811.rows) {
            n.addRow([row.course, row.co, row.target, row.actual, row.gap, row.rootCause, row.actionPlanned, row.actionImplemented, row.studentsBenefited, row.evidence, row.revisedAttainment, row.improvement]);
        }
    }
    if (extra?.nba812) {
        const n = wb.addWorksheet('NBA 8.1.2');
        n.addRow(['PO/PSO', 'Previous', 'Target', 'Gap', 'Root Cause', 'Action Planned', 'Action Implemented', 'Evidence', 'Revised', 'Improvement']);
        n.getRow(1).font = { bold: true };
        for (const row of extra.nba812.rows) {
            n.addRow([row.poPso, row.previousAttainment, row.target, row.gap, row.rootCause, row.actionPlanned, row.actionImplemented, row.evidence, row.revisedAttainment, row.improvement]);
        }
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
}
