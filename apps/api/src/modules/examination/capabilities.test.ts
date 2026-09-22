import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db } from '../../db/index.js';
import { assertInstitutionOwnsCapability, capabilityMatrix } from './capabilities.js';
import type { ExamActor } from './access.js';

async function context() {
  if (!(await db.schema.hasTable('college_examination_governance'))) return null;
  const college = await db('colleges').first();
  const coe = college ? await db('faculty_users').where({ college_id: college.id, role: 'COE' }).first() : null;
  if (!college || !coe) return null;
  return {
    college,
    actor: {
      facultyUserId: Number(coe.id),
      collegeId: Number(college.id),
      departmentId: coe.department_id == null ? null : Number(coe.department_id),
      role: 'COE',
    } satisfies ExamActor,
  };
}

describe('examination governance capabilities', () => {
  it('classifies result processing as institutional for autonomous colleges', async () => {
    const ctx = await context();
    if (!ctx) return;
    const previous = await db('college_examination_governance').where({ college_id: ctx.college.id }).first();
    await db('college_examination_governance')
      .insert({ college_id: ctx.college.id, governance_type: 'AUTONOMOUS', is_active: true })
      .onConflict('college_id')
      .merge({ governance_type: 'AUTONOMOUS', is_active: true });
    try {
      const matrix = await capabilityMatrix(Number(ctx.college.id));
      const result = matrix.capabilities.find((capability) => capability.capabilityKey === 'RESULT_PROCESSING');
      assert.equal(matrix.governanceType, 'AUTONOMOUS');
      assert.equal(result?.ownership, 'INSTITUTIONAL');
      await assert.doesNotReject(() => assertInstitutionOwnsCapability(ctx.actor, 'RESULT_PROCESSING'));
    } finally {
      if (previous) {
        await db('college_examination_governance').where({ college_id: ctx.college.id }).update({
          governance_type: previous.governance_type,
          affiliating_university: previous.affiliating_university,
          capability_overrides: previous.capability_overrides,
          is_active: previous.is_active,
        });
      }
    }
  });

  it('blocks institutional result processing for VTU-affiliated colleges', async () => {
    const ctx = await context();
    if (!ctx) return;
    const previous = await db('college_examination_governance').where({ college_id: ctx.college.id }).first();
    await db('college_examination_governance')
      .insert({
        college_id: ctx.college.id,
        governance_type: 'VTU_AFFILIATED',
        affiliating_university: 'Visvesvaraya Technological University',
        is_active: true,
      })
      .onConflict('college_id')
      .merge({
        governance_type: 'VTU_AFFILIATED',
        affiliating_university: 'Visvesvaraya Technological University',
        is_active: true,
      });
    try {
      const matrix = await capabilityMatrix(Number(ctx.college.id));
      const result = matrix.capabilities.find((capability) => capability.capabilityKey === 'RESULT_PROCESSING');
      assert.equal(matrix.governanceType, 'VTU_AFFILIATED');
      assert.equal(result?.ownership, 'UNIVERSITY');
      await assert.rejects(() => assertInstitutionOwnsCapability(ctx.actor, 'RESULT_PROCESSING'), /university-owned/i);
    } finally {
      if (previous) {
        await db('college_examination_governance').where({ college_id: ctx.college.id }).update({
          governance_type: previous.governance_type,
          affiliating_university: previous.affiliating_university,
          capability_overrides: previous.capability_overrides,
          is_active: previous.is_active,
        });
      }
    }
  });
});
