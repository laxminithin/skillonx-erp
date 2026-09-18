import ExcelJS from 'exceljs';
import { getInternalPaper } from './internalService.js';
export async function exportInternalPaperXlsx(paperId, collegeId) {
    const detail = await getInternalPaper(paperId, collegeId);
    const wb = new ExcelJS.Workbook();
    const qp = wb.addWorksheet('QUESTION_PAPER');
    qp.addRows([
        ['Institution', detail.paper.collegeName],
        ['Department', detail.paper.departmentName],
        ['Academic Year', detail.paper.academicYearLabel],
        ['Subject', detail.paper.subjectName],
        ['Course Code', detail.paper.courseCode],
        ['Exam', detail.paper.examType],
        ['Max Marks', detail.paper.maxMarks],
        ['Duration (min)', detail.paper.durationMinutes],
        ['Status', detail.paper.status],
        [],
        ['Q', 'Section', 'Question', 'Marks', 'Module', 'CO', 'Source'],
    ]);
    for (const item of detail.items) {
        qp.addRow([
            `${item.questionNumber}${item.subLetter || ''}`,
            item.section,
            item.questionText,
            item.maxMarks,
            item.moduleOrUnit,
            item.primaryCo,
            item.sourceKind,
        ]);
    }
    const bp = wb.addWorksheet('BLUEPRINT');
    bp.addRows([
        ['Exam Type', detail.blueprint?.examType],
        ['Max Marks', detail.blueprint?.maxMarks],
        ['Duration', detail.blueprint?.durationMinutes],
        ['Pattern', detail.blueprint?.patternLabel],
        ['Modified from CO Evaluation', detail.paper.modifiedFromCoEval ? 'YES' : 'NO'],
        ['Justification', detail.paper.changeJustification],
        [],
        ['CO', 'Target Marks'],
    ]);
    for (const co of detail.blueprint?.coTargets || [])
        bp.addRow([co.coCode, co.marks]);
    const map = wb.addWorksheet('QUESTION_MAPPING');
    map.addRow(['Question', 'Marks', 'Module', 'CO', 'PO', 'PSO', 'SDG', 'Source']);
    for (const item of detail.items) {
        const derived = (item.derivedOutcomes || {});
        const code = (x) => (typeof x === 'string' ? x : x.code);
        map.addRow([
            `Q${item.questionNumber}${item.subLetter || ''}`,
            item.maxMarks,
            item.moduleOrUnit,
            item.primaryCo,
            (derived.pos || []).map(code).join(', '),
            (derived.psos || []).map(code).join(', '),
            (derived.sdgs || []).map(code).join(', '),
            item.sourceKind,
        ]);
    }
    const src = wb.addWorksheet('SOURCE_TRACE');
    src.addRow(['Question', 'Source', 'Source Paper', 'Fingerprint', 'Textbook', 'Provenance']);
    for (const item of detail.items) {
        const p = (item.provenance || {});
        src.addRow([
            `Q${item.questionNumber}`,
            item.sourceType || item.sourceKind,
            item.sourcePaperId,
            item.fingerprint,
            item.textbookCitation,
            p.questionSource,
        ]);
    }
    const ans = wb.addWorksheet('ANSWER_SCHEME');
    ans.addRow(['Question', 'Marks', 'Model Answer Status', 'Model Answer', 'Textbook citation']);
    for (const item of detail.items) {
        ans.addRow([
            `Q${item.questionNumber}`,
            item.maxMarks,
            item.modelAnswerStatus || 'TEXTBOOK_SOURCE_REQUIRED',
            item.modelAnswer || 'Prescribed textbook source is required to generate the model solution.',
            item.textbookCitation,
        ]);
    }
    const prov = wb.addWorksheet('ACADEMIC_PROVENANCE');
    prov.addRow(['Question', 'Question Source', 'Marks Source', 'CO', 'PO/PSO', 'Solution Source', 'Scheme']);
    for (const row of detail.academicProvenance || []) {
        prov.addRow([row.questionLabel, row.questionSource, row.marksSource, row.co, row.poPso, row.solutionSource, row.schemeSource]);
    }
    return wb;
}
export async function buildPrintModel(paperId, collegeId, variant = 'PAPER') {
    const detail = await getInternalPaper(paperId, collegeId);
    return { variant, ...detail };
}
export function filenameForPaper(detail) {
    const subj = String(detail.paper.courseCode || detail.paper.subjectName || 'Subject').replace(/\s+/g, '');
    const year = String(detail.paper.academicYearLabel || new Date().getFullYear()).replace(/\s+/g, '');
    return `${subj}-${detail.paper.examType}-Question-Paper-${year}.xlsx`;
}
