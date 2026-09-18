import { db } from '../../db/index.js';
import { getFullCareerProfile } from './careerProfile.js';
import { getStudentPlacementAcademicProfile } from './academicProfile.js';

export async function buildResumeSnapshot(studentId: number, collegeId: number, resumeVersionId?: number) {
  const profile = await getFullCareerProfile(studentId, collegeId);
  const version = resumeVersionId
    ? profile.resumeVersions.find((r) => Number(r.id) === resumeVersionId)
    : profile.resumeVersions.find((r) => r.is_default) ?? profile.resumeVersions[0];

  return {
    capturedAt: new Date().toISOString(),
    resumeVersionId: version ? Number(version.id) : null,
    headline: profile.profile.headline,
    careerObjective: version?.career_objective ?? profile.profile.careerObjective,
    academic: profile.academic,
    skills: profile.skills,
    projects: profile.projects,
    certifications: profile.certifications,
    education: profile.education,
    experiences: profile.experiences,
  };
}

export async function getResumePreview(studentId: number, collegeId: number, resumeVersionId?: number) {
  const snapshot = await buildResumeSnapshot(studentId, collegeId, resumeVersionId);
  const student = await db('students').where({ id: studentId }).first();
  return {
    personal: {
      name: student?.name,
      usn: student?.usn,
      email: student?.email,
      phone: student?.phone,
    },
    sections: snapshot,
  };
}

export async function createResumeVersion(studentId: number, collegeId: number, body: Record<string, unknown>) {
  if (body.isDefault) {
    await db('student_resume_versions').where({ student_id: studentId }).update({ is_default: false });
  }
  const [id] = await db('student_resume_versions').insert({
    college_id: collegeId,
    student_id: studentId,
    name: body.name,
    template: body.template ?? 'STANDARD',
    career_objective: body.careerObjective ?? null,
    selected_projects: body.selectedProjects ? JSON.stringify(body.selectedProjects) : null,
    selected_skills: body.selectedSkills ? JSON.stringify(body.selectedSkills) : null,
    selected_certifications: body.selectedCertifications ? JSON.stringify(body.selectedCertifications) : null,
    is_default: body.isDefault ?? false,
  });
  return db('student_resume_versions').where({ id }).first();
}

export async function addStudentSkill(studentId: number, collegeId: number, body: Record<string, unknown>) {
  const [id] = await db('student_skills').insert({
    college_id: collegeId,
    student_id: studentId,
    skill_id: body.skillId ?? null,
    skill_name: body.skillName,
    level: body.level ?? 'BEGINNER',
    source: 'SELF_DECLARED',
    verification_status: 'SELF_DECLARED',
  });
  return db('student_skills').where({ id }).first();
}

export async function addStudentProject(studentId: number, collegeId: number, body: Record<string, unknown>) {
  const [id] = await db('student_projects').insert({
    college_id: collegeId,
    student_id: studentId,
    title: body.title,
    description: body.description ?? null,
    project_type: body.projectType ?? 'PERSONAL',
    technologies: body.technologies ? JSON.stringify(body.technologies) : null,
    team_type: body.teamType ?? 'INDIVIDUAL',
    role: body.role ?? null,
    start_date: body.startDate ?? null,
    end_date: body.endDate ?? null,
    repository_url: body.repositoryUrl ?? null,
    demo_url: body.demoUrl ?? null,
  });
  return db('student_projects').where({ id }).first();
}

export async function upsertPriorEducation(studentId: number, collegeId: number, body: Record<string, unknown>) {
  const existing = await db('student_prior_education')
    .where({ student_id: studentId, qualification_type: body.qualificationType })
    .first();
  const payload = {
    college_id: collegeId,
    student_id: studentId,
    qualification_type: body.qualificationType,
    institution: body.institution ?? null,
    board_university: body.boardUniversity ?? null,
    year_of_completion: body.yearOfCompletion ?? null,
    percentage: body.percentage ?? null,
    cgpa: body.cgpa ?? null,
    verification_status: 'SELF_DECLARED',
    updated_at: db.fn.now(),
  };
  if (existing) {
    await db('student_prior_education').where({ id: existing.id }).update(payload);
    return db('student_prior_education').where({ id: existing.id }).first();
  }
  const [id] = await db('student_prior_education').insert(payload);
  return db('student_prior_education').where({ id }).first();
}
