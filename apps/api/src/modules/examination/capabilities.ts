import { db } from '../../db/index.js';
import { AppError } from '../../utils/errors.js';
import type { ExamActor } from './access.js';
import {
  type ExaminationCapabilityKey,
  type ExaminationCapabilityOwnership,
  type ExaminationGovernanceType,
} from './types.js';

export type CapabilityDefinition = {
  capabilityKey: ExaminationCapabilityKey;
  name: string;
  common: boolean;
  mandatory: boolean;
  requiresApproval: boolean;
  requiresFreeze: boolean;
  supportsAudit: boolean;
  supportsEvidence: boolean;
  sourceOfTruth: Record<ExaminationGovernanceType, string>;
  ownership: Record<ExaminationGovernanceType, ExaminationCapabilityOwnership>;
};

const BASE = {
  requiresApproval: false,
  requiresFreeze: true,
  supportsAudit: true,
  supportsEvidence: false,
};

export const EXAMINATION_CAPABILITIES: CapabilityDefinition[] = [
  cap('CIE_MANAGEMENT', 'CIE Management', true, true, { VTU_AFFILIATED: 'INSTITUTIONAL', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'SkillonX/Institution', AUTONOMOUS: 'SkillonX/Institution' }),
  cap('EXAM_ELIGIBILITY', 'Exam Eligibility', true, true, { VTU_AFFILIATED: 'INSTITUTIONAL', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'SkillonX + Finance/Attendance/CIE', AUTONOMOUS: 'SkillonX + Finance/Attendance/CIE' }),
  cap('EXAM_REGISTRATION', 'Exam Registration', true, true, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'VTU reference/import + local reconciliation', AUTONOMOUS: 'SkillonX' }),
  cap('SEE_TIMETABLE', 'SEE Timetable', true, true, { VTU_AFFILIATED: 'UNIVERSITY', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'VTU', AUTONOMOUS: 'SkillonX' }),
  cap('HALL_TICKET', 'Hall Ticket', true, true, { VTU_AFFILIATED: 'UNIVERSITY', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'VTU official document; SkillonX reference only', AUTONOMOUS: 'SkillonX' }),
  cap('CENTRE_MANAGEMENT', 'Exam Centre Management', true, true, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'Institution + VTU rules', AUTONOMOUS: 'SkillonX' }),
  cap('SEATING', 'Seating', true, true, { VTU_AFFILIATED: 'INSTITUTIONAL', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'SkillonX local centre operations', AUTONOMOUS: 'SkillonX' }),
  cap('INVIGILATION', 'Invigilation', true, true, { VTU_AFFILIATED: 'INSTITUTIONAL', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'SkillonX local centre operations', AUTONOMOUS: 'SkillonX' }),
  cap('QUESTION_PAPER_SETTING', 'Question Paper Setting', false, true, { VTU_AFFILIATED: 'UNIVERSITY', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'VTU', AUTONOMOUS: 'SkillonX' }, { requiresApproval: true, supportsEvidence: true }),
  cap('QUESTION_PAPER_CUSTODY', 'Question Paper Custody', true, true, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'VTU delivery + local secure handling', AUTONOMOUS: 'SkillonX' }, { requiresApproval: true, supportsEvidence: true }),
  cap('FORM_A', 'Exam Attendance / Form-A', true, true, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'SkillonX reconciliation; VTU authoritative where applicable', AUTONOMOUS: 'SkillonX' }),
  cap('MALPRACTICE', 'Malpractice / MPC', true, true, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'Institution + VTU statutory process', AUTONOMOUS: 'SkillonX' }, { requiresApproval: true, supportsEvidence: true }),
  cap('ANSWER_BOOK_INVENTORY', 'Answer Book Inventory', true, true, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'Institution/VTU reconciliation', AUTONOMOUS: 'SkillonX' }, { supportsEvidence: true }),
  cap('SCRIPT_CUSTODY', 'Answer Script Custody', true, true, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'Institution until VTU handover', AUTONOMOUS: 'SkillonX' }, { supportsEvidence: true }),
  cap('PRACTICAL_EXAM', 'Practical / Lab / Viva', true, true, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'Institution + university examiner rules', AUTONOMOUS: 'SkillonX' }),
  cap('MARKS_ENTRY', 'Marks Entry', true, true, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'Institutional CIE + VTU references', AUTONOMOUS: 'SkillonX' }),
  cap('VALUATION', 'Digital Valuation', false, true, { VTU_AFFILIATED: 'UNIVERSITY', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'VTU reference/tracking only', AUTONOMOUS: 'SkillonX' }, { requiresApproval: true }),
  cap('RESULT_PROCESSING', 'Result Processing', true, true, { VTU_AFFILIATED: 'UNIVERSITY', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'VTU import/reference', AUTONOMOUS: 'SkillonX' }, { requiresApproval: true }),
  cap('REVALUATION', 'Revaluation / Photocopy', true, true, { VTU_AFFILIATED: 'UNIVERSITY', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'VTU status/reference + local fees if applicable', AUTONOMOUS: 'SkillonX' }, { requiresApproval: true }),
  cap('GRADE_CARD', 'Grade Card / Transcript', false, true, { VTU_AFFILIATED: 'UNIVERSITY', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'VTU official document; institutional copy only', AUTONOMOUS: 'SkillonX' }, { requiresApproval: true }),
  cap('REMUNERATION', 'Exam Remuneration', true, false, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'Finance/HR + university rules', AUTONOMOUS: 'Finance/HR + SkillonX' }),
  cap('REPORTS', 'Exam Reports', true, true, { VTU_AFFILIATED: 'SHARED', AUTONOMOUS: 'INSTITUTIONAL' }, { VTU_AFFILIATED: 'SkillonX reports clearly marked non-authoritative where VTU owns source', AUTONOMOUS: 'SkillonX' }),
];

