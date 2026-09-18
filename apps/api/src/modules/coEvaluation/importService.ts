import { nanoid } from 'nanoid';
import type { Knex } from 'knex';
import { db } from '../../db/index.js';
import { parseCoEvalWorkbook, type ParsedCoEvalWorkbook } from './workbookParser.js';
import { isReviewMarked, normalizeCode, schemeKey } from './types.js';

export type CoEvalImportSummary = {
  discovered: {
    assessmentComponents: number;
    structures: number;
    courseComponents: number;
    coRows: number;
    componentMappings: number;
    justifications: number;
    sources: number;
    reviewQueue: number;
    subjects: number;
    evaluableSubjects: number;
    blockedSubjects: number;
  };
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  needsReview: number;
  blockedSubjects: Array<{ courseCode: string; subjectName: string; reason: string }>;
  errors: string[];
  warnings: string[];
  batchId: string;
  sheets: string[];
};

function sameText(a: unknown, b: unknown) {
  return String(a ?? '') === String(b ?? '');
}

function sameNum(a: unknown, b: unknown) {
  const na = a == null || a === '' ? null : Number(a);
  const nb = b == null || b === '' ? null : Number(b);
  if (na == null && nb == null) return true;
  if (na == null || nb == null) return false;
  return Math.abs(na - nb) < 1e-9;
}

async function resolveCourse(
  trx: Knex.Transaction,
  collegeId: number,
  courseCode: string,
  schemeLabel: string | null,
  subjectName?: string | null,
) {
  const code = normalizeCode(courseCode);
  const variants = [code];
  if (code.includes('/')) {
    for (const part of code.split('/')) {
      if (part) variants.push(part);
    }
  }
  let rows = await trx('courses')
    .where({ college_id: collegeId })
    .whereIn('code', variants)
    .select('id', 'code', 'name', 'scheme_id', 'department_id');
  if (!rows.length && subjectName) {
    rows = await trx('courses')
      .where({ college_id: collegeId })
      .andWhere((b) => {
        b.where('name', subjectName).orWhere('name', 'like', `%${subjectName}%`);
      })
      .select('id', 'code', 'name', 'scheme_id', 'department_id');
  }
  if (!rows.length) return null;
  if (rows.length === 1) return rows[0];
  if (schemeLabel) {
    const schemes = await trx('academic_schemes')
      .where({ college_id: collegeId })
      .where((b) => {
        b.where('name', 'like', `%${schemeLabel}%`).orWhere('code', schemeLabel);
      })
      .select('id');
    const schemeIds = new Set(schemes.map((s) => Number(s.id)));
    const matched = rows.filter((r) => r.scheme_id != null && schemeIds.has(Number(r.scheme_id)));
    if (matched.length === 1) return matched[0];
  }
  return rows[0];
}

async function resolveProgram(trx: Knex.Transaction, collegeId: number, programName: string | null) {
  if (!programName) return null;
  return (
    (await trx('programs')
      .where({ college_id: collegeId })
      .andWhere((b) => {
        b.where('name', programName).orWhere('name', 'like', `%${programName}%`);
      })
      .first('id', 'name')) || null
  );
}

async function resolveScheme(trx: Knex.Transaction, collegeId: number, schemeLabel: string | null) {
  if (!schemeLabel) return null;
  return (
    (await trx('academic_schemes')
      .where({ college_id: collegeId })
      .andWhere((b) => {
        b.where('name', 'like', `%${schemeLabel}%`).orWhere('code', schemeLabel);
      })
      .first('id', 'name')) || null
  );
}

function subjectKey(courseCode: string, scheme: string | null) {
  return `${normalizeCode(courseCode)}|${schemeKey(scheme)}`;
}

