import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Archive,
  Copy,
  Download,
  ExternalLink,
  Link2,
  Printer,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  api,
  downloadAssignmentExport,
  getAssignment,
} from '../lib/api';
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
import { copyToClipboard, formatDate, formatDateTime } from '../lib/utils';
import { DEFAULT_TIMEZONE, utcToZonedLocalInput, zonedLocalToUtcIso } from '../lib/timezone';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import {
  ASSIGNMENT_DIFFICULTY_LABELS,
  ASSIGNMENT_QUESTION_TYPE_LABELS,
  ASSIGNMENT_QUESTION_TYPES,
  SOLUTION_RELEASE_LABELS,
  SOLUTION_RELEASE_POLICIES,
  formatOutcomeCodes,
  schemeFromQuestion,
  type AssignmentAuditEvent,
  type AssignmentCoPerformance,
  type AssignmentDetail,
  type AssignmentQuestion,
  type AssignmentSubmissionRow,
  type EvaluationScheme,
} from '../types/assignment';

const TABS = [
  'overview',
  'questions',
  'scheme',
  'solutions',
  'settings',
  'share',
  'submissions',
  'co-performance',
  'activity',
] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  questions: 'Questions',
  scheme: 'Scheme',
  solutions: 'Solutions',
  settings: 'Settings',
  share: 'Share',
  submissions: 'Submissions',
  'co-performance': 'CO Performance',
  activity: 'Activity Log',
};

