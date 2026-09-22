import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { Button, PageHeader, Skeleton, Surface } from '../../components/ui';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { formatDate } from '../../lib/utils';

type Exam = {
  id: number;
  name: string;
  code: string;
  examType: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  subjects: Array<{
    id: number;
    courseName: string;
    courseCode: string;
    examDate: string | null;
    startTime: string | null;
    status: string;
  }>;
};

type Duty = {
  dutyDate: string;
  startTime: string;
  roomCode: string;
  courseName: string;
  role: string;
  examName: string;
};

type MarkRow = {
  studentId: number;
  studentName: string;
  usn: string;
  marks: number | null;
  status: string;
};

type CoeDashboard = {
  kpis: Record<string, number>;
  examsByStatus: Record<string, number>;
  eligibilityByStatus: Record<string, number>;
  marksSheetsByStatus: Record<string, number>;
  revaluationsByStatus: Record<string, number>;
  readiness?: {
    governanceType: string;
    status: 'READY' | 'WARNING' | 'BLOCKED';
    score: number;
    checks: Array<{ label: string; status: 'READY' | 'WARNING' | 'BLOCKED'; actual: number; expected: number; note?: string }>;
  };
  capabilities?: {
    governanceType: string;
    capabilities: Array<{ capabilityKey: string; name: string; ownership: string; sourceOfTruth: string; enabled: boolean }>;
  };
  recentExams: Exam[];
  upcomingSubjects: Array<{
    id: number;
    examId: number;
    examName: string;
    courseCode: string | null;
    courseName: string | null;
    examDate: string | null;
    startTime: string | null;
    status: string;
    seatsLocked: boolean;
  }>;
};

type QuestionPaperStatus = {
  total: number;
  governanceType?: string;
  ownership?: string | null;
  byStatus: Record<string, number>;
  papers: Array<{
    id: number;
    title: string;
    status: string;
    examType: string;
    examDate: string | null;
    courseCode: string | null;
    courseName: string | null;
    totalMarks: number | null;
    durationMinutes: number | null;
  }>;
};

function statusList(items: Record<string, number>) {
  const entries = Object.entries(items);
  if (!entries.length) return <p className="text-sm text-ink-muted">No records yet.</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <span key={key} className="rounded-full border border-border px-3 py-1 text-xs text-ink-secondary">
          {key}: <span className="font-semibold text-ink">{value}</span>
        </span>
      ))}
    </div>
  );
}

