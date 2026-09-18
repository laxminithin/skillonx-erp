import { AppError } from '../../utils/errors.js';
import { rbtFromBloom } from './rbt.js';
import type { BuiltSlot } from './pattern.js';
import { questionsNearDuplicate } from './repeatAnalysis.js';
import {
  insufficientQuestionCoverageError,
  isPyqSource,
  isReadyForInternalPaper,
} from './sourcePolicy.js';

export type GeneratorSlot = {
  key: string;
  section: string;
  questionNumber: number;
  subLetter: string | null;
  marks: number;
  moduleName?: string | null;
  moduleId?: number | null;
  topicId?: number | null;
  topicName?: string | null;
  coCode?: string | null;
  rbtLevel?: string | null;
  orGroupId?: string | null;
  isOrChoice?: boolean;
  orAlternative?: 'A' | 'B' | null;
  countsTowardRequired?: boolean;
};

export type Blueprint = {
  examType: string;
  maxMarks: number;
  requiredAnswerMarks?: number;
  printedMarks?: number;
  durationMinutes: number | null;
  modules: string[];
  selectedModuleIds?: number[];
  selectedTopicIds?: number[] | null;
  excludedTopicIds?: number[];
  moduleTargets?: Array<{ moduleId: number | null; moduleName: string; marks: number; coCode?: string | null }>;
  coTargets: Array<{ coCode: string; marks: number }>;
  rbtTargets?: Array<{ level: string; marks: number }>;
  patternCode?: string;
  patternLabel: string;
  slots: GeneratorSlot[];
  allowOrChoices: boolean;
  sourceMix: { previousYear: boolean; questionBank: boolean; quizBank: boolean };
  previousYearWeight: number;
  allowPreviousYearRepeats: boolean;
  recentYearExclusion: number;
  difficultyMix?: Partial<Record<'EASY' | 'INTERMEDIATE' | 'DIFFICULT', number>>;
  modifiedFromCoEvaluation: boolean;
  changeJustification?: string | null;
  coEvaluationId?: number | null;
  workflowVersion?: number;
};

export type PoolQuestion = {
  id: string;
  source: 'PREVIOUS_YEAR' | 'QUESTION_BANK' | 'QUIZ_BANK' | 'CUSTOM';
  sourceType?: string | null;
  sourceQuestionId: number | null;
  sourcePaperId?: string | null;
  questionText: string;
  originalQuestionText?: string | null;
  marks: number;
  moduleName: string | null;
  moduleId: number | null;
  topicId?: number | null;
  topicName?: string | null;
  coCode: string | null;
  difficulty: string | null;
  bloomLevel: string | null;
  rbtLevel?: string | null;
  fingerprint: string;
  examYear: number | null;
  examType?: string | null;
  examMonth?: string | null;
  academicYear?: string | null;
  appearanceCount: number;
  lastAppeared: string | null;
  yearsAppeared?: number[];
  examsAppeared?: string[];
  isOrChoice: boolean;
  orGroupId: string | null;
  orPairId?: string | null;
  orAlternative?: 'A' | 'B' | null;
  /** Normalized source: VTU SEE PYQ (primary), Module Question Bank (fallback), or OTHER_SOURCE (never auto-selected). */
  masterSource?: 'VTU_SEE_PYQ' | 'MODULE_QUESTION_BANK' | 'OTHER_SOURCE';
  eligible: boolean;
  verificationStatus?: string | null;
  reviewStatus?: string | null;
  readinessStatus?: string | null;
  sourceVerified?: boolean | null;
  coMappingBlocked?: boolean;
  hasScheme?: boolean;
  hasSolution?: boolean;
  needsReview?: boolean;
  textbookId?: number | null;
  textbookCitation?: string | null;
  modelSolution?: string | null;
  scheme?: Array<{ code: string; label: string; maxMarks: number }>;
  provenance?: Record<string, unknown> | null;
  canonicalQuestionId?: string | number | null;
  lastInternalUsage?: string | Date | null;
  internalUsageCount?: number;
};

export type SelectedItem = {
  slot: GeneratorSlot;
  question: PoolQuestion;
};

function yearCutoff(years: number) {
  const now = new Date().getFullYear();
  return now - Math.max(0, years);
}

export function moduleNumberFromName(name: string | null | undefined): number | null {
  if (!name) return null;
  const m = String(name).match(/module\s*[-–—]?\s*(\d+)/i) || String(name).match(/\bM\s*(\d+)\b/i);
  return m ? Number(m[1]) : null;
}

function modulesEqual(
  a: { moduleId?: number | null; moduleName?: string | null },
  b: { moduleId?: number | null; moduleName?: string | null },
): boolean {
  if (a.moduleId != null && b.moduleId != null) return a.moduleId === b.moduleId;
  const an = moduleNumberFromName(a.moduleName);
  const bn = moduleNumberFromName(b.moduleName);
  if (an != null && bn != null) return an === bn;
  if (a.moduleName && b.moduleName) {
    return a.moduleName.trim().toLowerCase() === b.moduleName.trim().toLowerCase();
  }
  return false;
}

