import { createHash } from 'node:crypto';
import { db } from '../../db/index.js';
import { fingerprintParts, normalizeLessonText } from '../../types/lessonPlan.js';
import { findModule, matchCourse, preferredModuleName, type CourseRef, type SubjectMatch } from './match.js';
import { scanLessonPlanFiles, type ParsedLessonRow, type ParsedSubjectIndex } from './parser.js';

export type ImportApplyOptions = {
  collegeId: number;
  createdBy: number;
  createMissingSubjects?: boolean;
  dryRun?: boolean;
};

export type ModuleImportSummary = {
  label: string;
  name: string;
  topics: number;
  subtopics: number;
  hours: number;
  imported: number;
  duplicates: number;
};

export type SubjectImportSummary = {
  subject: string;
  sourceFile: string;
  sourceCode: string | null;
  mapping: SubjectMatch['mapping'];
  matchedSubject: string | null;
  courseId: number | null;
  modules: number;
  topics: number;
  subtopics: number;
  hours: number;
  imported: number;
  duplicates: number;
  needsReview: number;
  malformed: number;
  missingHours: number;
  moduleRows: ModuleImportSummary[];
};

export type LessonImportReport = {
  batchId: string;
  dryRun: boolean;
  filesInspected: number;
  subjectsDiscovered: number;
  matchedExistingSubjects: number;
  newSubjects: number;
  ambiguous: number;
  unmatchedSubjects: string[];
  createdSubjects: string[];
  totalTopics: number;
  totalSubtopics: number;
  imported: number;
  duplicates: number;
  needsReview: number;
  malformed: number;
  missingHours: number;
  subjects: SubjectImportSummary[];
};

function courseCodeFromSubject(name: string, sourceCode: string | null, existing: Set<string>) {
  const preferred = (sourceCode || '').split('/')[0].replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12);
  let code = preferred;
  if (!code || existing.has(code)) {
    const words = name.replace(/[^A-Za-z0-9 ]+/g, ' ').trim().split(/\s+/).filter(Boolean);
    code = words.map((w) => w[0]).join('').toUpperCase().slice(0, 8);
    if (code.length < 2) code = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8) || 'SUBJ';
  }
  let candidate = code;
  let n = 2;
  while (existing.has(candidate)) {
    candidate = `${code.slice(0, 6)}${n}`;
    n += 1;
  }
  existing.add(candidate);
  return candidate;
}

function fingerprint(row: ParsedLessonRow) {
  return createHash('sha1')
    .update(fingerprintParts(row.subjectName, row.moduleNumber, row.topicName, row.subtopicName, row.subtopicOrder))
    .digest('hex')
    .slice(0, 40);
}

