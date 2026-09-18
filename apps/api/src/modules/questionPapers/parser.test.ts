import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildPaperId,
  detectExamType,
  extractHeaderCourseCode,
  extractPrintedAcademicTags,
  extractSubjectNameFromLines,
  parseIndex,
  parseMcqPaper,
  parsePaperMetadata,
  parseQuestionsFromPaperLines,
  parseQuestionsFromPaperText,
  parseSubquestions,
  splitMergedDocument,
} from './parser.js';
import { monthKey, type ExtractedPage, type PageLine } from './types.js';
import { classifyExtractedPaper } from './pyqClassification.js';

/** Build a reconstructed line from [x, str] cells (as pdfExtract.reconstructLines emits). */
function line(y: number, cells: Array<[number, string]>): PageLine {
  const parsed = cells.map(([x, str]) => ({ x, str }));
  return { y, cells: parsed, text: parsed.map((c) => c.str).join(' ').replace(/\s+/g, ' ').trim() };
}
function pageWithLines(page: number, lines: PageLine[]): ExtractedPage {
  const text = lines.map((l) => l.text).join(' ');
  return { page, text, charCount: text.length, lines };
}

const DBMS_TEXT = `USN 22MCA21 Second Semester MCA Degree Examination, June/July 2023 Database Management System Time: 3 hrs. Max. Marks: 100 Note: Answer any FIVE full questions, choosing ONE full question from each module . Module-1 1 a. Explain the Database System Environment with neat diagram. (10 Marks) b. Discuss the characteristics and advantages of Database Approaches. (10 Marks) OR 2 a. Explain with proper diagram, the 3 – schema architecture of DBMS. (10 Marks) b. What are the different types of attributes? Explain with example. (10 Marks) Module-2 3 a. Explain Unary Operation SELECT and prove it is commutative. (10 Marks) b. Explain Schema Update Operations, with a suitable examples. (10 Marks) OR 4 a. With a suitable example, explain Join and division operation in relational algebra. (10 Marks) b. Explain in detail ER to Relational Mapping algorithm. (10 Marks) Module-3 5 a. Explain with suitable example the basic structure of SQL query. (10 Marks) b. What are Views in SQL? Explain. (10 Marks) OR 6 a. In SQL how to handle the Aggregate functions with group by and having clauses? With examples. (06 Marks) b. What are Aggregate functions? Explain with an examples. (06 Marks) c. Explain the architecture of JDBC main components and types of drivers. (08 Marks) Module-4 7 a. Discuss informal design guidelines for relational schema. (10 Marks) b. What is Normalization? What are its advantages? Discuss 1NF , 2NF and 3NF. (10 Marks) OR 8 a. Explain with an example the Boyce Codd Normal Form (BCNF). (10 Marks) b. Discuss the different inference rules for functional dependencies. (10 Marks) Module-5 9 a. Explain ACID properties of transaction in details. (10 Marks) b. Discuss the characterizing schedules based on recoverability. (10 Marks) OR 10 a. Discuss a Lock based concurrency control issue in DBMS transaction processing. (10 Marks) b. Describe Granularity of data items and Multiple Granularity locking. (10 Marks)`;

describe('paper metadata extraction', () => {
  it('reads course code, subject, marks, duration, exam type from header', () => {
    const meta = parsePaperMetadata({
      text: DBMS_TEXT,
      sourceFile: 'Previous Years QPs/MCA/2023 MCA Even sem.pdf',
      fileName: '2023 MCA Even sem.pdf',
      folder: 'MCA',
      startPage: 3,
      endPage: 3,
    });
    assert.equal(meta.courseCode, '22MCA21');
    assert.equal(meta.subjectName, 'Database Management System');
    assert.equal(meta.maxMarks, 100);
    assert.equal(meta.durationMinutes, 180);
    assert.equal(meta.examType, 'SEE');
    assert.equal(meta.semester, '2');
    assert.equal(meta.program, 'MCA');
    assert.equal(meta.examMonth, 'JUN');
    assert.equal(meta.examYear, 2023);
    assert.equal(meta.paperId, 'QPB-22MCA21-2023-JUN-SEE');
  });

  it('detects makeup/supplementary from content not only filename', () => {
    assert.equal(detectExamType('Degree Supplementary Examination, June/July 2024', 'foo.pdf'), 'SUPPLEMENTARY');
    assert.equal(detectExamType('Degree Examination', 'BE – Makeup Exam.pdf'), 'MAKEUP');
  });

  it('extracts header course code even when USN comes first', () => {
    assert.equal(extractHeaderCourseCode('USN BCS403 Fourth Semester B.E. Degree Examination'), 'BCS403');
  });
});

