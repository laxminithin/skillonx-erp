import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { normalizeUsn } from '../types/domain.js';

/**
 * Classroom-safe keying for public write endpoints.
 *
 * A whole classroom shares one NAT / public IP, so a pure per-IP limiter would
 * throttle legitimate students. Instead we bucket by (IP + survey code +
 * student identity): every student gets their own bucket regardless of class
 * size, while a single identity spamming the endpoint is still caught. Identity
 * is the normalized USN on /start and the submission id on /submit.
 */
export function publicWriteKey(req: Request): string {
  const ip = req.ip ?? 'unknown';
  const code = String((req.params as Record<string, string>)?.code ?? '');
  const body = (req.body ?? {}) as { usn?: unknown; submissionId?: unknown; attemptToken?: unknown };
  const identity =
    body.usn != null
      ? normalizeUsn(String(body.usn))
      : body.submissionId != null
        ? `sub:${String(body.submissionId)}`
        : body.attemptToken != null
          ? `att:${String(body.attemptToken)}`
          : 'anon';
  return `${ip}|${code}|${identity}`;
}

// `validate: false` silences the library's startup warnings for our
// intentionally custom keyGenerator; the limiters themselves stay enabled.
const sharedOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
};

/** Generous per-IP limit for loading a public survey (refreshing is fine). */
export const publicViewLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 5 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests, please try again in a few minutes.' },
});

/**
 * Per-identity limit for start/submit — a single student can retry ~40 times in
 * 10 minutes (network hiccups, back/forward), but no one identity can flood.
 * Because the key includes the identity, 100 different students on the same IP
 * are 100 independent buckets and are never blocked by each other.
 */
export const publicWriteLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 10 * 60 * 1000,
  max: 40,
  keyGenerator: publicWriteKey,
  message: { error: 'Too many attempts for this response. Please wait a moment and try again.' },
});

/**
 * Coarse per-IP ceiling that only trips on gross abuse (a bot cycling fake
 * identities). Set well above any realistic class size so a large lecture hall
 * sailing through is never affected.
 */
export const publicIpCeilingLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests from this network. Please try again later.' },
});
