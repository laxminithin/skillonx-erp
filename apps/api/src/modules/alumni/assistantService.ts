/**
 * Alumni Intelligence Assistant service (C8).
 * Pipeline: auth → tenant/RBAC → intent → tools → C1–C7 facts → optional AI synthesis → evidence.
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { AlumniAdminActor } from './service.js';
import {
  canAccessAssistant,
  canProposeAssistantDrafts,
  isDepartmentScopedAssistant,
} from './accessAssistant.js';
import { planFromQuestion } from './assistantQuery.js';
import { detectProviderConfig, featureFlagEnabled, synthesizeAnswer } from './assistantProvider.js';
import { executeTool, TOOL_REGISTRY, getToolDef } from './assistantTools.js';
import type {
  AssistantAnswer,
  DataQualityLevel,
  ProposedAction,
  askSchema,
} from './typesAssistant.js';
import {
  AI_DATA_BOUNDARY_POLICY,
  FORBIDDEN_AI_CLAIMS,
  HIGH_RISK_ACTIONS,
  KNOWN_LIMITATIONS_C8,
} from './typesAssistant.js';
import type { z } from 'zod';
import * as matching from './matchingService.js';
import * as crm from './crmService.js';
import * as engagement from './engagementService.js';
import * as recognition from './recognitionService.js';

type AskInput = z.infer<typeof askSchema>;

export function getSourceOfTruthMatrix() {
  return {
    matrix: [
      { capability: 'Alumni facts', source: 'C1', note: 'Assistant never invents alumni' },
      { capability: 'Relationships', source: 'C2', note: 'Internal notes excluded by default' },
      { capability: 'Intelligence', source: 'C3', note: 'Explainable dimensions only' },
      { capability: 'Engagement', source: 'C4', note: 'Eligibility/consent/suppression authoritative' },
      { capability: 'Matching', source: 'C5', note: 'AI does not rank' },
      { capability: 'Recognition', source: 'C6', note: 'Human approval mandatory' },
      { capability: 'Impact KPIs', source: 'C7', note: 'Versioned metrics only' },
      { capability: 'AI synthesis', source: 'C8 provider', note: 'Never a source of truth' },
    ],
    forbiddenClaims: FORBIDDEN_AI_CLAIMS,
    highRiskDenied: HIGH_RISK_ACTIONS,
    limitations: KNOWN_LIMITATIONS_C8,
    dataBoundary: AI_DATA_BOUNDARY_POLICY,
    tools: TOOL_REGISTRY.map((t) => ({
      name: t.name,
      purpose: t.purpose,
      permission: t.requiredPermission,
      readWrite: t.readWrite,
      piiClass: t.piiClass,
    })),
  };
}

export async function requireTables() {
  if (!(await db.schema.hasTable('alumni_assistant_sessions'))) {
    throw new AppError(503, 'Run migration alumni_assistant_c8 first');
  }
}

export async function getOrCreateConfig(collegeId: number) {
  if (!(await db.schema.hasTable('alumni_assistant_config'))) return null;
  let row = await db('alumni_assistant_config').where({ college_id: collegeId }).first();
  const provider = detectProviderConfig();
  if (!row) {
    const [id] = await db('alumni_assistant_config').insert({
      college_id: collegeId,
      enabled: featureFlagEnabled(),
      provider_status: provider.status,
      provider_name: provider.providerName,
      model_id: provider.modelId,
    });
    row = await db('alumni_assistant_config').where({ id }).first();
  } else {
    await db('alumni_assistant_config').where({ id: row.id }).update({
      provider_status: provider.status,
      provider_name: provider.providerName,
      model_id: provider.modelId,
      updated_at: db.fn.now(),
    });
    row = await db('alumni_assistant_config').where({ id: row.id }).first();
  }
  return row;
}

export async function getProviderStatus(actor: AlumniAdminActor) {
  assertAccess(actor);
  const provider = detectProviderConfig();
  const config = await getOrCreateConfig(actor.collegeId);
  return {
    featureFlagEnabled: featureFlagEnabled(),
    configEnabled: config ? Boolean(config.enabled) : featureFlagEnabled(),
    provider,
    note:
      provider.status === 'VALIDATED'
        ? 'Provider validated in controlled exercise.'
        : 'Deterministic C1–C7 assistant path is available; AI synthesis is not claimed as VALIDATED.',
  };
}

export function assertAccess(actor: AlumniAdminActor) {
  if (!canAccessAssistant(actor)) throw new AppError(403, 'Alumni assistant access denied');
}

async function recordTelemetry(
  collegeId: number,
  eventType: string,
  extra: { intent?: string; toolName?: string; latencyMs?: number; success?: boolean; errorCode?: string } = {},
) {
  if (!(await db.schema.hasTable('alumni_assistant_telemetry'))) return;
  await db('alumni_assistant_telemetry').insert({
    college_id: collegeId,
    event_type: eventType,
    intent: extra.intent || null,
    tool_name: extra.toolName || null,
    latency_ms: extra.latencyMs ?? null,
    success: extra.success !== false,
    error_code: extra.errorCode || null,
  });
}

async function recordAudit(input: {
  actor: AlumniAdminActor;
  sessionId?: number | null;
  intent: string;
  questionSafe: string;
  toolsUsed: string[];
  sourceReferences: unknown;
  actionProposed?: string | null;
  actionConfirmed?: boolean | null;
  providerStatus: string;
  providerModel?: string | null;
  latencyMs: number;
  providerLatencyMs?: number | null;
  blocked?: boolean;
  blockReason?: string | null;
}) {
  if (!(await db.schema.hasTable('alumni_assistant_audit'))) return;
  await db('alumni_assistant_audit').insert({
    college_id: input.actor.collegeId,
    faculty_user_id: input.actor.facultyUserId,
    session_id: input.sessionId ?? null,
    intent: input.intent,
    question_safe: input.questionSafe.slice(0, 512),
    tools_used: JSON.stringify(input.toolsUsed),
    source_references: JSON.stringify(input.sourceReferences),
    action_proposed: input.actionProposed ?? null,
    action_confirmed: input.actionConfirmed ?? null,
    provider_status: input.providerStatus,
    provider_model: input.providerModel ?? null,
    latency_ms: input.latencyMs,
    provider_latency_ms: input.providerLatencyMs ?? null,
    blocked: Boolean(input.blocked),
    block_reason: input.blockReason ?? null,
  });
}

export async function ensureSession(
  actor: AlumniAdminActor,
  opts: { sessionId?: number | null; contextAlumniProfileId?: number | null; contextSurface?: string | null } = {},
) {
  await requireTables();
  assertAccess(actor);
  if (opts.sessionId) {
    const existing = await db('alumni_assistant_sessions')
      .where({ id: opts.sessionId, college_id: actor.collegeId, faculty_user_id: actor.facultyUserId })
      .first();
    if (!existing) throw new AppError(404, 'Session not found');
    await db('alumni_assistant_sessions').where({ id: existing.id }).update({ last_activity_at: db.fn.now() });
    return existing;
  }
  if (opts.contextAlumniProfileId) {
    const profile = await db('alumni_profiles')
      .where({ id: opts.contextAlumniProfileId, college_id: actor.collegeId })
      .first();
    if (!profile) throw new AppError(404, 'Contextual alumni not found');
    if (
      isDepartmentScopedAssistant(actor) &&
      actor.departmentId != null &&
      profile.historical_department_id != null &&
      Number(profile.historical_department_id) !== Number(actor.departmentId)
    ) {
      throw new AppError(403, 'Contextual alumni outside department scope');
    }
  }
  const [id] = await db('alumni_assistant_sessions').insert({
    college_id: actor.collegeId,
    faculty_user_id: actor.facultyUserId,
    role_snapshot: actor.role,
    department_id: actor.departmentId,
    context_alumni_profile_id: opts.contextAlumniProfileId ?? null,
    context_surface: opts.contextSurface ?? null,
  });
  return db('alumni_assistant_sessions').where({ id }).first();
}

function mergeQuality(levels: DataQualityLevel[]): DataQualityLevel {
  const order: DataQualityLevel[] = ['INSUFFICIENT', 'LIMITED', 'MODERATE', 'HIGH'];
  let worst: DataQualityLevel = 'HIGH';
  for (const l of levels) {
    if (order.indexOf(l) < order.indexOf(worst)) worst = l;
  }
  return levels.length ? worst : 'INSUFFICIENT';
}

async function confirmProposedAction(
  actor: AlumniAdminActor,
  confirm: NonNullable<AskInput['confirmAction']>,
): Promise<{ result: Record<string, unknown>; action: ProposedAction }> {
  if (!canProposeAssistantDrafts(actor)) {
    throw new AppError(403, 'Draft actions not permitted');
  }
  if (!confirm.confirm) {
    throw new AppError(400, 'Confirmation required');
  }
  const preview = confirm.preview || {};
  switch (confirm.actionType) {
    case 'DRAFT_NEED': {
      const created = await matching.createNeed(actor, {
        type: (preview.type as any) || 'EXPERT_SESSION',
        title: String(preview.title || 'Assistant draft need'),
        description: preview.description ? String(preview.description) : 'Draft from Alumni Intelligence Assistant',
        domain: preview.domain ? String(preview.domain) : null,
        departmentId: preview.departmentId ? Number(preview.departmentId) : actor.departmentId,
        sourceType: 'ADHOC',
      } as any);
      return {
        result: created as any,
        action: {
          actionType: 'DRAFT_NEED',
          status: 'CONFIRMED',
          preview,
          requiresConfirm: true,
          highRisk: false,
        },
      };
    }
    case 'DRAFT_FOLLOWUP': {
      const alumniProfileId = Number(preview.alumniProfileId);
      if (!alumniProfileId) throw new AppError(400, 'alumniProfileId required');
      const created = await crm.createFollowup(actor, alumniProfileId, {
        reason: String(preview.title || preview.reason || 'Assistant draft follow-up'),
        dueDate: String(preview.dueAt || preview.dueDate || new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)),
        notes: String(preview.notes || 'Draft from assistant — review before acting'),
      });
      return {
        result: created as any,
        action: {
          actionType: 'DRAFT_FOLLOWUP',
          status: 'CONFIRMED',
          preview,
          requiresConfirm: true,
          highRisk: false,
        },
      };
    }
    case 'DRAFT_CAMPAIGN': {
      const programs = await engagement.listPrograms(actor, { limit: 1 });
      const programId = Number(preview.programId || programs.programs?.[0]?.id);
      if (!programId) throw new AppError(400, 'No engagement program available for draft campaign');
      const created = await engagement.createCampaign(actor, {
        programId,
        name: String(preview.name || 'Assistant draft campaign'),
        channel: 'MANUAL',
        audienceSource: preview.audienceSource || { type: 'FILTERS', filters: {} },
        requiresApproval: true,
      } as any);
      return {
        result: created as any,
        action: {
          actionType: 'DRAFT_CAMPAIGN',
          status: 'CONFIRMED',
          preview,
          requiresConfirm: true,
          highRisk: false,
        },
      };
    }
    case 'DRAFT_NOMINATION': {
      const alumniProfileId = Number(preview.alumniProfileId);
      if (!alumniProfileId) throw new AppError(400, 'alumniProfileId required');
      const created = await recognition.createNomination(actor, {
        alumniProfileId,
        title: String(preview.title || 'Assistant draft nomination'),
        reason: String(preview.rationale || preview.reason || 'Draft from assistant — human review required'),
        status: 'DRAFT',
      } as any);
      return {
        result: created as any,
        action: {
          actionType: 'DRAFT_NOMINATION',
          status: 'CONFIRMED',
          preview,
          requiresConfirm: true,
          highRisk: false,
        },
      };
    }
    default:
      throw new AppError(400, 'Unknown draft action');
  }
}

export async function ask(actor: AlumniAdminActor, body: AskInput): Promise<AssistantAnswer & { sessionId: number }> {
  const started = Date.now();
  assertAccess(actor);

  if (!featureFlagEnabled()) {
    throw new AppError(503, 'Alumni AI assistant disabled by feature flag', undefined, 'ASSISTANT_DISABLED');
  }

  await requireTables();
  const provider = detectProviderConfig();
  await getOrCreateConfig(actor.collegeId);

  const session = await ensureSession(actor, {
    sessionId: body.sessionId,
    contextAlumniProfileId: body.contextAlumniProfileId,
    contextSurface: body.contextSurface,
  });

  const questionSafe = String(body.question || '')
    .replace(/\b[\w.+-]+@[\w.-]+\.\w+\b/g, '[email]')
    .replace(/\b\d{10,}\b/g, '[phone]')
    .slice(0, 512);

  // Confirmed write path
  if (body.confirmAction?.confirm) {
    const { result, action } = await confirmProposedAction(actor, body.confirmAction);
    const answer: AssistantAnswer = {
      mode: 'PROPOSE',
      providerStatus: provider.status,
      intent: 'CONFIRM_ACTION',
      kinds: ['DRAFT_ACTION', 'FACT'],
      summary: `Confirmed ${action.actionType} via existing C1–C7 service.`,
      facts: [{ summary: `Action ${action.actionType} confirmed`, result }],
      evidence: [],
      sources: [],
      dataQuality: { level: 'HIGH', reasons: ['Executed through authoritative service after confirm'] },
      toolsUsed: [],
      proposedAction: action,
      uncertainties: [],
      followUps: ['Review the created draft in the relevant workspace.'],
    };
    await recordAudit({
      actor,
      sessionId: session.id,
      intent: 'CONFIRM_ACTION',
      questionSafe,
      toolsUsed: [],
      sourceReferences: [],
      actionProposed: action.actionType,
      actionConfirmed: true,
      providerStatus: provider.status,
      latencyMs: Date.now() - started,
    });
    await persistMessages(actor, session.id, body.question, answer);
    return { ...answer, sessionId: Number(session.id) };
  }

  const plan = planFromQuestion(body.question, {
    alumniProfileId: body.contextAlumniProfileId ?? session.context_alumni_profile_id,
    surface: body.contextSurface ?? session.context_surface,
  });

  if (plan.blocked) {
    const answer: AssistantAnswer = {
      mode: 'READ_ONLY',
      providerStatus: provider.status,
      intent: plan.intent,
      kinds: ['UNCERTAINTY'],
      summary: plan.blocked.reason,
      facts: [],
      evidence: [],
      sources: [],
      dataQuality: { level: 'INSUFFICIENT', reasons: [plan.blocked.reason] },
      toolsUsed: [],
      blocked: plan.blocked,
      uncertainties: [plan.blocked.reason],
      followUps: [],
    };
    await recordAudit({
      actor,
      sessionId: session.id,
      intent: plan.intent,
      questionSafe,
      toolsUsed: [],
      sourceReferences: [],
      providerStatus: provider.status,
      latencyMs: Date.now() - started,
      blocked: true,
      blockReason: plan.blocked.code,
    });
    await recordTelemetry(actor.collegeId, 'blocked_action', { intent: plan.intent, success: false, errorCode: plan.blocked.code });
    await persistMessages(actor, session.id, body.question, answer);
    return { ...answer, sessionId: Number(session.id) };
  }

  const facts: Record<string, unknown>[] = [];
  const evidence: AssistantAnswer['evidence'] = [];
  const sources: AssistantAnswer['sources'] = [];
  const qualityReasons: string[] = [...(plan.unavailable || [])];
  const qualityLevels: DataQualityLevel[] = [];
  const toolsUsed: AssistantAnswer['toolsUsed'] = [];
  let proposedAction: ProposedAction | null = null;

  for (const step of plan.tools) {
    const def = getToolDef(step.name);
    if (!def) continue;
    const t0 = Date.now();
    try {
      const result = await executeTool(actor, step.name, step.args);
      toolsUsed.push(step.name);
      facts.push(...result.facts);
      evidence.push(...result.evidence);
      sources.push(...result.sources);
      qualityReasons.push(...result.dataQualityReasons);
      if (result.dataQualityLevel) qualityLevels.push(result.dataQualityLevel);
      await recordTelemetry(actor.collegeId, 'tool_ok', {
        intent: plan.intent,
        toolName: step.name,
        latencyMs: Date.now() - t0,
        success: true,
      });

      if (def.readWrite === 'PROPOSE' && canProposeAssistantDrafts(actor)) {
        proposedAction = {
          actionType:
            step.name === 'PROPOSE_DRAFT_NEED'
              ? 'DRAFT_NEED'
              : step.name === 'PROPOSE_DRAFT_FOLLOWUP'
                ? 'DRAFT_FOLLOWUP'
                : step.name === 'PROPOSE_DRAFT_CAMPAIGN'
                  ? 'DRAFT_CAMPAIGN'
                  : 'DRAFT_NOMINATION',
          status: 'PROPOSED',
          preview: { ...step.args },
          requiresConfirm: true,
          highRisk: false,
        };
      }
    } catch (err: any) {
      await recordTelemetry(actor.collegeId, 'tool_fail', {
        intent: plan.intent,
        toolName: step.name,
        latencyMs: Date.now() - t0,
        success: false,
        errorCode: err?.code || 'TOOL_ERROR',
      });
      if (err?.status === 403) {
        facts.push({ summary: `Permission denied for ${step.name}.` });
        qualityLevels.push('INSUFFICIENT');
      } else if (err?.status === 404) {
        facts.push({ summary: 'Not found in authorised C1–C7 data.' });
        qualityLevels.push('INSUFFICIENT');
      } else {
        facts.push({ summary: `Tool ${step.name} failed: ${err?.message || 'error'}` });
        qualityLevels.push('LIMITED');
      }
    }
  }

  for (const u of plan.unavailable || []) {
    facts.push({ summary: u });
  }
  for (const u of plan.uncertainties) {
    facts.push({ summary: u });
  }

  if (!facts.length) {
    facts.push({ summary: 'Insufficient verified data.' });
    qualityLevels.push('INSUFFICIENT');
  }

  const synthesis = await synthesizeAnswer({
    provider,
    question: body.question,
    facts,
    intent: plan.intent,
  });

  const answer: AssistantAnswer = {
    mode: proposedAction ? 'PROPOSE' : 'READ_ONLY',
    providerStatus: provider.status,
    intent: plan.intent,
    kinds: [
      'FACT',
      'SYSTEM_EVIDENCE',
      ...(synthesis.kind === 'AI_GENERATED_SUMMARY' ? (['AI_GENERATED_SUMMARY'] as const) : []),
      ...(proposedAction ? (['DRAFT_ACTION'] as const) : []),
      ...(qualityLevels.includes('INSUFFICIENT') ? (['UNCERTAINTY'] as const) : []),
    ],
    summary: synthesis.text,
    facts,
    evidence,
    sources: dedupeSources(sources),
    dataQuality: {
      level: mergeQuality(qualityLevels),
      reasons: Array.from(new Set(qualityReasons)).slice(0, 8),
    },
    toolsUsed,
    proposedAction,
    uncertainties: [...plan.uncertainties, ...(plan.unavailable || [])],
    followUps: buildFollowUps(plan.intent),
  };

  await recordAudit({
    actor,
    sessionId: session.id,
    intent: plan.intent,
    questionSafe,
    toolsUsed,
    sourceReferences: evidence,
    actionProposed: proposedAction?.actionType ?? null,
    actionConfirmed: null,
    providerStatus: provider.status,
    providerModel: provider.modelId,
    latencyMs: Date.now() - started,
    providerLatencyMs: synthesis.providerLatencyMs,
  });
  await recordTelemetry(actor.collegeId, 'assistant_request', {
    intent: plan.intent,
    latencyMs: Date.now() - started,
    success: true,
  });
  await persistMessages(actor, session.id, body.question, answer);
  return { ...answer, sessionId: Number(session.id) };
}

function dedupeSources(sources: AssistantAnswer['sources']) {
  const seen = new Set<string>();
  const out: AssistantAnswer['sources'] = [];
  for (const s of sources) {
    const key = `${s.type}:${s.href || s.label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function buildFollowUps(intent: string): string[] {
  switch (intent) {
    case 'IMPACT':
      return ['Which impact areas have weak evidence?', 'Show alumni-supported internship outcomes with evidence.'];
    case 'MATCH_OR_SEARCH':
      return ['Why was this alumnus suggested?', 'Which open institutional needs still have no suitable alumni?'];
    case 'DATA_QUALITY':
      return ['Which alumni profiles should we refresh?', 'Which outcomes lack beneficiary linkage?'];
    default:
      return [
        'Which alumni records need career-data refresh?',
        'What measurable alumni impact did this department have?',
      ];
  }
}

async function persistMessages(actor: AlumniAdminActor, sessionId: number, question: string, answer: AssistantAnswer) {
  if (!(await db.schema.hasTable('alumni_assistant_messages'))) return;
  await db('alumni_assistant_messages').insert([
    {
      college_id: actor.collegeId,
      session_id: sessionId,
      role: 'USER',
      content: question.slice(0, 4000),
      structured_payload: null,
    },
    {
      college_id: actor.collegeId,
      session_id: sessionId,
      role: 'ASSISTANT',
      content: answer.summary.slice(0, 8000),
      structured_payload: JSON.stringify({
        intent: answer.intent,
        toolsUsed: answer.toolsUsed,
        evidence: answer.evidence,
        sources: answer.sources,
        dataQuality: answer.dataQuality,
        kinds: answer.kinds,
        providerStatus: answer.providerStatus,
        proposedAction: answer.proposedAction,
      }),
    },
  ]);
}

export async function getWorkspace(actor: AlumniAdminActor) {
  assertAccess(actor);
  const status = await getProviderStatus(actor);
  return {
    view: 'ASSISTANT',
    title: 'Alumni Intelligence Assistant',
    mode: 'READ_ONLY',
    provider: status,
    suggestedQueries: [
      'Which verified alumni could mentor final-year ISE students in cybersecurity?',
      'Find alumni suitable for an AI expert session next month.',
      'Which alumni have explicitly shown willingness to support recruitment?',
      'Which alumni have repeatedly contributed but have received no recent institutional recognition?',
      'What measurable alumni impact did ISE have during the current academic year?',
      'How many students benefited from alumni mentorship?',
      'Show alumni-supported internship outcomes with evidence.',
      'Which alumni records need career-data refresh?',
      'What alumni evidence gaps exist for accreditation?',
      'Which open institutional needs still have no suitable alumni?',
    ],
    distinctions: ['FACT', 'SYSTEM_EVIDENCE', 'AI_GENERATED_SUMMARY', 'DRAFT_ACTION'],
    limitations: KNOWN_LIMITATIONS_C8,
    toolCount: TOOL_REGISTRY.length,
  };
}

export async function listSessionMessages(actor: AlumniAdminActor, sessionId: number) {
  await requireTables();
  assertAccess(actor);
  const session = await db('alumni_assistant_sessions')
    .where({ id: sessionId, college_id: actor.collegeId, faculty_user_id: actor.facultyUserId })
    .first();
  if (!session) throw new AppError(404, 'Session not found');
  const rows = await db('alumni_assistant_messages').where({ session_id: sessionId }).orderBy('id', 'asc').limit(100);
  return {
    sessionId,
    messages: rows.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      payload: r.structured_payload ? JSON.parse(r.structured_payload) : null,
      createdAt: r.created_at,
    })),
  };
}
