import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { QuestionRenderer } from '../components/questions/QuestionRenderer';
import { Button, Field, Input } from '../components/ui';
import { api } from '../lib/api';
import { SURVEY_TYPE_LABELS } from '../lib/utils';
import { useDocumentTitle } from '../lib/useDocumentTitle';
import { DEFAULT_TIMEZONE, formatInTimeZone } from '../lib/timezone';
import {
  normalizeType,
  type AnswerValue,
  type SurveyQuestion,
} from '../types/survey';
import { CalendarClock, CheckCircle2, Ban, Archive } from 'lucide-react';

type PublicQuestion = Omit<SurveyQuestion, 'sectionId' | 'sortOrder'> & {
  sectionId?: number;
  sortOrder?: number;
};

type PublicSection = {
  id: number;
  title: string;
  description?: string | null;
  questions: PublicQuestion[];
};

type PublicSurvey = {
  id?: number;
  title: string;
  description?: string | null;
  surveyType?: string;
  identityMode?: string;
  departmentName?: string | null;
  courseName?: string | null;
  courseCode?: string | null;
  effectiveStatus?: string;
  availabilityReason?: string;
  startAt?: string | null;
  endAt?: string | null;
  closedAt?: string | null;
  timezone?: string;
  sections?: PublicSection[];
};

type PageState = 'welcome' | 'identity' | 'survey' | 'success' | 'unavailable' | 'alreadySubmitted';
type StudentInfo = { name: string; usn: string; email: string };
type InfoErrors = Partial<Record<keyof StudentInfo, string>>;
type UnavailableKind = 'SCHEDULED' | 'ENDED' | 'CLOSED' | 'ARCHIVED' | 'UNKNOWN';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hasAnswerValue(answer?: AnswerValue) {
  return Boolean(
    answer &&
      (answer.selectedOptionId != null ||
        answer.numericAnswer != null ||
        answer.textAnswer?.trim() ||
        answer.jsonAnswer?.length),
  );
}

