import { Router } from 'express';
import { asyncHandler } from '../../utils/errors.js';
import { publicViewLimiter } from '../../middleware/rateLimit.js';
import * as certificates from './certificates.js';
export const publicVerificationRouter = Router();
publicVerificationRouter.get('/document/:code', publicViewLimiter, asyncHandler(async (req, res) => {
    res.set('X-Robots-Tag', 'noindex, nofollow');
    const result = await certificates.verifyDocument(req.params.code);
    res.json(result);
}));
