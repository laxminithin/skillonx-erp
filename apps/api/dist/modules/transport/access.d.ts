import type { TransportActor, TransportPermission } from './types.js';
export declare function transportPermissionsForRole(role: string): TransportPermission[];
export declare function hasTransportPermission(actor: TransportActor, permission: TransportPermission): boolean;
export declare function assertTransportPermission(actor: TransportActor, permission: TransportPermission): void;
export declare function assertManagementReadOnly(actor: TransportActor): void;
export declare function assertTransportCollege(table: string, id: number, collegeId: number): Promise<any>;
export declare function assertStudentCollege(studentId: number, collegeId: number): Promise<any>;
export declare function assertActiveTransportMember(studentId: number, collegeId: number): Promise<any>;
export declare function getDriverPersonnelId(facultyUserId: number, collegeId: number): Promise<number | null>;
export declare function assertDriverTripAccess(personnelId: number, tripId: number, collegeId: number): Promise<{
    trip: any;
    assignment: any;
}>;
