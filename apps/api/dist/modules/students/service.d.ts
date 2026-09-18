export declare function listStudents(collegeId: number, q?: string): Promise<any[]>;
export declare function getStudent(collegeId: number, studentId: number): Promise<{
    student: {
        id: any;
        name: any;
        usn: any;
        email: any;
        semester: any;
        section: any;
        departmentName: any;
        departmentCode: any;
        createdAt: any;
    };
    history: {
        submissionId: any;
        submittedAt: any;
        surveyId: any;
        title: any;
        surveyType: any;
        identityMode: any;
    }[];
}>;
