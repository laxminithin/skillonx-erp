import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Button, Input, Modal, Surface } from '../../components/ui';
import { formatDate } from '../../lib/utils';

export type CoverageRow = {
  id: number;
  affectedDate: string;
  className: string;
  classCode?: string | null;
  sectionName?: string | null;
  subjectName: string;
  subjectCode?: string | null;
  roomName?: string | null;
  periodNumber?: number | null;
  startTime: string;
  endTime: string;
  status: string;
  coverageType: string | null;
  substituteName?: string | null;
  substituteEmployeeId?: number | null;
  hodActionRequired?: boolean;
  plannedTopic?: string | null;
  makeupDate?: string | null;
  makeupStartTime?: string | null;
};

export type EligibleFaculty = {
  employeeId: number;
  displayName: string;
  employeeNumber: string;
  designationName: string | null;
  departmentName: string | null;
  available: boolean;
  unavailableReason: string | null;
  code: string | null;
};

export type SwapSession = {
  targetTimetableSlotId: number;
  targetDate: string;
  subjectName: string;
  className: string;
  startTime: string;
  endTime: string;
  periodNumber: number | null;
  available: boolean;
  conflictCode: string | null;
  conflictMessage: string | null;
};

function fmtTime(t: string) {
  return String(t).slice(0, 5);
}

function coverageLabel(c: CoverageRow) {
  if (c.coverageType === 'SUBSTITUTE_FACULTY') {
    if (c.status === 'REQUESTED') return `Substitute requested — ${c.substituteName ?? 'pending'}`;
    if (c.status === 'ACCEPTED') return `Substitute accepted — ${c.substituteName ?? ''}`;
    if (c.status === 'VERIFIED') return `Substitute — ${c.substituteName ?? ''}`;
  }
  if (c.coverageType === 'CLASS_SWAP') return 'Class swap';
  if (c.coverageType === 'RESCHEDULE') {
    return `Rescheduled — ${c.makeupDate ? formatDate(c.makeupDate) : ''} ${c.makeupStartTime ?? ''}`;
  }
  if (c.coverageType === 'HOD_ARRANGEMENT' || c.hodActionRequired) return 'HOD arrangement';
  if (c.coverageType === 'CANCELLED_WITH_AUTHORIZATION') return 'Authorized cancellation';
  return c.coverageType || 'Unresolved';
}

function isResolved(c: CoverageRow) {
  return ['ACCEPTED', 'VERIFIED', 'COMPLETED'].includes(c.status);
}

