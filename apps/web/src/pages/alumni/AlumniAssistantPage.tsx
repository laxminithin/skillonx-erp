import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageHeader, Skeleton, Surface, Button } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

type AskResponse = {
  sessionId: number;
  summary: string;
  intent: string;
  providerStatus: string;
  kinds: string[];
  facts: Array<Record<string, unknown>>;
  evidence: Array<Record<string, unknown>>;
  sources: Array<{ type: string; label: string; href?: string }>;
  dataQuality: { level: string; reasons: string[] };
  toolsUsed: string[];
  proposedAction?: {
    actionType: string;
    status: string;
    preview: Record<string, unknown>;
    requiresConfirm: boolean;
  } | null;
  blocked?: { reason: string; code: string } | null;
  uncertainties: string[];
  followUps: string[];
};

export function AlumniAssistantPage() {
  useDocumentTitle('Alumni Assistant');
  const [params] = useSearchParams();
  const contextAlumni = params.get('alumni');
  const contextSurface = params.get('from') || 'ASSISTANT';

  const [workspace, setWorkspace] = useState<any>(null);
  const [question, setQuestion] = useState('');
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [answer, setAnswer] = useState<AskResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api('/api/alumni-admin/assistant')
      .then((res) => {
        if (!cancelled) setWorkspace(res);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || 'Failed to load assistant');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function ask(q?: string) {
    const text = (q ?? question).trim();
    if (!text) return;
    setBusy(true);
    setError('');
    try {
      const res = await api<AskResponse>('/api/alumni-admin/assistant/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: text,
          sessionId,
          contextAlumniProfileId: contextAlumni ? Number(contextAlumni) : null,
          contextSurface,
        }),
      });
      setAnswer(res);
      setSessionId(res.sessionId);
      setQuestion(text);
    } catch (e: any) {
      setError(e?.message || 'Ask failed');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDraft() {
    if (!answer?.proposedAction) return;
    setBusy(true);
    setError('');
    try {
      const res = await api<AskResponse>('/api/alumni-admin/assistant/ask', {
        method: 'POST',
        body: JSON.stringify({
          question: `Confirm ${answer.proposedAction.actionType}`,
          sessionId,
          confirmAction: {
            actionType: answer.proposedAction.actionType,
            preview: answer.proposedAction.preview,
            confirm: true,
          },
        }),
      });
      setAnswer(res);
    } catch (e: any) {
      setError(e?.message || 'Confirm failed');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 p-4 md:p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  const provider = workspace?.provider?.provider;

  return (
    <div className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <PageHeader
        title="Alumni Intelligence Assistant"
        subtitle="Grounded, permission-aware answers over C1–C7. AI is never a source of truth."
      />

      <div className="flex flex-wrap gap-2">
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin">Alumni</Link>
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/crm">CRM</Link>
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/intelligence">Intelligence</Link>
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/matching">Matching</Link>
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/impact">Impact</Link>
        <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted bg-surface-muted" to="/alumni-admin/assistant">Assistant</Link>
      </div>

      <Surface className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Provider</span>
          <StatusPill tone={provider?.status === 'VALIDATED' ? 'success' : 'muted'}>
            {provider?.status || 'NOT_CONFIGURED'}
          </StatusPill>
          <span className="text-muted">Mode READ_ONLY default</span>
          {contextAlumni ? <StatusPill tone="accent">Context alumni #{contextAlumni}</StatusPill> : null}
        </div>
        <p className="text-sm text-muted">
          Distinctions: FACT · SYSTEM EVIDENCE · AI-GENERATED SUMMARY · DRAFT ACTION
        </p>
      </Surface>

      {error ? (
        <Surface className="border-danger/40 bg-danger/5 p-3 text-sm text-danger">{error}</Surface>
      ) : null}

      <Surface className="space-y-3 p-4">
        <label className="block text-sm font-medium">Question</label>
        <textarea
          className="min-h-[96px] w-full rounded-[var(--radius-md)] border border-border bg-background px-3 py-2 text-sm"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about alumni, matching, impact, evidence gaps…"
        />
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy || !question.trim()} onClick={() => ask()}>
            {busy ? 'Working…' : 'Ask'}
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {(workspace?.suggestedQueries || []).slice(0, 6).map((q: string) => (
            <button
              key={q}
              type="button"
              className="rounded-full border border-border px-3 py-1 text-left text-xs hover:bg-surface-muted"
              onClick={() => ask(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </Surface>

      {answer ? (
        <div className="grid gap-4 md:grid-cols-5">
          <Surface className="space-y-3 p-4 md:col-span-3">
            <div className="flex flex-wrap gap-2 text-xs">
              {(answer.kinds || []).map((k) => (
                <StatusPill key={k} tone="muted">{k}</StatusPill>
              ))}
              <StatusPill tone="accent">{answer.intent}</StatusPill>
            </div>
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{answer.summary}</div>
            {answer.blocked ? (
              <p className="text-sm text-danger">{answer.blocked.reason}</p>
            ) : null}
            {answer.proposedAction ? (
              <div className="rounded-[var(--radius-md)] border border-border bg-surface-muted p-3 text-sm">
                <div className="font-medium">DRAFT ACTION — {answer.proposedAction.actionType}</div>
                <p className="text-muted">Requires explicit confirm. Cancel by asking something else.</p>
                <Button className="mt-2" disabled={busy} onClick={confirmDraft}>
                  Confirm draft
                </Button>
              </div>
            ) : null}
            {answer.followUps?.length ? (
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-wide text-muted">Follow-up</div>
                {answer.followUps.map((f) => (
                  <button key={f} type="button" className="block text-left text-sm text-primary underline" onClick={() => ask(f)}>
                    {f}
                  </button>
                ))}
              </div>
            ) : null}
          </Surface>

          <div className="space-y-4 md:col-span-2">
            <Surface className="space-y-2 p-4">
              <div className="text-sm font-medium">Data quality</div>
              <StatusPill tone={answer.dataQuality.level === 'HIGH' ? 'success' : answer.dataQuality.level === 'INSUFFICIENT' ? 'danger' : 'warning'}>
                {answer.dataQuality.level}
              </StatusPill>
              <ul className="list-disc space-y-1 pl-4 text-xs text-muted">
                {(answer.dataQuality.reasons || []).map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </Surface>

            <Surface className="space-y-2 p-4">
              <div className="text-sm font-medium">Evidence / sources</div>
              <div className="flex flex-wrap gap-2">
                {(answer.sources || []).map((s) =>
                  s.href ? (
                    <Link key={`${s.type}-${s.label}`} className="rounded-full border border-border px-2 py-1 text-xs hover:bg-surface-muted" to={s.href}>
                      {s.label}
                    </Link>
                  ) : (
                    <span key={`${s.type}-${s.label}`} className="rounded-full border border-border px-2 py-1 text-xs">
                      {s.label}
                    </span>
                  ),
                )}
              </div>
              <ul className="space-y-1 text-xs text-muted">
                {(answer.evidence || []).slice(0, 8).map((e, i) => (
                  <li key={i}>
                    {String(e.module)} · {String(e.kind)}
                    {e.id != null ? ` · ${String(e.id)}` : ''}
                  </li>
                ))}
              </ul>
              <div className="text-xs text-muted">Tools: {(answer.toolsUsed || []).join(', ') || '—'}</div>
            </Surface>

            <Surface className="space-y-2 p-4">
              <div className="text-sm font-medium">Facts</div>
              <ul className="space-y-2 text-sm">
                {(answer.facts || []).slice(0, 12).map((f, i) => (
                  <li key={i} className="border-b border-border/60 pb-2 last:border-0">
                    {String(f.summary || JSON.stringify(f).slice(0, 200))}
                  </li>
                ))}
              </ul>
            </Surface>
          </div>
        </div>
      ) : null}
    </div>
  );
}
