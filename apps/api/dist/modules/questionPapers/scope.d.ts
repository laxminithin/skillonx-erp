import { type Blueprint } from './generator.js';
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
export declare function inferModuleCo(moduleName: string, sortOrder: number, cos: Array<{
    code: string;
    number?: number;
}>): string | null;
export declare function loadPortions(opts: {
    collegeId: number;
    courseId: number;
    facultyUserId: number;
    academicYearId?: number | null;
    selectedModuleIds?: number[];
    selectedTopicIds?: number[] | null;
}): Promise<{
    modules: PortionModule[];
    lessonPlanId: number | null;
    coverageWarning: boolean;
    coverageWarningMessage: string | null;
    incompleteModules: {
        id: number;
        name: string;
        coveragePercent: number;
    }[];
}>;
export declare function scopeFromPortions(modules: PortionModule[]): {
    selectedModuleIds: number[];
    selectedModuleNames: string[];
    selectedTopicIds: number[];
    excludedTopicIds: number[];
    allTopicsIncluded: boolean;
};
export declare function applyScopeToBlueprint(blueprint: Blueprint, scope: ReturnType<typeof scopeFromPortions>): Blueprint;
