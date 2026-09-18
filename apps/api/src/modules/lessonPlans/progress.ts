import { compareISODate } from './dates.js';

export type ProgressEntry = {
  status: string;
  plannedDate: string | null;
  actualDate: string | null;
  plannedHours: number;
  actualHours: number | null;
  moduleId: number | null;
  moduleLabel: string | null;
  moduleName: string | null;
};

export type ModuleProgress = {
  moduleId: number | null;
  moduleLabel: string | null;
  moduleName: string | null;
  totalUnits: number;
  completedUnits: number;
  totalHours: number;
  completedHours: number;
  percent: number;
};

export type PlanProgress = {
  totalUnits: number;
  completedUnits: number;
  skippedUnits: number;
  totalHours: number;
  completedHours: number;
  percent: number;
  hoursPercent: number;
  expectedHours: number;
  expectedPercent: number;
  hoursDelta: number;
  statusLabel: string | null;
  modules: ModuleProgress[];
};

function safePercent(num: number, den: number) {
  if (!Number.isFinite(num) || !Number.isFinite(den) || den <= 0) return 0;
  return Math.round((num / den) * 1000) / 10;
}

function hoursOf(entry: ProgressEntry) {
  return Number(entry.plannedHours) || 0;
}

function completedHoursOf(entry: ProgressEntry) {
  if (entry.status !== 'COMPLETED') return 0;
  const actual = entry.actualHours;
  if (actual != null && Number.isFinite(Number(actual))) return Number(actual);
  return hoursOf(entry);
}

export function computePlanProgress(entries: ProgressEntry[], today: string): PlanProgress {
  const active = entries.filter((e) => e.status !== 'SKIPPED');
  const skippedUnits = entries.filter((e) => e.status === 'SKIPPED').length;
  const totalUnits = active.length;
  const completedUnits = active.filter((e) => e.status === 'COMPLETED').length;
  const totalHours = active.reduce((sum, e) => sum + hoursOf(e), 0);
  const completedHours = active.reduce((sum, e) => sum + completedHoursOf(e), 0);
  const expectedHours = active
    .filter((e) => e.plannedDate && compareISODate(e.plannedDate, today) <= 0)
    .reduce((sum, e) => sum + hoursOf(e), 0);
  const hoursDelta = Math.round((completedHours - expectedHours) * 10) / 10;

  let statusLabel: string | null = null;
  if (totalHours > 0) {
    if (hoursDelta <= -0.5) {
      const hours = Math.abs(hoursDelta);
      statusLabel = `${hours} teaching hour${hours === 1 ? '' : 's'} behind plan`;
    } else if (hoursDelta >= 0.5) {
      const hours = hoursDelta;
      statusLabel = `${hours} teaching hour${hours === 1 ? '' : 's'} ahead of plan`;
    } else if (expectedHours > 0) {
      statusLabel = 'On plan';
    }
  }

  const moduleMap = new Map<string, ModuleProgress>();
  for (const entry of active) {
    const key = String(entry.moduleId ?? entry.moduleLabel ?? entry.moduleName ?? 'unknown');
    const current = moduleMap.get(key) ?? {
      moduleId: entry.moduleId,
      moduleLabel: entry.moduleLabel,
      moduleName: entry.moduleName,
      totalUnits: 0,
      completedUnits: 0,
      totalHours: 0,
      completedHours: 0,
      percent: 0,
    };
    current.totalUnits += 1;
    current.totalHours += hoursOf(entry);
    if (entry.status === 'COMPLETED') {
      current.completedUnits += 1;
      current.completedHours += completedHoursOf(entry);
    }
    moduleMap.set(key, current);
  }
  const modules = [...moduleMap.values()].map((m) => ({
    ...m,
    percent: safePercent(m.completedHours, m.totalHours) || safePercent(m.completedUnits, m.totalUnits),
  }));

  return {
    totalUnits,
    completedUnits,
    skippedUnits,
    totalHours,
    completedHours,
    percent: safePercent(completedUnits, totalUnits),
    hoursPercent: safePercent(completedHours, totalHours),
    expectedHours,
    expectedPercent: safePercent(expectedHours, totalHours),
    hoursDelta,
    statusLabel,
    modules,
  };
}
