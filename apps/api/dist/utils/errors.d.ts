import type { Request, Response, NextFunction } from 'express';
import { type ZodTypeAny, type output } from 'zod';
export declare class AppError extends Error {
    status: number;
    details?: unknown;
    code?: string;
    constructor(status: number, message: string, details?: unknown, code?: string);
}
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): (req: Request, res: Response, next: NextFunction) => void;
export declare function validate<S extends ZodTypeAny>(schema: S, data: unknown): output<S>;
export declare function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): Response<any, Record<string, any>>;
