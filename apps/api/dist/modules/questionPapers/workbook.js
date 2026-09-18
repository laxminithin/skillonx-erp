import ExcelJS from 'exceljs';
function sheet(wb, name, headers) {
    const ws = wb.addWorksheet(name);
    ws.addRow(headers);
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
    return ws;
}
export async function buildQuestionPaperMaster(payload) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SkillonX Lecturer LMS';
    wb.created = new Date();
    const papers = sheet(wb, 'QP_PAPER_MASTER', [
        'PAPER_ID',
        'SUBJECT_ID',
        'SUBJECT_NAME',
        'COURSE_CODE',
        'SCHEME',
        'PROGRAM',
        'SEMESTER',
        'EXAM_TYPE',
        'ACADEMIC_YEAR',
        'EXAM_MONTH',
        'EXAM_YEAR',
        'EXAM_DATE',
        'MAX_MARKS',
        'DURATION_MINUTES',
        'UNIVERSITY',
        'SOURCE_FILE',
        'SOURCE_TYPE',
        'EXTRACTION_STATUS',
        'VERIFICATION_STATUS',
        'NOTES',
        'START_PAGE',
        'END_PAGE',
        'QUESTION_COUNT',
        'OR_PAIR_COUNT',
        'SUBQUESTION_COUNT',
    ]);
    for (const p of payload.papers) {
        const m = p.metadata;
        const orPairCount = new Set(p.questions.map((q) => q.orPairId).filter(Boolean)).size;
        const subCount = p.questions.reduce((n, q) => n + (q.subquestions.length || 1), 0);
        papers.addRow([
            m.paperId,
            m.courseCode,
            m.subjectName,
            m.courseCode,
            m.scheme,
            m.program,
            m.semester,
            m.examType,
            m.academicYear,
            m.examMonth,
            m.examYear,
            m.examDate,
            m.maxMarks,
            m.durationMinutes,
            m.university,
            m.sourceFile,
            m.sourceType,
            m.extractionStatus,
            m.verificationStatus,
            m.notes,
            m.startPage,
            m.endPage,
            p.questions.length,
            orPairCount,
            subCount,
        ]);
    }
    const qSheet = sheet(wb, 'QP_QUESTION_MASTER', [
        'QUESTION_ID',
        'PAPER_ID',
        'QUESTION_NUMBER',
        'SECTION',
        'PARENT_QUESTION',
        'SOURCE_TYPE',
        'ORIGINAL_QUESTION_TEXT',
        'DISPLAY_QUESTION_TEXT',
        'QUESTION_TYPE',
        'MAX_MARKS',
        'MARKS_STATUS',
        'MODULE_OR_UNIT',
        'TOPIC',
        'MODULE_MAPPING_STATUS',
        'MODULE_CONFIDENCE',
        'PRINTED_CO',
        'DERIVED_CO',
        'PRINTED_PO',
        'PRINTED_PSO',
        'PRINTED_RBT',
        'DIFFICULTY',
        'BLOOM_LEVEL',
        'IS_OR_CHOICE',
        'OR_GROUP_ID',
        'OR_PAIR_ID',
        'OR_ALTERNATIVE',
        'MODULE_ASSIGNMENT_METHOD',
        'SOURCE_PAGE',
        'SOURCE_REFERENCE',
        'MAPPING_BASIS',
        'CO_MAPPING_STATUS',
        'VERIFICATION_STATUS',
        'READINESS_STATUS',
        'NOTES',
        'FINGERPRINT',
    ]);
    for (const q of payload.questions) {
        qSheet.addRow([
            q.questionId,
            q.paperId,
            q.questionNumber,
            q.section,
            q.parentQuestion,
            q.sourceType,
            q.originalQuestionText,
            q.questionText,
            q.questionType,
            q.maxMarks,
            q.marksStatus,
            q.moduleOrUnit,
            q.topicName,
            q.moduleMappingStatus,
            q.moduleMappingConfidence,
            q.printedCo,
            q.derivedCo,
            q.printedPo,
            q.printedPso,
            q.printedRbt,
            q.difficulty,
            q.bloomLevel,
            q.isOrChoice,
            q.orGroupId,
            q.orPairId,
            q.orAlternative,
            q.moduleAssignmentMethod,
            q.sourcePage,
            q.sourceReference,
            q.mappingBasis,
            q.coMappingStatus,
            q.verificationStatus,
            q.readinessStatus,
            q.notes,
            q.fingerprint,
        ]);
    }
    const sub = sheet(wb, 'QP_SUBQUESTION_MASTER', [
        'SUBQUESTION_ID',
        'QUESTION_ID',
        'PAPER_ID',
        'LETTER',
        'QUESTION_TEXT',
        'MAX_MARKS',
        'BLOOM_LEVEL',
        'DIFFICULTY',
        'SOURCE_PAGE',
        'PRINTED_CO',
        'PRINTED_PO',
        'PRINTED_PSO',
        'PRINTED_RBT',
    ]);
    for (const s of payload.subquestions) {
        sub.addRow([
            s.subquestionId,
            s.questionId,
            s.paperId,
            s.letter,
            s.questionText,
            s.maxMarks,
            s.bloomLevel,
            s.difficulty,
            s.sourcePage,
            s.printedCo ?? null,
            s.printedPo ?? null,
            s.printedPso ?? null,
            s.printedRbt ?? null,
        ]);
    }
    const co = sheet(wb, 'QP_CO_MAPPING', [
        'QUESTION_ID',
        'PAPER_ID',
        'PRIMARY_CO',
        'CO_STATEMENT',
        'MAPPING_BASIS',
        'VERIFICATION_STATUS',
        'DERIVED_PO',
        'DERIVED_PSO',
        'DERIVED_SDG',
        'PROVENANCE',
        'BLOCKED',
    ]);
    for (const row of payload.coMappings) {
        co.addRow([
            row.questionId,
            row.paperId,
            row.primaryCo,
            row.coStatement,
            row.mappingBasis,
            row.verificationStatus,
            row.derivedPo,
            row.derivedPso,
            row.derivedSdg,
            row.provenance,
            row.blocked,
        ]);
    }
    const src = sheet(wb, 'QP_SOURCE_REGISTER', [
        'SOURCE_FILE',
        'FILE_NAME',
        'FOLDER',
        'PROGRAM_HINT',
        'SOURCE_TYPE',
        'BYTE_SIZE',
        'PAGE_COUNT',
        'EXTRACTION_STATUS',
        'PAPER_COUNT',
        'OCR_REQUIRED',
        'NOTES',
    ]);
    for (const s of payload.sources) {
        src.addRow([
            s.relativePath,
            s.fileName,
            s.folder,
            s.programHint,
            s.sourceType,
            s.byteSize,
            s.pageCount,
            s.extractionStatus,
            s.paperCount,
            s.ocrRequired ? 'YES' : 'NO',
            s.notes,
        ]);
    }
    const rev = sheet(wb, 'QP_EXTRACTION_REVIEW', [
        'ISSUE_TYPE',
        'REASON',
        'PAPER_ID',
        'QUESTION_REF',
        'SOURCE_FILE',
        'SOURCE_PAGE',
        'PRIORITY',
    ]);
    for (const r of payload.reviews) {
        rev.addRow([r.issueType, r.reason, r.paperId, r.questionRef, r.sourceFile, r.sourcePage, r.priority]);
    }
    const extracted = payload.papers.filter((p) => p.questions.length > 0).length;
    const ocr = payload.sources.filter((s) => s.ocrRequired).length;
    const coMapped = payload.coMappings.filter((c) => c.primaryCo && c.blocked !== 'YES').length;
    const blocked = payload.coMappings.filter((c) => c.blocked === 'YES').length;
    const orPairs = new Set((payload.masterBank.length ? payload.masterBank : payload.questions)
        .map((q) => ('orPairId' in q ? q.orPairId : q.orPairId) || q.orGroupId)
        .filter(Boolean));
    const readyCount = payload.masterBank.filter((r) => r.readyForInternalPaper === 'YES').length;
    const summary = sheet(wb, 'QP_SUMMARY', ['METRIC', 'VALUE']);
    summary.addRows([
        ['Source files', payload.sources.length],
        ['Papers detected', payload.papers.length],
        ['Papers with extracted questions', extracted],
        ['Questions', payload.questions.length],
        ['Subquestions', payload.subquestions.length],
        ['PYQ master rows', payload.masterBank.length],
        ['OR pairs', orPairs.size],
        ['CO mapped', coMapped],
        ['CO mapping blocked', blocked],
        ['READY_FOR_INTERNAL_PAPER', readyCount],
        ['Review items', payload.reviews.length],
        ['OCR required files', ocr],
        ['Exact repeat clusters', payload.repeats.filter((r) => r.similarity === 'EXACT').length],
    ]);
    if (payload.qaReport?.rows?.length) {
        for (const row of payload.qaReport.rows)
            summary.addRow([row.metric, row.value]);
    }
    const bank = sheet(wb, 'PYQ_MASTER', [
        'Question_ID',
        'Subject',
        'Subject_Code',
        'Scheme',
        'Branch',
        'Semester',
        'Academic_Year',
        'Exam_Type',
        'Exam_Month_Year',
        'Source_Paper',
        'Source_Page',
        'Module',
        'Main_Question_No',
        'OR_Pair_ID',
        'OR_Alternative',
        'Subquestion',
        'Question_Text',
        'Subquestion_Marks',
        'Main_Question_Total',
        'RBT',
        'CO',
        'PO',
        'PSO',
        'Source_RBT',
        'Source_CO',
        'Source_PO',
        'Source_PSO',
        'Topic',
        'Subtopic',
        'Textbook_ID',
        'Textbook_Title',
        'Textbook_Chapter',
        'Textbook_Section',
        'Textbook_Page_Reference',
        'Scheme_of_Evaluation',
        'Model_Solution',
        'Expected_Key_Points',
        'Verification_Status',
        'Source_Verified',
        'module_assignment_method',
        'READY_FOR_INTERNAL_PAPER',
        'Readiness_Reason',
        'Times_Asked',
        'Last_Asked_Year',
        'Years_Appeared',
    ]);
    for (const r of payload.masterBank) {
        bank.addRow([
            r.questionId,
            r.subject,
            r.subjectCode,
            r.scheme,
            r.branch,
            r.semester,
            r.academicYear,
            r.examType,
            r.examMonthYear,
            r.sourcePaper,
            r.sourcePage,
            r.module,
            r.mainQuestionNo,
            r.orPairId,
            r.orAlternative,
            r.subquestion,
            r.questionText,
            r.subquestionMarks,
            r.mainQuestionTotal,
            r.rbt,
            r.co,
            r.po,
            r.pso,
            r.sourceRbt,
            r.sourceCo,
            r.sourcePo,
            r.sourcePso,
            r.topic,
            r.subtopic,
            r.textbookId,
            r.textbookTitle,
            r.textbookChapter,
            r.textbookSection,
            r.textbookPageReference,
            r.schemeOfEvaluation,
            r.modelSolution,
            r.expectedKeyPoints,
            r.verificationStatus,
            r.sourceVerified,
            r.moduleAssignmentMethod,
            r.readyForInternalPaper,
            r.readinessReason,
            r.timesAsked,
            r.lastAskedYear,
            r.yearsAppeared,
        ]);
    }
    const qa = sheet(wb, 'QP_QA_REPORT', [
        'PAPER_ID',
        'COURSE_CODE',
        'SUBJECT',
        'QUESTIONS',
        'OR_PAIRS',
        'MODULES',
        'MISSING_ALTERNATIVES',
        'MARKS_MISMATCHES',
    ]);
    for (const row of payload.qaReport?.paperChecks || []) {
        qa.addRow([
            row.paperId,
            row.courseCode,
            row.subject,
            row.questions,
            row.orPairs,
            row.modules,
            row.missingAlternatives,
            row.marksMismatches,
        ]);
    }
    const orPairsSheet = sheet(wb, 'OR_PAIRS', [
        'PAPER_ID',
        'OR_PAIR_ID',
        'MODULE',
        'ALT_A_QUESTION',
        'ALT_B_QUESTION',
        'ALT_A_MARKS',
        'ALT_B_MARKS',
        'COMPLETE',
    ]);
    const byPaperPair = new Map();
    for (const p of payload.papers) {
        for (const q of p.questions) {
            if (!q.orPairId)
                continue;
            const key = `${p.metadata.paperId}|${q.orPairId}`;
            const row = byPaperPair.get(key) || {
                paperId: p.metadata.paperId,
                orPairId: q.orPairId,
                module: q.moduleOrUnit,
                altA: null,
                altB: null,
                marksA: null,
                marksB: null,
            };
            if (q.orAlternative === 'A') {
                row.altA = q.questionNumber;
                row.marksA = q.maxMarks;
            }
            else if (q.orAlternative === 'B') {
                row.altB = q.questionNumber;
                row.marksB = q.maxMarks;
            }
            if (!row.module && q.moduleOrUnit)
                row.module = q.moduleOrUnit;
            byPaperPair.set(key, row);
        }
    }
    for (const row of [...byPaperPair.values()].sort((a, b) => `${a.paperId}|${a.orPairId}`.localeCompare(`${b.paperId}|${b.orPairId}`))) {
        orPairsSheet.addRow([
            row.paperId,
            row.orPairId,
            row.module,
            row.altA,
            row.altB,
            row.marksA,
            row.marksB,
            row.altA != null && row.altB != null ? 'YES' : 'NO',
        ]);
    }
    const repeats = sheet(wb, 'QP_REPEAT_ANALYSIS', [
        'FINGERPRINT',
        'SIMILARITY',
        'COUNT',
        'YEARS',
        'PAPERS',
        'QUESTION_IDS',
        'CANONICAL_TEXT',
    ]);
    for (const r of payload.repeats) {
        repeats.addRow([
            r.fingerprint,
            r.similarity,
            r.count,
            r.years.join(', '),
            r.papers.join(', '),
            r.questionIds.join(', '),
            r.canonicalText,
        ]);
    }
    const mod = sheet(wb, 'QP_MODULE_COVERAGE', ['SUBJECT', 'COURSE_CODE', 'MODULE', 'QUESTION_COUNT']);
    for (const row of payload.moduleCoverage)
        mod.addRow([row.subject, row.courseCode, row.module, row.count]);
    const cov = sheet(wb, 'QP_CO_COVERAGE', ['SUBJECT', 'COURSE_CODE', 'CO', 'QUESTION_COUNT', 'MARKS']);
    for (const row of payload.coCoverage)
        cov.addRow([row.subject, row.courseCode, row.co, row.count, row.marks]);
    return wb;
}
