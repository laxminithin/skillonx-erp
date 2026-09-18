import {
  QUIZ_DIFFICULTIES,
  type QuizDifficulty,
  isSelectableReviewStatus,
} from '../../types/quiz.js';
import { AppError } from '../../utils/errors.js';

export type GeneratorDistribution = 'BALANCED' | 'RANDOM';

export type GeneratorPoolItem = {
  id: number;
  courseId: number;
  moduleId: number;
  difficulty: QuizDifficulty | string | null;
  fingerprint: string;
  reviewStatus: string;
  primaryCoCode?: string | null;
};

export type GeneratorCriteria = {
  courseId: number;
  moduleIds: number[];
  easyCount: number;
  intermediateCount: number;
  difficultCount: number;
  distribution: GeneratorDistribution;
  excludeIds?: number[];
};

export type GeneratorResult = {
  selectedIds: number[];
  byDifficulty: Record<QuizDifficulty, number>;
  byModule: Record<number, number>;
};

const DIFFICULTY_LABEL: Record<QuizDifficulty, string> = {
  EASY: 'Easy',
  INTERMEDIATE: 'Intermediate',
  DIFFICULT: 'Difficult',
};

export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleCopy<T>(items: T[], rng: () => number = Math.random): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function requestedFor(difficulty: QuizDifficulty, criteria: GeneratorCriteria) {
  if (difficulty === 'EASY') return criteria.easyCount;
  if (difficulty === 'INTERMEDIATE') return criteria.intermediateCount;
  return criteria.difficultCount;
}

function dedupeByFingerprint(items: GeneratorPoolItem[], rng: () => number) {
  const groups = new Map<string, GeneratorPoolItem[]>();
  for (const item of items) {
    const key = item.fingerprint || `id:${item.id}`;
    const list = groups.get(key) ?? [];
    list.push(item);
    groups.set(key, list);
  }
  const picked: GeneratorPoolItem[] = [];
  for (const group of groups.values()) {
    const shuffled = shuffleCopy(group, rng);
    picked.push(shuffled[0]);
  }
  return picked;
}

function allocate(
  requested: number,
  moduleIds: number[],
  byModule: Map<number, GeneratorPoolItem[]>,
  distribution: GeneratorDistribution,
  rng: () => number,
): GeneratorPoolItem[] {
  if (requested <= 0) return [];
  const remaining = new Map<number, GeneratorPoolItem[]>();
  for (const id of moduleIds) {
    remaining.set(id, shuffleCopy(byModule.get(id) ?? [], rng));
  }

  if (distribution === 'RANDOM') {
    const pool = shuffleCopy(
      moduleIds.flatMap((id) => remaining.get(id) ?? []),
      rng,
    );
    return pool.slice(0, requested);
  }

  const n = moduleIds.length;
  const base = Math.floor(requested / n);
  const extra = requested % n;
  const selected: GeneratorPoolItem[] = [];
  let shortfall = 0;

  for (let i = 0; i < moduleIds.length; i += 1) {
    const quota = base + (i < extra ? 1 : 0);
    const pool = remaining.get(moduleIds[i]) ?? [];
    const take = Math.min(quota, pool.length);
    selected.push(...pool.splice(0, take));
    shortfall += quota - take;
  }

  while (shortfall > 0) {
    const donors = moduleIds.filter((id) => (remaining.get(id) ?? []).length > 0);
    if (!donors.length) break;
    for (const id of donors) {
      if (shortfall <= 0) break;
      const pool = remaining.get(id)!;
      selected.push(pool.shift()!);
      shortfall -= 1;
    }
  }

  return selected;
}

export function eligiblePool(pool: GeneratorPoolItem[], criteria: GeneratorCriteria) {
  const moduleSet = new Set(criteria.moduleIds);
  const exclude = new Set(criteria.excludeIds ?? []);
  return pool.filter(
    (item) =>
      item.courseId === criteria.courseId &&
      moduleSet.has(item.moduleId) &&
      isSelectableReviewStatus(item.reviewStatus) &&
      !exclude.has(item.id) &&
      Boolean(item.difficulty) &&
      (QUIZ_DIFFICULTIES as readonly string[]).includes(String(item.difficulty)),
  );
}