function buildSubjectSummaries(parsed: ParsedCoEvalWorkbook) {
  const map = new Map<
    string,
    {
      subjectKey: string | null;
      subjectName: string;
      courseCode: string;
      scheme: string | null;
      program: string | null;
      semester: string | null;
      courseType: string | null;
      coCount: number;
      componentCount: number;
      assessmentComponentsLabel: string | null;
      officialStructureStatus: string | null;
      standardEvaluationStatus: string | null;
      evaluationPercentTotal: number | null;
      componentTotalValidation: string | null;
      sourceStatus: string | null;
      reviewItems: number | null;
      readyForImport: string | null;
      isEvaluable: boolean;
      isBlocked: boolean;
      blockedReason: string | null;
      verificationStatus: string | null;
    }
  >();

  for (const s of parsed.summaries) {
    const key = subjectKey(s.courseCode, s.scheme);
    const blocked =
      /BLOCKED/i.test(s.standardEvaluationStatus || '') ||
      s.coCount === 0 ||
      (/PARTIAL/i.test(s.readyForImport || '') && s.coCount === 0);
    map.set(key, {
      subjectKey: null,
      subjectName: s.subjectName,
      courseCode: s.courseCode,
      scheme: s.scheme,
      program: s.program,
      semester: s.semester,
      courseType: s.courseType,
      coCount: s.coCount,
      componentCount: s.assessmentComponentsLabel
        ? s.assessmentComponentsLabel.split(',').map((x) => x.trim()).filter(Boolean).length
        : 0,
      assessmentComponentsLabel: s.assessmentComponentsLabel,
      officialStructureStatus: s.officialStructureStatus,
      standardEvaluationStatus: s.standardEvaluationStatus,
      evaluationPercentTotal: s.evaluationPercentTotal,
      componentTotalValidation: s.componentTotalValidation,
      sourceStatus: s.sourceStatus,
      reviewItems: s.reviewItems,
      readyForImport: s.readyForImport,
      isEvaluable: !blocked && s.coCount > 0,
      isBlocked: blocked,
      blockedReason: blocked
        ? s.sourceStatus ||
          s.standardEvaluationStatus ||
          'CO Evaluation master data is not available for this subject.'
        : null,
      verificationStatus: s.standardEvaluationStatus,
    });
  }

  // Ensure subjects present in CO master are represented
  for (const co of parsed.coMasters) {
    const key = subjectKey(co.courseCode, co.scheme);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        subjectKey: co.subjectKey,
        subjectName: co.subjectName,
        courseCode: co.courseCode,
        scheme: co.scheme,
        program: co.program,
        semester: co.semester,
        courseType: null,
        coCount: 1,
        componentCount: 0,
        assessmentComponentsLabel: null,
        officialStructureStatus: null,
        standardEvaluationStatus: co.verificationStatus,
        evaluationPercentTotal: null,
        componentTotalValidation: null,
        sourceStatus: co.sourceOrigin,
        reviewItems: null,
        readyForImport: 'YES',
        isEvaluable: true,
        isBlocked: false,
        blockedReason: null,
        verificationStatus: co.verificationStatus,
      });
    } else {
      existing.subjectKey = existing.subjectKey || co.subjectKey;
      existing.coCount = Math.max(existing.coCount, 0);
    }
  }

  // Attach structure course type / blocked reasons from reviews
  for (const st of parsed.structures) {
    const key = subjectKey(st.courseCode, st.scheme);
    const row = map.get(key);
    if (row) {
      row.courseType = row.courseType || st.courseType;
      row.officialStructureStatus = row.officialStructureStatus || st.verificationStatus;
      row.subjectKey = row.subjectKey || st.subjectKey;
    } else {
      map.set(key, {
        subjectKey: st.subjectKey,
        subjectName: st.subjectName,
        courseCode: st.courseCode,
        scheme: st.scheme,
        program: st.program,
        semester: st.semester,
        courseType: st.courseType,
        coCount: 0,
        componentCount: 0,
        assessmentComponentsLabel: null,
        officialStructureStatus: st.verificationStatus,
        standardEvaluationStatus: 'BLOCKED_SOURCE',
        evaluationPercentTotal: null,
        componentTotalValidation: 'N/A',
        sourceStatus: 'ASSESSMENT_OK_CO_MISSING',
        reviewItems: null,
        readyForImport: 'PARTIAL',
        isEvaluable: false,
        isBlocked: true,
        blockedReason:
          'CO Evaluation unavailable because official Course Outcomes are not available in the current CO Master.',
        verificationStatus: 'BLOCKED_SOURCE',
      });
    }
  }

  for (const rev of parsed.reviewQueue) {
    if (!rev.courseCode) continue;
    const key = subjectKey(rev.courseCode, rev.scheme);
    const row = map.get(key);
    if (!row) continue;
    // Hard-block only when there are no COs to evaluate. Review-marked issues
    // (CO_SOURCE_UNVERIFIED with existing COs, course-type uncertainty, etc.) stay evaluable.
    const issue = String(rev.issueType || '').toUpperCase();
    const reason = String(rev.reason || '');
    const noCos = row.coCount === 0;
    if (
      noCos &&
      (issue === 'CO_SOURCE_UNVERIFIED' ||
        issue === 'CO_SOURCE_MISSING' ||
        issue === 'BLOCKED_SOURCE' ||
        /without CO statements/i.test(reason) ||
        /cannot be created without CO/i.test(reason))
    ) {
      row.isBlocked = true;
      row.isEvaluable = false;
      row.blockedReason =
        rev.reason ||
        'CO Evaluation unavailable because official Course Outcomes are not available in the current CO Master.';
      row.standardEvaluationStatus = row.standardEvaluationStatus || 'BLOCKED_SOURCE';
    }
  }

  // Compute component counts from mappings for evaluable subjects
  const compsBySubject = new Map<string, Set<string>>();
  for (const m of parsed.componentMappings) {
    const key = subjectKey(m.courseCode, m.scheme);
    if (!compsBySubject.has(key)) compsBySubject.set(key, new Set());
    compsBySubject.get(key)!.add(m.assessmentComponentId);
  }
  const cosBySubject = new Map<string, number>();
  for (const co of parsed.coMasters) {
    const key = subjectKey(co.courseCode, co.scheme);
    cosBySubject.set(key, (cosBySubject.get(key) || 0) + 1);
  }
  for (const [key, row] of map) {
    const cos = cosBySubject.get(key) || 0;
    if (cos > 0) row.coCount = cos;
    const comps = compsBySubject.get(key);
    if (comps) row.componentCount = comps.size;
    if (row.coCount > 0 && !row.isBlocked) row.isEvaluable = true;
  }

  return map;
}

