import { FormEvent, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth, type User } from '../auth/AuthContext';
import { BrandMark } from '../components/Brand';
import { Button, Field, Input, PasswordInput } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

type PublicClass = {
  code: string;
  class: {
    id: number;
    displayName: string;
    name: string;
    collegeName: string;
    academicYearLabel: string;
    programName: string;
    departmentName: string;
    departmentCode: string;
    semesterLabel: string;
    semesterNumber: number | null;
    sectionLabel: string;
    schemeName: string | null;
    subjectCount: number;
    facultyCount: number;
  };
  subjects: Array<{ code: string; name: string; kind: string }>;
};

type Membership = { enrollment: { status: string }; alreadyMember?: boolean };

export function JoinClassPage() {
  const { code } = useParams();
  const { user, applySession } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<PublicClass | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'landing' | 'register' | 'login'>('landing');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: '', usn: '', email: '', password: '' });
  const [notice, setNotice] = useState('');

  useDocumentTitle(data?.class.displayName || 'Join Class');

  useEffect(() => {
    if (!code) return;
    api<PublicClass>(`/api/public/class/${encodeURIComponent(code)}`, { auth: false })
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Class link not found'))
      .finally(() => setLoading(false));
  }, [code]);

  const afterJoin = (token: string, nextUser: User, membership?: Membership) => {
    applySession(token, nextUser);
    const status = membership?.enrollment?.status;
    if (status === 'APPROVED' || membership?.alreadyMember) navigate('/lms');
    else navigate('/lms?pending=1');
  };

  const onRegister = async (e: FormEvent) => {
    e.preventDefault();
    if (!code || busy) return;
    setBusy(true);
    setNotice('');
    try {
      const res = await api<{ token: string; user: User; membership: Membership }>(
        `/api/public/class/${encodeURIComponent(code)}/register`,
        { method: 'POST', auth: false, body: JSON.stringify(form) },
      );
      afterJoin(res.token, res.user, res.membership);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not create your account');
    } finally {
      setBusy(false);
    }
  };

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!code || busy) return;
    setBusy(true);
    setNotice('');
    try {
      if (user?.role === 'STUDENT' || user?.kind === 'student') {
        const res = await api<Membership>(`/api/student/join/${encodeURIComponent(code)}`, { method: 'POST' });
        navigate(res.enrollment.status === 'APPROVED' ? '/lms' : '/lms?pending=1');
        return;
      }
      const res = await api<{ token: string; user: User; membership: Membership }>(
        `/api/public/class/${encodeURIComponent(code)}/login`,
        {
          method: 'POST',
          auth: false,
          body: JSON.stringify({ email: form.email, usn: form.usn, password: form.password }),
        },
      );
      afterJoin(res.token, res.user, res.membership);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not join this class');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-ink-muted">Loading class…</div>;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center">
          <BrandMark product="LMS" />
          <p className="mt-6 text-sm text-danger">{error || 'This class link is not available.'}</p>
        </div>
      </div>
    );
  }

  const c = data.class;

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[42%] bg-sidebar lg:block">
        <div
          className="absolute inset-0 opacity-40"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 25%, rgba(12,107,84,0.55), transparent 45%)' }}
        />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <BrandMark inverted product="LMS" />
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">SkillonX LMS</p>
            <h1 className="mt-3 max-w-sm text-3xl font-semibold tracking-tight">{c.displayName}</h1>
            <p className="mt-3 text-[15px] text-white/65">{c.academicYearLabel}</p>
          </div>
          <p className="text-xs text-white/35">{c.collegeName}</p>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-10 lg:ml-[42%] lg:justify-start lg:px-16">
        <div className="w-full max-w-lg rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-sm sm:p-8">
          <div className="mb-6 lg:hidden">
            <BrandMark product="LMS" />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink-muted">SkillonX LMS</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{c.displayName}</h2>
          <p className="mt-1 text-sm text-ink-muted">Academic Year {c.academicYearLabel}</p>
          <p className="mt-4 text-sm text-ink">{c.collegeName}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-ink-muted">Semester</dt>
              <dd className="font-medium">{c.semesterLabel}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Branch</dt>
              <dd className="font-medium">{c.departmentName}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Section</dt>
              <dd className="font-medium">{c.sectionLabel}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Scheme</dt>
              <dd className="font-medium">{c.schemeName || '—'}</dd>
            </div>
          </dl>
          <p className="mt-4 text-sm text-ink-muted">
            Subjects: {c.subjectCount} · Faculty: {c.facultyCount}
          </p>

          {notice ? (
            <div className="mt-5 rounded-[var(--radius-md)] border border-warning/25 bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
              {notice}
            </div>
          ) : null}

          {mode === 'landing' ? (
            <div className="mt-6 flex flex-col gap-2">
              <Button onClick={() => setMode('register')}>Join Class</Button>
              <Button variant="secondary" onClick={() => setMode('login')}>
                I already have a student account
              </Button>
            </div>
          ) : null}

          {mode === 'register' ? (
            <form onSubmit={onRegister} className="mt-6 space-y-3">
              <p className="text-sm text-ink-muted">
                Create your student account. You will request membership for {c.displayName} — one approval activates every subject in this class.
              </p>
              <Field label="Full name">
                <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label="USN">
                <Input required value={form.usn} onChange={(e) => setForm({ ...form, usn: e.target.value })} />
              </Field>
              <Field label="Email">
                <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Password">
                <PasswordInput required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? 'Creating account…' : 'Create account and request to join'}
              </Button>
              <button type="button" className="text-sm text-ink-muted" onClick={() => setMode('landing')}>
                Back
              </button>
            </form>
          ) : null}

          {mode === 'login' ? (
            <form onSubmit={onLogin} className="mt-6 space-y-3">
              <Field label="USN">
                <Input value={form.usn} onChange={(e) => setForm({ ...form, usn: e.target.value })} />
              </Field>
              <Field label="Email" optional>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </Field>
              <Field label="Password">
                <PasswordInput required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </Field>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? 'Signing in…' : 'Sign in and request class membership'}
              </Button>
              <button type="button" className="text-sm text-ink-muted" onClick={() => setMode('landing')}>
                Back
              </button>
            </form>
          ) : null}

          <p className="mt-6 text-xs text-ink-muted">
            Faculty? <Link className="text-accent" to="/login">Sign in to Lecturer LMS</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function StudentLmsLoginPage() {
  const { user, applySession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', usn: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Student sign in');
  const from = (location.state as { from?: { pathname: string; search: string } } | null)?.from;
  const next =
    new URLSearchParams(location.search).get('next') ||
    (from ? `${from.pathname}${from.search || ''}` : '/lms');

  useEffect(() => {
    if (user?.role === 'STUDENT' || user?.kind === 'student') navigate(next.startsWith('/lms') ? next : '/lms', { replace: true });
  }, [user, navigate, next]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await api<{ token: string; user: User }>('/api/student-auth/login', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ email: form.email || undefined, usn: form.usn || undefined, password: form.password }),
      });
      applySession(res.token, res.user);
      navigate(next.startsWith('/lms') ? next : '/lms', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-8">
        <BrandMark product="Student LMS" />
        <h1 className="mt-6 text-xl font-semibold">Student sign in</h1>
        <p className="mt-1 text-sm text-ink-muted">Use the same account created from your class LMS link.</p>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        <div className="mt-5 space-y-3">
          <Field label="USN" optional>
            <Input value={form.usn} onChange={(e) => setForm({ ...form, usn: e.target.value })} autoComplete="username" />
          </Field>
          <Field label="Email" optional>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password">
            <PasswordInput required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="current-password" />
          </Field>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
          <Link to="/lms/forgot-password" className="block text-center text-sm font-medium text-accent">
            Forgot password?
          </Link>
        </div>
      </form>
    </div>
  );
}

