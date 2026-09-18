import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, downloadCopoExport } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, Input, PageHeader, Select, StatusBadge, Surface, useToast } from '../../components/ui';

type SheetList = { sheets: Array<{ id: number; title: string; source_kind: string; status: string; frozen: number; courseCode: string }> };
type Catalog = { courses: Array<{ id: number; code: string; name: string }> };
type SheetQuestion = {
  id: number;
  questionKey: string;
  label: string;
  maxMarks: number;
  coCode: string | null;
  questionNumber?: number | null;
  orGroupId?: string | null;
  orAlternative?: string | null;
};
type SheetDetail = {
  sheet: { id: number; title: string; frozen: boolean; status: string; courseCode: string; maxMarks: number };
  questions: SheetQuestion[];
  students: Array<{
    usn: string;
    name: string | null;
    status: string;
    total: number | null;
    marks: Record<string, number | null>;
    statuses?: Record<string, string>;
    attempts?: Record<string, string>;
  }>;
};

type OrSlot = { orGroupId: string; label: string; alternatives: Record<'A' | 'B', SheetQuestion[]> };

function groupQuestions(questions: SheetQuestion[]) {
  const slots: OrSlot[] = [];
  const standalone: SheetQuestion[] = [];
  const index = new Map<string, OrSlot>();
  for (const q of questions) {
    if (q.orGroupId) {
      let slot = index.get(q.orGroupId);
      if (!slot) {
        slot = { orGroupId: q.orGroupId, label: q.questionNumber != null ? `Q${q.questionNumber}` : q.orGroupId, alternatives: { A: [], B: [] } };
        index.set(q.orGroupId, slot);
        slots.push(slot);
      }
      const alt = (String(q.orAlternative || 'A').toUpperCase() === 'B' ? 'B' : 'A') as 'A' | 'B';
      slot.alternatives[alt].push(q);
    } else {
      standalone.push(q);
    }
  }
  return { slots, standalone };
}

