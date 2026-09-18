import { type CorrelationStrength } from './types.js';
export type SuggestableCo = {
    id: number;
    code: string;
    statement: string;
    bloomsLevel?: string | null;
    knowledgeLevel?: string | null;
};
export type SuggestablePo = {
    id: number;
    code: string;
    shortTitle?: string | null;
    statement?: string | null;
};
export type MappingSuggestion = {
    courseOutcomeId: number;
    programOutcomeId: number;
    coCode: string;
    poCode: string;
    suggested: CorrelationStrength;
    confidence: 'High' | 'Medium' | 'Low';
    rationale: string;
};
export declare function suggestMappings(cos: SuggestableCo[], pos: SuggestablePo[]): MappingSuggestion[];
export declare function suggestJustification(input: {
    coCode: string;
    coStatement: string;
    poCode: string;
    poTitle?: string | null;
    poStatement?: string | null;
    strength: CorrelationStrength;
    bloomsLevel?: string | null;
    subjectName?: string | null;
}): string;