export function AssignmentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (TABS.includes(params.get('tab') as Tab) ? params.get('tab') : 'overview') as Tab;
  const { toast } = useToast();
  const [assignment, setAssignment] = useState<AssignmentDetail | null>(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = (next?: AssignmentDetail) => {
    if (next) {
      setAssignment(next);
      return;
    }
    getAssignment(id!)
      .then((d) => setAssignment(d.assignment as AssignmentDetail))
      .catch((e) => {
        setError(e instanceof Error ? e.message : 'Failed to load');
        if (!assignment) navigate('/assignments');
      });
  };

  useEffect(() => {
    load();
  }, [id]);

  useDocumentTitle(assignment?.title);

  const run = async (action: () => Promise<unknown>, failMsg: string, nextTab?: Tab) => {
    setWorking(true);
    try {
      const res = await action();
      const payload = res as { assignment?: AssignmentDetail };
      if (payload.assignment) setAssignment(payload.assignment);
      else load();
      if (nextTab) setParams({ tab: nextTab });
    } catch (e) {
      toast(e instanceof Error ? e.message : failMsg, 'error');
    } finally {
      setWorking(false);
    }
  };

  const remove = async () => {
    setWorking(true);
    try {
      await api(`/api/assignments/${id}`, { method: 'DELETE' });
      toast('Assignment deleted');
      navigate('/assignments');
    } catch (e) {
      setDeleteOpen(false);
      toast(e instanceof Error ? e.message : 'Could not delete assignment', 'error');
    } finally {
      setWorking(false);
    }
  };

  if (error && !assignment) return <p className="text-sm text-danger">{error}</p>;
  if (!assignment) return <p className="text-sm text-ink-muted">Loading assignment…</p>;

  const totalMarks =
    assignment.questions?.reduce((s, q) => s + Number(q.marks), 0) ?? assignment.totalMarks ?? 0;

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title={assignment.title}
        subtitle={[assignment.courseName, assignment.moduleName].filter(Boolean).join(' · ')}
        breadcrumb={<Link to="/assignments">Assignments</Link>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={assignment.effectiveStatus} />
            {(assignment.status === 'DRAFT' || assignment.effectiveStatus === 'DRAFT') && (
              <Button
                disabled={working}
                onClick={() =>
                  run(
                    () => api(`/api/assignments/${id}/publish`, { method: 'POST' }),
                    'Publish failed',
                    'share',
                  )
                }
              >
                Publish
              </Button>
            )}
            {assignment.effectiveStatus === 'ACTIVE' || assignment.status === 'PUBLISHED' ? (
              <Button
                variant="secondary"
                disabled={working}
                onClick={() =>
                  run(() => api(`/api/assignments/${id}/close`, { method: 'POST' }), 'Close failed')
                }
              >
                <XCircle size={14} /> Close
              </Button>
            ) : null}
            {assignment.status === 'CLOSED' ? (
              <Button
                variant="secondary"
                disabled={working}
                onClick={() =>
                  run(() => api(`/api/assignments/${id}/reopen`, { method: 'POST' }), 'Reopen failed')
                }
              >
                Reopen
              </Button>
            ) : null}
            <Link to={`/assignments/${id}/print`}>
              <Button variant="secondary">
                <Printer size={14} /> Print
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() =>
                downloadAssignmentExport(assignment.id).catch((e) =>
                  toast(e instanceof Error ? e.message : 'Export failed', 'error'),
                )
              }
            >
              <Download size={14} /> Export
            </Button>
            <Button variant="danger-soft" disabled={working} onClick={() => setDeleteOpen(true)}>
              <Trash2 size={14} /> Delete
            </Button>
            {assignment.status !== 'ARCHIVED' ? (
              <Button
                variant="secondary"
                disabled={working}
                onClick={() =>
                  run(() => api(`/api/assignments/${id}/archive`, { method: 'POST' }), 'Archive failed')
                }
              >
                <Archive size={14} /> Archive
              </Button>
            ) : null}
          </div>
        }
      />

      <div className="mb-1 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setParams({ tab: t })}
            className={`px-3 py-2 text-sm ${
              tab === t ? 'border-b-2 border-accent font-medium text-ink' : 'text-ink-muted'
            }`}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <Surface className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Questions', assignment.questions?.length ?? assignment.questionCount ?? 0],
            ['Total marks', totalMarks],
            ['Submissions', assignment.submissionCount ?? 0],
            ['Due', assignment.dueAt ? formatDate(String(assignment.dueAt)) : '—'],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-xs uppercase tracking-wide text-ink-muted">{label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
            </div>
          ))}
          {assignment.assignmentNumber ? (
            <div className="sm:col-span-2">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Number</p>
              <p className="mt-1 text-sm font-medium">{assignment.assignmentNumber}</p>
            </div>
          ) : null}
          {assignment.instructions ? (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="text-xs uppercase tracking-wide text-ink-muted">Instructions</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink-secondary">{assignment.instructions}</p>
            </div>
          ) : null}
        </Surface>
      ) : null}

      {tab === 'questions' ? (
        <QuestionsTab assignment={assignment} onChange={setAssignment} />
      ) : null}
      {tab === 'scheme' ? <SchemeTab assignment={assignment} onChange={setAssignment} /> : null}
      {tab === 'solutions' ? <SolutionsTab assignment={assignment} onChange={setAssignment} /> : null}
      {tab === 'settings' ? <SettingsTab assignment={assignment} onChange={setAssignment} /> : null}
      {tab === 'share' ? <ShareTab assignment={assignment} /> : null}
      {tab === 'submissions' ? <SubmissionsTab assignment={assignment} /> : null}
      {tab === 'co-performance' ? <CoPerfTab assignmentId={assignment.id} /> : null}
      {tab === 'activity' ? <ActivityTab assignmentId={assignment.id} initial={assignment.audit} /> : null}
      <ConfirmDangerModal
        open={deleteOpen}
        title="Delete this assignment?"
        description="This removes the assignment from your list. Assignments with student submissions cannot be deleted — archive them instead."
        confirmLabel="Delete Assignment"
        loading={working}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => {
          void remove();
        }}
      />
    </div>
  );
}

function CoBadges({ q }: { q: AssignmentQuestion }) {
  return (
    <p className="text-xs text-ink-muted">
      {q.primaryCoCode ? (
        <span className="font-medium text-ink">Primary CO: {q.primaryCoCode}</span>
      ) : (
        <span>No primary CO</span>
      )}
      {q.derivedOutcomes?.pos?.length ? ` · PO ${formatOutcomeCodes(q.derivedOutcomes.pos)}` : ''}
      {q.derivedOutcomes?.psos?.length ? ` · PSO ${formatOutcomeCodes(q.derivedOutcomes.psos)}` : ''}
      {q.derivedOutcomes?.sdgs?.length ? ` · SDG ${formatOutcomeCodes(q.derivedOutcomes.sdgs)}` : ''}
    </p>
  );
}

