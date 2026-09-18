import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Load monorepo root `.env` reliably whether we run from:
 * - apps/api (npm run dev -w)
 * - repo root (npm run dev:api)
 * - compiled dist/
 */
function loadEnvFile() {
  const candidates = [
    path.resolve(__dirname, '../../../../.env'), // src/config → repo root
    path.resolve(__dirname, '../../../.env'), // dist/config → repo root (alt depth)
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), '../../.env'),
  ];
  for (const candidate of candidates) {
    if (!fs.existsSync(candidate)) continue;
    const result = dotenv.config({ path: candidate });
    if (!result.error) return candidate;
  }
  dotenv.config();
  return null;
}

const loadedFrom = loadEnvFile();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  PUBLIC_APP_URL: z.string().default('http://localhost:5173'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// Local docker-compose publishes MySQL on host port 3307. A URL without an
// explicit port silently defaults to 3306 and yields Internal Server Error on login.
if (env.NODE_ENV !== 'production') {
  try {
    const u = new URL(env.DATABASE_URL);
    if ((u.protocol === 'mysql:' || u.protocol === 'mysql2:') && !u.port) {
      console.warn(
        `[env] DATABASE_URL has no port (MySQL defaults to 3306).` +
          ` Docker Compose expects 3307. Loaded from: ${loadedFrom || 'process.env'}`,
      );
    }
  } catch {
    /* ignore parse errors — knex will surface connection failures */
  }
  if (loadedFrom) {
    console.log(`[env] loaded ${loadedFrom}`);
  }
}
