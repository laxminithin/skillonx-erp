/**
 * Scheme shells only — no fabricated CO or PO statements.
 * @param {import('knex').Knex} knex
 */
exports.seed = async function seed(knex) {
  if (!(await knex.schema.hasTable('academic_schemes'))) return;
  const colleges = await knex('colleges').select('id');
  const shells = [
    { name: 'VTU 2021 Scheme', code: 'VTU-2021', start_year: 2021, end_year: 2024, university: 'Visvesvaraya Technological University' },
    { name: 'VTU 2022 Scheme', code: 'VTU-2022', start_year: 2022, end_year: null, university: 'Visvesvaraya Technological University' },
    { name: 'VTU 2025 Scheme', code: 'VTU-2025', start_year: 2025, end_year: null, university: 'Visvesvaraya Technological University' },
  ];
  for (const college of colleges) {
    for (const shell of shells) {
      const exists = await knex('academic_schemes').where({ college_id: college.id, code: shell.code }).first();
      if (exists) continue;
      await knex('academic_schemes').insert({
        college_id: college.id,
        name: shell.name,
        code: shell.code,
        university: shell.university,
        start_year: shell.start_year,
        end_year: shell.end_year,
        effective_academic_year: String(shell.start_year),
        status: 'ACTIVE',
      });
    }
  }
};
