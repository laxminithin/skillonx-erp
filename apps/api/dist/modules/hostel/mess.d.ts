import type { HostelActor } from './types.js';
export declare function getStudentMess(studentId: number, collegeId: number): Promise<{
    messPlan: {
        id: number;
        name: any;
        planType: any;
        monthlyAmount: any;
    } | null;
    assignmentStartAt: any;
}>;
export declare function getMessMenu(collegeId: number, hostelId?: number, date?: string): Promise<{
    date: string;
    meals: never[];
    cycleName?: undefined;
} | {
    date: string;
    cycleName: any;
    meals: {
        mealType: any;
        items: any;
        timing: any;
    }[];
}>;
export declare function getWeeklyMenu(collegeId: number, hostelId?: number): Promise<({
    date: string;
    meals: never[];
    cycleName?: undefined;
} | {
    date: string;
    cycleName: any;
    meals: {
        mealType: any;
        items: any;
        timing: any;
    }[];
})[]>;
export declare function submitMessFeedback(studentId: number, collegeId: number, input: {
    mealDate: string;
    mealType: string;
    rating: number;
    category?: string;
    comment?: string;
}): Promise<{
    id: number;
    status: string;
}>;
export declare function listMessPlans(actor: HostelActor, hostelId?: number): Promise<{
    id: number;
    name: any;
    planType: any;
    monthlyAmount: number | null;
    hostelId: number | null;
}[]>;
export declare function createMessPlan(actor: HostelActor, input: {
    name: string;
    planType: string;
    monthlyAmount?: number;
    hostelId?: number;
}): Promise<{
    id: number;
    name: string;
    planType: string;
}>;
