import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { api, listAssignments } from '../lib/api';
import {
  Button,
  ConfirmDangerModal,
  EmptyState,
  FilterChip,
  Input,
  PageHeader,
  Skeleton,
  StatusBadge,
  Surface,
  useToast,
} from '../components/ui';
import { formatDate } from '../lib/utils';
import type { AssignmentListRow } from '../types/assignment';

const STATUS_FILTERS = [
  { id: '', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'DRAFT', label: 'Draft' },
  { id: 'CLOSED', label: 'Closed' },
  { id: 'ARCHIVED', label: 'Archived' },
];

function modulesLabel(row: AssignmentListRow) {
  const ids = row.randomSelection?.moduleIds;
  if (ids?.length && ids.length > 1) return `${ids.length} modules`;
  return row.moduleName || '—';
}

export function AssignmentsPage() {
  useDocumentTitle('My Assignments');
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const navigate = useNavigate();
  const { toast } = useToast();
  const [rows, setRows] = useState<AssignmentListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [menuId, setMenuId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const d = await listAssignments(status || undefined);
      setRows(d.assignments as AssignmentListRow[]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((s) =>
      [s.title, s.courseName, s.moduleName].filter(Boolean).join(' ').toLowerCase().includes(q),
    );
  }, [rows, query]);

  const setStatus = (next: string) => {
    const p = new URLSearchParams(params);
    if (next) p.set('status', next);
    else p.delete('status');
    setParams(p);
  };

  const duplicate = async (id: number) => {
    try {
      const res = await api<{ assignment: { id: number } }>(`/api/assignments/${id}/duplicate`, {
        method: 'POST',
      });
      toast('Assignment duplicated');
      navigate(`/assignments/${res.assignment.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not duplicate', 'error');
    }
  };

  const remove = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api(`/api/assignments/${deleteId}`, { method: 'DELETE' });
      toast('Assignment deleted');
      setDeleteId(null);
      setMenuId(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete assignment', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Assignments"
        subtitle="Create descriptive assignments, share a link, and evaluate written answers."
        actions={
          <div className="flex gap-2">
            <Link to="/assignments/bank">
              <Button variant="secondary">Question Bank</Button>
            </Link>
            <Link to="/assignments/create">
              <Button>
                <Plus size={16} /> Create Assignment
              </Button>
            </Link>
          </div>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
          <Input
            className="pl-9"
            placeholder="Search assignments…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <FilterChip key={f.id} active={status === f.id} onClick={() => setStatus(f.id)}>
              {f.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !filtered.length ? (
        <EmptyState
          icon={<Plus size={22} />}
          title="No assignments yet"
          body="Generate an assignment from the bank by subject and module."
          action={
            <Link to="/assignments/create">
              <Button>
                <Plus size={16} /> Create Assignment
              </Button>
            </Link>
          }
        />
      ) : (
        <Surface className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-[12px] uppercase tracking-wide text-ink-muted">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Subject</th>
                  <th className="px-4 py-3 font-medium">Modules</th>
                  <th className="px-4 py-3 font-medium">Questions</th>
                  <th className="px-4 py-3 font-medium">Total Marks</th>
                  <th className="px-4 py-3 font-medium">Start</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Submissions</th>
                  <th className="px-4 py-3 font-medium">Evaluated</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last Updated</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-surface-muted/60">
                    <td className="px-4 py-3.5">
                      <Link to={`/assignments/${row.id}`} className="font-medium text-ink hover:text-accent">
                        {row.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3.5 text-ink-secondary">{row.courseName || '—'}</td>
                    <td className="px-4 py-3.5 text-ink-muted">{modulesLabel(row)}</td>
                    <td className="px-4 py-3.5 tabular-nums">{row.questionCount ?? 0}</td>
                    <td className="px-4 py-3.5 tabular-nums">{row.totalMarks ?? 0}</td>
                    <td className="px-4 py-3.5 text-ink-muted">
                      {row.startAt ? formatDate(String(row.startAt)) : '—'}
                    </td>
                    <td className="px-4 py-3.5 text-ink-muted">
                      {row.dueAt ? formatDate(String(row.dueAt)) : '—'}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums">{row.submissionCount ?? 0}</td>
                    <td className="px-4 py-3.5 tabular-nums">{row.evaluatedCount ?? 0}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={row.effectiveStatus} />
                    </td>
                    <td className="px-4 py-3.5 text-ink-muted">{formatDate(row.updatedAt)}</td>
                    <td className="relative px-4 py-3.5">
                      <button
                        type="button"
                        className="rounded-[var(--radius-sm)] p-1 text-ink-muted hover:bg-surface-muted"
                        onClick={() => setMenuId(menuId === row.id ? null : row.id)}
                        aria-label="Assignment actions"
                      >
                        <MoreHorizontal size={16} />
                      </button>
                      {menuId === row.id ? (
                        <div className="absolute right-4 z-10 mt-1 w-40 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface py-1 shadow-lg">
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
                            onClick={() => duplicate(row.id)}
                          >
                            Duplicate
                          </button>
                          <Link
                            to={`/assignments/${row.id}?tab=submissions`}
                            className="block px-3 py-2 text-sm hover:bg-surface-muted"
                          >
                            Submissions
                          </Link>
                          <Link
                            to={`/assignments/${row.id}/print`}
                            className="block px-3 py-2 text-sm hover:bg-surface-muted"
                          >
                            Print
                          </Link>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-surface-muted"
                            onClick={async () => {
                              setMenuId(null);
                              try {
                                await api(`/api/assignments/${row.id}/archive`, { method: 'POST' });
                                toast('Assignment archived');
                                await load();
                              } catch (e) {
                                toast(e instanceof Error ? e.message : 'Could not archive', 'error');
                              }
                            }}
                          >
                            Archive
                          </button>
                          <button
                            type="button"
                            className="block w-full px-3 py-2 text-left text-sm text-danger hover:bg-danger-soft"
                            onClick={() => {
                              setMenuId(null);
                              setDeleteId(row.id);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}
      <ConfirmDangerModal
        open={deleteId != null}
        title="Delete this assignment?"
        description="This removes the assignment from your list. Assignments with student submissions cannot be deleted — archive them instead."
        confirmLabel="Delete Assignment"
        loading={deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          void remove();
        }}
      />
    </div>
  );
}
