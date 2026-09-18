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
export declare function computePlanProgress(entries: ProgressEntry[], today: string): PlanProgress;