export function StudentForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  useDocumentTitle('Reset password');
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-8"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await api('/api/student-auth/forgot-password', {
              method: 'POST',
              auth: false,
              body: JSON.stringify({ email }),
            });
            setSent(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <BrandMark product="Student LMS" />
        <h1 className="mt-6 text-xl font-semibold">Forgot password</h1>
        {sent ? (
          <p className="mt-3 text-sm text-ink-muted">
            If an account exists for this email, a reset link has been sent.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            <Field label="Email">
              <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              Send reset instructions
            </Button>
          </div>
        )}
        <Link to="/lms/login" className="mt-6 block text-center text-sm text-accent">
          Back to sign in
        </Link>
      </form>
    </div>
  );
}

export function StudentResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const token = new URLSearchParams(useLocation().search).get('token') || '';
  useDocumentTitle('Choose a new password');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('This reset link is invalid or incomplete.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/api/student-auth/reset-password', {
        method: 'POST',
        auth: false,
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => navigate('/lms/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reset password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-8">
        <BrandMark product="Student LMS" />
        <h1 className="mt-6 text-xl font-semibold">Choose a new password</h1>
        {done ? (
          <p className="mt-3 text-sm text-ink-muted">Password updated. Redirecting to sign in…</p>
        ) : (
          <div className="mt-5 space-y-3">
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Field label="New password">
              <PasswordInput required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Field label="Confirm password">
              <PasswordInput required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </Field>
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? 'Saving…' : 'Reset password'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