export function inSelectedScope(q: PoolQuestion, blueprint: Blueprint): boolean {
  const moduleIds = blueprint.selectedModuleIds || [];
  const moduleNames = blueprint.modules || [];
  if (!moduleIds.length && !moduleNames.length) return true;

  if (q.topicId && blueprint.excludedTopicIds?.includes(q.topicId)) return false;
  if (q.topicId && blueprint.selectedTopicIds?.length && !blueprint.selectedTopicIds.includes(q.topicId)) {
    return false;
  }

  if (q.moduleId && moduleIds.includes(q.moduleId)) return true;
  if (q.moduleName) {
    const qn = moduleNumberFromName(q.moduleName);
    if (qn != null && moduleNames.some((n) => moduleNumberFromName(n) === qn)) return true;
    const lower = q.moduleName.trim().toLowerCase();
    if (moduleNames.some((n) => n.trim().toLowerCase() === lower)) return true;
  }
  return false;
}

/** Hard module filter for a blueprint slot — never borrow from another module. */
export function slotMatchesModule(q: PoolQuestion, slot: GeneratorSlot): boolean {
  if (!slot.moduleId && !slot.moduleName) return true;
  return modulesEqual(
    { moduleId: q.moduleId, moduleName: q.moduleName },
    { moduleId: slot.moduleId, moduleName: slot.moduleName },
  );
}

export function crossModuleMessage(label: string, moduleName: string | null | undefined) {
  const mod = moduleName || 'an unmapped module';
  return `Question ${label} belongs to ${mod} and is outside the selected Internal Assessment scope.`;
}

export function replacementModuleMismatchMessage(
  slotModule: string | null | undefined,
  questionModule: string | null | undefined,
) {
  const slot = slotModule || 'the selected module';
  const got = questionModule || 'an unmapped module';
  return `Replacement question belongs to ${got} and cannot be used in this ${slot} question slot.`;
}

export function isBlockedForFinalize(q: PoolQuestion) {
  const status = String(q.readinessStatus || q.verificationStatus || q.reviewStatus || '').toUpperCase();
  if (q.coMappingBlocked) return true;
  if (q.needsReview) return true;
  if (!isPyqSource(q.sourceType, q.source)) return true;
  if (!isReadyForInternalPaper(status) && status !== 'VERIFIED' && status !== 'APPROVED') return true;
  return false;
}

function schemeMatchesMarks(q: PoolQuestion): boolean {
  if (!q.scheme?.length) return Boolean(q.hasScheme);
  const total = q.scheme.reduce((n, c) => n + Number(c.maxMarks || 0), 0);
  return Math.abs(total - Number(q.marks || 0)) < 0.05;
}

export function eligiblePool(pool: PoolQuestion[], blueprint: Blueprint, opts?: { allowNeedsReview?: boolean }) {
  const excludeYear = blueprint.allowPreviousYearRepeats ? 0 : yearCutoff(blueprint.recentYearExclusion);
  return pool.filter((q) => {
    if (!q.eligible) return false;
    // OTHER_SOURCE (non-SEE PYQs, legacy banks, custom, AI) never participates in
    // automatic Internal Paper generation (source spec §3, §6).
    if (!isAutoSelectable(q)) return false;
    if (!isPyqSource(q.sourceType, q.source)) return false;
    // Corrected / verified SEE rows only — unverified extraction is never auto-selected.
    if (q.sourceVerified === false) return false;
    if (!isReadyForInternalPaper(q.readinessStatus || q.reviewStatus || q.verificationStatus)) {
      if (!opts?.allowNeedsReview) return false;
    }
    if (!inSelectedScope(q, blueprint)) return false;
    if (!opts?.allowNeedsReview && isBlockedForFinalize(q)) return false;
    if (!q.hasScheme || !q.hasSolution || !schemeMatchesMarks(q)) {
      if (!opts?.allowNeedsReview) return false;
    }
    if (!blueprint.allowPreviousYearRepeats && q.source === 'PREVIOUS_YEAR' && q.examYear && q.examYear > excludeYear) {
      if (blueprint.recentYearExclusion > 0 && q.examYear >= excludeYear) return false;
    }
    return true;
  });
}

/**
 * Source priority is structural (SEE pool first, Module Bank second) — not a fragile
 * score bonus. Kept for replacement ranking / back-compat diagnostics.
 */
export const SEE_SOURCE_PRIORITY_BONUS = 1000;

export function sourcePriority(q: PoolQuestion): number {
  if (q.masterSource === 'MODULE_QUESTION_BANK') return 0;
  if (q.masterSource === 'OTHER_SOURCE') return Number.NEGATIVE_INFINITY;
  return SEE_SOURCE_PRIORITY_BONUS;
}

