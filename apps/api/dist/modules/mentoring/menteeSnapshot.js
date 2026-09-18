import { db } from '../../db/index.js';
function emptySummary() {
    return {
        certifications: 0,
        achievements: 0,
        internships: 0,
        internshipStatus: null,
        placementStatus: null,
        trainingActive: 0,
        activeAlerts: 0,
        criticalAlerts: 0,
        pendingRequests: 0,
        academicTrend: 'INSUFFICIENT_DATA',
        latestSgpa: null,
    };
}
const INTERNSHIP_TYPES = ['INTERNSHIP', 'INTERN', 'INTERNSHIP_TRAINING'];
const OPEN_REQUEST_STATUSES_EXCLUDED = ['COMPLETED', 'CANCELLED', 'DRAFT', 'APPROVED', 'REJECTED', 'CLOSED'];
async function safeCount(build) {
    const map = new Map();
    try {
        const rows = await build();
        for (const r of rows)
            map.set(Number(r.student_id), Number(r.c));
    }
    catch {
        /* source table optional in minimal deployments */
    }
    return map;
}
function trendFrom(sgpas) {
    if (sgpas.length < 2)
        return sgpas.length === 1 ? 'STEADY' : 'INSUFFICIENT_DATA';
    const prev = sgpas[sgpas.length - 2];
    const last = sgpas[sgpas.length - 1];
    const delta = last - prev;
    if (delta > 0.15)
        return 'IMPROVING';
    if (delta < -0.15)
        return 'DECLINING';
    return 'STEADY';
}
/**
 * Batched per-mentee summary counts for the mentee LIST. One grouped query per
 * source keeps this O(sources) regardless of cohort size.
 */
export async function enrichMenteesSummary(collegeId, studentIds) {
    const map = new Map();
    for (const sid of studentIds)
        map.set(sid, emptySummary());
    if (studentIds.length === 0)
        return map;
    const [certMap, achMap, internMap, trainingMap, alertRows, requestMap, offerRows, semRows,] = await Promise.all([
        safeCount(() => db('student_certifications')
            .where('college_id', collegeId)
            .whereIn('student_id', studentIds)
            .select('student_id')
            .count({ c: '*' })
            .groupBy('student_id')),
        safeCount(() => db('student_achievements')
            .where('college_id', collegeId)
            .whereIn('student_id', studentIds)
            .select('student_id')
            .count({ c: '*' })
            .groupBy('student_id')),
        safeCount(() => db('student_experiences')
            .where('college_id', collegeId)
            .whereIn('student_id', studentIds)
            .whereIn('experience_type', INTERNSHIP_TYPES)
            .select('student_id')
            .count({ c: '*' })
            .groupBy('student_id')),
        safeCount(() => db('training_enrollments')
            .where('college_id', collegeId)
            .whereIn('student_id', studentIds)
            .where('completion_status', 'IN_PROGRESS')
            .select('student_id')
            .count({ c: '*' })
            .groupBy('student_id')),
        (async () => {
            try {
                return await db('student_academic_alerts')
                    .where('college_id', collegeId)
                    .whereIn('student_id', studentIds)
                    .where('status', 'ACTIVE')
                    .where('visible_to_mentor', true)
                    .select('student_id', 'severity');
            }
            catch {
                return [];
            }
        })(),
        safeCount(() => db('student_service_requests')
            .where('college_id', collegeId)
            .whereIn('student_id', studentIds)
            .whereNotIn('status', OPEN_REQUEST_STATUSES_EXCLUDED)
            .select('student_id')
            .count({ c: '*' })
            .groupBy('student_id')),
        (async () => {
            try {
                return await db('placement_offers')
                    .where('college_id', collegeId)
                    .whereIn('student_id', studentIds)
                    .select('student_id', 'offer_status', 'offer_date')
                    .orderBy('offer_date', 'desc');
            }
            catch {
                return [];
            }
        })(),
        (async () => {
            try {
                return await db('semester_results as sr')
                    .join('semesters as s', 's.id', 'sr.semester_id')
                    .where('sr.college_id', collegeId)
                    .whereIn('sr.student_id', studentIds)
                    .whereNotNull('sr.sgpa')
                    .select('sr.student_id', 'sr.sgpa', 'sr.semester_id')
                    .orderBy(['sr.student_id', 'sr.semester_id']);
            }
            catch {
                return [];
            }
        })(),
    ]);
    // Alerts → per-student active / critical counts.
    const alertActive = new Map();
    const alertCritical = new Map();
    for (const r of alertRows) {
        const sid = Number(r.student_id);
        alertActive.set(sid, (alertActive.get(sid) ?? 0) + 1);
        const sev = String(r.severity ?? '').toUpperCase();
        if (sev === 'CRITICAL' || sev === 'HIGH' || sev === 'DANGER') {
            alertCritical.set(sid, (alertCritical.get(sid) ?? 0) + 1);
        }
    }
    // Placement offers → latest status per student (rows already newest-first).
    const placementStatus = new Map();
    for (const r of offerRows) {
        const sid = Number(r.student_id);
        if (!placementStatus.has(sid))
            placementStatus.set(sid, String(r.offer_status));
    }
    // Internship latest status (open when end_date missing/future) — derived count already; status derived here.
    const internStatus = new Map();
    try {
        const iRows = await db('student_experiences')
            .where('college_id', collegeId)
            .whereIn('student_id', studentIds)
            .whereIn('experience_type', INTERNSHIP_TYPES)
            .select('student_id', 'end_date', 'organization')
            .orderBy('start_date', 'desc');
        const now = new Date();
        for (const r of iRows) {
            const sid = Number(r.student_id);
            if (internStatus.has(sid))
                continue;
            const ongoing = !r.end_date || new Date(r.end_date) >= now;
            internStatus.set(sid, ongoing ? 'ONGOING' : 'COMPLETED');
        }
    }
    catch {
        /* optional */
    }
    // Semester SGPA trend.
    const sgpaSeq = new Map();
    for (const r of semRows) {
        const sid = Number(r.student_id);
        if (!sgpaSeq.has(sid))
            sgpaSeq.set(sid, []);
        sgpaSeq.get(sid).push(Number(r.sgpa));
    }
    for (const sid of studentIds) {
        const s = map.get(sid);
        s.certifications = certMap.get(sid) ?? 0;
        s.achievements = achMap.get(sid) ?? 0;
        s.internships = internMap.get(sid) ?? 0;
        s.internshipStatus = internStatus.get(sid) ?? null;
        s.trainingActive = trainingMap.get(sid) ?? 0;
        s.activeAlerts = alertActive.get(sid) ?? 0;
        s.criticalAlerts = alertCritical.get(sid) ?? 0;
        s.pendingRequests = requestMap.get(sid) ?? 0;
        s.placementStatus = placementStatus.get(sid) ?? null;
        const seq = sgpaSeq.get(sid) ?? [];
        s.latestSgpa = seq.length ? seq[seq.length - 1] : null;
        s.academicTrend = trendFrom(seq);
    }
    return map;
}
/**
 * Detailed enrichment lists for a single mentee's 360 view. Caller must have
 * already asserted mentor scope. Every source is optional-guarded and alerts
 * respect `visible_to_mentor`.
 */
