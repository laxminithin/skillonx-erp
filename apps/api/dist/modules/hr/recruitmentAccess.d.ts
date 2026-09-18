import type { HrActor, HrPermission } from './types.js';
import type { Row } from './recruitmentTypes.js';
export declare function asYmd(value: unknown): string;
export declare function normalizeEmail(email: string): string;
export declare function normalizePhone(phone: string | null | undefined): string | null;
export declare function hashCandidateToken(raw: string): string;
export declare function generateCandidateToken(): {
    raw: string;
    hash: string;
};
export declare function assertRecruitmentTransition(kind: 'REQUISITION' | 'OPENING' | 'APPLICATION' | 'OFFER', from: string, to: string, allowed: string[]): void;
export declare function hodDepartmentIds(actor: HrActor): number[];
export declare function isHodActor(actor: HrActor): boolean;
export declare function canManageRecruitment(actor: HrActor): boolean;
export declare function assertDeptScope(actor: HrActor, departmentId: number | null | undefined, permission?: HrPermission): void;
export declare function redactSensitiveApplication(row: Row, actor: HrActor): Row;
export declare function redactSensitiveOffer(row: Row, actor: HrActor): Row;
export declare function assertInterviewerAccess(actor: HrActor, interviewId: number): Promise<any>;
export type CandidateAuth = {
    candidateId: number;
    collegeId: number;
    tokenId: number;
};
export declare function resolveCandidateToken(rawToken: string | null | undefined): Promise<CandidateAuth>;
export declare function assertCandidateOwns(auth: CandidateAuth, opts: {
    candidateId?: number;
    applicationId?: number;
}): Promise<void>;
export declare function ensureRecruitmentDefaults(collegeId: number): Promise<void>;
export declare function recruitmentSchemaReady(): Promise<boolean>;