function QuestionsTab({
  assignment,
  onChange,
}: {
  assignment: AssignmentDetail;
  onChange: (a: AssignmentDetail) => void;
}) {
  const { toast } = useToast();
  const [bankOpen, setBankOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [editQ, setEditQ] = useState<AssignmentQuestion | null>(null);
  const [bankQs, setBankQs] = useState<AssignmentQuestion[]>([]);
  const [bankPick, setBankPick] = useState<number[]>([]);
  const [custom, setCustom] = useState({
    questionText: '',
    questionType: 'DESCRIPTIVE',
    marks: '10',
    difficulty: 'INTERMEDIATE',
    primaryCoCode: '',
    expectedAnswerGuidance: '',
  });

  const replace = async (questionId: number) => {
    try {
      const d = await api<{ assignment: AssignmentDetail }>(
        `/api/assignments/${assignment.id}/questions/${questionId}/replace`,
        { method: 'POST' },
      );
      onChange(d.assignment);
      toast('Question replaced');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Replace failed', 'error');
    }
  };

  const remove = async (questionId: number) => {
    try {
      const d = await api<{ assignment: AssignmentDetail }>(
        `/api/assignments/${assignment.id}/questions/${questionId}`,
        { method: 'DELETE' },
      );
      onChange(d.assignment);
      toast('Question removed');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Remove failed', 'error');
    }
  };

  const openBank = async () => {
    if (!assignment.courseId) {
      toast('Assignment needs a subject to browse the bank', 'error');
      return;
    }
    const params = new URLSearchParams({
      courseId: String(assignment.courseId),
      pageSize: '80',
    });
    const d = await api<{ questions: AssignmentQuestion[] }>(`/api/assignment-bank/questions?${params}`);
    setBankQs(d.questions);
    setBankPick([]);
    setBankOpen(true);
  };

  const addFromBank = async () => {
    if (!bankPick.length) return;
    try {
      const d = await api<{ assignment: AssignmentDetail }>(
        `/api/assignments/${assignment.id}/questions/from-bank`,
        { method: 'POST', body: JSON.stringify({ bankQuestionIds: bankPick }) },
      );
      onChange(d.assignment);
      setBankOpen(false);
      toast(`Added ${bankPick.length} question(s)`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not add from bank', 'error');
    }
  };

  const saveCustom = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const d = await api<{ assignment: AssignmentDetail }>(`/api/assignments/${assignment.id}/questions`, {
        method: 'POST',
        body: JSON.stringify({
          questionText: custom.questionText,
          questionType: custom.questionType,
          marks: Number(custom.marks) || 10,
          difficulty: custom.difficulty || null,
          primaryCoCode: custom.primaryCoCode || null,
          expectedAnswerGuidance: custom.expectedAnswerGuidance || null,
        }),
      });
      onChange(d.assignment);
      setCustomOpen(false);
      toast('Custom question added');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add question', 'error');
    }
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editQ) return;
    try {
      const d = await api<{ assignment: AssignmentDetail }>(
        `/api/assignments/${assignment.id}/questions/${editQ.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            questionText: editQ.questionText,
            questionType: editQ.questionType,
            marks: Number(editQ.marks),
            difficulty: editQ.difficulty,
            primaryCoCode: editQ.primaryCoCode,
            expectedAnswerGuidance: editQ.expectedAnswerGuidance ?? editQ.modelSolution,
          }),
        },
      );
      onChange(d.assignment);
      setEditQ(null);
      toast('Question updated');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  return (
    <div className="space-y-3">
      {assignment.canEditStructure ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={openBank}>
            Add from bank
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setCustomOpen(true)}>
            Add custom
          </Button>
        </div>
      ) : (
        <p className="text-xs text-ink-muted">Structure is locked after students start.</p>
      )}

      {assignment.questions.map((q, idx) => (
        <Surface key={q.id} className="space-y-2">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="text-sm font-semibold">
              Q{idx + 1} · {q.marks} marks ·{' '}
              {ASSIGNMENT_DIFFICULTY_LABELS[q.difficulty || ''] || q.difficulty || '—'} ·{' '}
              {ASSIGNMENT_QUESTION_TYPE_LABELS[q.questionType] || q.questionType}
            </p>
            {assignment.canEditStructure ? (
              <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="secondary" onClick={() => setEditQ(q)}>
                  Edit
                </Button>
                <Button size="sm" variant="secondary" onClick={() => replace(q.id)}>
                  Replace
                </Button>
                <Button size="sm" variant="secondary" onClick={() => remove(q.id)}>
                  Remove
                </Button>
              </div>
            ) : null}
          </div>
          <p className="text-sm text-ink whitespace-pre-wrap">{q.questionText}</p>
          <p className="text-xs text-ink-muted">{q.moduleName || 'Module'}</p>
          <CoBadges q={q} />
        </Surface>
      ))}

      <Modal open={bankOpen} onClose={() => setBankOpen(false)} title="Add from Assignment Bank">
        <div className="max-h-[50vh] space-y-2 overflow-auto">
          {bankQs.map((q) => (
            <label key={q.id} className="flex gap-2 rounded-md border border-border p-2 text-sm">
              <input
                type="checkbox"
                checked={bankPick.includes(Number(q.id))}
                onChange={() =>
                  setBankPick((prev) =>
                    prev.includes(Number(q.id))
                      ? prev.filter((x) => x !== Number(q.id))
                      : [...prev, Number(q.id)],
                  )
                }
              />
              <span className="line-clamp-3">{q.questionText}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setBankOpen(false)}>
            Cancel
          </Button>
          <Button onClick={addFromBank} disabled={!bankPick.length}>
            Add selected
          </Button>
        </div>
      </Modal>

      <Modal open={customOpen} onClose={() => setCustomOpen(false)} title="Add custom question">
        <form className="space-y-3" onSubmit={saveCustom}>
          <Field label="Question">
            <Textarea
              required
              value={custom.questionText}
              onChange={(e) => setCustom({ ...custom, questionText: e.target.value })}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Type">
              <Select
                value={custom.questionType}
                onChange={(e) => setCustom({ ...custom, questionType: e.target.value })}
              >
                {ASSIGNMENT_QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {ASSIGNMENT_QUESTION_TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Marks">
              <Input
                type="number"
                min={1}
                value={custom.marks}
                onChange={(e) => setCustom({ ...custom, marks: e.target.value })}
              />
            </Field>
            <Field label="Difficulty">
              <Select
                value={custom.difficulty}
                onChange={(e) => setCustom({ ...custom, difficulty: e.target.value })}
              >
                <option value="EASY">Easy</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="DIFFICULT">Difficult</option>
              </Select>
            </Field>
          </div>
          <Field label="Primary CO" optional>
            <Input
              value={custom.primaryCoCode}
              onChange={(e) => setCustom({ ...custom, primaryCoCode: e.target.value })}
              placeholder="CO1"
            />
          </Field>
          <Field label="Model solution / key points" optional>
            <Textarea
              value={custom.expectedAnswerGuidance}
              onChange={(e) => setCustom({ ...custom, expectedAnswerGuidance: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setCustomOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add question</Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editQ} onClose={() => setEditQ(null)} title="Edit question">
        {editQ ? (
          <form className="space-y-3" onSubmit={saveEdit}>
            <Field label="Question">
              <Textarea
                required
                value={editQ.questionText}
                onChange={(e) => setEditQ({ ...editQ, questionText: e.target.value })}
              />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Marks">
                <Input
                  type="number"
                  min={1}
                  value={editQ.marks}
                  onChange={(e) => setEditQ({ ...editQ, marks: Number(e.target.value) || 0 })}
                />
              </Field>
              <Field label="Primary CO">
                <Input
                  value={editQ.primaryCoCode || ''}
                  onChange={(e) => setEditQ({ ...editQ, primaryCoCode: e.target.value })}
                />
              </Field>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setEditQ(null)}>
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  );
}

function SchemeTab({
  assignment,
  onChange,
}: {
  assignment: AssignmentDetail;
  onChange: (a: AssignmentDetail) => void;
}) {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState<EvaluationScheme | null>(null);

  const startEdit = (q: AssignmentQuestion) => {
    const scheme = schemeFromQuestion(q) || {
      criteria: [{ id: 'c1', label: 'Overall quality', maxMarks: Number(q.marks) || 10 }],
      expectedKeyPoints: [],
      facultyNotes: null,
    };
    setEditingId(q.id);
    setDraft(JSON.parse(JSON.stringify(scheme)));
  };

  const save = async (q: AssignmentQuestion) => {
    if (!draft) return;
    const total = draft.criteria.reduce((s, c) => s + Number(c.maxMarks || 0), 0);
    if (Math.abs(total - Number(q.marks)) > 0.01) {
      toast(`Criteria must sum to ${q.marks} marks (currently ${total})`, 'error');
      return;
    }
    try {
      const d = await api<{ assignment: AssignmentDetail }>(
        `/api/assignments/${assignment.id}/questions/${q.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ evaluationRubric: draft, marks: q.marks }),
        },
      );
      onChange(d.assignment);
      setEditingId(null);
      toast('Scheme saved');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-ink-muted">
        Evaluation scheme criteria must sum to each question&apos;s marks. Used when marking submissions.
      </p>
      {assignment.questions.map((q, idx) => {
        const scheme = schemeFromQuestion(q);
        const isEditing = editingId === q.id;
        return (
          <Surface key={q.id} className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold">
                Q{idx + 1} · {q.marks} marks · {q.primaryCoCode || 'No CO'}
              </p>
              {assignment.canEditStructure ? (
                <Button size="sm" variant="secondary" onClick={() => (isEditing ? setEditingId(null) : startEdit(q))}>
                  {isEditing ? 'Cancel' : 'Edit scheme'}
                </Button>
              ) : null}
            </div>
            <p className="line-clamp-2 text-xs text-ink-muted">{q.questionText}</p>
            {isEditing && draft ? (
              <div className="space-y-2">
                {draft.criteria.map((c, i) => (
                  <div key={c.id} className="grid gap-2 sm:grid-cols-[1fr_80px]">
                    <Input
                      value={c.label}
                      onChange={(e) => {
                        const next = { ...draft, criteria: [...draft.criteria] };
                        next.criteria[i] = { ...c, label: e.target.value };
                        setDraft(next);
                      }}
                    />
                    <Input
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={c.maxMarks}
                      onChange={(e) => {
                        const next = { ...draft, criteria: [...draft.criteria] };
                        next.criteria[i] = { ...c, maxMarks: Number(e.target.value) || 0 };
                        setDraft(next);
                      }}
                    />
                  </div>
                ))}
                <Button size="sm" onClick={() => save(q)}>
                  Save scheme
                </Button>
              </div>
            ) : scheme?.criteria?.length ? (
              <ul className="space-y-1 text-sm">
                {scheme.criteria.map((c) => (
                  <li key={c.id} className="flex justify-between gap-2">
                    <span>{c.label}</span>
                    <span className="tabular-nums text-ink-muted">{c.maxMarks}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No scheme yet — edit to add criteria.</p>
            )}
          </Surface>
        );
      })}
    </div>
  );
}

function SolutionsTab({
  assignment,
  onChange,
}: {
  assignment: AssignmentDetail;
  onChange: (a: AssignmentDetail) => void;
}) {
  const { toast } = useToast();
  const [drafts, setDrafts] = useState<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    for (const q of assignment.questions) {
      map[q.id] = q.expectedAnswerGuidance || q.modelSolution || '';
    }
    return map;
  });

  const save = async (q: AssignmentQuestion) => {
    try {
      const d = await api<{ assignment: AssignmentDetail }>(
        `/api/assignments/${assignment.id}/questions/${q.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ expectedAnswerGuidance: drafts[q.id] || null }),
        },
      );
      onChange(d.assignment);
      toast('Model solution saved');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    }
  };

  const release = async () => {
    try {
      const d = await api<{ assignment: AssignmentDetail }>(
        `/api/assignments/${assignment.id}/release-solutions`,
        { method: 'POST' },
      );
      onChange(d.assignment);
      toast('Solutions marked released');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Release failed', 'error');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-muted">
          Faculty-only model solutions / expected key points. Policy:{' '}
          {SOLUTION_RELEASE_LABELS[assignment.solutionReleasePolicy || ''] ||
            assignment.solutionReleasePolicy ||
            'Manual'}
          {assignment.solutionsReleasedAt
            ? ` · Released ${formatDateTime(String(assignment.solutionsReleasedAt))}`
            : ''}
        </p>
        <Button variant="secondary" onClick={release}>
          Release solutions
        </Button>
      </div>
      {assignment.questions.map((q, idx) => (
        <Surface key={q.id} className="space-y-2">
          <p className="text-sm font-semibold">Q{idx + 1}</p>
          <p className="text-xs text-ink-muted line-clamp-2">{q.questionText}</p>
          <Textarea
            className="min-h-28"
            value={drafts[q.id] || ''}
            disabled={!assignment.canEditStructure && assignment.status !== 'DRAFT'}
            onChange={(e) => setDrafts({ ...drafts, [q.id]: e.target.value })}
            placeholder="Model answer / expected key points…"
          />
          {assignment.canEditStructure || assignment.status === 'DRAFT' ? (
            <Button size="sm" onClick={() => save(q)}>
              Save solution
            </Button>
          ) : null}
        </Surface>
      ))}
    </div>
  );
}

function SettingsTab({
  assignment,
  onChange,
}: {
  assignment: AssignmentDetail;
  onChange: (a: AssignmentDetail) => void;
}) {
  const { toast } = useToast();
  const tz = assignment.timezone || DEFAULT_TIMEZONE;
  const totalMarks = assignment.questions.reduce((s, q) => s + Number(q.marks), 0);
  const [form, setForm] = useState({
    title: assignment.title,
    assignmentNumber: assignment.assignmentNumber || '',
    instructions: assignment.instructions || '',
    startAt: assignment.startAt ? utcToZonedLocalInput(String(assignment.startAt), tz) : '',
    dueAt: assignment.dueAt ? utcToZonedLocalInput(String(assignment.dueAt), tz) : '',
    lateSubmissionAllowed: !!assignment.lateSubmissionAllowed,
    lateDeadlineAt: assignment.lateDeadlineAt
      ? utcToZonedLocalInput(String(assignment.lateDeadlineAt), tz)
      : '',
    showMarksImmediately: !!assignment.showMarksImmediately,
    showFeedbackAfterEvaluation: assignment.showFeedbackAfterEvaluation !== false,
    attemptsAllowed: String(assignment.attemptsAllowed ?? 1),
    passPercentage: String(assignment.passPercentage ?? 40),
    solutionReleasePolicy: String(assignment.solutionReleasePolicy || 'MANUAL_RELEASE'),
  });

  const save = async () => {
    try {
      const d = await api<{ assignment: AssignmentDetail }>(`/api/assignments/${assignment.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: form.title,
          assignmentNumber: form.assignmentNumber || null,
          instructions: form.instructions,
          startAt: form.startAt ? zonedLocalToUtcIso(form.startAt, tz) : null,
          dueAt: form.dueAt ? zonedLocalToUtcIso(form.dueAt, tz) : null,
          lateSubmissionAllowed: form.lateSubmissionAllowed,
          lateDeadlineAt:
            form.lateSubmissionAllowed && form.lateDeadlineAt
              ? zonedLocalToUtcIso(form.lateDeadlineAt, tz)
              : null,
          showMarksImmediately: form.showMarksImmediately,
          showFeedbackAfterEvaluation: form.showFeedbackAfterEvaluation,
          attemptsAllowed: Number(form.attemptsAllowed),
          passPercentage: Number(form.passPercentage),
          solutionReleasePolicy: form.solutionReleasePolicy,
        }),
      });
      onChange(d.assignment);
      toast('Settings saved');
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Save failed', 'error');
    }
  };

  return (
    <Surface className="max-w-2xl space-y-3">
      <Field label="Title">
        <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="Assignment number" optional>
        <Input
          value={form.assignmentNumber}
          onChange={(e) => setForm({ ...form, assignmentNumber: e.target.value })}
          placeholder="A1 / Assignment-03"
        />
      </Field>
      <Field label="Instructions">
        <Textarea
          value={form.instructions}
          onChange={(e) => setForm({ ...form, instructions: e.target.value })}
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Start">
          <Input
            type="datetime-local"
            value={form.startAt}
            onChange={(e) => setForm({ ...form, startAt: e.target.value })}
          />
        </Field>
        <Field label="Due">
          <Input
            type="datetime-local"
            value={form.dueAt}
            onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.lateSubmissionAllowed}
          onChange={(e) => setForm({ ...form, lateSubmissionAllowed: e.target.checked })}
        />
        Allow late submission
      </label>
      {form.lateSubmissionAllowed ? (
        <Field label="Late deadline">
          <Input
            type="datetime-local"
            value={form.lateDeadlineAt}
            onChange={(e) => setForm({ ...form, lateDeadlineAt: e.target.value })}
          />
        </Field>
      ) : null}
      <Field label="Total marks (auto)">
        <Input value={String(totalMarks)} disabled />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Attempts allowed">
          <Input
            type="number"
            min={1}
            value={form.attemptsAllowed}
            onChange={(e) => setForm({ ...form, attemptsAllowed: e.target.value })}
          />
        </Field>
        <Field label="Pass %">
          <Input
            type="number"
            min={0}
            max={100}
            value={form.passPercentage}
            onChange={(e) => setForm({ ...form, passPercentage: e.target.value })}
          />
        </Field>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.showMarksImmediately}
          onChange={(e) => setForm({ ...form, showMarksImmediately: e.target.checked })}
        />
        Show marks immediately (usually off for assignments)
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={form.showFeedbackAfterEvaluation}
          onChange={(e) => setForm({ ...form, showFeedbackAfterEvaluation: e.target.checked })}
        />
        Show feedback after evaluation
      </label>
      <Field label="Solution release policy">
        <Select
          value={form.solutionReleasePolicy}
          onChange={(e) => setForm({ ...form, solutionReleasePolicy: e.target.value })}
        >
          {SOLUTION_RELEASE_POLICIES.map((p) => (
            <option key={p} value={p}>
              {SOLUTION_RELEASE_LABELS[p]}
            </option>
          ))}
        </Select>
      </Field>
      <Button onClick={save}>Save settings</Button>
    </Surface>
  );
}

