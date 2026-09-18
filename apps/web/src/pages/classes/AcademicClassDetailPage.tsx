import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../lib/api';
import {
  Badge,
  Button,
  Field,
  Input,
  PageHeader,
  Select,
  Surface,
  Tabs,
  Textarea,
  useToast,
} from '../../components/ui';
import { statusTone } from '../../lib/utils';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { ClassCoordinatorBanner } from '../../components/ClassCoordinatorBanner';

type ClassDetail = {
  class: {
    id: number;
    displayName: string;
    academicYearLabel: string;
    collegeName: string;
    studentCount: number;
    pendingCount: number;
    subjectCount: number;
    facultyCount: number;
    coordinatorName?: string | null;
  };
  access: { view: boolean; manage: boolean; approve: boolean; share: boolean };
  subjects: Array<{
    id: number;
    courseId: number;
    code: string;
    name: string;
    kind: string;
    faculty: Array<{ facultyId: number; name: string }>;
  }>;
  share: { code: string; url: string; isActive: boolean } | null;
  announcements: Array<{ id: number; title: string; body?: string | null; scope: string }>;
};

type Enrollment = {
  id: number;
  usn: string;
  name: string;
  email: string;
  status: string;
};

type Lookups = { faculty: Array<{ id: number; name: string }> };

