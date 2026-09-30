import type { ExamActor } from './access.js';
import { type ExaminationCapabilityKey, type ExaminationCapabilityOwnership, type ExaminationGovernanceType } from './types.js';
export type CapabilityDefinition = {
    capabilityKey: ExaminationCapabilityKey;
    name: string;
    common: boolean;
    mandatory: boolean;
    requiresApproval: boolean;
    requiresFreeze: boolean;
    supportsAudit: boolean;
    supportsEvidence: boolean;
    sourceOfTruth: Record<ExaminationGovernanceType, string>;
    ownership: Record<ExaminationGovernanceType, ExaminationCapabilityOwnership>;
};
export declare const EXAMINATION_CAPABILITIES: CapabilityDefinition[];
export declare function governanceForCollege(collegeId: number): Promise<ExaminationGovernanceType>;
export declare function capabilityMatrix(collegeId: number): Promise<{
    governanceType: "VTU_AFFILIATED" | "AUTONOMOUS";
    capabilities: {
        capabilityKey: ExaminationCapabilityKey;
        name: string;
        governanceType: "VTU_AFFILIATED" | "AUTONOMOUS";
        ownership: "UNIVERSITY" | "SHARED" | "INSTITUTIONAL" | "OPTIONAL";
        enabled: boolean;
        mandatory: boolean;
        sourceOfTruth: string;
        requiresApproval: boolean;
        requiresFreeze: boolean;
        supportsAudit: boolean;
        supportsEvidence: boolean;
    }[];
}>;
export declare function assertInstitutionOwnsCapability(actor: ExamActor, capabilityKey: ExaminationCapabilityKey): Promise<{
    governanceType: "VTU_AFFILIATED" | "AUTONOMOUS";
    ownership: "SHARED" | "INSTITUTIONAL";
}>;
