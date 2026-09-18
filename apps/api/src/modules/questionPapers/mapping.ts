import { inferPrimaryCoFromIntent, type CoIntentRef } from '../questions/coMapping.js';
import type { ModuleAssignmentMethod, ParsedQuestion } from './types.js';
import { verifyModuleAgainstSyllabus, type SyllabusModuleRef } from './vtuStructure.js';

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
export function inferModule(opts: {
  question: ParsedQuestion;
  modules: ModuleRef[];
}): ModuleInference {
  const verified = verifyModuleAgainstSyllabus(opts.question, opts.modules);
  return {
    moduleName: verified.moduleName,
    moduleId: verified.moduleId,
    topicName: verified.topicName,
    mappingBasis: verified.mappingBasis,
    confidence: verified.confidence,
    verificationStatus: verified.needsReview ? 'MODULE_MAPPING_NEEDS_REVIEW' : 'ACADEMIC_ANALYSIS',
    needsReview: verified.needsReview,
    assignmentMethod: verified.assignmentMethod,
  };
}

export function inferQuestionCo(opts: {
  question: ParsedQuestion;
  outcomes: CoIntentRef[];
  moduleHint?: string | null;
}) {
  return inferPrimaryCoFromIntent({
    questionText: [
      opts.question.questionText,
      ...opts.question.subquestions.map((s) => s.questionText),
    ].join(' '),
    moduleHint: opts.moduleHint || opts.question.moduleOrUnit,
    outcomes: opts.outcomes,
  });
}