/**
 * A candidate may be used for automatic generation only if its source is a genuine
 * VTU SEE PYQ or a genuine Module Question Bank question. OTHER_SOURCE (non-SEE
 * PYQs, legacy banks, custom, AI) is never selected automatically. Undefined
 * masterSource is treated as allowed for back-compat with directly-built pools.
 */
export function isAutoSelectable(q: PoolQuestion): boolean {
  return q.masterSource !== 'OTHER_SOURCE';
}

function isSeeTier(q: PoolQuestion): boolean {
  return q.masterSource !== 'MODULE_QUESTION_BANK';
}

function isModuleBankTier(q: PoolQuestion): boolean {
  return q.masterSource === 'MODULE_QUESTION_BANK';
}

const DIFFICULTY_ORDER = ['EASY', 'INTERMEDIATE', 'DIFFICULT'] as const;

function difficultyRank(value: string | null | undefined): number | null {
  if (!value) return null;
  const idx = DIFFICULTY_ORDER.indexOf(String(value).toUpperCase() as (typeof DIFFICULTY_ORDER)[number]);
  return idx >= 0 ? idx : null;
}

function coCompatibilityScore(preferred: string | null | undefined, actual: string | null | undefined): number {
  if (!actual) return 0;
  if (!preferred) return 2;
  if (preferred === actual) return 8;
  // Soft compatible CO (same paper slot may accept adjacent CO when syllabus supports it)
  const prefN = Number(String(preferred).replace(/\D/g, ''));
  const actN = Number(String(actual).replace(/\D/g, ''));
  if (prefN && actN && Math.abs(prefN - actN) === 1) return 3;
  return 1;
}

function rbtCompatibilityScore(preferred: string | null | undefined, actual: string | null | undefined): number {
  const pref = rbtFromBloom(preferred || null);
  const act = rbtFromBloom(actual || null);
  if (!act) return 0;
  if (!pref) return 1;
  if (pref === act) return 6;
  const diff = Math.abs(Number(pref.slice(1)) - Number(act.slice(1)));
  if (diff === 1) return 3; // L2↔L3 style compatible
  if (diff === 2) return 1;
  return -1;
}

function difficultyCompatibilityScore(preferred: string | null | undefined, actual: string | null | undefined): number {
  const a = difficultyRank(preferred);
  const b = difficultyRank(actual);
  if (b == null) return 0;
  if (a == null) return 1;
  if (a === b) return 4;
  if (Math.abs(a - b) === 1) return 1;
  return -2;
}

/** Academic ranking within a single source tier (module + marks already hard-filtered). */
export function academicScore(q: PoolQuestion, slot: GeneratorSlot, blueprint: Blueprint, partner?: PoolQuestion | null) {
  let s = 0;
  if (q.marks === slot.marks) s += 12;
  s += coCompatibilityScore(slot.coCode, q.coCode);
  if (slot.moduleId && q.moduleId === slot.moduleId) s += 8;
  if (slot.moduleName && q.moduleName && modulesEqual(q, slot)) s += 5;
  if (slot.topicId && q.topicId === slot.topicId) s += 6;
  s += rbtCompatibilityScore(slot.rbtLevel, q.rbtLevel || q.bloomLevel);
  const preferredDifficulty =
    slot.rbtLevel && Number(String(rbtFromBloom(slot.rbtLevel) || '').slice(1)) >= 4
      ? 'DIFFICULT'
      : slot.rbtLevel && Number(String(rbtFromBloom(slot.rbtLevel) || '').slice(1)) <= 2
        ? 'EASY'
        : 'INTERMEDIATE';
  s += difficultyCompatibilityScore(preferredDifficulty, q.difficulty);
  if (q.verificationStatus === 'VERIFIED' || q.reviewStatus === 'APPROVED' || isReadyForInternalPaper(q.readinessStatus || q.reviewStatus)) {
    s += 5;
  }
  if (q.sourceVerified !== false) s += 2;
  if (q.coCode) s += 2;
  if (q.hasScheme) s += 2;
  if (q.hasSolution) s += 2;
  // Prefer historically repeated VTU questions slightly, but avoid recent Internal reuse.
  if (q.appearanceCount > 1) s += Math.min(4, q.appearanceCount);
  if (q.internalUsageCount && q.internalUsageCount > 0) s -= Math.min(6, q.internalUsageCount * 2);
  if (q.lastInternalUsage) s -= 4;
  if (!blueprint.allowPreviousYearRepeats && q.appearanceCount > 1 && q.examYear && q.examYear >= new Date().getFullYear() - 1) {
    s -= 3;
  }
  if (partner) {
    const balance = orPairBalance(
      {
        marks: partner.marks,
        coCode: partner.coCode,
        difficulty: partner.difficulty,
        bloomLevel: partner.bloomLevel,
        rbtLevel: partner.rbtLevel,
        moduleId: partner.moduleId,
      },
      {
        marks: q.marks,
        coCode: q.coCode,
        difficulty: q.difficulty,
        bloomLevel: q.bloomLevel,
        rbtLevel: q.rbtLevel,
        moduleId: q.moduleId,
      },
    );
    if (balance.ok) s += 8;
    else {
      if (balance.coCompatible) s += 2;
      if (balance.rbtCompatible) s += 2;
      if (balance.difficultyCompatible) s += 2;
    }
    if (partner.orPairId && q.orPairId === partner.orPairId && q.orAlternative === 'B') s += 10;
    if (questionsNearDuplicate(partner.questionText, q.questionText)) s -= 25;
  }
  return s;
}

