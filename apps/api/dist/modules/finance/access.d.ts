import type { FinanceActor, FinancePermission } from './types.js';
export declare function financePermissionsForRole(role: string): FinancePermission[];
export declare function hasFinancePermission(actor: FinanceActor, permission: FinancePermission): boolean;
export declare function assertFinancePermission(actor: FinanceActor, permission: FinancePermission): void;
export declare function assertFinanceCollege(entityTable: string, entityId: number, collegeId: number): Promise<any>;
export declare function assertStudentCollege(studentId: number, collegeId: number): Promise<any>;
export declare function assertStudentOwnsDemand(studentId: number, demandId: number, collegeId: number): Promise<any>;
export declare function assertStudentOwnsPayment(studentId: number, paymentId: number, collegeId: number): Promise<any>;
export declare function assertStudentOwnsReceipt(studentId: number, receiptId: number, collegeId: number): Promise<any>;
