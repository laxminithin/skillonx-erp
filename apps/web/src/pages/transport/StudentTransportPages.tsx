import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../lib/api';
import { Button, Field, Input, PageHeader, Skeleton, Surface, Textarea } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill, statusToneFor, StudentEmpty } from '../lms/studentUi';

type TransportAccess = {
  visibility: string;
  canApply: boolean;
  canAccessOperations: boolean;
  applicationId?: number;
  transportMemberId?: number;
  routeId?: number;
  stopId?: number;
  transportPassId?: number;
};

type TransportHome = {
  access: TransportAccess;
  application: any;
  assignment: any;
  pass: any;
  dues: { totalOutstanding: string; items: any[] };
  todayTrips: any[];
  gpsConfigured: boolean;
};

const visibilityLabels: Record<string, string> = {
  APPLICATION_AVAILABLE: 'Apply for Transport',
  APPLICATION_DRAFT: 'Continue Application',
  APPLICATION_PENDING: 'Application Status',
  WAITLISTED: 'Waitlist Status',
  APPROVED: 'Approval Status',
  PAYMENT_PENDING: 'Payment Pending',
  ASSIGNMENT_PENDING: 'Assignment Pending',
  ACTIVE: 'Transport Home',
  CHANGE_PENDING: 'Change Request Pending',
  CANCELLATION_PENDING: 'Cancellation Pending',
  FORMER_USER: 'Transport History',
};

export function StudentTransportHomePage() {
  const [data, setData] = useState<TransportHome | null>(null);
  useDocumentTitle('Transport');

  useEffect(() => {
    api<TransportHome>('/api/student/transport').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  const { access, application, assignment, pass, dues, todayTrips } = data;

  if (access.visibility === 'HIDDEN') {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Transport" subtitle="Campus transport" />
        <StudentEmpty title="Transport unavailable" body="Transport applications are currently closed or you are not eligible." />
      </div>
    );
  }

  if (['APPLICATION_AVAILABLE', 'APPLICATION_DRAFT'].includes(access.visibility)) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Transport" subtitle={visibilityLabels[access.visibility]} />
        <Surface className="p-6 text-center">
          <p className="text-ink-muted mb-4">Apply for campus transport for the current academic year.</p>
          <Link to="/lms/transport/apply">
            <Button>{access.visibility === 'APPLICATION_DRAFT' ? 'Continue Application' : 'Apply for Transport'}</Button>
          </Link>
        </Surface>
      </div>
    );
  }

  if (['APPLICATION_PENDING', 'WAITLISTED', 'APPROVED', 'PAYMENT_PENDING', 'ASSIGNMENT_PENDING'].includes(access.visibility)) {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Transport Application" subtitle={visibilityLabels[access.visibility]} />
        {application && (
          <Surface className="space-y-3 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">Application No: {application.applicationNumber}</h2>
              <StatusPill tone={statusToneFor(application.status)}>{application.status.replace(/_/g, ' ')}</StatusPill>
            </div>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div><span className="text-ink-muted">Pickup Stop:</span> {application.pickupStopName ?? '—'}</div>
              <div><span className="text-ink-muted">Drop Stop:</span> {application.dropStopName ?? '—'}</div>
            </div>
          </Surface>
        )}
        {access.visibility === 'PAYMENT_PENDING' && Number(dues.totalOutstanding) > 0 && (
          <Surface className="p-4">
            <p className="text-sm">Outstanding transport dues: ₹{dues.totalOutstanding}</p>
            <Link to="/lms/fees" className="mt-2 inline-block"><Button size="sm">Pay Transport Fee</Button></Link>
          </Surface>
        )}
      </div>
    );
  }

  if (access.visibility === 'FORMER_USER') {
    return (
      <div className="animate-fade-in space-y-6">
        <PageHeader title="Transport History" subtitle="Previous transport records" />
        <div className="flex flex-wrap gap-2">
          <Link to="/lms/transport/history"><Button variant="secondary">Previous Routes</Button></Link>
          <Link to="/lms/transport/clearance"><Button variant="secondary">Clearance Status</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport" subtitle={assignment?.routeName ?? 'Your transport service'} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Route</p>
          <p className="mt-1 font-semibold">{assignment?.routeName ?? '—'}</p>
          <p className="text-sm text-ink-muted">{assignment?.routeCode}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Pickup / Drop</p>
          <p className="mt-1 font-semibold">{assignment?.pickupStop?.name ?? '—'}</p>
          <p className="text-sm text-ink-muted">{assignment?.dropStop?.name ?? '—'}</p>
        </Surface>
        <Surface className="p-4">
          <p className="text-xs uppercase text-ink-muted">Vehicle</p>
          <p className="mt-1 font-semibold">{assignment?.vehicle?.vehicleNumber ?? 'Not assigned'}</p>
        </Surface>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/lms/transport/pass"><Button variant="secondary">Transport Pass</Button></Link>
        <Link to="/lms/transport/route"><Button variant="secondary">My Route</Button></Link>
        <Link to="/lms/transport/trips"><Button variant="secondary">Today&apos;s Trips</Button></Link>
        <Link to="/lms/transport/changes"><Button variant="secondary">Change Request</Button></Link>
        <Link to="/lms/transport/complaints"><Button variant="secondary">Complaints</Button></Link>
        <Link to="/lms/transport/clearance"><Button variant="secondary">Clearance</Button></Link>
        <Link to="/lms/transport/history"><Button variant="secondary">History</Button></Link>
      </div>
      {todayTrips.length > 0 && (
        <Surface className="divide-y">
          <p className="p-4 text-sm font-semibold">Today&apos;s Service</p>
          {todayTrips.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4 text-sm">
              <span>{t.tripType.replace(/_/g, ' ')}</span>
              <StatusPill tone={statusToneFor(t.status)}>{t.status}</StatusPill>
            </div>
          ))}
        </Surface>
      )}
      {!data.gpsConfigured && (
        <p className="text-xs text-ink-muted">Live Tracking Not Configured</p>
      )}
    </div>
  );
}

