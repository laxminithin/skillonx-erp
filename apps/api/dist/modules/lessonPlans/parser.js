import fs from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
import { createHash } from 'node:crypto';
import { fingerprintParts, normalizeLessonText, } from '../../types/lessonPlan.js';
const SUBJECT_SHEETS = new Set([
    'BDA',
    'INS',
    'DBMS',
    'CN-I',
    'TOC',
    'PC',
    'Java',
    'IB',
    'RM-IPR',
    'CHEM',
    'DL',
    'OS',
]);
const EXTRA_ALIASES = {
    bda: 'Big Data Analytics',
    ins: 'Information and Network Security',
    dbms: 'Database Management Systems',
    'cn i': 'Computer Networks-I',
    cni: 'Computer Networks-I',
    'computer networks i': 'Computer Networks-I',
    toc: 'Theory of Computation',
    pc: 'Parallel Computing',
    java: 'Object Oriented Programming with Java',
    oop: 'Object Oriented Programming with Java',
    'object oriented programming with java': 'Object Oriented Programming with Java',
    ib: 'International Business',
    'rm ipr': 'Research Methodology and IPR',
    rmipr: 'Research Methodology and IPR',
    'research methodology ipr': 'Research Methodology and IPR',
    chem: 'Chemistry',
    dl: 'Deep Learning',
    os: 'Operating Systems',
};
function apiRoot() {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
}
export function lessonPlanSearchRoots() {
    const root = apiRoot();
    const publicDir = path.resolve(root, '../web/public/lesson-plan');
    const distDir = path.resolve(root, '../web/dist/lesson-plan');
    const spaced = path.resolve(root, '../web/public/lesson plan');
    let xlsxDir = distDir;
    try {
        if (readdirSync(publicDir).some((name) => /\.xlsx$/i.test(name)))
            xlsxDir = publicDir;
    }
    catch {
        /* use dist */
    }
    return [xlsxDir, spaced];
}
export function aliasCanonicalName(raw, indexNames = []) {
    const key = normalizeLessonText(raw);
    if (EXTRA_ALIASES[key])
        return EXTRA_ALIASES[key];
    const hit = indexNames.find((n) => normalizeLessonText(n) === key);
    return hit ?? null;
}
export function parseModuleLabel(raw) {
    const match = String(raw ?? '').match(/\b(module|unit)\s*0*(\d+)\b/i);
    if (!match)
        return null;
    const kind = match[1].toLowerCase() === 'unit' ? 'UNIT' : 'MODULE';
    const number = Number(match[2]);
    const label = `${kind === 'UNIT' ? 'Unit' : 'Module'} ${number}`;
    return { kind, number, label };
}
function cellText(value) {
    if (value == null)
        return '';
    if (typeof value === 'object' && value && 'text' in value) {
        return String(value.text ?? '').trim();
    }
    if (typeof value === 'object' && value && 'richText' in value) {
        return (value.richText ?? []).map((t) => t.text).join('').trim();
    }
    if (typeof value === 'object' && value && 'result' in value) {
        return cellText(value.result);
    }
    return String(value).trim();
}
function cellNumber(value) {
    if (value == null || value === '')
        return null;
    if (typeof value === 'number' && Number.isFinite(value))
        return value;
    const n = Number(cellText(value));
    return Number.isFinite(n) ? n : null;
}
function hoursSourceOf(raw) {
    const t = (raw ?? '').trim().toLowerCase();
    if (!t || t === 'estimated' || t.startsWith('estimat'))
        return 'ESTIMATED';
    return 'SOURCE';
}
function classificationOf(raw) {
    const t = (raw ?? '').trim().toUpperCase();
    if (t === 'SUPPLEMENTARY')
        return 'SUPPLEMENTARY';
    return 'CORE';
}
function rowHash(parts) {
    return createHash('sha1').update(parts.join('|')).digest('hex').slice(0, 24);
}
function metaKey(subject, moduleNumber, topic, subtopic) {
    return fingerprintParts(subject, moduleNumber, topic, subtopic);
}
export async function parseLessonPlanWorkbook(file) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(file);
    const sourceFile = path.basename(file);
    const indexSheet = wb.getWorksheet('SUBJECT INDEX');
    const subjects = [];
    if (indexSheet) {
        indexSheet.eachRow((row, i) => {
            if (i === 1)
                return;
            const name = cellText(row.getCell(2).value);
            if (!name)
                return;
            subjects.push({
                code: cellText(row.getCell(1).value) || null,
                name,
                program: cellText(row.getCell(3).value) || null,
                semester: cellText(row.getCell(4).value) || null,
                moduleCount: cellNumber(row.getCell(5).value),
                topicCount: cellNumber(row.getCell(6).value),
                subtopicCount: cellNumber(row.getCell(7).value),
                hours: cellNumber(row.getCell(8).value),
                source: cellText(row.getCell(9).value) || null,
            });
        });
    }
    const nameByNormalized = new Map(subjects.map((s) => [normalizeLessonText(s.name), s.name]));
    const codeByName = new Map(subjects.map((s) => [s.name, s.code]));
    const meta = new Map();
    for (const ws of wb.worksheets) {
        if (!SUBJECT_SHEETS.has(ws.name))
            continue;
        const alias = aliasCanonicalName(ws.name, subjects.map((s) => s.name));
        const subjectName = alias ?? nameByNormalized.get(normalizeLessonText(ws.name)) ?? ws.name;
        ws.eachRow((row, i) => {
            if (i === 1)
                return;
            const moduleRaw = cellText(row.getCell(2).value);
            const parsed = parseModuleLabel(moduleRaw);
            const topic = cellText(row.getCell(4).value);
            const subtopic = cellText(row.getCell(5).value);
            if (!parsed || !topic)
                return;
            meta.set(metaKey(subjectName, parsed.number, topic, subtopic), {
                serialNo: cellNumber(row.getCell(1).value),
                hoursSource: hoursSourceOf(cellText(row.getCell(7).value)),
                sourceReference: cellText(row.getCell(8).value) || null,
                notes: cellText(row.getCell(9).value) || null,
                classification: classificationOf(cellText(row.getCell(10).value)),
            });
        });
    }
    const importSheet = wb.getWorksheet('IMPORT_DATA');
    const rows = [];
    if (importSheet) {
        importSheet.eachRow((row, i) => {
            if (i === 1)
                return;
            const subjectCode = cellText(row.getCell(1).value) || null;
            const subjectName = cellText(row.getCell(2).value);
            const moduleNumber = cellNumber(row.getCell(3).value);
            const moduleName = cellText(row.getCell(4).value);
            const topicOrder = cellNumber(row.getCell(5).value) ?? 0;
            const topicName = cellText(row.getCell(6).value);
            const subtopicOrder = cellNumber(row.getCell(7).value) ?? 0;
            const subtopicName = cellText(row.getCell(8).value);
            const suggestedHours = cellNumber(row.getCell(9).value);
            const issues = [];
            if (!subjectName)
                issues.push('Missing subject');
            if (!moduleNumber)
                issues.push('Missing module number');
            if (!topicName)
                issues.push('Missing topic');
            if (!subtopicName)
                issues.push('Missing subtopic');
            if (suggestedHours == null)
                issues.push('Missing hours');
            const kind = /computer networks/i.test(subjectName) ? 'UNIT' : 'MODULE';
            const moduleLabel = `${kind === 'UNIT' ? 'Unit' : 'Module'} ${moduleNumber ?? ''}`.trim();
            const extra = subjectName && moduleNumber && topicName
                ? meta.get(metaKey(subjectName, moduleNumber, topicName, subtopicName))
                : undefined;
            rows.push({
                key: rowHash([
                    sourceFile,
                    subjectName,
                    String(moduleNumber),
                    topicName,
                    subtopicName,
                    String(subtopicOrder),
                ]),
                sourceFile,
                sourceSheet: 'IMPORT_DATA',
                serialNo: extra?.serialNo ?? i - 1,
                subjectCode: subjectCode || codeByName.get(subjectName) || null,
                subjectName,
                moduleNumber: moduleNumber ?? 0,
                moduleKind: kind,
                moduleLabel,
                moduleName,
                topicOrder,
                topicName,
                subtopicOrder,
                subtopicName,
                suggestedHours,
                hoursSource: extra?.hoursSource ?? 'ESTIMATED',
                sourceReference: extra?.sourceReference ?? null,
                notes: extra?.notes ?? null,
                classification: extra?.classification ?? 'CORE',
                originalOrder: extra?.serialNo ?? i - 1,
                issues,
            });
        });
    }
    return { subjects, rows };
}
export async function scanLessonPlanFiles(roots = lessonPlanSearchRoots()) {
    const filesInspected = [];
    const subjects = [];
    const rows = [];
    for (const root of roots) {
        let entries = [];
        try {
            entries = await fs.readdir(root);
        }
        catch {
            continue;
        }
        for (const name of entries) {
            if (!/\.xlsx$/i.test(name) || name.startsWith('~$'))
                continue;
            const file = path.join(root, name);
            filesInspected.push(file);
            const parsed = await parseLessonPlanWorkbook(file);
            if (!subjects.length)
                subjects.push(...parsed.subjects);
            rows.push(...parsed.rows);
        }
    }
    const seen = new Set();
    let duplicates = 0;
    for (const row of rows) {
        const dupKey = fingerprintParts(row.subjectName, row.moduleNumber, row.topicName, row.subtopicName, row.subtopicOrder);
        if (seen.has(dupKey)) {
            duplicates += 1;
            row.issues.push('Duplicate content');
        }
        else {
            seen.add(dupKey);
        }
    }
    const malformed = rows.filter((r) => r.issues.some((i) => i !== 'Duplicate content' && i !== 'Missing hours'));
    const missingHours = rows.filter((r) => r.suggestedHours == null).length;
    return {
        rootsInspected: roots,
        filesInspected,
        subjects,
        rows,
        malformed,
        missingHours,
        duplicates,
    };
}
