import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, EmptyState, PageHeader, Select, StatusBadge, Surface, useToast } from '../../components/ui';

type Row = {
  id: number;
  title: string;
  subjectName: string;
  courseCode: string;
  examType: string;
  status: string;
  maxMarks: number;
  academicYearLabel?: string | null;
  facultyName?: string;
  workflowStep?: string | null;
};

export function InternalPapersPage({ basePath = '/internal-question-papers', admin = false }: { basePath?: string; admin?: boolean }) {
  useDocumentTitle(admin ? 'Internal Question Papers' : 'My Internal Question Papers');
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [status, setStatus] = useState('');

  const load = () => {
    const qs = new URLSearchParams();
    if (status) qs.set('status', status);
    const path = admin ? '/api/question-papers/admin/monitoring' : `/api/question-papers/internal${qs.toString() ? `?${qs}` : ''}`;
    api<{ papers: Row[] }>(path)
      .then((r) => setRows(r.papers || []))
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load papers', 'error'));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, admin]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title={admin ? 'Internal Question Paper Monitoring' : 'Internal Question Papers'}
        subtitle="Prepare IA papers from selected syllabus portions, the 50-mark pattern, and the question bank."
        actions={
          !admin ? (
            <Link to={`${basePath}/create`}>
              <Button>
                <Plus size={16} />
                Create Internal Paper
              </Button>
            </Link>
          ) : undefined
        }
      />
      {!admin ? (
        <div className="mb-4 max-w-xs">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="FINALIZED">Finalized</option>
          </Select>
        </div>
      ) : null}
      {rows.length === 0 ? (
        <EmptyState title="No internal question papers" body="Create an IA paper from assessment setup, selected portions, and the 50-mark pattern." />
      ) : (
        <div className="divide-y divide-border border-y">
          {rows.map((r) => (
            <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <Link to={`${basePath}/${r.id}`} className="font-medium hover:text-accent">
                  {r.title || `${r.examType} · ${r.subjectName}`}
                </Link>
                <p className="text-sm text-ink-secondary">
                  {r.courseCode} · {r.examType} · {r.maxMarks} Marks · {r.academicYearLabel}
                  {r.workflowStep && r.status === 'DRAFT' ? ` · ${r.workflowStep}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
                <Link to={`${basePath}/${r.id}`}>
                  <Button size="sm" variant="secondary">
                    Open
                  </Button>
                </Link>
                {r.status === 'DRAFT' && !admin ? (
                  <Link to={`${basePath}/${r.id}/edit`}>
                    <Button size="sm">Continue</Button>
                  </Link>
                ) : null}
                {r.status === 'FINALIZED' ? (
                  <Button
                    size="sm"
                    variant="tertiary"
                    onClick={() => downloadCopoExport(`/api/question-papers/internal/${r.id}/export`, 'question-paper.xlsx')}
                  >
                    Export
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
