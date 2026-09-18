export declare function studentHallTicket(studentId: number, collegeId: number, examId: number): Promise<{
    institution: any;
    student: {
        id: number;
        name: any;
        usn: any;
        photoUrl: any;
        program: any;
        branch: any;
        semester: any;
    };
    exam: {
        id: number;
        name: any;
        code: any;
        type: any;
        startDate: any;
        endDate: any;
    };
    subjects: {
        courseCode: any;
        courseName: any;
        examDate: any;
        startTime: any;
        endTime: any;
        room: string | null;
        seatNumber: any;
        status: any;
    }[];
    withheldSubjects: {
        courseCode: any;
        courseName: any;
        status: any;
        reason: any;
    }[];
}>;
export declare function studentUpcomingExams(studentId: number, collegeId: number): Promise<{
    examId: number;
    examName: any;
    examType: any;
    courseCode: any;
    courseName: any;
    examDate: any;
    startTime: any;
    endTime: any;
    eligibilityStatus: any;
    room: string | null;
    seatNumber: any;
}[]>;
