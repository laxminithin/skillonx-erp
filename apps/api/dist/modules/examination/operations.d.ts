import { z } from 'zod';
import type { ExamActor } from './access.js';
export declare const strongRoomSchema: z.ZodObject<{
    examSubjectId: z.ZodNumber;
    paperReference: z.ZodString;
    packetReference: z.ZodString;
    quantity: z.ZodNumber;
    sealStatus: z.ZodEnum<["SEALED", "BROKEN", "NOT_APPLICABLE"]>;
    storageReference: z.ZodOptional<z.ZodString>;
    receivedAt: z.ZodDate;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    examSubjectId: number;
    quantity: number;
    paperReference: string;
    packetReference: string;
    sealStatus: "NOT_APPLICABLE" | "SEALED" | "BROKEN";
    receivedAt: Date;
    remarks?: string | undefined;
    storageReference?: string | undefined;
}, {
    examSubjectId: number;
    quantity: number;
    paperReference: string;
    packetReference: string;
    sealStatus: "NOT_APPLICABLE" | "SEALED" | "BROKEN";
    receivedAt: Date;
    remarks?: string | undefined;
    storageReference?: string | undefined;
}>;
export declare function createStrongRoomRecord(actor: ExamActor, examId: number, b: z.infer<typeof strongRoomSchema>): Promise<{
    id: number;
    status: string;
}>;
export declare const custodySchema: z.ZodObject<{
    resourceType: z.ZodEnum<["QUESTION_PAPER", "ANSWER_BOOK", "SCRIPT"]>;
    resourceId: z.ZodNumber;
    action: z.ZodEnum<["RECEIVED", "STORED", "TRANSFERRED", "ISSUED", "OPENED", "RETURNED", "CLOSED"]>;
    fromCustody: z.ZodOptional<z.ZodString>;
    toCustody: z.ZodOptional<z.ZodString>;
    quantity: z.ZodOptional<z.ZodNumber>;
    reference: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    action: "CLOSED" | "RETURNED" | "RECEIVED" | "ISSUED" | "STORED" | "TRANSFERRED" | "OPENED";
    resourceType: "QUESTION_PAPER" | "ANSWER_BOOK" | "SCRIPT";
    resourceId: number;
    reference?: string | undefined;
    remarks?: string | undefined;
    quantity?: number | undefined;
    fromCustody?: string | undefined;
    toCustody?: string | undefined;
}, {
    action: "CLOSED" | "RETURNED" | "RECEIVED" | "ISSUED" | "STORED" | "TRANSFERRED" | "OPENED";
    resourceType: "QUESTION_PAPER" | "ANSWER_BOOK" | "SCRIPT";
    resourceId: number;
    reference?: string | undefined;
    remarks?: string | undefined;
    quantity?: number | undefined;
    fromCustody?: string | undefined;
    toCustody?: string | undefined;
}>;
export declare function appendCustody(actor: ExamActor, b: z.infer<typeof custodySchema>): Promise<{
    action: "CLOSED" | "RETURNED" | "RECEIVED" | "ISSUED" | "STORED" | "TRANSFERRED" | "OPENED";
    resourceType: "QUESTION_PAPER" | "ANSWER_BOOK" | "SCRIPT";
    resourceId: number;
    reference?: string | undefined;
    remarks?: string | undefined;
    quantity?: number | undefined;
    fromCustody?: string | undefined;
    toCustody?: string | undefined;
    id: number;
}>;
export declare const attendanceSchema: z.ZodObject<{
    roomId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    records: z.ZodArray<z.ZodObject<{
        studentId: z.ZodNumber;
        status: z.ZodEnum<["PRESENT", "ABSENT", "MPC"]>;
    }, "strip", z.ZodTypeAny, {
        status: "PRESENT" | "ABSENT" | "MPC";
        studentId: number;
    }, {
        status: "PRESENT" | "ABSENT" | "MPC";
        studentId: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    records: {
        status: "PRESENT" | "ABSENT" | "MPC";
        studentId: number;
    }[];
    roomId?: number | null | undefined;
}, {
    records: {
        status: "PRESENT" | "ABSENT" | "MPC";
        studentId: number;
    }[];
    roomId?: number | null | undefined;
}>;
export declare function saveFormA(actor: ExamActor, subjectId: number, b: z.infer<typeof attendanceSchema>): Promise<{
    sessionId: number;
    status: any;
    records: any[];
}>;
export declare function freezeFormA(actor: ExamActor, sessionId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function correctFormA(actor: ExamActor, recordId: number, status: 'PRESENT' | 'ABSENT' | 'MPC', reason: string): Promise<{
    id: number;
    status: "PRESENT" | "ABSENT" | "MPC";
}>;
export declare function formARoster(actor: ExamActor, examSubjectId: number, roomId?: number | null): Promise<{
    examSubjectId: number;
    courseId: number;
    session: {
        id: number;
        status: any;
        roomId: any;
    } | null;
    candidates: {
        studentId: number;
        studentName: any;
        usn: any;
        eligibilityStatus: any;
        registrationStatus: any;
        recordId: number | null;
        attendance: any;
    }[];
}>;
export declare function listExaminationDocuments(actor: ExamActor, type?: string): Promise<{
    documents: {
        id: number;
        documentType: any;
        certificateNumber: any;
        verificationCode: any;
        status: any;
        studentName: any;
        usn: any;
        issuedAt: any;
    }[];
}>;
export declare function mpcQueue(actor: ExamActor, examId?: number): Promise<{
    cases: {
        id: number;
        status: any;
        decision: any;
        examId: number;
        studentName: any;
        usn: any;
        courseCode: any;
        courseName: any;
        createdAt: any;
    }[];
}>;
export declare const mpcSchema: z.ZodObject<{
    examSubjectId: z.ZodNumber;
    studentId: z.ZodNumber;
    roomId: z.ZodOptional<z.ZodNumber>;
    invigilatorReport: z.ZodString;
}, "strip", z.ZodTypeAny, {
    studentId: number;
    examSubjectId: number;
    invigilatorReport: string;
    roomId?: number | undefined;
}, {
    studentId: number;
    examSubjectId: number;
    invigilatorReport: string;
    roomId?: number | undefined;
}>;
export declare function createMpcCase(actor: ExamActor, examId: number, b: z.infer<typeof mpcSchema>): Promise<{
    id: number;
    status: string;
}>;
export declare function transitionMpcCase(actor: ExamActor, id: number, to: string, note?: string): Promise<{
    id: number;
    status: string;
}>;
export declare function recordMpcStudentStatement(actor: ExamActor, id: number, statement: string): Promise<{
    id: number;
}>;
export declare function decideMpcCase(actor: ExamActor, id: number, b: {
    committee: unknown[];
    decision: string;
    reason: string;
    penalty?: string;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function recordMpcResultAction(actor: ExamActor, id: number, b: {
    actionType: 'RESULT_WITHHELD' | 'RESULT_INVALIDATED' | 'SUBJECT_CANCELLED' | 'NO_ACTION';
    resultReference?: string;
    resultVersion?: string;
    note?: string;
}): Promise<{
    id: number;
    caseId: number;
    actionType: "RESULT_WITHHELD" | "RESULT_INVALIDATED" | "SUBJECT_CANCELLED" | "NO_ACTION";
}>;
export declare const mpcEvidenceSchema: z.ZodObject<{
    fileReference: z.ZodString;
    fileHash: z.ZodString;
    storageKey: z.ZodOptional<z.ZodString>;
    contentType: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodUnknown>;
}, "strip", z.ZodTypeAny, {
    fileHash: string;
    fileReference: string;
    description?: string | undefined;
    metadata?: unknown;
    storageKey?: string | undefined;
    contentType?: string | undefined;
}, {
    fileHash: string;
    fileReference: string;
    description?: string | undefined;
    metadata?: unknown;
    storageKey?: string | undefined;
    contentType?: string | undefined;
}>;
export declare function uploadMpcEvidence(actor: ExamActor, id: number, b: z.infer<typeof mpcEvidenceSchema>): Promise<{
    id: number;
    caseId: number;
}>;
export declare function authorizeMpcEvidenceAccess(actor: ExamActor, caseId: number): Promise<any>;
export declare function listMpcEvidence(actor: ExamActor, caseId: number): Promise<{
    caseId: number;
    evidence: {
        id: number;
        fileReference: any;
        fileHash: any;
        contentType: any;
        description: any;
        uploadedBy: any;
        createdAt: any;
    }[];
}>;
export declare function getMpcEvidenceRef(actor: ExamActor, caseId: number, evidenceId: number): Promise<{
    id: number;
    storageKey: any;
    fileReference: any;
    contentType: any;
}>;
export declare function mpcCaseDetail(actor: ExamActor, caseId: number): Promise<{
    id: number;
    status: any;
    studentId: number;
    examSubjectId: number;
    invigilatorReport: any;
    studentStatement: any;
    committee: any;
    decision: any;
    decisionReason: any;
    penalty: any;
    timeline: any[];
    resultActions: any[];
    evidenceCount: number;
}>;
export declare function createAnswerBookBatch(actor: ExamActor, examId: number, b: {
    series: string;
    rangeStart?: string;
    rangeEnd?: string;
    receivedQuantity: number;
}): Promise<{
    id: number;
}>;
export declare function createScriptBatch(actor: ExamActor, b: {
    examSubjectId: number;
    reference: string;
    expectedCount: number;
    actualCount: number;
}): Promise<{
    id: number;
    variance: number;
    stage: string;
}>;
export declare const answerBookMovementSchema: z.ZodObject<{
    movementType: z.ZodEnum<["RECEIVED", "ISSUED", "USED", "UNUSED", "DAMAGED", "RETURNED"]>;
    quantity: z.ZodNumber;
    rangeStart: z.ZodOptional<z.ZodString>;
    rangeEnd: z.ZodOptional<z.ZodString>;
    fromHolder: z.ZodOptional<z.ZodString>;
    toHolder: z.ZodOptional<z.ZodString>;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    movementType: "RETURNED" | "RECEIVED" | "ISSUED" | "DAMAGED" | "USED" | "UNUSED";
    remarks?: string | undefined;
    rangeStart?: string | undefined;
    rangeEnd?: string | undefined;
    fromHolder?: string | undefined;
    toHolder?: string | undefined;
}, {
    quantity: number;
    movementType: "RETURNED" | "RECEIVED" | "ISSUED" | "DAMAGED" | "USED" | "UNUSED";
    remarks?: string | undefined;
    rangeStart?: string | undefined;
    rangeEnd?: string | undefined;
    fromHolder?: string | undefined;
    toHolder?: string | undefined;
}>;
export declare function answerBookReconciliation(t: {
    issued_quantity: number;
    used_quantity: number;
    unused_quantity: number;
    damaged_quantity: number;
    returned_quantity: number;
}): {
    expected: number;
    actual: number;
    variance: number;
};
export declare function recordAnswerBookMovement(actor: ExamActor, batchId: number, b: z.infer<typeof answerBookMovementSchema>): Promise<{
    id: number;
    batchId: number;
    movementColumn: string;
    totals: Record<string, number>;
    reconciliation: {
        expected: number;
        actual: number;
        variance: number;
    };
}>;
export declare function resolveAnswerBookVariance(actor: ExamActor, batchId: number, b: {
    reason: string;
    investigationNote: string;
    resolution: string;
}): Promise<{
    id: number;
    variance: number;
    varianceStatus: string;
}>;
export declare function closeAnswerBookReconciliation(actor: ExamActor, batchId: number): Promise<{
    id: number;
    reconciliationStatus: string;
    reconciliation: {
        expected: number;
        actual: number;
        variance: number;
    };
}>;
export declare const scriptTransferSchema: z.ZodObject<{
    scriptBatchId: z.ZodNumber;
    fromHolder: z.ZodString;
    toHolder: z.ZodString;
    expectedCount: z.ZodNumber;
    remarks: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fromHolder: string;
    toHolder: string;
    scriptBatchId: number;
    expectedCount: number;
    remarks?: string | undefined;
}, {
    fromHolder: string;
    toHolder: string;
    scriptBatchId: number;
    expectedCount: number;
    remarks?: string | undefined;
}>;
export declare function createScriptTransfer(actor: ExamActor, b: z.infer<typeof scriptTransferSchema>): Promise<{
    id: number;
    status: string;
    expectedCount: number;
}>;
export declare function acknowledgeScriptTransfer(actor: ExamActor, transferId: number, b: {
    receivedCount: number;
    remarks?: string;
}): Promise<{
    id: number;
    status: string;
    expectedCount: number;
    receivedCount: number;
    variance: number;
    varianceStatus: string;
}>;
export declare function resolveScriptTransferVariance(actor: ExamActor, transferId: number, b: {
    reason: string;
    resolution: string;
}): Promise<{
    id: number;
    expectedCount: number;
    receivedCount: number;
    variance: number;
    varianceStatus: string;
}>;
export declare function assignValuation(actor: ExamActor, b: {
    examSubjectId: number;
    scriptBatchId: number;
    examinerId: number;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function scoreValuationPayload(payload: any): {
    total: number | null;
    max: number | null;
};
export declare function saveValuation(actor: ExamActor, id: number, payload: unknown, submit?: boolean): Promise<{
    id: number;
    status: string;
    total: number | null;
    max: number | null;
}>;
export declare function correctValuation(actor: ExamActor, id: number, b: {
    questionRef: string;
    newMarks: number;
    reason: string;
}): Promise<{
    id: number;
    questionRef: string;
    oldMarks: number;
    newMarks: number;
    oldTotal: number;
    newTotal: number | null;
}>;
export declare function operationalReadback(actor: ExamActor, examId?: number): Promise<{
    packets: any[];
    formA: any;
    mpc: any;
    answerBooks: any[];
    scripts: any[];
}>;
export declare function valuationQueue(actor: ExamActor): Promise<{
    assignments: {
        id: number;
        examSubjectId: number;
        scriptBatchId: number;
        examinerId: number;
        examinerName: any;
        courseCode: any;
        courseName: any;
        status: any;
        marksPayload: any;
        submittedAt: any;
        lockedAt: any;
    }[];
}>;
