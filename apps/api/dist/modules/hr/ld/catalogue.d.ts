import type { HrActor } from '../types.js';
import type { z } from 'zod';
import type { providerSchema, courseSchema, courseUpdateSchema, programSchema, programUpdateSchema, sessionSchema } from './types.js';
export declare function listProviders(actor: HrActor): Promise<any[]>;
export declare function createProvider(actor: HrActor, input: z.infer<typeof providerSchema>): Promise<{
    id: number;
}>;
export declare function listCourses(actor: HrActor, filters?: {
    category?: string;
    status?: string;
}): Promise<any[]>;
export declare function createCourse(actor: HrActor, input: z.infer<typeof courseSchema>): Promise<{
    id: number;
}>;
export declare function updateCourse(actor: HrActor, courseId: number, input: z.infer<typeof courseUpdateSchema>): Promise<{
    id: number;
}>;
export declare function archiveCourse(actor: HrActor, courseId: number): Promise<{
    id: number;
    status: string;
}>;
export declare function createProgram(actor: HrActor, input: z.infer<typeof programSchema>): Promise<{
    id: number;
}>;
export declare function updateProgram(actor: HrActor, programId: number, input: z.infer<typeof programUpdateSchema>): Promise<{
    id: number;
}>;
export declare function changeProgramStatus(actor: HrActor, programId: number, status: string, reason?: string): Promise<{
    id: number;
    status: string;
}>;
export declare function listPrograms(actor: HrActor, filters?: {
    status?: string;
    category?: string;
}): Promise<any[]>;
export declare function getProgram(actor: HrActor, programId: number): Promise<{
    program: any;
    sessions: any[];
    seats: {
        capacity: any;
        confirmed: number;
        waitlisted: number;
        remaining: number | null;
    };
}>;
export declare function addSession(actor: HrActor, programId: number, input: z.infer<typeof sessionSchema>): Promise<{
    id: number;
}>;
/** Employee-facing catalogue browse: applicable programs open for registration. */
export declare function browseCatalogue(actor: HrActor): Promise<{
    programs: any[];
}>;
