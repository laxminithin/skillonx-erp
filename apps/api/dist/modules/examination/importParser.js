import crypto from 'node:crypto';
import ExcelJS from 'exceljs';
import { AppError } from '../../utils/errors.js';
const aliases = {
    usn: 'usn', universityseatnumber: 'usn', studentusn: 'usn',
    subjectcode: 'courseCode', coursecode: 'courseCode', code: 'courseCode',
    subjectname: 'courseName', coursename: 'courseName',
    examdate: 'examDate', date: 'examDate', starttime: 'startTime', time: 'startTime', endtime: 'endTime',
    attempt: 'attemptType', attempttype: 'attemptType', registrationstatus: 'registrationStatus',
    marks: 'marks', externalmarks: 'marks', result: 'resultStatus', resultstatus: 'resultStatus', grade: 'grade',
    revisedmarks: 'revisedMarks', revaluationmarks: 'revisedMarks', outcome: 'outcome', externalreference: 'externalReference',
};
function key(v) { return String(v ?? '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function scalar(v) {
    if (v == null)
        return null;
    if (v instanceof Date)
        return v.toISOString();
    if (typeof v === 'object' && 'text' in v)
        return String(v.text);
    return typeof v === 'number' ? v : String(v).trim();
}
function normalize(headers, values) {
    const row = {};
    headers.forEach((h, i) => { const mapped = aliases[key(h)] || key(h); if (mapped)
        row[mapped] = scalar(values[i]); });
    return row;
}
function csvRows(input) {
    const out = [];
    let row = [];
    let cell = '';
    let quoted = false;
    for (let i = 0; i < input.length; i += 1) {
        const c = input[i];
        if (c === '"' && quoted && input[i + 1] === '"') {
            cell += '"';
            i += 1;
        }
        else if (c === '"')
            quoted = !quoted;
        else if (c === ',' && !quoted) {
            row.push(cell);
            cell = '';
        }
        else if ((c === '\n' || c === '\r') && !quoted) {
            if (c === '\r' && input[i + 1] === '\n')
                i += 1;
            row.push(cell);
            if (row.some((x) => x.trim()))
                out.push(row);
            row = [];
            cell = '';
        }
        else
            cell += c;
    }
    row.push(cell);
    if (row.some((x) => x.trim()))
        out.push(row);
    return out;
}
export async function parseExamImport(fileBase64, fileName) {
    const buffer = Buffer.from(fileBase64, 'base64');
    if (!buffer.length || buffer.length > 15 * 1024 * 1024)
        throw new AppError(400, 'Import file must be between 1 byte and 15 MB');
    const ext = fileName.toLowerCase().split('.').pop();
    let matrix = [];
    if (ext === 'csv')
        matrix = csvRows(buffer.toString('utf8'));
    else if (ext === 'xlsx') {
        const wb = new ExcelJS.Workbook();
        await wb.xlsx.load(buffer);
        const ws = wb.worksheets[0];
        if (!ws)
            throw new AppError(400, 'Workbook has no worksheet');
        ws.eachRow((r) => matrix.push(r.values.slice(1)));
    }
    else
        throw new AppError(400, 'Only CSV and XLSX imports are supported');
    if (matrix.length < 2)
        throw new AppError(400, 'Import must contain a header and at least one data row');
    const [headers, ...data] = matrix;
    const rows = data.filter((r) => r.some((v) => String(v ?? '').trim())).map((r) => normalize(headers, r));
    return { rows, fileHash: crypto.createHash('sha256').update(buffer).digest('hex') };
}