function slotLabelOf(slot: GeneratorSlot) {
  return `Q${slot.questionNumber}${slot.orAlternative ? `(${slot.orAlternative})` : ''}`;
}

function fitsSlotHardConstraints(
  q: PoolQuestion,
  slot: GeneratorSlot,
  partner: SelectedItem | null,
  usedIds: Set<string>,
  usedFp: Set<string>,
  usedCanonical: Set<string>,
) {
  if (usedIds.has(q.id) || usedFp.has(q.fingerprint)) return false;
  if (q.canonicalQuestionId != null && usedCanonical.has(String(q.canonicalQuestionId))) return false;
  if (!slotMatchesModule(q, slot)) return false;
  if (q.marks !== slot.marks) return false;
  if (partner) {
    if (q.marks !== partner.question.marks) return false;
    if (!modulesEqual(q, partner.question)) return false;
  }
  return true;
}

function rankTier(
  tier: PoolQuestion[],
  slot: GeneratorSlot,
  blueprint: Blueprint,
  partner: SelectedItem | null,
  usedIds: Set<string>,
  usedFp: Set<string>,
  usedCanonical: Set<string>,
  rng: () => number,
) {
  return tier
    .filter((q) => fitsSlotHardConstraints(q, slot, partner, usedIds, usedFp, usedCanonical))
    .map((q) => ({
      q,
      s: academicScore(q, slot, blueprint, partner?.question) + rng() * 0.05,
    }))
    .sort((a, b) => b.s - a.s);
}

function pickBestCandidate(
  ranked: Array<{ q: PoolQuestion; s: number }>,
  partner: SelectedItem | null,
): PoolQuestion | null {
  if (!ranked.length) return null;
  if (!partner) return ranked[0].q;

  const nonDup = ranked.filter((c) => !questionsNearDuplicate(partner.question.questionText, c.q.questionText));
  const balanced = (nonDup.length ? nonDup : ranked).filter((c) =>
    orPairBalance(
      {
        marks: partner.question.marks,
        coCode: partner.question.coCode,
        difficulty: partner.question.difficulty,
        bloomLevel: partner.question.bloomLevel,
        rbtLevel: partner.question.rbtLevel,
        moduleId: partner.question.moduleId,
      },
      {
        marks: c.q.marks,
        coCode: c.q.coCode,
        difficulty: c.q.difficulty,
        bloomLevel: c.q.bloomLevel,
        rbtLevel: c.q.rbtLevel,
        moduleId: c.q.moduleId,
      },
    ).ok,
  );
  return (balanced[0] || nonDup[0] || ranked[0]).q;
}

function countEligibleForShortage(
  pool: PoolQuestion[],
  slot: GeneratorSlot,
  partner: SelectedItem | null,
) {
  const fits = pool.filter(
    (q) =>
      slotMatchesModule(q, slot) &&
      q.marks === slot.marks &&
      (!partner || (q.marks === partner.question.marks && modulesEqual(q, partner.question))),
  );
  return {
    see: fits.filter(isSeeTier).length,
    bank: fits.filter(isModuleBankTier).length,
  };
}

/**
 * Two-tier selection: exhaust VTU SEE PYQ for the slot, then fill only the missing
 * requirement from Module Question Bank. Never soft-rank Module Bank above SEE.
 */
