export declare const STANDARD_IA_PATTERN_CODE = "STANDARD_IA_50";
export type Split = number[];
export type PatternSection = {
    key: string;
    label: string;
    requiredMarks: number;
    questionNumber: number;
    defaultSplit: Split;
    allowedSplits: Split[];
    allowOr: boolean;
};
export type PaperPattern = {
    id?: number | null;
    code: string;
    name: string;
    maxMarks: number;
    requiredAnswerMarks: number;
    durationMinutes: number | null;
    allowOrChoices: boolean;
    isDefault: boolean;
    sections: PatternSection[];
};
export declare const STANDARD_IA_SECTIONS: PatternSection[];
export declare const STANDARD_IA_PATTERN: PaperPattern;
export declare function parseSections(raw: unknown): PatternSection[];
export declare function splitLetters(split: Split): string[];
export declare function normalizeSplit(split: Split, requiredMarks: number, allowed: Split[]): Split;
export declare function patternLabel(pattern: PaperPattern): string;
export type PatternSlotInput = {
    pattern: PaperPattern;
    splits?: Record<string, Split>;
    includeOr?: boolean;
};
export type BuiltSlot = {
    key: string;
    section: string;
    questionNumber: number;
    subLetter: string | null;
    marks: number;
    orGroupId: string | null;
    isOrChoice: boolean;
    orAlternative: 'A' | 'B' | null;
    countsTowardRequired: boolean;
};
export declare function buildPatternSlots(input: PatternSlotInput): BuiltSlot[];
export declare function requiredAnswerMarks(slots: Array<{
    marks: number;
    countsTowardRequired?: boolean;
    orGroupId?: string | null;
    orAlternative?: string | null;
}>): number;
export declare function printedMarks(slots: Array<{
    marks: number;
}>): number;
export declare function examTypeLabel(examType: string): string;