export function CoeDashboardPage() {
  useDocumentTitle('COE Dashboard');
  const [dashboard, setDashboard] = useState<CoeDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<CoeDashboard>('/api/examinations/dashboard')
      .then(setDashboard)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!dashboard) return <p className="text-danger">COE dashboard is unavailable.</p>;

  const kpis = [
    ['Active exams', dashboard.kpis.activeExams],
    ['Scheduled subjects', dashboard.kpis.scheduledSubjects],
    ['Unscheduled subjects', dashboard.kpis.unscheduledSubjects],
    ['Pending eligibility', dashboard.kpis.pendingEligibility],
    ['Locked marks sheets', dashboard.kpis.lockedMarksSheets],
    ['Unlocked marks sheets', dashboard.kpis.unlockedMarksSheets],
    ['Pending revaluations', dashboard.kpis.pendingRevaluations],
    ['Question papers ready', dashboard.kpis.questionPapersReady],
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="COE Dashboard" subtitle="Exam office operations, readiness, and result controls" />
      <Surface>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-ink-muted">Governance</p>
            <p className="text-lg font-semibold text-ink">{dashboard.capabilities?.governanceType?.replace('_', ' ') ?? 'Institutional'}</p>
          </div>
          <div className="min-w-40">
            <p className="text-sm text-ink-muted">Readiness</p>
            <p className="text-lg font-semibold text-ink">
              {dashboard.readiness?.score ?? 0}% · {dashboard.readiness?.status ?? 'BLOCKED'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          {(dashboard.readiness?.checks ?? []).map((check) => (
            <div key={check.label} className="rounded-[var(--radius-md)] border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-ink">{check.label}</p>
                <span className="text-xs text-ink-muted">{check.status}</span>
              </div>
              <p className="mt-1 text-xs text-ink-muted">
                {check.actual}/{check.expected || 0}
                {check.note ? ` · ${check.note}` : ''}
              </p>
            </div>
          ))}
        </div>
      </Surface>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(([label, value]) => (
          <Surface key={label}>
            <p className="text-sm text-ink-muted">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-ink">{value ?? 0}</p>
          </Surface>
        ))}
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Surface>
          <p className="mb-3 font-medium">Upcoming timetable</p>
          <div className="space-y-3">
            {dashboard.upcomingSubjects.map((subject) => (
              <div key={subject.id} className="rounded-[var(--radius-md)] border border-border p-3">
                <p className="font-medium">{subject.courseName || subject.courseCode || 'Subject'}</p>
                <p className="text-sm text-ink-muted">
                  {subject.examName} · {subject.examDate ? formatDate(subject.examDate) : 'Unscheduled'} ·{' '}
                  {subject.startTime ? String(subject.startTime).slice(0, 5) : 'Time pending'} · {subject.status}
                </p>
              </div>
            ))}
            {dashboard.upcomingSubjects.length === 0 ? <p className="text-sm text-ink-muted">No upcoming exam subjects.</p> : null}
          </div>
        </Surface>
        <Surface>
          <p className="mb-3 font-medium">Operational status</p>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm text-ink-muted">Exams</p>
              {statusList(dashboard.examsByStatus)}
            </div>
            <div>
              <p className="mb-2 text-sm text-ink-muted">Eligibility</p>
              {statusList(dashboard.eligibilityByStatus)}
            </div>
            <div>
              <p className="mb-2 text-sm text-ink-muted">Marks sheets</p>
              {statusList(dashboard.marksSheetsByStatus)}
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}

export function CoeQuestionPapersPage() {
  useDocumentTitle('Question Papers');
  const [status, setStatus] = useState<QuestionPaperStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<QuestionPaperStatus>('/api/examinations/question-papers/status')
      .then(setStatus)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Question Papers" subtitle="Confidential readiness tracking without exposing paper contents" />
      <Surface>
        <p className="text-sm text-ink-muted">Authority</p>
        <p className="mt-1 font-medium text-ink">
          {status?.governanceType?.replace('_', ' ') ?? 'Institutional'} · {status?.ownership ?? 'INSTITUTIONAL'}
        </p>
      </Surface>
      <Surface>
        <p className="mb-3 font-medium">Readiness by status</p>
        {statusList(status?.byStatus ?? {})}
      </Surface>
      <div className="grid gap-3">
        {(status?.papers ?? []).map((paper) => (
          <Surface key={paper.id}>
            <p className="font-medium">{paper.title}</p>
            <p className="text-sm text-ink-muted">
              {paper.courseCode || paper.courseName || 'Course'} · {paper.examType} · {paper.status}
              {paper.examDate ? ` · ${formatDate(paper.examDate)}` : ''}
            </p>
          </Surface>
        ))}
        {status?.papers.length === 0 ? <p className="text-sm text-ink-muted">No internal question papers found.</p> : null}
      </div>
    </div>
  );
}

