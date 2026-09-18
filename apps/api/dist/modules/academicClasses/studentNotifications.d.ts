type NotifyInput = {
    studentId: number;
    collegeId: number;
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
    relatedType?: string | null;
    relatedId?: string | number | null;
    classId?: number | null;
    courseId?: number | null;
    dedupeKeyOverride?: string | null;
};
export declare function notifyStudent(input: NotifyInput): Promise<any>;
export declare function notifyEnrollmentApproved(studentId: number, collegeId: number, classId: number, className: string): Promise<void>;
export declare function listNotifications(studentId: number, opts?: {
    page?: number;
    limit?: number;
}): Promise<{
    notifications: {
        id: number;
        type: any;
        title: any;
        body: any;
        link: any;
        courseId: number | null;
        status: any;
        createdAt: any;
        readAt: any;
    }[];
    unread: number;
    page: number;
    limit: number;
    total: number;
}>;
export declare function markNotificationRead(studentId: number, id: number): Promise<{
    ok: boolean;
}>;
export declare function markAllNotificationsRead(studentId: number): Promise<{
    ok: boolean;
}>;
export declare function markAnnouncementRead(studentId: number, announcementId: number): Promise<{
    ok: boolean;
}>;
export declare function notifyApprovedClass(input: {
    collegeId: number;
    classId: number;
    type: string;
    title: string;
    body?: string | null;
    link?: string | null;
    relatedType?: string | null;
    relatedId?: string | number | null;
    courseId?: number | null;
    dedupeKeyPrefix?: string | null;
}): Promise<{
    notified: number;
}>;
export declare function unreadAnnouncementIds(studentId: number, announcementIds: number[]): Promise<Set<number>>;
export {};
