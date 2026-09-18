export declare function notifyReservationReady(studentId: number, collegeId: number, reservationId: number, title: string): Promise<void>;
export declare function notifyLoanDue(studentId: number, collegeId: number, loanId: number, dueDate: string): Promise<void>;
export declare function notifyLoanOverdue(studentId: number, collegeId: number, loanId: number): Promise<void>;
export declare function notifyFineGenerated(studentId: number, collegeId: number, fineId: number, amount: string): Promise<void>;
export declare function notifyClearanceAchieved(studentId: number, collegeId: number): Promise<void>;
