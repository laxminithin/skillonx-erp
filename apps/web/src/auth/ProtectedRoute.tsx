import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { isAdminRole } from '../components/Brand';

export function isStudentUser(role?: string | null, kind?: string | null) {
  return kind === 'student' || role === 'STUDENT';
}

function isApplicantUser(role?: string | null, kind?: string | null) {
  return kind === 'applicant' || role === 'APPLICANT';
}

function isParentUser(role?: string | null, kind?: string | null) {
  return kind === 'parent' || role === 'PARENT';
}

function isAlumniUser(role?: string | null, kind?: string | null) {
  return kind === 'alumni' || role === 'ALUMNI';
}

function isTransportRole(role?: string | null) {
  return ['TRANSPORT_ADMIN', 'TRANSPORT_OFFICER', 'TRANSPORT_COORDINATOR', 'TRANSPORT_OPERATIONS', 'DRIVER', 'CONDUCTOR'].includes(role ?? '');
}

// Single source of truth for "where does this user land after auth" — used by
// both HomeRedirect (root `/`) and LoginPage (post sign-in). Keeping this in
// one place avoids the two call sites drifting out of sync with each other.
export function landingPathForUser(user: { role?: string | null; kind?: string | null }) {
  if (isStudentUser(user.role, user.kind)) return '/lms';
  if (isParentUser(user.role, user.kind)) return '/parent';
  if (isAlumniUser(user.role, user.kind)) return '/alumni';
  if (user.role === 'SUPER_ADMIN') return '/platform';
  if (user.role === 'ACCOUNTANT') return '/accountant';
  if (user.role === 'COE') return '/coe';
  if (isApplicantUser(user.role, user.kind)) return '/applicant';
  if (user.role === 'ADMISSIONS_OFFICER' || user.role === 'ADMISSIONS_MANAGER') return '/admissions';
  if (user.role === 'LAB_ASSISTANT') return '/lab';
  if (user.role === 'HR_MANAGER' || user.role === 'HR_EXECUTIVE') return '/hr/admin';
  if (user.role === 'PAYROLL_OFFICER') return '/hr/payroll';
  if (['WARDEN', 'CHIEF_WARDEN', 'ASSISTANT_WARDEN', 'MESS_MANAGER', 'SECURITY'].includes(user.role ?? '')) return '/hostel';
  if (user.role === 'MAINTENANCE_MANAGER' || user.role === 'FACILITIES_OFFICER') return '/maintenance/manager';
  if (user.role === 'MAINTENANCE_STAFF' || user.role === 'IT_SUPPORT') return '/maintenance/work';
  if (user.role === 'LIBRARIAN') return '/library';
  if (user.role === 'OFFICE_ADMIN' || user.role === 'OFFICE_SUPERINTENDENT') return '/office';
  if (user.role === 'GRIEVANCE_OFFICER' || user.role === 'STUDENT_WELFARE_OFFICER') return '/student-services/grievances';
  if (isTransportRole(user.role)) return '/transport';
  return isAdminRole(user.role) ? '/admin' : '/dashboard';
}

