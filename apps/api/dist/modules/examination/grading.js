import { DEFAULT_GRADE_BANDS } from './types.js';
export function parseGradeBands(raw) {
    if (!raw)
        return DEFAULT_GRADE_BANDS;
    if (typeof raw === 'string') {
        try {
            return parseGradeBands(JSON.parse(raw));
        }
        catch {
            return DEFAULT_GRADE_BANDS;
        }
    }
    if (!Array.isArray(raw))
        return DEFAULT_GRADE_BANDS;
    const bands = raw
        .map((b) => ({
        min: Number(b.min),
        max: Number(b.max),
        grade: String(b.grade),
        gradePoints: Number(b.gradePoints ?? b.grade_points ?? 0),
    }))
        .filter((b) => Number.isFinite(b.min) && Number.isFinite(b.max) && b.grade);
    return bands.length ? bands.sort((a, b) => b.min - a.min) : DEFAULT_GRADE_BANDS;
}
export function gradeForMarks(total, maxMarks, bands) {
    if (maxMarks <= 0)
        return { grade: 'F', gradePoints: 0 };
    const pct = (total / maxMarks) * 100;
    for (const band of bands) {
        if (pct >= band.min && pct <= band.max) {
            return { grade: band.grade, gradePoints: band.gradePoints };
        }
    }
    return { grade: 'F', gradePoints: 0 };
}
export function computeSgpa(subjects) {
    let creditSum = 0;
    let weighted = 0;
    for (const s of subjects) {
        if (['FAIL', 'ABSENT', 'WITHHELD', 'MALPRACTICE', 'INCOMPLETE'].includes(s.resultStatus))
            continue;
        if (!s.credits || s.credits <= 0)
            continue;
        creditSum += s.credits;
        weighted += s.credits * s.gradePoints;
    }
    if (creditSum <= 0)
        return null;
    return Math.round((weighted / creditSum) * 100) / 100;
}
export function computeCgpa(semesters) {
    let creditSum = 0;
    let weighted = 0;
    for (const s of semesters) {
        if (s.sgpa == null || !s.creditsEarned)
            continue;
        creditSum += s.creditsEarned;
        weighted += s.creditsEarned * s.sgpa;
    }
    if (creditSum <= 0)
        return null;
    return Math.round((weighted / creditSum) * 100) / 100;
}
export function subjectPass(total, maxMarks, passPct, minSee, externalMarks) {
    const threshold = (passPct / 100) * maxMarks;
    if (total < threshold)
        return false;
    if (minSee != null && externalMarks != null && externalMarks < minSee)
        return false;
    return true;
}
