import type { AlumniAdminActor } from './service.js';
export declare function canAccessEngagement(actor: AlumniAdminActor): boolean;
export declare function canOperateEngagement(actor: AlumniAdminActor): boolean;
export declare function canApproveDepartmentCampaign(actor: AlumniAdminActor): boolean;
export declare function canApproveInstitutionalCampaign(actor: AlumniAdminActor): boolean;
export declare function canManageTemplates(actor: AlumniAdminActor): boolean;
export declare function canOverrideSuppression(actor: AlumniAdminActor): boolean;
export declare function canExportEngagement(actor: AlumniAdminActor): boolean;
export declare function isDepartmentScopedEngagement(actor: AlumniAdminActor): boolean;
export declare function approvalStepsForCampaign(opts: {
    scope: string;
    departmentId?: number | null;
}): ("INSTITUTIONAL" | "HOD_REVIEW" | "ALUMNI_TP_REVIEW")[];
