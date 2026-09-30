import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { StatusPill } from '../lms/studentUi';

type Alumni360 = {
  identity: any;
  academic: any;
  career: { current: any; timeline: any[] };
  higherEducation: any[];
  skillsExpertise: any;
  achievements: { records: any[]; entrepreneurship: any[] };
  interestsAvailability: { willingness: any; capabilities: any[] };
  institutionalRelationship: any;
  crm?: any;
  intelligence?: any;
  engagement?: any;
  matching?: any;
  dataQuality: {
    completeness: { coveragePercent: number; sections: { key: string; label: string; status: string; messages: string[] }[] };
    freshness: { domain: string; state: string; message: string }[];
    attentionRequired: { domain: string; state: string; message: string }[];
  };
  biography?: string | null;
  contributions?: any[];
};

function toneFor(status: string) {
  if (status === 'COMPLETE' || status === 'AUTHORITATIVE' || status === 'VERIFIED_RECENTLY') return 'success' as const;
  if (status === 'PARTIAL' || status === 'NEEDS_UPDATE' || status === 'NEEDS_CONFIRMATION') return 'warning' as const;
  if (status === 'STALE') return 'danger' as const;
  return 'muted' as const;
}

function Section({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group rounded-[var(--radius-lg)] border border-border bg-surface" open={defaultOpen}>
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold marker:content-none [&::-webkit-details-marker]:hidden">
        <span className="flex items-center justify-between gap-3">
          {title}
          <span className="text-xs font-normal text-ink-muted group-open:hidden">Show</span>
          <span className="hidden text-xs font-normal text-ink-muted group-open:inline">Hide</span>
        </span>
      </summary>
      <div className="border-t border-border px-4 py-4">{children}</div>
    </details>
  );
}

