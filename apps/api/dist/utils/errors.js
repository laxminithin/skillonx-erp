import { ZodError } from 'zod';
export class AppError extends Error {
    status;
    details;
    code;
    constructor(status, message, details, code) {
        super(message);
        this.status = status;
        this.details = details;
        this.code = code;
    }
}
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
export function validate(schema, data) {
    return schema.parse(data);
}
export function errorHandler(err, _req, res, _next) {
    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Validation failed',
            details: err.flatten(),
        });
    }
    if (err instanceof AppError) {
        return res.status(err.status).json({
            error: err.message,
            code: err.code,
            details: err.details,
        });
    }
    // Translate known MySQL errors into clean product messages — never leak SQL.
    const dbErr = err;
    if (dbErr?.code === 'ECONNREFUSED' ||
        dbErr?.code === 'ENOTFOUND' ||
        dbErr?.code === 'ETIMEDOUT' ||
        dbErr?.code === 'PROTOCOL_CONNECTION_LOST' ||
        dbErr?.errno === -61) {
        console.error(err);
        return res.status(503).json({
            error: 'Database is unavailable. For local development ensure Docker MySQL is running on port 3307 (npm run db:up) and DATABASE_URL uses that port.',
            code: 'DB_UNAVAILABLE',
        });
    }
    if (dbErr?.code === 'ER_DUP_ENTRY' || dbErr?.errno === 1062) {
        console.error(err);
        return res.status(409).json({ error: 'That value is already in use.', code: 'DUPLICATE' });
    }
    if (dbErr?.code === 'ER_LOCK_WAIT_TIMEOUT' || dbErr?.errno === 1205) {
        console.error(err);
        return res.status(503).json({ error: 'The server was busy. Please try again.' });
    }
    if (dbErr?.code === 'ER_TRUNCATED_WRONG_VALUE' ||
        dbErr?.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' ||
        dbErr?.errno === 1292) {
        console.error(err);
        return res.status(400).json({ error: 'One of the values is not in a valid format.' });
    }
    if (typeof dbErr?.code === 'string' && dbErr.code.startsWith('ER_')) {
        console.error(err);
        return res.status(400).json({ error: 'The request could not be completed.' });
    }
    console.error(err);
    return res.status(500).json({ error: 'Internal server error' });
}
