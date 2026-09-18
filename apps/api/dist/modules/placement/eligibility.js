import { db } from '../../db/index.js';
import { getStudentPlacementAcademicProfile } from './academicProfile.js';
function compare(op, actual, expected) {
    switch (op) {
        case 'LTE': return actual <= expected;
        case 'LT': return actual < expected;
        case 'EQ': return actual === expected;
        case 'GT': return actual > expected;
        case 'GTE':
        default: return actual >= expected;
    }
}
function parsePrograms(value) {
    return value.split(/[,/|]/).map((s) => s.trim().toUpperCase()).filter(Boolean);
}
export async function evaluatePlacementEligibility(studentId, opportunityId, collegeId) {
    const override = await db('placement_eligibility_overrides')
        .where({ student_id: studentId, opportunity_id: opportunityId, college_id: collegeId })
        .first();
    if (override) {
        return { status: 'ELIGIBLE_WITH_OVERRIDE', reasons: [{ code: 'OVERRIDE', message: 'Eligibility override approved', passed: true }] };
    }
    const rules = await db('placement_eligibility_rules').where({ opportunity_id: opportunityId, college_id: collegeId });
    const profile = await getStudentPlacementAcademicProfile(studentId, collegeId);
    const policy = await db('college_placement_policies').where({ college_id: collegeId }).first();
    const career = await db('student_career_profiles').where({ student_id: studentId }).first();
    const reasons = [];
    if (policy?.placement_registration_required) {
        const season = await db('placement_opportunities').where({ id: opportunityId }).select('placement_season_id').first();
        if (season?.placement_season_id) {
            const reg = await db('placement_registrations')
                .where({ student_id: studentId, placement_season_id: season.placement_season_id })
                .whereIn('status', ['REGISTERED', 'ACTIVE', 'COMPLETED'])
                .first();
            const passed = !!reg;
            reasons.push({
                code: 'REGISTRATION_REQUIRED',
                message: passed ? 'Placement registration complete' : 'Placement registration required',
                passed,
            });
        }
    }
    if (policy?.min_profile_completion) {
        const pct = Number(career?.profile_completion_percentage ?? 0);
        const min = Number(policy.min_profile_completion);
        const passed = pct >= min;
        reasons.push({
            code: 'PROFILE_INCOMPLETE',
            message: passed ? `Profile ${pct}% complete` : `Profile must be at least ${min}% complete (currently ${pct}%)`,
            passed,
        });
    }
    for (const rule of rules) {
        if (!rule.is_mandatory)
            continue;
        const op = rule.operator ?? 'GTE';
        const val = String(rule.value);
        switch (rule.rule_type) {
            case 'MIN_CGPA': {
                const min = Number(val);
                const cgpa = profile.cgpa ?? 0;
                const passed = compare(op, cgpa, min);
                reasons.push({
                    code: 'CGPA_BELOW_MINIMUM',
                    message: passed ? `CGPA ${cgpa} meets minimum ${min}` : `CGPA ${cgpa ?? 'N/A'} below minimum ${min}`,
                    passed,
                });
                break;
            }
            case 'MAX_ACTIVE_BACKLOGS': {
                const max = Number(val);
                const passed = profile.activeBacklogs <= max;
                reasons.push({
                    code: 'ACTIVE_BACKLOG',
                    message: passed
                        ? `Active backlogs ${profile.activeBacklogs} within limit ${max}`
                        : `${profile.activeBacklogs} active backlog(s) exceed limit ${max}`,
                    passed,
                });
                break;
            }
            case 'MAX_HISTORICAL_BACKLOGS': {
                const max = Number(val);
                const passed = profile.historicalBacklogs <= max;
                reasons.push({
                    code: 'HISTORICAL_BACKLOG',
                    message: passed
                        ? `Historical backlogs ${profile.historicalBacklogs} within limit ${max}`
                        : `${profile.historicalBacklogs} historical backlog(s) exceed limit ${max}`,
                    passed,
                });
                break;
            }
            case 'PROGRAM': {
                const allowed = parsePrograms(val);
                const code = (profile.programCode ?? '').toUpperCase();
                const passed = allowed.some((p) => code.includes(p) || p === code);
                reasons.push({
                    code: 'PROGRAM_NOT_ELIGIBLE',
                    message: passed ? `Program ${profile.programCode} is eligible` : `Program ${profile.programCode ?? 'N/A'} not eligible`,
                    passed,
                });
                break;
            }
            case 'GRADUATION_YEAR': {
                const year = Number(val);
                const passed = profile.graduationYear === year;
                reasons.push({
                    code: 'GRADUATION_YEAR_MISMATCH',
                    message: passed ? `Graduation year ${profile.graduationYear} matches` : `Graduation year ${profile.graduationYear ?? 'N/A'} does not match ${year}`,
                    passed,
                });
                break;
            }
            case 'MIN_TENTH_PERCENTAGE': {
                const min = Number(val);
                const pct = profile.tenthPercentage ?? 0;
                const passed = compare(op, pct, min);
                reasons.push({
                    code: 'TENTH_PERCENTAGE_BELOW_MINIMUM',
                    message: passed ? `10th ${pct}% meets minimum ${min}%` : `10th ${profile.tenthPercentage ?? 'N/A'}% below minimum ${min}%`,
                    passed,
                });
                break;
            }
            case 'MIN_TWELFTH_PERCENTAGE': {
                const min = Number(val);
                const pct = profile.twelfthPercentage ?? 0;
                const passed = compare(op, pct, min);
                reasons.push({
                    code: 'TWELFTH_PERCENTAGE_BELOW_MINIMUM',
                    message: passed ? `12th ${pct}% meets minimum ${min}%` : `12th ${profile.twelfthPercentage ?? 'N/A'}% below minimum ${min}%`,
                    passed,
                });
                break;
            }
            case 'REQUIRED_SKILL': {
                const required = parsePrograms(val);
                const skills = await db('student_skills').where({ student_id: studentId, college_id: collegeId });
                const names = skills.map((s) => String(s.skill_name).toUpperCase());
                const passed = required.every((r) => names.some((n) => n.includes(r)));
                reasons.push({
                    code: 'REQUIRED_SKILL_MISSING',
                    message: passed ? 'Required skills present' : `Missing required skill(s): ${required.join(', ')}`,
                    passed,
                });
                break;
            }
            default:
                break;
        }
    }
    const failed = reasons.filter((r) => !r.passed);
    return {
        status: failed.length ? 'NOT_ELIGIBLE' : 'ELIGIBLE',
        reasons,
    };
}
export async function bulkEvaluateEligibility(opportunityId, collegeId, studentIds) {
    const eligible = [];
    const notEligible = [];
    for (const studentId of studentIds) {
        const result = await evaluatePlacementEligibility(studentId, opportunityId, collegeId);
        if (result.status === 'ELIGIBLE' || result.status === 'ELIGIBLE_WITH_OVERRIDE')
            eligible.push(studentId);
        else
            notEligible.push(studentId);
    }
    return { eligible, notEligible, eligibleCount: eligible.length, notEligibleCount: notEligible.length };
}
