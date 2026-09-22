import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import ExcelJS from 'exceljs';
import { parseExamImport } from './importParser.js';

describe('examination VTU import parser', () => {
  it('normalizes CSV aliases, quoted values, and blank rows', async () => {
    const csv = 'University Seat Number,Subject Code,Result Status\n"1AB23CS001","BCS401","PASS"\n,,\n';
    const parsed = await parseExamImport(Buffer.from(csv).toString('base64'), 'result.csv');
    assert.equal(parsed.rows.length, 1);
    assert.deepEqual(parsed.rows[0], { usn: '1AB23CS001', courseCode: 'BCS401', resultStatus: 'PASS' });
    assert.match(parsed.fileHash, /^[a-f0-9]{64}$/);
  });

  it('parses the first XLSX worksheet by header name', async () => {
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('VTU');
    ws.addRow(['USN', 'Course Code', 'Revaluation Marks']); ws.addRow(['1AB23CS001', 'BCS401', 72]);
    const buffer = await wb.xlsx.writeBuffer();
    const parsed = await parseExamImport(Buffer.from(buffer).toString('base64'), 'revaluation.xlsx');
    assert.deepEqual(parsed.rows[0], { usn: '1AB23CS001', courseCode: 'BCS401', revisedMarks: 72 });
  });

  it('rejects unsupported authoritative formats', async () => {
    await assert.rejects(() => parseExamImport(Buffer.from('x').toString('base64'), 'scan.pdf'), /Only CSV and XLSX/);
  });
});
