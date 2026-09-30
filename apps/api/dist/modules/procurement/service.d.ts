import type { Knex } from 'knex';
import { z } from 'zod';
import { db } from '../../db/index.js';
import type { ProcurementActor } from './types.js';
export declare const unitSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
}, "strict", z.ZodTypeAny, {
    code: string;
    name: string;
}, {
    code: string;
    name: string;
}>;
export declare const categorySchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
}, "strict", z.ZodTypeAny, {
    code: string;
    name: string;
}, {
    code: string;
    name: string;
}>;
export declare const storeSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    storeType: z.ZodOptional<z.ZodString>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    responsibleFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    code: string;
    name: string;
    departmentId?: number | null | undefined;
    storeType?: string | undefined;
    responsibleFacultyId?: number | null | undefined;
}, {
    code: string;
    name: string;
    departmentId?: number | null | undefined;
    storeType?: string | undefined;
    responsibleFacultyId?: number | null | undefined;
}>;
export declare const itemSchema: z.ZodObject<{
    itemCode: z.ZodString;
    name: z.ZodString;
    description: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    subcategory: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    unitId: z.ZodNumber;
    itemType: z.ZodOptional<z.ZodEnum<["CONSUMABLE", "NON_CONSUMABLE", "SPARE", "EQUIPMENT", "ASSET_TRACKABLE"]>>;
    reorderLevel: z.ZodOptional<z.ZodNumber>;
    preferredStoreId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    taxClassification: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    manufacturer: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    brand: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    specifications: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    itemCode: string;
    unitId: number;
    description?: string | null | undefined;
    manufacturer?: string | null | undefined;
    categoryId?: number | null | undefined;
    subcategory?: string | null | undefined;
    itemType?: "EQUIPMENT" | "CONSUMABLE" | "NON_CONSUMABLE" | "SPARE" | "ASSET_TRACKABLE" | undefined;
    reorderLevel?: number | undefined;
    preferredStoreId?: number | null | undefined;
    taxClassification?: string | null | undefined;
    brand?: string | null | undefined;
    specifications?: string | null | undefined;
}, {
    name: string;
    itemCode: string;
    unitId: number;
    description?: string | null | undefined;
    manufacturer?: string | null | undefined;
    categoryId?: number | null | undefined;
    subcategory?: string | null | undefined;
    itemType?: "EQUIPMENT" | "CONSUMABLE" | "NON_CONSUMABLE" | "SPARE" | "ASSET_TRACKABLE" | undefined;
    reorderLevel?: number | undefined;
    preferredStoreId?: number | null | undefined;
    taxClassification?: string | null | undefined;
    brand?: string | null | undefined;
    specifications?: string | null | undefined;
}>;
export declare const indentSchema: z.ZodObject<{
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    consumerModule: z.ZodOptional<z.ZodEnum<["LAB", "HOSTEL", "TRANSPORT", "MAINTENANCE", "DEPARTMENT", "ADMINISTRATION", "IT", "CANTEEN", "OTHER"]>>;
    sourceEntityType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceEntityId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    deliveryStoreId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    requiredDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    urgency: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "URGENT", "CRITICAL"]>>;
    purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodNumber;
        quantity: z.ZodNumber;
        rate: z.ZodOptional<z.ZodNumber>;
        estimatedRate: z.ZodOptional<z.ZodNumber>;
        taxAmount: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodNumber>;
        specifications: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }, {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    items: {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }[];
    departmentId?: number | null | undefined;
    purpose?: string | null | undefined;
    sourceEntityType?: string | null | undefined;
    sourceEntityId?: number | null | undefined;
    requiredDate?: string | null | undefined;
    consumerModule?: "OTHER" | "LAB" | "MAINTENANCE" | "HOSTEL" | "TRANSPORT" | "DEPARTMENT" | "IT" | "ADMINISTRATION" | "CANTEEN" | undefined;
    deliveryStoreId?: number | null | undefined;
    urgency?: "LOW" | "CRITICAL" | "NORMAL" | "URGENT" | undefined;
}, {
    items: {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }[];
    departmentId?: number | null | undefined;
    purpose?: string | null | undefined;
    sourceEntityType?: string | null | undefined;
    sourceEntityId?: number | null | undefined;
    requiredDate?: string | null | undefined;
    consumerModule?: "OTHER" | "LAB" | "MAINTENANCE" | "HOSTEL" | "TRANSPORT" | "DEPARTMENT" | "IT" | "ADMINISTRATION" | "CANTEEN" | undefined;
    deliveryStoreId?: number | null | undefined;
    urgency?: "LOW" | "CRITICAL" | "NORMAL" | "URGENT" | undefined;
}>;
export declare const decisionSchema: z.ZodObject<{
    action: z.ZodEnum<["APPROVE", "REJECT", "RETURN"]>;
    comments: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    action: "RETURN" | "APPROVE" | "REJECT";
    comments?: string | null | undefined;
}, {
    action: "RETURN" | "APPROVE" | "REJECT";
    comments?: string | null | undefined;
}>;
export declare const vendorSchema: z.ZodObject<{
    vendorCode: z.ZodString;
    name: z.ZodString;
    address: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    contactPerson: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    phone: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    email: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    taxIdentifier: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    bankDetails: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    notes: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    name: string;
    vendorCode: string;
    notes?: string | null | undefined;
    phone?: string | null | undefined;
    address?: string | null | undefined;
    email?: string | null | undefined;
    categories?: string[] | undefined;
    contactPerson?: string | null | undefined;
    taxIdentifier?: string | null | undefined;
    bankDetails?: string | null | undefined;
}, {
    name: string;
    vendorCode: string;
    notes?: string | null | undefined;
    phone?: string | null | undefined;
    address?: string | null | undefined;
    email?: string | null | undefined;
    categories?: string[] | undefined;
    contactPerson?: string | null | undefined;
    taxIdentifier?: string | null | undefined;
    bankDetails?: string | null | undefined;
}>;
export declare const rfqSchema: z.ZodObject<{
    indentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    dueDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    terms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    vendorIds: z.ZodArray<z.ZodNumber, "many">;
}, "strict", z.ZodTypeAny, {
    vendorIds: number[];
    dueDate?: string | null | undefined;
    indentId?: number | null | undefined;
    terms?: string | null | undefined;
}, {
    vendorIds: number[];
    dueDate?: string | null | undefined;
    indentId?: number | null | undefined;
    terms?: string | null | undefined;
}>;
export declare const quotationSchema: z.ZodObject<{
    vendorId: z.ZodNumber;
    quotationNo: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    quotationDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    validUntil: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    deliveryPeriod: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    warranty: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    paymentTerms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    freightCharges: z.ZodOptional<z.ZodNumber>;
    otherCharges: z.ZodOptional<z.ZodNumber>;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodNumber;
        quantity: z.ZodNumber;
        rate: z.ZodOptional<z.ZodNumber>;
        estimatedRate: z.ZodOptional<z.ZodNumber>;
        taxAmount: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodNumber>;
        specifications: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }, {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    items: {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }[];
    vendorId: number;
    quotationNo?: string | null | undefined;
    quotationDate?: string | null | undefined;
    validUntil?: string | null | undefined;
    deliveryPeriod?: string | null | undefined;
    warranty?: string | null | undefined;
    paymentTerms?: string | null | undefined;
    freightCharges?: number | undefined;
    otherCharges?: number | undefined;
}, {
    items: {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }[];
    vendorId: number;
    quotationNo?: string | null | undefined;
    quotationDate?: string | null | undefined;
    validUntil?: string | null | undefined;
    deliveryPeriod?: string | null | undefined;
    warranty?: string | null | undefined;
    paymentTerms?: string | null | undefined;
    freightCharges?: number | undefined;
    otherCharges?: number | undefined;
}>;
export declare const selectQuotationSchema: z.ZodObject<{
    justification: z.ZodString;
}, "strict", z.ZodTypeAny, {
    justification: string;
}, {
    justification: string;
}>;
export declare const poSchema: z.ZodObject<{
    vendorId: z.ZodNumber;
    indentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    rfqId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    quotationId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    deliveryStoreId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    deliveryTerms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    paymentTerms: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    expectedDate: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodNumber;
        quantity: z.ZodNumber;
        estimatedRate: z.ZodOptional<z.ZodNumber>;
        taxAmount: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodNumber>;
        specifications: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    } & {
        rate: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        itemId: number;
        quantity: number;
        rate: number;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }, {
        itemId: number;
        quantity: number;
        rate: number;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    items: {
        itemId: number;
        quantity: number;
        rate: number;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }[];
    vendorId: number;
    deliveryStoreId?: number | null | undefined;
    indentId?: number | null | undefined;
    paymentTerms?: string | null | undefined;
    rfqId?: number | null | undefined;
    quotationId?: number | null | undefined;
    deliveryTerms?: string | null | undefined;
    expectedDate?: string | null | undefined;
}, {
    items: {
        itemId: number;
        quantity: number;
        rate: number;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }[];
    vendorId: number;
    deliveryStoreId?: number | null | undefined;
    indentId?: number | null | undefined;
    paymentTerms?: string | null | undefined;
    rfqId?: number | null | undefined;
    quotationId?: number | null | undefined;
    deliveryTerms?: string | null | undefined;
    expectedDate?: string | null | undefined;
}>;
export declare const grnSchema: z.ZodObject<{
    deliveryReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    invoiceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    receivedDate: z.ZodString;
    receivingStoreId: z.ZodNumber;
    inspectionStatus: z.ZodOptional<z.ZodEnum<["ACCEPTED", "PARTIALLY_ACCEPTED", "REJECTED", "PENDING_INSPECTION"]>>;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    idempotencyKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodArray<z.ZodObject<{
        poItemId: z.ZodNumber;
        receivedQuantity: z.ZodNumber;
        acceptedQuantity: z.ZodNumber;
        rejectedQuantity: z.ZodOptional<z.ZodNumber>;
        rejectionReason: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        receivedQuantity: number;
        poItemId: number;
        acceptedQuantity: number;
        rejectionReason?: string | null | undefined;
        rejectedQuantity?: number | undefined;
    }, {
        receivedQuantity: number;
        poItemId: number;
        acceptedQuantity: number;
        rejectionReason?: string | null | undefined;
        rejectedQuantity?: number | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    items: {
        receivedQuantity: number;
        poItemId: number;
        acceptedQuantity: number;
        rejectionReason?: string | null | undefined;
        rejectedQuantity?: number | undefined;
    }[];
    receivedDate: string;
    receivingStoreId: number;
    remarks?: string | null | undefined;
    idempotencyKey?: string | null | undefined;
    deliveryReference?: string | null | undefined;
    invoiceReference?: string | null | undefined;
    inspectionStatus?: "REJECTED" | "ACCEPTED" | "PARTIALLY_ACCEPTED" | "PENDING_INSPECTION" | undefined;
}, {
    items: {
        receivedQuantity: number;
        poItemId: number;
        acceptedQuantity: number;
        rejectionReason?: string | null | undefined;
        rejectedQuantity?: number | undefined;
    }[];
    receivedDate: string;
    receivingStoreId: number;
    remarks?: string | null | undefined;
    idempotencyKey?: string | null | undefined;
    deliveryReference?: string | null | undefined;
    invoiceReference?: string | null | undefined;
    inspectionStatus?: "REJECTED" | "ACCEPTED" | "PARTIALLY_ACCEPTED" | "PENDING_INSPECTION" | undefined;
}>;
export declare const issueSchema: z.ZodObject<{
    storeId: z.ZodNumber;
    consumerModule: z.ZodEnum<["LAB", "HOSTEL", "TRANSPORT", "MAINTENANCE", "DEPARTMENT", "ADMINISTRATION", "IT", "CANTEEN", "OTHER"]>;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    recipientName: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceEntityType: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sourceEntityId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    purpose: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    issueDate: z.ZodString;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodNumber;
        quantity: z.ZodNumber;
        rate: z.ZodOptional<z.ZodNumber>;
        estimatedRate: z.ZodOptional<z.ZodNumber>;
        taxAmount: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodNumber>;
        specifications: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }, {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    issueDate: string;
    items: {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }[];
    consumerModule: "OTHER" | "LAB" | "MAINTENANCE" | "HOSTEL" | "TRANSPORT" | "DEPARTMENT" | "IT" | "ADMINISTRATION" | "CANTEEN";
    storeId: number;
    departmentId?: number | null | undefined;
    purpose?: string | null | undefined;
    sourceEntityType?: string | null | undefined;
    sourceEntityId?: number | null | undefined;
    recipientName?: string | null | undefined;
}, {
    issueDate: string;
    items: {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }[];
    consumerModule: "OTHER" | "LAB" | "MAINTENANCE" | "HOSTEL" | "TRANSPORT" | "DEPARTMENT" | "IT" | "ADMINISTRATION" | "CANTEEN";
    storeId: number;
    departmentId?: number | null | undefined;
    purpose?: string | null | undefined;
    sourceEntityType?: string | null | undefined;
    sourceEntityId?: number | null | undefined;
    recipientName?: string | null | undefined;
}>;
export declare const returnSchema: z.ZodObject<{
    issueId: z.ZodNumber;
    returnDate: z.ZodString;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodArray<z.ZodObject<{
        issueItemId: z.ZodNumber;
        quantity: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        quantity: number;
        issueItemId: number;
    }, {
        quantity: number;
        issueItemId: number;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    items: {
        quantity: number;
        issueItemId: number;
    }[];
    issueId: number;
    returnDate: string;
    remarks?: string | null | undefined;
}, {
    items: {
        quantity: number;
        issueItemId: number;
    }[];
    issueId: number;
    returnDate: string;
    remarks?: string | null | undefined;
}>;
export declare const transferSchema: z.ZodObject<{
    fromStoreId: z.ZodNumber;
    toStoreId: z.ZodNumber;
    transferDate: z.ZodString;
    remarks: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    items: z.ZodArray<z.ZodObject<{
        itemId: z.ZodNumber;
        quantity: z.ZodNumber;
        rate: z.ZodOptional<z.ZodNumber>;
        estimatedRate: z.ZodOptional<z.ZodNumber>;
        taxAmount: z.ZodOptional<z.ZodNumber>;
        discountAmount: z.ZodOptional<z.ZodNumber>;
        specifications: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }, {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }>, "many">;
}, "strict", z.ZodTypeAny, {
    items: {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }[];
    fromStoreId: number;
    toStoreId: number;
    transferDate: string;
    remarks?: string | null | undefined;
}, {
    items: {
        itemId: number;
        quantity: number;
        rate?: number | undefined;
        specifications?: string | null | undefined;
        estimatedRate?: number | undefined;
        taxAmount?: number | undefined;
        discountAmount?: number | undefined;
    }[];
    fromStoreId: number;
    toStoreId: number;
    transferDate: string;
    remarks?: string | null | undefined;
}>;
export declare const adjustmentSchema: z.ZodObject<{
    storeId: z.ZodNumber;
    itemId: z.ZodNumber;
    direction: z.ZodEnum<["IN", "OUT"]>;
    quantity: z.ZodNumber;
    reason: z.ZodString;
}, "strict", z.ZodTypeAny, {
    reason: string;
    direction: "OUT" | "IN";
    itemId: number;
    quantity: number;
    storeId: number;
}, {
    reason: string;
    direction: "OUT" | "IN";
    itemId: number;
    quantity: number;
    storeId: number;
}>;
export declare const financeHandoffSchema: z.ZodObject<{
    invoiceReference: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    idempotencyKey: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strict", z.ZodTypeAny, {
    idempotencyKey?: string | null | undefined;
    invoiceReference?: string | null | undefined;
}, {
    idempotencyKey?: string | null | undefined;
    invoiceReference?: string | null | undefined;
}>;
export declare const assetHandoffSchema: z.ZodObject<{
    assets: z.ZodArray<z.ZodObject<{
        assetTag: z.ZodString;
        serialNumber: z.ZodNullable<z.ZodOptional<z.ZodString>>;
        name: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    }, "strict", z.ZodTypeAny, {
        assetTag: string;
        name?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }, {
        assetTag: string;
        name?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }>, "many">;
    departmentId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    custodianFacultyId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    locationRoomId: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
}, "strict", z.ZodTypeAny, {
    assets: {
        assetTag: string;
        name?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }[];
    departmentId?: number | null | undefined;
    custodianFacultyId?: number | null | undefined;
    locationRoomId?: number | null | undefined;
}, {
    assets: {
        assetTag: string;
        name?: string | null | undefined;
        serialNumber?: string | null | undefined;
    }[];
    departmentId?: number | null | undefined;
    custodianFacultyId?: number | null | undefined;
    locationRoomId?: number | null | undefined;
}>;
export declare function dashboard(actor: ProcurementActor): Promise<{
    metrics: {
        activeItems: number;
        lowStock: number;
        pendingIndents: number;
        openRfqs: number;
        posAwaitingDelivery: number;
        grnsPendingInspection: number;
        financeHandoffsPending: number;
    };
    recentMovements: {
        [k: string]: unknown;
    }[];
}>;
export declare function listMasters(actor: ProcurementActor): Promise<{
    units: {
        [k: string]: unknown;
    }[];
    categories: {
        [k: string]: unknown;
    }[];
    stores: {
        [k: string]: unknown;
    }[];
    items: {
        [k: string]: unknown;
    }[];
    vendors: {
        [k: string]: unknown;
    }[];
}>;
export declare function upsertUnit(actor: ProcurementActor, input: z.infer<typeof unitSchema>): Promise<{
    units: {
        [k: string]: unknown;
    }[];
    categories: {
        [k: string]: unknown;
    }[];
    stores: {
        [k: string]: unknown;
    }[];
    items: {
        [k: string]: unknown;
    }[];
    vendors: {
        [k: string]: unknown;
    }[];
}>;
export declare function upsertCategory(actor: ProcurementActor, input: z.infer<typeof categorySchema>): Promise<{
    units: {
        [k: string]: unknown;
    }[];
    categories: {
        [k: string]: unknown;
    }[];
    stores: {
        [k: string]: unknown;
    }[];
    items: {
        [k: string]: unknown;
    }[];
    vendors: {
        [k: string]: unknown;
    }[];
}>;
export declare function createStore(actor: ProcurementActor, input: z.infer<typeof storeSchema>): Promise<{
    units: {
        [k: string]: unknown;
    }[];
    categories: {
        [k: string]: unknown;
    }[];
    stores: {
        [k: string]: unknown;
    }[];
    items: {
        [k: string]: unknown;
    }[];
    vendors: {
        [k: string]: unknown;
    }[];
}>;
export declare function createItem(actor: ProcurementActor, input: z.infer<typeof itemSchema>): Promise<{
    units: {
        [k: string]: unknown;
    }[];
    categories: {
        [k: string]: unknown;
    }[];
    stores: {
        [k: string]: unknown;
    }[];
    items: {
        [k: string]: unknown;
    }[];
    vendors: {
        [k: string]: unknown;
    }[];
}>;
export declare function createVendor(actor: ProcurementActor, input: z.infer<typeof vendorSchema>): Promise<{
    units: {
        [k: string]: unknown;
    }[];
    categories: {
        [k: string]: unknown;
    }[];
    stores: {
        [k: string]: unknown;
    }[];
    items: {
        [k: string]: unknown;
    }[];
    vendors: {
        [k: string]: unknown;
    }[];
}>;
export declare function createIndent(actor: ProcurementActor, input: z.infer<typeof indentSchema>): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function getIndent(actor: ProcurementActor, id: number, trx?: Knex.Transaction | typeof db): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function listIndents(actor: ProcurementActor): Promise<{
    indents: {
        [k: string]: unknown;
    }[];
}>;
export declare function decideIndent(actor: ProcurementActor, id: number, input: z.infer<typeof decisionSchema>): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function createRfq(actor: ProcurementActor, input: z.infer<typeof rfqSchema>): Promise<{
    rfq: {
        [k: string]: unknown;
    };
}>;
export declare function issueRfq(actor: ProcurementActor, id: number): Promise<{
    rfq: {
        [k: string]: unknown;
    };
    quotations: {
        [k: string]: unknown;
    }[];
}>;
export declare function recordQuotation(actor: ProcurementActor, rfqId: number, input: z.infer<typeof quotationSchema>): Promise<{
    rfq: {
        [k: string]: unknown;
    };
    quotations: {
        [k: string]: unknown;
    }[];
}>;
export declare function selectQuotation(actor: ProcurementActor, rfqId: number, quotationId: number, input: z.infer<typeof selectQuotationSchema>): Promise<{
    rfq: {
        [k: string]: unknown;
    };
    quotations: {
        [k: string]: unknown;
    }[];
}>;
export declare function getRfqComparison(actor: ProcurementActor, rfqId: number, trx?: Knex.Transaction | typeof db): Promise<{
    rfq: {
        [k: string]: unknown;
    };
    quotations: {
        [k: string]: unknown;
    }[];
}>;
export declare function createPo(actor: ProcurementActor, input: z.infer<typeof poSchema>): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function transitionPo(actor: ProcurementActor, id: number, action: 'approve' | 'issue' | 'cancel', reason?: string): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function getPo(actor: ProcurementActor, id: number, trx?: Knex.Transaction | typeof db): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function listPos(actor: ProcurementActor): Promise<{
    purchaseOrders: {
        [k: string]: unknown;
    }[];
}>;
export declare function createGrn(actor: ProcurementActor, poId: number, input: z.infer<typeof grnSchema>): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
export declare function getGrn(actor: ProcurementActor, id: number, trx?: Knex.Transaction | typeof db): Promise<{
    items: {
        [k: string]: unknown;
    }[];
}>;
/**
 * Campus OS Phase 1 — Asset handoff.
 *
 * A GRN line for an ASSET_TRACKABLE item is not automatically turned into an asset —
 * this is a separate, explicitly governed transition, gated by `procurement.asset.handoff`
 * (Phase-1 brief §5/§31). It calls the frozen P0.2 Asset Management engine's own
 * `registerAsset()` unchanged; P0.2's schema/code is never modified.
 *
 * Idempotency (§32): `procurement_asset_handoffs` has a unique (college_id, grn_item_id)
 * constraint, so at most one handoff is ever recorded per GRN line. Additionally, each
 * asset tag is checked for prior existence before creating it, so a retry after a
 * partial failure (§50) reuses already-created assets instead of erroring or duplicating.
 */
export declare function handoffGrnItemToAssets(actor: ProcurementActor, grnItemId: number, input: z.infer<typeof assetHandoffSchema>): Promise<{
    assetIds: any;
    idempotent: boolean;
}>;
export declare function getAssetHandoff(actor: ProcurementActor, grnItemId: number): Promise<{
    [k: string]: unknown;
} | null>;
export declare function listGrns(actor: ProcurementActor): Promise<{
    grns: {
        [k: string]: unknown;
    }[];
}>;
export declare function listInventory(actor: ProcurementActor): Promise<{
    balances: {
        lowStock: boolean;
    }[];
}>;
export declare function ledger(actor: ProcurementActor, filters: {
    itemId?: number;
    storeId?: number;
    limit?: number;
}): Promise<{
    movements: {
        [k: string]: unknown;
    }[];
}>;
export declare function createIssue(actor: ProcurementActor, input: z.infer<typeof issueSchema>): Promise<{
    issue: {
        [k: string]: unknown;
    };
}>;
export declare function createReturn(actor: ProcurementActor, input: z.infer<typeof returnSchema>): Promise<{
    return: {
        [k: string]: unknown;
    };
}>;
export declare function createTransfer(actor: ProcurementActor, input: z.infer<typeof transferSchema>): Promise<{
    transfer: {
        [k: string]: unknown;
    };
}>;
export declare function createAdjustment(actor: ProcurementActor, input: z.infer<typeof adjustmentSchema>): Promise<{
    adjustment: {
        [k: string]: unknown;
    };
}>;
export declare function reconcile(actor: ProcurementActor): Promise<{
    ok: boolean;
    checked: number;
    failures: {
        itemId: number;
        storeId: number;
        balance: number;
        derived: any;
    }[];
}>;
export declare function financeHandoff(actor: ProcurementActor, grnId: number, input: z.infer<typeof financeHandoffSchema>): Promise<{
    handoff: {
        [k: string]: unknown;
    };
    idempotent: boolean;
}>;
export declare function reports(actor: ProcurementActor): Promise<{
    purchaseHistory: {
        [k: string]: unknown;
    }[];
    consumption: {
        [k: string]: unknown;
    }[];
    pendingPurchaseOrders: number;
}>;
/**
 * Campus OS Phase 0 — Vendor Master consolidation.
 *
 * `procurement_vendors` is the canonical, cross-campus vendor master (see
 * docs/CAMPUS_OS_PHASE0_PREIMPLEMENTATION_AUDIT.md). This accessor exists so future
 * consumers (Asset Management, and any later module) can read the vendor directory
 * without pulling the full `/masters` bundle and without a second vendor table.
 * It does not add columns or change existing vendor behaviour.
 */
export declare const VENDOR_CATEGORY_SUGGESTIONS: readonly ["SUPPLIER", "SERVICE_PROVIDER", "CONTRACTOR", "TRANSPORT_VENDOR", "MAINTENANCE_VENDOR", "EQUIPMENT_VENDOR", "OTHER"];
export declare function listVendorDirectory(actor: ProcurementActor, opts?: {
    activeOnly?: boolean;
}): Promise<{
    [k: string]: unknown;
}[]>;
/**
 * Internal cross-module lookup, not exposed over HTTP. Tenant-scoped by the caller's
 * own collegeId. Returns null rather than throwing so a stale/removed vendor reference
 * degrades gracefully in a consumer module's display, instead of breaking it.
 */
export declare function findVendorRef(collegeId: number, vendorId: number | null | undefined): Promise<{
    [k: string]: unknown;
} | null>;
