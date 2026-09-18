import {
  LayoutDashboard,
  Building2,
  Users,
  Shield,
  BookOpen,
  Boxes,
  Flag,
  Plug,
  HeartPulse,
  ScrollText,
  Megaphone,
  Plus,
} from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { ProductShell } from './ProductShell';
import { useAuth } from '../auth/AuthContext';

const groups = [
  {
    label: 'Overview',
    items: [{ to: '/platform', label: 'Platform Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Institutions',
    items: [
      { to: '/platform/tenants', label: 'Tenants / Colleges', icon: Building2 },
      { to: '/platform/tenants/new', label: 'New Tenant', icon: Plus },
    ],
  },
  {
    label: 'Identity & Access',
    items: [
      { to: '/platform/users', label: 'Users', icon: Users },
      { to: '/platform/roles', label: 'Roles & Capabilities', icon: Shield },
    ],
  },
  {
    label: 'Master Data',
    items: [{ to: '/platform/masters', label: 'Platform Templates', icon: BookOpen }],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/platform/modules', label: 'Modules', icon: Boxes },
      { to: '/platform/flags', label: 'Feature Flags', icon: Flag },
      { to: '/platform/integrations', label: 'Integrations', icon: Plug },
    ],
  },
  {
    label: 'Operations',
    items: [{ to: '/platform/health', label: 'Platform Health', icon: HeartPulse }],
  },
  {
    label: 'Governance',
    items: [
      { to: '/platform/audit', label: 'Audit', icon: ScrollText },
      { to: '/platform/announcements', label: 'Announcements', icon: Megaphone },
    ],
  },
];

/** Super Admin–only shell. College Admins are redirected to /admin. */
export function PlatformLayout() {
  const { user } = useAuth();
  if (user && user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/admin" replace />;
  }

  return (
    <ProductShell
      groups={groups}
      brandProduct="Platform"
      profileBasePath="/admin/profile"
      settingsPath="/platform"
      headerRight={
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="hidden text-ink-secondary sm:inline">SkillonX Governance</span>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent">
            Super Admin
          </span>
        </div>
      }
      contentClassName="max-w-[1280px]"
    />
  );
}
