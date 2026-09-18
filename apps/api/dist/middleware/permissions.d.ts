import type { Response, NextFunction } from 'express';
import { type FacultyPermissionKey } from '../utils/permissions.js';
import type { AuthedRequest } from './auth.js';
export declare function requirePermission(permission: FacultyPermissionKey): (req: AuthedRequest, _res: Response, next: NextFunction) => Promise<void>;
