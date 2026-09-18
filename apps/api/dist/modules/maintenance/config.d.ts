import type { MaintActor } from './types.js';
/**
 * Idempotently ensure a college has the baseline teams, categories and routing
 * rules. Safe to call before any ticket create / config read. Never destructive.
 */
export declare function ensureMaintenanceConfig(collegeId: number): Promise<void>;
export declare function listCategories(actor: MaintActor, opts?: {
    activeOnly?: boolean;
}): Promise<{
    id: number;
    code: unknown;
    name: unknown;
    kind: unknown;
    defaultTeamId: number | null;
    defaultTeamName: string;
    defaultPriority: unknown;
    ackSlaMins: number | null;
    resolveSlaMins: number | null;
    isActive: boolean;
    sortOrder: number;
    description: {} | null;
}[]>;
export declare function createCategory(actor: MaintActor, input: Record<string, unknown>): Promise<{
    id: number;
    code: unknown;
    name: unknown;
    kind: unknown;
    defaultTeamId: number | null;
    defaultTeamName: string;
    defaultPriority: unknown;
    ackSlaMins: number | null;
    resolveSlaMins: number | null;
    isActive: boolean;
    sortOrder: number;
    description: {} | null;
}>;
export declare function updateCategory(actor: MaintActor, id: number, input: Record<string, unknown>): Promise<{
    id: number;
    code: unknown;
    name: unknown;
    kind: unknown;
    defaultTeamId: number | null;
    defaultTeamName: string;
    defaultPriority: unknown;
    ackSlaMins: number | null;
    resolveSlaMins: number | null;
    isActive: boolean;
    sortOrder: number;
    description: {} | null;
}>;
export declare function listTeams(actor: MaintActor, opts?: {
    activeOnly?: boolean;
}): Promise<{
    id: number;
    code: any;
    name: any;
    kind: any;
    isTriage: boolean;
    status: any;
    description: any;
    members: {
        id: number;
        facultyId: number;
        name: string;
        role: string;
        isLead: boolean;
    }[];
}[]>;
export declare function createTeam(actor: MaintActor, input: Record<string, unknown>): Promise<{
    id: number;
    code: any;
    name: any;
    kind: any;
    isTriage: boolean;
    status: any;
    description: any;
    members: {
        id: number;
        facultyId: number;
        name: string;
        role: string;
        isLead: boolean;
    }[];
} | undefined>;
export declare function updateTeam(actor: MaintActor, id: number, input: Record<string, unknown>): Promise<{
    id: number;
    code: any;
    name: any;
    kind: any;
    isTriage: boolean;
    status: any;
    description: any;
    members: {
        id: number;
        facultyId: number;
        name: string;
        role: string;
        isLead: boolean;
    }[];
} | undefined>;
export declare function listRoutingRules(actor: MaintActor): Promise<{
    id: number;
    name: any;
    priority: number;
    matchCategoryId: number | null;
    matchCategoryName: string;
    matchSourceModule: any;
    matchBuilding: any;
    matchDepartmentId: number | null;
    targetTeamId: number;
    targetTeamName: string;
    isActive: boolean;
    explanation: any;
}[]>;
export declare function createRoutingRule(actor: MaintActor, input: Record<string, unknown>): Promise<{
    id: number;
    name: any;
    priority: number;
    matchCategoryId: number | null;
    matchCategoryName: string;
    matchSourceModule: any;
    matchBuilding: any;
    matchDepartmentId: number | null;
    targetTeamId: number;
    targetTeamName: string;
    isActive: boolean;
    explanation: any;
} | undefined>;
export declare function updateRoutingRule(actor: MaintActor, id: number, input: Record<string, unknown>): Promise<{
    id: number;
    name: any;
    priority: number;
    matchCategoryId: number | null;
    matchCategoryName: string;
    matchSourceModule: any;
    matchBuilding: any;
    matchDepartmentId: number | null;
    targetTeamId: number;
    targetTeamName: string;
    isActive: boolean;
    explanation: any;
} | undefined>;
export declare function deleteRoutingRule(actor: MaintActor, id: number): Promise<{
    ok: boolean;
}>;
