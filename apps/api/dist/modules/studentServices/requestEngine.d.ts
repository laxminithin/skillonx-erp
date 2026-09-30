import type { FacultyRequesterActor, ServicesActor, StudentActor } from './types.js';
type ParentWorkflowActor = {
    parentUserId: number;
    collegeId: number;
    role: 'PARENT';
    email?: string;
    name?: string;
};
export declare function studentServicesHome(studentId: number, collegeId: number): Promise<{
    requestTypes: {
        code: any;
        label: any;
        category: any;
        description: any;
        instructions: any;
        estimatedProcess: any;
        generatesCertificate: boolean;
        formSchema: never[];
    }[];
    counts: {
        pendingRequests: number;
        certificates: number;
        openGrievances: number;
        alerts: number;
    };
    mentor: {
        name: any;
        department: any;
    } | null;
}>;
export declare function listStudentRequests(studentId: number, collegeId: number, status?: string): Promise<{
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}[]>;
export declare function listDraftRequests(studentId: number, collegeId: number): Promise<{
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}[]>;
export declare function createRequest(actor: StudentActor, input: {
    requestTypeCode: string;
    title: string;
    description?: string | null;
    formData?: Record<string, unknown> | null;
    priority?: string;
}): Promise<{
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        status: any;
        remarks: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isStudent: boolean;
        createdAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    document: {
        id: number;
        certificateNumber: any;
        verificationCode: any;
        documentType: any;
        issuedAt: any;
    } | null;
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function createParentInitiatedRequest(actor: ParentWorkflowActor, studentId: number, input: {
    requestTypeCode: string;
    title: string;
    description?: string | null;
    formData?: Record<string, unknown> | null;
    priority?: string;
}): Promise<{
    type: {
        code: any;
        label: any;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    linkedRequests: {
        domain: any;
        entityType: any;
        entityId: number;
        correlationId: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function submitParentInitiatedRequest(actor: ParentWorkflowActor, requestId: number): Promise<{
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        status: any;
        remarks: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isStudent: boolean;
        createdAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    document: {
        id: number;
        certificateNumber: any;
        verificationCode: any;
        documentType: any;
        issuedAt: any;
    } | null;
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
} | {
    type: {
        code: any;
        label: any;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    linkedRequests: {
        domain: any;
        entityType: any;
        entityId: number;
        correlationId: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function listParentLeaveRequests(actor: ParentWorkflowActor, studentId: number, status?: string): Promise<{
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}[]>;
export declare function getParentRequest(actor: ParentWorkflowActor, requestId: number): Promise<{
    type: {
        code: any;
        label: any;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    linkedRequests: {
        domain: any;
        entityType: any;
        entityId: number;
        correlationId: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function parentActionOnRequest(actor: ParentWorkflowActor, requestId: number, input: {
    action: 'APPROVE' | 'DECLINE';
    remarks?: string | null;
}): Promise<{
    type: {
        code: any;
        label: any;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    linkedRequests: {
        domain: any;
        entityType: any;
        entityId: number;
        correlationId: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
/** Faculty-owned Office request path; never impersonates a student. */
export declare function createFacultyRequest(actor: FacultyRequesterActor, input: {
    requestTypeCode: string;
    title: string;
    description?: string | null;
    formData?: Record<string, unknown> | null;
    priority?: string;
}): Promise<{
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function getFacultyRequest(actor: FacultyRequesterActor, requestId: number): Promise<{
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function submitFacultyRequest(actor: FacultyRequesterActor, requestId: number): Promise<{
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function updateDraftRequest(actor: StudentActor, requestId: number, input: {
    title?: string;
    description?: string | null;
    formData?: Record<string, unknown> | null;
}): Promise<{
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        status: any;
        remarks: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isStudent: boolean;
        createdAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    document: {
        id: number;
        certificateNumber: any;
        verificationCode: any;
        documentType: any;
        issuedAt: any;
    } | null;
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function submitRequest(actor: StudentActor, requestId: number): Promise<{
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        status: any;
        remarks: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isStudent: boolean;
        createdAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    document: {
        id: number;
        certificateNumber: any;
        verificationCode: any;
        documentType: any;
        issuedAt: any;
    } | null;
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
} | {
    type: {
        code: any;
        label: any;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    linkedRequests: {
        domain: any;
        entityType: any;
        entityId: number;
        correlationId: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function cancelRequest(actor: StudentActor, requestId: number): Promise<{
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        status: any;
        remarks: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isStudent: boolean;
        createdAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    document: {
        id: number;
        certificateNumber: any;
        verificationCode: any;
        documentType: any;
        issuedAt: any;
    } | null;
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function respondToRequest(actor: StudentActor, requestId: number, body: string): Promise<{
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        status: any;
        remarks: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isStudent: boolean;
        createdAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    document: {
        id: number;
        certificateNumber: any;
        verificationCode: any;
        documentType: any;
        issuedAt: any;
    } | null;
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function getStudentRequest(actor: StudentActor, requestId: number): Promise<{
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
        formSchema: never[];
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        status: any;
        remarks: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isStudent: boolean;
        createdAt: any;
    }[];
    attachments: {
        id: number;
        fileName: any;
        mimeType: any;
        fileSize: number;
        createdAt: any;
    }[];
    document: {
        id: number;
        certificateNumber: any;
        verificationCode: any;
        documentType: any;
        issuedAt: any;
    } | null;
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function staffListRequests(actor: ServicesActor, filters: {
    status?: string;
    requestType?: string;
    departmentId?: number;
    page?: number;
    limit?: number;
}): Promise<{
    requests: {
        studentName: any;
        usn: any;
        departmentName: any;
        id: number;
        requestNumber: string | null;
        requestTypeCode: {} | null;
        requestTypeLabel: {} | null;
        title: unknown;
        description: unknown;
        status: unknown;
        priority: unknown;
        currentStage: unknown;
        currentStepOrder: number | null;
        requesterType: {};
        requesterParentUserId: number | null;
        parentActionState: {} | null;
        hostelCorrelationId: {} | null;
        formData: {};
        submittedAt: unknown;
        completedAt: unknown;
        cancelledAt: unknown;
        createdAt: unknown;
        updatedAt: unknown;
    }[];
    pagination: {
        page: number;
        limit: number;
        total: number;
    };
}>;
export declare function staffGetRequest(actor: ServicesActor, requestId: number): Promise<{
    student: {
        id: number;
        name: any;
        usn: any;
        email: any;
        departmentName: any;
        programName: any;
        semesterLabel: any;
    } | null;
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        internalRemarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isInternal: boolean;
        createdAt: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function staffActionOnRequest(actor: ServicesActor, requestId: number, input: {
    action: string;
    remarks?: string | null;
    internalRemarks?: string | null;
}): Promise<{
    student: {
        id: number;
        name: any;
        usn: any;
        email: any;
        departmentName: any;
        programName: any;
        semesterLabel: any;
    } | null;
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        internalRemarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isInternal: boolean;
        createdAt: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function assertRequestTransition(status: string, action: string): void;
export declare function assignRequest(actor: ServicesActor, requestId: number, assigneeFacultyId: number, reason?: string | null): Promise<{
    student: {
        id: number;
        name: any;
        usn: any;
        email: any;
        departmentName: any;
        programName: any;
        semesterLabel: any;
    } | null;
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        internalRemarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isInternal: boolean;
        createdAt: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function mentorInboxRequests(actor: ServicesActor, tab?: string): Promise<{
    requests: unknown[];
    counts: {
        PENDING: number;
        APPROVED: number;
        REJECTED: number;
        RETURNED: number;
        TOTAL: number;
    };
}>;
/** Detail getter guarded by mentor/coordinator relationship (not office-wide view). */
export declare function mentorGetRequest(actor: ServicesActor, requestId: number): Promise<{
    student: {
        id: number;
        name: any;
        usn: any;
        email: any;
        departmentName: any;
        programName: any;
        semesterLabel: any;
    } | null;
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        internalRemarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isInternal: boolean;
        createdAt: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
/** Action guarded by relationship, then delegated to the shared workflow engine. */
export declare function mentorActionOnRequest(actor: ServicesActor, requestId: number, input: {
    action: string;
    remarks?: string | null;
    internalRemarks?: string | null;
}): Promise<{
    student: {
        id: number;
        name: any;
        usn: any;
        email: any;
        departmentName: any;
        programName: any;
        semesterLabel: any;
    } | null;
    type: {
        code: any;
        label: any;
        generatesCertificate: boolean;
    } | null;
    timeline: {
        stepOrder: number;
        stepKey: any;
        label: any;
        actorRole: any;
        status: any;
        remarks: any;
        internalRemarks: any;
        actedByName: any;
        actedAt: any;
    }[];
    comments: {
        id: number;
        body: any;
        authorName: any;
        isInternal: boolean;
        createdAt: any;
    }[];
    id: number;
    requestNumber: string | null;
    requestTypeCode: {} | null;
    requestTypeLabel: {} | null;
    title: unknown;
    description: unknown;
    status: unknown;
    priority: unknown;
    currentStage: unknown;
    currentStepOrder: number | null;
    requesterType: {};
    requesterParentUserId: number | null;
    parentActionState: {} | null;
    hostelCorrelationId: {} | null;
    formData: {};
    submittedAt: unknown;
    completedAt: unknown;
    cancelledAt: unknown;
    createdAt: unknown;
    updatedAt: unknown;
}>;
export declare function assignmentHistory(actor: ServicesActor, requestId: number): Promise<any[]>;
export declare function staffPendingActions(actor: ServicesActor): Promise<{
    approvals: {
        requestId: number;
        requestNumber: any;
        title: any;
        typeLabel: any;
        studentName: any;
        usn: any;
        stepLabel: any;
        actorRole: any;
    }[];
    grievanceCount: number;
    meetingRequestCount: number;
    total: number;
}>;
export declare function generateVerificationCode(): string;
export {};
