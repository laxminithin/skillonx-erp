import fs from 'node:fs/promises';
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  defaultMarksForDifficulty,
  defaultResponseFormatForType,
  normalizeAssignmentDifficulty,
  normalizeAssignmentQuestionType,
  normalizeQuestionText,
  type AssignmentDifficulty,
  type AssignmentQuestionType,
  type AssignmentResponseFormat,
  type EvaluationRubric,
} from '../../types/assignment.js';
import { buildDefaultScheme, parseEvaluationScheme, schemeTotalMarks } from './scheme.js';

export type AssignmentImportCandidate = {
  key: string;
  file: string;
  relativePath: string;
  subjectHint: string | null;
  moduleHint: string | null;
  sourceReference: string | null;
  questionText: string;
  questionType: AssignmentQuestionType;
  responseFormat: AssignmentResponseFormat;
  marks: number;
  difficulty: AssignmentDifficulty | null;
  originalDifficulty: string | null;
  expectedAnswerGuidance: string | null;
  evaluationRubric: EvaluationRubric | Record<string, unknown> | null;
  primaryCoCode?: string | null;
  mappingBasis?: string | null;
  verificationStatus?: string | null;
  reviewStatus: 'APPROVED' | 'NEEDS_REVIEW';
  reviewNotes: string[];
  duplicateOfKey?: string;
};

export type AssignmentImportScanReport = {
  rootsInspected: string[];
  filesDiscovered: string[];
  subjectsDetected: string[];
  modulesDetected: string[];
  questionsFound: number;
  validQuestions: number;
  needsReview: number;
  duplicates: number;
  skippedFiles: string[];
  candidates: AssignmentImportCandidate[];
};

function apiRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
}

function dirHasEntries(dir: string) {
  try {
    return readdirSync(dir).some((name) => !name.startsWith('.'));
  } catch {
    return false;
  }
}

export function assignmentSearchRoots(): string[] {
  const root = apiRoot();
  const publicAssessments = path.resolve(root, '../web/public/assessments');
  const distAssessments = path.resolve(root, '../web/dist/assessments');
  const assessments = dirHasEntries(publicAssessments) ? publicAssessments : distAssessments;
  return [assessments];
}