export async function menteeExtras(collegeId, studentId) {
    const opt = async (p, fallback) => {
        try {
            return await p;
        }
        catch {
            return fallback;
        }
    };
    const [certifications, internships, placements, training, achievements, alerts, requests, sem] = await Promise.all([
        opt(db('student_certifications')
            .where({ college_id: collegeId, student_id: studentId })
            .select('id', 'certificate_name', 'provider', 'issue_date', 'expiry_date', 'credential_id', 'verification_status')
            .orderBy('issue_date', 'desc'), []),
        opt(db('student_experiences')
            .where({ college_id: collegeId, student_id: studentId })
            .whereIn('experience_type', INTERNSHIP_TYPES)
            .select('id', 'organization', 'role', 'start_date', 'end_date', 'verification_status')
            .orderBy('start_date', 'desc'), []),
        opt(db('placement_offers as o')
            .leftJoin('placement_companies as c', 'c.id', 'o.company_id')
            .where({ 'o.college_id': collegeId, 'o.student_id': studentId })
            .select('o.id', 'o.role', 'o.offer_status', 'o.offer_date', 'o.ctc', 'c.name as company')
            .orderBy('o.offer_date', 'desc'), []),
        opt(db('training_enrollments as te')
            .join('training_programs as tp', 'tp.id', 'te.training_program_id')
            .where({ 'te.college_id': collegeId, 'te.student_id': studentId })
            .select('te.id', 'tp.name as program', 'te.status', 'te.completion_status', 'te.enrolled_at')
            .orderBy('te.enrolled_at', 'desc'), []),
        opt(db('student_achievements')
            .where({ college_id: collegeId, student_id: studentId })
            .select('id', 'achievement_type', 'title', 'issuer', 'achievement_date', 'verification_status')
            .orderBy('achievement_date', 'desc'), []),
        opt(db('student_academic_alerts')
            .where({ college_id: collegeId, student_id: studentId, status: 'ACTIVE', visible_to_mentor: true })
            .select('id', 'alert_type', 'severity', 'title', 'message', 'created_at')
            .orderBy('created_at', 'desc'), []),
        opt(db('student_service_requests as r')
            .leftJoin('student_service_request_types as t', 't.id', 'r.request_type_id')
            .where({ 'r.college_id': collegeId, 'r.student_id': studentId })
            .whereNot('r.status', 'DRAFT')
            .select('r.id', 'r.request_number', 'r.title', 'r.status', 'r.current_stage', 'r.submitted_at', 't.name as request_type')
            .orderBy('r.created_at', 'desc')
            .limit(15), []),
        opt(db('semester_results')
            .where({ college_id: collegeId, student_id: studentId })
            .whereNotNull('sgpa')
            .select('semester_id', 'sgpa')
            .orderBy('semester_id'), []),
    ]);
    const series = sem.map((r) => ({ semesterId: Number(r.semester_id), sgpa: Number(r.sgpa) }));
    return {
        certifications,
        internships,
        placements,
        training,
        achievements,
        alerts,
        requests,
        trend: { series, direction: trendFrom(series.map((s) => s.sgpa)) },
    };
}