export function selectForBlueprint(
  pool: PoolQuestion[],
  blueprint: Blueprint,
  rng: () => number = Math.random,
  opts?: { usedFingerprints?: Iterable<string>; slots?: GeneratorSlot[]; requireFullTotal?: boolean; allowNeedsReview?: boolean },
): SelectedItem[] {
  const available = eligiblePool(pool, blueprint, { allowNeedsReview: opts?.allowNeedsReview });
  const seePool = available.filter(isSeeTier);
  const bankPool = available.filter(isModuleBankTier);
  const usedFp = new Set(opts?.usedFingerprints ?? []);
  const usedIds = new Set<string>();
  const usedCanonical = new Set<string>();
  const selected: SelectedItem[] = [];
  const slots = opts?.slots ?? blueprint.slots;

  for (const slot of slots) {
    const partner =
      slot.orAlternative === 'B' && slot.orGroupId
        ? selected.find((s) => s.slot.orGroupId === slot.orGroupId && s.slot.orAlternative === 'A') ?? null
        : null;

    const seeRanked = rankTier(seePool, slot, blueprint, partner, usedIds, usedFp, usedCanonical, rng);
    let pick = pickBestCandidate(seeRanked, partner);
    if (!pick) {
      const bankRanked = rankTier(bankPool, slot, blueprint, partner, usedIds, usedFp, usedCanonical, rng);
      pick = pickBestCandidate(bankRanked, partner);
    }

    if (!pick) {
      const counts = countEligibleForShortage(available, slot, partner);
      throw insufficientQuestionCoverageError({
        seeCandidates: counts.see,
        moduleBankCandidates: counts.bank,
        required: slot.marks,
        filledSlots: selected.length,
        missingSlots: slots.length - selected.length,
        slotLabel: slotLabelOf(slot),
        moduleName: slot.moduleName ?? null,
        moduleId: slot.moduleId ?? null,
        reason: partner
          ? `No second compatible ${slot.marks}-mark component with verified scheme/solution.`
          : `No compatible ${slot.marks}-mark component with verified scheme/solution.`,
      });
    }

    usedIds.add(pick.id);
    usedFp.add(pick.fingerprint);
    if (pick.canonicalQuestionId != null) usedCanonical.add(String(pick.canonicalQuestionId));
    selected.push({ slot, question: pick });
  }

  repairOrPairs(selected, seePool, bankPool, blueprint, usedIds, usedFp, usedCanonical, rng);

  if (opts?.requireFullTotal !== false && slots.length === blueprint.slots.length) {
    const required = blueprint.requiredAnswerMarks ?? blueprint.maxMarks;
    const total = selected
      .filter((s) => s.slot.countsTowardRequired !== false && (s.slot.orAlternative == null || s.slot.orAlternative === 'A'))
      .reduce((n, s) => n + s.slot.marks, 0);
    if (total !== required) {
      throw new AppError(422, `Generated required marks ${total} do not match configured maximum ${required}`);
    }
  }
  return selected;
}

/**
 * If an OR pair is academically weak (CO/RBT/difficulty mismatch or near-duplicate),
 * automatically search for a stronger B before presenting the paper.
 */
function repairOrPairs(
  selected: SelectedItem[],
  seePool: PoolQuestion[],
  bankPool: PoolQuestion[],
  blueprint: Blueprint,
  usedIds: Set<string>,
  usedFp: Set<string>,
  usedCanonical: Set<string>,
  rng: () => number,
) {
  const groups = new Map<string, { a: SelectedItem[]; b: SelectedItem[] }>();
  for (const item of selected) {
    if (!item.slot.orGroupId || !item.slot.orAlternative) continue;
    const g = groups.get(item.slot.orGroupId) ?? { a: [], b: [] };
    if (item.slot.orAlternative === 'B') g.b.push(item);
    else g.a.push(item);
    groups.set(item.slot.orGroupId, g);
  }

  for (const [, group] of groups) {
    if (!group.a.length || !group.b.length) continue;
    const aPrimary = group.a[0];
    const bPrimary = group.b[0];
    const balance = orPairBalance(
      {
        marks: group.a.reduce((n, s) => n + s.question.marks, 0),
        coCode: aPrimary.question.coCode,
        difficulty: aPrimary.question.difficulty,
        bloomLevel: aPrimary.question.bloomLevel,
        rbtLevel: aPrimary.question.rbtLevel,
        moduleId: aPrimary.question.moduleId,
      },
      {
        marks: group.b.reduce((n, s) => n + s.question.marks, 0),
        coCode: bPrimary.question.coCode,
        difficulty: bPrimary.question.difficulty,
        bloomLevel: bPrimary.question.bloomLevel,
        rbtLevel: bPrimary.question.rbtLevel,
        moduleId: bPrimary.question.moduleId,
      },
    );
    const nearDup = questionsNearDuplicate(aPrimary.question.questionText, bPrimary.question.questionText);
    if (balance.ok && !nearDup) continue;

    for (const bItem of group.b) {
      usedIds.delete(bItem.question.id);
      usedFp.delete(bItem.question.fingerprint);
      if (bItem.question.canonicalQuestionId != null) usedCanonical.delete(String(bItem.question.canonicalQuestionId));

      const partner: SelectedItem = { slot: aPrimary.slot, question: aPrimary.question };
      const seeRanked = rankTier(seePool, bItem.slot, blueprint, partner, usedIds, usedFp, usedCanonical, rng);
      let better = pickBestCandidate(seeRanked, partner);
      if (!better) {
        const bankRanked = rankTier(bankPool, bItem.slot, blueprint, partner, usedIds, usedFp, usedCanonical, rng);
        better = pickBestCandidate(bankRanked, partner);
      }

      const next = better || bItem.question;
      bItem.question = next;
      usedIds.add(next.id);
      usedFp.add(next.fingerprint);
      if (next.canonicalQuestionId != null) usedCanonical.add(String(next.canonicalQuestionId));
    }
  }
}

