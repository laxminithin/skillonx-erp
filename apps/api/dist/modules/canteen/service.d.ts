import type { Knex } from 'knex';
import { z } from 'zod';
import { db } from '../../db/index.js';
import type { CanteenActor } from './types.js';
export declare const menuItemSchema: z.ZodObject<{
    itemId: z.ZodNumber;
    category: z.ZodOptional<z.ZodString>;
    price: z.ZodNumber;
    isAvailable: z.ZodOptional<z.ZodBoolean>;
}, "strict", z.ZodTypeAny, {
    itemId: number;
    price: number;
    category?: string | undefined;
    isAvailable?: boolean | undefined;
}, {
    itemId: number;
    price: number;
    category?: string | undefined;
    isAvailable?: boolean | undefined;
}>;
export declare const createOrderSchema: z.ZodObject<{
    counterStoreId: z.ZodNumber;
    customerType: z.ZodEnum<["STUDENT", "FACULTY", "STAFF", "GUEST"]>;
    customerStudentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    customerFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    items: z.ZodArray<z.ZodObject<{
        menuItemId: z.ZodNumber;
        quantity: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        quantity: number;
        menuItemId: number;
    }, {
        quantity: number;
        menuItemId: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    items: {
        quantity: number;
        menuItemId: number;
    }[];
    counterStoreId: number;
    customerType: "STUDENT" | "FACULTY" | "STAFF" | "GUEST";
    customerStudentId?: number | null | undefined;
    customerFacultyId?: number | null | undefined;
}, {
    items: {
        quantity: number;
        menuItemId: number;
    }[];
    counterStoreId: number;
    customerType: "STUDENT" | "FACULTY" | "STAFF" | "GUEST";
    customerStudentId?: number | null | undefined;
    customerFacultyId?: number | null | undefined;
}>;
export declare const payOrderSchema: z.ZodObject<{
    paymentMethod: z.ZodEnum<["CASH", "CARD", "UPI"]>;
}, "strict", z.ZodTypeAny, {
    paymentMethod: "CASH" | "CARD" | "UPI";
}, {
    paymentMethod: "CASH" | "CARD" | "UPI";
}>;
export declare const cancelOrderSchema: z.ZodObject<{
    reason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    reason?: string | null | undefined;
}, {
    reason?: string | null | undefined;
}>;
export declare const refundOrderSchema: z.ZodObject<{
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
}, {
    reason: string;
}>;
export declare const settlementSchema: z.ZodObject<{
    counterStoreId: z.ZodNumber;
    businessDate: z.ZodString;
}, "strict", z.ZodTypeAny, {
    counterStoreId: number;
    businessDate: string;
}, {
    counterStoreId: number;
    businessDate: string;
}>;
export declare function upsertMenuItem(actor: CanteenActor, input: z.infer<typeof menuItemSchema>): Promise<{
    [k: string]: unknown;
}[]>;
export declare function listMenu(actor: CanteenActor, opts?: {
    availableOnly?: boolean;
}): Promise<{
    [k: string]: unknown;
}[]>;
export declare function createOrder(actor: CanteenActor, input: z.infer<typeof createOrderSchema>): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function getOrder(actor: CanteenActor, orderId: number, trx?: Knex.Transaction | typeof db): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function listOrders(actor: CanteenActor, filters?: {
    status?: string;
    counterStoreId?: number;
}): Promise<{
    [k: string]: unknown;
}[]>;
export declare function payOrder(actor: CanteenActor, orderId: number, input: z.infer<typeof payOrderSchema>): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function cancelOrder(actor: CanteenActor, orderId: number, input: z.infer<typeof cancelOrderSchema>): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function refundOrder(actor: CanteenActor, orderId: number, input: z.infer<typeof refundOrderSchema>): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function generateDailySettlement(actor: CanteenActor, input: z.infer<typeof settlementSchema>): Promise<{
    handoff: {
        [k: string]: unknown;
    };
    idempotent: boolean;
}>;
export declare function listSettlements(actor: CanteenActor, counterStoreId?: number): Promise<{
    [k: string]: unknown;
}[]>;
export declare function dashboard(actor: CanteenActor): Promise<{
    pendingOrders: number;
    todaySales: number;
    todayOrders: number;
    availableMenuItems: number;
}>;