describe('question extraction', () => {
  it('splits module-wise subquestions and preserves OR groups', () => {
    const questions = parseQuestionsFromPaperText(DBMS_TEXT, 3);
    assert.equal(questions.length, 10);
    const q1 = questions.find((q) => q.questionNumber === 1);
    assert.ok(q1);
    assert.equal(q1!.subquestions.length, 2);
    assert.equal(q1!.subquestions[0].maxMarks, 10);
    assert.match(q1!.subquestions[0].questionText, /Database System Environment/i);
    assert.equal(q1!.moduleOrUnit, 'Module 1');
    assert.equal(q1!.isOrChoice, true);
    assert.equal(q1!.orGroupId, questions.find((q) => q.questionNumber === 2)?.orGroupId);
    assert.equal(q1!.orPairId, 'M1_PAIR_01');
    assert.equal(q1!.orAlternative, 'A');
    assert.equal(questions.find((q) => q.questionNumber === 2)?.orAlternative, 'B');
    assert.equal(q1!.moduleAssignmentMethod, 'SOURCE_EXPLICIT');

    const q6 = questions.find((q) => q.questionNumber === 6);
    assert.equal(q6?.subquestions.length, 3);
    assert.equal(q6?.maxMarks, 20);
    assert.equal(q6?.subquestions[0].maxMarks, 6);

    const q7 = questions.find((q) => q.questionNumber === 7);
    assert.equal(q7?.moduleOrUnit, 'Module 4');
    assert.match(q7!.questionText, /Normalization/i);
    assert.equal(q7?.orPairId, 'M4_PAIR_01');
    assert.equal(questions.find((q) => q.questionNumber === 8)?.orPairId, 'M4_PAIR_01');
  });

  it('preserves 10-mark VTU IA subquestions and both OR alternatives (DBMS reference paper)', () => {
    const text = `USN BCS403 Fourth Semester B.E. Degree Examination, June/July 2024 Database Management Systems Time: 3 hrs. Max. Marks: 100 Note: Answer any FIVE full questions, choosing ONE full question from each module.
Module-1
1 a) Explain the informal design guidelines for relational schema design. (4 Marks) CO4 L2
b) Define Functional Dependency. Explain Armstrong’s inference rules with suitable examples. (6 Marks) CO4 L2
OR
2 a) What is Normalization? Explain 1NF, 2NF and 3NF with suitable examples. (6 Marks) CO4 L2
b) Discuss insertion, deletion and update anomalies with examples. (4 Marks) CO4 L2
Module-2
3 a) Explain SELECT operation. (6 Marks) b) Prove SELECT is commutative. (4 Marks)
OR
4 a) Explain join operation. (5 Marks) b) Explain division operation. (5 Marks)
Module-3
5 a) Explain SQL query structure. (5 Marks) b) What are views? (5 Marks)
OR
6 a) Explain aggregate functions. (6 Marks) b) Explain JDBC drivers. (4 Marks)
Module-4
7 a) Discuss BCNF. (4 Marks) b) Explain lossless join. (6 Marks)
OR
8 a) Explain 4NF. (4 Marks) b) Discuss multivalued dependency. (6 Marks)
Module-5
9 a) Explain ACID properties. (5 Marks) b) Discuss recoverability. (5 Marks)
OR
10 a) Discuss lock based concurrency. (4 Marks) b) Describe multiple granularity locking. (6 Marks)`;
    const questions = parseQuestionsFromPaperText(text, 1);
    assert.equal(questions.length, 10);
    const q1 = questions.find((q) => q.questionNumber === 1)!;
    const q2 = questions.find((q) => q.questionNumber === 2)!;
    assert.equal(q1.subquestions.length, 2);
    assert.equal(q1.subquestions[0].letter, 'a');
    assert.equal(q1.subquestions[0].maxMarks, 4);
    assert.equal(q1.subquestions[1].maxMarks, 6);
    assert.equal(q1.maxMarks, 10);
    assert.equal(q2.subquestions[0].maxMarks, 6);
    assert.equal(q2.subquestions[1].maxMarks, 4);
    assert.equal(q1.orPairId, q2.orPairId);
    assert.equal(q1.orPairId, 'M1_PAIR_01');
    assert.equal(q1.orAlternative, 'A');
    assert.equal(q2.orAlternative, 'B');
    assert.equal(q1.moduleOrUnit, 'Module 1');
    assert.equal(questions.find((q) => q.questionNumber === 10)?.moduleOrUnit, 'Module 5');
    assert.equal(questions.find((q) => q.questionNumber === 10)?.orPairId, 'M5_PAIR_01');
    assert.ok(!/Q1 and Q2/.test(q1.questionText));
    assert.match(q1.subquestions[0].questionText, /informal design guidelines/i);
    assert.match(q2.subquestions[0].questionText, /Normalization/i);
  });

  it('does not concatenate subquestions without per-part marks tracking', () => {
    const subs = parseSubquestions(
      'a. Explain functional dependencies with suitable examples. (10 Marks) b. Define 3NF. (5 Marks)',
      1,
    );
    assert.equal(subs.length, 2);
    assert.equal(subs[0].maxMarks, 10);
    assert.equal(subs[1].maxMarks, 5);
    assert.equal(subs[0].letter, 'a');
  });

  it('marks MARKS_UNRESOLVED when marks are not visible', () => {
    const questions = parseQuestionsFromPaperText(
      'Module-1 1 a. Explain serializability with an example. b. Discuss lock based protocols.',
    );
    const q1 = questions[0];
    assert.ok(q1);
    assert.equal(q1.marksMissing, true);
    assert.equal(q1.verificationStatus, 'MARKS_UNRESOLVED');
  });

  it('preserves original wording and printed CO/RBT without rewriting', () => {
    const tags = extractPrintedAcademicTags('Explain 3NF with an example. (10 Marks) CO4 L2');
    assert.equal(tags.printedMarks, 10);
    assert.equal(tags.printedCo, 'CO4');
    assert.equal(tags.printedRbt, 'L2');
    const tabular = extractPrintedAcademicTags('Discuss the informal design guidelines for relation schema design. 08 L2 CO4');
    assert.equal(tabular.printedMarks, 8);
    assert.equal(tabular.printedCo, 'CO4');
    assert.equal(tabular.printedRbt, 'L2');
    const subs = parseSubquestions(
      'a. Explain the Database System Environment with neat diagram. (10 Marks) CO1 L2',
      1,
    );
    assert.equal(subs[0].originalText.includes('(10 Marks)'), true);
    assert.equal(subs[0].questionText.includes('(10 Marks)'), false);
    assert.match(subs[0].questionText, /Database System Environment/);
  });

  it('does not invent questions from empty letter stubs', () => {
    const questions = parseQuestionsFromPaperText('Module-1 1 a. b. c. 2 a. b.');
    assert.equal(questions.length, 0);
  });
});

