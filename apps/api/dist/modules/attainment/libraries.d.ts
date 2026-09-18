export type RootCauseDef = {
    code: string;
    category: 'CONCEPTUAL' | 'ASSESSMENT' | 'DELIVERY' | 'STUDENT' | 'RESOURCE' | 'OTHER';
    label: string;
    description: string;
};
export type ActionDef = {
    code: string;
    label: string;
    category: string;
    description: string;
    evidenceProfile: 'REMEDIAL' | 'WORKSHOP' | 'MINI_PROJECT' | 'TOOL' | 'SELF_LEARNING' | 'REASSESSMENT';
};
export type EvidenceTemplateDef = {
    actionProfile: ActionDef['evidenceProfile'];
    code: string;
    label: string;
    required: boolean;
    autoLinkSource?: string | null;
};
export declare const ROOT_CAUSES: RootCauseDef[];
export declare const ACTIONS: ActionDef[];
export declare const CAUSE_ACTION_LINKS: Array<{
    cause: string;
    actions: string[];
}>;
export declare const EVIDENCE_TEMPLATES: EvidenceTemplateDef[];
export declare const PO_ACTIONS: Array<{
    poCode: string;
    label: string;
    actionCodes: string[];
}>;
