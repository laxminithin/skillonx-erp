import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { StatusPill } from '../lms/studentUi';
import { Surface } from '../../components/ui';

export type FacultyRef = { facultyId: number; name: string; isPrimary: boolean };

export type Occurrence = {
  id: string;
  date: string;
  dayOfWeek: number;
  dayLabel: string;
  state: string;
  holidayLabel: string | null;
  slotId: number | null;
  overrideId: number | null;
  academicClassId: number;
  className: string;
  classCode: string;
  classSubjectId: number | null;
  courseId: number | null;
  courseCode: string | null;
  courseName: string | null;
  faculty: FacultyRef[];
  roomId: number | null;
  roomName: string | null;
  startPeriodNumber: number | null;
  endPeriodNumber: number | null;
  startTime: string;
  endTime: string;
  reason: string | null;
  attendanceExpected: boolean;
  attendanceSessionId: number | null;
  attendanceStatus: string;
  plannedTopic: { entryId: number; topicId: number | null; topicName: string } | null;
  isSubstitution?: boolean;
  coveringForFacultyName?: string | null;
};

export type Period = {
  id: number;
  name: string;
  periodNumber: number | null;
  startTime: string;
  endTime: string;
  kind: string;
};

export const GRID_DAYS = [
  { n: 1, label: 'Mon' },
  { n: 2, label: 'Tue' },
  { n: 3, label: 'Wed' },
  { n: 4, label: 'Thu' },
  { n: 5, label: 'Fri' },
  { n: 6, label: 'Sat' },
];

