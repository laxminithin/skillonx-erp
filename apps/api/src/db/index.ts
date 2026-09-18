import knex, { type Knex } from 'knex';
import { env } from '../config/env.js';

export const db: Knex = knex({
  client: 'mysql2',
  connection: env.DATABASE_URL,
  pool: { min: 0, max: 10 },
});
