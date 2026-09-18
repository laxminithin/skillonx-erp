import type { HrActor } from './types.js';
export declare function listSalaryComponents(actor: HrActor): Promise<{
    id: number;
    code: unknown;
    name: unknown;
    componentType: unknown;
    isStatutory: boolean;
    lopAffected: boolean;
    isProratable: boolean;
    isActive: boolean;
}[]>;
export declare function updateSalaryComponentFlags(actor: HrActor, componentId: number, patch: {
    lopAffected?: boolean;
    isProratable?: boolean;
    isActive?: boolean;
}): Promise<{
    id: number;
    code: unknown;
    name: unknown;
    componentType: unknown;
    isStatutory: boolean;
    lopAffected: boolean;
    isProratable: boolean;
    isActive: boolean;
} | undefined>;
export declare function listSalaryStructures(actor: HrActor): Promise<{
    id: number;
    code: unknown;
    name: unknown;
    isActive: boolean;
}[]>;
export declare function getSalaryStructure(actor: HrActor, structureId: number): Promise<{
    id: number;
    code: any;
    name: any;
    isActive: boolean;
    components: {
        id: number;
        componentId: number;
        code: unknown;
        name: unknown;
        componentType: unknown;
        calculationType: unknown;
        amount: number | null;
        percentage: number | null;
        percentageOfComponentId: number | null;
        lopAffected: boolean;
        isProratable: boolean;
    }[];
}>;
export declare function createSalaryStructure(actor: HrActor, input: {
    code: string;
    name: string;
    components: Array<{
        componentId: number;
        calculationType: string;
        amount?: number | null;
        percentage?: number | null;
        percentageOfComponentId?: number | null;
    }>;
}): Promise<{
    id: number;
    code: any;
    name: any;
    isActive: boolean;
    components: {
        id: number;
        componentId: number;
        code: unknown;
        name: unknown;
        componentType: unknown;
        calculationType: unknown;
        amount: number | null;
        percentage: number | null;
        percentageOfComponentId: number | null;
        lopAffected: boolean;
        isProratable: boolean;
    }[];
}>;
export declare function updateSalaryStructureComponents(actor: HrActor, structureId: number, components: Array<{
    componentId: number;
    calculationType: string;
    amount?: number | null;
    percentage?: number | null;
    percentageOfComponentId?: number | null;
}>): Promise<{
    id: number;
    code: any;
    name: any;
    isActive: boolean;
    components: {
        id: number;
        componentId: number;
        code: unknown;
        name: unknown;
        componentType: unknown;
        calculationType: unknown;
        amount: number | null;
        percentage: number | null;
        percentageOfComponentId: number | null;
        lopAffected: boolean;
        isProratable: boolean;
    }[];
}>;
export declare function listEmployeeSalaryAssignments(actor: HrActor, employeeId: number): Promise<{
    id: number;
    structureId: number;
    structureCode: unknown;
    structureName: unknown;
    effectiveFrom: unknown;
    effectiveTo: unknown;
    isActive: boolean;
}[]>;
/**
 * Assign or revise salary structure with effective dating.
 * Closes prior open assignment (effective_to = day before new effective_from).
 * If revision is backdated against a locked prior payroll, generate ARREAR into open run or pending adjustment.
 */
export declare function assignEmployeeSalary(actor: HrActor, employeeId: number, input: {
    structureId: number;
    effectiveFrom: string;
    reason?: string;
    generateArrear?: boolean;
}): Promise<{
    assignment: {
        id: number;
        structureId: number;
        structureCode: unknown;
        structureName: unknown;
        effectiveFrom: unknown;
        effectiveTo: unknown;
        isActive: boolean;
    } | undefined;
    arrear: {
        id: number;
        amount: string;
    } | null;
}>;
