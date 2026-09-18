import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { asyncHandler, validate } from '../../utils/errors.js';
import { requireAuth } from '../../middleware/auth.js';
import * as authService from './service.js';
export const authRouter = Router();
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 30 : 500,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many attempts. Please try again later.' },
});
authRouter.post('/login', authLimiter, asyncHandler(async (req, res) => {
    const body = validate(authService.loginSchema, req.body);
    const result = await authService.login(body.email, body.password);
    res.json(result);
}));
authRouter.post('/forgot-password', authLimiter, asyncHandler(async (req, res) => {
    const body = validate(authService.forgotPasswordSchema, req.body);
    const result = await authService.forgotPassword(body.email);
    res.json(result);
}));
authRouter.get('/me', requireAuth, asyncHandler(async (req, res) => {
    const user = await authService.me(req.user.facultyUserId);
    res.json({ user });
}));
authRouter.patch('/profile', requireAuth, asyncHandler(async (req, res) => {
    const body = validate(authService.updateProfileSchema, req.body);
    const user = await authService.updateProfile(req.user.facultyUserId, body);
    res.json({ user });
}));
authRouter.post('/change-password', requireAuth, authLimiter, asyncHandler(async (req, res) => {
    const body = validate(authService.changePasswordSchema, req.body);
    const result = await authService.changePassword(req.user.facultyUserId, {
        currentPassword: body.currentPassword,
        newPassword: body.newPassword,
    });
    res.json(result);
}));
