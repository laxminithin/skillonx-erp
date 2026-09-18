import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { api } from '../../lib/api';
import { Badge, Button, EmptyState, PageHeader, Surface, Tabs, Textarea, useToast } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';

type InboxRow = {
  id: number;
  requestNumber: string | null;
  title: string;
  status: string;
  currentStage: string | null;
  category: string | null;
  studentName: string | null;
  usn: string | null;
  section: string | null;
  semester: string | null;
  submittedAt: string | null;
  bucket: string;
  formData?: Record<string, unknown>;
  requestTypeLabel?: string | null;
};

type InboxResponse = {
  requests: InboxRow[];
  counts: { PENDING: number; APPROVED: number; REJECTED: number; RETURNED: number; TOTAL: number };
};

function fmt(v: unknown) {
  if (!v) return '—';
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString();
}

const STATUS_STYLE = (s: string) =>
  /REJECT/.test(s) ? 'bg-rose-50 text-rose-700'
  : /APPROV|COMPLET/.test(s) ? 'bg-emerald-50 text-emerald-700'
  : /ACTION/.test(s) ? 'bg-amber-50 text-amber-800'
  : 'bg-sky-50 text-sky-700';

const TABS = [
  { id: 'PENDING', label: 'Pending' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'REJECTED', label: 'Rejected' },
  { id: 'RETURNED', label: 'Returned' },
  { id: 'HISTORY', label: 'History' },
];

