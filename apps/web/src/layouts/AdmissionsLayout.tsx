import {
  BarChart3,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  LayoutDashboard,
  Settings,
  UsersRound,
  WalletCards,
} from 'lucide-react';
import { ProductShell } from './ProductShell';
import { useAuth } from '../auth/AuthContext';

const groups = [
  {
    label: 'Admissions',
    items: [
      { to: '/admissions', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admissions/applications', label: 'Applications', icon: UsersRound, activePrefix: '/admissions/applications' },
      { to: '/admissions/documents', label: 'Documents', icon: FileSearch, activePrefix: '/admissions/documents' },
      { to: '/admissions/eligibility', label: 'Eligibility', icon: ClipboardCheck, activePrefix: '/admissions/eligibility' },
      { to: '/admissions/intake', label: 'Intake', icon: FileCheck2, activePrefix: '/admissions/intake' },
      { to: '/admissions/offers', label: 'Offers & Finance', icon: WalletCards, activePrefix: '/admissions/offers' },
      { to: '/admissions/reports', label: 'Reports', icon: BarChart3, activePrefix: '/admissions/reports' },
      { to: '/admissions/settings', label: 'Settings', icon: Settings, activePrefix: '/admissions/settings' },
    ],
  },
];

export function AdmissionsLayout() {
  const { user } = useAuth();
  return (
    <ProductShell
      groups={groups}
      collapsible
      brandProduct="Admissions"
      profileBasePath="/profile"
      settingsPath="/admissions/settings"
      searchPath="/admissions/applications"
      headerRight={<span className="hidden text-xs sm:inline">{user?.collegeName || 'Admissions office'}</span>}
      contentClassName="max-w-[1320px]"
    />
  );
}
