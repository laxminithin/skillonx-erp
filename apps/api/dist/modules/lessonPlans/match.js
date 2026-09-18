import { normalizeLessonText } from '../../types/lessonPlan.js';
import { aliasCanonicalName, parseModuleLabel } from './parser.js';
export function matchCourse(sourceName, sourceCode, courses, indexNames = []) {
    const byName = new Map(courses.map((c) => [normalizeLessonText(c.name), c]));
    const byCode = new Map(courses.map((c) => [normalizeLessonText(c.code), c]));
    const canonical = aliasCanonicalName(sourceName, indexNames) ?? sourceName;
    const nameHit = byName.get(normalizeLessonText(canonical));
    if (nameHit) {
        return {
            sourceName,
            sourceCode,
            mapping: 'matched',
            course: nameHit,
            reason: `Matched existing subject "${nameHit.name}"`,
        };
    }
    const aliasHits = courses.filter((c) => {
        const alias = aliasCanonicalName(c.name, indexNames);
        return alias && normalizeLessonText(alias) === normalizeLessonText(canonical);
    });
    if (aliasHits.length === 1) {
        return {
            sourceName,
            sourceCode,
            mapping: 'matched',
            course: aliasHits[0],
            reason: `Matched via alias to "${aliasHits[0].name}"`,
        };
    }
    if (aliasHits.length > 1) {
        return {
            sourceName,
            sourceCode,
            mapping: 'ambiguous',
            course: null,
            reason: `Multiple subjects match "${sourceName}"`,
        };
    }
    if (sourceCode) {
        const codeHit = byCode.get(normalizeLessonText(sourceCode));
        if (codeHit) {
            return {
                sourceName,
                sourceCode,
                mapping: 'matched',
                course: codeHit,
                reason: `Matched existing course code ${codeHit.code}`,
            };
        }
        const prefix = sourceCode.split('/')[0];
        if (prefix && prefix !== sourceCode) {
            const prefixHit = byCode.get(normalizeLessonText(prefix));
            if (prefixHit) {
                return {
                    sourceName,
                    sourceCode,
                    mapping: 'matched',
                    course: prefixHit,
                    reason: `Matched course code prefix ${prefixHit.code}`,
                };
            }
        }
    }
    return {
        sourceName,
        sourceCode,
        mapping: 'unmatched',
        course: null,
        reason: `No existing subject for "${sourceName}"`,
    };
}
export function moduleNumberKey(name) {
    const parsed = parseModuleLabel(name);
    if (!parsed)
        return null;
    return `${parsed.kind.toLowerCase()}:${parsed.number}`;
}
export function preferredModuleName(kind, number, title) {
    const label = kind === 'UNIT' ? 'Unit' : 'Module';
    const trimmed = title.trim();
    if (!trimmed)
        return `${label} ${number}`;
    if (new RegExp(`^${label}\\s*${number}\\b`, 'i').test(trimmed))
        return trimmed;
    return `${label} ${number} — ${trimmed}`;
}
export function findModule(modules, kind, number, title) {
    const preferred = preferredModuleName(kind, number, title);
    const exact = modules.find((m) => m.name.toLowerCase() === preferred.toLowerCase());
    if (exact)
        return exact;
    const key = `${kind.toLowerCase()}:${number}`;
    const byNumber = modules.find((m) => moduleNumberKey(m.name) === key);
    if (byNumber)
        return byNumber;
    const byTitle = modules.find((m) => normalizeLessonText(m.name).includes(normalizeLessonText(title)));
    return byTitle ?? null;
}