function Alumni360View({ data, mode }: { data: Alumni360; mode: 'self' | 'admin' }) {
  const id = data.identity;
  const dq = data.dataQuality;
  return (
    <div className="space-y-4">
      <Surface className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-ink-muted">{mode === 'admin' ? 'Institutional Alumni 360' : 'My Alumni 360'}</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{id.name}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {[id.usn, data.academic.department, data.academic.programme, data.academic.graduationYear].filter(Boolean).join(' · ')}
            </p>
            <p className="mt-2 text-sm">
              {data.career.current
                ? `${data.career.current.designation || 'Role'} at ${data.career.current.organization}`
                : 'Current role not provided'}
              {id.currentLocation ? ` · ${id.currentLocation}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={id.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>{id.verificationStatus}</StatusPill>
            <StatusPill tone="muted">{id.lifecycleState}</StatusPill>
          </div>
        </div>
      </Surface>

      {dq.attentionRequired?.length ? (
        <Surface className="space-y-2 border-warning/30 bg-warning-soft/40">
          <h3 className="text-sm font-semibold">Attention required</h3>
          {dq.attentionRequired.map((a) => (
            <div key={a.domain} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{a.domain}: {a.message}</span>
              <StatusPill tone={toneFor(a.state)}>{a.state.replace(/_/g, ' ')}</StatusPill>
            </div>
          ))}
        </Surface>
      ) : null}

      <Section title="Career timeline" defaultOpen>
        {data.career.timeline.length ? (
          <ol className="space-y-3">
            {data.career.timeline.map((job) => (
              <li key={job.id} className="border-l-2 border-border pl-3">
                <p className="font-medium">{job.designation || 'Role'} · {job.organization}</p>
                <p className="text-sm text-ink-muted">
                  {[job.industry, job.functionalArea, job.location].filter(Boolean).join(' · ')}
                </p>
                <p className="text-xs text-ink-muted">
                  {job.startDate || '?'} → {job.isCurrent ? 'Present' : job.endDate || '?'} · {job.verificationStatus} · {job.sourceType}
                </p>
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-ink-muted">No career history recorded.</p>
        )}
      </Section>

      <Section title="Expertise">
        <div className="flex flex-wrap gap-2">
          {[...(data.skillsExpertise.skills || []), ...(data.skillsExpertise.technologies || []), ...(data.skillsExpertise.domains || [])].map((s: string) => (
            <StatusPill key={s} tone="muted">{s}</StatusPill>
          ))}
          {!data.skillsExpertise.skills?.length && !data.skillsExpertise.technologies?.length ? (
            <p className="text-sm text-ink-muted">Skills not provided.</p>
          ) : null}
        </div>
        {data.skillsExpertise.certifications?.length ? (
          <p className="mt-3 text-sm text-ink-muted">Certifications: {data.skillsExpertise.certifications.join(', ')}</p>
        ) : null}
      </Section>

      <Section title="Achievements & higher education">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-ink-muted">Achievements</p>
            {(data.achievements.records || []).map((a: any) => (
              <p key={a.id} className="mt-2 text-sm">{a.title} <span className="text-ink-muted">({a.achievement_type})</span></p>
            ))}
            {!data.achievements.records?.length ? <p className="mt-2 text-sm text-ink-muted">None recorded.</p> : null}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-ink-muted">Higher education</p>
            {(data.higherEducation || []).map((h: any) => (
              <p key={h.id} className="mt-2 text-sm">{h.program_name || 'Programme'} · {h.institution}</p>
            ))}
            {!data.higherEducation?.length ? <p className="mt-2 text-sm text-ink-muted">None recorded.</p> : null}
          </div>
        </div>
      </Section>

      <Section title="Interests & availability" defaultOpen>
        <div className="grid gap-2 sm:grid-cols-2">
          {Object.entries(data.interestsAvailability.willingness || {})
            .filter(([k, v]) => k.startsWith('openTo') && v != null)
            .map(([k, v]) => (
              <p key={k} className="text-sm">
                {k.replace(/([A-Z])/g, ' $1').replace(/^open To /, 'Open to ')}:{' '}
                <strong>{v ? 'Yes' : 'No'}</strong>
              </p>
            ))}
        </div>
        {!Object.entries(data.interestsAvailability.willingness || {}).some(([k, v]) => k.startsWith('openTo') && v != null) ? (
          <p className="text-sm text-ink-muted">Engagement interests not provided (never inferred).</p>
        ) : null}
        {(data.interestsAvailability.capabilities || []).map((c: any) => (
          <p key={c.id} className="mt-2 text-sm text-ink-muted">{c.domain} capability active</p>
        ))}
      </Section>

      <Section title="Institutional relationship">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          {[
            ['Events attended', data.institutionalRelationship.eventsAttended],
            ['Mentoring interactions', data.institutionalRelationship.mentoringInteractions],
            ['Recruitment interactions', data.institutionalRelationship.recruitmentInteractions],
            ['Internships enabled', data.institutionalRelationship.internshipsEnabled],
            ['Placements supported', data.institutionalRelationship.placementsSupported],
            ['Contributions', data.institutionalRelationship.contributions],
            ['Expert sessions', data.institutionalRelationship.expertSessions],
            ['Projects supported', data.institutionalRelationship.projectsSupported],
            ['Recognition', data.institutionalRelationship.recognitionReceived],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-[var(--radius-md)] border border-border p-3">
              <p className="text-xs text-ink-muted">{label}</p>
              <p className="mt-1 text-lg font-semibold">{value as number}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-ink-muted">
          Last interaction: {data.institutionalRelationship.lastInstitutionalInteraction || 'None recorded'} · All counts trace to source records.
        </p>
      </Section>

      {mode === 'admin' && data.crm?.available ? (
        <>
          <Section title="Relationship status" defaultOpen>
            {data.crm.duplicateContactWarnings?.length ? (
              <div className="mb-3 space-y-1 rounded-[var(--radius-md)] border border-warning/40 bg-warning-soft/30 p-3 text-sm">
                {data.crm.duplicateContactWarnings.map((w: any) => (
                  <p key={w.code + w.message}>{w.message}</p>
                ))}
              </div>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <p>Stage: <strong>{data.crm.relationshipStatus?.stage}</strong></p>
              <p>Status: <strong>{data.crm.relationshipStatus?.status}</strong></p>
              <p>Owner: <strong>{data.crm.relationshipStatus?.ownerName || 'Unassigned'}</strong>
                {data.crm.relationshipStatus?.ownerType ? ` (${data.crm.relationshipStatus.ownerType})` : ''}
              </p>
              <p>Last interaction: {data.crm.relationshipStatus?.lastInteraction || '—'}</p>
              <p>Last meaningful engagement: {data.crm.relationshipStatus?.lastMeaningfulEngagement || '—'}</p>
              <p>Next action: {data.crm.relationshipStatus?.nextActionAt || '—'}</p>
            </div>
            {data.crm.nextBestActions?.length ? (
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold uppercase text-ink-muted">Suggested next actions</p>
                {data.crm.nextBestActions.map((a: any) => (
                  <div key={a.code} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span><strong>{a.action}</strong> — {a.reason}</span>
                    <StatusPill tone={a.priority === 'URGENT' || a.priority === 'HIGH' ? 'warning' : 'muted'}>{a.priority}</StatusPill>
                  </div>
                ))}
              </div>
            ) : null}
          </Section>

          <Section title="Timeline" defaultOpen>
            {(data.crm.timeline || []).length ? (
              <ol className="space-y-3">
                {data.crm.timeline.map((t: any) => (
                  <li key={t.id} className="border-l-2 border-border pl-3 text-sm">
                    <p className="font-medium">{t.summary}</p>
                    <p className="text-xs text-ink-muted">
                      {new Date(t.timestamp).toLocaleString()} · {t.interactionType} · {t.captureMode} · {t.sourceType}
                      {t.actorName ? ` · ${t.actorName}` : ''}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-ink-muted">No timeline items yet.</p>
            )}
          </Section>

          <Section title="Open follow-ups">
            {(data.crm.openFollowups || []).length ? (
              <ul className="space-y-2 text-sm">
                {data.crm.openFollowups.map((f: any) => (
                  <li key={f.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{f.reason} · due {f.dueDate}</span>
                    <StatusPill tone={f.status === 'OVERDUE' ? 'danger' : 'warning'}>{f.status}</StatusPill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No open follow-ups.</p>
            )}
          </Section>

          <Section title="Opportunities">
            {(data.crm.opportunities || []).length ? (
              <ul className="space-y-2 text-sm">
                {data.crm.opportunities.map((o: any) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{o.title} ({o.opportunityType})</span>
                    <StatusPill tone="muted">{o.status}</StatusPill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No CRM opportunities captured.</p>
            )}
          </Section>

          <Section title="Outcomes">
            {(data.crm.outcomes || []).length ? (
              <ul className="space-y-2 text-sm">
                {data.crm.outcomes.map((o: any) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span>{o.title}{o.quantity != null ? ` × ${o.quantity}` : ''}</span>
                    <StatusPill tone={o.verificationStatus === 'VERIFIED' ? 'success' : 'warning'}>{o.verificationStatus}</StatusPill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">No verified or pending outcomes.</p>
            )}
          </Section>
        </>
      ) : null}

      {mode === 'admin' && data.intelligence?.dimensions ? (
        <Section title="Intelligence" defaultOpen>
          <p className="mb-3 text-xs text-ink-muted">{data.intelligence.note}</p>
          <div className="mb-4 grid gap-2 sm:grid-cols-2 text-sm">
            <p>Last contact: {data.intelligence.relationshipContext?.lastContactAt || '—'}</p>
            <p>Owner: {data.intelligence.relationshipContext?.ownerName || 'Unassigned'}</p>
            <p>Open follow-up: {data.intelligence.relationshipContext?.openFollowUp ? 'Yes' : 'No'}</p>
            <p>Active opportunities: {data.intelligence.relationshipContext?.activeOpportunityCount ?? 0}</p>
          </div>
          <div className="space-y-3">
            {data.intelligence.dimensions
              .filter((d: any) => d.evidenceState !== 'INSUFFICIENT_DATA' || d.willingnessState === 'WILLING' || d.willingnessState === 'NOT_WILLING')
              .map((d: any) => (
                <details key={d.dimension} className="rounded-[var(--radius-md)] border border-border p-3">
                  <summary className="cursor-pointer list-none text-sm font-medium">
                    <span className="flex flex-wrap items-center gap-2">
                      <span>{d.dimension.replace(/_/g, ' ')}</span>
                      <StatusPill tone={d.evidenceState === 'STRONG_EVIDENCE' ? 'success' : d.evidenceState === 'INSUFFICIENT_DATA' ? 'muted' : 'warning'}>
                        {d.evidenceState.replace(/_/g, ' ')}
                      </StatusPill>
                      <StatusPill tone={d.willingnessState === 'WILLING' ? 'success' : d.willingnessState === 'NOT_WILLING' ? 'danger' : 'muted'}>
                        {d.willingnessState.replace(/_/g, ' ')}
                      </StatusPill>
                      <StatusPill tone={d.relationshipReadiness === 'DO_NOT_CONTACT' || d.relationshipReadiness === 'ACTIVE_ENGAGEMENT' ? 'warning' : 'muted'}>
                        {d.relationshipReadiness.replace(/_/g, ' ')}
                      </StatusPill>
                    </span>
                  </summary>
                  <div className="mt-3 space-y-2 text-sm">
                    <p className="text-xs font-semibold uppercase text-ink-muted">Why?</p>
                    <ul className="list-disc space-y-1 pl-5">
                      {d.why.map((w: string) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                    {d.cautions?.length ? (
                      <>
                        <p className="text-xs font-semibold uppercase text-ink-muted">Cautions</p>
                        <ul className="list-disc space-y-1 pl-5 text-ink-muted">
                          {d.cautions.map((c: any) => (
                            <li key={c.code || c.label}>{c.label || c}</li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    {d.dataQualityWarnings?.length ? (
                      <p className="text-xs text-warning">Data quality: {d.dataQualityWarnings.join(' · ')}</p>
                    ) : null}
                    <p className="text-xs text-ink-muted">Matrix cell: {d.capabilityIntentCell.replace(/_/g, ' ')}</p>
                  </div>
                </details>
              ))}
          </div>
        </Section>
      ) : null}

      {mode === 'admin' && data.engagement?.available ? (
        <Section title="Engagement" defaultOpen>
          <div className="mb-3 grid gap-2 sm:grid-cols-2 text-sm">
            <p>Programs: {(data.engagement.programsParticipated || []).join(', ') || '—'}</p>
            <p>Opportunities generated: {data.engagement.opportunitiesGenerated ?? 0}</p>
            <p>Email opt-in: {data.engagement.contactPreferences?.email ? 'Yes' : 'No'}</p>
            <p>Global opt-out: {data.engagement.contactPreferences?.globalOptOut ? 'Yes' : 'No'}</p>
          </div>
          {(data.engagement.campaignHistory || []).length ? (
            <ul className="divide-y divide-border text-sm">
              {data.engagement.campaignHistory.slice(0, 10).map((c: any, i: number) => (
                <li key={`${c.campaignName}-${i}`} className="py-2 flex flex-wrap justify-between gap-2">
                  <span>{c.campaignName} · {c.programName}</span>
                  <span className="text-xs text-ink-muted">{c.eligibility} · {c.contactStatus} · {c.funnelStage}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">No campaign history yet.</p>
          )}
          {(data.engagement.suppressions || []).length ? (
            <p className="mt-2 text-xs text-ink-muted">Active suppressions: {data.engagement.suppressions.length}</p>
          ) : null}
          {(data.engagement.recognitionNominations || []).length ? (
            <p className="mt-1 text-xs text-ink-muted">Recognition nominations: {data.engagement.recognitionNominations.length} (C6 handoff)</p>
          ) : null}
        </Section>
      ) : null}

      {mode === 'admin' && data.matching?.available ? (
        <Section title="Matching & Connect" defaultOpen>
          <p className="mb-3 text-xs text-ink-muted">Need-specific matches, shortlists, commitments — links to C2/C4/C5 workflows. Not C3 general intelligence.</p>
          {(data.matching.shortlistedNeeds || []).length ? (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase text-ink-muted">Shortlisted needs</p>
              <ul className="mt-1 space-y-1 text-sm">
                {data.matching.shortlistedNeeds.map((s: any) => (
                  <li key={s.id} className="flex flex-wrap justify-between gap-2">
                    <span>{s.needTitle} ({s.needType})</span>
                    <StatusPill tone="muted">{s.status}</StatusPill>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">No shortlisted connect needs.</p>
          )}
          {(data.matching.currentCommitments || []).length ? (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase text-ink-muted">Current commitments</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                {data.matching.currentCommitments.map((c: string) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {(data.matching.completedSupport || []).length ? (
            <div className="mb-3">
              <p className="text-xs font-semibold uppercase text-ink-muted">Completed / verified support</p>
              <ul className="mt-1 space-y-1 text-sm">
                {data.matching.completedSupport.map((c: any) => (
                  <li key={c.shortlistId}>{c.needTitle} · verified qty {c.verifiedQuantity}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {(data.matching.upcomingEngagements || []).length ? (
            <p className="text-xs text-ink-muted">Upcoming engagements: {data.matching.upcomingEngagements.length}</p>
          ) : null}
          <Link className="mt-2 inline-flex rounded border border-border px-3 py-1.5 text-sm" to="/alumni-admin/matching">Open matching workspace</Link>
        </Section>
      ) : null}

      {mode === 'self' && data.crm?.available ? (
        <Section title="My institutional engagement" defaultOpen>
          <p className="mb-3 text-xs text-ink-muted">{data.crm.note}</p>
          {(data.crm.opportunitiesAccepted || []).length ? (
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase text-ink-muted">Opportunities</p>
              {data.crm.opportunitiesAccepted.map((o: any) => (
                <p key={o.id} className="mt-1 text-sm">{o.title} · {o.status}</p>
              ))}
            </div>
          ) : null}
          {(data.crm.timeline || []).length ? (
            <ol className="space-y-2">
              {data.crm.timeline.slice(0, 12).map((t: any) => (
                <li key={t.id} className="text-sm">
                  <span className="text-ink-muted">{new Date(t.timestamp).toLocaleDateString()}</span> — {t.summary}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink-muted">No engagement activity to show yet.</p>
          )}
          <Link className="mt-3 inline-flex rounded border border-border px-3 py-1.5 text-sm" to="/alumni/preferences">Preference centre</Link>
        </Section>
      ) : null}

      <Section title="Data quality">
        <p className="text-sm">Overall coverage: <strong>{dq.completeness.coveragePercent}%</strong> (section-based, not field-count only)</p>
        <div className="mt-3 space-y-2">
          {dq.completeness.sections.map((s) => (
            <div key={s.key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{s.label}{s.messages[0] ? ` — ${s.messages[0]}` : ''}</span>
              <StatusPill tone={toneFor(s.status)}>{s.status.replace(/_/g, ' ')}</StatusPill>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase text-ink-muted">Freshness</p>
          {dq.freshness.map((f) => (
            <div key={f.domain} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{f.domain}: {f.message}</span>
              <StatusPill tone={toneFor(f.state)}>{f.state.replace(/_/g, ' ')}</StatusPill>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

export function AlumniSelf360Page() {
  useDocumentTitle('My Alumni 360');
  const [data, setData] = useState<Alumni360 | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<Alumni360>('/api/alumni/360')
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, []);
  if (error) return <Surface className="text-sm text-danger">{error}</Surface>;
  if (!data) return <Skeleton className="h-64 w-full" />;
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Alumni 360"
        subtitle="Who I am, my academic connection, career, expertise, and how I can participate."
        actions={<Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni/profile">Update profile</Link>}
      />
      <Alumni360View data={data} mode="self" />
    </div>
  );
}

export function AlumniAdmin360Page() {
  useDocumentTitle('Alumni 360');
  const { id } = useParams();
  const [data, setData] = useState<Alumni360 | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!id) return;
    api<Alumni360>(`/api/alumni-admin/profiles/${id}/360`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'));
  }, [id]);
  if (error) return <div className="p-6"><Surface className="text-sm text-danger">{error}</Surface></div>;
  if (!data) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;
  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Alumni 360"
        subtitle="Institutional view — career, expertise, relationship CRM, timeline, and data quality."
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to={`/alumni-admin/assistant?alumni=${id}&from=ALUMNI_360`}>Ask about this alumnus</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/recognition">Recognition</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/impact">Impact</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/matching">Matching</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/engagement">Engagement</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/intelligence">Intelligence</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin/crm">CRM workspace</Link>
            <Link className="inline-flex items-center rounded-[var(--radius-md)] border border-border px-3 py-2 text-sm font-medium hover:bg-surface-muted" to="/alumni-admin">Back to admin</Link>
          </div>
        }
      />
      <Alumni360View data={data} mode="admin" />
    </div>
  );
}
