import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { gradeAttempt, gradeQuestion, type SnapshotQuestion } from './grading.js';
import { computeAcademicCoverage } from '../questions/coValidation.js';
import { scoreQuestionAgainstCo, suggestPrimaryCo } from '../questions/quizCoMappingPass.js';
import { pickReplacement, type GeneratorPoolItem } from './generator.js';
import { parseQuizMarkdown } from './importService.js';

describe('quiz CO mapping quality gates', () => {
  it('does not map shallow SQL acronym recall to a design-normalized-schema CO', () => {
    const { score } = scoreQuestionAgainstCo(
      'What does SQL stand for?',
      'Design a normalized relational schema for a given enterprise scenario',
    );
    assert.ok(score < 0.2, `expected low score, got ${score}`);
  });

  it('prefers definitional CO for definitional questions', () => {
    const cos = [
      { id: 1, co_code: 'CO1', statement: 'Understand and explain fundamental DBMS concepts architecture database system', co_number: 1 },
      { id: 2, co_code: 'CO3', statement: 'Design normalized database schemas and write complex SQL queries', co_number: 3 },
    ];
    const suggestion = suggestPrimaryCo(
      'Which option best describes a DBMS database management system architecture?',
      cos,
      'Module 1 — Fundamentals',
    );
    // Intent matcher may return NEEDS_REVIEW with a candidate CO, or ACADEMIC_ANALYSIS
    if (suggestion.primaryCoCode) {
      assert.equal(suggestion.primaryCoCode, 'CO1');
    } else {
      // Honest gate: insufficient overlap → NEEDS_REVIEW without fabricating certainty
      assert.equal(suggestion.verificationStatus, 'NEEDS_REVIEW');
    }
    const s1 = scoreQuestionAgainstCo(
      'Which option best describes a DBMS database management system architecture?',
      cos[0].statement,
    ).score;
    const s3 = scoreQuestionAgainstCo(
      'Which option best describes a DBMS database management system architecture?',
      cos[1].statement,
    ).score;
    assert.ok(s1 > s3, `expected CO1 score ${s1} > CO3 score ${s3}`);
  });

  it('marks subjects without COs as blocked (no fabricated COs)', () => {
    const suggestion = suggestPrimaryCo('Any question?', []);
    assert.equal(suggestion.verificationStatus, 'CO_MAPPING_BLOCKED');
    assert.equal(suggestion.primaryCoCode, null);
  });
});

describe('quiz academic coverage', () => {
  it('reports per-CO counts', () => {
    const coverage = computeAcademicCoverage([
      { primaryCoCode: 'CO1' },
      { primaryCoCode: 'CO1' },
      { primaryCoCode: 'CO2' },
      { primaryCoCode: null },
    ]);
    assert.equal(coverage.byCo.CO1, 2);
    assert.equal(coverage.byCo.CO2, 1);
    assert.equal(coverage.unmapped, 1);
    assert.equal(coverage.total, 4);
  });
});

describe('question replacement prefers Primary CO', () => {
  it('preserves Primary CO when inventory allows', () => {
    const pool: GeneratorPoolItem[] = [
      { id: 1, courseId: 10, moduleId: 1, difficulty: 'EASY', fingerprint: 'a', reviewStatus: 'APPROVED', primaryCoCode: 'CO1' },
      { id: 2, courseId: 10, moduleId: 1, difficulty: 'EASY', fingerprint: 'b', reviewStatus: 'APPROVED', primaryCoCode: 'CO2' },
      { id: 3, courseId: 10, moduleId: 1, difficulty: 'EASY', fingerprint: 'c', reviewStatus: 'APPROVED', primaryCoCode: 'CO1' },
    ];
    const picked = pickReplacement(pool, {
      courseId: 10,
      moduleIds: [1],
      difficulty: 'EASY',
      excludeIds: [1],
      preferredModuleId: 1,
      preferredPrimaryCo: 'CO1',
    }, () => 0.1);
    assert.ok(picked);
    assert.equal(picked!.primaryCoCode, 'CO1');
    assert.equal(picked!.id, 3);
  });
});

