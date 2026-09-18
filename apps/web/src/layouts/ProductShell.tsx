import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronsUpDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  UserRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../lib/utils';
import { IconButton } from '../components/ui';
import { BrandMark } from '../components/Brand';

export type ShellNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
  /** When set, item is active if pathname starts with this prefix (in addition to NavLink matching). */
  activePrefix?: string;
};

export type ShellNavGroup = {
  label?: string;
  items: ShellNavItem[];
};

const COLLAPSE_KEY = 'skillonx.sidebar.collapsed';

export function ProductShell({
  groups,
  headerRight,
  contentClassName,
  profileBasePath = '/profile',
  settingsPath = '/settings',
  collapsible = false,
  brandProduct = 'Lecturer LMS',
  mobileTabs,
  searchPath,
}: {
  groups: ShellNavGroup[];
  headerRight?: ReactNode;
  contentClassName?: string;
  profileBasePath?: string;
  settingsPath?: string;
  collapsible?: boolean;
  brandProduct?: string;
  mobileTabs?: ShellNavItem[];
  searchPath?: string;
}) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (!collapsible || typeof window === 'undefined') return false;
    try {
      return window.localStorage.getItem(COLLAPSE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const menuRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState('');

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!collapsible) return;
    try {
      window.localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [collapsed, collapsible]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const signOut = () => {
    logout();
    navigate(user?.role === 'STUDENT' || user?.kind === 'student' ? '/lms/login' : '/login');
  };

  const menuItems = [
    { label: 'My Profile', icon: UserRound, onClick: () => navigate(profileBasePath) },
    { label: 'Account Settings', icon: SettingsIcon, onClick: () => navigate(settingsPath) },
    {
      label: 'Change Password',
      icon: ShieldCheck,
      onClick: () => navigate(`${profileBasePath}?tab=security`),
    },
  ];

  const renderNav = (compact: boolean) => (
    <nav
      className={cn('flex-1 space-y-5 overflow-y-auto pb-4 scroll-thin', compact ? 'px-2' : 'px-3')}
      aria-label="Primary"
    >
      {groups.map((group, gi) => (
        <div key={group.label ?? gi}>
          {group.label && !compact ? (
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
              {group.label}
            </p>
          ) : null}
          {group.label && compact ? (
            <div className="mb-1.5 border-t border-white/10" aria-hidden />
          ) : null}
          <div className="space-y-0.5">
            {group.items.map(({ to, label, icon: Icon, end, activePrefix }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={compact ? label : undefined}
                className={({ isActive }) => {
                  const prefixActive = activePrefix ? location.pathname.startsWith(activePrefix) : false;
                  return cn(
                    'group flex items-center rounded-[var(--radius-md)] text-[13.5px] font-medium text-sidebar-text transition duration-150 hover:bg-sidebar-hover hover:text-white',
                    compact ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5',
                    (isActive || prefixActive) && 'bg-sidebar-active text-sidebar-text-active',
                  );
                }}
              >
                <Icon
                  size={17}
                  className="shrink-0 text-white/55 transition group-hover:text-white/80 group-[[aria-current=page]]:text-white"
                />
                {!compact ? <span>{label}</span> : <span className="sr-only">{label}</span>}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const Sidebar = ({ compact }: { compact: boolean }) => (
    <div className="flex h-full flex-col bg-sidebar text-ink-inverse">
      <div className={cn(compact ? 'px-2 py-5' : 'px-5 py-5')}>
        <BrandMark inverted product={brandProduct} compact={compact} />
      </div>

      {renderNav(compact)}

      {collapsible && !compact ? (
        <div className="border-t border-white/10 px-3 py-2">
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            className="flex w-full items-center gap-2 rounded-[var(--radius-md)] px-3 py-2 text-left text-[12px] text-white/45 transition hover:bg-sidebar-hover hover:text-white/80"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose size={15} />
            Collapse
          </button>
        </div>
      ) : null}

      {collapsible && compact ? (
        <div className="border-t border-white/10 p-2">
          <button
            type="button"
            onClick={() => setCollapsed(false)}
            className="flex w-full items-center justify-center rounded-[var(--radius-md)] py-2 text-white/45 transition hover:bg-sidebar-hover hover:text-white/80"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      ) : null}

      <div className={cn('relative border-t border-white/10', compact ? 'p-2' : 'p-3')} ref={menuRef}>
        {menuOpen ? (
          <div
            className={cn(
              'absolute bottom-[calc(100%-0.25rem)] mb-1 overflow-hidden rounded-[var(--radius-md)] border border-black/20 bg-surface py-1 text-ink shadow-lg animate-fade-in',
              compact ? 'left-2 right-2 min-w-[200px]' : 'inset-x-3',
            )}
          >
            {menuItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition hover:bg-surface-muted"
              >
                <item.icon size={15} className="text-ink-muted" />
                {item.label}
              </button>
            ))}
            <div className="my-1 border-t border-border" />
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-danger transition hover:bg-danger-soft"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          title={compact ? user?.name : undefined}
          className={cn(
            'flex w-full items-center rounded-[var(--radius-md)] text-left transition hover:bg-sidebar-hover',
            compact ? 'justify-center px-1 py-2' : 'gap-3 px-2 py-2',
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white">
            {(user?.name ?? 'U')
              .split(' ')
              .map((p) => p[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          {!compact ? (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                <p className="truncate text-xs text-white/45">
                  {user?.roleLabel ||
                    ({
                      SUPER_ADMIN: 'Platform Administrator',
                      COLLEGE_ADMIN: 'College Administrator',
                      ACCOUNTANT: 'Accountant',
                      COE: 'Controller of Examinations',
                      FACULTY: 'Faculty',
                    }[user?.role ?? ''] ??
                      user?.role)}
                </p>
              </div>
              <ChevronsUpDown size={15} className="shrink-0 text-white/40" />
            </>
          ) : null}
        </button>
      </div>
    </div>
  );

  const desktopCollapsed = collapsible && collapsed;

  return (
    <div
      className={cn(
        'min-h-screen bg-bg lg:grid',
        desktopCollapsed
          ? 'lg:grid-cols-[var(--sidebar-collapsed-width)_1fr]'
          : 'lg:grid-cols-[var(--sidebar-width)_1fr]',
      )}
    >
      <aside className="sticky top-0 hidden h-screen lg:block">
        <Sidebar compact={desktopCollapsed} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full w-[min(288px,86vw)] shadow-lg">
            <Sidebar compact={false} />
          </div>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-[var(--header-height)] items-center justify-between gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <IconButton
              label="Open menu"
              className={mobileTabs?.length ? 'hidden lg:hidden' : 'lg:hidden'}
              onClick={() => setMobileOpen(true)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </IconButton>
            {searchPath ? (
              <form
                className="relative min-w-0 flex-1 max-w-md"
                onSubmit={(e) => {
                  e.preventDefault();
                  const q = query.trim();
                  if (q) navigate(`${searchPath}?q=${encodeURIComponent(q)}`);
                }}
              >
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search subjects, topics, assignments…"
                  aria-label="Search Student LMS"
                  className="h-9 w-full rounded-full border border-border bg-surface pl-9 pr-3 text-sm outline-none placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-[var(--color-accent-ring)]"
                />
              </form>
            ) : null}
          </div>
          <div className="flex items-center gap-3 text-ink-muted">{headerRight}</div>
        </header>

        <main className={cn('px-4 py-6 sm:px-6 lg:px-8', mobileTabs?.length ? 'pb-24 lg:pb-8' : undefined)}>
          <div className={cn('mx-auto w-full max-w-[1200px]', contentClassName)}>
            <Outlet />
          </div>
        </main>
      </div>

      {mobileTabs?.length ? (
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-2 py-1.5 backdrop-blur lg:hidden"
          aria-label="Student LMS"
        >
          <div className="mx-auto grid max-w-lg grid-cols-5">
            {mobileTabs.map(({ to, label, icon: Icon, end, activePrefix }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => {
                  const prefixActive = activePrefix ? location.pathname.startsWith(activePrefix) : false;
                  return cn(
                    'flex flex-col items-center gap-0.5 rounded-[var(--radius-md)] px-1 py-1.5 text-[11px] font-medium text-ink-muted',
                    (isActive || prefixActive) && 'text-accent',
                  );
                }}
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