export function prettyFolderTitle(raw: string) {
  return raw.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export function hintsFromAssessmentPath(file: string) {
  const parts = file.split(path.sep);
  const assessmentsAt = parts.lastIndexOf('assessments');
  const subjectFolder =
    assessmentsAt >= 0 && parts[assessmentsAt + 1]
      ? parts[assessmentsAt + 1]
      : path.basename(path.dirname(path.dirname(file)));
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

function unwrapMarkdown(text: string) {
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/__(.+?)__/g, '$1').trim();
}

function parseSchemeFromText(raw: string | null, marks: number, type: AssignmentQuestionType) {
  if (!raw?.trim()) {
    const scheme = buildDefaultScheme(type, marks);
    return {
      totalMarks: marks,
      criteria: scheme.criteria.map((c) => ({
        criterion: c.label,
        marks: c.maxMarks,
        guidance: c.guidance ?? undefined,
        id: c.id,
      })),
      expectedKeyPoints: scheme.expectedKeyPoints,
      facultyNotes: scheme.facultyNotes,
    };
  }

  const bulletLines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const criteria: Array<{ criterion: string; marks: number; guidance?: string; id?: string }> = [];
  for (const line of bulletLines) {
    const m =
      line.match(/^[-*]\s*(.+?)\s*[—–:-]\s*(\d+(?:\.\d+)?)\s*marks?/i) ||
      line.match(/^[-*]\s*(\d+(?:\.\d+)?)\s*marks?\s*[—–:-]\s*(.+)/i) ||
      line.match(/^(.+?)\s*\((\d+(?:\.\d+)?)\s*marks?\)\s*$/i);
    if (m) {
      if (/^\d/.test(m[1])) {
        criteria.push({ criterion: m[2].trim(), marks: Number(m[1]) });
      } else {
        criteria.push({ criterion: m[1].trim(), marks: Number(m[2]) });
      }
    }
  }

  if (criteria.length) {
    const sum = criteria.reduce((s, c) => s + c.marks, 0);
    if (Math.abs(sum - marks) > 0.05) {
      const scale = marks / (sum || 1);
      for (const c of criteria) c.marks = Math.round(c.marks * scale * 100) / 100;
      const adj = marks - criteria.reduce((s, c) => s + c.marks, 0);
      criteria[criteria.length - 1].marks = Math.round((criteria[criteria.length - 1].marks + adj) * 100) / 100;
    }
    return { totalMarks: marks, criteria };
  }

  const parsed = parseEvaluationScheme(raw);
  if (parsed && Math.abs(schemeTotalMarks(parsed) - marks) <= 0.05) {
    return {
      totalMarks: marks,
      criteria: parsed.criteria.map((c) => ({
        criterion: c.label,
        marks: c.maxMarks,
        guidance: c.guidance ?? undefined,
        id: c.id,
      })),
      expectedKeyPoints: parsed.expectedKeyPoints,
      facultyNotes: parsed.facultyNotes,
    };
  }

  const scheme = buildDefaultScheme(type, marks);
  return {
    totalMarks: marks,
    criteria: scheme.criteria.map((c) => ({
      criterion: c.label,
      marks: c.maxMarks,
      guidance: c.guidance ?? undefined,
      id: c.id,
    })),
  };
}

export function parseAssignmentMarkdown(
  content: string,
  file: string,
  subjectHint: string | null,
  moduleHint: string | null,
): AssignmentImportCandidate[] {
  const headerSubject = content.match(/\*\*Subject:\*\*\s*(.+)/i)?.[1]?.trim();
  const headerModule = content.match(/\*\*Module:\*\*\s*(.+)/i)?.[1]?.trim();
  const subject = unwrapMarkdown(headerSubject || subjectHint || '') || subjectHint;
  const moduleName = unwrapMarkdown(headerModule || moduleHint || '') || moduleHint;

  const blocks = content.split(/^###\s+/m).slice(1);
  const candidates: AssignmentImportCandidate[] = [];
  const relative = file.includes(`${path.sep}assessments${path.sep}`)
    ? file.slice(file.lastIndexOf(`${path.sep}assessments${path.sep}`) + 1)
    : path.basename(file);

  for (const [index, block] of blocks.entries()) {
    const lines = block.split(/\r?\n/);
    const heading = lines[0]?.trim() ?? '';
    const headingMatch = heading.match(/^A\s*0*(\d+)\s*[·•.\-–—|:]\s*(.+)$/i);
    if (!headingMatch) continue;

    const sourceReference = `A${headingMatch[1].padStart(2, '0')}`;
    const parts = headingMatch[2]
      .split(/\s*[·•|]\s*/)
      .map((p) => p.trim())
      .filter(Boolean);

    let difficulty = normalizeAssignmentDifficulty(parts[0]);
    let marks = 0;
    let questionType: AssignmentQuestionType | null = null;
    let originalDifficulty = parts[0] ?? null;
    let primaryCoCode: string | null = null;

    for (const part of parts) {
      const d = normalizeAssignmentDifficulty(part);
      if (d) {
        difficulty = d;
        originalDifficulty = part;
      }
      const marksMatch = part.match(/^(\d+(?:\.\d+)?)\s*marks?$/i);
      if (marksMatch) marks = Number(marksMatch[1]);
      const t = normalizeAssignmentQuestionType(part);
      if (t) questionType = t;
      const coMatch = part.match(/^CO\s*(\d+[A-Z]?)$/i);
      if (coMatch) primaryCoCode = `CO${coMatch[1]}`.toUpperCase();
    }

    if (!questionType) questionType = 'DESCRIPTIVE';
    if (!marks || marks <= 0) marks = defaultMarksForDifficulty(difficulty);

    let questionText = '';
    let modelAnswer = '';
    let schemeText = '';
    let mappingBasis: string | null = null;
    let verificationStatus: string | null = null;
    let mode: 'none' | 'question' | 'answer' | 'scheme' = 'none';

    for (const raw of lines.slice(1)) {
      const line = raw.trim();
      if (!line) continue;
      if (/^\*\*Question:\*\*/i.test(line) || /^Question:\s*/i.test(line)) {
        questionText = line.replace(/^\*\*Question:\*\*\s*/i, '').replace(/^Question:\s*/i, '');
        mode = 'question';
        continue;
      }
      if (/^\*\*Model answer:\*\*/i.test(line) || /^Model answer:\s*/i.test(line)) {
        modelAnswer = line.replace(/^\*\*Model answer:\*\*\s*/i, '').replace(/^Model answer:\s*/i, '');
        mode = 'answer';
        continue;
      }
      if (/^\*\*Expected (?:Key Points|answer(?: guidance)?):\*\*/i.test(line)) {
        modelAnswer = line.replace(/^\*\*Expected (?:Key Points|answer(?: guidance)?):\*\*\s*/i, '');
        mode = 'answer';
        continue;
      }
      if (/^\*\*Evaluation scheme:\*\*/i.test(line) || /^Evaluation scheme:\s*/i.test(line)) {
        schemeText = line.replace(/^\*\*Evaluation scheme:\*\*\s*/i, '').replace(/^Evaluation scheme:\s*/i, '');
        mode = 'scheme';
        continue;
      }
      if (/^\*\*Mapping Basis:\*\*/i.test(line)) {
        mappingBasis = unwrapMarkdown(line.replace(/^\*\*Mapping Basis:\*\*\s*/i, ''));
        mode = 'none';
        continue;
      }
      if (/^\*\*Verification:\*\*/i.test(line)) {
        verificationStatus = unwrapMarkdown(line.replace(/^\*\*Verification:\*\*\s*/i, ''))
          .toUpperCase()
          .replace(/\s+/g, '_');
        mode = 'none';
        continue;
      }
      if (/^\*\*/.test(line)) {
        mode = 'none';
        continue;
      }
      if (mode === 'question') questionText = `${questionText} ${line}`.trim();
      else if (mode === 'answer') modelAnswer = `${modelAnswer}\n${line}`.trim();
      else if (mode === 'scheme') schemeText = `${schemeText}\n${line}`.trim();
    }

    const notes: string[] = [];
    if (!questionText.trim()) notes.push('Question text is empty');
    if (!moduleName?.trim()) notes.push('Missing Module');
    if (!difficulty) notes.push('Unknown Difficulty');
    if (!modelAnswer.trim() || /^(tbd|todo|n\/a)\b/i.test(modelAnswer.trim())) {
      notes.push('Missing or placeholder model answer');
    }
    // Primary CO is inferred at import from CO master + question intent (not required in markdown).

    const evaluationRubric = parseSchemeFromText(schemeText || null, marks, questionType);
    const rubricSum = (evaluationRubric.criteria || []).reduce(
      (s: number, c: { marks?: number }) => s + Number(c.marks || 0),
      0,
    );
    if (Math.abs(rubricSum - marks) > 0.05) notes.push('Evaluation scheme marks mismatch');

    candidates.push({
      key: `${relative.replace(/\\/g, '/')}:${sourceReference}`,
      file: path.basename(file),
      relativePath: relative.replace(/\\/g, '/'),
      subjectHint: subject,
      moduleHint: moduleName,
      sourceReference,
      questionText: unwrapMarkdown(questionText),
      questionType,
      responseFormat: defaultResponseFormatForType(questionType),
      marks,
      difficulty,
      originalDifficulty,
      expectedAnswerGuidance: modelAnswer ? unwrapMarkdown(modelAnswer) : null,
      evaluationRubric,
      primaryCoCode,
      mappingBasis,
      verificationStatus: verificationStatus || (notes.length ? 'NEEDS_REVIEW' : 'ACADEMIC_ANALYSIS'),
      reviewStatus: notes.length ? 'NEEDS_REVIEW' : 'APPROVED',
      reviewNotes: notes,
    });
    void index;
  }

  return candidates;
}

async function walkAssignmentFiles(dir: string, acc: string[] = []): Promise<string[]> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.') || entry.name === 'assets') continue;
      await walkAssignmentFiles(full, acc);
    } else if (entry.isFile() && entry.name.toLowerCase() === 'assignment.md') {
      acc.push(full);
    }
  }
  return acc;
}

