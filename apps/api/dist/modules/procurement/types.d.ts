export type ProcurementActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId: number | null;
    role: string;
    name?: string | null;
};
export type ProcurementPermission = 'procurement.view' | 'procurement.indent.create' | 'procurement.indent.approve' | 'procurement.vendor.manage' | 'procurement.rfq.manage' | 'procurement.quotation.manage' | 'procurement.po.create' | 'procurement.po.approve' | 'procurement.grn.create' | 'procurement.finance.handoff' | 'procurement.asset.handoff' | 'inventory.view' | 'inventory.master.manage' | 'inventory.issue' | 'inventory.return' | 'inventory.transfer' | 'inventory.adjust' | 'procurement.analytics.view';
