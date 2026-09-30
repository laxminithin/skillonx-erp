import { z } from 'zod';
export type LabActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name: string;
};
export declare const LAB_PERMISSIONS: readonly ["lab.view", "lab.master.manage", "lab.assignment.manage", "lab.asset.manage", "lab.stock.manage", "lab.issue.manage", "lab.session.manage", "lab.fault.manage", "lab.repair.manage", "lab.repair.approve", "lab.software.manage", "lab.software.request", "lab.requirement.create", "lab.requirement.approve", "lab.oversight.view", "lab.report.view"];
export type LabPermission = (typeof LAB_PERMISSIONS)[number];
export declare const ASSET_CATEGORIES: readonly ["DESKTOP", "LAPTOP", "MONITOR", "UPS", "PRINTER", "PROJECTOR", "NETWORK", "BOARD", "INSTRUMENT", "TOOL", "FURNITURE", "PERIPHERAL", "EQUIPMENT", "OTHER"];
export declare const OPERATIONAL_STATUSES: readonly ["AVAILABLE", "IN_USE", "FAULTY", "UNDER_REPAIR", "RESERVED", "RETIRED", "LOST"];
export declare const CONDITIONS: readonly ["GOOD", "FAIR", "POOR", "DAMAGED"];
export declare const MOVEMENT_TYPES: readonly ["RECEIPT", "ISSUE", "RETURN", "CONSUMPTION", "TRANSFER", "ADJUSTMENT", "SCRAP"];
export declare const READINESS_STATES: readonly ["NOT_STARTED", "IN_PREPARATION", "READY", "ISSUE_REPORTED", "COMPLETED"];
export declare const FAULT_STATES: readonly ["OPEN", "ACKNOWLEDGED", "UNDER_DIAGNOSIS", "UNDER_REPAIR", "RESOLVED", "CLOSED"];
export declare const REPAIR_STATES: readonly ["REQUESTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"];
export declare const REQUIREMENT_STATES: readonly ["SUBMITTED", "INCHARGE_APPROVED", "HOD_APPROVED", "PRINCIPAL_APPROVED", "REJECTED", "FULFILLED"];
export declare const REQUIREMENT_TYPES: readonly ["NEW_ASSET", "REPLACEMENT", "CONSUMABLES", "SOFTWARE", "REPAIR", "UPGRADE"];
export declare const labSchema: z.ZodObject<{
    name: z.ZodString;
    code: z.ZodString;
    departmentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    roomId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    labType: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE"]>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    departmentId?: number | null | undefined;
    roomId?: number | null | undefined;
    description?: string | null | undefined;
    capacity?: number | null | undefined;
    labType?: string | undefined;
}, {
    code: string;
    name: string;
    status?: "ACTIVE" | "INACTIVE" | undefined;
    departmentId?: number | null | undefined;
    roomId?: number | null | undefined;
    description?: string | null | undefined;
    capacity?: number | null | undefined;
    labType?: string | undefined;
}>;
export declare const assignmentSchema: z.ZodObject<{
    facultyId: z.ZodNumber;
    assignmentRole: z.ZodEnum<["LAB_ASSISTANT", "LAB_INCHARGE"]>;
    isPrimary: z.ZodOptional<z.ZodBoolean>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    facultyId: number;
    assignmentRole: "LAB_ASSISTANT" | "LAB_INCHARGE";
    remarks?: string | null | undefined;
    isPrimary?: boolean | undefined;
}, {
    facultyId: number;
    assignmentRole: "LAB_ASSISTANT" | "LAB_INCHARGE";
    remarks?: string | null | undefined;
    isPrimary?: boolean | undefined;
}>;
export declare const assetSchema: z.ZodObject<{
    labId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    assetTag: z.ZodString;
    serialNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    category: z.ZodOptional<z.ZodEnum<["DESKTOP", "LAPTOP", "MONITOR", "UPS", "PRINTER", "PROJECTOR", "NETWORK", "BOARD", "INSTRUMENT", "TOOL", "FURNITURE", "PERIPHERAL", "EQUIPMENT", "OTHER"]>>;
    assetClass: z.ZodOptional<z.ZodEnum<["ASSET", "COMPUTER", "ACCESSORY"]>>;
    name: z.ZodString;
    make: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    model: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    purchaseDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    cost: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    vendor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    warrantyStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    warrantyEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    amcStart: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    amcEnd: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    condition: z.ZodOptional<z.ZodEnum<["GOOD", "FAIR", "POOR", "DAMAGED"]>>;
    custodianFacultyId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    hostname: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    systemNumber: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    processor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    ram: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    storage: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    os: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    assetTag: string;
    remarks?: string | null | undefined;
    category?: "OTHER" | "TOOL" | "INSTRUMENT" | "FURNITURE" | "DESKTOP" | "LAPTOP" | "MONITOR" | "UPS" | "PRINTER" | "PROJECTOR" | "NETWORK" | "BOARD" | "PERIPHERAL" | "EQUIPMENT" | undefined;
    model?: string | null | undefined;
    labId?: number | null | undefined;
    serialNumber?: string | null | undefined;
    assetClass?: "ASSET" | "COMPUTER" | "ACCESSORY" | undefined;
    make?: string | null | undefined;
    purchaseDate?: string | null | undefined;
    cost?: number | null | undefined;
    vendor?: string | null | undefined;
    warrantyStart?: string | null | undefined;
    warrantyEnd?: string | null | undefined;
    amcStart?: string | null | undefined;
    amcEnd?: string | null | undefined;
    condition?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | undefined;
    custodianFacultyId?: number | null | undefined;
    hostname?: string | null | undefined;
    systemNumber?: string | null | undefined;
    processor?: string | null | undefined;
    ram?: string | null | undefined;
    storage?: string | null | undefined;
    os?: string | null | undefined;
}, {
    name: string;
    assetTag: string;
    remarks?: string | null | undefined;
    category?: "OTHER" | "TOOL" | "INSTRUMENT" | "FURNITURE" | "DESKTOP" | "LAPTOP" | "MONITOR" | "UPS" | "PRINTER" | "PROJECTOR" | "NETWORK" | "BOARD" | "PERIPHERAL" | "EQUIPMENT" | undefined;
    model?: string | null | undefined;
    labId?: number | null | undefined;
    serialNumber?: string | null | undefined;
    assetClass?: "ASSET" | "COMPUTER" | "ACCESSORY" | undefined;
    make?: string | null | undefined;
    purchaseDate?: string | null | undefined;
    cost?: number | null | undefined;
    vendor?: string | null | undefined;
    warrantyStart?: string | null | undefined;
    warrantyEnd?: string | null | undefined;
    amcStart?: string | null | undefined;
    amcEnd?: string | null | undefined;
    condition?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | undefined;
    custodianFacultyId?: number | null | undefined;
    hostname?: string | null | undefined;
    systemNumber?: string | null | undefined;
    processor?: string | null | undefined;
    ram?: string | null | undefined;
    storage?: string | null | undefined;
    os?: string | null | undefined;
}>;
export declare const assetStatusSchema: z.ZodEffects<z.ZodObject<{
    operationalStatus: z.ZodOptional<z.ZodEnum<["AVAILABLE", "IN_USE", "FAULTY", "UNDER_REPAIR", "RESERVED", "RETIRED", "LOST"]>>;
    condition: z.ZodOptional<z.ZodEnum<["GOOD", "FAIR", "POOR", "DAMAGED"]>>;
    labId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    custodianFacultyId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    note?: string | null | undefined;
    labId?: number | null | undefined;
    condition?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | undefined;
    custodianFacultyId?: number | null | undefined;
    operationalStatus?: "RETIRED" | "AVAILABLE" | "RESERVED" | "LOST" | "IN_USE" | "FAULTY" | "UNDER_REPAIR" | undefined;
}, {
    note?: string | null | undefined;
    labId?: number | null | undefined;
    condition?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | undefined;
    custodianFacultyId?: number | null | undefined;
    operationalStatus?: "RETIRED" | "AVAILABLE" | "RESERVED" | "LOST" | "IN_USE" | "FAULTY" | "UNDER_REPAIR" | undefined;
}>, {
    note?: string | null | undefined;
    labId?: number | null | undefined;
    condition?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | undefined;
    custodianFacultyId?: number | null | undefined;
    operationalStatus?: "RETIRED" | "AVAILABLE" | "RESERVED" | "LOST" | "IN_USE" | "FAULTY" | "UNDER_REPAIR" | undefined;
}, {
    note?: string | null | undefined;
    labId?: number | null | undefined;
    condition?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | undefined;
    custodianFacultyId?: number | null | undefined;
    operationalStatus?: "RETIRED" | "AVAILABLE" | "RESERVED" | "LOST" | "IN_USE" | "FAULTY" | "UNDER_REPAIR" | undefined;
}>;
export declare const stockItemSchema: z.ZodObject<{
    labId: z.ZodNumber;
    name: z.ZodString;
    code: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    unit: z.ZodOptional<z.ZodString>;
    openingStock: z.ZodOptional<z.ZodNumber>;
    minThreshold: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    labId: number;
    code?: string | null | undefined;
    category?: string | undefined;
    unit?: string | undefined;
    openingStock?: number | undefined;
    minThreshold?: number | undefined;
}, {
    name: string;
    labId: number;
    code?: string | null | undefined;
    category?: string | undefined;
    unit?: string | undefined;
    openingStock?: number | undefined;
    minThreshold?: number | undefined;
}>;
export declare const stockMovementSchema: z.ZodObject<{
    movementType: z.ZodEnum<["RECEIPT", "ISSUE", "RETURN", "CONSUMPTION", "TRANSFER", "ADJUSTMENT", "SCRAP"]>;
    quantity: z.ZodNumber;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    reference: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    toLabId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    quantity: number;
    movementType: "RETURN" | "ISSUE" | "RECEIPT" | "CONSUMPTION" | "TRANSFER" | "ADJUSTMENT" | "SCRAP";
    reason?: string | null | undefined;
    reference?: string | null | undefined;
    toLabId?: number | null | undefined;
}, {
    quantity: number;
    movementType: "RETURN" | "ISSUE" | "RECEIPT" | "CONSUMPTION" | "TRANSFER" | "ADJUSTMENT" | "SCRAP";
    reason?: string | null | undefined;
    reference?: string | null | undefined;
    toLabId?: number | null | undefined;
}>;
export declare const issueSchema: z.ZodObject<{
    labId: z.ZodNumber;
    itemKind: z.ZodEnum<["ASSET", "ACCESSORY", "STOCK"]>;
    assetId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    stockItemId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    description: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    quantity: z.ZodOptional<z.ZodNumber>;
    recipientType: z.ZodEnum<["FACULTY", "STUDENT", "LAB", "DEPARTMENT"]>;
    recipientFacultyId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    recipientStudentId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    recipientNote: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    issueDate: z.ZodString;
    expectedReturn: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    conditionOut: z.ZodOptional<z.ZodNullable<z.ZodEnum<["GOOD", "FAIR", "POOR", "DAMAGED"]>>>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    issueDate: string;
    labId: number;
    itemKind: "ASSET" | "ACCESSORY" | "STOCK";
    recipientType: "STUDENT" | "FACULTY" | "LAB" | "DEPARTMENT";
    remarks?: string | null | undefined;
    description?: string | null | undefined;
    quantity?: number | undefined;
    assetId?: number | null | undefined;
    stockItemId?: number | null | undefined;
    recipientFacultyId?: number | null | undefined;
    recipientStudentId?: number | null | undefined;
    recipientNote?: string | null | undefined;
    expectedReturn?: string | null | undefined;
    conditionOut?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | null | undefined;
}, {
    issueDate: string;
    labId: number;
    itemKind: "ASSET" | "ACCESSORY" | "STOCK";
    recipientType: "STUDENT" | "FACULTY" | "LAB" | "DEPARTMENT";
    remarks?: string | null | undefined;
    description?: string | null | undefined;
    quantity?: number | undefined;
    assetId?: number | null | undefined;
    stockItemId?: number | null | undefined;
    recipientFacultyId?: number | null | undefined;
    recipientStudentId?: number | null | undefined;
    recipientNote?: string | null | undefined;
    expectedReturn?: string | null | undefined;
    conditionOut?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | null | undefined;
}>;
export declare const returnSchema: z.ZodObject<{
    actualReturn: z.ZodOptional<z.ZodString>;
    conditionIn: z.ZodOptional<z.ZodNullable<z.ZodEnum<["GOOD", "FAIR", "POOR", "DAMAGED"]>>>;
    status: z.ZodOptional<z.ZodEnum<["RETURNED", "LOST"]>>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "RETURNED" | "LOST" | undefined;
    remarks?: string | null | undefined;
    actualReturn?: string | undefined;
    conditionIn?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | null | undefined;
}, {
    status?: "RETURNED" | "LOST" | undefined;
    remarks?: string | null | undefined;
    actualReturn?: string | undefined;
    conditionIn?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | null | undefined;
}>;
export declare const sessionReadinessSchema: z.ZodObject<{
    readinessStatus: z.ZodOptional<z.ZodEnum<["NOT_STARTED", "IN_PREPARATION", "READY", "ISSUE_REPORTED", "COMPLETED"]>>;
    checklist: z.ZodOptional<z.ZodNullable<z.ZodArray<z.ZodObject<{
        key: z.ZodString;
        label: z.ZodString;
        done: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        done: boolean;
        label: string;
        key: string;
    }, {
        done: boolean;
        label: string;
        key: string;
    }>, "many">>>;
    notes: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    notes?: string | null | undefined;
    readinessStatus?: "COMPLETED" | "READY" | "NOT_STARTED" | "IN_PREPARATION" | "ISSUE_REPORTED" | undefined;
    checklist?: {
        done: boolean;
        label: string;
        key: string;
    }[] | null | undefined;
}, {
    notes?: string | null | undefined;
    readinessStatus?: "COMPLETED" | "READY" | "NOT_STARTED" | "IN_PREPARATION" | "ISSUE_REPORTED" | undefined;
    checklist?: {
        done: boolean;
        label: string;
        key: string;
    }[] | null | undefined;
}>;
export declare const faultSchema: z.ZodObject<{
    labId: z.ZodNumber;
    assetId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    faultCategory: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    severity: z.ZodOptional<z.ZodEnum<["LOW", "MEDIUM", "HIGH", "CRITICAL"]>>;
    impact: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    description: string;
    labId: number;
    severity?: "MEDIUM" | "HIGH" | "LOW" | "CRITICAL" | undefined;
    assetId?: number | null | undefined;
    faultCategory?: string | undefined;
    impact?: string | null | undefined;
}, {
    description: string;
    labId: number;
    severity?: "MEDIUM" | "HIGH" | "LOW" | "CRITICAL" | undefined;
    assetId?: number | null | undefined;
    faultCategory?: string | undefined;
    impact?: string | null | undefined;
}>;
export declare const faultStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["OPEN", "ACKNOWLEDGED", "UNDER_DIAGNOSIS", "UNDER_REPAIR", "RESOLVED", "CLOSED"]>;
    note: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "CLOSED" | "OPEN" | "RESOLVED" | "ACKNOWLEDGED" | "UNDER_REPAIR" | "UNDER_DIAGNOSIS";
    note?: string | null | undefined;
}, {
    status: "CLOSED" | "OPEN" | "RESOLVED" | "ACKNOWLEDGED" | "UNDER_REPAIR" | "UNDER_DIAGNOSIS";
    note?: string | null | undefined;
}>;
export declare const repairSchema: z.ZodObject<{
    labId: z.ZodNumber;
    assetId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    faultId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    requestedAction: z.ZodString;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    vendor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    estimatedCost: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    labId: number;
    requestedAction: string;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    assetId?: number | null | undefined;
    vendor?: string | null | undefined;
    faultId?: number | null | undefined;
    estimatedCost?: number | null | undefined;
}, {
    labId: number;
    requestedAction: string;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    assetId?: number | null | undefined;
    vendor?: string | null | undefined;
    faultId?: number | null | undefined;
    estimatedCost?: number | null | undefined;
}>;
export declare const repairUpdateSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["REQUESTED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]>>;
    approvalStatus: z.ZodOptional<z.ZodEnum<["APPROVED", "REJECTED"]>>;
    actualCost: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    postRepairCondition: z.ZodOptional<z.ZodNullable<z.ZodEnum<["GOOD", "FAIR", "POOR", "DAMAGED"]>>>;
    vendor: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status?: "COMPLETED" | "CANCELLED" | "REQUESTED" | "IN_PROGRESS" | undefined;
    remarks?: string | null | undefined;
    vendor?: string | null | undefined;
    approvalStatus?: "APPROVED" | "REJECTED" | undefined;
    actualCost?: number | null | undefined;
    postRepairCondition?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | null | undefined;
}, {
    status?: "COMPLETED" | "CANCELLED" | "REQUESTED" | "IN_PROGRESS" | undefined;
    remarks?: string | null | undefined;
    vendor?: string | null | undefined;
    approvalStatus?: "APPROVED" | "REJECTED" | undefined;
    actualCost?: number | null | undefined;
    postRepairCondition?: "GOOD" | "DAMAGED" | "FAIR" | "POOR" | null | undefined;
}>;
export declare const softwareSchema: z.ZodObject<{
    labId: z.ZodNumber;
    name: z.ZodString;
    version: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    licenseType: z.ZodOptional<z.ZodEnum<["FREE", "PROPRIETARY", "SUBSCRIPTION", "ACADEMIC", "TRIAL"]>>;
    licenseCount: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    expiryDate: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    installationStatus: z.ZodOptional<z.ZodEnum<["INSTALLED", "PENDING", "PARTIAL"]>>;
    vendorRef: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    labId: number;
    version?: string | null | undefined;
    remarks?: string | null | undefined;
    expiryDate?: string | null | undefined;
    licenseType?: "ACADEMIC" | "FREE" | "PROPRIETARY" | "SUBSCRIPTION" | "TRIAL" | undefined;
    licenseCount?: number | null | undefined;
    installationStatus?: "PARTIAL" | "PENDING" | "INSTALLED" | undefined;
    vendorRef?: string | null | undefined;
}, {
    name: string;
    labId: number;
    version?: string | null | undefined;
    remarks?: string | null | undefined;
    expiryDate?: string | null | undefined;
    licenseType?: "ACADEMIC" | "FREE" | "PROPRIETARY" | "SUBSCRIPTION" | "TRIAL" | undefined;
    licenseCount?: number | null | undefined;
    installationStatus?: "PARTIAL" | "PENDING" | "INSTALLED" | undefined;
    vendorRef?: string | null | undefined;
}>;
export declare const softwareRequestSchema: z.ZodObject<{
    labId: z.ZodNumber;
    softwareName: z.ZodString;
    version: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    courseId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    neededBy: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    labId: number;
    softwareName: string;
    version?: string | null | undefined;
    reason?: string | null | undefined;
    courseId?: number | null | undefined;
    neededBy?: string | null | undefined;
}, {
    labId: number;
    softwareName: string;
    version?: string | null | undefined;
    reason?: string | null | undefined;
    courseId?: number | null | undefined;
    neededBy?: string | null | undefined;
}>;
export declare const softwareRequestReviewSchema: z.ZodObject<{
    status: z.ZodEnum<["UNDER_REVIEW", "COMPLETED", "REJECTED"]>;
    resolution: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    status: "COMPLETED" | "REJECTED" | "UNDER_REVIEW";
    resolution?: string | null | undefined;
}, {
    status: "COMPLETED" | "REJECTED" | "UNDER_REVIEW";
    resolution?: string | null | undefined;
}>;
export declare const requirementSchema: z.ZodObject<{
    labId: z.ZodNumber;
    requestType: z.ZodEnum<["NEW_ASSET", "REPLACEMENT", "CONSUMABLES", "SOFTWARE", "REPAIR", "UPGRADE"]>;
    item: z.ZodString;
    quantity: z.ZodOptional<z.ZodNumber>;
    reason: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    academicJustification: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    priority: z.ZodOptional<z.ZodEnum<["LOW", "NORMAL", "HIGH", "URGENT"]>>;
    estimatedCost: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    courseId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    semester: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    studentStrength: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    currentStock: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    item: string;
    requestType: "REPAIR" | "NEW_ASSET" | "REPLACEMENT" | "CONSUMABLES" | "SOFTWARE" | "UPGRADE";
    labId: number;
    reason?: string | null | undefined;
    courseId?: number | null | undefined;
    semester?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    quantity?: number | undefined;
    estimatedCost?: number | null | undefined;
    academicJustification?: string | null | undefined;
    studentStrength?: number | null | undefined;
    currentStock?: number | null | undefined;
}, {
    item: string;
    requestType: "REPAIR" | "NEW_ASSET" | "REPLACEMENT" | "CONSUMABLES" | "SOFTWARE" | "UPGRADE";
    labId: number;
    reason?: string | null | undefined;
    courseId?: number | null | undefined;
    semester?: string | null | undefined;
    priority?: "HIGH" | "LOW" | "NORMAL" | "URGENT" | undefined;
    quantity?: number | undefined;
    estimatedCost?: number | null | undefined;
    academicJustification?: string | null | undefined;
    studentStrength?: number | null | undefined;
    currentStock?: number | null | undefined;
}>;
export declare const requirementDecisionSchema: z.ZodObject<{
    decision: z.ZodEnum<["APPROVE", "REJECT", "FULFILL"]>;
    remarks: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    purchaseRef: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    decision: "APPROVE" | "REJECT" | "FULFILL";
    remarks?: string | null | undefined;
    purchaseRef?: string | null | undefined;
}, {
    decision: "APPROVE" | "REJECT" | "FULFILL";
    remarks?: string | null | undefined;
    purchaseRef?: string | null | undefined;
}>;
export declare const maintenanceSchema: z.ZodObject<{
    labId: z.ZodNumber;
    assetId: z.ZodOptional<z.ZodNullable<z.ZodNumber>>;
    maintenanceType: z.ZodString;
    dueDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    dueDate: string;
    labId: number;
    maintenanceType: string;
    assetId?: number | null | undefined;
}, {
    dueDate: string;
    labId: number;
    maintenanceType: string;
    assetId?: number | null | undefined;
}>;
export declare const maintenanceCompleteSchema: z.ZodObject<{
    result: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    result?: string | null | undefined;
}, {
    result?: string | null | undefined;
}>;
