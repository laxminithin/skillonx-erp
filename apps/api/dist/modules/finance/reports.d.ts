import type { FinanceActor } from './types.js';
export declare function financeDashboard(actor: FinanceActor): Promise<{
    expectedCollection: string;
    collected: string;
    outstanding: string;
    todayCollection: string;
    overdueAmount: string;
    scholarshipReceivable: string;
    refundPending: string;
    todayByMode: {
        method: string;
        amount: string;
    }[];
    actionRequired: {
        label: string;
        count: number;
    }[];
    recentTransactions: {
        id: number;
        paymentNumber: any;
        studentName: any;
        usn: any;
        amount: string;
        paymentDate: any;
        paymentMethod: any;
        status: any;
    }[];
}>;
export declare function reconciliationWorkspace(actor: FinanceActor): Promise<{
    gatewayOrders: {
        orderId: any;
        provider: any;
        paymentNumber: any;
        studentName: any;
        usn: any;
        amount: string;
        currency: any;
        status: any;
        createdAt: any;
    }[];
    failedPayments: {
        paymentNumber: any;
        studentName: any;
        usn: any;
        amount: string;
        paymentDate: any;
        paymentMethod: any;
        transactionReference: any;
    }[];
    duplicatedReferences: {
        transactionReference: string;
        count: number;
    }[];
}>;
export declare function dailyCollectionReport(actor: FinanceActor, filters: {
    date?: string;
    paymentMethod?: string;
    recordedBy?: number;
}): Promise<{
    date: string;
    payments: {
        paymentNumber: any;
        amount: string;
        method: any;
        cashier: any;
        transactionReference: any;
    }[];
    totalsByMode: {
        method: string;
        amount: string;
    }[];
    grandTotal: string;
}>;
export declare function outstandingReport(actor: FinanceActor, filters: {
    academicYearId?: number;
    programId?: number;
    semesterId?: number;
    classId?: number;
}): Promise<{
    studentName: any;
    usn: any;
    programName: any;
    semesterLabel: any;
    demandNumber: any;
    totalDemand: string;
    paid: string;
    outstanding: string;
    dueDate: any;
    status: any;
}[]>;
export declare function searchStudentFinance(actor: FinanceActor, query: string): Promise<{
    studentId: number;
    name: any;
    usn: any;
    programName: any;
    className: any;
    outstanding: string;
}[]>;
export declare function getStudentFinanceProfile(actor: FinanceActor, studentId: number): Promise<{
    student: {
        id: number;
        name: any;
        usn: any;
        email: any;
        programName: any;
        semesterLabel: any;
    };
    summary: {
        totalFees: string;
        paid: string;
        outstanding: string;
        nextDueDate: string | null;
        demandCount: number;
    };
    demands: {
        id: number;
        studentId: number | null;
        subjectType: {};
        subjectId: number | null;
        academicYearId: number;
        semesterId: number | null;
        demandNumber: unknown;
        demandType: unknown;
        issueDate: unknown;
        dueDate: unknown;
        grossAmount: string;
        discountAmount: string;
        scholarshipAmount: string;
        adjustmentAmount: string;
        lateFeeAmount: string;
        netAmount: string;
        paidAmount: string;
        outstandingAmount: string;
        status: unknown;
        receiptReference: {} | null;
        items: unknown[];
    }[];
    payments: {
        id: number;
        paymentNumber: unknown;
        studentId: number | null;
        subjectType: {};
        subjectId: number | null;
        studentName: {} | null;
        applicantName: {} | null;
        applicationNumber: {} | null;
        usn: {} | null;
        amount: string;
        paymentDate: unknown;
        paymentMethod: unknown;
        transactionReference: unknown;
        status: unknown;
        chequeStatus: unknown;
        createdAt: unknown;
    }[];
    receipts: {
        id: number;
        receiptNumber: string;
        studentId: number;
        paymentId: number;
        receiptDate: unknown;
        amount: string;
        paymentMethod: unknown;
        transactionReference: unknown;
        outstandingBalance: string;
        status: unknown;
        snapshot: unknown;
        voidedAt: unknown;
        voidReason: unknown;
    }[];
    scholarships: {
        id: number;
        studentId: number;
        studentName: {} | null;
        usn: {} | null;
        schemeId: number;
        schemeName: unknown;
        schemeCode: unknown;
        academicYearId: number;
        expectedAmount: string | null;
        sanctionedAmount: string | null;
        receivedAmount: string;
        status: unknown;
        createdAt: unknown;
    }[];
    concessions: {
        id: number;
        studentId: number;
        studentName: any;
        usn: any;
        concessionType: any;
        amount: string | null;
        percentage: number | null;
        reason: any;
        status: any;
        createdAt: any;
    }[];
    refunds: {
        id: number;
        amount: string;
        reasonCode: any;
        status: any;
        createdAt: any;
    }[];
    noDue: {
        domains: {
            domain: string;
            status: import("./types.js").NoDueDomainStatus;
            label: string;
        }[];
        overallClear: boolean;
    };
    auditHistory: {
        action: any;
        entityType: any;
        entityId: number;
        createdAt: any;
    }[];
}>;