export function StudentTransportApplyPage() {
  const [stops, setStops] = useState<any[]>([]);
  const [applicationId, setApplicationId] = useState<number | undefined>();
  const [form, setForm] = useState({ pickupStopPreferenceId: 0, dropStopPreferenceId: 0, emergencyContactName: '', emergencyContactPhone: '', rulesAccepted: false, declarationAccepted: false });
  useDocumentTitle('Apply for Transport');

  useEffect(() => {
    api<{ application: any; stops: any[] }>('/api/student/transport/application').then((d) => {
      setStops(d.stops ?? []);
      if (d.application) {
        setApplicationId(d.application.id);
        setForm({
          pickupStopPreferenceId: d.application.pickupStopPreferenceId ?? 0,
          dropStopPreferenceId: d.application.dropStopPreferenceId ?? 0,
          emergencyContactName: d.application.emergencyContactName ?? '',
          emergencyContactPhone: d.application.emergencyContactPhone ?? '',
          rulesAccepted: d.application.rulesAccepted,
          declarationAccepted: d.application.declarationAccepted,
        });
      }
    });
  }, []);

  const save = async (submit = false) => {
    const path = applicationId ? `/api/student/transport/application/${applicationId}` : '/api/student/transport/application';
    const method = applicationId ? 'PATCH' : 'POST';
    const result = await api<any>(path, { method, body: JSON.stringify(form) });
    setApplicationId(result.id ?? applicationId);
    if (submit && (result.id ?? applicationId)) {
      await api(`/api/student/transport/application/${result.id ?? applicationId}/submit`, { method: 'POST' });
      window.location.href = '/lms/transport';
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport Application" subtitle="Transport-specific information only" />
      <Surface className="space-y-4 p-4">
        <p className="text-sm text-ink-muted">Your academic details are already on file. Choose your stops below.</p>
        <Field label="Pickup Stop">
          <select className="w-full rounded-lg border px-3 py-2" value={form.pickupStopPreferenceId} onChange={(e) => setForm({ ...form, pickupStopPreferenceId: Number(e.target.value) })}>
            <option value={0}>Select stop</option>
            {stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Drop Stop">
          <select className="w-full rounded-lg border px-3 py-2" value={form.dropStopPreferenceId} onChange={(e) => setForm({ ...form, dropStopPreferenceId: Number(e.target.value) })}>
            <option value={0}>Select stop</option>
            {stops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Emergency Contact Name"><Input value={form.emergencyContactName} onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })} /></Field>
        <Field label="Emergency Contact Phone"><Input value={form.emergencyContactPhone} onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.rulesAccepted} onChange={(e) => setForm({ ...form, rulesAccepted: e.target.checked })} /> I accept transport rules</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.declarationAccepted} onChange={(e) => setForm({ ...form, declarationAccepted: e.target.checked })} /> I confirm the declaration</label>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => save(false)}>Save Draft</Button>
          <Button onClick={() => save(true)}>Submit Application</Button>
        </div>
      </Surface>
    </div>
  );
}