describe('MCQ papers', () => {
  it('parses numbered 1-mark questions when instructed as fifty questions', () => {
    const text =
      'Answer all the fifty questions, each carries one mark. 1. Choose the correct article. a) a b) an c) the d) none 2. Identify the verb in the sentence. a) run b) quickly c) blue d) and';
    const qs = parseMcqPaper(text);
    assert.ok(qs.length >= 2);
    assert.equal(qs[0].maxMarks, 1);
    assert.equal(qs[0].questionType, 'MCQ');
  });
});

describe('duplicate paper collapse', () => {
  it('keeps the richer extraction when the same paper_id appears twice', async () => {
    const { collapseDuplicatePapers } = await import('./extractPipeline.js');
    const a = {
      metadata: {
        paperId: 'QPB-22MCA21-2023-JUN-SEE',
        courseCode: '22MCA21',
        subjectName: 'Database Management System',
        startPage: 3,
      },
      questions: [{ questionNumber: 1 }],
    };
    const b = {
      metadata: {
        paperId: 'QPB-22MCA21-2023-JUN-SEE',
        courseCode: '22MCA21',
        subjectName: 'Database Management System',
        startPage: 3,
      },
      questions: [{ questionNumber: 1 }, { questionNumber: 2 }],
    };
    const out = collapseDuplicatePapers([a, b] as never);
    assert.equal(out.length, 1);
    assert.equal(out[0].questions.length, 2);
  });
});

