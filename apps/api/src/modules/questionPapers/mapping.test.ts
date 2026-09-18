import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { inferModule } from './mapping.js';
import { inferPrimaryCoFromIntent } from '../questions/coMapping.js';
import type { ParsedQuestion } from './types.js';

function q(partial: Partial<ParsedQuestion> & { questionText: string }): ParsedQuestion {
  return {
    questionNumber: 1,
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
    printedMarks: partial.maxMarks ?? 10,
    ...partial,
  };
}

describe('module mapping', () => {
  const modules = [
    { id: 1, name: 'Module 1 — ER Model and DBMS concepts', description: 'database environment schema architecture attributes' },
    { id: 2, name: 'Module 2 — Relational algebra', description: 'select project join division unary operations' },
    { id: 3, name: 'Module 3 — SQL and JDBC', description: 'sql query views aggregate functions jdbc drivers' },
    { id: 4, name: 'Module 4 — Normalization', description: 'functional dependencies BCNF 1NF 2NF 3NF' },
    { id: 5, name: 'Module 5 — Transactions', description: 'ACID concurrency locking recoverability serializability' },
  ];

  it('uses paper module heading rather than question number', () => {
    const mapped = inferModule({
      question: q({
        questionNumber: 8,
        moduleOrUnit: 'Module 4',
        questionText: 'Explain BCNF with an example and discuss functional dependencies.',
      }),
      modules,
    });
    assert.equal(mapped.moduleId, 4);
    assert.match(mapped.moduleName || '', /Module 4/i);
  });

  it('maps by question intent when heading is absent — not Qn = Module n', () => {
    const mapped = inferModule({
      question: q({
        questionNumber: 1,
        moduleOrUnit: null,
        questionText: 'Explain ACID properties of a transaction and lock based concurrency control.',
      }),
      modules,
    });
    assert.equal(mapped.moduleId, 5);
  });

  it('does not blindly map Q1 to Module 1 when topics belong to another module', () => {
    const mapped = inferModule({
      question: q({
        questionNumber: 1,
        moduleOrUnit: 'Module 1',
        moduleAssignmentMethod: 'VTU_STANDARD_PAIR_PATTERN',
        questionText: 'Explain ACID properties of a transaction and lock based concurrency control.',
      }),
      modules,
    });
    assert.equal(mapped.moduleId, 5);
    assert.equal(mapped.assignmentMethod, 'SYLLABUS_TOPIC_VERIFIED');
  });

  it('keeps an explicit paper Module-1 heading even when the topic is normalization', () => {
    const mapped = inferModule({
      question: q({
        questionNumber: 1,
        moduleOrUnit: 'Module 1',
        moduleAssignmentMethod: 'SOURCE_EXPLICIT',
        questionText: 'What is Normalization? Explain 1NF, 2NF and 3NF with suitable examples.',
      }),
      modules,
    });
    assert.equal(mapped.moduleId, 1);
    assert.equal(mapped.assignmentMethod, 'SOURCE_EXPLICIT');
  });
});

describe('CO mapping is not Module N = CO N', () => {
  it('maps normalization intent to CO about normalization even under Module 1 heading', () => {
    const inference = inferPrimaryCoFromIntent({
      questionText: 'What is Normalization? Discuss 1NF, 2NF, 3NF and BCNF with examples.',
      moduleHint: 'Module 1 — Database environment',
      outcomes: [
        { id: 1, coCode: 'CO1', statement: 'Explain database system concepts, architecture and ER modelling.' },
        { id: 2, coCode: 'CO2', statement: 'Apply relational algebra operations on database schemas.' },
        { id: 3, coCode: 'CO3', statement: 'Write SQL queries and use views and JDBC.' },
        { id: 4, coCode: 'CO4', statement: 'Apply normalization including 1NF 2NF 3NF and BCNF using functional dependencies.' },
        { id: 5, coCode: 'CO5', statement: 'Explain transactions, ACID properties and concurrency control.' },
      ],
    });
    assert.equal(inference.primaryCoCode, 'CO4');
    assert.equal(inference.coMappingBlocked, false);
  });

  it('blocks CO mapping when the subject has no outcomes', () => {
    const inference = inferPrimaryCoFromIntent({
      questionText: 'Explain normalization',
      outcomes: [],
    });
    assert.equal(inference.coMappingBlocked, true);
    assert.equal(inference.verificationStatus, 'CO_MAPPING_BLOCKED');
  });
});
