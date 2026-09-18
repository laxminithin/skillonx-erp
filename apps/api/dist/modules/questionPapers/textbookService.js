import { z } from 'zod';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
export const textbookSchema = z.object({
    courseId: z.number().int().positive(),
    schemeId: z.number().int().positive().nullable().optional(),
    title: z.string().min(2).max(512),
    authors: z.string().max(512).optional().nullable(),
    edition: z.string().max(64).optional().nullable(),
    publisher: z.string().max(255).optional().nullable(),
    year: z.number().int().min(1900).max(2100).optional().nullable(),
    isbn: z.string().max(32).optional().nullable(),
    status: z.enum(['PRESCRIBED', 'RECOMMENDED']).optional().default('PRESCRIBED'),
    priority: z.number().int().min(1).max(99).optional().default(1),
    isPrimary: z.boolean().optional().default(false),
    sourceFile: z.string().max(1024).optional().nullable(),
    sourceReference: z.string().max(1024).optional().nullable(),
    notes: z.string().max(4000).optional().nullable(),
});
export const excerptSchema = z.object({
    chapter: z.string().max(128).optional().nullable(),
    section: z.string().max(255).optional().nullable(),
    pageRange: z.string().max(64).optional().nullable(),
    topic: z.string().max(512).optional().nullable(),
    excerptText: z.string().min(20),
});
function mapTextbook(row) {
    return {
        id: Number(row.id),
        courseId: Number(row.course_id),
        schemeId: row.scheme_id ? Number(row.scheme_id) : null,
        title: String(row.title),
        authors: row.authors ? String(row.authors) : null,
        edition: row.edition ? String(row.edition) : null,
        publisher: row.publisher ? String(row.publisher) : null,
        year: row.year ? Number(row.year) : null,
        isbn: row.isbn ? String(row.isbn) : null,
        status: String(row.status || 'PRESCRIBED'),
        priority: Number(row.priority || 1),
        isPrimary: Boolean(row.is_primary),
        isActive: Boolean(row.is_active),
        sourceFile: row.source_file ? String(row.source_file) : null,
        sourceReference: row.source_reference ? String(row.source_reference) : null,
        notes: row.notes ? String(row.notes) : null,
    };
}
export async function listTextbooks(collegeId, courseId) {
    if (!(await db.schema.hasTable('course_textbooks')))
        return { textbooks: [] };
    let q = db('course_textbooks as t')
        .leftJoin('courses as c', 'c.id', 't.course_id')
        .where({ 't.college_id': collegeId, 't.is_active': true })
        .select('t.*', 'c.name as course_name', 'c.code as course_code')
        .orderBy('t.priority')
        .orderBy('t.title');
    if (courseId)
        q = q.andWhere('t.course_id', courseId);
    const rows = await q;
    return {
        textbooks: rows.map((r) => ({
            ...mapTextbook(r),
            courseName: r.course_name ? String(r.course_name) : null,
            courseCode: r.course_code ? String(r.course_code) : null,
        })),
    };
}
export async function getPrimaryTextbook(collegeId, courseId) {
    if (!(await db.schema.hasTable('course_textbooks')))
        return null;
    const primary = await db('course_textbooks')
        .where({ college_id: collegeId, course_id: courseId, is_active: true, is_primary: true })
        .orderBy('priority')
        .first();
    if (primary)
        return mapTextbook(primary);
    const prescribed = await db('course_textbooks')
        .where({ college_id: collegeId, course_id: courseId, is_active: true, status: 'PRESCRIBED' })
        .orderBy('priority')
        .first();
    if (prescribed)
        return mapTextbook(prescribed);
    const any = await db('course_textbooks')
        .where({ college_id: collegeId, course_id: courseId, is_active: true })
        .orderBy('priority')
        .first();
    return any ? mapTextbook(any) : null;
}
export async function createTextbook(collegeId, actorId, input) {
    if (!(await db.schema.hasTable('course_textbooks'))) {
        throw new AppError(503, 'Course Textbook Master is not migrated yet');
    }
    const course = await db('courses').where({ id: input.courseId, college_id: collegeId }).first();
    if (!course)
        throw new AppError(404, 'Subject not found');
    if (input.isPrimary) {
        await db('course_textbooks').where({ college_id: collegeId, course_id: input.courseId }).update({ is_primary: false });
    }
    const [id] = await db('course_textbooks').insert({
        college_id: collegeId,
        course_id: input.courseId,
        scheme_id: input.schemeId ?? null,
        title: input.title,
        authors: input.authors ?? null,
        edition: input.edition ?? null,
        publisher: input.publisher ?? null,
        year: input.year ?? null,
        isbn: input.isbn ?? null,
        status: input.status ?? 'PRESCRIBED',
        priority: input.priority ?? 1,
        is_primary: Boolean(input.isPrimary),
        source_file: input.sourceFile ?? null,
        source_reference: input.sourceReference ?? null,
        notes: input.notes ?? null,
        created_by: actorId,
    });
    return getTextbook(collegeId, Number(id));
}
export async function getTextbook(collegeId, id) {
    const row = await db('course_textbooks').where({ id, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Textbook not found');
    const excerpts = (await db.schema.hasTable('course_textbook_excerpts'))
        ? await db('course_textbook_excerpts').where({ textbook_id: id })
        : [];
    return {
        ...mapTextbook(row),
        excerpts: excerpts.map((e) => ({
            id: Number(e.id),
            chapter: e.chapter,
            section: e.section,
            pageRange: e.page_range,
            topic: e.topic,
            excerptText: e.excerpt_text,
        })),
    };
}
export async function updateTextbook(collegeId, id, input) {
    const row = await db('course_textbooks').where({ id, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Textbook not found');
    if (input.isPrimary) {
        await db('course_textbooks').where({ college_id: collegeId, course_id: row.course_id }).update({ is_primary: false });
    }
    await db('course_textbooks')
        .where({ id })
        .update({
        title: input.title ?? row.title,
        authors: input.authors === undefined ? row.authors : input.authors,
        edition: input.edition === undefined ? row.edition : input.edition,
        publisher: input.publisher === undefined ? row.publisher : input.publisher,
        year: input.year === undefined ? row.year : input.year,
        isbn: input.isbn === undefined ? row.isbn : input.isbn,
        status: input.status ?? row.status,
        priority: input.priority ?? row.priority,
        is_primary: input.isPrimary == null ? row.is_primary : input.isPrimary,
        source_file: input.sourceFile === undefined ? row.source_file : input.sourceFile,
        source_reference: input.sourceReference === undefined ? row.source_reference : input.sourceReference,
        notes: input.notes === undefined ? row.notes : input.notes,
        updated_at: db.fn.now(),
    });
    return getTextbook(collegeId, id);
}
export async function addExcerpt(collegeId, textbookId, input) {
    const book = await db('course_textbooks').where({ id: textbookId, college_id: collegeId }).first();
    if (!book)
        throw new AppError(404, 'Textbook not found');
    const [id] = await db('course_textbook_excerpts').insert({
        textbook_id: textbookId,
        chapter: input.chapter ?? null,
        section: input.section ?? null,
        page_range: input.pageRange ?? null,
        topic: input.topic ?? null,
        excerpt_text: input.excerptText,
    });
    return { id: Number(id) };
}
export async function markPrimary(collegeId, textbookId) {
    const book = await db('course_textbooks').where({ id: textbookId, college_id: collegeId }).first();
    if (!book)
        throw new AppError(404, 'Textbook not found');
    await db('course_textbooks').where({ college_id: collegeId, course_id: book.course_id }).update({ is_primary: false });
    await db('course_textbooks').where({ id: textbookId }).update({ is_primary: true, updated_at: db.fn.now() });
    return getTextbook(collegeId, textbookId);
}