describe('merged document split', () => {
  it('uses INDEX + Degree Examination headers to split papers', () => {
    const pages = [
      { page: 1, text: 'Library and Information Centre VTU Question Papers MCA', charCount: 80 },
      {
        page: 2,
        text: 'INDEX S/L Subject Code Subject Title Exam Date 1 22MCA21 Database Management System June /July 2023 2 22MCA22 Object Oriented Programming Using Java June /July 2023',
        charCount: 200,
      },
      { page: 3, text: DBMS_TEXT, charCount: DBMS_TEXT.length },
      {
        page: 4,
        text: 'USN 22MCA22 Second Semester MCA Degree Examination, June/July 2023 Object Oriented Programming Using Java Time: 3 hrs. Max. Marks: 100 Note: Answer any FIVE full questions. Module-1 1 a. Explain JVM architecture. (10 Marks) b. Describe bytecode. (10 Marks) OR 2 a. Explain class and object. (10 Marks) b. Discuss constructors. (10 Marks)',
        charCount: 400,
      },
    ];
    const result = splitMergedDocument(pages, 'Previous Years QPs/MCA/2023 MCA Even sem.pdf', 'MCA');
    assert.equal(result.papers.length, 2);
    assert.equal(result.papers[0].metadata.courseCode, '22MCA21');
    assert.equal(result.papers[1].metadata.courseCode, '22MCA22');
    assert.ok(result.index.length >= 2);
  });
});

describe('ids and dates', () => {
  it('builds stable paper ids', () => {
    assert.equal(
      buildPaperId({ courseCode: 'BCS403', examYear: 2024, examMonth: 'JUN', examType: 'SEE' }),
      'QPB-BCS403-2024-JUN-SEE',
    );
  });

  it('parses Dec/Jan as January of the later year', () => {
    const r = monthKey('Dec.2023/Jan.2024');
    assert.equal(r.month, 'JAN');
    assert.equal(r.year, 2024);
  });
});

describe('index parser', () => {
  it('reads subject rows from INDEX pages', () => {
    const rows = parseIndex([
      {
        page: 2,
        text: 'INDEX S/L Subject Code Subject Title Exam Date 1 BCS403 Database Management Systems June /July 2024 2 BCS405 Operating Systems June /July 2024',
        charCount: 200,
      },
    ]);
    assert.ok(rows.length >= 2);
    assert.equal(rows[0].courseCode, 'BCS403');
    assert.match(rows[0].subjectName, /Database Management/i);
  });
});

