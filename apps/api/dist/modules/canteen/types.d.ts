export type CanteenActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string | null;
};
export type CanteenPermission = 'canteen.menu.manage' | 'canteen.order.create' | 'canteen.order.view' | 'canteen.settlement.manage' | 'canteen.reports.view';
export declare const CANTEEN_CUSTOMER_TYPES: readonly ["STUDENT", "FACULTY", "STAFF", "GUEST"];
export declare const CANTEEN_ORDER_STATUSES: readonly ["PENDING", "PAID", "CANCELLED", "REFUNDED"];
export declare const CANTEEN_PAYMENT_METHODS: readonly ["CASH", "CARD", "UPI"];
