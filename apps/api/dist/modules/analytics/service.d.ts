import ExcelJS from 'exceljs';
export declare function listResponses(surveyId: number, collegeId: number): Promise<{
    identityMode: any;
    responses: {
        id: any;
        submittedAt: any;
        attemptNumber: any;
        startedAt: any;
        usn: any;
        name: any;
        email: any;
    }[];
}>;
export declare function getResponseDetail(surveyId: number, collegeId: number, submissionId: number): Promise<{
    identityMode: any;
    submission: {
        id: any;
        submittedAt: any;
        attemptNumber: any;
        student: {
            name: any;
            usn: any;
            email: any;
        } | null;
    };
    answers: {
        questionId: any;
        prompt: any;
        questionType: any;
        textAnswer: any;
        numericAnswer: number | null;
        selectedOptionId: any;
        optionLabel: any;
        jsonAnswer: any;
        comment: any;
    }[];
}>;
export declare function getAnalytics(surveyId: number, collegeId: number): Promise<{
    surveyId: number;
    title: any;
    responses: number;
    started: number;
    completed: number;
    completionRate: number;
    averageRating: number | null;
    participation: null;
    questions: ({
        questionId: any;
        prompt: any;
        questionType: any;
        distribution: {
            optionId: any;
            label: any;
            value: any;
            count: number;
            percent: number;
        }[];
        average: number | null;
        textResponses: never[];
    } | {
        questionId: any;
        prompt: any;
        questionType: any;
        distribution: never[];
        average: null;
        textResponses: any[];
    })[];
}>;
export declare function exportResponses(surveyId: number, collegeId: number, format: 'csv' | 'xlsx'): Promise<{
    contentType: string;
    filename: string;
    body: string;
} | {
    contentType: string;
    filename: string;
    body: Buffer<ExcelJS.Buffer>;
}>;