export function formatClock(hhmm?: string | null) {
  if (!hhmm) return '';
  const [hStr, m] = hhmm.slice(0, 5).split(':');
  const h = Number(hStr);
  if (!Number.isFinite(h)) return hhmm;
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${m} ${suffix}`;
}

export function attendanceLabel(status: string, expected: boolean, state: string) {
  if (state === 'SUBSTITUTED') return 'Substitution';
  if (state === 'HOLIDAY') return 'Holiday / No Class';
  if (state === 'CANCELLED') return 'Cancelled';
  if (!expected) return 'No class';
  if (status === 'COMPLETED') return 'Attendance Completed';
  if (status === 'OPEN' || status === 'DRAFT') return 'Attendance In Progress';
  return 'Attendance Not Taken';
}

export function attendanceTone(status: string, state: string): 'muted' | 'success' | 'warning' | 'danger' | 'accent' {
  if (state === 'SUBSTITUTED') return 'accent';
  if (state === 'HOLIDAY') return 'muted';
  if (state === 'CANCELLED') return 'danger';
  if (status === 'COMPLETED') return 'success';
  if (status === 'OPEN' || status === 'DRAFT') return 'accent';
  return 'warning';
}

export function OccurrenceCard({
  occ,
  href,
  actions,
  showClass,
}: {
  occ: Occurrence;
  href?: string;
  actions?: ReactNode;
  showClass?: boolean;
}) {
  const body = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
          {formatClock(occ.startTime)}–{formatClock(occ.endTime)}
        </p>
        <p className="mt-1 text-base font-semibold">{occ.courseName || occ.holidayLabel || 'Class'}</p>
        <p className="text-sm text-ink-muted">
          {[showClass ? occ.className : null, occ.faculty.map((f) => f.name).join(', '), occ.roomName]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {occ.plannedTopic ? <p className="mt-1 text-xs text-ink-muted">Planned: {occ.plannedTopic.topicName}</p> : null}
        {occ.isSubstitution || occ.state === 'SUBSTITUTED' ? (
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-accent">
            Substitution
            {occ.coveringForFacultyName ? ` · Covering for ${occ.coveringForFacultyName}` : ''}
          </p>
        ) : null}
        {occ.reason ? <p className="mt-1 text-xs text-ink-muted">{occ.reason}</p> : null}
      </div>
      <StatusPill tone={attendanceTone(occ.attendanceStatus, occ.state)}>
        {attendanceLabel(occ.attendanceStatus, occ.attendanceExpected, occ.state)}
      </StatusPill>
    </div>
  );
  return (
    <Surface className="space-y-3">
      {href ? (
        <Link to={href} className="block hover:text-accent">
          {body}
        </Link>
      ) : (
        body
      )}
      {actions}
    </Surface>
  );
}

export function WeekAgenda({
  occurrences,
  hrefFor,
}: {
  occurrences: Occurrence[];
  hrefFor?: (occ: Occurrence) => string | undefined;
}) {
  const byDate = new Map<string, Occurrence[]>();
  for (const o of occurrences) {
    const list = byDate.get(o.date) ?? [];
    list.push(o);
    byDate.set(o.date, list);
  }
  const dates = [...byDate.keys()].sort();
  if (!dates.length) return <p className="text-sm text-ink-muted">No classes scheduled this week.</p>;
  return (
    <div className="space-y-5">
      {dates.map((date) => (
        <section key={date}>
          <h3 className="mb-2 text-sm font-semibold text-ink">
            {byDate.get(date)?.[0]?.dayLabel} · {date}
          </h3>
          <div className="space-y-3">
            {byDate.get(date)!.map((occ) => (
              <OccurrenceCard key={occ.id} occ={occ} href={hrefFor?.(occ)} showClass />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

export function WeekGrid({
  periods,
  occurrences,
  onCell,
  readOnly,
}: {
  periods: Period[];
  occurrences: Occurrence[];
  onCell?: (day: number, period: Period, occ?: Occurrence) => void;
  readOnly?: boolean;
}) {
  const teaching = periods.filter((p) => p.kind === 'PERIOD');
  return (
    <div className="overflow-x-auto print:overflow-visible">
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 min-w-[7rem] border border-border bg-surface px-2 py-2 text-xs uppercase text-ink-muted">
              Period
            </th>
            {GRID_DAYS.map((d) => (
              <th key={d.n} className="min-w-[8rem] border border-border px-2 py-2 text-xs uppercase text-ink-muted">
                {d.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teaching.map((period) => (
            <tr key={period.id}>
              <th className="sticky left-0 z-10 border border-border bg-surface px-2 py-2 align-top">
                <p className="font-medium">{period.name}</p>
                <p className="text-[11px] font-normal text-ink-muted">
                  {formatClock(period.startTime)}–{formatClock(period.endTime)}
                </p>
              </th>
              {GRID_DAYS.map((d) => {
                const occ = occurrences.find(
                  (o) =>
                    o.dayOfWeek === d.n &&
                    o.startPeriodNumber === period.periodNumber &&
                    o.state !== 'EXTRA' &&
                    o.state !== 'MAKEUP',
                );
                const extra = occurrences.find(
                  (o) =>
                    o.dayOfWeek === d.n &&
                    (o.state === 'EXTRA' || o.state === 'MAKEUP') &&
                    o.startPeriodNumber === period.periodNumber,
                );
                const cell = occ || extra;
                return (
                  <td key={d.n} className="border border-border p-1 align-top">
                    <button
                      type="button"
                      disabled={readOnly && !cell}
                      onClick={() => onCell?.(d.n, period, cell)}
                      className={cn(
                        'min-h-[4.5rem] w-full rounded-[var(--radius-sm)] px-2 py-1.5 text-left transition',
                        cell
                          ? cell.state === 'HOLIDAY'
                            ? 'bg-surface-muted text-ink-muted'
                            : cell.state === 'CANCELLED'
                              ? 'bg-danger-soft/60'
                              : 'bg-accent-soft/40 hover:bg-accent-soft'
                          : 'hover:bg-surface-muted',
                      )}
                    >
                      {cell ? (
                        <>
                          <p className="font-medium leading-tight">{cell.courseName || cell.holidayLabel}</p>
                          <p className="mt-0.5 text-[11px] text-ink-muted">
                            {cell.faculty[0]?.name}
                            {cell.roomName ? ` · ${cell.roomName}` : ''}
                          </p>
                          {cell.endPeriodNumber && cell.startPeriodNumber && cell.endPeriodNumber > cell.startPeriodNumber ? (
                            <p className="text-[11px] text-ink-muted">
                              P{cell.startPeriodNumber}–P{cell.endPeriodNumber}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-[11px] text-ink-muted">{readOnly ? '—' : 'Assign'}</span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
