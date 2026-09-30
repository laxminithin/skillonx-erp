/**
 * Alumni Relationship CRM — mutations & relationship lifecycle (C2).
 */
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { canAccessCrm, canOperateCrm, canReassignOwnership, canVerifyOutcomes, isDepartmentScoped, ownerTypeForRole, } from './accessCrm.js';
import { STAGE_RANK, } from './typesCrm.js';
async function audit(input) {
    if (!(await db.schema.hasTable('alumni_audit_log')))
        return;
    await db('alumni_audit_log').insert({
        college_id: input.collegeId,
        actor_type: 'FACULTY',
        actor_faculty_id: input.actorFacultyId ?? null,
        actor_alumni_id: null,
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
}
export function assertCrmAccess(actor) {
    if (!canAccessCrm(actor))
        throw new AppError(403, 'Alumni CRM access required');
}
export function assertCrmOperate(actor) {
    if (!canOperateCrm(actor))
        throw new AppError(403, 'Alumni CRM write access required');
}
export async function loadAlumniInScope(actor, alumniProfileId) {
    assertCrmAccess(actor);
    const profile = await db('alumni_profiles')
        .where({ id: alumniProfileId, college_id: actor.collegeId })
        .first();
    if (!profile)
        throw new AppError(404, 'Alumni profile not found');
    if (isDepartmentScoped(actor) && actor.departmentId != null) {
        if (profile.historical_department_id != null && Number(profile.historical_department_id) !== actor.departmentId) {
            throw new AppError(403, 'Alumni profile outside your department scope');
        }
    }
    return profile;
}
export async function getCrmConfig(collegeId) {
    if (!(await db.schema.hasTable('alumni_crm_config'))) {
        return { recentContactWarnDays: 7, dormantAfterDays: 180, noContactReviewDays: 90 };
    }
    let row = await db('alumni_crm_config').where({ college_id: collegeId }).first();
    if (!row) {
        await db('alumni_crm_config').insert({
            college_id: collegeId,
            recent_contact_warn_days: 7,
            dormant_after_days: 180,
            no_contact_review_days: 90,
        });
        row = await db('alumni_crm_config').where({ college_id: collegeId }).first();
    }
    return {
        recentContactWarnDays: Number(row.recent_contact_warn_days),
        dormantAfterDays: Number(row.dormant_after_days),
        noContactReviewDays: Number(row.no_contact_review_days),
    };
}
export async function ensureRelationship(collegeId, alumniProfileId, profile) {
    if (!(await db.schema.hasTable('alumni_relationships'))) {
        throw new AppError(503, 'Alumni CRM schema not migrated');
    }
    let rel = await db('alumni_relationships')
        .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
        .first();
    if (rel)
        return rel;
    const p = profile ?? (await db('alumni_profiles').where({ id: alumniProfileId, college_id: collegeId }).first());
    const stage = p?.email || p?.phone_override ? 'REACHABLE' : 'IDENTIFIED';
    const [id] = await db('alumni_relationships').insert({
        college_id: collegeId,
        alumni_profile_id: alumniProfileId,
        relationship_stage: stage,
        department_id: p?.historical_department_id ?? null,
        relationship_status: 'ACTIVE',
    });
    await db('alumni_relationship_stage_history').insert({
        college_id: collegeId,
        relationship_id: id,
        alumni_profile_id: alumniProfileId,
        from_stage: null,
        to_stage: stage,
        reason: stage === 'REACHABLE' ? 'Contact channel present on profile' : 'Relationship record created',
        rule_code: 'ENSURE_RELATIONSHIP',
        explicit: false,
        acted_by_faculty_id: null,
    });
    return db('alumni_relationships').where({ id }).first();
}
export function serializeRelationship(rel, extras = {}) {
    return {
        id: Number(rel.id),
        collegeId: Number(rel.college_id),
        alumniProfileId: Number(rel.alumni_profile_id),
        relationshipStage: rel.relationship_stage,
        relationshipOwnerType: rel.relationship_owner_type,
        relationshipOwnerId: rel.relationship_owner_id != null ? Number(rel.relationship_owner_id) : null,
        departmentId: rel.department_id != null ? Number(rel.department_id) : null,
        firstContactAt: rel.first_contact_at ? new Date(rel.first_contact_at).toISOString() : null,
        lastContactAt: rel.last_contact_at ? new Date(rel.last_contact_at).toISOString() : null,
        lastResponseAt: rel.last_response_at ? new Date(rel.last_response_at).toISOString() : null,
        lastEngagementAt: rel.last_engagement_at ? new Date(rel.last_engagement_at).toISOString() : null,
        nextActionAt: rel.next_action_at ? new Date(rel.next_action_at).toISOString() : null,
        relationshipStatus: rel.relationship_status,
        createdAt: rel.created_at ? new Date(rel.created_at).toISOString() : null,
        updatedAt: rel.updated_at ? new Date(rel.updated_at).toISOString() : null,
        ...extras,
    };
}
/**
 * Advance stage only forward (no silent downgrade). Explicit authorised transition may set any stage with audit.
 */
export async function applyStageTransition(input) {
    const rel = await db('alumni_relationships').where({ id: input.relationshipId }).first();
    if (!rel)
        return null;
    const from = rel.relationship_stage;
    if (from === input.toStage)
        return rel;
    if (!input.explicit) {
        if (STAGE_RANK[input.toStage] < STAGE_RANK[from]) {
            // Never silently downgrade
            return rel;
        }
    }
    await db('alumni_relationships').where({ id: input.relationshipId }).update({
        relationship_stage: input.toStage,
        updated_at: db.fn.now(),
    });
    await db('alumni_relationship_stage_history').insert({
        college_id: input.collegeId,
        relationship_id: input.relationshipId,
        alumni_profile_id: input.alumniProfileId,
        from_stage: from,
        to_stage: input.toStage,
        reason: input.reason,
        rule_code: input.ruleCode,
        explicit: input.explicit,
        acted_by_faculty_id: input.actorFacultyId ?? null,
    });
    await audit({
        collegeId: input.collegeId,
        actorFacultyId: input.actorFacultyId,
        action: 'CRM_STAGE_TRANSITION',
        entityType: 'alumni_relationships',
        entityId: input.relationshipId,
        metadata: { from, to: input.toStage, reason: input.reason, ruleCode: input.ruleCode, explicit: input.explicit },
    });
    return db('alumni_relationships').where({ id: input.relationshipId }).first();
}
async function maybeAdvanceFromInteraction(rel, interaction) {
    const collegeId = Number(rel.college_id);
    const profileId = Number(rel.alumni_profile_id);
    const rid = Number(rel.id);
    if (interaction.isContactAttempt || ['CONTACTED', 'NO_RESPONSE', 'WRONG_CONTACT', 'FOLLOW_UP'].includes(String(interaction.outcomeStatus))) {
        await applyStageTransition({
            collegeId,
            relationshipId: rid,
            alumniProfileId: profileId,
            toStage: 'CONTACTED',
            reason: 'Valid contact attempt logged',
            ruleCode: 'CONTACT_ATTEMPT',
            explicit: false,
            actorFacultyId: interaction.actorFacultyId,
        });
    }
    if (interaction.outcomeStatus === 'RESPONDED' || interaction.outcomeStatus === 'COMPLETED') {
        await applyStageTransition({
            collegeId,
            relationshipId: rid,
            alumniProfileId: profileId,
            toStage: 'RESPONDED',
            reason: 'Response recorded on interaction',
            ruleCode: 'RESPONSE_RECORDED',
            explicit: false,
            actorFacultyId: interaction.actorFacultyId,
        });
    }
    if (interaction.isMeaningfulEngagement) {
        const current = await db('alumni_relationships').where({ id: rid }).first();
        if (current?.relationship_stage === 'OUTCOME_ACHIEVED') {
            await applyStageTransition({
                collegeId,
                relationshipId: rid,
                alumniProfileId: profileId,
                toStage: 'REPEAT_ENGAGEMENT',
                reason: 'Meaningful engagement after prior outcome',
                ruleCode: 'REPEAT_AFTER_OUTCOME',
                explicit: false,
                actorFacultyId: interaction.actorFacultyId,
            });
        }
        else {
            await applyStageTransition({
                collegeId,
                relationshipId: rid,
                alumniProfileId: profileId,
                toStage: 'ENGAGED',
                reason: 'Meaningful two-way activity logged',
                ruleCode: 'MEANINGFUL_ENGAGEMENT',
                explicit: false,
                actorFacultyId: interaction.actorFacultyId,
            });
        }
    }
}
export async function getRelationshipForAdmin(actor, alumniProfileId) {
    const profile = await loadAlumniInScope(actor, alumniProfileId);
    const rel = await ensureRelationship(actor.collegeId, alumniProfileId, profile);
    const config = await getCrmConfig(actor.collegeId);
    let ownerName = null;
    if (rel.relationship_owner_id) {
        const o = await db('faculty_users').where({ id: rel.relationship_owner_id }).select('id', 'name', 'role').first();
        ownerName = o?.name ?? null;
    }
    const collaborators = await db.schema.hasTable('alumni_crm_collaborators')
        ? await db('alumni_crm_collaborators as c')
            .leftJoin('faculty_users as f', 'f.id', 'c.faculty_user_id')
            .where({ 'c.relationship_id': rel.id, 'c.is_active': true })
            .select('c.faculty_user_id', 'f.name', 'c.department_id', 'c.role_label')
        : [];
    const ownershipHistory = await db('alumni_relationship_ownership_history')
        .where({ relationship_id: rel.id })
        .orderBy('created_at', 'desc')
        .limit(20);
    const stageHistory = await db('alumni_relationship_stage_history')
        .where({ relationship_id: rel.id })
        .orderBy('created_at', 'desc')
        .limit(30);
    const warnings = await buildDuplicateContactWarnings(actor.collegeId, alumniProfileId, config.recentContactWarnDays);
    return {
        relationship: serializeRelationship(rel, {
            ownerName,
            collaborators: collaborators.map((c) => ({
                facultyUserId: Number(c.faculty_user_id),
                name: c.name,
                departmentId: c.department_id != null ? Number(c.department_id) : null,
                roleLabel: c.role_label,
            })),
        }),
        ownershipHistory: ownershipHistory.map((h) => ({
            fromOwnerId: h.from_owner_id,
            toOwnerId: h.to_owner_id,
            fromOwnerType: h.from_owner_type,
            toOwnerType: h.to_owner_type,
            reason: h.reason,
            actedBy: h.acted_by_faculty_id,
            at: new Date(h.created_at).toISOString(),
        })),
        stageHistory: stageHistory.map((h) => ({
            fromStage: h.from_stage,
            toStage: h.to_stage,
            reason: h.reason,
            ruleCode: h.rule_code,
            explicit: Boolean(h.explicit),
            actedBy: h.acted_by_faculty_id,
            at: new Date(h.created_at).toISOString(),
        })),
        duplicateContactWarnings: warnings,
        config,
    };
}
export async function buildDuplicateContactWarnings(collegeId, alumniProfileId, warnDays) {
    const warnings = [];
    const since = new Date(Date.now() - warnDays * 86400000);
    if (await db.schema.hasTable('alumni_crm_interactions')) {
        const recent = await db('alumni_crm_interactions as i')
            .leftJoin('faculty_users as f', 'f.id', 'i.actor_faculty_id')
            .where({ 'i.college_id': collegeId, 'i.alumni_profile_id': alumniProfileId })
            .where('i.occurred_at', '>=', since)
            .where('i.is_contact_attempt', true)
            .orderBy('i.occurred_at', 'desc')
            .first();
        if (recent) {
            const days = Math.max(0, Math.floor((Date.now() - new Date(recent.occurred_at).getTime()) / 86400000));
            warnings.push({
                code: 'RECENT_CONTACT',
                severity: 'WARN',
                message: `This alumnus was contacted ${days} day(s) ago by ${recent.name || 'institutional staff'}.`,
            });
        }
    }
    if (await db.schema.hasTable('alumni_crm_followups')) {
        const openFu = await db('alumni_crm_followups')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('status', ['OPEN', 'IN_PROGRESS', 'OVERDUE'])
            .first();
        if (openFu) {
            warnings.push({
                code: 'OPEN_FOLLOWUP',
                severity: 'WARN',
                message: `An open follow-up already exists (due ${openFu.due_date}): ${openFu.reason}`,
            });
        }
    }
    if (await db.schema.hasTable('alumni_crm_opportunities')) {
        const activeOpp = await db('alumni_crm_opportunities')
            .where({ college_id: collegeId, alumni_profile_id: alumniProfileId })
            .whereIn('status', ['IDENTIFIED', 'QUALIFYING', 'CONFIRMED', 'IN_PROGRESS'])
            .select('opportunity_type', 'title', 'status');
        for (const o of activeOpp) {
            warnings.push({
                code: 'ACTIVE_OPPORTUNITY',
                severity: 'INFO',
                message: `Active ${o.opportunity_type} opportunity (${o.status}): ${o.title}`,
            });
        }
    }
    return warnings;
}
export async function reassignOwnership(actor, alumniProfileId, body) {
    if (!canReassignOwnership(actor))
        throw new AppError(403, 'Ownership reassignment privilege required');
    const profile = await loadAlumniInScope(actor, alumniProfileId);
    const rel = await ensureRelationship(actor.collegeId, alumniProfileId, profile);
    await db('alumni_relationship_ownership_history').insert({
        college_id: actor.collegeId,
        relationship_id: rel.id,
        alumni_profile_id: alumniProfileId,
        from_owner_id: rel.relationship_owner_id,
        from_owner_type: rel.relationship_owner_type,
        to_owner_id: body.ownerFacultyId,
        to_owner_type: body.ownerType,
        from_department_id: rel.department_id,
        to_department_id: body.departmentId ?? rel.department_id,
        reason: body.reason,
        acted_by_faculty_id: actor.facultyUserId,
    });
    await db('alumni_relationships').where({ id: rel.id }).update({
        relationship_owner_id: body.ownerFacultyId,
        relationship_owner_type: body.ownerType,
        department_id: body.departmentId !== undefined ? body.departmentId : rel.department_id,
        updated_at: db.fn.now(),
    });
    if (body.collaboratorFacultyIds && (await db.schema.hasTable('alumni_crm_collaborators'))) {
        await db('alumni_crm_collaborators').where({ relationship_id: rel.id }).update({ is_active: false });
        for (const fid of body.collaboratorFacultyIds) {
            const existing = await db('alumni_crm_collaborators')
                .where({ relationship_id: rel.id, faculty_user_id: fid })
                .first();
            if (existing) {
                await db('alumni_crm_collaborators').where({ id: existing.id }).update({ is_active: true, updated_at: db.fn.now() });
            }
            else {
                await db('alumni_crm_collaborators').insert({
                    college_id: actor.collegeId,
                    relationship_id: rel.id,
                    alumni_profile_id: alumniProfileId,
                    faculty_user_id: fid,
                    department_id: actor.departmentId,
                    is_active: true,
                });
            }
        }
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'CRM_OWNERSHIP_REASSIGN',
        entityType: 'alumni_relationships',
        entityId: Number(rel.id),
        metadata: body,
    });
    return getRelationshipForAdmin(actor, alumniProfileId);
}
export async function explicitStageTransition(actor, alumniProfileId, toStage, reason) {
    assertCrmOperate(actor);
    const profile = await loadAlumniInScope(actor, alumniProfileId);
    const rel = await ensureRelationship(actor.collegeId, alumniProfileId, profile);
    await applyStageTransition({
        collegeId: actor.collegeId,
        relationshipId: Number(rel.id),
        alumniProfileId,
        toStage,
        reason,
        ruleCode: 'EXPLICIT_AUTHORISED',
        explicit: true,
        actorFacultyId: actor.facultyUserId,
    });
    return getRelationshipForAdmin(actor, alumniProfileId);
}
export async function createInteraction(actor, alumniProfileId, body) {
    assertCrmOperate(actor);
    const profile = await loadAlumniInScope(actor, alumniProfileId);
    const rel = await ensureRelationship(actor.collegeId, alumniProfileId, profile);
    const warnings = await buildDuplicateContactWarnings(actor.collegeId, alumniProfileId, (await getCrmConfig(actor.collegeId)).recentContactWarnDays);
    const isContactAttempt = body.isContactAttempt ?? ['PHONE_CALL', 'EMAIL', 'WHATSAPP', 'SMS', 'IN_PERSON', 'VIDEO_CALL'].includes(body.interactionType);
    const captureMode = body.captureMode === 'INTEGRATED' ? 'INTEGRATED' : 'MANUAL';
    const [id] = await db('alumni_crm_interactions').insert({
        college_id: actor.collegeId,
        alumni_profile_id: alumniProfileId,
        relationship_id: rel.id,
        interaction_type: body.interactionType,
        channel: body.channel ?? body.interactionType,
        direction: body.direction ?? 'OUTBOUND',
        purpose: body.purpose ?? null,
        summary: body.summary ?? null,
        outcome_status: body.outcomeStatus ?? null,
        occurred_at: new Date(body.occurredAt),
        actor_faculty_id: actor.facultyUserId,
        participant_faculty_ids: body.participantFacultyIds ? JSON.stringify(body.participantFacultyIds) : null,
        follow_up_required: Boolean(body.followUpRequired),
        next_action_at: body.nextActionAt ? new Date(body.nextActionAt) : null,
        next_action_summary: body.nextActionSummary ?? null,
        related_opportunity_id: body.relatedOpportunityId ?? null,
        capture_mode: captureMode,
        visibility: body.visibility ?? 'INSTITUTIONAL',
        evidence_reference: body.evidenceReference ?? null,
        is_contact_attempt: isContactAttempt,
        is_meaningful_engagement: Boolean(body.isMeaningfulEngagement),
    });
    const patch = { updated_at: db.fn.now() };
    const occurred = new Date(body.occurredAt);
    if (!rel.first_contact_at && isContactAttempt)
        patch.first_contact_at = occurred;
    if (isContactAttempt)
        patch.last_contact_at = occurred;
    if (body.outcomeStatus === 'RESPONDED' || body.outcomeStatus === 'COMPLETED')
        patch.last_response_at = occurred;
    if (body.isMeaningfulEngagement)
        patch.last_engagement_at = occurred;
    if (body.nextActionAt)
        patch.next_action_at = new Date(body.nextActionAt);
    await db('alumni_relationships').where({ id: rel.id }).update(patch);
    await maybeAdvanceFromInteraction(rel, {
        isContactAttempt,
        outcomeStatus: body.outcomeStatus ?? null,
        isMeaningfulEngagement: Boolean(body.isMeaningfulEngagement),
        actorFacultyId: actor.facultyUserId,
    });
    let followUpId = null;
    if (body.followUpRequired && body.nextActionAt) {
        const [fuId] = await db('alumni_crm_followups').insert({
            college_id: actor.collegeId,
            alumni_profile_id: alumniProfileId,
            relationship_id: rel.id,
            interaction_id: id,
            owner_faculty_id: actor.facultyUserId,
            department_id: actor.departmentId ?? profile.historical_department_id,
            due_date: String(body.nextActionAt).slice(0, 10),
            priority: 'NORMAL',
            reason: body.nextActionSummary || body.purpose || 'Follow-up from interaction',
            status: 'OPEN',
        });
        followUpId = Number(fuId);
    }
    // Claim ownership if unowned
    if (!rel.relationship_owner_id) {
        await db('alumni_relationships').where({ id: rel.id }).update({
            relationship_owner_id: actor.facultyUserId,
            relationship_owner_type: ownerTypeForRole(actor.role),
            updated_at: db.fn.now(),
        });
        await db('alumni_relationship_ownership_history').insert({
            college_id: actor.collegeId,
            relationship_id: rel.id,
            alumni_profile_id: alumniProfileId,
            from_owner_id: null,
            from_owner_type: null,
            to_owner_id: actor.facultyUserId,
            to_owner_type: ownerTypeForRole(actor.role),
            from_department_id: null,
            to_department_id: actor.departmentId,
            reason: 'Auto-assigned on first CRM interaction',
            acted_by_faculty_id: actor.facultyUserId,
        });
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'CRM_INTERACTION_CREATE',
        entityType: 'alumni_crm_interactions',
        entityId: Number(id),
        metadata: { alumniProfileId, captureMode, interactionType: body.interactionType },
    });
    const row = await db('alumni_crm_interactions').where({ id }).first();
    return { interaction: serializeInteraction(row), followUpId, warnings };
}
export async function patchInteraction(actor, interactionId, body) {
    assertCrmOperate(actor);
    const row = await db('alumni_crm_interactions').where({ id: interactionId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Interaction not found');
    await loadAlumniInScope(actor, Number(row.alumni_profile_id));
    const map = {
        interactionType: 'interaction_type',
        channel: 'channel',
        direction: 'direction',
        purpose: 'purpose',
        summary: 'summary',
        outcomeStatus: 'outcome_status',
        visibility: 'visibility',
        evidenceReference: 'evidence_reference',
        nextActionSummary: 'next_action_summary',
        relatedOpportunityId: 'related_opportunity_id',
    };
    const update = { updated_at: db.fn.now() };
    for (const [k, col] of Object.entries(map)) {
        if (body[k] !== undefined)
            update[col] = body[k];
    }
    if (body.occurredAt !== undefined)
        update.occurred_at = new Date(String(body.occurredAt));
    if (body.nextActionAt !== undefined)
        update.next_action_at = body.nextActionAt ? new Date(String(body.nextActionAt)) : null;
    if (body.followUpRequired !== undefined)
        update.follow_up_required = Boolean(body.followUpRequired);
    if (body.isContactAttempt !== undefined)
        update.is_contact_attempt = Boolean(body.isContactAttempt);
    if (body.isMeaningfulEngagement !== undefined)
        update.is_meaningful_engagement = Boolean(body.isMeaningfulEngagement);
    if (body.participantFacultyIds !== undefined) {
        update.participant_faculty_ids = JSON.stringify(body.participantFacultyIds);
    }
    // Never allow elevating capture_mode to INTEGRATED via patch without explicit MANUAL|INTEGRATED — keep as-is unless set
    if (body.captureMode === 'MANUAL' || body.captureMode === 'INTEGRATED') {
        update.capture_mode = body.captureMode;
    }
    await db('alumni_crm_interactions').where({ id: interactionId }).update(update);
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'CRM_INTERACTION_UPDATE',
        entityType: 'alumni_crm_interactions',
        entityId: interactionId,
        metadata: body,
    });
    return { interaction: serializeInteraction(await db('alumni_crm_interactions').where({ id: interactionId }).first()) };
}
export function serializeInteraction(row) {
    return {
        id: Number(row.id),
        alumniProfileId: Number(row.alumni_profile_id),
        relationshipId: row.relationship_id != null ? Number(row.relationship_id) : null,
        interactionType: row.interaction_type,
        channel: row.channel,
        direction: row.direction,
        purpose: row.purpose,
        summary: row.summary,
        outcomeStatus: row.outcome_status,
        occurredAt: new Date(row.occurred_at).toISOString(),
        actorFacultyId: row.actor_faculty_id != null ? Number(row.actor_faculty_id) : null,
        participantFacultyIds: row.participant_faculty_ids
            ? (typeof row.participant_faculty_ids === 'string' ? JSON.parse(row.participant_faculty_ids) : row.participant_faculty_ids)
            : [],
        followUpRequired: Boolean(row.follow_up_required),
        nextActionAt: row.next_action_at ? new Date(row.next_action_at).toISOString() : null,
        nextActionSummary: row.next_action_summary,
        relatedOpportunityId: row.related_opportunity_id != null ? Number(row.related_opportunity_id) : null,
        captureMode: row.capture_mode,
        visibility: row.visibility,
        evidenceReference: row.evidence_reference,
        isContactAttempt: Boolean(row.is_contact_attempt),
        isMeaningfulEngagement: Boolean(row.is_meaningful_engagement),
    };
}
export async function createFollowup(actor, alumniProfileId, body) {
    assertCrmOperate(actor);
    const profile = await loadAlumniInScope(actor, alumniProfileId);
    const rel = await ensureRelationship(actor.collegeId, alumniProfileId, profile);
    const warnings = await buildDuplicateContactWarnings(actor.collegeId, alumniProfileId, (await getCrmConfig(actor.collegeId)).recentContactWarnDays);
    const [id] = await db('alumni_crm_followups').insert({
        college_id: actor.collegeId,
        alumni_profile_id: alumniProfileId,
        relationship_id: rel.id,
        interaction_id: body.interactionId ?? null,
        opportunity_id: body.opportunityId ?? null,
        owner_faculty_id: body.ownerFacultyId ?? actor.facultyUserId,
        department_id: body.departmentId ?? actor.departmentId ?? profile.historical_department_id,
        due_date: body.dueDate.slice(0, 10),
        priority: body.priority ?? 'NORMAL',
        reason: body.reason,
        notes: body.notes ?? null,
        status: 'OPEN',
    });
    await db('alumni_relationships').where({ id: rel.id }).update({
        next_action_at: new Date(body.dueDate),
        updated_at: db.fn.now(),
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'CRM_FOLLOWUP_CREATE',
        entityType: 'alumni_crm_followups',
        entityId: Number(id),
    });
    return { followup: serializeFollowup(await db('alumni_crm_followups').where({ id }).first()), warnings };
}
export async function patchFollowup(actor, followupId, body) {
    assertCrmOperate(actor);
    const row = await db('alumni_crm_followups').where({ id: followupId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Follow-up not found');
    await loadAlumniInScope(actor, Number(row.alumni_profile_id));
    const update = { updated_at: db.fn.now() };
    if (body.reason !== undefined)
        update.reason = body.reason;
    if (body.dueDate !== undefined)
        update.due_date = String(body.dueDate).slice(0, 10);
    if (body.priority !== undefined)
        update.priority = body.priority;
    if (body.notes !== undefined)
        update.notes = body.notes;
    if (body.ownerFacultyId !== undefined)
        update.owner_faculty_id = body.ownerFacultyId;
    if (body.departmentId !== undefined)
        update.department_id = body.departmentId;
    if (body.status !== undefined) {
        update.status = body.status;
        if (body.status === 'COMPLETED') {
            update.completed_at = db.fn.now();
            update.completed_by = actor.facultyUserId;
        }
    }
    await db('alumni_crm_followups').where({ id: followupId }).update(update);
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'CRM_FOLLOWUP_UPDATE',
        entityType: 'alumni_crm_followups',
        entityId: followupId,
        metadata: body,
    });
    return { followup: serializeFollowup(await db('alumni_crm_followups').where({ id: followupId }).first()) };
}
export function serializeFollowup(row) {
    const due = String(row.due_date).slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    let status = row.status;
    if (['OPEN', 'IN_PROGRESS'].includes(status) && due < today)
        status = 'OVERDUE';
    return {
        id: Number(row.id),
        alumniProfileId: Number(row.alumni_profile_id),
        interactionId: row.interaction_id != null ? Number(row.interaction_id) : null,
        opportunityId: row.opportunity_id != null ? Number(row.opportunity_id) : null,
        ownerFacultyId: Number(row.owner_faculty_id),
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        dueDate: due,
        priority: row.priority,
        reason: row.reason,
        notes: row.notes,
        status,
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    };
}
export async function createOpportunity(actor, alumniProfileId, body) {
    assertCrmOperate(actor);
    const profile = await loadAlumniInScope(actor, alumniProfileId);
    const rel = await ensureRelationship(actor.collegeId, alumniProfileId, profile);
    // Warn if same type already active (do not hard-block)
    const warnings = await buildDuplicateContactWarnings(actor.collegeId, alumniProfileId, (await getCrmConfig(actor.collegeId)).recentContactWarnDays);
    const sameType = await db('alumni_crm_opportunities')
        .where({
        college_id: actor.collegeId,
        alumni_profile_id: alumniProfileId,
        opportunity_type: body.opportunityType,
    })
        .whereIn('status', ['IDENTIFIED', 'QUALIFYING', 'CONFIRMED', 'IN_PROGRESS'])
        .first();
    if (sameType) {
        warnings.push({
            code: 'SAME_OPPORTUNITY_ACTIVE',
            severity: 'WARN',
            message: `Same opportunity type already active: ${sameType.title}`,
        });
    }
    const [id] = await db('alumni_crm_opportunities').insert({
        college_id: actor.collegeId,
        alumni_profile_id: alumniProfileId,
        relationship_id: rel.id,
        opportunity_type: body.opportunityType,
        title: body.title,
        description: body.description ?? null,
        identified_by: actor.facultyUserId,
        identified_at: db.fn.now(),
        owner_faculty_id: body.ownerFacultyId ?? actor.facultyUserId,
        department_id: body.departmentId ?? actor.departmentId ?? profile.historical_department_id,
        status: body.status ?? 'IDENTIFIED',
        expected_outcome: body.expectedOutcome ?? null,
        target_date: body.targetDate ? body.targetDate.slice(0, 10) : null,
        source_interaction_id: body.sourceInteractionId ?? null,
    });
    await applyStageTransition({
        collegeId: actor.collegeId,
        relationshipId: Number(rel.id),
        alumniProfileId,
        toStage: 'OPPORTUNITY_IDENTIFIED',
        reason: `Opportunity created: ${body.title}`,
        ruleCode: 'OPPORTUNITY_CREATED',
        explicit: false,
        actorFacultyId: actor.facultyUserId,
    });
    if (['CONFIRMED', 'IN_PROGRESS'].includes(body.status ?? 'IDENTIFIED')) {
        await applyStageTransition({
            collegeId: actor.collegeId,
            relationshipId: Number(rel.id),
            alumniProfileId,
            toStage: 'ACTION_IN_PROGRESS',
            reason: 'Opportunity confirmed / in progress',
            ruleCode: 'OPPORTUNITY_ACTION',
            explicit: false,
            actorFacultyId: actor.facultyUserId,
        });
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'CRM_OPPORTUNITY_CREATE',
        entityType: 'alumni_crm_opportunities',
        entityId: Number(id),
    });
    return { opportunity: serializeOpportunity(await db('alumni_crm_opportunities').where({ id }).first()), warnings };
}
export async function patchOpportunity(actor, opportunityId, body) {
    assertCrmOperate(actor);
    const row = await db('alumni_crm_opportunities').where({ id: opportunityId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'CRM opportunity not found');
    await loadAlumniInScope(actor, Number(row.alumni_profile_id));
    const update = { updated_at: db.fn.now() };
    const map = {
        opportunityType: 'opportunity_type',
        title: 'title',
        description: 'description',
        ownerFacultyId: 'owner_faculty_id',
        departmentId: 'department_id',
        expectedOutcome: 'expected_outcome',
        status: 'status',
        sourceInteractionId: 'source_interaction_id',
    };
    for (const [k, col] of Object.entries(map)) {
        if (body[k] !== undefined)
            update[col] = body[k];
    }
    if (body.targetDate !== undefined)
        update.target_date = body.targetDate ? String(body.targetDate).slice(0, 10) : null;
    await db('alumni_crm_opportunities').where({ id: opportunityId }).update(update);
    if (['CONFIRMED', 'IN_PROGRESS'].includes(String(body.status ?? ''))) {
        const rel = await ensureRelationship(actor.collegeId, Number(row.alumni_profile_id));
        await applyStageTransition({
            collegeId: actor.collegeId,
            relationshipId: Number(rel.id),
            alumniProfileId: Number(row.alumni_profile_id),
            toStage: 'ACTION_IN_PROGRESS',
            reason: `Opportunity status → ${body.status}`,
            ruleCode: 'OPPORTUNITY_STATUS',
            explicit: false,
            actorFacultyId: actor.facultyUserId,
        });
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'CRM_OPPORTUNITY_UPDATE',
        entityType: 'alumni_crm_opportunities',
        entityId: opportunityId,
        metadata: body,
    });
    return { opportunity: serializeOpportunity(await db('alumni_crm_opportunities').where({ id: opportunityId }).first()) };
}
export function serializeOpportunity(row) {
    return {
        id: Number(row.id),
        alumniProfileId: Number(row.alumni_profile_id),
        opportunityType: row.opportunity_type,
        title: row.title,
        description: row.description,
        identifiedBy: row.identified_by != null ? Number(row.identified_by) : null,
        identifiedAt: row.identified_at ? new Date(row.identified_at).toISOString() : null,
        ownerFacultyId: row.owner_faculty_id != null ? Number(row.owner_faculty_id) : null,
        departmentId: row.department_id != null ? Number(row.department_id) : null,
        status: row.status,
        expectedOutcome: row.expected_outcome,
        targetDate: row.target_date,
        sourceInteractionId: row.source_interaction_id != null ? Number(row.source_interaction_id) : null,
    };
}
export async function createOutcome(actor, opportunityId, body) {
    assertCrmOperate(actor);
    const opp = await db('alumni_crm_opportunities').where({ id: opportunityId, college_id: actor.collegeId }).first();
    if (!opp)
        throw new AppError(404, 'CRM opportunity not found');
    await loadAlumniInScope(actor, Number(opp.alumni_profile_id));
    // Intention is never an outcome — require evidence or quantity/description of what happened
    if (!body.evidenceReference && body.quantity == null && !body.description) {
        throw new AppError(400, 'Outcome requires evidence, quantity, or description of what was achieved (intention is not an outcome)');
    }
    const [id] = await db('alumni_crm_outcomes').insert({
        college_id: actor.collegeId,
        alumni_profile_id: opp.alumni_profile_id,
        opportunity_id: opportunityId,
        interaction_id: body.interactionId ?? null,
        outcome_type: body.outcomeType,
        title: body.title,
        description: body.description ?? null,
        quantity: body.quantity ?? null,
        beneficiary_type: body.beneficiaryType ?? null,
        beneficiary_refs: body.beneficiaryRefs ? JSON.stringify(body.beneficiaryRefs) : null,
        source_type: body.sourceType ?? 'CRM_MANUAL',
        source_reference: body.sourceReference ?? null,
        evidence_reference: body.evidenceReference ?? null,
        verification_status: 'UNVERIFIED',
        outcome_date: body.outcomeDate.slice(0, 10),
        recorded_by: actor.facultyUserId,
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'CRM_OUTCOME_CREATE',
        entityType: 'alumni_crm_outcomes',
        entityId: Number(id),
    });
    return { outcome: serializeOutcome(await db('alumni_crm_outcomes').where({ id }).first()) };
}
export async function verifyOutcome(actor, outcomeId, action, notes) {
    if (!canVerifyOutcomes(actor))
        throw new AppError(403, 'Outcome verification privilege required');
    const row = await db('alumni_crm_outcomes').where({ id: outcomeId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Outcome not found');
    await loadAlumniInScope(actor, Number(row.alumni_profile_id));
    await db('alumni_crm_outcomes').where({ id: outcomeId }).update({
        verification_status: action === 'VERIFY' ? 'VERIFIED' : 'REJECTED',
        verified_by: actor.facultyUserId,
        verified_at: db.fn.now(),
        updated_at: db.fn.now(),
    });
    if (action === 'VERIFY') {
        const rel = await ensureRelationship(actor.collegeId, Number(row.alumni_profile_id));
        await applyStageTransition({
            collegeId: actor.collegeId,
            relationshipId: Number(rel.id),
            alumniProfileId: Number(row.alumni_profile_id),
            toStage: 'OUTCOME_ACHIEVED',
            reason: `Verified outcome: ${row.title}`,
            ruleCode: 'OUTCOME_VERIFIED',
            explicit: false,
            actorFacultyId: actor.facultyUserId,
        });
        if (row.opportunity_id) {
            await db('alumni_crm_opportunities').where({ id: row.opportunity_id }).update({
                status: 'COMPLETED',
                updated_at: db.fn.now(),
            });
        }
    }
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: action === 'VERIFY' ? 'CRM_OUTCOME_VERIFY' : 'CRM_OUTCOME_REJECT',
        entityType: 'alumni_crm_outcomes',
        entityId: outcomeId,
        metadata: { notes },
    });
    return { outcome: serializeOutcome(await db('alumni_crm_outcomes').where({ id: outcomeId }).first()) };
}
export function serializeOutcome(row) {
    return {
        id: Number(row.id),
        alumniProfileId: Number(row.alumni_profile_id),
        opportunityId: row.opportunity_id != null ? Number(row.opportunity_id) : null,
        interactionId: row.interaction_id != null ? Number(row.interaction_id) : null,
        outcomeType: row.outcome_type,
        title: row.title,
        description: row.description,
        quantity: row.quantity != null ? Number(row.quantity) : null,
        beneficiaryType: row.beneficiary_type,
        beneficiaryRefs: row.beneficiary_refs
            ? (typeof row.beneficiary_refs === 'string' ? JSON.parse(row.beneficiary_refs) : row.beneficiary_refs)
            : null,
        sourceType: row.source_type,
        sourceReference: row.source_reference,
        evidenceReference: row.evidence_reference,
        verificationStatus: row.verification_status,
        verifiedBy: row.verified_by != null ? Number(row.verified_by) : null,
        verifiedAt: row.verified_at ? new Date(row.verified_at).toISOString() : null,
        outcomeDate: row.outcome_date,
        recordedBy: row.recorded_by != null ? Number(row.recorded_by) : null,
    };
}
export async function createNote(actor, alumniProfileId, body) {
    assertCrmOperate(actor);
    const profile = await loadAlumniInScope(actor, alumniProfileId);
    const rel = await ensureRelationship(actor.collegeId, alumniProfileId, profile);
    const noteType = body.noteType;
    let visibility = body.visibility ?? 'INSTITUTIONAL';
    if (noteType === 'INTERNAL_NOTE')
        visibility = 'INTERNAL';
    // Never allow INTERNAL notes to be marked alumni-visible
    if (visibility === 'ALUMNI_VISIBLE' && noteType === 'INTERNAL_NOTE') {
        throw new AppError(400, 'Internal notes cannot be alumni-visible');
    }
    const [id] = await db('alumni_crm_notes').insert({
        college_id: actor.collegeId,
        alumni_profile_id: alumniProfileId,
        relationship_id: rel.id,
        followup_id: body.followupId ?? null,
        opportunity_id: body.opportunityId ?? null,
        note_type: noteType,
        body: body.body,
        visibility,
        author_faculty_id: actor.facultyUserId,
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'CRM_NOTE_CREATE',
        entityType: 'alumni_crm_notes',
        entityId: Number(id),
        metadata: { noteType, visibility },
    });
    return { note: serializeNote(await db('alumni_crm_notes').where({ id }).first()) };
}
export async function softDeleteNote(actor, noteId) {
    assertCrmOperate(actor);
    const row = await db('alumni_crm_notes').where({ id: noteId, college_id: actor.collegeId }).first();
    if (!row)
        throw new AppError(404, 'Note not found');
    await loadAlumniInScope(actor, Number(row.alumni_profile_id));
    await db('alumni_crm_notes').where({ id: noteId }).update({
        is_deleted: true,
        deleted_by: actor.facultyUserId,
        deleted_at: db.fn.now(),
        updated_at: db.fn.now(),
    });
    await audit({
        collegeId: actor.collegeId,
        actorFacultyId: actor.facultyUserId,
        action: 'CRM_NOTE_DELETE',
        entityType: 'alumni_crm_notes',
        entityId: noteId,
    });
    return { ok: true };
}
export function serializeNote(row) {
    return {
        id: Number(row.id),
        alumniProfileId: Number(row.alumni_profile_id),
        noteType: row.note_type,
        body: row.body,
        visibility: row.visibility,
        authorFacultyId: Number(row.author_faculty_id),
        createdAt: new Date(row.created_at).toISOString(),
        followupId: row.followup_id != null ? Number(row.followup_id) : null,
        opportunityId: row.opportunity_id != null ? Number(row.opportunity_id) : null,
    };
}
export async function listNotesForAdmin(actor, alumniProfileId) {
    await loadAlumniInScope(actor, alumniProfileId);
    const rows = await db('alumni_crm_notes as n')
        .leftJoin('faculty_users as f', 'f.id', 'n.author_faculty_id')
        .where({ 'n.college_id': actor.collegeId, 'n.alumni_profile_id': alumniProfileId, 'n.is_deleted': false })
        .orderBy('n.created_at', 'desc')
        .select('n.*', 'f.name as author_name');
    return {
        notes: rows.map((r) => ({ ...serializeNote(r), authorName: r.author_name })),
    };
}
export async function listOpportunitiesForProfile(actor, alumniProfileId) {
    await loadAlumniInScope(actor, alumniProfileId);
    const rows = await db('alumni_crm_opportunities')
        .where({ college_id: actor.collegeId, alumni_profile_id: alumniProfileId })
        .orderBy('identified_at', 'desc');
    return { opportunities: rows.map(serializeOpportunity) };
}
export async function listOutcomesForProfile(actor, alumniProfileId) {
    await loadAlumniInScope(actor, alumniProfileId);
    const rows = await db('alumni_crm_outcomes')
        .where({ college_id: actor.collegeId, alumni_profile_id: alumniProfileId })
        .orderBy('outcome_date', 'desc');
    return { outcomes: rows.map(serializeOutcome) };
}
export async function listFollowupsForProfile(actor, alumniProfileId) {
    await loadAlumniInScope(actor, alumniProfileId);
    const rows = await db('alumni_crm_followups')
        .where({ college_id: actor.collegeId, alumni_profile_id: alumniProfileId })
        .orderBy('due_date', 'asc');
    return { followups: rows.map(serializeFollowup) };
}
