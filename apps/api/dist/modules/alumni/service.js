import bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { signToken } from '../../utils/token.js';
import { getPasswordError, PASSWORD_MIN_LENGTH } from '../../utils/password.js';
import { isAdminRole } from '../../utils/permissions.js';
const VISIBILITY = ['PRIVATE', 'INSTITUTION_ONLY', 'ALUMNI_NETWORK', 'PUBLIC'];
const ADMIN_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'ALUMNI_COORDINATOR'];
function passwordField() {
    return z.string().min(PASSWORD_MIN_LENGTH).superRefine((value, ctx) => {
        const error = getPasswordError(value);
        if (error)
            ctx.addIssue({ code: 'custom', message: error });
    });
}
export const alumniLoginSchema = z.object({
    email: z.string().email().transform((v) => v.trim().toLowerCase()),
    password: z.string().min(1),
});
export const alumniClaimSchema = z.object({
    usn: z.string().trim().min(3).max(64).transform((v) => v.toUpperCase()),
    email: z.string().email().transform((v) => v.trim().toLowerCase()),
    phone: z.string().trim().max(32).optional().nullable(),
    graduationYear: z.number().int().min(1950).max(2100),
    password: passwordField(),
    currentCity: z.string().trim().max(128).optional().nullable(),
});
export const alumniForgotSchema = z.object({
    email: z.string().email().transform((v) => v.trim().toLowerCase()),
});
export const alumniProfileUpdateSchema = z.object({
    headline: z.string().trim().max(255).optional().nullable(),
    biography: z.string().trim().max(4000).optional().nullable(),
    profilePhotoUrl: z.string().trim().url().max(512).optional().nullable(),
    currentCity: z.string().trim().max(128).optional().nullable(),
    currentCountry: z.string().trim().max(128).optional().nullable(),
    skills: z.array(z.string().trim().min(1).max(64)).max(40).optional(),
    interests: z.array(z.string().trim().min(1).max(64)).max(40).optional(),
    linkedinUrl: z.string().trim().url().max(512).optional().nullable(),
    websiteUrl: z.string().trim().url().max(512).optional().nullable(),
    networkingAvailable: z.boolean().optional(),
    mentorshipAvailable: z.boolean().optional(),
    mentorshipAreas: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
    emailVisibility: z.enum(VISIBILITY).optional(),
    phoneVisibility: z.enum(VISIBILITY).optional(),
    bioVisibility: z.enum(VISIBILITY).optional(),
    employmentVisibility: z.enum(VISIBILITY).optional(),
    socialVisibility: z.enum(VISIBILITY).optional(),
    networkingVisibility: z.enum(VISIBILITY).optional(),
}).strict();
export const employmentSchema = z.object({
    organization: z.string().trim().min(1).max(255),
    designation: z.string().trim().max(128).optional().nullable(),
    industry: z.string().trim().max(128).optional().nullable(),
    location: z.string().trim().max(128).optional().nullable(),
    startDate: z.string().trim().max(16).optional().nullable(),
    endDate: z.string().trim().max(16).optional().nullable(),
    isCurrent: z.boolean().optional(),
    employmentType: z.string().trim().max(32).optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const higherStudySchema = z.object({
    institution: z.string().trim().min(1).max(255),
    programName: z.string().trim().max(255).optional().nullable(),
    specialization: z.string().trim().max(255).optional().nullable(),
    country: z.string().trim().max(128).optional().nullable(),
    location: z.string().trim().max(128).optional().nullable(),
    startYear: z.number().int().min(1950).max(2100).optional().nullable(),
    completionYear: z.number().int().min(1950).max(2100).optional().nullable(),
    status: z.enum(['CURRENT', 'COMPLETED', 'DEFERRED']).optional(),
    description: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const entrepreneurshipSchema = z.object({
    organization: z.string().trim().min(1).max(255),
    role: z.string().trim().max(128).optional().nullable(),
    sector: z.string().trim().max(128).optional().nullable(),
    location: z.string().trim().max(128).optional().nullable(),
    websiteUrl: z.string().trim().url().max(512).optional().nullable(),
    yearFounded: z.number().int().min(1900).max(2100).optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const achievementSchema = z.object({
    achievementType: z.string().trim().min(1).max(64),
    title: z.string().trim().min(1).max(255),
    issuer: z.string().trim().max(255).optional().nullable(),
    achievementDate: z.string().trim().max(16).optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const transitionSchema = z.object({
    studentId: z.number().int().positive(),
    graduationYear: z.number().int().min(1950).max(2100),
    batchLabel: z.string().trim().max(64).optional().nullable(),
    admissionYear: z.number().int().min(1950).max(2100).optional().nullable(),
    email: z.string().email().optional(),
    initialPassword: passwordField().optional(),
    verifyNow: z.boolean().optional(),
}).strict();
export const verificationSchema = z.object({
    reason: z.string().trim().max(1000).optional().nullable(),
}).strict();
export const eventSchema = z.object({
    title: z.string().trim().min(1).max(255),
    eventType: z.string().trim().max(64).optional(),
    description: z.string().trim().max(4000).optional().nullable(),
    startsAt: z.string().trim().min(4).max(64),
    endsAt: z.string().trim().max(64).optional().nullable(),
    venue: z.string().trim().max(255).optional().nullable(),
    visibility: z.enum(['ALUMNI_NETWORK', 'PUBLIC', 'PRIVATE']).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED']).optional(),
    capacity: z.number().int().positive().optional().nullable(),
    registrationOpensAt: z.string().trim().max(64).optional().nullable(),
    registrationClosesAt: z.string().trim().max(64).optional().nullable(),
}).strict();
export const opportunitySchema = z.object({
    title: z.string().trim().min(1).max(255),
    opportunityType: z.enum(['JOB', 'INTERNSHIP', 'REFERRAL', 'MENTORSHIP', 'PROJECT', 'COLLABORATION']),
    organization: z.string().trim().max(255).optional().nullable(),
    location: z.string().trim().max(128).optional().nullable(),
    description: z.string().trim().max(4000).optional().nullable(),
    applicationUrl: z.string().trim().url().max(512).optional().nullable(),
    deadline: z.string().trim().max(16).optional().nullable(),
}).strict();
export const contributionSchema = z.object({
    purpose: z.enum(['SCHOLARSHIP', 'DEPARTMENT_DEVELOPMENT', 'LAB_SUPPORT', 'STUDENT_SUPPORT', 'EVENT_SPONSORSHIP', 'GENERAL']),
    amount: z.number().positive().optional().nullable(),
    idempotencyKey: z.string().trim().max(191).optional().nullable(),
    note: z.string().trim().max(2000).optional().nullable(),
}).strict();
export const noticeSchema = z.object({
    title: z.string().trim().min(1).max(255),
    body: z.string().trim().max(4000).optional().nullable(),
    audienceScope: z.enum(['ALL_ALUMNI', 'DEPARTMENT', 'PROGRAM', 'GRADUATION_YEAR']).optional(),
    departmentId: z.number().int().positive().optional().nullable(),
    programId: z.number().int().positive().optional().nullable(),
    graduationYear: z.number().int().min(1950).max(2100).optional().nullable(),
    status: z.enum(['DRAFT', 'PUBLISHED']).optional(),
}).strict();
function parseJson(raw, fallback) {
    if (raw == null)
        return fallback;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        }
        catch {
            return fallback;
        }
    }
    return raw;
}
function canAdmin(actor) {
    return isAdminRole(actor.role) || ADMIN_ROLES.includes(actor.role);
}
function assertAdmin(actor) {
    if (!canAdmin(actor))
        throw new AppError(403, 'Alumni administration access required');
}
async function audit(input) {
    if (!(await db.schema.hasTable('alumni_audit_log')))
        return;
    await db('alumni_audit_log').insert({
        college_id: input.collegeId,
        actor_type: input.actorType,
        actor_faculty_id: input.actorFacultyId ?? null,
        actor_alumni_id: input.actorAlumniId ?? null,
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    });
}
function profileQuery(collegeId) {
    return db('alumni_profiles as ap')
        .leftJoin('students as st', 'st.id', 'ap.student_id')
        .leftJoin('departments as d', 'd.id', 'ap.historical_department_id')
        .leftJoin('programs as p', 'p.id', 'ap.historical_program_id')
        .leftJoin('colleges as c', 'c.id', 'ap.college_id')
        .where('ap.college_id', collegeId)
        .select('ap.*', 'st.phone as student_phone', 'd.name as department_name', 'd.code as department_code', 'p.name as program_name', 'p.code as program_code', 'c.name as college_name', 'c.code as college_code');
}
function serializeProfile(row, options) {
    const adminOrSelf = options.viewer === 'self' || options.viewer === 'admin';
    const canSee = (visibility) => {
        if (adminOrSelf)
            return true;
        if (visibility === 'PUBLIC')
            return true;
        if (visibility === 'ALUMNI_NETWORK' && options.viewer === 'network')
            return true;
        return false;
    };
    const emailVisible = canSee(row.email_visibility);
    const phoneVisible = canSee(row.phone_visibility);
    const bioVisible = canSee(row.bio_visibility);
    const socialVisible = canSee(row.social_visibility);
    return {
        id: Number(row.id),
        studentId: Number(row.student_id),
        collegeId: Number(row.college_id),
        collegeName: row.college_name,
        collegeCode: row.college_code,
        role: 'ALUMNI',
        kind: 'alumni',
        roleLabel: 'Alumni',
        name: row.historical_name,
        email: emailVisible ? row.email : null,
        phone: phoneVisible ? (row.student_phone ?? null) : null,
        usn: row.historical_usn,
        departmentId: row.historical_department_id != null ? Number(row.historical_department_id) : null,
        departmentName: row.department_name,
        departmentCode: row.department_code,
        programId: row.historical_program_id != null ? Number(row.historical_program_id) : null,
        programName: row.program_name,
        programCode: row.program_code,
        batchLabel: row.batch_label,
        admissionYear: row.admission_year,
        graduationYear: Number(row.graduation_year),
        lifecycleState: row.lifecycle_state,
        verificationState: row.verification_state,
        isActive: Boolean(row.is_active),
        headline: row.headline,
        biography: bioVisible ? row.biography : null,
        profilePhotoUrl: row.profile_photo_url,
        currentCity: row.current_city,
        currentCountry: row.current_country,
        skills: parseJson(row.skills, []),
        interests: parseJson(row.interests, []),
        linkedinUrl: socialVisible ? row.linkedin_url : null,
        websiteUrl: socialVisible ? row.website_url : null,
        networkingAvailable: canSee(row.networking_visibility) ? Boolean(row.networking_available) : false,
        mentorshipAvailable: canSee(row.networking_visibility) ? Boolean(row.mentorship_available) : false,
        mentorshipAreas: canSee(row.networking_visibility) ? parseJson(row.mentorship_areas, []) : [],
        privacy: adminOrSelf
            ? {
                email: row.email_visibility,
                phone: row.phone_visibility,
                biography: row.bio_visibility,
                employment: row.employment_visibility,
                social: row.social_visibility,
                networking: row.networking_visibility,
            }
            : undefined,
    };
}
async function getProfileRow(profileId, collegeId) {
    const row = await profileQuery(collegeId).where('ap.id', profileId).first();
    if (!row)
        throw new AppError(404, 'Alumni profile not found');
    return row;
}
export async function alumniMe(profileId) {
    const profile = await db('alumni_profiles').where({ id: profileId }).first();
    if (!profile)
        throw new AppError(404, 'Alumni profile not found');
    return serializeProfile(await getProfileRow(profileId, Number(profile.college_id)), { viewer: 'self' });
}
export async function loginAlumni(email, password) {
    const profile = await db('alumni_profiles').where({ email, is_active: true }).first();
    if (!profile || !profile.password_hash)
        throw new AppError(401, 'Invalid email or password');
    if (profile.verification_state !== 'VERIFIED') {
        throw new AppError(403, 'This alumni account is not verified', undefined, 'ALUMNI_NOT_VERIFIED');
    }
    if (['SUSPENDED', 'ARCHIVED'].includes(String(profile.lifecycle_state))) {
        throw new AppError(403, 'This alumni account is not active', undefined, 'ACCOUNT_DEACTIVATED');
    }
    const ok = await bcrypt.compare(password, profile.password_hash);
    if (!ok)
        throw new AppError(401, 'Invalid email or password');
    const college = await db('colleges').where({ id: profile.college_id }).select('status').first();
    if (college && (college.status === 'SUSPENDED' || college.status === 'ARCHIVED')) {
        throw new AppError(403, 'This institution is currently suspended. Contact your administrator.', undefined, 'TENANT_SUSPENDED');
    }
    await db('alumni_profiles').where({ id: profile.id }).update({ last_login_at: db.fn.now() });
    const token = signToken({
        kind: 'alumni',
        alumniProfileId: Number(profile.id),
        studentId: Number(profile.student_id),
        collegeId: Number(profile.college_id),
        departmentId: profile.historical_department_id != null ? Number(profile.historical_department_id) : null,
        role: 'ALUMNI',
        email: profile.email,
        name: profile.historical_name,
    });
    await audit({ collegeId: Number(profile.college_id), actorType: 'ALUMNI', actorAlumniId: Number(profile.id), action: 'ALUMNI_LOGIN' });
    return { token, user: await alumniMe(Number(profile.id)) };
}
export async function claimAlumni(input) {
    const student = await db('students')
        .where({ usn: input.usn, email: input.email })
        .first();
    if (!student)
        throw new AppError(404, 'No matching completed student record was found');
    if (input.phone && student.phone && String(student.phone).replace(/\D/g, '') !== input.phone.replace(/\D/g, '')) {
        throw new AppError(400, 'Verification details did not match institutional records');
    }
    const hash = await bcrypt.hash(input.password, 10);
    const existing = await db('alumni_profiles').where({ student_id: student.id }).first();
    if (existing)
        throw new AppError(409, 'An alumni profile already exists for this student');
    const [id] = await db('alumni_profiles').insert({
        college_id: student.college_id,
        student_id: student.id,
        email: input.email,
        password_hash: hash,
        lifecycle_state: 'PENDING_VERIFICATION',
        verification_state: 'PENDING',
        historical_name: student.name,
        historical_usn: student.usn,
        historical_department_id: student.department_id ?? null,
        historical_program_id: student.program_id ?? null,
        graduation_year: input.graduationYear,
        current_city: input.currentCity ?? null,
    });
    await audit({ collegeId: Number(student.college_id), actorType: 'ALUMNI', actorAlumniId: Number(id), action: 'ALUMNI_CLAIM_SUBMITTED', entityType: 'alumni_profile', entityId: Number(id) });
    return { id: Number(id), verificationState: 'PENDING', message: 'Claim submitted for institutional verification.' };
}
export async function forgotAlumniPassword(email) {
    const profile = await db('alumni_profiles').where({ email }).first();
    if (profile) {
        await db('alumni_profiles').where({ id: profile.id }).update({
            reset_token: randomBytes(24).toString('hex'),
            reset_token_expires_at: new Date(Date.now() + 60 * 60 * 1000),
        });
    }
    return { message: 'If that email exists, password reset instructions will be sent.' };
}
export async function dashboard(actor) {
    const row = await getProfileRow(actor.alumniProfileId, actor.collegeId);
    const [employment, studies, events, opportunities, contributions, notices] = await Promise.all([
        listEmployment(actor),
        listHigherStudies(actor),
        listEvents(actor, { limit: 5 }),
        listOpportunities(actor, { limit: 5 }),
        db('alumni_contributions').where({ college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId }).orderBy('created_at', 'desc').limit(5),
        listNoticesForProfile(actor.alumniProfileId, actor.collegeId),
    ]);
    const completeness = [
        row.headline,
        row.biography,
        row.current_city,
        row.skills,
        employment.length,
        row.networking_available || row.mentorship_available,
    ].filter(Boolean).length;
    return {
        profile: serializeProfile(row, { viewer: 'self' }),
        profileCompletion: Math.round((completeness / 6) * 100),
        employment,
        higherStudies: studies,
        events: events.events,
        opportunities: opportunities.opportunities,
        contributions,
        notices: notices.slice(0, 5),
    };
}
export async function updateOwnProfile(actor, input) {
    const patch = { updated_at: db.fn.now() };
    const map = {
        headline: 'headline',
        biography: 'biography',
        profilePhotoUrl: 'profile_photo_url',
        currentCity: 'current_city',
        currentCountry: 'current_country',
        skills: 'skills',
        interests: 'interests',
        linkedinUrl: 'linkedin_url',
        websiteUrl: 'website_url',
        networkingAvailable: 'networking_available',
        mentorshipAvailable: 'mentorship_available',
        mentorshipAreas: 'mentorship_areas',
        emailVisibility: 'email_visibility',
        phoneVisibility: 'phone_visibility',
        bioVisibility: 'bio_visibility',
        employmentVisibility: 'employment_visibility',
        socialVisibility: 'social_visibility',
        networkingVisibility: 'networking_visibility',
    };
    for (const [key, value] of Object.entries(input)) {
        const col = map[key];
        if (!col)
            continue; // mass-assignment protection: ignore unknown / authoritative keys
        if (key === 'skills' || key === 'interests' || key === 'mentorshipAreas')
            patch[col] = JSON.stringify(value);
        else
            patch[col] = value === '' ? null : value;
    }
    await db('alumni_profiles').where({ id: actor.alumniProfileId, college_id: actor.collegeId }).update(patch);
    await audit({ collegeId: actor.collegeId, actorType: 'ALUMNI', actorAlumniId: actor.alumniProfileId, action: 'ALUMNI_PROFILE_UPDATED', entityType: 'alumni_profile', entityId: actor.alumniProfileId });
    return alumniMe(actor.alumniProfileId);
}
export async function listEmployment(actor) {
    return db('alumni_employment')
        .where({ college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId })
        .orderBy('is_current', 'desc')
        .orderBy('start_date', 'desc');
}
export async function upsertEmployment(actor, body, id) {
    const patch = {
        organization: body.organization,
        designation: body.designation ?? null,
        industry: body.industry ?? null,
        location: body.location ?? null,
        start_date: body.startDate ?? null,
        end_date: body.endDate ?? null,
        is_current: body.isCurrent ?? false,
        employment_type: body.employmentType ?? null,
        description: body.description ?? null,
        updated_at: db.fn.now(),
    };
    if (patch.is_current) {
        await db('alumni_employment').where({ college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId }).update({ is_current: false });
    }
    if (id) {
        const count = await db('alumni_employment').where({ id, college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId }).update(patch);
        if (!count)
            throw new AppError(404, 'Employment record not found');
        await audit({ collegeId: actor.collegeId, actorType: 'ALUMNI', actorAlumniId: actor.alumniProfileId, action: 'ALUMNI_EMPLOYMENT_UPDATED', entityType: 'alumni_employment', entityId: id });
        return db('alumni_employment').where({ id }).first();
    }
    const [newId] = await db('alumni_employment').insert({ college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId, ...patch });
    await audit({ collegeId: actor.collegeId, actorType: 'ALUMNI', actorAlumniId: actor.alumniProfileId, action: 'ALUMNI_EMPLOYMENT_CREATED', entityType: 'alumni_employment', entityId: Number(newId) });
    return db('alumni_employment').where({ id: newId }).first();
}
export async function listHigherStudies(actor) {
    return db('alumni_higher_studies').where({ college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId }).orderBy('start_year', 'desc');
}
export async function upsertHigherStudy(actor, body, id) {
    const patch = {
        institution: body.institution,
        program_name: body.programName ?? null,
        specialization: body.specialization ?? null,
        country: body.country ?? null,
        location: body.location ?? null,
        start_year: body.startYear ?? null,
        completion_year: body.completionYear ?? null,
        status: body.status ?? 'CURRENT',
        description: body.description ?? null,
        updated_at: db.fn.now(),
    };
    if (id) {
        const count = await db('alumni_higher_studies').where({ id, college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId }).update(patch);
        if (!count)
            throw new AppError(404, 'Higher-study record not found');
        return db('alumni_higher_studies').where({ id }).first();
    }
    const [newId] = await db('alumni_higher_studies').insert({ college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId, ...patch });
    return db('alumni_higher_studies').where({ id: newId }).first();
}
export async function listEntrepreneurship(actor) {
    return db('alumni_entrepreneurship').where({ college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId }).orderBy('year_founded', 'desc');
}
export async function createEntrepreneurship(actor, body) {
    const [id] = await db('alumni_entrepreneurship').insert({
        college_id: actor.collegeId,
        alumni_profile_id: actor.alumniProfileId,
        organization: body.organization,
        role: body.role ?? null,
        sector: body.sector ?? null,
        location: body.location ?? null,
        website_url: body.websiteUrl ?? null,
        year_founded: body.yearFounded ?? null,
        description: body.description ?? null,
    });
    return db('alumni_entrepreneurship').where({ id }).first();
}
export async function createAchievement(actor, body) {
    const [id] = await db('alumni_achievements').insert({
        college_id: actor.collegeId,
        alumni_profile_id: actor.alumniProfileId,
        achievement_type: body.achievementType,
        title: body.title,
        issuer: body.issuer ?? null,
        achievement_date: body.achievementDate ?? null,
        description: body.description ?? null,
    });
    return db('alumni_achievements').where({ id }).first();
}
export async function directory(actor, filters) {
    const limit = Math.min(Math.max(Number(filters.limit ?? 20), 1), 50);
    const page = Math.max(Number(filters.page ?? 1), 1);
    let q = profileQuery(actor.collegeId)
        .where('ap.verification_state', 'VERIFIED')
        .where('ap.is_active', true)
        .whereNot('ap.lifecycle_state', 'SUSPENDED');
    // Opt-out only: treat NULL as visible for pre-migration / unset rows
    if (await db.schema.hasColumn('alumni_profiles', 'directory_visible')) {
        q = q.andWhere((b) => b.where('ap.directory_visible', true).orWhereNull('ap.directory_visible'));
    }
    if (filters.q) {
        const term = `%${String(filters.q).trim()}%`;
        q = q.andWhere((b) => b.where('ap.historical_name', 'like', term).orWhere('ap.headline', 'like', term).orWhere('ap.current_city', 'like', term));
    }
    if (filters.graduationYear)
        q = q.andWhere('ap.graduation_year', Number(filters.graduationYear));
    if (filters.departmentId)
        q = q.andWhere('ap.historical_department_id', Number(filters.departmentId));
    if (filters.programId)
        q = q.andWhere('ap.historical_program_id', Number(filters.programId));
    if (filters.city)
        q = q.andWhere('ap.current_city', 'like', `%${String(filters.city)}%`);
    const rows = await q.orderBy('ap.historical_name').limit(limit).offset((page - 1) * limit);
    return { page, limit, alumni: rows.map((r) => serializeProfile(r, { viewer: 'network' })) };
}
export async function publicProfile(actor, profileId) {
    const row = await getProfileRow(profileId, actor.collegeId);
    if (row.verification_state !== 'VERIFIED')
        throw new AppError(404, 'Alumni profile not found');
    const profile = serializeProfile(row, { viewer: profileId === actor.alumniProfileId ? 'self' : 'network' });
    const employment = row.employment_visibility === 'ALUMNI_NETWORK' || profileId === actor.alumniProfileId
        ? await db('alumni_employment').where({ college_id: actor.collegeId, alumni_profile_id: profileId }).orderBy('is_current', 'desc').orderBy('start_date', 'desc')
        : [];
    return { profile, employment };
}
export async function listEvents(actor, filters) {
    const limit = Math.min(Math.max(Number(filters.limit ?? 20), 1), 50);
    const events = await db('alumni_events as e')
        .leftJoin('alumni_event_registrations as r', function join() {
        this.on('r.event_id', '=', 'e.id').andOn('r.alumni_profile_id', '=', db.raw('?', [actor.alumniProfileId]));
    })
        .where({ 'e.college_id': actor.collegeId, 'e.status': 'PUBLISHED' })
        .select('e.*', 'r.status as registration_status')
        .orderBy('e.starts_at', 'asc')
        .limit(limit);
    return { events };
}
export async function registerEvent(actor, eventId) {
    return db.transaction(async (trx) => {
        const event = await trx('alumni_events')
            .where({ id: eventId, college_id: actor.collegeId, status: 'PUBLISHED' })
            .forUpdate()
            .first();
        if (!event)
            throw new AppError(404, 'Alumni event not found');
        const now = Date.now();
        if (event.registration_closes_at && new Date(event.registration_closes_at).getTime() < now) {
            throw new AppError(400, 'Registration is closed');
        }
        if (event.registration_opens_at && new Date(event.registration_opens_at).getTime() > now) {
            throw new AppError(400, 'Registration is not open yet');
        }
        const existing = await trx('alumni_event_registrations').where({ event_id: eventId, alumni_profile_id: actor.alumniProfileId }).first();
        if (existing)
            return existing;
        if (event.capacity != null) {
            const count = await trx('alumni_event_registrations').where({ event_id: eventId, status: 'REGISTERED' }).count({ c: '*' }).first();
            if (Number(count?.c ?? 0) >= Number(event.capacity))
                throw new AppError(409, 'Event capacity is full');
        }
        const [id] = await trx('alumni_event_registrations').insert({
            college_id: actor.collegeId,
            event_id: eventId,
            alumni_profile_id: actor.alumniProfileId,
        });
        await trx('alumni_engagement').insert({
            college_id: actor.collegeId,
            alumni_profile_id: actor.alumniProfileId,
            engagement_type: 'EVENT_REGISTRATION',
            source_type: 'alumni_event',
            source_id: eventId,
        });
        return trx('alumni_event_registrations').where({ id }).first();
    });
}
export async function listOpportunities(actor, filters) {
    const limit = Math.min(Math.max(Number(filters.limit ?? 20), 1), 50);
    const opportunities = await db('alumni_opportunities')
        .where({ college_id: actor.collegeId, status: 'APPROVED' })
        .orderBy('created_at', 'desc')
        .limit(limit);
    return { opportunities };
}
export async function submitOpportunity(actor, body) {
    const [id] = await db('alumni_opportunities').insert({
        college_id: actor.collegeId,
        submitted_by_alumni_id: actor.alumniProfileId,
        title: body.title,
        opportunity_type: body.opportunityType,
        organization: body.organization ?? null,
        location: body.location ?? null,
        description: body.description ?? null,
        application_url: body.applicationUrl ?? null,
        deadline: body.deadline ?? null,
    });
    await audit({ collegeId: actor.collegeId, actorType: 'ALUMNI', actorAlumniId: actor.alumniProfileId, action: 'ALUMNI_OPPORTUNITY_SUBMITTED', entityType: 'alumni_opportunity', entityId: Number(id) });
    return db('alumni_opportunities').where({ id }).first();
}
export async function createContributionIntent(actor, body) {
    if (body.idempotencyKey) {
        const existing = await db('alumni_contributions').where({ college_id: actor.collegeId, idempotency_key: body.idempotencyKey }).first();
        if (existing) {
            if (Number(existing.alumni_profile_id) !== actor.alumniProfileId)
                throw new AppError(403, 'Contribution key belongs to another alumni profile');
            return existing;
        }
    }
    const [id] = await db('alumni_contributions').insert({
        college_id: actor.collegeId,
        alumni_profile_id: actor.alumniProfileId,
        purpose: body.purpose,
        amount: body.amount ?? null,
        idempotency_key: body.idempotencyKey ?? null,
        note: body.note ?? null,
    });
    return db('alumni_contributions').where({ id }).first();
}
export async function listContributions(actor) {
    return db('alumni_contributions').where({ college_id: actor.collegeId, alumni_profile_id: actor.alumniProfileId }).orderBy('created_at', 'desc');
}
async function listNoticesForProfile(profileId, collegeId) {
    const profile = await db('alumni_profiles').where({ id: profileId, college_id: collegeId }).first();
    if (!profile)
        return [];
    return db('alumni_notices')
        .where({ college_id: collegeId, status: 'PUBLISHED' })
        .andWhere((q) => {
        q.where('audience_scope', 'ALL_ALUMNI')
            .orWhere((b) => b.where('audience_scope', 'DEPARTMENT').where('department_id', profile.historical_department_id))
            .orWhere((b) => b.where('audience_scope', 'PROGRAM').where('program_id', profile.historical_program_id))
            .orWhere((b) => b.where('audience_scope', 'GRADUATION_YEAR').where('graduation_year', profile.graduation_year));
    })
        .orderBy('published_at', 'desc')
        .limit(20);
}
export async function listNotices(actor) {
    return { notices: await listNoticesForProfile(actor.alumniProfileId, actor.collegeId) };
}
export async function adminOverview(actor) {
    assertAdmin(actor);
    const [total, verified, pending, active, employed, studying, founders, opportunities, contributions, byDepartment, byGraduationYear,] = await Promise.all([
        db('alumni_profiles').where({ college_id: actor.collegeId }).count({ c: '*' }).first(),
        db('alumni_profiles').where({ college_id: actor.collegeId, verification_state: 'VERIFIED' }).count({ c: '*' }).first(),
        db('alumni_profiles').where({ college_id: actor.collegeId, verification_state: 'PENDING' }).count({ c: '*' }).first(),
        db('alumni_profiles').where({ college_id: actor.collegeId, lifecycle_state: 'ACTIVE' }).count({ c: '*' }).first(),
        db('alumni_employment').where({ college_id: actor.collegeId, is_current: true }).countDistinct({ c: 'alumni_profile_id' }).first(),
        db('alumni_higher_studies').where({ college_id: actor.collegeId, status: 'CURRENT' }).countDistinct({ c: 'alumni_profile_id' }).first(),
        db('alumni_entrepreneurship').where({ college_id: actor.collegeId }).countDistinct({ c: 'alumni_profile_id' }).first(),
        db('alumni_opportunities').where({ college_id: actor.collegeId }).count({ c: '*' }).first(),
        db('alumni_contributions').where({ college_id: actor.collegeId }).count({ c: '*' }).first(),
        db('alumni_profiles as ap').leftJoin('departments as d', 'd.id', 'ap.historical_department_id').where('ap.college_id', actor.collegeId).groupBy('ap.historical_department_id', 'd.name').select('d.name').count({ count: '*' }),
        db('alumni_profiles').where({ college_id: actor.collegeId }).groupBy('graduation_year').select('graduation_year').count({ count: '*' }).orderBy('graduation_year', 'desc'),
    ]);
    return {
        totals: {
            alumni: Number(total?.c ?? 0),
            verified: Number(verified?.c ?? 0),
            pendingVerification: Number(pending?.c ?? 0),
            active: Number(active?.c ?? 0),
            employed: Number(employed?.c ?? 0),
            higherStudies: Number(studying?.c ?? 0),
            entrepreneurs: Number(founders?.c ?? 0),
            opportunities: Number(opportunities?.c ?? 0),
            contributionIntents: Number(contributions?.c ?? 0),
        },
        byDepartment,
        byGraduationYear,
    };
}
export async function transitionStudent(actor, body) {
    assertAdmin(actor);
    return db.transaction(async (trx) => {
        const student = await trx('students').where({ id: body.studentId, college_id: actor.collegeId }).forUpdate().first();
        if (!student)
            throw new AppError(404, 'Student not found');
        const existing = await trx('alumni_profiles').where({ student_id: student.id }).first();
        if (existing)
            return existing;
        const hash = body.initialPassword ? await bcrypt.hash(body.initialPassword, 10) : null;
        const [id] = await trx('alumni_profiles').insert({
            college_id: actor.collegeId,
            student_id: student.id,
            email: (body.email ?? student.email).trim().toLowerCase(),
            password_hash: hash,
            lifecycle_state: body.verifyNow ? 'ACTIVE' : 'INVITED',
            verification_state: body.verifyNow ? 'VERIFIED' : 'PENDING',
            verified_by: body.verifyNow ? actor.facultyUserId : null,
            verified_at: body.verifyNow ? trx.fn.now() : null,
            historical_name: student.name,
            historical_usn: student.usn,
            historical_department_id: student.department_id ?? null,
            historical_program_id: student.program_id ?? null,
            batch_label: body.batchLabel ?? null,
            admission_year: body.admissionYear ?? null,
            graduation_year: body.graduationYear,
        });
        await trx('alumni_audit_log').insert({
            college_id: actor.collegeId,
            actor_type: 'FACULTY',
            actor_faculty_id: actor.facultyUserId,
            action: 'STUDENT_TRANSITIONED_TO_ALUMNI',
            entity_type: 'alumni_profile',
            entity_id: id,
            metadata: JSON.stringify({ studentId: student.id, verifyNow: Boolean(body.verifyNow) }),
        });
        return trx('alumni_profiles').where({ id }).first();
    });
}
export async function adminListProfiles(actor, filters) {
    assertAdmin(actor);
    const limit = Math.min(Math.max(Number(filters.limit ?? 30), 1), 100);
    const page = Math.max(Number(filters.page ?? 1), 1);
    let q = profileQuery(actor.collegeId);
    if (filters.verificationState)
        q = q.andWhere('ap.verification_state', String(filters.verificationState));
    if (filters.q) {
        const term = `%${String(filters.q)}%`;
        q = q.andWhere((b) => b.where('ap.historical_name', 'like', term).orWhere('ap.historical_usn', 'like', term).orWhere('ap.email', 'like', term));
    }
    const rows = await q.orderBy('ap.created_at', 'desc').limit(limit).offset((page - 1) * limit);
    return { page, limit, profiles: rows.map((r) => serializeProfile(r, { viewer: 'admin' })) };
}
export async function verifyProfile(actor, profileId) {
    assertAdmin(actor);
    const count = await db('alumni_profiles')
        .where({ id: profileId, college_id: actor.collegeId })
        .whereIn('verification_state', ['PENDING', 'REJECTED'])
        .update({
        verification_state: 'VERIFIED',
        lifecycle_state: 'ACTIVE',
        verified_by: actor.facultyUserId,
        verified_at: db.fn.now(),
        rejected_by: null,
        rejected_at: null,
        rejection_reason: null,
        updated_at: db.fn.now(),
    });
    if (!count)
        throw new AppError(404, 'Pending alumni profile not found');
    await audit({ collegeId: actor.collegeId, actorType: 'FACULTY', actorFacultyId: actor.facultyUserId, action: 'ALUMNI_VERIFIED', entityType: 'alumni_profile', entityId: profileId });
    return getProfileRow(profileId, actor.collegeId);
}
export async function rejectProfile(actor, profileId, reason) {
    assertAdmin(actor);
    const count = await db('alumni_profiles')
        .where({ id: profileId, college_id: actor.collegeId })
        .whereNot('verification_state', 'VERIFIED')
        .update({
        verification_state: 'REJECTED',
        lifecycle_state: 'ARCHIVED',
        rejected_by: actor.facultyUserId,
        rejected_at: db.fn.now(),
        rejection_reason: reason ?? null,
        updated_at: db.fn.now(),
    });
    if (!count)
        throw new AppError(404, 'Alumni profile not found');
    await audit({ collegeId: actor.collegeId, actorType: 'FACULTY', actorFacultyId: actor.facultyUserId, action: 'ALUMNI_REJECTED', entityType: 'alumni_profile', entityId: profileId, metadata: { reason } });
    return getProfileRow(profileId, actor.collegeId);
}
export async function adminCreateEvent(actor, body) {
    assertAdmin(actor);
    const [id] = await db('alumni_events').insert({
        college_id: actor.collegeId,
        title: body.title,
        event_type: body.eventType ?? 'ALUMNI_MEET',
        description: body.description ?? null,
        starts_at: new Date(body.startsAt),
        ends_at: body.endsAt ? new Date(body.endsAt) : null,
        venue: body.venue ?? null,
        visibility: body.visibility ?? 'ALUMNI_NETWORK',
        status: body.status ?? 'DRAFT',
        capacity: body.capacity ?? null,
        registration_opens_at: body.registrationOpensAt ? new Date(body.registrationOpensAt) : null,
        registration_closes_at: body.registrationClosesAt ? new Date(body.registrationClosesAt) : null,
        created_by: actor.facultyUserId,
    });
    return db('alumni_events').where({ id }).first();
}
export async function adminModerateOpportunity(actor, opportunityId, status) {
    assertAdmin(actor);
    const count = await db('alumni_opportunities').where({ id: opportunityId, college_id: actor.collegeId }).update({
        status,
        approved_by: status === 'APPROVED' ? actor.facultyUserId : null,
        approved_at: status === 'APPROVED' ? db.fn.now() : null,
        updated_at: db.fn.now(),
    });
    if (!count)
        throw new AppError(404, 'Opportunity not found');
    return db('alumni_opportunities').where({ id: opportunityId }).first();
}
export async function adminCreateNotice(actor, body) {
    assertAdmin(actor);
    const [id] = await db('alumni_notices').insert({
        college_id: actor.collegeId,
        title: body.title,
        body: body.body ?? null,
        audience_scope: body.audienceScope ?? 'ALL_ALUMNI',
        department_id: body.departmentId ?? null,
        program_id: body.programId ?? null,
        graduation_year: body.graduationYear ?? null,
        status: body.status ?? 'DRAFT',
        published_at: body.status === 'PUBLISHED' ? db.fn.now() : null,
        created_by: actor.facultyUserId,
    });
    return db('alumni_notices').where({ id }).first();
}
export async function adminAnalytics(actor) {
    return adminOverview(actor);
}
