import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, Field, Input, PageHeader, Select, Surface, Textarea, useToast } from '../../components/ui';
import type { CopoCatalog } from '../../types/copo';

type Textbook = {
  id: number;
  courseId: number;
  courseName?: string | null;
  courseCode?: string | null;
  title: string;
  authors?: string | null;
  edition?: string | null;
  publisher?: string | null;
  year?: number | null;
  isbn?: string | null;
  status: string;
  priority: number;
  isPrimary: boolean;
  sourceFile?: string | null;
  sourceReference?: string | null;
  excerpts?: Array<{ id: number; chapter?: string | null; section?: string | null; pageRange?: string | null; topic?: string | null; excerptText: string }>;
};

const emptyForm = {
  courseId: '',
  title: '',
  authors: '',
  edition: '',
  publisher: '',
  year: '',
  isbn: '',
  status: 'PRESCRIBED',
  priority: '1',
  sourceFile: '',
  sourceReference: '',
};

export function CourseTextbookMasterPage() {
  useDocumentTitle('Course Textbook Master');
  const { toast } = useToast();
  const [books, setBooks] = useState<Textbook[]>([]);
  const [catalog, setCatalog] = useState<CopoCatalog | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [excerpt, setExcerpt] = useState({ chapter: '', section: '', pageRange: '', topic: '', excerptText: '' });
  const [busy, setBusy] = useState(false);

  const load = () =>
    api<{ textbooks: Textbook[] }>('/api/question-papers/textbooks')
      .then((r) => setBooks(r.textbooks || []))
      .catch((e) => toast(e instanceof Error ? e.message : 'Could not load textbooks', 'error'));

  useEffect(() => {
    load();
    api<CopoCatalog>('/api/question-papers/catalog')
      .then(setCatalog)
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.courseId || !form.title.trim()) return;
    setBusy(true);
    try {
      await api('/api/question-papers/textbooks', {
        method: 'POST',
        body: JSON.stringify({
          courseId: Number(form.courseId),
          title: form.title.trim(),
          authors: form.authors || null,
          edition: form.edition || null,
          publisher: form.publisher || null,
          year: form.year ? Number(form.year) : null,
          isbn: form.isbn || null,
          status: form.status,
          priority: Number(form.priority) || 1,
          isPrimary: true,
          sourceFile: form.sourceFile || null,
          sourceReference: form.sourceReference || null,
        }),
      });
      setForm(emptyForm);
      toast('Textbook added to Course Textbook Master', 'success');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save textbook', 'error');
    } finally {
      setBusy(false);
    }
  };

  const addExcerpt = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId || excerpt.excerptText.trim().length < 20) return;
    setBusy(true);
    try {
      await api(`/api/question-papers/textbooks/${selectedId}/excerpts`, {
        method: 'POST',
        body: JSON.stringify({
          chapter: excerpt.chapter || null,
          section: excerpt.section || null,
          pageRange: excerpt.pageRange || null,
          topic: excerpt.topic || null,
          excerptText: excerpt.excerptText.trim(),
        }),
      });
      setExcerpt({ chapter: '', section: '', pageRange: '', topic: '', excerptText: '' });
      toast('Textbook excerpt stored. Solutions can now be grounded in this source.', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not add excerpt', 'error');
    } finally {
      setBusy(false);
    }
  };

  const subjects = catalog?.subjects || [];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Course Textbook Master"
        subtitle="Prescribed textbooks are the only allowed source for model solutions and marking schemes. They are never a source of questions."
        actions={
          <Link to="/previous-year-papers">
            <Button variant="secondary">PYQ library</Button>
          </Link>
        }
      />

      <Surface className="mb-6">
        <h2 className="mb-3 font-semibold">Add prescribed textbook</h2>
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submit}>
          <div className="sm:col-span-2 lg:col-span-3">
            <Field label="Subject">
              <Select required value={form.courseId} onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value }))}>
                <option value="">Select subject</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Title">
              <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </Field>
          </div>
          <Field label="Author(s)">
            <Input value={form.authors} onChange={(e) => setForm((f) => ({ ...f, authors: e.target.value }))} />
          </Field>
          <Field label="Edition">
            <Input value={form.edition} onChange={(e) => setForm((f) => ({ ...f, edition: e.target.value }))} />
          </Field>
          <Field label="Publisher">
            <Input value={form.publisher} onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))} />
          </Field>
          <Field label="Year">
            <Input value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
          </Field>
          <Field label="ISBN">
            <Input value={form.isbn} onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))} />
          </Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
              <option value="PRESCRIBED">Prescribed</option>
              <option value="RECOMMENDED">Recommended</option>
            </Select>
          </Field>
          <Field label="Priority (1 = primary)">
            <Input value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Digital source / file">
              <Input
                placeholder="Path or reference for the approved digital copy"
                value={form.sourceFile}
                onChange={(e) => setForm((f) => ({ ...f, sourceFile: e.target.value }))}
              />
            </Field>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <Button type="submit" disabled={busy}>
              Save textbook
            </Button>
          </div>
        </form>
      </Surface>

      <div className="space-y-3">
        {books.map((b) => (
          <Surface key={b.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase text-ink-muted">
                  {b.courseCode} · {b.courseName} · {b.status}
                  {b.isPrimary ? ' · PRIMARY' : ''}
                </p>
                <p className="mt-1 font-semibold">{b.title}</p>
                <p className="text-sm text-ink-muted">
                  {[b.authors, b.edition, b.publisher, b.year, b.isbn].filter(Boolean).join(' · ') || 'Bibliographic details pending'}
                </p>
              </div>
              <div className="flex gap-2">
                {!b.isPrimary ? (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={busy}
                    onClick={async () => {
                      setBusy(true);
                      try {
                        await api(`/api/question-papers/textbooks/${b.id}/primary`, { method: 'POST' });
                        await load();
                      } catch (err) {
                        toast(err instanceof Error ? err.message : 'Could not mark primary', 'error');
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Mark primary
                  </Button>
                ) : null}
                <Button size="sm" variant="secondary" onClick={() => setSelectedId(b.id)}>
                  Add excerpt
                </Button>
              </div>
            </div>
            {selectedId === b.id ? (
              <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={addExcerpt}>
                <Field label="Chapter">
                  <Input value={excerpt.chapter} onChange={(e) => setExcerpt((x) => ({ ...x, chapter: e.target.value }))} />
                </Field>
                <Field label="Section">
                  <Input value={excerpt.section} onChange={(e) => setExcerpt((x) => ({ ...x, section: e.target.value }))} />
                </Field>
                <Field label="Page range">
                  <Input value={excerpt.pageRange} onChange={(e) => setExcerpt((x) => ({ ...x, pageRange: e.target.value }))} />
                </Field>
                <Field label="Topic">
                  <Input value={excerpt.topic} onChange={(e) => setExcerpt((x) => ({ ...x, topic: e.target.value }))} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Approved excerpt (exam-appropriate source text)">
                    <Textarea
                      required
                      rows={5}
                      value={excerpt.excerptText}
                      onChange={(e) => setExcerpt((x) => ({ ...x, excerptText: e.target.value }))}
                    />
                  </Field>
                </div>
                <p className="sm:col-span-2 text-xs text-ink-muted">
                  Solutions are summarized from this excerpt. Large textbook passages are not copied into student papers.
                </p>
                <div>
                  <Button type="submit" disabled={busy || excerpt.excerptText.trim().length < 20}>
                    Store excerpt
                  </Button>
                </div>
              </form>
            ) : null}
          </Surface>
        ))}
      </div>
    </div>
  );
}
