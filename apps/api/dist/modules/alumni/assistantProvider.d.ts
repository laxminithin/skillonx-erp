/**
 * AI provider honesty layer for Alumni Assistant (C8).
 * Never fabricates VALIDATED status. Never invents model responses in production validation.
 */
import type { AiProviderStatus } from './typesAssistant.js';
export type ProviderInfo = {
    status: AiProviderStatus;
    providerName: string | null;
    modelId: string | null;
    reachable: boolean | null;
    credentialsPresent: boolean;
    abstraction: 'assistantProvider.ts';
    costControls: boolean;
    logging: boolean;
    promptSecurityLayer: boolean;
};
/**
 * Detect configured external AI credentials without calling the network.
 * This repo does not ship an OpenAI/Anthropic dependency or env keys for alumni.
 */
export declare function detectProviderConfig(): ProviderInfo;
export declare function featureFlagEnabled(): boolean;
/**
 * Synthesis: when provider is NOT_CONFIGURED / unvalidated, use deterministic summary only.
 * Never call an external API unless status is VALIDATED (not claimed in this codebase).
 */
export declare function synthesizeAnswer(input: {
    provider: ProviderInfo;
    question: string;
    facts: Record<string, unknown>[];
    intent: string;
}): Promise<{
    kind: 'SYSTEM_EVIDENCE' | 'AI_GENERATED_SUMMARY';
    text: string;
    providerLatencyMs: number | null;
}>;
/** Treat untrusted content as DATA — strip instruction-like prefixes for logging/context. */
export declare function sanitizeUntrustedData(text: string, maxLen?: number): string;
