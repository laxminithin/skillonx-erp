/**
 * Structured NL → intent + tool plan for Alumni Assistant (C8).
 * Deterministic keyword rules — LLM must not invent candidates.
 */
import type { AssistantToolName } from './typesAssistant.js';
export type StructuredPlan = {
    intent: string;
    tools: Array<{
        name: AssistantToolName;
        args: Record<string, unknown>;
    }>;
    uncertainties: string[];
    blocked?: {
        reason: string;
        code: string;
    } | null;
    unavailable?: string[];
};
/**
 * Translate natural language into structured C1–C7 tool calls.
 */
export declare function planFromQuestion(question: string, context?: {
    alumniProfileId?: number | null;
    surface?: string | null;
}): StructuredPlan;
