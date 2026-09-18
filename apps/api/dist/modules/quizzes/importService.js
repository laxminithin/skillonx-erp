import fs from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { QUIZ_QUESTION_TYPES, normalizeDifficulty, normalizeQuestionText, normalizeSubjectName, } from '../../types/quiz.js';
import { validateGradableQuestion } from './bankService.js';
const TEXT_EXT = new Set(['.txt', '.md', '.csv', '.json']);
const SKIP_NAMES = new Set([
    'favicon.svg',
    'favicon.ico',
    'robots.txt',
    'index.html',
    'vite.svg',
    'readme.md',
    'assignment.md',
]);
const SURVEY_HINT = /how would you rate|faculty feedback|course outcome|likert|strongly agree/i;
function apiRoot() {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
}
function dirHasEntries(dir) {
    try {
        return readdirSync(dir).some((name) => !name.startsWith('.'));
    }
    catch {
        return false;
    }
}
export function importSearchRoots() {
    const root = apiRoot();
    const publicAssessments = path.resolve(root, '../web/public/assessments');
    const distAssessments = path.resolve(root, '../web/dist/assessments');
    const assessments = dirHasEntries(publicAssessments) ? publicAssessments : distAssessments;
    return [
        assessments,
        path.resolve(root, '../web/public/quiz-bank'),
        path.resolve(root, '../web/public/questions'),
        path.resolve(root, '../web/public/quiz-materials'),
    ];
}
export function prettyFolderTitle(raw) {
    return raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}