export function StudentTransportPassPage() {
  const [pass, setPass] = useState<any>(null);
  useDocumentTitle('Transport Pass');
  useEffect(() => { api<{ pass: any }>('/api/student/transport/pass').then((d) => setPass(d.pass)).catch(() => setPass(null)); }, []);
  if (!pass) return <StudentEmpty title="No active pass" body="Your transport pass is not yet active." />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport Pass" subtitle={pass.passNumber} />
      <Surface className="mx-auto max-w-sm space-y-4 p-6 text-center">
        <p className="font-semibold">{pass.student?.name}</p>
        <p className="text-sm text-ink-muted">{pass.student?.usn}</p>
        <p className="text-sm">{pass.route?.name}</p>
        <p className="text-sm text-ink-muted">{pass.pickupStop} → {pass.dropStop}</p>
        <StatusPill tone={statusToneFor(pass.status)}>{pass.status}</StatusPill>
        <div className="flex justify-center"><QRCodeSVG value={pass.verificationToken} size={160} /></div>
        <p className="text-xs text-ink-muted">Valid until {new Date(pass.validUntil).toLocaleDateString()}</p>
      </Surface>
    </div>
  );
}

export function StudentTransportRoutePage() {
  const [assignment, setAssignment] = useState<any>(null);
  useDocumentTitle('My Route');
  useEffect(() => { api<{ assignment: any }>('/api/student/transport/route').then((d) => setAssignment(d.assignment)).catch(() => setAssignment(null)); }, []);
  if (!assignment) return <StudentEmpty title="No route assigned" body="You do not have an active transport route assignment." />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My Route" subtitle={assignment.routeName} />
      <Surface className="divide-y">
        {assignment.stops?.map((s: any) => (
          <div key={s.sequenceNumber} className="flex items-center justify-between p-4 text-sm">
            <span>{s.sequenceNumber}. {s.stopName}</span>
            <span className="text-ink-muted">{s.scheduledPickupTime ?? '—'}</span>
          </div>
        ))}
      </Surface>
    </div>
  );
}

export function StudentTransportTripsPage() {
  const [trips, setTrips] = useState<any[]>([]);
  useDocumentTitle("Today's Trips");
  useEffect(() => { api<{ trips: any[] }>('/api/student/transport/trips/today').then((d) => setTrips(d.trips)).catch(() => setTrips([])); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Today's Trips" />
      <Surface className="divide-y">
        {trips.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div><p className="font-medium">{t.tripType.replace(/_/g, ' ')}</p><p className="text-ink-muted">{t.vehicleNumber ?? 'Vehicle TBD'}</p></div>
            <StatusPill tone={statusToneFor(t.status)}>{t.status}</StatusPill>
          </div>
        ))}
        {trips.length === 0 && <p className="p-4 text-sm text-ink-muted">No trips scheduled for today.</p>}
      </Surface>
    </div>
  );
}

