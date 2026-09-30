import type { Knex } from 'knex';
import { z } from 'zod';
import { db } from '../../db/index.js';
import { type WorkflowActor } from './types.js';
export declare const createDefinitionSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    entityType: z.ZodString;
    steps: z.ZodArray<z.ZodObject<{
        stepKey: z.ZodString;
        name: z.ZodString;
        allowedRoles: z.ZodArray<z.ZodString, "many">;
        isInitial: z.ZodOptional<z.ZodBoolean>;
        isTerminal: z.ZodOptional<z.ZodBoolean>;
        terminalStatus: z.ZodNullable<z.ZodOptional<z.ZodEnum<["APPROVED", "REJECTED", "CANCELLED"]>>>;
    }, "strict", z.ZodTypeAny, {
        name: string;
        stepKey: string;
        allowedRoles: string[];
        isInitial?: boolean | undefined;
        isTerminal?: boolean | undefined;
        terminalStatus?: "APPROVED" | "REJECTED" | "CANCELLED" | null | undefined;
    }, {
        name: string;
        stepKey: string;
        allowedRoles: string[];
        isInitial?: boolean | undefined;
        isTerminal?: boolean | undefined;
        terminalStatus?: "APPROVED" | "REJECTED" | "CANCELLED" | null | undefined;
    }>, "many">;
    transitions: z.ZodArray<z.ZodObject<{
        fromStepKey: z.ZodString;
        action: z.ZodEnum<["SUBMIT", "APPROVE", "REJECT", "RETURN", "CANCEL"]>;
        toStepKey: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        action: "RETURN" | "APPROVE" | "REJECT" | "SUBMIT" | "CANCEL";
        fromStepKey: string;
        toStepKey: string;
    }, {
        action: "RETURN" | "APPROVE" | "REJECT" | "SUBMIT" | "CANCEL";
        fromStepKey: string;
        toStepKey: string;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    code: string;
    name: string;
    entityType: string;
    steps: {
        name: string;
        stepKey: string;
        allowedRoles: string[];
        isInitial?: boolean | undefined;
        isTerminal?: boolean | undefined;
        terminalStatus?: "APPROVED" | "REJECTED" | "CANCELLED" | null | undefined;
    }[];
    transitions: {
        action: "RETURN" | "APPROVE" | "REJECT" | "SUBMIT" | "CANCEL";
        fromStepKey: string;
        toStepKey: string;
    }[];
}, {
    code: string;
    name: string;
    entityType: string;
    steps: {
        name: string;
        stepKey: string;
        allowedRoles: string[];
        isInitial?: boolean | undefined;
        isTerminal?: boolean | undefined;
        terminalStatus?: "APPROVED" | "REJECTED" | "CANCELLED" | null | undefined;
    }[];
    transitions: {
        action: "RETURN" | "APPROVE" | "REJECT" | "SUBMIT" | "CANCEL";
        fromStepKey: string;
        toStepKey: string;
    }[];
}>;
export declare const startInstanceSchema: z.ZodObject<{
    definitionCode: z.ZodString;
    entityType: z.ZodString;
    entityId: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    entityType: string;
    entityId: number;
    definitionCode: string;
}, {
    entityType: string;
    entityId: number;
    definitionCode: string;
}>;
export declare const actionSchema: z.ZodObject<{
    action: z.ZodEnum<["SUBMIT", "APPROVE", "REJECT", "RETURN", "CANCEL"]>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    action: "RETURN" | "APPROVE" | "REJECT" | "SUBMIT" | "CANCEL";
    remarks?: string | null | undefined;
}, {
    action: "RETURN" | "APPROVE" | "REJECT" | "SUBMIT" | "CANCEL";
    remarks?: string | null | undefined;
}>;
export declare function createDefinition(actor: WorkflowActor, input: z.infer<typeof createDefinitionSchema>): Promise<{
    steps: {
        [k: string]: unknown;
    }[];
    transitions: {
        [k: string]: unknown;
    }[];
}>;
export declare function getDefinition(actor: WorkflowActor, definitionId: number, trx?: Knex.Transaction | typeof db): Promise<{
    steps: {
        [k: string]: unknown;
    }[];
    transitions: {
        [k: string]: unknown;
    }[];
}>;
export declare function listDefinitions(actor: WorkflowActor): Promise<{
    [k: string]: unknown;
}[]>;
export declare function publishDefinition(actor: WorkflowActor, definitionId: number): Promise<{
    steps: {
        [k: string]: unknown;
    }[];
    transitions: {
        [k: string]: unknown;
    }[];
}>;
export declare function startInstance(actor: WorkflowActor, input: z.infer<typeof startInstanceSchema>): Promise<{
    history: {
        [k: string]: unknown;
    }[];
}>;
export declare function performAction(actor: WorkflowActor, instanceId: number, input: z.infer<typeof actionSchema>): Promise<{
    history: {
        [k: string]: unknown;
    }[];
}>;
export declare function getInstance(actor: WorkflowActor, instanceId: number, trx?: Knex.Transaction | typeof db): Promise<{
    history: {
        [k: string]: unknown;
    }[];
}>;
export declare function listInstances(actor: WorkflowActor, filters?: {
    entityType?: string;
    status?: string;
}): Promise<{
    [k: string]: unknown;
}[]>;
