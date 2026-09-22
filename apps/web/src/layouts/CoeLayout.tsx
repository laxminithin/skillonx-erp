import {
  BadgeCheck,
  ClipboardList,
  FileCheck2,
  FileClock,
  FileSearch,
  LayoutDashboard,
  ListChecks,
  MapPinned,
  Medal,
  School,
  ScrollText,
  ShieldCheck,
  TicketCheck,
  UserCheck,
  Wallet,
  Lock,
  ClipboardCheck,
  AlertTriangle,
  BookCheck,
  PackageCheck,
  PenLine,
  FileBadge,
  QrCode,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ProductShell } from './ProductShell';
import { useAuth } from '../auth/AuthContext';

const groups = [
  {
    label: 'Exam Section',
    items: [
      { to: '/coe', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/coe/examinations', label: 'Examinations', icon: School, activePrefix: '/coe/examinations' },
      { to: '/coe/eligibility', label: 'Eligibility', icon: UserCheck, activePrefix: '/coe/eligibility' },
      { to: '/coe/timetable', label: 'Timetable', icon: FileClock, activePrefix: '/coe/timetable' },
      { to: '/coe/question-papers', label: 'Question Papers', icon: ShieldCheck, activePrefix: '/coe/question-papers' },
      { to: '/coe/rooms-seating', label: 'Rooms & Seating', icon: MapPinned, activePrefix: '/coe/rooms-seating' },
      { to: '/coe/invigilation', label: 'Invigilation', icon: ClipboardList, activePrefix: '/coe/invigilation' },
      { to: '/coe/hall-tickets', label: 'Hall Tickets', icon: TicketCheck, activePrefix: '/coe/hall-tickets' },
      { to: '/coe/operations', label: 'Exam Operations', icon: ListChecks, activePrefix: '/coe/operations' },
      { to: '/coe/strong-room', label: 'Strong Room', icon: Lock, activePrefix: '/coe/strong-room' },
      { to: '/coe/form-a', label: 'Form-A', icon: ClipboardCheck, activePrefix: '/coe/form-a' },
      { to: '/coe/mpc', label: 'Malpractice (MPC)', icon: AlertTriangle, activePrefix: '/coe/mpc' },
      { to: '/coe/answer-books', label: 'Answer Books', icon: BookCheck, activePrefix: '/coe/answer-books' },
      { to: '/coe/script-transfers', label: 'Script Transfers', icon: PackageCheck, activePrefix: '/coe/script-transfers' },
      { to: '/coe/valuation', label: 'Valuation', icon: PenLine, activePrefix: '/coe/valuation' },
      { to: '/coe/documents', label: 'Documents', icon: FileBadge, activePrefix: '/coe/documents' },
      { to: '/coe/verify', label: 'Verify Document', icon: QrCode, activePrefix: '/coe/verify' },
      { to: '/coe/marks', label: 'Marks', icon: BadgeCheck, activePrefix: '/coe/marks' },
      { to: '/coe/results', label: 'Results', icon: Medal, activePrefix: '/coe/results' },
      { to: '/coe/backlogs', label: 'Backlogs', icon: ScrollText, activePrefix: '/coe/backlogs' },
      { to: '/coe/revaluation', label: 'Revaluation', icon: FileSearch, activePrefix: '/coe/revaluation' },
      { to: '/coe/corrections', label: 'Corrections', icon: FileCheck2, activePrefix: '/coe/corrections' },
      { to: '/coe/remuneration', label: 'Remuneration', icon: Wallet, activePrefix: '/coe/remuneration' },
      { to: '/coe/reports', label: 'Reports', icon: FileSearch, activePrefix: '/coe/reports' },
    ],
  },
];

export function CoeLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const wide =
    location.pathname.startsWith('/coe/examinations/') ||
    location.pathname.startsWith('/coe/question-papers') ||
    location.pathname.startsWith('/coe/reports');

  return (
    <ProductShell
      groups={groups}
      collapsible
      brandProduct="COE Workspace"
      profileBasePath="/profile"
      settingsPath="/settings"
      searchPath="/coe/examinations"
      headerRight={<span className="hidden text-xs sm:inline">{user?.collegeName || 'Exam Section'}</span>}
      contentClassName={wide ? 'max-w-[1400px]' : 'max-w-[1200px]'}
    />
  );
}
