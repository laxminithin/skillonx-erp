import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, Modal, PageHeader, Select, StatusBadge, Surface, Textarea, useToast } from '../../components/ui';
import type { CopoCatalog } from '../../types/copo';

type QueueRow = {
  id: number;
  courseId: number;
  subjectCode: string;
  subjectName: string;
  status: string;
  mappingKind?: string;
  mappingType?: string;
  versionNumber: number;
  submittedAt?: string;
  submittedByName?: string;
  academicYearLabel?: string;
  programName?: string;
  schemeName?: string;
};

export function CopoReviewPage({ basePath = '/copo' }: { basePath?: string }) {
  useDocumentTitle('Mapping Review');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [active, setActive] = useState<QueueRow | null>(null);
  const [comment, setComment] = useState('');
  const [action, setAction] = useState<'approve' | 'return' | 'reopen' | null>(null);
  const [kind, setKind] = useState('');
  const [schemeId, setSchemeId] = useState('');
  const [programId, setProgramId] = useState('');
  const [semesterId, setSemesterId] = useState('');
  const [yearId, setYearId] = useState('');
  const [status, setStatus] = useState('');

  const load = () => {
    const qs = new URLSearchParams();
    if (kind) qs.set('mappingKind', kind);
    if (schemeId) qs.set('schemeId', schemeId);
    if (programId) qs.set('programId', programId);
    if (semesterId) qs.set('semesterId', semesterId);
    if (yearId) qs.set('academicYearId', yearId);
    if (status) qs.set('status', status);
    return api<{ mappings: QueueRow[] }>(`/api/copo/review-queue?${qs}`)
      .then((r) => setRows(r.mappings))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed to load queue', 'error'));
  };

  useEffect(() => {
    api<CopoCatalog>('/api/copo/catalog').then(setCatalog).catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind, schemeId, programId, semesterId, yearId, status]);

  const run = async (nextAction: 'approve' | 'return' | 'reopen') => {
    if (!active) return;
    try {
      if (nextAction === 'approve') {
        await api(`/api/copo/mappings/${active.id}/approve`, { method: 'POST', body: JSON.stringify({ comment }) });
      } else if (nextAction === 'return') {
        await api(`/api/copo/mappings/${active.id}/return`, { method: 'POST', body: JSON.stringify({ comment }) });
      } else {
        await api(`/api/copo/mappings/${active.id}/reopen`, { method: 'POST', body: '{}' });
      }
      toast(nextAction === 'approve' ? 'Approved' : nextAction === 'return' ? 'Returned for correction' : 'Reopened as a new version');
      setActive(null);
      setComment('');
      setAction(null);
      load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Action failed', 'error');
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader title="Review & Approval" subtitle="HOD / NBA / IQAC review of submitted CO–PO, CO–PSO, and CO–SDG mappings." />
      <div className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Field label="Scheme">
          <Select value={schemeId} onChange={(e) => setSchemeId(e.target.value)}>
            <option value="">All</option>
            {catalog?.schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Program">
          <Select value={programId} onChange={(e) => setProgramId(e.target.value)}>
            <option value="">All</option>
            {catalog?.programs.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Semester">
          <Select value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
            <option value="">All</option>
            {catalog?.semesters.map((s) => (
              <option key={s.id} value={s.id}>
                Semester {s.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Academic year">
          <Select value={yearId} onChange={(e) => setYearId(e.target.value)}>
            <option value="">All</option>
            {catalog?.academicYears.map((y) => (
              <option key={y.id} value={y.id}>
                {y.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Mapping type">
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">All</option>
            <option value="PO">CO–PO</option>
            <option value="PSO">CO–PSO</option>
            <option value="SDG">CO–SDG</option>
          </Select>
        </Field>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Submitted / needs revision</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="NEEDS_REVISION">Needs revision</option>
            <option value="APPROVED">Approved</option>
            <option value="DRAFT">Draft</option>
          </Select>
        </Field>
      </div>
      <Surface className="!p-0 overflow-hidden">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-ink-muted">
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Mapping</th>
              <th className="px-4 py-3">Program</th>
              <th className="px-4 py-3">Year</th>
              <th className="px-4 py-3">Submitted by</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-border/70">
                <td className="px-4 py-3">
                  <Link className="font-medium text-accent" to={`${basePath}/mapping?courseId=${row.courseId}&tab=${row.mappingKind === 'PSO' ? 'pso' : row.mappingKind === 'SDG' ? 'sdg' : 'po'}`}>
                    {row.subjectCode} — {row.subjectName}
                  </Link>
                  <p className="text-xs text-ink-muted">Version {row.versionNumber}</p>
                </td>
                <td className="px-4 py-3">{row.mappingType || 'CO–PO'}</td>
                <td className="px-4 py-3">{row.programName || '—'}</td>
                <td className="px-4 py-3">{row.academicYearLabel || '—'}</td>
                <td className="px-4 py-3">{row.submittedByName || '—'}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="secondary" onClick={() => { setActive(row); setAction('approve'); }}>
                    Review
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? <p className="px-4 py-8 text-sm text-ink-muted">No mappings are waiting for review.</p> : null}
      </Surface>

      <Modal
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active ? `${active.subjectCode} review` : 'Review'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setActive(null)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={() => { setAction('return'); void run('return'); }} disabled={!comment.trim()}>
              Return for correction
            </Button>
            <Button onClick={() => { setAction('approve'); void run('approve'); }}>Approve</Button>
          </>
        }
      >
        <Field label="Reviewer comments">
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Example: CO4 → PO7 correlation appears weak. Please review the mapping and justification." />
        </Field>
        <div className="mt-3">
          <Select value={action || 'approve'} onChange={(e) => setAction(e.target.value as typeof action)}>
            <option value="approve">Approve</option>
            <option value="return">Return for correction</option>
            <option value="reopen">Reopen approved as new version</option>
          </Select>
        </div>
        {action === 'reopen' ? (
          <div className="mt-3">
            <Button variant="secondary" onClick={() => void run('reopen')}>
              Reopen as new version
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
