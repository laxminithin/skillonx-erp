export type ClassActor = {
    facultyUserId: number;
    collegeId: number;
    departmentId?: number | null;
    role: string;
};
export type ClassAccess = {
    view: boolean;
    manage: boolean;
    approve: boolean;
    share: boolean;
    mapped: boolean;
    coordinator: boolean;
};
export declare function isClassAdmin(role: string): boolean;
export declare function canApproveByRole(role: string): boolean;
export declare function resolveClassAccess(input: {
    role: string;
    isCoordinator: boolean;
    isMapped: boolean;
    canManageAssignment: boolean;
    sameDepartment: boolean;
}): ClassAccess;
