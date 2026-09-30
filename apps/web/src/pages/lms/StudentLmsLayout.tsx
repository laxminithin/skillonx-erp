import {
  Briefcase,
  Bell,
  BookOpen,
  Building2,
  Bus,
  CalendarCheck2,
  ClipboardList,
  CreditCard,
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  Library,
  LineChart,
  MoreHorizontal,
  NotebookPen,
  ScrollText,
  UserRound,
  Award,
  MessageSquareWarning,
} from 'lucide-react';
import { ProductShell } from '../../layouts/ProductShell';
import { useAuth } from '../../auth/AuthContext';
import { api } from '../../lib/api';
import { useEffect, useMemo, useState } from 'react';

const groups = [
  {
    label: 'Learn',
    items: [
      { to: '/lms', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/lms/subjects', label: 'My Subjects', icon: BookOpen, activePrefix: '/lms/subjects' },
      { to: '/lms/learning', label: 'Learning', icon: NotebookPen, activePrefix: '/lms/learning' },
    ],
  },
  {
    label: 'Work',
    items: [
      { to: '/lms/assignments', label: 'Assignments', icon: ClipboardList, activePrefix: '/lms/assignments' },
      { to: '/lms/quizzes', label: 'Quizzes', icon: ScrollText, activePrefix: '/lms/quizzes' },
      { to: '/lms/assessments', label: 'Assessments', icon: GraduationCap, activePrefix: '/lms/assessments' },
      { to: '/lms/exams', label: 'Examinations', icon: ScrollText, activePrefix: '/lms/exams' },
      { to: '/lms/papers', label: 'Previous Papers', icon: BookOpen, activePrefix: '/lms/papers' },
    ],
  },
  {
    label: 'Career',
    items: [
      { to: '/lms/placements', label: 'Training & Placement', icon: Briefcase, activePrefix: '/lms/placements' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/lms/fees', label: 'Fees & Payments', icon: CreditCard, activePrefix: '/lms/fees' },
      { to: '/lms/library', label: 'Library', icon: Library, activePrefix: '/lms/library' },
    ],
  },
  {
    label: 'Services',
    items: [
      { to: '/lms/services', label: 'Services', icon: Award, activePrefix: '/lms/services', end: true },
      { to: '/lms/services/requests', label: 'My Requests', icon: FileText, activePrefix: '/lms/services/requests' },
      { to: '/lms/services/certificates', label: 'Certificates', icon: Award, activePrefix: '/lms/services/certificates' },
      { to: '/lms/services/grievances', label: 'Grievances', icon: MessageSquareWarning, activePrefix: '/lms/services/grievances' },
      { to: '/lms/services/mentor', label: 'Mentoring', icon: UserRound, activePrefix: '/lms/services/mentor' },
      { to: '/lms/events', label: 'Campus Events', icon: CalendarCheck2, activePrefix: '/lms/events' },
    ],
  },
  {
    label: 'Progress',
    items: [
      { to: '/lms/performance', label: 'Performance', icon: LineChart, activePrefix: '/lms/performance' },
      { to: '/lms/attendance', label: 'Attendance', icon: CalendarCheck2, activePrefix: '/lms/attendance' },
      { to: '/lms/timetable', label: 'Timetable', icon: CalendarCheck2, activePrefix: '/lms/timetable' },
      { to: '/lms/calendar', label: 'Calendar', icon: CalendarCheck2, activePrefix: '/lms/calendar' },
      { to: '/lms/history', label: 'Academic History', icon: History, activePrefix: '/lms/history' },
      { to: '/lms/notifications', label: 'Notifications', icon: Bell, activePrefix: '/lms/notifications' },
      { to: '/lms/profile', label: 'Profile', icon: UserRound, activePrefix: '/lms/profile' },
    ],
  },
];

const mobileTabs = [
  { to: '/lms', label: 'Home', icon: LayoutDashboard, end: true },
  { to: '/lms/subjects', label: 'Subjects', icon: BookOpen, activePrefix: '/lms/subjects' },
  { to: '/lms/tasks', label: 'Tasks', icon: ClipboardList, activePrefix: '/lms/tasks' },
  { to: '/lms/performance', label: 'Performance', icon: LineChart, activePrefix: '/lms/performance' },
  { to: '/lms/more', label: 'More', icon: MoreHorizontal, activePrefix: '/lms/more' },
];

export function StudentLmsLayout() {
  const { user } = useAuth();
  const [hostelVisible, setHostelVisible] = useState(false);
  const [transportVisible, setTransportVisible] = useState(false);

  useEffect(() => {
    api<{ visibility: string }>('/api/student/hostel/access')
      .then((d) => setHostelVisible(d.visibility !== 'HIDDEN'))
      .catch(() => setHostelVisible(false));
    api<{ visibility: string }>('/api/student/transport/access')
      .then((d) => setTransportVisible(d.visibility !== 'HIDDEN'))
      .catch(() => setTransportVisible(false));
  }, []);

  const navGroups = useMemo(() => {
    const accountItems = [
      { to: '/lms/fees', label: 'Fees & Payments', icon: CreditCard, activePrefix: '/lms/fees' },
      { to: '/lms/library', label: 'Library', icon: Library, activePrefix: '/lms/library' },
    ];
    if (hostelVisible) {
      accountItems.push({ to: '/lms/hostel', label: 'Hostel', icon: Building2, activePrefix: '/lms/hostel' });
    }
    if (transportVisible) {
      accountItems.push({ to: '/lms/transport', label: 'Transport', icon: Bus, activePrefix: '/lms/transport' });
    }
    return groups.map((g) => (g.label === 'Account' ? { ...g, items: accountItems } : g));
  }, [hostelVisible, transportVisible]);

  return (
    <ProductShell
      groups={navGroups}
      brandProduct="Student LMS"
      profileBasePath="/lms/profile"
      settingsPath="/lms/profile"
      searchPath="/lms/search"
      mobileTabs={mobileTabs}
      headerRight={
        <span className="hidden max-w-[240px] truncate text-xs sm:inline">
          {user?.departmentCode || user?.departmentName}
          {user?.semesterLabel ? ` · ${user.semesterLabel}` : ''}
          {user?.sectionLabel ? ` · Sec ${user.sectionLabel}` : ''}
        </span>
      }
      collapsible
    />
  );
}

export function studentIcon() {
  return GraduationCap;
}
