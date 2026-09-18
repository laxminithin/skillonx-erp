import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../lib/api';
import { useAuth } from '../../auth/AuthContext';
import {
  Badge,
  Button,
  DataTable,
  FilterBar,
  PageHeader,
  SearchInput,
  Select,
  StatusBadge,
  Surface,
  useToast,
} from '../../components/ui';
import { formatDate, formatDateTime, SURVEY_TYPE_LABELS } from '../../lib/utils';

export function AdminSurveysPage() {
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<
    Array<{
      id: number;
      title: string;
      surveyType: string;
      status: string;
      createdBy?: string;
      departmentName?: string;
      responses: number;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [surveyType, setSurveyType] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    if (surveyType) params.set('surveyType', surveyType);
    setLoading(true);
    api<{ surveys: typeof surveys }>(`/api/admin/surveys?${params}`)
      .then((r) => setSurveys(r.surveys))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'))
      .finally(() => setLoading(false));
  }, [q, status, surveyType, toast]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Surveys"
        subtitle="Review every survey created within your institutional scope."
      />
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search surveys or faculty…" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All status</option>
          {['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
        <Select value={surveyType} onChange={(e) => setSurveyType(e.target.value)} className="w-48">
          <option value="">All types</option>
          {Object.entries(SURVEY_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </Select>
      </FilterBar>
      <DataTable
        loading={loading}
        rows={surveys}
        emptyTitle="No surveys yet"
        emptyBody="Create your first institutional survey and start collecting feedback."
        columns={[
          {
            key: 'survey',
            header: 'Survey',
            render: (r) => (
              <div>
                <Link to={`/surveys/${r.id}`} className="font-medium text-ink hover:text-accent">
                  {r.title}
                </Link>
                <p className="text-xs text-ink-muted">{SURVEY_TYPE_LABELS[r.surveyType] || r.surveyType}</p>
              </div>
            ),
          },
          { key: 'createdBy', header: 'Created By', render: (r) => r.createdBy || '—' },
          { key: 'department', header: 'Department', render: (r) => r.departmentName || '—' },
          {
            key: 'type',
            header: 'Type',
            render: (r) => SURVEY_TYPE_LABELS[r.surveyType] || r.surveyType,
          },
          {
            key: 'responses',
            header: 'Responses',
            render: (r) => <span className="tabular-nums">{r.responses}</span>,
          },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'created',
            header: 'Created',
            render: (r) => <span className="text-ink-muted">{formatDate(r.createdAt)}</span>,
          },
        ]}
      />
    </div>
  );
}

export function AdminQuizzesPage() {
  const { toast } = useToast();
  const [quizzes, setQuizzes] = useState<
    Array<{
      id: number;
      title: string;
      status: string;
      createdBy?: string;
      courseName?: string;
      attempts: number;
      questions: number;
      createdAt: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (status) params.set('status', status);
    setLoading(true);
    api<{ quizzes: typeof quizzes }>(`/api/admin/quizzes?${params}`)
      .then((r) => setQuizzes(r.quizzes))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'))
      .finally(() => setLoading(false));
  }, [q, status, toast]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Quizzes" subtitle="Institution-wide quizzes according to your authorization scope." />
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search quizzes or faculty…" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All status</option>
          {['DRAFT', 'PUBLISHED', 'ACTIVE', 'CLOSED', 'ARCHIVED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </FilterBar>
      <DataTable
        loading={loading}
        rows={quizzes}
        emptyTitle="No quizzes yet"
        emptyBody="Faculty can create subject-wise quizzes from the Quizzes section."
        columns={[
          {
            key: 'quiz',
            header: 'Quiz',
            render: (r) => (
              <div>
                <Link to={`/quizzes/${r.id}`} className="font-medium text-ink hover:text-accent">
                  {r.title}
                </Link>
                <p className="text-xs text-ink-muted">{r.courseName || '—'}</p>
              </div>
            ),
          },
          { key: 'createdBy', header: 'Created By', render: (r) => r.createdBy || '—' },
          { key: 'questions', header: 'Questions', render: (r) => <span className="tabular-nums">{r.questions}</span> },
          { key: 'attempts', header: 'Attempts', render: (r) => <span className="tabular-nums">{r.attempts}</span> },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status} /> },
          {
            key: 'created',
            header: 'Created',
            render: (r) => <span className="text-ink-muted">{formatDate(r.createdAt)}</span>,
          },
        ]}
      />
    </div>
  );
}

export function AdminStudentsPage() {
  const { toast } = useToast();
  const [students, setStudents] = useState<
    Array<{
      id: number;
      name: string;
      usn: string;
      email: string;
      departmentName?: string;
      collegeName?: string;
      response_count: number;
    }>
  >([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    setLoading(true);
    api<{ students: typeof students }>(`/api/admin/students?${params}`)
      .then((r) => setStudents(r.students))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'))
      .finally(() => setLoading(false));
  }, [q, toast]);

  return (
    <div className="animate-fade-in">
      <PageHeader title="Students" subtitle="Students captured through identified survey participation." />
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search name, USN, email…" />
      </FilterBar>
      <DataTable
        loading={loading}
        rows={students}
        emptyTitle="No students yet"
        emptyBody="Student records appear when identified surveys receive responses."
        columns={[
          {
            key: 'student',
            header: 'Student',
            render: (r) => (
              <div>
                <p className="font-medium">{r.name}</p>
                <p className="text-xs text-ink-muted">{r.email}</p>
              </div>
            ),
          },
          { key: 'usn', header: 'USN', render: (r) => r.usn },
          { key: 'department', header: 'Department', render: (r) => r.departmentName || '—' },
          { key: 'institution', header: 'Institution', render: (r) => r.collegeName || '—' },
          {
            key: 'responses',
            header: 'Responses',
            render: (r) => <span className="tabular-nums">{r.response_count}</span>,
          },
        ]}
      />
    </div>
  );
}

export function AdminResponsesPage() {
  const { toast } = useToast();
  const [responses, setResponses] = useState<
    Array<{
      id: number;
      surveyTitle: string;
      surveyId: number;
      submittedAt: string;
      identityMode: string;
      createdBy?: string;
      student: { name: string; usn: string } | null;
    }>
  >([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    setLoading(true);
    api<{ responses: typeof responses }>(`/api/admin/responses?${params}`)
      .then((r) => setResponses(r.responses))
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'))
      .finally(() => setLoading(false));
  }, [q, toast]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Responses"
        subtitle="Inspect survey participation. Anonymous surveys never reveal student identity."
      />
      <FilterBar>
        <SearchInput value={q} onChange={setQ} placeholder="Search survey or student…" />
      </FilterBar>
      <DataTable
        loading={loading}
        rows={responses}
        emptyTitle="No responses yet"
        columns={[
          {
            key: 'survey',
            header: 'Survey',
            render: (r) => (
              <Link to={`/surveys/${r.surveyId}`} className="font-medium hover:text-accent">
                {r.surveyTitle}
              </Link>
            ),
          },
          {
            key: 'respondent',
            header: 'Respondent',
            render: (r) =>
              r.identityMode === 'ANONYMOUS' ? (
                <Badge className="bg-surface-muted text-ink-muted">Anonymous</Badge>
              ) : (
                <div>
                  <p className="font-medium">{r.student?.name || '—'}</p>
                  <p className="text-xs text-ink-muted">{r.student?.usn}</p>
                </div>
              ),
          },
          { key: 'createdBy', header: 'Faculty', render: (r) => r.createdBy || '—' },
          {
            key: 'submitted',
            header: 'Submitted',
            render: (r) => <span className="text-ink-muted">{formatDateTime(r.submittedAt)}</span>,
          },
        ]}
      />
    </div>
  );
}

export function AdminAnalyticsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<{
    overall: {
      totalSurveys: number;
      totalResponses: number;
      activeSurveys: number;
      averageCompletionRate: number;
    };
    byDepartment: Array<{ department: string; responses: number }>;
    byType: Array<{ surveyType: string; surveys: number; responses: number }>;
    trend: Array<{ day: string; responses: number }>;
  } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof data>>('/api/admin/analytics')
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [toast]);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Analytics" subtitle="Aggregate institutional survey performance." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ['Total Surveys', data?.overall.totalSurveys ?? 0],
          ['Total Responses', data?.overall.totalResponses ?? 0],
          ['Active Surveys', data?.overall.activeSurveys ?? 0],
          ['Avg responses / survey', data?.overall.averageCompletionRate ?? 0],
        ].map(([label, value]) => (
          <Surface key={String(label)} className="!p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-ink-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
          </Surface>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Surface>
          <h2 className="mb-4 text-sm font-semibold">Department Participation</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.byDepartment || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde4e1" />
                <XAxis dataKey="department" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="responses" fill="#0c6b54" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Surface>
        <Surface>
          <h2 className="mb-4 text-sm font-semibold">Responses over time</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde4e1" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="responses" stroke="#0c6b54" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Surface>
      </div>

      <Surface>
        <h2 className="mb-4 text-sm font-semibold">Survey Type</h2>
        <ul className="divide-y divide-border">
          {(data?.byType || []).map((t) => (
            <li key={t.surveyType} className="flex justify-between py-3 text-sm">
              <span>{SURVEY_TYPE_LABELS[t.surveyType] || t.surveyType}</span>
              <span className="text-ink-muted tabular-nums">
                {t.surveys} surveys · {t.responses} responses
              </span>
            </li>
          ))}
        </ul>
      </Surface>
    </div>
  );
}

