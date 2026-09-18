import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import {
  Archive,
  BarChart3,
  CalendarClock,
  Check,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Link2,
  LockKeyhole,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  Settings,
  Share2,
  ShieldCheck,
  Trash2,
  Users,
  XCircle,
} from 'lucide-react';
import { api, downloadExport } from '../lib/api';
import {
  Badge,
  Button,
  ConfirmDangerModal,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
} from '../components/ui';
import { copyToClipboard, formatDate, formatDateTime, humanizeStatus, statusTone, SURVEY_TYPE_LABELS } from '../lib/utils';
import {
  DEFAULT_TIMEZONE,
  formatInTimeZone,
  utcToZonedLocalInput,
  zonedLocalToUtcIso,
} from '../lib/timezone';
import { SurveyBuilder } from '../components/survey/SurveyBuilder';
import { SurveyIndirectMappingPanel } from './attainment/SurveyIndirectMappingPanel';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import {
  QUESTION_TYPE_LABELS,
  type SurveyDetail,
} from '../types/survey';

const TABS = ['overview', 'questions', 'responses', 'analytics', 'share', 'settings'] as const;
type Tab = (typeof TABS)[number];

type Lookups = {
  questionTypes: Array<{ value: string; label: string }>;
  responsePolicies?: Array<{ value: string; label: string }>;
  identityModes?: Array<{ value: string; label: string }>;
};

type ResponseRow = {
  id: number;
  usn: string;
  name: string;
  email: string | null;
  submittedAt: string;
  startedAt?: string | null;
  attemptNumber?: number;
};

type ResponseDetail = {
  identityMode: string;
  submission: {
    id: number;
    submittedAt: string;
    attemptNumber?: number;
    student: { name: string; usn: string; email?: string | null } | null;
  };
  answers: Array<{
    questionId: number;
    prompt: string;
    questionType: string;
    textAnswer?: string | null;
    numericAnswer?: number | null;
    optionLabel?: string | null;
    jsonAnswer?: Array<number | string> | null;
    comment?: string | null;
  }>;
};

type AnalyticsData = {
  responses: number;
  started?: number;
  completed?: number;
  completionRate?: number;
  averageRating: number | null;
  participation: number | null;
  questions: Array<{
    questionId: number;
    prompt: string;
    questionType: string;
    average: number | null;
    distribution: Array<{
      optionId: number;
      label: string;
      value: number | null;
      count: number;
      percent: number;
    }>;
    textResponses: string[];
  }>;
};

const DEFAULT_LOOKUPS: Lookups = {
  questionTypes: [],
  responsePolicies: [
    { value: 'ONE_PER_STUDENT', label: 'One response per student' },
    { value: 'MULTIPLE', label: 'Multiple responses allowed' },
    { value: 'ONE_PER_CYCLE', label: 'One response per survey cycle' },
  ],
  identityModes: [
    { value: 'IDENTIFIED', label: 'Identified' },
    { value: 'ANONYMOUS', label: 'Anonymous' },
  ],
};

