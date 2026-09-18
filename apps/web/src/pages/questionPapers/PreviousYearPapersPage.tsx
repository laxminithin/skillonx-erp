import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FileSearch, Library } from 'lucide-react';
import { api } from '../../lib/api';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { Button, EmptyState, Field, Input, PageHeader, Select, Skeleton, StatusBadge, Surface, useToast } from '../../components/ui';

type Paper = {
  id: number;
  paperId: string;
  subjectName: string;
  courseCode: string;
  scheme?: string | null;
  program?: string | null;
  semester?: string | null;
  examType: string;
  academicYear?: string | null;
  examYear?: number | null;
  examDate?: string | null;
  maxMarks?: number | null;
  durationMinutes?: number | null;
  questionCount: number;
  cos: string[];
  sourceUrl: string;
  extractionStatus?: string | null;
  mappingStatus?: string | null;
  solutionReadiness?: string | null;
  verificationStatus?: string | null;
};

export function PreviousYearPapersPage() {
  useDocumentTitle('Previous Year Question Papers');
  const { toast } = useToast();
  const [params] = useSearchParams();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(params.get('q') || '');
  const [filters, setFilters] = useState({
    courseCode: params.get('courseCode') || '',
    examType: params.get('examType') || '',
    year: params.get('year') || '',
    program: params.get('program') || '',
    semester: params.get('semester') || '',
    scheme: params.get('scheme') || '',
    academicYear: params.get('academicYear') || '',
  });
  const [analytics, setAnalytics] = useState<{ mostRepeatedQuestions: Array<{ text: string; count: number; years: number[] }> } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (q) qs.set('q', q);
      if (filters.courseCode) qs.set('courseCode', filters.courseCode);
      if (filters.examType) qs.set('examType', filters.examType);
      if (filters.year) qs.set('year', filters.year);
      if (filters.program) qs.set('program', filters.program);
      if (filters.semester) qs.set('semester', filters.semester);
      if (filters.scheme) qs.set('scheme', filters.scheme);
      if (filters.academicYear) qs.set('academicYear', filters.academicYear);
      const res = await api<{ papers: Paper[] }>(`/api/question-papers/library${qs.toString() ? `?${qs}` : ''}`);
      setPapers(res.papers || []);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not load papers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    api('/api/question-papers/library/analytics')
      .then((a) => setAnalytics(a as never))
      .catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.courseCode, filters.examType, filters.year, filters.program, filters.semester, filters.scheme, filters.academicYear]);

  const years = useMemo(() => [...new Set(papers.map((p) => p.examYear).filter(Boolean))].sort((a, b) => Number(b) - Number(a)), [papers]);
  const programs = useMemo(() => [...new Set(papers.map((p) => p.program).filter(Boolean))], [papers]);
  const schemes = useMemo(() => [...new Set(papers.map((p) => p.scheme).filter(Boolean))], [papers]);
  const academicYears = useMemo(() => [...new Set(papers.map((p) => p.academicYear).filter(Boolean))], [papers]);
  const libraryTree = useMemo(() => {
    const years = new Map<string, Map<string, Map<string, Map<string, Map<string, Paper[]>>>>>();
    for (const p of papers) {
      const ay = p.academicYear || (p.examYear ? String(p.examYear) : 'Year n/a');
      const sem = p.semester ? `Semester ${p.semester}` : 'Semester n/a';
      const branch = p.program || 'Branch n/a';
      const subject = `${p.courseCode} · ${p.subjectName}`;
      const exam = p.examType || 'Exam';
      if (!years.has(ay)) years.set(ay, new Map());
      const y = years.get(ay)!;
      if (!y.has(sem)) y.set(sem, new Map());
      const s = y.get(sem)!;
      if (!s.has(branch)) s.set(branch, new Map());
      const b = s.get(branch)!;
      if (!b.has(subject)) b.set(subject, new Map());
      const subj = b.get(subject)!;
      if (!subj.has(exam)) subj.set(exam, []);
      subj.get(exam)!.push(p);
    }
    return [...years.entries()].sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  }, [papers]);

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Previous Year Question Papers"
        subtitle="Digital PYQ library — Academic Year → Semester → Branch → Subject → Exam. This is the only question source for Internal Question Papers."
        actions={
          <div className="flex gap-2">
            <Link to="/course-textbooks">
              <Button variant="secondary">Course textbooks</Button>
            </Link>
            <Link to="/previous-year-papers/questions">
              <Button variant="secondary">
                <FileSearch size={16} />
                PYQ question bank
              </Button>
            </Link>
            <Link to="/internal-question-papers/create">
              <Button>Create Internal Paper</Button>
            </Link>
          </div>
        }
      />

      <Surface className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
          <Field label="Search">
            <Input
              placeholder="Search papers…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && load()}
            />
          </Field>
          <Field label="Course code">
            <Input
              placeholder="BCS403"
              value={filters.courseCode}
              onChange={(e) => setFilters((f) => ({ ...f, courseCode: e.target.value }))}
            />
          </Field>
          <Field label="Exam type">
            <Select value={filters.examType} onChange={(e) => setFilters((f) => ({ ...f, examType: e.target.value }))}>
              <option value="">All</option>
              {['SEE', 'MAKEUP', 'SUPPLEMENTARY', 'MODEL'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Year">
            <Select value={filters.year} onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}>
              <option value="">All</option>
              {years.map((y) => (
                <option key={String(y)} value={String(y)}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Program">
            <Select value={filters.program} onChange={(e) => setFilters((f) => ({ ...f, program: e.target.value }))}>
              <option value="">All</option>
              {programs.map((p) => (
                <option key={String(p)} value={String(p)}>
                  {p}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Semester">
            <Input
              placeholder="4"
              value={filters.semester}
              onChange={(e) => setFilters((f) => ({ ...f, semester: e.target.value }))}
            />
          </Field>
          <Field label="Scheme">
            <Select value={filters.scheme} onChange={(e) => setFilters((f) => ({ ...f, scheme: e.target.value }))}>
              <option value="">All</option>
              {schemes.map((s) => (
                <option key={String(s)} value={String(s)}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Academic year">
            <Select value={filters.academicYear} onChange={(e) => setFilters((f) => ({ ...f, academicYear: e.target.value }))}>
              <option value="">All</option>
              {academicYears.map((y) => (
                <option key={String(y)} value={String(y)}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Surface>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>
      ) : papers.length === 0 ? (
        <EmptyState
          icon={<Library size={28} />}
          title="No previous-year papers yet"
          body="Ask an administrator to import the Previous Year QP master, or confirm files exist under public/Previous Years QPs."
        />
      ) : (
        <div className="space-y-6">
          {libraryTree.map(([year, semesters]) => (
            <div key={year}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Academic Year {year}</h2>
              {[...semesters.entries()].map(([sem, branches]) => (
                <div key={`${year}-${sem}`} className="mb-4">
                  <h3 className="mb-2 text-sm font-medium">{sem}</h3>
                  {[...branches.entries()].map(([branch, subjects]) => (
                    <div key={`${year}-${sem}-${branch}`} className="mb-3 pl-2">
                      <p className="mb-2 text-xs uppercase text-ink-muted">{branch}</p>
                      {[...subjects.entries()].map(([subject, exams]) => (
                        <div key={`${year}-${sem}-${branch}-${subject}`} className="mb-3">
                          <p className="mb-2 text-sm font-semibold">{subject}</p>
                          {[...exams.entries()].map(([exam, list]) => (
                            <div key={`${subject}-${exam}`} className="mb-2">
                              <p className="mb-2 text-xs text-ink-muted">{exam}</p>
                              <div className="grid gap-4 md:grid-cols-2">
                                {list.map((p) => (
                                  <Surface key={p.id} className="flex flex-col gap-3">
                                    <div>
                                      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                                        {p.examType} · {p.examDate || p.examYear}
                                      </p>
                                      <h2 className="mt-1 text-lg font-semibold text-ink">{p.subjectName}</h2>
                                      <p className="text-sm text-ink-secondary">
                                        {p.courseCode} · {p.scheme || 'Scheme n/a'} · Semester {p.semester || '—'}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs">
                                      <StatusBadge status={p.extractionStatus || 'EXTRACTED'} />
                                      {p.mappingStatus ? <StatusBadge status={p.mappingStatus} /> : null}
                                      {p.solutionReadiness ? <StatusBadge status={p.solutionReadiness} /> : null}
                                    </div>
                                    <p className="text-sm text-ink-secondary">
                                      {p.maxMarks ?? '—'} Marks · {p.durationMinutes ? `${Math.round(p.durationMinutes / 60)} Hours` : 'Duration n/a'} · {p.questionCount} questions
                                    </p>
                                    {p.cos.length ? (
                                      <p className="text-xs text-ink-muted">CO Coverage {p.cos.join(' · ')}</p>
                                    ) : null}
                                    <div className="mt-auto flex flex-wrap gap-2">
                                      <Link to={`/previous-year-papers/${p.id}`}>
                                        <Button size="sm">View source paper</Button>
                                      </Link>
                                      <Link to={`/previous-year-papers/${p.id}#questions`}>
                                        <Button size="sm" variant="secondary">
                                          Extracted questions
                                        </Button>
                                      </Link>
                                      <a href={p.sourceUrl} target="_blank" rel="noreferrer">
                                        <Button size="sm" variant="tertiary">
                                          Download Original
                                        </Button>
                                      </a>
                                    </div>
                                  </Surface>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {analytics?.mostRepeatedQuestions?.length ? (
        <Surface className="mt-8">
          <h2 className="mb-3 text-base font-semibold">Most repeated questions</h2>
          <ul className="space-y-2 text-sm">
            {analytics.mostRepeatedQuestions.slice(0, 8).map((r) => (
              <li key={r.text.slice(0, 40)}>
                <span className="font-medium text-ink">{r.count}×</span>{' '}
                <span className="text-ink-secondary">{r.text}</span>
                {r.years?.length ? <span className="text-ink-muted"> · {r.years.join(', ')}</span> : null}
              </li>
            ))}
          </ul>
        </Surface>
      ) : null}
    </div>
  );
}
