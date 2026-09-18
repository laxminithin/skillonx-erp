import { z } from 'zod';

export type PlacementPermission =
  | 'placement.view'
  | 'placement.student.manage'
  | 'placement.company.manage'
  | 'placement.opportunity.manage'
  | 'placement.eligibility.override'
  | 'placement.application.manage'
  | 'placement.drive.manage'
  | 'placement.offer.manage'
  | 'placement.training.manage'
  | 'placement.report.view'
  | 'placement.config.manage'
  | 'placement.coordinator.view'
  | 'placement.trainer.view'
  | 'placement.management.view';

export type PlacementActor = {
  facultyUserId: number;
  collegeId: number;
  departmentId: number | null;
  role: string;
  name?: string;
  employeeId?: number | null;
  tpRoles?: string[];
  tpDepartmentIds?: number[];
  extraPermissions?: PlacementPermission[];
};

export type StudentActor = {
  studentId: number;
  collegeId: number;
  usn?: string;
  name?: string;
};

export type RecruiterActor = {
  recruiterAccountId: number;
  collegeId: number;
  companyId: number;
  email: string;
  name: string;
};

export const PLACEMENT_STATUSES = [
  'NOT_REGISTERED',
  'REGISTERED',
  'ACTIVE',
  'PLACED',
  'MULTIPLE_OFFERS',
  'HIGHER_STUDIES',
  'ENTREPRENEURSHIP',
  'OPTED_OUT',
  'ALUMNI',
] as const;

export const ELIGIBILITY_REASONS = [
  'CGPA_BELOW_MINIMUM',
  'ACTIVE_BACKLOG',
  'HISTORICAL_BACKLOG',
  'PROGRAM_NOT_ELIGIBLE',
  'GRADUATION_YEAR_MISMATCH',
  'TENTH_PERCENTAGE_BELOW_MINIMUM',
  'TWELFTH_PERCENTAGE_BELOW_MINIMUM',
  'REQUIRED_SKILL_MISSING',
  'REGISTRATION_REQUIRED',
  'PROFILE_INCOMPLETE',
] as const;

export const careerProfileSchema = z.object({
  headline: z.string().trim().max(255).optional(),
  careerObjective: z.string().trim().max(5000).optional(),
  preferredRoles: z.array(z.string().trim().max(128)).max(20).optional(),
  preferredLocations: z.array(z.string().trim().max(128)).max(20).optional(),
  higherStudiesInterest: z.boolean().optional(),
  entrepreneurshipInterest: z.boolean().optional(),
  linkedinUrl: z.string().trim().max(512).optional(),
  githubUrl: z.string().trim().max(512).optional(),
  portfolioUrl: z.string().trim().max(512).optional(),
  leetcodeUrl: z.string().trim().max(512).optional(),
});

export const priorEducationSchema = z.object({
  qualificationType: z.enum(['SSLC_10TH', 'PUC_12TH', 'DIPLOMA', 'UG_PREVIOUS', 'OTHER']),
  institution: z.string().trim().max(255).optional(),
  boardUniversity: z.string().trim().max(255).optional(),
  yearOfCompletion: z.number().int().min(1980).max(2100).optional(),
  percentage: z.number().min(0).max(100).optional(),
  cgpa: z.number().min(0).max(10).optional(),
});

export const studentSkillSchema = z.object({
  skillId: z.number().int().positive().optional(),
  skillName: z.string().trim().min(1).max(128),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
});

export const projectSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(5000).optional(),
  projectType: z.enum(['ACADEMIC', 'MINI_PROJECT', 'MAJOR_PROJECT', 'HACKATHON', 'PERSONAL', 'INTERNSHIP', 'OTHER']).optional(),
  technologies: z.array(z.string().trim().max(64)).max(30).optional(),
  teamType: z.enum(['INDIVIDUAL', 'TEAM']).optional(),
  role: z.string().trim().max(128).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  repositoryUrl: z.string().trim().max(512).optional(),
  demoUrl: z.string().trim().max(512).optional(),
});