export function replacementCandidates(
  pool: PoolQuestion[],
  blueprint: Blueprint,
  current: SelectedItem,
  selected: SelectedItem[],
) {
  const usedFp = new Set(selected.map((s) => s.question.fingerprint));
  const usedIds = new Set(selected.map((s) => s.question.id));
  const usedCanonical = new Set(
    selected
      .map((s) => s.question.canonicalQuestionId)
      .filter((id): id is string | number => id != null)
      .map(String),
  );
  const available = eligiblePool(pool, blueprint).filter((q) =>
    fitsSlotHardConstraints(q, current.slot, null, usedIds, usedFp, usedCanonical),
  );
  const see = available.filter(isSeeTier).sort((a, b) => academicScore(b, current.slot, blueprint) - academicScore(a, current.slot, blueprint));
  const bank = available
    .filter(isModuleBankTier)
    .sort((a, b) => academicScore(b, current.slot, blueprint) - academicScore(a, current.slot, blueprint));
  // Structural SEE → Module Bank order for faculty Replace.
  return [...see, ...bank];
}

export function orPairBalance(
  a: {
    marks: number;
    coCode?: string | null;
    difficulty?: string | null;
    bloomLevel?: string | null;
    rbtLevel?: string | null;
    moduleId?: number | null;
    moduleName?: string | null;
  },
  b: {
    marks: number;
    coCode?: string | null;
    difficulty?: string | null;
    bloomLevel?: string | null;
    rbtLevel?: string | null;
    moduleId?: number | null;
    moduleName?: string | null;
  },
) {
  const marksBalanced = a.marks === b.marks;
  const coExact = !a.coCode || !b.coCode || a.coCode === b.coCode;
  const prefN = Number(String(a.coCode || '').replace(/\D/g, ''));
  const actN = Number(String(b.coCode || '').replace(/\D/g, ''));
  const coCompatible = coExact || (Boolean(prefN && actN) && Math.abs(prefN - actN) <= 1);
  const da = difficultyRank(a.difficulty);
  const db = difficultyRank(b.difficulty);
  const difficultyCompatible = da == null || db == null || Math.abs(da - db) <= 1;
  const rbtA = rbtFromBloom(a.rbtLevel || a.bloomLevel);
  const rbtB = rbtFromBloom(b.rbtLevel || b.bloomLevel);
  const rbtCompatible = !rbtA || !rbtB || rbtA === rbtB || Math.abs(Number(rbtA.slice(1)) - Number(rbtB.slice(1))) <= 1;
  const moduleCompatible = modulesEqual(
    { moduleId: a.moduleId, moduleName: a.moduleName },
    { moduleId: b.moduleId, moduleName: b.moduleName },
  ) || (!a.moduleId && !b.moduleId && !a.moduleName && !b.moduleName) || (!a.moduleId && !a.moduleName) || (!b.moduleId && !b.moduleName);
  return {
    marksBalanced,
    coCompatible,
    difficultyCompatible,
    rbtCompatible,
    moduleCompatible,
    ok: marksBalanced && moduleCompatible && coCompatible && difficultyCompatible && rbtCompatible,
  };
}

/** Legacy 10-mark slot builder kept so existing papers and tests remain valid. */
export function defaultSlotsForMarks(maxMarks: number, coTargets: Array<{ coCode: string; marks: number }>): GeneratorSlot[] {
  const slots: GeneratorSlot[] = [];
  if (maxMarks === 50) {
    let n = 1;
    for (const co of coTargets) {
      let remaining = co.marks;
      while (remaining >= 10) {
        slots.push({
          key: `Q${n}`,
          section: 'PART_B',
          questionNumber: n,
          subLetter: null,
          marks: 10,
          coCode: co.coCode,
          countsTowardRequired: true,
        });
        remaining -= 10;
        n += 1;
      }
      if (remaining > 0) {
        slots.push({
          key: `Q${n}`,
          section: remaining <= 5 ? 'PART_A' : 'PART_B',
          questionNumber: n,
          subLetter: null,
          marks: remaining,
          coCode: co.coCode,
          countsTowardRequired: true,
        });
        n += 1;
      }
    }
    return slots;
  }
  let n = 1;
  for (const co of coTargets) {
    slots.push({
      key: `Q${n}`,
      section: 'MAIN',
      questionNumber: n,
      subLetter: null,
      marks: co.marks,
      coCode: co.coCode,
      countsTowardRequired: true,
    });
    n += 1;
  }
  return slots;
}

