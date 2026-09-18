import { readFile } from 'node:fs/promises';
import { db } from '../db/index.js';
import { importCopoMasterFile } from '../modules/copo/workbookImport.js';
import { discoverCopoMasterFiles } from '../modules/copo/workbookParser.js';
import { targetColleges } from '../modules/academicContent.js';

const collegeCode = process.argv.find((a) => a.startsWith('--college-code='))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run');

async function main() {
  const masters = await discoverCopoMasterFiles();
  if (!masters.length) {
    throw new Error('No CO–PO master workbook found under apps/web/public.');
  }
  const master = masters[0];
  console.log(`Master mapper: ${master.filePath}`);
  console.log(`Sheets: ${master.sheets.join(', ')}`);

  const colleges = await targetColleges(collegeCode);
  if (!colleges.length) throw new Error('No college found.');
  const buffer = await readFile(master.filePath);

  for (const college of colleges) {
    const faculty = await db('faculty_users').where({ college_id: college.id }).orderBy('id').first();
    if (!faculty) {
      console.warn(`Skipping ${college.code}: no faculty user.`);
      continue;
    }
    const actor = {
      facultyUserId: Number(faculty.id),
      collegeId: Number(college.id),
      departmentId: faculty.department_id != null ? Number(faculty.department_id) : null,
      role: String(faculty.role || 'COLLEGE_ADMIN'),
    };
    if (!['SUPER_ADMIN', 'COLLEGE_ADMIN'].includes(actor.role)) actor.role = 'COLLEGE_ADMIN';

    const preview = dryRun
      ? await (await import('../modules/copo/workbookImport.js')).previewWorkbookImport(
          actor.collegeId,
          actor,
          buffer,
          master.fileName,
        )
      : null;
    const result = dryRun
      ? { preview, committed: null }
      : await importCopoMasterFile(actor.collegeId, actor, buffer, master.fileName);

    const p = result.preview;
    console.log(`\n=== ${college.code} ===`);
    console.log(`Subjects in file: ${p.summary.subjectsInFile}`);
    console.log(`Matched: ${p.summary.existingSubjectsMatched}  New: ${p.summary.newSubjects}`);
    console.log(`Course-code conflicts: ${p.summary.courseCodeConflicts}  Scheme conflicts: ${p.summary.schemeConflicts}  Ambiguous: ${p.summary.ambiguous}`);
    console.log(`COs in file: ${p.summary.officialCos}  New COs: ${p.summary.newCos}  Unchanged: ${p.summary.existingCosMatched}`);
    console.log(`POs: ${p.summary.pos}  Mappings: ${p.summary.mappingRelationships}`);
    if (p.warnings.length) console.log(`Warnings: ${p.warnings.length}`);
    if (p.errors.length) console.log(`Errors:\n${p.errors.join('\n')}`);
    for (const s of p.subjects.filter((row) => row.matchStatus.includes('CONFLICT') || row.matchStatus === 'AMBIGUOUS')) {
      console.log(
        `${s.matchStatus}: mapper ${s.name} ${s.code} ${s.scheme} vs existing ${s.existingName} ${s.existingCode}`,
      );
    }
    if (result.committed) {
      console.log(
        `Imported COs: ${result.committed.outcomes}  Unchanged COs: ${result.committed.outcomesUnchanged}  Mappings: ${result.committed.mappings}  Unchanged mappings: ${result.committed.mappingsUnchanged}  Needs review: ${result.committed.needsReview}`,
      );
      console.log(
        `PSOs created: ${result.committed.psosCreated} updated: ${result.committed.psosUpdated} unchanged: ${result.committed.psosUnchanged}`,
      );
      console.log(
        `CO–PSO: ${result.committed.coPsoMappings} (unchanged ${result.committed.coPsoMappingsUnchanged})  SDGs: ${result.committed.sdgsUpserted}  CO–SDG: ${result.committed.coSdgMappings} (unchanged ${result.committed.coSdgMappingsUnchanged})`,
      );
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.destroy();
  });