export function SurveyDetailPage() {
  const { id } = useParams();
  const surveyId = Number(id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get('tab');
  const tab: Tab = TABS.includes(requestedTab as Tab) ? (requestedTab as Tab) : 'overview';

  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [lookups, setLookups] = useState<Lookups>(DEFAULT_LOOKUPS);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [forbidden, setForbidden] = useState(false);

  useDocumentTitle(
    tab !== 'overview' ? tab[0].toUpperCase() + tab.slice(1) : undefined,
    survey?.title || 'Survey',
  );

  const loadSurvey = async () => {
    const result = await api<{ survey: SurveyDetail }>(`/api/surveys/${surveyId}`);
    setSurvey(result.survey);
    return result.survey;
  };

  useEffect(() => {
    if (!Number.isFinite(surveyId)) {
      setError('Invalid survey link.');
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      loadSurvey(),
      api<Lookups>('/api/meta/lookups').then((data) => setLookups(data)),
    ])
      .catch((reason) => {
        if ((reason as { status?: number }).status === 403) setForbidden(true);
        setError(errorMessage(reason, 'Could not load this survey.'));
      })
      .finally(() => setLoading(false));
  }, [surveyId]);

  const setTab = (next: Tab) => setSearchParams({ tab: next });

  const runAction = async (
    action: () => Promise<unknown>,
    successMessage: string,
    nextTab?: Tab,
  ) => {
    setWorking(true);
    setError('');
    setNotice('');
    try {
      await action();
      await loadSurvey();
      setNotice(successMessage);
      if (nextTab) setTab(nextTab);
    } catch (reason) {
      setError(errorMessage(reason, 'The action could not be completed.'));
    } finally {
      setWorking(false);
    }
  };

  const duplicate = async () => {
    setWorking(true);
    setError('');
    try {
      const result = await api<{ survey: { id: number } }>(
        `/api/surveys/${surveyId}/duplicate`,
        { method: 'POST' },
      );
      navigate(`/surveys/${result.survey.id}`);
    } catch (reason) {
      setError(errorMessage(reason, 'Could not duplicate the survey.'));
      setWorking(false);
    }
  };

  if (loading) return <PageLoading />;

  if (forbidden) {
    return (
      <EmptyState
        title="You don't have access to this survey"
        body="This survey belongs to another faculty member. Contact your administrator if you believe you should have access."
        action={
          <Link to="/surveys">
            <Button variant="secondary">Back to My Surveys</Button>
          </Link>
        }
      />
    );
  }

  if (!survey) {
    return (
      <EmptyState
        title="Survey unavailable"
        body={error || 'This survey may have been removed or you may not have access.'}
      />
    );
  }

  const subtitle = [
    SURVEY_TYPE_LABELS[survey.surveyType] ?? survey.surveyType,
    survey.courseCode
      ? `${survey.courseCode}${survey.courseName ? ` — ${survey.courseName}` : ''}`
      : survey.courseName,
    survey.departmentName,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="animate-fade-in pb-10">
      <PageHeader
        title={survey.title}
        subtitle={subtitle}
        actions={
          <>
            <StatusBadge status={survey.effectiveStatus} />
            {['DRAFT', 'PUBLISHED'].includes(survey.status) ? (
              <Button
                disabled={working}
                onClick={() =>
                  runAction(
                    () => api(`/api/surveys/${survey.id}/publish`, { method: 'POST' }),
                    survey.status === 'DRAFT' ? 'Survey published.' : 'Survey publication updated.',
                    'share',
                  )
                }
              >
                <Send size={16} />
                {survey.status === 'DRAFT' ? 'Publish survey' : 'Publish updates'}
              </Button>
            ) : null}
          </>
        }
      />

      {notice ? (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-success/20 bg-success-soft px-4 py-3 text-sm text-success">
          <Check size={16} /> {notice}
        </div>
      ) : null}
      {error ? (
        <div className="mb-4 rounded-[var(--radius-md)] border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger">
          {error}
        </div>
      ) : null}

      <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-border" aria-label="Survey">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`relative whitespace-nowrap px-3.5 py-2.5 text-sm font-medium capitalize transition ${
              tab === item ? 'text-accent' : 'text-ink-muted hover:text-ink'
            }`}
          >
            {item}
            {tab === item ? (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
            ) : null}
          </button>
        ))}
      </nav>

      {tab === 'overview' ? (
        <OverviewTab
          survey={survey}
          working={working}
          setTab={setTab}
          duplicate={duplicate}
          runAction={runAction}
        />
      ) : null}
      {tab === 'questions' ? (
        lookups.questionTypes.length ? (
          <SurveyBuilder survey={survey} lookups={lookups} onChange={setSurvey} />
        ) : (
          <PageLoading label="Loading survey builder…" />
        )
      ) : null}
      {tab === 'responses' ? (
        <ResponsesTab surveyId={survey.id} identityMode={survey.identityMode} />
      ) : null}
      {tab === 'analytics' ? <AnalyticsTab surveyId={survey.id} /> : null}
      {tab === 'share' ? (
        <ShareTab
          survey={survey}
          working={working}
          runAction={runAction}
        />
      ) : null}
      {tab === 'settings' ? (
        <SettingsTab
          survey={survey}
          lookups={lookups}
          working={working}
          onSaved={(updated, message) => {
            setSurvey(updated);
            setNotice(message);
            setError('');
          }}
          onError={setError}
          duplicate={duplicate}
          runAction={runAction}
          onDeleted={() => navigate('/surveys')}
        />
      ) : null}
    </div>
  );
}

function OverviewTab({
  survey,
  working,
  setTab,
  duplicate,
  runAction,
}: {
  survey: SurveyDetail;
  working: boolean;
  setTab: (tab: Tab) => void;
  duplicate: () => Promise<void>;
  runAction: (
    action: () => Promise<unknown>,
    successMessage: string,
    nextTab?: Tab,
  ) => Promise<void>;
}) {
  const questionCount = survey.sections.reduce((total, section) => total + section.questions.length, 0);
  const isActive = survey.effectiveStatus === 'ACTIVE';

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <div className="border-b border-line bg-gradient-to-r from-emerald-50 to-white px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">
                {SURVEY_TYPE_LABELS[survey.surveyType] ?? humanize(survey.surveyType)}
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">{survey.title}</h2>
              {survey.description ? (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-muted">
                  {survey.description}
                </p>
              ) : null}
            </div>
            <Badge className={statusTone(survey.effectiveStatus)}>
              {humanizeStatus(survey.effectiveStatus)}
            </Badge>
          </div>
        </div>

        <div className="grid divide-y divide-line sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
          <Kpi
            icon={<Users size={18} />}
            label="Completed responses"
            value={String(survey.responseCount ?? 0)}
            note="Submitted answer sets"
          />
          <Kpi
            icon={<ClipboardList size={18} />}
            label="Survey structure"
            value={String(questionCount)}
            note={`${survey.sections.length} section${survey.sections.length === 1 ? '' : 's'}`}
          />
          <Kpi
            icon={survey.identityMode === 'ANONYMOUS' ? <LockKeyhole size={18} /> : <Users size={18} />}
            label="Identity"
            value={humanize(survey.identityMode)}
            note={survey.identityMode === 'ANONYMOUS' ? 'Student identity hidden' : 'Student identity recorded'}
          />
          <Kpi
            icon={<ShieldCheck size={18} />}
            label="Response policy"
            value={shortPolicy(survey.responsePolicy)}
            note={humanize(survey.responsePolicy)}
          />
        </div>
      </section>

      <SurveyIndirectMappingPanel surveyId={survey.id} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-2xl border border-line bg-white p-6">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-display text-xl text-ink">Survey details</h3>
              <p className="text-sm text-ink-muted">Academic scope and collection window</p>
            </div>
            <Settings size={19} className="text-ink-muted" />
          </div>
          <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
            <Detail label="Academic year" value={survey.academicYearLabel} />
            <Detail label="Semester" value={survey.semesterLabel} />
            <Detail label="Department" value={survey.departmentName} />
            <Detail
              label="Course"
              value={
                survey.courseCode
                  ? `${survey.courseCode}${survey.courseName ? ` — ${survey.courseName}` : ''}`
                  : survey.courseName
              }
            />
            <Detail
              label="Opens"
              value={formatInTimeZone(survey.startAt, survey.timezone || DEFAULT_TIMEZONE)}
            />
            <Detail
              label="Closes"
              value={formatInTimeZone(survey.endAt, survey.timezone || DEFAULT_TIMEZONE)}
            />
          </dl>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6">
          <h3 className="font-display text-xl text-ink">Quick actions</h3>
          <p className="mt-1 text-sm text-ink-muted">Manage the survey lifecycle.</p>
          <div className="mt-5 space-y-2">
            {survey.status === 'DRAFT' ? (
              <ActionButton
                icon={<Send size={16} />}
                label="Publish survey"
                disabled={working}
                onClick={() =>
                  runAction(
                    () => api(`/api/surveys/${survey.id}/publish`, { method: 'POST' }),
                    'Survey published.',
                    'share',
                  )
                }
              />
            ) : null}
            <ActionButton icon={<Share2 size={16} />} label="Share survey" onClick={() => setTab('share')} />
            {isActive ? (
              <ActionButton
                icon={<XCircle size={16} />}
                label="Close collection"
                disabled={working}
                onClick={() =>
                  runAction(
                    () => api(`/api/surveys/${survey.id}/close`, { method: 'POST' }),
                    'Survey closed.',
                  )
                }
              />
            ) : null}
            <ActionButton
              icon={<Copy size={16} />}
              label="Duplicate survey"
              disabled={working}
              onClick={duplicate}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function ResponsesTab({ surveyId, identityMode }: { surveyId: number; identityMode: string }) {
  const [rows, setRows] = useState<ResponseRow[]>([]);
  const [detail, setDetail] = useState<ResponseDetail | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api<{ responses: ResponseRow[] }>(`/api/surveys/${surveyId}/responses`)
      .then((result) => setRows(result.responses))
      .catch((reason) => setError(errorMessage(reason, 'Could not load responses.')))
      .finally(() => setLoading(false));
  }, [surveyId]);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    setDetailLoading(true);
    setDetail(null);
    api<ResponseDetail>(`/api/surveys/${surveyId}/responses/${selectedId}`)
      .then(setDetail)
      .catch((reason) => setError(errorMessage(reason, 'Could not load the response.')))
      .finally(() => setDetailLoading(false));
  }, [selectedId, surveyId]);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.usn, row.name, row.email, formatDateTime(row.submittedAt)]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [query, rows]);

  if (loading) return <PageLoading label="Loading responses…" />;

  return (
    <div className="space-y-4">
      {identityMode === 'ANONYMOUS' ? (
        <div className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-accent-deep">
          <LockKeyhole size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">Anonymous survey</p>
            <p className="text-accent-deep/80">
              Student identity is hidden. Respondent labels are generated only to navigate this list.
            </p>
          </div>
        </div>
      ) : null}
      {error ? <InlineError message={error} /> : null}

      {!rows.length ? (
        <EmptyState title="No responses yet" body="Completed submissions will appear here." />
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)]">
          <section className="overflow-hidden rounded-2xl border border-line bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-4">
              <div>
                <h3 className="font-medium text-ink">Submissions</h3>
                <p className="text-xs text-ink-muted">
                  {filteredRows.length} of {rows.length} responses
                </p>
              </div>
              <div className="relative w-full sm:w-64">
                <Search size={15} className="absolute left-3 top-2.5 text-ink-muted" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search responses"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="max-h-[42rem] overflow-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      {identityMode === 'ANONYMOUS' ? 'Respondent' : 'Student'}
                    </th>
                    <th className="px-4 py-3 font-medium">Submitted</th>
                    <th className="px-4 py-3 font-medium">Attempt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedId(row.id)}
                      className={`cursor-pointer border-t border-line transition hover:bg-surface ${
                        selectedId === row.id ? 'bg-emerald-50' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-ink">{row.name}</p>
                        <p className="text-xs text-ink-muted">{row.usn}</p>
                      </td>
                      <td className="px-4 py-3 text-ink-muted">{formatDateTime(row.submittedAt)}</td>
                      <td className="px-4 py-3 text-ink-muted">{row.attemptNumber ?? 1}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!filteredRows.length ? (
                <div className="px-4 py-10 text-center text-sm text-ink-muted">
                  No responses match “{query}”.
                </div>
              ) : null}
            </div>
          </section>

          <section className="min-h-80 rounded-2xl border border-line bg-white p-5">
            {detailLoading ? (
              <PageLoading label="Loading answer sheet…" />
            ) : detail ? (
              <AnswerSheet detail={detail} />
            ) : (
              <EmptyState
                title="Select a submission"
                body="Choose a respondent to review their complete answer sheet."
              />
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function AnswerSheet({ detail }: { detail: ResponseDetail }) {
  return (
    <div>
      <div className="border-b border-line pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Answer sheet</p>
        <h3 className="mt-1 font-display text-xl text-ink">
          {detail.submission.student?.name ?? 'Anonymous respondent'}
        </h3>
        <p className="mt-1 text-sm text-ink-muted">
          {detail.submission.student?.usn
            ? `${detail.submission.student.usn} · `
            : ''}
          Submitted {formatDateTime(detail.submission.submittedAt)}
        </p>
      </div>
      <div className="divide-y divide-line">
        {detail.answers.map((answer, index) => (
          <div key={answer.questionId} className="py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
              Q{index + 1} · {QUESTION_TYPE_LABELS[answer.questionType] ?? humanize(answer.questionType)}
            </p>
            <p className="mt-1 text-sm font-medium leading-6 text-ink">{answer.prompt}</p>
            <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-sm text-ink">
              {answerDisplay(answer)}
            </p>
            {answer.comment ? (
              <div className="mt-2 flex gap-2 rounded-lg border border-line px-3 py-2 text-sm text-ink-muted">
                <MessageSquareText size={15} className="mt-0.5 shrink-0" />
                <span>{answer.comment}</span>
              </div>
            ) : null}
          </div>
        ))}
        {!detail.answers.length ? (
          <p className="py-8 text-center text-sm text-ink-muted">No answers were recorded.</p>
        ) : null}
      </div>
    </div>
  );
}

function AnalyticsTab({ surveyId }: { surveyId: number }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api<AnalyticsData>(`/api/surveys/${surveyId}/analytics`)
      .then(setData)
      .catch((reason) => setError(errorMessage(reason, 'Could not load analytics.')))
      .finally(() => setLoading(false));
  }, [surveyId]);

  if (loading) return <PageLoading label="Calculating analytics…" />;
  if (error) return <InlineError message={error} />;
  if (!data || !data.responses) {
    return (
      <EmptyState
        title="Analytics will appear after the first response"
        body="Charts and response summaries are calculated from completed submissions."
      />
    );
  }

  const ratedQuestions = data.questions.filter((question) => question.average != null).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard icon={<Users size={18} />} label="Responses" value={String(data.responses)} />
        <SummaryCard
          icon={<Send size={18} />}
          label="Started"
          value={data.started != null ? String(data.started) : '—'}
        />
        <SummaryCard
          icon={<ClipboardList size={18} />}
          label="Completion rate"
          value={data.completionRate != null ? `${data.completionRate}%` : '—'}
        />
        <SummaryCard
          icon={<BarChart3 size={18} />}
          label="Overall average"
          value={data.averageRating != null ? data.averageRating.toFixed(2) : '—'}
        />
      </div>
      <p className="text-xs text-ink-muted">
        {ratedQuestions} of {data.questions.length} question
        {data.questions.length === 1 ? '' : 's'} produce a numeric average.
      </p>

      <div className="space-y-4">
        {data.questions.map((question, index) => (
          <section key={question.questionId} className="rounded-2xl border border-line bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent">
                  Question {index + 1} ·{' '}
                  {QUESTION_TYPE_LABELS[question.questionType] ?? humanize(question.questionType)}
                </p>
                <h3 className="mt-1 font-medium leading-6 text-ink">{question.prompt}</h3>
              </div>
              {question.average != null ? (
                <div className="rounded-xl bg-emerald-50 px-4 py-2 text-right">
                  <p className="text-xs text-accent-deep">Average</p>
                  <p className="font-display text-2xl text-accent-deep">
                    {question.average.toFixed(2)}
                  </p>
                </div>
              ) : null}
            </div>

            {question.distribution.length ? (
              <>
                <div className="mt-5 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={question.distribution} margin={{ top: 8, right: 8, left: -18, bottom: 34 }}>
                      <CartesianGrid stroke="#e5e9e7" strokeDasharray="3 3" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#66736f' }}
                        interval={0}
                        angle={question.distribution.length > 4 ? -18 : 0}
                        textAnchor={question.distribution.length > 4 ? 'end' : 'middle'}
                        height={58}
                      />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#66736f' }} />
                      <Tooltip content={<AnalyticsTooltip />} />
                      <Bar dataKey="count" fill="#0d7a5f" radius={[6, 6, 0, 0]} maxBarSize={64} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {question.distribution.map((item) => (
                    <span key={item.optionId} className="rounded-full bg-surface px-3 py-1 text-xs text-ink-muted">
                      {analyticsLabel(question.questionType, item.label, item.value)}: {item.count} ({item.percent}%)
                    </span>
                  ))}
                </div>
              </>
            ) : null}

            {question.textResponses.length ? (
              <div className="mt-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Written responses ({question.textResponses.length})
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  {question.textResponses.map((response, responseIndex) => (
                    <blockquote
                      key={`${question.questionId}-${responseIndex}`}
                      className="rounded-xl border border-line bg-surface px-4 py-3 text-sm leading-6 text-ink"
                    >
                      “{response}”
                    </blockquote>
                  ))}
                </div>
              </div>
            ) : null}

            {!question.distribution.length && !question.textResponses.length ? (
              <p className="mt-5 rounded-xl bg-surface px-4 py-6 text-center text-sm text-ink-muted">
                No answers recorded for this question.
              </p>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}

function ExtendModal({
  survey,
  open,
  reopen,
  working,
  onClose,
  runAction,
}: {
  survey: SurveyDetail;
  open: boolean;
  reopen: boolean;
  working: boolean;
  onClose: () => void;
  runAction: (
    action: () => Promise<unknown>,
    successMessage: string,
    nextTab?: Tab,
  ) => Promise<void>;
}) {
  const timezone = survey.timezone || DEFAULT_TIMEZONE;
  const [mode, setMode] = useState<'7' | '14' | 'custom'>('14');
  const [customLocal, setCustomLocal] = useState(() =>
    utcToZonedLocalInput(survey.endAt, timezone),
  );
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open) {
      setMode('14');
      setCustomLocal(utcToZonedLocalInput(survey.endAt, timezone));
      setErr('');
    }
  }, [open, survey.endAt, timezone]);

  const apply = async () => {
    setErr('');
    let body: Record<string, unknown> = { reopen };
    if (mode === 'custom') {
      if (!customLocal) {
        setErr('Choose a new end date and time.');
        return;
      }
      let endAtIso: string;
      try {
        endAtIso = zonedLocalToUtcIso(customLocal, timezone);
      } catch {
        setErr('Enter a valid date and time.');
        return;
      }
      body = { ...body, endAt: endAtIso };
    } else {
      body = { ...body, days: mode === '7' ? 7 : 14 };
    }
    await runAction(
      () => api(`/api/surveys/${survey.id}/extend`, { method: 'POST', body: JSON.stringify(body) }),
      reopen ? 'Survey extended and reopened.' : 'Survey end date extended.',
    );
    onClose();
  };

  return (
    <Modal
      open={open}
      title={reopen ? 'Extend & reopen survey' : 'Extend survey'}
      description={
        reopen
          ? 'Set a new end date in the future so students can respond again. Existing responses are preserved.'
          : 'Move the response deadline. Existing responses are preserved.'
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={apply} disabled={working}>
            {working ? 'Working…' : reopen ? 'Extend & Reopen' : 'Extend Survey'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {[
          { id: '7', label: '+7 days from the current end' },
          { id: '14', label: '+14 days from the current end' },
          { id: 'custom', label: 'Custom date and time' },
        ].map((opt) => (
          <label key={opt.id} className="flex items-center gap-2.5 text-sm text-ink">
            <input
              type="radio"
              name="extend-mode"
              className="accent-accent"
              checked={mode === opt.id}
              onChange={() => setMode(opt.id as '7' | '14' | 'custom')}
            />
            {opt.label}
          </label>
        ))}
        {mode === 'custom' ? (
          <Field label={`New end (${timezone === 'Asia/Kolkata' ? 'IST' : timezone})`} error={err || undefined}>
            <Input
              type="datetime-local"
              value={customLocal}
              onChange={(e) => setCustomLocal(e.target.value)}
            />
          </Field>
        ) : err ? (
          <p className="text-xs text-danger">{err}</p>
        ) : null}
      </div>
    </Modal>
  );
}

function ShareTab({
  survey,
  working,
  runAction,
}: {
  survey: SurveyDetail;
  working: boolean;
  runAction: (
    action: () => Promise<unknown>,
    successMessage: string,
    nextTab?: Tab,
  ) => Promise<void>;
}) {
  const shareUrl = survey.shareCode ? `${window.location.origin}/s/${survey.shareCode}` : '';
  const [copied, setCopied] = useState(false);
  const [extendState, setExtendState] = useState<{ open: boolean; reopen: boolean }>({
    open: false,
    reopen: false,
  });
  const isClosed = survey.effectiveStatus === 'CLOSED';
  const isEnded = survey.effectiveStatus === 'ENDED';
  const canClose = ['ACTIVE', 'SCHEDULED'].includes(survey.effectiveStatus);
  const canExtendPlain = ['ACTIVE', 'SCHEDULED'].includes(survey.effectiveStatus);
  const endPassed = survey.endAt ? new Date(survey.endAt).getTime() <= Date.now() : false;
  // A manually closed survey can be reopened directly only while still inside
  // its window; once the end time has passed it must be extended & reopened.
  const canReopen = isClosed && !endPassed;
  const needsExtendReopen = isEnded || (isClosed && endPassed);
  const timezone = survey.timezone || DEFAULT_TIMEZONE;

  const copyLink = async () => {
    const ok = await copyToClipboard(shareUrl);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const downloadQr = () => {
    const svg = document.querySelector('#survey-share-qr svg');
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `survey-${survey.shareCode}-qr.svg`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  if (!shareUrl) {
    return (
      <EmptyState
        title="Publish to create a student link"
        body="A public URL and downloadable QR code are generated when this survey is published."
      />
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-accent"><Link2 size={20} /></div>
          <div>
            <h3 className="font-display text-xl text-ink">Student survey link</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Share this link directly or use the QR code in classrooms and notices.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2 rounded-xl border border-line bg-surface p-3 sm:flex-row sm:items-center">
          <p className="min-w-0 flex-1 break-all text-sm text-ink">{shareUrl}</p>
          <Button type="button" variant="secondary" onClick={copyLink}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Copied' : 'Copy link'}
          </Button>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={shareUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-line bg-white px-3.5 py-2 text-sm font-medium text-ink transition hover:bg-surface"
          >
            <ExternalLink size={16} /> Open student link
          </a>
          {canClose ? (
            <Button
              variant="secondary"
              disabled={working}
              onClick={() =>
                runAction(
                  () => api(`/api/surveys/${survey.id}/close`, { method: 'POST' }),
                  'Survey closed.',
                )
              }
            >
              <XCircle size={16} /> Close Survey
            </Button>
          ) : null}
          {canExtendPlain ? (
            <Button
              variant="secondary"
              disabled={working}
              onClick={() => setExtendState({ open: true, reopen: false })}
            >
              <CalendarClock size={16} /> Extend
            </Button>
          ) : null}
          {canReopen ? (
            <Button
              disabled={working}
              onClick={() =>
                runAction(
                  () => api(`/api/surveys/${survey.id}/reopen`, { method: 'POST' }),
                  'Survey reopened.',
                )
              }
            >
              <RefreshCw size={16} /> Reopen Survey
            </Button>
          ) : null}
          {needsExtendReopen ? (
            <Button disabled={working} onClick={() => setExtendState({ open: true, reopen: true })}>
              <RefreshCw size={16} /> Extend &amp; Reopen
            </Button>
          ) : null}
        </div>
        <ExtendModal
          survey={survey}
          open={extendState.open}
          reopen={extendState.reopen}
          working={working}
          onClose={() => setExtendState({ open: false, reopen: false })}
          runAction={runAction}
        />

        <dl className="mt-6 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
          <Detail label="Status" value={humanizeStatus(survey.effectiveStatus)} />
          <Detail
            label="Opens"
            value={formatInTimeZone(survey.startAt, timezone, { includeZone: true })}
          />
          <Detail
            label="Closes"
            value={formatInTimeZone(survey.endAt, timezone, { includeZone: true })}
          />
        </dl>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">Scan to respond</p>
        <div id="survey-share-qr" className="mx-auto mt-4 inline-flex rounded-2xl border border-line bg-white p-5">
          <QRCodeSVG value={shareUrl} size={210} level="H" marginSize={1} />
        </div>
        <p className="mt-3 text-xs text-ink-muted">Public student response page</p>
        <Button className="mt-4 w-full" variant="secondary" onClick={downloadQr}>
          <Download size={16} /> Download QR as SVG
        </Button>
      </section>
    </div>
  );
}

type AuditEvent = {
  id: number;
  action: string;
  createdAt: string;
  actor: string;
  metadata?: Record<string, unknown> | null;
};

const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATED: 'Survey created',
  PUBLISHED: 'Published',
  SCHEDULE_CHANGED: 'Schedule changed',
  EXTENDED: 'Extended',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
  ARCHIVED: 'Archived',
  DELETED: 'Deleted',
  DUPLICATED: 'Duplicated',
};

function ActivitySection({ surveyId, timezone }: { surveyId: number; timezone: string }) {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api<{ events: AuditEvent[] }>(`/api/surveys/${surveyId}/audit`)
      .then((data) => {
        if (active) setEvents(data.events);
      })
      .catch(() => {
        if (active) setEvents([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [surveyId]);

  return (
    <section className="rounded-2xl border border-line bg-white p-6">
      <h3 className="font-display text-xl text-ink">Activity log</h3>
      <p className="mt-1 text-sm text-ink-muted">Lifecycle changes for institutional records.</p>
      {loading ? (
        <p className="mt-4 text-sm text-ink-muted">Loading activity…</p>
      ) : events.length === 0 ? (
        <p className="mt-4 text-sm text-ink-muted">No lifecycle activity recorded yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {events.map((event) => (
            <li key={event.id} className="flex items-start justify-between gap-3 text-sm">
              <div>
                <p className="font-medium text-ink">
                  {AUDIT_ACTION_LABELS[event.action] ?? event.action}
                </p>
                <p className="text-xs text-ink-muted">by {event.actor}</p>
              </div>
              <span className="shrink-0 text-xs text-ink-muted">
                {formatInTimeZone(event.createdAt, timezone)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SettingsTab({
  survey,
  lookups,
  working,
  onSaved,
  onError,
  duplicate,
  runAction,
  onDeleted,
}: {
  survey: SurveyDetail;
  lookups: Lookups;
  working: boolean;
  onSaved: (survey: SurveyDetail, message: string) => void;
  onError: (message: string) => void;
  duplicate: () => Promise<void>;
  runAction: (
    action: () => Promise<unknown>,
    successMessage: string,
    nextTab?: Tab,
  ) => Promise<void>;
  onDeleted: () => void;
}) {
  const [responsePolicy, setResponsePolicy] = useState(survey.responsePolicy);
  const [identityMode, setIdentityMode] = useState(survey.identityMode);
  const [saving, setSaving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const responseCount = survey.responseCount ?? 0;
  const responsesExist = responseCount > 0;
  const canHardDelete = responseCount === 0 && survey.status !== 'ARCHIVED';

  useEffect(() => {
    setResponsePolicy(survey.responsePolicy);
    setIdentityMode(survey.identityMode);
  }, [survey.identityMode, survey.responsePolicy]);

  const save = async () => {
    setSaving(true);
    onError('');
    try {
      const result = await api<{ survey: SurveyDetail }>(`/api/surveys/${survey.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ responsePolicy, identityMode }),
      });
      onSaved(result.survey, 'Response settings saved.');
    } catch (reason) {
      onError(errorMessage(reason, 'Could not save response settings.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="max-w-3xl rounded-2xl border border-line bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-accent"><ShieldCheck size={20} /></div>
          <div>
            <h3 className="font-display text-xl text-ink">Response settings</h3>
            <p className="mt-1 text-sm text-ink-muted">
              Control repeat submissions and how respondent identity is handled.
            </p>
          </div>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Response policy">
            <Select value={responsePolicy} onChange={(event) => setResponsePolicy(event.target.value)}>
              {(lookups.responsePolicies ?? DEFAULT_LOOKUPS.responsePolicies ?? []).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Identity mode">
            <Select
              value={identityMode}
              disabled={responsesExist}
              onChange={(event) => setIdentityMode(event.target.value)}
            >
              {(lookups.identityModes ?? DEFAULT_LOOKUPS.identityModes ?? []).map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </Field>
        </div>
        {responsesExist ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
            <LockKeyhole size={14} />
            Identity mode is locked after the first completed response.
          </p>
        ) : null}
        <Button className="mt-5" disabled={saving || working} onClick={save}>
          {saving ? 'Saving…' : 'Save response settings'}
        </Button>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-surface p-2.5 text-ink-muted"><Download size={20} /></div>
          <div>
            <h3 className="font-display text-xl text-ink">Export responses</h3>
            <p className="text-sm text-ink-muted">Download the latest completed submissions.</p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => downloadExport(survey.id, 'csv')}>
            <FileText size={16} /> Export CSV
          </Button>
          <Button variant="secondary" onClick={() => downloadExport(survey.id, 'xlsx')}>
            <FileSpreadsheet size={16} /> Export Excel
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-white p-6">
        <h3 className="font-display text-xl text-ink">Survey management</h3>
        <p className="mt-1 text-sm text-ink-muted">
          {responsesExist
            ? 'Duplicate for a new cycle, or archive to preserve all responses and analytics.'
            : 'Duplicate for reuse, archive to preserve records, or delete this draft.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={working} onClick={duplicate}>
            <Copy size={16} /> Duplicate
          </Button>
          {survey.status !== 'ARCHIVED' ? (
            <Button variant="secondary" disabled={working} onClick={() => setArchiveOpen(true)}>
              <Archive size={16} /> Archive
            </Button>
          ) : null}
          {canHardDelete ? (
            <Button variant="danger" disabled={working} onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} /> Delete
            </Button>
          ) : null}
        </div>
        {responsesExist ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-ink-muted">
            <LockKeyhole size={14} />
            This survey has {responseCount} response{responseCount === 1 ? '' : 's'} and can no longer
            be deleted — archive it to keep the records safe.
          </p>
        ) : null}
      </section>

      <ActivitySection surveyId={survey.id} timezone={survey.timezone || DEFAULT_TIMEZONE} />

      <ConfirmDangerModal
        open={archiveOpen}
        title="Archive this survey?"
        description={
          `Students will no longer be able to access it.` +
          (responsesExist
            ? ` All ${responseCount} existing response${responseCount === 1 ? '' : 's'} and analytics will be preserved.`
            : ' Questions and settings will be preserved.')
        }
        confirmLabel="Archive Survey"
        loading={working}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => {
          void runAction(
            () => api(`/api/surveys/${survey.id}/archive`, { method: 'POST' }),
            'Survey archived.',
          ).then(() => setArchiveOpen(false));
        }}
      />

      <ConfirmDangerModal
        open={deleteOpen}
        title="Delete this draft survey?"
        description="This permanently removes the survey and its questions. This cannot be undone. Surveys with responses cannot be deleted."
        confirmLabel="Delete Survey"
        loading={working}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await api(`/api/surveys/${survey.id}`, { method: 'DELETE' });
            setDeleteOpen(false);
            onDeleted();
          } catch (reason) {
            setDeleteOpen(false);
            onError(errorMessage(reason, 'Could not delete the survey.'));
          }
        }}
      />

      <p className="text-sm text-ink-muted">
        Looking for the student URL? Open the{' '}
        <Link to={`?tab=share`} className="font-medium text-accent hover:text-accent-deep">Share tab</Link>.
      </p>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  note,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 text-ink-muted">{icon}<p className="text-xs font-medium uppercase tracking-wide">{label}</p></div>
      <p className="mt-3 font-display text-3xl leading-none text-ink">{value}</p>
      <p className="mt-2 text-xs text-ink-muted">{note}</p>
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center gap-2 text-ink-muted">{icon}<p className="text-sm">{label}</p></div>
      <p className="mt-3 font-display text-3xl text-ink">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value || '—'}</dd>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left text-sm font-medium text-ink transition hover:border-accent/40 hover:bg-emerald-50 disabled:opacity-50"
    >
      <span className="text-accent">{icon}</span>
      <span className="flex-1">{label}</span>
      <span className="text-ink-muted">→</span>
    </button>
  );
}

function PageLoading({ label = 'Loading survey…' }: { label?: string }) {
  return (
    <div className="flex min-h-52 items-center justify-center rounded-2xl border border-line bg-white">
      <div className="text-center">
        <RefreshCw size={22} className="mx-auto animate-spin text-accent" />
        <p className="mt-3 text-sm text-ink-muted">{label}</p>
      </div>
    </div>
  );
}

function InlineError({ message }: { message: string }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">{message}</div>;
}

function AnalyticsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: { percent?: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-ink">{label}</p>
      <p className="mt-1 text-ink-muted">
        {payload[0].value ?? 0} responses · {payload[0].payload?.percent ?? 0}%
      </p>
    </div>
  );
}

function answerDisplay(answer: ResponseDetail['answers'][number]) {
  if (answer.optionLabel) return answer.optionLabel;
  if (answer.textAnswer) return answer.textAnswer;
  if (answer.numericAnswer != null) return String(answer.numericAnswer);
  if (Array.isArray(answer.jsonAnswer) && answer.jsonAnswer.length) {
    return answer.jsonAnswer.join(', ');
  }
  return 'No answer';
}

function analyticsLabel(type: string, label: string, value: number | null) {
  if (type === 'STAR_RATING' || type === 'RATING') return `${value ?? label} ★`;
  if (type === 'SMILE_RATING') {
    const smiles = ['😞', '🙁', '😐', '🙂', '😄'];
    const emoji = value != null ? smiles[value - 1] : '';
    return `${emoji ? `${emoji} ` : ''}${label}`;
  }
  return label;
}

function humanize(value: string) {
  return value
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function shortPolicy(policy: string) {
  if (policy === 'ONE_PER_STUDENT') return 'One each';
  if (policy === 'ONE_PER_CYCLE') return 'One per cycle';
  if (policy === 'MULTIPLE') return 'Multiple';
  return humanize(policy);
}

function errorMessage(reason: unknown, fallback: string) {
  return reason instanceof Error && reason.message ? reason.message : fallback;
}
