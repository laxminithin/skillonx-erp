const API_URL = import.meta.env.VITE_API_URL || '';

export type ApiError = { error: string; details?: unknown };

function getToken() {
  return localStorage.getItem('survey_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('survey_token', token);
  else localStorage.removeItem('survey_token');
}

export async function api<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {},
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const h = new Headers(headers);
  if (!h.has('Content-Type') && rest.body) h.set('Content-Type', 'application/json');
  if (auth) {
    const token = getToken();
    if (token) h.set('Authorization', `Bearer ${token}`);
    const portalContext = localStorage.getItem('portal_context');
    if (portalContext) h.set('X-Portal-Context', portalContext);
  }

  const res = await fetch(`${API_URL}${path}`, { ...rest, headers: h });
  if (!res.ok) {
    let payload: ApiError = { error: res.statusText };
    try {
      payload = await res.json();
    } catch {
      /* ignore */
    }
    // A 401 on an authenticated request means the session has expired or the
    // token is invalid. Clear it and bounce to the login screen instead of
    // surfacing raw 401 errors across the app.
    if (res.status === 401 && auth) {
      setToken(null);
      const onAuthPage =
        window.location.pathname.startsWith('/login') ||
        window.location.pathname.startsWith('/forgot-password') ||
        window.location.pathname.startsWith('/lms/login') ||
        window.location.pathname.startsWith('/alumni/login') ||
        window.location.pathname.startsWith('/parent/login') ||
        window.location.pathname.startsWith('/join/');
      if (!onAuthPage) {
        const student = window.location.pathname.startsWith('/lms');
        const parent = window.location.pathname.startsWith('/parent');
        const alumni = window.location.pathname.startsWith('/alumni');
        window.location.assign(student ? '/lms/login?expired=1' : parent ? '/parent/login?expired=1' : alumni ? '/alumni/login?expired=1' : '/login?expired=1');
      }
    }
    throw Object.assign(new Error(payload.error || 'Request failed'), {
      status: res.status,
      code: (payload as { code?: string }).code,
      details: payload.details,
    });
  }

  if (res.status === 204) return undefined as T;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return res.json();
  return res as unknown as T;
}

function filenameFromDisposition(header: string | null): string | null {
  if (!header) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const quoted = /filename="?([^";]+)"?/i.exec(header);
  return quoted?.[1] ?? null;
}

export async function downloadExport(surveyId: number, format: 'csv' | 'xlsx') {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/surveys/${surveyId}/export?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Prefer the server's professional filename; fall back to a sane default.
  a.download =
    filenameFromDisposition(res.headers.get('Content-Disposition')) ??
    `survey-${surveyId}-responses.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadLessonPlanExport(planId: number) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/lesson-plans/${planId}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filenameFromDisposition(res.headers.get('Content-Disposition')) ?? `lesson-plan-${planId}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadQuizExport(quizId: number, format: 'csv' | 'xlsx') {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/quizzes/${quizId}/export?format=${format}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filenameFromDisposition(res.headers.get('Content-Disposition')) ??
    `quiz-${quizId}-results.${format}`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadAssignmentExport(assignmentId: number) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/assignments/${assignmentId}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filenameFromDisposition(res.headers.get('Content-Disposition')) ??
    `assignment-${assignmentId}-results.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadTimetableExport(kind: 'class' | 'faculty' | 'room', id: number) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/timetable/export?kind=${kind}&id=${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filenameFromDisposition(res.headers.get('Content-Disposition')) ?? `${kind}-timetable.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadAttendanceCsv(courseId: number, classId: number) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/attendance/courses/${courseId}/classes/${classId}/analytics.csv`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download =
    filenameFromDisposition(res.headers.get('Content-Disposition')) ?? `attendance-${courseId}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Faculty assignment helpers (mirror quiz helpers). */
export function listAssignments(status?: string) {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  return api<{ assignments: unknown[] }>(`/api/assignments${qs}`);
}

export function createAssignment(body: unknown) {
  return api<{ assignment: { id: number } }>('/api/assignments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function generateAssignment(body: unknown) {
  return api<{ assignment: { id: number } }>('/api/assignments/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getAssignment(id: number | string) {
  return api<{ assignment: unknown }>(`/api/assignments/${id}`);
}

export function getAssignmentPrintModel(id: number | string) {
  return api<{ printModel: unknown }>(`/api/assignments/${id}/print-model`);
}

/** Public student assignment helpers. */
export function getPublicAssignment(code: string) {
  return api<unknown>(`/api/public/a/${encodeURIComponent(code)}`, { auth: false });
}

export function startPublicAssignment(code: string, identity: { name: string; email: string; usn: string }) {
  return api<unknown>(`/api/public/a/${encodeURIComponent(code)}/start`, {
    method: 'POST',
    auth: false,
    body: JSON.stringify(identity),
  });
}

export function savePublicAssignmentAnswers(
  code: string,
  submissionToken: string,
  answers: Array<{ questionId: number; textAnswer: string }>,
) {
  return api(`/api/public/a/${encodeURIComponent(code)}/answers`, {
    method: 'PATCH',
    auth: false,
    body: JSON.stringify({ submissionToken, answers }),
  });
}

export function submitPublicAssignment(
  code: string,
  submissionToken: string,
  answers: Array<{ questionId: number; textAnswer: string }>,
) {
  return api<unknown>(`/api/public/a/${encodeURIComponent(code)}/submit`, {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ submissionToken, answers }),
  });
}

export function getPublicAssignmentSubmission(code: string, token: string) {
  return api<unknown>(
    `/api/public/a/${encodeURIComponent(code)}/submission/${encodeURIComponent(token)}`,
    { auth: false },
  );
}

export async function downloadCopoExport(path: string, fallback: string) {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Export failed');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filenameFromDisposition(res.headers.get('Content-Disposition')) ?? fallback;
  a.click();
  URL.revokeObjectURL(url);
}
