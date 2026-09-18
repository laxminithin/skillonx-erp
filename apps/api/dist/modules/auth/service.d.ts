import { z } from 'zod';
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const forgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
}, {
    email: string;
}>;
export declare const changePasswordSchema: z.ZodEffects<z.ZodObject<{
    currentPassword: z.ZodString;
    newPassword: z.ZodString;
    confirmPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}, {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}>;
export declare const updateProfileSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | null | undefined;
}, {
    name?: string | undefined;
    phone?: string | null | undefined;
}>;
export declare function login(email: string, password: string): Promise<{
    token: string;
    user: any;
}>;
export declare function me(facultyUserId: number): Promise<any>;
export declare function forgotPassword(email: string): Promise<{
    message: string;
}>;
export declare function changePassword(facultyUserId: number, input: {
    currentPassword: string;
    newPassword: string;
}): Promise<{
    message: string;
}>;
export declare function updateProfile(facultyUserId: number, input: {
    name?: string;
    phone?: string | null;
}): Promise<any>;
