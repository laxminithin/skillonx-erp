/** Reconcile the new request sequence with references created before the sequence table. */
exports.up = async function up(knex) {
  const year = new Date().getFullYear();
  const colleges = await knex('student_service_requests')
    .whereNotNull('request_number')
    .select('college_id')
    .max({ last_number: knex.raw("CAST(SUBSTRING_INDEX(request_number, '/', -1) AS UNSIGNED)") })
    .groupBy('college_id');
  for (const row of colleges) {
    const max = Number(row.last_number ?? 0);
    await knex('student_service_number_sequences')
      .insert({ college_id: row.college_id, year, last_number: max })
      .onConflict(['college_id', 'year'])
      .merge({ last_number: knex.raw('GREATEST(last_number, VALUES(last_number))') });
  }
};

exports.down = async function down() {};
