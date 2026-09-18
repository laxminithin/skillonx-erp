import { z } from 'zod';
export declare const bankItemSchema: z.ZodObject<{
    questionType: z.ZodEnum<["STAR_RATING", "SMILE_RATING", "NUMERICAL", "LIKERT", "MULTIPLE_CHOICE", "CHECKBOX", "YES_NO", "SHORT_ANSWER", "LONG_ANSWER", "DROPDOWN", "RATING"]>;
    prompt: z.ZodString;
    helpText: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    category: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    config: z.ZodNullable<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>>;
    options: z.ZodNullable<z.ZodOptional<z.ZodArray<z.ZodObject<{
        label: z.ZodString;
        value: z.ZodNullable<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        label: string;
        value?: number | null | undefined;
    }, {
        label: string;
        value?: number | null | undefined;
    }>, "many">>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    questionType: "STAR_RATING" | "SMILE_RATING" | "NUMERICAL" | "LIKERT" | "MULTIPLE_CHOICE" | "CHECKBOX" | "YES_NO" | "SHORT_ANSWER" | "LONG_ANSWER" | "DROPDOWN" | "RATING";
    prompt: string;
    tags: string[];
    options?: {
        label: string;
        value?: number | null | undefined;
    }[] | null | undefined;
    category?: string | null | undefined;
    helpText?: string | null | undefined;
    config?: Record<string, unknown> | null | undefined;
}, {
    questionType: "STAR_RATING" | "SMILE_RATING" | "NUMERICAL" | "LIKERT" | "MULTIPLE_CHOICE" | "CHECKBOX" | "YES_NO" | "SHORT_ANSWER" | "LONG_ANSWER" | "DROPDOWN" | "RATING";
    prompt: string;
    options?: {
        label: string;
        value?: number | null | undefined;
    }[] | null | undefined;
    category?: string | null | undefined;
    helpText?: string | null | undefined;
    config?: Record<string, unknown> | null | undefined;
    tags?: string[] | undefined;
}>;
export declare function listBankItems(collegeId: number, tag?: string, q?: string): Promise<{
    id: any;
    questionType: any;
    prompt: any;
    helpText: any;
    category: any;
    config: any;
    options: any;
    tags: string[];
    createdAt: any;
}[]>;
export declare function createBankItem(collegeId: number, createdBy: number, input: z.output<typeof bankItemSchema>): Promise<{
    id: any;
    questionType: any;
    prompt: any;
    helpText: any;
    category: any;
    config: any;
    options: any;
    tags: string[];
    createdAt: any;
} | undefined>;
export declare function updateBankItem(collegeId: number, id: number, input: Partial<z.infer<typeof bankItemSchema>>): Promise<{
    id: any;
    questionType: any;
    prompt: any;
    helpText: any;
    category: any;
    config: any;
    options: any;
    tags: string[];
    createdAt: any;
} | undefined>;
export declare function deleteBankItem(collegeId: number, id: number): Promise<{
    ok: boolean;
}>;
