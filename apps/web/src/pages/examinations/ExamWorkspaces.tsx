import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import {
  Button,
  EmptyState,
  Input,
  PageHeader,
  Select,
  Skeleton,
  StatusBadge,
  Surface,
} from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';

type ExamSubject = { id: number; courseName: string; courseCode: string };
type Exam = { id: number; name: string; code: string; status: string; subjects: ExamSubject[] };

function useExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ exams: Exam[] }>('/api/examinations')
      .then((d) => setExams(d.exams))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load examinations'))
      .finally(() => setLoading(false));
  }, []);
  return { exams, loading, error };
}

function errText(e: unknown) {
  return e instanceof Error ? e.message : 'Request failed';
}

/* ------------------------------------------------------------------ Strong Room */

type Packet = {
  id: number;
  packet_reference: string;
  paper_reference: string;
  quantity: number;
  seal_status: string;
  status: string;
  storage_reference: string | null;
  received_at: string;
  timeline: Array<{ id: number; action: string; from_custody: string | null; to_custody: string | null; created_at: string }>;
};

// Legal next custody actions per current action (mirrors the server state machine for presentation only).
const CUSTODY_NEXT: Record<string, string[]> = {
  RECEIVED: ['STORED', 'TRANSFERRED', 'ISSUED'],
  STORED: ['TRANSFERRED', 'ISSUED', 'OPENED'],
  TRANSFERRED: ['TRANSFERRED', 'RECEIVED', 'RETURNED'],
  ISSUED: ['OPENED', 'RETURNED'],
  OPENED: ['RETURNED', 'CLOSED'],
  RETURNED: ['STORED', 'CLOSED'],
  CLOSED: [],
};

