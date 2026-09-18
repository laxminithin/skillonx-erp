import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { StatusPill, statusToneFor } from '../lms/studentUi';

type Loan = { id: number; title: string; dueAt: string; status: string; renewalsLeft: number };

export function FacultyLibraryPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Array<{ id: number; title: string; authors?: string }>>([]);
  useDocumentTitle('My Library');

  useEffect(() => {
    api<{ loans: Loan[] }>('/api/faculty/library/loans').then((r) => setLoans(r.loans)).catch(() => setLoans([]));
  }, []);

  async function search() {
    const res = await api<{ items: typeof results }>(`/api/faculty/library/search?q=${encodeURIComponent(q)}`);
    setResults(res.items);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My Library" subtitle="Search, loans, and reservations for faculty." />
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}>
        <input className="input flex-1" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search catalog…" />
        <Button type="submit">Search</Button>
      </form>
      {results.length > 0 ? (
        <div className="space-y-2">
          {results.map((r) => (
            <Surface key={r.id} className="p-3 text-sm">
              <p className="font-medium">{r.title}</p>
              {r.authors ? <p className="text-ink-muted">{r.authors}</p> : null}
            </Surface>
          ))}
        </div>
      ) : null}
      <Surface className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Active Loans</h2>
        {loans.length === 0 ? <p className="text-sm text-ink-muted">No active loans.</p> : (
          <div className="space-y-2">
            {loans.map((l) => (
              <div key={l.id} className="flex justify-between text-sm">
                <span>{l.title} — due {formatDate(l.dueAt)}</span>
                <StatusPill tone={statusToneFor(l.status)}>{l.status}</StatusPill>
              </div>
            ))}
          </div>
        )}
      </Surface>
      <Link to="/library/circulation"><Button variant="secondary">Staff Circulation Desk</Button></Link>
    </div>
  );
}
