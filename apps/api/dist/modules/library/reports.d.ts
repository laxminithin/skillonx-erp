import type { LibraryActor } from './types.js';
export declare function libraryDashboard(actor: LibraryActor): Promise<{
    booksIssuedToday: number;
    returnsToday: number;
    overdueLoans: number;
    activeReservations: number;
    availableCopies: number;
    outstandingFines: string;
}>;
export declare function overdueReport(actor: LibraryActor, filters: {
    memberType?: string;
    daysOverdue?: number;
}): Promise<{
    memberName: any;
    memberIdentifier: any;
    memberType: any;
    title: any;
    accessionNumber: any;
    dueDate: any;
    daysOverdue: number;
    fine: any;
}[]>;
export declare function mostBorrowedReport(actor: LibraryActor, limit?: number): Promise<{
    catalogItemId: number;
    title: string;
    borrowCount: number;
}[]>;
export declare function dailyCirculationReport(actor: LibraryActor, date: string): Promise<{
    date: string;
    issued: any[];
    returned: any[];
}>;