export async function applyLessonPlanImport(opts: ImportApplyOptions): Promise<LessonImportReport> {
  const scan = await scanLessonPlanFiles();
  const batchId = `lp-import-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  const createMissing = opts.createMissingSubjects === true;

  const courses = (await db('courses')
    .where({ college_id: opts.collegeId })
    .select('id', 'name', 'code')) as CourseRef[];
  const usedCodes = new Set(courses.map((c) => String(c.code).toUpperCase()));
  const indexNames = scan.subjects.map((s) => s.name);

  const matchBySubject = new Map<string, SubjectMatch>();
  const createdSubjects: string[] = [];
  const unmatchedSubjects: string[] = [];
  const uniqueSourceSubjects = [...new Map(scan.rows.map((r) => [r.subjectName, r])).values()];

  for (const row of uniqueSourceSubjects) {
    let match = matchCourse(row.subjectName, row.subjectCode, courses, indexNames);
    if (match.mapping === 'unmatched' && createMissing && !opts.dryRun) {
      const code = courseCodeFromSubject(row.subjectName, row.subjectCode, usedCodes);
      const [id] = await db('courses').insert({
        college_id: opts.collegeId,
        name: row.subjectName,
        code,
      });
      const created = { id: Number(id), name: row.subjectName, code };
      courses.push(created);
      createdSubjects.push(row.subjectName);
      match = {
        sourceName: row.subjectName,
        sourceCode: row.subjectCode,
        mapping: 'new',
        course: created,
        reason: 'Created new subject from lesson-plan source',
      };
    } else if (match.mapping === 'unmatched') {
      unmatchedSubjects.push(row.subjectName);
    } else if (match.mapping === 'new') {
      createdSubjects.push(row.subjectName);
    }
    matchBySubject.set(row.subjectName, match);
  }

  const modulesByCourse = new Map<number, Array<{ id: number; name: string }>>();
  async function resolveModule(
    courseId: number,
    row: ParsedLessonRow,
  ): Promise<number | null> {
    let list = modulesByCourse.get(courseId);
    if (!list) {
      const rows = await db('subject_modules')
        .where({ college_id: opts.collegeId, course_id: courseId })
        .select('id', 'name');
      list = rows.map((r) => ({ id: Number(r.id), name: String(r.name) }));
      modulesByCourse.set(courseId, list);
    }
    const preferred = preferredModuleName(row.moduleKind, row.moduleNumber, row.moduleName);
    const existing = findModule(list, row.moduleKind, row.moduleNumber, row.moduleName);
    if (existing) {
      if (!opts.dryRun) {
        await db('subject_modules').where({ id: existing.id }).update({
          unit_kind: row.moduleKind,
          sort_order: row.moduleNumber,
          ...(existing.name !== preferred ? { name: preferred } : {}),
        });
        existing.name = preferred;
      }
      return existing.id;
    }
    if (opts.dryRun) return -1;
    try {
      const [id] = await db('subject_modules').insert({
        college_id: opts.collegeId,
        course_id: courseId,
        name: preferred,
        code: `${row.moduleKind[0]}${row.moduleNumber}`,
        unit_kind: row.moduleKind,
        sort_order: row.moduleNumber,
        created_by: opts.createdBy,
      });
      list.push({ id: Number(id), name: preferred });
      return Number(id);
    } catch {
      const retry = await db('subject_modules')
        .where({ college_id: opts.collegeId, course_id: courseId, name: preferred })
        .first();
      if (retry) {
        list.push({ id: Number(retry.id), name: preferred });
        return Number(retry.id);
      }
      return null;
    }
  }

  const topicsByModule = new Map<number, Map<string, { id: number; name: string }>>();
  async function resolveTopic(
    courseId: number,
    moduleId: number,
    row: ParsedLessonRow,
  ): Promise<number | null> {
    let map = topicsByModule.get(moduleId);
    if (!map) {
      const existing = await db('lesson_topics')
        .where({ college_id: opts.collegeId, module_id: moduleId })
        .select('id', 'name', 'normalized_name');
      map = new Map(
        existing.map((t) => [String(t.normalized_name), { id: Number(t.id), name: String(t.name) }]),
      );
      topicsByModule.set(moduleId, map);
    }
    const key = normalizeLessonText(row.topicName);
    const found = map.get(key);
    if (found) {
      if (!opts.dryRun) {
        await db('lesson_topics').where({ id: found.id }).update({
          sort_order: row.topicOrder,
          source_file: row.sourceFile,
          source_subject_name: row.subjectName,
          source_module_name: row.moduleName,
          original_order: row.originalOrder,
          import_batch: batchId,
          imported_at: db.fn.now(),
        });
      }
      return found.id;
    }
    if (opts.dryRun) return -1;
    const [id] = await db('lesson_topics').insert({
      college_id: opts.collegeId,
      course_id: courseId,
      module_id: moduleId,
      name: row.topicName,
      normalized_name: key,
      sort_order: row.topicOrder,
      source_file: row.sourceFile,
      source_subject_name: row.subjectName,
      source_module_name: row.moduleName,
      original_order: row.originalOrder,
      import_batch: batchId,
      imported_at: db.fn.now(),
    });
    map.set(key, { id: Number(id), name: row.topicName });
    return Number(id);
  }

  let imported = 0;
  let duplicates = 0;
  let needsReview = 0;
  let malformed = 0;
  let missingHours = 0;

  const subjectSummaries = new Map<string, SubjectImportSummary>();
  function summaryFor(row: ParsedLessonRow, match: SubjectMatch): SubjectImportSummary {
    let s = subjectSummaries.get(row.subjectName);
    if (!s) {
      s = {
        subject: row.subjectName,
        sourceFile: row.sourceFile,
        sourceCode: row.subjectCode,
        mapping: match.mapping,
        matchedSubject: match.course?.name ?? null,
        courseId: match.course?.id ?? null,
        modules: 0,
        topics: 0,
        subtopics: 0,
        hours: 0,
        imported: 0,
        duplicates: 0,
        needsReview: 0,
        malformed: 0,
        missingHours: 0,
        moduleRows: [],
      };
      subjectSummaries.set(row.subjectName, s);
    }
    return s;
  }

  const existingFingerprints = new Set(
    (
      await db('lesson_subtopics').where({ college_id: opts.collegeId }).select('fingerprint')
    ).map((r) => String(r.fingerprint)),
  );

  for (const row of scan.rows) {
    const match = matchBySubject.get(row.subjectName);
    const summary = match ? summaryFor(row, match) : null;
    const blocking = row.issues.filter((i) => i !== 'Duplicate content');
    if (!row.topicName || !row.subtopicName || !row.moduleNumber || !row.subjectName) {
      malformed += 1;
      if (summary) summary.malformed += 1;
      continue;
    }
    if (row.suggestedHours == null) {
      missingHours += 1;
      if (summary) summary.missingHours += 1;
      needsReview += 1;
      if (summary) summary.needsReview += 1;
    }
    if (!match?.course || match.mapping === 'unmatched' || match.mapping === 'ambiguous') {
      needsReview += 1;
      if (summary) summary.needsReview += 1;
      continue;
    }
    if (blocking.length && row.issues.includes('Duplicate content')) {
      duplicates += 1;
      if (summary) summary.duplicates += 1;
      continue;
    }

    const fp = fingerprint(row);
    const isDup = existingFingerprints.has(fp);
    if (isDup) duplicates += 1;

    if (!opts.dryRun) {
      const moduleId = await resolveModule(match.course.id, row);
      if (!moduleId) {
        malformed += 1;
        if (summary) summary.malformed += 1;
        continue;
      }
      const topicId = await resolveTopic(match.course.id, moduleId, row);
      if (!topicId) {
        malformed += 1;
        if (summary) summary.malformed += 1;
        continue;
      }
      const payload = {
        college_id: opts.collegeId,
        topic_id: topicId,
        name: row.subtopicName,
        normalized_name: normalizeLessonText(row.subtopicName).slice(0, 512),
        sort_order: row.subtopicOrder,
        suggested_hours: row.suggestedHours,
        hours_source: row.hoursSource,
        source_reference: row.sourceReference,
        notes: row.notes,
        classification: row.classification,
        original_order: row.originalOrder,
        source_file: row.sourceFile,
        source_module_name: row.moduleName,
        import_batch: batchId,
        fingerprint: fp,
        imported_at: db.fn.now(),
      };
      if (isDup) {
        await db('lesson_subtopics').where({ college_id: opts.collegeId, fingerprint: fp }).update(payload);
      } else {
        await db('lesson_subtopics').insert(payload);
        existingFingerprints.add(fp);
        imported += 1;
        if (summary) summary.imported += 1;
      }
    } else if (!isDup) {
      imported += 1;
      if (summary) summary.imported += 1;
    } else if (summary) {
      summary.duplicates += 1;
    }
  }

  const topicCounts = await db('lesson_topics')
    .where({ college_id: opts.collegeId })
    .select('course_id')
    .count({ n: '*' })
    .groupBy('course_id');
  const topicByCourse = new Map(
    topicCounts.map((r) => [Number((r as { course_id: number }).course_id), Number((r as { n: number }).n)]),
  );

  for (const [subjectName, summary] of subjectSummaries) {
    const subjectRows = scan.rows.filter((r) => r.subjectName === subjectName && r.topicName && r.subtopicName);
    const modules = new Map<number, ModuleImportSummary>();
    const topics = new Set<string>();
    for (const row of subjectRows) {
      topics.add(`${row.moduleNumber}|${normalizeLessonText(row.topicName)}`);
      const current = modules.get(row.moduleNumber) ?? {
        label: row.moduleLabel,
        name: row.moduleName,
        topics: 0,
        subtopics: 0,
        hours: 0,
        imported: 0,
        duplicates: 0,
      };
      current.subtopics += 1;
      current.hours += Number(row.suggestedHours ?? 0);
      modules.set(row.moduleNumber, current);
    }
    for (const row of subjectRows) {
      const m = modules.get(row.moduleNumber);
      if (m) m.topics = new Set(subjectRows.filter((r) => r.moduleNumber === row.moduleNumber).map((r) => r.topicName)).size;
    }
    summary.modules = modules.size;
    summary.topics = topics.size;
    summary.subtopics = subjectRows.length;
    summary.hours = subjectRows.reduce((sum, r) => sum + Number(r.suggestedHours ?? 0), 0);
    summary.moduleRows = [...modules.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, m]) => m);
    if (summary.courseId && topicByCourse.has(summary.courseId) && !opts.dryRun) {
      summary.topics = topicByCourse.get(summary.courseId) ?? summary.topics;
    }
  }

  const report: LessonImportReport = {
    batchId,
    dryRun: Boolean(opts.dryRun),
    filesInspected: scan.filesInspected.length,
    subjectsDiscovered: scan.subjects.length || uniqueSourceSubjects.length,
    matchedExistingSubjects: [...matchBySubject.values()].filter((m) => m.mapping === 'matched').length,
    newSubjects: createdSubjects.length,
    ambiguous: [...matchBySubject.values()].filter((m) => m.mapping === 'ambiguous').length,
    unmatchedSubjects,
    createdSubjects,
    totalTopics: [...subjectSummaries.values()].reduce((s, x) => s + x.topics, 0),
    totalSubtopics: scan.rows.filter((r) => r.topicName && r.subtopicName).length,
    imported,
    duplicates,
    needsReview,
    malformed,
    missingHours: scan.missingHours || missingHours,
    subjects: [...subjectSummaries.values()],
  };

  if (!opts.dryRun) {
    await db('lesson_plan_import_batches').insert({
      college_id: opts.collegeId,
      batch_id: batchId,
      source_file: scan.filesInspected.map((f) => f.split('/').pop()).join(', '),
      report: JSON.stringify(report),
      dry_run: false,
      imported_by: opts.createdBy,
    });
  }

  return report;
}

export function formatImportReport(report: LessonImportReport) {
  const lines: string[] = [
    'LESSON PLAN CONTENT IMPORT',
    '',
    `Files inspected: ${report.filesInspected}`,
    `Subjects found: ${report.subjectsDiscovered}`,
    `Matched existing subjects: ${report.matchedExistingSubjects}`,
    `New subjects: ${report.newSubjects}`,
    `Ambiguous: ${report.ambiguous}`,
    '',
  ];
  for (const subject of report.subjects) {
    lines.push(`Subject: ${subject.subject}`);
    lines.push(`  Source file: ${subject.sourceFile}`);
    lines.push(`  Matched DB subject: ${subject.matchedSubject ?? '—'} [${subject.mapping}]`);
    lines.push(`  Modules: ${subject.modules}  Topics: ${subject.topics}  Subtopics: ${subject.subtopics}  Hours: ${subject.hours}`);
    for (const mod of subject.moduleRows) {
      lines.push(`  ${mod.label} ${mod.name}`);
      lines.push(`    Topics: ${mod.topics}  Subtopics: ${mod.subtopics}  Hours: ${mod.hours}`);
    }
    lines.push('');
  }
  lines.push('TOTAL');
  lines.push(`Topics discovered: ${report.totalTopics}`);
  lines.push(`Subtopics discovered: ${report.totalSubtopics}`);
  lines.push(`Imported: ${report.imported}`);
  lines.push(`Duplicates: ${report.duplicates}`);
  lines.push(`Needs review: ${report.needsReview}`);
  lines.push(`Malformed: ${report.malformed}`);
  lines.push(`Missing hours: ${report.missingHours}`);
  if (report.unmatchedSubjects.length) {
    lines.push(`Unmatched subjects: ${report.unmatchedSubjects.join(', ')}`);
  }
  return lines.join('\n');
}

export type { ParsedSubjectIndex };
