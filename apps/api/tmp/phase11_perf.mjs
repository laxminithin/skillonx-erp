const BASE = 'http://localhost:4000';
const PASSWORD = 'Phase11!QA';
const N = Number(process.env.N ?? 60);

async function login(path, email) {
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: PASSWORD }) });
  const j = await r.json();
  if (!j.token) throw new Error(`login failed ${email} ${r.status}`);
  return j.token;
}

function pct(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

async function measure(label, token, method, path, bodyFn) {
  const times = [];
  let status = 0;
  for (let i = 0; i < N + 5; i++) {
    const body = bodyFn ? JSON.stringify(bodyFn(i)) : undefined;
    const t0 = performance.now();
    const r = await fetch(`${BASE}${path}`, { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body });
    await r.arrayBuffer();
    const dt = performance.now() - t0;
    status = r.status;
    if (i >= 5) times.push(dt);
  }
  times.sort((a, b) => a - b);
  return { label, status, n: times.length, p50: +pct(times, 50).toFixed(1), p95: +pct(times, 95).toFixed(1), max: +times[times.length - 1].toFixed(1) };
}

const organizer = await login('/api/auth/login', 'p11.organizer@qa.test');
const facilities = await login('/api/auth/login', 'p11.facilities@qa.test');
const principal = await login('/api/auth/login', 'p11.principal@qa.test');
const student = await login('/api/student-auth/login', 'p11.student@qa.test');

const rows = [];
rows.push(await measure('GET /api/events (list, page 1)', organizer, 'GET', '/api/events?page=1&pageSize=20'));
rows.push(await measure('GET /api/events?q=&status= (filtered)', organizer, 'GET', '/api/events?q=Hack&status=UNDER_REVIEW'));
rows.push(await measure('GET /api/events/:id', organizer, 'GET', '/api/events/107'));
rows.push(await measure('GET /api/events/meta', organizer, 'GET', '/api/events/meta'));
rows.push(await measure('GET /api/events/availability', organizer, 'GET', '/api/events/availability?startsAt=2026-10-14T10:30&endsAt=2026-10-14T11:30'));
rows.push(await measure('GET /api/events/calendar (month)', organizer, 'GET', '/api/events/calendar?from=2026-10-01&to=2026-10-31'));
rows.push(await measure('GET /api/events/:id/registrations', organizer, 'GET', '/api/events/107/registrations'));
rows.push(await measure('GET /api/events/reservations/mine', organizer, 'GET', '/api/events/reservations/mine'));
rows.push(await measure('GET /api/events/review-queue', principal, 'GET', '/api/events/review-queue'));
rows.push(await measure('GET /api/events/reservations/queue', facilities, 'GET', '/api/events/reservations/queue'));
rows.push(await measure('GET /api/events/resources', facilities, 'GET', '/api/events/resources'));
rows.push(await measure('GET /api/events/reports/summary', principal, 'GET', '/api/events/reports/summary'));
rows.push(await measure('GET /api/student/events', student, 'GET', '/api/student/events'));
rows.push(await measure('GET /api/student/events/:id', student, 'GET', '/api/student/events/107'));

const conf = (await (await fetch(`${BASE}/api/events/resources`, { headers: { Authorization: `Bearer ${facilities}` } })).json())
  .find((r) => r.code === 'P11QA-CR1');
const stamp = Date.now();
const created = [];
const write = await measure('POST /api/events/reservations (create, locked txn)', organizer, 'POST', '/api/events/reservations', (i) => {
  const day = String(1 + (i % 28)).padStart(2, '0');
  const hour = String(8 + Math.floor(i / 28)).padStart(2, '0');
  return { resourceId: conf.id, startsAt: `2027-01-${day}T${hour}:00`, endsAt: `2027-01-${day}T${hour}:30`, purpose: 'perf probe', idempotencyKey: `p11-perf-${stamp}-${i}` };
});
rows.push(write);
const replay = await measure('POST /api/events/reservations (idempotent replay)', organizer, 'POST', '/api/events/reservations', () => (
  { resourceId: conf.id, startsAt: '2027-01-01T08:00', endsAt: '2027-01-01T08:30', purpose: 'perf probe', idempotencyKey: `p11-perf-${stamp}-0` }
));
rows.push(replay);

const mine = await (await fetch(`${BASE}/api/events/reservations/mine`, { headers: { Authorization: `Bearer ${organizer}` } })).json();
for (const r of mine.filter((x) => x.purpose === 'perf probe' && x.status !== 'CANCELLED')) {
  await fetch(`${BASE}/api/events/reservations/${r.id}/cancel`, { method: 'POST', headers: { Authorization: `Bearer ${organizer}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'perf probe cleanup' }) });
  created.push(r.id);
}

console.log(JSON.stringify({ n: N, rows, cleanedUpReservations: created.length }, null, 2));
