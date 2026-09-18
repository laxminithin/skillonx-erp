import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ExcelJS from 'exceljs';
export const REQUIRED_IMPORT_SHEETS = [
    'SUBJECT_MASTER',
    'CO_MASTER',
    'PO_MASTER',
    'CO_PO_MAPPING',
    'SOURCE_REGISTER',
];
export const OPTIONAL_SHEETS = [
    'CO_PO_MATRIX',
    'REVIEW_QUEUE',
    'IMPORT_SUMMARY',
    'MAPPING_SUMMARY',
    'README',
    'PSO_MASTER',
    'CO_PSO_MAPPING',
    'CO_PSO_MATRIX',
    'SDG_MASTER',
    'CO_SDG_MAPPING',
    'CO_SDG_MATRIX',
];
const ALLOWED_STATUS = new Set([
    'VERIFIED',
    'REVIEW_REQUIRED',
    'AMBIGUOUS',
    'OFFICIAL_DATA_PENDING',
    'NEEDS_REVIEW',
    'SOURCE_MISSING',
    'VERIFIED_SOURCE',
]);
const ALLOWED_STRENGTH = new Set([1, 2, 3, '1', '2', '3']);
const ALLOWED_MAP_STATUS = new Set([
    'PROPOSED_STANDARD',
    'REVIEWED',
    'APPROVED_STANDARD',
    'ACADEMIC_ANALYSIS',
    'ACADEMIC_ANALYSIS_NEEDS_REVIEW',
    'NEEDS_REVIEW',
    'SOURCE_MISSING',
]);
const ALLOWED_PSO_VERIFICATION = new Set(['VERIFIED_SOURCE', 'NEEDS_REVIEW', 'SOURCE_MISSING', 'VERIFIED', 'REVIEW_REQUIRED']);
const ALLOWED_MAPPING_ORIGIN = new Set([
    'OFFICIAL_SOURCE',
    'EXISTING_MASTER',
    'PROPOSED_ANALYSIS',
    'MANUAL_REVIEW',
    'PROPOSED_STANDARD',
]);
function cell(row, index) {
    const v = row.getCell(index).value;
    if (v == null)
        return '';
    if (typeof v === 'object' && 'richText' in v) {
        return (v.richText ?? []).map((t) => t.text).join('').trim();
    }
    if (typeof v === 'object' && 'text' in v)
        return String(v.text ?? '').trim();
    if (typeof v === 'object' && 'hyperlink' in v) {
        const h = v;
        return String(h.text || h.hyperlink || '').trim();
    }
    if (typeof v === 'object' && 'result' in v)
        return String(v.result ?? '').trim();
    return String(v).trim();
}
function num(row, index) {
    const raw = cell(row, index);
    if (!raw)
        return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
}
function headerIndex(row) {
    const map = new Map();
    row.eachCell((c, i) => {
        const key = String(c.value ?? '')
            .trim()
            .replace(/\s+/g, '_');
        if (key)
            map.set(key, i);
    });
    return map;
}
function col(map, ...names) {
    for (const n of names) {
        if (map.has(n))
            return map.get(n);
    }
    return 0;
}
function schemeCode(scheme) {
    const s = scheme.trim();
    if (/^VTU-/i.test(s))
        return s.toUpperCase();
    if (/^\d{4}$/.test(s))
        return `VTU-${s}`;
    return s.toUpperCase();
}
export function normalizeSchemeCode(scheme) {
    return schemeCode(scheme);
}
function isImportReady(value, status) {
    const v = value.toUpperCase().replace(/[–-]/g, ' ');
    if (v.includes('NOT IMPORT'))
        return false;
    if (v.includes('IMPORT READY'))
        return true;
    return status === 'VERIFIED';
}
export async function parseCopoWorkbook(buffer) {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer);
    const sheetsFound = wb.worksheets.map((s) => s.name);
    const warnings = [];
    const errors = [];
    for (const name of REQUIRED_IMPORT_SHEETS) {
        if (!wb.getWorksheet(name))
            errors.push(`Missing required sheet ${name}`);
    }
    const subjects = [];
    const subWs = wb.getWorksheet('SUBJECT_MASTER');
    if (subWs && subWs.rowCount >= 1) {
        const idx = headerIndex(subWs.getRow(1));
        for (let r = 2; r <= subWs.rowCount; r++) {
            const row = subWs.getRow(r);
            const code = cell(row, col(idx, 'Subject_Code')).toUpperCase().replace(/\s+/g, '');
            if (!code)
                continue;
            const status = cell(row, col(idx, 'Verification_Status')).toUpperCase().replace(/ /g, '_');
            if (status && !ALLOWED_STATUS.has(status))
                errors.push(`SUBJECT_MASTER ${code}: invalid Verification_Status ${status}`);
            const readyRaw = cell(row, col(idx, 'Import_Ready'));
            subjects.push({
                university: cell(row, col(idx, 'University')) || 'Visvesvaraya Technological University',
                scheme: cell(row, col(idx, 'Scheme')),
                program: cell(row, col(idx, 'Program')),
                semester: num(row, col(idx, 'Semester')),
                code,
                name: cell(row, col(idx, 'Subject_Name')),
                courseType: cell(row, col(idx, 'Course_Type')) || null,
                credits: num(row, col(idx, 'Credits')),
                lectureHours: num(row, col(idx, 'L')),
                tutorialHours: num(row, col(idx, 'T')),
                practicalHours: num(row, col(idx, 'P')),
                coCount: num(row, col(idx, 'CO_Count')) ?? 0,
                sourceUrl: cell(row, col(idx, 'VTU_Source_URL')) || null,
                sourcePage: cell(row, col(idx, 'Source_Page')) || null,
                verificationStatus: status || 'OFFICIAL_DATA_PENDING',
                importReady: isImportReady(readyRaw, status),
                slidesSubject: cell(row, col(idx, 'Slides_Subject')) || null,
                sourceRow: r,
            });
        }
    }
    const outcomes = [];
    const coWs = wb.getWorksheet('CO_MASTER');
    if (coWs) {
        const idx = headerIndex(coWs.getRow(1));
        for (let r = 2; r <= coWs.rowCount; r++) {
            const row = coWs.getRow(r);
            const subjectCode = cell(row, col(idx, 'Subject_Code')).toUpperCase().replace(/\s+/g, '');
            const coCode = cell(row, col(idx, 'CO_Code')).toUpperCase().replace(/\s+/g, '');
            if (!subjectCode || !coCode)
                continue;
            const statement = cell(row, col(idx, 'CO_Statement'));
            if (statement.length < 8)
                errors.push(`CO_MASTER ${subjectCode} ${coCode}: statement too short or missing`);
            const status = cell(row, col(idx, 'Status')).toUpperCase().replace(/ /g, '_');
            outcomes.push({
                scheme: cell(row, col(idx, 'Scheme')),
                program: cell(row, col(idx, 'Program')),
                subjectCode,
                coCode,
                statement,
                bloomsLevel: cell(row, col(idx, 'Bloom_Level')).toUpperCase() || null,
                source: cell(row, col(idx, 'Source')) || 'VTU Official',
                page: cell(row, col(idx, 'Page')) || null,
                status: status || 'REVIEW_REQUIRED',
                sourceRow: r,
            });
        }
    }
    const programOutcomes = [];
    const poWs = wb.getWorksheet('PO_MASTER');
    if (poWs) {
        const idx = headerIndex(poWs.getRow(1));
        for (let r = 2; r <= poWs.rowCount; r++) {
            const row = poWs.getRow(r);
            const poCode = cell(row, col(idx, 'PO_Code')).toUpperCase().replace(/\s+/g, '');
            if (!poCode)
                continue;
            programOutcomes.push({
                scheme: cell(row, col(idx, 'Scheme')),
                program: cell(row, col(idx, 'Program')),
                poCode,
                title: cell(row, col(idx, 'PO_Title')) || null,
                statement: cell(row, col(idx, 'PO_Statement')) || null,
                version: cell(row, col(idx, 'Version')) || '1',
                source: cell(row, col(idx, 'Source')) || null,
                status: cell(row, col(idx, 'Status')).toUpperCase().replace(/ /g, '_') || 'REVIEW_REQUIRED',
            });
        }
    }
    const mappings = [];
    const mapWs = wb.getWorksheet('CO_PO_MAPPING');
    if (mapWs) {
        const idx = headerIndex(mapWs.getRow(1));
        for (let r = 2; r <= mapWs.rowCount; r++) {
            const row = mapWs.getRow(r);
            const subjectCode = cell(row, col(idx, 'Subject_Code')).toUpperCase().replace(/\s+/g, '');
            const coCode = cell(row, col(idx, 'CO_Code')).toUpperCase().replace(/\s+/g, '');
            const poCode = cell(row, col(idx, 'PO_Code')).toUpperCase().replace(/\s+/g, '');
            if (!subjectCode || !coCode || !poCode)
                continue;
            const strengthRaw = cell(row, col(idx, 'Strength'));
            if (strengthRaw === '0' || strengthRaw === '-' || strengthRaw === '–') {
                errors.push(`CO_PO_MAPPING ${subjectCode} ${coCode}→${poCode}: empty/zero mappings must not be rows`);
                continue;
            }
            if (!ALLOWED_STRENGTH.has(strengthRaw) && !ALLOWED_STRENGTH.has(Number(strengthRaw))) {
                errors.push(`CO_PO_MAPPING ${subjectCode} ${coCode}→${poCode}: invalid strength ${strengthRaw}`);
                continue;
            }
            const mappingStatus = cell(row, col(idx, 'Mapping_Status')).toUpperCase().replace(/ /g, '_') || 'PROPOSED_STANDARD';
            if (!ALLOWED_MAP_STATUS.has(mappingStatus))
                errors.push(`Invalid Mapping_Status ${mappingStatus}`);
            mappings.push({
                scheme: cell(row, col(idx, 'Scheme')),
                program: cell(row, col(idx, 'Program')),
                subjectCode,
                coCode,
                poCode,
                strength: Number(strengthRaw),
                justification: cell(row, col(idx, 'Justification')),
                mappingStatus,
                sourceRow: r,
            });
        }
    }
    const matrixCells = [];
    const matrixWs = wb.getWorksheet('CO_PO_MATRIX');
    if (matrixWs) {
        const idx = headerIndex(matrixWs.getRow(1));
        const poCols = [];
        for (let n = 1; n <= 12; n++) {
            const c = col(idx, `PO${n}`);
            if (c)
                poCols.push({ po: `PO${n}`, col: c });
        }
        for (let r = 2; r <= matrixWs.rowCount; r++) {
            const row = matrixWs.getRow(r);
            const subjectCode = cell(row, col(idx, 'Subject_Code')).toUpperCase().replace(/\s+/g, '');
            const coCode = cell(row, col(idx, 'CO')).toUpperCase().replace(/\s+/g, '') || cell(row, col(idx, 'CO_Code')).toUpperCase().replace(/\s+/g, '');
            if (!subjectCode || !coCode)
                continue;
            for (const po of poCols) {
                const raw = cell(row, po.col);
                const blank = !raw || raw === '-' || raw === '–' || raw === '—' || raw.toLowerCase() === 'null';
                const invalid = !blank && !ALLOWED_STRENGTH.has(raw) && !ALLOWED_STRENGTH.has(Number(raw));
                if (invalid)
                    errors.push(`CO_PO_MATRIX ${subjectCode} ${coCode}→${po.po}: invalid correlation ${raw}`);
                matrixCells.push({
                    subjectCode,
                    scheme: cell(row, col(idx, 'Scheme')),
                    coCode,
                    poCode: po.po,
                    raw,
                    strength: blank || invalid ? null : Number(raw),
                    invalid,
                    sourceRow: r,
                });
            }
        }
    }
    const sources = [];
    const srcWs = wb.getWorksheet('SOURCE_REGISTER');
    if (srcWs) {
        const idx = headerIndex(srcWs.getRow(1));
        for (let r = 2; r <= srcWs.rowCount; r++) {
            const row = srcWs.getRow(r);
            const subjectCode = cell(row, col(idx, 'Subject_Code'));
            if (!subjectCode)
                continue;
            sources.push({
                scheme: cell(row, col(idx, 'Scheme')),
                program: cell(row, col(idx, 'Program')),
                subjectCode: subjectCode.toUpperCase(),
                sourceType: cell(row, col(idx, 'Source_Type')),
                document: cell(row, col(idx, 'Document')) || null,
                url: cell(row, col(idx, 'URL')) || null,
                page: cell(row, col(idx, 'Page')) || null,
                notes: cell(row, col(idx, 'Notes')) || null,
            });
        }
    }
    const programSpecificOutcomes = [];
    const psoWs = wb.getWorksheet('PSO_MASTER');
    if (psoWs) {
        const idx = headerIndex(psoWs.getRow(1));
        for (let r = 2; r <= psoWs.rowCount; r++) {
            const row = psoWs.getRow(r);
            const psoCode = cell(row, col(idx, 'PSO_CODE')).toUpperCase().replace(/\s+/g, '');
            const program = cell(row, col(idx, 'PROGRAM'));
            if (!psoCode || !program)
                continue;
            const verificationStatus = cell(row, col(idx, 'VERIFICATION_STATUS')).toUpperCase().replace(/ /g, '_') || 'NEEDS_REVIEW';
            if (!ALLOWED_PSO_VERIFICATION.has(verificationStatus)) {
                errors.push(`PSO_MASTER ${program} ${psoCode}: invalid VERIFICATION_STATUS ${verificationStatus}`);
            }
            const statement = cell(row, col(idx, 'PSO_STATEMENT'));
            if (!statement)
                errors.push(`PSO_MASTER ${program} ${psoCode}: missing PSO_STATEMENT`);
            const psoNumber = num(row, col(idx, 'PSO_NUMBER')) ?? Number(psoCode.replace(/\D+/g, '') || 0);
            if (!psoNumber)
                errors.push(`PSO_MASTER ${program} ${psoCode}: invalid PSO_NUMBER`);
            programSpecificOutcomes.push({
                externalId: cell(row, col(idx, 'PSO_ID')) || null,
                program,
                programCode: cell(row, col(idx, 'PROGRAM_CODE')) || null,
                scheme: cell(row, col(idx, 'SCHEME')),
                psoCode,
                psoNumber,
                title: cell(row, col(idx, 'PSO_TITLE')) || null,
                statement,
                sourceType: cell(row, col(idx, 'SOURCE_TYPE')) || null,
                sourceFile: cell(row, col(idx, 'SOURCE_FILE')) || null,
                sourceReference: cell(row, col(idx, 'SOURCE_REFERENCE')) || null,
                verificationStatus,
                notes: cell(row, col(idx, 'NOTES')) || null,
                sourceRow: r,
            });
        }
    }
    const coPsoMappings = [];
    const copsWs = wb.getWorksheet('CO_PSO_MAPPING');
    if (copsWs) {
        const idx = headerIndex(copsWs.getRow(1));
        for (let r = 2; r <= copsWs.rowCount; r++) {
            const row = copsWs.getRow(r);
            const subjectCode = cell(row, col(idx, 'COURSE_CODE')).toUpperCase().replace(/\s+/g, '');
            const coCode = cell(row, col(idx, 'CO_CODE')).toUpperCase().replace(/\s+/g, '');
            const psoCode = cell(row, col(idx, 'PSO_CODE')).toUpperCase().replace(/\s+/g, '');
            if (!subjectCode || !coCode || !psoCode)
                continue;
            const strengthRaw = cell(row, col(idx, 'CORRELATION_LEVEL'));
            if (!ALLOWED_STRENGTH.has(strengthRaw) && !ALLOWED_STRENGTH.has(Number(strengthRaw))) {
                errors.push(`CO_PSO_MAPPING ${subjectCode} ${coCode}→${psoCode}: invalid CORRELATION_LEVEL ${strengthRaw}`);
                continue;
            }
            const mappingOrigin = cell(row, col(idx, 'MAPPING_ORIGIN')).toUpperCase().replace(/ /g, '_') || 'PROPOSED_ANALYSIS';
            if (!ALLOWED_MAPPING_ORIGIN.has(mappingOrigin)) {
                warnings.push(`CO_PSO_MAPPING ${subjectCode} ${coCode}→${psoCode}: unknown MAPPING_ORIGIN ${mappingOrigin}`);
            }
            const verificationStatus = cell(row, col(idx, 'VERIFICATION_STATUS')).toUpperCase().replace(/ /g, '_') || 'NEEDS_REVIEW';
            coPsoMappings.push({
                mappingId: cell(row, col(idx, 'MAPPING_ID')) || null,
                subjectName: cell(row, col(idx, 'SUBJECT')) || null,
                subjectCode,
                scheme: cell(row, col(idx, 'SCHEME')),
                program: cell(row, col(idx, 'PROGRAM')),
                coCode,
                coStatement: cell(row, col(idx, 'CO_STATEMENT')) || null,
                psoCode,
                psoStatement: cell(row, col(idx, 'PSO_STATEMENT')) || null,
                strength: Number(strengthRaw),
                correlationLabel: cell(row, col(idx, 'CORRELATION_LABEL')) || null,
                rationale: cell(row, col(idx, 'RATIONALE')) || null,
                mappingOrigin,
                sourceFile: cell(row, col(idx, 'SOURCE_FILE')) || null,
                sourceReference: cell(row, col(idx, 'SOURCE_REFERENCE')) || null,
                verificationStatus,
                confidence: cell(row, col(idx, 'CONFIDENCE')) || null,
                notes: cell(row, col(idx, 'NOTES')) || null,
                sourceRow: r,
            });
        }
    }
    const sdgs = [];
    const sdgWs = wb.getWorksheet('SDG_MASTER');
    if (sdgWs) {
        const idx = headerIndex(sdgWs.getRow(1));
        for (let r = 2; r <= sdgWs.rowCount; r++) {
            const row = sdgWs.getRow(r);
            const sdgCode = cell(row, col(idx, 'SDG_CODE')).toUpperCase().replace(/\s+/g, '');
            if (!sdgCode)
                continue;
            const sdgNumber = num(row, col(idx, 'SDG_NUMBER')) ?? Number(sdgCode.replace(/\D+/g, '') || 0);
            if (sdgNumber < 1 || sdgNumber > 17)
                errors.push(`SDG_MASTER ${sdgCode}: invalid SDG_NUMBER ${sdgNumber}`);
            const activeRaw = cell(row, col(idx, 'ACTIVE')).toUpperCase();
            sdgs.push({
                externalId: cell(row, col(idx, 'SDG_ID')) || null,
                sdgCode,
                sdgNumber,
                title: cell(row, col(idx, 'SDG_TITLE')),
                description: cell(row, col(idx, 'SHORT_DESCRIPTION')),
                officialReference: cell(row, col(idx, 'OFFICIAL_REFERENCE')) || null,
                active: activeRaw !== 'NO' && activeRaw !== 'FALSE' && activeRaw !== '0',
                sourceRow: r,
            });
        }
    }
    const coSdgMappings = [];
    const cosdgWs = wb.getWorksheet('CO_SDG_MAPPING');
    if (cosdgWs) {
        const idx = headerIndex(cosdgWs.getRow(1));
        for (let r = 2; r <= cosdgWs.rowCount; r++) {
            const row = cosdgWs.getRow(r);
            const subjectCode = cell(row, col(idx, 'COURSE_CODE')).toUpperCase().replace(/\s+/g, '');
            const coCode = cell(row, col(idx, 'CO_CODE')).toUpperCase().replace(/\s+/g, '');
            const sdgCode = cell(row, col(idx, 'SDG_CODE')).toUpperCase().replace(/\s+/g, '');
            if (!subjectCode || !coCode || !sdgCode)
                continue;
            const relevanceRaw = cell(row, col(idx, 'RELEVANCE_LEVEL'));
            if (!ALLOWED_STRENGTH.has(relevanceRaw) && !ALLOWED_STRENGTH.has(Number(relevanceRaw))) {
                errors.push(`CO_SDG_MAPPING ${subjectCode} ${coCode}→${sdgCode}: invalid RELEVANCE_LEVEL ${relevanceRaw}`);
                continue;
            }
            const mappingOrigin = cell(row, col(idx, 'MAPPING_ORIGIN')).toUpperCase().replace(/ /g, '_') || 'PROPOSED_ANALYSIS';
            const verificationStatus = cell(row, col(idx, 'VERIFICATION_STATUS')).toUpperCase().replace(/ /g, '_') || 'NEEDS_REVIEW';
            coSdgMappings.push({
                mappingId: cell(row, col(idx, 'MAPPING_ID')) || null,
                subjectName: cell(row, col(idx, 'SUBJECT')) || null,
                subjectCode,
                scheme: cell(row, col(idx, 'SCHEME')),
                program: cell(row, col(idx, 'PROGRAM')),
                coCode,
                coStatement: cell(row, col(idx, 'CO_STATEMENT')) || null,
                sdgCode,
                sdgTitle: cell(row, col(idx, 'SDG_TITLE')) || null,
                relevance: Number(relevanceRaw),
                relevanceLabel: cell(row, col(idx, 'RELEVANCE_LABEL')) || null,
                rationale: cell(row, col(idx, 'RATIONALE')) || null,
                mappingOrigin,
                sourceFile: cell(row, col(idx, 'SOURCE_FILE')) || null,
                sourceReference: cell(row, col(idx, 'SOURCE_REFERENCE')) || null,
                verificationStatus,
                confidence: cell(row, col(idx, 'CONFIDENCE')) || null,
                notes: cell(row, col(idx, 'NOTES')) || null,
                sourceRow: r,
            });
        }
    }
    const subKeys = new Set();
    for (const s of subjects) {
        const k = `${s.scheme}|${s.program}|${s.code}`;
        if (subKeys.has(k))
            errors.push(`Duplicate subject ${k}`);
        subKeys.add(k);
        if (s.verificationStatus === 'VERIFIED' && !s.sourceUrl)
            errors.push(`${s.code} is VERIFIED without VTU_Source_URL`);
    }
    const coKeys = new Set();
    for (const co of outcomes) {
        const k = `${co.scheme}|${co.program}|${co.subjectCode}|${co.coCode}`;
        if (coKeys.has(k))
            errors.push(`Duplicate CO ${k}`);
        coKeys.add(k);
        const parent = subjects.find((s) => s.code === co.subjectCode && s.scheme === co.scheme);
        if (!parent)
            errors.push(`Orphan CO ${co.subjectCode} ${co.coCode}`);
    }
    const poKeys = new Set();
    for (const po of programOutcomes) {
        const k = `${po.scheme}|${po.program}|${po.poCode}`;
        if (poKeys.has(k))
            errors.push(`Duplicate PO ${k}`);
        poKeys.add(k);
    }
    const mapKeys = new Set();
    for (const m of mappings) {
        const k = `${m.scheme}|${m.program}|${m.subjectCode}|${m.coCode}|${m.poCode}`;
        if (mapKeys.has(k))
            errors.push(`Duplicate mapping ${k}`);
        mapKeys.add(k);
        if (!outcomes.some((c) => c.subjectCode === m.subjectCode && c.coCode === m.coCode && c.scheme === m.scheme)) {
            errors.push(`Mapping references missing CO ${m.subjectCode} ${m.coCode}`);
        }
        if (!subjects.some((s) => s.code === m.subjectCode && s.scheme === m.scheme)) {
            errors.push(`Mapping references missing subject ${m.subjectCode}`);
        }
        if (!m.justification)
            warnings.push(`Mapping ${m.subjectCode} ${m.coCode}→${m.poCode} has no justification`);
    }
    for (const cellMap of matrixCells.filter((c) => c.strength != null)) {
        const has = mappings.some((m) => m.subjectCode === cellMap.subjectCode && m.coCode === cellMap.coCode && m.poCode === cellMap.poCode && m.scheme === cellMap.scheme);
        if (!has)
            warnings.push(`CO_PO_MATRIX ${cellMap.subjectCode} ${cellMap.coCode}→${cellMap.poCode} is not in CO_PO_MAPPING`);
    }
    const psoKeys = new Set();
    for (const pso of programSpecificOutcomes) {
        const k = `${pso.scheme}|${pso.program}|${pso.psoCode}`;
        if (psoKeys.has(k))
            errors.push(`Duplicate PSO ${k}`);
        psoKeys.add(k);
    }
    const copsKeys = new Set();
    for (const m of coPsoMappings) {
        const k = `${m.scheme}|${m.program}|${m.subjectCode}|${m.coCode}|${m.psoCode}`;
        if (copsKeys.has(k))
            errors.push(`Duplicate CO–PSO mapping ${k}`);
        copsKeys.add(k);
        const psoOk = programSpecificOutcomes.some((p) => p.psoCode === m.psoCode && p.scheme === m.scheme && p.program === m.program);
        if (!psoOk)
            errors.push(`CO–PSO ${m.subjectCode} ${m.coCode}→${m.psoCode}: PSO not in PSO_MASTER for ${m.program}`);
        if (!outcomes.some((c) => c.subjectCode === m.subjectCode && c.coCode === m.coCode && c.scheme === m.scheme)) {
            warnings.push(`CO–PSO ${m.subjectCode} ${m.coCode}→${m.psoCode}: CO not in CO_MASTER`);
        }
    }
    const sdgKeys = new Set();
    for (const sdg of sdgs) {
        if (sdgKeys.has(sdg.sdgCode))
            errors.push(`Duplicate SDG ${sdg.sdgCode}`);
        sdgKeys.add(sdg.sdgCode);
    }
    if (sdgs.length && sdgs.length !== 17)
        warnings.push(`SDG_MASTER has ${sdgs.length} rows; expected 17`);
    const cosdgKeys = new Set();
    for (const m of coSdgMappings) {
        const k = `${m.scheme}|${m.subjectCode}|${m.coCode}|${m.sdgCode}`;
        if (cosdgKeys.has(k))
            errors.push(`Duplicate CO–SDG mapping ${k}`);
        cosdgKeys.add(k);
        if (!sdgs.some((s) => s.sdgCode === m.sdgCode)) {
            errors.push(`CO–SDG ${m.subjectCode} ${m.coCode}→${m.sdgCode}: SDG not in SDG_MASTER`);
        }
    }
    return {
        sheetsFound,
        subjects,
        outcomes,
        programOutcomes,
        mappings,
        matrixCells,
        sources,
        programSpecificOutcomes,
        coPsoMappings,
        sdgs,
        coSdgMappings,
        warnings,
        errors,
    };
}
export function programCodeFromName(name) {
    const n = name.toLowerCase();
    if (n.includes('artificial intelligence') && n.includes('computer'))
        return 'BE-CSE-AI';
    if (n.includes('information science'))
        return 'BE-ISE';
    if (n.includes('computer science'))
        return 'BE-CSE';
    if (n.includes('business administration') || n === 'mba')
        return 'MBA';
    return name
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 32);
}
export function defaultPublicRoots() {
    const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
    return [path.resolve(apiRoot, '../web/public'), path.resolve(apiRoot, '../web/dist')];
}
export async function discoverCopoMasterFiles(roots = defaultPublicRoots()) {
    const found = [];
    for (const root of roots) {
        let entries = [];
        try {
            entries = await readdir(root);
        }
        catch {
            continue;
        }
        for (const name of entries) {
            if (!/\.xlsx$/i.test(name) || name.startsWith('~'))
                continue;
            found.push(path.join(root, name));
        }
    }
    const masters = [];
    for (const filePath of found) {
        const wb = new ExcelJS.Workbook();
        try {
            await wb.xlsx.readFile(filePath);
        }
        catch {
            continue;
        }
        const sheets = wb.worksheets.map((s) => s.name);
        const hasMaster = sheets.includes('SUBJECT_MASTER') && sheets.includes('CO_MASTER') && sheets.includes('PO_MASTER');
        if (hasMaster)
            masters.push({ filePath, fileName: path.basename(filePath), sheets });
    }
    // Prefer the unified academic mapping master (PSO/SDG) when present.
    masters.sort((a, b) => {
        const score = (m) => {
            let s = 0;
            if (/SkillonX_Academic_Mapping_Master/i.test(m.fileName))
                s += 100;
            if (m.sheets.includes('PSO_MASTER'))
                s += 10;
            if (m.sheets.includes('SDG_MASTER'))
                s += 10;
            if (m.sheets.includes('CO_PSO_MAPPING'))
                s += 5;
            if (m.sheets.includes('CO_SDG_MAPPING'))
                s += 5;
            return s;
        };
        return score(b) - score(a);
    });
    return masters;
}
