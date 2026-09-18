import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  computeReadiness,
  isPyqSource,
  isReadyForInternalPaper,
  pyqCoverageReport,
  insufficientPyqCoverageError,
  MASTER_QUESTION_SOURCE_TYPE,
} from './sourcePolicy.js';

describe('master question bank source policy', () => {
  it('treats only previous-year papers as a valid question source', () => {
    assert.equal(isPyqSource(MASTER_QUESTION_SOURCE_TYPE), true);
    assert.equal(isPyqSource(null, 'PREVIOUS_YEAR'), true);
    assert.equal(isPyqSource('TEXTBOOK'), false);
    assert.equal(isPyqSource(null, 'QUESTION_BANK'), false);
    assert.equal(isPyqSource(null, 'CUSTOM'), false);
  });

  it('does not mark a question READY without PYQ + textbook-backed solution + scheme', () => {
    const extracted = computeReadiness({
      sourceType: MASTER_QUESTION_SOURCE_TYPE,
      sourcePaperId: 'P1',
      originalQuestionText: 'Explain ACID properties.',
      marks: 10,
      moduleName: 'Module 5',
      moduleId: 5,
      coCode: 'CO5',
      coVerified: true,
      rbtLevel: 'L2',
      bloomLevel: 'UNDERSTAND',
    });
    assert.equal(extracted.ready, false);
    assert.equal(extracted.status, 'TEXTBOOK_SOURCE_REQUIRED');
    assert.equal(isReadyForInternalPaper(extracted.status), false);

    const ready = computeReadiness({
      sourceType: MASTER_QUESTION_SOURCE_TYPE,
      sourcePaperId: 'P1',
      originalQuestionText: 'Explain ACID properties.',
      marks: 10,
      moduleName: 'Module 5',
      moduleId: 5,
      coCode: 'CO5',
      coVerified: true,
      poDerived: true,
      psoDerived: true,
      rbtLevel: 'L2',
      textbookId: 1,
      hasTextbookSource: true,
      hasTextbookSolution: true,
      solutionStatus: 'TEXTBOOK_GROUNDED',
      hasScheme: true,
      schemeValid: true,
      schemeStatus: 'READY',
    });
    assert.equal(ready.ready, true);
    assert.equal(ready.status, 'READY_FOR_INTERNAL_PAPER');
  });

  it('keeps historical printed CO when it disagrees with current mapping', () => {
    const r = computeReadiness({
      sourceType: MASTER_QUESTION_SOURCE_TYPE,
      sourcePaperId: 'P1',
      originalQuestionText: 'Normalize the relation.',
      marks: 10,
      moduleId: 4,
      moduleName: 'Module 4',
      coCode: 'CO4',
      mappingDiscrepancy: true,
      coMappingStatus: 'MAPPING_DISCREPANCY',
      rbtLevel: 'L3',
      textbookId: 1,
      hasTextbookSolution: true,
      hasScheme: true,
    });
    assert.equal(r.status, 'MAPPING_DISCREPANCY');
    assert.equal(r.ready, false);
  });

  it('reports insufficient PYQ coverage instead of inventing questions', () => {
    const coverage = pyqCoverageReport({
      eligibleQuestions: 7,
      availableUsableMarks: 30,
      required: 50,
    });
    const err = insufficientPyqCoverageError(coverage);
    assert.equal(err.code, 'INSUFFICIENT_PYQ_COVERAGE');
    assert.match(err.message, /Insufficient PYQ Coverage/);
    assert.match(err.message, /Eligible Questions: 7/);
    assert.match(err.message, /Available usable marks: 30/);
    assert.match(err.message, /Required: 50/);
  });
});
