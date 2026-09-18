/**
 * Deterministic, idempotent academic-master seed.
 * Never truncates. Never deletes faculty/college operational data.
 *
 * Usage:
 *   node scripts/seed-academic-master.cjs
 *   node scripts/seed-academic-master.cjs --dry-run
 *   node scripts/seed-academic-master.cjs --skip-colleges
 */
const fs = require('node:fs');
const path = require('node:path');

const knexConfig = require('../knexfile.cjs');
const knex = require('knex')(knexConfig);

const DATA = path.resolve(__dirname, '../seeds/academic');
const dryRun = process.argv.includes('--dry-run');
const skipColleges = process.argv.includes('--skip-colleges');
const BATCH = 'SEED-ACADEMIC-MASTER';

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(DATA, name), 'utf8'));
}

function norm(code) {
  return String(code || '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function schemeCodeFromLabel(label) {
  const year = String(label || '').replace(/[^0-9]/g, '');
  return year ? `VTU-${year}` : norm(label);
}

function same(a, b) {
  return String(a ?? '') === String(b ?? '');
}

async function upsert(trx, table, match, payload) {
  let q = trx(table);
  for (const [key, value] of Object.entries(match)) {
    if (value === null) q = q.whereNull(key);
    else q = q.andWhere(key, value);
  }
  const existing = await q.first();
  if (!existing) {
    const [id] = await trx(table).insert(payload);
    return { id: Number(id), action: 'insert' };
  }
  const next = { ...payload };
  delete next.created_at;
  await trx(table).where({ id: existing.id }).update({ ...next, updated_at: trx.fn.now() });
  return { id: Number(existing.id), action: 'update' };
}

function counts() {
  return {
    inserted: 0,
    updated: 0,
    duplicatesDetected: 0,
  };
}

function bump(stats, action) {
  if (action === 'insert') stats.inserted += 1;
  else stats.updated += 1;
}

async function seedGlobalMasters(trx, report) {
  const gaps = readJson('gap-analysis.json');
  const gapCos = readJson('gap-co.json');
  const gapOutcomes = readJson('gap-outcomes.json');
  const actions = readJson('recommended-actions.json');
  const gapSources = readJson('gap-sources.json');
  const cbs = readJson('beyond-syllabus.json');
  const cbsCos = readJson('beyond-syllabus-co.json');
  const cbsActions = readJson('beyond-syllabus-actions.json');
  const cbsSources = readJson('beyond-syllabus-sources.json');
  const coEval = readJson('co-evaluation.json');
  const sdgs = readJson('sdgs.json');

  for (const sdg of sdgs) {
    const payload = {
      sdg_number: sdg.sdgNumber,
      sdg_code: sdg.sdgCode,
      official_title: sdg.title,
      official_description: sdg.description || sdg.title,
      source: 'United Nations Sustainable Development Goals',
      source_url: sdg.officialReference || 'https://sdgs.un.org/goals',
      active: sdg.active !== false,
    };
    const existing = await trx('sustainable_development_goals').where({ sdg_number: sdg.sdgNumber }).first();
    if (existing) {
      await trx('sustainable_development_goals').where({ id: existing.id }).update({ ...payload, updated_at: trx.fn.now() });
      report.sdgs.updated += 1;
    } else {
      await trx('sustainable_development_goals').insert(payload);
      report.sdgs.inserted += 1;
    }
  }

  const gapIds = new Map();
  for (const gap of gaps) {
    const payload = {
      college_id: null,
      gap_id: gap.gapId,
      subject_key: gap.subjectKey,
      course_id: null,
      subject_name: gap.subjectName,
      course_code: norm(gap.courseCode),
      scheme_label: gap.scheme,
      scheme_id: null,
      program_name: gap.program,
      program_id: null,
      semester_label: gap.semester,
      module_unit: gap.moduleUnit,
      related_topic: gap.relatedTopic,
      gap_type: gap.gapType,
      gap_statement: gap.gapStatement,
      gap_justification: gap.gapJustification,
      official_syllabus_coverage: gap.officialSyllabusCoverage,
      current_teaching_coverage: gap.currentTeachingCoverage,
      expected_coverage_level: gap.expectedCoverageLevel,
      priority: gap.priority,
      related_cos_raw: gap.relatedCosRaw,
      suggested_action_type: gap.suggestedActionType,
      source_basis: gap.sourceBasis,
      mapping_origin: gap.mappingOrigin,
      verification_status: gap.verificationStatus,
      import_batch: BATCH,
      is_active: true,
    };
    const result = await upsert(trx, 'gap_masters', { college_id: null, gap_id: gap.gapId }, payload);
    gapIds.set(gap.gapId, result.id);
    bump(report.gaps, result.action);
  }

  for (const link of gapCos) {
    const gapMasterId = gapIds.get(link.gapId);
    if (!gapMasterId) continue;
    const payload = {
      college_id: null,
      gap_master_id: gapMasterId,
      gap_id: link.gapId,
      course_code: norm(link.courseCode),
      co_code: String(link.coCode).toUpperCase(),
      course_outcome_id: null,
      relationship: link.relationship,
      basis: link.basis,
      verification_status: link.verificationStatus,
    };
    const result = await upsert(
      trx,
      'gap_master_co_links',
      { college_id: null, gap_id: link.gapId, co_code: payload.co_code },
      payload,
    );
    bump(report.gapCoLinks, result.action);
  }

  for (const link of gapOutcomes) {
    const gapMasterId = gapIds.get(link.gapId);
    if (!gapMasterId) continue;
    const payload = {
      college_id: null,
      gap_master_id: gapMasterId,
      gap_id: link.gapId,
      course_code: norm(link.courseCode),
      co_code: link.coCode ? String(link.coCode).toUpperCase() : null,
      outcome_type: String(link.outcomeType).toUpperCase(),
      outcome_code: String(link.outcomeCode).toUpperCase(),
      strength: link.strength,
      derived_from: link.derivedFrom,
      verification_status: link.verificationStatus,
    };
    const result = await upsert(
      trx,
      'gap_master_outcome_links',
      {
        college_id: null,
        gap_id: link.gapId,
        outcome_type: payload.outcome_type,
        outcome_code: payload.outcome_code,
        co_code: payload.co_code,
      },
      payload,
    );
    bump(report.gapOutcomes, result.action);
  }

  for (const action of actions) {
    const gapMasterId = gapIds.get(action.gapId);
    if (!gapMasterId) continue;
    const payload = {
      college_id: null,
      gap_master_id: gapMasterId,
      action_id: action.actionId,
      gap_id: action.gapId,
      action_type: action.actionType,
      recommended_action: action.recommendedAction,
      expected_coverage_level: action.expectedCoverageLevel,
      priority: action.priority,
      source_basis: action.sourceBasis,
      verification_status: action.verificationStatus,
    };
    const result = await upsert(trx, 'gap_master_actions', { college_id: null, action_id: action.actionId }, payload);
    bump(report.actions, result.action);
  }

  for (const source of gapSources) {
    const gapMasterId = gapIds.get(source.gapId);
    if (!gapMasterId) continue;
    const payload = {
      college_id: null,
      gap_master_id: gapMasterId,
      source_id: source.sourceId,
      gap_id: source.gapId,
      source_type: source.sourceType,
      source_file: source.sourceFile,
      source_reference: source.sourceReference,
      notes: source.notes,
    };
    const result = await upsert(trx, 'gap_master_sources', { college_id: null, source_id: source.sourceId }, payload);
    bump(report.gapSources, result.action);
  }

  const cbsIds = new Map();
  for (const item of cbs) {
    const payload = {
      college_id: null,
      cbs_id: item.cbsId,
      subject_key: item.subjectKey,
      course_id: null,
      subject_name: item.subjectName,
      course_code: norm(item.courseCode),
      scheme_label: item.scheme,
      scheme_id: null,
      program_name: item.program,
      program_id: null,
      semester_label: item.semester,
      module_unit: item.moduleUnit,
      related_topic: item.relatedTopic,
      title: item.title,
      content_description: item.contentDescription,
      origin_type: item.originType,
      related_gap_id: item.relatedGapId,
      rationale: item.rationale,
      expected_benefit: item.expectedBenefit,
      suggested_co: item.suggestedCo,
      suggested_delivery_method: item.suggestedDeliveryMethod,
      suggested_hours: item.suggestedHours,
      suggested_assessment: item.suggestedAssessment,
      priority: item.priority,
      source_type: item.sourceType,
      source_reference: item.sourceReference,
      mapping_origin: item.mappingOrigin,
      verification_status: item.verificationStatus,
      import_batch: BATCH,
      is_active: item.active !== false,
      notes: item.notes,
    };
    const result = await upsert(trx, 'cbs_masters', { college_id: null, cbs_id: item.cbsId }, payload);
    cbsIds.set(item.cbsId, result.id);
    bump(report.cbs, result.action);
  }

  for (const link of cbsCos) {
    const cbsMasterId = cbsIds.get(link.cbsId);
    if (!cbsMasterId) continue;
    const payload = {
      college_id: null,
      cbs_master_id: cbsMasterId,
      cbs_id: link.cbsId,
      course_code: norm(link.courseCode),
      co_code: String(link.coCode).toUpperCase(),
      course_outcome_id: null,
      relationship: link.relationship,
      basis: link.basis,
      verification_status: link.verificationStatus,
    };
    const result = await upsert(
      trx,
      'cbs_master_co_links',
      { college_id: null, cbs_id: link.cbsId, co_code: payload.co_code },
      payload,
    );
    bump(report.cbsCoLinks, result.action);
  }

  for (const action of cbsActions) {
    const cbsMasterId = cbsIds.get(action.cbsId);
    if (!cbsMasterId) continue;
    const payload = {
      college_id: null,
      cbs_master_id: cbsMasterId,
      action_id: action.actionId,
      cbs_id: action.cbsId,
      action_type: action.actionType,
      recommended_action: action.recommendedAction,
      priority: action.priority,
      verification_status: action.verificationStatus,
    };
    const result = await upsert(trx, 'cbs_master_actions', { college_id: null, action_id: action.actionId }, payload);
    bump(report.cbsActions, result.action);
  }

  for (const source of cbsSources) {
    const cbsMasterId = cbsIds.get(source.cbsId);
    if (!cbsMasterId) continue;
    const payload = {
      college_id: null,
      cbs_master_id: cbsMasterId,
      source_id: source.sourceId,
      cbs_id: source.cbsId,
      source_type: source.sourceType,
      source_file: source.sourceFile,
      source_reference: source.sourceReference,
      notes: source.notes,
    };
    const result = await upsert(trx, 'cbs_master_sources', { college_id: null, source_id: source.sourceId }, payload);
    bump(report.cbsSources, result.action);
  }

  if (await trx.schema.hasTable('assessment_component_masters')) {
    for (const ac of coEval.assessmentComponents || []) {
      const payload = {
        college_id: null,
        component_id: ac.componentId,
        code: ac.code,
        display_name: ac.displayName,
        category: ac.category,
        direct_indirect: ac.directIndirect,
        description: ac.description,
        display_order: ac.displayOrder,
        is_active: ac.active !== false,
        import_batch: BATCH,
      };
      const result = await upsert(
        trx,
        'assessment_component_masters',
        { college_id: null, component_id: ac.componentId },
        payload,
      );
      bump(report.coEvalComponents, result.action);
    }

    const structureIds = new Map();
    for (const st of coEval.structures || []) {
      const payload = {
        college_id: null,
        course_assessment_id: st.courseAssessmentId,
        subject_key: st.subjectKey,
        subject_name: st.subjectName,
        course_code: norm(st.courseCode),
        course_id: null,
        scheme_label: st.scheme,
        scheme_id: null,
        program_name: st.program,
        program_id: null,
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
        import_batch: BATCH,
        is_active: true,
      };
      const result = await upsert(
        trx,
        'course_assessment_structures',
        { college_id: null, course_assessment_id: st.courseAssessmentId },
        payload,
      );
      structureIds.set(st.courseAssessmentId, result.id);
      bump(report.coEvalStructures, result.action);
    }

    for (const cc of coEval.courseComponents || []) {
      const payload = {
        college_id: null,
        course_assessment_component_id: cc.courseAssessmentComponentId,
        structure_id: null,
        subject_key: cc.subjectKey,
        course_code: norm(cc.courseCode),
        scheme_label: cc.scheme,
        component_id: cc.componentId,
        component_name: cc.componentName,
        max_marks: cc.maxMarks,
        weightage: cc.weightage,
        count: cc.count,
        mandatory: cc.mandatory !== false,
        description: cc.description,
        source: cc.source,
        verification_status: cc.verificationStatus,
        import_batch: BATCH,
      };
      const result = await upsert(
        trx,
        'course_assessment_components',
        { college_id: null, course_assessment_component_id: cc.courseAssessmentComponentId },
        payload,
      );
      bump(report.coEvalCourseComponents, result.action);
    }

    const subjectIds = new Map();
    const summaries = coEval.summaries || [];
    for (const s of summaries) {
      const courseCode = norm(s.courseCode);
      const schemeLabel = String(s.scheme || '');
      const coCount = Number(s.coCount || 0);
      const payload = {
        college_id: null,
        subject_key: s.subjectKey || courseCode,
        subject_name: s.subjectName,
        course_code: courseCode,
        course_id: null,
        scheme_label: schemeLabel,
        scheme_id: null,
        program_name: s.program,
        program_id: null,
        semester_label: s.semester,
        course_type: s.courseType,
        co_count: coCount,
        component_count: Number(s.componentCount || 0),
        assessment_components_label: s.assessmentComponentsLabel || null,
        official_structure_status: s.officialStructureStatus || null,
        standard_evaluation_status: s.standardEvaluationStatus || null,
        evaluation_percent_total: s.evaluationPercentTotal ?? null,
        component_total_validation: s.componentTotalValidation || null,
        source_status: s.sourceStatus || null,
        review_items: s.reviewItems ?? null,
        ready_for_import: s.readyForImport || null,
        is_evaluable: coCount > 0 && !s.isBlocked,
        is_blocked: Boolean(s.isBlocked) || coCount === 0,
        blocked_reason: s.blockedReason || (coCount === 0 ? 'Official Course Outcomes are not available.' : null),
        verification_status: s.verificationStatus || null,
        import_batch: BATCH,
        is_active: true,
      };
      const result = await upsert(
        trx,
        'co_evaluation_subject_masters',
        { college_id: null, course_code: courseCode, scheme_label: schemeLabel },
        payload,
      );
      subjectIds.set(`${courseCode}|${schemeLabel}`, result.id);
      bump(report.coEvalSubjects, result.action);
    }

    for (const co of coEval.coMasters || []) {
      const courseCode = norm(co.courseCode);
      const schemeLabel = String(co.scheme || '');
      const subjectMasterId = subjectIds.get(`${courseCode}|${schemeLabel}`) || null;
      const payload = {
        college_id: null,
        subject_master_id: subjectMasterId,
        co_evaluation_id: co.coEvaluationId,
        subject_key: co.subjectKey,
        subject_name: co.subjectName,
        course_code: courseCode,
        scheme_label: schemeLabel,
        program_name: co.program,
        semester_label: co.semester,
        co_code: String(co.coCode).toUpperCase(),
        co_statement: co.coStatement,
        co_source_status: co.coSourceStatus,
        standard_marks_distribution: co.standardMarksDistribution,
        standard_evaluation_percent: co.standardEvaluationPercent,
        total_standard_component_marks: co.totalStandardComponentMarks,
        default_status: co.defaultStatus,
        source_origin: co.sourceOrigin,
        verification_status: co.verificationStatus,
        lecturer_editable: co.lecturerEditable !== false,
        notes: co.notes,
        import_batch: BATCH,
      };
      const result = await upsert(
        trx,
        'co_evaluation_co_masters',
        { college_id: null, co_evaluation_id: co.coEvaluationId },
        payload,
      );
      bump(report.coEvalCos, result.action);
    }
  }

  const collegeDupGaps = await trx('gap_masters').whereNotNull('college_id').count({ c: '*' }).first();
  const collegeDupCbs = await trx('cbs_masters').whereNotNull('college_id').count({ c: '*' }).first();
  report.duplicatesDetected = Number(collegeDupGaps?.c || 0) + Number(collegeDupCbs?.c || 0);
}

async function materializeCollege(trx, college, report) {
  const schemes = readJson('schemes.json');
  const programs = readJson('programs.json');
  const subjects = readJson('subjects.json');
  const modules = readJson('modules.json');
  const cos = readJson('cos.json');
  const pos = readJson('pos.json');
  const psos = readJson('psos.json');
  const copo = readJson('copo.json');
  const copso = readJson('copso.json');
  const cosdg = readJson('cosdg.json');
  const collegeId = Number(college.id);

  const schemeIds = new Map();
  for (const scheme of schemes) {
    const payload = {
      college_id: collegeId,
      name: scheme.name,
      code: scheme.schemeCode,
      university: scheme.university,
      start_year: scheme.startYear,
      effective_academic_year: scheme.effectiveAcademicYear,
      status: 'ACTIVE',
    };
    const result = await upsert(trx, 'academic_schemes', { college_id: collegeId, code: scheme.schemeCode }, payload);
    schemeIds.set(scheme.schemeCode, result.id);
    bump(report.collegeSchemes, result.action);
  }

  const programIds = new Map();
  for (const program of programs) {
    const code = program.programCode;
    const schemeId = schemeIds.get(schemeCodeFromLabel(program.scheme)) || null;
    const payload = {
      college_id: collegeId,
      name: program.name,
      code,
      scheme_id: schemeId,
      degree: program.degree,
      status: 'ACTIVE',
    };
    const existingProgram = await trx('programs').where({ college_id: collegeId, code }).first();
    if (existingProgram) {
      await trx('programs')
        .where({ id: existingProgram.id })
        .update({
          name: payload.name,
          degree: payload.degree || existingProgram.degree,
          status: 'ACTIVE',
          updated_at: trx.fn.now(),
        });
      programIds.set(`${program.scheme}|${code}`, Number(existingProgram.id));
      programIds.set(`name:${program.name}`, Number(existingProgram.id));
      report.collegePrograms.updated += 1;
    } else {
      const result = await upsert(trx, 'programs', { college_id: collegeId, code }, payload);
      programIds.set(`${program.scheme}|${code}`, result.id);
      programIds.set(`name:${program.name}`, result.id);
      bump(report.collegePrograms, result.action);
    }
    const programId = programIds.get(`${program.scheme}|${code}`);
    if (schemeId && programId) {
      const link = await trx('scheme_programs').where({ scheme_id: schemeId, program_id: programId }).first();
      if (!link) {
        await trx('scheme_programs').insert({
          college_id: collegeId,
          scheme_id: schemeId,
          program_id: programId,
          status: 'ACTIVE',
        });
      }
    }
  }

  const semesterIds = new Map();
  for (const n of [1, 2, 3, 4, 5, 6, 7, 8]) {
    const label = `Semester ${n}`;
    const existing = await trx('semesters').where({ college_id: collegeId, number: n }).first();
    if (existing) {
      semesterIds.set(n, Number(existing.id));
      continue;
    }
    const byLabel = await trx('semesters').where({ college_id: collegeId, label }).first();
    if (byLabel) {
      semesterIds.set(n, Number(byLabel.id));
      continue;
    }
    const [id] = await trx('semesters').insert({ college_id: collegeId, label, number: n });
    semesterIds.set(n, Number(id));
  }

  const courseIds = new Map();
  for (const subject of subjects) {
    const code = norm(subject.subjectCode);
    const schemeId = schemeIds.get(schemeCodeFromLabel(subject.scheme)) || null;
    const semesterNumber = Number(subject.semesterNumber) || null;
    const semesterId = semesterNumber ? semesterIds.get(semesterNumber) || null : null;
    let course = schemeId
      ? await trx('courses').where({ college_id: collegeId, code, scheme_id: schemeId }).first()
      : null;
    if (!course) course = await trx('courses').where({ college_id: collegeId, code }).first();
    const payload = {
      college_id: collegeId,
      code,
      name: subject.subjectName,
      scheme_id: schemeId,
      semester_id: semesterId,
      course_type: subject.courseType,
      lecture_hours: subject.lectureHours,
      tutorial_hours: subject.tutorialHours,
      practical_hours: subject.practicalHours,
      credits: subject.credits,
      status: 'ACTIVE',
    };
    if (!course) {
      const [id] = await trx('courses').insert(payload);
      courseIds.set(code, Number(id));
      report.collegeCourses.inserted += 1;
    } else {
      await trx('courses')
        .where({ id: course.id })
        .update({
          name: payload.name,
          scheme_id: course.scheme_id || payload.scheme_id,
          semester_id: course.semester_id || payload.semester_id,
          course_type: payload.course_type || course.course_type,
          lecture_hours: payload.lecture_hours ?? course.lecture_hours,
          tutorial_hours: payload.tutorial_hours ?? course.tutorial_hours,
          practical_hours: payload.practical_hours ?? course.practical_hours,
          credits: payload.credits ?? course.credits,
          updated_at: trx.fn.now(),
        });
      courseIds.set(code, Number(course.id));
      report.collegeCourses.updated += 1;
    }

    const programCode = String(subject.program || '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase()
      .slice(0, 32);
    const programId = programIds.get(`${subject.scheme}|${programCode}`);
    if (programId && courseIds.get(code)) {
      const existingLink = await trx('program_subjects')
        .where({ program_id: programId, course_id: courseIds.get(code) })
        .first();
      if (!existingLink) {
        await trx('program_subjects').insert({
          college_id: collegeId,
          program_id: programId,
          course_id: courseIds.get(code),
          scheme_id: schemeId,
          semester_id: semesterId,
          status: 'ACTIVE',
        });
      }
    }
  }

  for (const mod of modules) {
    const courseId = courseIds.get(norm(mod.subjectCode));
    if (!courseId) continue;
    const name = `${mod.moduleCode} ${mod.title}`.trim();
    const existing =
      (await trx('subject_modules').where({ college_id: collegeId, course_id: courseId, name }).first()) ||
      (await trx('subject_modules').where({ college_id: collegeId, course_id: courseId, code: mod.moduleCode }).first());
    const payload = {
      college_id: collegeId,
      course_id: courseId,
      name,
      code: mod.moduleCode,
      description: mod.title,
      sort_order: mod.sortOrder || mod.moduleNumber || 0,
    };
    if (!existing) {
      await trx('subject_modules').insert(payload);
      report.collegeModules.inserted += 1;
    } else {
      await trx('subject_modules').where({ id: existing.id }).update({
        code: payload.code,
        description: payload.description,
        sort_order: payload.sort_order,
        updated_at: trx.fn.now(),
      });
      report.collegeModules.updated += 1;
    }
  }

  for (const co of cos) {
    const courseId = courseIds.get(norm(co.subjectCode));
    if (!courseId) continue;
    const coCode = String(co.coCode).toUpperCase();
    const number = Number(String(coCode).replace(/[^0-9]/g, '')) || 1;
    const existing = await trx('course_outcomes')
      .where({ college_id: collegeId, course_id: courseId, co_code: coCode, is_current: true })
      .first();
    const payload = {
      college_id: collegeId,
      course_id: courseId,
      scheme_id: schemeIds.get(schemeCodeFromLabel(co.scheme)) || null,
      co_number: number,
      co_code: coCode,
      statement: co.statement,
      blooms_level: co.bloomsLevel,
      source: co.source,
      source_page: co.page,
      is_current: true,
      status: 'ACTIVE',
      official_text_pending: false,
    };
    if (!existing) {
      await trx('course_outcomes').insert(payload);
      report.collegeCos.inserted += 1;
    } else if (!same(existing.statement, co.statement)) {
      await trx('course_outcomes').where({ id: existing.id }).update({ is_current: false, updated_at: trx.fn.now() });
      await trx('course_outcomes').insert({
        ...payload,
        version_number: Number(existing.version_number || 1) + 1,
        supersedes_id: existing.id,
      });
      report.collegeCos.updated += 1;
    } else {
      report.collegeCos.updated += 1;
    }
  }

  const poByScheme = new Map();
  for (const po of pos) {
    const schemeCode = schemeCodeFromLabel(po.scheme);
    const schemeId = schemeIds.get(schemeCode);
    if (!schemeId) continue;
    const programCode = String(po.program || '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase()
      .slice(0, 32);
    const programId = programIds.get(`${po.scheme}|${programCode}`) || null;
    const key = `${schemeId}|${programId || 'ALL'}`;
    if (!poByScheme.has(key)) poByScheme.set(key, { schemeId, programId, pos: [] });
    poByScheme.get(key).pos.push(po);
  }

  const frameworkIds = new Map();
  for (const [key, group] of poByScheme.entries()) {
    let version = await trx('program_outcome_versions')
      .where({ college_id: collegeId, scheme_id: group.schemeId, version_number: 1 })
      .modify((q) => {
        if (group.programId) q.andWhere({ program_id: group.programId });
        else q.whereNull('program_id');
      })
      .first();
    if (!version) {
      const [id] = await trx('program_outcome_versions').insert({
        college_id: collegeId,
        scheme_id: group.schemeId,
        program_id: group.programId,
        version_number: 1,
        label: 'Academic master seed',
        source: BATCH,
        status: 'ACTIVE',
      });
      version = { id };
    }
    frameworkIds.set(key, Number(version.id));
    for (const po of group.pos) {
      const number = Number(String(po.poCode).replace(/[^0-9]/g, '')) || 0;
      const payload = {
        college_id: collegeId,
        framework_version_id: version.id,
        scheme_id: group.schemeId,
        po_number: number,
        po_code: po.poCode,
        short_title: po.title,
        official_statement: po.statement,
        source: po.source,
        status: 'ACTIVE',
        official_text_pending: !po.statement,
        sort_order: number,
      };
      const result = await upsert(
        trx,
        'program_outcomes',
        { framework_version_id: version.id, po_code: po.poCode },
        payload,
      );
      bump(report.collegePos, result.action);
    }
  }

  for (const pso of psos) {
    const schemeId = schemeIds.get(schemeCodeFromLabel(pso.scheme));
    const programCode = String(pso.program || pso.programCode || '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase()
      .slice(0, 32);
    const programId =
      programIds.get(`name:${pso.program}`) ||
      programIds.get(`${pso.scheme}|${programCode}`) ||
      (pso.programCode ? [...programIds.entries()].find(([k]) => k.endsWith(`|${norm(pso.programCode)}`))?.[1] : null);
    if (!schemeId || !programId) continue;
    const payload = {
      college_id: collegeId,
      scheme_id: schemeId,
      program_id: programId,
      pso_number: pso.psoNumber || Number(String(pso.psoCode).replace(/[^0-9]/g, '')) || 1,
      pso_code: pso.psoCode,
      short_title: pso.shortTitle || pso.psoTitle,
      official_statement: pso.officialStatement || pso.psoStatement,
      source: pso.sourceType || pso.source,
      status: 'ACTIVE',
      official_text_pending: false,
      is_current: true,
      version_number: 1,
    };
    const existing = await trx('program_specific_outcomes')
      .where({ college_id: collegeId, scheme_id: schemeId, program_id: programId, pso_code: pso.psoCode, is_current: true })
      .first();
    if (!existing) {
      await trx('program_specific_outcomes').insert(payload);
      report.collegePsos.inserted += 1;
    } else {
      await trx('program_specific_outcomes').where({ id: existing.id }).update({
        short_title: payload.short_title,
        official_statement: payload.official_statement,
        updated_at: trx.fn.now(),
      });
      report.collegePsos.updated += 1;
    }
  }

  const faculty = await trx('faculty_users').where({ college_id: collegeId }).orderBy('id').first();
  const actorId = faculty ? Number(faculty.id) : null;

  for (const [courseCode, courseId] of courseIds.entries()) {
    const subject = subjects.find((s) => norm(s.subjectCode) === courseCode);
    if (!subject) continue;
    const schemeId = schemeIds.get(schemeCodeFromLabel(subject.scheme));
    const programCode = String(subject.program || '')
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .toUpperCase()
      .slice(0, 32);
    const programId = programIds.get(`${subject.scheme}|${programCode}`) || null;
    const currentCos = await trx('course_outcomes').where({ college_id: collegeId, course_id: courseId, is_current: true });
    if (!currentCos.length) continue;

    const poMaps = copo.filter((m) => norm(m.subjectCode) === courseCode);
    if (poMaps.length && schemeId) {
      const framework =
        (programId &&
          (await trx('program_outcome_versions')
            .where({ college_id: collegeId, scheme_id: schemeId, program_id: programId })
            .first())) ||
        (await trx('program_outcome_versions').where({ college_id: collegeId, scheme_id: schemeId }).first());
      if (framework) {
        let version = await trx('copo_mapping_versions')
          .where({ college_id: collegeId, course_id: courseId, mapping_kind: 'PO', is_current: true })
          .whereNull('source_mapping_version_id')
          .first();
        if (!version) {
          const [vid] = await trx('copo_mapping_versions').insert({
            college_id: collegeId,
            scheme_id: schemeId,
            program_id: programId,
            course_id: courseId,
            po_framework_version_id: framework.id,
            mapping_kind: 'PO',
            version_number: 1,
            status: 'APPROVED',
            is_current: true,
            created_by: actorId,
            updated_by: actorId,
          });
          version = { id: vid };
        }
        const posRows = await trx('program_outcomes').where({ framework_version_id: framework.id, status: 'ACTIVE' });
        for (const mapping of poMaps) {
          const coRow = currentCos.find((c) => String(c.co_code).toUpperCase() === String(mapping.coCode).toUpperCase());
          const poRow = posRows.find((p) => String(p.po_code).toUpperCase() === String(mapping.poCode).toUpperCase());
          if (!coRow || !poRow) continue;
          const existing = await trx('copo_mapping_items')
            .where({ mapping_version_id: version.id, course_outcome_id: coRow.id, program_outcome_id: poRow.id })
            .first();
          const payload = {
            college_id: collegeId,
            mapping_version_id: version.id,
            course_id: courseId,
            course_outcome_id: coRow.id,
            program_outcome_id: poRow.id,
            correlation_strength: mapping.strength,
            justification: mapping.justification,
            created_by: actorId,
            updated_by: actorId,
          };
          if (!existing) {
            await trx('copo_mapping_items').insert(payload);
            report.collegeCopo.inserted += 1;
          } else {
            await trx('copo_mapping_items').where({ id: existing.id }).update({
              correlation_strength: mapping.strength,
              justification: mapping.justification,
              updated_at: trx.fn.now(),
            });
            report.collegeCopo.updated += 1;
          }
        }
      }
    }

    const psoMaps = copso.filter((m) => norm(m.subjectCode) === courseCode);
    if (psoMaps.length && schemeId && programId) {
      let version = await trx('copo_mapping_versions')
        .where({ college_id: collegeId, course_id: courseId, mapping_kind: 'PSO', is_current: true })
        .whereNull('source_mapping_version_id')
        .first();
      if (!version) {
        const [vid] = await trx('copo_mapping_versions').insert({
          college_id: collegeId,
          scheme_id: schemeId,
          program_id: programId,
          course_id: courseId,
          mapping_kind: 'PSO',
          version_number: 1,
          status: 'APPROVED',
          is_current: true,
          created_by: actorId,
          updated_by: actorId,
        });
        version = { id: vid };
      }
      const psoRows = await trx('program_specific_outcomes').where({
        college_id: collegeId,
        scheme_id: schemeId,
        program_id: programId,
        is_current: true,
      });
      for (const mapping of psoMaps) {
        const coRow = currentCos.find((c) => String(c.co_code).toUpperCase() === String(mapping.coCode).toUpperCase());
        const psoRow = psoRows.find((p) => String(p.pso_code).toUpperCase() === String(mapping.psoCode).toUpperCase());
        if (!coRow || !psoRow) continue;
        const existing = await trx('copo_mapping_items')
          .where({ mapping_version_id: version.id, course_outcome_id: coRow.id, program_specific_outcome_id: psoRow.id })
          .first();
        if (!existing) {
          await trx('copo_mapping_items').insert({
            college_id: collegeId,
            mapping_version_id: version.id,
            course_id: courseId,
            course_outcome_id: coRow.id,
            program_specific_outcome_id: psoRow.id,
            correlation_strength: mapping.strength,
            justification: mapping.rationale,
            created_by: actorId,
            updated_by: actorId,
          });
          report.collegeCopso.inserted += 1;
        } else {
          report.collegeCopso.updated += 1;
        }
      }
    }

    const sdgMaps = cosdg.filter((m) => norm(m.subjectCode) === courseCode);
    if (sdgMaps.length) {
      let version = await trx('copo_mapping_versions')
        .where({ college_id: collegeId, course_id: courseId, mapping_kind: 'SDG', is_current: true })
        .whereNull('source_mapping_version_id')
        .first();
      if (!version) {
        const [vid] = await trx('copo_mapping_versions').insert({
          college_id: collegeId,
          scheme_id: schemeId,
          program_id: programId,
          course_id: courseId,
          mapping_kind: 'SDG',
          version_number: 1,
          status: 'APPROVED',
          is_current: true,
          created_by: actorId,
          updated_by: actorId,
        });
        version = { id: vid };
      }
      for (const mapping of sdgMaps) {
        const coRow = currentCos.find((c) => String(c.co_code).toUpperCase() === String(mapping.coCode).toUpperCase());
        const sdg = await trx('sustainable_development_goals').where({ sdg_code: mapping.sdgCode }).first();
        if (!coRow || !sdg) continue;
        const existing = await trx('copo_mapping_items')
          .where({ mapping_version_id: version.id, course_outcome_id: coRow.id, sdg_id: sdg.id })
          .first();
        if (!existing) {
          await trx('copo_mapping_items').insert({
            college_id: collegeId,
            mapping_version_id: version.id,
            course_id: courseId,
            course_outcome_id: coRow.id,
            sdg_id: sdg.id,
            correlation_strength: mapping.relevance,
            justification: mapping.rationale,
            created_by: actorId,
            updated_by: actorId,
          });
          report.collegeCosdg.inserted += 1;
        } else {
          report.collegeCosdg.updated += 1;
        }
      }
    }
  }
}

async function reconcileDuplicates(knex, report) {
  const globalGaps = await knex('gap_masters').whereNull('college_id').select('gap_id', 'id', 'course_code');
  const globalSet = new Set(globalGaps.map((g) => g.gap_id));
  const collegeGaps = await knex('gap_masters').whereNotNull('college_id').select('id', 'gap_id', 'college_id', 'course_code');
  const matched = collegeGaps.filter((g) => globalSet.has(g.gap_id));
  report.reconciledGapIds = matched.length;

  const globalCbs = await knex('cbs_masters').whereNull('college_id').select('cbs_id');
  const cbsSet = new Set(globalCbs.map((g) => g.cbs_id));
  const collegeCbs = await knex('cbs_masters').whereNotNull('college_id').select('cbs_id');
  report.reconciledCbsIds = collegeCbs.filter((g) => cbsSet.has(g.cbs_id)).length;
}

async function main() {
  if (!fs.existsSync(path.join(DATA, 'manifest.json'))) {
    throw new Error('Missing seeds/academic JSON. Run: npm run export:academic-master-json -w @skillonx/survey-api');
  }

  const report = {
    gaps: counts(),
    gapCoLinks: counts(),
    gapOutcomes: counts(),
    actions: counts(),
    gapSources: counts(),
    cbs: counts(),
    cbsCoLinks: counts(),
    cbsActions: counts(),
    cbsSources: counts(),
    sdgs: counts(),
    coEvalComponents: counts(),
    coEvalStructures: counts(),
    coEvalCourseComponents: counts(),
    coEvalSubjects: counts(),
    coEvalCos: counts(),
    collegeSchemes: counts(),
    collegePrograms: counts(),
    collegeCourses: counts(),
    collegeModules: counts(),
    collegeCos: counts(),
    collegePos: counts(),
    collegePsos: counts(),
    collegeCopo: counts(),
    collegeCopso: counts(),
    collegeCosdg: counts(),
    duplicatesDetected: 0,
    reconciledGapIds: 0,
    reconciledCbsIds: 0,
  };

  const nullable = await knex.schema.hasColumn('gap_masters', 'college_id');
  if (nullable) {
    const [cols] = await knex.raw("SHOW COLUMNS FROM gap_masters LIKE 'college_id'");
    if (cols[0] && String(cols[0].Null).toUpperCase() !== 'YES') {
      throw new Error('gap_masters.college_id is still NOT NULL. Run npm run migrate first.');
    }
  }

  const trx = await knex.transaction();
  try {
    await seedGlobalMasters(trx, report);
    if (!skipColleges) {
      const colleges = await trx('colleges').select('id', 'code', 'name');
      for (const college of colleges) {
        console.log(`Materializing catalog for ${college.code}...`);
        await materializeCollege(trx, college, report);
      }
    }
    if (dryRun) {
      await trx.rollback();
      console.log('Dry run complete — no changes committed.');
    } else {
      await trx.commit();
    }
  } catch (err) {
    await trx.rollback();
    throw err;
  }

  if (!dryRun) await reconcileDuplicates(knex, report);

  console.log('\n=== Academic master seed ===');
  console.log(JSON.stringify(report, null, 2));
  console.log(dryRun ? '\n(dry-run, rolled back)' : '\nCommitted.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await knex.destroy();
  });
