import type { Knex } from 'knex';
import type { FinanceActor } from './types.js';
import { toMoney } from './money.js';
export declare function nextSequenceNumber(trx: Knex.Transaction, collegeId: number, seriesCode: string, year: number): Promise<number>;
export declare function nextDocumentNumber(trx: Knex.Transaction, collegeId: number, seriesCode: string): Promise<string>;
export declare function getFinancePolicy(collegeId: number): Promise<{
    currency: string;
    scholarshipTreatment: "REDUCE_DEMAND";
    examFeePaidRequired: boolean;
    financialClearanceMode: "BLOCK";
    receiptSeries: string;
    demandSeries: string;
    paymentSeries: string;
    defaultGatewayProvider?: undefined;
} | {
    currency: any;
    scholarshipTreatment: any;
    examFeePaidRequired: boolean;
    financialClearanceMode: any;
    receiptSeries: any;
    demandSeries: any;
    paymentSeries: any;
    defaultGatewayProvider: any;
}>;
export declare function listFeeHeads(collegeId: number, activeOnly?: boolean): Promise<{
    id: number;
    code: unknown;
    name: unknown;
    category: unknown;
    description: unknown;
    isRefundable: boolean;
    isOptional: boolean;
    isActive: boolean;
}[]>;
export declare function serializeFeeHead(row: Record<string, unknown>): {
    id: number;
    code: unknown;
    name: unknown;
    category: unknown;
    description: unknown;
    isRefundable: boolean;
    isOptional: boolean;
    isActive: boolean;
};
export declare function createFeeHead(actor: FinanceActor, body: {
    code: string;
    name: string;
    category?: string;
    description?: string;
    isRefundable?: boolean;
    isOptional?: boolean;
}): Promise<{
    id: number;
    code: unknown;
    name: unknown;
    category: unknown;
    description: unknown;
    isRefundable: boolean;
    isOptional: boolean;
    isActive: boolean;
}>;
export declare function updateFeeHead(actor: FinanceActor, id: number, body: Partial<{
    name: string;
    category: string;
    description: string;
    isRefundable: boolean;
    isOptional: boolean;
    isActive: boolean;
}>): Promise<{
    id: number;
    code: unknown;
    name: unknown;
    category: unknown;
    description: unknown;
    isRefundable: boolean;
    isOptional: boolean;
    isActive: boolean;
}>;
export declare function getFeeHeadByCode(collegeId: number, code: string): Promise<any>;
export { toMoney };
