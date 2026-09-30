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
  MapPinned,
  BadgeCheck,
  CalendarRange,
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
      {
        to: '/events',
        label: 'Events & Resources',
        icon: CalendarRange,
        activePrefix: '/events',
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

const transportGroups = [
  {
    label: 'Transport',
    items: [
      { to: '/transport', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/transport/routes', label: 'Routes & Stops', icon: MapPinned, activePrefix: '/transport/routes' },
      { to: '/transport/vehicles', label: 'Fleet', icon: Bus, activePrefix: '/transport/vehicles' },
      { to: '/transport/personnel', label: 'Personnel', icon: UserCog, activePrefix: '/transport/personnel' },
    ],
  },
  {
    label: 'Passengers',
    items: [
      { to: '/transport/passengers', label: 'Members', icon: Users, activePrefix: '/transport/passengers' },
      { to: '/transport/applications', label: 'Applications', icon: ClipboardList, activePrefix: '/transport/applications' },
      { to: '/transport/passes', label: 'Passes', icon: BadgeCheck, activePrefix: '/transport/passes' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/transport/trips', label: 'Trips', icon: CalendarDays, activePrefix: '/transport/trips' },
      { to: '/transport/complaints', label: 'Complaints', icon: ClipboardCheck, activePrefix: '/transport/complaints' },
      { to: '/transport/finance', label: 'Fee Status', icon: IndianRupee, activePrefix: '/transport/finance' },
      { to: '/transport/clearance', label: 'No-Due', icon: Shield, activePrefix: '/transport/clearance' },
      { to: '/transport/reports', label: 'Reports', icon: FileStack, activePrefix: '/transport/reports' },
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

const libraryGroups = [
  {
    label: 'Library',
    items: [
      { to: '/library', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/library/circulation', label: 'Circulation Desk', icon: ScanSearch, activePrefix: '/library/circulation' },
      { to: '/library/search', label: 'Catalogue', icon: Library, activePrefix: '/library/search' },
      { to: '/library/reservations', label: 'Reservations', icon: ClipboardList, activePrefix: '/library/reservations' },
      { to: '/library/fines', label: 'Fines', icon: IndianRupee, activePrefix: '/library/fines' },
      { to: '/library/inventory', label: 'Inventory', icon: Warehouse, activePrefix: '/library/inventory' },
      { to: '/library/reports', label: 'Reports', icon: FileStack, activePrefix: '/library/reports' },
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

const EVENTS_APPROVER_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL', 'FACILITIES_OFFICER'];
const EVENTS_RESOURCE_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FACILITIES_OFFICER'];
const EVENTS_REPORT_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HOD', 'PRINCIPAL', 'IQAC_COORDINATOR', 'MANAGEMENT', 'CHAIRMAN'];

const HR_ADMIN_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE'];
const HR_PAYROLL_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HR_MANAGER', 'PAYROLL_OFFICER'];
const HR_REPORT_ROLES = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'HR_MANAGER', 'HR_EXECUTIVE', 'PAYROLL_OFFICER', 'MANAGEMENT', 'CHAIRMAN'];

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
  const isHrAdmin = !!user?.role && HR_ADMIN_ROLES.includes(user.role);
  const isHrPayroll = !!user?.role && HR_PAYROLL_ROLES.includes(user.role);
  const isHrReports = !!user?.role && (HR_REPORT_ROLES.includes(user.role) || isPrincipal);
  const isHrManagerContext = isHrAdmin || isHod || isPrincipal || user?.role === 'MANAGEMENT' || user?.role === 'CHAIRMAN';

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
  const isLibrarian = user?.role === 'LIBRARIAN';
  const inEvents = location.pathname.startsWith('/events');
  const role = user?.role ?? '';
  const eventsGroups = [
    {
      label: 'Events & Resources',
      items: [
        { to: '/events', label: 'Events', icon: CalendarRange, end: true },
        { to: '/events/calendar', label: 'Calendar', icon: CalendarDays },
        { to: '/events/availability', label: 'Find a Venue', icon: MapPinned },
        { to: '/events/bookings', label: 'My Bookings', icon: ClipboardList },
        ...(EVENTS_APPROVER_ROLES.includes(role) ? [{ to: '/events/approvals', label: 'Approvals', icon: ClipboardCheck }] : []),
        ...(EVENTS_RESOURCE_ROLES.includes(role) ? [{ to: '/events/resources', label: 'Resources', icon: Building2 }] : []),
        ...(EVENTS_REPORT_ROLES.includes(role) ? [{ to: '/events/reports', label: 'Reports', icon: FileStack }] : []),
      ],
    },
    {
      label: 'Workspace',
      items: [{ to: '/dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard, end: true }],
    },
    groups[groups.length - 1],
  ];
  const inTransport = location.pathname.startsWith('/transport');
  const inHr = location.pathname.startsWith('/hr');
  const hrGroups = [
    {
      label: 'Employee Self-Service',
      items: [
        { to: '/hr', label: 'My HR', icon: LayoutDashboard, end: true },
        { to: '/hr/profile', label: 'My HR Profile', icon: UserRound },
        { to: '/hr/attendance', label: 'My Attendance', icon: ClipboardCheck, activePrefix: '/hr/attendance' },
        { to: '/hr/leave/apply', label: 'Apply Leave', icon: CalendarDays },
        { to: '/hr/payslips', label: 'My Payslips', icon: IndianRupee },
        { to: '/hr/me/performance', label: 'My Performance', icon: Activity },
        { to: '/hr/learning', label: 'My Learning', icon: GraduationCap, activePrefix: '/hr/learning' },
        { to: '/hr/succession/me', label: 'My Development', icon: Award },
        { to: '/hr/separation', label: 'My Exit', icon: Shield },
      ],
    },
    ...(isHrAdmin
      ? [
          {
            label: 'HR Administration',
            items: [
              { to: '/hr/admin', label: 'HR Dashboard', icon: LayoutDashboard, end: true },
              { to: '/hr/admin/employees', label: 'Employees', icon: Users, activePrefix: '/hr/admin/employees' },
              { to: '/hr/admin/onboarding', label: 'Onboarding', icon: UserCog },
              { to: '/hr/admin/attendance', label: 'Attendance Admin', icon: ClipboardCheck, activePrefix: '/hr/admin/attendance' },
              { to: '/hr/admin/leave', label: 'Leave Queue', icon: CalendarDays },
              { to: '/hr/fnf', label: 'Separation & F&F', icon: Shield, activePrefix: '/hr/fnf' },
            ],
          },
        ]
      : []),
    ...(isHrManagerContext
      ? [
          {
            label: 'Workflows',
            items: [
              { to: '/hr/manager', label: 'Manager Leave', icon: ClipboardList },
              { to: '/hr/performance', label: 'Performance', icon: Activity, activePrefix: '/hr/performance' },
              { to: '/hr/recruitment', label: 'Recruitment', icon: Briefcase, activePrefix: '/hr/recruitment' },
              { to: '/hr/ld', label: 'L&D Admin', icon: GraduationCap, activePrefix: '/hr/ld' },
              { to: '/hr/succession', label: 'Succession', icon: Award, activePrefix: '/hr/succession' },
            ],
          },
        ]
      : []),
    ...(isHrPayroll
      ? [
          {
            label: 'Payroll',
            items: [
              { to: '/hr/payroll', label: 'Payroll Dashboard', icon: IndianRupee, end: true },
              { to: '/hr/payroll/runs', label: 'Payroll Runs', icon: ClipboardList },
              { to: '/hr/payroll/structures', label: 'Salary Structures', icon: FileStack },
              { to: '/hr/payroll/adjustments', label: 'Adjustments', icon: Settings },
              { to: '/hr/payroll/reports', label: 'Payroll Reports', icon: FileStack },
            ],
          },
        ]
      : []),
    ...(isHrReports
      ? [
          {
            label: 'Analytics & Reports',
            items: [
              { to: '/hr/analytics', label: 'HR Analytics', icon: Activity, activePrefix: '/hr/analytics' },
              { to: '/hr/management', label: 'Management View', icon: Building2 },
            ],
          },
        ]
      : []),
    groups[groups.length - 1],
  ];
  const nav = isLibrarian
    ? libraryGroups
    : inTransport
      ? transportGroups
      : inHr
        ? hrGroups
        : inEvents
          ? eventsGroups
          : [...groups.slice(0, -1), ...leadershipGroups, groups[groups.length - 1]];
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
    location.pathname.startsWith('/hr') ||
    location.pathname.startsWith('/events') ||
    location.pathname.includes('/copo/mapping') ||
    (location.pathname.includes('/copo') && location.pathname.includes('/mappings/')) ||
    location.pathname.includes('/copo/subjects');

  return (
    <ProductShell
      groups={nav}
      collapsible
      brandProduct={isLibrarian ? 'Library Portal' : inTransport ? 'Transport Portal' : inHr ? 'HR Portal' : inEvents ? 'Events & Resources' : 'Lecturer LMS'}
      headerRight={
        <div className="flex items-center gap-3 text-xs">
          <span className="hidden sm:inline">{user?.collegeName || 'College workspace'}</span>
          {inHr ? (
            <a className="font-medium text-accent hover:underline" href="/dashboard">Faculty Workspace</a>
          ) : null}
          {user?.portalContexts?.includes('WARDEN') ? (
            <a className="font-medium text-accent hover:underline" href="/hostel" onClick={() => localStorage.setItem('portal_context', 'WARDEN')}>Warden Portal</a>
          ) : null}
        </div>
      }
      contentClassName={cn(wide ? 'max-w-[1400px]' : 'max-w-[1200px]')}
    />
  );
}
