export declare function getPlacementPolicy(collegeId: number): Promise<{
    minProfileCompletion: number;
    allowMultipleOffers: boolean;
    offerPolicy: any;
    allowWithdrawAfterApply: boolean;
    placementRegistrationRequired: boolean;
    resumeRequired: boolean;
    blockAfterOfferAcceptance: boolean;
    dataConsentRequired: boolean;
    recruiterPortalEnabled: boolean;
    recruiterShareFields: any;
}>;
export declare function listSeasons(collegeId: number): Promise<any[]>;
export declare function getActiveSeason(collegeId: number): Promise<any>;