export function FacultyPicker({
  coverageId,
  managerMode,
  onSelect,
  onCancel,
}: {
  coverageId: number;
  managerMode?: boolean;
  onSelect: (f: EligibleFaculty) => void;
  onCancel: () => void;
}) {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<EligibleFaculty[]>([]);
  const [loading, setLoading] = useState(true);
  const base = managerMode ? '/api/hr/manager/coverage' : '/api/hr/me/leave/coverage';

  useEffect(() => {
    setLoading(true);
    const q = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : '';
    api<EligibleFaculty[]>(`${base}/${coverageId}/eligible-substitutes${q}`)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [coverageId, search, base]);

  return (
    <div className="mt-3 space-y-2 rounded border border-border bg-surface-muted/40 p-3">
      <Input placeholder="Search name or employee #" value={search} onChange={(e) => setSearch(e.target.value)} />
      {loading ? <p className="text-xs text-ink-muted">Loading faculty…</p> : null}
      <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
        {rows.map((f) => (
          <li key={f.employeeId}>
            <button
              type="button"
              disabled={!f.available}
              className={`w-full rounded px-2 py-2 text-left ${f.available ? 'hover:bg-surface-muted' : 'opacity-60'}`}
              onClick={() => f.available && onSelect(f)}
            >
              <span className="font-medium">{f.displayName}</span>
              <span className="block text-xs text-ink-muted">
                {[f.designationName, f.departmentName].filter(Boolean).join(' · ')}
              </span>
              <span className={`block text-xs ${f.available ? 'text-success' : 'text-warning'}`}>
                {f.available ? 'Available' : `Unavailable — ${f.unavailableReason ?? 'conflict'}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" onClick={onCancel}>Cancel</Button>
    </div>
  );
}

export function CoverageClassCard({
  coverage,
  requestId,
  onUpdated,
  managerMode,
}: {
  coverage: CoverageRow;
  requestId: number;
  onUpdated: () => void;
  managerMode?: boolean;
}) {
  const [mode, setMode] = useState<'none' | 'substitute' | 'swap' | 'reschedule' | 'confirm-sub' | 'confirm-hod'>('none');
  const [selectedFaculty, setSelectedFaculty] = useState<EligibleFaculty | null>(null);
  const [swapPartnerId, setSwapPartnerId] = useState<number | null>(null);
  const [swapSessions, setSwapSessions] = useState<SwapSession[]>([]);
  const [swapSource, setSwapSource] = useState<Record<string, unknown> | null>(null);
  const [makeupDate, setMakeupDate] = useState('');
  const [makeupStart, setMakeupStart] = useState('14:00');
  const [makeupEnd, setMakeupEnd] = useState('15:00');
  const [availability, setAvailability] = useState<{ available: boolean; code?: string; message?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const resolved = isResolved(coverage);

  async function sendSubstitute() {
    if (!selectedFaculty) return;
    setBusy(true);
    try {
      const path = managerMode
        ? `/api/hr/manager/coverage/${coverage.id}/assign-substitute`
        : `/api/hr/me/leave/coverage/${coverage.id}/substitute`;
      await api(path, {
        method: 'POST',
        body: JSON.stringify({ coverageId: coverage.id, substituteEmployeeId: selectedFaculty.employeeId }),
      });
      setMsg('Request sent — awaiting acceptance.');
      setMode('none');
      onUpdated();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  async function loadSwapSessions(employeeId: number) {
    setSwapPartnerId(employeeId);
    const data = await api<{ source: Record<string, unknown>; sessions: SwapSession[] }>(
      `/api/hr/me/leave/coverage/${coverage.id}/swap-sessions?swapEmployeeId=${employeeId}`,
    );
    setSwapSource(data.source);
    setSwapSessions(data.sessions);
  }

  async function proposeSwap(session: SwapSession) {
    if (!swapPartnerId || !session.available) return;
    setBusy(true);
    try {
      await api(`/api/hr/me/leave/coverage/${coverage.id}/swap`, {
        method: 'POST',
        body: JSON.stringify({
          coverageId: coverage.id,
          swapEmployeeId: swapPartnerId,
          targetTimetableSlotId: session.targetTimetableSlotId,
          targetDate: session.targetDate,
        }),
      });
      setMsg('Swap request sent.');
      setMode('none');
      onUpdated();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Swap failed');
    } finally {
      setBusy(false);
    }
  }

  async function checkReschedule() {
    setBusy(true);
    try {
      const result = await api<{ available: boolean; code?: string; message?: string }>(
        `/api/hr/me/leave/coverage/${coverage.id}/reschedule/check`,
        {
          method: 'POST',
          body: JSON.stringify({
            coverageId: coverage.id,
            makeupDate,
            startTime: makeupStart,
            endTime: makeupEnd,
          }),
        },
      );
      setAvailability(result);
    } catch (e) {
      setAvailability({ available: false, message: e instanceof Error ? e.message : 'Check failed' });
    } finally {
      setBusy(false);
    }
  }

  async function proposeReschedule() {
    if (!availability?.available) return;
    setBusy(true);
    try {
      const path = managerMode
        ? `/api/hr/manager/coverage/${coverage.id}/reschedule`
        : `/api/hr/me/leave/coverage/${coverage.id}/reschedule`;
      await api(path, {
        method: 'POST',
        body: JSON.stringify({
          coverageId: coverage.id,
          makeupDate,
          startTime: makeupStart,
          endTime: makeupEnd,
        }),
      });
      setMsg('Reschedule proposed.');
      setMode('none');
      onUpdated();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Reschedule failed');
    } finally {
      setBusy(false);
    }
  }

  async function requestHod() {
    setBusy(true);
    try {
      await api(`/api/hr/me/leave/coverage/${coverage.id}/request-hod`, {
        method: 'POST',
        body: JSON.stringify({ coverageId: coverage.id }),
      });
      setMsg('Submitted to HOD for arrangement.');
      setMode('none');
      onUpdated();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded border border-border p-3 text-sm">
      <p className="font-semibold">{coverage.subjectName}{coverage.subjectCode ? ` (${coverage.subjectCode})` : ''}</p>
      <p className="text-ink-muted">
        {coverage.className}{coverage.sectionName ? ` · ${coverage.sectionName}` : ''}
      </p>
      <p className="text-ink-muted">
        {formatDate(coverage.affectedDate)} · {fmtTime(coverage.startTime)}–{fmtTime(coverage.endTime)}
        {coverage.periodNumber ? ` · P${coverage.periodNumber}` : ''}
        {coverage.roomName ? ` · ${coverage.roomName}` : ''}
      </p>
      {coverage.plannedTopic ? <p className="mt-1 text-xs text-ink-muted">Planned: {coverage.plannedTopic}</p> : null}
      <p className="mt-2 font-medium">{coverageLabel(coverage)}</p>
      <p className="text-xs uppercase text-ink-muted">{coverage.status}</p>

      {!resolved && !managerMode ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setMode('substitute')}>Find Substitute</Button>
          <Button variant="secondary" size="sm" onClick={() => setMode('swap')}>Swap Class</Button>
          <Button variant="secondary" size="sm" onClick={() => setMode('reschedule')}>Reschedule</Button>
          <Button variant="secondary" size="sm" onClick={() => setMode('confirm-hod')}>Ask HOD to Arrange</Button>
        </div>
      ) : null}

      {resolved ? (
        <Button variant="secondary" size="sm" className="mt-2" onClick={() => setMode('substitute')}>Change</Button>
      ) : null}

      {mode === 'substitute' ? (
        <FacultyPicker
          coverageId={coverage.id}
          managerMode={managerMode}
          onSelect={(f) => { setSelectedFaculty(f); setMode('confirm-sub'); }}
          onCancel={() => setMode('none')}
        />
      ) : null}

      {mode === 'confirm-sub' && selectedFaculty ? (
        <Surface className="mt-3 space-y-2 p-3">
          <p>Request <strong>{selectedFaculty.displayName}</strong> to handle:</p>
          <p className="text-ink-muted">{coverage.subjectName} · {coverage.className}<br />{formatDate(coverage.affectedDate)} · {fmtTime(coverage.startTime)}–{fmtTime(coverage.endTime)}</p>
          <div className="flex flex-wrap gap-2">
            <Button onClick={sendSubstitute} disabled={busy}>Send Request</Button>
            <Button variant="secondary" onClick={() => setMode('substitute')}>Back</Button>
          </div>
        </Surface>
      ) : null}

      {mode === 'swap' ? (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium">Select swap partner</p>
          <FacultyPicker
            coverageId={coverage.id}
            onSelect={(f) => { loadSwapSessions(f.employeeId); }}
            onCancel={() => setMode('none')}
          />
          {swapSource ? (
            <p className="text-xs text-ink-muted">
              Your class: {String(swapSource.subjectName)} — {String(swapSource.className)} on {formatDate(String(swapSource.date))}
            </p>
          ) : null}
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {swapSessions.map((s) => (
              <li key={`${s.targetTimetableSlotId}-${s.targetDate}`} className="rounded border border-border p-2">
                <p>{s.subjectName} — {s.className}</p>
                <p className="text-xs text-ink-muted">{formatDate(s.targetDate)} · {fmtTime(s.startTime)}–{fmtTime(s.endTime)}</p>
                {s.available ? (
                  <Button size="sm" className="mt-1" disabled={busy} onClick={() => proposeSwap(s)}>Propose swap</Button>
                ) : (
                  <p className="text-xs text-warning">{s.conflictCode}: {s.conflictMessage}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {mode === 'reschedule' ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <label className="text-xs">Date<Input type="date" value={makeupDate} onChange={(e) => { setMakeupDate(e.target.value); setAvailability(null); }} /></label>
          <label className="text-xs">Start<Input type="time" value={makeupStart} onChange={(e) => { setMakeupStart(e.target.value); setAvailability(null); }} /></label>
          <label className="text-xs">End<Input type="time" value={makeupEnd} onChange={(e) => { setMakeupEnd(e.target.value); setAvailability(null); }} /></label>
          <Button variant="secondary" onClick={checkReschedule} disabled={busy || !makeupDate}>Check Availability</Button>
          {availability ? (
            <p className={`text-xs sm:col-span-3 ${availability.available ? 'text-success' : 'text-warning'}`}>
              {availability.available ? 'AVAILABLE' : availability.code ?? availability.message}
            </p>
          ) : null}
          <Button onClick={proposeReschedule} disabled={!availability?.available || busy}>Propose Reschedule</Button>
        </div>
      ) : null}

      {mode === 'confirm-hod' ? (
        <Surface className="mt-3 space-y-2 p-3">
          <p className="text-sm">You can submit this class to your HOD/Academic Coordinator for alternate arrangement.</p>
          <Button onClick={requestHod} disabled={busy}>Confirm HOD Arrangement</Button>
        </Surface>
      ) : null}

      {msg ? <p className="mt-2 text-xs text-ink-muted">{msg}</p> : null}
    </div>
  );
}

export function CoverageReviewList({ coverages }: { coverages: CoverageRow[] }) {
  return (
    <ul className="space-y-2 text-sm">
      {coverages.map((c) => (
        <li key={c.id} className="flex gap-2">
          <span className={isResolved(c) ? 'text-success' : 'text-warning'}>{isResolved(c) ? '✓' : '○'}</span>
          <span>
            {fmtTime(c.startTime)} {c.subjectName}
            <span className="block text-xs text-ink-muted">{coverageLabel(c)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

export function CoverageRequestsInbox() {
  const [rows, setRows] = useState<Array<{
    id: number;
    requestType: string;
    subjectName: string;
    className: string;
    affectedDate: string;
    startTime: string;
    endTime: string;
    requestedByName: string;
    swapSubjectName?: string;
    swapClassName?: string;
    swapTargetDate?: string;
    swapStartTime?: string;
    swapEndTime?: string;
  }>>([]);
  const [msg, setMsg] = useState('');

  const load = () => {
    api<typeof rows>('/api/hr/me/leave/coverage-requests').then(setRows).catch(() => setRows([]));
  };

  useEffect(() => { load(); }, []);

  async function respond(id: number, accept: boolean) {
    try {
      await api(`/api/hr/me/leave/coverage-requests/${id}/${accept ? 'accept' : 'decline'}`, { method: 'POST' });
      setMsg(accept ? 'Accepted.' : 'Declined.');
      load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed');
    }
  }

  if (!rows.length) return null;

  return (
    <Surface className="p-4">
      <h2 className="text-sm font-semibold">Coverage requests</h2>
      {msg ? <p className="mt-1 text-xs text-ink-muted">{msg}</p> : null}
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded border border-border p-3 text-sm">
            {r.requestType === 'CLASS_SWAP' ? (
              <>
                <p className="font-medium">Class swap request from {r.requestedByName}</p>
                <p className="mt-1">You handle: {r.subjectName} · {r.className} · {formatDate(r.affectedDate)} · {fmtTime(r.startTime)}</p>
                <p>You receive: {r.swapSubjectName} · {r.swapClassName} · {r.swapTargetDate ? formatDate(r.swapTargetDate) : ''}</p>
              </>
            ) : (
              <>
                <p className="font-medium">Substitute request from {r.requestedByName}</p>
                <p>{r.subjectName} · {r.className} · {formatDate(r.affectedDate)} · {fmtTime(r.startTime)}–{fmtTime(r.endTime)}</p>
              </>
            )}
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => respond(r.id, true)}>Accept</Button>
              <Button size="sm" variant="secondary" onClick={() => respond(r.id, false)}>Decline</Button>
            </div>
          </li>
        ))}
      </ul>
    </Surface>
  );
}

export type ManagerCoverageRow = {
  id: number;
  employeeName: string;
  affectedDate: string;
  subjectName: string;
  className: string;
  coverageType: string | null;
  status: string;
  priority: string;
  isEmergency?: boolean;
  startTime?: string;
  endTime?: string;
  substituteName?: string | null;
};

export function ManagerCoverageDrawer({
  coverageId,
  onClose,
  onUpdated,
}: {
  coverageId: number;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api<Record<string, unknown>>(`/api/hr/manager/coverage/${coverageId}`).then(setDetail).catch(() => setDetail(null));
  }, [coverageId]);

  const cov = detail as ManagerCoverageRow & CoverageRow | null;
  if (!cov) return null;

  async function verify() {
    await api(`/api/hr/manager/coverage/${coverageId}/verify`, { method: 'POST', body: '{}' });
    setMsg('Verified.');
    onUpdated();
  }

  async function authorizedCancel() {
    if (!cancelReason.trim()) return;
    await api(`/api/hr/manager/coverage/${coverageId}/authorized-cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: cancelReason }),
    });
    setMsg('Class cancelled with authorization.');
    onUpdated();
  }

  return (
    <Modal open onClose={onClose} title="Academic coverage action">
      <div className="max-h-[70vh] space-y-3 overflow-y-auto text-sm">
        {cov.priority === 'CRITICAL' || cov.isEmergency ? (
          <p className="rounded bg-danger/10 px-2 py-1 text-xs font-semibold text-danger">CRITICAL — Emergency coverage</p>
        ) : null}
        <p><strong>{cov.employeeName}</strong> · {formatDate(String(cov.affectedDate))}</p>
        <p>{cov.subjectName} · {cov.className} · {cov.startTime ? fmtTime(String(cov.startTime)) : ''}</p>
        <p className="text-ink-muted">Status: {cov.status} · {cov.coverageType ?? '—'}</p>
        <CoverageClassCard
          coverage={cov as CoverageRow}
          requestId={0}
          managerMode
          onUpdated={onUpdated}
        />
        <div className="flex flex-wrap gap-2 border-t border-border pt-3">
          <Button variant="secondary" onClick={verify}>Verify Arrangement</Button>
        </div>
        <div className="space-y-2 border-t border-border pt-3">
          <p className="text-xs font-medium">Authorized cancellation</p>
          <textarea className="w-full rounded border border-border p-2 text-sm" rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Reason required" />
          <p className="text-xs text-ink-muted">This class will not be conducted and students will be notified.</p>
          <Button variant="secondary" onClick={authorizedCancel} disabled={!cancelReason.trim()}>Authorized Cancellation</Button>
        </div>
        {msg ? <p className="text-xs text-ink-muted">{msg}</p> : null}
      </div>
    </Modal>
  );
}