function cap(
  capabilityKey: ExaminationCapabilityKey,
  name: string,
  common: boolean,
  mandatory: boolean,
  ownership: Record<ExaminationGovernanceType, ExaminationCapabilityOwnership>,
  sourceOfTruth: Record<ExaminationGovernanceType, string>,
  extra: Partial<typeof BASE> = {},
): CapabilityDefinition {
  return { capabilityKey, name, common, mandatory, ownership, sourceOfTruth, ...BASE, ...extra };
}

export async function governanceForCollege(collegeId: number): Promise<ExaminationGovernanceType> {
  if (await db.schema.hasTable('college_examination_governance')) {
    const row = await db('college_examination_governance').where({ college_id: collegeId }).first();
    if (row?.governance_type === 'VTU_AFFILIATED' || row?.governance_type === 'AUTONOMOUS') {
      return row.governance_type;
    }
  }
  return 'AUTONOMOUS';
}

export async function capabilityMatrix(collegeId: number) {
  const governanceType = await governanceForCollege(collegeId);
  return {
    governanceType,
    capabilities: EXAMINATION_CAPABILITIES.map((definition) => {
      const ownership = definition.ownership[governanceType];
      return {
        capabilityKey: definition.capabilityKey,
        name: definition.name,
        governanceType,
        ownership,
        enabled: ownership !== 'OPTIONAL',
        mandatory: definition.mandatory,
        sourceOfTruth: definition.sourceOfTruth[governanceType],
        requiresApproval: definition.requiresApproval,
        requiresFreeze: definition.requiresFreeze,
        supportsAudit: definition.supportsAudit,
        supportsEvidence: definition.supportsEvidence,
      };
    }),
  };
}

export async function assertInstitutionOwnsCapability(actor: ExamActor, capabilityKey: ExaminationCapabilityKey) {
  const governanceType = await governanceForCollege(actor.collegeId);
  const definition = EXAMINATION_CAPABILITIES.find((item) => item.capabilityKey === capabilityKey);
  if (!definition) throw new AppError(500, `Unknown examination capability: ${capabilityKey}`);
  const ownership = definition.ownership[governanceType];
  if (ownership === 'UNIVERSITY') {
    throw new AppError(
      403,
      `${definition.name} is university-owned for ${governanceType}; SkillonX may store references or reconciliation data only.`,
    );
  }
  if (ownership === 'OPTIONAL') {
    throw new AppError(403, `${definition.name} is not enabled for this institution`);
  }
  return { governanceType, ownership };
}