describe('CO Performance aggregation (not attainment)', () => {
  it('computes CO1 50% and CO2 100% for the required example', () => {
    const questions: SnapshotQuestion[] = [
      {
        id: 1,
        questionText: 'Q1',
        questionType: 'SINGLE_CHOICE',
        marks: 1,
        maxMarks: 1,
        primaryCoCode: 'CO1',
        options: [
          { id: 11, label: 'A', isCorrect: true },
          { id: 12, label: 'B', isCorrect: false },
        ],
        correctOptionIds: [11],
      },
      {
        id: 2,
        questionText: 'Q2',
        questionType: 'SINGLE_CHOICE',
        marks: 1,
        maxMarks: 1,
        primaryCoCode: 'CO1',
        options: [
          { id: 21, label: 'A', isCorrect: true },
          { id: 22, label: 'B', isCorrect: false },
        ],
        correctOptionIds: [21],
      },
      {
        id: 3,
        questionText: 'Q3',
        questionType: 'SINGLE_CHOICE',
        marks: 1,
        maxMarks: 1,
        primaryCoCode: 'CO2',
        options: [
          { id: 31, label: 'A', isCorrect: true },
          { id: 32, label: 'B', isCorrect: false },
        ],
        correctOptionIds: [31],
      },
    ];
    const graded = gradeAttempt(
      questions,
      [
        { questionId: 1, selectedOptionIds: [11] },
        { questionId: 2, selectedOptionIds: [22] },
        { questionId: 3, selectedOptionIds: [31] },
      ],
      40,
    );
    assert.equal(graded.percentage, 66.67);
    assert.equal(graded.obtainedMarks, 2);
    assert.equal(graded.answers[0].primaryCoCode, 'CO1');
    assert.equal(graded.answers[0].awardedMarks, 1);
    assert.equal(graded.answers[0].maxMarks, 1);
    assert.equal(graded.answers[1].awardedMarks, 0);
    assert.equal(graded.answers[2].primaryCoCode, 'CO2');
    assert.equal(graded.answers[2].awardedMarks, 1);

    const byCo = new Map<string, { awarded: number; max: number }>();
    for (const a of graded.answers) {
      const co = a.primaryCoCode || 'UNMAPPED';
      const bucket = byCo.get(co) ?? { awarded: 0, max: 0 };
      bucket.awarded += a.awardedMarks;
      bucket.max += a.maxMarks;
      byCo.set(co, bucket);
    }
    assert.equal(Math.round((byCo.get('CO1')!.awarded / byCo.get('CO1')!.max) * 100), 50);
    assert.equal(Math.round((byCo.get('CO2')!.awarded / byCo.get('CO2')!.max) * 100), 100);
  });

  it('preserves grading regression for correct/incorrect scoring', () => {
    const q: SnapshotQuestion = {
      id: 9,
      questionText: 'HDFS?',
      questionType: 'SINGLE_CHOICE',
      marks: 1,
      primaryCoCode: 'CO1',
      options: [
        { id: 1, label: 'MapReduce', isCorrect: false },
        { id: 2, label: 'HDFS', isCorrect: true },
      ],
      correctOptionIds: [2],
    };
    assert.equal(gradeQuestion(q, { questionId: 9, selectedOptionIds: [2] }).awardedMarks, 1);
    assert.equal(gradeQuestion(q, { questionId: 9, selectedOptionIds: [1] }).awardedMarks, 0);
  });
});

describe('quiz.md CO metadata (backward compatible)', () => {
  it('parses Primary CO fields without breaking classic questions', () => {
    const md = `# Quiz

**Subject:** Demo Subject
**Module:** Module 1 — Intro

### Q01  ·  Easy
**Question:** What is a process?
- **A.** A program in execution
- **B.** A compiler
- **C.** A disk
- **D.** A browser
**Answer:** A
**Explanation:** Classic definition.
**Primary CO:** CO1
**CO Mapping Basis:** Definitional match to fundamentals CO
**CO Verification Status:** ACADEMIC_ANALYSIS

### Q02  ·  Easy
**Question:** An interrupt is:
- **A.** Async signal
- **B.** Compiler flag
- **C.** Disk format
- **D.** User password
**Answer:** A
**Explanation:** No CO fields — legacy format.
`;
    const candidates = parseQuizMarkdown(md, '/tmp/quiz.md', 'Demo Subject', 'Module 1 — Intro');
    assert.equal(candidates.length, 2);
    assert.equal(candidates[0].primaryCoCode, 'CO1');
    assert.equal(candidates[0].verificationStatus, 'ACADEMIC_ANALYSIS');
    assert.equal(candidates[1].primaryCoCode, null);
    assert.equal(candidates[0].options.find((o) => o.isCorrect)?.label, 'A program in execution');
  });
});

describe('snapshot CO fields do not alter public student payload contract', () => {
  it('keeps answer-key free public shape', async () => {
    const { toPublicQuestion } = await import('./serialize.js');
    const q: SnapshotQuestion = {
      id: 1,
      questionText: 'Q',
      questionType: 'SINGLE_CHOICE',
      marks: 1,
      primaryCoCode: 'CO1',
      derivedOutcomes: { pos: ['PO1'], psos: [], sdgs: [], mappingVersionId: 9 },
      options: [{ id: 1, label: 'A', isCorrect: true }],
      correctOptionIds: [1],
    };
    const pub = toPublicQuestion(q);
    assert.equal('primaryCoCode' in pub, false);
    assert.equal('correctOptionIds' in pub, false);
    assert.equal(pub.marks, 1);
  });
});
