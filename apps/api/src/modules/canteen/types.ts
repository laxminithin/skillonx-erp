export type CanteenActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string | null;
};

export type CanteenPermission =
  | 'canteen.menu.manage'
  | 'canteen.order.create'
  | 'canteen.order.view'
  | 'canteen.settlement.manage'
  | 'canteen.reports.view';

export const CANTEEN_CUSTOMER_TYPES = ['STUDENT', 'FACULTY', 'STAFF', 'GUEST'] as const;
export const CANTEEN_ORDER_STATUSES = ['PENDING', 'PAID', 'CANCELLED', 'REFUNDED'] as const;
export const CANTEEN_PAYMENT_METHODS = ['CASH', 'CARD', 'UPI'] as const;