export function countAvailable(
  pool: GeneratorPoolItem[],
  criteria: Omit<GeneratorCriteria, 'easyCount' | 'intermediateCount' | 'difficultCount' | 'distribution'>,
  rng: () => number = Math.random,
) {
  const eligible = eligiblePool(pool, {
    ...criteria,
    easyCount: 0,
    intermediateCount: 0,
    difficultCount: 0,
    distribution: 'BALANCED',
  });
  const unique = dedupeByFingerprint(eligible, rng);
  const counts: Record<QuizDifficulty, number> = {
    EASY: 0,
    INTERMEDIATE: 0,
    DIFFICULT: 0,
  };
  const byModule: Record<
    number,
    Record<QuizDifficulty, number>
  > = {};
  for (const item of unique) {
    const d = item.difficulty as QuizDifficulty;
    counts[d] += 1;
    const row = byModule[item.moduleId] ?? { EASY: 0, INTERMEDIATE: 0, DIFFICULT: 0 };
    row[d] += 1;
    byModule[item.moduleId] = row;
  }
  return { totals: counts, byModule, items: unique };
}

export function selectQuestions(
  pool: GeneratorPoolItem[],
  criteria: GeneratorCriteria,
  rng: () => number = Math.random,
): GeneratorResult {
  if (!criteria.moduleIds.length) {
    throw new AppError(400, 'Select at least one module');
  }
  const totalRequested = criteria.easyCount + criteria.intermediateCount + criteria.difficultCount;
  if (totalRequested < 1) {
    throw new AppError(400, 'Select at least one question');
  }

  const eligible = eligiblePool(pool, criteria);
  const unique = dedupeByFingerprint(eligible, rng);
  const usedFingerprints = new Set<string>();
  const selected: GeneratorPoolItem[] = [];

  for (const difficulty of QUIZ_DIFFICULTIES) {
    const requested = requestedFor(difficulty, criteria);
    const candidates = unique.filter(
      (item) => item.difficulty === difficulty && !usedFingerprints.has(item.fingerprint || `id:${item.id}`),
    );
    if (requested > candidates.length) {
      throw new AppError(
        400,
        `Only ${candidates.length} ${DIFFICULTY_LABEL[difficulty]} questions are available for the selected modules.`,
        { difficulty, requested, available: candidates.length },
        'INSUFFICIENT_INVENTORY',
      );
    }
    const byModule = new Map<number, GeneratorPoolItem[]>();
    for (const item of candidates) {
      const list = byModule.get(item.moduleId) ?? [];
      list.push(item);
      byModule.set(item.moduleId, list);
    }
    const picked = allocate(requested, criteria.moduleIds, byModule, criteria.distribution, rng);
    if (picked.length !== requested) {
      throw new AppError(
        400,
        `Only ${picked.length} ${DIFFICULTY_LABEL[difficulty]} questions are available for the selected modules.`,
        { difficulty, requested, available: picked.length },
        'INSUFFICIENT_INVENTORY',
      );
    }
    for (const item of picked) {
      usedFingerprints.add(item.fingerprint || `id:${item.id}`);
      selected.push(item);
    }
  }

  const byDifficulty: Record<QuizDifficulty, number> = {
    EASY: 0,
    INTERMEDIATE: 0,
    DIFFICULT: 0,
  };
  const byModule: Record<number, number> = {};
  for (const item of selected) {
    byDifficulty[item.difficulty as QuizDifficulty] += 1;
    byModule[item.moduleId] = (byModule[item.moduleId] ?? 0) + 1;
  }

  return {
    selectedIds: selected.map((s) => s.id),
    byDifficulty,
    byModule,
  };
}

export function pickReplacement(
  pool: GeneratorPoolItem[],
  params: {
    courseId: number;
    moduleIds: number[];
    difficulty: QuizDifficulty;
    excludeIds: number[];
    preferredModuleId?: number | null;
    preferredPrimaryCo?: string | null;
  },
  rng: () => number = Math.random,
): GeneratorPoolItem | null {
  const eligible = eligiblePool(pool, {
    courseId: params.courseId,
    moduleIds: params.moduleIds,
    easyCount: 0,
    intermediateCount: 0,
    difficultCount: 0,
    distribution: 'BALANCED',
    excludeIds: params.excludeIds,
  }).filter((item) => item.difficulty === params.difficulty);

  const unique = dedupeByFingerprint(eligible, rng);
  if (!unique.length) return null;

  const preferredCo = (params.preferredPrimaryCo || '').toUpperCase();
  const coMatched = preferredCo
    ? unique.filter((item) => (item.primaryCoCode || '').toUpperCase() === preferredCo)
    : [];
  const preferredModule = params.preferredModuleId
    ? (coMatched.length ? coMatched : unique).filter((item) => item.moduleId === params.preferredModuleId)
    : [];
  const source = preferredModule.length
    ? preferredModule
    : coMatched.length
      ? coMatched
      : unique;
  return shuffleCopy(source, rng)[0] ?? null;
}
