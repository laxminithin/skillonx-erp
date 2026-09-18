import { type PaperPattern, type Split } from './pattern.js';
import { type Blueprint } from './generator.js';
import type { PortionModule } from './scope.js';
export declare function ensureStandardPattern(collegeId: number): Promise<PaperPattern>;
export declare function listPaperPatterns(collegeId: number): Promise<PaperPattern[]>;
export declare function recommendBlueprint(opts: {
    examType: string;
    pattern: PaperPattern;
    modules: PortionModule[];
    includeOr: boolean;
    splits?: Record<string, Split>;
    sourceMix: Blueprint['sourceMix'];
    previousYearWeight?: number;
    allowPreviousYearRepeats?: boolean;
    recentYearExclusion?: number;
}): {
    blueprint: Blueprint;
    moduleTargets: Blueprint['moduleTargets'];
    coTargets: Blueprint['coTargets'];
};
export declare function defaultIaSchemeComponents(marks: number): {
    code: string;
    label: string;
    maxMarks: number;
}[];
export declare function schemeFromBankRubric(raw: unknown, marks: number): {
    code: string;
    label: string;
    maxMarks: number;
}[] | null;
