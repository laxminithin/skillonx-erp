import { useEffect, useState } from 'react';
import {
  LayoutDashboard, ListChecks, PlusCircle, Wrench, Inbox, FileBarChart, Settings2, HardHat,
} from 'lucide-react';
import { ProductShell, type ShellNavGroup } from './ProductShell';
import { useAuth } from '../auth/AuthContext';
import { maintApi, type MaintMeta } from '../lib/maintenanceApi';

export function MaintenanceLayout() {
  const { user } = useAuth();
  const [meta, setMeta] = useState<MaintMeta | null>(null);
  useEffect(() => { maintApi.meta().then(setMeta).catch(() => setMeta(null)); }, []);

  const requesterItems = [
    { to: '/maintenance', label: 'My Requests', icon: ListChecks, end: true },
    { to: '/maintenance/new', label: 'Raise a Request', icon: PlusCircle, activePrefix: '/maintenance/new' },
  ];
  const groups: ShellNavGroup[] = [{ label: 'Service Desk', items: requesterItems }];

  if (meta?.canWork) {
    groups.push({ label: 'Work', items: [{ to: '/maintenance/work', label: 'My Assigned Work', icon: HardHat, activePrefix: '/maintenance/work' }] });
  }
  if (meta?.isManager) {
    groups.push({
      label: 'Operations',
      items: [
        { to: '/maintenance/manager', label: 'Manager Dashboard', icon: LayoutDashboard, activePrefix: '/maintenance/manager' },
        { to: '/maintenance/queue', label: 'Central Queue', icon: Inbox, activePrefix: '/maintenance/queue' },
        { to: '/maintenance/reports', label: 'Reports', icon: FileBarChart, activePrefix: '/maintenance/reports' },
        { to: '/maintenance/config', label: 'Configuration', icon: Settings2, activePrefix: '/maintenance/config' },
      ],
    });
  }

  const product = meta?.isManager ? 'Facilities & IT Helpdesk' : meta?.canWork ? 'Maintenance Workspace' : 'Service Desk';
  return (
    <ProductShell
      groups={groups}
      collapsible
      brandProduct={product}
      profileBasePath="/profile"
      settingsPath="/settings"
      searchPath="/maintenance"
      headerRight={<span className="hidden text-xs sm:inline">{user?.collegeName || 'Maintenance'}</span>}
      contentClassName="max-w-[1300px]"
    />
  );
}
