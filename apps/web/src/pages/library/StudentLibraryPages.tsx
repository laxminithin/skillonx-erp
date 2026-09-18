import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { BookMarked, BookOpen, CreditCard, History, Search, Bookmark } from 'lucide-react';
import { api } from '../../lib/api';
import { Button, Input, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';
import { StatusPill, StudentEmpty, statusToneFor } from '../lms/studentUi';

type Availability = {
  totalCopies: number;
  availableCopies: number;
  issuedCopies: number;
  reservedCopies: number;
};

type CatalogItem = {
  id: number;
  title: string;
  authors?: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
  publicationYear?: number;
  subjects?: string;
  description?: string;
  defaultLocation?: string;
  digitalLink?: string;
  availability?: Availability;
  copies?: Array<{ id: number; accessionNumber: string; location?: string; shelf?: string; status: string }>;
};

type Loan = {
  id: number;
  title: string;
  authors?: string;
  issuedAt: string;
  dueAt: string;
  returnedAt?: string;
  status: string;
  renewalsLeft: number;
};

type Reservation = {
  id: number;
  title: string;
  status: string;
  queuePosition: number;
  requestedAt: string;
  expiresAt?: string;
};

type Fine = {
  id: number;
  fineType: string;
  amount: string;
  outstandingAmount: string;
  status: string;
  remarks?: string;
};

type LibraryCard = {
  name: string;
  usn: string;
  program?: string;
  membershipNumber: string;
  status: string;
  qrPayload: string;
};

export function StudentLibraryHomePage() {
  const [data, setData] = useState<{
    member: { status: string; membershipNumber: string };
    activeLoans: Loan[];
    activeReservations: Reservation[];
  } | null>(null);
  useDocumentTitle('Library');

  useEffect(() => {
    api<NonNullable<typeof data>>('/api/student/library').then(setData).catch(() => setData(null));
  }, []);

  if (!data) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Library" subtitle="Search, borrow, and manage your library account." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link to="/lms/library/search" className="block">
          <Surface className="flex items-center gap-3 p-4 transition hover:border-accent/40">
            <Search className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Search Catalog</p>
              <p className="text-xs text-ink-muted">Find books by title, author, ISBN</p>
            </div>
          </Surface>
        </Link>
        <Link to="/lms/library/books" className="block">
          <Surface className="flex items-center gap-3 p-4 transition hover:border-accent/40">
            <BookOpen className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">My Books</p>
              <p className="text-xs text-ink-muted">{data.activeLoans.length} active loan(s)</p>
            </div>
          </Surface>
        </Link>
        <Link to="/lms/library/reservations" className="block">
          <Surface className="flex items-center gap-3 p-4 transition hover:border-accent/40">
            <Bookmark className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Reservations</p>
              <p className="text-xs text-ink-muted">{data.activeReservations.length} active</p>
            </div>
          </Surface>
        </Link>
        <Link to="/lms/library/card" className="block">
          <Surface className="flex items-center gap-3 p-4 transition hover:border-accent/40">
            <CreditCard className="h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Library Card</p>
              <p className="text-xs text-ink-muted">{data.member.membershipNumber}</p>
            </div>
          </Surface>
        </Link>
      </div>

      {data.activeLoans.length > 0 ? (
        <Surface className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Currently Borrowed</h2>
            <Link to="/lms/library/books" className="text-xs text-accent hover:underline">View all</Link>
          </div>
          <div className="space-y-2">
            {data.activeLoans.slice(0, 3).map((loan) => (
              <div key={loan.id} className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2">
                <div>
                  <p className="font-medium">{loan.title}</p>
                  <p className="text-xs text-ink-muted">Due {formatDate(loan.dueAt)}</p>
                </div>
                <StatusPill tone={statusToneFor(loan.status)}>{loan.status.replace(/_/g, ' ')}</StatusPill>
              </div>
            ))}
          </div>
        </Surface>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Link to="/lms/library/history"><Button variant="secondary" size="sm"><History className="mr-1 h-4 w-4" />History</Button></Link>
        <Link to="/lms/library/fines"><Button variant="secondary" size="sm"><BookMarked className="mr-1 h-4 w-4" />Fines & Dues</Button></Link>
      </div>
    </div>
  );
}

export function StudentLibrarySearchPage() {
  const [q, setQ] = useState('');
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle('Search Library');

  async function search(term?: string) {
    setLoading(true);
    try {
      const res = await api<{ items: CatalogItem[] }>(`/api/student/library/search?q=${encodeURIComponent(term ?? q)}`);
      setItems(res.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    search('');
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Search Library" subtitle="Find books in the institutional catalog." />
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          search();
        }}
      >
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, author, ISBN, subject…" className="flex-1" />
        <Button type="submit" disabled={loading}>Search</Button>
      </form>

      {loading ? <Skeleton className="h-32 w-full" /> : null}
      {!loading && items.length === 0 ? (
        <StudentEmpty title="No results" body="Try a different search term." />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/lms/library/books/${item.id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/lms/library/books/${item.id}`); }}
            >
              <Surface className="cursor-pointer p-4 transition hover:border-accent/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{item.title}</p>
                    {item.authors ? <p className="text-sm text-ink-muted">{item.authors}</p> : null}
                    {item.edition ? <p className="text-xs text-ink-muted">{item.edition} edition</p> : null}
                  </div>
                  {item.availability ? (
                    <div className="text-right text-sm">
                      <StatusPill tone={item.availability.availableCopies > 0 ? 'success' : 'warning'}>
                        {item.availability.availableCopies > 0 ? 'Available' : 'Unavailable'}
                      </StatusPill>
                      <p className="mt-1 text-xs text-ink-muted tabular-nums">
                        {item.availability.availableCopies} / {item.availability.totalCopies} copies
                      </p>
                    </div>
                  ) : null}
                </div>
              </Surface>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentLibraryBookDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState<CatalogItem | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  useDocumentTitle(item?.title ?? 'Book Detail');

  useEffect(() => {
    if (!id) return;
    api<CatalogItem>(`/api/student/library/books/${id}`).then(setItem).catch(() => setItem(null));
  }, [id]);

  async function reserve() {
    if (!item) return;
    setBusy(true);
    try {
      await api('/api/student/library/reservations', { method: 'POST', body: JSON.stringify({ catalogItemId: item.id }) });
      navigate('/lms/library/reservations');
    } finally {
      setBusy(false);
    }
  }

  if (!item) return <Skeleton className="h-40 w-full" />;

  const avail = item.availability;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={item.title} subtitle={item.authors ?? undefined} />
      <Surface className="space-y-4 p-4">
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {item.publisher ? <div><dt className="text-ink-muted">Publisher</dt><dd>{item.publisher}</dd></div> : null}
          {item.edition ? <div><dt className="text-ink-muted">Edition</dt><dd>{item.edition}</dd></div> : null}
          {item.publicationYear ? <div><dt className="text-ink-muted">Year</dt><dd>{item.publicationYear}</dd></div> : null}
          {item.isbn ? <div><dt className="text-ink-muted">ISBN</dt><dd>{item.isbn}</dd></div> : null}
          {item.subjects ? <div className="sm:col-span-2"><dt className="text-ink-muted">Subjects</dt><dd>{item.subjects}</dd></div> : null}
          {item.defaultLocation ? <div><dt className="text-ink-muted">Location</dt><dd>{item.defaultLocation}</dd></div> : null}
        </dl>
        {item.description ? <p className="text-sm text-ink-secondary">{item.description}</p> : null}
        {avail ? (
          <div className="rounded-lg bg-surface-muted p-3 text-sm">
            <p className="font-medium">Availability</p>
            <p className="tabular-nums text-ink-muted">
              {avail.availableCopies} available · {avail.issuedCopies} issued · {avail.reservedCopies} reserved · {avail.totalCopies} total
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {avail && avail.availableCopies === 0 ? (
            <Button onClick={reserve} disabled={busy}>Reserve</Button>
          ) : null}
          {item.digitalLink ? (
            <a href={item.digitalLink} target="_blank" rel="noreferrer">
              <Button variant="secondary">View Digital Copy</Button>
            </a>
          ) : null}
          <Link to="/lms/library/search"><Button variant="secondary">Back to Search</Button></Link>
        </div>
      </Surface>
    </div>
  );
}

export function StudentLibraryMyBooksPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  useDocumentTitle('My Books');

  useEffect(() => {
    api<{ loans: Loan[] }>('/api/student/library/loans').then((r) => setLoans(r.loans)).catch(() => setLoans([]));
  }, []);

  async function renew(loanId: number) {
    setBusy(loanId);
    try {
      await api(`/api/student/library/loans/${loanId}/renew`, { method: 'POST' });
      const res = await api<{ loans: Loan[] }>('/api/student/library/loans');
      setLoans(res.loans);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="My Books" subtitle="Active loans and renewal options." />
      {loans.length === 0 ? (
        <StudentEmpty title="No active loans" body="Search the catalog to find books." action={<Link to="/lms/library/search"><Button>Search Catalog</Button></Link>} />
      ) : (
        <div className="space-y-3">
          {loans.map((loan) => (
            <Surface key={loan.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{loan.title}</p>
                  {loan.authors ? <p className="text-sm text-ink-muted">{loan.authors}</p> : null}
                  <p className="mt-2 text-sm">Issued: {formatDate(loan.issuedAt)}</p>
                  <p className="text-sm">Due: {formatDate(loan.dueAt)}</p>
                  <p className="text-xs text-ink-muted">Renewals left: {loan.renewalsLeft}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <StatusPill tone={statusToneFor(loan.status)}>{loan.status}</StatusPill>
                  {loan.renewalsLeft > 0 && !['OVERDUE'].includes(loan.status) ? (
                    <Button size="sm" variant="secondary" disabled={busy === loan.id} onClick={() => renew(loan.id)}>
                      Renew
                    </Button>
                  ) : null}
                </div>
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentLibraryReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  useDocumentTitle('Reservations');

  async function load() {
    const res = await api<{ reservations: Reservation[] }>('/api/student/library/reservations');
    setReservations(res.reservations);
  }

  useEffect(() => { load().catch(() => setReservations([])); }, []);

  async function cancel(id: number) {
    setBusy(id);
    try {
      await api(`/api/student/library/reservations/${id}/cancel`, { method: 'POST' });
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Reservations" subtitle="Titles you have reserved." />
      {reservations.length === 0 ? (
        <StudentEmpty title="No reservations" body="Reserve a book when all copies are issued." />
      ) : (
        <div className="space-y-3">
          {reservations.map((r) => (
            <Surface key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{r.title}</p>
                <p className="text-xs text-ink-muted">Queue position: {r.queuePosition} · Requested {formatDate(r.requestedAt)}</p>
                {r.expiresAt ? <p className="text-xs text-warning">Pickup by {formatDate(r.expiresAt)}</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <StatusPill tone={statusToneFor(r.status)}>{r.status}</StatusPill>
                {['ACTIVE', 'READY'].includes(r.status) ? (
                  <Button size="sm" variant="secondary" disabled={busy === r.id} onClick={() => cancel(r.id)}>Cancel</Button>
                ) : null}
              </div>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentLibraryHistoryPage() {
  const [history, setHistory] = useState<Loan[]>([]);
  useDocumentTitle('Library History');

  useEffect(() => {
    api<{ history: Loan[] }>('/api/student/library/history').then((r) => setHistory(r.history)).catch(() => setHistory([]));
  }, []);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Borrowing History" subtitle="All past and current loans." />
      {history.length === 0 ? <StudentEmpty title="No history" body="Your borrowing history will appear here." /> : (
        <div className="space-y-2">
          {history.map((h) => (
            <Surface key={h.id} className="flex items-center justify-between p-3 text-sm">
              <div>
                <p className="font-medium">{h.title}</p>
                <p className="text-xs text-ink-muted">{formatDate(h.issuedAt)} — {h.returnedAt ? formatDate(h.returnedAt) : 'Active'}</p>
              </div>
              <StatusPill tone={statusToneFor(h.status)}>{h.status}</StatusPill>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}

export function StudentLibraryFinesPage() {
  const [fines, setFines] = useState<Fine[]>([]);
  useDocumentTitle('Library Fines');

  useEffect(() => {
    api<{ fines: Fine[] }>('/api/student/library/fines').then((r) => setFines(r.fines)).catch(() => setFines([]));
  }, []);

  const outstanding = fines.filter((f) => ['DUE', 'PARTIALLY_PAID'].includes(f.status));

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Fines & Dues" subtitle="Outstanding library charges." />
      {outstanding.length === 0 ? (
        <StudentEmpty title="No outstanding fines" body="You have no library dues." />
      ) : (
        <>
          <Surface className="p-4">
            <p className="text-sm text-ink-muted">Total outstanding</p>
            <p className="text-2xl font-semibold tabular-nums">
              ₹{outstanding.reduce((s, f) => s + Number(f.outstandingAmount), 0).toFixed(0)}
            </p>
            <Link to="/lms/fees/pay" className="mt-2 inline-block text-sm text-accent hover:underline">Pay via Finance →</Link>
          </Surface>
          <div className="space-y-2">
            {fines.map((f) => (
              <Surface key={f.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <p className="font-medium">{f.fineType.replace(/_/g, ' ')}</p>
                  {f.remarks ? <p className="text-xs text-ink-muted">{f.remarks}</p> : null}
                </div>
                <div className="text-right">
                  <p className="font-semibold tabular-nums">₹{f.outstandingAmount}</p>
                  <StatusPill tone={statusToneFor(f.status)}>{f.status}</StatusPill>
                </div>
              </Surface>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function StudentLibraryCardPage() {
  const [card, setCard] = useState<LibraryCard | null>(null);
  useDocumentTitle('Library Card');

  useEffect(() => {
    api<LibraryCard>('/api/student/library/card').then(setCard).catch(() => setCard(null));
  }, []);

  if (!card) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Digital Library Card" subtitle="Show this at the circulation desk." />
      <Surface className="mx-auto max-w-sm overflow-hidden rounded-2xl border-2 border-accent/20 bg-gradient-to-br from-accent/5 to-surface p-6">
        <p className="text-xs uppercase tracking-widest text-ink-muted">Institutional Library</p>
        <p className="mt-4 text-xl font-semibold">{card.name}</p>
        <p className="text-sm text-ink-muted">{card.usn}</p>
        {card.program ? <p className="text-sm text-ink-muted">{card.program}</p> : null}
        <div className="mt-6 rounded-lg bg-white p-4 text-center dark:bg-surface-muted">
          <p className="font-mono text-lg tracking-wider">{card.membershipNumber}</p>
          <p className="mt-2 break-all font-mono text-[10px] text-ink-muted">{card.qrPayload}</p>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <StatusPill tone={card.status === 'ACTIVE' ? 'success' : 'warning'}>{card.status}</StatusPill>
          <p className="text-xs text-ink-muted">Scan at desk</p>
        </div>
      </Surface>
    </div>
  );
}
