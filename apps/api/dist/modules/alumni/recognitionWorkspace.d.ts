import type { AlumniAdminActor } from './service.js';
export declare function getRecognitionWorkspace(actor: AlumniAdminActor, query?: Record<string, unknown>): Promise<{
    view: string;
    views: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
} | {
    view: string;
    summary: {
        metrics: {
            pendingNominations: any;
            evidenceRequired: any;
            reviewDue: any;
            approvedRecognitions: number;
            upcomingPrograms: any;
            openValueOfferings: number;
            recentContributionSuggestions: number;
            reciprocityGuardrailCount: number;
        };
        programsByStatus: Record<string, number>;
        nominationsByStatus: Record<string, number>;
        pendingConsentSpotlights: number;
        activeCommunities: number;
        sourceOfTruth: {
            matrix: readonly [{
                readonly capability: "Career / employment / higher studies / entrepreneurship";
                readonly authoritative: "C1 alumni_* tables";
                readonly c6Role: "PROJECT";
                readonly notes: "Never re-store career facts";
            }, {
                readonly capability: "Self / institutional achievements ledger";
                readonly authoritative: "C1 alumni_achievements";
                readonly c6Role: "PROJECT + evidence ref";
                readonly notes: "C6 awards may project; do not fork achievement rows";
            }, {
                readonly capability: "Privacy / directory / contact visibility";
                readonly authoritative: "C1 alumni_profiles visibility cols";
                readonly c6Role: "ENFORCE";
                readonly notes: "Consent required for public spotlight";
            }, {
                readonly capability: "CRM outcomes / interactions / timeline";
                readonly authoritative: "C2 alumni_crm_*";
                readonly c6Role: "PROJECT + evidence";
                readonly notes: "Verified outcomes → eligibility assistance / suggestions";
            }, {
                readonly capability: "Intelligence dimensions / segments";
                readonly authoritative: "C3 computed + config";
                readonly c6Role: "ISOLATE";
                readonly notes: "Recognition must not auto-inflate capability";
            }, {
                readonly capability: "Engagement programs / campaigns / prefs";
                readonly authoritative: "C4";
                readonly c6Role: "HANDOFF";
                readonly notes: "C4 remains campaign authority; C6 consumes noms";
            }, {
                readonly capability: "Recognition nomination handoff";
                readonly authoritative: "C4 alumni_engagement_recognition_noms";
                readonly c6Role: "CONSUME → C6 nomination";
                readonly notes: "Mark C4 RECORDED when ingested/awarded";
            }, {
                readonly capability: "Value-exchange program classification";
                readonly authoritative: "C4 engagement programs";
                readonly c6Role: "PROJECT";
                readonly notes: "C6 owns alumni-facing value offerings catalogue";
            }, {
                readonly capability: "Connect needs / fulfilment";
                readonly authoritative: "C5";
                readonly c6Role: "PROJECT + evidence";
                readonly notes: "Verified fulfilment → recognition eligibility";
            }, {
                readonly capability: "Finance receipts / contributions";
                readonly authoritative: "Finance fee_receipts + alumni_contributions";
                readonly c6Role: "PROJECT only";
                readonly notes: "No donor/wealth ranking";
            }, {
                readonly capability: "Event attendance";
                readonly authoritative: "alumni_events / registrations";
                readonly c6Role: "PROJECT";
                readonly notes: "Do not duplicate attendance";
            }, {
                readonly capability: "Institutional recognition awards";
                readonly authoritative: "C6 alumni_recognition_records";
                readonly c6Role: "OWN";
                readonly notes: "Human issuance + immutable log";
            }, {
                readonly capability: "Nominations / evidence / review";
                readonly authoritative: "C6";
                readonly c6Role: "OWN";
                readonly notes: "Nomination ≠ award";
            }, {
                readonly capability: "Spotlight publication";
                readonly authoritative: "C6 alumni_spotlights";
                readonly c6Role: "OWN";
                readonly notes: "Explicit consent gate";
            }, {
                readonly capability: "Value offerings & participation";
                readonly authoritative: "C6";
                readonly c6Role: "OWN";
                readonly notes: "No VIEWED without telemetry";
            }, {
                readonly capability: "Communities / chapters / connections";
                readonly authoritative: "C6";
                readonly c6Role: "OWN";
                readonly notes: "No social feed; no inferred membership";
            }, {
                readonly capability: "Student certificates / faculty awards";
                readonly authoritative: "Student Services / Faculty Profile";
                readonly c6Role: "PATTERN only";
                readonly notes: "Separate alumni certificate table";
            }, {
                readonly capability: "Website / CMS / LinkedIn scrape";
                readonly authoritative: "NONE";
                readonly c6Role: "OUT_OF_SCOPE";
                readonly notes: "Zero fabrication";
            }];
            categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
            note: string;
        };
        note: string;
    };
    views: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
} | {
    programs: any;
    view: string;
    views: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
} | {
    nominations: any;
    view: string;
    views: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
} | {
    recognitions: {
        id: number;
        title: any;
        category: any;
        status: any;
        alumniProfileId: number;
        alumniName: any;
        awardDate: any;
        academicYear: any;
    }[];
    view: string;
    views: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
} | {
    spotlights: {
        id: number;
        headline: any;
        publicationStatus: any;
        publicationConsent: boolean;
        alumniProfileId: number;
        alumniName: any;
        publishAt: any;
    }[];
    view: string;
    views: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
} | {
    offerings: {
        id: number;
        title: any;
        category: any;
        status: any;
        capacity: number | null;
        registeredCount: number;
        startDate: any;
        registrationDeadline: any;
    }[];
    view: string;
    views: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
} | {
    communities: {
        id: number;
        name: any;
        type: any;
        status: any;
        city: any;
        batchYear: any;
        departmentId: number | null;
    }[];
    view: string;
    views: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
} | {
    suggestions: {
        id: number;
        suggestionType: any;
        title: any;
        category: any;
        status: any;
        alumniProfileId: number;
        alumniName: any;
        rationale: any;
    }[];
    view: string;
    views: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
} | {
    reciprocityReminders: {
        alumniProfileId: number;
        alumniName: any;
        guardrail: {
            triggered: boolean;
            message: string | null;
        } | undefined;
    }[];
    note: string;
    view: string;
    views: readonly ["OVERVIEW", "PROGRAMS", "NOMINATIONS", "REVIEW_QUEUE", "RECOGNITIONS", "SPOTLIGHTS", "VALUE_OFFERINGS", "COMMUNITIES", "RECIPROCITY", "SUGGESTIONS"];
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
}>;
export declare function getRecognitionAnalytics(actor: AlumniAdminActor): Promise<{
    pendingNominations: any;
    evidenceRequired: any;
    reviewDue: any;
    approvedRecognitions: number;
    upcomingPrograms: any;
    openValueOfferings: number;
    recentContributionSuggestions: number;
    reciprocityGuardrailCount: number;
}>;
/**
 * C6.29 — operational management summary only (not institutional impact / C7).
 */
