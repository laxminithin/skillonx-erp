import { FormEvent, useState } from 'react';
import { api } from '../../../lib/api';
import { useDocumentTitle } from '../../../lib/useDocumentTitle';
import { Button, Field, PageHeader, Select, Surface, Textarea, useToast } from '../../../components/ui';

type OutcomePreview = {
  code: string;
  status: string;
  existingStatement?: string;
  importedStatement?: string;
};

type Preview = {
  batchId: string;
  fileName?: string;
  summary?: {
    subjectsInFile: number;
    existingSubjectsMatched: number;
    newSubjects: number;
    officialCos: number;
    newCos: number;
    existingCosMatched: number;
    coDifferences: number;
    pos: number;
    newPos: number;
    poDifferences: number;
    mappingRelationships: number;
    newMappings: number;
    changedMappings: number;
    warnings: number;
    errors: number;
    importReadySubjects?: number;
    notImportReadySubjects?: number;
  };
  warnings?: string[];
  errors?: string[];
  preview?: {
    newSubjects: number;
    matchedSubjects: number;
    newCos: number;
    changedCos: number;
    ambiguousMatches: number;
    subjects: Array<{
      code: string;
      name: string;
      matchStatus: string;
      courseId: number | null;
      outcomes: OutcomePreview[];
    }>;
  };
  subjects?: Array<{
    code: string;
    name: string;
    scheme: string;
    program: string;
    importReady: boolean;
    matchStatus: string;
    courseId: number | null;
    outcomes: OutcomePreview[];
  }>;
  programOutcomes?: Array<{
    code: string;
    scheme: string;
    status: string;
    existingStatement?: string;
    importedStatement?: string;
  }>;
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function AdminCopoImportPage() {
  useDocumentTitle('CO–PO Master Import', 'CO–PO');
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [resolutions, setResolutions] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [json, setJson] = useState(`{
  "scheme": { "name": "VTU 2022 Scheme", "code": "VTU-2022", "university": "Visvesvaraya Technological University", "startYear": 2022 },
  "program": { "name": "Information Science and Engineering", "code": "BE-ISE", "degree": "B.E." },
  "sourceLabel": "VTU Official Syllabus",
  "subjects": []
}`);

  const runWorkbookPreview = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast('Choose VTU_CO_PO_MASTER.xlsx first', 'error');
      return;
    }
    setBusy(true);
    try {
      const workbookBase64 = await fileToBase64(file);
      const data = await api<Preview>('/api/copo/import/workbook/preview', {
        method: 'POST',
        body: JSON.stringify({ fileName: file.name, workbookBase64 }),
      });
      setPreview(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Workbook preview failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const runJsonPreview = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = JSON.parse(json);
      const data = await api<Preview>('/api/copo/import/preview', { method: 'POST', body: JSON.stringify(payload) });
      setPreview(data);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Invalid import payload', 'error');
    } finally {
      setBusy(false);
    }
  };

  const commit = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      const items = Object.entries(resolutions).map(([key, action]) => {
        const [courseId, coCode] = key.split(':');
        return { courseId: Number(courseId), coCode, action };
      });
      const path = preview.summary ? '/api/copo/import/workbook/commit' : '/api/copo/import/commit';
      await api(path, {
        method: 'POST',
        body: JSON.stringify({ batchId: preview.batchId, resolutions: items }),
      });
      toast('Verified data imported');
      setPreview(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Commit failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const subjects = preview?.subjects || preview?.preview?.subjects || [];
  const summary = preview?.summary;

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="CO–PO master import"
        subtitle="Excel is the controlled handoff from the slides inventory. Existing official COs and POs are never overwritten silently."
      />

      <form onSubmit={runWorkbookPreview} className="space-y-4">
        <Field label="VTU_CO_PO_MASTER.xlsx">
          <input
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? 'Working…' : 'Validate'}
          </Button>
          <Button type="button" variant="secondary" disabled={!preview} onClick={commit}>
            Import verified data
          </Button>
          {preview?.batchId ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                window.open(`/api/copo/import/workbook/${preview.batchId}/errors.txt`, '_blank');
              }}
            >
              Download error report
            </Button>
          ) : null}
        </div>
      </form>

      <button type="button" className="mt-4 text-sm text-ink-muted underline" onClick={() => setShowJson((v) => !v)}>
        {showJson ? 'Hide JSON fallback' : 'Show JSON fallback'}
      </button>
      {showJson ? (
        <form onSubmit={runJsonPreview} className="mt-3 space-y-4">
          <Field label="Syllabus JSON">
            <Textarea className="min-h-40 font-mono text-xs" value={json} onChange={(e) => setJson(e.target.value)} />
          </Field>
          <Button type="submit" disabled={busy}>
            Preview JSON import
          </Button>
        </form>
      ) : null}

      {preview ? (
        <div className="mt-6 space-y-4">
          <Surface>
            <h2 className="font-medium">CO–PO MASTER IMPORT</h2>
            {summary ? (
              <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                <li>Subjects in File: {summary.subjectsInFile}</li>
                <li>Existing Subjects Matched: {summary.existingSubjectsMatched}</li>
                <li>New Subjects: {summary.newSubjects}</li>
                <li>Official COs: {summary.officialCos}</li>
                <li>New COs: {summary.newCos}</li>
                <li>Existing COs Matched: {summary.existingCosMatched}</li>
                <li>CO Differences: {summary.coDifferences}</li>
                <li>POs: {summary.pos}</li>
                <li>New POs: {summary.newPos}</li>
                <li>PO Differences: {summary.poDifferences}</li>
                <li>Mapping Relationships: {summary.mappingRelationships}</li>
                <li>New Mappings: {summary.newMappings}</li>
                <li>Changed Mappings: {summary.changedMappings}</li>
                <li>Warnings: {summary.warnings}</li>
                <li>Errors: {summary.errors}</li>
                {summary.importReadySubjects != null ? <li>Import-ready subjects: {summary.importReadySubjects}</li> : null}
                {summary.notImportReadySubjects != null ? (
                  <li>Not import-ready subjects: {summary.notImportReadySubjects}</li>
                ) : null}
              </ul>
            ) : (
              <p className="text-sm">
                New subjects: {preview.preview?.newSubjects} · Matched: {preview.preview?.matchedSubjects} · New COs:{' '}
                {preview.preview?.newCos} · Changed COs: {preview.preview?.changedCos} · Ambiguous:{' '}
                {preview.preview?.ambiguousMatches}
              </p>
            )}
            {preview.errors?.length ? (
              <p className="mt-3 text-sm text-danger">Blocking errors must be fixed before verified data can be imported.</p>
            ) : null}
          </Surface>

          {preview.programOutcomes
            ?.filter((o) => o.status === 'CHANGED')
            .map((o) => (
              <Surface key={`${o.scheme}-${o.code}`}>
                <p className="font-medium text-warning">PO difference detected — {o.code}</p>
                <p className="mt-2 text-xs uppercase text-ink-muted">Existing PO</p>
                <p>{o.existingStatement}</p>
                <p className="mt-2 text-xs uppercase text-ink-muted">Excel PO</p>
                <p>{o.importedStatement}</p>
                <p className="mt-2 text-sm">Import of this PO is stopped until the difference is resolved in the official master.</p>
              </Surface>
            ))}

          {subjects.map((subject) => (
            <Surface key={`${subject.code}-${'scheme' in subject ? subject.scheme : ''}`}>
              <h3 className="font-medium">
                {subject.code} — {subject.name}{' '}
                <span className="text-xs text-ink-muted">
                  {subject.matchStatus}
                  {'importReady' in subject && !subject.importReady ? ' · NOT IMPORT READY' : ''}
                </span>
              </h3>
              {subject.outcomes
                .filter((o) => o.status === 'CHANGED')
                .map((o) => {
                  const key = `${subject.courseId}:${o.code}`;
                  return (
                    <div key={o.code} className="mt-3 rounded-[var(--radius-md)] border border-warning/40 p-3 text-sm">
                      <p className="font-medium text-warning">CO difference detected — {o.code}</p>
                      <p className="mt-2 text-xs uppercase text-ink-muted">Existing CO</p>
                      <p>{o.existingStatement}</p>
                      <p className="mt-2 text-xs uppercase text-ink-muted">Excel CO</p>
                      <p>{o.importedStatement}</p>
                      <p className="mt-2 text-xs uppercase text-ink-muted">Source</p>
                      <p>VTU Official Syllabus</p>
                      <Field label="Action">
                        <Select
                          value={resolutions[key] || 'REVIEW_LATER'}
                          onChange={(e) => setResolutions({ ...resolutions, [key]: e.target.value })}
                        >
                          <option value="KEEP_EXISTING">Keep existing</option>
                          <option value="CREATE_NEW_VERSION">Create new version</option>
                          <option value="REVIEW_LATER">Review later</option>
                        </Select>
                      </Field>
                    </div>
                  );
                })}
            </Surface>
          ))}
        </div>
      ) : null}
    </div>
  );
}
