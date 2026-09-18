import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Occurrence, Period, WeekAgenda, WeekGrid } from './timetableUi';
import { StudentEmpty } from '../lms/studentUi';

export function StudentTimetablePage() {
  useDocumentTitle('Timetable');
  const [tab, setTab] = useState<'today' | 'week'>('today');
  const [data, setData] = useState<{
    today: string | null;
    occurrences: Occurrence[];
    periods: Period[];
    class: { name: string } | null;
  } | null>(null);

  useEffect(() => {
    const path = tab === 'today' ? '/api/student/timetable/today' : '/api/student/timetable/week';
    api<NonNullable<typeof data>>(path).then(setData).catch(() => setData({ today: null, occurrences: [], periods: [], class: null }));
  }, [tab]);

  if (!data) return <Skeleton className="h-40 w-full" />;
  if (!data.class) {
    return <StudentEmpty title="No class timetable" body="Your timetable appears after you are approved into an Academic Class. You cannot pick periods yourself." />;
  }

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Timetable"
        subtitle={data.class.name}
        actions={
          <div className="flex gap-2">
            <Button variant={tab === 'today' ? 'primary' : 'secondary'} onClick={() => setTab('today')}>
              Today
            </Button>
            <Button variant={tab === 'week' ? 'primary' : 'secondary'} onClick={() => setTab('week')}>
              Week
            </Button>
          </div>
        }
      />
      {tab === 'today' ? (
        data.occurrences.length ? (
          <WeekAgenda occurrences={data.occurrences} />
        ) : (
          <p className="text-sm text-ink-muted">No classes today.</p>
        )
      ) : (
        <>
          <div className="mb-4 hidden md:block">
            <WeekGrid periods={data.periods} occurrences={data.occurrences} readOnly />
          </div>
          <div className="md:hidden">
            <WeekAgenda occurrences={data.occurrences} />
          </div>
        </>
      )}
    </div>
  );
}
