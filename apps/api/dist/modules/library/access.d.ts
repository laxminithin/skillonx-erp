import type { LibraryActor, LibraryPermission } from './types.js';
export declare function libraryPermissionsForRole(role: string): LibraryPermission[];
export declare function hasLibraryPermission(actor: LibraryActor, permission: LibraryPermission): boolean;
export declare function assertLibraryPermission(actor: LibraryActor, permission: LibraryPermission): void;
export declare function assertLibraryCollege(table: string, id: number, collegeId: number): Promise<any>;
export declare function assertMemberOwnsResource(memberId: number, studentId: number, collegeId: number): Promise<any>;
export declare function assertFacultyOwnsResource(memberId: number, facultyId: number, collegeId: number): Promise<any>;
