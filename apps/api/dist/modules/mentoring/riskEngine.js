import { db } from '../../db/index.js';
export const DEFAULT_RISK_CONFIG = {
    attendanceAttentionPct: 75,
    attendanceHighPct: 65,
    cieAttentionPct: 40,
    assignmentMissAttention: 2,
    assignmentMissHigh: 4,
    backlogWatch: 1,
    backlogAttention: 2,
    backlogHigh: 4,
    followupOverdueDays: 0,
};
const LEVEL_SCORE = { NORMAL: 0, WATCH: 1, ATTENTION: 2, HIGH: 3 };
const SCORE_LEVEL = ['NORMAL', 'WATCH', 'ATTENTION', 'HIGH'];
/** Load per-college risk configuration, merged with attendance policy + defaults. */
export async function getRiskConfig(collegeId) {
    const cfg = { ...DEFAULT_RISK_CONFIG };
    try {
        const policy = await db('college_attendance_policies').where({ college_id: collegeId }).first();
        if (policy?.minimum_percentage != null)
            cfg.attendanceAttentionPct = Number(policy.minimum_percentage);
    }
    catch {
        /* attendance policy optional */
    }
    try {
        if (await db.schema.hasTable('mentoring_risk_config')) {
            const row = await db('mentoring_risk_config').where({ college_id: collegeId }).first();
            if (row) {
                cfg.attendanceAttentionPct = Number(row.attendance_attention_pct);
                cfg.attendanceHighPct = Number(row.attendance_high_pct);
                cfg.cieAttentionPct = Number(row.cie_attention_pct);
                cfg.assignmentMissAttention = Number(row.assignment_miss_attention);
                cfg.assignmentMissHigh = Number(row.assignment_miss_high);
                cfg.backlogWatch = Number(row.backlog_watch);
                cfg.backlogAttention = Number(row.backlog_attention);
                cfg.backlogHigh = Number(row.backlog_high);
                cfg.followupOverdueDays = Number(row.followup_overdue_days);
            }
        }
    }
    catch {
        /* config table optional */
    }
    return cfg;
}
function highest(...levels) {
    return levels.reduce((a, b) => (LEVEL_SCORE[b] > LEVEL_SCORE[a] ? b : a), 'NORMAL');
}
/**
 * Batched, rule-based, fully explainable risk computation for a set of students.
 * Reuses attendance, CIE (assessment sheets), examination backlogs, LMS
 * assignments, and mentoring follow-ups. No opaque scoring — every flag carries
 * a human-readable reason tied to the underlying data.
 */
