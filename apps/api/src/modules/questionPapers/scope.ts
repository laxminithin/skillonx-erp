import { db } from '../../db/index.js';
import { catalogSubject } from '../lessonPlans/service.js';
import { computePlanProgress, type ProgressEntry } from '../lessonPlans/progress.js';
import { moduleNumberFromName, type Blueprint } from './generator.js';

export type PortionTopic = {
  id: number;
  name: string;
  selected: boolean;
  hours: number;
};

export type PortionModule = {
  id: number;
  name: string;
  unitKind: string;
  sortOrder: number;
  selected: boolean;
  coveragePercent: number;
  completed: boolean;
  hours: number;
  completedHours: number;
  coCode: string | null;
  topics: PortionTopic[];
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function inferModuleCo(
  moduleName: string,
  sortOrder: number,
  cos: Array<{ code: string; number?: number }>,
) {
  const n = moduleNumberFromName(moduleName) ?? sortOrder + 1;
  const exact = cos.find((c) => c.number === n) || cos.find((c) => /CO\s*0*(\d+)/i.test(c.code) && Number(RegExp.$1) === n);
  return exact?.code ?? null;
}

export async function loadPortions(opts: {
  collegeId: number;
  courseId: number;
  facultyUserId: number;
  academicYearId?: number | null;
  selectedModuleIds?: number[];
  selectedTopicIds?: number[] | null;
}) {
  const subject = await catalogSubject(opts.collegeId, opts.courseId);
  const cos = await db('course_outcomes')
    .where({ college_id: opts.collegeId, course_id: opts.courseId, is_current: true })
    .select('co_code', 'co_number', 'statement');
  const mappedCos = cos.map((c) => ({
    code: String(c.co_code).toUpperCase(),
    number: c.co_number != null ? Number(c.co_number) : Number(String(c.co_code).replace(/\D/g, '')) || undefined,
  }));

  let plan = await db('faculty_lesson_plans')
    .where({ college_id: opts.collegeId, course_id: opts.courseId, created_by: opts.facultyUserId })
    .modify((q) => {
      if (opts.academicYearId) q.andWhere((b) => b.where('academic_year_id', opts.academicYearId).orWhereNull('academic_year_id'));
    })
    .orderByRaw("case when status in ('ACTIVE','FINALIZED') then 0 else 1 end")
    .orderBy('updated_at', 'desc')
    .first();
  if (!plan) {
    plan = await db('faculty_lesson_plans')
      .where({ college_id: opts.collegeId, course_id: opts.courseId })
      .orderBy('updated_at', 'desc')
      .first();
  }

  let progressByModule = new Map<number, { percent: number; completedHours: number; totalHours: number }>();
  let topicCoverage = new Map<number, { total: number; completed: number }>();
  if (plan) {
    const entries = await db('lesson_plan_entries').where({ plan_id: plan.id }).select(
      'status',
      'planned_date',
      'actual_date',
      'planned_hours',
      'actual_hours',
      'module_id',
      'module_label',
      'module_name',
      'topic_id',
    );
    const progress = computePlanProgress(
      entries.map(
        (e): ProgressEntry => ({
          status: String(e.status),
          plannedDate: e.planned_date ? String(e.planned_date).slice(0, 10) : null,
          actualDate: e.actual_date ? String(e.actual_date).slice(0, 10) : null,
          plannedHours: Number(e.planned_hours || 0),
          actualHours: e.actual_hours == null ? null : Number(e.actual_hours),
          moduleId: e.module_id ? Number(e.module_id) : null,
          moduleLabel: e.module_label,
          moduleName: e.module_name,
        }),
      ),
      todayISO(),
    );
    for (const m of progress.modules) {
      if (m.moduleId) progressByModule.set(m.moduleId, {
        percent: m.percent,
        completedHours: m.completedHours,
        totalHours: m.totalHours,
      });
    }
    for (const e of entries) {
      if (!e.topic_id) continue;
      const cur = topicCoverage.get(Number(e.topic_id)) ?? { total: 0, completed: 0 };
      cur.total += 1;
      if (String(e.status) === 'COMPLETED') cur.completed += 1;
      topicCoverage.set(Number(e.topic_id), cur);
    }
  }

  const selectedModuleIds = opts.selectedModuleIds ?? [];
  const selectedTopicIds = opts.selectedTopicIds;

  const modules: PortionModule[] = subject.modules.map((m) => {
    const cov = progressByModule.get(m.id);
    const selected = selectedModuleIds.length ? selectedModuleIds.includes(m.id) : false;
    return {
      id: m.id,
      name: m.name,
      unitKind: m.unitKind,
      sortOrder: m.sortOrder,
      selected,
      coveragePercent: cov?.percent ?? 0,
      completed: (cov?.percent ?? 0) >= 99.5,
      hours: m.hours,
      completedHours: cov?.completedHours ?? 0,
      coCode: inferModuleCo(m.name, m.sortOrder, mappedCos),
      topics: m.topics.map((t) => {
        const tc = topicCoverage.get(t.id);
        const topicSelected =
          selectedTopicIds == null
            ? selected
            : selected && selectedTopicIds.includes(t.id);
        return {
          id: t.id,
          name: t.name,
          selected: topicSelected,
          hours: t.subtopics.reduce((n, s) => n + Number(s.hours || 0), 0),
          coveragePercent: tc && tc.total ? Math.round((tc.completed / tc.total) * 1000) / 10 : selected ? 0 : 0,
        };
      }),
    };
  });

  const selected = modules.filter((m) => m.selected);
  const incomplete = selected.filter((m) => !m.completed);
  const incompleteTopics = selected.flatMap((m) =>
    m.topics.filter((t) => t.selected && (topicCoverage.get(t.id)?.completed || 0) < (topicCoverage.get(t.id)?.total || 1)),
  );

  return {
    modules,
    lessonPlanId: plan ? Number(plan.id) : null,
    coverageWarning: incomplete.length > 0 || incompleteTopics.length > 0,
    coverageWarningMessage:
      incomplete.length || incompleteTopics.length
        ? 'Some selected portions are not yet marked as delivered in the Lesson Plan.'
        : null,
    incompleteModules: incomplete.map((m) => ({
      id: m.id,
      name: m.name,
      coveragePercent: m.coveragePercent,
    })),
  };
}

export function scopeFromPortions(modules: PortionModule[]) {
  const selected = modules.filter((m) => m.selected);
  const topics = selected.flatMap((m) => m.topics.filter((t) => t.selected));
  const excluded = selected.flatMap((m) => m.topics.filter((t) => !t.selected));
  return {
    selectedModuleIds: selected.map((m) => m.id),
    selectedModuleNames: selected.map((m) => m.name),
    selectedTopicIds: topics.map((t) => t.id),
    excludedTopicIds: excluded.map((t) => t.id),
    allTopicsIncluded: excluded.length === 0,
  };
}

export function applyScopeToBlueprint(blueprint: Blueprint, scope: ReturnType<typeof scopeFromPortions>): Blueprint {
  return {
    ...blueprint,
    modules: scope.selectedModuleNames,
    selectedModuleIds: scope.selectedModuleIds,
    selectedTopicIds: scope.allTopicsIncluded ? null : scope.selectedTopicIds,
    excludedTopicIds: scope.excludedTopicIds,
  };
}
