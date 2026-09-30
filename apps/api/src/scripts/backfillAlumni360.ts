#!/usr/bin/env node
/**
 * CLI: backfill Alumni 360 foundation from existing records.
 * Usage: npx tsx src/scripts/backfillAlumni360.ts [collegeId]
 */
import { backfillAlumni360 } from '../modules/alumni/backfill360.js';

const collegeId = process.argv[2] ? Number(process.argv[2]) : undefined;
const result = await backfillAlumni360(Number.isFinite(collegeId) ? collegeId : undefined);
console.log(JSON.stringify(result, null, 2));
process.exit(0);
