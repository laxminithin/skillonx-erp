import { db } from '../../db/index.js';
import { buildDefaultScheme, parseEvaluationScheme } from '../assignments/scheme.js';
import {
  STANDARD_IA_PATTERN,
  STANDARD_IA_PATTERN_CODE,
  buildPatternSlots,
  parseSections,
  patternLabel,
  type PaperPattern,
  type Split,
} from './pattern.js';
import { recommendModuleTargets, slotsFromBuilt, type Blueprint, type GeneratorSlot } from './generator.js';
import type { PortionModule } from './scope.js';

export async function ensureStandardPattern(collegeId: number): Promise<PaperPattern> {
  if (await db.schema.hasTable('internal_paper_pattern_templates')) {
    let row = await db('internal_paper_pattern_templates')
      .where({ college_id: collegeId, code: STANDARD_IA_PATTERN_CODE, is_active: true })
      .first();
    if (!row) {
      row = await db('internal_paper_pattern_templates')
        .where({ college_id: collegeId, is_default: true, is_active: true })
        .first();
    }
    if (!row) {
      const [id] = await db('internal_paper_pattern_templates').insert({
        college_id: collegeId,
        code: STANDARD_IA_PATTERN.code,
        name: STANDARD_IA_PATTERN.name,
        max_marks: STANDARD_IA_PATTERN.maxMarks,
        required_answer_marks: STANDARD_IA_PATTERN.requiredAnswerMarks,
        duration_minutes: STANDARD_IA_PATTERN.durationMinutes,
        sections_json: JSON.stringify(STANDARD_IA_PATTERN.sections),
        allow_or_choices: true,
        is_default: true,
        is_active: true,
      });
      row = await db('internal_paper_pattern_templates').where({ id }).first();
    }
    if (row) {
      return {
        id: Number(row.id),
        code: String(row.code),
        name: String(row.name),
        maxMarks: Number(row.max_marks),
        requiredAnswerMarks: Number(row.required_answer_marks ?? row.max_marks),
        durationMinutes: row.duration_minutes == null ? 90 : Number(row.duration_minutes),
        allowOrChoices: Boolean(row.allow_or_choices),
        isDefault: Boolean(row.is_default),
        sections: parseSections(row.sections_json),
      };
    }
  }
  return { ...STANDARD_IA_PATTERN, id: null };
}

export async function listPaperPatterns(collegeId: number): Promise<PaperPattern[]> {
  const standard = await ensureStandardPattern(collegeId);
  if (!(await db.schema.hasTable('internal_paper_pattern_templates'))) return [standard];
  const rows = await db('internal_paper_pattern_templates')
    .where({ college_id: collegeId, is_active: true })
    .orderBy('is_default', 'desc')
    .orderBy('name');
  const mapped: PaperPattern[] = rows.map((row) => ({
    id: Number(row.id),
    code: String(row.code),
    name: String(row.name),
    maxMarks: Number(row.max_marks),
    requiredAnswerMarks: Number(row.required_answer_marks ?? row.max_marks),
    durationMinutes: row.duration_minutes == null ? null : Number(row.duration_minutes),
    allowOrChoices: Boolean(row.allow_or_choices),
    isDefault: Boolean(row.is_default),
    sections: parseSections(row.sections_json),
  }));
  if (!mapped.some((p) => p.code === STANDARD_IA_PATTERN_CODE)) mapped.unshift(standard);
  return mapped;
}

