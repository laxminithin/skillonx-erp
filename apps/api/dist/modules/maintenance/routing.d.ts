/**
 * Deterministic, explainable auto-routing. NO AI.
 *
 * Order of resolution:
 *   1. Active routing rules, ascending by `priority` (lower first). A rule
 *      matches when EVERY non-null predicate (category / source module /
 *      building / department) equals the ticket's value. First match wins.
 *   2. The ticket category's configured default team.
 *   3. The college Triage team (never SUPER_ADMIN).
 *
 * Every result carries a human-readable explanation stored on the ticket.
 */
export type RouteResult = {
    teamId: number | null;
    explanation: string;
    triaged: boolean;
};
export declare function resolveRoute(input: {
    collegeId: number;
    categoryId: number | null;
    categoryName?: string | null;
    sourceModule: string;
    building: string | null;
    departmentId: number | null;
}): Promise<RouteResult>;