export function AdminReportsPage() {
  const { toast } = useToast();
  const [data, setData] = useState<{
    summary: { totalSurveys: number; totalResponses: number; activeSurveys: number };
    facultyActivity: Array<{
      id: number;
      name: string;
      department?: string | null;
      surveys: number;
      status: string;
    }>;
    departmentParticipation: Array<{ department: string; responses: number }>;
  } | null>(null);

  useEffect(() => {
    api<NonNullable<typeof data>>('/api/admin/reports')
      .then(setData)
      .catch((e) => toast(e instanceof Error ? e.message : 'Failed', 'error'));
  }, [toast]);

  const exportCsv = (filename: string, rows: string[][]) => {
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Reports"
        subtitle="Export institutional summaries for review. Accreditation-specific templates can be added when data requirements are confirmed."
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          {
            title: 'Survey Summary',
            body: 'Total surveys, active surveys, and responses.',
            onExport: () =>
              exportCsv('survey-summary.csv', [
                ['Metric', 'Value'],
                ['Total Surveys', String(data?.summary.totalSurveys ?? 0)],
                ['Active Surveys', String(data?.summary.activeSurveys ?? 0)],
                ['Total Responses', String(data?.summary.totalResponses ?? 0)],
              ]),
          },
          {
            title: 'Faculty Survey Activity',
            body: 'Faculty members and surveys they have created.',
            onExport: () =>
              exportCsv('faculty-activity.csv', [
                ['Name', 'Department', 'Surveys', 'Status'],
                ...(data?.facultyActivity || []).map((f) => [
                  f.name,
                  f.department || '',
                  String(f.surveys),
                  f.status,
                ]),
              ]),
          },
          {
            title: 'Department-wise Survey Report',
            body: 'Participation comparison across departments.',
            onExport: () =>
              exportCsv('department-participation.csv', [
                ['Department', 'Responses'],
                ...(data?.departmentParticipation || []).map((d) => [
                  d.department,
                  String(d.responses),
                ]),
              ]),
          },
        ].map((card) => (
          <Surface key={card.title}>
            <h3 className="font-semibold text-ink">{card.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{card.body}</p>
            <button
              type="button"
              onClick={card.onExport}
              className="mt-4 text-sm font-medium text-accent hover:underline"
            >
              Export CSV
            </button>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function AdminSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const tz = user?.timezone || 'Asia/Kolkata';
  const zoneLabel = tz === 'Asia/Kolkata' || tz === 'Asia/Calcutta' ? `IST (${tz})` : tz;
  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Settings" subtitle="Your account and institution defaults." />
      <Surface>
        <h2 className="text-sm font-semibold text-ink">Account</h2>
        <p className="mt-0.5 text-xs text-ink-muted">Your personal details and sign-in security.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => navigate('/admin/profile')}>
            My Profile
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/admin/profile?tab=security')}
          >
            Change Password
          </Button>
        </div>
      </Surface>
      <Surface>
        <h2 className="text-sm font-semibold text-ink">Institution</h2>
        <div className="mt-2 grid gap-x-8 gap-y-1 sm:grid-cols-2">
          <div className="py-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-ink-muted">Name</p>
            <p className="mt-0.5 text-sm text-ink">{user?.collegeName || '—'}</p>
          </div>
          <div className="py-1.5">
            <p className="text-xs font-medium uppercase tracking-[0.06em] text-ink-muted">
              Survey Timezone
            </p>
            <p className="mt-0.5 text-sm text-ink">{zoneLabel}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-secondary">
          Branding uses SkillonX platform defaults to keep a consistent product experience across colleges.
        </p>
      </Surface>
      <Surface>
        <h2 className="text-sm font-semibold">Survey Defaults</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-secondary">
          <li>Default identity mode is configured per survey at creation time.</li>
          <li>Identified surveys collect Name, USN, and Email.</li>
          <li>Anonymous surveys never expose student–response relationships — including to administrators.</li>
        </ul>
      </Surface>
      <Surface>
        <h2 className="text-sm font-semibold">Security</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Faculty accounts can be activated, deactivated, and password-reset from Faculty Management.
          Session tokens expire according to server JWT configuration.
        </p>
      </Surface>
    </div>
  );
}