function ShareTab({ assignment }: { assignment: AssignmentDetail }) {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const url = assignment.shareCode ? `${origin}/a/${assignment.shareCode}` : '';
  const { toast } = useToast();
  if (!url) {
    return (
      <Surface>
        <p className="text-sm text-ink-muted">Publish the assignment to generate a share link and QR code.</p>
      </Surface>
    );
  }
  return (
    <Surface className="flex flex-col items-start gap-4 sm:flex-row">
      <div className="flex-1 space-y-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Link2 size={14} /> Shareable link
        </p>
        <a className="break-all text-sm text-accent underline" href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={async () => {
              await copyToClipboard(url);
              toast('Link copied');
            }}
          >
            <Copy size={14} /> Copy link
          </Button>
          <a href={url} target="_blank" rel="noreferrer">
            <Button variant="secondary">
              <ExternalLink size={14} /> Open
            </Button>
          </a>
        </div>
      </div>
      <div className="rounded-md border border-border bg-white p-3">
        <QRCodeSVG value={url} size={160} />
      </div>
    </Surface>
  );
}

function SubmissionsTab({ assignment }: { assignment: AssignmentDetail }) {
  const [rows, setRows] = useState<AssignmentSubmissionRow[]>([]);

  useEffect(() => {
    api<{ submissions: AssignmentSubmissionRow[] }>(`/api/assignments/${assignment.id}/submissions`)
      .then((d) => setRows(d.submissions))
      .catch(console.error);
  }, [assignment.id]);

  return (
    <Surface className="overflow-hidden p-0">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-border bg-surface-muted/40 text-xs uppercase text-ink-muted">
          <tr>
            <th className="px-3 py-2">Student</th>
            <th className="px-3 py-2">Submitted</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Marks</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.submissionToken || r.id} className="border-b border-border/60 hover:bg-surface-muted/50">
              <td className="px-3 py-2">
                <div className="font-medium">{r.studentName}</div>
                <div className="text-xs text-ink-muted">{r.usn || r.studentUsn}</div>
              </td>
              <td className="px-3 py-2 text-ink-muted">
                {r.submittedAt ? formatDateTime(String(r.submittedAt)) : '—'}
                {r.isLate ? ' · LATE' : ''}
              </td>
              <td className="px-3 py-2">
                {r.status}
                <div className="text-xs text-ink-muted">{r.evaluationStatus}</div>
              </td>
              <td className="px-3 py-2 tabular-nums">
                {r.obtainedMarks != null ? `${r.obtainedMarks}/${r.totalMarks}` : '—'}
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  className="text-sm font-medium text-accent hover:underline"
                  to={`/assignments/${assignment.id}/submissions/${encodeURIComponent(r.submissionToken)}`}
                >
                  Evaluate
                </Link>
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-ink-muted">
                No submissions yet.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </Surface>
  );
}