export const certificationSchema = z.object({
  provider: z.string().trim().max(255).optional(),
  certificateName: z.string().trim().min(1).max(255),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().trim().max(128).optional(),
  credentialUrl: z.string().trim().max(512).optional(),
});

export const resumeVersionSchema = z.object({
  name: z.string().trim().min(1).max(128),
  template: z.string().trim().max(64).optional(),
  careerObjective: z.string().trim().max(5000).optional(),
  selectedProjects: z.array(z.number().int().positive()).max(20).optional(),
  selectedSkills: z.array(z.number().int().positive()).max(50).optional(),
  selectedCertifications: z.array(z.number().int().positive()).max(30).optional(),
  isDefault: z.boolean().optional(),
});

export const registrationSchema = z.object({
  placementSeasonId: z.number().int().positive(),
  dataConsentGiven: z.boolean(),
  consentVersion: z.string().trim().max(32).optional(),
});

export const companySchema = z.object({
  name: z.string().trim().min(1).max(255),
  legalName: z.string().trim().max(255).optional(),
  industry: z.string().trim().max(128).optional(),
  website: z.string().trim().max(512).optional(),
  companyType: z.enum(['PRODUCT', 'SERVICE', 'STARTUP', 'CORE', 'CONSULTING', 'GOVERNMENT', 'OTHER']).optional(),
  description: z.string().trim().max(10000).optional(),
  headquarters: z.string().trim().max(255).optional(),
});

export const opportunitySchema = z.object({
  companyId: z.number().int().positive(),
  placementSeasonId: z.number().int().positive().optional(),
  opportunityType: z.enum(['PLACEMENT', 'INTERNSHIP', 'APPRENTICESHIP', 'PPO', 'OFF_CAMPUS', 'POOL_CAMPUS', 'HIGHER_STUDIES_EVENT', 'OTHER']).optional(),
  title: z.string().trim().min(1).max(255),
  role: z.string().trim().max(255).optional(),
  description: z.string().trim().max(20000).optional(),
  workMode: z.string().trim().max(32).optional(),
  employmentType: z.string().trim().max(32).optional(),
  ctcMin: z.number().min(0).optional(),
  ctcMax: z.number().min(0).optional(),
  stipend: z.number().min(0).optional(),
  currency: z.string().trim().max(8).optional(),
  openDate: z.string().optional(),
  deadline: z.string().optional(),
  driveDate: z.string().optional(),
  locations: z.array(z.object({ city: z.string().trim().min(1).max(128), state: z.string().trim().max(128).optional() })).max(20).optional(),
  eligibilityRules: z.array(z.object({
    ruleType: z.string().trim().min(1).max(64),
    operator: z.string().trim().max(16).optional(),
    value: z.string().trim().min(1).max(255),
    isMandatory: z.boolean().optional(),
  })).max(50).optional(),
});

export const applySchema = z.object({
  resumeVersionId: z.number().int().positive().optional(),
});

export const offerSchema = z.object({
  studentId: z.number().int().positive(),
  opportunityId: z.number().int().positive(),
  applicationId: z.number().int().positive().optional(),
  role: z.string().trim().max(255).optional(),
  ctc: z.number().min(0).optional(),
  joiningLocation: z.string().trim().max(255).optional(),
  joiningDate: z.string().optional(),
});

export const trainingProgramSchema = z.object({
  title: z.string().trim().min(1).max(255),
  provider: z.string().trim().max(128).optional(),
  category: z.enum(['APTITUDE', 'TECHNICAL', 'CODING', 'SOFT_SKILL', 'COMMUNICATION', 'INTERVIEW', 'DOMAIN', 'COMPANY_SPECIFIC']).optional(),
  description: z.string().trim().max(10000).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hours: z.number().int().min(1).optional(),
  mode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']).optional(),
  capacity: z.number().int().min(1).optional(),
  opportunityId: z.number().int().positive().optional(),
});

export type EligibilityResult = {
  status: 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'ELIGIBLE_WITH_OVERRIDE';
  reasons: Array<{ code: string; message: string; passed: boolean }>;
};
