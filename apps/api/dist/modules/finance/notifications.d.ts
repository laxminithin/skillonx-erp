export declare function notifyPaymentSuccess(studentId: number, collegeId: number, amount: unknown, receiptNumber?: string): Promise<void>;
export declare function notifyPaymentFailed(studentId: number, collegeId: number): Promise<void>;
export declare function notifyReceiptGenerated(studentId: number, collegeId: number, receiptNumber: string): Promise<void>;
export declare function notifyFeeDueSoon(studentId: number, collegeId: number, dueDate: string, amount: string): Promise<void>;
export declare function notifyFeeOverdue(studentId: number, collegeId: number, amount: string): Promise<void>;
export declare function notifyScholarshipSanctioned(studentId: number, collegeId: number, amount: unknown): Promise<void>;
export declare function notifyRefundProcessed(studentId: number, collegeId: number, amount: unknown): Promise<void>;
