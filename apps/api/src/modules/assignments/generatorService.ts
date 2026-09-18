import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import {
  ASSIGNMENT_SELECTABLE_STATUSES,
  GENERATOR_PRESETS,
  type AssignmentDifficulty,
} from '../../types/assignment.js';
import {
  criteriaFromPreset,
  pickReplacement,
  selectQuestions,
  type GeneratorDistribution,
  type GeneratorPoolItem,
} from './generator.js';
import { addFromBank, createAssignment, deleteQuestion, getAssignment, assignmentMetaSchema } from './service.js';

export const generateAssignmentSchema = assignmentMetaSchema
  .extend({
    courseId: z.number().int().positive(),
    moduleIds: z.array(z.number().int().positive()).min(1),
    preset: z.enum(GENERATOR_PRESETS).optional().default('CUSTOM'),
    easyCount: z.number().int().min(0).max(200).optional(),
    intermediateCount: z.number().int().min(0).max(200).optional(),
    difficultCount: z.number().int().min(0).max(200).optional(),
    distribution: z.enum(['BALANCED', 'RANDOM']).optional().default('BALANCED'),
    title: z.string().min(1).max(255).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.preset === 'CUSTOM') {
      const total = (v.easyCount ?? 0) + (v.intermediateCount ?? 0) + (v.difficultCount ?? 0);
      if (total < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Select at least one question for CUSTOM preset',
        });
      }
    }
  });

export type GenerateAssignmentInput = z.output<typeof generateAssignmentSchema>;

export type StoredGeneration = {
  mode: 'GENERATED';
  preset?: string;
  courseId: number;
  moduleIds: number[];
  easyCount: number;
  intermediateCount: number;
  difficultCount: number;
  distribution: GeneratorDistribution;
  manuallyReplacedBankIds: number[];
};

function parseGeneration(value: unknown): StoredGeneration | null {
  const raw =
    typeof value === 'string'
      ? (() => {
          try {
            return JSON.parse(value);
          } catch {
            return null;
          }
        })()
      : value;
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as StoredGeneration;
  if (obj.mode !== 'GENERATED') return null;
  return obj;
}

async function loadPool(
  collegeId: number,
  courseId: number,
  moduleIds: number[],
): Promise<GeneratorPoolItem[]> {
  const rows = await db('assignment_bank_questions')
    .where({ college_id: collegeId, course_id: courseId, is_active: true })
    .whereIn('module_id', moduleIds)
    .whereIn('review_status', [...ASSIGNMENT_SELECTABLE_STATUSES])
    .select(
      'id',
      'course_id as courseId',
      'module_id as moduleId',
      'difficulty',
      'normalized_text as fingerprint',
      'review_status as reviewStatus',
    );
  return rows.map((r) => ({
    id: Number(r.id),
    courseId: Number(r.courseId),
    moduleId: Number(r.moduleId),
    difficulty: r.difficulty as AssignmentDifficulty | null,
    fingerprint: String(r.fingerprint || `id:${r.id}`),
    reviewStatus: String(r.reviewStatus),
  }));
}

async function defaultTitle(courseId: number, moduleIds: number[]) {
  const course = await db('courses').where({ id: courseId }).first();
  const modules = await db('subject_modules').whereIn('id', moduleIds).orderBy('sort_order');
  const labels = modules.map((m) => {
    const match = String(m.name).match(/\b(Module|Unit)\s+(\d+)/i);
    return match ? `${match[1]} ${match[2]}` : m.name;
  });
  const subject = course?.name ?? 'Assignment';
  if (!labels.length) return `${subject} Assignment`;
  return `${subject} — ${labels.join(' & ')} Assignment`;
}

