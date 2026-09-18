import ExcelJS from 'exceljs';
import type { HrActor } from '../types.js';
import { hasHrPermission } from './access.js';
export declare function developmentHistory(actor: HrActor, employeeId?: number): Promise<{
    employeeId: null;
    completions: never[];
    certificates: never[];
} | {
    employeeId: number;
    completions: any[];
    certificates: any[];
}>;
export declare function employeeOverview(actor: HrActor): Promise<{
    linked: boolean;
    developmentNeedsOpen?: undefined;
    programsInProgress?: undefined;
    completedThisYear?: undefined;
    certificates?: undefined;
    mandatoryDue?: undefined;
} | {
    linked: boolean;
    developmentNeedsOpen: number;
    programsInProgress: number;
    completedThisYear: number;
    certificates: number;
    mandatoryDue: number;
}>;
export declare function adminDashboard(actor: HrActor): Promise<{
    activePrograms: number;
    upcomingPrograms: number;
    employeesEnrolled: number;
    completions: number;
    certificatesIssued: number;
    developmentNeedsOpen: number;
    effectivenessReviewsPending: number;
    completionRate: number;
}>;
export declare function mandatoryCompliance(actor: HrActor): Promise<{
    programs: {
        programId: number;
        title: unknown;
        dueDate: unknown;
        assigned: number;
        completed: number;
        overdue: number;
        complianceRate: number;
    }[];
}>;
export declare function ldMetrics(actor: HrActor): Promise<{
    scope: string;
    trainingParticipants: number;
    trainingHours: number;
    completions: number;
    developmentNeedsClosed: number;
    note: string;
}>;
export declare function certificateExpiry(actor: HrActor, withinDays?: number): Promise<{
    certificates: {
        expiryStatus: string;
    }[];
}>;
export declare function exportReport(actor: HrActor, report: string, format: 'csv' | 'xlsx', programId?: number): Promise<{
    contentType: string;
    filename: string;
    body: string;
} | {
    contentType: string;
    filename: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
export { hasHrPermission };
