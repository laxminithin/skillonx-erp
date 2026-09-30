/**
 * Deterministic, explainable matching engine (C5).
 * Set-based — no per-alumnus Alumni 360 N+1, no opaque scores, no AI claims.
 * Capability is never treated as willingness.
 */
import { db } from '../../db/index.js';
import { isDepartmentScopedMatching } from './accessMatching.js';
import { evaluateEligibilityBatch } from './eligibility.js';
import { NEED_CAPABILITY_DOMAINS, NEED_ENGAGEMENT_CATEGORY, NEED_OPPORTUNITY_TYPES, NEED_OUTCOME_TYPES, NEED_WILLINGNESS_KEY, } from './typesMatching.js';
function parseJsonArr(raw) {
    if (raw == null)
        return [];
    if (Array.isArray(raw))
        return raw.map(String);
    if (typeof raw === 'string') {
        try {
            const v = JSON.parse(raw);
            return Array.isArray(v) ? v.map(String) : [];
        }
        catch {
            return raw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
        }
    }
    return [];
}
function norm(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/[^a-z0-9+#.\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}
function tokenOverlap(a, b) {
    const bset = new Set(b.map(norm).filter(Boolean));
    const hits = [];
    for (const x of a) {
        const n = norm(x);
        if (!n)
            continue;
        if (bset.has(n) || [...bset].some((t) => t.includes(n) || n.includes(t))) {
            hits.push(x);
        }
    }
    return hits;
}
function daysSince(d) {
    if (!d)
        return null;
    const t = new Date(String(d)).getTime();
    if (Number.isNaN(t))
        return null;
    return Math.floor((Date.now() - t) / 86400000);
}
function willingnessFromProfile(profile, needType) {
    if (profile?.temporary_unavailable_until) {
        const until = new Date(profile.temporary_unavailable_until).getTime();
        if (!Number.isNaN(until) && until > Date.now())
            return 'TEMPORARILY_UNAVAILABLE';
    }
    const key = NEED_WILLINGNESS_KEY[needType];
    if (!key)
        return 'NOT_ASKED';
    const v = profile?.[key];
    if (v === true || v === 1)
        return 'WILLING';
    if (v === false || v === 0)
        return 'NOT_WILLING';
    return 'NOT_ASKED';
}
function seniorityLooksStrong(s) {
    const n = norm(s);
    return /director|vp|vice president|head|principal|lead|manager|architect|founder|cxo|cto|ceo|cfo|partner/.test(n);
}
function expertiseBag(profile, employment) {
    const bag = [
        ...parseJsonArr(profile.domains_expertise),
        ...parseJsonArr(profile.technologies),
        ...parseJsonArr(profile.industry_expertise),
        ...parseJsonArr(profile.research_expertise),
        ...parseJsonArr(profile.certifications),
        ...parseJsonArr(profile.mentorship_areas),
        ...parseJsonArr(profile.interests),
    ];
    for (const e of employment) {
        if (e.industry)
            bag.push(String(e.industry));
        if (e.functional_area)
            bag.push(String(e.functional_area));
        if (e.designation)
            bag.push(String(e.designation));
        if (e.organization)
            bag.push(String(e.organization));
    }
    return bag;
}
/**
 * Load set-based signal bundles for a college (optionally limited profile IDs).
 */
export async function loadMatchingBundles(opts) {
    const { actor } = opts;
    let pq = db('alumni_profiles as ap')
        .where('ap.college_id', actor.collegeId)
        .where('ap.is_active', true)
        .whereIn('ap.verification_state', ['VERIFIED', 'APPROVED'])
        .select('ap.*');
    if (isDepartmentScopedMatching(actor) && actor.departmentId != null) {
        pq = pq.andWhere('ap.historical_department_id', actor.departmentId);
    }
    if (opts.alumniProfileIds?.length) {
        pq = pq.whereIn('ap.id', opts.alumniProfileIds);
    }
    else if (opts.limitProfiles) {
        pq = pq.limit(opts.limitProfiles);
    }
    const profiles = await pq;
    const ids = profiles.map((p) => Number(p.id));
    const map = new Map();
    if (!ids.length)
        return map;
    const [employment, capabilities, relationships, opportunities, outcomes, followups, shortlists] = await Promise.all([
        db('alumni_employment').where({ college_id: actor.collegeId }).whereIn('alumni_profile_id', ids).where((qb) => {
            qb.where('is_archived', false).orWhereNull('is_archived');
        }),
        db.schema.hasTable('alumni_interest_capabilities').then((ok) => ok
            ? db('alumni_interest_capabilities')
                .where({ college_id: actor.collegeId })
                .whereIn('alumni_profile_id', ids)
                .where('is_active', true)
            : []),
        db.schema.hasTable('alumni_relationships').then((ok) => ok ? db('alumni_relationships').where({ college_id: actor.collegeId }).whereIn('alumni_profile_id', ids) : []),
        db.schema.hasTable('alumni_crm_opportunities').then((ok) => ok
            ? db('alumni_crm_opportunities')
                .where({ college_id: actor.collegeId })
                .whereIn('alumni_profile_id', ids)
                .whereIn('status', ['IDENTIFIED', 'QUALIFYING', 'CONFIRMED', 'IN_PROGRESS'])
            : []),
        db.schema.hasTable('alumni_crm_outcomes').then((ok) => ok
            ? db('alumni_crm_outcomes')
                .where({ college_id: actor.collegeId })
                .whereIn('alumni_profile_id', ids)
                .where('verification_status', 'VERIFIED')
            : []),
        db.schema.hasTable('alumni_crm_followups').then((ok) => ok
            ? db('alumni_crm_followups')
                .where({ college_id: actor.collegeId })
                .whereIn('alumni_profile_id', ids)
                .whereIn('status', ['OPEN', 'IN_PROGRESS', 'OVERDUE'])
            : []),
        db.schema.hasTable('alumni_connect_shortlist').then((ok) => ok
            ? db('alumni_connect_shortlist')
                .where({ college_id: actor.collegeId })
                .whereIn('alumni_profile_id', ids)
                .whereIn('status', ['SHORTLISTED', 'ENGAGEMENT_REQUESTED', 'ACCEPTED'])
                .select('alumni_profile_id')
            : []),
    ]);
    const ownerIds = [...new Set(relationships.map((r) => r.relationship_owner_id).filter(Boolean))];
    const owners = ownerIds.length
        ? await db('faculty_users').whereIn('id', ownerIds).select('id', 'name')
        : [];
    const ownerMap = new Map(owners.map((o) => [Number(o.id), o.name]));
    const empBy = new Map();
    for (const e of employment) {
        const id = Number(e.alumni_profile_id);
        if (!empBy.has(id))
            empBy.set(id, []);
        empBy.get(id).push(e);
    }
    const capBy = new Map();
    for (const c of capabilities) {
        const id = Number(c.alumni_profile_id);
        if (!capBy.has(id))
            capBy.set(id, []);
        capBy.get(id).push(c);
    }
    const relBy = new Map(relationships.map((r) => [Number(r.alumni_profile_id), r]));
    const oppBy = new Map();
    for (const o of opportunities) {
        const id = Number(o.alumni_profile_id);
        if (!oppBy.has(id))
            oppBy.set(id, []);
        oppBy.get(id).push(o);
    }
    const outBy = new Map();
    for (const o of outcomes) {
        const id = Number(o.alumni_profile_id);
        if (!outBy.has(id))
            outBy.set(id, []);
        outBy.get(id).push(o);
    }
    const fuBy = new Map();
    for (const f of followups) {
        const id = Number(f.alumni_profile_id);
        if (!fuBy.has(id))
            fuBy.set(id, []);
        fuBy.get(id).push(f);
    }
    const slCount = new Map();
    for (const s of shortlists) {
        const id = Number(s.alumni_profile_id);
        slCount.set(id, (slCount.get(id) || 0) + 1);
    }
    for (const p of profiles) {
        const id = Number(p.id);
        const rel = relBy.get(id) || null;
        map.set(id, {
            profile: p,
            employment: empBy.get(id) || [],
            capabilities: capBy.get(id) || [],
            relationship: rel,
            ownerName: rel?.relationship_owner_id ? ownerMap.get(Number(rel.relationship_owner_id)) || null : null,
            opportunities: oppBy.get(id) || [],
            outcomes: outBy.get(id) || [],
            followups: fuBy.get(id) || [],
            shortlistedElsewhere: slCount.get(id) || 0,
            dismissed: false,
        });
    }
    return map;
}
function hardExclude(bundle, need, needType) {
    const reasons = [];
    const p = bundle.profile;
    if (Number(p.college_id) !== Number(need.college_id)) {
        reasons.push('Tenant mismatch');
    }
    if (p.global_comm_opt_out === true || p.global_comm_opt_out === 1) {
        reasons.push('DO_NOT_CONTACT / global communication opt-out');
    }
    if (bundle.relationship?.relationship_status === 'CLOSED') {
        reasons.push('Relationship status CLOSED');
    }
    const will = willingnessFromProfile(p, needType);
    if (will === 'NOT_WILLING') {
        reasons.push('Explicit NOT_WILLING for this activity');
    }
    if (will === 'TEMPORARILY_UNAVAILABLE') {
        reasons.push('Temporarily unavailable');
    }
    // Conflicting period vs need window
    if (p.temporary_unavailable_until && (need.start_date || need.target_date || need.deadline)) {
        const until = new Date(p.temporary_unavailable_until).getTime();
        const window = new Date(need.start_date || need.target_date || need.deadline).getTime();
        if (!Number.isNaN(until) && !Number.isNaN(window) && until >= window) {
            if (!reasons.includes('Temporarily unavailable'))
                reasons.push('Temporarily unavailable for need period');
        }
    }
    return reasons;
}
function evaluateOne(need, bundle, needType) {
    const why = [];
    const considerations = [];
    const hardExcludeReasons = hardExclude(bundle, need, needType);
    const p = bundle.profile;
    const current = bundle.employment.find((e) => e.is_current) || bundle.employment[0] || null;
    const will = willingnessFromProfile(p, needType);
    const willKey = NEED_WILLINGNESS_KEY[needType];
    const capDomains = NEED_CAPABILITY_DOMAINS[needType] || [];
    const oppTypes = NEED_OPPORTUNITY_TYPES[needType] || [];
    const outcomeTypes = NEED_OUTCOME_TYPES[needType] || [];
    const needSkills = parseJsonArr(need.skills_topics);
    if (need.domain)
        needSkills.push(need.domain);
    const expertBag = expertiseBag(p, bundle.employment);
    let capabilityHits = 0;
    // Domain / skill fit
    const skillHits = tokenOverlap(needSkills, expertBag);
    if (skillHits.length) {
        why.push({
            code: 'SKILL_FIT',
            label: `Skill/topic fit: ${skillHits.slice(0, 4).join(', ')}`,
            positive: true,
            dimension: 'SKILL_FIT',
        });
        capabilityHits += Math.min(3, skillHits.length);
    }
    if (need.domain && tokenOverlap([need.domain], expertBag).length) {
        why.push({
            code: 'DOMAIN_FIT',
            label: `Domain fit: ${need.domain}`,
            positive: true,
            dimension: 'DOMAIN_FIT',
        });
        capabilityHits += 1;
    }
    // Industry / role fit (type-specific emphasis)
    if (current?.industry && ['RECRUITMENT', 'INTERNSHIP', 'INDUSTRIAL_VISIT', 'MOU_COLLABORATION', 'INDUSTRY_PROJECT'].includes(needType)) {
        why.push({
            code: 'INDUSTRY_FIT',
            label: `Industry: ${current.industry}`,
            positive: true,
            dimension: 'INDUSTRY_FIT',
        });
        capabilityHits += 1;
    }
    if (current?.designation) {
        why.push({
            code: 'CAREER_ROLE',
            label: `Current role: ${current.designation}${current.organization ? ` at ${current.organization}` : ''}`,
            positive: true,
            dimension: 'CAREER_ROLE_FIT',
        });
        capabilityHits += 1;
    }
    if (seniorityLooksStrong(current?.seniority) || seniorityLooksStrong(current?.designation)) {
        if (['BOS_ADVISORY', 'CURRICULUM_REVIEW', 'EXPERT_SESSION', 'MOU_COLLABORATION', 'RECRUITMENT'].includes(needType)) {
            why.push({
                code: 'EXPERIENCE_FIT',
                label: 'Seniority / leadership experience relevant to need',
                positive: true,
                dimension: 'EXPERIENCE_FIT',
            });
            capabilityHits += 1;
        }
    }
    // Declared capability
    for (const cap of bundle.capabilities) {
        if (capDomains.includes(String(cap.capability_domain))) {
            why.push({
                code: 'DECLARED_CAPABILITY',
                label: `Declared capability: ${cap.capability_domain}`,
                positive: true,
                dimension: 'DECLARED_CAPABILITY',
            });
            capabilityHits += 1;
        }
    }
    // Research / academic
    if (['RESEARCH_COLLABORATION', 'BOS_ADVISORY', 'CURRICULUM_REVIEW', 'TECHNICAL_REVIEW'].includes(needType)) {
        const research = parseJsonArr(p.research_expertise);
        if (research.length) {
            why.push({
                code: 'ACADEMIC_RESEARCH_FIT',
                label: `Research expertise: ${research.slice(0, 3).join(', ')}`,
                positive: true,
                dimension: 'ACADEMIC_RESEARCH_FIT',
            });
            capabilityHits += 1;
        }
    }
    // Startup / founder
    if (needType === 'STARTUP_MENTORING') {
        const founderish = /founder|co-founder|entrepreneur|startup|incub/.test(norm(`${current?.designation || ''} ${current?.organization || ''}`));
        if (founderish || bundle.capabilities.some((c) => c.capability_domain === 'INNOVATION')) {
            why.push({
                code: 'STARTUP_EXPERIENCE',
                label: 'Founder / entrepreneurial or innovation capability evidence',
                positive: true,
                dimension: 'CAREER_ROLE_FIT',
            });
            capabilityHits += 2;
        }
    }
    // Explicit willingness (intent — never inferred)
    if (will === 'WILLING') {
        why.push({
            code: 'EXPLICIT_WILLINGNESS',
            label: 'Explicitly willing for this activity',
            positive: true,
            dimension: 'EXPLICIT_WILLINGNESS',
        });
    }
    else if (will === 'NOT_ASKED' && willKey) {
        considerations.push({
            code: 'WILLINGNESS_NOT_ASKED',
            label: 'Willingness not asked — do not assume from capability',
            positive: false,
            caution: true,
            dimension: 'EXPLICIT_WILLINGNESS',
        });
    }
    // Past verified outcomes (evidence feedback loop)
    const relevantOutcomes = bundle.outcomes.filter((o) => outcomeTypes.includes(String(o.outcome_type)));
    if (relevantOutcomes.length) {
        why.push({
            code: 'PAST_VERIFIED_OUTCOMES',
            label: `${relevantOutcomes.length} verified outcome(s) relevant to this need type`,
            positive: true,
            dimension: 'PAST_VERIFIED_OUTCOMES',
        });
        capabilityHits += Math.min(2, relevantOutcomes.length);
    }
    // Location / mode
    if (need.location && current?.location) {
        if (norm(need.location) === norm(current.location) || norm(current.location).includes(norm(need.location))) {
            why.push({
                code: 'LOCATION_FIT',
                label: `Location fit: ${current.location}`,
                positive: true,
                dimension: 'LOCATION_FIT',
            });
        }
        else if (need.mode === 'IN_PERSON') {
            considerations.push({
                code: 'LOCATION_MISMATCH',
                label: `Need location ${need.location}; alumnus at ${current.location}`,
                positive: false,
                caution: true,
                dimension: 'LOCATION_FIT',
            });
        }
    }
    if (need.mode && need.mode !== 'ANY' && need.mode !== 'HYBRID') {
        // Mode is soft — record as consideration only when remote needed and no location
        if (need.mode === 'ONLINE') {
            why.push({
                code: 'MODE_FIT',
                label: 'Online mode — location less constraining',
                positive: true,
                dimension: 'MODE_FIT',
            });
        }
    }
    // Contact freshness
    const contactDays = daysSince(p.contact_verified_at);
    if (contactDays != null && contactDays <= 180) {
        why.push({
            code: 'CONTACT_VERIFIED_RECENT',
            label: `Contact verified ${contactDays} day(s) ago`,
            positive: true,
            dimension: 'DATA_FRESHNESS',
        });
    }
    else if (contactDays == null || contactDays > 365) {
        considerations.push({
            code: 'CONTACT_STALE',
            label: 'Contact verification stale or missing',
            positive: false,
            caution: true,
            dimension: 'DATA_FRESHNESS',
        });
    }
    // Relationship awareness
    const rel = bundle.relationship;
    const lastContactDays = daysSince(rel?.last_contact_at);
    if (lastContactDays != null && lastContactDays <= 14) {
        considerations.push({
            code: 'RECENT_CONTACT',
            label: `Last contacted ${lastContactDays} day(s) ago`,
            positive: false,
            caution: true,
            dimension: 'RECENT_CONTACT',
        });
    }
    const activeSameType = bundle.opportunities.filter((o) => oppTypes.includes(String(o.opportunity_type)));
    if (activeSameType.length) {
        considerations.push({
            code: 'ACTIVE_OPPORTUNITY',
            label: `Already has ${activeSameType.length} active ${needType.toLowerCase().replace(/_/g, ' ')} opportunity`,
            positive: false,
            caution: true,
            dimension: 'ACTIVE_OPPORTUNITIES',
        });
    }
    if (bundle.followups.length) {
        considerations.push({
            code: 'OPEN_FOLLOWUPS',
            label: `${bundle.followups.length} open follow-up(s)`,
            positive: false,
            caution: true,
            dimension: 'RELATIONSHIP_READINESS',
        });
    }
    if (bundle.shortlistedElsewhere > 0) {
        considerations.push({
            code: 'SHORTLISTED_ELSEWHERE',
            label: `Shortlisted on ${bundle.shortlistedElsewhere} other need(s)`,
            positive: false,
            caution: true,
            dimension: 'ENGAGEMENT_LOAD',
        });
    }
    if (bundle.opportunities.length >= 2) {
        considerations.push({
            code: 'ENGAGEMENT_LOAD',
            label: `${bundle.opportunities.length} active opportunities (factual workload)`,
            positive: false,
            caution: true,
            dimension: 'ENGAGEMENT_LOAD',
        });
    }
    // Mentorship load (type-specific)
    if (['MENTORSHIP', 'PROJECT_MENTORING', 'CAREER_GUIDANCE'].includes(needType)) {
        const mentorOpps = bundle.opportunities.filter((o) => ['MENTORSHIP', 'PROJECT_MENTORING'].includes(String(o.opportunity_type)));
        if (mentorOpps.length) {
            considerations.push({
                code: 'MENTORING_LOAD',
                label: `Already mentoring / project-mentoring load: ${mentorOpps.length} active`,
                positive: false,
                caution: true,
                dimension: 'ENGAGEMENT_LOAD',
            });
        }
    }
    let capabilityStrength = 'INSUFFICIENT';
    if (capabilityHits >= 5)
        capabilityStrength = 'STRONG';
    else if (capabilityHits >= 3)
        capabilityStrength = 'MODERATE';
    else if (capabilityHits >= 1)
        capabilityStrength = 'LIMITED';
    let matchQuality = 'LIMITED';
    const positiveCount = why.filter((w) => w.positive).length;
    if (capabilityStrength === 'STRONG' && (will === 'WILLING' || relevantOutcomes.length > 0)) {
        matchQuality = 'STRONG';
    }
    else if (capabilityStrength === 'STRONG' || (capabilityStrength === 'MODERATE' && will === 'WILLING')) {
        matchQuality = 'MODERATE';
    }
    else if (positiveCount >= 2) {
        matchQuality = 'MODERATE';
    }
    else {
        matchQuality = 'LIMITED';
    }
    let matchStatus = 'READY_TO_SHORTLIST';
    let readiness = 'READY_FOR_REVIEW';
    if (will === 'NOT_ASKED' && capabilityStrength !== 'INSUFFICIENT') {
        matchStatus = 'REVIEW_BEFORE_CONTACT';
        readiness = 'REVIEW_BEFORE_CONTACT';
    }
    if (will === 'NOT_ASKED' && capabilityStrength === 'STRONG') {
        matchStatus = 'CAPABILITY_ONLY';
    }
    if (activeSameType.length || (lastContactDays != null && lastContactDays <= 7) || bundle.followups.length > 2) {
        if (matchStatus === 'READY_TO_SHORTLIST')
            matchStatus = 'RELATIONSHIP_CAUTION';
        readiness = 'RELATIONSHIP_CAUTION';
    }
    if (rel?.relationship_status === 'CLOSED' || p.global_comm_opt_out) {
        readiness = 'DO_NOT_CONTACT';
    }
    const freshness = [];
    if (contactDays != null) {
        freshness.push({
            domain: 'CONTACT',
            state: contactDays <= 180 ? 'VERIFIED_RECENTLY' : contactDays <= 365 ? 'NEEDS_CONFIRMATION' : 'STALE',
            message: `Last verified ${contactDays}d ago`,
        });
    }
    else {
        freshness.push({ domain: 'CONTACT', state: 'UNVERIFIED' });
    }
    const empDays = daysSince(current?.last_verified_at || p.employment_confirmed_at);
    freshness.push({
        domain: 'EMPLOYMENT',
        state: empDays == null ? 'UNVERIFIED' : empDays <= 180 ? 'VERIFIED_RECENTLY' : empDays <= 365 ? 'NEEDS_CONFIRMATION' : 'STALE',
    });
    return {
        alumniProfileId: Number(p.id),
        identity: {
            name: p.historical_name || null,
            graduationYear: p.graduation_year != null ? Number(p.graduation_year) : null,
            historicalUsn: p.historical_usn || null,
            departmentId: p.historical_department_id != null ? Number(p.historical_department_id) : null,
        },
        currentRole: current?.designation || null,
        currentOrganization: current?.organization || null,
        industry: current?.industry || null,
        location: current?.location || null,
        matchQuality,
        matchStatus,
        capabilityStrength,
        willingness: will,
        relationship: {
            stage: rel?.relationship_stage || null,
            status: rel?.relationship_status || null,
            ownerId: rel?.relationship_owner_id != null ? Number(rel.relationship_owner_id) : null,
            ownerName: bundle.ownerName,
            lastContactAt: rel?.last_contact_at ? new Date(rel.last_contact_at).toISOString() : null,
            lastEngagementAt: rel?.last_engagement_at ? new Date(rel.last_engagement_at).toISOString() : null,
            readiness,
        },
        engagementLoad: {
            activeOpportunities: bundle.opportunities.map((o) => ({
                id: Number(o.id),
                type: String(o.opportunity_type),
                title: String(o.title),
                status: String(o.status),
            })),
            openFollowups: bundle.followups.length,
            shortlistedElsewhere: bundle.shortlistedElsewhere,
        },
        dataFreshness: freshness,
        whyMatched: why,
        considerations,
        engagementEligibility: null,
        hardExcluded: hardExcludeReasons.length > 0,
        hardExcludeReasons,
    };
}
function qualityRank(q) {
    return q === 'STRONG' ? 3 : q === 'MODERATE' ? 2 : 1;
}
/**
 * Evaluate candidates for a need (set-based).
 */
export async function evaluateNeedCandidates(opts) {
    const needType = opts.need.type;
    const bundles = await loadMatchingBundles({
        actor: opts.actor,
        alumniProfileIds: opts.alumniProfileIds,
    });
    // Mark dismissals for this need
    const dismissedIds = new Set();
    if (await db.schema.hasTable('alumni_connect_dismissals')) {
        const rows = await db('alumni_connect_dismissals')
            .where({ college_id: opts.actor.collegeId, need_id: opts.need.id })
            .select('alumni_profile_id');
        for (const r of rows)
            dismissedIds.add(Number(r.alumni_profile_id));
    }
    const all = [];
    let excluded = 0;
    for (const [id, bundle] of bundles) {
        if (dismissedIds.has(id)) {
            excluded += 1;
            continue;
        }
        const match = evaluateOne(opts.need, bundle, needType);
        if (match.hardExcluded) {
            excluded += 1;
            continue;
        }
        if (!opts.includeLimited && match.matchQuality === 'LIMITED' && match.capabilityStrength === 'INSUFFICIENT') {
            continue;
        }
        all.push(match);
    }
    // C4 eligibility awareness (batch) — C4 remains authoritative for engagement
    const category = NEED_ENGAGEMENT_CATEGORY[needType] || 'OTHER';
    const ids = all.map((c) => c.alumniProfileId);
    if (ids.length) {
        const elig = await evaluateEligibilityBatch({
            actor: opts.actor,
            alumniProfileIds: ids,
            category,
            channel: 'MANUAL',
        });
        const eligMap = new Map(elig.map((e) => [e.alumniProfileId, e]));
        for (const c of all) {
            const e = eligMap.get(c.alumniProfileId);
            if (e) {
                c.engagementEligibility = { eligibility: e.eligibility, reasons: e.reasons };
                if (e.eligibility === 'SUPPRESSED') {
                    c.matchStatus = 'ENGAGEMENT_SUPPRESSED';
                    c.considerations.push({
                        code: 'C4_SUPPRESSED',
                        label: `C4 engagement suppressed: ${e.reasons.slice(0, 2).join('; ') || 'see eligibility'}`,
                        positive: false,
                        caution: true,
                        dimension: 'ENGAGEMENT_LOAD',
                    });
                }
                else if (e.eligibility === 'REQUIRES_REVIEW') {
                    if (c.matchStatus === 'READY_TO_SHORTLIST')
                        c.matchStatus = 'REVIEW_BEFORE_CONTACT';
                    c.considerations.push({
                        code: 'C4_REQUIRES_REVIEW',
                        label: `C4 requires review before contact: ${e.reasons.slice(0, 2).join('; ')}`,
                        positive: false,
                        caution: true,
                    });
                }
            }
        }
    }
    all.sort((a, b) => {
        const q = qualityRank(b.matchQuality) - qualityRank(a.matchQuality);
        if (q !== 0)
            return q;
        const willRank = (w) => (w === 'WILLING' ? 3 : w === 'NOT_ASKED' ? 2 : 1);
        const wr = willRank(b.willingness) - willRank(a.willingness);
        if (wr !== 0)
            return wr;
        return b.whyMatched.length - a.whyMatched.length;
    });
    const limit = opts.limit ?? 50;
    return {
        candidates: all.slice(0, limit),
        evaluated: bundles.size,
        excluded,
    };
}
/** Bulk / set-based pool generation for high-quantity needs (e.g. 50 mentors). */
export async function generateCandidatePool(opts) {
    const result = await evaluateNeedCandidates({
        actor: opts.actor,
        need: opts.need,
        limit: opts.poolSize ?? 100,
        includeLimited: false,
    });
    return {
        pool: result.candidates.filter((c) => c.matchQuality !== 'LIMITED' || c.willingness === 'WILLING'),
        evaluated: result.evaluated,
        excluded: result.excluded,
    };
}
