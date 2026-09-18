import { db } from '../../db/index.js';
import { generateDailyTrips } from './trips.js';

/** Idempotent scheduled transport maintenance for a college. */
export async function runTransportJobs(collegeId: number) {
  const today = new Date().toISOString().slice(0, 10);
  const trips = await generateDailyTrips(collegeId, today);

  const expiredPasses = await db('transport_passes')
    .where({ college_id: collegeId, status: 'ACTIVE' })
    .where('valid_until', '<', new Date());
  for (const pass of expiredPasses) {
    await db('transport_passes').where({ id: pass.id }).update({ status: 'EXPIRED' });
  }

  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);
  const vehicles = await db('transport_vehicles').where({ college_id: collegeId, status: 'ACTIVE' });
  let complianceAlerts = 0;
  for (const v of vehicles) {
    for (const field of ['registration_expiry', 'insurance_expiry', 'fitness_expiry', 'permit_expiry', 'pollution_expiry']) {
      const exp = v[field];
      if (exp && String(exp).slice(0, 10) <= soon) complianceAlerts++;
    }
  }

  const personnel = await db('transport_personnel')
    .where({ college_id: collegeId, status: 'ACTIVE' })
    .whereNotNull('license_expiry')
    .where('license_expiry', '<=', soon);
  const licenseAlerts = personnel.length;

  const closedCycles = await db('transport_application_cycles')
    .where({ college_id: collegeId, status: 'OPEN' })
    .where('closes_at', '<', new Date());
  for (const cycle of closedCycles) {
    await db('transport_application_cycles').where({ id: cycle.id }).update({ status: 'CLOSED' });
  }

  return {
    tripsGenerated: trips.filter((t) => !t.skipped).length,
    tripsSkipped: trips.filter((t) => t.skipped).length,
    passesExpired: expiredPasses.length,
    complianceAlerts,
    licenseAlerts,
    cyclesClosed: closedCycles.length,
  };
}

export async function runTransportJobsAllColleges() {
  const colleges = await db('colleges').select('id');
  const results = [];
  for (const c of colleges) {
    if (await db.schema.hasTable('transport_trips')) {
      results.push({ collegeId: Number(c.id), ...(await runTransportJobs(Number(c.id))) });
    }
  }
  return results;
}
