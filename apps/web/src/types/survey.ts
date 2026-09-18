export type QuestionOption = {
  id?: number;
  label: string;
  value?: number | null;
  sortOrder?: number;
};

export type QuestionConfig = {
  maxStars?: number;
  scale?: number;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  labels?: Record<string, string>;
  includeNotApplicable?: boolean;
  minSelections?: number;
  maxSelections?: number;
  maxLength?: number;
  [key: string]: unknown;
};

export type SurveyQuestion = {
  id: number;
  sectionId: number;
  questionType: string;
  prompt: string;
  helpText?: string | null;
  isRequired: boolean;
  allowComment?: boolean;
  sortOrder: number;
  structureVersion?: number;
  config?: QuestionConfig;
  options: QuestionOption[];
};

export type SurveySection = {
  id: number;
  title: string;
  description?: string | null;
  sortOrder: number;
  questions: SurveyQuestion[];
};

export type SurveyDetail = {
  id: number;
  title: string;
  description?: string | null;
  surveyType: string;
  effectiveStatus: string;
  status: string;
  responsePolicy: string;
  identityMode: string;
  startAt?: string | null;
  endAt?: string | null;
  shareCode?: string;
  timezone?: string;
  responseCount?: number;
  departmentName?: string;
  courseName?: string;
  courseCode?: string;
  courseId?: number | null;
  academicYearLabel?: string;
  semesterLabel?: string;
  structureLocked?: boolean;
  canEditStructure?: boolean;
  sections: SurveySection[];
};

export type AnswerValue = {
  questionId: number;
  textAnswer?: string | null;
  numericAnswer?: number | null;
  selectedOptionId?: number | null;
  jsonAnswer?: number[] | null;
  comment?: string | null;
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  STAR_RATING: 'Star Rating',
  SMILE_RATING: 'Smile / Emoji Rating',
  NUMERICAL: 'Numeric Rating',
  LIKERT: 'Likert Scale',
  MULTIPLE_CHOICE: 'Single Choice',
  CHECKBOX: 'Multiple Choice',
  YES_NO: 'Yes / No',
  SHORT_ANSWER: 'Short Text',
  LONG_ANSWER: 'Long Text / Comments',
  DROPDOWN: 'Dropdown',
  RATING: 'Star Rating',
};

export const SMILE_EMOJIS = ['😞', '🙁', '😐', '🙂', '😄'];

export function normalizeType(type: string) {
  return type === 'RATING' ? 'STAR_RATING' : type;
}

export function extractEmoji(label: string, index: number) {
  const match = label.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u);
  if (match) return match[1];
  return SMILE_EMOJIS[index] ?? '😐';
}

export function cleanLabel(label: string) {
  return label.replace(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*/u, '').trim();
}
