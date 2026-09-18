import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Check, ChevronDown, ChevronUp, Printer, Trash2 } from 'lucide-react';
import { api, downloadLessonPlanExport } from '../lib/api';
import {
  Button,
  ConfirmDangerModal,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Surface,
  Textarea,
  useToast,
} from '../components/ui';
import { formatISODate } from '../lib/utils';
import { useDocumentTitle } from '../lib/useDocumentTitle';

type Entry = {
  id: number;
  serialNo: number;
  moduleLabel: string | null;
  moduleName: string | null;
  topicName: string;
  subtopicName: string | null;
  plannedDate: string | null;
  actualDate: string | null;
  dateChanged: boolean;
  plannedHours: number;
  actualHours: number;
  hoursChanged: boolean;
  status: string;
  remarks: string | null;
  isSupplementary: boolean;
  isFacultyAdded: boolean;
};

type PlanPayload = {
  plan: {
    id: number;
    title: string;
    status: string;
    courseName: string;
    courseCode: string;
    courseId: number;
    semesterLabel?: string;
    sectionLabel?: string;
    academicYearLabel?: string;
    holidayConflicts: number;
    requiredHours: number;
    availableHours: number;
    shortfallHours: number;
  };
  progress: {
    percent: number;
    hoursPercent: number;
    completedUnits: number;
    totalUnits: number;
    completedHours: number;
    totalHours: number;
    expectedPercent: number;
    hoursDelta: number;
    statusLabel: string | null;
    modules: Array<{
      moduleLabel: string | null;
      moduleName: string | null;
      percent: number;
      totalHours: number;
      completedHours: number;
    }>;
  };
  entries: Entry[];
};