export function CoeStatusPage({ title, subtitle }: { title: string; subtitle: string }) {
  useDocumentTitle(title);
  const [dashboard, setDashboard] = useState<CoeDashboard | null>(null);
  const [revaluations, setRevaluations] = useState<{ requests: Array<{ id: number; studentName: string; usn: string; courseCode: string; requestType: string; status: string }> } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<CoeDashboard>('/api/examinations/dashboard').then(setDashboard),
      api<{ requests: Array<{ id: number; studentName: string; usn: string; courseCode: string; requestType: string; status: string }> }>('/api/examinations/revaluation').then(setRevaluations).catch(() => null),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={title} subtitle={subtitle} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Surface>
          <p className="mb-3 font-medium">Exam status</p>
          {statusList(dashboard?.examsByStatus ?? {})}
        </Surface>
        <Surface>
          <p className="mb-3 font-medium">Eligibility status</p>
          {statusList(dashboard?.eligibilityByStatus ?? {})}
        </Surface>
        <Surface>
          <p className="mb-3 font-medium">Marks status</p>
          {statusList(dashboard?.marksSheetsByStatus ?? {})}
        </Surface>
        <Surface>
          <p className="mb-3 font-medium">Revaluation status</p>
          {statusList(dashboard?.revaluationsByStatus ?? {})}
        </Surface>
      </div>
      <Surface>
        <p className="mb-3 font-medium">Recent revaluation requests</p>
        <div className="space-y-2">
          {(revaluations?.requests ?? []).slice(0, 8).map((request) => (
            <div key={request.id} className="flex flex-col gap-1 border-t border-border py-2 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-medium">{request.studentName} · {request.usn}</span>
              <span className="text-sm text-ink-muted">{request.courseCode} · {request.requestType} · {request.status}</span>
            </div>
          ))}
          {revaluations?.requests.length === 0 ? <p className="text-sm text-ink-muted">No revaluation requests.</p> : null}
        </div>
      </Surface>
    </div>
  );
}

type ImportBatch = { id:number; artifactType:string; fileName:string; fileHash:string; authority:string; validationState:string; reconciliationState:string; importedAt:string; rows:Array<{id:number;row_number:number;status:string;issues:unknown}> };
type RegistrationRow = { id:number; studentName:string; usn:string; semester:string; courseCode:string; courseName:string; eligibilityStatus:string; status:string; attemptType:string };
type OperationsReadback = { packets:Array<Record<string,unknown>&{id:number;packet_reference:string;seal_status:string;status:string;timeline:Array<{id:number;action:string;created_at:string}>}>; formA:Array<Record<string,unknown>&{id:number;status:string}>; mpc:Array<Record<string,unknown>&{id:number;status:string;decision?:string}>; answerBooks:Array<Record<string,unknown>&{id:number;series:string;variance:number}>; scripts:Array<Record<string,unknown>&{id:number;reference:string;stage:string;variance:number}> };