export function slotsFromBuilt(built: BuiltSlot[], extras: Partial<GeneratorSlot> = {}): GeneratorSlot[] {
  return built.map((s) => ({
    key: s.key,
    section: s.section,
    questionNumber: s.questionNumber,
    subLetter: s.subLetter,
    marks: s.marks,
    orGroupId: s.orGroupId,
    isOrChoice: s.isOrChoice,
    orAlternative: s.orAlternative,
    countsTowardRequired: s.countsTowardRequired,
    ...extras,
  }));
}

export function itemLabel(item: { questionNumber: number; subLetter?: string | null; orAlternative?: string | null }) {
  const sub = item.subLetter ? `(${item.subLetter})` : '';
  const or = item.orAlternative === 'B' ? ' OR' : '';
  return `Q${item.questionNumber}${sub}${or}`;
}

function requiredMarksOf(items: Array<{ marks: number; countsTowardRequired?: boolean; orGroupId?: string | null; orAlternative?: string | null }>) {
  const hasAlt = items.some((i) => i.orAlternative || i.orGroupId);
  if (!hasAlt) return items.reduce((n, i) => n + Number(i.marks || 0), 0);
  return items
    .filter((i) => i.countsTowardRequired !== false && (i.orAlternative == null || i.orAlternative === 'A' || !i.orGroupId))
    .filter((i, _, all) => {
      if (!i.orGroupId) return i.orAlternative !== 'B';
      const alts = new Set(all.filter((x) => x.orGroupId === i.orGroupId).map((x) => x.orAlternative || 'A'));
      if (alts.size <= 1) return true;
      return i.orAlternative === 'A' || i.orAlternative == null;
    })
    .reduce((n, i) => n + Number(i.marks || 0), 0);
}

export function validateBlueprint(
  blueprint: Blueprint,
  items: Array<{
    marks: number;
    fingerprint: string;
    coCode?: string | null;
    orGroupId?: string | null;
    orAlternative?: string | null;
    countsTowardRequired?: boolean;
    moduleId?: number | null;
    moduleName?: string | null;
    topicId?: number | null;
    label?: string;
  }>,
) {
  const errors: string[] = [];
  const required = blueprint.requiredAnswerMarks ?? blueprint.maxMarks;
  const total = requiredMarksOf(items);
  const printed = items.reduce((n, i) => n + Number(i.marks || 0), 0);
  if (Math.abs(total - required) > 0.05) {
    errors.push(`Required answer marks ${total} must equal ${required}`);
  }
  if (printed < required - 0.05) errors.push(`Printed question marks ${printed} cannot be less than required ${required}`);
  if (items.some((i) => !i.marks)) errors.push('Every question must have marks');
  const fps = items.map((i) => i.fingerprint).filter(Boolean);
  if (new Set(fps).size !== fps.length) errors.push('Duplicate questions are not allowed');

  const scoped = (blueprint.selectedModuleIds?.length || 0) > 0 || (blueprint.modules?.length || 0) > 0;
  if (scoped) {
    for (const item of items) {
      const fake: PoolQuestion = {
        id: item.fingerprint,
        source: 'CUSTOM',
        sourceQuestionId: null,
        questionText: '',
        marks: item.marks,
        moduleName: item.moduleName ?? null,
        moduleId: item.moduleId ?? null,
        topicId: item.topicId ?? null,
        coCode: item.coCode ?? null,
        difficulty: null,
        bloomLevel: null,
        fingerprint: item.fingerprint,
        examYear: null,
        appearanceCount: 1,
        lastAppeared: null,
        isOrChoice: false,
        orGroupId: null,
        eligible: true,
      };
      if (!inSelectedScope(fake, blueprint)) {
        errors.push(crossModuleMessage(item.label || 'QX', item.moduleName));
      }
    }
  }

  if (blueprint.workflowVersion !== 2) {
    for (const target of blueprint.coTargets) {
      const got = items
        .filter((i) => i.coCode === target.coCode)
        .filter((i) => i.orAlternative !== 'B')
        .reduce((n, i) => n + i.marks, 0);
      if (target.marks > 0 && Math.abs(got - target.marks) > 0.5) {
        errors.push(`${target.coCode} has ${got} marks, expected ${target.marks}`);
      }
    }
  }

  const orGroups = new Map<string, Set<string>>();
  for (const item of items) {
    if (item.orGroupId) {
      const set = orGroups.get(item.orGroupId) ?? new Set();
      set.add(item.orAlternative || 'A');
      orGroups.set(item.orGroupId, set);
    }
  }
  for (const [id, alts] of orGroups) {
    if (alts.size !== 2 && blueprint.allowOrChoices && items.some((i) => i.orGroupId === id && i.orAlternative === 'B')) {
      errors.push(`OR group ${id} must contain exactly two alternatives`);
    }
  }
  return { ok: errors.length === 0, errors, requiredMarks: total, printedMarks: printed };
}

