export declare function listResults(quizId: number, collegeId: number): Promise<{
    summary: {
        attempted: number;
        averageMarks: number;
        highestMarks: number;
        lowestMarks: number;
        passPercentage: number;
        completion: number;
    };
    attempts: any[];
}>;
export declare function getAttemptDetail(quizId: number, collegeId: number, token: string): Promise<{
    attemptToken: any;
    attemptNumber: number;
    studentName: any;
    usn: any;
    email: any;
    startedAt: any;
    submittedAt: any;
    timeTakenSeconds: number;
    obtainedMarks: number;
    totalMarks: number;
    percentage: number;
    passed: boolean;
    status: any;
    questions: {
        id: number;
        questionText: string;
        questionType: "SHORT_ANSWER" | "SINGLE_CHOICE" | "MULTIPLE_SELECT" | "TRUE_FALSE" | "NUMERIC";
        marks: number;
        explanation: string | null | undefined;
        moduleName: string | null | undefined;
        options: {
            id: number;
            label: string;
            isCorrect: boolean;
        }[];
        correctOptionIds: number[];
        numericAnswer: number | null | undefined;
        studentOptionIds: number[];
        studentNumericAnswer: number | null;
        studentTextAnswer: any;
        awardedMarks: number;
        isCorrect: boolean | null;
    }[];
}>;
export declare function getQuizAnalytics(quizId: number, collegeId: number): Promise<{
    kind: string;
    overview: {
        attempted: number;
        averageMarks: number;
        averagePercentage: number;
        highestMarks: number;
        lowestMarks: number;
        passPercentage: number;
    };
    attempted: number;
    averageMarks: number;
    averagePercentage: number;
    highestMarks: number;
    lowestMarks: number;
    passPercentage: number;
    questions: {
        id: number;
        questionText: string;
        moduleId: number | null | undefined;
        moduleName: string | null | undefined;
        correctPct: number;
        incorrectPct: number;
        unansweredPct: number;
        appeared: number;
    }[];
    questionPerformance: {
        id: number;
        questionText: string;
        moduleId: number | null | undefined;
        moduleName: string | null | undefined;
        correctPct: number;
        incorrectPct: number;
        unansweredPct: number;
        appeared: number;
    }[];
    modulePerformance: {
        moduleName: string;
        averagePct: number;
    }[];
    coPerformance: ({
        coCode: string;
        coStatement: string | null;
        status: "NOT_ASSESSED";
        questionCount: number;
        availableMarks: number;
        marksAwarded: number | null;
        averagePerformancePct: number | null;
        correctResponseRate: number | null;
        note: string;
    } | {
        coCode: string;
        coStatement: string | null;
        status: "ASSESSED";
        questionCount: number;
        availableMarks: number;
        marksAwarded: number;
        averagePerformancePct: number;
        correctResponseRate: number;
        note: string;
    })[];
    label: string;
}>;
export declare function exportResults(quizId: number, collegeId: number, format: 'csv' | 'xlsx'): Promise<{
    filename: string;
    contentType: string;
    body: Buffer<ArrayBuffer>;
}>;
