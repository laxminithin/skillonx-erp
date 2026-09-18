import { randomUUID } from 'node:crypto';
import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import { recordServicesAudit } from './audit.js';
import { generateVerificationCode } from './requestEngine.js';
import { notifyStudent } from '../academicClasses/studentNotifications.js';
import { studentAcademicRecord, studentResults } from '../examination/result.js';
function parseJson(raw, fallback) {
    if (raw == null)
        return fallback;
    if (typeof raw === 'object')
        return raw;
    try {
        return JSON.parse(String(raw));
    }
    catch {
        return fallback;
    }
}
function renderTemplate(template, vars) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}
async function nextCertificateNumber(collegeId, seriesCode) {
    const year = new Date().getFullYear();
    return db.transaction(async (trx) => {
        const lockKey = `student-service-certificate:${collegeId}:${seriesCode}:${year}`;
        await trx.raw('select get_lock(?, 10)', [lockKey]);
        try {
            await trx('certificate_number_sequences').insert({ college_id: collegeId, series_code: seriesCode, year, last_number: 0 }).onConflict(['college_id', 'series_code', 'year']).ignore();
            await trx('certificate_number_sequences').where({ college_id: collegeId, series_code: seriesCode, year }).increment('last_number', 1).update({ updated_at: trx.fn.now() });
            const seq = await trx('certificate_number_sequences').where({ college_id: collegeId, series_code: seriesCode, year }).first();
            const next = Number(seq.last_number);
            const college = await trx('colleges').where({ id: collegeId }).select('code').first();
            const prefix = college?.code ?? 'SX';
            return `${prefix}/${seriesCode}/${year}/${String(next).padStart(5, '0')}`;
        }
        finally {
            await trx.raw('select release_lock(?)', [lockKey]).catch(() => undefined);
        }
    });
}
async function loadStudentContext(studentId, collegeId) {
    const student = await db('students as s')
        .leftJoin('departments as d', 'd.id', 's.department_id')
        .leftJoin('programs as p', 'p.id', 's.program_id')
        .leftJoin('semesters as sem', 'sem.id', 's.semester_id')
        .leftJoin('academic_years as y', 'y.id', 's.academic_year_id')
        .leftJoin('class_sections as cs', 'cs.id', 's.class_section_id')
        .leftJoin('colleges as c', 'c.id', 's.college_id')
        .where({ 's.id': studentId, 's.college_id': collegeId })
        .select('s.*', 'd.name as department_name', 'd.code as department_code', 'p.name as program_name', 'sem.label as semester_label', 'sem.number as semester_number', 'y.label as academic_year_label', 'cs.label as section_label', 'c.name as college_name', 'c.code as college_code', 'c.address as college_address', 'c.logo_url as college_logo')
        .first();
    if (!student)
        throw new AppError(404, 'Student not found');
    return student;
}
async function buildDocumentData(certificateType, student, formData) {
    const base = {
        studentName: student.name,
        usn: student.usn,
        programName: student.program_name,
        departmentName: student.department_name,
        semesterLabel: student.semester_label,
        academicYearLabel: student.academic_year_label,
        sectionLabel: student.section_label,
        collegeName: student.college_name,
        collegeAddress: student.college_address,
        purpose: formData.purpose ?? '',
        organization: formData.organization ?? '',
        issueDate: new Date().toISOString().slice(0, 10),
        conductStatement: formData.conductStatement ?? '',
    };
    if (certificateType === 'GRADE_CARD' || certificateType === 'PROVISIONAL_RESULT') {
        const semesterId = formData.semesterId ? Number(formData.semesterId) : student.semester_id;
        const results = await studentResults(Number(student.id), Number(student.college_id));
        const semester = results.find((r) => r.semesterId === semesterId);
        base.semesterLabel = semester?.semesterLabel ?? student.semester_label;
        base.semesterResult = semester ?? null;
        base.isProvisional = certificateType === 'PROVISIONAL_RESULT';
    }
    if (certificateType === 'TRANSCRIPT') {
        const record = await studentAcademicRecord(Number(student.id), Number(student.college_id));
        base.transcript = record;
        const subjectResults = await db('subject_results as sr')
            .join('courses as c', 'c.id', 'sr.course_id')
            .join('semesters as s', 's.id', 'sr.semester_id')
            .where({ 'sr.student_id': student.id, 'sr.college_id': student.college_id })
            .whereIn('sr.result_status', ['PASS', 'FAIL'])
            .select('sr.*', 'c.code as course_code', 'c.name as course_name', 's.label as semester_label', 's.semester_number')
            .orderBy('s.semester_number')
            .orderBy('c.code');
        base.subjectResults = subjectResults.map((sr) => ({
            semester: sr.semester_label,
            code: sr.course_code,
            name: sr.course_name,
            credits: sr.credits,
            grade: sr.grade,
            gradePoints: sr.grade_points,
            resultStatus: sr.result_status,
        }));
    }
    if (certificateType === 'STUDY_CERTIFICATE') {
        const registrations = await db('student_semester_registrations as r')
            .join('academic_years as y', 'y.id', 'r.academic_year_id')
            .join('semesters as s', 's.id', 'r.semester_id')
            .where({ 'r.student_id': student.id })
            .orderBy('s.semester_number')
            .select('y.label as year_label', 's.label as semester_label', 's.semester_number');
        if (registrations.length) {
            base.studyFrom = registrations[0].year_label;
            base.studyTo = registrations[registrations.length - 1].year_label;
        }
    }
    if (certificateType === 'ATTENDANCE_CERTIFICATE') {
        const { computeStudentAttendance } = await import('./attendanceCalc.js');
        const pct = await computeStudentAttendance(Number(student.id), Number(student.college_id), formData);
        base.attendancePercentage = pct.percentage;
        base.periodLabel = pct.periodLabel;
    }
    return base;
}
export async function generateCertificateForRequest(collegeId, requestId, issuedByFacultyId) {
    const request = await db('student_service_requests').where({ id: requestId, college_id: collegeId }).first();
    if (!request)
        throw new AppError(404, 'Request not found');
    const typeRow = await db('student_service_request_types').where({ id: request.request_type_id }).first();
    if (!typeRow?.generates_certificate)
        throw new AppError(400, 'This request type does not generate certificates');
    const student = await loadStudentContext(Number(request.student_id), collegeId);
    const formData = parseJson(request.form_data, {});
    const certificateType = String(typeRow.code);
    const seriesCode = String(typeRow.certificate_series ?? 'CERT');
    const existing = await db('student_service_documents')
        .where({ request_id: requestId, status: 'VALID' })
        .first();
    if (existing)
        return serializeDocument(existing);
    const certificateNumber = await nextCertificateNumber(collegeId, seriesCode);
    const documentUuid = randomUUID();
    const verificationCode = generateVerificationCode();
    const documentData = await buildDocumentData(certificateType, student, formData);
    const template = await db('certificate_templates')
        .where({ college_id: collegeId, certificate_type: certificateType, is_active: true })
        .first();
    const bodyTemplate = template?.body_template ?? 'Certificate for {{studentName}} ({{usn}}).';
    const renderedBody = renderTemplate(bodyTemplate, Object.fromEntries(Object.entries(documentData).map(([k, v]) => [k, String(v ?? '')])));
    let docId;
    try {
        [docId] = await db('student_service_documents').insert({
            college_id: collegeId,
            student_id: request.student_id,
            request_id: requestId,
            issue_key: `request:${requestId}`,
            document_type: certificateType,
            certificate_number: certificateNumber,
            document_uuid: documentUuid,
            verification_code: verificationCode,
            status: 'VALID',
            document_data: JSON.stringify({ ...documentData, renderedBody, template: template ? { title: template.title } : null }),
            issued_by_faculty_id: issuedByFacultyId,
            issued_at: db.fn.now(),
        });
    }
    catch (error) {
        // The unique issue key makes retries/concurrent finalization converge on one record.
        if (error.code !== 'ER_DUP_ENTRY')
            throw error;
        const alreadyIssued = await db('student_service_documents').where({ issue_key: `request:${requestId}`, status: 'VALID' }).first();
        if (!alreadyIssued)
            throw error;
        return serializeDocument(alreadyIssued);
    }
    await db('student_service_requests').where({ id: requestId }).update({
        status: 'READY',
        current_stage: 'Certificate Ready',
        updated_at: db.fn.now(),
    });
    await recordServicesAudit({
        collegeId,
        actorId: issuedByFacultyId,
        actorType: issuedByFacultyId ? 'FACULTY' : 'SYSTEM',
        action: 'CERTIFICATE_GENERATED',
        entityType: 'student_service_document',
        entityId: docId,
        afterState: { certificateNumber, documentType: certificateType },
    });
    await notifyStudent({
        studentId: Number(request.student_id),
        collegeId,
        type: 'CERTIFICATE_READY',
        title: 'Certificate ready',
        body: `Your ${typeRow.label} (${certificateNumber}) is ready for download.`,
        link: `/lms/services/certificates/${docId}`,
        relatedType: 'certificate',
        relatedId: docId,
    });
    const doc = await db('student_service_documents').where({ id: docId }).first();
    return serializeDocument(doc);
}
function serializeDocument(row) {
    return {
        id: Number(row.id),
        documentType: row.document_type,
        certificateNumber: row.certificate_number,
        documentUuid: row.document_uuid,
        verificationCode: row.verification_code,
        status: row.status,
        documentData: parseJson(row.document_data, {}),
        issuedAt: row.issued_at,
        requestId: row.request_id != null ? Number(row.request_id) : null,
    };
}
export async function listStudentCertificates(studentId, collegeId) {
    const rows = await db('student_service_documents')
        .where({ student_id: studentId, college_id: collegeId })
        .whereIn('status', ['VALID', 'SUPERSEDED'])
        .orderBy('issued_at', 'desc');
    return rows.map(serializeDocument);
}
export async function getStudentCertificate(studentId, collegeId, documentId) {
    const row = await db('student_service_documents')
        .where({ id: documentId, student_id: studentId, college_id: collegeId })
        .first();
    if (!row)
        throw new AppError(404, 'Certificate not found');
    return serializeDocument(row);
}
export async function revokeDocument(collegeId, documentId, facultyId, reason) {
    const row = await db('student_service_documents').where({ id: documentId, college_id: collegeId }).first();
    if (!row)
        throw new AppError(404, 'Document not found');
    if (row.status !== 'VALID')
        throw new AppError(400, 'Document is not valid');
    await db('student_service_documents').where({ id: documentId }).update({
        status: 'REVOKED',
        issue_key: null,
        revoked_at: db.fn.now(),
        revoke_reason: reason,
        updated_at: db.fn.now(),
    });
    await recordServicesAudit({
        collegeId,
        actorId: facultyId,
        actorType: 'FACULTY',
        action: 'CERTIFICATE_REVOKED',
        entityType: 'student_service_document',
        entityId: documentId,
        reason,
    });
    return serializeDocument({ ...row, status: 'REVOKED' });
}
/** Reissue creates a new immutable document and retains the revoked original. */
export async function reissueDocument(collegeId, documentId, facultyId, reason) {
    const original = await db('student_service_documents').where({ id: documentId, college_id: collegeId }).first();
    if (!original)
        throw new AppError(404, 'Document not found');
    if (original.status !== 'REVOKED')
        throw new AppError(400, 'Only a revoked document can be reissued');
    if (!original.request_id)
        throw new AppError(400, 'Document is not linked to a request');
    const replacement = await generateCertificateForRequest(collegeId, Number(original.request_id), facultyId);
    await db('student_service_documents').where({ id: replacement.id }).update({ reissued_from_id: documentId });
    await db('student_service_documents').where({ id: documentId }).update({ superseded_by_id: replacement.id });
    await recordServicesAudit({ collegeId, actorId: facultyId, actorType: 'FACULTY', action: 'CERTIFICATE_REISSUED', entityType: 'student_service_document', entityId: replacement.id, reason, afterState: { reissuedFromId: documentId } });
    return serializeDocument(await db('student_service_documents').where({ id: replacement.id }).first());
}
export async function verifyDocument(verificationCode) {
    const row = await db('student_service_documents as d')
        .join('colleges as c', 'c.id', 'd.college_id')
        .where({ 'd.verification_code': verificationCode })
        .select('d.*', 'c.name as college_name')
        .first();
    if (!row)
        throw new AppError(404, 'Document not found or invalid verification code');
    const student = await db('students').where({ id: row.student_id }).select('name', 'usn').first();
    const template = await db('certificate_templates')
        .where({ college_id: row.college_id, certificate_type: row.document_type })
        .first();
    const usn = student?.usn ?? '';
    const maskedUsn = usn.length > 4 ? `${usn.slice(0, 2)}***${usn.slice(-2)}` : '***';
    return {
        valid: row.status === 'VALID',
        status: row.status,
        documentType: row.document_type,
        certificateNumber: row.certificate_number,
        title: template?.title ?? row.document_type,
        studentName: student?.name ? `${String(student.name).split(' ')[0]} ${String(student.name).split(' ').slice(-1)[0]?.[0] ?? ''}.` : 'Student',
        usn: maskedUsn,
        institution: row.college_name,
        issuedAt: row.issued_at,
    };
}
export async function getCertificateTemplate(collegeId, certificateType) {
    return db('certificate_templates')
        .where({ college_id: collegeId, certificate_type: certificateType, is_active: true })
        .first();
}
