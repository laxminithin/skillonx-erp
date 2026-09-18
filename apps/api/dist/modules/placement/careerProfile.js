import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { getStudentPlacementAcademicProfile } from './academicProfile.js';
const DEFAULT_SKILLS = [
    { name: 'Python', category: 'TECHNICAL' },
    { name: 'Java', category: 'TECHNICAL' },
    { name: 'C', category: 'TECHNICAL' },
    { name: 'C++', category: 'TECHNICAL' },
    { name: 'SQL', category: 'TECHNICAL' },
    { name: 'Machine Learning', category: 'DOMAIN' },
    { name: 'Power BI', category: 'TOOL' },
    { name: 'AWS', category: 'TOOL' },
    { name: 'Docker', category: 'TOOL' },
    { name: 'Kubernetes', category: 'TOOL' },
    { name: 'Communication', category: 'SOFT_SKILL' },
    { name: 'Aptitude', category: 'SOFT_SKILL' },
    { name: 'Problem Solving', category: 'SOFT_SKILL' },
];
export async function ensureCollegePlacementDefaults(collegeId) {
    if (!(await db.schema.hasTable('college_placement_policies')))
        return;
    const existing = await db('college_placement_policies').where({ college_id: collegeId }).first();
    if (!existing) {
        await db('college_placement_policies').insert({
            college_id: collegeId,
            min_profile_completion: 60,
            allow_multiple_offers: true,
            offer_policy: 'MULTIPLE_ALLOWED',
            placement_registration_required: true,
            data_consent_required: true,
            recruiter_portal_enabled: false,
            recruiter_share_fields: JSON.stringify(['usn', 'name', 'email', 'program', 'cgpa', 'resume']),
        });
    }
    if (await db.schema.hasTable('placement_skills')) {
        for (const skill of DEFAULT_SKILLS) {
            const row = await db('placement_skills').where({ college_id: collegeId, name: skill.name }).first();
            if (!row) {
                await db('placement_skills').insert({
                    college_id: collegeId,
                    name: skill.name,
                    category: skill.category,
                    is_active: true,
                });
            }
        }
    }
}
function computeProfileCompletion(input) {
    let score = 0;
    if (input.career?.headline)
        score += 10;
    if (input.career?.career_objective)
        score += 10;
    if (input.skills >= 3)
        score += 20;
    else if (input.skills >= 1)
        score += 10;
    if (input.projects >= 1)
        score += 20;
    if (input.certifications >= 1)
        score += 10;
    if (input.education >= 2)
        score += 20;
    else if (input.education >= 1)
        score += 10;
    if (input.resume >= 1)
        score += 10;
    return Math.min(100, score);
}
export async function refreshProfileCompletion(studentId, collegeId) {
    const [skills, projects, certs, education, resumes] = await Promise.all([
        db('student_skills').where({ student_id: studentId }).count({ c: '*' }).first(),
        db('student_projects').where({ student_id: studentId }).count({ c: '*' }).first(),
        db('student_certifications').where({ student_id: studentId }).count({ c: '*' }).first(),
        db('student_prior_education').where({ student_id: studentId }).count({ c: '*' }).first(),
        db('student_resume_versions').where({ student_id: studentId }).count({ c: '*' }).first(),
    ]);
    const career = await db('student_career_profiles').where({ student_id: studentId }).first();
    const pct = computeProfileCompletion({
        career,
        skills: Number(skills?.c ?? 0),
        projects: Number(projects?.c ?? 0),
        certifications: Number(certs?.c ?? 0),
        education: Number(education?.c ?? 0),
        resume: Number(resumes?.c ?? 0),
    });
    if (career) {
        await db('student_career_profiles').where({ id: career.id }).update({
            profile_completion_percentage: pct,
            updated_at: db.fn.now(),
        });
    }
    return pct;
}
export async function getOrCreateCareerProfile(studentId, collegeId) {
    let profile = await db('student_career_profiles').where({ student_id: studentId }).first();
    if (!profile) {
        const [id] = await db('student_career_profiles').insert({
            college_id: collegeId,
            student_id: studentId,
            placement_status: 'NOT_REGISTERED',
            profile_completion_percentage: 0,
        });
        profile = await db('student_career_profiles').where({ id }).first();
    }
    return profile;
}
export async function getStudentPlacementHome(studentId, collegeId) {
    const profile = await getOrCreateCareerProfile(studentId, collegeId);
    const academic = await getStudentPlacementAcademicProfile(studentId, collegeId);
    await refreshProfileCompletion(studentId, collegeId);
    const applications = await db('placement_applications')
        .where({ student_id: studentId, college_id: collegeId })
        .count({ c: '*' })
        .first();
    const offers = await db('placement_offers')
        .where({ student_id: studentId, college_id: collegeId })
        .whereIn('offer_status', ['OFFERED', 'ACCEPTED', 'JOINED'])
        .count({ c: '*' })
        .first();
    const openOpps = await db('placement_opportunities')
        .where({ college_id: collegeId })
        .whereIn('status', ['PUBLISHED', 'APPLICATION_OPEN'])
        .count({ c: '*' })
        .first();
    return {
        profileCompletion: Number(profile.profile_completion_percentage),
        placementStatus: profile.placement_status,
        academicSummary: {
            usn: academic.usn,
            program: academic.program,
            branch: academic.branch,
            cgpa: academic.cgpa,
            activeBacklogs: academic.activeBacklogs,
            graduationYear: academic.graduationYear,
        },
        applicationCount: Number(applications?.c ?? 0),
        offerCount: Number(offers?.c ?? 0),
        openOpportunityCount: Number(openOpps?.c ?? 0),
    };
}
export async function getFullCareerProfile(studentId, collegeId) {
    const profile = await getOrCreateCareerProfile(studentId, collegeId);
    const academic = await getStudentPlacementAcademicProfile(studentId, collegeId);
    const [skills, projects, certifications, education, experiences, achievements, resumes] = await Promise.all([
        db('student_skills').where({ student_id: studentId, college_id: collegeId }),
        db('student_projects').where({ student_id: studentId, college_id: collegeId }),
        db('student_certifications').where({ student_id: studentId, college_id: collegeId }),
        db('student_prior_education').where({ student_id: studentId, college_id: collegeId }),
        db('student_experiences').where({ student_id: studentId, college_id: collegeId }),
        db('student_achievements').where({ student_id: studentId, college_id: collegeId }),
        db('student_resume_versions').where({ student_id: studentId, college_id: collegeId }),
    ]);
    return {
        profile: {
            id: Number(profile.id),
            headline: profile.headline,
            careerObjective: profile.career_objective,
            preferredRoles: profile.preferred_roles ? JSON.parse(String(profile.preferred_roles)) : [],
            preferredLocations: profile.preferred_locations ? JSON.parse(String(profile.preferred_locations)) : [],
            higherStudiesInterest: !!profile.higher_studies_interest,
            entrepreneurshipInterest: !!profile.entrepreneurship_interest,
            placementStatus: profile.placement_status,
            profileCompletionPercentage: Number(profile.profile_completion_percentage),
            linkedinUrl: profile.linkedin_url,
            githubUrl: profile.github_url,
            portfolioUrl: profile.portfolio_url,
            leetcodeUrl: profile.leetcode_url,
        },
        academic: academic,
        skills,
        projects,
        certifications,
        education,
        experiences,
        achievements,
        resumeVersions: resumes,
    };
}
export async function updateCareerProfile(studentId, collegeId, body) {
    await getOrCreateCareerProfile(studentId, collegeId);
    await db('student_career_profiles').where({ student_id: studentId }).update({
        headline: body.headline ?? undefined,
        career_objective: body.careerObjective ?? undefined,
        preferred_roles: body.preferredRoles ? JSON.stringify(body.preferredRoles) : undefined,
        preferred_locations: body.preferredLocations ? JSON.stringify(body.preferredLocations) : undefined,
        higher_studies_interest: body.higherStudiesInterest ?? undefined,
        entrepreneurship_interest: body.entrepreneurshipInterest ?? undefined,
        linkedin_url: body.linkedinUrl ?? undefined,
        github_url: body.githubUrl ?? undefined,
        portfolio_url: body.portfolioUrl ?? undefined,
        leetcode_url: body.leetcodeUrl ?? undefined,
        updated_at: db.fn.now(),
    });
    await refreshProfileCompletion(studentId, collegeId);
    return getFullCareerProfile(studentId, collegeId);
}
export async function registerForPlacement(studentId, collegeId, body) {
    const season = await db('placement_seasons')
        .where({ id: body.placementSeasonId, college_id: collegeId, status: 'ACTIVE' })
        .first();
    if (!season)
        throw new AppError(404, 'Active placement season not found');
    const existing = await db('placement_registrations')
        .where({ student_id: studentId, placement_season_id: body.placementSeasonId })
        .first();
    const payload = {
        college_id: collegeId,
        student_id: studentId,
        academic_year_id: season.academic_year_id,
        placement_season_id: body.placementSeasonId,
        status: 'REGISTERED',
        data_consent_given: body.dataConsentGiven,
        consent_version: body.consentVersion ?? 'v1',
        consent_at: body.dataConsentGiven ? db.fn.now() : null,
        registered_at: db.fn.now(),
    };
    if (existing) {
        await db('placement_registrations').where({ id: existing.id }).update({ ...payload, updated_at: db.fn.now() });
    }
    else {
        await db('placement_registrations').insert(payload);
    }
    await db('student_career_profiles').where({ student_id: studentId }).update({
        placement_status: 'REGISTERED',
        updated_at: db.fn.now(),
    });
    return db('placement_registrations')
        .where({ student_id: studentId, placement_season_id: body.placementSeasonId })
        .first();
}