export function LecturerRequestsPage() {
  useDocumentTitle('Student Requests');
  const [tab, setTab] = useState('PENDING');
  const [data, setData] = useState<InboxResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api<InboxResponse>(`/api/student-services/mentor-inbox?tab=${tab}`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const c = data?.counts;
  const tabsWithCounts = TABS.map((t) => ({
    ...t,
    label: c && t.id !== 'HISTORY' && (c as Record<string, number>)[t.id] ? `${t.label} (${(c as Record<string, number>)[t.id]})` : t.label,
  }));

  return (
    <div>
      <PageHeader title="Student Requests" subtitle="Permission, leave and short-leave requests routed to you as mentor or class coordinator." />
      <Tabs value={tab} onChange={setTab} tabs={tabsWithCounts} />
      <div className="mt-4">
        <Surface className="!p-0 overflow-hidden">
          {loading ? (
            <p className="p-5 text-sm text-ink-muted">Loading…</p>
          ) : !data?.requests.length ? (
            <div className="p-5"><EmptyState title="Nothing here" body="No requests in this tab." /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-border text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-2.5">Student</th>
                    <th className="px-4 py-2.5">Request</th>
                    <th className="px-4 py-2.5">Submitted</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.requests.map((r) => (
                    <tr key={r.id} className="hover:bg-surface-muted/40">
                      <td className="px-4 py-2.5">
                        <div className="font-medium">{r.studentName}</div>
                        <div className="text-xs text-ink-muted">{r.usn} · {r.semester ?? ''} {r.section ?? ''}</div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div>{r.requestTypeLabel ?? r.title}</div>
                        <div className="text-xs text-ink-muted">{r.requestNumber ?? '—'}</div>
                      </td>
                      <td className="px-4 py-2.5">{fmt(r.submittedAt)}</td>
                      <td className="px-4 py-2.5"><Badge className={STATUS_STYLE(r.status)}>{r.status.replace(/_/g, ' ')}</Badge></td>
                      <td className="px-4 py-2.5 text-right">
                        <Link to={`/mentoring/requests/${r.id}`} className="text-accent hover:underline">Review</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Surface>
      </div>
    </div>
  );
}

type Detail = {
  id: number;
  requestNumber: string | null;
  title: string;
  status: string;
  currentStage: string | null;
  formData?: Record<string, unknown>;
  student: { name: string; usn: string; departmentName?: string | null; semesterLabel?: string | null } | null;
  type: { label: string; code?: string } | null;
  timeline: Array<{ label: string; status: string; actorRole: string; remarks?: string; actedByName?: string | null; actedAt?: string | null }>;
  comments: Array<{ id: number; body: string; authorName: string; createdAt: string }>;
  attachments?: Array<{ id: number; fileName: string }>;
};

export function LecturerRequestDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState<Detail | null>(null);
  const [remarks, setRemarks] = useState('');
  const [acting, setActing] = useState(false);
  const { toast } = useToast();
  useDocumentTitle('Review Request');

  const load = useCallback(() => {
    api<Detail>(`/api/student-services/mentor-inbox/${id}`)
      .then(setData)
      .catch((e) => toast(String((e as { message?: string })?.message ?? 'Unable to load'), 'error'));
  }, [id, toast]);

  useEffect(() => { load(); }, [load]);

  async function act(action: string) {
    if (!id) return;
    if (action === 'REJECT' && !remarks.trim()) { toast('Add a remark explaining the rejection.', 'error'); return; }
    if (action === 'REQUEST_ACTION' && !remarks.trim()) { toast('Add a remark explaining what the student must clarify.', 'error'); return; }
    setActing(true);
    try {
      const updated = await api<Detail>(`/api/student-services/mentor-inbox/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, remarks: remarks || undefined }),
      });
      setData(updated);
      setRemarks('');
      toast('Request updated.', 'success');
    } catch (e) {
      toast(String((e as { message?: string })?.message ?? 'Action failed'), 'error');
    } finally {
      setActing(false);
    }
  }

  if (!data) return <div className="p-6 text-sm text-ink-muted">Loading…</div>;

  const fd = data.formData ?? {};
  const fields: Array<[string, unknown]> = Object.entries(fd);
  const actionable = !['COMPLETED', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(data.status);

  return (
    <div className="max-w-2xl">
      <Link to="/mentoring/requests" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Back to requests
      </Link>
      <PageHeader
        title={data.type?.label ?? data.title}
        subtitle={data.requestNumber ?? undefined}
        actions={<Badge className={STATUS_STYLE(data.status)}>{data.status.replace(/_/g, ' ')}</Badge>}
      />

      <Surface className="mb-4">
        <p className="text-sm"><strong>{data.student?.name}</strong> · {data.student?.usn} · {data.student?.departmentName ?? ''} {data.student?.semesterLabel ?? ''}</p>
        <p className="text-sm text-ink-muted">{data.currentStage ?? ''}</p>
      </Surface>

      {fields.length ? (
        <Surface className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">Request details</h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {fields.map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs uppercase tracking-wide text-ink-muted">{k.replace(/([A-Z])/g, ' $1')}</dt>
                <dd>{v == null || v === '' ? '—' : /date/i.test(k) ? fmt(v) : String(v)}</dd>
              </div>
            ))}
          </dl>
        </Surface>
      ) : null}

      {data.attachments?.length ? (
        <Surface className="mb-4">
          <h3 className="mb-2 text-sm font-semibold">Attachments</h3>
          <ul className="space-y-1 text-sm">
            {data.attachments.map((a) => (
              <li key={a.id}>
                <a className="text-accent hover:underline" href={`/api/student-services/attachments/${a.id}/download`}>{a.fileName}</a>
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}

      <Surface className="mb-4">
        <h3 className="mb-3 text-sm font-semibold">Workflow</h3>
        <ol className="space-y-2">
          {data.timeline.map((s, i) => (
            <li key={i} className="text-sm">
              <span className="inline-flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${s.status === 'COMPLETED' ? 'bg-emerald-500' : s.status === 'IN_PROGRESS' ? 'bg-accent' : s.status === 'REJECTED' ? 'bg-rose-500' : 'bg-surface-muted'}`} />
                {s.label} <span className="text-ink-muted">({s.actorRole})</span>
                {s.actedByName ? <span className="text-xs text-ink-muted">· {s.actedByName} {s.actedAt ? fmt(s.actedAt) : ''}</span> : null}
              </span>
              {s.remarks ? <div className="ml-4 text-xs text-ink-muted">“{s.remarks}”</div> : null}
            </li>
          ))}
        </ol>
      </Surface>

      {actionable ? (
        <Surface>
          <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Remarks (shared with the student)" />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" disabled={acting} onClick={() => act('APPROVE')}>Approve</Button>
            <Button size="sm" variant="secondary" disabled={acting} onClick={() => act('REQUEST_ACTION')}>Return for clarification</Button>
            <Button size="sm" variant="danger" disabled={acting} onClick={() => act('REJECT')}>Reject</Button>
          </div>
          <p className="mt-2 text-xs text-ink-muted">Approving a leave request reconciles the student's attendance for the leave dates automatically.</p>
        </Surface>
      ) : null}
    </div>
  );
}
