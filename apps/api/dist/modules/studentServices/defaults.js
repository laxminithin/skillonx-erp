import { db } from '../../db/index.js';
const DEFAULT_REQUEST_TYPES = [
    {
        code: 'BONAFIDE_CERTIFICATE',
        label: 'Bonafide Certificate',
        category: 'CERTIFICATE',
        description: 'Official certificate confirming your enrollment at the institution.',
        instructions: 'Provide the purpose and organization requiring the certificate.',
        estimatedProcess: '3-5 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: true,
        certificateSeries: 'BC',
        formSchema: [
            { key: 'purpose', label: 'Purpose', type: 'text', required: true },
            { key: 'organization', label: 'Organization', type: 'text', required: true },
            { key: 'requiredDate', label: 'Required Date', type: 'date' },
        ],
        workflowSteps: [
            { stepKey: 'COORDINATOR_REVIEW', label: 'Coordinator Review', actorRole: 'CLASS_COORDINATOR' },
            { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', actorRole: 'HOD' },
            { stepKey: 'ADMIN_PROCESS', label: 'Document Generation', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'STUDY_CERTIFICATE',
        label: 'Study Certificate',
        category: 'CERTIFICATE',
        description: 'Certificate stating your period of study at the institution.',
        estimatedProcess: '3-5 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: true,
        certificateSeries: 'SC',
        formSchema: [
            { key: 'purpose', label: 'Purpose', type: 'text', required: true },
            { key: 'organization', label: 'Organization', type: 'text' },
        ],
        workflowSteps: [
            { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', actorRole: 'HOD' },
            { stepKey: 'ADMIN_PROCESS', label: 'Document Generation', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'CONDUCT_CERTIFICATE',
        label: 'Conduct Certificate',
        category: 'CERTIFICATE',
        description: 'Certificate of conduct requiring authorized faculty confirmation.',
        estimatedProcess: '5-7 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: true,
        certificateSeries: 'CC',
        formSchema: [
            { key: 'purpose', label: 'Purpose', type: 'text', required: true },
            { key: 'conductStatement', label: 'Conduct Statement', type: 'textarea', required: true },
        ],
        workflowSteps: [
            { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', actorRole: 'HOD' },
            { stepKey: 'PRINCIPAL_APPROVAL', label: 'Principal Approval', actorRole: 'PRINCIPAL' },
            { stepKey: 'ADMIN_PROCESS', label: 'Document Generation', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'GRADE_CARD',
        label: 'Grade Card',
        category: 'CERTIFICATE',
        description: 'Official grade card from published semester results.',
        estimatedProcess: 'Instant (if results published)',
        requiresApproval: false,
        autoApprove: true,
        generatesCertificate: true,
        certificateSeries: 'GC',
        formSchema: [
            { key: 'semesterId', label: 'Semester', type: 'select', required: true },
            { key: 'copies', label: 'Number of Copies', type: 'number' },
        ],
        workflowSteps: [],
    },
    {
        code: 'TRANSCRIPT',
        label: 'Academic Transcript',
        category: 'CERTIFICATE',
        description: 'Cumulative academic transcript from your official records.',
        estimatedProcess: '5-7 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: true,
        certificateSeries: 'TR',
        feeRequired: true,
        feeAmount: 500,
        feeHeadCode: 'TRANSCRIPT_FEE',
        formSchema: [
            { key: 'copies', label: 'Number of Copies', type: 'number' },
            { key: 'purpose', label: 'Purpose', type: 'text', required: true },
            { key: 'deliveryMode', label: 'Delivery Mode', type: 'select', options: ['Digital', 'Physical', 'Both'] },
        ],
        workflowSteps: [
            { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', actorRole: 'HOD' },
            { stepKey: 'ADMIN_PROCESS', label: 'Document Generation', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'PROVISIONAL_RESULT',
        label: 'Provisional Result',
        category: 'CERTIFICATE',
        description: 'Provisional result document (not university-issued).',
        requiresApproval: false,
        autoApprove: true,
        generatesCertificate: true,
        certificateSeries: 'PR',
        formSchema: [{ key: 'semesterId', label: 'Semester', type: 'select', required: true }],
        workflowSteps: [],
    },
    {
        code: 'ATTENDANCE_CERTIFICATE',
        label: 'Attendance Certificate',
        category: 'CERTIFICATE',
        description: 'Certificate showing attendance percentage for a period.',
        estimatedProcess: '3-5 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: true,
        certificateSeries: 'AC',
        formSchema: [
            { key: 'periodType', label: 'Period', type: 'select', options: ['Semester', 'Date Range'], required: true },
            { key: 'fromDate', label: 'From Date', type: 'date' },
            { key: 'toDate', label: 'To Date', type: 'date' },
            { key: 'purpose', label: 'Purpose', type: 'text', required: true },
        ],
        workflowSteps: [
            { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', actorRole: 'HOD' },
            { stepKey: 'ADMIN_PROCESS', label: 'Document Generation', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'NO_DUE_CERTIFICATE',
        label: 'No-Due Certificate',
        category: 'CERTIFICATE',
        description: 'Certificate confirming clearance from all departments including finance.',
        estimatedProcess: '3-5 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: true,
        certificateSeries: 'ND',
        formSchema: [{ key: 'purpose', label: 'Purpose', type: 'text', required: true }],
        workflowSteps: [
            { stepKey: 'FINANCE_CLEARANCE', label: 'Finance Clearance', actorRole: 'COLLEGE_ADMIN' },
            { stepKey: 'ADMIN_PROCESS', label: 'Document Generation', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'TRANSFER_CERTIFICATE',
        label: 'Transfer Certificate',
        category: 'CERTIFICATE',
        description: 'Institution-issued Transfer Certificate confirming you have left the institution in good standing.',
        instructions: 'Requires clearance from Finance, Library, Hostel and Transport before processing. Provide the reason for transfer.',
        estimatedProcess: '7-10 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: true,
        certificateSeries: 'TC',
        feeRequired: true,
        feeAmount: 300,
        feeHeadCode: 'TC_FEE',
        formSchema: [
            { key: 'reason', label: 'Reason for Transfer', type: 'textarea', required: true },
            { key: 'lastAttendanceDate', label: 'Last Date of Attendance', type: 'date' },
        ],
        workflowSteps: [
            { stepKey: 'FINANCE_CLEARANCE', label: 'Finance / No-Due Clearance', actorRole: 'COLLEGE_ADMIN' },
            { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', actorRole: 'HOD' },
            { stepKey: 'PRINCIPAL_APPROVAL', label: 'Principal Approval', actorRole: 'PRINCIPAL' },
            { stepKey: 'ADMIN_PROCESS', label: 'Document Generation', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'MIGRATION_CERTIFICATE',
        label: 'Migration Certificate',
        category: 'CERTIFICATE',
        description: 'Institution-issued Migration Certificate confirming your academic record for the purpose of migrating to another university. ' +
            'This is the institution-side document only — any separate university-issued migration process is external and not handled here.',
        instructions: 'Requires clearance from Finance, Library, Hostel and Transport before processing.',
        estimatedProcess: '7-10 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: true,
        certificateSeries: 'MC',
        feeRequired: true,
        feeAmount: 300,
        feeHeadCode: 'MIGRATION_FEE',
        formSchema: [
            { key: 'destinationInstitution', label: 'Destination Institution/University', type: 'text', required: true },
            { key: 'reason', label: 'Reason', type: 'textarea', required: true },
        ],
        workflowSteps: [
            { stepKey: 'FINANCE_CLEARANCE', label: 'Finance / No-Due Clearance', actorRole: 'COLLEGE_ADMIN' },
            { stepKey: 'PRINCIPAL_APPROVAL', label: 'Principal Approval', actorRole: 'PRINCIPAL' },
            { stepKey: 'ADMIN_PROCESS', label: 'Document Generation', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'COURSE_COMPLETION_CERTIFICATE',
        label: 'Course Completion Certificate',
        category: 'CERTIFICATE',
        description: 'Certificate confirming successful completion of your programme of study.',
        estimatedProcess: '5-7 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: true,
        certificateSeries: 'CP',
        formSchema: [
            { key: 'purpose', label: 'Purpose', type: 'text', required: true },
        ],
        workflowSteps: [
            { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', actorRole: 'HOD' },
            { stepKey: 'ADMIN_PROCESS', label: 'Document Generation', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'DUPLICATE_CERTIFICATE',
        label: 'Duplicate Certificate',
        category: 'CERTIFICATE',
        description: 'Request a duplicate copy of a certificate already issued to you. The original remains valid and unchanged.',
        instructions: 'Select the original certificate and the reason a duplicate is needed (e.g. lost, damaged).',
        estimatedProcess: '3-5 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: false,
        feeRequired: true,
        feeAmount: 200,
        feeHeadCode: 'DUPLICATE_CERT_FEE',
        formSchema: [
            { key: 'originalDocumentId', label: 'Original Certificate', type: 'select', required: true },
            { key: 'reason', label: 'Reason', type: 'select', options: ['Lost', 'Damaged', 'Other'], required: true },
            { key: 'reasonDetails', label: 'Additional Details', type: 'textarea' },
        ],
        workflowSteps: [
            { stepKey: 'ADMIN_PROCESS', label: 'Duplicate Issuance', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'PROFILE_CORRECTION',
        label: 'Profile Correction',
        category: 'CORRECTION',
        description: 'Request correction to your academic profile details.',
        estimatedProcess: '5-10 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: false,
        formSchema: [
            {
                key: 'field',
                label: 'Field to Correct',
                type: 'select',
                options: ['NAME', 'EMAIL', 'PHONE', 'SECTION', 'DOB'],
                required: true,
            },
            { key: 'currentValue', label: 'Current Value', type: 'text', required: true },
            { key: 'requestedValue', label: 'Requested Value', type: 'text', required: true },
            { key: 'reason', label: 'Reason', type: 'textarea', required: true },
        ],
        workflowSteps: [
            { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', actorRole: 'HOD' },
            { stepKey: 'ADMIN_PROCESS', label: 'Apply Correction', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'USN_CORRECTION',
        label: 'USN Correction',
        category: 'CORRECTION',
        description: 'Request correction to your University Seat Number.',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: false,
        formSchema: [
            { key: 'currentValue', label: 'Current USN', type: 'text', required: true },
            { key: 'requestedValue', label: 'Correct USN', type: 'text', required: true },
            { key: 'reason', label: 'Reason', type: 'textarea', required: true },
        ],
        workflowSteps: [
            { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', actorRole: 'HOD' },
            { stepKey: 'ADMIN_PROCESS', label: 'Apply Correction', actorRole: 'COLLEGE_ADMIN', isFinal: true },
        ],
    },
    {
        code: 'STUDENT_LEAVE_REQUEST',
        label: 'Leave Request',
        category: 'LEAVE',
        description: 'Apply for short leave or academic leave. Routed to your assigned mentor for approval.',
        instructions: 'Provide the leave dates and reason. Parent, mentor, coordinator and HOD routing follows institutional leave policy.',
        estimatedProcess: '1-2 working days',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: false,
        formSchema: [
            { key: 'leaveType', label: 'Leave Type', type: 'select', options: ['NORMAL_LEAVE', 'MEDICAL_LEAVE', 'EMERGENCY_LEAVE', 'HALF_DAY', 'OFFICIAL_DUTY', 'RETROSPECTIVE_LEAVE', 'Other'], required: true },
            { key: 'fromDate', label: 'From Date', type: 'date', required: true },
            { key: 'toDate', label: 'To Date', type: 'date', required: true },
            { key: 'dayPart', label: 'Day Part', type: 'select', options: ['FULL_DAY', 'FIRST_HALF', 'SECOND_HALF'] },
            { key: 'days', label: 'Number of Days', type: 'number' },
            { key: 'reason', label: 'Reason', type: 'textarea', required: true },
            { key: 'alsoRequestHostelLeave', label: 'Also request Hostel Leave / Outing', type: 'select', options: ['NO', 'YES'] },
        ],
        workflowSteps: [
            { stepKey: 'PARENT_ACTION', label: 'Parent Action', actorRole: 'PARENT' },
            { stepKey: 'MENTOR_APPROVAL', label: 'Mentor Approval', actorRole: 'MENTOR' },
            { stepKey: 'COORDINATOR_APPROVAL', label: 'Class Coordinator Approval', actorRole: 'CLASS_COORDINATOR' },
            { stepKey: 'HOD_APPROVAL', label: 'HOD Approval', actorRole: 'HOD', isFinal: true },
        ],
    },
    {
        code: 'STUDENT_PERMISSION_REQUEST',
        label: 'Permission / Short Leave',
        category: 'PERMISSION',
        description: 'Request hourly permission or a gate pass. Routed to your Class Coordinator for approval.',
        instructions: 'Provide the date, time window and reason for the permission.',
        estimatedProcess: 'Same day',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: false,
        formSchema: [
            { key: 'permissionType', label: 'Type', type: 'select', options: ['SHORT_PERMISSION', 'OFFICIAL_DUTY', 'Gate Pass', 'On-Duty', 'Late Entry', 'Early Exit', 'Other'], required: true },
            { key: 'onDate', label: 'Date', type: 'date', required: true },
            { key: 'fromTime', label: 'From Time', type: 'text' },
            { key: 'toTime', label: 'To Time', type: 'text' },
            { key: 'fromPeriod', label: 'From Period', type: 'number' },
            { key: 'toPeriod', label: 'To Period', type: 'number' },
            { key: 'hours', label: 'Number of Hours', type: 'number' },
            { key: 'reason', label: 'Reason', type: 'textarea', required: true },
        ],
        workflowSteps: [
            { stepKey: 'MENTOR_REVIEW', label: 'Mentor Review', actorRole: 'MENTOR' },
            { stepKey: 'COORDINATOR_APPROVAL', label: 'Class Coordinator Approval', actorRole: 'CLASS_COORDINATOR', isFinal: true },
        ],
    },
    {
        code: 'OTHER',
        label: 'Other Request',
        category: 'REQUEST',
        description: 'General academic service request.',
        requiresApproval: true,
        autoApprove: false,
        generatesCertificate: false,
        formSchema: [
            { key: 'details', label: 'Request Details', type: 'textarea', required: true },
        ],
        workflowSteps: [
            { stepKey: 'HOD_APPROVAL', label: 'HOD Review', actorRole: 'HOD', isFinal: true },
        ],
    },
];
const DEFAULT_GRIEVANCE_POLICIES = [
    { category: 'ACADEMIC', responseSlaHours: 48, resolutionSlaHours: 168, defaultAssigneeRole: 'HOD' },
    { category: 'EXAMINATION', responseSlaHours: 48, resolutionSlaHours: 120, defaultAssigneeRole: 'HOD' },
    { category: 'ATTENDANCE', responseSlaHours: 48, resolutionSlaHours: 120, defaultAssigneeRole: 'HOD' },
    { category: 'FACULTY', responseSlaHours: 72, resolutionSlaHours: 240, defaultAssigneeRole: 'HOD' },
    { category: 'FACILITIES', responseSlaHours: 24, resolutionSlaHours: 168, defaultAssigneeRole: 'COLLEGE_ADMIN' },
    { category: 'LIBRARY', responseSlaHours: 48, resolutionSlaHours: 168, defaultAssigneeRole: 'COLLEGE_ADMIN' },
    { category: 'HOSTEL', responseSlaHours: 24, resolutionSlaHours: 120, defaultAssigneeRole: 'COLLEGE_ADMIN' },
    { category: 'TRANSPORT', responseSlaHours: 24, resolutionSlaHours: 120, defaultAssigneeRole: 'COLLEGE_ADMIN' },
    { category: 'PLACEMENT', responseSlaHours: 48, resolutionSlaHours: 168, defaultAssigneeRole: 'COLLEGE_ADMIN' },
    { category: 'HARASSMENT', responseSlaHours: 24, resolutionSlaHours: 72, defaultAssigneeRole: 'PRINCIPAL', allowSensitive: true },
    { category: 'OTHER', responseSlaHours: 72, resolutionSlaHours: 240, defaultAssigneeRole: 'HOD' },
];
const DEFAULT_CERTIFICATE_TEMPLATES = [
    {
        certificateType: 'BONAFIDE_CERTIFICATE',
        title: 'Bonafide Certificate',
        bodyTemplate: 'This is to certify that {{studentName}}, bearing USN {{usn}}, is a bonafide student of {{programName}}, {{departmentName}}, currently studying in {{semesterLabel}} during the academic year {{academicYearLabel}}.\n\nThis certificate is issued for the purpose of: {{purpose}}.',
    },
    {
        certificateType: 'STUDY_CERTIFICATE',
        title: 'Study Certificate',
        bodyTemplate: 'This is to certify that {{studentName}} (USN: {{usn}}) has been a regular student of {{programName}}, {{departmentName}}, from {{studyFrom}} to {{studyTo}}.',
    },
    {
        certificateType: 'CONDUCT_CERTIFICATE',
        title: 'Conduct Certificate',
        bodyTemplate: 'This is to certify that {{studentName}} (USN: {{usn}}), a student of {{programName}}, {{departmentName}}, has conducted {{conductStatement}} during the period of study at this institution.',
    },
    {
        certificateType: 'GRADE_CARD',
        title: 'Grade Card',
        bodyTemplate: 'Semester Grade Card for {{semesterLabel}} — Academic Year {{academicYearLabel}}.',
    },
    {
        certificateType: 'TRANSCRIPT',
        title: 'Academic Transcript',
        bodyTemplate: 'Cumulative Academic Transcript for {{studentName}} (USN: {{usn}}).',
    },
    {
        certificateType: 'PROVISIONAL_RESULT',
        title: 'Provisional Result',
        bodyTemplate: 'PROVISIONAL — Semester result for {{semesterLabel}}. This is not an official university-issued document.',
    },
    {
        certificateType: 'ATTENDANCE_CERTIFICATE',
        title: 'Attendance Certificate',
        bodyTemplate: 'This is to certify that {{studentName}} (USN: {{usn}}) has maintained {{attendancePercentage}}% attendance during {{periodLabel}}.',
    },
    {
        certificateType: 'TRANSFER_CERTIFICATE',
        title: 'Transfer Certificate',
        bodyTemplate: 'This is to certify that {{studentName}} (USN: {{usn}}) was a bonafide student of {{programName}}, {{departmentName}} at {{collegeName}} and has been granted a Transfer Certificate. Last date of attendance: {{lastAttendanceDate}}. Reason: {{reason}}. The student bears a good moral character.',
    },
    {
        certificateType: 'MIGRATION_CERTIFICATE',
        title: 'Migration Certificate',
        bodyTemplate: 'This is to certify that {{studentName}} (USN: {{usn}}) of {{programName}}, {{departmentName}} at {{collegeName}} is permitted to migrate to {{destinationInstitution}}. This institution-issued certificate does not constitute a university-issued migration certificate.',
    },
    {
        certificateType: 'COURSE_COMPLETION_CERTIFICATE',
        title: 'Course Completion Certificate',
        bodyTemplate: 'This is to certify that {{studentName}} (USN: {{usn}}) has successfully completed the programme {{programName}} at {{departmentName}}, {{collegeName}}. Issued for the purpose of: {{purpose}}.',
    },
];
export async function ensureCollegeServicesDefaults(collegeId) {
    if (!(await db.schema.hasTable('student_service_request_types')))
        return;
    for (let i = 0; i < DEFAULT_REQUEST_TYPES.length; i++) {
        const def = DEFAULT_REQUEST_TYPES[i];
        let typeRow = await db('student_service_request_types')
            .where({ college_id: collegeId, code: def.code })
            .first();
        if (!typeRow) {
            const insertData = {
                college_id: collegeId,
                code: def.code,
                label: def.label,
                category: def.category,
                description: def.description,
                instructions: def.instructions ?? null,
                estimated_process: def.estimatedProcess ?? null,
                requires_approval: def.requiresApproval,
                auto_approve: def.autoApprove,
                generates_certificate: def.generatesCertificate,
                certificate_series: def.certificateSeries ?? null,
                form_schema: JSON.stringify(def.formSchema),
                sort_order: i,
            };
            if (await db.schema.hasColumn('student_service_request_types', 'fee_required')) {
                insertData.fee_required = def.feeRequired ?? false;
                insertData.fee_amount = def.feeAmount ?? null;
                insertData.fee_head_code = def.feeHeadCode ?? null;
            }
            try {
                const [typeId] = await db('student_service_request_types').insert(insertData);
                typeRow = { id: typeId };
            }
            catch (error) {
                // Concurrent seeding of the same college (e.g. two API instances or two
                // parallel test suites both calling ensureCollegeServicesDefaults for the
                // first time) can race on the unique (college_id, code) constraint. The
                // loser just re-reads the winner's row instead of erroring.
                if (error.code !== 'ER_DUP_ENTRY')
                    throw error;
                typeRow = await db('student_service_request_types').where({ college_id: collegeId, code: def.code }).first();
                if (!typeRow)
                    throw error;
            }
        }
        else if (await db.schema.hasColumn('student_service_request_types', 'fee_required') && def.feeRequired) {
            await db('student_service_request_types').where({ id: typeRow.id }).update({
                fee_required: def.feeRequired,
                fee_amount: def.feeAmount ?? null,
                fee_head_code: def.feeHeadCode ?? null,
            });
        }
        if (def.workflowSteps.length) {
            const existingWf = await db('student_request_workflows')
                .where({ college_id: collegeId, request_type_id: typeRow.id })
                .first();
            if (!existingWf) {
                const [wfId] = await db('student_request_workflows').insert({
                    college_id: collegeId,
                    request_type_id: typeRow.id,
                    name: `${def.label} Workflow`,
                });
                for (let si = 0; si < def.workflowSteps.length; si++) {
                    const step = def.workflowSteps[si];
                    await db('student_request_workflow_steps').insert({
                        workflow_id: wfId,
                        step_order: si + 1,
                        step_key: step.stepKey,
                        label: step.label,
                        actor_role: step.actorRole,
                        is_final: step.isFinal ?? false,
                    });
                }
            }
        }
    }
    if (await db.schema.hasTable('college_grievance_policies')) {
        for (const policy of DEFAULT_GRIEVANCE_POLICIES) {
            const exists = await db('college_grievance_policies')
                .where({ college_id: collegeId, category: policy.category })
                .first();
            if (!exists) {
                await db('college_grievance_policies').insert({
                    college_id: collegeId,
                    category: policy.category,
                    response_sla_hours: policy.responseSlaHours,
                    resolution_sla_hours: policy.resolutionSlaHours,
                    default_assignee_role: policy.defaultAssigneeRole,
                    allow_sensitive: policy.allowSensitive ?? false,
                });
            }
        }
    }
    if (await db.schema.hasTable('certificate_templates')) {
        for (const tmpl of DEFAULT_CERTIFICATE_TEMPLATES) {
            const exists = await db('certificate_templates')
                .where({ college_id: collegeId, certificate_type: tmpl.certificateType })
                .first();
            if (!exists) {
                await db('certificate_templates').insert({
                    college_id: collegeId,
                    certificate_type: tmpl.certificateType,
                    title: tmpl.title,
                    body_template: tmpl.bodyTemplate,
                    header_config: JSON.stringify({ showLogo: true, showAddress: true }),
                    footer_config: JSON.stringify({ showVerification: true }),
                    signatory_config: JSON.stringify({ name: 'Principal', designation: 'Principal' }),
                });
            }
        }
    }
}
export async function getRequestType(collegeId, code) {
    return db('student_service_request_types')
        .where({ college_id: collegeId, code, is_active: true })
        .first();
}
export async function getWorkflowForType(collegeId, requestTypeId) {
    const wf = await db('student_request_workflows')
        .where({ college_id: collegeId, request_type_id: requestTypeId, is_active: true })
        .first();
    if (!wf)
        return null;
    const steps = await db('student_request_workflow_steps')
        .where({ workflow_id: wf.id })
        .orderBy('step_order');
    return { workflow: wf, steps };
}
