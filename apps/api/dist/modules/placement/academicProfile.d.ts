export type StudentPlacementAcademicProfile = {
    studentId: number;
    usn: string;
    name: string;
    program: string | null;
    programCode: string | null;
    branch: string | null;
    currentSemester: string | null;
    graduationYear: number | null;
    cgpa: number | null;
    semesterSgpaHistory: Array<{
        semesterLabel: string;
        sgpa: number | null;
    }>;
    activeBacklogs: number;
    historicalBacklogs: number;
    activeBacklogSubjects: string[];
    tenthPercentage: number | null;
    twelfthPercentage: number | null;
    diplomaPercentage: number | null;
    resultStatus: string;
};
export declare function getStudentPlacementAcademicProfile(studentId: number, collegeId: number): Promise<StudentPlacementAcademicProfile>;
export declare function bulkStudentPlacementAcademicProfiles(studentIds: number[], collegeId: number): Promise<Map<number, StudentPlacementAcademicProfile>>;
