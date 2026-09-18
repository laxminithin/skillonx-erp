import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  ClipboardList,
  MessageSquareText,
  BarChart3,
  FileSpreadsheet,
  BookOpen,
  Settings,
  ListChecks,
  CalendarDays,
  NotebookPen,
  GitMerge,
  ScanSearch,
  ClipboardCheck,
  PenLine,
  Sparkles,
  LibraryBig,
  FileStack,
  Activity,
  Shield,
} from 'lucide-react';
import { ProductShell } from './ProductShell';
import { useAuth } from '../auth/AuthContext';
import { useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

const groups = [
  {
    label: 'Platform',
    items: [
      { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/admin/institutions', label: 'Institutions', icon: Building2 },
      { to: '/admin/faculty', label: 'Faculty', icon: Users },
      { to: '/admin/students', label: 'Students', icon: GraduationCap },
    ],
  },
  {
    label: 'Assessments',
    items: [
      { to: '/admin/surveys', label: 'Surveys', icon: ClipboardList },
      { to: '/admin/quizzes', label: 'Quizzes', icon: ListChecks },
      { to: '/assignments', label: 'Assignments', icon: PenLine },
      { to: '/admin/responses', label: 'Responses', icon: MessageSquareText },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
      { to: '/admin/reports', label: 'Reports', icon: FileSpreadsheet },
    ],
  },
  {
    label: 'Academic Tools',
    items: [
      { to: '/admin/lesson-plans', label: 'Lesson Plans', icon: NotebookPen },
      { to: '/admin/lesson-master', label: 'Lesson Master', icon: BookOpen },
      { to: '/admin/calendar', label: 'Academic Calendar', icon: CalendarDays },
      { to: '/admin/timetable', label: 'Timetable', icon: CalendarDays, activePrefix: '/admin/timetable' },
      { to: '/admin/attendance', label: 'Attendance', icon: ClipboardCheck },
      { to: '/admin/copo', label: 'Academic Mappings', icon: GitMerge, activePrefix: '/admin/copo' },
      {
        to: '/admin/gap-analysis',
        label: 'Gap Analysis',
        icon: ScanSearch,
        activePrefix: '/admin/gap-analysis',
      },
      { to: '/admin/gap-master', label: 'Gap Analysis Master', icon: BookOpen },
      {
        to: '/admin/beyond-syllabus',
        label: 'Content Beyond Syllabus',
        icon: Sparkles,
        activePrefix: '/admin/beyond-syllabus',
      },
      { to: '/admin/cbs-master', label: 'Beyond-Syllabus Master', icon: BookOpen },
      {
        to: '/admin/co-evaluation',
        label: 'CO Evaluation',
        icon: ClipboardCheck,
        activePrefix: '/admin/co-evaluation',
      },
      { to: '/admin/co-eval-master', label: 'CO Evaluation Master', icon: BookOpen },
      { to: '/admin/qp-master', label: 'Previous Year QP Master', icon: LibraryBig },
      { to: '/admin/course-textbooks', label: 'Course Textbook Master', icon: BookOpen },
      {
        to: '/admin/internal-question-papers',
        label: 'Internal Question Papers',
        icon: FileStack,
        activePrefix: '/admin/internal-question-papers',
      },
      {
        to: '/admin/attainment',
        label: 'Attainment & Improvement',
        icon: Activity,
        activePrefix: '/admin/attainment',
      },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { to: '/admin/academic', label: 'Academic Setup', icon: BookOpen },
      { to: '/admin/classes', label: 'Academic Classes', icon: GraduationCap, activePrefix: '/admin/classes' },
      { to: '/admin/leadership', label: 'Academic Leadership', icon: Shield, activePrefix: '/admin/leadership' },
      { to: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function AdminLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const wide =
    location.pathname.includes('/admin/copo/mapping') ||
    (location.pathname.includes('/admin/copo') && location.pathname.includes('/mappings/')) ||
    location.pathname.includes('/admin/copo/subjects') ||
    (location.pathname.includes('/admin/gap-analysis/') && !location.pathname.endsWith('/create')) ||
    (location.pathname.includes('/admin/beyond-syllabus/') && !location.pathname.endsWith('/create')) ||
    (location.pathname.includes('/admin/co-evaluation/') && !location.pathname.endsWith('/create')) ||
    location.pathname.startsWith('/admin/attainment') ||
    location.pathname.startsWith('/admin/classes') ||
    location.pathname.startsWith('/admin/timetable');

  return (
    <ProductShell
      groups={groups}
      brandProduct="Admin"
      profileBasePath="/admin/profile"
      settingsPath="/admin/settings"
      headerRight={
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="hidden text-ink-secondary sm:inline">
            {user?.collegeName || 'SkillonX'}
          </span>
          <span className="rounded-full bg-accent-soft px-2.5 py-1 text-[11px] font-medium text-accent">
            Admin
          </span>
        </div>
      }
      contentClassName={cn(wide ? 'max-w-[1400px]' : 'max-w-[1280px]')}
    />
  );
}
