export function normalizeCourseCode(code) {
    return String(code || '')
        .replace(/\s+/g, '')
        .toUpperCase();
}
export function courseCodeVariants(code) {
    const normalized = normalizeCourseCode(code);
    const variants = new Set([normalized].filter(Boolean));
    if (normalized.includes('/')) {
        const parts = normalized.split('/').filter(Boolean);
        if (parts.length === 2 && /^\d+$/.test(parts[1])) {
            const prefix = parts[0].replace(/\d+$/, '');
            variants.add(parts[0]);
            variants.add(`${prefix}${parts[1]}`);
        }
        else {
            for (const part of parts)
                variants.add(part);
        }
    }
    return [...variants];
}
export function overlayByNaturalKey(rows, keyFn) {
    const map = new Map();
    for (const row of rows) {
        if (row.college_id != null)
            map.set(keyFn(row), row);
    }
    for (const row of rows) {
        if (row.college_id == null)
            map.set(keyFn(row), row);
    }
    return [...map.values()];
}
export function scopeMasterQuery(query, collegeId, column = 'college_id') {
    return query.andWhere(function globalOrCollege() {
        this.whereNull(column).orWhere(column, collegeId);
    });
}
export function missingAcademicMasterPayload(input) {
    const missing = input.missing.length ? input.missing : ['academic master'];
    return {
        found: false,
        reason: 'NO_MASTER',
        message: 'Academic master data for this subject has not yet been configured.',
        diagnostics: {
            subjectCode: input.subjectCode,
            subjectName: input.subjectName ?? null,
            scheme: input.scheme ?? null,
            semester: input.semester ?? null,
            missing,
        },
    };
}
export async function loadScopedMasterRows(db, table, collegeId, opts = {}) {
    const q = db(table);
    scopeMasterQuery(q, collegeId);
    if (opts.activeOnly !== false) {
        q.andWhere('is_active', true);
    }
    const variants = courseCodeVariants(opts.courseCode);
    if (opts.courseId || variants.length) {
        q.andWhere(function matchCourse() {
            if (opts.courseId)
                this.orWhere('course_id', opts.courseId);
            if (variants.length)
                this.orWhereIn('course_code', variants);
        });
    }
    if (opts.orderBy)
        q.orderBy(opts.orderBy);
    return q.select('*');
}