export async function generateAssignment(
  collegeId: number,
  createdBy: number,
  input: GenerateAssignmentInput,
) {
  const course = await db('courses').where({ id: input.courseId, college_id: collegeId }).first();
  if (!course) throw new AppError(404, 'Subject not found');
  for (const moduleId of input.moduleIds) {
    const mod = await db('subject_modules')
      .where({ id: moduleId, course_id: input.courseId, college_id: collegeId })
      .first();
    if (!mod) throw new AppError(400, `Module ${moduleId} is not part of the selected subject`);
  }

  const criteria = criteriaFromPreset({
    courseId: input.courseId,
    moduleIds: input.moduleIds,
    preset: input.preset,
    distribution: input.distribution,
    easyCount: input.easyCount,
    intermediateCount: input.intermediateCount,
    difficultCount: input.difficultCount,
  });
  const pool = await loadPool(collegeId, input.courseId, input.moduleIds);
  const selection = selectQuestions(pool, criteria);
  const title = input.title?.trim() || (await defaultTitle(input.courseId, input.moduleIds));
  const generation: StoredGeneration = {
    mode: 'GENERATED',
    preset: input.preset,
    courseId: input.courseId,
    moduleIds: input.moduleIds,
    easyCount: criteria.easyCount,
    intermediateCount: criteria.intermediateCount,
    difficultCount: criteria.difficultCount,
    distribution: input.distribution,
    manuallyReplacedBankIds: [],
  };

  const assignment = await createAssignment(collegeId, createdBy, {
    title,
    description: input.description ?? null,
    instructions: input.instructions ?? null,
    assignmentNumber: input.assignmentNumber ?? null,
    courseId: input.courseId,
    moduleId: input.moduleIds.length === 1 ? input.moduleIds[0] : null,
    programId: input.programId ?? null,
    academicYearId: input.academicYearId ?? null,
    semesterId: input.semesterId ?? null,
    departmentId: input.departmentId ?? null,
    classSectionId: input.classSectionId ?? null,
    startAt: input.startAt ?? null,
    dueAt: input.dueAt ?? null,
    lateSubmissionAllowed: input.lateSubmissionAllowed ?? false,
    lateDeadlineAt: input.lateDeadlineAt ?? null,
    attemptsAllowed: input.attemptsAllowed ?? 1,
    showMarksImmediately: input.showMarksImmediately ?? false,
    showFeedbackAfterEvaluation: input.showFeedbackAfterEvaluation ?? true,
    passPercentage: input.passPercentage ?? 40,
    solutionReleasePolicy: input.solutionReleasePolicy,
  });

  await addFromBank(Number(assignment.id), collegeId, selection.selectedIds);
  await db('assignments')
    .where({ id: assignment.id })
    .update({ random_selection: JSON.stringify(generation) });

  return getAssignment(Number(assignment.id), collegeId);
}

export async function replaceAssignmentQuestion(
  assignmentId: number,
  collegeId: number,
  questionId: number,
) {
  const assignment = await getAssignment(assignmentId, collegeId);
  if (assignment.structureLocked) {
    throw new AppError(400, 'Assignment structure is locked');
  }
  const current = assignment.questions.find((q) => Number(q.id) === questionId);
  if (!current) throw new AppError(404, 'Question not found');
  const stored = parseGeneration(assignment.randomSelection) ?? {
    mode: 'GENERATED' as const,
    courseId: Number(assignment.courseId),
    moduleIds: [
      ...new Set(
        assignment.questions.map((q) => Number(q.moduleId)).filter((id) => Number.isFinite(id)),
      ),
    ],
    easyCount: 0,
    intermediateCount: 0,
    difficultCount: 0,
    distribution: 'BALANCED' as const,
    manuallyReplacedBankIds: [],
  };
  if (!stored.courseId) throw new AppError(400, 'Assignment has no subject for replacement');
  if (!current.difficulty) throw new AppError(400, 'This question has no difficulty to preserve');

  const usedBankIds = assignment.questions
    .map((q) => Number(q.bankQuestionId))
    .filter((id) => Number.isFinite(id));
  const pool = await loadPool(
    collegeId,
    stored.courseId,
    stored.moduleIds.length ? stored.moduleIds : [Number(current.moduleId)],
  );
  const picked = pickReplacement(pool, {
    courseId: stored.courseId,
    moduleIds: stored.moduleIds.length ? stored.moduleIds : [Number(current.moduleId)],
    difficulty: current.difficulty as AssignmentDifficulty,
    excludeIds: usedBankIds,
    preferredModuleId: current.moduleId ? Number(current.moduleId) : null,
  });
  if (!picked) throw new AppError(400, 'No unused question of the same difficulty is available');

  await deleteQuestion(assignmentId, collegeId, questionId);
  await addFromBank(assignmentId, collegeId, [picked.id]);
  stored.manuallyReplacedBankIds = [...(stored.manuallyReplacedBankIds || []), picked.id];
  await db('assignments')
    .where({ id: assignmentId })
    .update({ random_selection: JSON.stringify(stored) });
  return getAssignment(assignmentId, collegeId);
}
