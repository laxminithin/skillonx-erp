import { FileText, FolderKanban, Inbox, LayoutDashboard, Send, Settings } from 'lucide-react';
import { ProductShell } from './ProductShell';
const groups = [{ label: 'Office Administration', items: [
  { to: '/office', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/office/requests', label: 'Request Inbox', icon: Inbox, activePrefix: '/office/requests' },
  { to: '/office/documents', label: 'Issued Documents', icon: FileText, activePrefix: '/office/documents' },
  { to: '/office/inward', label: 'Inward Register', icon: FileText, activePrefix: '/office/inward' },
  { to: '/office/outward', label: 'Outward & Dispatch', icon: Send, activePrefix: '/office/outward' },
  { to: '/office/files', label: 'File Movement', icon: FolderKanban, activePrefix: '/office/files' },
  { to: '/office/settings', label: 'Settings', icon: Settings, activePrefix: '/office/settings' },
] }];
export function OfficeLayout() { return <ProductShell groups={groups} brandProduct="Office Administration" profileBasePath="/profile" settingsPath="/office/settings" contentClassName="max-w-[1400px]" />; }