export function StudentSurveyPage() {
  const { code } = useParams();
  const [page, setPage] = useState<PageState>('welcome');
  const [priorSubmittedAt, setPriorSubmittedAt] = useState<string | null>(null);
  const [survey, setSurvey] = useState<PublicSurvey | null>(null);
  useDocumentTitle(survey?.title);
  const [unavailableKind, setUnavailableKind] = useState<UnavailableKind>('UNKNOWN');
  const [unavailableMessage, setUnavailableMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [student, setStudent] = useState<StudentInfo>({ name: '', usn: '', email: '' });
  const [infoErrors, setInfoErrors] = useState<InfoErrors>({});
  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [questionErrors, setQuestionErrors] = useState<Record<number, string>>({});
  const [sectionIndex, setSectionIndex] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');

    if (!code) {
      setLoadError('This survey link is incomplete. Please check the link and try again.');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    api<{
      accessible: boolean;
      message?: string;
      reason?: string;
      survey?: PublicSurvey;
    }>(`/api/public/s/${encodeURIComponent(code)}`, { auth: false })
      .then((data) => {
        if (!active) return;
        if (!data.survey) {
          setLoadError('We could not find a survey for this link.');
          return;
        }
        setSurvey(data.survey);
        if (!data.accessible) {
          const status = (data.survey.effectiveStatus || data.reason || 'UNKNOWN') as string;
          const kind: UnavailableKind =
            status === 'SCHEDULED' || data.reason === 'SURVEY_NOT_STARTED'
              ? 'SCHEDULED'
              : status === 'ENDED' || data.reason === 'SURVEY_ENDED'
                ? 'ENDED'
                : status === 'CLOSED' || data.reason === 'SURVEY_CLOSED'
                  ? 'CLOSED'
                  : status === 'ARCHIVED' || data.reason === 'SURVEY_ARCHIVED'
                    ? 'ARCHIVED'
                    : 'UNKNOWN';
          setUnavailableKind(kind);
          setUnavailableMessage(data.message || 'This survey is not accepting responses.');
          setPage('unavailable');
        }
      })
      .catch(() => {
        if (active) {
          setLoadError('This survey link is invalid or no longer available.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [code]);

  const sections = survey?.sections ?? [];
  const allQuestions = useMemo(
    () => sections.flatMap((section) => section.questions),
    [sections],
  );
  const currentSection = sections[sectionIndex];
  const progress = sections.length ? Math.round(((sectionIndex + 1) / sections.length) * 100) : 0;

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateStudent = () => {
    const next: InfoErrors = {};
    if (!student.name.trim()) next.name = 'Enter your full name.';
    if (!student.usn.trim()) next.usn = 'Enter your USN.';
    if (!student.email.trim()) {
      next.email = 'Enter your email address.';
    } else if (!EMAIL_PATTERN.test(student.email.trim())) {
      next.email = 'Enter a valid email address.';
    }
    setInfoErrors(next);
    return Object.keys(next).length === 0;
  };

  const missingRequired = (question: PublicQuestion) => {
    if (!question.isRequired) return false;
    const answer = answers[question.id];
    if (!answer) return true;
    const type = normalizeType(question.questionType);
    if (type === 'SHORT_ANSWER' || type === 'LONG_ANSWER') {
      return !answer.textAnswer?.trim();
    }
    if (type === 'CHECKBOX') return !answer.jsonAnswer?.length;
    return (
      answer.selectedOptionId == null &&
      answer.numericAnswer == null &&
      !answer.textAnswer?.trim() &&
      answer.jsonAnswer == null
    );
  };

  const validateQuestions = (questions: PublicQuestion[]) => {
    const next = questions.reduce<Record<number, string>>((errors, question) => {
      if (missingRequired(question)) errors[question.id] = 'This question is required.';
      return errors;
    }, {});
    setQuestionErrors(next);
    return next;
  };

  const startSurvey = async (event: FormEvent) => {
    event.preventDefault();
    setActionError('');
    if (!validateStudent() || !code) return;

    setWorking(true);
    try {
      const result = await api<{ submissionId: number }>(
        `/api/public/s/${encodeURIComponent(code)}/start`,
        {
          method: 'POST',
          auth: false,
          body: JSON.stringify({
            name: student.name.trim(),
            usn: student.usn.trim().toUpperCase(),
            email: student.email.trim().toLowerCase(),
          }),
        },
      );
      setSubmissionId(result.submissionId);
      setPage('survey');
      scrollToTop();
    } catch (error) {
      const status = (error as { status?: number }).status;
      const details = (error as { details?: { submittedAt?: string | null } }).details;
      if (status === 409) {
        setPriorSubmittedAt(details?.submittedAt ?? null);
        setPage('alreadySubmitted');
        scrollToTop();
        return;
      }
      setActionError(error instanceof Error ? error.message : 'Unable to start the survey.');
    } finally {
      setWorking(false);
    }
  };

  const goNext = () => {
    if (!currentSection) return;
    const errors = validateQuestions(currentSection.questions);
    if (Object.keys(errors).length) {
      setActionError('Please complete the required questions before continuing.');
      return;
    }
    setActionError('');
    setSectionIndex((current) => Math.min(current + 1, sections.length - 1));
    scrollToTop();
  };

  const goPrevious = () => {
    setActionError('');
    setQuestionErrors({});
    setSectionIndex((current) => Math.max(current - 1, 0));
    scrollToTop();
  };

  const submitSurvey = async () => {
    if (!code || submissionId == null) return;
    const errors = validateQuestions(allQuestions);
    if (Object.keys(errors).length) {
      const firstInvalidIndex = sections.findIndex((section) =>
        section.questions.some((question) => errors[question.id]),
      );
      if (firstInvalidIndex >= 0) setSectionIndex(firstInvalidIndex);
      setActionError('Please complete all required questions before submitting.');
      scrollToTop();
      return;
    }

    setActionError('');
    setWorking(true);
    try {
      await api(`/api/public/s/${encodeURIComponent(code)}/submit`, {
        method: 'POST',
        auth: false,
        body: JSON.stringify({
          submissionId,
          answers: Object.values(answers).filter(hasAnswerValue),
        }),
      });
      setPage('success');
      scrollToTop();
    } catch (error) {
      const status = (error as { status?: number }).status;
      const details = (error as { details?: { submittedAt?: string | null } }).details;
      if (status === 409) {
        setPriorSubmittedAt(details?.submittedAt ?? null);
        setPage('alreadySubmitted');
        scrollToTop();
        return;
      }
      setActionError(error instanceof Error ? error.message : 'Unable to submit your response.');
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <LoadingScreen />;

  if (loadError || !survey) {
    return (
      <CenteredState
        icon={<Ban size={22} />}
        eyebrow="Survey unavailable"
        title="This link isn’t working"
        message={loadError || 'We could not load this survey. Please request a new link.'}
      />
    );
  }

  if (page === 'unavailable' && survey) {
    const timezone = survey.timezone || DEFAULT_TIMEZONE;
    if (unavailableKind === 'SCHEDULED') {
      return (
        <CenteredState
          icon={<CalendarClock size={22} />}
          eyebrow="Survey scheduled"
          title="This survey is not open yet"
          message={
            survey.startAt
              ? `Responses will be accepted from ${formatInTimeZone(survey.startAt, timezone)}.`
              : unavailableMessage
          }
          tone="info"
        />
      );
    }
    if (unavailableKind === 'ENDED') {
      return (
        <CenteredState
          icon={<Ban size={22} />}
          eyebrow="Survey ended"
          title="The response period has ended"
          message={
            survey.endAt
              ? `Closed on ${formatInTimeZone(survey.endAt, timezone)}.`
              : unavailableMessage
          }
          tone="muted"
        />
      );
    }
    if (unavailableKind === 'ARCHIVED') {
      return (
        <CenteredState
          icon={<Archive size={22} />}
          eyebrow="Survey unavailable"
          title={survey.title}
          message="This survey is no longer available."
          tone="muted"
        />
      );
    }
    return (
      <CenteredState
        icon={<Ban size={22} />}
        eyebrow="Responses closed"
        title={survey.title}
        message={unavailableMessage || 'This survey is no longer accepting responses.'}
        tone="muted"
      />
    );
  }

  if (page === 'success') {
    return (
      <CenteredState
        icon={<CheckCircle2 size={22} />}
        eyebrow="Response submitted"
        title="Thank you"
        message="Your feedback has been recorded successfully."
        success
        tone="success"
      />
    );
  }

  if (page === 'alreadySubmitted') {
    const timezone = survey?.timezone || DEFAULT_TIMEZONE;
    return (
      <CenteredState
        icon={<CheckCircle2 size={22} />}
        eyebrow="Already completed"
        title="You have already submitted this survey"
        message={
          priorSubmittedAt
            ? `Your response was received on ${formatInTimeZone(priorSubmittedAt, timezone)}.`
            : 'Our records show a response has already been submitted for your USN.'
        }
        tone="muted"
      />
    );
  }

  if (page === 'welcome') {
    const anonymous = survey.identityMode?.toUpperCase() === 'ANONYMOUS';
    const questionCount = allQuestions.length;
    const minutes = Math.max(2, Math.ceil(questionCount * 0.4));
    const context = [survey.courseName, survey.departmentName].filter(Boolean);

    return (
      <PageShell>
        <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10 sm:px-6">
          <div className="mb-8">
            <Brand />
          </div>
          <section className="rounded-[var(--radius-xl)] border border-border bg-surface p-6 shadow-sm sm:p-8">
            {survey.surveyType ? (
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
                {(SURVEY_TYPE_LABELS[survey.surveyType] || survey.surveyType).replace(/_/g, ' ')}
              </p>
            ) : null}
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-[2rem]">
              {survey.courseName || survey.title}
            </h1>
            {context.length ? (
              <p className="mt-2 text-sm text-ink-muted">{context.join(' · ')}</p>
            ) : null}
            <p className="mt-5 text-sm text-ink-secondary">
              {questionCount} Questions · About {minutes} minutes
            </p>
            <div className="mt-5 inline-flex items-center rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-ink-secondary">
              {anonymous ? 'Anonymous Survey' : 'Identified Survey'}
            </div>
            {survey.description ? (
              <p className="mt-5 text-sm leading-6 text-ink-muted">{survey.description}</p>
            ) : null}
            <Button
              type="button"
              className="mt-8 h-12 w-full text-base"
              onClick={() => {
                setPage('identity');
                scrollToTop();
              }}
            >
              Begin Survey
            </Button>
          </section>
        </main>
      </PageShell>
    );
  }

  if (page === 'identity') {
    const anonymous = survey.identityMode?.toUpperCase() === 'ANONYMOUS';

    return (
      <PageShell>
        <main className="mx-auto w-full max-w-xl px-4 py-8 sm:px-6 sm:py-12">
          <Brand />
          <section className="mt-8 rounded-[var(--radius-xl)] border border-border bg-surface p-5 shadow-sm sm:p-8">
            <div className="rounded-[var(--radius-lg)] bg-accent-soft p-4">
              <h2 className="font-semibold text-ink">
                {anonymous ? 'Anonymous Survey' : 'Identified Survey'}
              </h2>
              <p className="mt-1 text-sm leading-5 text-ink-muted">
                {anonymous
                  ? 'Your details verify eligibility. Your answers stay anonymous to faculty.'
                  : 'Your response will be associated with the student details you provide.'}
              </p>
            </div>

            <form className="mt-7 space-y-5" onSubmit={startSurvey} noValidate>
              <div>
                <h2 className="text-lg font-semibold text-ink">Student details</h2>
                <p className="mt-1 text-sm text-ink-muted">Enter your information to continue.</p>
              </div>

              <Field label="Full Name">
                <Input
                  autoComplete="name"
                  className="h-12 text-base"
                  value={student.name}
                  onChange={(event) => {
                    setStudent((current) => ({ ...current, name: event.target.value }));
                    setInfoErrors((current) => ({ ...current, name: undefined }));
                  }}
                  aria-invalid={Boolean(infoErrors.name)}
                  placeholder="Your full name"
                />
                <FieldError>{infoErrors.name}</FieldError>
              </Field>

              <Field label="USN">
                <Input
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="h-12 text-base uppercase"
                  value={student.usn}
                  onChange={(event) => {
                    setStudent((current) => ({ ...current, usn: event.target.value }));
                    setInfoErrors((current) => ({ ...current, usn: undefined }));
                  }}
                  aria-invalid={Boolean(infoErrors.usn)}
                  placeholder="University seat number"
                />
                <FieldError>{infoErrors.usn}</FieldError>
              </Field>

              <Field label="Email">
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className="h-12 text-base"
                  value={student.email}
                  onChange={(event) => {
                    setStudent((current) => ({ ...current, email: event.target.value }));
                    setInfoErrors((current) => ({ ...current, email: undefined }));
                  }}
                  aria-invalid={Boolean(infoErrors.email)}
                  placeholder="you@example.com"
                />
                <FieldError>{infoErrors.email}</FieldError>
              </Field>

              {actionError ? <ErrorBanner>{actionError}</ErrorBanner> : null}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-12 flex-1"
                  onClick={() => setPage('welcome')}
                >
                  Back
                </Button>
                <Button type="submit" disabled={working} className="h-12 flex-1 text-base">
                  {working ? 'Starting…' : 'Continue'}
                </Button>
              </div>
            </form>
          </section>
        </main>
      </PageShell>
    );
  }

  if (!currentSection) {
    return (
      <CenteredState
        icon={<Ban size={22} />}
        eyebrow="Survey unavailable"
        title="No questions are available"
        message="Please contact your institution for assistance."
      />
    );
  }

  const lastSection = sectionIndex === sections.length - 1;

  return (
    <PageShell>
      <header className="bg-sidebar text-white">
        <div className="mx-auto max-w-2xl px-4 pb-6 pt-5 sm:px-6">
          <Brand inverse />
          <p className="mt-6 truncate text-sm font-medium text-white/80">{survey.title}</p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45">
                Section {sectionIndex + 1} of {sections.length}
              </p>
              <p className="mt-1 text-sm text-white/80">{currentSection.title}</p>
            </div>
            <span className="text-sm font-semibold tabular-nums text-white/70">{progress}%</span>
          </div>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress}
            aria-label="Survey progress"
          >
            <div
              className="h-full rounded-full bg-accent transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-7 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{currentSection.title}</h1>
          {currentSection.description ? (
            <p className="mt-2 text-sm leading-6 text-ink-muted">{currentSection.description}</p>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          {currentSection.questions.map((question, index) => {
            const normalizedQuestion: SurveyQuestion = {
              ...question,
              sectionId: question.sectionId ?? currentSection.id,
              sortOrder: question.sortOrder ?? index,
            };
            return (
              <section
                key={question.id}
                className="rounded-[var(--radius-lg)] border border-border bg-surface p-5 sm:p-6"
              >
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                  Question {index + 1}
                </p>
                <QuestionRenderer
                  question={normalizedQuestion}
                  value={answers[question.id]}
                  mode="answer"
                  error={questionErrors[question.id]}
                  onChange={(answer) => {
                    setAnswers((current) => ({ ...current, [question.id]: answer }));
                    setQuestionErrors((current) => {
                      if (!current[question.id]) return current;
                      const next = { ...current };
                      delete next[question.id];
                      return next;
                    });
                    setActionError('');
                  }}
                />
              </section>
            );
          })}
        </div>

        {actionError ? <div className="mt-5"><ErrorBanner>{actionError}</ErrorBanner></div> : null}

        <div className="mt-7 flex gap-3">
          {sectionIndex > 0 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={goPrevious}
              disabled={working}
              className="h-12 flex-1 rounded-lg text-base"
            >
              <span aria-hidden="true">←</span> Previous
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={lastSection ? submitSurvey : goNext}
            disabled={working}
            className="h-12 flex-1 rounded-lg text-base shadow-sm"
          >
            {working ? 'Submitting…' : lastSection ? 'Submit survey' : 'Next section'}
            {!working ? <span aria-hidden="true">{lastSection ? '✓' : '→'}</span> : null}
          </Button>
        </div>
        <p className="mt-5 text-center text-xs text-ink-muted">
          Your answers are kept while you move between sections.
        </p>
      </main>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-bg text-ink">{children}</div>;
}

function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" aria-label="SkillonX Survey">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-[10px] text-sm font-bold ${
          inverse ? 'bg-white text-accent' : 'bg-accent text-white'
        }`}
        aria-hidden="true"
      >
        S
      </span>
      <div>
        <p className={`font-display text-xl leading-none ${inverse ? 'text-white' : 'text-ink'}`}>
          SkillonX
        </p>
        <p
          className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
            inverse ? 'text-white/50' : 'text-ink-muted'
          }`}
        >
          Survey
        </p>
      </div>
    </div>
  );
}

function FieldError({ children }: { children?: string }) {
  return children ? <p className="mt-1.5 text-sm text-danger">{children}</p> : null;
}

function ErrorBanner({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
      {children}
    </div>
  );
}

function LoadingScreen() {
  return (
    <PageShell>
      <main className="mx-auto max-w-xl animate-pulse px-4 py-6 sm:px-6 sm:py-10" aria-label="Loading survey">
        <div className="h-72 rounded-3xl bg-emerald-900" />
        <div className="-mt-4 space-y-5 rounded-2xl border border-line bg-white p-6 shadow-lg">
          <div className="h-20 rounded-xl bg-stone-100" />
          <div className="h-6 w-40 rounded bg-stone-100" />
          <div className="h-12 rounded-lg bg-stone-100" />
          <div className="h-12 rounded-lg bg-stone-100" />
          <div className="h-12 rounded-lg bg-stone-100" />
          <div className="h-12 rounded-lg bg-emerald-100" />
        </div>
        <span className="sr-only">Loading survey…</span>
      </main>
    </PageShell>
  );
}

function CenteredState({
  icon,
  eyebrow,
  title,
  message,
  success = false,
  tone = 'muted',
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  message: string;
  success?: boolean;
  tone?: 'muted' | 'info' | 'success';
}) {
  const iconTone = success || tone === 'success'
    ? 'bg-success-soft text-success'
    : tone === 'info'
      ? 'bg-info-soft text-info'
      : 'bg-surface-muted text-ink-muted';

  return (
    <PageShell>
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-5 py-12">
        <section className="w-full overflow-hidden rounded-[var(--radius-xl)] border border-border bg-surface shadow-md">
          <div className="bg-sidebar px-7 py-8">
            <Brand inverse />
          </div>
          <div className="px-7 py-10 text-center sm:px-10">
            <div
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${iconTone}`}
              aria-hidden="true"
            >
              {icon}
            </div>
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-ink-muted">{message}</p>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
