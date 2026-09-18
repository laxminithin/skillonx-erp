import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../lib/api';
import { PageHeader, Skeleton, Surface } from '../components/ui';
import { formatDate } from '../lib/utils';

export function PublicVerifyPage() {
  const { code } = useParams();
  const [result, setResult] = useState<{
    valid: boolean;
    status: string;
    documentType: string;
    certificateNumber: string;
    title: string;
    studentName: string;
    usn: string;
    institution: string;
    issuedAt: string;
  } | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) return;
    api<NonNullable<typeof result>>(`/api/verify/document/${code}`, { auth: false })
      .then(setResult)
      .catch(() => setError(true));
  }, [code]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted p-4">
      <div className="w-full max-w-md">
        <PageHeader title="Document Verification" subtitle="Official document verification" />
        {error ? (
          <Surface className="text-center">
            <p className="text-danger font-medium">Invalid or expired verification code</p>
          </Surface>
        ) : !result ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <Surface className="space-y-4">
            <div className={`rounded-lg p-4 text-center ${result.valid ? 'bg-success-soft' : 'bg-danger-soft'}`}>
              <p className="text-lg font-semibold">{result.valid ? 'Valid Document' : result.status}</p>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-ink-muted">Type</dt><dd>{result.title}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Student</dt><dd>{result.studentName}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">USN</dt><dd>{result.usn}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Institution</dt><dd>{result.institution}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Certificate No.</dt><dd className="font-mono text-xs">{result.certificateNumber}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Issued</dt><dd>{formatDate(result.issuedAt)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-muted">Status</dt><dd>{result.status}</dd></div>
            </dl>
          </Surface>
        )}
      </div>
    </div>
  );
}