export function MarksEntryPage() {
  useDocumentTitle('Question-wise marks');
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [sheets, setSheets] = useState<SheetList['sheets']>([]);
  const [courseId, setCourseId] = useState('');
  const [kind, setKind] = useState('SEE');
  const [active, setActive] = useState<SheetDetail | null>(null);
  const [usn, setUsn] = useState('');
  const [rowMarks, setRowMarks] = useState<Record<string, string>>({});
  const [attempts, setAttempts] = useState<Record<string, 'A' | 'B'>>({});
  const [file, setFile] = useState<string>('');
  const [preview, setPreview] = useState<{ ok: boolean; errorCount: number; issues: Array<{ message: string }> } | null>(null);
  const [busy, setBusy] = useState(false);

  const loadSheets = () =>
    api<SheetList>(`/api/attainment/sheets${courseId ? `?courseId=${courseId}` : ''}`)
      .then((r) => setSheets(r.sheets || []))
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load sheets', 'error'));

  useEffect(() => {
    api<Catalog>('/api/attainment/catalog').then(setCatalog).catch(() => undefined);
  }, []);
  useEffect(() => {
    loadSheets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const open = (id: number) =>
    api<SheetDetail>(`/api/attainment/sheets/${id}`).then(setActive).catch((e) => toast(e instanceof Error ? e.message : 'Could not open', 'error'));

  const create = async () => {
    if (!courseId) return;
    setBusy(true);
    try {
      const created = await api<SheetDetail>('/api/attainment/sheets', {
        method: 'POST',
        body: JSON.stringify({ courseId: Number(courseId), sourceKind: kind }),
      });
      setActive(created);
      await loadSheets();
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not create sheet', 'error');
    } finally {
      setBusy(false);
    }
  };

  const saveRow = async () => {
    if (!active) return;
    const { slots } = groupQuestions(active.questions);
    // For OR slots, only send marks for the attempted alternative; the other is
    // recorded NOT_ATTEMPTED_DUE_TO_OR by the backend (never zero).
    const selectedByGroup = new Map(slots.map((s) => [s.orGroupId, attempts[s.orGroupId]]));
    const orQuestionKeys = new Map<string, 'A' | 'B'>();
    for (const s of slots) {
      for (const alt of ['A', 'B'] as const) {
        for (const q of s.alternatives[alt]) orQuestionKeys.set(q.questionKey, alt);
      }
    }
    const marks: Record<string, number | null> = {};
    for (const q of active.questions) {
      const groupSel = q.orGroupId ? selectedByGroup.get(q.orGroupId) : null;
      if (q.orGroupId && orQuestionKeys.get(q.questionKey) !== groupSel) {
        continue; // unselected alternative — omit so it stays NOT_ATTEMPTED_DUE_TO_OR
      }
      const raw = rowMarks[q.questionKey];
      marks[q.questionKey] = raw === '' || raw == null ? null : Number(raw);
    }
    try {
      await api(`/api/attainment/sheets/${active.sheet.id}/marks`, {
        method: 'POST',
        body: JSON.stringify({ usn, name: null, marks, attempts }),
      });
      setRowMarks({});
      setAttempts({});
      setUsn('');
      await open(active.sheet.id);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save marks', 'error');
    }
  };

  const onFile = async (f: File) => {
                const b64 = await new Promise<string>((resolve, reject) => {
                  const r = new FileReader();
                  r.onload = () => resolve(String(r.result).split(',')[1] || '');
                  r.onerror = () => reject(new Error('Could not read file'));
                  r.readAsDataURL(f);
                });
                setFile(b64);
    if (!active) return;
    const p = await api<{ ok: boolean; errorCount: number; issues: Array<{ message: string }> }>(
      `/api/attainment/sheets/${active.sheet.id}/import/preview`,
      { method: 'POST', body: JSON.stringify({ workbookBase64: b64, fileName: f.name }) },
    );
    setPreview(p);
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        breadcrumb={
          <Link to="/attainment" className="hover:text-accent">
            Attainment
          </Link>
        }
        title="Question-wise marks"
        subtitle="Internal / CIE and SEE marks feed CO attainment. Totals alone are never treated as actual SEE CO scores."
      />

      <Surface className="mb-4 grid gap-3 sm:grid-cols-3">
        <Field label="Course">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">All</option>
            {catalog?.courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} · {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="New sheet type">
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="SEE">SEE totals / question-wise</option>
            <option value="INTERNAL_PAPER">Internal question paper</option>
            <option value="LAB">Laboratory</option>
            <option value="PROJECT">Project</option>
          </Select>
        </Field>
        <div className="flex items-end">
          <Button disabled={busy || !courseId} onClick={create}>
            Create mark sheet
          </Button>
        </div>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-2">
        <Surface>
          <h2 className="mb-3 font-semibold">Sheets</h2>
          <div className="space-y-2">
            {sheets.map((s) => (
              <button key={s.id} type="button" className="block w-full text-left" onClick={() => open(s.id)}>
                <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-sm">
                    {s.courseCode} · {s.title}
                  </span>
                  <StatusBadge status={s.status} />
                </div>
              </button>
            ))}
          </div>
        </Surface>

        {active ? (
          <Surface className="space-y-3 overflow-x-auto">
            <div className="flex justify-between">
              <h2 className="font-semibold">{active.sheet.title}</h2>
              <StatusBadge status={active.sheet.status} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => downloadCopoExport(`/api/attainment/sheets/${active.sheet.id}/template`, 'marks-template.xlsx')}
              >
                Download template
              </Button>
              <label className="text-sm">
                Import Excel
                <input
                  type="file"
                  accept=".xlsx"
                  className="ml-2 text-xs"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(f);
                  }}
                />
              </label>
              {preview && file ? (
                <Button
                  size="sm"
                  disabled={!preview.ok}
                  onClick={async () => {
                    await api(`/api/attainment/sheets/${active.sheet.id}/import`, {
                      method: 'POST',
                      body: JSON.stringify({ workbookBase64: file }),
                    });
                    await open(active.sheet.id);
                    toast('Marks imported');
                  }}
                >
                  Commit import
                </Button>
              ) : null}
              {!active.sheet.frozen ? (
                <Button size="sm" onClick={() => api(`/api/attainment/sheets/${active.sheet.id}/freeze`, { method: 'POST' }).then(() => open(active.sheet.id))}>
                  Freeze sheet
                </Button>
              ) : null}
            </div>
            {preview && !preview.ok ? (
              <ul className="list-disc pl-5 text-sm text-danger">
                {preview.issues.map((i) => (
                  <li key={i.message}>{i.message}</li>
                ))}
              </ul>
            ) : null}
            <div className="space-y-3">
              <Input placeholder="USN" value={usn} onChange={(e) => setUsn(e.target.value)} />
              {(() => {
                const { slots, standalone } = groupQuestions(active.questions);
                return (
                  <>
                    {slots.map((slot) => {
                      const selected = attempts[slot.orGroupId];
                      const altMarks = slot.alternatives.A.reduce((n, q) => n + q.maxMarks, 0);
                      return (
                        <div key={slot.orGroupId} className="rounded-md border border-border p-3">
                          <div className="mb-2 flex items-center gap-4 text-sm font-medium">
                            <span>
                              {slot.label} — {altMarks} Marks (answer one)
                            </span>
                            {(['A', 'B'] as const).map((alt) => (
                              <label key={alt} className="flex items-center gap-1">
                                <input
                                  type="radio"
                                  name={`attempt-${slot.orGroupId}`}
                                  checked={selected === alt}
                                  onChange={() => setAttempts((a) => ({ ...a, [slot.orGroupId]: alt }))}
                                />
                                Alternative {alt}
                              </label>
                            ))}
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {(['A', 'B'] as const).flatMap((alt) =>
                              slot.alternatives[alt].map((q) => {
                                const disabled = selected != null && selected !== alt;
                                return (
                                  <Field key={q.questionKey} label={`${q.label} ${q.coCode || ''} (max ${q.maxMarks})`}>
                                    <Input
                                      disabled={disabled}
                                      value={disabled ? '' : rowMarks[q.questionKey] ?? ''}
                                      onChange={(e) => setRowMarks((m) => ({ ...m, [q.questionKey]: e.target.value }))}
                                      placeholder={disabled ? 'Not attempted (OR)' : 'Marks'}
                                    />
                                  </Field>
                                );
                              }),
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {standalone.length ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {standalone.map((q) => (
                          <Field key={q.questionKey} label={`${q.label} ${q.coCode || ''} (max ${q.maxMarks})`}>
                            <Input
                              value={rowMarks[q.questionKey] ?? ''}
                              onChange={(e) => setRowMarks((m) => ({ ...m, [q.questionKey]: e.target.value }))}
                              placeholder="Marks"
                            />
                          </Field>
                        ))}
                      </div>
                    ) : null}
                  </>
                );
              })()}
              <Button size="sm" variant="secondary" disabled={!usn} onClick={saveRow}>
                Save student row
              </Button>
            </div>
            <table className="min-w-full text-left text-xs">
              <thead>
                <tr>
                  <th className="pb-2">USN</th>
                  {active.questions.map((q) => (
                    <th key={q.questionKey} className="pb-2">
                      {q.label} {q.coCode}
                    </th>
                  ))}
                  <th className="pb-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {active.students.map((s) => (
                  <tr key={s.usn} className="border-t border-border">
                    <td className="py-1">{s.usn}</td>
                    {active.questions.map((q) => {
                      const st = s.statuses?.[q.questionKey];
                      if (st === 'NOT_ATTEMPTED_DUE_TO_OR') {
                        return (
                          <td key={q.questionKey} className="text-muted italic">
                            OR
                          </td>
                        );
                      }
                      return <td key={q.questionKey}>{s.marks[q.questionKey] ?? '—'}</td>;
                    })}
                    <td>{s.total ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Surface>
        ) : null}
      </div>
    </div>
  );
}
