export type LibraryPermission =
  | 'library.view'
  | 'library.catalog.manage'
  | 'library.circulation.issue'
  | 'library.circulation.return'
  | 'library.reservation.manage'
  | 'library.fines.manage'
  | 'library.fines.waive'
  | 'library.inventory.manage'
  | 'library.report.view'
  | 'library.config.manage';

export type LibraryActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string;
};

export type MemberType = 'STUDENT' | 'FACULTY' | 'STAFF' | 'OTHER';
export type MemberStatus = 'ACTIVE' | 'SUSPENDED' | 'EXPIRED' | 'CLOSED';
export type CopyStatus = 'AVAILABLE' | 'ISSUED' | 'RESERVED' | 'LOST' | 'DAMAGED' | 'REPAIR' | 'WITHDRAWN';
export type LoanStatus = 'ACTIVE' | 'OVERDUE' | 'RETURNED' | 'LOST' | 'DAMAGED';
export type ReservationStatus = 'ACTIVE' | 'READY' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
export type FineType = 'OVERDUE' | 'LOST' | 'DAMAGE' | 'OTHER';
export type FineStatus = 'DUE' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED' | 'CANCELLED';
export type LibraryNoDueStatus = 'CLEAR' | 'DUE' | 'BLOCKED' | 'NOT_APPLICABLE';

export type LibraryNoDueReason =
  | 'ACTIVE_LOAN'
  | 'OVERDUE_LOAN'
  | 'UNPAID_FINE'
  | 'LOST_BOOK'
  | 'NOT_A_MEMBER';