export function AcademicClassDetailPage() {
  const { id } = useParams();
  const classId = Number(id);
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState<ClassDetail | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [filter, setFilter] = useState('PENDING');
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [announce, setAnnounce] = useState({ title: '', body: '' });
  const [facultyPick, setFacultyPick] = useState<Record<number, string>>({});

  const load = async () => {
    const detail = await api<ClassDetail>(`/api/classes/${classId}`);
    setData(detail);
    const list = await api<{ enrollments: Enrollment[] }>(`/api/classes/${classId}/enrollments`);
    setEnrollments(list.enrollments);
  };

  useEffect(() => {
    if (!Number.isFinite(classId)) return;
    load().catch((e) => toast(e instanceof Error ? e.message : 'Failed to load', 'error'));
    api<Lookups>('/api/meta/lookups').then(setLookups).catch(() => undefined);
  }, [classId]);

  useDocumentTitle(data?.class.displayName || 'Class');

  const filtered = useMemo(
    () => (filter === 'ALL' ? enrollments : enrollments.filter((e) => e.status === filter)),
    [enrollments, filter],
  );

  if (!data) return <p className="text-sm text-ink-muted">Loading class…</p>;
  const c = data.class;

  const act = async (path: string, body?: unknown) => {
    await api(path, { method: 'POST', body: body ? JSON.stringify(body) : '{}' });
    await load();
    setSelected([]);
  };

  const postAnnouncement = async (e: FormEvent) => {
    e.preventDefault();
    await api(`/api/classes/${classId}/announcements`, { method: 'POST', body: JSON.stringify(announce) });
    setAnnounce({ title: '', body: '' });
    await load();
    toast('Announcement posted');
  };

  const assign = async (subjectId: number) => {
    const facultyId = Number(facultyPick[subjectId]);
    if (!facultyId) return;
    await api(`/api/classes/${classId}/subjects/${subjectId}/faculty`, {
      method: 'POST',
      body: JSON.stringify({ facultyId }),
    });
    await load();
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={c.displayName}
        subtitle={`${c.collegeName} · ${c.academicYearLabel}`}
      />

      <ClassCoordinatorBanner classId={classId} />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'students', label: `Students${c.pendingCount ? ` (${c.pendingCount})` : ''}` },
          { id: 'subjects', label: 'Subjects' },
          { id: 'announcements', label: 'Announcements' },
          { id: 'share', label: 'Share LMS' },
        ]}
      />

      {tab === 'overview' ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Students</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{c.studentCount}</p>
          </Surface>
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Subjects</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{c.subjectCount}</p>
          </Surface>
          <Surface>
            <p className="text-xs uppercase text-ink-muted">Faculty</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{c.facultyCount}</p>
          </Surface>
        </div>
      ) : null}

      {tab === 'students' ? (
        <div className="mt-5">
          <div className="mb-3 flex flex-wrap gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((s) => (
              <Button key={s} size="sm" variant={filter === s ? 'primary' : 'secondary'} onClick={() => setFilter(s)}>
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </Button>
            ))}
            {data.access.approve ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelected(filtered.map((e) => e.id))}
                >
                  Select all
                </Button>
                <Button
                  size="sm"
                  disabled={!selected.length}
                  onClick={() => act(`/api/classes/${classId}/enrollments/approve-bulk`, { enrollmentIds: selected })}
                >
                  Approve selected
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => act(`/api/classes/${classId}/enrollments/approve-bulk`, { allEligible: true })}
                >
                  Approve all eligible
                </Button>
              </>
            ) : null}
          </div>
          <Surface padded={false}>
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[12px] uppercase tracking-wide text-ink-muted">
                  {data.access.approve ? <th className="px-4 py-3"> </th> : null}
                  <th className="px-5 py-3 font-medium">USN</th>
                  <th className="px-5 py-3 font-medium">Name</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  {data.access.approve ? <th className="px-5 py-3 font-medium">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className="border-b border-border last:border-0">
                    {data.access.approve ? (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.includes(e.id)}
                          onChange={(ev) =>
                            setSelected((prev) => (ev.target.checked ? [...prev, e.id] : prev.filter((id) => id !== e.id)))
                          }
                        />
                      </td>
                    ) : null}
                    <td className="px-5 py-3 font-medium">{e.usn}</td>
                    <td className="px-5 py-3">{e.name}</td>
                    <td className="px-5 py-3">
                      <Badge className={statusTone(e.status)}>{e.status}</Badge>
                    </td>
                    {data.access.approve && e.status === 'PENDING' ? (
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => act(`/api/classes/${classId}/enrollments/${e.id}/approve`)}>
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="danger-soft"
                            onClick={() => act(`/api/classes/${classId}/enrollments/${e.id}/reject`)}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    ) : data.access.approve ? (
                      <td className="px-5 py-3 text-ink-muted">—</td>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </table>
            {!filtered.length ? <p className="px-5 py-6 text-sm text-ink-muted">No students in this list.</p> : null}
          </Surface>
          <p className="mt-3 text-xs text-ink-muted">
            Approval is class-level. One approval activates every subject mapped to this class.
          </p>
        </div>
      ) : null}

      {tab === 'subjects' ? (
        <Surface padded={false} className="mt-5">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-[12px] uppercase tracking-wide text-ink-muted">
                <th className="px-5 py-3 font-medium">Subject</th>
                <th className="px-5 py-3 font-medium">Faculty</th>
                {data.access.manage ? <th className="px-5 py-3 font-medium">Assign</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.subjects.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3">
                    <Link className="font-medium text-accent" to={`/courses/${s.courseId}`}>
                      {s.name}
                    </Link>
                    <p className="text-xs text-ink-muted">
                      {s.code} · {s.kind}
                    </p>
                  </td>
                  <td className="px-5 py-3">{s.faculty.map((f) => f.name).join(', ') || 'Unassigned'}</td>
                  {data.access.manage ? (
                    <td className="px-5 py-3">
                      <div className="flex gap-2">
                        <Select
                          value={facultyPick[s.id] || ''}
                          onChange={(e) => setFacultyPick({ ...facultyPick, [s.id]: e.target.value })}
                        >
                          <option value="">Faculty</option>
                          {(lookups?.faculty || []).map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </Select>
                        <Button size="sm" onClick={() => assign(s.id)}>
                          Save
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </Surface>
      ) : null}

      {tab === 'announcements' ? (
        <div className="mt-5 space-y-4">
          {data.access.share || data.access.manage ? (
            <form onSubmit={postAnnouncement} className="space-y-3">
              <Field label="Class announcement">
                <Input value={announce.title} onChange={(e) => setAnnounce({ ...announce, title: e.target.value })} required />
              </Field>
              <Textarea value={announce.body} onChange={(e) => setAnnounce({ ...announce, body: e.target.value })} />
              <Button type="submit">Post to class</Button>
            </form>
          ) : null}
          <Surface padded={false}>
            {data.announcements.map((a) => (
              <div key={a.id} className="border-b border-border px-5 py-4 last:border-0">
                <p className="text-xs uppercase text-ink-muted">{a.scope}</p>
                <p className="font-medium">{a.title}</p>
                {a.body ? <p className="text-sm text-ink-muted">{a.body}</p> : null}
              </div>
            ))}
          </Surface>
        </div>
      ) : null}

      {tab === 'share' ? (
        <Surface className="mt-5">
          {data.share?.isActive ? (
            <div className="flex flex-wrap items-start gap-8">
              <div>
                <p className="text-sm text-ink-muted">Share this class LMS — not a single subject.</p>
                <p className="mt-2 font-mono text-sm">{data.share.url}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(data.share!.url);
                      toast('Class link copied');
                    }}
                  >
                    Copy link
                  </Button>
                  {data.access.share ? (
                    <>
                      <Button variant="secondary" onClick={() => act(`/api/classes/${classId}/share/disable`)}>
                        Disable link
                      </Button>
                      <Button variant="secondary" onClick={() => act(`/api/classes/${classId}/share/regenerate`)}>
                        Regenerate
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
              <QRCodeSVG value={data.share.url} size={160} level="H" marginSize={1} />
            </div>
          ) : (
            <div>
              <p className="text-sm text-ink-muted">The class join link is disabled.</p>
              {data.access.share ? (
                <Button className="mt-3" onClick={() => act(`/api/classes/${classId}/share/regenerate`)}>
                  Generate link
                </Button>
              ) : null}
            </div>
          )}
        </Surface>
      ) : null}
    </div>
  );
}