function CoPerfTab({ assignmentId }: { assignmentId: number }) {
  const [data, setData] = useState<AssignmentCoPerformance | null>(null);
  useEffect(() => {
    api<AssignmentCoPerformance>(`/api/assignments/${assignmentId}/co-performance`)
      .then(setData)
      .catch(console.error);
  }, [assignmentId]);
  if (!data) return <p className="text-sm text-ink-muted">Loading CO performance…</p>;
  return (
    <Surface className="space-y-3">
      <p className="text-sm text-ink-muted">
        {data.note} · {data.evaluatedSubmissionCount} evaluated submission(s)
      </p>
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase text-ink-muted">
          <tr>
            <th className="py-2">CO</th>
            <th className="py-2">Questions</th>
            <th className="py-2">Marks available</th>
            <th className="py-2">Class average</th>
            <th className="py-2">Avg %</th>
          </tr>
        </thead>
        <tbody>
          {(data.cos || []).map((r) => (
            <tr key={r.coCode} className="border-t border-border">
              <td className="py-2 font-medium">{r.coCode}</td>
              <td className="py-2 tabular-nums">{r.questionCount}</td>
              <td className="py-2 tabular-nums">{r.availableMarks}</td>
              <td className="py-2 tabular-nums">
                {r.classAverageMarks} / {r.availableMarks}
              </td>
              <td className="py-2 tabular-nums">
                {r.averagePercent != null ? `${r.averagePercent}%` : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Surface>
  );
}

function ActivityTab({
  assignmentId,
  initial,
}: {
  assignmentId: number;
  initial?: AssignmentAuditEvent[];
}) {
  const [events, setEvents] = useState<AssignmentAuditEvent[]>(initial || []);
  useEffect(() => {
    api<{ events: AssignmentAuditEvent[] }>(`/api/assignments/${assignmentId}/activity`)
      .then((d) => setEvents(d.events || []))
      .catch(console.error);
  }, [assignmentId]);

  return (
    <Surface className="space-y-2">
      {events.length ? (
        <ul className="space-y-2 text-sm">
          {events.map((e, i) => (
            <li key={e.id ?? i} className="flex flex-wrap justify-between gap-2 border-b border-border/60 pb-2">
              <span>
                <span className="font-medium">{e.action}</span>
                {(e.actor || e.actorName) ? (
                  <span className="text-ink-muted"> · {e.actor || e.actorName}</span>
                ) : null}
              </span>
              <span className="text-xs text-ink-muted">
                {e.createdAt ? formatDateTime(String(e.createdAt)) : ''}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">No activity yet.</p>
      )}
      <p className="pt-2 text-xs text-ink-muted">
        <Archive size={12} className="mr-1 inline" />
        Archive via API when the assignment is closed and no longer needed.
      </p>
    </Surface>
  );
}

