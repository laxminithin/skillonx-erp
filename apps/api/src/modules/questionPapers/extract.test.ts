import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import { extractPdfPages } from './pdfExtract.js';
import { splitMergedDocument } from './parser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SAMPLE = path.resolve(
  __dirname,
  '../../../../../apps/web/public/Previous Years QPs/MCA/2023 MCA Even sem.pdf',
);

describe('real PDF extraction', () => {
  it('extracts MCA 2023 Even merged file into individual papers with questions', async () => {
    const pages = await extractPdfPages(SAMPLE);
    assert.ok(pages.length >= 10);
    assert.ok(pages.some((p) => p.charCount > 200));
    const split = splitMergedDocument(pages, 'Previous Years QPs/MCA/2023 MCA Even sem.pdf', 'MCA');
    assert.ok(split.papers.length >= 5);
    const dbms = split.papers.find((p) => p.metadata.courseCode === '22MCA21');
    assert.ok(dbms, 'DBMS paper 22MCA21 should be detected from header, not filename');
    assert.equal(dbms!.metadata.examType, 'SEE');
    assert.equal(dbms!.metadata.maxMarks, 100);
    assert.ok(dbms!.questions.length >= 8);
    assert.ok(dbms!.questions.some((q) => q.orGroupId));
    assert.ok(dbms!.questions.some((q) => q.subquestions.length >= 2));
    assert.ok(dbms!.questions.some((q) => /normal/i.test(q.questionText)));
  });
});