export async function computeRiskForStudents(collegeId, studentIds, config) {
    const cfg = config ?? (await getRiskConfig(collegeId));
    const results = new Map();
    if (studentIds.length === 0)
        return results;
    // ── Attendance (overall %) ──────────────────────────────────────────
    const attRows = await db('attendance_records as ar')
        .join('attendance_sessions as s', 's.id', 'ar.attendance_session_id')
        .where('s.college_id', collegeId)
        .whereIn('ar.student_id', studentIds)
        .select('ar.student_id', 'ar.status');
    const attMap = new Map();
    for (const r of attRows) {
        const sid = Number(r.student_id);
        if (!attMap.has(sid))
            attMap.set(sid, { total: 0, present: 0 });
        const e = attMap.get(sid);
        e.total++;
        if (r.status === 'PRESENT' || r.status === 'LATE')
            e.present++;
    }
    // ── CIE (assessment marks) ──────────────────────────────────────────
    const cieMap = new Map();
    try {
        if (await db.schema.hasTable('assessment_student_rows')) {
            const cieRows = await db('assessment_student_rows as r')
                .join('assessment_mark_sheets as sh', 'sh.id', 'r.sheet_id')
                .where('sh.college_id', collegeId)
                .whereIn('r.student_id', studentIds)
                .whereNotNull('r.total_awarded')
                .where('sh.max_marks', '>', 0)
                .select('r.student_id', 'r.total_awarded', 'sh.max_marks');
            for (const r of cieRows) {
                const sid = Number(r.student_id);
                if (!cieMap.has(sid))
                    cieMap.set(sid, { awarded: 0, max: 0 });
                const e = cieMap.get(sid);
                e.awarded += Number(r.total_awarded);
                e.max += Number(r.max_marks);
            }
        }
    }
    catch {
        /* assessment tables optional */
    }
    // ── Backlogs (examination) ──────────────────────────────────────────
    const backlogRows = (await db('subject_results')
        .where({ college_id: collegeId, result_status: 'FAIL' })
        .whereIn('student_id', studentIds)
        .select('student_id')
        .count({ c: '*' })
        .groupBy('student_id'));
    const backlogMap = new Map();
    for (const r of backlogRows)
        backlogMap.set(Number(r.student_id), Number(r.c));
    // ── Overdue assignments (LMS) ───────────────────────────────────────
    const overdueMap = new Map();
    try {
        const overdueRows = (await db('assignment_submissions as sub')
            .join('assignments as a', 'a.id', 'sub.assignment_id')
            .whereIn('sub.student_id', studentIds)
            .where('sub.status', 'STARTED')
            .where('a.due_at', '<', db.fn.now())
            .select('sub.student_id')
            .count({ c: '*' })
            .groupBy('sub.student_id'));
        for (const r of overdueRows)
            overdueMap.set(Number(r.student_id), Number(r.c));
    }
    catch {
        /* assignments optional */
    }
    // ── Overdue mentoring follow-ups ────────────────────────────────────
    const followupMap = new Map();
    try {
        const fuRows = (await db('mentor_meetings')
            .where('college_id', collegeId)
            .whereIn('student_id', studentIds)
            .where('follow_up_status', 'PENDING')
            .whereNotNull('follow_up_date')
            .where('follow_up_date', '<', db.raw('CURDATE()'))
            .select('student_id')
            .count({ c: '*' })
            .groupBy('student_id'));
        for (const r of fuRows)
            followupMap.set(Number(r.student_id), Number(r.c));
    }
    catch {
        /* mentor_meetings optional */
    }
    for (const sid of studentIds) {
        const att = attMap.get(sid);
        const attendancePct = att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null;
        const cie = cieMap.get(sid);
        const ciePct = cie && cie.max > 0 ? Math.round((cie.awarded / cie.max) * 100) : null;
        const backlogs = backlogMap.get(sid) ?? 0;
        const overdueAssignments = overdueMap.get(sid) ?? 0;
        const overdueFollowUps = followupMap.get(sid) ?? 0;
        const dimensions = [];
        const reasons = [];
        // ATTENDANCE
        let attLevel = 'NORMAL';
        let attReason = null;
        if (attendancePct != null) {
            if (attendancePct < cfg.attendanceHighPct) {
                attLevel = 'HIGH';
                attReason = `Attendance ${attendancePct}% (critically below ${cfg.attendanceHighPct}%)`;
            }
            else if (attendancePct < cfg.attendanceAttentionPct) {
                attLevel = 'ATTENTION';
                attReason = `Attendance ${attendancePct}% (below ${cfg.attendanceAttentionPct}% threshold)`;
            }
            else if (attendancePct < cfg.attendanceAttentionPct + 5) {
                attLevel = 'WATCH';
                attReason = `Attendance ${attendancePct}% (close to ${cfg.attendanceAttentionPct}% threshold)`;
            }
        }
        dimensions.push({ dimension: 'ATTENDANCE', level: attLevel, value: attendancePct, reason: attReason });
        if (attReason)
            reasons.push(attReason);
        // ACADEMIC (CIE)
        let acadLevel = 'NORMAL';
        let acadReason = null;
        if (ciePct != null) {
            if (ciePct < cfg.cieAttentionPct) {
                acadLevel = 'ATTENTION';
                acadReason = `CIE performance ${ciePct}% (below ${cfg.cieAttentionPct}%)`;
            }
            else if (ciePct < cfg.cieAttentionPct + 10) {
                acadLevel = 'WATCH';
                acadReason = `CIE performance ${ciePct}% (approaching concern level)`;
            }
        }
        dimensions.push({ dimension: 'ACADEMIC', level: acadLevel, value: ciePct, reason: acadReason });
        if (acadReason)
            reasons.push(acadReason);
        // BACKLOG
        let backlogLevel = 'NORMAL';
        let backlogReason = null;
        if (backlogs >= cfg.backlogHigh) {
            backlogLevel = 'HIGH';
            backlogReason = `${backlogs} active backlogs`;
        }
        else if (backlogs >= cfg.backlogAttention) {
            backlogLevel = 'ATTENTION';
            backlogReason = `${backlogs} active backlogs`;
        }
        else if (backlogs >= cfg.backlogWatch) {
            backlogLevel = 'WATCH';
            backlogReason = `${backlogs} active backlog`;
        }
        dimensions.push({ dimension: 'BACKLOG', level: backlogLevel, value: backlogs, reason: backlogReason });
        if (backlogReason)
            reasons.push(backlogReason);
        // ENGAGEMENT (assignments)
        let engLevel = 'NORMAL';
        let engReason = null;
        if (overdueAssignments >= cfg.assignmentMissHigh) {
            engLevel = 'ATTENTION';
            engReason = `${overdueAssignments} overdue assignments`;
        }
        else if (overdueAssignments >= cfg.assignmentMissAttention) {
            engLevel = 'WATCH';
            engReason = `${overdueAssignments} overdue assignments`;
        }
        dimensions.push({ dimension: 'ENGAGEMENT', level: engLevel, value: overdueAssignments, reason: engReason });
        if (engReason)
            reasons.push(engReason);
        // FOLLOW_UP
        let fuLevel = 'NORMAL';
        let fuReason = null;
        if (overdueFollowUps >= 2) {
            fuLevel = 'ATTENTION';
            fuReason = `${overdueFollowUps} overdue mentoring follow-ups`;
        }
        else if (overdueFollowUps >= 1) {
            fuLevel = 'WATCH';
            fuReason = `${overdueFollowUps} overdue mentoring follow-up`;
        }
        dimensions.push({ dimension: 'FOLLOW_UP', level: fuLevel, value: overdueFollowUps, reason: fuReason });
        if (fuReason)
            reasons.push(fuReason);
        const attention = highest(...dimensions.map((d) => d.level));
        // Score: base on top dimension, then nudge up when multiple dimensions flag.
        const flagged = dimensions.filter((d) => d.level !== 'NORMAL').length;
        let score = LEVEL_SCORE[attention];
        if (attention !== 'HIGH' && flagged >= 3) {
            score = Math.min(3, score + 1);
        }
        const finalAttention = SCORE_LEVEL[score];
        results.set(sid, {
            studentId: sid,
            attention: finalAttention,
            score,
            dimensions,
            reasons,
            signals: { attendancePct, ciePct, backlogs, overdueAssignments, overdueFollowUps },
        });
    }
    return results;
}
export async function computeRisk(collegeId, studentId) {
    const map = await computeRiskForStudents(collegeId, [studentId]);
    return (map.get(studentId) ?? {
        studentId,
        attention: 'NORMAL',
        score: 0,
        dimensions: [],
        reasons: [],
        signals: { attendancePct: null, ciePct: null, backlogs: 0, overdueAssignments: 0, overdueFollowUps: 0 },
    });
}