export function recommendBlueprint(opts: {
  examType: string;
  pattern: PaperPattern;
  modules: PortionModule[];
  includeOr: boolean;
  splits?: Record<string, Split>;
  sourceMix: Blueprint['sourceMix'];
  previousYearWeight?: number;
  allowPreviousYearRepeats?: boolean;
  recentYearExclusion?: number;
}): { blueprint: Blueprint; moduleTargets: Blueprint['moduleTargets']; coTargets: Blueprint['coTargets'] } {
  const selected = opts.modules.filter((m) => m.selected);
  const moduleTargets = recommendModuleTargets(
    selected.map((m) => ({
      id: m.id,
      name: m.name,
      hours: m.hours,
      coveragePercent: m.coveragePercent,
      coCode: m.coCode,
    })),
    opts.pattern.requiredAnswerMarks,
  );
  const coMap = new Map<string, number>();
  for (const t of moduleTargets) {
    if (!t.coCode) continue;
    coMap.set(t.coCode, (coMap.get(t.coCode) || 0) + t.marks);
  }
  const coTargets = [...coMap.entries()].map(([coCode, marks]) => ({ coCode, marks }));

  const built = buildPatternSlots({
    pattern: opts.pattern,
    splits: opts.splits,
    includeOr: opts.includeOr && opts.pattern.allowOrChoices,
  });

  const slots: GeneratorSlot[] = [];
  for (const slot of slotsFromBuilt(built)) {
    const section = opts.pattern.sections.find((s) => s.key === slot.section);
    const idx = (section?.questionNumber || 1) - 1;
    const target = moduleTargets[Math.min(idx, Math.max(moduleTargets.length - 1, 0))] || moduleTargets[0];
    slots.push({
      ...slot,
      moduleId: target?.moduleId ?? null,
      moduleName: target?.moduleName ?? null,
      coCode: target?.coCode ?? null,
    });
  }

  const blueprint: Blueprint = {
    examType: opts.examType,
    maxMarks: opts.pattern.maxMarks,
    requiredAnswerMarks: opts.pattern.requiredAnswerMarks,
    printedMarks: built.reduce((n, s) => n + s.marks, 0),
    durationMinutes: opts.pattern.durationMinutes,
    modules: selected.map((m) => m.name),
    selectedModuleIds: selected.map((m) => m.id),
    selectedTopicIds: selected.every((m) => m.topics.every((t) => t.selected))
      ? null
      : selected.flatMap((m) => m.topics.filter((t) => t.selected).map((t) => t.id)),
    excludedTopicIds: selected.flatMap((m) => m.topics.filter((t) => !t.selected).map((t) => t.id)),
    moduleTargets,
    coTargets,
    rbtTargets: [
      { level: 'L2', marks: 20 },
      { level: 'L3', marks: 20 },
      { level: 'L4', marks: 10 },
    ],
    patternCode: opts.pattern.code,
    patternLabel: patternLabel(opts.pattern),
    slots,
    allowOrChoices: opts.includeOr && opts.pattern.allowOrChoices,
    sourceMix: opts.sourceMix,
    previousYearWeight: opts.previousYearWeight ?? 40,
    allowPreviousYearRepeats: opts.allowPreviousYearRepeats ?? false,
    recentYearExclusion: opts.recentYearExclusion ?? 1,
    modifiedFromCoEvaluation: false,
    workflowVersion: 2,
  };

  return { blueprint, moduleTargets, coTargets };
}

export function defaultIaSchemeComponents(marks: number) {
  const total = Math.max(1, Number(marks) || 10);
  if (total === 10) {
    return [
      { code: 'def', label: 'Definition', maxMarks: 2 },
      { code: 'exp', label: 'Explanation', maxMarks: 3 },
      { code: 'ex', label: 'Correct example', maxMarks: 3 },
      { code: 'diag', label: 'Diagram / representation', maxMarks: 2 },
    ];
  }
  if (total === 5) {
    return [
      { code: 'def', label: 'Definition / concept', maxMarks: 2 },
      { code: 'exp', label: 'Explanation / example', maxMarks: 3 },
    ];
  }
  const built = buildDefaultScheme('DESCRIPTIVE', total);
  return built.criteria.map((c) => ({ code: c.id, label: c.label, maxMarks: c.maxMarks }));
}

export function schemeFromBankRubric(raw: unknown, marks: number) {
  const parsed = parseEvaluationScheme(raw);
  if (!parsed?.criteria.length) return null;
  const total = parsed.criteria.reduce((n, c) => n + Number(c.maxMarks || 0), 0);
  if (Math.abs(total - marks) > 0.05) {
    const scale = marks / Math.max(total, 0.01);
    const scaled = parsed.criteria.map((c) => ({
      code: c.id,
      label: c.label,
      maxMarks: Math.round(c.maxMarks * scale * 100) / 100,
    }));
    const sum = scaled.reduce((n, c) => n + c.maxMarks, 0);
    if (scaled.length) scaled[scaled.length - 1].maxMarks = Math.round((scaled[scaled.length - 1].maxMarks + (marks - sum)) * 100) / 100;
    return scaled;
  }
  return parsed.criteria.map((c) => ({ code: c.id, label: c.label, maxMarks: c.maxMarks }));
}
