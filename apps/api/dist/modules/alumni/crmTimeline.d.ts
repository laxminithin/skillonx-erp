import type { AlumniAdminActor, AlumniActor } from './service.js';
import type { TimelineItem } from './typesCrm.js';
export declare function getTimelineForAdmin(actor: AlumniAdminActor, alumniProfileId: number): Promise<{
    timeline: TimelineItem[];
    meta: {
        projectedSources: string[];
        note: string;
    };
}>;
export declare function getTimelineForSelf(actor: AlumniActor): Promise<{
    timeline: TimelineItem[];
}>;