export function StudentTransportChangesPage() {
  const [changes, setChanges] = useState<any[]>([]);
  const [form, setForm] = useState({ changeType: 'PICKUP_STOP_CHANGE', reason: '', requestedPickupStopId: 0 });
  useDocumentTitle('Change Request');
  const load = () => api<{ changes: any[] }>('/api/student/transport/changes').then((d) => setChanges(d.changes)).catch(() => setChanges([]));
  useEffect(() => { load(); }, []);
  const submit = () => api('/api/student/transport/changes', { method: 'POST', body: JSON.stringify(form) }).then(load);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Change Request" />
      <Surface className="space-y-3 p-4">
        <Field label="Change Type">
          <select className="w-full rounded-lg border px-3 py-2" value={form.changeType} onChange={(e) => setForm({ ...form, changeType: e.target.value })}>
            <option value="PICKUP_STOP_CHANGE">Pickup Stop Change</option>
            <option value="DROP_STOP_CHANGE">Drop Stop Change</option>
            <option value="ROUTE_CHANGE">Route Change</option>
          </select>
        </Field>
        <Field label="Reason"><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></Field>
        <Button onClick={submit}>Submit Request</Button>
      </Surface>
      <Surface className="divide-y">
        {changes.map((c) => (
          <div key={c.id} className="flex items-center justify-between p-4 text-sm">
            <span>{c.changeType.replace(/_/g, ' ')}</span>
            <StatusPill tone={statusToneFor(c.status)}>{c.status}</StatusPill>
          </div>
        ))}
      </Surface>
    </div>
  );
}

export function StudentTransportComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([]);
  const [form, setForm] = useState({ category: 'DELAY', description: '' });
  useDocumentTitle('Transport Complaints');
  const load = () => api<{ complaints: any[] }>('/api/student/transport/complaints').then((d) => setComplaints(d.complaints)).catch(() => setComplaints([]));
  useEffect(() => { load(); }, []);
  const submit = () => api('/api/student/transport/complaints', { method: 'POST', body: JSON.stringify(form) }).then(() => { setForm({ category: 'DELAY', description: '' }); load(); });
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport Complaints" />
      <Surface className="space-y-3 p-4">
        <Field label="Category">
          <select className="w-full rounded-lg border px-3 py-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {['DELAY', 'DRIVER_BEHAVIOR', 'OVERCROWDING', 'ROUTE', 'STOP', 'VEHICLE_CONDITION', 'SAFETY', 'OTHER'].map((c) => (
              <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </Field>
        <Field label="Description"><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <Button onClick={submit}>Submit Complaint</Button>
      </Surface>
      <Surface className="divide-y">
        {complaints.map((c) => (
          <div key={c.id} className="p-4 text-sm">
            <div className="flex items-center justify-between"><span className="font-medium">{c.category}</span><StatusPill tone={statusToneFor(c.status)}>{c.status}</StatusPill></div>
            <p className="mt-1 text-ink-muted">{c.description}</p>
          </div>
        ))}
      </Surface>
    </div>
  );
}

export function StudentTransportClearancePage() {
  const [data, setData] = useState<any>(null);
  useDocumentTitle('Transport Clearance');
  useEffect(() => { api('/api/student/transport/clearance').then(setData).catch(() => setData(null)); }, []);
  if (!data) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport Clearance" />
      <Surface className="p-4">
        <StatusPill tone={statusToneFor(data.transport?.status)}>{data.transport?.status}</StatusPill>
        {data.transport?.reasons?.length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-sm text-ink-muted">
            {data.transport.reasons.map((r: string) => <li key={r}>{r.replace(/_/g, ' ')}</li>)}
          </ul>
        )}
      </Surface>
    </div>
  );
}

export function StudentTransportHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  useDocumentTitle('Transport History');
  useEffect(() => { api<{ history: any[] }>('/api/student/transport/history').then((d) => setHistory(d.history)).catch(() => setHistory([])); }, []);
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Transport History" />
      <Surface className="divide-y">
        {history.map((h) => (
          <div key={h.id} className="p-4 text-sm">
            <p className="font-medium">{h.routeName}</p>
            <p className="text-ink-muted">{h.pickupStop} → {h.dropStop} · {h.status}</p>
          </div>
        ))}
        {history.length === 0 && <p className="p-4 text-sm text-ink-muted">No transport history.</p>}
      </Surface>
    </div>
  );
}
