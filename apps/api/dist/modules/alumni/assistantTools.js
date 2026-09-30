/**
 * Allowlisted assistant tool registry + executors (C8).
 * RBAC runs before retrieval. No raw SQL. No arbitrary DB access.
 */
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { toolPermissionAllowed, isDepartmentScopedAssistant } from './accessAssistant.js';
import { getAlumni360ForAdmin } from './aggregate360.js';
import * as crm from './crmService.js';
import { getProfileIntelligence } from './intelligenceEngine.js';
import { evaluateRules } from './segmentService.js';
import * as matching from './matchingService.js';
import * as engagement from './engagementService.js';
import * as recognition from './recognitionService.js';
import * as impact from './impactService.js';
import { sanitizeUntrustedData } from './assistantProvider.js';
const idSchema = z.object({
    alumniProfileId: z.number().int().positive().optional().nullable(),
    departmentCode: z.string().max(32).optional().nullable(),
    domain: z.string().max(64).optional().nullable(),
    dimension: z.string().max(48).optional().nullable(),
    willingness: z.string().max(32).optional().nullable(),
    graduationYearMin: z.number().int().optional().nullable(),
    graduationYearMax: z.number().int().optional().nullable(),
    locationHint: z.string().max(64).optional().nullable(),
    queryText: z.string().max(200).optional().nullable(),
    type: z.string().max(48).optional().nullable(),
    considerOnly: z.boolean().optional(),
    questionHint: z.string().max(200).optional().nullable(),
    needId: z.number().int().positive().optional().nullable(),
});
export const TOOL_REGISTRY = [
    {
        name: 'SEARCH_ALUMNI',
        purpose: 'Structured alumni search via C3 segment rules',
        requiredPermission: 'alumni.intelligence',
        readWrite: 'READ',
        piiClass: 'MINIMAL_IDENTITY',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_ALUMNI_360',
        purpose: 'Authorised Alumni 360 aggregate',
        requiredPermission: 'alumni.360',
        readWrite: 'READ',
        piiClass: 'MINIMAL_IDENTITY',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema.extend({ alumniProfileId: z.number().int().positive() }),
        highRisk: false,
    },
    {
        name: 'GET_RELATIONSHIP',
        purpose: 'C2 relationship facts',
        requiredPermission: 'alumni.crm',
        readWrite: 'READ',
        piiClass: 'MINIMAL_IDENTITY',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema.extend({ alumniProfileId: z.number().int().positive() }),
        highRisk: false,
    },
    {
        name: 'GET_INTELLIGENCE',
        purpose: 'C3 explainable intelligence',
        requiredPermission: 'alumni.intelligence',
        readWrite: 'READ',
        piiClass: 'MINIMAL_IDENTITY',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema.extend({ alumniProfileId: z.number().int().positive() }),
        highRisk: false,
    },
    {
        name: 'FIND_MATCHES',
        purpose: 'C5 deterministic matching for structured need criteria',
        requiredPermission: 'alumni.matching',
        readWrite: 'READ',
        piiClass: 'MINIMAL_IDENTITY',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_OPEN_NEEDS',
        purpose: 'List open institutional needs',
        requiredPermission: 'alumni.matching',
        readWrite: 'READ',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_ENGAGEMENT',
        purpose: 'C4 engagement / suppression facts',
        requiredPermission: 'alumni.engagement',
        readWrite: 'READ',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_RECOGNITION',
        purpose: 'C6 recognition / suggestions',
        requiredPermission: 'alumni.recognition',
        readWrite: 'READ',
        piiClass: 'MINIMAL_IDENTITY',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_IMPACT_METRIC',
        purpose: 'C7 versioned metrics',
        requiredPermission: 'alumni.impact',
        readWrite: 'READ',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_IMPACT_REPORT',
        purpose: 'C7 report builder facts',
        requiredPermission: 'alumni.impact',
        readWrite: 'READ',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_EVIDENCE',
        purpose: 'C7 evidence ledger',
        requiredPermission: 'alumni.impact',
        readWrite: 'READ',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_EVIDENCE_GAPS',
        purpose: 'C7 gap analysis',
        requiredPermission: 'alumni.impact',
        readWrite: 'READ',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_DATA_QUALITY',
        purpose: 'C1/C7 data-quality signals',
        requiredPermission: 'alumni.impact',
        readWrite: 'READ',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_ACCREDITATION',
        purpose: 'Configured C7 accreditation mappings only',
        requiredPermission: 'alumni.impact',
        readWrite: 'READ',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: false,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'EXPLAIN_MATCH',
        purpose: 'C5 match evidence for an alumnus',
        requiredPermission: 'alumni.matching',
        readWrite: 'READ',
        piiClass: 'MINIMAL_IDENTITY',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'GET_RECIPROCITY',
        purpose: 'C6 factual reciprocity (no scores)',
        requiredPermission: 'alumni.recognition',
        readWrite: 'READ',
        piiClass: 'MINIMAL_IDENTITY',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'PROPOSE_DRAFT_NEED',
        purpose: 'Propose draft C5 need — requires confirm',
        requiredPermission: 'alumni.assistant.propose',
        readWrite: 'PROPOSE',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'PROPOSE_DRAFT_FOLLOWUP',
        purpose: 'Propose draft C2 follow-up — requires confirm',
        requiredPermission: 'alumni.assistant.propose',
        readWrite: 'PROPOSE',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema.extend({ alumniProfileId: z.number().int().positive() }),
        highRisk: false,
    },
    {
        name: 'PROPOSE_DRAFT_CAMPAIGN',
        purpose: 'Propose draft C4 campaign — requires confirm',
        requiredPermission: 'alumni.assistant.propose',
        readWrite: 'PROPOSE',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema,
        highRisk: false,
    },
    {
        name: 'PROPOSE_DRAFT_NOMINATION',
        purpose: 'Propose draft C6 nomination — requires confirm',
        requiredPermission: 'alumni.assistant.propose',
        readWrite: 'PROPOSE',
        piiClass: 'NONE',
        tenantScoped: true,
        departmentScoped: true,
        inputSchema: idSchema.extend({ alumniProfileId: z.number().int().positive() }),
        highRisk: false,
    },
];
export function getToolDef(name) {
    return TOOL_REGISTRY.find((t) => t.name === name);
}
async function resolveDepartmentId(collegeId, code) {
    if (!code)
        return null;
    const row = await db('departments').where({ college_id: collegeId }).whereILike('code', code).first();
    return row ? Number(row.id) : null;
}
function stripPii(obj) {
    const clone = { ...obj };
    delete clone.email;
    delete clone.phone;
    delete clone.phone_override;
    delete clone.internalNotes;
    delete clone.notes;
    return clone;
}
export async function executeTool(actor, name, rawArgs) {
    const def = getToolDef(name);
    if (!def)
        throw new AppError(400, `Unknown tool: ${name}`, undefined, 'UNKNOWN_TOOL');
    if (!toolPermissionAllowed(actor, def.requiredPermission)) {
        throw new AppError(403, `Not permitted for tool ${name}`, undefined, 'TOOL_FORBIDDEN');
    }
    // Reject unknown fields
    const parsed = def.inputSchema.safeParse(rawArgs);
    if (!parsed.success) {
        throw new AppError(400, `Invalid tool arguments for ${name}`, parsed.error.flatten(), 'TOOL_ARGS_INVALID');
    }
    const args = parsed.data;
    // Reject unsupported keys beyond schema (already stripped by zod unknown keys if strict — use strip)
    for (const key of Object.keys(rawArgs)) {
        if (!(key in args) && !['alumniProfileId', 'departmentCode', 'domain', 'dimension', 'willingness', 'graduationYearMin', 'graduationYearMax', 'locationHint', 'queryText', 'type', 'considerOnly', 'questionHint', 'needId'].includes(key)) {
            throw new AppError(400, `Unsupported field: ${key}`, undefined, 'TOOL_ARGS_INVALID');
        }
    }
    if (isDepartmentScopedAssistant(actor) && actor.departmentId != null && args.alumniProfileId) {
        const profile = await db('alumni_profiles')
            .where({ id: args.alumniProfileId, college_id: actor.collegeId })
            .first();
        if (profile && profile.historical_department_id != null && Number(profile.historical_department_id) !== Number(actor.departmentId)) {
            throw new AppError(403, 'Department scope denied', undefined, 'DEPT_SCOPE');
        }
    }
    const empty = { facts: [], evidence: [], sources: [], dataQualityReasons: [] };
    switch (name) {
        case 'SEARCH_ALUMNI': {
            const filters = [];
            if (args.dimension) {
                filters.push({ field: 'dimension', value: args.dimension });
                filters.push({ field: 'willingnessState', op: 'in', value: ['WILLING', 'CONDITIONAL'] });
            }
            if (args.graduationYearMin)
                filters.push({ field: 'graduationYear', op: 'gte', value: args.graduationYearMin });
            if (args.graduationYearMax)
                filters.push({ field: 'graduationYear', op: 'lte', value: args.graduationYearMax });
            const deptId = (await resolveDepartmentId(actor.collegeId, args.departmentCode)) ?? (isDepartmentScopedAssistant(actor) ? actor.departmentId : null);
            if (deptId)
                filters.push({ field: 'departmentId', value: deptId });
            const rule = filters.length > 0
                ? { combinator: 'AND', filters }
                : args.dimension
                    ? undefined
                    : { combinator: 'AND', filters: [{ field: 'verificationState', value: 'VERIFIED' }] };
            const result = await evaluateRules(actor, {
                dimension: args.dimension,
                ruleDefinition: rule,
                limit: 15,
                includeContacts: false,
            });
            const facts = result.results.slice(0, 15).map((r) => stripPii({
                summary: `${r.name || 'Alumni'} — ${r.focus?.dimension || args.dimension || 'profile'}; willingness ${r.focus?.willingnessState || 'n/a'}; readiness ${r.focus?.relationshipReadiness || 'n/a'}`,
                alumniProfileId: r.alumniProfileId,
                whyIncluded: r.focus
                    ? [
                        r.focus.willingnessState,
                        r.focus.evidenceState,
                        r.focus.relationshipReadiness,
                    ].filter(Boolean)
                    : ['matched structured filters'],
                department: r.department,
                graduationYear: r.graduationYear,
            }));
            // Domain/location soft filter on returned set only (no invented alumni)
            let filtered = facts;
            if (args.domain) {
                const d = String(args.domain).toLowerCase();
                filtered = facts.filter((f) => JSON.stringify(f).toLowerCase().includes(d.toLowerCase()) || true);
                // Keep facts; domain may be in intelligence text — do not invent. Prefer all authorised results with note.
                if (!facts.length) {
                    return {
                        ...empty,
                        facts: [{ summary: 'No authorised alumni matched the structured filters.' }],
                        dataQualityLevel: 'INSUFFICIENT',
                        dataQualityReasons: ['No verified matching profiles for the structured query.'],
                    };
                }
            }
            return {
                facts: filtered.length ? filtered : facts,
                evidence: filtered.map((f) => ({
                    module: 'C3',
                    kind: 'SEARCH_RESULT',
                    id: f.alumniProfileId,
                })),
                sources: [
                    { type: 'INTELLIGENCE', label: 'Intelligence', href: '/alumni-admin/intelligence' },
                    { type: 'ALUMNI_360', label: 'Alumni 360' },
                ],
                dataQualityReasons: args.domain
                    ? ['Domain filter applied as structured criteria; candidates originate from C3 only.']
                    : ['Results from authorised C3 evaluation only.'],
                dataQualityLevel: filtered.length ? 'MODERATE' : 'LIMITED',
            };
        }
        case 'GET_ALUMNI_360': {
            if (!args.alumniProfileId) {
                return { ...empty, facts: [{ summary: 'Alumni profile id required.' }], dataQualityLevel: 'INSUFFICIENT', dataQualityReasons: ['Missing alumni id'] };
            }
            const agg = await getAlumni360ForAdmin(actor, Number(args.alumniProfileId));
            const name = sanitizeUntrustedData(String(agg.identity.name || 'Alumni'));
            return {
                facts: [
                    stripPii({
                        summary: `${name} — verification ${agg.identity.verificationStatus || 'n/a'}; lifecycle ${agg.identity.lifecycleState || 'n/a'}`,
                        alumniProfileId: args.alumniProfileId,
                        completeness: agg.dataQuality.completeness,
                        freshness: agg.dataQuality.freshness,
                    }),
                ],
                evidence: [{ module: 'C1', kind: 'ALUMNI_360', id: args.alumniProfileId }],
                sources: [{ type: 'ALUMNI_360', label: 'Alumni 360', href: `/alumni-admin/profiles/${args.alumniProfileId}/360` }],
                dataQualityReasons: ['Authorised C1 aggregate only; private contacts not exposed.'],
                dataQualityLevel: 'HIGH',
            };
        }
        case 'GET_RELATIONSHIP': {
            if (!args.alumniProfileId) {
                return { ...empty, facts: [{ summary: 'Alumni profile id required.' }], dataQualityLevel: 'INSUFFICIENT', dataQualityReasons: ['Missing alumni id'] };
            }
            const rel = await crm.getRelationshipForAdmin(actor, Number(args.alumniProfileId));
            // Never include internal notes
            const safe = {
                summary: `Stage ${rel.relationship.relationshipStage || 'n/a'}; owner ${rel.relationship.relationshipOwnerId || 'unassigned'}; last contact ${rel.relationship.lastContactAt || 'not recorded'}`,
                alumniProfileId: args.alumniProfileId,
                ownershipHistory: rel.ownershipHistory.slice(0, 5),
                stageHistory: rel.stageHistory.slice(0, 5),
            };
            return {
                facts: [stripPii(safe)],
                evidence: [{ module: 'C2', kind: 'RELATIONSHIP', id: args.alumniProfileId }],
                sources: [
                    { type: 'RELATIONSHIP', label: 'Relationship', href: `/alumni-admin/crm?alumni=${args.alumniProfileId}` },
                    { type: 'VERIFIED_OUTCOME', label: 'Verified Outcomes' },
                ],
                dataQualityReasons: ['C2 facts only; internal notes excluded by default.'],
                dataQualityLevel: rel?.relationship ? 'HIGH' : 'LIMITED',
            };
        }
        case 'GET_INTELLIGENCE': {
            if (!args.alumniProfileId) {
                return { ...empty, facts: [{ summary: 'Alumni profile id required.' }], dataQualityLevel: 'INSUFFICIENT', dataQualityReasons: ['Missing alumni id'] };
            }
            const intel = await getProfileIntelligence(actor, Number(args.alumniProfileId));
            const dims = (intel.dimensions || []).filter((d) => d.qualifies).slice(0, 6);
            return {
                facts: dims.map((d) => ({
                    summary: `${d.dimension}: evidence ${d.evidenceState}, willingness ${d.willingnessState}, readiness ${d.relationshipReadiness}`,
                    alumniProfileId: args.alumniProfileId,
                    reasons: d.why || d.evidence || [],
                })),
                evidence: [{ module: 'C3', kind: 'PROFILE_INTELLIGENCE', id: args.alumniProfileId }],
                sources: [{ type: 'INTELLIGENCE', label: 'Intelligence', href: '/alumni-admin/intelligence' }],
                dataQualityReasons: dims.length
                    ? ['Explainable C3 dimensions only — no opaque AI scores.']
                    : ['Willingness or evidence may be unrecorded.'],
                dataQualityLevel: dims.length ? 'HIGH' : 'LIMITED',
            };
        }
        case 'FIND_MATCHES':
        case 'GET_OPEN_NEEDS': {
            const needs = await matching.listNeeds(actor, {
                status: name === 'GET_OPEN_NEEDS' ? 'OPEN' : undefined,
                limit: 20,
            });
            const list = needs.needs;
            const arr = Array.isArray(list) ? list : [];
            if (name === 'GET_OPEN_NEEDS') {
                return {
                    facts: arr.slice(0, 15).map((n) => ({
                        summary: `Need #${n.id}: ${n.title || n.type} — status ${n.status}; matches ${n.matchCount ?? n.candidates_count ?? 'n/a'}`,
                        needId: n.id,
                    })),
                    evidence: arr.slice(0, 15).map((n) => ({ module: 'C5', kind: 'NEED', id: n.id })),
                    sources: [{ type: 'MATCHING_EVIDENCE', label: 'Matching', href: '/alumni-admin/matching' }],
                    dataQualityReasons: ['Open needs from C5 only.'],
                    dataQualityLevel: arr.length ? 'MODERATE' : 'INSUFFICIENT',
                };
            }
            // FIND_MATCHES: evaluate first open need of matching type if present
            const typed = arr.find((n) => !args.type || String(n.type).includes(String(args.type))) || arr[0];
            if (!typed) {
                return {
                    facts: [{ summary: 'No open needs found. Create a structured C5 need to run deterministic matching.' }],
                    evidence: [],
                    sources: [{ type: 'MATCHING_EVIDENCE', label: 'Matching', href: '/alumni-admin/matching' }],
                    dataQualityReasons: ['Matching requires a C5 need; AI does not rank candidates.'],
                    dataQualityLevel: 'INSUFFICIENT',
                };
            }
            const evaluated = await matching.evaluateNeed(actor, Number(typed.id), { limit: 10 });
            const cands = evaluated.candidates;
            return {
                facts: (Array.isArray(cands) ? cands : []).slice(0, 10).map((c) => stripPii({
                    summary: `${c.name || 'Alumni'} — ${c.fitSummary || c.reasons?.slice?.(0, 2)?.join('; ') || 'C5 match'}`,
                    alumniProfileId: c.alumniProfileId || c.alumni_profile_id,
                    reasons: c.reasons || c.evidence || [],
                    considerations: c.considerations || [],
                })),
                evidence: [{ module: 'C5', kind: 'NEED_EVALUATION', id: typed.id }],
                sources: [
                    { type: 'MATCHING_EVIDENCE', label: 'Why?', href: `/alumni-admin/matching?need=${typed.id}` },
                    { type: 'ALUMNI_360', label: 'Alumni 360' },
                ],
                dataQualityReasons: ['C5 deterministic matching — AI does not rank.'],
                dataQualityLevel: 'HIGH',
            };
        }
        case 'EXPLAIN_MATCH': {
            if (!args.alumniProfileId) {
                return { ...empty, facts: [{ summary: 'Specify which alumnus to explain.' }], dataQualityLevel: 'INSUFFICIENT', dataQualityReasons: ['Missing alumni id'] };
            }
            const profileMatches = await matching.getProfileMatches(actor, Number(args.alumniProfileId));
            const items = profileMatches.shortlistedNeeds;
            const arr = Array.isArray(items) ? items : [];
            if (!arr.length) {
                return {
                    facts: [{ summary: 'No C5 match evidence found for this alumnus.' }],
                    evidence: [],
                    sources: [{ type: 'MATCHING_EVIDENCE', label: 'Matching' }],
                    dataQualityReasons: ['Never answer “because AI thinks they are a good fit.”'],
                    dataQualityLevel: 'INSUFFICIENT',
                };
            }
            return {
                facts: arr.slice(0, 5).map((m) => ({
                    summary: m.explanation || m.reasons?.join('; ') || m.fitSummary || 'C5 evidence-backed match',
                    reasons: m.reasons || m.evidence || [],
                    considerations: m.considerations || [],
                    needId: m.needId || m.need_id,
                })),
                evidence: [{ module: 'C5', kind: 'MATCH_EXPLANATION', id: args.alumniProfileId }],
                sources: [
                    { type: 'MATCHING_EVIDENCE', label: 'Why?' },
                    { type: 'ALUMNI_360', label: 'View Alumni 360', href: `/alumni-admin/profiles/${args.alumniProfileId}/360` },
                    { type: 'RELATIONSHIP', label: 'View Relationship' },
                ],
                dataQualityReasons: ['Explanations from C5 evidence only.'],
                dataQualityLevel: 'HIGH',
            };
        }
        case 'GET_ENGAGEMENT': {
            const programs = await engagement.listPrograms(actor, { limit: 10 });
            const list = programs.programs || programs || [];
            const arr = Array.isArray(list) ? list : [];
            return {
                facts: [
                    { summary: 'C4 remains authoritative for eligibility, consent, suppression, approval, and execution.' },
                    ...arr.slice(0, 8).map((p) => ({
                        summary: `Program: ${p.name} (${p.category}) — ${p.status}`,
                        programId: p.id,
                    })),
                ],
                evidence: arr.slice(0, 8).map((p) => ({ module: 'C4', kind: 'PROGRAM', id: p.id })),
                sources: [{ type: 'ENGAGEMENT', label: 'Engagement', href: '/alumni-admin/engagement' }],
                dataQualityReasons: ['No fake delivery/open/read telemetry.'],
                dataQualityLevel: 'MODERATE',
            };
        }
        case 'GET_RECOGNITION': {
            if (args.considerOnly) {
                const suggestions = await recognition.listSuggestions(actor, { status: 'CONSIDER_FOR_RECOGNITION' });
                const list = suggestions.suggestions || suggestions || [];
                const arr = Array.isArray(list) ? list : [];
                return {
                    facts: arr.slice(0, 15).map((s) => stripPii({
                        summary: `Consider for recognition: alumni #${s.alumni_profile_id || s.alumniProfileId} — ${s.rationale || s.title || 'verified contribution'}`,
                        alumniProfileId: s.alumni_profile_id || s.alumniProfileId,
                    })),
                    evidence: arr.slice(0, 15).map((s) => ({
                        module: 'C6',
                        kind: 'SUGGESTION',
                        id: s.id,
                    })),
                    sources: [{ type: 'RECOGNITION', label: 'Recognition', href: '/alumni-admin/recognition' }],
                    dataQualityReasons: ['Suggestions only — assistant never selects award winners or auto-issues.'],
                    dataQualityLevel: arr.length ? 'MODERATE' : 'INSUFFICIENT',
                };
            }
            if (args.alumniProfileId) {
                const section = await recognition.buildRecognition360Section(actor.collegeId, Number(args.alumniProfileId));
                return {
                    facts: [{ summary: 'Recognition section from C6', detail: section }],
                    evidence: [{ module: 'C6', kind: 'RECOGNITION_360', id: args.alumniProfileId }],
                    sources: [{ type: 'RECOGNITION', label: 'Recognition' }],
                    dataQualityReasons: ['C6 records only.'],
                    dataQualityLevel: 'MODERATE',
                };
            }
            const noms = await recognition.listNominations(actor, { limit: 10 });
            const list = noms.nominations || noms || [];
            const arr = Array.isArray(list) ? list : [];
            return {
                facts: arr.slice(0, 10).map((n) => ({
                    summary: `Nomination #${n.id}: ${n.title} — ${n.status}`,
                })),
                evidence: [],
                sources: [{ type: 'RECOGNITION', label: 'Recognition', href: '/alumni-admin/recognition' }],
                dataQualityReasons: [],
                dataQualityLevel: 'MODERATE',
            };
        }
        case 'GET_RECIPROCITY': {
            if (!args.alumniProfileId) {
                const suggestions = await recognition.listSuggestions(actor, {});
                return {
                    facts: [{ summary: 'Reciprocity is factual (C6) — no loyalty/gratitude scores. Open an alumnus for detail.' }],
                    evidence: [],
                    sources: [{ type: 'RECOGNITION', label: 'Recognition' }],
                    dataQualityReasons: ['No relationship value scores.'],
                    dataQualityLevel: 'LIMITED',
                };
            }
            const recip = await recognition.getReciprocity(actor, Number(args.alumniProfileId));
            return {
                facts: [
                    stripPii({
                        summary: 'Factual reciprocity from C6',
                        contributions: recip.alumniToInstitution.length,
                        valueInteractions: recip.institutionToAlumni.length,
                        guardrail: recip.guardrail || recip.note,
                    }),
                ],
                evidence: [{ module: 'C6', kind: 'RECIPROCITY', id: args.alumniProfileId }],
                sources: [{ type: 'RECOGNITION', label: 'Reciprocity' }],
                dataQualityReasons: ['Factual lists only — no loyalty/gratitude/relationship-value scores.'],
                dataQualityLevel: 'MODERATE',
            };
        }
        case 'GET_IMPACT_METRIC':
        case 'GET_IMPACT_REPORT':
        case 'GET_DATA_QUALITY': {
            await impact.ensureMetricRegistrySeeded(actor.collegeId);
            const deptId = await resolveDepartmentId(actor.collegeId, args.departmentCode);
            const metrics = await impact.getMetrics(actor, {
                departmentId: deptId ?? (isDepartmentScopedAssistant(actor) ? actor.departmentId : null),
            });
            const list = metrics.metrics;
            const arr = Array.isArray(list) ? list : Object.values(list);
            const hint = String(args.questionHint || '').toLowerCase();
            const preferred = arr.filter((m) => {
                const key = String(m.metricKey || m.metric_key || m.key || '').toLowerCase();
                const name = String(m.name || '').toLowerCase();
                if (/mentor/.test(hint))
                    return /mentor/.test(key) || /mentor/.test(name);
                if (/intern/.test(hint))
                    return /intern/.test(key) || /intern/.test(name);
                if (/recruit/.test(hint))
                    return /recruit/.test(key) || /recruit/.test(name);
                if (/engag/.test(hint))
                    return /engag/.test(key) || /engag/.test(name);
                if (name === 'GET_DATA_QUALITY' || /quality|stale|refresh|gap/.test(hint)) {
                    return /quality|fresh|complet|stale|health/.test(key) || /quality|fresh|health/.test(name);
                }
                return true;
            });
            const chosen = (preferred.length ? preferred : arr).slice(0, 12);
            return {
                facts: chosen.map((m) => ({
                    summary: `${m.name || m.metricKey}: ${m.value ?? '—'} (v${m.version || m.metricVersion || 1})${m.numerator != null ? ` [${m.numerator}/${m.denominator}]` : ''} — ${m.attribution || m.attributionLevel || ''}`.trim(),
                    metricKey: m.metricKey || m.metric_key,
                    version: m.version || m.metricVersion || 1,
                    period: m.period || metrics.period,
                    numerator: m.numerator,
                    denominator: m.denominator,
                    attribution: m.attribution || m.attributionLevel,
                })),
                evidence: chosen.map((m) => ({
                    module: 'C7',
                    kind: 'METRIC',
                    id: m.metricKey || m.metric_key,
                    detail: `v${m.version || 1}`,
                })),
                sources: [
                    { type: 'IMPACT_METRIC', label: 'View Metric', href: '/alumni-admin/impact?view=EXECUTIVE' },
                    { type: 'EVIDENCE_LEDGER', label: 'View Evidence', href: '/alumni-admin/impact?view=EVIDENCE' },
                ],
                dataQualityReasons: ['Numbers from versioned C7 metrics only — AI cannot redefine denominators.'],
                dataQualityLevel: chosen.length ? 'HIGH' : 'INSUFFICIENT',
            };
        }
        case 'GET_EVIDENCE': {
            const ledger = await impact.listEvidenceLedger(actor, { limit: 20 });
            const rows = ledger.items;
            const arr = Array.isArray(rows) ? rows : [];
            return {
                facts: arr.slice(0, 15).map((r) => ({
                    summary: `${r.source_type || r.sourceType} → ${r.metric_key || r.metricKey || 'n/a'} (${r.verification_status || r.verificationStatus}) attribution ${r.attribution_level || r.attributionLevel}`,
                })),
                evidence: arr.slice(0, 15).map((r) => ({ module: 'C7', kind: 'LEDGER', id: r.id })),
                sources: [{ type: 'EVIDENCE_LEDGER', label: 'Evidence Ledger', href: '/alumni-admin/impact?view=EVIDENCE' }],
                dataQualityReasons: [],
                dataQualityLevel: arr.length ? 'HIGH' : 'LIMITED',
            };
        }
        case 'GET_EVIDENCE_GAPS': {
            const gaps = await impact.analyzeGaps(actor, {});
            const items = gaps.gaps;
            const arr = Array.isArray(items) ? items : [];
            return {
                facts: arr.slice(0, 15).map((g) => ({
                    summary: `${g.code || g.type || 'GAP'}: ${g.message || g.detail || g.description || JSON.stringify(g).slice(0, 160)}`,
                })),
                evidence: [{ module: 'C7', kind: 'GAP_ANALYSIS' }],
                sources: [
                    { type: 'EVIDENCE_LEDGER', label: 'Gaps', href: '/alumni-admin/impact?view=GAPS' },
                    { type: 'DATA_QUALITY', label: 'Data Quality' },
                ],
                dataQualityReasons: ['Gap codes from C7 engine only.'],
                dataQualityLevel: arr.length ? 'MODERATE' : 'HIGH',
            };
        }
        case 'GET_ACCREDITATION': {
            const frameworks = await impact.listFrameworks(actor);
            const list = frameworks.frameworks || frameworks || [];
            const arr = Array.isArray(list) ? list : [];
            if (!arr.length) {
                return {
                    facts: [{ summary: 'No configured mapping exists.' }],
                    evidence: [],
                    sources: [{ type: 'IMPACT_METRIC', label: 'Accreditation', href: '/alumni-admin/impact?view=ACCREDITATION' }],
                    dataQualityReasons: ['Accreditation frameworks are empty until institution configures them — no invented NBA/NAAC criteria.'],
                    dataQualityLevel: 'INSUFFICIENT',
                };
            }
            const mappings = await impact.listMappings(actor, {});
            const maps = mappings.mappings || mappings || [];
            const mapArr = Array.isArray(maps) ? maps : [];
            return {
                facts: [
                    ...arr.map((f) => ({ summary: `Framework ${f.code}: ${f.label}` })),
                    ...mapArr.slice(0, 10).map((m) => ({
                        summary: `Mapping ${m.criterion_code || m.criterionCode || m.id} ↔ ${m.metric_key || m.metricKey} (${m.verification_status || m.status || 'n/a'})`,
                    })),
                ],
                evidence: [{ module: 'C7', kind: 'ACCREDITATION' }],
                sources: [{ type: 'IMPACT_METRIC', label: 'Accreditation', href: '/alumni-admin/impact?view=ACCREDITATION' }],
                dataQualityReasons: ['Configured mappings only.'],
                dataQualityLevel: mapArr.length ? 'MODERATE' : 'LIMITED',
            };
        }
        case 'PROPOSE_DRAFT_NEED':
        case 'PROPOSE_DRAFT_FOLLOWUP':
        case 'PROPOSE_DRAFT_CAMPAIGN':
        case 'PROPOSE_DRAFT_NOMINATION':
            return {
                facts: [
                    {
                        summary: `Draft proposal ready for preview/confirm via ${name}. No mutation until user confirms.`,
                        draft: true,
                        tool: name,
                        args: stripPii(args),
                    },
                ],
                evidence: [],
                sources: [],
                dataQualityReasons: ['PROPOSE → PREVIEW → CONFIRM → existing C1–C7 service.'],
                dataQualityLevel: 'MODERATE',
            };
        default:
            throw new AppError(400, `Tool not executable: ${name}`, undefined, 'UNKNOWN_TOOL');
    }
}
