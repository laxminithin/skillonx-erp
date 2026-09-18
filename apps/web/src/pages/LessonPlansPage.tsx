import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Plus, Trash2 } from 'lucide-react';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { api } from '../lib/api';
import { Button, ConfirmDangerModal, EmptyState, PageHeader, Skeleton, StatusBadge, Surface, useToast } from '../components/ui';
import { formatISODate } from '../lib/utils';

type TodayLesson = {
  entryId: number;
  planId: number;
  courseName: string;
  sectionLabel?: string;
  moduleLabel?: string;
  moduleName?: string;
  topicName: string;
  subtopicName?: string;
  hours: number;
  startTime?: string | null;
  endTime?: string | null;
};

type PlanRow = {
  id: number;
  courseName: string;
  sectionLabel?: string;
  academicYearLabel?: string;
  semesterLabel?: string;
  status: string;
  updatedAt: string;
  progress: {
    hoursPercent: number;
    completedHours: number;
    totalHours: number;
    completedUnits: number;
    totalUnits: number;
  };
};

export function LessonPlansPage() {
  useDocumentTitle('My Lesson Plans');
  const { toast } = useToast();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [today, setToday] = useState<TodayLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [p, t] = await Promise.all([
        api<{ plans: PlanRow[] }>('/api/lesson-plans'),
        api<{ lessons: TodayLesson[] }>('/api/lesson-plans/today'),
      ]);
      setPlans(p.plans);
      setToday(t.lessons);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load lesson plans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const complete = async (lesson: TodayLesson) => {
    try {
      await api(`/api/lesson-plans/${lesson.planId}/entries/${lesson.entryId}/complete`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      toast('Lesson marked completed');
      load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not complete', 'error');
    }
  };

  const remove = async () => {
    if (deleteId == null) return;
    setDeleting(true);
    try {
      await api(`/api/lesson-plans/${deleteId}`, { method: 'DELETE' });
      toast('Lesson plan deleted');
      setDeleteId(null);
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete lesson plan', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const active = useMemo(() => plans.filter((p) => p.status !== 'ARCHIVED'), [plans]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="My Lesson Plans"
        subtitle="Generate the semester plan from imported academic content, then teach from it."
        actions={
          <Link to="/lesson-plans/create">
            <Button>
              <Plus size={16} />
              Create Lesson Plan
            </Button>
          </Link>
        }
      />

      {today.length ? (
        <Surface className="mb-6">
          <h2 className="text-sm font-semibold text-ink">Today’s lessons</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {today.map((lesson) => (
              <div key={lesson.entryId} className="rounded-[var(--radius-md)] border border-border px-4 py-3">
                <p className="text-sm font-medium text-ink">
                  {lesson.courseName}
                  {lesson.sectionLabel ? ` · ${lesson.sectionLabel}` : ''}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {lesson.moduleLabel} {lesson.moduleName}
                </p>
                <p className="mt-1 text-sm text-ink">{lesson.topicName}</p>
                {lesson.subtopicName ? (
                  <p className="mt-0.5 line-clamp-2 text-xs text-ink-secondary">{lesson.subtopicName}</p>
                ) : null}
                <p className="mt-2 text-xs text-ink-muted">
                  {lesson.startTime && lesson.endTime ? `${lesson.startTime}–${lesson.endTime} · ` : ''}
                  {lesson.hours} hour{lesson.hours === 1 ? '' : 's'}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => complete(lesson)}>
                    Mark Completed
                  </Button>
                  <Link to={`/lesson-plans/${lesson.planId}`}>
                    <Button size="sm" variant="secondary">
                      Open
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !active.length ? (
        <EmptyState
          icon={<BookOpen size={22} />}
          title="No lesson plans yet"
          body="Create a plan, choose a subject, and the system will schedule the imported topics for you."
          action={
            <Link to="/lesson-plans/create">
              <Button>
                <Plus size={16} /> Create Lesson Plan
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {active.map((plan) => (
            <Surface key={plan.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-ink">{plan.courseName}</p>
                <p className="mt-1 text-xs text-ink-muted">
                  {plan.semesterLabel ? `${plan.semesterLabel} Sem` : ''}
                  {plan.sectionLabel ? ` · ${plan.sectionLabel}` : ''}
                  {plan.academicYearLabel ? ` · ${plan.academicYearLabel}` : ''}
                </p>
                <p className="mt-2 text-sm tabular-nums text-ink">
                  {plan.progress.completedHours} / {plan.progress.totalHours} Hours
                  <span className="ml-2 text-ink-muted">{plan.progress.hoursPercent}%</span>
                </p>
                <p className="text-[11px] text-ink-muted">Updated {formatISODate(plan.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={plan.status} />
                <Link to={`/lesson-plans/${plan.id}`}>
                  <Button variant="secondary">Open</Button>
                </Link>
                <Button variant="danger-soft" size="sm" onClick={() => setDeleteId(plan.id)}>
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
            </Surface>
          ))}
        </div>
      )}
      <ConfirmDangerModal
        open={deleteId != null}
        title="Delete this lesson plan?"
        description="This permanently removes the lesson plan and its scheduled topics. This cannot be undone."
        confirmLabel="Delete Lesson Plan"
        loading={deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          void remove();
        }}
      />
    </div>
  );
}