export async function scanAssignmentFiles(rootOverride?: string): Promise<AssignmentImportScanReport> {
  const roots = rootOverride ? [rootOverride] : assignmentSearchRoots();
  const filesDiscovered: string[] = [];
  const skippedFiles: string[] = [];
  const candidates: AssignmentImportCandidate[] = [];
  const existingRoots: string[] = [];

  for (const root of roots) {
    const files = await walkAssignmentFiles(root);
    if (files.length) existingRoots.push(root);
    for (const file of files) {
      filesDiscovered.push(file);
      const content = await fs.readFile(file, 'utf8');
      const hints = hintsFromAssessmentPath(file);
      candidates.push(...parseAssignmentMarkdown(content, file, hints.subjectHint, hints.moduleHint));
    }
  }

  const seen = new Map<string, string>();
  for (const c of candidates) {
    const key = `${normalizeQuestionText(c.questionText)}|${(c.subjectHint ?? '').toLowerCase()}|${(c.moduleHint ?? '').toLowerCase()}`;
    const prev = seen.get(key);
    if (prev) c.duplicateOfKey = prev;
    else seen.set(key, c.key);
  }

  const subjects = [...new Set(candidates.map((c) => c.subjectHint).filter(Boolean) as string[])];
  const modules = [...new Set(candidates.map((c) => c.moduleHint).filter(Boolean) as string[])];

  return {
    rootsInspected: existingRoots.length ? existingRoots : roots,
    filesDiscovered: filesDiscovered.map((f) => f.replace(/\\/g, '/')),
    subjectsDetected: subjects,
    modulesDetected: modules,
    questionsFound: candidates.length,
    validQuestions: candidates.filter((c) => c.reviewStatus === 'APPROVED').length,
    needsReview: candidates.filter((c) => c.reviewStatus === 'NEEDS_REVIEW').length,
    duplicates: candidates.filter((c) => c.duplicateOfKey).length,
    skippedFiles: [...new Set(skippedFiles)],
    candidates,
  };
}

/** @deprecated Prefer scanAssignmentFiles */
export async function scanAssignmentBank(root?: string) {
  const scan = await scanAssignmentFiles(root);
  return {
    assessmentsRoot: scan.rootsInspected[0] || '',
    files: scan.filesDiscovered,
    candidates: scan.candidates,
  };
}

export function fingerprint(text: string) {
  return normalizeQuestionText(text).slice(0, 512);
}
