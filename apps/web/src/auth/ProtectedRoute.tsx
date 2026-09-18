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

  if (location.pathname.startsWith('/alumni-admin')) {
    const allowed = ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'PRINCIPAL', 'MANAGEMENT', 'CHAIRMAN', 'ALUMNI_COORDINATOR'];
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
    const alumniAdminPath = location.pathname.startsWith('/alumni-admin');
    const procurementPath = location.pathname.startsWith('/procurement');
    if (!inspect && !hrPath && !platformPath && !labPath && !maintenancePath && !admissionsPath && !alumniAdminPath && !procurementPath) {
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
  if (isStudentUser(user.role, user.kind)) return <Navigate to="/lms" replace />;
  if (isParentUser(user.role, user.kind)) return <Navigate to="/parent" replace />;
  if (isAlumniUser(user.role, user.kind)) return <Navigate to="/alumni" replace />;
  if (user.role === 'SUPER_ADMIN') return <Navigate to="/platform" replace />;
  if (user.role === 'ACCOUNTANT') return <Navigate to="/accountant" replace />;
  if (user.role === 'COE') return <Navigate to="/coe" replace />;
  if (isApplicantUser(user.role, user.kind)) return <Navigate to="/applicant" replace />;
  if (user.role === 'ADMISSIONS_OFFICER' || user.role === 'ADMISSIONS_MANAGER') return <Navigate to="/admissions" replace />;
  if (user.role === 'LAB_ASSISTANT') return <Navigate to="/lab" replace />;
  if (user.role === 'MAINTENANCE_MANAGER' || user.role === 'FACILITIES_OFFICER') return <Navigate to="/maintenance/manager" replace />;
  if (user.role === 'MAINTENANCE_STAFF' || user.role === 'IT_SUPPORT') return <Navigate to="/maintenance/work" replace />;
  if (user.role === 'OFFICE_ADMIN' || user.role === 'OFFICE_SUPERINTENDENT') return <Navigate to="/office" replace />;
  if (user.role === 'GRIEVANCE_OFFICER' || user.role === 'STUDENT_WELFARE_OFFICER') return <Navigate to="/student-services/grievances" replace />;
  return <Navigate to={isAdminRole(user.role) ? '/admin' : '/dashboard'} replace />;
}