export function CoeStrongRoomPage() {
  useDocumentTitle('Strong Room');
  const { exams } = useExams();
  const [packets, setPackets] = useState<Packet[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState<Packet | null>(null);
  const [form, setForm] = useState({ examId: '', examSubjectId: '', paperReference: '', packetReference: '', quantity: '1', sealStatus: 'SEALED', storageReference: '' });

  const load = useCallback(() => {
    setLoading(true);
    return api<{ packets: Packet[] }>('/api/examinations/operations/readback')
      .then((d) => setPackets(d.packets ?? []))
      .catch((e) => setMessage(errText(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const subjects = exams.find((e) => String(e.id) === form.examId)?.subjects ?? [];

  const create = async () => {
    try {
      await api(`/api/examinations/${Number(form.examId)}/strong-room`, {
        method: 'POST',
        body: JSON.stringify({
          examSubjectId: Number(form.examSubjectId),
          paperReference: form.paperReference,
          packetReference: form.packetReference,
          quantity: Number(form.quantity),
          sealStatus: form.sealStatus,
          storageReference: form.storageReference || undefined,
          receivedAt: new Date().toISOString(),
        }),
      });
      setMessage('Packet registered and received into custody.');
      setForm({ ...form, paperReference: '', packetReference: '', storageReference: '' });
      await load();
    } catch (e) {
      setMessage(errText(e));
    }
  };

  const transition = async (packet: Packet, action: string) => {
    try {
      await api('/api/examinations/custody/events', {
        method: 'POST',
        body: JSON.stringify({ resourceType: 'QUESTION_PAPER', resourceId: packet.id, action, toCustody: action }),
      });
      setMessage(`Custody transition recorded: ${action}.`);
      await load();
      setSelected(null);
    } catch (e) {
      setMessage(errText(e));
    }
  };

  const lastAction = (p: Packet) => (p.timeline.length ? p.timeline[p.timeline.length - 1].action : 'RECEIVED');

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Strong Room" subtitle="Question-paper packet custody, sealed storage, and the append-only custody timeline" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}

      <Surface>
        <h2 className="font-semibold">Register / receive a packet</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select value={form.examId} onChange={(e) => setForm({ ...form, examId: e.target.value, examSubjectId: '' })}>
            <option value="">Select examination…</option>
            {exams.map((e) => (
              <option key={e.id} value={e.id}>{e.name}</option>
            ))}
          </Select>
          <Select value={form.examSubjectId} onChange={(e) => setForm({ ...form, examSubjectId: e.target.value })} disabled={!form.examId}>
            <option value="">Select course…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.courseCode} · {s.courseName}</option>
            ))}
          </Select>
          <Input placeholder="Paper reference" value={form.paperReference} onChange={(e) => setForm({ ...form, paperReference: e.target.value })} />
          <Input placeholder="Packet reference" value={form.packetReference} onChange={(e) => setForm({ ...form, packetReference: e.target.value })} />
          <Input placeholder="Quantity" type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <Select value={form.sealStatus} onChange={(e) => setForm({ ...form, sealStatus: e.target.value })}>
            {['SEALED', 'BROKEN', 'NOT_APPLICABLE'].map((x) => <option key={x}>{x}</option>)}
          </Select>
          <Input placeholder="Storage reference (optional)" value={form.storageReference} onChange={(e) => setForm({ ...form, storageReference: e.target.value })} />
          <Button size="sm" onClick={create} disabled={!form.examId || !form.examSubjectId || !form.paperReference || !form.packetReference}>
            Register packet
          </Button>
        </div>
      </Surface>

      <Surface>
        <h2 className="font-semibold">Packets in custody</h2>
        {packets.length === 0 ? (
          <EmptyState title="No packets" body="Registered question-paper packets appear here with their custody timeline." />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[860px] w-full text-sm">
              <thead>
                <tr>{['Packet', 'Paper', 'Qty', 'Seal', 'Current state', 'Received', ''].map((h) => <th key={h} className="pb-2 text-left text-ink-muted">{h}</th>)}</tr>
              </thead>
              <tbody>
                {packets.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-2 font-medium">{p.packet_reference}</td>
                    <td className="py-2">{p.paper_reference}</td>
                    <td className="py-2">{p.quantity}</td>
                    <td className="py-2"><StatusBadge status={p.seal_status} /></td>
                    <td className="py-2"><StatusBadge status={lastAction(p)} /></td>
                    <td className="py-2 text-ink-muted">{formatDate(p.received_at)}</td>
                    <td className="py-2"><button className="text-accent" onClick={() => setSelected(p)}>Detail</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      {selected ? (
        <Surface>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Packet {selected.packet_reference}</h2>
            <button className="text-sm text-ink-muted" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
            <p>Paper: <strong>{selected.paper_reference}</strong></p>
            <p>Quantity: <strong>{selected.quantity}</strong></p>
            <p>Seal: <strong>{selected.seal_status}</strong></p>
            <p>Storage: <strong>{selected.storage_reference ?? '—'}</strong></p>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Custody timeline</p>
            <ol className="space-y-1 text-sm">
              <li className="text-ink-muted">RECEIVED · {formatDate(selected.received_at)}</li>
              {selected.timeline.map((t) => (
                <li key={t.id} className="text-ink-secondary">{t.action}{t.to_custody ? ` → ${t.to_custody}` : ''} · {formatDate(t.created_at)}</li>
              ))}
            </ol>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium">Legal next actions</p>
            <div className="flex flex-wrap gap-2">
              {(CUSTODY_NEXT[lastAction(selected)] ?? []).map((a) => (
                <Button key={a} size="sm" variant="secondary" onClick={() => transition(selected, a)}>{a}</Button>
              ))}
              {(CUSTODY_NEXT[lastAction(selected)] ?? []).length === 0 ? <p className="text-sm text-ink-muted">Custody closed — no further transitions.</p> : null}
            </div>
          </div>
        </Surface>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Form-A */

type RosterCandidate = { studentId: number; studentName: string; usn: string; eligibilityStatus: string; registrationStatus: string | null; recordId: number | null; attendance: string | null };
type Roster = { examSubjectId: number; session: { id: number; status: string; roomId: number | null } | null; candidates: RosterCandidate[] };

export function CoeFormAPage() {
  useDocumentTitle('Form-A Attendance');
  const { exams } = useExams();
  const [examId, setExamId] = useState('');
  const [examSubjectId, setExamSubjectId] = useState('');
  const [roster, setRoster] = useState<Roster | null>(null);
  const [draft, setDraft] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const subjects = exams.find((e) => String(e.id) === examId)?.subjects ?? [];
  const frozen = roster?.session?.status === 'FROZEN';

  const loadRoster = async (subjectId: string) => {
    if (!subjectId) return;
    setLoading(true);
    try {
      const r = await api<Roster>(`/api/examinations/subjects/${Number(subjectId)}/form-a/roster`);
      setRoster(r);
      setDraft(Object.fromEntries(r.candidates.map((c) => [c.studentId, c.attendance ?? 'PRESENT'])));
    } catch (e) {
      setMessage(errText(e));
      setRoster(null);
    } finally {
      setLoading(false);
    }
  };

  const markAll = (status: string) => {
    if (!roster) return;
    setDraft(Object.fromEntries(roster.candidates.map((c) => [c.studentId, status])));
  };

  const save = async () => {
    if (!roster) return;
    try {
      await api(`/api/examinations/subjects/${roster.examSubjectId}/form-a`, {
        method: 'PUT',
        body: JSON.stringify({ records: roster.candidates.map((c) => ({ studentId: c.studentId, status: draft[c.studentId] ?? 'PRESENT' })) }),
      });
      setMessage('Attendance saved.');
      await loadRoster(String(roster.examSubjectId));
    } catch (e) {
      setMessage(errText(e));
    }
  };

  const freeze = async () => {
    if (!roster?.session) return;
    if (!window.confirm('Freeze Form-A? Ordinary edits will be blocked afterwards.')) return;
    try {
      await api(`/api/examinations/form-a/${roster.session.id}/freeze`, { method: 'POST' });
      setMessage('Form-A frozen.');
      await loadRoster(String(roster.examSubjectId));
    } catch (e) {
      setMessage(errText(e));
    }
  };

  const correct = async (recordId: number) => {
    const status = window.prompt('New attendance state (PRESENT / ABSENT / MPC)');
    if (!status) return;
    const reason = window.prompt('Correction reason');
    if (!reason) return;
    try {
      await api(`/api/examinations/form-a/records/${recordId}/correct`, { method: 'POST', body: JSON.stringify({ status: status.toUpperCase(), reason }) });
      setMessage('Correction recorded.');
      await loadRoster(String(roster!.examSubjectId));
    } catch (e) {
      setMessage(errText(e));
    }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Form-A Attendance" subtitle="Room/session attendance for the authoritative examination population, with freeze and governed correction" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}

      <Surface>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Select value={examId} onChange={(e) => { setExamId(e.target.value); setExamSubjectId(''); setRoster(null); }}>
            <option value="">Select examination…</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Select value={examSubjectId} onChange={(e) => { setExamSubjectId(e.target.value); void loadRoster(e.target.value); }} disabled={!examId}>
            <option value="">Select course…</option>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.courseCode} · {s.courseName}</option>)}
          </Select>
        </div>
      </Surface>

      {loading ? <Skeleton className="h-40 w-full" /> : null}

      {roster && !loading ? (
        <Surface>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-semibold">Candidates ({roster.candidates.length})</h2>
              {roster.session ? <p className="text-sm text-ink-muted">Session status: <StatusBadge status={roster.session.status} /></p> : <p className="text-sm text-ink-muted">No session yet — saving attendance creates one.</p>}
            </div>
            {!frozen ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Button size="sm" variant="secondary" onClick={() => markAll('PRESENT')}>Mark all present</Button>
                <Button size="sm" variant="secondary" onClick={() => markAll('ABSENT')}>Mark all absent</Button>
                <Button size="sm" onClick={save}>Save attendance</Button>
                {roster.session ? <Button size="sm" variant="danger" onClick={freeze}>Freeze</Button> : null}
              </div>
            ) : (
              <p className="text-sm text-warning">Frozen — use governed correction only.</p>
            )}
          </div>
          {roster.candidates.length === 0 ? (
            <EmptyState title="No eligible candidates" body="Only eligible/condoned students appear in the Form-A population." />
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-[720px] w-full text-sm">
                <thead>
                  <tr>{['USN', 'Student', 'Eligibility', 'Attendance', frozen ? 'Correct' : ''].map((h) => <th key={h} className="pb-2 text-left text-ink-muted">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {roster.candidates.map((c) => (
                    <tr key={c.studentId} className="border-t border-border">
                      <td className="py-2">{c.usn}</td>
                      <td className="py-2">{c.studentName}</td>
                      <td className="py-2">{c.eligibilityStatus}</td>
                      <td className="py-2">
                        {frozen ? (
                          <StatusBadge status={c.attendance ?? '—'} />
                        ) : (
                          <Select value={draft[c.studentId] ?? 'PRESENT'} onChange={(e) => setDraft({ ...draft, [c.studentId]: e.target.value })} className="w-32">
                            {['PRESENT', 'ABSENT', 'MPC'].map((x) => <option key={x}>{x}</option>)}
                          </Select>
                        )}
                      </td>
                      <td className="py-2">{frozen && c.recordId ? <button className="text-accent" onClick={() => correct(c.recordId!)}>Correct</button> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Surface>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ MPC */

type MpcCase = { id: number; status: string; decision: string | null; studentName: string; usn: string; courseCode: string; courseName: string; createdAt: string };
type MpcDetail = {
  id: number; status: string; studentId: number; invigilatorReport: string; studentStatement: string | null;
  committee: unknown; decision: string | null; decisionReason: string | null; penalty: string | null;
  timeline: Array<{ id: number; from_status: string | null; to_status: string; note: string | null; created_at: string }>;
  resultActions: Array<{ id: number; action_type: string; note: string | null; created_at: string }>;
  evidenceCount: number;
};
type Evidence = { id: number; fileReference: string; contentType: string | null; description: string | null; createdAt: string };

const MPC_NEXT: Record<string, string[]> = { REPORTED: ['UNDER_REVIEW'], UNDER_REVIEW: ['COMMITTEE', 'CLOSED'], COMMITTEE: ['DECIDED'], DECIDED: ['CLOSED'], CLOSED: [] };

export function CoeMpcPage() {
  useDocumentTitle('Malpractice (MPC)');
  const [cases, setCases] = useState<MpcCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [detail, setDetail] = useState<MpcDetail | null>(null);
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    return api<{ cases: MpcCase[] }>('/api/examinations/mpc')
      .then((d) => setCases(d.cases))
      .catch((e) => setMessage(errText(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const openCase = async (id: number) => {
    setEvidence(null);
    try {
      setDetail(await api<MpcDetail>(`/api/examinations/mpc/${id}`));
    } catch (e) {
      setMessage(errText(e));
    }
  };

  const loadEvidence = async (id: number) => {
    try {
      const d = await api<{ evidence: Evidence[] }>(`/api/examinations/mpc/${id}/evidence`);
      setEvidence(d.evidence);
    } catch (e) {
      setMessage(errText(e)); // authorized backend may deny — surface the reason
    }
  };

  const transition = async (id: number, to: string) => {
    try {
      if (to === 'DECIDED') {
        const reason = window.prompt('Committee decision reason');
        if (!reason) return;
        await api(`/api/examinations/mpc/${id}/decision`, { method: 'POST', body: JSON.stringify({ committee: [{ facultyUserId: 0, name: 'Committee' }], decision: 'MALPRACTICE_CONFIRMED', reason }) });
      } else {
        const note = window.prompt(`Note for transition to ${to} (optional)`) ?? undefined;
        await api(`/api/examinations/mpc/${id}/transition`, { method: 'POST', body: JSON.stringify({ to, note }) });
      }
      setMessage(`Case moved to ${to}.`);
      await load();
      await openCase(id);
    } catch (e) {
      setMessage(errText(e));
    }
  };

  const recordResultAction = async (id: number) => {
    const actionType = window.prompt('Result consequence (RESULT_WITHHELD / RESULT_INVALIDATED / SUBJECT_CANCELLED / NO_ACTION)');
    if (!actionType) return;
    try {
      await api(`/api/examinations/mpc/${id}/result-action`, { method: 'POST', body: JSON.stringify({ actionType: actionType.toUpperCase() }) });
      setMessage('Governed result consequence recorded (published result not overwritten).');
      await openCase(id);
    } catch (e) {
      setMessage(errText(e));
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Malpractice (MPC)" subtitle="Case lifecycle, authorized evidence, committee decision, and governed result consequence" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}

      <Surface>
        <h2 className="font-semibold">Case queue</h2>
        {cases.length === 0 ? (
          <EmptyState title="No cases" body="Reported malpractice cases appear here through their lifecycle." />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[820px] w-full text-sm">
              <thead><tr>{['Student', 'Course', 'Status', 'Decision', 'Reported', ''].map((h) => <th key={h} className="pb-2 text-left text-ink-muted">{h}</th>)}</tr></thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-2">{c.studentName} · {c.usn}</td>
                    <td className="py-2">{c.courseCode}</td>
                    <td className="py-2"><StatusBadge status={c.status} /></td>
                    <td className="py-2">{c.decision ?? '—'}</td>
                    <td className="py-2 text-ink-muted">{formatDate(c.createdAt)}</td>
                    <td className="py-2"><button className="text-accent" onClick={() => openCase(c.id)}>Open</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>

      {detail ? (
        <Surface>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Case #{detail.id} · <StatusBadge status={detail.status} /></h2>
            <button className="text-sm text-ink-muted" onClick={() => { setDetail(null); setEvidence(null); }}>Close</button>
          </div>
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Invigilator report</p>
              <p className="mt-1 text-sm text-ink-secondary">{detail.invigilatorReport}</p>
              {detail.studentStatement ? <><p className="mt-3 text-sm font-medium">Student statement</p><p className="mt-1 text-sm text-ink-secondary">{detail.studentStatement}</p></> : null}
              {detail.decision ? <><p className="mt-3 text-sm font-medium">Decision</p><p className="mt-1 text-sm text-ink-secondary">{detail.decision} — {detail.decisionReason}</p></> : null}
            </div>
            <div>
              <p className="text-sm font-medium">Timeline</p>
              <ol className="mt-1 space-y-1 text-sm text-ink-secondary">
                {detail.timeline.map((t) => <li key={t.id}>{t.from_status ? `${t.from_status} → ` : ''}{t.to_status}{t.note ? ` · ${t.note}` : ''} · {formatDate(t.created_at)}</li>)}
              </ol>
              {detail.resultActions.length ? <><p className="mt-3 text-sm font-medium">Result consequences</p><ul className="mt-1 space-y-1 text-sm text-ink-secondary">{detail.resultActions.map((a) => <li key={a.id}>{a.action_type}{a.note ? ` · ${a.note}` : ''}</li>)}</ul></> : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {(MPC_NEXT[detail.status] ?? []).map((to) => <Button key={to} size="sm" variant="secondary" onClick={() => transition(detail.id, to)}>{to === 'DECIDED' ? 'Record decision' : to}</Button>)}
            {detail.status === 'DECIDED' || detail.status === 'CLOSED' ? <Button size="sm" onClick={() => recordResultAction(detail.id)}>Record result consequence</Button> : null}
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-3">
              <p className="text-sm font-medium">Evidence ({detail.evidenceCount})</p>
              <button className="text-sm text-accent" onClick={() => loadEvidence(detail.id)}>Load authorized evidence</button>
            </div>
            {evidence ? (
              evidence.length === 0 ? <p className="mt-1 text-sm text-ink-muted">No evidence attached.</p> : (
                <ul className="mt-2 space-y-1 text-sm">
                  {evidence.map((ev) => <li key={ev.id} className="text-ink-secondary">{ev.description ?? ev.fileReference} <span className="text-ink-muted">({ev.contentType ?? 'file'})</span></li>)}
                </ul>
              )
            ) : null}
          </div>
        </Surface>
      ) : null}
    </div>
  );
}
