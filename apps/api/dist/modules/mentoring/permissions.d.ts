import type { LeadershipContext } from '../academicLeadership/types.js';
import type { MentoringActor } from './types.js';
export declare function canAdministerAllocation(actor: MentoringActor): boolean;
export declare function assertAllocationPermission(actor: MentoringActor): void;
/** Whether the acting faculty is the ACTIVE mentor of the given student. */
export declare function isMentorOf(actor: MentoringActor, studentId: number): Promise<boolean>;
/**
 * Guard for mentor-scoped operations. A faculty member may only act on their
 * own assigned mentees. Admins are permitted for support/administration but are
 * NOT the routine mentoring operator.
 */
export declare function assertMentorOf(actor: MentoringActor, studentId: number): Promise<void>;
/** Resolve leadership context (HOD department scope, Principal, Management). */
export declare function leadershipContext(actor: MentoringActor): Promise<LeadershipContext>;
export declare function assertHodOrAbove(ctx: LeadershipContext, actor: MentoringActor): void;
export declare function assertPrincipalOrAbove(ctx: LeadershipContext, actor: MentoringActor): void;
export declare function assertManagement(actor: MentoringActor): void;
/**
 * Confidentiality resolver. Decides whether the given viewer may see the
 * private (mentor-only) narrative of a session/interaction, based on its
 * visibility level. Confidential narratives never surface to leadership merely
 * by hierarchy — HOD/Principal see MENTORING_TEAM records but not CONFIDENTIAL.
 */
export type ViewerKind = 'MENTOR' | 'MENTORING_TEAM' | 'STUDENT' | 'AGGREGATE';
export declare function canSeePrivateNarrative(viewer: ViewerKind, visibility: string): boolean;