export function CoeOperationsPage() {
  useDocumentTitle('Exam Operations');
  const [artifactType,setArtifactType]=useState('VTU_TIMETABLE'); const [examCycle,setExamCycle]=useState(''); const [file,setFile]=useState<File|null>(null);
  const [preview,setPreview]=useState<{summary:Record<string,number>;rows:Array<{status:string;issues:string[];normalized:Record<string,unknown>}>;fileHash?:string}|null>(null);
  const [batches,setBatches]=useState<ImportBatch[]>([]); const [registrations,setRegistrations]=useState<RegistrationRow[]>([]); const [ops,setOps]=useState<OperationsReadback|null>(null); const [loading,setLoading]=useState(true); const [message,setMessage]=useState('');
  const [selected,setSelected]=useState<number[]>([]); const [bulkResult,setBulkResult]=useState<{succeeded:number;failed:number;results:Array<{id:number;ok:boolean;error?:string}>}|null>(null);
  const toggle=(id:number)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id]);
  const bulkDecide=async(decision:'VERIFIED'|'APPROVED'|'REJECTED')=>{if(!selected.length)return;let reason:string|undefined;if(decision==='REJECTED'){reason=window.prompt('Rejection reason (applied to all)')||'';if(!reason)return;}try{const res=await api<{succeeded:number;failed:number;results:Array<{id:number;ok:boolean;error?:string}>}>('/api/examinations/registrations/bulk-decision',{method:'POST',body:JSON.stringify({registrationIds:selected,decision,reason})});setBulkResult(res);setMessage(`Bulk ${decision}: ${res.succeeded} succeeded, ${res.failed} failed`);setSelected([]);await load();}catch(e){setMessage(e instanceof Error?e.message:'Bulk decision failed')}};
  const load=()=>Promise.all([api<{batches:ImportBatch[]}>(`/api/examinations/imports/vtu/batches?artifactType=${artifactType}`).then(d=>setBatches(d.batches)),api<{registrations:RegistrationRow[]}>('/api/examinations/registrations?page=1&pageSize=25').then(d=>setRegistrations(d.registrations)),api<OperationsReadback>('/api/examinations/operations/readback').then(setOps)]).finally(()=>setLoading(false));
  useEffect(()=>{void load()},[artifactType]);
  const encoded=async()=>{if(!file)throw new Error('Choose a CSV or XLSX file');const bytes=new Uint8Array(await file.arrayBuffer());let binary='';bytes.forEach(b=>{binary+=String.fromCharCode(b)});return btoa(binary)};
  const upload=async(commit:boolean)=>{try{const fileBase64=await encoded();const body={artifactType,fileName:file!.name,fileBase64,examCycle:examCycle||undefined};if(commit&&!window.confirm('Commit as VTU / EXTERNAL UNIVERSITY authoritative data?'))return;const result=await api<any>(`/api/examinations/imports/vtu/file/${commit?'commit':'preview'}`,{method:'POST',body:JSON.stringify(body)});setPreview(result);setMessage(commit?'Committed. Server readback refreshed.':'Preview generated. No data committed.');if(commit)await load()}catch(e){setMessage(e instanceof Error?e.message:'Import failed')}};
  const decide=async(id:number,decision:'VERIFIED'|'APPROVED'|'REJECTED')=>{const reason=decision==='REJECTED'?window.prompt('Rejection reason')||'':'';if(decision==='REJECTED'&&!reason)return;await api(`/api/examinations/registrations/${id}/decision`,{method:'POST',body:JSON.stringify({decision,reason:reason||undefined})});await load()};
  if(loading)return <Skeleton className="h-48 w-full"/>;
  return <div className="animate-fade-in space-y-6"><PageHeader title="Exam Operations" subtitle="VTU reconciliation, registration, custody, attendance, cases, inventory, and valuation"/>
    {message?<p className="text-sm text-ink-secondary" role="status">{message}</p>:null}
    <Surface><h2 className="font-semibold">VTU Import & Reconciliation</h2><p className="mt-1 text-sm text-ink-muted">Authority: VTU / External University</p><div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_2fr_auto_auto]">
      <select className="rounded border border-border bg-surface px-3 py-2" value={artifactType} onChange={e=>setArtifactType(e.target.value)}>{['VTU_TIMETABLE','VTU_REGISTRATION','VTU_RESULT','VTU_REVALUATION'].map(x=><option key={x}>{x}</option>)}</select>
      <input className="rounded border border-border bg-surface px-3 py-2" placeholder="Exam cycle" value={examCycle} onChange={e=>setExamCycle(e.target.value)}/><input type="file" accept=".csv,.xlsx" onChange={e=>setFile(e.target.files?.[0]||null)} className="text-sm"/><Button size="sm" variant="secondary" onClick={()=>upload(false)}>Preview</Button><Button size="sm" onClick={()=>upload(true)}>Commit</Button></div>
      {preview?<div className="mt-4"><div className="flex flex-wrap gap-3 text-sm">{Object.entries(preview.summary||{}).map(([k,v])=><span key={k}>{k}: <strong>{v}</strong></span>)}</div><div className="mt-3 max-h-64 overflow-auto"><table className="min-w-[720px] w-full text-sm"><thead><tr><th className="text-left">State</th><th className="text-left">Normalized row</th><th className="text-left">Issues</th></tr></thead><tbody>{preview.rows.map((r,i)=><tr className="border-t border-border" key={i}><td className="py-2">{r.status}</td><td className="py-2">{JSON.stringify(r.normalized)}</td><td className="py-2 text-danger">{r.issues.join(', ')||'None'}</td></tr>)}</tbody></table></div></div>:null}
      <div className="mt-5 overflow-x-auto"><table className="min-w-[760px] w-full text-sm"><thead><tr>{['Batch','File','Hash','Validation','Reconciliation','Authority','Imported'].map(h=><th className="text-left" key={h}>{h}</th>)}</tr></thead><tbody>{batches.map(b=><tr className="border-t border-border" key={b.id}><td className="py-2">{b.id}</td><td>{b.fileName}</td><td className="font-mono text-xs">{b.fileHash.slice(0,12)}...</td><td>{b.validationState}</td><td>{b.reconciliationState}</td><td>{b.authority}</td><td>{formatDate(b.importedAt)}</td></tr>)}</tbody></table></div></Surface>
    <Surface><div className="flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Registration Queue</h2>{selected.length?<div className="flex items-center gap-2 text-sm"><span className="text-ink-muted">{selected.length} selected</span><button className="text-accent" onClick={()=>bulkDecide('VERIFIED')}>Bulk Verify</button><button className="text-accent" onClick={()=>bulkDecide('APPROVED')}>Bulk Approve</button><button className="text-danger" onClick={()=>bulkDecide('REJECTED')}>Bulk Reject</button></div>:null}</div>
      {bulkResult?<div className="mt-2 rounded border border-border p-2 text-xs"><p>Per-record outcome: <strong className="text-success">{bulkResult.succeeded} succeeded</strong>, <strong className="text-danger">{bulkResult.failed} failed</strong></p>{bulkResult.results.filter(r=>!r.ok).map(r=><p key={r.id} className="text-danger">#{r.id}: {r.error}</p>)}</div>:null}
      <div className="mt-3 overflow-x-auto"><table className="min-w-[960px] w-full text-sm"><thead><tr><th className="text-left"><input type="checkbox" aria-label="Select all" checked={registrations.length>0&&selected.length===registrations.length} onChange={e=>setSelected(e.target.checked?registrations.map(r=>r.id):[])}/></th>{['USN','Student','Course','Eligibility','Attempt','Status','Actions'].map(h=><th className="text-left" key={h}>{h}</th>)}</tr></thead><tbody>{registrations.map(r=><tr className="border-t border-border" key={r.id}><td className="py-2"><input type="checkbox" aria-label={`Select ${r.usn}`} checked={selected.includes(r.id)} onChange={()=>toggle(r.id)}/></td><td className="py-2">{r.usn}</td><td>{r.studentName}</td><td>{r.courseCode}</td><td>{r.eligibilityStatus}</td><td>{r.attemptType}</td><td>{r.status}</td><td className="space-x-2"><button className="text-accent" onClick={()=>decide(r.id,'VERIFIED')}>Verify</button><button className="text-accent" onClick={()=>decide(r.id,'APPROVED')}>Approve</button><button className="text-danger" onClick={()=>decide(r.id,'REJECTED')}>Reject</button></td></tr>)}</tbody></table></div></Surface>
    <div className="grid gap-4 lg:grid-cols-2"><Surface><h2 className="font-semibold">Strong Room</h2>{(ops?.packets||[]).map(p=><div className="border-t border-border py-2 first:border-0" key={p.id}><p>{p.packet_reference} · {p.seal_status}</p><p className="text-sm text-ink-muted">{p.timeline.map(e=>e.action).join(' → ')||p.status}</p></div>)}</Surface><Surface><h2 className="font-semibold">Form-A & MPC</h2><p className="mt-2 text-sm">Form-A sessions: {ops?.formA.length||0}</p><p className="text-sm">MPC cases: {ops?.mpc.length||0}</p></Surface><Surface><h2 className="font-semibold">Answer Books</h2>{(ops?.answerBooks||[]).map(b=><p className="border-t border-border py-2 first:border-0" key={b.id}>{b.series} · Variance {b.variance}</p>)}</Surface><Surface><h2 className="font-semibold">Script Custody</h2>{(ops?.scripts||[]).map(s=><p className="border-t border-border py-2 first:border-0" key={s.id}>{s.reference} · {s.stage} · Variance {s.variance}</p>)}</Surface></div>
  </div>;
}

export function ExaminationsAdminPage({ basePath = '/examinations' }: { basePath?: string }) {
  useDocumentTitle('Examinations');
  const navigate = useNavigate();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ exams: Exam[] }>('/api/examinations')
      .then((d) => setExams(d.exams))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Examinations" subtitle="Schedule exams, eligibility, rooms, marks, and results" />
      <div className="grid gap-3">
        {exams.map((e) => (
          <Surface key={e.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold">{e.name}</p>
              <p className="text-sm text-ink-muted">
                {e.code} · {e.examType} · {e.status}
              </p>
              {e.startDate && (
                <p className="text-sm text-ink-muted">
                  {formatDate(e.startDate)}
                  {e.endDate ? ` – ${formatDate(e.endDate)}` : ''}
                </p>
              )}
            </div>
            <Button size="sm" onClick={() => navigate(`${basePath}/${e.id}`)}>
              Manage
            </Button>
          </Surface>
        ))}
        {exams.length === 0 && <p className="text-sm text-ink-muted">No examinations created yet.</p>}
      </div>
    </div>
  );
}

export function ExaminationDetailPage({ basePath = '/examinations' }: { basePath?: string }) {
  const { examId } = useParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  useDocumentTitle(exam?.name ?? 'Examination');

  const load = () => {
    api<Exam>(`/api/examinations/${examId}`)
      .then(setExam)
      .finally(() => setLoading(false));
  };

  useEffect(load, [examId]);

  const run = async (path: string, label: string) => {
    try {
      await api(`/api/examinations/${examId}${path}`, { method: 'POST' });
      alert(`${label} completed`);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!exam) return <p className="text-danger">Exam not found</p>;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={exam.name} subtitle={`${exam.code} · ${exam.status}`} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => run('/eligibility/compute', 'Eligibility computation')}>
          Compute eligibility
        </Button>
        <Button size="sm" variant="secondary" onClick={() => run('/results/process', 'Result processing')}>
          Process results
        </Button>
        <Button size="sm" onClick={() => run('/results/publish', 'Result publication')}>
          Publish results
        </Button>
      </div>
      <Surface>
        <p className="mb-3 font-medium">Scheduled subjects</p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-ink-muted">
              <tr>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Time</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exam.subjects.map((s) => (
                <tr key={s.id} className="border-t border-border/60">
                  <td className="py-2 pr-4">
                    {s.courseName}
                    <div className="text-ink-muted">{s.courseCode}</div>
                  </td>
                  <td className="py-2 pr-4">{s.examDate ? formatDate(s.examDate) : '—'}</td>
                  <td className="py-2 pr-4">{s.startTime ? String(s.startTime).slice(0, 5) : '—'}</td>
                  <td className="py-2">
                    <Link className="text-accent hover:underline" to={`${basePath}/subjects/${s.id}/marks`}>
                      Marks
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}

export function ExamMarksEntryPage() {
  const { examSubjectId } = useParams();
  const [rows, setRows] = useState<MarkRow[]>([]);
  const [sheetStatus, setSheetStatus] = useState('');
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  useDocumentTitle('Marks Entry');

  const load = () => {
    api<{ marks: MarkRow[]; sheet: { status: string; locked: boolean } }>(
      `/api/examinations/subjects/${examSubjectId}/marks`,
    )
      .then((d) => {
        setRows(d.marks);
        setSheetStatus(d.sheet.status);
        setLocked(d.sheet.locked);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, [examSubjectId]);

  const save = async () => {
    await api(`/api/examinations/subjects/${examSubjectId}/marks`, {
      method: 'PUT',
      body: JSON.stringify({
        entries: rows.map((r) => ({ studentId: r.studentId, marks: r.marks, status: r.status })),
      }),
    });
    load();
  };

  const action = async (path: string) => {
    await api(`/api/examinations/subjects/${examSubjectId}/marks/${path}`, { method: 'POST' });
    load();
  };

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Marks Entry" subtitle={`Sheet: ${sheetStatus}${locked ? ' (locked)' : ''}`} />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={save} disabled={locked}>
          Save
        </Button>
        <Button size="sm" variant="secondary" onClick={() => action('submit')} disabled={locked}>
          Submit
        </Button>
        <Button size="sm" variant="secondary" onClick={() => action('verify')} disabled={locked}>
          Verify
        </Button>
        <Button size="sm" variant="secondary" onClick={() => action('lock')} disabled={locked}>
          Lock
        </Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="min-w-[640px] w-full text-sm">
          <thead className="bg-surface-2 text-left text-ink-muted">
            <tr>
              <th className="px-3 py-2">USN</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Marks</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.studentId} className="border-t border-border">
                <td className="px-3 py-2">{r.usn}</td>
                <td className="px-3 py-2">{r.studentName}</td>
                <td className="px-3 py-2">
                  <input
                    type="number"
                    className="w-20 rounded border border-border bg-surface px-2 py-1"
                    value={r.marks ?? ''}
                    disabled={locked}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) =>
                          x.studentId === r.studentId ? { ...x, marks: e.target.value ? Number(e.target.value) : null } : x,
                        ),
                      )
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    className="rounded border border-border bg-surface px-2 py-1"
                    value={r.status}
                    disabled={locked}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((x) => (x.studentId === r.studentId ? { ...x, status: e.target.value } : x)),
                      )
                    }
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="MALPRACTICE">Malpractice</option>
                    <option value="WITHHELD">Withheld</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function FacultyExamDutiesPage() {
  useDocumentTitle('Exam Duties');
  const [duties, setDuties] = useState<Duty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ duties: Duty[] }>('/api/examinations/faculty/my-duties')
      .then((d) => setDuties(d.duties))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Skeleton className="h-40 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Exam Duties" subtitle="Invigilation and examination responsibilities" />
      {duties.length === 0 ? (
        <p className="text-sm text-ink-muted">No examination duties assigned.</p>
      ) : (
        <div className="grid gap-3">
          {duties.map((d, i) => (
            <Surface key={i}>
              <p className="font-medium">{d.courseName}</p>
              <p className="text-sm text-ink-muted">
                {formatDate(d.dutyDate)} · {String(d.startTime).slice(0, 5)} · Room {d.roomCode} · {d.role}
              </p>
              <p className="text-sm text-ink-muted">{d.examName}</p>
            </Surface>
          ))}
        </div>
      )}
    </div>
  );
}

