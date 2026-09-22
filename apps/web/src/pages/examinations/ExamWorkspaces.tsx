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

/* ------------------------------------------------------------------ Answer Books */

type AnswerBook = {
  id: number; series: string; received_quantity: number; issued_quantity: number; used_quantity: number;
  unused_quantity: number; damaged_quantity: number; returned_quantity: number;
  reconciliation: { expected: number; actual: number; variance: number };
  reconciliationStatus: string; varianceStatus: string;
  variance_reason?: string | null; investigation_note?: string | null; resolution?: string | null;
};
const AB_MOVES = ['RECEIVED', 'ISSUED', 'USED', 'UNUSED', 'DAMAGED', 'RETURNED'];

export function CoeAnswerBooksPage() {
  useDocumentTitle('Answer Books');
  const { exams } = useExams();
  const [books, setBooks] = useState<AnswerBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [create, setCreate] = useState({ examId: '', series: '', receivedQuantity: '' });
  const [move, setMove] = useState<Record<number, { type: string; qty: string }>>({});

  const load = useCallback(() => {
    setLoading(true);
    return api<{ answerBooks: AnswerBook[] }>('/api/examinations/operations/readback')
      .then((d) => setBooks(d.answerBooks ?? []))
      .catch((e) => setMessage(errText(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const addBatch = async () => {
    try {
      await api(`/api/examinations/${Number(create.examId)}/answer-books`, { method: 'POST', body: JSON.stringify({ series: create.series, receivedQuantity: Number(create.receivedQuantity) }) });
      setMessage('Answer-book batch received.');
      setCreate({ examId: '', series: '', receivedQuantity: '' });
      await load();
    } catch (e) { setMessage(errText(e)); }
  };
  const recordMove = async (b: AnswerBook) => {
    const m = move[b.id];
    if (!m?.type || !m.qty) return;
    try {
      await api(`/api/examinations/answer-books/${b.id}/movements`, { method: 'POST', body: JSON.stringify({ movementType: m.type, quantity: Number(m.qty) }) });
      setMessage(`${m.type} movement recorded; server recomputed reconciliation.`);
      setMove({ ...move, [b.id]: { type: m.type, qty: '' } });
      await load();
    } catch (e) { setMessage(errText(e)); }
  };
  const resolveVariance = async (b: AnswerBook) => {
    const reason = window.prompt('Variance reason'); if (!reason) return;
    const investigationNote = window.prompt('Investigation note'); if (!investigationNote) return;
    const resolution = window.prompt('Resolution'); if (!resolution) return;
    try {
      await api(`/api/examinations/answer-books/${b.id}/variance/resolve`, { method: 'POST', body: JSON.stringify({ reason, investigationNote, resolution }) });
      setMessage('Variance resolved.'); await load();
    } catch (e) { setMessage(errText(e)); }
  };
  const closeRecon = async (b: AnswerBook) => {
    try { await api(`/api/examinations/answer-books/${b.id}/reconciliation/close`, { method: 'POST' }); setMessage('Reconciliation closed.'); await load(); }
    catch (e) { setMessage(errText(e)); }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Answer Books" subtitle="Answer-book movements with server-authoritative reconciliation and variance investigation" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}
      <Surface>
        <h2 className="font-semibold">Receive a batch</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Select value={create.examId} onChange={(e) => setCreate({ ...create, examId: e.target.value })}>
            <option value="">Select examination…</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          <Input placeholder="Series" value={create.series} onChange={(e) => setCreate({ ...create, series: e.target.value })} />
          <Input placeholder="Received quantity" type="number" value={create.receivedQuantity} onChange={(e) => setCreate({ ...create, receivedQuantity: e.target.value })} />
          <Button size="sm" onClick={addBatch} disabled={!create.examId || !create.series || !create.receivedQuantity}>Receive</Button>
        </div>
      </Surface>
      <Surface>
        <h2 className="font-semibold">Batches & reconciliation</h2>
        {books.length === 0 ? <EmptyState title="No answer-book batches" body="Received batches and their reconciliation appear here." /> : (
          <div className="mt-3 space-y-3">
            {books.map((b) => {
              const reconciled = b.reconciliation.variance === 0;
              return (
                <div key={b.id} className="rounded border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">{b.series} <StatusBadge status={b.reconciliationStatus} /></p>
                    <p className="text-sm">Recd {b.received_quantity} · Issued {b.issued_quantity} · Used {b.used_quantity} · Unused {b.unused_quantity} · Damaged {b.damaged_quantity} · Returned {b.returned_quantity}</p>
                  </div>
                  <div className={`mt-2 text-sm ${reconciled ? 'text-success' : 'text-danger'}`}>
                    Expected {b.reconciliation.expected} · Actual {b.reconciliation.actual} · Variance {b.reconciliation.variance} {reconciled ? '· reconciled' : `· ${b.varianceStatus}`}
                  </div>
                  {b.varianceStatus === 'RESOLVED' ? <p className="mt-1 text-xs text-ink-muted">Resolution: {b.resolution}</p> : null}
                  {b.reconciliationStatus !== 'CLOSED' ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <Select className="w-36" value={move[b.id]?.type ?? 'ISSUED'} onChange={(e) => setMove({ ...move, [b.id]: { type: e.target.value, qty: move[b.id]?.qty ?? '' } })}>
                        {AB_MOVES.map((x) => <option key={x}>{x}</option>)}
                      </Select>
                      <Input className="w-28" placeholder="Qty" type="number" value={move[b.id]?.qty ?? ''} onChange={(e) => setMove({ ...move, [b.id]: { type: move[b.id]?.type ?? 'ISSUED', qty: e.target.value } })} />
                      <Button size="sm" variant="secondary" onClick={() => recordMove(b)}>Record movement</Button>
                      {!reconciled && b.varianceStatus !== 'RESOLVED' ? <Button size="sm" variant="danger" onClick={() => resolveVariance(b)}>Investigate variance</Button> : null}
                      <Button size="sm" onClick={() => closeRecon(b)}>Close reconciliation</Button>
                    </div>
                  ) : <p className="mt-2 text-sm text-ink-muted">Reconciliation closed.</p>}
                </div>
              );
            })}
          </div>
        )}
      </Surface>
    </div>
  );
}

/* ------------------------------------------------------------------ Script Transfers */

type ScriptTransfer = { id: number; from_holder: string; to_holder: string; expected_count: number; received_count: number | null; variance: number; status: string; variance_status: string; acknowledged_at: string | null };
type ScriptBatch = { id: number; reference: string; expected_count: number; actual_count: number; stage: string; variance: number; transfers: ScriptTransfer[] };

export function CoeScriptTransferPage() {
  useDocumentTitle('Script Transfers');
  const [scripts, setScripts] = useState<ScriptBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [xfer, setXfer] = useState<Record<number, { fromHolder: string; toHolder: string; expectedCount: string }>>({});

  const load = useCallback(() => {
    setLoading(true);
    return api<{ scripts: ScriptBatch[] }>('/api/examinations/operations/readback')
      .then((d) => setScripts(d.scripts ?? []))
      .catch((e) => setMessage(errText(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const createTransfer = async (batchId: number) => {
    const t = xfer[batchId];
    if (!t?.fromHolder || !t.toHolder || !t.expectedCount) return;
    try {
      await api('/api/examinations/script-transfers', { method: 'POST', body: JSON.stringify({ scriptBatchId: batchId, fromHolder: t.fromHolder, toHolder: t.toHolder, expectedCount: Number(t.expectedCount) }) });
      setMessage('Transfer created (SENT).'); await load();
    } catch (e) { setMessage(errText(e)); }
  };
  const acknowledge = async (transferId: number) => {
    const received = window.prompt('Received script count'); if (received == null) return;
    try { await api(`/api/examinations/script-transfers/${transferId}/acknowledge`, { method: 'POST', body: JSON.stringify({ receivedCount: Number(received) }) }); setMessage('Transfer acknowledged.'); await load(); }
    catch (e) { setMessage(errText(e)); }
  };
  const resolve = async (transferId: number) => {
    const reason = window.prompt('Variance reason'); if (!reason) return;
    const resolution = window.prompt('Resolution'); if (!resolution) return;
    try { await api(`/api/examinations/script-transfers/${transferId}/variance/resolve`, { method: 'POST', body: JSON.stringify({ reason, resolution }) }); setMessage('Variance resolved (original values preserved).'); await load(); }
    catch (e) { setMessage(errText(e)); }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Script Transfers" subtitle="Sender expected vs receiver actual, with unresolved-variance resolution that preserves history" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}
      {scripts.length === 0 ? <Surface><EmptyState title="No script batches" body="Collected script batches and their transfers appear here." /></Surface> : (
        scripts.map((s) => (
          <Surface key={s.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{s.reference} <span className="text-sm font-normal text-ink-muted">· {s.stage} · expected {s.expected_count} / actual {s.actual_count}</span></h2>
            </div>
            {s.transfers.length ? (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-[760px] w-full text-sm">
                  <thead><tr>{['From', 'To', 'Expected', 'Received', 'Variance', 'Status', ''].map((h) => <th key={h} className="pb-2 text-left text-ink-muted">{h}</th>)}</tr></thead>
                  <tbody>
                    {s.transfers.map((t) => (
                      <tr key={t.id} className="border-t border-border">
                        <td className="py-2">{t.from_holder}</td>
                        <td className="py-2">{t.to_holder}</td>
                        <td className="py-2">{t.expected_count}</td>
                        <td className="py-2">{t.received_count ?? '—'}</td>
                        <td className={`py-2 ${t.variance === 0 ? '' : 'text-danger'}`}>{t.variance}</td>
                        <td className="py-2"><StatusBadge status={t.status} />{t.variance_status === 'UNRESOLVED' ? <StatusBadge status="UNRESOLVED" /> : null}</td>
                        <td className="py-2 space-x-2">
                          {t.status === 'SENT' ? <button className="text-accent" onClick={() => acknowledge(t.id)}>Acknowledge</button> : null}
                          {t.variance_status === 'UNRESOLVED' ? <button className="text-danger" onClick={() => resolve(t.id)}>Resolve variance</button> : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="mt-2 text-sm text-ink-muted">No transfers yet.</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <Input className="w-40" placeholder="From holder" value={xfer[s.id]?.fromHolder ?? ''} onChange={(e) => setXfer({ ...xfer, [s.id]: { ...(xfer[s.id] ?? { toHolder: '', expectedCount: '' }), fromHolder: e.target.value } })} />
              <Input className="w-40" placeholder="To holder" value={xfer[s.id]?.toHolder ?? ''} onChange={(e) => setXfer({ ...xfer, [s.id]: { ...(xfer[s.id] ?? { fromHolder: '', expectedCount: '' }), toHolder: e.target.value } })} />
              <Input className="w-32" placeholder="Expected" type="number" value={xfer[s.id]?.expectedCount ?? ''} onChange={(e) => setXfer({ ...xfer, [s.id]: { ...(xfer[s.id] ?? { fromHolder: '', toHolder: '' }), expectedCount: e.target.value } })} />
              <Button size="sm" variant="secondary" onClick={() => createTransfer(s.id)}>Create transfer</Button>
            </div>
          </Surface>
        ))
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ Valuation (COE) */

type ValuationAssignment = { id: number; examSubjectId: number; scriptBatchId: number; examinerId: number; examinerName: string; courseCode: string; courseName: string; status: string; marksPayload: unknown; submittedAt: string | null; lockedAt: string | null };

export function CoeValuationPage() {
  useDocumentTitle('Digital Valuation');
  const [rows, setRows] = useState<ValuationAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    return api<{ assignments: ValuationAssignment[] }>('/api/examinations/valuation/assignments')
      .then((d) => setRows(d.assignments))
      .catch((e) => setMessage(errText(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const correct = async (a: ValuationAssignment) => {
    const questionRef = window.prompt('Question reference to correct'); if (!questionRef) return;
    const newMarks = window.prompt('New marks'); if (newMarks == null) return;
    const reason = window.prompt('Correction reason'); if (!reason) return;
    try { await api(`/api/examinations/valuation/assignments/${a.id}/correct`, { method: 'POST', body: JSON.stringify({ questionRef, newMarks: Number(newMarks), reason }) }); setMessage('Correction recorded (history preserved).'); await load(); }
    catch (e) { setMessage(errText(e)); }
  };

  const byStatus = (status: string) => rows.filter((r) => r.status === status);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Digital Valuation" subtitle="Valuation assignments across the COE workflow states" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {['ASSIGNED', 'DRAFT', 'LOCKED'].map((s) => (
          <Surface key={s}><p className="text-sm text-ink-muted">{s}</p><p className="text-2xl font-semibold">{byStatus(s).length}</p></Surface>
        ))}
      </div>
      <Surface>
        <h2 className="font-semibold">Assignments</h2>
        {rows.length === 0 ? <EmptyState title="No valuation assignments" body="Assign script batches to examiners to begin valuation." /> : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[820px] w-full text-sm">
              <thead><tr>{['Course', 'Examiner', 'Status', 'Total', 'Submitted', ''].map((h) => <th key={h} className="pb-2 text-left text-ink-muted">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((a) => {
                  const total = (a.marksPayload as { total?: number } | null)?.total ?? (Array.isArray((a.marksPayload as { questions?: unknown[] })?.questions) ? '—' : '—');
                  return (
                    <tr key={a.id} className="border-t border-border">
                      <td className="py-2">{a.courseCode}</td>
                      <td className="py-2">{a.examinerName}</td>
                      <td className="py-2"><StatusBadge status={a.status} /></td>
                      <td className="py-2">{String(total)}</td>
                      <td className="py-2 text-ink-muted">{a.submittedAt ? formatDate(a.submittedAt) : '—'}</td>
                      <td className="py-2">{a.status === 'LOCKED' ? <button className="text-accent" onClick={() => correct(a)}>Correct</button> : null}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </div>
  );
}

/* ------------------------------------------------------------------ Valuation (Examiner) */

type QuestionRow = { ref: string; max: string; awarded: string };

export function ExaminerValuationPage() {
  useDocumentTitle('My Valuations');
  const [rows, setRows] = useState<ValuationAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [active, setActive] = useState<ValuationAssignment | null>(null);
  const [questions, setQuestions] = useState<QuestionRow[]>([{ ref: 'Q1', max: '', awarded: '' }]);

  const load = useCallback(() => {
    setLoading(true);
    return api<{ assignments: ValuationAssignment[] }>('/api/examinations/valuation/assignments')
      .then((d) => setRows(d.assignments))
      .catch((e) => setMessage(errText(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const open = (a: ValuationAssignment) => {
    setActive(a);
    const existing = (a.marksPayload as { questions?: QuestionRow[] } | null)?.questions;
    setQuestions(existing?.length ? existing.map((q) => ({ ref: String(q.ref), max: String(q.max), awarded: String(q.awarded) })) : [{ ref: 'Q1', max: '', awarded: '' }]);
  };

  const save = async (submit: boolean) => {
    if (!active) return;
    const payload = { questions: questions.map((q) => ({ ref: q.ref, max: Number(q.max), awarded: Number(q.awarded) })) };
    if (submit && !window.confirm('Final submit locks this valuation. Continue?')) return;
    try {
      const res = await api<{ total: number | null }>(`/api/examinations/valuation/assignments/${active.id}`, { method: 'PUT', body: JSON.stringify({ marksPayload: payload, submit }) });
      setMessage(submit ? `Submitted and locked. Server total: ${res.total}.` : `Draft saved. Server total: ${res.total}.`);
      await load();
      if (submit) setActive(null);
    } catch (e) { setMessage(errText(e)); }
  };

  const total = questions.reduce((s, q) => s + (Number(q.awarded) || 0), 0);

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My Valuations" subtitle="Only your assigned scripts — enter question-wise marks; the server computes the authoritative total" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}
      <Surface>
        <h2 className="font-semibold">My assignments</h2>
        {rows.length === 0 ? <EmptyState title="No assignments" body="Scripts assigned to you for valuation appear here." /> : (
          <div className="mt-3 space-y-2">
            {rows.map((a) => (
              <div key={a.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 first:border-t-0 text-sm">
                <span>{a.courseCode} · {a.courseName} <StatusBadge status={a.status} /></span>
                {a.status !== 'LOCKED' ? <Button size="sm" variant="secondary" onClick={() => open(a)}>Value</Button> : <span className="text-ink-muted">Locked</span>}
              </div>
            ))}
          </div>
        )}
      </Surface>
      {active ? (
        <Surface>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold">Valuation · {active.courseCode}</h2>
            <button className="text-sm text-ink-muted" onClick={() => setActive(null)}>Close</button>
          </div>
          <div className="mt-3 space-y-2">
            {questions.map((q, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
                <Input className="w-24" placeholder="Q ref" value={q.ref} onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? { ...x, ref: e.target.value } : x)))} />
                <Input className="w-24" placeholder="Max" type="number" value={q.max} onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? { ...x, max: e.target.value } : x)))} />
                <Input className="w-28" placeholder="Awarded" type="number" value={q.awarded} onChange={(e) => setQuestions(questions.map((x, j) => (j === i ? { ...x, awarded: e.target.value } : x)))} />
                {Number(q.awarded) > Number(q.max) && q.max ? <span className="text-xs text-danger">exceeds max</span> : null}
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setQuestions([...questions, { ref: `Q${questions.length + 1}`, max: '', awarded: '' }])}>Add question</Button>
            <span className="text-sm text-ink-muted">Provisional total: <strong>{total}</strong> (server is authoritative)</span>
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => save(false)}>Save draft</Button>
              <Button size="sm" onClick={() => save(true)}>Final submit</Button>
            </div>
          </div>
        </Surface>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Results (COE) */

type ResultRow = { id: number; studentId: number; studentName: string; usn: string; version: number; published: boolean; current: boolean; sgpa: number | null; status: string; publishedAt: string | null };
type ResultCorrection = { id: number; studentId: number; fromVersion: number; toVersion: number; reason: string; createdAt: string };

export function CoeResultsPage() {
  useDocumentTitle('Results');
  const { exams } = useExams();
  const [examId, setExamId] = useState('');
  const [overview, setOverview] = useState<{ results: ResultRow[]; corrections: ResultCorrection[] } | null>(null);
  const [message, setMessage] = useState('');

  const load = async (id: string) => {
    if (!id) return;
    try {
      setOverview(await api(`/api/examinations/${Number(id)}/results/overview`));
    } catch (e) { setMessage(errText(e)); }
  };

  const process = async () => { try { await api(`/api/examinations/${Number(examId)}/results/process`, { method: 'POST' }); setMessage('Results processed.'); await load(examId); } catch (e) { setMessage(errText(e)); } };
  const publish = async () => { try { await api(`/api/examinations/${Number(examId)}/results/publish`, { method: 'POST' }); setMessage('Results published.'); await load(examId); } catch (e) { setMessage(errText(e)); } };
  const correct = async (r: ResultRow) => {
    const courseId = window.prompt('Course ID to correct'); if (!courseId) return;
    const totalMarks = window.prompt('Corrected total marks'); if (totalMarks == null) return;
    const maxMarks = window.prompt('Course max marks', '100'); if (maxMarks == null) return;
    const reason = window.prompt('Correction reason'); if (!reason) return;
    try {
      await api(`/api/examinations/results/${r.id}/correct`, { method: 'POST', body: JSON.stringify({ reason, subjectCorrections: [{ courseId: Number(courseId), totalMarks: Number(totalMarks), maxMarks: Number(maxMarks) }] }) });
      setMessage('Result corrected — a new current version supersedes the prior one.'); await load(examId);
    } catch (e) { setMessage(errText(e)); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Results" subtitle="Process, publish, and versioned corrections — superseded versions remain as history" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}
      <Surface>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={examId} onChange={(e) => { setExamId(e.target.value); void load(e.target.value); }}>
            <option value="">Select examination…</option>
            {exams.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
          {examId ? <><Button size="sm" variant="secondary" onClick={process}>Process</Button><Button size="sm" onClick={publish}>Publish</Button></> : null}
        </div>
      </Surface>
      {overview ? (
        <>
          <Surface>
            <h2 className="font-semibold">Result versions</h2>
            {overview.results.length === 0 ? <EmptyState title="No results" body="Process results to populate this exam." /> : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-[820px] w-full text-sm">
                  <thead><tr>{['USN', 'Student', 'Version', 'SGPA', 'Status', 'State', ''].map((h) => <th key={h} className="pb-2 text-left text-ink-muted">{h}</th>)}</tr></thead>
                  <tbody>
                    {overview.results.map((r) => (
                      <tr key={r.id} className={`border-t border-border ${r.current ? '' : 'text-ink-muted'}`}>
                        <td className="py-2">{r.usn}</td>
                        <td className="py-2">{r.studentName}</td>
                        <td className="py-2">V{r.version}</td>
                        <td className="py-2">{r.sgpa ?? '—'}</td>
                        <td className="py-2">{r.status}</td>
                        <td className="py-2">{r.current ? <StatusBadge status="CURRENT" /> : <StatusBadge status="SUPERSEDED" />}</td>
                        <td className="py-2">{r.current && r.published ? <button className="text-accent" onClick={() => correct(r)}>Correct</button> : null}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Surface>
          {overview.corrections.length ? (
            <Surface>
              <h2 className="font-semibold">Correction history</h2>
              <ul className="mt-2 space-y-1 text-sm text-ink-secondary">
                {overview.corrections.map((c) => <li key={c.id}>Student {c.studentId}: V{c.fromVersion} → V{c.toVersion} · {c.reason} · {formatDate(c.createdAt)}</li>)}
              </ul>
            </Surface>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ Revaluation (COE) */

type RevalRow = { id: number; studentName: string; usn: string; courseCode: string; requestType: string; status: string; examinerId: number | null; revisedMarks: number | null; decision: string | null };

export function CoeRevaluationPage() {
  useDocumentTitle('Revaluation');
  const [rows, setRows] = useState<RevalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    return api<{ requests: RevalRow[] }>('/api/examinations/revaluation')
      .then((d) => setRows(d.requests))
      .catch((e) => setMessage(errText(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const review = async (id: number, accept: boolean) => {
    const note = accept ? (window.prompt('Review note (optional)') ?? undefined) : (window.prompt('Rejection reason') || '');
    if (!accept && !note) return;
    try { await api(`/api/examinations/revaluation/${id}/review`, { method: 'POST', body: JSON.stringify({ accept, note }) }); setMessage(accept ? 'Accepted.' : 'Rejected.'); await load(); } catch (e) { setMessage(errText(e)); }
  };
  const assign = async (id: number) => {
    const examinerId = window.prompt('Examiner (faculty user) ID'); if (!examinerId) return;
    try { await api(`/api/examinations/revaluation/${id}/assign`, { method: 'POST', body: JSON.stringify({ examinerId: Number(examinerId) }) }); setMessage('Examiner assigned.'); await load(); } catch (e) { setMessage(errText(e)); }
  };
  const decide = async (id: number, decision: 'REVISED' | 'UNCHANGED') => {
    const reason = window.prompt(`Reason for ${decision}`); if (!reason) return;
    try { await api(`/api/examinations/revaluation/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision, reason }) }); setMessage(decision === 'REVISED' ? 'Decided REVISED — versioned result consequence created.' : 'Decided UNCHANGED.'); await load(); } catch (e) { setMessage(errText(e)); }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Revaluation" subtitle="Institution-owned revaluation lifecycle: review, assign, decide (REVISED yields a versioned result consequence)" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}
      <Surface>
        {rows.length === 0 ? <EmptyState title="No revaluation requests" body="Student revaluation applications appear here." /> : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full text-sm">
              <thead><tr>{['Student', 'Course', 'Type', 'Status', 'Examiner', 'Revised', 'Actions'].map((h) => <th key={h} className="pb-2 text-left text-ink-muted">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2">{r.studentName} · {r.usn}</td>
                    <td className="py-2">{r.courseCode}</td>
                    <td className="py-2">{r.requestType}</td>
                    <td className="py-2"><StatusBadge status={r.status} /></td>
                    <td className="py-2">{r.examinerId ?? '—'}</td>
                    <td className="py-2">{r.revisedMarks ?? '—'}</td>
                    <td className="py-2 space-x-2">
                      {r.status === 'REQUESTED' ? <><button className="text-accent" onClick={() => review(r.id, true)}>Accept</button><button className="text-danger" onClick={() => review(r.id, false)}>Reject</button></> : null}
                      {r.status === 'ACCEPTED' ? <button className="text-accent" onClick={() => assign(r.id)}>Assign examiner</button> : null}
                      {r.status === 'REVALUATED' ? <><button className="text-accent" onClick={() => decide(r.id, 'REVISED')}>Revised</button><button className="text-ink-secondary" onClick={() => decide(r.id, 'UNCHANGED')}>Unchanged</button></> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </div>
  );
}

/* ------------------------------------------------------------------ Revaluation (Examiner) */

type MyReval = { id: number; courseCode: string; courseName: string; requestType: string; status: string; revisedMarks: number | null };

export function ExaminerRevaluationPage() {
  useDocumentTitle('My Revaluations');
  const [rows, setRows] = useState<MyReval[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    return api<{ revaluations: MyReval[] }>('/api/examinations/my-revaluations')
      .then((d) => setRows(d.revaluations))
      .catch((e) => setMessage(errText(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (id: number) => {
    const revisedMarks = window.prompt('Revised marks'); if (revisedMarks == null) return;
    const revisedMax = window.prompt('Out of (max)', '100'); if (revisedMax == null) return;
    try { await api(`/api/examinations/revaluation/${id}/submit`, { method: 'POST', body: JSON.stringify({ revisedMarks: Number(revisedMarks), revisedMax: Number(revisedMax) }) }); setMessage('Revised marks submitted.'); await load(); } catch (e) { setMessage(errText(e)); }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My Revaluations" subtitle="Revaluations assigned to you — submit revised marks" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}
      <Surface>
        {rows.length === 0 ? <EmptyState title="No assigned revaluations" body="Revaluations the COE assigns to you appear here." /> : (
          <div className="space-y-2">
            {rows.map((r) => (
              <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-border py-2 first:border-t-0 text-sm">
                <span>{r.courseCode} · {r.courseName} <StatusBadge status={r.status} />{r.revisedMarks != null ? ` · revised ${r.revisedMarks}` : ''}</span>
                {r.status === 'ASSIGNED' ? <Button size="sm" variant="secondary" onClick={() => submit(r.id)}>Submit revised marks</Button> : null}
              </div>
            ))}
          </div>
        )}
      </Surface>
    </div>
  );
}

/* ------------------------------------------------------------------ Documents & Verification */

type ExamDocument = { id: number; documentType: string; certificateNumber: string; verificationCode: string; status: string; studentName: string; usn: string; issuedAt: string };

export function CoeDocumentsPage() {
  useDocumentTitle('Examination Documents');
  const [docs, setDocs] = useState<ExamDocument[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback((type: string) => {
    setLoading(true);
    return api<{ documents: ExamDocument[] }>(`/api/examinations/documents${type ? `?type=${type}` : ''}`)
      .then((d) => setDocs(d.documents))
      .catch((e) => setMessage(errText(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { void load(filter); }, [load, filter]);

  const revoke = async (d: ExamDocument) => {
    const reason = window.prompt(`Revoke ${d.certificateNumber}? Reason:`); if (!reason) return;
    try { await api(`/api/student-services/documents/${d.id}/revoke`, { method: 'POST', body: JSON.stringify({ reason }) }); setMessage('Document revoked (retained in history).'); await load(filter); }
    catch (e) { setMessage(errText(e)); }
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Examination Documents" subtitle="Grade cards and transcripts issued from authoritative results, with verification and revocation" />
      {message ? <p className="text-sm text-ink-secondary" role="status">{message}</p> : null}
      <Surface>
        <div className="flex flex-wrap items-center gap-2">
          <Select className="w-56" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All document types</option>
            {['GRADE_CARD', 'TRANSCRIPT', 'PROVISIONAL_RESULT'].map((x) => <option key={x}>{x}</option>)}
          </Select>
        </div>
        {loading ? <Skeleton className="mt-3 h-32 w-full" /> : docs.length === 0 ? (
          <EmptyState title="No documents" body="Grade cards and transcripts issued to students appear here. Issuance runs through the authoritative certificate workflow." />
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-[880px] w-full text-sm">
              <thead><tr>{['Number', 'Type', 'Student', 'Status', 'Verify code', 'Issued', ''].map((h) => <th key={h} className="pb-2 text-left text-ink-muted">{h}</th>)}</tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-t border-border">
                    <td className="py-2 font-mono text-xs">{d.certificateNumber}</td>
                    <td className="py-2">{d.documentType}</td>
                    <td className="py-2">{d.studentName} · {d.usn}</td>
                    <td className="py-2"><StatusBadge status={d.status} /></td>
                    <td className="py-2 font-mono text-xs">{d.verificationCode}</td>
                    <td className="py-2 text-ink-muted">{formatDate(d.issuedAt)}</td>
                    <td className="py-2">{d.status === 'VALID' ? <button className="text-danger" onClick={() => revoke(d)}>Revoke</button> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Surface>
    </div>
  );
}

type Verification = { valid: boolean; status: string; documentType: string; certificateNumber: string; title: string; studentName: string; usn: string; institution: string; issuedAt: string };

export function DocumentVerificationPage() {
  useDocumentTitle('Verify Document');
  const [code, setCode] = useState('');
  const [result, setResult] = useState<Verification | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'invalid' | 'found'>('idle');

  const verify = async () => {
    if (!code.trim()) return;
    setState('loading');
    try {
      const r = await api<Verification>(`/api/verify/document/${encodeURIComponent(code.trim())}`, { auth: false });
      setResult(r);
      setState('found');
    } catch {
      setResult(null);
      setState('invalid');
    }
  };

  const tone = result?.status === 'VALID' ? 'text-success' : result?.status === 'SUPERSEDED' ? 'text-warning' : 'text-danger';

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Verify Document" subtitle="Confirm the authenticity and current state of an issued academic document" />
      <Surface>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-ink-muted">Verification code</span>
            <Input className="mt-1 w-72" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Enter the code from the document / QR" />
          </label>
          <Button size="sm" onClick={verify}>Verify</Button>
        </div>
        {state === 'loading' ? <Skeleton className="mt-4 h-24 w-full" /> : null}
        {state === 'invalid' ? <p className="mt-4 text-sm text-danger">INVALID — no document matches this verification code.</p> : null}
        {state === 'found' && result ? (
          <div className="mt-4 rounded border border-border p-4">
            <p className={`text-lg font-semibold ${tone}`}>{result.status}{result.valid ? '' : result.status === 'VALID' ? '' : ''}</p>
            <div className="mt-2 grid gap-1 text-sm">
              <p>Document: <strong>{result.title}</strong> ({result.documentType})</p>
              <p>Number: <strong>{result.certificateNumber}</strong></p>
              <p>Issued to: <strong>{result.studentName}</strong> · {result.usn}</p>
              <p>Institution: <strong>{result.institution}</strong></p>
              <p>Issued: <strong>{formatDate(result.issuedAt)}</strong></p>
            </div>
            {result.status === 'SUPERSEDED' ? <p className="mt-2 text-sm text-warning">This document has been superseded by a newer version and is no longer current.</p> : null}
            {result.status === 'REVOKED' ? <p className="mt-2 text-sm text-danger">This document has been revoked.</p> : null}
          </div>
        ) : null}
      </Surface>
    </div>
  );
}
