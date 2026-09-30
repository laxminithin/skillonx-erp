import { LayoutDashboard } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { ProductShell } from './ProductShell';

/**
 * Campus OS Phase 7 — IQAC, Accreditation, Compliance & Institutional
 * Quality. ONE workspace, role-scoped by permission on the backend, not
 * separate portals per NBA/NAAC/NIRF/IQAC coordinator (prompt §73).
 */
const groups = [
  {
    label: 'IQAC & Accreditation',
    items: [{ to: '/iqac', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
];

export function IqacLayout() {
  const { user } = useAuth();
  return (
    <ProductShell
      groups={groups}
      brandProduct="IQAC & Accreditation"
      profileBasePath="/profile"
      settingsPath="/settings"
      headerRight={<span className="hidden text-xs sm:inline">{user?.collegeName || 'College'}</span>}
    />
  );
}
