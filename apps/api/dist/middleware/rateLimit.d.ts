import type { Request } from 'express';
/**
 * Classroom-safe keying for public write endpoints.
 *
 * A whole classroom shares one NAT / public IP, so a pure per-IP limiter would
 * throttle legitimate students. Instead we bucket by (IP + survey code +
 * student identity): every student gets their own bucket regardless of class
 * size, while a single identity spamming the endpoint is still caught. Identity
 * is the normalized USN on /start and the submission id on /submit.
 */
export declare function publicWriteKey(req: Request): string;
/** Generous per-IP limit for loading a public survey (refreshing is fine). */
export declare const publicViewLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Per-identity limit for start/submit — a single student can retry ~40 times in
 * 10 minutes (network hiccups, back/forward), but no one identity can flood.
 * Because the key includes the identity, 100 different students on the same IP
 * are 100 independent buckets and are never blocked by each other.
 */
export declare const publicWriteLimiter: import("express-rate-limit").RateLimitRequestHandler;
/**
 * Coarse per-IP ceiling that only trips on gross abuse (a bot cycling fake
 * identities). Set well above any realistic class size so a large lecture hall
 * sailing through is never affected.
 */
export declare const publicIpCeilingLimiter: import("express-rate-limit").RateLimitRequestHandler;
