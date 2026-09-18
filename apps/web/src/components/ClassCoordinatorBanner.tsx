import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCog } from 'lucide-react';
import { api } from '../lib/api';

type CoordinatorInfo = {
  classId: number;
  isCoordinator: boolean;
  coordinator: {
    facultyId: number;
    name: string | null;
    department: string | null;
    email: string | null;
    phone: string | null;
  } | null;
};

/**
 * Reusable "Class Coordinator: <name>" banner (spec §3). Reads the authoritative
 * coordinator assignment for the class context — never hardcoded — and, when the
 * viewer is the coordinator, links to their workspace.
 */
export function ClassCoordinatorBanner({ classId }: { classId: number | null | undefined }) {
  const [info, setInfo] = useState<CoordinatorInfo | null>(null);

  useEffect(() => {
    if (!classId) return;
    let alive = true;
    api<CoordinatorInfo>(`/api/classes/${classId}/coordinator-info`)
      .then((d) => { if (alive) setInfo(d); })
      .catch(() => { if (alive) setInfo(null); });
    return () => { alive = false; };
  }, [classId]);

  if (!classId || !info?.coordinator) return null;
  const c = info.coordinator;
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface-muted/50 px-4 py-2.5 text-sm">
      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <UserCog className="h-4 w-4 text-accent" aria-hidden />
        <span className="font-medium text-ink">Class Coordinator: {c.name ?? '—'}</span>
        {c.department ? <span className="text-ink-muted">· {c.department}</span> : null}
        {c.email ? <span className="text-ink-muted">· {c.email}</span> : null}
        {c.phone ? <span className="text-ink-muted">· {c.phone}</span> : null}
      </span>
      {info.isCoordinator ? (
        <Link to="/coordinator" className="text-accent hover:underline">Coordinator workspace →</Link>
      ) : null}
    </div>
  );
}
