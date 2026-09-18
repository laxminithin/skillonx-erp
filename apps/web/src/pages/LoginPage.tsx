import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { Button, Field, Input, PasswordInput } from '../components/ui';
import { BrandMark, isAdminRole } from '../components/Brand';
import { useDocumentTitle } from '../lib/useDocumentTitle';

const DEMO_ACCOUNTS = [
  {
    role: 'Lecturer / My HR',
    email: 'anita@vviet.edu.in',
    password: 'Password123',
  },
  {
    role: 'Substitute lecturer',
    email: 'ravi@vviet.edu.in',
    password: 'Password123',
  },
  {
    role: 'College / HR admin',
    email: 'collegeadmin@vviet.edu.in',
    password: 'Password123',
  },
  {
    role: 'Platform admin',
    email: 'admin@skillonx.com',
    password: 'Password123',
  },
] as const;

function staffLandingPath(role?: string | null) {
  if (role === 'ACCOUNTANT') return '/accountant';
  if (role === 'COE') return '/coe';
  if (role === 'LAB_ASSISTANT') return '/lab';
  if (role === 'OFFICE_ADMIN' || role === 'OFFICE_SUPERINTENDENT') return '/office';
  return isAdminRole(role) ? '/admin' : '/dashboard';
}

export function LoginPage() {
  const { user, login } = useAuth();
  useDocumentTitle('Sign In');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionExpired = params.get('expired') === '1';

  if (user) {
    if (user.role === 'STUDENT' || user.kind === 'student') {
      return <Navigate to="/lms" replace />;
    }
    return <Navigate to={staffLandingPath(user.role)} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const next = await login(email, password);
      navigate(staffLandingPath(next.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const useDemoAccount = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
    setError('');
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-bg">
      <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[46%] bg-sidebar lg:block">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 30% 25%, rgba(12,107,84,0.55), transparent 45%)',
          }}
        />
        <div className="relative flex h-full flex-col justify-between p-10 text-white">
          <BrandMark inverted />
          <div>
            <h1 className="max-w-sm text-3xl font-semibold tracking-tight">
              Your academic teaching workspace.
            </h1>
            <p className="mt-4 max-w-sm text-[15px] leading-7 text-white/65">
              Courses, assessments, lesson plans, and outcome management — in one Lecturer LMS.
            </p>
          </div>
          <p className="text-xs text-white/35">SkillonX Lecturer LMS</p>
        </div>
      </div>

      <div className="flex min-h-screen items-center justify-center px-4 py-10 lg:ml-[46%] lg:justify-start lg:px-16">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-sm sm:p-8"
        >
          <div className="mb-6 lg:hidden">
            <BrandMark />
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-ink">Welcome back</h2>
          <p className="mt-1 text-sm text-ink-muted">Sign in to Lecturer LMS</p>

          {sessionExpired ? (
            <div className="mt-5 rounded-[var(--radius-md)] border border-warning/25 bg-warning-soft px-3.5 py-2.5 text-sm text-warning">
              Your session has expired. Please sign in again to continue.
            </div>
          ) : null}

          <div className="mt-6 space-y-4">
            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                autoFocus
              />
            </Field>
            <Field label="Password">
              <PasswordInput
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </Field>
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={loading || !email || !password}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
            <Link
              to="/forgot-password"
              className="block text-center text-sm font-medium text-accent hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          {import.meta.env.DEV ? (
            <details className="group mt-6 rounded-[var(--radius-md)] border border-border bg-surface-muted text-xs text-ink-secondary">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 font-medium text-ink">
                <span>Demo accounts</span>
                <span className="text-ink-muted group-open:hidden">Show</span>
                <span className="hidden text-ink-muted group-open:inline">Hide</span>
              </summary>
              <div className="space-y-2 border-t border-border px-2.5 py-2.5">
                <p className="px-1 text-ink-muted">Select a staff account to fill the sign-in form.</p>
                {DEMO_ACCOUNTS.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => useDemoAccount(account)}
                    className="flex w-full flex-col gap-0.5 rounded-[var(--radius-sm)] px-2 py-2 text-left transition-colors hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    aria-label={`Use ${account.role} demo account`}
                  >
                    <span className="font-medium text-ink">{account.role}</span>
                    <span className="break-all text-ink-muted">
                      {account.email} / {account.password}
                    </span>
                  </button>
                ))}
                <div className="flex flex-col gap-0.5 rounded-[var(--radius-sm)] px-2 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                  <span className="font-medium text-ink">Student LMS</span>
                  <span className="break-all text-ink-muted">
                    e2e.approved@student.skillonx.test / Student@123
                  </span>
                </div>
                <Link
                  to="/lms/login"
                  className="block px-2 pt-1 text-right font-medium text-accent hover:underline"
                >
                  Open student sign-in →
                </Link>
              </div>
            </details>
          ) : null}
        </form>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-xs sm:p-8">
        <BrandMark showProduct={false} />
        <h1 className="mt-6 text-xl font-semibold tracking-tight text-ink">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Password resets are handled by your institution administrator. Contact them to receive a
          new temporary password, then sign in and set your own password from{' '}
          <span className="font-medium text-ink">Profile → Security</span>.
        </p>
        <Link
          to="/login"
          className="mt-6 block text-center text-sm font-medium text-accent hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
