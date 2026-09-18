import type { ServicesActor, StudentActor } from './types.js';
export declare function getStudentMentor(studentId: number, collegeId: number): Promise<{
    mentor: null;
    recentNotes?: undefined;
} | {
    mentor: {
        assignmentId: number;
        name: any;
        email: any;
        department: any;
        effectiveFrom: any;
    };
    recentNotes: {
        id: number;
        scheduledAt: any;
        status: any;
        notes: any;
    }[];
}>;
export declare function listStudentMeetings(studentId: number, collegeId: number): Promise<{
    id: number;
    status: any;
    meetingType: any;
    scheduledAt: any;
    agenda: any;
    studentVisibleNotes: any;
    followUpDate: any;
    createdAt: any;
}[]>;
export declare function requestMeeting(actor: StudentActor, input: {
    meetingType?: string;
    agenda: string;
    preferredDate?: string | null;
}): Promise<{
    meeting: {
        id: number;
        status: string;
    };
}>;
export declare function mentorListMentees(actor: ServicesActor): Promise<{
    studentId: number;
    name: any;
    usn: any;
    department: any;
    semester: any;
    section: any;
    assignmentId: number;
    pendingMeetings: number;
    pendingRequests: number;
    insights: {
        attendance: number | null;
        cgpa: number | null;
        backlogs: {
            code: any;
            name: any;
            grade: any;
        }[];
        alerts: string[];
    };
}[]>;
export declare function mentorStudentInsights(studentId: number, collegeId: number): Promise<{
    attendance: number | null;
    cgpa: number | null;
    backlogs: {
        code: any;
        name: any;
        grade: any;
    }[];
    alerts: string[];
}>;
export declare function scheduleMeeting(actor: ServicesActor, meetingId: number, input: {
    scheduledAt: string;
    meetingType?: string;
    studentVisibleNotes?: string | null;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function completeMeeting(actor: ServicesActor, meetingId: number, input: {
    studentVisibleNotes?: string | null;
    privateNotes?: string | null;
    followUpDate?: string | null;
    referralStatus?: string | null;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function assignMentor(actor: ServicesActor, studentId: number, mentorFacultyId: number, academicYearId?: number | null): Promise<{
    assignmentId: number;
}>;
export declare function mentorGetMeeting(actor: ServicesActor, meetingId: number): Promise<{
    id: number;
    studentName: any;
    usn: any;
    status: any;
    meetingType: any;
    scheduledAt: any;
    agenda: any;
    studentVisibleNotes: any;
    privateNotes: any;
    followUpDate: any;
    referralStatus: any;
}>;