type RemunerationItem = {
  id: number;
  sourceType: string;
  sourceReferenceId: number;
  beneficiaryName: string | null;
  employeeNumber: string | null;
  quantity: number;
  rate: number;
  amount: number;
  currency: string;
  status: string;
  financeStatus: string | null;
  postingNumber: string | null;
  approvedAt: string | null;
};

const REMUN_BADGE: Record<string, string> = {
  CALCULATED: 'border-border text-ink-secondary',
  APPROVED: 'border-warning/40 text-warning',
  HANDED_OFF: 'border-success/40 text-success',
  REVERSED: 'border-danger/40 text-danger',
};

/**
 * COE remuneration workspace (§29). COE calculates and approves the duty obligation;
 * the amount is computed server-side. Finance (Accountant) performs the posting — COE
 * only reads the Finance-authoritative status here and never marks anything PAID.
 */
export function CoeRemunerationPage() {
  useDocumentTitle('Examination Remuneration');
  const [items, setItems] = useState<RemunerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({ sourceType: 'VALUATION', sourceReferenceId: '', employeeId: '', quantity: '1', rate: '' });

  const load = () =>
    api<{ items: RemunerationItem[] }>('/api/examinations/remuneration')
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    try {
      await api('/api/examinations/remuneration', {
        method: 'POST',
        body: JSON.stringify({
          sourceType: form.sourceType,
          sourceReferenceId: Number(form.sourceReferenceId),
          employeeId: Number(form.employeeId),
          quantity: Number(form.quantity),
          rate: Number(form.rate),
        }),
      });
      setMessage('Remuneration calculated. The server computed the amount.');
      setForm({ ...form, sourceReferenceId: '', employeeId: '', rate: '' });
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed to create remuneration');
    }
  };

  const approve = async (id: number) => {
    try {
      await api(`/api/examinations/remuneration/${id}/approve`, { method: 'POST' });
      setMessage('Approved. Finance (Accountant) can now post the payable.');
      await load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Approval failed');
    }
  };

  if (loading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title="Examination Remuneration" subtitle="Calculate and approve examiner/invigilation/valuation duty remuneration; Finance posts the payable" />
      {message ? (
        <p className="text-sm text-ink-secondary" role="status">
          {message}
        </p>
      ) : null}
      <Surface>
        <h2 className="font-semibold">New remuneration obligation</h2>
        <p className="mt-1 text-sm text-ink-muted">The amount is computed on the server as quantity × rate; it cannot be set from the browser.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <select className="rounded border border-border bg-surface px-3 py-2" value={form.sourceType} onChange={(e) => setForm({ ...form, sourceType: e.target.value })}>
            {['VALUATION', 'INVIGILATION', 'EXAMINER'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <input className="rounded border border-border bg-surface px-3 py-2" placeholder="Duty reference #" value={form.sourceReferenceId} onChange={(e) => setForm({ ...form, sourceReferenceId: e.target.value })} />
          <input className="rounded border border-border bg-surface px-3 py-2" placeholder="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
          <input className="rounded border border-border bg-surface px-3 py-2" placeholder="Quantity" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
          <input className="rounded border border-border bg-surface px-3 py-2" placeholder="Rate" value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} />
          <Button size="sm" onClick={create}>
            Calculate
          </Button>
        </div>
      </Surface>
      <Surface>
        <h2 className="font-semibold">Remuneration queue</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[900px] w-full text-sm">
            <thead>
              <tr>
                {['Beneficiary', 'Duty', 'Qty', 'Rate', 'Amount', 'Status', 'Finance', 'Actions'].map((h) => (
                  <th key={h} className="pb-2 text-left text-ink-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="py-2">
                    {r.beneficiaryName ?? '—'}
                    {r.employeeNumber ? <span className="text-ink-muted"> · {r.employeeNumber}</span> : null}
                  </td>
                  <td className="py-2">
                    {r.sourceType} #{r.sourceReferenceId}
                  </td>
                  <td className="py-2">{r.quantity}</td>
                  <td className="py-2">{r.rate}</td>
                  <td className="py-2 font-medium">
                    {r.currency} {r.amount}
                  </td>
                  <td className="py-2">
                    <span className={`rounded-full border px-2 py-0.5 text-xs ${REMUN_BADGE[r.status] ?? 'border-border'}`}>{r.status}</span>
                  </td>
                  <td className="py-2 text-ink-secondary">{r.financeStatus ?? '—'}</td>
                  <td className="py-2">
                    {r.status === 'CALCULATED' ? (
                      <button className="text-accent" onClick={() => approve(r.id)}>
                        Approve
                      </button>
                    ) : (
                      <span className="text-ink-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-4 text-center text-ink-muted">
                    No remuneration obligations yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Surface>
    </div>
  );
}
