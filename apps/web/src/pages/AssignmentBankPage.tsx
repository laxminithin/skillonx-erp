import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Button, Field, Input, PageHeader, Select, Surface } from '../components/ui';
import {
  ASSIGNMENT_DIFFICULTY_LABELS,
  ASSIGNMENT_QUESTION_TYPE_LABELS,
  formatOutcomeCodes,
} from '../types/assignment';
import { useDocumentTitle } from '../lib/useDocumentTitle';

type Question = {
  id: number;
  questionText: string;
  questionType: string;
  difficulty?: string | null;
  marks: number;
  primaryCoCode?: string | null;
  courseName?: string;
  moduleName?: string;
  expectedAnswerGuidance?: string | null;
  evaluationRubric?: unknown;
  derivedOutcomes?: {
    pos?: Array<{ code: string } | string>;
    psos?: Array<{ code: string } | string>;
    sdgs?: Array<{ code: string } | string>;
  } | null;
};

type Subject = {
  courseId: number;
  courseName: string;
  courseCode: string;
  questionCount: number;
  easy?: number;
  intermediate?: number;
  difficult?: number;
};

export function AssignmentBankPage() {
  useDocumentTitle('Assignment Question Bank');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courseId, setCourseId] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [coCode, setCoCode] = useState('');
  const [q, setQ] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selected, setSelected] = useState<Question | null>(null);

  useEffect(() => {
    api<{ subjects: Subject[] }>('/api/assignment-bank/overview')
      .then((d) => {
        setSubjects(d.subjects || []);
        if (!courseId && d.subjects[0]) setCourseId(String(d.subjects[0].courseId));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (courseId) params.set('courseId', courseId);
    if (difficulty) params.set('difficulty', difficulty);
    if (coCode) params.set('coCode', coCode);
    if (q.trim()) params.set('q', q.trim());
    params.set('pageSize', '80');
    api<{ questions: Question[] }>(`/api/assignment-bank/questions?${params}`)
      .then((d) => setQuestions(d.questions))
      .catch(console.error);
  }, [courseId, difficulty, coCode, q]);

  return (
    <div className="animate-fade-in space-y-4">
      <PageHeader
        title="Question Bank"
        subtitle="Descriptive assignment questions with CO mapping for generation and review."
        actions={
          <Link to="/assignments">
            <Button variant="secondary">My Assignments</Button>
          </Link>
        }
      />

      <div className="flex gap-1 border-b border-border">
        <Link to="/quizzes/bank" className="px-3 py-2 text-sm text-ink-muted hover:text-ink">
          Quiz
        </Link>
        <span className="border-b-2 border-accent px-3 py-2 text-sm font-medium text-ink">
          Assignment
        </span>
      </div>

      <Surface className="grid gap-3 md:grid-cols-4">
        <Field label="Subject">
          <Select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">All</option>
            {subjects.map((c) => (
              <option key={c.courseId} value={c.courseId}>
                {c.courseName} ({c.questionCount})
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Difficulty">
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">All</option>
            <option value="EASY">Easy</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="DIFFICULT">Difficult</option>
          </Select>
        </Field>
        <Field label="CO">
          <Input placeholder="CO1" value={coCode} onChange={(e) => setCoCode(e.target.value)} />
        </Field>
        <Field label="Search">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search question text" />
        </Field>
      </Surface>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Surface className="max-h-[70vh] space-y-2 overflow-auto p-2">
          {questions.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`w-full rounded-md border px-3 py-2 text-left text-sm hover:bg-surface-muted/50 ${
                selected?.id === item.id ? 'border-ink bg-surface-muted/40' : 'border-border'
              }`}
              onClick={() => setSelected(item)}
            >
              <div className="text-xs text-ink-muted">
                {item.courseName} · {item.moduleName} ·{' '}
                {ASSIGNMENT_DIFFICULTY_LABELS[item.difficulty || ''] || item.difficulty} ·{' '}
                {item.primaryCoCode || 'No CO'}
              </div>
              <div className="mt-1 line-clamp-2">{item.questionText}</div>
            </button>
          ))}
          {!questions.length ? (
            <p className="p-4 text-sm text-ink-muted">No assignment bank questions match these filters.</p>
          ) : null}
        </Surface>

        <Surface className="space-y-3">
          {!selected ? (
            <p className="text-sm text-ink-muted">Select a question to view details, scheme, and outcomes.</p>
          ) : (
            <>
              <p className="text-xs text-ink-muted">
                {ASSIGNMENT_QUESTION_TYPE_LABELS[selected.questionType] || selected.questionType} ·{' '}
                {selected.difficulty} · {selected.marks} marks
              </p>
              <p className="text-sm font-medium whitespace-pre-wrap">{selected.questionText}</p>
              <p className="text-sm">
                <span className="text-ink-muted">Primary CO:</span> {selected.primaryCoCode || '—'}
              </p>
              {selected.expectedAnswerGuidance ? (
                <div>
                  <p className="text-xs font-semibold uppercase text-ink-muted">Model solution / key points</p>
                  <pre className="mt-1 whitespace-pre-wrap font-sans text-sm text-ink-muted">
                    {selected.expectedAnswerGuidance}
                  </pre>
                </div>
              ) : null}
              <div className="text-sm">
                <p>
                  <span className="text-ink-muted">PO:</span>{' '}
                  {formatOutcomeCodes(selected.derivedOutcomes?.pos)}
                </p>
                <p>
                  <span className="text-ink-muted">PSO:</span>{' '}
                  {formatOutcomeCodes(selected.derivedOutcomes?.psos)}
                </p>
                <p>
                  <span className="text-ink-muted">SDG:</span>{' '}
                  {formatOutcomeCodes(selected.derivedOutcomes?.sdgs)}
                </p>
              </div>
              <Link
                to={`/assignments/create?courseId=${courseId || ''}`}
                className="inline-block text-sm font-medium text-accent"
              >
                Generate assignment from this subject →
              </Link>
            </>
          )}
        </Surface>
      </div>
    </div>
  );
}
