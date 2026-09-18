type FormData = Record<string, unknown>;
export declare function computeStudentAttendance(studentId: number, collegeId: number, formData: FormData): Promise<{
    percentage: number;
    periodLabel: string;
}>;
export {};
