import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseQuestionsFromPaperText } from './parser.js';
import { assignVtuOrStructure, looksLikeStandardFiveModulePaper, verifyModuleAgainstSyllabus } from './vtuStructure.js';
import type { ParsedQuestion } from './types.js';

function q(partial: Partial<ParsedQuestion> & { questionText: string; questionNumber: number }): ParsedQuestion {
  return {
    section: 'MODULE',
    moduleOrUnit: null,
    questionType: 'DESCRIPTIVE',
    maxMarks: 10,
    marksMissing: false,
    isOrChoice: false,
    orGroupId: null,
    orPairId: null,
    orAlternative: null,
    moduleAssignmentMethod: null,
    subquestions: [],
    bloomLevel: 'UNDERSTAND',
    difficulty: 'EASY',
    sourcePage: 1,
    verificationStatus: 'ACADEMIC_ANALYSIS',
    notes: null,
    originalText: partial.questionText,
    printedCo: null,
    printedPo: null,
    printedPso: null,
    printedRbt: null,
    printedMarks: 10,
    ...partial,
  };
}

describe('VTU OR / module structure', () => {
  it('recognises the standard five-module Q1–Q10 paper', () => {
    const questions = Array.from({ length: 10 }, (_, i) =>
      q({
        questionNumber: i + 1,
        questionText: `Question ${i + 1} body with enough text here.`,
        isOrChoice: i % 2 === 0,
        moduleOrUnit: `Module ${Math.ceil((i + 1) / 2)}`,
      }),
    );
    assert.equal(looksLikeStandardFiveModulePaper(questions), true);
    const assigned = assignVtuOrStructure(questions);
    assert.equal(assigned.find((x) => x.questionNumber === 1)?.orPairId, 'M1_PAIR_01');
    assert.equal(assigned.find((x) => x.questionNumber === 2)?.orAlternative, 'B');
    assert.equal(assigned.find((x) => x.questionNumber === 9)?.orPairId, 'M5_PAIR_01');
    assert.equal(assigned.find((x) => x.questionNumber === 10)?.moduleOrUnit, 'Module 5');
  });

  it('does not invent OR pairs for an MCQ paper', () => {
    const questions = [
      q({ questionNumber: 1, questionText: 'Choose the correct option about ER models here.', questionType: 'MCQ' }),
      q({ questionNumber: 2, questionText: 'Choose the correct option about SQL joins here.', questionType: 'MCQ' }),
    ];
    const assigned = assignVtuOrStructure(questions);
    assert.equal(assigned[0].orPairId, null);
  });

  it('keeps both alternatives as separate questions after parse', () => {
    const text =
      'Module-1 1 a. Explain informal design guidelines. (4 Marks) b. Define functional dependency. (6 Marks) OR 2 a. What is Normalization? (6 Marks) b. Discuss anomalies. (4 Marks) Module-2 3 a. Explain SELECT. (6 Marks) b. Prove commutative. (4 Marks) OR 4 a. Explain join. (5 Marks) b. Explain division. (5 Marks) Module-3 5 a. SQL structure. (5 Marks) b. Views. (5 Marks) OR 6 a. Aggregates. (6 Marks) b. JDBC. (4 Marks) Module-4 7 a. BCNF. (4 Marks) b. Lossless. (6 Marks) OR 8 a. 4NF. (4 Marks) b. MVD. (6 Marks) Module-5 9 a. ACID. (5 Marks) b. Recoverability. (5 Marks) OR 10 a. Locks. (4 Marks) b. Granularity. (6 Marks)';
    const questions = parseQuestionsFromPaperText(text);
    assert.equal(questions.length, 10);
    assert.equal(questions.filter((x) => x.orPairId === 'M1_PAIR_01').length, 2);
    assert.equal(questions.find((x) => x.questionNumber === 1)?.orAlternative, 'A');
    assert.equal(questions.find((x) => x.questionNumber === 2)?.orAlternative, 'B');
  });

  it('overrides a standard-pair guess when syllabus topics disagree', () => {
    const mapped = verifyModuleAgainstSyllabus(
      q({
        questionNumber: 1,
        moduleOrUnit: 'Module 1',
        moduleAssignmentMethod: 'VTU_STANDARD_PAIR_PATTERN',
        questionText: 'Explain ACID properties of a transaction and lock based concurrency control.',
      }),
      [
        { id: 1, name: 'Module 1 — ER Model', description: 'database environment schema architecture' },
        { id: 5, name: 'Module 5 — Transactions', description: 'ACID concurrency locking recoverability serializability' },
      ],
    );
    assert.equal(mapped.moduleId, 5);
    assert.equal(mapped.assignmentMethod, 'SYLLABUS_TOPIC_VERIFIED');
  });
});