describe('positional (coordinate-aware) extraction', () => {
  it('rebuilds a VTU OR pair with subquestions and marks from column geometry (old scheme)', () => {
    // Simulates the table layout: Q-number col (x~72), sub-letter (x~95),
    // text (x~115), inline marks "(NN Marks)" (x~513), Module/OR centered.
    const page = pageWithLines(1, [
      line(614, [[290, 'Module-1']]),
      line(600, [[72, '1'], [95, 'a.'], [115, 'Define a relation and its properties.'], [513, '(06 Marks)']]),
      line(580, [[95, 'b.'], [115, 'Explain functional dependencies with an example.'], [513, '(07 Marks)']]),
      line(560, [[96, 'c'], [100, '.'], [115, 'State and prove the transitive rule.'], [513, '(07 Marks)']]),
      line(461, [[308, 'OR']]),
      line(447, [[75, '2'], [95, 'a.'], [115, 'Describe the ER model with a neat diagram.'], [513, '(06 Marks)']]),
      line(420, [[95, 'b.'], [115, 'Discuss the three schema architecture.'], [513, '(14 Marks)']]),
    ]);
    const questions = parseQuestionsFromPaperLines([page]);
    assert.equal(questions.length, 2);
    const [q1, q2] = questions;
    assert.equal(q1.questionNumber, 1);
    assert.equal(q1.moduleOrUnit, 'Module 1');
    assert.equal(q1.subquestions.length, 3);
    assert.deepEqual(q1.subquestions.map((s) => s.maxMarks), [6, 7, 7]);
    assert.equal(q1.maxMarks, 20);
    // Both OR alternatives are captured as distinct questions.
    assert.equal(q2.questionNumber, 2);
    assert.equal(q2.subquestions.length, 2);
    assert.equal(q2.maxMarks, 20);
    assert.ok(q1.isOrChoice && q2.isOrChoice);
    assert.notEqual(q1.orAlternative, q2.orAlternative);
  });

  it('extracts M/L/C columns (new 2022 scheme) as marks, RBT and CO', () => {
    const page = pageWithLines(1, [
      line(663, [[268, 'Module'], [306, '–'], [315, '1']]),
      line(649, [[72, 'Q.1'], [105, 'a.'], [124, 'Define operating system and its functions.'], [479, '5'], [498, 'L1'], [525, 'CO1']]),
      line(623, [[105, 'b.'], [124, 'Explain the different types of system calls.'], [476, '15'], [498, 'L2'], [524, 'CO1']]),
    ]);
    const [q1] = parseQuestionsFromPaperLines([page]);
    assert.equal(q1.questionNumber, 1);
    assert.equal(q1.moduleOrUnit, 'Module 1');
    assert.deepEqual(q1.subquestions.map((s) => s.maxMarks), [5, 15]);
    assert.equal(q1.subquestions[0].printedCo, 'CO1');
    assert.equal(q1.subquestions[0].printedRbt, 'L1');
    assert.equal(q1.subquestions[1].printedRbt, 'L2');
    assert.equal(q1.maxMarks, 20);
  });

  it('ignores in-question data tables sitting in the middle columns', () => {
    const page = pageWithLines(1, [
      line(614, [[290, 'Module-3']]),
      line(600, [[72, '5'], [95, 'a.'], [115, 'Fit a straight line for the following data:'], [513, '(10 Marks)']]),
      // A data table — numbers live at x>=240, never in the Q-number/sub-letter columns.
      line(586, [[246, 'x'], [262, '1'], [288, '2'], [314, '3'], [340, '4'], [366, '5']]),
      line(572, [[246, 'y'], [262, '9'], [288, '8'], [314, '10'], [340, '12'], [366, '11']]),
      line(550, [[95, 'b.'], [115, 'Compute the correlation coefficient.'], [513, '(10 Marks)']]),
    ]);
    const [q5] = parseQuestionsFromPaperLines([page]);
    assert.equal(q5.questionNumber, 5);
    assert.equal(q5.subquestions.length, 2); // not fooled into extra questions by "1 2 3 4 5"
    assert.equal(q5.maxMarks, 20);
  });

  it('recovers Q-number sharing a baseline with Important Note footer', () => {
    const page = pageWithLines(1, [
      line(618, [[284, 'Module-2']]),
      line(500, [[73, '3'], [93, 'a.'], [112, 'Define Regular Expressions.'], [513, '(10 Marks)']]),
      line(400, [[300, 'OR']]),
      // Real VTU layout: Important Note text and Q4 share the same y.
      line(103, [
        [39, 'Important Note : 1. On completing your answers, compulsorily draw diagonal cross lines on the remaining blank pages.'],
        [73, '4'],
        [93, 'a.'],
        [112, 'State and prove Pumping Lemma for regular languages.'],
        [513, '(10 Marks)'],
      ]),
    ]);
    const questions = parseQuestionsFromPaperLines([page]);
    assert.deepEqual(
      questions.map((q) => q.questionNumber),
      [3, 4],
    );
    assert.match(questions.find((q) => q.questionNumber === 4)!.questionText, /Pumping Lemma/i);
  });

  it('recovers Q3 when footer has a stray leading glyph (fImportant Note)', () => {
    const page = pageWithLines(1, [
      line(200, [[282, 'Module-2']]),
      line(106, [
        [39, 'fImportant Note : 1. On completing your answers, compulsorily draw diagonal cross lines on the remaining blank pages.'],
        [73, '3'],
        [93, 'a.'],
        [112, 'A DMS has an alphabet S = {s1..s6}.'],
        [513, '(10 Marks)'],
      ]),
    ]);
    const [q3] = parseQuestionsFromPaperLines([page]);
    assert.equal(q3.questionNumber, 3);
    assert.match(q3.questionText, /DMS has an alphabet/i);
  });

  it('recovers continuation-page Q after USN header cell on the same line', () => {
    const page = pageWithLines(2, [
      line(754, [
        [66, 'USN'],
        [76, '5'],
        [96, 'a.'],
        [115, 'Explain the importance of three-state buffer.'],
        [513, '(06 Marks)'],
      ]),
      line(700, [[96, 'b.'], [115, 'Discuss open collector gates.'], [513, '(07 Marks)']]),
    ]);
    const [q5] = parseQuestionsFromPaperLines([page]);
    assert.equal(q5.questionNumber, 5);
    assert.equal(q5.sourcePage, 2);
    assert.match(q5.questionText, /three-state buffer/i);
  });

  it('does not treat footer page counters or malpractice note numbers as questions', () => {
    const page = pageWithLines(1, [
      line(618, [[284, 'Module-1']]),
      line(600, [[72, '1'], [95, 'a.'], [115, 'Define a process.'], [513, '(10 Marks)']]),
      line(200, [[50, '2. Any revealing of identification, appeal to evaluator and /or equations written eg, 42+8 = 50, will be treated as malpractice.']]),
      line(180, [[280, '2 of 2']]),
      line(100, [[39, 'Important Note : 1. On completing your answers, compulsorily draw diagonal cross lines on the remaining blank pages.']]),
    ]);
    const questions = parseQuestionsFromPaperLines([page]);
    assert.equal(questions.length, 1);
    assert.equal(questions[0].questionNumber, 1);
  });

  it('keeps multi-page continuation attached and records per-question source page', () => {
    const p1 = pageWithLines(10, [
      line(600, [[284, 'Module-1']]),
      line(580, [[72, '1'], [95, 'a.'], [115, 'Define OS.'], [513, '(10 Marks)']]),
      line(500, [[300, 'OR']]),
      line(480, [[72, '2'], [95, 'a.'], [115, 'Explain system calls.'], [513, '(10 Marks)']]),
    ]);
    const p2 = pageWithLines(11, [
      line(700, [[284, 'Module-2']]),
      line(680, [[72, '3'], [95, 'a.'], [115, 'Describe scheduling.'], [513, '(10 Marks)']]),
    ]);
    const questions = parseQuestionsFromPaperLines([p1, p2]);
    assert.deepEqual(
      questions.map((q) => q.questionNumber),
      [1, 2, 3],
    );
    assert.equal(questions.find((q) => q.questionNumber === 1)?.sourcePage, 10);
    assert.equal(questions.find((q) => q.questionNumber === 3)?.sourcePage, 11);
  });
});

