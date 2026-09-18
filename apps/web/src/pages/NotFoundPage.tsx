import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { isAdminRole } from '../components/Brand';
import { Button } from '../components/ui';
import { useDocumentTitle } from '../lib/useDocumentTitle';

export function NotFoundPage() {
  useDocumentTitle('Page not found');
  const { user } = useAuth();
  const home = user ? (isAdminRole(user.role) ? '/admin' : '/dashboard') : '/login';

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md rounded-[var(--radius-xl)] border border-border bg-surface p-8 text-center shadow-xs">
        <p className="text-4xl font-semibold tracking-tight text-ink">404</p>
        <h1 className="mt-2 text-lg font-semibold text-ink">Page not found</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link to={home} className="mt-6 inline-block">
          <Button>{user ? 'Return to Dashboard' : 'Return to sign in'}</Button>
        </Link>
      </div>
    </div>
  );
}
