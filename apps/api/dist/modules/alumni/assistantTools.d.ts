import type { AlumniAdminActor } from './service.js';
import type { AssistantToolName, EvidenceRef, SourceChip, ToolDefinition } from './typesAssistant.js';
export declare const TOOL_REGISTRY: ToolDefinition[];
export declare function getToolDef(name: AssistantToolName): ToolDefinition | undefined;
export type ToolResult = {
    facts: Record<string, unknown>[];
    evidence: EvidenceRef[];
    sources: SourceChip[];
    dataQualityReasons: string[];
    dataQualityLevel?: 'HIGH' | 'MODERATE' | 'LIMITED' | 'INSUFFICIENT';
};
export declare function executeTool(actor: AlumniAdminActor, name: AssistantToolName, rawArgs: Record<string, unknown>): Promise<ToolResult>;
