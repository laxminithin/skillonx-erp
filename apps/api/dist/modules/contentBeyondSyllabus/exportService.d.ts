import ExcelJS from 'exceljs';
import { getPlan } from './service.js';
export declare function exportCbsPlanXlsx(planId: number, collegeId: number): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
export declare function buildPrintModel(plan: Awaited<ReturnType<typeof getPlan>>): {
    cover: {
        documentTitle: string;
        documentSubtitle: string;
        collegeName: any;
        logoUrl: any;
        departmentName: any;
        subjectName: any;
        courseCode: any;
        schemeLabel: any;
        academicYearLabel: any;
        programName: any;
        semesterLabel: any;
        preparedBy: any;
    };
    summary: {
        totalItems: number;
        planned: number;
        delivered: number;
        assessed: number;
        completed: number;
        plannedHours: number;
        actualHours: number;
        byOrigin: Record<string, number>;
    };
    items: {
        id: number;
        cbsId: any;
        serialNo: number;
        title: any;
        contentDescription: any;
        originType: any;
        originLabel: string;
        relatedGapId: any;
        rationale: any;
        expectedBenefit: any;
        moduleUnit: any;
        relatedTopic: any;
        primaryCo: any;
        deliveryMethod: any;
        suggestedDeliveryMethod: any;
        plannedHours: number | null;
        actualHours: number | null;
        plannedDate: any;
        actualDate: any;
        assessmentRequired: boolean;
        assessmentType: any;
        includeInFormalAttainment: boolean;
        status: any;
        resources: any;
        deliveryNotes: any;
        participants: any;
        actualOutcome: any;
        assessmentMethod: any;
        assessmentResult: any;
        facultyObservation: any;
        studentFeedbackSummary: any;
        impactBenefit: any;
        priority: any;
        verificationStatus: any;
        isCustom: boolean;
        cos: {
            coCode: any;
            statement: any;
            relationship: any;
        }[];
        outcomes: {
            coCode: string;
            outcomeType: string;
            outcomeCode: string;
            strength: number;
            derivedFrom: string;
        }[];
        assessments: {
            id: number;
            kind: any;
            quizId: any;
            assignmentId: any;
            includeInFormalAttainment: boolean;
        }[];
        evidence: {
            id: number;
            evidenceType: any;
            title: any;
            description: any;
            fileName: any;
            externalUrl: any;
            uploadedAt: any;
        }[];
    }[];
    evidence: {
        id: number;
        itemId: any;
        evidenceType: any;
        title: any;
        description: any;
        fileName: any;
        externalUrl: any;
        uploadedAt: any;
    }[];
    meta: {
        status: any;
        subjectName: any;
        courseCode: any;
    };
};
