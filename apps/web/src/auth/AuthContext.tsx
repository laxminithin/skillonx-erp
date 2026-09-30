import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, setToken } from '../lib/api';

export type User = {
  id: number;
  kind?: 'faculty' | 'student' | 'applicant' | 'parent' | 'alumni';
  name: string;
  email: string;
  usn?: string;
  role: string;
  roleLabel?: string;
  isActive?: boolean;
  collegeId: number;
  departmentId: number | null;
  collegeName?: string;
  collegeCode?: string;
  departmentName?: string;
  departmentCode?: string;
  programName?: string;
  semesterLabel?: string;
  sectionLabel?: string;
  academicYearLabel?: string;
  schemeName?: string;
  profileComplete?: boolean;
  permissions?: Record<string, boolean>;
  employeeId?: string | null;
  designation?: string | null;
  phone?: string | null;
  timezone?: string;
  lastLoginAt?: string | null;
  lastPasswordChangeAt?: string | null;
  createdAt?: string | null;
  leadership?: {
    isHod?: boolean;
    isPrincipal?: boolean;
    hodDepartmentIds?: number[];
    roles?: string[];
    capabilities?: string[];
    employeeId?: number | null;
  } | null;
  tp?: {
    roles?: string[];
    departmentIds?: number[];
    employeeId?: number | null;
  } | null;
  portalContexts?: string[];
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  applySession: (token: string, user: User) => void;
  logout: () => void;
  refresh: () => Promise<void>;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function tokenKind(token: string): 'student' | 'faculty' | 'applicant' | 'parent' | 'alumni' {
  try {
    const [, payload] = token.split('.');
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (json.kind === 'student') return 'student';
    if (json.kind === 'applicant') return 'applicant';
    if (json.kind === 'parent') return 'parent';
    if (json.kind === 'alumni') return 'alumni';
    return 'faculty';
  } catch {
    return 'faculty';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const token = localStorage.getItem('survey_token');
    if (!token) {
      setUser(null);
      return;
    }
    try {
      const kind = tokenKind(token);
      const path =
        kind === 'student'
          ? '/api/student-auth/me'
          : kind === 'applicant'
            ? '/api/admissions/portal/me'
            : kind === 'parent'
              ? '/api/parent-auth/me'
              : kind === 'alumni'
                ? '/api/alumni-auth/me'
                : '/api/auth/me';
      const data = await api<{ user: User }>(path);
      setUser(data.user);
    } catch {
      setToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('survey_token');
    if (!token) {
      setLoading(false);
      return;
    }
    refresh().finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    localStorage.removeItem('portal_context');
    const data = await api<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      auth: false,
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const applySession = (token: string, next: User) => {
    localStorage.removeItem('portal_context');
    setToken(token);
    setUser(next);
  };

  const logout = () => {
    localStorage.removeItem('portal_context');
    setToken(null);
    setUser(null);
  };

  const updateUser = (next: User) => setUser(next);

  return (
    <AuthContext.Provider value={{ user, loading, login, applySession, logout, refresh, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
