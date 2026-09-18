function strip(value) {
    return String(value ?? '')
        .toLowerCase()
        .replace(/&/g, 'and')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}
function normalizeCode(value) {
    return String(value ?? '')
        .toUpperCase()
        .replace(/\s+/g, '');
}
const NAME_ALIASES = {
    chemistry: 'chemistry',
    'applied chemistry for smart systems': 'chemistry',
    'computer networks i': 'computer networks i',
    'computer networks 1': 'computer networks i',
    'research methodology ipr': 'research methodology and ipr',
    'research methodology and ipr': 'research methodology and ipr',
};
function canonicalName(name) {
    const key = strip(name);
    return NAME_ALIASES[key] || key;
}
function namesMatch(a, b) {
    return canonicalName(a) === canonicalName(b);
}
function schemeCode(scheme) {
    if (!scheme)
        return null;
    const s = String(scheme).trim();
    if (!s)
        return null;
    if (/^VTU-/i.test(s))
        return s.toUpperCase();
    if (/^\d{4}$/.test(s))
        return `VTU-${s}`;
    return s.toUpperCase();
}
export function reconcileSubject(mapper, courses) {
    const mapperCode = normalizeCode(mapper.code);
    const mapperScheme = schemeCode(mapper.scheme);
    const mapperView = { name: mapper.name, code: mapperCode, scheme: mapper.scheme };
    const empty = (status, reason, course = null) => ({
        status,
        course,
        reason,
        existing: course
            ? { name: course.name, code: course.code, scheme: course.schemeCode ?? null }
            : null,
        mapper: mapperView,
    });
    const byCodeScheme = courses.filter((c) => normalizeCode(c.code) === mapperCode &&
        mapperScheme &&
        schemeCode(c.schemeCode || '') === mapperScheme);
    if (byCodeScheme.length === 1) {
        return empty('MATCHED', `Matched course code ${mapperCode} on ${mapper.scheme} scheme`, byCodeScheme[0]);
    }
    if (byCodeScheme.length > 1) {
        return empty('AMBIGUOUS', `Multiple courses share code ${mapperCode} on scheme ${mapper.scheme}`);
    }
    const byCode = courses.filter((c) => normalizeCode(c.code) === mapperCode);
    if (byCode.length === 1) {
        const hit = byCode[0];
        const existingScheme = schemeCode(hit.schemeCode || '');
        if (existingScheme && mapperScheme && existingScheme !== mapperScheme) {
            return {
                status: 'SCHEME_CONFLICT',
                course: hit,
                reason: `Same course code ${mapperCode} appears under different schemes`,
                existing: { name: hit.name, code: hit.code, scheme: hit.schemeCode ?? null },
                mapper: mapperView,
            };
        }
        return empty('MATCHED', `Matched exact course code ${mapperCode}`, hit);
    }
    if (byCode.length > 1) {
        return empty('AMBIGUOUS', `Multiple courses share code ${mapperCode}`);
    }
    const namePool = courses.filter((c) => namesMatch(c.name, mapper.name) || (mapper.aliasName && namesMatch(c.name, mapper.aliasName)));
    if (namePool.length > 1) {
        return empty('AMBIGUOUS', `Multiple existing subjects match "${mapper.name}"`);
    }
    if (namePool.length === 1) {
        const hit = namePool[0];
        const existingCode = normalizeCode(hit.code);
        if (existingCode && existingCode !== mapperCode) {
            return {
                status: 'COURSE_CODE_CONFLICT',
                course: hit,
                reason: 'Existing subject name matches the master mapper but the course codes differ',
                existing: { name: hit.name, code: hit.code, scheme: hit.schemeCode ?? null },
                mapper: mapperView,
            };
        }
        return empty('MATCHED', `Matched normalized subject name "${hit.name}"`, hit);
    }
    return empty('NEW', `No existing subject for ${mapperCode} / ${mapper.name}`);
}
export function buildMatrix(courseOutcomes, programOutcomes, items) {
    return courseOutcomes.map((co) => ({
        coCode: co.code,
        cells: programOutcomes.map((po) => {
            const item = items.find((i) => i.courseOutcomeId === co.id && i.programOutcomeId === po.id);
            const strength = item?.strength ?? null;
            return { poCode: po.code, strength };
        }),
    }));
}
