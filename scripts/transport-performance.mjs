const API = process.env.TRANSPORT_API_URL ?? 'http://127.0.0.1:4000';
const staffPassword = process.env.OFFICE_QA_PASSWORD ?? 'OfficeQA@123';
const studentPassword = process.env.MOBILE_E2E_STUDENT_PASSWORD ?? 'Password123';

async function login(path, email, password) {
  const response = await fetch(`${API}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) });
  if (!response.ok) throw new Error(`login failed: ${response.status} ${email}`);
  return (await response.json()).token;
}

async function measure(name, token, path) {
  const request = async () => {
    const start = performance.now();
    const response = await fetch(`${API}${path}`, { headers: { authorization: `Bearer ${token}` } });
    const elapsed = performance.now() - start;
    if (!response.ok) throw new Error(`${name} failed: ${response.status}`);
    await response.arrayBuffer();
    return elapsed;
  };
  await request();
  const samples = [];
  for (let i = 0; i < 10; i += 1) samples.push(await request());
  const ordered = [...samples].sort((a, b) => a - b);
  return { name, path, samples: samples.map((x) => Number(x.toFixed(2))), averageMs: Number((samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(2)), p95Ms: Number(ordered[Math.ceil(0.95 * ordered.length) - 1].toFixed(2)) };
}

const staff = await login('/api/auth/login', 'qa.transport.office@vviet.edu.in', staffPassword);
const student = await login('/api/student-auth/login', 'e2e.approved@student.skillonx.test', studentPassword);
const management = await login('/api/auth/login', 'qa.management@vviet.edu.in', 'Password123');
const measurements = [
  await measure('Transport Officer dashboard', staff, '/api/transport/dashboard'),
  await measure('Requests and allocations', staff, '/api/transport/applications?status=SUBMITTED'),
  await measure('Routes and stops', staff, '/api/transport/routes'),
  await measure('Vehicles and capacity', staff, '/api/transport/vehicles'),
  await measure('Student Transport overview', student, '/api/student/transport'),
  await measure('Principal/Management aggregate', management, '/api/transport/management/dashboard'),
];
console.log(JSON.stringify({ samplesPerEndpoint: 10, measurements }, null, 2));
