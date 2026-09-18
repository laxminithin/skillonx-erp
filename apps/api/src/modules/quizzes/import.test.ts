import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseCsv, parseMcqText, parseJsonQuestions, parseQuizMarkdown } from './importService.js';

const sample = `Module 1 — Hadoop Fundamentals

1. Which component of Hadoop is responsible for distributed storage?
A) MapReduce
B) HDFS
C) YARN
D) Spark
Answer: B
Explanation: HDFS provides distributed storage across Hadoop nodes.

2. Which are Hadoop ecosystem components?
A) HDFS
B) YARN
C) PostgreSQL
D) MapReduce
Answer: A, B, D
`;

describe('question import parsers', () => {
  it('parses module-wise MCQ text with a verified answer key', () => {
    const items = parseMcqText(sample, 'bda.txt', 'Big Data Analytics', null);
    assert.equal(items.length, 2);
    assert.equal(items[0].questionText.includes('distributed storage'), true);
    assert.equal(items[0].options.find((o) => o.label === 'HDFS')?.isCorrect, true);
    assert.equal(items[0].options.filter((o) => o.isCorrect).length, 1);
    assert.equal(items[0].reviewStatus, 'APPROVED');
    assert.equal(items[1].questionType, 'MULTIPLE_SELECT');
    assert.equal(items[1].reviewStatus, 'APPROVED');
  });

  it('marks questions without an answer key as NEEDS_REVIEW and does not guess', () => {
    const items = parseMcqText(
      `1. What is YARN?
A) Storage
B) Resource manager
C) A database
D) A language
`,
      'missing.txt',
      'Big Data Analytics',
      'Module 1',
    );
    assert.equal(items.length, 1);
    assert.equal(items[0].reviewStatus, 'NEEDS_REVIEW');
    assert.equal(items[0].options.every((o) => o.isCorrect === false), true);
  });

  it('parses CSV rows', () => {
    const csv = `subject,module,question,option a,option b,option c,option d,answer,marks
Big Data Analytics,Module 1,HDFS stands for?,Hadoop Dist File System,Hive Data,Hadoop Dist File Store,None,A,1`;
    const items = parseCsv(csv, 'bda.csv');
    assert.equal(items.length, 1);
    assert.equal(items[0].options[0].isCorrect, true);
    assert.equal(items[0].reviewStatus, 'APPROVED');
  });

  it('parses structured JSON without inventing answers', () => {
    const json = JSON.stringify({
      subject: 'Big Data Analytics',
      questions: [
        {
          module: 'Module 2',
          questionText: 'True or false: HDFS stores data in blocks.',
          options: [
            { label: 'True', isCorrect: true },
            { label: 'False', isCorrect: false },
          ],
        },
      ],
    });
    const items = parseJsonQuestions(json, 'bda.json');
    assert.equal(items[0].questionType, 'TRUE_FALSE');
    assert.equal(items[0].reviewStatus, 'APPROVED');
  });

  it('parses assessment quiz.md headings, options, answers and difficulty', () => {
    const md = `# Quiz — Big Data Analytics — Module 1: Introduction

**Subject:** Big Data Analytics  
**Module:** Module 1 — Introduction to Big Data Analytics  

### Q01  ·  Easy
**Question:** What is the primary purpose of HDFS?

- **A.** CPU microcode
- **B.** Distributed storage
- **C.** A keyboard layout
- **D.** Uncompressed 4K cinema

**Answer:** B
**Explanation:** HDFS stores blocks across datanodes.

### Q02  ·  Intermediate
**Question:** Laney’s original ‘3Vs’ of Big Data are:

- **A.** Volume, Velocity, Variety
- **B.** B-tree, Bitmap, Bloom
- **C.** VLAN, VPN, VoIP
- **D.** Voltage, Viscosity, Vacuum

**Answer:** A
**Explanation:** Gartner/Laney.

## Quick answer key

Q01–B | Q02–A
`;
    const items = parseQuizMarkdown(md, 'quiz.md', 'Big Data Analytics', 'Module 1');
    assert.equal(items.length, 2);
    assert.equal(items[0].difficulty, 'EASY');
    assert.equal(items[1].difficulty, 'INTERMEDIATE');
    assert.equal(items[0].options.find((o) => o.label === 'Distributed storage')?.isCorrect, true);
    assert.equal(items[0].reviewStatus, 'APPROVED');
    assert.equal(items[0].sourceReference, 'Q01');
    assert.equal(items[0].subjectHint, 'Big Data Analytics');
  });
});