export async function importCoEvalMaster(
  collegeId: number,
  actor: { facultyUserId: number },
  bufferOrPath: Buffer | string,
  sourceFile: string,
  options: { dryRun?: boolean } = {},
): Promise<CoEvalImportSummary> {
  const parsed = await parseCoEvalWorkbook(bufferOrPath);
  const batchId = `COEVAL-${nanoid(10)}`;
  const subjectMap = buildSubjectSummaries(parsed);
  const blockedSubjects = [...subjectMap.values()]
    .filter((s) => s.isBlocked)
    .map((s) => ({
      courseCode: s.courseCode,
      subjectName: s.subjectName,
      reason: s.blockedReason || 'Blocked',
    }));

  const summary: CoEvalImportSummary = {
    discovered: {
      assessmentComponents: parsed.assessmentComponents.length,
      structures: parsed.structures.length,
      courseComponents: parsed.courseComponents.length,
      coRows: parsed.coMasters.length,
      componentMappings: parsed.componentMappings.length,
      justifications: parsed.justifications.length,
      sources: parsed.sources.length,
      reviewQueue: parsed.reviewQueue.length,
      subjects: subjectMap.size,
      evaluableSubjects: [...subjectMap.values()].filter((s) => s.isEvaluable).length,
      blockedSubjects: blockedSubjects.length,
    },
    inserted: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    needsReview: 0,
    blockedSubjects,
    errors: [...parsed.errors],
    warnings: [...parsed.warnings],
    batchId,
    sheets: parsed.sheets.filter(
      (s) =>
        s.startsWith('CO_EVALUATION_') ||
        s.startsWith('COURSE_ASSESSMENT_') ||
        s === 'ASSESSMENT_COMPONENT_MASTER',
    ),
  };

  if (parsed.errors.length) return summary;

  if (options.dryRun) {
    summary.needsReview =
      parsed.coMasters.filter((c) => isReviewMarked(c.verificationStatus)).length +
      parsed.reviewQueue.length;
    await db('co_eval_import_batches').insert({
      college_id: collegeId,
      batch_id: batchId,
      source_file: sourceFile,
      report: JSON.stringify(summary),
      dry_run: true,
      imported_by: actor.facultyUserId,
    });
    return summary;
  }

  await db.transaction(async (trx) => {
    const subjectDbIds = new Map<string, number>();
    const coDbIds = new Map<string, number>();
    const structureDbIds = new Map<string, number>();
    const acOrder = new Map(parsed.assessmentComponents.map((a) => [a.componentId, a.displayOrder]));

    for (const ac of parsed.assessmentComponents) {
      const existing = await trx('assessment_component_masters')
        .where({ college_id: collegeId, component_id: ac.componentId })
        .first();
      const payload = {
        college_id: collegeId,
        component_id: ac.componentId,
        code: ac.code,
        display_name: ac.displayName,
        category: ac.category,
        direct_indirect: ac.directIndirect,
        description: ac.description,
        display_order: ac.displayOrder,
        is_active: ac.active,
        import_batch: batchId,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('assessment_component_masters').insert(payload);
        summary.inserted += 1;
      } else if (
        sameText(existing.display_name, payload.display_name) &&
        sameText(existing.code, payload.code) &&
        sameNum(existing.display_order, payload.display_order) &&
        Boolean(existing.is_active) === Boolean(payload.is_active)
      ) {
        summary.unchanged += 1;
      } else {
        await trx('assessment_component_masters').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      }
    }

    for (const st of parsed.structures) {
      const course = await resolveCourse(trx, collegeId, st.courseCode, st.scheme, st.subjectName);
      const program = await resolveProgram(trx, collegeId, st.program);
      const scheme = await resolveScheme(trx, collegeId, st.scheme);
      const existing = await trx('course_assessment_structures')
        .where({ college_id: collegeId, course_assessment_id: st.courseAssessmentId })
        .first();
      const payload = {
        college_id: collegeId,
        course_assessment_id: st.courseAssessmentId,
        subject_key: st.subjectKey,
        subject_name: st.subjectName,
        course_code: st.courseCode,
        course_id: course ? Number(course.id) : null,
        scheme_label: st.scheme,
        scheme_id: scheme ? Number(scheme.id) : course?.scheme_id ?? null,
        program_name: st.program,
        program_id: program ? Number(program.id) : null,
        semester_label: st.semester,
        course_type: st.courseType,
        cie_max_marks: st.cieMaxMarks,
        see_max_marks: st.seeMaxMarks,
        cie_weightage: st.cieWeightage,
        see_weightage: st.seeWeightage,
        min_cie_pass: st.minCiePass,
        min_see_pass: st.minSeePass,
        overall_pass_rule: st.overallPassRule,
        number_of_ia: st.numberOfIa,
        assignment_component: st.assignmentComponent,
        quiz_component: st.quizComponent,
        activity_component: st.activityComponent,
        lab_component: st.labComponent,
        project_component: st.projectComponent,
        practical_component: st.practicalComponent,
        question_paper_pattern: st.questionPaperPattern,
        assessment_description: st.assessmentDescription,
        source_file: st.sourceFile,
        source_section: st.sourceSection,
        source_page: st.sourcePage,
        verification_status: st.verificationStatus,
        notes: st.notes,
        import_batch: batchId,
        is_active: true,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        const [id] = await trx('course_assessment_structures').insert(payload);
        structureDbIds.set(st.courseAssessmentId, Number(id));
        structureDbIds.set(subjectKey(st.courseCode, st.scheme), Number(id));
        summary.inserted += 1;
      } else {
        structureDbIds.set(st.courseAssessmentId, Number(existing.id));
        structureDbIds.set(subjectKey(st.courseCode, st.scheme), Number(existing.id));
        if (
          sameText(existing.course_type, payload.course_type) &&
          sameText(existing.assessment_description, payload.assessment_description) &&
          sameNum(existing.cie_max_marks, payload.cie_max_marks)
        ) {
          summary.unchanged += 1;
          await trx('course_assessment_structures').where({ id: existing.id }).update({
            import_batch: batchId,
            course_id: payload.course_id,
            scheme_id: payload.scheme_id,
            program_id: payload.program_id,
            updated_at: trx.fn.now(),
          });
        } else {
          await trx('course_assessment_structures').where({ id: existing.id }).update(payload);
          summary.updated += 1;
        }
      }
    }

    for (const cc of parsed.courseComponents) {
      const structureId =
        structureDbIds.get(subjectKey(cc.courseCode, cc.scheme)) ??
        (
          await trx('course_assessment_structures')
            .where({
              college_id: collegeId,
              course_code: cc.courseCode,
              scheme_label: cc.scheme || '',
            })
            .orWhere({ college_id: collegeId, course_code: cc.courseCode })
            .first('id')
        )?.id ??
        null;
      const existing = await trx('course_assessment_components')
        .where({
          college_id: collegeId,
          course_assessment_component_id: cc.courseAssessmentComponentId,
        })
        .first();
      const payload = {
        college_id: collegeId,
        course_assessment_component_id: cc.courseAssessmentComponentId,
        structure_id: structureId ? Number(structureId) : null,
        subject_key: cc.subjectKey,
        course_code: cc.courseCode,
        scheme_label: schemeKey(cc.scheme),
        component_id: cc.componentId,
        component_name: cc.componentName,
        max_marks: cc.maxMarks,
        weightage: cc.weightage,
        count: cc.count,
        mandatory: cc.mandatory,
        description: cc.description,
        source: cc.source,
        verification_status: cc.verificationStatus,
        display_order: acOrder.get(cc.componentId) ?? 100,
        import_batch: batchId,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('course_assessment_components').insert(payload);
        summary.inserted += 1;
      } else if (
        sameNum(existing.max_marks, payload.max_marks) &&
        sameText(existing.component_name, payload.component_name)
      ) {
        summary.unchanged += 1;
      } else {
        await trx('course_assessment_components').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      }
    }

    for (const [key, subj] of subjectMap) {
      const course = await resolveCourse(trx, collegeId, subj.courseCode, subj.scheme, subj.subjectName);
      const program = await resolveProgram(trx, collegeId, subj.program);
      const scheme = await resolveScheme(trx, collegeId, subj.scheme);
      if (isReviewMarked(subj.verificationStatus) || isReviewMarked(subj.standardEvaluationStatus)) {
        summary.needsReview += 1;
      }
      const existing = await trx('co_evaluation_subject_masters')
        .where({
          college_id: collegeId,
          course_code: subj.courseCode,
          scheme_label: schemeKey(subj.scheme),
        })
        .first();
      const payload = {
        college_id: collegeId,
        subject_key: subj.subjectKey,
        subject_name: subj.subjectName,
        course_code: subj.courseCode,
        course_id: course ? Number(course.id) : null,
        scheme_label: schemeKey(subj.scheme),
        scheme_id: scheme ? Number(scheme.id) : course?.scheme_id ?? null,
        program_name: subj.program,
        program_id: program ? Number(program.id) : null,
        semester_label: subj.semester,
        course_type: subj.courseType,
        co_count: subj.coCount,
        component_count: subj.componentCount,
        assessment_components_label: subj.assessmentComponentsLabel,
        official_structure_status: subj.officialStructureStatus,
        standard_evaluation_status: subj.standardEvaluationStatus,
        evaluation_percent_total: subj.evaluationPercentTotal,
        component_total_validation: subj.componentTotalValidation,
        source_status: subj.sourceStatus,
        review_items: subj.reviewItems,
        ready_for_import: subj.readyForImport,
        is_evaluable: subj.isEvaluable,
        is_blocked: subj.isBlocked,
        blocked_reason: subj.blockedReason,
        verification_status: subj.verificationStatus,
        import_batch: batchId,
        is_active: true,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        const [id] = await trx('co_evaluation_subject_masters').insert(payload);
        subjectDbIds.set(key, Number(id));
        summary.inserted += 1;
      } else {
        subjectDbIds.set(key, Number(existing.id));
        if (
          sameNum(existing.co_count, payload.co_count) &&
          Boolean(existing.is_evaluable) === Boolean(payload.is_evaluable) &&
          sameText(existing.standard_evaluation_status, payload.standard_evaluation_status)
        ) {
          summary.unchanged += 1;
          await trx('co_evaluation_subject_masters').where({ id: existing.id }).update({
            import_batch: batchId,
            course_id: payload.course_id,
            scheme_id: payload.scheme_id,
            program_id: payload.program_id,
            blocked_reason: payload.blocked_reason,
            is_blocked: payload.is_blocked,
            is_evaluable: payload.is_evaluable,
            updated_at: trx.fn.now(),
          });
        } else {
          await trx('co_evaluation_subject_masters').where({ id: existing.id }).update(payload);
          summary.updated += 1;
        }
      }
    }

    for (const co of parsed.coMasters) {
      const key = subjectKey(co.courseCode, co.scheme);
      const subjectMasterId = subjectDbIds.get(key) ?? null;
      if (isReviewMarked(co.verificationStatus)) summary.needsReview += 1;
      const existing = await trx('co_evaluation_co_masters')
        .where({ college_id: collegeId, co_evaluation_id: co.coEvaluationId })
        .first();
      const payload = {
        college_id: collegeId,
        subject_master_id: subjectMasterId,
        co_evaluation_id: co.coEvaluationId,
        subject_key: co.subjectKey,
        subject_name: co.subjectName,
        course_code: co.courseCode,
        scheme_label: schemeKey(co.scheme),
        program_name: co.program,
        semester_label: co.semester,
        co_code: co.coCode,
        co_statement: co.coStatement,
        co_source_status: co.coSourceStatus,
        standard_marks_distribution: co.standardMarksDistribution,
        standard_evaluation_percent: co.standardEvaluationPercent,
        total_standard_component_marks: co.totalStandardComponentMarks,
        default_status: co.defaultStatus,
        source_origin: co.sourceOrigin,
        verification_status: co.verificationStatus,
        lecturer_editable: co.lecturerEditable,
        notes: co.notes,
        display_order: co.displayOrder,
        import_batch: batchId,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        const [id] = await trx('co_evaluation_co_masters').insert(payload);
        coDbIds.set(`${key}|${co.coCode}`, Number(id));
        summary.inserted += 1;
      } else {
        coDbIds.set(`${key}|${co.coCode}`, Number(existing.id));
        if (
          sameText(existing.co_statement, payload.co_statement) &&
          sameNum(existing.standard_evaluation_percent, payload.standard_evaluation_percent) &&
          sameNum(existing.standard_marks_distribution, payload.standard_marks_distribution)
        ) {
          summary.unchanged += 1;
        } else {
          await trx('co_evaluation_co_masters').where({ id: existing.id }).update(payload);
          summary.updated += 1;
        }
      }
    }

    for (const m of parsed.componentMappings) {
      const key = subjectKey(m.courseCode, m.scheme);
      const subjectMasterId = subjectDbIds.get(key) ?? null;
      const coMasterId = coDbIds.get(`${key}|${m.coCode}`) ?? null;
      const existing = await trx('co_evaluation_component_masters')
        .where({
          college_id: collegeId,
          co_evaluation_component_id: m.coEvaluationComponentId,
        })
        .first();
      const payload = {
        college_id: collegeId,
        subject_master_id: subjectMasterId,
        co_master_id: coMasterId,
        co_evaluation_component_id: m.coEvaluationComponentId,
        subject_key: m.subjectKey,
        subject_name: m.subjectName,
        course_code: m.courseCode,
        scheme_label: schemeKey(m.scheme),
        program_name: m.program,
        semester_label: m.semester,
        co_code: m.coCode,
        assessment_component_id: m.assessmentComponentId,
        assessment_component_name: m.assessmentComponentName,
        standard_marks_assigned: m.standardMarksAssigned,
        standard_weightage: m.standardWeightage,
        evaluation_percent_contribution: m.evaluationPercentContribution,
        is_default: m.isDefault,
        lecturer_editable: m.lecturerEditable,
        mapping_basis: m.mappingBasis,
        source_origin: m.sourceOrigin,
        verification_status: m.verificationStatus,
        notes: m.notes,
        import_batch: batchId,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('co_evaluation_component_masters').insert(payload);
        summary.inserted += 1;
      } else if (sameNum(existing.standard_marks_assigned, payload.standard_marks_assigned)) {
        summary.unchanged += 1;
      } else {
        await trx('co_evaluation_component_masters').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      }
    }

    for (const j of parsed.justifications) {
      const key = subjectKey(j.courseCode, j.scheme);
      const subjectMasterId = subjectDbIds.get(key) ?? null;
      const existing = await trx('co_evaluation_justification_masters')
        .where({ college_id: collegeId, justification_id: j.justificationId })
        .first();
      const payload = {
        college_id: collegeId,
        subject_master_id: subjectMasterId,
        justification_id: j.justificationId,
        subject_key: j.subjectKey,
        course_code: j.courseCode,
        scheme_label: schemeKey(j.scheme),
        co_code: j.coCode,
        assessment_component_id: j.assessmentComponentId,
        standard_value: j.standardValue,
        justification: j.justification,
        source_origin: j.sourceOrigin,
        source_reference: j.sourceReference,
        verification_status: j.verificationStatus,
        notes: j.notes,
        import_batch: batchId,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('co_evaluation_justification_masters').insert(payload);
        summary.inserted += 1;
      } else if (sameText(existing.justification, payload.justification)) {
        summary.unchanged += 1;
      } else {
        await trx('co_evaluation_justification_masters').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      }
    }

    for (const s of parsed.sources) {
      const key = subjectKey(s.courseCode, s.scheme);
      const subjectMasterId = subjectDbIds.get(key) ?? null;
      const existing = await trx('co_evaluation_sources')
        .where({ college_id: collegeId, source_id: s.sourceId })
        .first();
      const payload = {
        college_id: collegeId,
        subject_master_id: subjectMasterId,
        source_id: s.sourceId,
        subject_key: s.subjectKey,
        subject_name: s.subjectName,
        course_code: s.courseCode,
        scheme_label: schemeKey(s.scheme),
        source_type: s.sourceType,
        source_file: s.sourceFile,
        source_page_section: s.sourcePageSection,
        extracted_field: s.extractedField,
        extracted_value: s.extractedValue,
        verification_status: s.verificationStatus,
        notes: s.notes,
        import_batch: batchId,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('co_evaluation_sources').insert(payload);
        summary.inserted += 1;
      } else if (sameText(existing.extracted_value, payload.extracted_value)) {
        summary.unchanged += 1;
      } else {
        await trx('co_evaluation_sources').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      }
    }

    for (const r of parsed.reviewQueue) {
      const existing = await trx('co_evaluation_review_queue')
        .where({ college_id: collegeId, review_id: r.reviewId })
        .first();
      const payload = {
        college_id: collegeId,
        review_id: r.reviewId,
        subject_name: r.subjectName,
        course_code: r.courseCode,
        scheme_label: schemeKey(r.scheme),
        co_code: r.coCode,
        component: r.component,
        issue_type: r.issueType,
        current_value: r.currentValue,
        proposed_value: r.proposedValue,
        reason: r.reason,
        source: r.source,
        priority: r.priority,
        review_status: r.reviewStatus,
        reviewer: r.reviewer,
        review_notes: r.reviewNotes,
        import_batch: batchId,
        updated_at: trx.fn.now(),
      };
      if (!existing) {
        await trx('co_evaluation_review_queue').insert(payload);
        summary.inserted += 1;
      } else if (sameText(existing.reason, payload.reason) && sameText(existing.review_status, payload.review_status)) {
        summary.unchanged += 1;
      } else {
        await trx('co_evaluation_review_queue').where({ id: existing.id }).update(payload);
        summary.updated += 1;
      }
    }

    await trx('co_eval_import_batches').insert({
      college_id: collegeId,
      batch_id: batchId,
      source_file: sourceFile,
      report: JSON.stringify(summary),
      dry_run: false,
      imported_by: actor.facultyUserId,
    });
  });

  return summary;
}
