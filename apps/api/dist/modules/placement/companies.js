import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { assertPlacementCollege, assertPlacementPermission } from './access.js';
import { recordPlacementAudit } from './audit.js';
import { notifyPlacementEvent } from './notifications.js';
import { getPlacementPolicy } from './defaults.js';
export const DRIVE_TRANSITIONS = {
    DRAFT: ['PUBLISHED', 'APPLICATION_OPEN', 'CANCELLED'],
    PUBLISHED: ['APPLICATION_OPEN', 'CANCELLED'],
    APPLICATION_OPEN: ['APPLICATION_CLOSED', 'IN_PROCESS', 'CANCELLED'],
    APPLICATION_CLOSED: ['IN_PROCESS', 'CANCELLED'],
    IN_PROCESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED: ['ARCHIVED'],
    CANCELLED: ['ARCHIVED'],
    ARCHIVED: [],
};
export async function transitionOpportunity(actor, opportunityId, nextStatus) {
    assertPlacementPermission(actor, 'placement.opportunity.manage');
    const before = await assertPlacementCollege('placement_opportunities', opportunityId, actor.collegeId);
    const allowed = DRIVE_TRANSITIONS[String(before.status)] ?? [];
    if (!allowed.includes(nextStatus)) {
        throw new AppError(400, `Invalid drive transition ${before.status} → ${nextStatus}`, undefined, 'INVALID_DRIVE_TRANSITION');
    }
    await db('placement_opportunities').where({ id: opportunityId }).update({
        status: nextStatus,
        updated_at: db.fn.now(),
    });
    await recordPlacementAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'OPPORTUNITY_TRANSITION',
        entityType: 'placement_opportunity',
        entityId: opportunityId,
        beforeState: { status: before.status },
        afterState: { status: nextStatus },
    });
    return db('placement_opportunities').where({ id: opportunityId }).first();
}
export async function listCompanies(actor) {
    assertPlacementPermission(actor, 'placement.view');
    const rows = await db('placement_companies')
        .where({ college_id: actor.collegeId })
        .orderBy('name');
    return rows.map(serializeCompany);
}
export async function getCompany(actor, companyId) {
    assertPlacementPermission(actor, 'placement.view');
    const row = await assertPlacementCollege('placement_companies', companyId, actor.collegeId);
    const contacts = await db('placement_company_contacts').where({ company_id: companyId });
    const opportunities = await db('placement_opportunities').where({ company_id: companyId }).orderBy('created_at', 'desc');
    const offers = await db('placement_offers').where({ company_id: companyId }).count({ c: '*' }).first();
    return {
        ...serializeCompany(row),
        contacts: contacts.map((c) => ({
            id: Number(c.id),
            name: c.name,
            designation: c.designation,
            email: c.email,
            phone: c.phone,
            contactType: c.contact_type,
            isPrimary: !!c.is_primary,
        })),
        opportunityCount: opportunities.length,
        offerCount: Number(offers?.c ?? 0),
        opportunities: opportunities.slice(0, 10).map((o) => ({
            id: Number(o.id),
            title: o.title,
            status: o.status,
        })),
    };
}
function serializeCompany(row) {
    return {
        id: Number(row.id),
        name: row.name,
        legalName: row.legal_name,
        industry: row.industry,
        website: row.website,
        companyType: row.company_type,
        description: row.description,
        headquarters: row.headquarters,
        status: row.status,
        relationshipStatus: row.relationship_status,
    };
}
export async function createCompany(actor, body) {
    assertPlacementPermission(actor, 'placement.company.manage');
    const [id] = await db('placement_companies').insert({
        college_id: actor.collegeId,
        name: body.name,
        legal_name: body.legalName ?? null,
        industry: body.industry ?? null,
        website: body.website ?? null,
        company_type: body.companyType ?? 'OTHER',
        description: body.description ?? null,
        headquarters: body.headquarters ?? null,
        status: 'ACTIVE',
        assigned_officer_id: actor.facultyUserId,
    });
    await recordPlacementAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'COMPANY_CREATED',
        entityType: 'placement_company',
        entityId: Number(id),
        afterState: body,
    });
    return db('placement_companies').where({ id }).first();
}
export async function updateCompany(actor, companyId, body) {
    assertPlacementPermission(actor, 'placement.company.manage');
    const before = await assertPlacementCollege('placement_companies', companyId, actor.collegeId);
    await db('placement_companies').where({ id: companyId, college_id: actor.collegeId }).update({
        name: body.name ?? before.name,
        legal_name: body.legalName !== undefined ? body.legalName : before.legal_name,
        industry: body.industry !== undefined ? body.industry : before.industry,
        website: body.website !== undefined ? body.website : before.website,
        company_type: body.companyType !== undefined ? body.companyType : before.company_type,
        description: body.description !== undefined ? body.description : before.description,
        headquarters: body.headquarters !== undefined ? body.headquarters : before.headquarters,
        status: body.status !== undefined ? body.status : before.status,
        updated_at: db.fn.now(),
    });
    await recordPlacementAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'COMPANY_UPDATED',
        entityType: 'placement_company',
        entityId: companyId,
        beforeState: { name: before.name },
        afterState: body,
    });
    return getCompany(actor, companyId);
}
export async function upsertCompanyContact(actor, companyId, body) {
    assertPlacementPermission(actor, 'placement.company.manage');
    await assertPlacementCollege('placement_companies', companyId, actor.collegeId);
    const payload = {
        college_id: actor.collegeId,
        company_id: companyId,
        name: body.name,
        designation: body.designation ?? null,
        email: body.email ?? null,
        phone: body.phone ?? null,
        contact_type: body.contactType ?? 'RECRUITER',
        is_primary: body.isPrimary ?? false,
    };
    if (body.id) {
        const existing = await db('placement_company_contacts').where({ id: body.id, company_id: companyId, college_id: actor.collegeId }).first();
        if (!existing)
            throw new AppError(404, 'Contact not found');
        await db('placement_company_contacts').where({ id: body.id }).update({ ...payload, updated_at: db.fn.now() });
        return db('placement_company_contacts').where({ id: body.id }).first();
    }
    const [id] = await db('placement_company_contacts').insert(payload);
    return db('placement_company_contacts').where({ id }).first();
}
export async function createOpportunity(actor, body) {
    assertPlacementPermission(actor, 'placement.opportunity.manage');
    await assertPlacementCollege('placement_companies', Number(body.companyId), actor.collegeId);
    const [id] = await db('placement_opportunities').insert({
        college_id: actor.collegeId,
        company_id: body.companyId,
        placement_season_id: body.placementSeasonId ?? null,
        opportunity_type: body.opportunityType ?? 'PLACEMENT',
        title: body.title,
        role: body.role ?? null,
        description: body.description ?? null,
        work_mode: body.workMode ?? null,
        employment_type: body.employmentType ?? null,
        ctc_min: body.ctcMin ?? null,
        ctc_max: body.ctcMax ?? null,
        stipend: body.stipend ?? null,
        currency: body.currency ?? 'INR',
        open_date: body.openDate ?? null,
        deadline: body.deadline ?? null,
        drive_date: body.driveDate ?? null,
        status: 'DRAFT',
        created_by: actor.facultyUserId,
    });
    const locations = body.locations ?? [];
    for (const loc of locations) {
        await db('placement_opportunity_locations').insert({
            opportunity_id: id,
            city: loc.city,
            state: loc.state ?? null,
        });
    }
    const rules = body.eligibilityRules ?? [];
    for (const rule of rules) {
        await db('placement_eligibility_rules').insert({
            college_id: actor.collegeId,
            opportunity_id: id,
            rule_type: rule.ruleType,
            operator: rule.operator ?? 'GTE',
            value: rule.value,
            is_mandatory: rule.isMandatory ?? true,
        });
    }
    await recordPlacementAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'OPPORTUNITY_CREATED',
        entityType: 'placement_opportunity',
        entityId: Number(id),
        afterState: body,
    });
    return getOpportunity(actor, Number(id));
}
export async function publishOpportunity(actor, opportunityId) {
    const published = await transitionOpportunity(actor, opportunityId, 'APPLICATION_OPEN');
    const registered = await db('placement_registrations')
        .where({ college_id: actor.collegeId })
        .whereIn('status', ['REGISTERED', 'ACTIVE'])
        .select('student_id')
        .limit(200);
    for (const row of registered) {
        await notifyPlacementEvent({
            studentId: Number(row.student_id),
            collegeId: actor.collegeId,
            type: 'PLACEMENT_DRIVE_PUBLISHED',
            title: 'New placement drive',
            body: 'A placement drive is now open for applications.',
            link: '/lms/placements/opportunities',
            relatedType: 'placement_opportunity',
            relatedId: opportunityId,
        });
    }
    return published;
}
export async function getOpportunity(actor, opportunityId) {
    assertPlacementPermission(actor, 'placement.view');
    const row = await assertPlacementCollege('placement_opportunities', opportunityId, actor.collegeId);
    const company = await db('placement_companies').where({ id: row.company_id }).first();
    const rules = await db('placement_eligibility_rules').where({ opportunity_id: opportunityId });
    const locations = await db('placement_opportunity_locations').where({ opportunity_id: opportunityId });
    const appCount = await db('placement_applications').where({ opportunity_id: opportunityId }).count({ c: '*' }).first();
    return {
        ...row,
        id: Number(row.id),
        companyName: company?.name,
        eligibilityRules: rules,
        locations,
        applicationCount: Number(appCount?.c ?? 0),
    };
}
export async function listStaffOpportunities(actor) {
    assertPlacementPermission(actor, 'placement.view');
    const rows = await db('placement_opportunities as o')
        .join('placement_companies as c', 'c.id', 'o.company_id')
        .where({ 'o.college_id': actor.collegeId })
        .select('o.*', 'c.name as company_name')
        .orderBy('o.created_at', 'desc');
    return rows.map((r) => ({
        id: Number(r.id),
        title: r.title,
        role: r.role,
        companyName: r.company_name,
        status: r.status,
        deadline: r.deadline,
        ctcMin: r.ctc_min != null ? Number(r.ctc_min) : null,
        ctcMax: r.ctc_max != null ? Number(r.ctc_max) : null,
    }));
}
export async function createOffer(actor, body) {
    assertPlacementPermission(actor, 'placement.offer.manage');
    await assertStudentCollege(Number(body.studentId), actor.collegeId);
    const opp = await assertPlacementCollege('placement_opportunities', Number(body.opportunityId), actor.collegeId);
    const duplicate = await db('placement_offers')
        .where({ student_id: body.studentId, opportunity_id: body.opportunityId, college_id: actor.collegeId })
        .whereNotIn('offer_status', ['DECLINED', 'REVOKED', 'CANCELLED'])
        .first();
    if (duplicate) {
        throw new AppError(409, 'Canonical offer already exists for this student and drive', undefined, 'DUPLICATE_OFFER');
    }
    const [id] = await db('placement_offers').insert({
        college_id: actor.collegeId,
        student_id: body.studentId,
        opportunity_id: body.opportunityId,
        application_id: body.applicationId ?? null,
        company_id: opp.company_id,
        role: body.role ?? opp.role,
        offer_date: new Date().toISOString().slice(0, 10),
        ctc: body.ctc ?? null,
        joining_location: body.joiningLocation ?? null,
        joining_date: body.joiningDate ?? null,
        offer_status: 'OFFERED',
        created_by: actor.facultyUserId,
    });
    if (body.applicationId) {
        await db('placement_applications').where({ id: body.applicationId }).update({
            status: 'OFFERED',
            updated_at: db.fn.now(),
        });
    }
    await syncStudentPlacementStatus(Number(body.studentId), actor.collegeId);
    await notifyPlacementEvent({
        studentId: Number(body.studentId),
        collegeId: actor.collegeId,
        type: 'PLACEMENT_OFFER_RECEIVED',
        title: 'Offer received',
        body: 'You have received a placement offer.',
        link: '/lms/placements/offers',
        relatedType: 'placement_offer',
        relatedId: Number(id),
    });
    await recordPlacementAudit({
        collegeId: actor.collegeId,
        actorId: actor.facultyUserId,
        action: 'OFFER_CREATED',
        entityType: 'placement_offer',
        entityId: Number(id),
        afterState: body,
    });
    return db('placement_offers').where({ id }).first();
}
async function assertStudentCollege(studentId, collegeId) {
    const s = await db('students').where({ id: studentId, college_id: collegeId }).first();
    if (!s)
        throw new AppError(404, 'Student not found');
    return s;
}
export async function getStudentOffer(studentId, collegeId, offerId) {
    const row = await db('placement_offers')
        .where({ id: offerId, student_id: studentId, college_id: collegeId })
        .first();
    if (!row)
        throw new AppError(404, 'Offer not found');
    return row;
}
export async function listStudentOffers(studentId, collegeId) {
    const rows = await db('placement_offers as o')
        .join('placement_companies as c', 'c.id', 'o.company_id')
        .join('placement_opportunities as opp', 'opp.id', 'o.opportunity_id')
        .where({ 'o.student_id': studentId, 'o.college_id': collegeId })
        .select('o.*', 'c.name as company_name', 'opp.title')
        .orderBy('o.offer_date', 'desc');
    return rows.map((r) => ({
        id: Number(r.id),
        companyName: r.company_name,
        title: r.title,
        role: r.role,
        ctc: r.ctc != null ? Number(r.ctc) : null,
        offerStatus: r.offer_status,
        offerDate: r.offer_date,
        joiningDate: r.joining_date,
        joiningLocation: r.joining_location,
    }));
}
export async function acceptOffer(studentId, collegeId, offerId) {
    const offer = await db('placement_offers')
        .where({ id: offerId, student_id: studentId, college_id: collegeId, offer_status: 'OFFERED' })
        .first();
    if (!offer)
        throw new AppError(404, 'Offer not found');
    const policy = await getPlacementPolicy(collegeId);
    const existingAccepted = await db('placement_offers')
        .where({ student_id: studentId, college_id: collegeId, offer_status: 'ACCEPTED' })
        .count({ c: '*' })
        .first();
    if (!policy.allowMultipleOffers && Number(existingAccepted?.c ?? 0) > 0) {
        throw new AppError(409, 'Multiple offers not allowed by institution policy');
    }
    await db.transaction(async (trx) => {
        await trx('placement_offers').where({ id: offerId }).update({
            offer_status: 'ACCEPTED',
            updated_at: trx.fn.now(),
        });
        await trx('placement_applications').where({ id: offer.application_id }).update({
            status: 'ACCEPTED',
            updated_at: trx.fn.now(),
        });
    });
    await syncStudentPlacementStatus(studentId, collegeId);
    return db('placement_offers').where({ id: offerId }).first();
}
export async function declineOffer(studentId, collegeId, offerId) {
    const offer = await db('placement_offers')
        .where({ id: offerId, student_id: studentId, college_id: collegeId })
        .first();
    if (!offer)
        throw new AppError(404, 'Offer not found');
    await db('placement_offers').where({ id: offerId }).update({
        offer_status: 'DECLINED',
        updated_at: db.fn.now(),
    });
    return db('placement_offers').where({ id: offerId }).first();
}
export async function listStaffOffers(actor) {
    assertPlacementPermission(actor, 'placement.view');
    const rows = await db('placement_offers as o')
        .join('students as s', 's.id', 'o.student_id')
        .join('placement_companies as c', 'c.id', 'o.company_id')
        .where({ 'o.college_id': actor.collegeId })
        .select('o.*', 's.name as student_name', 's.usn', 'c.name as company_name')
        .orderBy('o.created_at', 'desc')
        .limit(500);
    return rows;
}
async function syncStudentPlacementStatus(studentId, collegeId) {
    const offers = await db('placement_offers')
        .where({ student_id: studentId, college_id: collegeId })
        .whereIn('offer_status', ['OFFERED', 'ACCEPTED', 'JOINED']);
    let status = 'ACTIVE';
    const accepted = offers.filter((o) => o.offer_status === 'ACCEPTED' || o.offer_status === 'JOINED');
    if (accepted.length > 1)
        status = 'MULTIPLE_OFFERS';
    else if (accepted.length === 1)
        status = 'PLACED';
    else if (offers.length)
        status = 'ACTIVE';
    await db('student_career_profiles').where({ student_id: studentId }).update({
        placement_status: status,
        updated_at: db.fn.now(),
    });
}
export async function createRound(actor, opportunityId, body) {
    assertPlacementPermission(actor, 'placement.drive.manage');
    await assertPlacementCollege('placement_opportunities', opportunityId, actor.collegeId);
    const [id] = await db('placement_rounds').insert({
        college_id: actor.collegeId,
        opportunity_id: opportunityId,
        round_order: body.roundOrder,
        round_type: body.roundType,
        name: body.name,
        scheduled_at: body.scheduledAt ?? null,
        venue: body.venue ?? null,
        online_link: body.onlineLink ?? null,
        status: 'PLANNED',
    });
    return db('placement_rounds').where({ id }).first();
}
export async function updateRoundParticipant(actor, roundId, applicationId, body) {
    assertPlacementPermission(actor, 'placement.drive.manage');
    await assertPlacementCollege('placement_rounds', roundId, actor.collegeId);
    const existing = await db('placement_round_participants')
        .where({ round_id: roundId, application_id: applicationId })
        .first();
    const payload = {
        status: body.status,
        score: body.score ?? null,
        remarks: body.remarks ?? null,
        result: body.result ?? null,
        updated_at: db.fn.now(),
    };
    if (existing) {
        await db('placement_round_participants').where({ id: existing.id }).update(payload);
    }
    else {
        await db('placement_round_participants').insert({
            college_id: actor.collegeId,
            round_id: roundId,
            application_id: applicationId,
            ...payload,
        });
    }
    return db('placement_round_participants').where({ round_id: roundId, application_id: applicationId }).first();
}