describe('wrapped subject title', () => {
  it('reconstructs multi-line subject title between exam header and Time', () => {
    const lines = [
      line(742, [[64, 'USN'], [502, 'BCS403']]),
      line(705, [[118, 'Fourth Semester B.E. Degree Examination, June/July 2024']]),
      line(680, [[200, 'Database Management']]),
      line(665, [[220, 'Systems']]),
      line(640, [[71, 'Time: 3 hrs.'], [454, 'Max. Marks: 100']]),
    ];
    const name = extractSubjectNameFromLines(lines);
    assert.equal(name, 'Database Management Systems');
  });
});

describe('paper QA classification', () => {
  it('flags truncated source when pagesSeen < printed totalK', () => {
    const paper = {
      metadata: {
        paperId: 'QPB-TEST-2024-JUN-SEE',
        courseCode: 'BCS403',
        subjectName: 'Database Management Systems',
        scheme: '2022 Scheme',
        program: 'CSE',
        semester: '4',
        examType: 'SEE' as const,
        academicYear: '2023-24',
        examMonth: 'JUN',
        examYear: 2024,
        examDate: 'June/July 2024',
        maxMarks: 100,
        durationMinutes: 180,
        university: 'VTU',
        sourceFile: 'x.pdf',
        sourceType: 'PDF',
        extractionStatus: 'EXTRACTED' as const,
        verificationStatus: 'ACADEMIC_ANALYSIS',
        notes: null,
        startPage: 1,
        endPage: 1,
      },
      fullText:
        'Note: Answer any FIVE full questions, choosing ONE full question from each module. Module-1 1 a. ...',
      questions: [
        {
          questionNumber: 1,
          section: 'MODULE',
          moduleOrUnit: 'Module 1',
          originalText: 'Define relation',
          questionText: 'Define relation',
          questionType: 'DESCRIPTIVE' as const,
          maxMarks: 20,
          marksMissing: false,
          isOrChoice: true,
          orGroupId: 'M1_PAIR_01',
          orPairId: 'M1_PAIR_01',
          orAlternative: 'A' as const,
          moduleAssignmentMethod: 'SOURCE_EXPLICIT' as const,
          subquestions: [],
          bloomLevel: null,
          difficulty: null,
          sourcePage: 1,
          verificationStatus: 'PYQ_EXTRACTED',
          notes: null,
          printedCo: null,
          printedPo: null,
          printedPso: null,
          printedRbt: null,
          printedMarks: 20,
        },
      ],
      reviewItems: [],
    };
    const qa = classifyExtractedPaper(paper, { firstN: 1, totalK: 2, pagesSeen: 1 });
    assert.equal(qa.classification, 'SOURCE_TRUNCATION');
    assert.match(qa.reviewNote, /Only 1 of 2/);
  });

  it('treats MBA-style 8-question paper as special format, not parser defect', () => {
    const questions = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
      questionNumber: n,
      section: null,
      moduleOrUnit: null,
      originalText: `Question ${n} body text here for length`,
      questionText: `Question ${n} body text here for length`,
      questionType: 'DESCRIPTIVE' as const,
      maxMarks: 20,
      marksMissing: false,
      isOrChoice: false,
      orGroupId: null,
      orPairId: null,
      orAlternative: null,
      moduleAssignmentMethod: null,
      subquestions: [],
      bloomLevel: null,
      difficulty: null,
      sourcePage: 1,
      verificationStatus: 'PYQ_EXTRACTED',
      notes: null,
      printedCo: null,
      printedPo: null,
      printedPso: null,
      printedRbt: null,
      printedMarks: 20,
    }));
    const paper = {
      metadata: {
        paperId: 'QPB-22MBA11-2024-JAN-SEE',
        courseCode: '22MBA11',
        subjectName: 'Management & Organizational Behaviour',
        scheme: '2022 Scheme',
        program: 'MBA',
        semester: '1',
        examType: 'SEE' as const,
        academicYear: '2023-24',
        examMonth: 'JAN',
        examYear: 2024,
        examDate: 'Dec.2023/Jan.2024',
        maxMarks: 100,
        durationMinutes: 180,
        university: 'VTU',
        sourceFile: 'mba.pdf',
        sourceType: 'PDF',
        extractionStatus: 'EXTRACTED' as const,
        verificationStatus: 'ACADEMIC_ANALYSIS',
        notes: null,
        startPage: 3,
        endPage: 4,
      },
      fullText: 'First Semester MBA Degree Examination Time: 3 hrs. Max. Marks: 100 Q.1 a. ... Q.8 Case Study',
      questions,
      reviewItems: [],
    };
    const qa = classifyExtractedPaper(paper, { firstN: 1, totalK: 2, pagesSeen: 2 });
    assert.equal(qa.classification, 'VERIFIED_SPECIAL_FORMAT');
    assert.equal(qa.isStandardSee, false);
  });
});