export function hintsFromAssessmentPath(file) {
    const parts = file.split(path.sep);
    const assessmentsAt = parts.lastIndexOf('assessments');
    const subjectFolder = assessmentsAt >= 0 && parts[assessmentsAt + 1] ? parts[assessmentsAt + 1] : path.basename(path.dirname(path.dirname(file)));
    const moduleFolder = path.basename(path.dirname(file));
    const moduleMatch = moduleFolder.match(/^(Module|Unit)-0*(\d+)-(.+)$/i);
    const subjectHint = prettyFolderTitle(subjectFolder);
    const moduleHint = moduleMatch
        ? `${moduleMatch[1][0].toUpperCase()}${moduleMatch[1].slice(1).toLowerCase()} ${Number(moduleMatch[2])} — ${prettyFolderTitle(moduleMatch[3])}`
        : /module|unit/i.test(moduleFolder)
            ? prettyFolderTitle(moduleFolder)
            : null;
    return { subjectHint, moduleHint };
}
function unwrapMarkdown(text) {
    return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').trim();
}
function parseAnswerKeySection(section) {
    const map = new Map();
    if (!section)
        return map;
    const re = /Q\s*0*(\d+)\s*[–—\-:]\s*([A-H](?:\s*[,&/]\s*[A-H])*)/gi;
    let match;
    while ((match = re.exec(section))) {
        map.set(match[1], match[2].replace(/\s+/g, '').toUpperCase());
    }
    return map;
}
export function parseQuizMarkdown(content, file, subjectHint, moduleHint) {
    const headerSubject = content.match(/\*\*Subject:\*\*\s*(.+)/i)?.[1]?.trim();
    const headerModule = content.match(/\*\*Module:\*\*\s*(.+)/i)?.[1]?.trim();
    const subject = unwrapMarkdown(headerSubject || subjectHint || '') || subjectHint;
    const moduleName = unwrapMarkdown(headerModule || moduleHint || '') || moduleHint;
    const [body, keySection] = content.split(/^##\s+(?:Quick\s+)?answer\s+key\b/im);
    const answerKey = parseAnswerKeySection(keySection);
    const blocks = (body ?? content).split(/^###\s+/m).slice(1);
    const candidates = [];
    for (const [i, block] of blocks.entries()) {
        const lines = block.split(/\r?\n/);
        const heading = lines[0]?.trim() ?? '';
        const headingMatch = heading.match(/^Q\s*0*(\d+)\s*[·•.\-–—|:]\s*(.+)$/i);
        if (!headingMatch)
            continue;
        const sourceReference = `Q${headingMatch[1].padStart(2, '0')}`;
        const originalDifficulty = headingMatch[2].trim();
        const difficulty = normalizeDifficulty(originalDifficulty.split(/[·•|]/)[0]);
        let questionText = '';
        const options = [];
        let answer = null;
        let explanation = null;
        let primaryCoCode = null;
        let mappingBasis = null;
        let mappingSource = null;
        let verificationStatus = null;
        let secondaryCoCodes = [];
        let collectingQuestion = false;
        for (const raw of lines.slice(1)) {
            const line = raw.trim();
            if (!line)
                continue;
            const qMatch = line.match(/^\*\*Question:\*\*\s*(.*)$/i) || line.match(/^Question:\s*(.*)$/i);
            if (qMatch) {
                questionText = qMatch[1];
                collectingQuestion = true;
                continue;
            }
            const ans = line.match(/^\*\*Answer:\*\*\s*(.+)$/i) || line.match(/^Answer:\s*(.+)$/i);
            if (ans) {
                answer = ans[1];
                collectingQuestion = false;
                continue;
            }
            const exp = line.match(/^\*\*Explanation:\*\*\s*(.*)$/i) || line.match(/^Explanation:\s*(.*)$/i);
            if (exp) {
                explanation = exp[1];
                collectingQuestion = false;
                continue;
            }
            const co = line.match(/^\*\*Primary\s*CO:\*\*\s*(.+)$/i) ||
                line.match(/^Primary\s*CO:\s*(.+)$/i) ||
                line.match(/^\*\*CO:\*\*\s*(.+)$/i);
            if (co) {
                primaryCoCode = unwrapMarkdown(co[1]).toUpperCase().replace(/[^A-Z0-9]/g, '');
                collectingQuestion = false;
                continue;
            }
            const basis = line.match(/^\*\*CO\s*Mapping\s*Basis:\*\*\s*(.*)$/i) ||
                line.match(/^CO\s*Mapping\s*Basis:\s*(.*)$/i);
            if (basis) {
                mappingBasis = unwrapMarkdown(basis[1]);
                collectingQuestion = false;
                continue;
            }
            const src = line.match(/^\*\*CO\s*Mapping\s*Source:\*\*\s*(.+)$/i) ||
                line.match(/^CO\s*Mapping\s*Source:\s*(.+)$/i);
            if (src) {
                mappingSource = unwrapMarkdown(src[1]);
                collectingQuestion = false;
                continue;
            }
            const ver = line.match(/^\*\*CO\s*Verification\s*Status:\*\*\s*(.+)$/i) ||
                line.match(/^CO\s*Verification\s*Status:\s*(.+)$/i) ||
                line.match(/^\*\*Verification\s*Status:\*\*\s*(.+)$/i);
            if (ver) {
                verificationStatus = unwrapMarkdown(ver[1]).toUpperCase().replace(/\s+/g, '_');
                collectingQuestion = false;
                continue;
            }
            const sec = line.match(/^\*\*Secondary\s*COs:\*\*\s*(.*)$/i) ||
                line.match(/^Secondary\s*COs:\s*(.*)$/i);
            if (sec) {
                secondaryCoCodes = unwrapMarkdown(sec[1])
                    .split(/[,;/]/)
                    .map((s) => s.trim().toUpperCase().replace(/[^A-Z0-9]/g, ''))
                    .filter(Boolean);
                collectingQuestion = false;
                continue;
            }
            const opt = line.match(/^[-*]\s+\*\*([A-Ha-h])[.)]\*\*\s+(.*)$/) ||
                line.match(/^[-*]\s+([A-Ha-h])[.)]\s+(.*)$/) ||
                line.match(/^\*\*([A-Ha-h])[.)]\*\*\s+(.*)$/) ||
                line.match(/^([A-Ha-h])[.)]\s+(.*)$/);
            if (opt) {
                collectingQuestion = false;
                options.push({ label: unwrapMarkdown(opt[2]), isCorrect: false });
                continue;
            }
            if (collectingQuestion)
                questionText = `${questionText} ${line}`.trim();
            else if (explanation != null && !ans && !opt)
                explanation = `${explanation} ${line}`.trim();
        }
        if (!answer)
            answer = answerKey.get(headingMatch[1]) ?? null;
        candidates.push(toCandidate(file, {
            subjectHint: subject,
            moduleHint: moduleName,
            sourceReference,
            questionText: unwrapMarkdown(questionText),
            options,
            answer,
            explanation: explanation ? unwrapMarkdown(explanation) : null,
            difficulty: originalDifficulty,
            originalDifficulty,
            primaryCoCode,
            mappingBasis,
            mappingSource,
            verificationStatus,
            secondaryCoCodes,
        }, i));
    }
    return candidates;
}
async function walkFiles(dir, acc = []) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    }
    catch {
        return acc;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name.startsWith('.') || entry.name === 'assets')
                continue;
            await walkFiles(full, acc);
        }
        else if (entry.isFile()) {
            acc.push(full);
        }
    }
    return acc;
}
function hintFromPath(file) {
    const base = path.basename(file, path.extname(file)).replace(/[_-]+/g, ' ');
    const parent = path.basename(path.dirname(file)).replace(/[_-]+/g, ' ');
    return { fileHint: base, folderHint: parent };
}
function parseAnswerToken(raw) {
    if (!raw)
        return null;
    return raw.trim().replace(/[.\)]$/, '').toUpperCase();
}
function optionLetter(index) {
    return String.fromCharCode(65 + index);
}
function applyAnswerKey(options, answerRaw) {
    if (!answerRaw)
        return options;
    const token = parseAnswerToken(answerRaw);
    if (!token)
        return options;
    const letters = token.split(/[,&\s]+/).filter(Boolean);
    const next = options.map((o) => ({ ...o, isCorrect: false }));
    let matched = false;
    for (const letter of letters) {
        if (/^[A-Z]$/.test(letter)) {
            const idx = letter.charCodeAt(0) - 65;
            if (next[idx]) {
                next[idx].isCorrect = true;
                matched = true;
            }
        }
        else {
            const found = next.find((o) => o.label.trim().toLowerCase() === letter.toLowerCase());
            if (found) {
                found.isCorrect = true;
                matched = true;
            }
        }
    }
    if (!matched) {
        const found = next.find((o) => o.label.trim().toLowerCase() === answerRaw.trim().toLowerCase());
        if (found)
            found.isCorrect = true;
    }
    return next;
}
function detectType(options, numericAnswer, multi) {
    if (numericAnswer != null)
        return 'NUMERIC';
    if (options.length === 2) {
        const labels = options.map((o) => o.label.trim().toLowerCase());
        if (labels.includes('true') && labels.includes('false'))
            return 'TRUE_FALSE';
    }
    if (multi || options.filter((o) => o.isCorrect).length > 1)
        return 'MULTIPLE_SELECT';
    if (options.length >= 2)
        return 'SINGLE_CHOICE';
    return 'SHORT_ANSWER';
}
function toCandidate(file, partial, index) {
    let options = (partial.options ?? []).map((o) => ({
        label: o.label.trim(),
        isCorrect: !!o.isCorrect,
    }));
    options = applyAnswerKey(options, partial.answer ?? null);
    const numericAnswer = partial.numericAnswer ?? null;
    const questionType = partial.questionType && QUIZ_QUESTION_TYPES.includes(partial.questionType)
        ? partial.questionType
        : detectType(options, numericAnswer, !!partial.multi);
    const validation = validateGradableQuestion({
        questionType,
        options,
        numericAnswer,
    });
    const notes = [...validation.notes];
    const normalizedDifficulty = normalizeDifficulty(partial.difficulty);
    if (!partial.questionText.trim())
        notes.push('Question text is empty');
    if (!partial.moduleHint?.trim())
        notes.push('Missing Module');
    if (partial.difficulty && !normalizedDifficulty)
        notes.push('Unknown Difficulty');
    if ((questionType === 'SINGLE_CHOICE' ||
        questionType === 'TRUE_FALSE' ||
        questionType === 'MULTIPLE_SELECT') &&
        !options.some((o) => o.isCorrect)) {
        notes.push('Missing Correct Answer');
    }
    if (partial.answer && options.length && !options.some((o) => o.isCorrect)) {
        notes.push('Invalid Option');
    }
    const relative = file.includes(`${path.sep}public${path.sep}`)
        ? file.slice(file.lastIndexOf(`${path.sep}public${path.sep}`) + 1)
        : path.basename(file);
    return {
        key: `${relative}:${partial.sourceReference ?? index}`,
        file: path.basename(file),
        relativePath: relative.replace(/\\/g, '/'),
        subjectHint: partial.subjectHint ?? null,
        moduleHint: partial.moduleHint ?? null,
        sourceReference: partial.sourceReference ?? null,
        questionText: partial.questionText.trim(),
        questionType,
        options,
        numericAnswer,
        numericTolerance: partial.numericTolerance ?? 0,
        marks: partial.marks && partial.marks > 0 ? partial.marks : 1,
        explanation: partial.explanation?.trim() || null,
        difficulty: normalizedDifficulty,
        originalDifficulty: partial.originalDifficulty ?? partial.difficulty ?? null,
        reviewStatus: notes.length ? 'NEEDS_REVIEW' : 'APPROVED',
        reviewNotes: notes,
        primaryCoCode: partial.primaryCoCode ?? null,
        mappingBasis: partial.mappingBasis ?? null,
        mappingSource: partial.mappingSource ?? null,
        verificationStatus: partial.verificationStatus ?? null,
        secondaryCoCodes: partial.secondaryCoCodes ?? [],
    };
}
function parseMcqText(content, file, subjectHint, moduleHint) {
    const lines = content.split(/\r?\n/);
    const blocks = [];
    let current = [];
    const startRe = /^(?:q(?:uestion)?\s*)?\d+[.)]\s+/i;
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (current.length) {
                blocks.push(current);
                current = [];
            }
            continue;
        }
        if (startRe.test(trimmed) && current.length) {
            blocks.push(current);
            current = [trimmed];
        }
        else {
            current.push(trimmed);
        }
    }
    if (current.length)
        blocks.push(current);
    const candidates = [];
    let moduleCursor = moduleHint;
    let subjectCursor = subjectHint;
    for (const [i, block] of blocks.entries()) {
        const header = block[0];
        const moduleMatch = header.match(/^module\s+(\d+)\s*[—:-]?\s*(.*)$/i);
        if (moduleMatch && block.length < 3) {
            moduleCursor = `Module ${moduleMatch[1]}${moduleMatch[2] ? ` — ${moduleMatch[2]}` : ''}`;
            continue;
        }
        if (/^(subject|course)\s*[:=-]/i.test(header) && block.length < 3) {
            subjectCursor = header.replace(/^(subject|course)\s*[:=-]\s*/i, '').trim();
            continue;
        }
        const optionRe = /^([A-Ha-h])[).]\s+(.+)$/;
        const options = [];
        let questionLines = [];
        let answer = null;
        let explanation = null;
        let marks = 1;
        let collectingQuestion = true;
        for (const line of block) {
            const ans = line.match(/^(?:answer|ans|correct)\s*[:=-]\s*(.+)$/i);
            if (ans) {
                answer = ans[1];
                collectingQuestion = false;
                continue;
            }
            const exp = line.match(/^(?:explanation|explain)\s*[:=-]\s*(.+)$/i);
            if (exp) {
                explanation = exp[1];
                collectingQuestion = false;
                continue;
            }
            const mark = line.match(/^(?:marks?|points?)\s*[:=-]\s*(\d+(?:\.\d+)?)$/i);
            if (mark) {
                marks = Number(mark[1]);
                collectingQuestion = false;
                continue;
            }
            const opt = line.match(optionRe);
            if (opt) {
                collectingQuestion = false;
                options.push({ label: opt[2].trim(), isCorrect: false });
                continue;
            }
            if (collectingQuestion)
                questionLines.push(line);
        }
        const questionText = questionLines.join(' ').replace(startRe, '').trim();
        if (!questionText || (options.length < 2 && !answer))
            continue;
        candidates.push(toCandidate(file, {
            subjectHint: subjectCursor,
            moduleHint: moduleCursor,
            questionText,
            options,
            answer,
            marks,
            explanation,
        }, i));
    }
    return candidates;
}
function parseCsv(content, file) {
    const lines = content.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2)
        return [];
    const headers = splitCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
    const idx = (name) => headers.findIndex((h) => h === name || h.includes(name));
    const qIdx = idx('question');
    if (qIdx < 0)
        return [];
    const out = [];
    for (let i = 1; i < lines.length; i += 1) {
        const cols = splitCsvLine(lines[i]);
        const get = (name) => {
            const at = idx(name);
            return at >= 0 ? cols[at]?.trim() || '' : '';
        };
        const options = ['option a', 'option b', 'option c', 'option d', 'option e', 'a', 'b', 'c', 'd']
            .map((name, i2) => ({ name, i: i2, value: get(name) }))
            .filter((o) => o.value)
            .reduce((acc, o) => {
            if (!acc.some((x) => x.label === o.value))
                acc.push({ label: o.value, isCorrect: false });
            return acc;
        }, []);
        const numericRaw = get('numeric') || get('numeric answer');
        out.push(toCandidate(file, {
            subjectHint: get('subject') || get('course') || null,
            moduleHint: get('module') || null,
            questionText: cols[qIdx] ?? '',
            options,
            answer: get('answer') || get('correct') || null,
            numericAnswer: numericRaw ? Number(numericRaw) : null,
            numericTolerance: get('tolerance') ? Number(get('tolerance')) : null,
            marks: get('marks') ? Number(get('marks')) : 1,
            explanation: get('explanation') || null,
            difficulty: get('difficulty') || null,
        }, i));
    }
    return out;
}
function splitCsvLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i += 1;
            }
            else
                inQuotes = !inQuotes;
        }
        else if (ch === ',' && !inQuotes) {
            result.push(current);
            current = '';
        }
        else
            current += ch;
    }
    result.push(current);
    return result;
}
function parseJsonQuestions(content, file) {
    let data;
    try {
        data = JSON.parse(content);
    }
    catch {
        return [];
    }
    const items = Array.isArray(data)
        ? data
        : data && typeof data === 'object' && Array.isArray(data.questions)
            ? data.questions
            : [];
    const root = data && typeof data === 'object' ? data : {};
    const subject = typeof root.subject === 'string' ? root.subject : null;
    return items.flatMap((item, i) => {
        if (!item || typeof item !== 'object')
            return [];
        const q = item;
        const optionsRaw = Array.isArray(q.options) ? q.options : [];
        const options = optionsRaw.map((o) => {
            if (typeof o === 'string')
                return { label: o, isCorrect: false };
            const obj = o;
            return {
                label: String(obj.label ?? obj.text ?? ''),
                isCorrect: Boolean(obj.isCorrect ?? obj.correct),
            };
        });
        const type = typeof q.questionType === 'string' ? q.questionType : undefined;
        return [
            toCandidate(file, {
                subjectHint: (typeof q.subject === 'string' ? q.subject : subject) ?? null,
                moduleHint: typeof q.module === 'string' ? q.module : null,
                questionText: String(q.questionText ?? q.question ?? q.prompt ?? ''),
                options,
                answer: typeof q.answer === 'string' ? q.answer : null,
                numericAnswer: typeof q.numericAnswer === 'number' ? q.numericAnswer : null,
                numericTolerance: typeof q.numericTolerance === 'number' ? q.numericTolerance : null,
                marks: typeof q.marks === 'number' ? q.marks : 1,
                explanation: typeof q.explanation === 'string' ? q.explanation : null,
                difficulty: typeof q.difficulty === 'string' ? q.difficulty : null,
                questionType: type,
            }, i),
        ];
    });
}
export async function scanQuestionFiles() {
    const roots = importSearchRoots();
    const filesDiscovered = [];
    const skippedFiles = [];
    const candidates = [];
    const existingRoots = [];
    for (const root of roots) {
        const files = await walkFiles(root);
        if (files.length)
            existingRoots.push(root);
        for (const file of files) {
            const ext = path.extname(file).toLowerCase();
            const name = path.basename(file);
            if (SKIP_NAMES.has(name) || name.startsWith('.')) {
                skippedFiles.push(name);
                continue;
            }
            if (!TEXT_EXT.has(ext) || SKIP_NAMES.has(name.toLowerCase())) {
                skippedFiles.push(name);
                continue;
            }
            if (name.toLowerCase() === 'assignment.md') {
                skippedFiles.push(name);
                continue;
            }
            filesDiscovered.push(file);
            const content = await fs.readFile(file, 'utf8');
            if (SURVEY_HINT.test(content) && !/assessments/.test(file)) {
                skippedFiles.push(name);
                filesDiscovered.pop();
                continue;
            }
            const { fileHint, folderHint } = hintFromPath(file);
            const assessmentHints = /assessments/.test(file) ? hintsFromAssessmentPath(file) : null;
            const subjectHint = assessmentHints?.subjectHint ??
                (/module|unit/i.test(folderHint) ? fileHint : folderHint === 'public' ? fileHint : folderHint);
            const moduleHint = assessmentHints?.moduleHint ??
                (/module|unit/i.test(fileHint)
                    ? fileHint
                    : /module|unit/i.test(folderHint)
                        ? folderHint
                        : null);
            const isQuizMarkdown = name.toLowerCase() === 'quiz.md' || /###\s+Q\d+/i.test(content);
            if (ext === '.json')
                candidates.push(...parseJsonQuestions(content, file));
            else if (ext === '.csv')
                candidates.push(...parseCsv(content, file));
            else if (isQuizMarkdown)
                candidates.push(...parseQuizMarkdown(content, file, subjectHint, moduleHint));
            else
                candidates.push(...parseMcqText(content, file, subjectHint, moduleHint));
        }
    }
    const seen = new Map();
    for (const c of candidates) {
        const key = `${normalizeQuestionText(c.questionText)}|${normalizeSubjectName(c.subjectHint ?? '')}|${(c.moduleHint ?? '').toLowerCase()}`;
        const prev = seen.get(key);
        if (prev)
            c.duplicateOfKey = prev;
        else
            seen.set(key, c.key);
    }
    const subjects = [...new Set(candidates.map((c) => c.subjectHint).filter(Boolean))];
    const modules = [...new Set(candidates.map((c) => c.moduleHint).filter(Boolean))];
    return {
        rootsInspected: existingRoots.length ? existingRoots : roots,
        filesDiscovered: filesDiscovered.map((f) => f.replace(/\\/g, '/')),
        subjectsDetected: subjects,
        modulesDetected: modules,
        questionsFound: candidates.length,
        validQuestions: candidates.filter((c) => c.reviewStatus === 'APPROVED').length,
        needsReview: candidates.filter((c) => c.reviewStatus === 'NEEDS_REVIEW').length,
        missingAnswerKeys: candidates.filter((c) => c.reviewNotes.some((n) => /missing correct answer|missing answer key/i.test(n))).length,
        duplicates: candidates.filter((c) => c.duplicateOfKey).length,
        skippedFiles: [...new Set(skippedFiles)],
        candidates,
    };
}
export { parseMcqText, parseCsv, parseJsonQuestions, toCandidate, optionLetter };
