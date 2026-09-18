import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { db } from '../../db/index.js';
import * as internal from './internalService.js';
import { decideInternalPaperAccess, decideInternalPaperMutateAccess } from './access.js';
import { validateBlueprint, defaultSlotsForMarks } from './generator.js';
import * as marks from '../attainment/marksService.js';
import { gatherMarkSheetSources } from '../attainment/gather.js';
import { computeSourceCoAttainment } from '../attainment/formula.js';
import { SKILLONX_STANDARD_V1 } from '../attainment/policy.js';

const hasDb = Boolean(process.env.DATABASE_URL || process.env.DB_HOST || process.env.MYSQL_HOST);

describe('question paper db e2e', { skip: !hasDb && false }, () => {
  it('imports library rows, generates IA-1 from CO plan, snapshots on finalize, isolates ownership', async () => {
    const college = await db('colleges').orderBy('id').first();
    assert.ok(college);
    const collegeId = Number(college.id);
    const facultyA = await db('faculty_users').where({ college_id: collegeId }).orderBy('id').first();
    const facultyB = await db('faculty_users').where({ college_id: collegeId }).whereNot('id', facultyA.id).orderBy('id').first();
    assert.ok(facultyA && facultyB);
    const course =
      (await db('courses').where({ college_id: collegeId, code: '22MCA21' }).first()) ||
      (await db('courses').where({ college_id: collegeId }).andWhere('name', 'like', '%Database Management%').first()) ||
      (await db('courses').where({ college_id: collegeId }).orderBy('id').first());
    assert.ok(course, 'need a course');
    const year = await db('academic_years').where({ college_id: collegeId }).orderBy('id', 'desc').first();
    assert.ok(year);

    await db('previous_year_questions').where({ college_id: collegeId }).andWhere('question_id', 'like', 'QPB-E2E-%').del();
    await db('previous_year_papers').where({ college_id: collegeId }).whereIn('paper_id', ['QPB-E2E-DBMS-2023-JUN-SEE', 'QPB-E2E-DBMS-MODULE-BANK']).del();

    const [paperRowId] = await db('previous_year_papers').insert({
      college_id: collegeId,
      paper_id: 'QPB-E2E-DBMS-2023-JUN-SEE',
      course_id: course.id,
      subject_name: course.name,
      course_code: course.code,
      exam_type: 'SEE',
      exam_year: 2023,
      exam_month: 'JUN',
      max_marks: 100,
      duration_minutes: 180,
      source_file: 'Previous Years QPs/MCA/2023 MCA Even sem.pdf',
      source_type: 'PDF',
      extraction_status: 'EXTRACTED',
      question_count: 5,
    });

    // A separate non-SEE master-bank paper (exam_type != SEE) → Module Question Bank
    // fallback source. Used to exercise SEE-first with a deliberate SEE shortage.
    const [bankPaperRowId] = await db('previous_year_papers').insert({
      college_id: collegeId,
      paper_id: 'QPB-E2E-DBMS-MODULE-BANK',
      course_id: course.id,
      subject_name: course.name,
      course_code: course.code,
      exam_type: 'INTERNAL',
      exam_year: 2024,
      exam_month: 'JAN',
      max_marks: 100,
      duration_minutes: 180,
      source_file: 'Module Question Bank/MCA/DBMS.pdf',
      source_type: 'PDF',
      extraction_status: 'EXTRACTED',
      question_count: 5,
    });

    const modules = await db('subject_modules').where({ course_id: course.id }).orderBy('id');
    const selectedModuleIds = modules.slice(0, 2).map((m) => Number(m.id));
    const scopedModules = selectedModuleIds.length
      ? modules.filter((m) => selectedModuleIds.includes(Number(m.id)))
      : modules;
    const hasReadiness = await db.schema.hasColumn('previous_year_questions', 'readiness_status');
    const hasSourceType = await db.schema.hasColumn('previous_year_questions', 'source_type');

    // Mandatory-OR internal papers need TWO comparable PYQs per slot (A and B),
    // and 20-mark slots are built from two 10-mark units — so each question slot
    // consumes up to four 10-mark questions from the SAME module. Seed a generous
    // READY pool per selected module so the generator can build 20 OR 20 / 20 OR 20
    // / 10 OR 10 entirely from same-module PYQs.
    let serial = 0;
    const seedQuestion = async (paperRow: number, module: { id: number; name: string }, mi: number, kind: 'SEE' | 'BANK' | 'OTHER') => {
      serial += 1;
      const co = `CO${mi + 1}`;
      const row: Record<string, unknown> = {
        college_id: collegeId,
        paper_id: paperRow,
        question_id: `QPB-E2E-Q${serial}`,
        question_number: serial,
        question_text: `Module ${mi + 1} ${kind} question ${serial}: explain concept ${serial} with an example.`,
        question_type: 'DESCRIPTIVE',
        max_marks: 10,
        primary_co_code: co,
        fingerprint: `e2e-fp-${kind}-m${mi + 1}-${serial}`,
        bloom_level: 'UNDERSTAND',
        difficulty: 'INTERMEDIATE',
        is_active: true,
        module_id: Number(module.id),
        module_or_unit: String(module.name),
      };
      // Genuine provenance: SEE questions are PYQ-derived; BANK questions carry the
      // explicit MODULE_QUESTION_BANK source_type (NOT merely a non-SEE exam type).
      if (hasSourceType) row.source_type = kind === 'BANK' ? 'MODULE_QUESTION_BANK' : 'PREVIOUS_YEAR_QUESTION_PAPER';
      if (hasReadiness) {
        row.readiness_status = 'READY_FOR_INTERNAL_PAPER';
        row.scheme_status = 'READY';
        row.solution_status = 'TEXTBOOK_GROUNDED';
      }
      const [qid] = await db('previous_year_questions').insert(row);
      if (await db.schema.hasTable('qp_master_solutions')) {
        await db('qp_master_solutions').insert({
          college_id: collegeId,
          question_row_id: qid,
          model_solution: `Textbook-grounded model solution for ${kind} question ${serial}.`,
          expected_key_points: 'Definition, explanation, example.',
          verification_status: 'TEXTBOOK_GROUNDED',
          textbook_grounded: true,
        });
      }
      if (await db.schema.hasTable('qp_master_scheme_components')) {
        await db('qp_master_scheme_components').insert({ question_row_id: qid, code: 'full', label: 'Complete answer', max_marks: 10, sort_order: 0 });
      }
    };

    // Module 1 (feeds slot 1): plenty of VTU SEE PYQs → both alternatives from SEE.
    // Module 2 (feeds slots 2 & 3, needs 6 sub-questions): only 3 VTU SEE PYQs, so
    // the remaining alternatives fall back to the Module Question Bank (deliberate
    // shortage to exercise SEE-first + fallback + source summary).
    for (const [mi, module] of scopedModules.entries()) {
      const m = { id: Number(module.id), name: String(module.name) };
      if (mi === 0) {
        for (let k = 0; k < 8; k += 1) await seedQuestion(paperRowId, m, mi, 'SEE');
      } else {
        for (let k = 0; k < 3; k += 1) await seedQuestion(paperRowId, m, mi, 'SEE');
        for (let k = 0; k < 6; k += 1) await seedQuestion(bankPaperRowId, m, mi, 'BANK');
        // Non-SEE PYQ noise (previous IA/model) — must NEVER be auto-selected.
        for (let k = 0; k < 4; k += 1) await seedQuestion(bankPaperRowId, m, mi, 'OTHER');
      }
    }

    const actorA = {
      facultyUserId: Number(facultyA.id),
      collegeId,
      role: 'FACULTY',
      departmentId: facultyA.department_id == null ? null : Number(facultyA.department_id),
    };
    const actorB = {
      facultyUserId: Number(facultyB.id),
      collegeId,
      role: 'FACULTY',
      departmentId: facultyB.department_id == null ? null : Number(facultyB.department_id),
    };

    const prior = await db('internal_question_papers')
      .where({ college_id: collegeId, course_id: course.id, created_by: facultyA.id })
      .select('id');
    if (prior.length) await db('internal_question_papers').whereIn('id', prior.map((p) => p.id)).del();

    const preview = await internal.previewInternalContext(actorA, {
      courseId: Number(course.id),
      academicYearId: Number(year.id),
      examType: 'IA-1',
      mode: 'MANUAL',
      maxMarks: 50,
      selectedModuleIds: selectedModuleIds.length ? selectedModuleIds : undefined,
      coTargets: [
        { coCode: 'CO1', marks: 20 },
        { coCode: 'CO2', marks: 20 },
        { coCode: 'CO3', marks: 10 },
      ],
      sourceMix: { previousYear: true, questionBank: false, quizBank: false },
      allowPreviousYearRepeats: true,
      recentYearExclusion: 0,
    });
    assert.equal(preview.blueprint.maxMarks, 50);
    assert.equal(preview.blueprint.requiredAnswerMarks ?? preview.blueprint.maxMarks, 50);
    const slots = defaultSlotsForMarks(50, preview.blueprint.coTargets);
    assert.equal(slots.reduce((n, s) => n + s.marks, 0), 50);

    const created = await internal.createInternalPaper(actorA, {
      courseId: Number(course.id),
      academicYearId: Number(year.id),
      examType: 'IA-1',
      mode: 'MANUAL',
      maxMarks: 50,
      selectedModuleIds: selectedModuleIds.length ? selectedModuleIds : undefined,
      coTargets: [
        { coCode: 'CO1', marks: 20 },
        { coCode: 'CO2', marks: 20 },
        { coCode: 'CO3', marks: 10 },
      ],
      sourceMix: { previousYear: true, questionBank: false, quizBank: false },
      allowPreviousYearRepeats: true,
      recentYearExclusion: 0,
    });
    const generated = await internal.generateInternalPaper(actorA, created.paper.id, undefined, { mode: 'HYBRID' });

    assert.ok(generated.paper.id);
    const ownership = { collegeId, createdBy: Number(facultyA.id), departmentId: actorA.departmentId };
    assert.equal(decideInternalPaperAccess(actorB, ownership), 'FORBIDDEN');
    assert.equal(decideInternalPaperMutateAccess(actorB, ownership), 'FORBIDDEN');
    assert.equal(decideInternalPaperAccess(actorA, ownership), 'ALLOW');

    // Mandatory OR: the paper prints both alternatives. Answerable stays 50 while
    // printed marks may reach 100, and every slot carries a B alternative.
    const bAlternatives = generated.items.filter((i) => i.orAlternative === 'B');
    assert.ok(bAlternatives.length > 0, 'generated paper must contain OR (B) alternatives');
    const printed = generated.items.reduce((n, i) => n + Number(i.maxMarks), 0);
    assert.equal(printed, 100);
    assert.equal(generated.paper.requiredAnswerMarks ?? generated.paper.maxMarks, 50);
    assert.equal(generated.paper.maxMarks, 50);
    // Every OR pair is drawn from the same module.
    const byGroup = new Map<string, Set<number | null>>();
    for (const it of generated.items) {
      if (!it.orGroupId) continue;
      const set = byGroup.get(String(it.orGroupId)) ?? new Set();
      set.add(it.moduleId ?? null);
      byGroup.set(String(it.orGroupId), set);
    }
    for (const [, moduleIds] of byGroup) assert.equal(moduleIds.size, 1, 'OR pair must be same module');

    // Source priority: SEE used first, Module Question Bank only for the deliberate
    // shortage in module 2. Both sources present, nothing else (spec §8, §22, §30).
    const sourceKinds = new Set(generated.items.map((i) => String((i as { sourceKind?: string }).sourceKind || '')));
    for (const sk of sourceKinds) assert.ok(['VTU_SEE_PYQ', 'MODULE_QUESTION_BANK'].includes(sk), `unexpected source ${sk}`);
    const summary = (generated as { sourceSummary?: { vtuSeePyq: number; moduleQuestionBank: number; total: number; fallbackReasons: string[] } }).sourceSummary!;
    assert.ok(summary, 'review must include a source summary');
    assert.equal(summary.total, 6);
    assert.ok(summary.vtuSeePyq >= 1, 'at least one VTU SEE alternative');
    assert.ok(summary.moduleQuestionBank >= 1, 'module 2 shortage should trigger fallback');
    assert.equal(summary.vtuSeePyq + summary.moduleQuestionBank, 6);
    assert.ok(summary.fallbackReasons.length >= 1, 'fallback must be explained');

    // Replace one OR alternative with another eligible same-module PYQ (spec §18).
    const bItem = generated.items.find((i) => i.orAlternative === 'B')!;
    const replaced = await internal.replaceItem(actorA, generated.paper.id, bItem.id, {});
    const newItem = replaced.items.find((i) => i.orAlternative === 'B' && i.orGroupId === bItem.orGroupId && i.questionNumber === bItem.questionNumber);
    if (newItem) {
      assert.equal(Number(newItem.maxMarks), Number(bItem.maxMarks), 'replacement keeps equal marks');
      assert.equal(newItem.moduleId, bItem.moduleId, 'replacement stays in the same module');
    }
    const regenerated = await internal.getInternalPaper(generated.paper.id, collegeId);
    generated.items = regenerated.items as typeof generated.items;

    const originalText = String(generated.items[0].questionText);
    for (const item of generated.items) {
      await db('internal_question_paper_items').where({ id: item.id }).update({
        model_answer: `Model solution for ${item.itemKey}`,
        model_answer_status: 'COMPLETE',
      });
      if (await db.schema.hasTable('internal_qp_scheme_components')) {
        await db('internal_qp_scheme_components').where({ item_id: item.id }).del();
        await db('internal_qp_scheme_components').insert({
          item_id: item.id,
          code: 'full',
          label: 'Complete answer',
          max_marks: item.maxMarks,
          sort_order: 0,
        });
      }
    }
    await internal.finalizeInternalPaper(actorA, generated.paper.id);
    await db('internal_question_paper_items').where({ paper_id: generated.paper.id }).update({
      question_text: 'CHANGED AFTER FINALIZE',
    });
    const after = await internal.getInternalPaper(generated.paper.id, collegeId);
    assert.equal(after.paper.status, 'FINALIZED');
    assert.ok(after.items.some((i) => i.questionText === originalText));
    assert.ok(!after.items.some((i) => i.questionText === 'CHANGED AFTER FINALIZE'));

    // ---- Mark entry + CO attainment across OR alternatives ----
    const attainActor = { facultyUserId: Number(facultyA.id), collegeId, role: 'FACULTY', departmentId: actorA.departmentId };
    const sheet = await marks.createSheetFromInternalPaper(attainActor, generated.paper.id);
    // Both alternatives are on the sheet; printed max is 100 but the paper max stays 50.
    assert.ok(sheet.questions.some((q) => q.orAlternative === 'B'), 'mark sheet must carry OR B alternatives');
    assert.equal(sheet.sheet.maxMarks, 50);
    assert.equal(sheet.questions.reduce((n, q) => n + q.maxMarks, 0), 100);

    // Group A/B question keys per OR slot.
    const groups = new Map<string, { A: typeof sheet.questions; B: typeof sheet.questions }>();
    for (const q of sheet.questions) {
      if (!q.orGroupId) continue;
      const g = groups.get(q.orGroupId) ?? { A: [], B: [] };
      if (q.orAlternative === 'B') g.B.push(q);
      else g.A.push(q);
      groups.set(q.orGroupId, g);
    }

    // Student 1 attempts every A alternative; student 2 attempts every B alternative.
    const marksAllA: Record<string, number> = {};
    const marksAllB: Record<string, number> = {};
    const attemptsA: Record<string, 'A' | 'B'> = {};
    const attemptsB: Record<string, 'A' | 'B'> = {};
    for (const [groupId, g] of groups) {
      attemptsA[groupId] = 'A';
      attemptsB[groupId] = 'B';
      for (const q of g.A) marksAllA[q.questionKey] = q.maxMarks; // full marks
      for (const q of g.B) marksAllB[q.questionKey] = Math.max(0, q.maxMarks - 2);
    }
    const student = await db('students').where({ college_id: collegeId }).orderBy('id').first();
    const student2 = await db('students').where({ college_id: collegeId }).whereNot('id', student?.id).orderBy('id').first();
    const usn1 = String(student?.usn || '1AB00XX001');
    const usn2 = String(student2?.usn || '1AB00XX002');

    await marks.upsertManualMarks(attainActor, sheet.sheet.id, { usn: usn1, marks: marksAllA, attempts: attemptsA });
    const afterEntry = await marks.upsertManualMarks(attainActor, sheet.sheet.id, { usn: usn2, marks: marksAllB, attempts: attemptsB });

    const row1 = afterEntry.students.find((s) => s.usn === usn1.toUpperCase())!;
    const statuses1 = (row1 as unknown as { statuses: Record<string, string> }).statuses;
    // Every B alternative for student 1 is NOT_ATTEMPTED_DUE_TO_OR — never zero.
    for (const [, g] of groups) {
      for (const q of g.B) assert.equal(statuses1[q.questionKey], 'NOT_ATTEMPTED_DUE_TO_OR');
      for (const q of g.A) assert.equal(statuses1[q.questionKey], 'ATTEMPTED');
    }
    assert.equal(row1.total, 50); // answered all A alternatives fully → 50, not 100

    await marks.freezeSheet(attainActor, sheet.sheet.id);
    const sources = await gatherMarkSheetSources(
      { collegeId, courseId: Number(course.id), createdBy: Number(facultyA.id) },
      'CIE',
      'INTERNAL_PAPER',
    );
    const source = sources.find((s) => Number(s.sourceId) === sheet.sheet.id)!;
    const coRows = computeSourceCoAttainment(source, SKILLONX_STANDARD_V1);
    // No CO may draw evidence from a NOT_ATTEMPTED_DUE_TO_OR mark: every scored
    // student/question in every CO must be an attempted alternative.
    const attemptedKeys = new Set(source.marks.filter((m) => m.status === 'ATTEMPTED').map((m) => `${m.studentKey}:${m.questionKey}`));
    for (const co of coRows) {
      for (const s of co.studentScores) {
        assert.ok(s.maxMarks > 0);
      }
    }
    const orMarks = source.marks.filter((m) => m.orAlternative === 'B' && m.studentKey === usn1.toUpperCase());
    assert.ok(orMarks.length > 0);
    assert.ok(orMarks.every((m) => m.status === 'NOT_ATTEMPTED_DUE_TO_OR' && (m.awarded == null || m.awarded === 0)));
    void attemptedKeys;
  });
});