export declare function getManagementSummary(actor: AlumniAdminActor): Promise<{
    metrics: {
        pendingNominations: any;
        evidenceRequired: any;
        reviewDue: any;
        approvedRecognitions: number;
        upcomingPrograms: any;
        openValueOfferings: number;
        recentContributionSuggestions: number;
        reciprocityGuardrailCount: number;
    };
    programsByStatus: Record<string, number>;
    nominationsByStatus: Record<string, number>;
    pendingConsentSpotlights: number;
    activeCommunities: number;
    sourceOfTruth: {
        matrix: readonly [{
            readonly capability: "Career / employment / higher studies / entrepreneurship";
            readonly authoritative: "C1 alumni_* tables";
            readonly c6Role: "PROJECT";
            readonly notes: "Never re-store career facts";
        }, {
            readonly capability: "Self / institutional achievements ledger";
            readonly authoritative: "C1 alumni_achievements";
            readonly c6Role: "PROJECT + evidence ref";
            readonly notes: "C6 awards may project; do not fork achievement rows";
        }, {
            readonly capability: "Privacy / directory / contact visibility";
            readonly authoritative: "C1 alumni_profiles visibility cols";
            readonly c6Role: "ENFORCE";
            readonly notes: "Consent required for public spotlight";
        }, {
            readonly capability: "CRM outcomes / interactions / timeline";
            readonly authoritative: "C2 alumni_crm_*";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified outcomes → eligibility assistance / suggestions";
        }, {
            readonly capability: "Intelligence dimensions / segments";
            readonly authoritative: "C3 computed + config";
            readonly c6Role: "ISOLATE";
            readonly notes: "Recognition must not auto-inflate capability";
        }, {
            readonly capability: "Engagement programs / campaigns / prefs";
            readonly authoritative: "C4";
            readonly c6Role: "HANDOFF";
            readonly notes: "C4 remains campaign authority; C6 consumes noms";
        }, {
            readonly capability: "Recognition nomination handoff";
            readonly authoritative: "C4 alumni_engagement_recognition_noms";
            readonly c6Role: "CONSUME → C6 nomination";
            readonly notes: "Mark C4 RECORDED when ingested/awarded";
        }, {
            readonly capability: "Value-exchange program classification";
            readonly authoritative: "C4 engagement programs";
            readonly c6Role: "PROJECT";
            readonly notes: "C6 owns alumni-facing value offerings catalogue";
        }, {
            readonly capability: "Connect needs / fulfilment";
            readonly authoritative: "C5";
            readonly c6Role: "PROJECT + evidence";
            readonly notes: "Verified fulfilment → recognition eligibility";
        }, {
            readonly capability: "Finance receipts / contributions";
            readonly authoritative: "Finance fee_receipts + alumni_contributions";
            readonly c6Role: "PROJECT only";
            readonly notes: "No donor/wealth ranking";
        }, {
            readonly capability: "Event attendance";
            readonly authoritative: "alumni_events / registrations";
            readonly c6Role: "PROJECT";
            readonly notes: "Do not duplicate attendance";
        }, {
            readonly capability: "Institutional recognition awards";
            readonly authoritative: "C6 alumni_recognition_records";
            readonly c6Role: "OWN";
            readonly notes: "Human issuance + immutable log";
        }, {
            readonly capability: "Nominations / evidence / review";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "Nomination ≠ award";
        }, {
            readonly capability: "Spotlight publication";
            readonly authoritative: "C6 alumni_spotlights";
            readonly c6Role: "OWN";
            readonly notes: "Explicit consent gate";
        }, {
            readonly capability: "Value offerings & participation";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No VIEWED without telemetry";
        }, {
            readonly capability: "Communities / chapters / connections";
            readonly authoritative: "C6";
            readonly c6Role: "OWN";
            readonly notes: "No social feed; no inferred membership";
        }, {
            readonly capability: "Student certificates / faculty awards";
            readonly authoritative: "Student Services / Faculty Profile";
            readonly c6Role: "PATTERN only";
            readonly notes: "Separate alumni certificate table";
        }, {
            readonly capability: "Website / CMS / LinkedIn scrape";
            readonly authoritative: "NONE";
            readonly c6Role: "OUT_OF_SCOPE";
            readonly notes: "Zero fabrication";
        }];
        categories: readonly ["PROFESSIONAL_ACHIEVEMENT", "ENTREPRENEURSHIP", "RESEARCH_INNOVATION", "PUBLICATION", "PATENT_IP", "LEADERSHIP", "SOCIAL_IMPACT", "ACADEMIC_ACHIEVEMENT", "HIGHER_EDUCATION", "INDUSTRY_ACHIEVEMENT", "MENTORSHIP_CONTRIBUTION", "RECRUITMENT_CONTRIBUTION", "INTERNSHIP_SUPPORT", "EXPERT_CONTRIBUTION", "PROJECT_SUPPORT", "RESEARCH_COLLABORATION", "STARTUP_SUPPORT", "INSTITUTIONAL_SERVICE", "COMMUNITY_SERVICE", "DISTINGUISHED_ALUMNUS", "YOUNG_ACHIEVER", "OTHER"];
        note: string;
    };
    note: string;
}>;
