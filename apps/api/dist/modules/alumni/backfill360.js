import { db } from '../../db/index.js';
import { ensureDefaultFreshnessConfig } from './freshness.js';
import { upsertProvenance } from './provenance.js';
import { buildRelationshipSummary } from './relationship.js';
import { computeAlumniCompleteness } from './completeness360.js';
/**
 * Backfill Alumni 360 from existing authoritative / alumni-owned records.
 * Never invents missing information — unknown remains UNKNOWN.
 */
export async function backfillAlumni360(collegeId) {
    const stats = {
        totalAlumni: 0,
        academicLinkage: 0,
        careerInformation: 0,
        contactCoverage: 0,
        verifiedProfiles: 0,
        profilesRequiringUpdate: 0,
        duplicatesDetected: 0,
        unresolvedIdentityCandidates: 0,
        provenanceSeeded: 0,
        collegesProcessed: 0,
    };
    const colleges = collegeId
        ? await db('colleges').where({ id: collegeId })
        : await db('colleges').select('id');
    for (const college of colleges) {
        const cid = Number(college.id);
        stats.collegesProcessed += 1;
        await ensureDefaultFreshnessConfig(cid);
        const profiles = await db('alumni_profiles').where({ college_id: cid });
        stats.totalAlumni += profiles.length;
        for (const profile of profiles) {
            if (profile.historical_usn && profile.student_id && (profile.historical_department_id || profile.historical_program_id)) {
                stats.academicLinkage += 1;
            }
            if (profile.verification_state === 'VERIFIED')
                stats.verifiedProfiles += 1;
            if (profile.email || profile.phone_override)
                stats.contactCoverage += 1;
            // Seed provenance for academic snapshot (AUTHORITATIVE / ERP)
            await upsertProvenance({
                collegeId: cid,
                alumniProfileId: Number(profile.id),
                entityType: 'alumni_profile',
                entityId: Number(profile.id),
                fieldName: 'historical_usn',
                sourceType: 'ERP',
                verificationStatus: 'AUTHORITATIVE',
                valueSnapshot: profile.historical_usn,
            });
            stats.provenanceSeeded += 1;
            await upsertProvenance({
                collegeId: cid,
                alumniProfileId: Number(profile.id),
                entityType: 'alumni_profile',
                entityId: Number(profile.id),
                fieldName: 'graduation_year',
                sourceType: 'ERP',
                verificationStatus: profile.verification_state === 'VERIFIED' ? 'INSTITUTION_VERIFIED' : 'UNVERIFIED',
                valueSnapshot: profile.graduation_year,
            });
            const employment = await db('alumni_employment').where({ college_id: cid, alumni_profile_id: profile.id });
            if (employment.length) {
                stats.careerInformation += 1;
                for (const emp of employment) {
                    if (await db.schema.hasColumn('alumni_employment', 'source_type')) {
                        if (!emp.source_type || emp.source_type === 'ALUMNI_SELF') {
                            await db('alumni_employment').where({ id: emp.id }).update({
                                source_type: emp.source_type || 'ALUMNI_SELF',
                                captured_at: emp.captured_at || emp.created_at || db.fn.now(),
                            });
                        }
                    }
                    await upsertProvenance({
                        collegeId: cid,
                        alumniProfileId: Number(profile.id),
                        entityType: 'alumni_employment',
                        entityId: Number(emp.id),
                        fieldName: 'organization',
                        sourceType: emp.source_type || 'ALUMNI_SELF',
                        verificationStatus: emp.verification_status || 'SELF_DECLARED',
                        valueSnapshot: emp.organization,
                    });
                }
            }
            // Migrate legacy mentorship flag into explicit willingness when set
            if ((await db.schema.hasColumn('alumni_profiles', 'open_to_mentoring')) &&
                profile.mentorship_available &&
                profile.open_to_mentoring == null) {
                await db('alumni_profiles').where({ id: profile.id }).update({
                    open_to_mentoring: true,
                    willingness_confirmed_at: profile.updated_at || db.fn.now(),
                });
            }
            const [higherStudies, achievements, entrepreneurship, capabilities] = await Promise.all([
                db.schema.hasTable('alumni_higher_studies').then((ok) => ok ? db('alumni_higher_studies').where({ alumni_profile_id: profile.id }) : []),
                db.schema.hasTable('alumni_achievements').then((ok) => ok ? db('alumni_achievements').where({ alumni_profile_id: profile.id }) : []),
                db.schema.hasTable('alumni_entrepreneurship').then((ok) => ok ? db('alumni_entrepreneurship').where({ alumni_profile_id: profile.id }) : []),
                db.schema.hasTable('alumni_interest_capabilities').then((ok) => ok ? db('alumni_interest_capabilities').where({ alumni_profile_id: profile.id }) : []),
            ]);
            const relationship = await buildRelationshipSummary(cid, Number(profile.id), Number(profile.student_id));
            const completeness = await computeAlumniCompleteness({
                profile,
                employment,
                higherStudies: higherStudies,
                achievements: achievements,
                entrepreneurship: entrepreneurship,
                capabilities: capabilities,
                relationship: {
                    eventsAttended: relationship.eventsAttended,
                    contributions: relationship.contributions,
                    mentoringInteractions: relationship.mentoringInteractions,
                },
            });
            const needsUpdate = completeness.sections.some((s) => ['NOT_PROVIDED', 'NEEDS_UPDATE', 'PARTIAL'].includes(s.status) && s.key !== 'INSTITUTIONAL_RELATIONSHIP');
            if (needsUpdate)
                stats.profilesRequiringUpdate += 1;
        }
        // Duplicate detection (candidates only — never auto-merge)
        if (await db.schema.hasTable('alumni_identity_candidates')) {
            const nameYear = new Map();
            for (const p of profiles) {
                const key = `${String(p.historical_name).toLowerCase().replace(/[^a-z0-9]/g, '')}|${p.graduation_year}`;
                if (!nameYear.has(key))
                    nameYear.set(key, []);
                nameYear.get(key).push(Number(p.id));
            }
            for (const ids of nameYear.values()) {
                if (ids.length < 2)
                    continue;
                stats.duplicatesDetected += ids.length - 1;
                for (let i = 0; i < ids.length; i++) {
                    for (let j = i + 1; j < ids.length; j++) {
                        const primary = Math.min(ids[i], ids[j]);
                        const candidate = Math.max(ids[i], ids[j]);
                        const existing = await db('alumni_identity_candidates')
                            .where({ primary_profile_id: primary, candidate_profile_id: candidate })
                            .first();
                        if (!existing) {
                            await db('alumni_identity_candidates').insert({
                                college_id: cid,
                                primary_profile_id: primary,
                                candidate_profile_id: candidate,
                                match_reason: 'NAME_GRAD_YEAR',
                                match_score: 60,
                                evidence: JSON.stringify({ reason: 'NAME_GRAD_YEAR' }),
                                status: 'AMBIGUOUS',
                            });
                        }
                    }
                }
            }
            const unresolved = await db('alumni_identity_candidates')
                .where({ college_id: cid })
                .whereIn('status', ['OPEN', 'AMBIGUOUS'])
                .count({ c: '*' })
                .first();
            stats.unresolvedIdentityCandidates += Number(unresolved?.c ?? 0);
        }
    }
    const pct = (n) => (stats.totalAlumni ? Math.round((n / stats.totalAlumni) * 1000) / 10 : 0);
    return {
        ...stats,
        academicLinkagePct: pct(stats.academicLinkage),
        careerInformationPct: pct(stats.careerInformation),
        contactCoveragePct: pct(stats.contactCoverage),
        verifiedProfilesPct: pct(stats.verifiedProfiles),
        profilesRequiringUpdatePct: pct(stats.profilesRequiringUpdate),
        note: 'Unknown fields remain UNKNOWN — no invented data.',
    };
}
