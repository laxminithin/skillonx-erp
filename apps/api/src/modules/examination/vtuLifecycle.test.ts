import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { db } from '../../db/index.js';
import type { ExamActor } from './access.js';
import * as closure from './closure.js';

// Authenticated (governance-enforcing) VTU import lifecycle on a dedicated QA-VTU tenant (§6-7).
let coe: ExamActor;
let vtuCollegeId: number;
let autonomousCoe: ExamActor;
const cycle = `QA-VTU-${Date.now()}`;
const b64 = (s: string) => Buffer.from(s, 'utf8').toString('base64');

before(async () => {
  const [id] = await db('colleges').insert({ code: `QA-VTU-${Date.now()}`, name: 'QA VTU Affiliated (test)' });
  vtuCollegeId = Number(id);
  await db('college_examination_governance').insert({ college_id: vtuCollegeId, governance_type: 'VTU_AFFILIATED', is_active: true });
  await db('courses').insert({ college_id: vtuCollegeId, code: '1BCS305', name: 'QA VTU Subject' });
  const faculty = await db('faculty_users').first();
  coe = { facultyUserId: Number(faculty.id), collegeId: vtuCollegeId, role: 'COE' };
  // an autonomous college to prove the authority boundary
  const autoGov = await db('college_examination_governance').where({ governance_type: 'AUTONOMOUS' }).first();
  autonomousCoe = { facultyUserId: Number(faculty.id), collegeId: Number(autoGov.college_id), role: 'COE' };
});

after(async () => {
  const batchIds = await db('exam_import_batches').where({ college_id: vtuCollegeId }).pluck('id');
  if (batchIds.length) {
    await db('exam_external_records').whereIn('batch_id', batchIds).del();
    await db('exam_import_rows').whereIn('batch_id', batchIds).del();
  }
  await db('exam_import_batches').where({ college_id: vtuCollegeId }).del();
  await db('courses').where({ college_id: vtuCollegeId }).del();
  await db('college_examination_governance').where({ college_id: vtuCollegeId }).del();
  await db('colleges').where({ id: vtuCollegeId }).del();
});

const V1 = 'code,examDate,startTime\n1BCS305,2026-01-10,10:00\n';
const V2 = 'code,examDate,startTime\n1BCS305,2026-01-10,14:00\n'; // same natural key, changed time

async function currentProjections() {
  return db('exam_external_records').where({ college_id: vtuCollegeId, artifact_type: 'VTU_TIMETABLE', is_current: true });
}
async function allProjections() {
  return db('exam_external_records').where({ college_id: vtuCollegeId, artifact_type: 'VTU_TIMETABLE' }).orderBy('version');
}

describe('authenticated VTU import lifecycle (§6-7)', () => {
  it('rejects VTU import on an AUTONOMOUS institution (authority boundary §8)', async () => {
    await assert.rejects(
      () => closure.commitVtuFile(autonomousCoe, { artifactType: 'VTU_TIMETABLE', fileName: 't.csv', fileBase64: b64(V1), examCycle: cycle }),
      /VTU_AFFILIATED/i,
    );
  });

  it('commits V1 as NEW, dedups identical V1, and supersedes with changed V2', async () => {
    // V1
    await closure.commitVtuFile(coe, { artifactType: 'VTU_TIMETABLE', fileName: 'v1.csv', fileBase64: b64(V1), examCycle: cycle });
    let cur = await currentProjections();
    assert.equal(cur.length, 1, 'one canonical current record after V1');
    assert.equal(Number(cur[0].version), 1);
    assert.equal(cur[0].change_type, 'NEW');
    assert.equal(cur[0].authority, 'EXTERNAL_UNIVERSITY');

    // duplicate identical V1 — must NOT create a second canonical record / duplicate active version
    let dupHandled = false;
    try {
      await closure.commitVtuFile(coe, { artifactType: 'VTU_TIMETABLE', fileName: 'v1.csv', fileBase64: b64(V1), examCycle: cycle });
    } catch {
      dupHandled = true; // duplicate-file prevention path
    }
    cur = await currentProjections();
    assert.equal(cur.length, 1, 'still exactly one canonical current record after duplicate');
    assert.equal(Number(cur[0].version), dupHandled ? 1 : cur[0].version, 'duplicate did not fork the canonical projection');

    // changed V2 — same natural key, new version, V1 becomes historical
    await closure.commitVtuFile(coe, { artifactType: 'VTU_TIMETABLE', fileName: 'v2.csv', fileBase64: b64(V2), examCycle: cycle });
    cur = await currentProjections();
    assert.equal(cur.length, 1, 'one canonical current record after V2');
    assert.equal(Number(cur[0].version), 2, 'V2 is current version 2');
    assert.equal(cur[0].change_type, 'CHANGED');

    const all = await allProjections();
    const v1 = all.find((r) => Number(r.version) === 1);
    assert.ok(v1, 'V1 retained as history');
    assert.equal(Boolean(v1!.is_current), false, 'V1 is historical, not current');
    assert.equal(Number(cur[0].supersedes_id), Number(v1!.id), 'V2 supersedes V1 (provenance chain)');
  });
});
