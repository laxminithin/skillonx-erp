export type AdmissionActor = {
  kind: 'FACULTY' | 'APPLICANT';
  collegeId: number;
  facultyUserId?: number;
  applicantId?: number;
  role: string;
  departmentId?: number | null;
  name?: string | null;
};

export type AdmissionPermission =
  | 'admissions.config.manage'
  | 'admissions.enquiry.manage'
  | 'admissions.application.manage'
  | 'admissions.document.verify'
  | 'admissions.eligibility.evaluate'
  | 'admissions.eligibility.override'
  | 'admissions.selection.manage'
  | 'admissions.offer.manage'
  | 'admissions.confirm'
  | 'admissions.convert'
  | 'admissions.report.view'
  | 'admissions.oversight.view';

export type EligibilityExplanation = {
  rule: string;
  status: 'PASS' | 'FAIL' | 'REVIEW';
  message: string;
  evidence?: Record<string, unknown>;
};
