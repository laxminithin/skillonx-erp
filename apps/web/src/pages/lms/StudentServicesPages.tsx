import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  ChevronRight,
  FileText,
  MessageSquareWarning,
  Plus,
  UserRound,
} from 'lucide-react';
import { api } from '../../lib/api';
import { Button, Field, Input, PageHeader, Select, Skeleton, Surface, Textarea } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { StatusPill, StudentEmpty, statusToneFor } from './studentUi';

type RequestType = {
  code: string;
  label: string;
  category: string;
  description: string;
  instructions?: string;
  estimatedProcess?: string;
  generatesCertificate: boolean;
  formSchema: Array<{
    key: string;
    label: string;
    type: string;
    required?: boolean;
    options?: string[];
    placeholder?: string;
  }>;
};

type ServiceRequest = {
  id: number;
  requestNumber: string | null;
  requestTypeLabel: string | null;
  title: string;
  status: string;
  currentStage: string | null;
  submittedAt: string | null;
  updatedAt: string;
};

type TimelineStep = {
  stepOrder: number;
  label: string;
  status: string;
  remarks?: string | null;
  actedAt?: string | null;
};

export function StudentServicesHomePage() {
  const [data, setData] = useState<{
    requestTypes: RequestType[];
    counts: { pendingRequests: number; certificates: number; openGrievances: number; alerts: number };
    mentor: { name: string; department: string } | null;
  } | null>(null);
  useDocumentTitle('Services');
  useEffect(() => {
    api<NonNullable<typeof data>>('/api/student/services').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  const certificates = data.requestTypes.filter((t) => t.category === 'CERTIFICATE');
  const requests = data.requestTypes.filter((t) => t.category !== 'CERTIFICATE');

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Academic Services"
        subtitle="Request certificates, submit corrections, file grievances, and connect with your mentor — without visiting departments."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Pending Requests', value: data.counts.pendingRequests, to: '/lms/services/requests' },
          { label: 'Certificates', value: data.counts.certificates, to: '/lms/services/certificates' },
          { label: 'Grievances', value: data.counts.openGrievances, to: '/lms/services/grievances' },
          { label: 'Alerts', value: data.counts.alerts, to: '/lms/services/alerts' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong">
            <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
            <p className="mt-1 text-xs text-ink-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {data.mentor ? (
        <Surface className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <UserRound className="h-8 w-8 text-accent" />
            <div>
              <p className="text-sm text-ink-muted">Your Mentor</p>
              <p className="font-semibold">{data.mentor.name}</p>
              <p className="text-xs text-ink-muted">{data.mentor.department}</p>
            </div>
          </div>
          <Link to="/lms/services/mentor" className="inline-flex items-center rounded-[var(--radius-md)] border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-muted">
            View
          </Link>
        </Surface>
      ) : null}

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          <Award className="h-4 w-4" /> Certificates
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {certificates.map((t) => (
            <Link
              key={t.code}
              to={`/lms/services/requests/new?type=${t.code}`}
              className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong"
            >
              <div>
                <p className="font-medium">{t.label}</p>
                <p className="mt-0.5 text-xs text-ink-muted line-clamp-2">{t.description}</p>
                {t.estimatedProcess ? <p className="mt-1 text-[11px] text-accent">{t.estimatedProcess}</p> : null}
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink-muted">
          <FileText className="h-4 w-4" /> Academic Requests
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {requests.map((t) => (
            <Link
              key={t.code}
              to={`/lms/services/requests/new?type=${t.code}`}
              className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong"
            >
              <div>
                <p className="font-medium">{t.label}</p>
                <p className="mt-0.5 text-xs text-ink-muted line-clamp-2">{t.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-ink-muted" />
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/lms/services/grievances/new" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong">
          <MessageSquareWarning className="h-6 w-6 text-warning" />
          <div>
            <p className="font-medium">File a Grievance</p>
            <p className="text-xs text-ink-muted">Academic, examination, facilities, and more</p>
          </div>
        </Link>
        <Link to="/lms/services/requests" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong">
          <FileText className="h-6 w-6 text-accent" />
          <div>
            <p className="font-medium">My Requests</p>
            <p className="text-xs text-ink-muted">Track status and download documents</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function StudentRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('My Requests');
  useEffect(() => {
    api<{ requests: ServiceRequest[] }>('/api/student/requests')
      .then((d) => setRequests(d.requests))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Requests"
        subtitle="Track your academic service requests"
        actions={
          <Link to="/lms/services" className="inline-flex items-center rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-sm font-medium text-white">
            <Plus className="mr-1 h-4 w-4" />New Request
          </Link>
        }
      />
      {requests.length === 0 ? (
        <StudentEmpty title="No requests yet" body="Start by selecting a service from the Services home." action={<Link to="/lms/services" className="mt-4 inline-flex rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-medium text-white">Browse Services</Link>} />
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <Link key={r.id} to={`/lms/services/requests/${r.id}`} className="block rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-ink-muted">{r.requestTypeLabel}</p>
                  <p className="font-semibold">{r.title}</p>
                  {r.requestNumber ? <p className="mt-0.5 font-mono text-xs text-ink-muted">{r.requestNumber}</p> : null}
                </div>
                <StatusPill tone={statusToneFor(r.status)}>{r.status.replace(/_/g, ' ')}</StatusPill>
              </div>
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-muted">
                {r.currentStage ? <span>Stage: {r.currentStage}</span> : null}
                {r.submittedAt ? <span>Submitted: {formatDate(r.submittedAt)}</span> : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentNewRequestPage() {
  const [searchParams] = useSearchParams();
  const typeCode = searchParams.get('type') ?? '';
  const navigate = useNavigate();
  const [type, setType] = useState<RequestType | null>(null);
  const [title, setTitle] = useState('');
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [ownCertificates, setOwnCertificates] = useState<Array<{ id: number; documentType: string; certificateNumber: string; status: string }>>([]);
  useDocumentTitle('New Request');

  useEffect(() => {
    api<{ requestTypes: RequestType[] }>('/api/student/services').then((d) => {
      const found = d.requestTypes.find((t) => t.code === typeCode);
      setType(found ?? null);
      if (found) setTitle(found.label);
    });
  }, [typeCode]);

  // DUPLICATE_CERTIFICATE's `originalDocumentId` field has no static option
  // list (it depends on what the student already holds) — populate it from
  // their own certificates instead of leaving the generic select empty.
  useEffect(() => {
    if (typeCode !== 'DUPLICATE_CERTIFICATE') return;
    api<{ certificates: typeof ownCertificates }>('/api/student/certificates').then((d) => {
      setOwnCertificates(d.certificates.filter((c) => c.status === 'VALID'));
    });
  }, [typeCode]);

  async function handleSubmit(draft: boolean) {
    if (!type) return;
    setSaving(true);
    try {
      const created = await api<{ id: number }>('/api/student/requests', {
        method: 'POST',
        body: JSON.stringify({
          requestTypeCode: type.code,
          title,
          formData,
        }),
      });
      if (!draft) {
        await api(`/api/student/requests/${created.id}/submit`, { method: 'POST' });
      }
      navigate(`/lms/services/requests/${created.id}`);
    } finally {
      setSaving(false);
    }
  }

  if (!type) return <StudentEmpty title="Request type not found" body="Select a service from the Services home." />;

  return (
    <div className="animate-fade-in max-w-xl">
      <PageHeader title={type.label} subtitle={type.description} />
      {type.instructions ? (
        <Surface className="mb-4 text-sm text-ink-secondary">{type.instructions}</Surface>
      ) : null}
      <Surface className="space-y-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <Input className="mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {type.formSchema.map((field) => (
          <div key={field.key}>
            <label className="text-sm font-medium">
              {field.label}
              {field.required ? ' *' : ''}
            </label>
            {field.type === 'textarea' ? (
              <Textarea
                className="mt-1"
                value={formData[field.key] ?? ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              />
            ) : field.type === 'select' && field.key === 'originalDocumentId' ? (
              <select
                className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm"
                value={formData[field.key] ?? ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              >
                <option value="">Select a certificate…</option>
                {ownCertificates.map((c) => (
                  <option key={c.id} value={c.id}>{c.documentType.replace(/_/g, ' ')} — {c.certificateNumber}</option>
                ))}
              </select>
            ) : field.type === 'select' ? (
              <select
                className="mt-1 w-full rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2 text-sm"
                value={formData[field.key] ?? ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
              >
                <option value="">Select…</option>
                {(field.options ?? []).map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            ) : (
              <Input
                className="mt-1"
                type={field.type === 'date' ? 'date' : field.type === 'number' ? 'number' : 'text'}
                value={formData[field.key] ?? ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                placeholder={field.placeholder}
              />
            )}
          </div>
        ))}
        <div className="flex gap-2 pt-2">
          <Button disabled={saving} onClick={() => handleSubmit(false)}>Submit Request</Button>
          <Button variant="secondary" disabled={saving} onClick={() => handleSubmit(true)}>Save Draft</Button>
        </div>
      </Surface>
    </div>
  );
}

export function StudentRequestDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<{
    id: number;
    requestNumber: string | null;
    title: string;
    status: string;
    currentStage: string | null;
    type: { label: string } | null;
    timeline: TimelineStep[];
    comments: Array<{ id: number; body: string; authorName: string; isStudent: boolean; createdAt: string }>;
    document: { id: number; certificateNumber: string; verificationCode: string } | null;
  } | null>(null);
  const [response, setResponse] = useState('');
  useDocumentTitle('Request Detail');

  useEffect(() => {
    if (!id) return;
    api<NonNullable<typeof data>>(`/api/student/requests/${id}`).then(setData).catch(() => setData(null));
  }, [id]);

  if (!data) return <Skeleton className="h-40 w-full" />;

  async function handleRespond() {
    if (!id || !response.trim()) return;
    await api(`/api/student/requests/${id}/respond`, { method: 'POST', body: JSON.stringify({ body: response }) });
    const updated = await api<NonNullable<typeof data>>(`/api/student/requests/${id}`);
    setData(updated);
    setResponse('');
  }

  return (
    <div className="animate-fade-in max-w-2xl">
      <PageHeader
        title={data.title}
        subtitle={data.requestNumber ?? undefined}
        actions={<StatusPill tone={statusToneFor(data.status)}>{data.status.replace(/_/g, ' ')}</StatusPill>}
      />

      {data.currentStage ? (
        <Surface className="mb-4 text-sm">Current stage: <strong>{data.currentStage}</strong></Surface>
      ) : null}

      <Surface className="mb-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-ink-muted">Timeline</h3>
        <ol className="space-y-4">
          <li className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success text-[10px] text-white">✓</span>
            <div><p className="font-medium">Submitted</p></div>
          </li>
          {data.timeline.map((step) => (
            <li key={step.stepOrder} className="flex gap-3">
              <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] text-white ${
                step.status === 'COMPLETED' ? 'bg-success' : step.status === 'IN_PROGRESS' ? 'bg-accent' : step.status === 'REJECTED' ? 'bg-danger' : 'bg-surface-muted text-ink-muted'
              }`}>
                {step.status === 'COMPLETED' ? '✓' : step.status === 'IN_PROGRESS' ? '●' : '○'}
              </span>
              <div>
                <p className="font-medium">{step.label}</p>
                {step.status === 'IN_PROGRESS' ? <p className="text-xs text-accent">In Progress</p> : null}
                {step.remarks ? <p className="mt-1 text-sm text-ink-secondary">{step.remarks}</p> : null}
              </div>
            </li>
          ))}
        </ol>
      </Surface>

      {data.document ? (
        <Surface className="mb-4">
          <p className="font-medium">Certificate Ready</p>
          <p className="font-mono text-sm text-ink-muted">{data.document.certificateNumber}</p>
          <Link to={`/lms/services/certificates/${data.document.id}`} className="mt-3 inline-flex rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-sm font-medium text-white">
            View Certificate
          </Link>
        </Surface>
      ) : null}

      {data.comments.length > 0 ? (
        <Surface className="mb-4">
          <h3 className="mb-3 text-sm font-semibold">Conversation</h3>
          <div className="space-y-3">
            {data.comments.map((c) => (
              <div key={c.id} className={`rounded-lg p-3 text-sm ${c.isStudent ? 'bg-accent-soft ml-4' : 'bg-surface-muted mr-4'}`}>
                <p className="text-xs font-medium text-ink-muted">{c.authorName}</p>
                <p className="mt-1">{c.body}</p>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      {data.status === 'ACTION_REQUIRED' ? (
        <Surface>
          <h3 className="mb-2 text-sm font-semibold">Your Response</h3>
          <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Type your response…" />
          <Button className="mt-2" size="sm" onClick={handleRespond}>Send Response</Button>
        </Surface>
      ) : null}
    </div>
  );
}

export function StudentCertificatesPage() {
  const [certs, setCerts] = useState<Array<{ id: number; documentType: string; certificateNumber: string; status: string; issuedAt: string }>>([]);
  useDocumentTitle('Certificates');
  useEffect(() => {
    api<{ certificates: typeof certs }>('/api/student/certificates').then((d) => setCerts(d.certificates));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="My Certificates" subtitle="Download your issued academic documents" />
      {certs.length === 0 ? (
        <StudentEmpty title="No certificates yet" body="Certificates appear here after your requests are approved and processed." />
      ) : (
        <div className="space-y-3">
          {certs.map((c) => (
            <Link key={c.id} to={`/lms/services/certificates/${c.id}`} className="flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong">
              <div>
                <p className="font-medium">{c.documentType.replace(/_/g, ' ')}</p>
                <p className="font-mono text-xs text-ink-muted">{c.certificateNumber}</p>
                <p className="text-xs text-ink-muted">Issued {formatDate(c.issuedAt)}</p>
              </div>
              <StatusPill tone={c.status === 'VALID' ? 'success' : 'muted'}>{c.status}</StatusPill>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentCertificateDetailPage() {
  const { id } = useParams();
  const [cert, setCert] = useState<{
    id: number;
    documentType: string;
    certificateNumber: string;
    verificationCode: string;
    status: string;
    documentData: { renderedBody?: string; studentName?: string; usn?: string; collegeName?: string };
    issuedAt: string;
  } | null>(null);
  useDocumentTitle('Certificate');

  useEffect(() => {
    if (!id) return;
    api<NonNullable<typeof cert>>(`/api/student/certificates/${id}`).then(setCert);
  }, [id]);

  if (!cert) return <Skeleton className="h-40 w-full" />;

  const verifyUrl = `${window.location.origin}/verify/document/${cert.verificationCode}`;

  return (
    <div className="animate-fade-in">
      <div className="mb-4 flex gap-2 print:hidden">
        <Button size="sm" onClick={() => window.print()}>Print</Button>
        <Link to="/lms/services/certificates" className="inline-flex rounded-[var(--radius-md)] border border-border px-3 py-1.5 text-sm">Back</Link>
      </div>
      <article className="certificate-print mx-auto max-w-[210mm] border border-border bg-white p-8 text-black shadow-sm print:border-0 print:shadow-none">
        <header className="border-b border-gray-300 pb-4 text-center">
          <p className="text-lg font-bold">{cert.documentData.collegeName ?? 'Institution'}</p>
          <h1 className="mt-2 text-xl font-semibold uppercase tracking-wide">{cert.documentType.replace(/_/g, ' ')}</h1>
          <p className="mt-1 font-mono text-sm text-gray-600">{cert.certificateNumber}</p>
        </header>
        <div className="certificate-body my-8 whitespace-pre-wrap text-base leading-relaxed">
          {cert.documentData.renderedBody ?? `Certificate for ${cert.documentData.studentName} (${cert.documentData.usn})`}
        </div>
        <footer className="mt-8 flex items-end justify-between border-t border-gray-300 pt-4 text-sm">
          <div>
            <p>Issued: {formatDate(cert.issuedAt)}</p>
            <p className="mt-1 text-xs text-gray-500">Verify: {verifyUrl}</p>
          </div>
          <div className="text-right">
            <p className="border-t border-gray-400 pt-1">Authorized Signatory</p>
          </div>
        </footer>
        <div className="mt-4 text-center print:block">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(verifyUrl)}`}
            alt="Verification QR"
            className="mx-auto h-20 w-20"
          />
        </div>
      </article>
    </div>
  );
}

type GrievanceCategory = {
  code: string;
  label: string;
  defaultConfidentiality: string;
  routingModule?: string | null;
};

type StudentGrievance = {
  id: number;
  grievanceNumber?: string;
  caseNumber?: string;
  category: string;
  caseType?: string;
  subject: string;
  description?: string;
  status: string;
  requesterVisibleStatus?: string;
  priority?: string;
  confidentiality: string;
  submittedAt?: string;
  dueAt?: string | null;
  expectedResponseBy?: string | null;
  resolutionSummary?: string | null;
  studentAcknowledged?: boolean;
  timeline?: Array<{ type: string; from?: string | null; to?: string | null; message?: string | null; createdAt: string }>;
  messages?: Array<{ id: number; author: string; body: string; createdAt: string }>;
  attachments?: Array<{ id: number; fileName: string; mimeType: string; fileSize: number; visibility: string; createdAt: string }>;
  appeals?: Array<{ id: number; reason: string; status: string; createdAt: string }>;
};

function prettyLabel(value?: string | null) {
  return String(value ?? '').replace(/_/g, ' ');
}

export function StudentGrievancesPage() {
  const [grievances, setGrievances] = useState<StudentGrievance[]>([]);
  useDocumentTitle('Support Cases');
  useEffect(() => {
    api<{ grievances: typeof grievances }>('/api/student/grievances').then((d) => setGrievances(d.grievances));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Support Cases"
        subtitle="Raise and track grievances, welfare concerns, and routed institutional support."
        actions={<Link to="/lms/services/grievances/new" className="inline-flex rounded-[var(--radius-md)] bg-accent px-3 py-1.5 text-sm font-medium text-white">Raise Concern</Link>}
      />
      {grievances.length === 0 ? (
        <StudentEmpty title="No cases yet" body="You can raise a concern when you need institutional review or support." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {grievances.map((g) => (
            <Link key={g.id} to={`/lms/services/grievances/${g.id}`} className="block rounded-[var(--radius-lg)] border border-border bg-surface p-4 hover:border-border-strong">
              <div className="flex justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-ink-muted">{prettyLabel(g.category)} · {prettyLabel(g.confidentiality)}</p>
                  <p className="font-semibold">{g.subject}</p>
                  <p className="font-mono text-xs text-ink-muted">{g.caseNumber ?? g.grievanceNumber}</p>
                  {g.dueAt ? <p className="mt-1 text-xs text-ink-muted">Target resolution: {formatDate(g.dueAt)}</p> : null}
                </div>
                <StatusPill tone={statusToneFor(g.status)}>{prettyLabel(g.requesterVisibleStatus ?? g.status)}</StatusPill>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentNewGrievancePage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<GrievanceCategory[]>([]);
  const [category, setCategory] = useState('GENERAL_GRIEVANCE');
  const [confidentiality, setConfidentiality] = useState('NORMAL');
  const [priority, setPriority] = useState('NORMAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [studentUrgencyReason, setStudentUrgencyReason] = useState('');
  const [saving, setSaving] = useState(false);
  useDocumentTitle('Raise Concern');

  useEffect(() => {
    api<{ categories: GrievanceCategory[] }>('/api/student/grievance-categories').then((d) => {
      setCategories(d.categories);
      if (d.categories[0]) {
        setCategory(d.categories[0].code);
        setConfidentiality(d.categories[0].defaultConfidentiality || 'NORMAL');
      }
    }).catch(() => setCategories([]));
  }, []);

  async function handleSubmit() {
    setSaving(true);
    try {
      const g = await api<{ id: number }>('/api/student/grievances', {
        method: 'POST',
        body: JSON.stringify({ category, subject, description, priority, confidentiality, studentUrgencyReason }),
      });
      navigate(`/lms/services/grievances/${g.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader title="Raise a Concern" subtitle="Share what happened. The case will be routed to authorized staff on a need-to-know basis." />
      <Surface className="mb-4 border-l-4 border-l-warning">
        <p className="text-sm text-ink-secondary">For immediate danger, contact campus security or local emergency services directly. This system records, routes, and tracks institutional follow-up.</p>
      </Surface>
      <Surface className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Category">
            <Select value={category} onChange={(e) => {
              const next = e.target.value;
              setCategory(next);
              setConfidentiality(categories.find((c) => c.code === next)?.defaultConfidentiality || 'NORMAL');
            }}>
              {categories.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
            </Select>
          </Field>
          <Field label="Confidentiality">
            <Select value={confidentiality} onChange={(e) => setConfidentiality(e.target.value)}>
              <option value="NORMAL">Normal</option>
              <option value="CONFIDENTIAL">Confidential</option>
              <option value="RESTRICTED">Restricted</option>
            </Select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>
          <Field label="Urgency">
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </Field>
        </div>
        <Field label="What would you like reviewed?">
          <Textarea rows={7} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <Field label="Why does this need faster attention?" optional>
          <Textarea rows={3} value={studentUrgencyReason} onChange={(e) => setStudentUrgencyReason(e.target.value)} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button disabled={saving || !subject.trim() || !description.trim()} onClick={handleSubmit}>Submit Case</Button>
          <Link to="/lms/services/grievances" className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-border px-3.5 text-sm font-medium">Cancel</Link>
        </div>
      </Surface>
    </div>
  );
}

export function StudentGrievanceDetailPage() {
  const { id } = useParams();
  const [g, setG] = useState<StudentGrievance | null>(null);
  const [response, setResponse] = useState('');
  const [appealReason, setAppealReason] = useState('');
  useDocumentTitle('Case Detail');

  async function load() {
    if (!id) return;
    api<NonNullable<typeof g>>(`/api/student/grievances/${id}`).then(setG);
  }

  useEffect(() => { load(); }, [id]);

  if (!g) return <Skeleton className="h-40 w-full" />;

  async function acknowledge() {
    if (!id) return;
    await api(`/api/student/grievances/${id}/acknowledge`, { method: 'POST' });
    await load();
  }

  async function sendResponse() {
    if (!id || !response.trim()) return;
    await api(`/api/student/grievances/${id}/respond`, { method: 'POST', body: JSON.stringify({ body: response }) });
    setResponse('');
    await load();
  }

  async function unresolved() {
    if (!id) return;
    await api(`/api/student/grievances/${id}/feedback`, { method: 'POST', body: JSON.stringify({ feedback: 'UNRESOLVED', reason: appealReason || 'Needs another review' }) });
    await load();
  }

  async function appeal() {
    if (!id || !appealReason.trim()) return;
    await api(`/api/student/grievances/${id}/appeal`, { method: 'POST', body: JSON.stringify({ reason: appealReason }) });
    setAppealReason('');
    await load();
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      <PageHeader title={g.subject} subtitle={g.caseNumber ?? g.grievanceNumber} actions={<StatusPill tone={statusToneFor(g.status)}>{prettyLabel(g.requesterVisibleStatus ?? g.status)}</StatusPill>} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Surface className="space-y-3">
            <div className="flex flex-wrap gap-2 text-xs">
              <StatusPill tone="muted">{prettyLabel(g.category)}</StatusPill>
              <StatusPill tone={g.confidentiality === 'RESTRICTED' ? 'danger' : g.confidentiality === 'CONFIDENTIAL' ? 'warning' : 'muted'}>{prettyLabel(g.confidentiality)}</StatusPill>
              {g.priority ? <StatusPill tone={statusToneFor(g.priority)}>{prettyLabel(g.priority)}</StatusPill> : null}
            </div>
            {g.submittedAt ? <p className="text-sm text-ink-muted">Submitted {formatDate(g.submittedAt)}</p> : null}
            {g.description ? <p className="whitespace-pre-wrap text-sm leading-6">{g.description}</p> : null}
            {g.expectedResponseBy ? <p className="text-sm text-ink-muted">Expected first response by {formatDate(g.expectedResponseBy)}</p> : null}
            {g.dueAt ? <p className="text-sm text-ink-muted">Target resolution by {formatDate(g.dueAt)}</p> : null}
          </Surface>

          {g.messages?.length ? (
            <Surface>
              <h3 className="mb-3 text-sm font-semibold">Conversation</h3>
              <div className="space-y-3">
                {g.messages.map((m) => (
                  <div key={m.id} className={`rounded-lg p-3 text-sm ${m.author === 'STUDENT' ? 'bg-accent-soft ml-4' : 'bg-surface-muted mr-4'}`}>
                    <p className="text-xs font-medium text-ink-muted">{m.author === 'STUDENT' ? 'You' : 'Case team'} · {formatDate(m.createdAt)}</p>
                    <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
              </div>
            </Surface>
          ) : null}

          {g.status === 'PENDING_INFORMATION' ? (
            <Surface>
              <h3 className="mb-2 text-sm font-semibold">Your Response</h3>
              <Textarea value={response} onChange={(e) => setResponse(e.target.value)} placeholder="Add the requested clarification" />
              <Button className="mt-2" size="sm" disabled={!response.trim()} onClick={sendResponse}>Send Response</Button>
            </Surface>
          ) : null}
        </div>

        <div className="space-y-4">
          <Surface>
            <h3 className="mb-3 text-sm font-semibold">Timeline</h3>
            <ol className="space-y-3">
              {(g.timeline ?? []).map((event, index) => (
                <li key={`${event.type}-${index}`} className="flex gap-3 text-sm">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="font-medium">{prettyLabel(event.type)}</p>
                    {event.message ? <p className="text-ink-muted">{event.message}</p> : null}
                    <p className="text-xs text-ink-muted">{formatDate(event.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Surface>

          <Surface>
            <h3 className="mb-2 text-sm font-semibold">Attachments</h3>
            {(g.attachments ?? []).length ? (
              <div className="space-y-2">
                {(g.attachments ?? []).map((a) => (
                  <a
                    key={a.id}
                    href={`/api/student/grievance-attachments/${a.id}/download`}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm hover:border-border-strong"
                  >
                    <span className="min-w-0 truncate">{a.fileName}</span>
                    <span className="shrink-0 text-xs text-ink-muted">{prettyLabel(a.visibility)}</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink-muted">No attachments have been added.</p>
            )}
          </Surface>

          <Surface>
            <h3 className="mb-2 text-sm font-semibold">Resolution</h3>
            {!g.resolutionSummary ? <p className="text-sm text-ink-muted">No resolution has been posted yet.</p> : null}
            {g.resolutionSummary ? (
              <div>
                <p className="whitespace-pre-wrap text-sm">{g.resolutionSummary}</p>
                {g.status === 'RESOLVED' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={acknowledge}>Accept</Button>
                    <Button variant="secondary" size="sm" onClick={unresolved}>Still Unresolved</Button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </Surface>

        {g.resolutionSummary ? (
          <Surface>
            <h3 className="mb-2 text-sm font-semibold">Appeal</h3>
            <Textarea rows={3} value={appealReason} onChange={(e) => setAppealReason(e.target.value)} placeholder="Why should this be reviewed again?" />
            <Button className="mt-2" variant="secondary" size="sm" disabled={!appealReason.trim()} onClick={appeal}>Submit Appeal</Button>
          </Surface>
        ) : null}
        </div>
      </div>
    </div>
  );
}

export function StudentMentorPage() {
  const [data, setData] = useState<{
    mentor: { name: string; email: string; department: string } | null;
    recentNotes: Array<{ scheduledAt: string; notes: string }>;
  } | null>(null);
  const [meetings, setMeetings] = useState<Array<{ id: number; status: string; agenda: string; scheduledAt: string | null; studentVisibleNotes: string | null }>>([]);
  const [actions, setActions] = useState<Array<{ id: number; title: string; description: string | null; owner: string; status: string; priority: string; dueDate: string | null }>>([]);
  const [followUps, setFollowUps] = useState<Array<{ id: number; followUpDate: string; category: string | null; agenda: string }>>([]);
  const [agenda, setAgenda] = useState('');
  useDocumentTitle('My Mentor');

  useEffect(() => {
    api<NonNullable<typeof data>>('/api/student/mentor').then(setData);
    api<{ meetings: typeof meetings }>('/api/student/mentor/meetings').then((d) => setMeetings(d.meetings));
    api<{ actions: typeof actions }>('/api/student/mentoring/actions').then((d) => setActions(d.actions)).catch(() => {});
    api<{ followUps: typeof followUps }>('/api/student/mentoring/follow-ups').then((d) => setFollowUps(d.followUps)).catch(() => {});
  }, []);

  const openActions = actions.filter((a) => a.status !== 'COMPLETED' && a.status !== 'CANCELLED');
  const doneActions = actions.filter((a) => a.status === 'COMPLETED');

  async function requestMeeting() {
    if (!agenda.trim()) return;
    await api('/api/student/mentor/meetings', { method: 'POST', body: JSON.stringify({ agenda, meetingType: 'ACADEMIC' }) });
    setAgenda('');
    const d = await api<{ meetings: typeof meetings }>('/api/student/mentor/meetings');
    setMeetings(d.meetings);
  }

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in max-w-xl">
      <PageHeader title="My Mentor" subtitle="Academic advising and support" />
      {data.mentor ? (
        <Surface className="mb-4">
          <p className="font-semibold">{data.mentor.name}</p>
          <p className="text-sm text-ink-muted">{data.mentor.department}</p>
          {data.mentor.email ? <p className="text-sm">{data.mentor.email}</p> : null}
        </Surface>
      ) : (
        <StudentEmpty title="No mentor assigned" body="A faculty mentor will be assigned by your department." />
      )}

      <Surface className="mb-4">
        <h3 className="mb-2 text-sm font-semibold">Request Meeting</h3>
        <Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="What would you like to discuss?" />
        <Button className="mt-2" size="sm" disabled={!agenda.trim()} onClick={requestMeeting}>Request Meeting</Button>
      </Surface>

      {followUps.length > 0 ? (
        <Surface className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">My Follow-ups</h3>
          <div className="space-y-2">
            {followUps.map((f) => (
              <div key={f.id} className="rounded-lg border border-border p-3 text-sm">
                <p className="font-medium">{f.agenda}</p>
                <p className="mt-1 text-xs text-ink-muted">Follow-up: {formatDate(f.followUpDate)}{f.category ? ` · ${f.category.replace(/_/g, ' ')}` : ''}</p>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      {openActions.length > 0 ? (
        <Surface className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">My Action Items</h3>
          <div className="space-y-2">
            {openActions.map((a) => (
              <div key={a.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{a.title}</p>
                  <StatusPill tone={statusToneFor(a.status)}>{a.status}</StatusPill>
                </div>
                {a.description ? <p className="mt-1 text-ink-secondary">{a.description}</p> : null}
                {a.dueDate ? <p className="mt-1 text-xs text-ink-muted">Due {formatDate(a.dueDate)}</p> : null}
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      {doneActions.length > 0 ? (
        <Surface className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">My Progress</h3>
          <div className="space-y-1 text-sm">
            {doneActions.map((a) => (
              <p key={a.id} className="text-ink-secondary">✓ {a.title}</p>
            ))}
          </div>
        </Surface>
      ) : null}

      {meetings.length > 0 ? (
        <Surface>
          <h3 className="mb-3 text-sm font-semibold">Meeting History</h3>
          <div className="space-y-3">
            {meetings.map((m) => (
              <div key={m.id} className="rounded-lg border border-border p-3 text-sm">
                <div className="flex justify-between">
                  <p className="font-medium">{m.agenda}</p>
                  <StatusPill tone={statusToneFor(m.status)}>{m.status}</StatusPill>
                </div>
                {m.scheduledAt ? <p className="mt-1 text-xs text-ink-muted">{formatDate(m.scheduledAt)}</p> : null}
                {m.studentVisibleNotes ? <p className="mt-2 text-ink-secondary">{m.studentVisibleNotes}</p> : null}
              </div>
            ))}
          </div>
        </Surface>
      ) : null}
    </div>
  );
}

export function StudentAlertsPage() {
  const [alerts, setAlerts] = useState<Array<{ id: number; title: string; message: string; severity: string }>>([]);
  useDocumentTitle('Academic Alerts');
  useEffect(() => {
    api<{ alerts: typeof alerts }>('/api/student/alerts').then((d) => setAlerts(d.alerts));
  }, []);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Academic Alerts" subtitle="Constructive reminders to support your academic progress" />
      {alerts.length === 0 ? (
        <StudentEmpty title="No active alerts" body="You're on track. Alerts appear when attention is recommended." />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => (
            <Surface key={a.id} className="flex gap-3">
              <AlertCircle className={`h-5 w-5 shrink-0 ${a.severity === 'WARNING' ? 'text-warning' : 'text-accent'}`} />
              <div>
                <p className="font-medium">{a.title}</p>
                <p className="mt-1 text-sm text-ink-secondary">{a.message}</p>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}
