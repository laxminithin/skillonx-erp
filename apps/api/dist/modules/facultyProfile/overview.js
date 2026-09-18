import { db } from '../../db/index.js';
import { coreProfile } from './profile.js';
import { allDerived } from './derive.js';
import { computeCompleteness } from './completeness.js';
import { experienceTotals } from './calc.js';
/** Highest qualification by a fixed academic ordering. */
const QUAL_RANK = { POSTDOC: 6, PHD: 5, MPHIL: 4, PG: 3, UG: 2, DIPLOMA: 1, OTHER: 0 };
export async function profileOverview(actor, employee) {
    const [core, derived] = await Promise.all([
        coreProfile(actor.collegeId, employee),
        allDerived(actor, employee),
    ]);
    const records = (await db('faculty_records')
        .where({ college_id: actor.collegeId, employee_id: employee.id })
        .where('is_archived', false)
        .select('id', 'domain', 'record_type', 'title', 'category', 'start_date', 'end_date', 'is_current', 'verification_status', 'updated_at'));
    const byDomain = (d) => records.filter((r) => r.domain === d);
    // Highest qualification
    let highest = null;
    let bestRank = -1;
    for (const q of byDomain('QUALIFICATION')) {
        const rank = QUAL_RANK[String(q.record_type ?? 'OTHER')] ?? 0;
        if (rank > bestRank) {
            bestRank = rank;
            highest = { recordType: q.record_type ?? null, title: String(q.title) };
        }
    }
    // Experience (overlap-aware) from EXPERIENCE records
    const expInput = byDomain('EXPERIENCE').map((r) => ({
        category: r.category ?? 'OTHER',
        period: { start: r.start_date ?? null, end: r.end_date ?? null, isCurrent: !!r.is_current },
    }));
    const exp = experienceTotals(expInput);
    const completeness = await computeCompleteness(actor, employee);
    const recent = records
        .slice()
        .sort((a, b) => new Date(String(b.updated_at)).getTime() - new Date(String(a.updated_at)).getTime())
        .slice(0, 8)
        .map((r) => ({
        id: Number(r.id),
        domain: r.domain,
        title: r.title,
        verificationStatus: r.verification_status,
        updatedAt: r.updated_at,
    }));
    return {
        identity: {
            fullName: core.fullName,
            employeeNumber: core.employeeNumber,
            department: core.department,
            designation: core.designation,
            employmentType: core.employmentType,
            employmentStatus: core.employmentStatus,
            photoReference: core.photoReference,
        },
        academicSummary: {
            highestQualification: highest,
            teachingExperienceYears: exp.byCategory.TEACHING ?? 0,
            industryExperienceYears: exp.byCategory.INDUSTRY ?? 0,
            researchExperienceYears: exp.byCategory.RESEARCH ?? 0,
            institutionalExperienceYears: core.institutionalExperienceYears,
            overallExperienceYears: exp.overallYears,
        },
        currentResponsibilities: {
            courses: derived.teaching.filter((t) => t.isCurrent).length,
            totalCourses: derived.teaching.length,
            mentees: derived.mentoring.reduce((a, m) => a + (m.isCurrent ? m.active : 0), 0),
            classCoordination: derived.coordination.filter((c) => c.isCurrent).length,
            leadershipRoles: derived.leadership.filter((l) => l.isCurrent).map((l) => l.role),
        },
        researchSnapshot: {
            publications: byDomain('PUBLICATION').length,
            patents: byDomain('PATENT').length,
            fundedProjects: byDomain('PROJECT').length,
            researchGuidance: byDomain('RESEARCH_GUIDANCE').length,
        },
        professionalDevelopment: {
            fdpTraining: byDomain('FDP').length,
            certifications: byDomain('CERTIFICATION').length,
            memberships: byDomain('MEMBERSHIP').length,
        },
        evidence: completeness.evidence,
        completenessPercent: completeness.percent,
        recentActivity: recent,
    };
}