export function ProtectedRoute({ adminOnly = false, studentOnly = false, applicantOnly = false, parentOnly = false, alumniOnly = false }: { adminOnly?: boolean; studentOnly?: boolean; applicantOnly?: boolean; parentOnly?: boolean; alumniOnly?: boolean }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">Loading…</div>
    );
  }

  if (!user) {
    if (applicantOnly) {
      return <Navigate to="/applicant/login" replace state={{ from: location }} />;
    }
    if (studentOnly) {
      return <Navigate to="/lms/login" replace state={{ from: location }} />;
    }
    if (parentOnly) {
      return <Navigate to="/parent/login" replace state={{ from: location }} />;
    }
    if (alumniOnly) {
      return <Navigate to="/alumni/login" replace state={{ from: location }} />;
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (isApplicantUser(user.role, user.kind)) {
    if (applicantOnly || location.pathname.startsWith('/applicant')) return <Outlet />;
    return <Navigate to="/applicant" replace />;
  }

  if (applicantOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isParentUser(user.role, user.kind)) {
    if (parentOnly || location.pathname.startsWith('/parent')) return <Outlet />;
    return <Navigate to="/parent" replace />;
  }

  if (parentOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isAlumniUser(user.role, user.kind)) {
    if (alumniOnly || location.pathname.startsWith('/alumni')) return <Outlet />;
    return <Navigate to="/alumni" replace />;
  }

  if (alumniOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isStudentUser(user.role, user.kind)) {
    if (studentOnly || location.pathname.startsWith('/lms')) return <Outlet />;
    return <Navigate to="/lms" replace />;
  }

  if (studentOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname.startsWith('/hostel')) {
    const hostelRole = ['WARDEN', 'CHIEF_WARDEN', 'ASSISTANT_WARDEN', 'MESS_MANAGER', 'SECURITY'].includes(user.role);
    const assignedContext = user.portalContexts?.includes('WARDEN') && localStorage.getItem('portal_context') === 'WARDEN';
    const oversightRole = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN'].includes(user.role);
    if (!hostelRole && !assignedContext && !oversightRole) return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname.startsWith('/transport')) {
    const oversightRole = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN'].includes(user.role);
    if (!isTransportRole(user.role) && !oversightRole) return <Navigate to="/dashboard" replace />;
  }

  if (location.pathname.startsWith('/accountant') && user.role !== 'ACCOUNTANT') {
    return <Navigate to={isAdminRole(user.role) ? '/admin' : '/dashboard'} replace />;
  }

  if (location.pathname.startsWith('/coe') && user.role !== 'COE') {
    return <Navigate to={isAdminRole(user.role) ? '/admin' : '/dashboard'} replace />;
  }

  if (location.pathname.startsWith('/office')) {
    const allowed = ['OFFICE_ADMIN', 'OFFICE_SUPERINTENDENT', 'PRINCIPAL', 'MANAGEMENT', 'HOD', 'COLLEGE_ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(user.role)) return <Navigate to={isAdminRole(user.role) ? '/admin' : '/dashboard'} replace />;
  }

  if (location.pathname.startsWith('/admissions')) {
    const allowed = ['ADMISSIONS_OFFICER', 'ADMISSIONS_MANAGER', 'HOD', 'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'SUPER_ADMIN', 'COLLEGE_ADMIN'];
    if (!allowed.includes(user.role)) return <Navigate to={isAdminRole(user.role) ? '/admin' : '/dashboard'} replace />;
  }

  if (['WARDEN', 'CHIEF_WARDEN', 'ASSISTANT_WARDEN', 'MESS_MANAGER', 'SECURITY'].includes(user.role)) {
    const allowedPath =
      location.pathname.startsWith('/hostel') ||
      location.pathname.startsWith('/profile') ||
      location.pathname.startsWith('/settings');
    if (!allowedPath) return <Navigate to="/hostel" replace />;
  }

  if (isTransportRole(user.role)) {
    const allowedPath =
      location.pathname.startsWith('/transport') ||
      location.pathname.startsWith('/profile') ||
      location.pathname.startsWith('/settings');
    if (!allowedPath) return <Navigate to="/transport" replace />;
  }

  if (user.role === 'LIBRARIAN') {
    const allowedPath =
      location.pathname.startsWith('/library') ||
      location.pathname.startsWith('/profile') ||
      location.pathname.startsWith('/settings');
    if (!allowedPath) return <Navigate to="/library" replace />;
  }

  if (location.pathname.startsWith('/alumni-admin')) {
    const allowed = [
      'SUPER_ADMIN',
      'COLLEGE_ADMIN',
      'PRINCIPAL',
      'MANAGEMENT',
      'CHAIRMAN',
      'ALUMNI_COORDINATOR',
      'VICE_PRINCIPAL',
      'DEAN',
      'HOD',
      'FACULTY',
      'TNP_OFFICER',
      'PLACEMENT_OFFICER',
      'TRAINING_PLACEMENT',
      'TPO',
    ];
    if (!allowed.includes(user.role)) return <Navigate to={isAdminRole(user.role) ? '/admin' : '/dashboard'} replace />;
  }

  if (location.pathname.startsWith('/iqac')) {
    const allowed = ['IQAC_COORDINATOR', 'NBA_COORDINATOR', 'HOD', 'FACULTY', 'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'];
    if (!allowed.includes(user.role)) return <Navigate to={isAdminRole(user.role) ? '/admin' : '/dashboard'} replace />;
  }

  if (location.pathname.startsWith('/finance')) {
    if (user.role === 'ACCOUNTANT') return <Navigate to={location.pathname.replace(/^\/finance/, '/accountant')} replace />;
    if (!isAdminRole(user.role)) return <Navigate to="/dashboard" replace />;
  }

  if (adminOnly && !isAdminRole(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!adminOnly && isAdminRole(user.role) && !location.pathname.startsWith('/admin')) {
    const inspect =
      /^\/surveys\/\d+/.test(location.pathname) ||
      /^\/lesson-plans\/\d+/.test(location.pathname) ||
      /^\/copo\/reports\/\d+\/print/.test(location.pathname);
    const hrPath = location.pathname.startsWith('/hr');
    const platformPath = location.pathname.startsWith('/platform');
    const labPath = location.pathname.startsWith('/lab');
    const maintenancePath = location.pathname.startsWith('/maintenance');
    const admissionsPath = location.pathname.startsWith('/admissions');
    const hostelPath = location.pathname.startsWith('/hostel');
    const alumniAdminPath = location.pathname.startsWith('/alumni-admin');
    const procurementPath = location.pathname.startsWith('/procurement');
    const transportPath = location.pathname.startsWith('/transport');
    const iqacPath = location.pathname.startsWith('/iqac');
    const eventsPath = location.pathname.startsWith('/events');
    const financePath = location.pathname.startsWith('/finance');
    if (!inspect && !hrPath && !platformPath && !labPath && !maintenancePath && !admissionsPath && !hostelPath && !alumniAdminPath && !procurementPath && !transportPath && !iqacPath && !eventsPath && !financePath) {
      return <Navigate to={user.role === 'SUPER_ADMIN' ? '/platform' : '/admin'} replace />;
    }
  }

  return <Outlet />;
}

export function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-ink-muted">Loading…</div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={landingPathForUser(user)} replace />;
}
