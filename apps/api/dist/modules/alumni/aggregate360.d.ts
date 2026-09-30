import type { AlumniActor, AlumniAdminActor } from './service.js';
export type ViewerMode = 'self' | 'admin' | 'network';
export declare function getAlumni360(opts: {
    collegeId: number;
    profileId: number;
    viewer: ViewerMode;
    actorAlumniId?: number;
    actorFacultyId?: number;
    actorRole?: string;
    actorDepartmentId?: number | null;
}): Promise<{
    identity: {
        alumniId: number;
        studentId: number;
        name: any;
        usn: any;
        email: any;
        phone: any;
        communicationPreferences: {
            email: boolean;
            sms: boolean;
            phone: boolean;
            whatsapp: boolean;
        } | undefined;
        currentLocation: string | null;
        currentCity: any;
        currentCountry: any;
        profilePhotoUrl: any;
        verificationStatus: any;
        lifecycleState: any;
        headline: any;
    };
    academic: {
        institution: any;
        institutionCode: any;
        department: any;
        departmentCode: any;
        programme: any;
        programmeCode: any;
        batch: any;
        admissionYear: any;
        graduationYear: any;
        provenance: {
            sourceType: string;
            verificationStatus: string;
            note: string;
        };
    };
    career: {
        current: {
            id: number;
            organization: any;
            designation: any;
            industry: any;
            functionalArea: any;
            seniority: any;
            location: any;
            startDate: any;
            endDate: any;
            isCurrent: boolean;
            employmentType: any;
            description: any;
            verificationStatus: any;
            sourceType: any;
            sourceReference: any;
            capturedAt: string | null;
            lastVerifiedAt: string | null;
            confidence: number | null;
            evidenceReference: any;
        } | null;
        timeline: {
            id: number;
            organization: any;
            designation: any;
            industry: any;
            functionalArea: any;
            seniority: any;
            location: any;
            startDate: any;
            endDate: any;
            isCurrent: boolean;
            employmentType: any;
            description: any;
            verificationStatus: any;
            sourceType: any;
            sourceReference: any;
            capturedAt: string | null;
            lastVerifiedAt: string | null;
            confidence: number | null;
            evidenceReference: any;
        }[];
        tpmsProjection: {
            placementOffers: any[];
            studentExperiences: any[];
            note: string;
        } | null;
    };
    higherEducation: any[];
    skillsExpertise: {
        skills: string[];
        technologies: string[];
        domains: string[];
        industryExpertise: string[];
        researchExpertise: string[];
        certifications: string[];
    };
    achievements: {
        records: any[];
        entrepreneurship: any[];
    };
    interestsAvailability: {
        willingness: {
            confirmedAt: string | null;
            /** Explicit only — null means not expressed (never inferred). */
            note: string;
        };
        capabilities: {
            id: number;
            domain: any;
            details: {};
            isActive: boolean;
            sourceType: any;
            verificationStatus: any;
            confirmedAt: string | null;
        }[];
        legacy: {
            networkingAvailable: boolean;
            mentorshipAvailable: boolean;
            mentorshipAreas: string[];
            interests: string[];
        };
    };
    institutionalRelationship: {
        lastInstitutionalInteraction: string | null;
        eventsAttended: number;
        mentoringInteractions: number;
        studentsMentored: number;
        recruitmentInteractions: number;
        internshipsEnabled: number;
        placementsSupported: number;
        expertSessions: number;
        projectsSupported: number;
        contributions: number;
        recognitionReceived: number;
        sources: {
            metric: string;
            source: string;
            count: number;
            lastAt: string | null;
        }[];
    };
    crm: unknown;
    intelligence: unknown;
    engagement: unknown;
    matching: unknown;
    recognition: unknown;
    privacy: {
        email: any;
        phone: any;
        biography: any;
        employment: any;
        social: any;
        networking: any;
        directoryVisible: boolean;
        connectionVisible: boolean;
        professionalDataVisible: boolean;
        layers: {
            INSTITUTIONAL_INTERNAL: true;
            DIRECTORY_VISIBLE: boolean;
            ALUMNI_CONNECTION: boolean;
            COMMUNICATION: true;
            OPTIONAL_PROFESSIONAL: boolean;
        };
    } | undefined;
    dataQuality: {
        completeness: {
            coveragePercent: number;
            sections: {
                key: string;
                label: string;
                status: import("./types360.js").CompletenessState;
                messages: string[];
            }[];
            computedAt: string;
        };
        freshness: import("./freshness.js").DomainFreshness[];
        attentionRequired: {
            domain: string;
            state: "UNVERIFIED" | "STALE" | "VERIFIED_RECENTLY" | "NEEDS_CONFIRMATION";
            message: string;
        }[];
        provenance: {
            id: number;
            entityType: any;
            entityId: number | null;
            fieldName: any;
            sourceType: import("./types360.js").SourceType;
            sourceReference: any;
            capturedAt: string | null;
            updatedAt: string | null;
            lastVerifiedAt: string | null;
            verificationStatus: import("./types360.js").VerificationStatus;
            verifiedBy: number | null;
            confidence: number | null;
            evidenceReference: any;
            valueSnapshot: any;
            displayAsFact: boolean;
        }[] | undefined;
    };
    biography: any;
    contributions: {
        id: number;
        purpose: any;
        amount: any;
        status: any;
        financeReceiptId: number | null;
        financeReceiptNumber: any;
        financeReceiptAmount: any;
        note: any;
        createdAt: any;
        provenance: {
            sourceType: string;
            verificationStatus: string;
        };
    }[] | undefined;
    meta: {
        viewer: ViewerMode;
        generatedAt: string;
        aggregate: boolean;
    };
}>;
export declare function getAlumni360ForSelf(actor: AlumniActor): Promise<{
    identity: {
        alumniId: number;
        studentId: number;
        name: any;
        usn: any;
        email: any;
        phone: any;
        communicationPreferences: {
            email: boolean;
            sms: boolean;
            phone: boolean;
            whatsapp: boolean;
        } | undefined;
        currentLocation: string | null;
        currentCity: any;
        currentCountry: any;
        profilePhotoUrl: any;
        verificationStatus: any;
        lifecycleState: any;
        headline: any;
    };
    academic: {
        institution: any;
        institutionCode: any;
        department: any;
        departmentCode: any;
        programme: any;
        programmeCode: any;
        batch: any;
        admissionYear: any;
        graduationYear: any;
        provenance: {
            sourceType: string;
            verificationStatus: string;
            note: string;
        };
    };
    career: {
        current: {
            id: number;
            organization: any;
            designation: any;
            industry: any;
            functionalArea: any;
            seniority: any;
            location: any;
            startDate: any;
            endDate: any;
            isCurrent: boolean;
            employmentType: any;
            description: any;
            verificationStatus: any;
            sourceType: any;
            sourceReference: any;
            capturedAt: string | null;
            lastVerifiedAt: string | null;
            confidence: number | null;
            evidenceReference: any;
        } | null;
        timeline: {
            id: number;
            organization: any;
            designation: any;
            industry: any;
            functionalArea: any;
            seniority: any;
            location: any;
            startDate: any;
            endDate: any;
            isCurrent: boolean;
            employmentType: any;
            description: any;
            verificationStatus: any;
            sourceType: any;
            sourceReference: any;
            capturedAt: string | null;
            lastVerifiedAt: string | null;
            confidence: number | null;
            evidenceReference: any;
        }[];
        tpmsProjection: {
            placementOffers: any[];
            studentExperiences: any[];
            note: string;
        } | null;
    };
    higherEducation: any[];
    skillsExpertise: {
        skills: string[];
        technologies: string[];
        domains: string[];
        industryExpertise: string[];
        researchExpertise: string[];
        certifications: string[];
    };
    achievements: {
        records: any[];
        entrepreneurship: any[];
    };
    interestsAvailability: {
        willingness: {
            confirmedAt: string | null;
            /** Explicit only — null means not expressed (never inferred). */
            note: string;
        };
        capabilities: {
            id: number;
            domain: any;
            details: {};
            isActive: boolean;
            sourceType: any;
            verificationStatus: any;
            confirmedAt: string | null;
        }[];
        legacy: {
            networkingAvailable: boolean;
            mentorshipAvailable: boolean;
            mentorshipAreas: string[];
            interests: string[];
        };
    };
    institutionalRelationship: {
        lastInstitutionalInteraction: string | null;
        eventsAttended: number;
        mentoringInteractions: number;
        studentsMentored: number;
        recruitmentInteractions: number;
        internshipsEnabled: number;
        placementsSupported: number;
        expertSessions: number;
        projectsSupported: number;
        contributions: number;
        recognitionReceived: number;
        sources: {
            metric: string;
            source: string;
            count: number;
            lastAt: string | null;
        }[];
    };
    crm: unknown;
    intelligence: unknown;
    engagement: unknown;
    matching: unknown;
    recognition: unknown;
    privacy: {
        email: any;
        phone: any;
        biography: any;
        employment: any;
        social: any;
        networking: any;
        directoryVisible: boolean;
        connectionVisible: boolean;
        professionalDataVisible: boolean;
        layers: {
            INSTITUTIONAL_INTERNAL: true;
            DIRECTORY_VISIBLE: boolean;
            ALUMNI_CONNECTION: boolean;
            COMMUNICATION: true;
            OPTIONAL_PROFESSIONAL: boolean;
        };
    } | undefined;
    dataQuality: {
        completeness: {
            coveragePercent: number;
            sections: {
                key: string;
                label: string;
                status: import("./types360.js").CompletenessState;
                messages: string[];
            }[];
            computedAt: string;
        };
        freshness: import("./freshness.js").DomainFreshness[];
        attentionRequired: {
            domain: string;
            state: "UNVERIFIED" | "STALE" | "VERIFIED_RECENTLY" | "NEEDS_CONFIRMATION";
            message: string;
        }[];
        provenance: {
            id: number;
            entityType: any;
            entityId: number | null;
            fieldName: any;
            sourceType: import("./types360.js").SourceType;
            sourceReference: any;
            capturedAt: string | null;
            updatedAt: string | null;
            lastVerifiedAt: string | null;
            verificationStatus: import("./types360.js").VerificationStatus;
            verifiedBy: number | null;
            confidence: number | null;
            evidenceReference: any;
            valueSnapshot: any;
            displayAsFact: boolean;
        }[] | undefined;
    };
    biography: any;
    contributions: {
        id: number;
        purpose: any;
        amount: any;
        status: any;
        financeReceiptId: number | null;
        financeReceiptNumber: any;
        financeReceiptAmount: any;
        note: any;
        createdAt: any;
        provenance: {
            sourceType: string;
            verificationStatus: string;
        };
    }[] | undefined;
    meta: {
        viewer: ViewerMode;
        generatedAt: string;
        aggregate: boolean;
    };
}>;
export declare function getAlumni360ForAdmin(actor: AlumniAdminActor, profileId: number): Promise<{
    identity: {
        alumniId: number;
        studentId: number;
        name: any;
        usn: any;
        email: any;
        phone: any;
        communicationPreferences: {
            email: boolean;
            sms: boolean;
            phone: boolean;
            whatsapp: boolean;
        } | undefined;
        currentLocation: string | null;
        currentCity: any;
        currentCountry: any;
        profilePhotoUrl: any;
        verificationStatus: any;
        lifecycleState: any;
        headline: any;
    };
    academic: {
        institution: any;
        institutionCode: any;
        department: any;
        departmentCode: any;
        programme: any;
        programmeCode: any;
        batch: any;
        admissionYear: any;
        graduationYear: any;
        provenance: {
            sourceType: string;
            verificationStatus: string;
            note: string;
        };
    };
    career: {
        current: {
            id: number;
            organization: any;
            designation: any;
            industry: any;
            functionalArea: any;
            seniority: any;
            location: any;
            startDate: any;
            endDate: any;
            isCurrent: boolean;
            employmentType: any;
            description: any;
            verificationStatus: any;
            sourceType: any;
            sourceReference: any;
            capturedAt: string | null;
            lastVerifiedAt: string | null;
            confidence: number | null;
            evidenceReference: any;
        } | null;
        timeline: {
            id: number;
            organization: any;
            designation: any;
            industry: any;
            functionalArea: any;
            seniority: any;
            location: any;
            startDate: any;
            endDate: any;
            isCurrent: boolean;
            employmentType: any;
            description: any;
            verificationStatus: any;
            sourceType: any;
            sourceReference: any;
            capturedAt: string | null;
            lastVerifiedAt: string | null;
            confidence: number | null;
            evidenceReference: any;
        }[];
        tpmsProjection: {
            placementOffers: any[];
            studentExperiences: any[];
            note: string;
        } | null;
    };
    higherEducation: any[];
    skillsExpertise: {
        skills: string[];
        technologies: string[];
        domains: string[];
        industryExpertise: string[];
        researchExpertise: string[];
        certifications: string[];
    };
    achievements: {
        records: any[];
        entrepreneurship: any[];
    };
    interestsAvailability: {
        willingness: {
            confirmedAt: string | null;
            /** Explicit only — null means not expressed (never inferred). */
            note: string;
        };
        capabilities: {
            id: number;
            domain: any;
            details: {};
            isActive: boolean;
            sourceType: any;
            verificationStatus: any;
            confirmedAt: string | null;
        }[];
        legacy: {
            networkingAvailable: boolean;
            mentorshipAvailable: boolean;
            mentorshipAreas: string[];
            interests: string[];
        };
    };
    institutionalRelationship: {
        lastInstitutionalInteraction: string | null;
        eventsAttended: number;
        mentoringInteractions: number;
        studentsMentored: number;
        recruitmentInteractions: number;
        internshipsEnabled: number;
        placementsSupported: number;
        expertSessions: number;
        projectsSupported: number;
        contributions: number;
        recognitionReceived: number;
        sources: {
            metric: string;
            source: string;
            count: number;
            lastAt: string | null;
        }[];
    };
    crm: unknown;
    intelligence: unknown;
    engagement: unknown;
    matching: unknown;
    recognition: unknown;
    privacy: {
        email: any;
        phone: any;
        biography: any;
        employment: any;
        social: any;
        networking: any;
        directoryVisible: boolean;
        connectionVisible: boolean;
        professionalDataVisible: boolean;
        layers: {
            INSTITUTIONAL_INTERNAL: true;
            DIRECTORY_VISIBLE: boolean;
            ALUMNI_CONNECTION: boolean;
            COMMUNICATION: true;
            OPTIONAL_PROFESSIONAL: boolean;
        };
    } | undefined;
    dataQuality: {
        completeness: {
            coveragePercent: number;
            sections: {
                key: string;
                label: string;
                status: import("./types360.js").CompletenessState;
                messages: string[];
            }[];
            computedAt: string;
        };
        freshness: import("./freshness.js").DomainFreshness[];
        attentionRequired: {
            domain: string;
            state: "UNVERIFIED" | "STALE" | "VERIFIED_RECENTLY" | "NEEDS_CONFIRMATION";
            message: string;
        }[];
        provenance: {
            id: number;
            entityType: any;
            entityId: number | null;
            fieldName: any;
            sourceType: import("./types360.js").SourceType;
            sourceReference: any;
            capturedAt: string | null;
            updatedAt: string | null;
            lastVerifiedAt: string | null;
            verificationStatus: import("./types360.js").VerificationStatus;
            verifiedBy: number | null;
            confidence: number | null;
            evidenceReference: any;
            valueSnapshot: any;
            displayAsFact: boolean;
        }[] | undefined;
    };
    biography: any;
    contributions: {
        id: number;
        purpose: any;
        amount: any;
        status: any;
        financeReceiptId: number | null;
        financeReceiptNumber: any;
        financeReceiptAmount: any;
        note: any;
        createdAt: any;
        provenance: {
            sourceType: string;
            verificationStatus: string;
        };
    }[] | undefined;
    meta: {
        viewer: ViewerMode;
        generatedAt: string;
        aggregate: boolean;
    };
}>;
