import { Router } from 'express';
import { asyncHandler, validate } from '../../utils/errors.js';
import {
  publicViewLimiter,
  publicWriteLimiter,
  publicIpCeilingLimiter,
} from '../../middleware/rateLimit.js';
import * as publicService from './service.js';
import * as quizPublic from '../quizzes/attemptService.js';
import * as assignmentPublic from '../assignments/attemptService.js';

export const publicRouter = Router();

publicRouter.get(
  '/s/:code',
  publicViewLimiter,
  asyncHandler(async (req, res) => {
    const data = await publicService.getPublicSurvey(req.params.code);
    res.json(data);
  }),
);

publicRouter.post(
  '/s/:code/start',
  publicIpCeilingLimiter,
  publicWriteLimiter,
  asyncHandler(async (req, res) => {
    const body = validate(publicService.studentInfoSchema, req.body);
    const result = await publicService.startSubmission(req.params.code, body, {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    res.status(201).json(result);
  }),
);

publicRouter.post(
  '/s/:code/submit',
  publicIpCeilingLimiter,
  publicWriteLimiter,
  asyncHandler(async (req, res) => {
    const body = validate(publicService.submitSchema, req.body);
    const result = await publicService.submitAnswers(req.params.code, body);
    res.json(result);
  }),
);

publicRouter.get(
  '/q/:code',
  publicViewLimiter,
  asyncHandler(async (req, res) => {
    const data = await quizPublic.getPublicQuiz(req.params.code);
    res.json(data);
  }),
);

publicRouter.post(
  '/q/:code/start',
  publicIpCeilingLimiter,
  publicWriteLimiter,
  asyncHandler(async (req, res) => {
    const body = validate(quizPublic.studentInfoSchema, req.body);
    const result = await quizPublic.startAttempt(req.params.code, body, {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    res.status(201).json(result);
  }),
);

publicRouter.patch(
  '/q/:code/answers',
  publicIpCeilingLimiter,
  publicWriteLimiter,
  asyncHandler(async (req, res) => {
    const body = validate(quizPublic.saveAnswersSchema, req.body);
    const result = await quizPublic.saveAttemptAnswers(req.params.code, body);
    res.json(result);
  }),
);

publicRouter.post(
  '/q/:code/submit',
  publicIpCeilingLimiter,
  publicWriteLimiter,
  asyncHandler(async (req, res) => {
    const body = validate(quizPublic.submitSchema, req.body);
    const result = await quizPublic.submitAttempt(req.params.code, body);
    res.json(result);
  }),
);

publicRouter.get(
  '/q/:code/attempt/:token',
  publicViewLimiter,
  asyncHandler(async (req, res) => {
    const result = await quizPublic.getAttempt(req.params.code, req.params.token);
    res.json(result);
  }),
);

publicRouter.get(
  '/a/:code',
  publicViewLimiter,
  asyncHandler(async (req, res) => {
    const data = await assignmentPublic.getPublicAssignment(req.params.code);
    res.json(data);
  }),
);

publicRouter.post(
  '/a/:code/start',
  publicIpCeilingLimiter,
  publicWriteLimiter,
  asyncHandler(async (req, res) => {
    const body = validate(assignmentPublic.studentInfoSchema, req.body);
    const result = await assignmentPublic.startSubmission(req.params.code, body, {
      ip: req.ip,
      userAgent: req.get('user-agent') ?? undefined,
    });
    res.status(201).json(result);
  }),
);

publicRouter.patch(
  '/a/:code/answers',
  publicIpCeilingLimiter,
  publicWriteLimiter,
  asyncHandler(async (req, res) => {
    const body = validate(assignmentPublic.saveAnswersSchema, req.body);
    const result = await assignmentPublic.saveDraftAnswers(req.params.code, body);
    res.json(result);
  }),
);

publicRouter.post(
  '/a/:code/submit',
  publicIpCeilingLimiter,
  publicWriteLimiter,
  asyncHandler(async (req, res) => {
    const body = validate(assignmentPublic.submitSchema, req.body);
    const result = await assignmentPublic.submitSubmission(req.params.code, body);
    res.json(result);
  }),
);

publicRouter.get(
  '/a/:code/submission/:token',
  publicViewLimiter,
  asyncHandler(async (req, res) => {
    const result = await assignmentPublic.getSubmission(req.params.code, req.params.token);
    res.json(result);
  }),
);
