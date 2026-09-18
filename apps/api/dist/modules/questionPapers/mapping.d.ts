import { type CoIntentRef } from '../questions/coMapping.js';
import type { ModuleAssignmentMethod, ParsedQuestion } from './types.js';
import { type SyllabusModuleRef } from './vtuStructure.js';
export type ModuleRef = SyllabusModuleRef;
export type ModuleInference = {
    moduleName: string | null;
    moduleId: number | null;
    topicName: string | null;
    mappingBasis: string;
    confidence: number;
    verificationStatus: 'ACADEMIC_ANALYSIS' | 'MODULE_MAPPING_NEEDS_REVIEW' | 'NEEDS_REVIEW';
    needsReview: boolean;
    assignmentMethod: ModuleAssignmentMethod;
};
/**
 * Map a question to a syllabus module.
 * Paper headings win. VTU Q1/Q2→M1 is used only when the extractor assigned that
 * pattern, then verified against syllabus topics.
 */
export declare function inferModule(opts: {
    question: ParsedQuestion;
    modules: ModuleRef[];
}): ModuleInference;
export declare function inferQuestionCo(opts: {
    question: ParsedQuestion;
    outcomes: CoIntentRef[];
    moduleHint?: string | null;
}): import("../questions/coMapping.js").PrimaryCoInference;
