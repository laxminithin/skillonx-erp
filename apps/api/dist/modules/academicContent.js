import { db } from '../db/index.js';
import { applyLessonPlanImport, formatImportReport } from './lessonPlans/importApply.js';
import { applyQuestionBankImport } from './quizzes/importApply.js';
import { applyAssignmentBankImport } from './assignments/importApply.js';
async function countRows(table, where) {
    const row = await db(table).where(where).count({ c: '*' }).first();
    return Number(row?.c ?? 0);
}
export async function targetColleges(collegeCode) {
    if (collegeCode)
        return db('colleges').where({ code: collegeCode }).orderBy('id');
    return db('colleges').orderBy('id');
}
export async function importAcademicContent(opts) {
    const kinds = opts.kinds?.length ? opts.kinds : ['quiz', 'lesson', 'assignment'];
    const createMissing = opts.createMissingSubjects !== false;
    const hasQuizTables = await db.schema.hasTable('quiz_bank_questions');
    const hasLessonTables = await db.schema.hasTable('lesson_topics');
    const hasAssignmentTables = await db.schema.hasTable('assignment_bank_questions');
    const colleges = await targetColleges(opts.collegeCode);
    if (!colleges.length) {
        if (opts.onlyIfEmpty) {
            console.log('No colleges yet; skip academic content import.');
            return [];
        }
        throw new Error('No college found. Create an institution before importing academic content.');
    }
    const results = [];
    for (const college of colleges) {
        const faculty = await db('faculty_users').where({ college_id: college.id }).orderBy('id').first();
        if (!faculty) {
            console.warn(`Skipping ${college.code}: no faculty user to own the import.`);
            results.push({ collegeCode: String(college.code), skipped: 'no faculty user' });
            continue;
        }
        const quizCount = hasQuizTables
            ? await countRows('quiz_bank_questions', { college_id: college.id, is_active: true })
            : 0;
        const topicCount = hasLessonTables ? await countRows('lesson_topics', { college_id: college.id }) : 0;
        const assignmentCount = hasAssignmentTables
            ? await countRows('assignment_bank_questions', { college_id: college.id, is_active: true })
            : 0;
        const runQuiz = hasQuizTables && kinds.includes('quiz') && (!opts.onlyIfEmpty || quizCount === 0);
        const runLesson = hasLessonTables && kinds.includes('lesson') && (!opts.onlyIfEmpty || topicCount === 0);
        const runAssignment = hasAssignmentTables && kinds.includes('assignment') && (!opts.onlyIfEmpty || assignmentCount === 0);
        if (!runQuiz && !runLesson && !runAssignment) {
            console.log(`${college.code}: academic content already present (${quizCount} quiz Qs, ${assignmentCount} assignment Qs, ${topicCount} lesson topics).`);
            results.push({
                collegeCode: String(college.code),
                quizImported: 0,
                lessonImported: 0,
                assignmentImported: 0,
            });
            continue;
        }
        let quizImported = 0;
        let lessonImported = 0;
        let assignmentImported = 0;
        if (runQuiz) {
            console.log(`\n=== ${college.code} question bank ===`);
            const report = await applyQuestionBankImport({
                collegeId: Number(college.id),
                createdBy: Number(faculty.id),
                createMissingSubjects: createMissing,
                dryRun: opts.dryRun,
            });
            quizImported = report.imported;
            console.log(`Subjects found: ${report.subjectsFound}`);
            console.log(`Files discovered: ${report.filesDiscovered}`);
            console.log(`Imported: ${report.imported}  Duplicates: ${report.duplicates}  Needs review: ${report.needsReview}`);
            if (report.unmatchedSubjects.length) {
                console.log(`Unmatched subjects: ${report.unmatchedSubjects.join(', ')}`);
            }
            if (report.createdSubjects.length) {
                console.log(`Created subjects: ${report.createdSubjects.join(', ')}`);
            }
        }
        if (runAssignment) {
            console.log(`\n=== ${college.code} assignment bank ===`);
            const report = await applyAssignmentBankImport({
                collegeId: Number(college.id),
                createdBy: Number(faculty.id),
                createMissingSubjects: createMissing,
                dryRun: opts.dryRun,
            });
            assignmentImported = report.imported;
            console.log(`Subjects found: ${report.subjectsFound}`);
            console.log(`Files discovered: ${report.filesDiscovered}`);
            console.log(`Imported: ${report.imported}  Needs review: ${report.needsReview}`);
        }
        if (runLesson) {
            console.log(`\n=== ${college.code} lesson plan ===`);
            const report = await applyLessonPlanImport({
                collegeId: Number(college.id),
                createdBy: Number(faculty.id),
                createMissingSubjects: createMissing,
                dryRun: opts.dryRun,
            });
            lessonImported = report.imported;
            console.log(formatImportReport(report));
        }
        results.push({ collegeCode: String(college.code), quizImported, lessonImported, assignmentImported });
    }
    return results;
}
export async function ensureAcademicContent() {
    console.log('Checking quiz, assignment, and lesson-plan content...');
    await importAcademicContent({
        createMissingSubjects: true,
        onlyIfEmpty: true,
    });
}
