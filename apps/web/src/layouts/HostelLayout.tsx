import {
  AlertTriangle,
  BedDouble,
  ClipboardCheck,
  ClipboardList,
  DoorOpen,
  FileStack,
  HelpCircle,
  Home,
  IndianRupee,
  LayoutDashboard,
  Megaphone,
  MessageSquareWarning,
  UserRound,
  Users,
  Wrench,
} from 'lucide-react';
import { ProductShell } from './ProductShell';
import { useAuth } from '../auth/AuthContext';

const groups = [
  {
    label: 'Dashboard',
    items: [{ to: '/hostel', label: 'Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Residents',
    items: [
      { to: '/hostel/residents', label: 'All Residents', icon: Users, activePrefix: '/hostel/residents' },
      { to: '/hostel/applications', label: 'Pending Allocation', icon: ClipboardList },
      { to: '/hostel/waitlist', label: 'Waiting List', icon: ClipboardCheck },
      { to: '/hostel/transfers', label: 'Room Transfers', icon: DoorOpen },
    ],
  },
  {
    label: 'Rooms & Beds',
    items: [
      { to: '/hostel/rooms', label: 'Hostel Overview', icon: Home, activePrefix: '/hostel/rooms' },
      { to: '/hostel/vacancies', label: 'Vacancies', icon: BedDouble },
    ],
  },
  {
    label: 'Movement',
    items: [
      { to: '/hostel/attendance', label: 'Hostel Attendance', icon: ClipboardCheck },
      { to: '/hostel/leaves', label: 'Leave / Outing', icon: DoorOpen },
      { to: '/hostel/overdue', label: 'Overdue Returns', icon: AlertTriangle },
      { to: '/hostel/gate', label: 'Entry / Exit', icon: DoorOpen },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/hostel/complaints', label: 'Complaints', icon: MessageSquareWarning },
      { to: '/hostel/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/hostel/visitors', label: 'Visitors', icon: UserRound },
      { to: '/hostel/incidents', label: 'Incidents', icon: AlertTriangle },
      { to: '/hostel/operations', label: 'Mess Operations', icon: ClipboardList },
    ],
  },
  {
    label: 'Finance & Clearance',
    items: [
      { to: '/hostel/fees', label: 'Fee Status', icon: IndianRupee },
      { to: '/hostel/vacating', label: 'No-Due Clearance', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Communication',
    items: [{ to: '/hostel/notices', label: 'Notices', icon: Megaphone }],
  },
  {
    label: 'Reports',
    items: [{ to: '/hostel/reports', label: 'Hostel Reports', icon: FileStack }],
  },
  {
    label: 'More',
    items: [
      { to: '/profile', label: 'My Profile', icon: UserRound },
      { to: '/hostel/help', label: 'Help', icon: HelpCircle },
    ],
  },
];

export function HostelLayout() {
  const { user } = useAuth();
  const canUseFacultyPortal = user?.role === 'FACULTY' && user.portalContexts?.includes('WARDEN');
  return (
    <ProductShell
      groups={groups}
      collapsible
      brandProduct="Warden Portal"
      profileBasePath="/profile"
      settingsPath="/settings"
      contentClassName="max-w-[1400px]"
      headerRight={
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <span className="hidden sm:inline">{user?.collegeName || 'College workspace'}</span>
          {canUseFacultyPortal ? (
            <a className="font-medium text-accent hover:underline" href="/dashboard" onClick={() => localStorage.setItem('portal_context', 'FACULTY')}>Faculty Portal</a>
          ) : null}
        </div>
      }
    />
  );
}
