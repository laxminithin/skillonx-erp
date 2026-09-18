import {
  LayoutDashboard,
  ClipboardList,
  Library,
  Settings,
  ListChecks,
  PenLine,
  BookOpen,
  GitMerge,
  ScanSearch,
  ClipboardCheck,
  Sparkles,
  GraduationCap,
  UserRound,
  LibraryBig,
  Building2,
  Bus,
  FileStack,
  Activity,
  Users,
  CalendarDays,
  IndianRupee,
  Briefcase,
  Shield,
  HeartHandshake,
  UserCog,
  Award,
  Warehouse,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { ProductShell } from './ProductShell';
import { useAuth } from '../auth/AuthContext';
import { cn } from '../lib/utils';

const groups = [
  {
    label: 'My Faculty Work',
    items: [{ to: '/dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'My Teaching',
    items: [
      { to: '/courses', label: 'Courses', icon: GraduationCap, activePrefix: '/courses' },
      { to: '/classes', label: 'Classes', icon: Users, activePrefix: '/classes' },
      { to: '/timetable', label: 'My Timetable', icon: CalendarDays, activePrefix: '/timetable' },
      { to: '/exam-duties', label: 'Exam Duties', icon: CalendarDays, activePrefix: '/exam-duties' },
      { to: '/lesson-plans', label: 'Lesson Plans', icon: BookOpen },
      {
        to: '/beyond-syllabus',
        label: 'Beyond Syllabus',
        icon: Sparkles,
        activePrefix: '/beyond-syllabus',
      },
    ],
  },
  {
    label: 'Assessments',
    items: [
      { to: '/quizzes', label: 'Quizzes', icon: ListChecks },
      { to: '/assignments', label: 'Assignments', icon: PenLine },
      { to: '/quizzes/bank', label: 'Question Bank', icon: Library },
      { to: '/previous-year-papers', label: 'Previous Year QPs', icon: LibraryBig, activePrefix: '/previous-year-papers' },
      { to: '/course-textbooks', label: 'Course Textbooks', icon: BookOpen, activePrefix: '/course-textbooks' },
      { to: '/internal-question-papers', label: 'Internal Question Papers', icon: FileStack, activePrefix: '/internal-question-papers' },
      { to: '/surveys', label: 'Surveys', icon: ClipboardList },
    ],
  },
  {
    label: 'Outcomes & Quality',
    items: [
      { to: '/copo', label: 'Academic Mapping', icon: GitMerge, activePrefix: '/copo' },
      { to: '/gap-analysis', label: 'Gap Analysis', icon: ScanSearch, activePrefix: '/gap-analysis' },
      {
        to: '/co-evaluation',
        label: 'CO Evaluation',
        icon: ClipboardCheck,
        activePrefix: '/co-evaluation',
      },
      {
        to: '/attainment',
        label: 'Attainment & Improvement',
        icon: Activity,
        activePrefix: '/attainment',
      },
      {
        to: '/examinations',
        label: 'Examinations',
        icon: GraduationCap,
        activePrefix: '/examinations',
      },
      {
        to: '/student-services/action-center',
        label: 'Student Services',
        icon: ClipboardList,
        activePrefix: '/student-services',
      },
      {
        to: '/mentoring',
        label: 'Mentoring',
        icon: HeartHandshake,
        activePrefix: '/mentoring',
      },
      {
        to: '/coordinator',
        label: 'Class Coordinator',
        icon: UserCog,
        activePrefix: '/coordinator',
      },
      {
        to: '/library',
        label: 'Library',
        icon: LibraryBig,
        activePrefix: '/library',
      },
      {
        to: '/hostel',
        label: 'Hostel',
        icon: Building2,
        activePrefix: '/hostel',
      },
      {
        to: '/transport',
        label: 'Transport',
        icon: Bus,
        activePrefix: '/transport',
      },
      {
        to: '/procurement',
        label: 'Stores & Purchase',
        icon: Warehouse,
        activePrefix: '/procurement',
      },
      {
        to: '/hr',
        label: 'My HR',
        icon: Briefcase,
        activePrefix: '/hr',
      },
      {
        to: '/faculty-profile',
        label: 'Academic Profile',
        icon: Award,
        activePrefix: '/faculty-profile',
      },
      {
        to: '/placements',
        label: 'Training & Placement',
        icon: GraduationCap,
        activePrefix: '/placements',
      },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/profile', label: 'Profile', icon: UserRound },
      { to: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isHod = !!user?.leadership?.isHod;
  const isPrincipal = !!user?.leadership?.isPrincipal;
  const isManagement =
    user?.role === 'MANAGEMENT' ||
    user?.role === 'CHAIRMAN' ||
    user?.role === 'COLLEGE_ADMIN' ||
    user?.role === 'SUPER_ADMIN' ||
    isPrincipal;

  const leadershipGroups = [
    ...(isManagement
      ? [
          {
            label: 'Management',
            items: [
              { to: '/management', label: 'Command Center', icon: LayoutDashboard, end: true },
              { to: '/management/academics', label: 'Academics', icon: BookOpen },
              { to: '/management/workforce', label: 'Workforce', icon: Users },
              { to: '/management/recruitment', label: 'Recruitment', icon: Briefcase },
              { to: '/management/performance', label: 'Performance', icon: Activity },
              { to: '/management/ld', label: 'Learning & Dev', icon: GraduationCap },
              { to: '/management/succession', label: 'Succession', icon: Shield },
              { to: '/management/placement', label: 'Placement', icon: Briefcase },
              { to: '/management/finance', label: 'Finance', icon: IndianRupee },
              { to: '/management/payroll', label: 'Payroll Summary', icon: IndianRupee },
              { to: '/management/campus', label: 'Campus', icon: Building2 },
              { to: '/management/mentoring', label: 'Mentoring', icon: HeartHandshake },
              { to: '/management/departments', label: 'Scorecards', icon: Building2 },
              { to: '/management/approvals', label: 'Approvals', icon: ClipboardCheck },
              { to: '/management/exceptions', label: 'Risks & Exceptions', icon: ScanSearch },
              { to: '/management/reports', label: 'Reports', icon: FileStack },
            ],
          },
        ]
      : []),
    ...(isHod
      ? [
          {
            label: 'Department — HOD',
            items: [
              { to: '/hod', label: 'Department Dashboard', icon: LayoutDashboard, end: true },
              { to: '/hod/faculty', label: 'Faculty', icon: Users },
              { to: '/hod/workload', label: 'Faculty Workload', icon: Activity },
              { to: '/hod/allocation', label: 'Teaching Allocation', icon: GraduationCap },
              { to: '/hod/timetable', label: 'Timetable', icon: CalendarDays },
              { to: '/hod/attendance', label: 'Faculty Attendance', icon: ClipboardCheck },
              { to: '/hod/leave', label: 'Faculty Leave', icon: Briefcase },
              { to: '/hod/mentoring', label: 'Mentoring', icon: HeartHandshake },
              { to: '/hod/progress', label: 'Academic Progress', icon: BookOpen },
              { to: '/hod/assessments', label: 'Assessments', icon: ListChecks },
              { to: '/hod/results', label: 'Results', icon: ClipboardList },
              { to: '/hod/continuity', label: 'Academic Continuity', icon: GitMerge },
              { to: '/hod/exceptions', label: 'Exceptions', icon: ScanSearch },
              { to: '/hod/reports', label: 'Reports', icon: FileStack },
              { to: '/hod/placement', label: 'Department T&P', icon: Briefcase },
              { to: '/hod/clearance', label: 'Department Clearance', icon: ClipboardCheck },
              { to: '/hr/performance/team', label: 'Team Performance', icon: Activity },
            ],
          },
        ]
      : []),
    ...(isPrincipal
      ? [
          {
            label: 'Principal',
            items: [
              { to: '/principal', label: 'Institution Dashboard', icon: LayoutDashboard, end: true },
              { to: '/principal/departments', label: 'Departments', icon: Building2 },
              { to: '/principal/hods', label: 'HODs', icon: Shield },
              { to: '/principal/faculty', label: 'Faculty Overview', icon: Users },
              { to: '/principal/students', label: 'Students Overview', icon: GraduationCap },
              { to: '/principal/mentoring', label: 'Mentoring', icon: HeartHandshake },
              { to: '/principal/progress', label: 'Academic Progress', icon: BookOpen },
              { to: '/principal/attendance', label: 'Attendance Overview', icon: ClipboardCheck },
              { to: '/principal/timetable', label: 'Timetable Overview', icon: CalendarDays },
              { to: '/principal/assessments', label: 'Assessments', icon: ListChecks },
              { to: '/principal/results', label: 'Results', icon: ClipboardList },
              { to: '/principal/continuity', label: 'Academic Continuity', icon: GitMerge },
              { to: '/principal/approvals', label: 'Approvals', icon: Briefcase },
              { to: '/principal/exceptions', label: 'Exceptions', icon: ScanSearch },
              { to: '/principal/reports', label: 'Reports', icon: FileStack },
              { to: '/principal/placement', label: 'T&P Oversight', icon: Briefcase },
              { to: '/hr/performance/principal', label: 'Performance Overview', icon: Activity },
            ],
          },
        ]
      : []),
  ];
  const nav = [...groups.slice(0, -1), ...leadershipGroups, groups[groups.length - 1]];
  const wide =
    (location.pathname.includes('/surveys/') && !location.pathname.endsWith('/create')) ||
    (location.pathname.includes('/quizzes/') &&
      !location.pathname.endsWith('/create') &&
      !location.pathname.endsWith('/bank')) ||
    (location.pathname.includes('/assignments/') &&
      !location.pathname.endsWith('/create') &&
      !location.pathname.endsWith('/bank')) ||
    (location.pathname.includes('/lesson-plans/') && !location.pathname.endsWith('/create')) ||
    (location.pathname.includes('/gap-analysis/') && !location.pathname.endsWith('/create')) ||
    (location.pathname.includes('/beyond-syllabus/') && !location.pathname.endsWith('/create')) ||
    (location.pathname.includes('/co-evaluation/') && !location.pathname.endsWith('/create')) ||
    location.pathname.startsWith('/attainment') ||
    (location.pathname.includes('/previous-year-papers/') && !location.pathname.endsWith('/questions')) ||
    (location.pathname.includes('/internal-question-papers/') && !location.pathname.endsWith('/create')) ||
    location.pathname.startsWith('/courses/') ||
    location.pathname.startsWith('/classes/') ||
    location.pathname.startsWith('/hod') ||
    location.pathname.startsWith('/principal') ||
    location.pathname.startsWith('/management') ||
    location.pathname.startsWith('/mentoring') ||
    location.pathname.startsWith('/procurement') ||
    location.pathname.includes('/copo/mapping') ||
    (location.pathname.includes('/copo') && location.pathname.includes('/mappings/')) ||
    location.pathname.includes('/copo/subjects');

  return (
    <ProductShell
      groups={nav}
      collapsible
      headerRight={
        <span className="hidden text-xs sm:inline">{user?.collegeName || 'College workspace'}</span>
      }
      contentClassName={cn(wide ? 'max-w-[1400px]' : 'max-w-[1200px]')}
    />
  );
}
