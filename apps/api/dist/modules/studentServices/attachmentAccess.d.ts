export type AttachmentActor = {
    role: string;
    collegeId: number;
    facultyUserId?: number | null;
    departmentId?: number | null;
    studentId?: number | null;
};
export declare function authorizeRequestAttachment(actor: AttachmentActor, attachmentId: number): Promise<any>;
export declare function readRequestAttachment(actor: AttachmentActor, attachmentId: number): Promise<{
    attachment: any;
    body: NonSharedBuffer;
}>;
export declare function authorizeGrievanceAttachment(actor: AttachmentActor, attachmentId: number): Promise<any>;
export declare function readGrievanceAttachment(actor: AttachmentActor, attachmentId: number): Promise<{
    attachment: any;
    body: NonSharedBuffer;
}>;
