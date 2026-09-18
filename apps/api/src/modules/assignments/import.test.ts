import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseAssignmentMarkdown } from './importService.js';

const SAMPLE = `# Assignment — Theory of Computation — Module 1

**Subject:** Theory of Computation  
**Module:** Module 1 — Introduction  

### A01  ·  Easy  ·  5 marks  ·  DESCRIPTIVE  ·  CO1
**Question:** Define alphabet, string and language.

**Expected Key Points:**
- Alphabet is a finite nonempty set
- String is a finite sequence
- Language is any subset of Σ*
**Mapping Basis:** Assesses foundational automata vocabulary.
**Verification:** ACADEMIC_ANALYSIS

### A02  ·  Intermediate  ·  10 marks  ·  DESIGN  ·  CO2
**Question:** Design a DFA for even number of 1s.

**Model answer:** States even/odd; flip on 1; F={even}.
`;

describe('parseAssignmentMarkdown', () => {
  it('parses extended metadata and model-answer alias', () => {
    const items = parseAssignmentMarkdown(SAMPLE, 'toc/m1/assignment.md', 'Theory of Computation', 'Module 1');
    assert.equal(items.length, 2);
    assert.equal(items[0].sourceReference, 'A01');
    assert.equal(items[0].difficulty, 'EASY');
    assert.equal(items[0].questionType, 'DESCRIPTIVE');
    assert.equal(items[0].primaryCoCode, 'CO1');
    assert.ok(items[0].expectedAnswerGuidance?.includes('Alphabet'));
    assert.equal(items[0].verificationStatus, 'ACADEMIC_ANALYSIS');
    assert.equal(items[1].questionType, 'DESIGN');
    assert.ok(items[1].expectedAnswerGuidance?.includes('even/odd'));
  });
});