export function LessonPlanDetailPage() {
  const { id } = useParams();
  const planId = Number(id);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<PlanPayload | null>(null);
  const [reschedule, setReschedule] = useState<Entry | null>(null);
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [mode, setMode] = useState<'THIS_ONLY' | 'SHIFT_SUBSEQUENT'>('SHIFT_SUBSEQUENT');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({ topicName: '', subtopicName: '', hours: '1' });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = () =>
    api<PlanPayload>(`/api/lesson-plans/${planId}`)
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));

  useEffect(() => {
    load();
  }, [planId]);

  useDocumentTitle(data?.plan.courseName || 'Lesson Plan');

  const complete = async (entry: Entry) => {
    await api(`/api/lesson-plans/${planId}/entries/${entry.id}/complete`, { method: 'POST', body: JSON.stringify({}) });
    toast('Marked completed');
    load();
  };

  const saveReschedule = async () => {
    if (!reschedule) return;
    try {
      await api(`/api/lesson-plans/${planId}/entries/${reschedule.id}/reschedule`, {
        method: 'POST',
        body: JSON.stringify({ actualDate: newDate, reason: reason || null, mode }),
      });
      toast('Schedule updated');
      setReschedule(null);
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not reschedule', 'error');
    }
  };

  const move = async (entry: Entry, direction: 'up' | 'down') => {
    await api(`/api/lesson-plans/${planId}/entries/${entry.id}/move`, {
      method: 'POST',
      body: JSON.stringify({ direction }),
    });
    load();
  };

  const addTopic = async () => {
    await api(`/api/lesson-plans/${planId}/entries`, {
      method: 'POST',
      body: JSON.stringify({
        topicName: addForm.topicName,
        subtopicName: addForm.subtopicName || null,
        hours: Number(addForm.hours) || 1,
        isSupplementary: true,
      }),
    });
    setAddOpen(false);
    setAddForm({ topicName: '', subtopicName: '', hours: '1' });
    load();
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api(`/api/lesson-plans/${planId}`, { method: 'DELETE' });
      toast('Lesson plan deleted');
      navigate('/lesson-plans');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete lesson plan', 'error');
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const dateLabel = (entry: Entry) => {
    if (!entry.actualDate) return '—';
    if (entry.dateChanged && entry.plannedDate) {
      return `${formatISODate(entry.plannedDate)} → ${formatISODate(entry.actualDate)}`;
    }
    return formatISODate(entry.actualDate);
  };

  const firstModule = data?.progress.modules[0];
  const unitWord = firstModule?.moduleLabel?.toLowerCase().startsWith('unit') ? 'Units' : 'Modules';

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={data?.plan.courseName || 'Lesson Plan'}
        subtitle={[data?.plan.semesterLabel, data?.plan.sectionLabel, data?.plan.academicYearLabel].filter(Boolean).join(' · ')}
        actions={
          <div className="flex flex-wrap gap-2">
            {data ? (
              <Link to={`/quizzes/create?courseId=${data.plan.courseId}`}>
                <Button variant="secondary">Create Quiz</Button>
              </Link>
            ) : null}
            <Button variant="secondary" onClick={() => setAddOpen(true)}>
              Add topic
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadLessonPlanExport(planId).catch((e) => toast(e.message, 'error'))}
            >
              Excel
            </Button>
            <Link to={`/lesson-plans/${planId}/print`} target="_blank">
              <Button variant="secondary">
                <Printer size={15} /> Print
              </Button>
            </Link>
            <Button variant="danger-soft" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={15} /> Delete
            </Button>
          </div>
        }
      />

      {data ? (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <Surface>
              <p className="text-xs text-ink-muted">Overall progress</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{data.progress.hoursPercent}%</p>
              <p className="text-xs text-ink-muted">
                {data.progress.completedUnits} / {data.progress.totalUnits} lesson units
              </p>
              <p className="text-xs text-ink-muted">
                {data.progress.completedHours} / {data.progress.totalHours} hours completed
              </p>
            </Surface>
            <Surface>
              <p className="text-xs text-ink-muted">Planned vs actual</p>
              <p className="mt-1 text-sm">Expected {data.progress.expectedPercent}%</p>
              <p className="text-sm">Actual {data.progress.hoursPercent}%</p>
              <p className="mt-1 text-xs text-ink-secondary">{data.progress.statusLabel || '—'}</p>
            </Surface>
            <Surface>
              <p className="text-xs text-ink-muted">{unitWord}</p>
              <div className="mt-2 space-y-1">
                {data.progress.modules.map((m) => (
                  <div key={`${m.moduleLabel}-${m.moduleName}`} className="flex justify-between text-xs">
                    <span>
                      {m.moduleLabel} {m.moduleName}
                    </span>
                    <span className="tabular-nums">{m.percent}%</span>
                  </div>
                ))}
              </div>
            </Surface>
          </div>

          {data.plan.holidayConflicts > 0 ? (
            <Surface className="mb-5 border-warning">
              <p className="text-sm font-medium">
                {data.plan.holidayConflicts} scheduled lesson{data.plan.holidayConflicts === 1 ? '' : 's'} fall on a newly added holiday.
              </p>
              <p className="mt-1 text-xs text-ink-muted">Reschedule the affected lesson or shift the future schedule. Completed history is left unchanged.</p>
            </Surface>
          ) : null}

          {data.plan.shortfallHours > 0 ? (
            <Surface className="mb-5">
              <p className="text-sm font-medium">Schedule shortfall</p>
              <p className="text-xs text-ink-muted">
                Required {data.plan.requiredHours} hours · Available {data.plan.availableHours} hours · Shortfall {data.plan.shortfallHours} hours
              </p>
            </Surface>
          ) : null}

          <div className="hidden md:block">
            <Surface className="!p-0 overflow-hidden">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-[12px] uppercase tracking-wide text-ink-muted">
                    <th className="px-4 py-3">Sl. No.</th>
                    <th className="px-4 py-3">Module / Unit</th>
                    <th className="px-4 py-3">Topic / Subtopic</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Hours</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.entries.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/70 align-top">
                      <td className="px-4 py-3 tabular-nums">{entry.serialNo}</td>
                      <td className="px-4 py-3">
                        <div>{entry.moduleLabel}</div>
                        <div className="text-xs text-ink-muted">{entry.moduleName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" className="text-left" onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>
                          <div className="font-medium">{entry.topicName}</div>
                          <div className="line-clamp-2 text-xs text-ink-secondary">{entry.subtopicName}</div>
                        </button>
                        {expanded === entry.id ? (
                          <div className="mt-2 text-xs text-ink-muted">
                            Planned {formatISODate(entry.plannedDate)} · Actual {formatISODate(entry.actualDate)}
                            {entry.remarks ? ` · ${entry.remarks}` : ''}
                            {entry.isSupplementary ? ' · Supplementary' : ''}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {dateLabel(entry)}
                        {entry.dateChanged ? <div className="text-[11px] text-warning">Rescheduled</div> : null}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {entry.hoursChanged ? `${entry.plannedHours} → ${entry.actualHours}` : entry.plannedHours}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={entry.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {entry.status !== 'COMPLETED' ? (
                            <>
                              <Button size="sm" onClick={() => complete(entry)}>
                                <Check size={14} /> Complete
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setReschedule(entry);
                                  setNewDate(entry.actualDate || '');
                                  setReason('');
                                  setMode('SHIFT_SUBSEQUENT');
                                }}
                              >
                                Reschedule
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => move(entry, 'up')} aria-label="Move up">
                                <ChevronUp size={14} />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => move(entry, 'down')} aria-label="Move down">
                                <ChevronDown size={14} />
                              </Button>
                              {entry.plannedHours >= 2 ? (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={async () => {
                                    const half = Math.floor(entry.plannedHours / 2);
                                    await api(`/api/lesson-plans/${planId}/entries/${entry.id}/split`, {
                                      method: 'POST',
                                      body: JSON.stringify({
                                        parts: [
                                          { topicName: `${entry.topicName} — Part 1`, subtopicName: entry.subtopicName, hours: half },
                                          {
                                            topicName: `${entry.topicName} — Part 2`,
                                            subtopicName: entry.subtopicName,
                                            hours: entry.plannedHours - half,
                                          },
                                        ],
                                      }),
                                    });
                                    load();
                                  }}
                                >
                                  Split
                                </Button>
                              ) : null}
                            </>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Surface>
          </div>

          <div className="space-y-3 md:hidden">
            {data.entries.map((entry) => (
              <Surface key={entry.id}>
                <p className="text-xs text-ink-muted">
                  {entry.serialNo} · {entry.moduleLabel}
                </p>
                <p className="mt-1 text-sm font-medium">{entry.topicName}</p>
                <p className="text-xs text-ink-secondary">{entry.subtopicName}</p>
                <p className="mt-2 text-sm">{dateLabel(entry)}</p>
                <p className="text-xs text-ink-muted">
                  {entry.plannedHours} hour{entry.plannedHours === 1 ? '' : 's'}
                </p>
                <div className="mt-2">
                  <StatusBadge status={entry.status} />
                </div>
                {entry.status !== 'COMPLETED' ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => complete(entry)}>
                      Complete
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setReschedule(entry);
                        setNewDate(entry.actualDate || '');
                        setMode('SHIFT_SUBSEQUENT');
                      }}
                    >
                      Reschedule
                    </Button>
                  </div>
                ) : null}
              </Surface>
            ))}
          </div>
        </>
      ) : null}

      <Modal
        open={Boolean(reschedule)}
        onClose={() => setReschedule(null)}
        title="Reschedule"
        footer={
          <>
            <Button variant="secondary" onClick={() => setReschedule(null)}>
              Cancel
            </Button>
            <Button onClick={saveReschedule}>Save</Button>
          </>
        }
      >
        {reschedule ? (
          <div className="space-y-3">
            <p className="text-sm">
              Planned date <span className="font-medium">{formatISODate(reschedule.plannedDate)}</span>
            </p>
            <Field label="New / actual date">
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
            </Field>
            <Field label="Reason" optional>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
            <fieldset className="space-y-2 text-sm">
              <label className="flex items-center gap-2">
                <input type="radio" checked={mode === 'THIS_ONLY'} onChange={() => setMode('THIS_ONLY')} />
                Change only this topic
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={mode === 'SHIFT_SUBSEQUENT'} onChange={() => setMode('SHIFT_SUBSEQUENT')} />
                Shift this and subsequent topics
              </label>
            </fieldset>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add supplementary topic"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addTopic} disabled={!addForm.topicName.trim()}>
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Topic">
            <Input value={addForm.topicName} onChange={(e) => setAddForm({ ...addForm, topicName: e.target.value })} />
          </Field>
          <Field label="Subtopic" optional>
            <Input value={addForm.subtopicName} onChange={(e) => setAddForm({ ...addForm, subtopicName: e.target.value })} />
          </Field>
          <Field label="Hours">
            <Input type="number" min={1} max={3} value={addForm.hours} onChange={(e) => setAddForm({ ...addForm, hours: e.target.value })} />
          </Field>
        </div>
      </Modal>
      <ConfirmDangerModal
        open={deleteOpen}
        title="Delete this lesson plan?"
        description="This permanently removes the lesson plan and its scheduled topics. This cannot be undone."
        confirmLabel="Delete Lesson Plan"
        loading={deleting}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void remove();
        }}
      />
    </div>
  );
}
