import { type ClassActor } from '../academicClasses/access.js';
export declare function canScheduleTimetable(actor: ClassActor, access: {
    manage: boolean;
}): boolean;
export declare function assertCanScheduleClass(actor: ClassActor, classId: number): Promise<{
    classRow: {
        [x: string]: any;
    };
    access: import("../academicClasses/access.js").ClassAccess;
}>;
export declare function assertCanViewClassSchedule(actor: ClassActor, classId: number): Promise<{
    classRow: {
        [x: string]: any;
    };
    access: import("../academicClasses/access.js").ClassAccess;
}>;
export declare function assertInstitutionAdmin(actor: ClassActor): void;
export declare function assertPeriodAdmin(actor: ClassActor): void;
