import {
  Boxes, ClipboardList, FlaskConical, LayoutDashboard, Microscope, PackageSearch,
  Wrench, MonitorSmartphone, FileBarChart, ShoppingCart, ShieldCheck,
} from 'lucide-react';
import { ProductShell } from './ProductShell';
import { useAuth } from '../auth/AuthContext';
import { isAdminRole } from '../components/Brand';

const groups = [
  {
    label: 'Laboratory',
    items: [
      { to: '/lab', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/lab/labs', label: 'Labs', icon: FlaskConical, activePrefix: '/lab/labs' },
      { to: '/lab/assets', label: 'Assets', icon: Microscope, activePrefix: '/lab/assets' },
      { to: '/lab/stock', label: 'Inventory / Stock', icon: Boxes, activePrefix: '/lab/stock' },
      { to: '/lab/issues', label: 'Issue & Return', icon: PackageSearch, activePrefix: '/lab/issues' },
      { to: '/lab/sessions', label: 'Sessions', icon: ClipboardList, activePrefix: '/lab/sessions' },
      { to: '/lab/faults', label: 'Faults / Repairs', icon: Wrench, activePrefix: '/lab/faults' },
      { to: '/lab/software', label: 'Software', icon: MonitorSmartphone, activePrefix: '/lab/software' },
      { to: '/lab/requirements', label: 'Requirements', icon: ShoppingCart, activePrefix: '/lab/requirements' },
      { to: '/lab/reports', label: 'Reports', icon: FileBarChart, activePrefix: '/lab/reports' },
    ],
  },
  {
    label: 'Oversight',
    items: [
      { to: '/lab/oversight', label: 'Lab Oversight', icon: ShieldCheck, activePrefix: '/lab/oversight' },
    ],
  },
];

export function LabLayout() {
  const { user } = useAuth();
  const product = user && isAdminRole(user.role) ? 'Lab Management' : 'Lab Workspace';
  return (
    <ProductShell
      groups={groups}
      collapsible
      brandProduct={product}
      profileBasePath="/profile"
      settingsPath="/settings"
      searchPath="/lab/assets"
      headerRight={<span className="hidden text-xs sm:inline">{user?.collegeName || 'Laboratory'}</span>}
      contentClassName="max-w-[1300px]"
    />
  );
}
