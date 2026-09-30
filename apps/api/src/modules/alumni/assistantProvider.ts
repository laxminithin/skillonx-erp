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
export function detectProviderConfig(): ProviderInfo {
  const openaiKey = process.env.OPENAI_API_KEY?.trim() || process.env.ALUMNI_AI_API_KEY?.trim() || '';
  const modelId = process.env.ALUMNI_AI_MODEL?.trim() || process.env.OPENAI_MODEL?.trim() || null;
  const providerName = openaiKey
    ? process.env.ALUMNI_AI_PROVIDER?.trim() || 'openai-compatible'
    : null;

  const credentialsPresent = Boolean(openaiKey);
  // Without a validated exercise harness, never claim VALIDATED.
  const status: AiProviderStatus = credentialsPresent ? 'CONFIGURED_NOT_VALIDATED' : 'NOT_CONFIGURED';

  return {
    status,
    providerName,
    modelId: credentialsPresent ? modelId : null,
    reachable: null,
    credentialsPresent,
    abstraction: 'assistantProvider.ts',
    costControls: true,
    logging: true,
    promptSecurityLayer: true,
  };
}

export function featureFlagEnabled(): boolean {
  const v = process.env.ALUMNI_AI_ASSISTANT_ENABLED;
  if (v == null || v === '') return true; // deterministic path available; provider may still be NOT_CONFIGURED
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

/**
 * Synthesis: when provider is NOT_CONFIGURED / unvalidated, use deterministic summary only.
 * Never call an external API unless status is VALIDATED (not claimed in this codebase).
 */
export async function synthesizeAnswer(input: {
  provider: ProviderInfo;
  question: string;
  facts: Record<string, unknown>[];
  intent: string;
}): Promise<{ kind: 'SYSTEM_EVIDENCE' | 'AI_GENERATED_SUMMARY'; text: string; providerLatencyMs: number | null }> {
  const started = Date.now();
  if (input.provider.status !== 'VALIDATED') {
    const lines: string[] = [];
    if (!input.facts.length) {
      lines.push('Insufficient verified data to answer from C1–C7 sources.');
    } else {
      lines.push(`Grounded answer for intent “${input.intent}” (deterministic — AI provider ${input.provider.status}):`);
      for (const fact of input.facts.slice(0, 12)) {
        const summary = typeof fact.summary === 'string' ? fact.summary : JSON.stringify(fact).slice(0, 240);
        lines.push(`• ${summary}`);
      }
    }
    return {
      kind: 'SYSTEM_EVIDENCE',
      text: lines.join('\n'),
      providerLatencyMs: null,
    };
  }

  // VALIDATED path is intentionally unimplemented until a real provider is exercised.
  // Claiming synthesis here would violate ZERO-FABRICATION.
  return {
    kind: 'SYSTEM_EVIDENCE',
    text: 'Provider marked VALIDATED but synthesis runtime is not activated in this build.',
    providerLatencyMs: Date.now() - started,
  };
}

/** Treat untrusted content as DATA — strip instruction-like prefixes for logging/context. */
export function sanitizeUntrustedData(text: string, maxLen = 500): string {
  const cleaned = String(text || '')
    .replace(/\bignore (all|previous|prior) instructions\b/gi, '[filtered]')
    .replace(/\bsystem prompt\b/gi, '[filtered]')
    .replace(/\bexport all alumni\b/gi, '[filtered]')
    .slice(0, maxLen);
  return cleaned;
}
