import { useEffect, useState } from 'react';
import { PageHeader, Surface, Button, Select, EmptyState, Skeleton, useToast } from '../../components/ui';
import { labApi } from '../../lib/labApi';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useLabMeta } from './shared';

const LABELS: Record<string, string> = {
  'asset-register': 'Asset register', 'lab-inventory': 'Lab-wise inventory', 'faulty-assets': 'Faulty assets',
  'repair-history': 'Repair history', 'issue-return': 'Issue / return', 'overdue-items': 'Overdue items',
  'stock-ledger': 'Stock ledger', 'low-stock': 'Low stock', 'software-license': 'Software / license',
  'warranty-amc-expiry': 'Warranty / AMC expiry', 'lab-readiness': 'Lab readiness', 'requirement-status': 'Requirement status',
};

export function LabReportsPage() {
  useDocumentTitle('Lab Reports');
  const meta = useLabMeta();
  const { toast } = useToast();
  const [type, setType] = useState('asset-register');
  const [data, setData] = useState<{ columns: string[]; rows: any[]; generatedAt: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const run = (t: string) => {
    setLoading(true); setType(t);
    labApi.report(t).then(setData).catch((e) => { toast(e instanceof Error ? e.message : 'Failed', 'error'); setData(null); }).finally(() => setLoading(false));
  };
  useEffect(() => { run('asset-register'); /* eslint-disable-next-line */ }, []);

  const download = () => {
    if (!data) return;
    const header = data.columns.join(',');
    const body = data.rows.map((r) => data.columns.map((c) => JSON.stringify(r[c] ?? '')).join(',')).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${type}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Operational lab reports (CSV export)" actions={data && data.rows.length > 0 ? <Button variant="secondary" onClick={download}>Export CSV</Button> : undefined} />
      <Surface className="mb-4 !p-3">
        <Select value={type} onChange={(e) => run(e.target.value)} aria-label="Report type" className="w-auto">
          {(meta?.reportTypes ?? Object.keys(LABELS)).map((t) => <option key={t} value={t}>{LABELS[t] ?? t}</option>)}
        </Select>
      </Surface>
      {loading ? <Skeleton className="h-48" /> : !data || data.rows.length === 0 ? <EmptyState title="No data" body="This report returned no rows for your scope." /> : (
        <Surface className="!p-0 overflow-hidden"><div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-sm">
            <thead><tr className="border-b border-border bg-surface-muted/50 text-left text-xs uppercase tracking-wide text-ink-muted">
              {data.columns.map((c) => <th key={c} className="px-3 py-2.5 whitespace-nowrap">{c.replaceAll('_', ' ')}</th>)}
            </tr></thead>
            <tbody>
              {data.rows.map((r, i) => (
                <tr key={i} className="border-b border-border/60">
                  {data.columns.map((c) => <td key={c} className="px-3 py-2 whitespace-nowrap">{formatCell(r[c])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div></Surface>
      )}
    </div>
  );
}

function formatCell(v: unknown) {
  if (v == null) return '—';
  if (typeof v === 'string' && v.length > 10 && /^\d{4}-\d{2}-\d{2}T/.test(v)) return v.slice(0, 10);
  return String(v);
}
