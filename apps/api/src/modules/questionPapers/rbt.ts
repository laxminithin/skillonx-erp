import { BLOOMS_LEVELS, BLOOMS_LABELS, type BloomsLevel } from '../copo/types.js';
import type { BloomLevel } from './types.js';

const NAME_TO_RBT: Record<string, BloomsLevel> = {
  REMEMBER: 'L1',
  UNDERSTAND: 'L2',
  APPLY: 'L3',
  ANALYZE: 'L4',
  ANALYSE: 'L4',
  EVALUATE: 'L5',
  CREATE: 'L6',
};

export function rbtFromBloom(value: string | null | undefined): BloomsLevel | null {
  if (!value) return null;
  const raw = String(value).trim().toUpperCase();
  if ((BLOOMS_LEVELS as readonly string[]).includes(raw)) return raw as BloomsLevel;
  if (NAME_TO_RBT[raw]) return NAME_TO_RBT[raw];
  const compact = raw.replace(/[^A-Z0-9]/g, '');
  if ((BLOOMS_LEVELS as readonly string[]).includes(compact)) return compact as BloomsLevel;
  if (NAME_TO_RBT[compact]) return NAME_TO_RBT[compact];
  return null;
}

export function bloomFromRbt(level: string | null | undefined): BloomLevel | null {
  const rbt = rbtFromBloom(level);
  if (!rbt) return null;
  return BLOOMS_LABELS[rbt].toUpperCase() as BloomLevel;
}

export function rbtLabel(level: string | null | undefined) {
  const rbt = rbtFromBloom(level);
  if (!rbt) return null;
  return `${rbt} — ${BLOOMS_LABELS[rbt]}`;
}
