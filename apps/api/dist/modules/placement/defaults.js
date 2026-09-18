import { db } from '../../db/index.js';
export async function getPlacementPolicy(collegeId) {
    const row = await db('college_placement_policies').where({ college_id: collegeId }).first();
    return {
        minProfileCompletion: Number(row?.min_profile_completion ?? 60),
        allowMultipleOffers: row?.allow_multiple_offers !== 0 && row?.allow_multiple_offers !== false,
        offerPolicy: row?.offer_policy ?? 'MULTIPLE_ALLOWED',
        allowWithdrawAfterApply: row?.allow_withdraw_after_apply !== 0,
        placementRegistrationRequired: row?.placement_registration_required !== 0,
        resumeRequired: row?.resume_required !== 0,
        blockAfterOfferAcceptance: !!row?.block_after_offer_acceptance,
        dataConsentRequired: row?.data_consent_required !== 0,
        recruiterPortalEnabled: !!row?.recruiter_portal_enabled,
        recruiterShareFields: row?.recruiter_share_fields
            ? JSON.parse(String(row.recruiter_share_fields))
            : ['usn', 'name', 'email', 'program', 'cgpa'],
    };
}
export async function listSeasons(collegeId) {
    return db('placement_seasons').where({ college_id: collegeId }).orderBy('start_date', 'desc');
}
export async function getActiveSeason(collegeId) {
    return db('placement_seasons')
        .where({ college_id: collegeId, status: 'ACTIVE' })
        .orderBy('id', 'desc')
        .first();
}
