/**
 * Alumni Intelligence operational workspace (C3).
 */
import { db } from '../../db/index.js';
import type { AlumniAdminActor } from './service.js';
import { assertIntelligenceAccess, buildProfileIntelligence, loadSignalBundlesBatch } from './intelligenceEngine.js';
import { evaluateRules, listSegments } from './segmentService.js';
import { INTELLIGENCE_DIMENSIONS, WORKSPACE_VIEWS, type IntelligenceDimension } from './typesIntelligence.js';
import { isDepartmentScoped } from './accessIntelligence.js';

const VIEW_DIMENSION: Record<string, IntelligenceDimension | null> = {
  MENTORSHIP: 'MENTORSHIP',
  RECRUITMENT: 'RECRUITMENT',
  INTERNSHIPS: 'INTERNSHIP',
  EXPERTS: 'EXPERT_SESSION',
  PROJECTS: 'PROJECT_MENTORING',
  RESEARCH: 'RESEARCH_COLLABORATION',
  BOS: 'BOS_ADVISORY',
  STARTUPS: 'STARTUP_SUPPORT',
  INDUSTRY_CONNECT: 'INDUSTRIAL_VISIT',
  REACTIVATION: null,
  DATA_REFRESH: null,
};

export async function getIntelligenceWorkspace(actor: AlumniAdminActor, query: Record<string, unknown> = {}) {
  assertIntelligenceAccess(actor);
  const view = String(query.view || 'MENTORSHIP').toUpperCase();
  const limit = Math.min(Number(query.limit ?? 50), 200);

  const { segments, presets } = await listSegments(actor);

  if (view === 'REACTIVATION') {
    const result = await evaluateRules(actor, {
      preset: 'DORMANT_HIGH_CAPABILITY',
      limit,
    });
    return {
      view,
      views: WORKSPACE_VIEWS,
      dimensions: INTELLIGENCE_DIMENSIONS,
      segments,
      presets,
      results: result.results,
      totalMatchedInWindow: result.totalMatchedInWindow,
      note: 'Dormant high-capability relationships — human review only; no automated outreach.',
    };
  }

  if (view === 'DATA_REFRESH') {
    const result = await evaluateRules(actor, {
      preset: 'NEEDS_DATA_REFRESH',
      limit,
    });
    return {
      view,
      views: WORKSPACE_VIEWS,
      dimensions: INTELLIGENCE_DIMENSIONS,
      segments,
      presets,
      results: result.results,
      totalMatchedInWindow: result.totalMatchedInWindow,
      note: 'Profiles with stale freshness domains requiring enrichment.',
    };
  }

  const dimension = VIEW_DIMENSION[view] || 'MENTORSHIP';
  const result = await evaluateRules(actor, { dimension, limit });

  return {
    view,
    views: WORKSPACE_VIEWS,
    dimensions: INTELLIGENCE_DIMENSIONS,
    segments,
    presets,
    focusDimension: dimension,
    results: result.results,
    totalMatchedInWindow: result.totalMatchedInWindow,
    truncated: result.truncated,
    note: 'Explainable opportunity fit — capability, willingness, and relationship readiness remain separate.',
  };
}

export async function getDimensionBoard(actor: AlumniAdminActor, dimension: IntelligenceDimension, query: Record<string, unknown> = {}) {
  assertIntelligenceAccess(actor);
  if (!INTELLIGENCE_DIMENSIONS.includes(dimension)) {
    return evaluateRules(actor, { dimension: 'OTHER', limit: Number(query.limit ?? 50) });
  }
  return evaluateRules(actor, {
    dimension,
    limit: Number(query.limit ?? 50),
    offset: Number(query.offset ?? 0),
    includeContacts: query.includeContacts === true || query.includeContacts === 'true',
  });
}

/** Lightweight matrix counts for workspace header (bounded sample). */
export async function getMatrixOverview(actor: AlumniAdminActor) {
  assertIntelligenceAccess(actor);
  let q = db('alumni_profiles as ap')
    .where('ap.college_id', actor.collegeId)
    .where('ap.is_active', true)
    .whereNot('ap.lifecycle_state', 'MERGED');
  if (isDepartmentScoped(actor) && actor.departmentId != null) {
    q = q.where('ap.historical_department_id', actor.departmentId);
  }
  const profiles = await q.select('ap.*').orderBy('ap.id', 'asc').limit(100);
  const bundles = await loadSignalBundlesBatch(actor.collegeId, profiles);
  const counts = {
    HIGH_EVIDENCE_WILLING: 0,
    HIGH_EVIDENCE_NOT_ASKED: 0,
    HIGH_EVIDENCE_NOT_WILLING: 0,
    LIMITED_EVIDENCE_WILLING: 0,
    INSUFFICIENT_DATA: 0,
    OTHER: 0,
    sampled: profiles.length,
  };
  for (const p of profiles) {
    const b = bundles.get(Number(p.id));
    if (!b) continue;
    const intel = buildProfileIntelligence(b);
    // Count priority cell across dimensions (prefer HIGH_EVIDENCE_WILLING)
    const cells = intel.dimensions.map((d) => d.capabilityIntentCell);
    if (cells.includes('HIGH_EVIDENCE_WILLING')) counts.HIGH_EVIDENCE_WILLING += 1;
    else if (cells.includes('HIGH_EVIDENCE_NOT_ASKED')) counts.HIGH_EVIDENCE_NOT_ASKED += 1;
    else if (cells.includes('LIMITED_EVIDENCE_WILLING')) counts.LIMITED_EVIDENCE_WILLING += 1;
    else if (cells.includes('HIGH_EVIDENCE_NOT_WILLING')) counts.HIGH_EVIDENCE_NOT_WILLING += 1;
    else if (cells.every((c) => c === 'INSUFFICIENT_DATA')) counts.INSUFFICIENT_DATA += 1;
    else counts.OTHER += 1;
  }
  return {
    matrix: counts,
    note: 'Sampled capability×intent overview for staff prioritisation — not an automated outreach queue.',
  };
}
