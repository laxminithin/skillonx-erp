import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, RefreshCw, Scan, Search, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { StatusPill, statusToneFor } from '../lms/studentUi';

type Dashboard = {
  booksIssuedToday: number;
  returnsToday: number;
  overdueLoans: number;
  activeReservations: number;
  availableCopies: number;
  outstandingFines: string;
};

type MemberSummary = {
  id: number;
  name: string;
  identifier: string;
  status: string;
  activeLoanCount: number;
  overdueLoanCount: number;
  reservationCount: number;
  outstandingFines: string;
};

type Loan = {
  id: number;
  title: string;
  accessionNumber: string;
  dueAt: string;
  status: string;
};

export function LibraryDashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  useDocumentTitle('Library Dashboard');

  useEffect(() => {
    api<Dashboard>('/api/library/dashboard').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  const cards = [
    { label: 'Issued Today', value: data.booksIssuedToday },
    { label: 'Returns Today', value: data.returnsToday },
    { label: 'Overdue Loans', value: data.overdueLoans, tone: 'text-danger' },
    { label: 'Active Reservations', value: data.activeReservations },
    { label: 'Available Copies', value: data.availableCopies, tone: 'text-success' },
    { label: 'Outstanding Fines', value: `₹${data.outstandingFines}` },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Library Dashboard" subtitle="Circulation overview and key metrics." />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <Surface key={c.label} className="p-4">
            <p className="text-xs uppercase tracking-wide text-ink-muted">{c.label}</p>
            <p className={`mt-1 text-2xl font-semibold tabular-nums ${c.tone ?? ''}`}>{c.value}</p>
          </Surface>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Link to="/library/circulation"><Button><Scan className="mr-1 h-4 w-4" />Circulation Desk</Button></Link>
        <Link to="/library/reservations"><Button variant="secondary">Reservations</Button></Link>
        <Link to="/library/inventory"><Button variant="secondary">Inventory</Button></Link>
        <Link to="/library/reports"><Button variant="secondary">Reports</Button></Link>
      </div>
    </div>
  );
}

export function LibraryCirculationDeskPage() {
  const [memberQuery, setMemberQuery] = useState('');
  const [bookBarcode, setBookBarcode] = useState('');
  const [member, setMember] = useState<MemberSummary | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const memberInputId = 'lib-member-scan';
  const bookInputId = 'lib-book-scan';
  useDocumentTitle('Circulation Desk');

  async function lookupMember() {
    if (!memberQuery.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const m = await api<MemberSummary>(`/api/library/members/lookup/${encodeURIComponent(memberQuery.trim())}`);
      setMember(m);
      setBookBarcode('');
      document.getElementById(bookInputId)?.focus();
    } catch {
      setMember(null);
      setMessage('Member not found');
    } finally {
      setBusy(false);
    }
  }

  async function issue() {
    if (!member || !bookBarcode.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const loan = await api<Loan>('/api/library/circulation/issue', {
        method: 'POST',
        body: JSON.stringify({ memberId: member.id, barcode: bookBarcode.trim() }),
      });
      setMessage(`Issued: ${loan.title} — due ${formatDate(loan.dueAt)}`);
      setBookBarcode('');
      const m = await api<MemberSummary>(`/api/library/members/lookup/${encodeURIComponent(member.identifier)}`);
      setMember(m);
    } catch (err) {
      setMessage((err as Error).message || 'Issue failed');
    } finally {
      setBusy(false);
    }
  }

  async function returnBook() {
    if (!bookBarcode.trim()) return;
    setBusy(true);
    setMessage('');
    try {
      const loan = await api<Loan>('/api/library/circulation/return', {
        method: 'POST',
        body: JSON.stringify({ barcode: bookBarcode.trim() }),
      });
      setMessage(`Returned: ${loan.title}`);
      setBookBarcode('');
      if (member) {
        const m = await api<MemberSummary>(`/api/library/members/lookup/${encodeURIComponent(member.identifier)}`);
        setMember(m);
      }
    } catch (err) {
      setMessage((err as Error).message || 'Return failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Circulation Desk" subtitle="Scan member card, then scan book barcode." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface className="space-y-4 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4" />Member</h2>
          <form
            className="flex gap-2"
            onSubmit={(e) => { e.preventDefault(); lookupMember(); }}
          >
            <Input
              id={memberInputId}
              value={memberQuery}
              onChange={(e) => setMemberQuery(e.target.value)}
              placeholder="USN / membership number / card token"
              autoFocus
            />
            <Button type="submit" disabled={busy}>Lookup</Button>
          </form>
          {member ? (
            <div className="rounded-lg border border-border/60 p-3 text-sm">
              <p className="font-medium">{member.name}</p>
              <p className="text-ink-muted">{member.identifier}</p>
              <StatusPill tone={statusToneFor(member.status)}>{member.status}</StatusPill>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div><dt className="text-ink-muted">Active loans</dt><dd className="font-semibold">{member.activeLoanCount}</dd></div>
                <div><dt className="text-ink-muted">Overdue</dt><dd className="font-semibold text-danger">{member.overdueLoanCount}</dd></div>
                <div><dt className="text-ink-muted">Reservations</dt><dd className="font-semibold">{member.reservationCount}</dd></div>
                <div><dt className="text-ink-muted">Fines</dt><dd className="font-semibold">₹{member.outstandingFines}</dd></div>
              </dl>
            </div>
          ) : null}
        </Surface>

        <Surface className="space-y-4 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold"><BookOpen className="h-4 w-4" />Book</h2>
          <Input
            id={bookInputId}
            value={bookBarcode}
            onChange={(e) => setBookBarcode(e.target.value)}
            placeholder="Scan barcode / accession number"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.shiftKey) returnBook();
              else if (e.key === 'Enter') issue();
            }}
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={issue} disabled={busy || !member}>Issue (Enter)</Button>
            <Button variant="secondary" onClick={returnBook} disabled={busy}>Return (Shift+Enter)</Button>
            <Button variant="ghost" size="sm" onClick={() => { setMember(null); setMemberQuery(''); document.getElementById(memberInputId)?.focus(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          {message ? <p className="text-sm text-ink-secondary">{message}</p> : null}
        </Surface>
      </div>
    </div>
  );
}

export function LibrarySearchPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<Array<{ id: number; title: string; authors?: string; availability?: { availableCopies: number; totalCopies: number } }>>([]);
  useDocumentTitle('Library Catalog');

  async function search() {
    const res = await api<{ items: typeof items }>(`/api/library/catalog/search?q=${encodeURIComponent(q)}`);
    setItems(res.items);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Search Catalog" subtitle="Staff catalog search." />
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="flex-1" />
        <Button type="submit"><Search className="h-4 w-4" /></Button>
      </form>
      <div className="space-y-2">
        {items.map((item) => (
          <Surface key={item.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{item.title}</p>
              {item.authors ? <p className="text-ink-muted">{item.authors}</p> : null}
            </div>
            {item.availability ? (
              <p className="text-xs tabular-nums">{item.availability.availableCopies}/{item.availability.totalCopies}</p>
            ) : null}
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function LibraryReservationsPage() {
  const [reservations, setReservations] = useState<Array<{ id: number; title: string; memberName: string; memberIdentifier: string; status: string; queuePosition: number }>>([]);
  useDocumentTitle('Library Reservations');

  useEffect(() => {
    api<{ reservations: typeof reservations }>('/api/library/reservations').then((r) => setReservations(r.reservations)).catch(() => setReservations([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reservations" subtitle="Active and ready pickup queue." />
      <div className="space-y-2">
        {reservations.map((r) => (
          <Surface key={r.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{r.title}</p>
              <p className="text-ink-muted">{r.memberName} ({r.memberIdentifier}) · Queue #{r.queuePosition}</p>
            </div>
            <StatusPill tone={statusToneFor(r.status)}>{r.status}</StatusPill>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function LibraryFinesPage() {
  const [fines, setFines] = useState<Array<{ id: number; memberName: string; memberIdentifier: string; fineType: string; outstandingAmount: string; status: string }>>([]);
  useDocumentTitle('Library Fines');

  useEffect(() => {
    api<{ fines: typeof fines }>('/api/library/fines?status=DUE').then((r) => setFines(r.fines)).catch(() => setFines([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Fines" subtitle="Outstanding library charges." />
      <div className="space-y-2">
        {fines.map((f) => (
          <Surface key={f.id} className="flex items-center justify-between p-3 text-sm">
            <div>
              <p className="font-medium">{f.memberName} ({f.memberIdentifier})</p>
              <p className="text-ink-muted">{f.fineType}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold tabular-nums">₹{f.outstandingAmount}</p>
              <StatusPill tone={statusToneFor(f.status)}>{f.status}</StatusPill>
            </div>
          </Surface>
        ))}
      </div>
    </div>
  );
}

export function LibraryInventoryPage() {
  const [copies, setCopies] = useState<Array<{ accessionNumber: string; barcode: string; title: string; status: string; location?: string }>>([]);
  const [q, setQ] = useState('');
  useDocumentTitle('Library Inventory');

  async function load() {
    const res = await api<{ copies: typeof copies }>(`/api/library/inventory?q=${encodeURIComponent(q)}`);
    setCopies(res.copies);
  }

  useEffect(() => { load().catch(() => setCopies([])); }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Inventory" subtitle="Physical copy register." />
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); load(); }}>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Accession, barcode, title…" className="flex-1" />
        <Button type="submit">Search</Button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-ink-muted">
              <th className="p-2">Accession</th>
              <th className="p-2">Title</th>
              <th className="p-2">Location</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {copies.map((c) => (
              <tr key={c.accessionNumber} className="border-b border-border/40">
                <td className="p-2 font-mono text-xs">{c.accessionNumber}</td>
                <td className="p-2">{c.title}</td>
                <td className="p-2 text-ink-muted">{c.location ?? '—'}</td>
                <td className="p-2"><StatusPill tone={statusToneFor(c.status)}>{c.status}</StatusPill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LibraryReportsPage() {
  const [overdue, setOverdue] = useState<Array<{ memberName: string; memberIdentifier: string; title: string; daysOverdue: number; fine: string }>>([]);
  const [topBooks, setTopBooks] = useState<Array<{ title: string; borrowCount: number }>>([]);
  useDocumentTitle('Library Reports');

  useEffect(() => {
    Promise.all([
      api<typeof overdue>('/api/library/reports/overdue'),
      api<{ items: typeof topBooks }>('/api/library/reports/most-borrowed'),
    ]).then(([od, top]) => {
      setOverdue(od);
      setTopBooks(top.items);
    }).catch(() => {});
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reports" subtitle="Circulation analytics." />
      <Surface className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Overdue Loans</h2>
        {overdue.length === 0 ? <p className="text-sm text-ink-muted">No overdue loans.</p> : (
          <div className="space-y-2">
            {overdue.map((r, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{r.memberName} — {r.title}</span>
                <span className="tabular-nums text-danger">{r.daysOverdue}d · ₹{r.fine}</span>
              </div>
            ))}
          </div>
        )}
      </Surface>
      <Surface className="p-4">
        <h2 className="mb-3 text-sm font-semibold">Most Borrowed</h2>
        <div className="space-y-2">
          {topBooks.map((b) => (
            <div key={b.title} className="flex justify-between text-sm">
              <span>{b.title}</span>
              <span className="tabular-nums font-medium">{b.borrowCount}</span>
            </div>
          ))}
        </div>
      </Surface>
    </div>
  );
}