/**
 * Question Source Summary shown before finalization (spec §8 / §19). Counts OR
 * alternatives for the primary ratio, plus raw component counts for transparency
 * when a 20-mark alternative mixes SEE + Module Bank parts.
 */
export function sourceSummaryFromItems(
  items: Array<{
    questionNumber: number;
    orAlternative?: string | null;
    orGroupId?: string | null;
    sourceKind?: string | null;
    moduleName?: string | null;
  }>,
) {
  const byAlternative = new Map<string, { source: string; questionNumber: number; alt: string; moduleName?: string | null }>();
  let seeComponents = 0;
  let moduleBankComponents = 0;
  for (const it of items) {
    const alt = (it.orAlternative || 'A').toUpperCase();
    const key = `${it.orGroupId || `Q${it.questionNumber}`}:${alt}`;
    const source = String(it.sourceKind || '').toUpperCase();
    if (source === 'MODULE_QUESTION_BANK') moduleBankComponents += 1;
    else seeComponents += 1;
    const existing = byAlternative.get(key);
    // A 20-mark alternative may span two components; treat the alternative as a
    // fallback if ANY of its components came from the Module Question Bank.
    if (!existing || source === 'MODULE_QUESTION_BANK') {
      byAlternative.set(key, { source, questionNumber: it.questionNumber, alt, moduleName: it.moduleName });
    }
  }
  const alternatives = [...byAlternative.values()];
  const total = alternatives.length;
  const moduleBank = alternatives.filter((a) => a.source === 'MODULE_QUESTION_BANK');
  const vtuSeePyq = total - moduleBank.length;
  const fallbackReasons = moduleBank.map(
    (a) =>
      `Q${a.questionNumber}(${a.alt})${a.moduleName ? ` — ${a.moduleName}` : ''}: insufficient compatible SEE coverage; used Module Question Bank fallback.`,
  );
  return {
    total,
    vtuSeePyq,
    moduleQuestionBank: moduleBank.length,
    seeComponents,
    moduleBankComponents,
    fallbackReasons,
    label: `VTU SEE: ${seeComponents} components · Module Question Bank: ${moduleBankComponents} components`,
  };
}

export function coverageFromItems(
  items: Array<{
    marks: number;
    coCode?: string | null;
    source?: string;
    examYear?: number | null;
    moduleName?: string | null;
    rbtLevel?: string | null;
    bloomLevel?: string | null;
    orAlternative?: string | null;
  }>,
) {
  const countable = items.filter((i) => i.orAlternative !== 'B');
  const byCo = new Map<string, number>();
  const byYear = new Map<number, number>();
  const bySource = new Map<string, number>();
  const byModule = new Map<string, number>();
  const byRbt = new Map<string, number>();
  for (const item of countable) {
    const co = item.coCode || 'UNMAPPED';
    byCo.set(co, (byCo.get(co) || 0) + item.marks);
    if (item.examYear) byYear.set(item.examYear, (byYear.get(item.examYear) || 0) + 1);
    if (item.source) bySource.set(item.source, (bySource.get(item.source) || 0) + 1);
    const mod = item.moduleName || 'UNMAPPED';
    byModule.set(mod, (byModule.get(mod) || 0) + item.marks);
    const rbt = rbtFromBloom(item.rbtLevel || item.bloomLevel) || 'UNSET';
    byRbt.set(rbt, (byRbt.get(rbt) || 0) + item.marks);
  }
  return {
    totalMarks: countable.reduce((n, i) => n + i.marks, 0),
    byCo: [...byCo.entries()].map(([coCode, marks]) => ({ coCode, marks })),
    byYear: [...byYear.entries()].map(([year, count]) => ({ year, count })),
    bySource: [...bySource.entries()].map(([source, count]) => ({ source, count })),
    byModule: [...byModule.entries()].map(([moduleName, marks]) => ({ moduleName, marks })),
    byRbt: [...byRbt.entries()].map(([level, marks]) => ({ level, marks })),
  };
}

export function recommendModuleTargets(
  selected: Array<{ id: number; name: string; hours?: number; coveragePercent?: number; coCode?: string | null }>,
  requiredMarks: number,
) {
  if (!selected.length) return [];
  const weights = selected.map((m) => {
    const hours = Number(m.hours || 0);
    const coverage = Number(m.coveragePercent || 0);
    return Math.max(1, hours || 1) * (coverage > 0 ? Math.max(coverage, 20) / 100 : 1);
  });
  const sum = weights.reduce((n, w) => n + w, 0);
  let allocated = 0;
  return selected.map((m, i) => {
    const isLast = i === selected.length - 1;
    const marks = isLast ? requiredMarks - allocated : Math.round((weights[i] / sum) * requiredMarks);
    allocated += marks;
    return { moduleId: m.id, moduleName: m.name, marks, coCode: m.coCode ?? null };
  });
}
