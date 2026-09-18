/**
 * Admissions closure: applicant portal auth and Finance pre-student subjects.
 *
 * Finance remains canonical. Existing student fee tables are extended with an
 * explicit subject reference so an admission applicant can owe and pay an
 * admission demand before a canonical Student exists.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (await knex.schema.hasTable('admission_applicants')) {
    const hasPassword = await knex.schema.hasColumn('admission_applicants', 'password_hash');
    const hasPortalStatus = await knex.schema.hasColumn('admission_applicants', 'portal_status');
    await knex.schema.alterTable('admission_applicants', (t) => {
      if (!hasPassword) t.string('password_hash', 255).nullable();
      if (!hasPortalStatus) t.string('portal_status', 32).notNullable().defaultTo('ACTIVE');
    });
  }

  if (await knex.schema.hasTable('student_fee_demands')) {
    const hasSubjectType = await knex.schema.hasColumn('student_fee_demands', 'subject_type');
    const hasSubjectId = await knex.schema.hasColumn('student_fee_demands', 'subject_id');
    await knex.schema.alterTable('student_fee_demands', (t) => {
      if (!hasSubjectType) t.string('subject_type', 32).notNullable().defaultTo('STUDENT');
      if (!hasSubjectId) t.integer('subject_id').unsigned().nullable();
    });
    await knex.raw('UPDATE student_fee_demands SET subject_type = ?, subject_id = student_id WHERE subject_id IS NULL', ['STUDENT']);
    try {
      await knex.raw('ALTER TABLE student_fee_demands MODIFY student_id INT UNSIGNED NULL');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('check that column/key exists')) throw err;
    }
    try {
      await knex.raw('CREATE INDEX sfd_college_subject_status_idx ON student_fee_demands (college_id, subject_type, subject_id, status)');
    } catch {}
  }

  if (await knex.schema.hasTable('student_payments')) {
    const hasSubjectType = await knex.schema.hasColumn('student_payments', 'subject_type');
    const hasSubjectId = await knex.schema.hasColumn('student_payments', 'subject_id');
    await knex.schema.alterTable('student_payments', (t) => {
      if (!hasSubjectType) t.string('subject_type', 32).notNullable().defaultTo('STUDENT');
      if (!hasSubjectId) t.integer('subject_id').unsigned().nullable();
    });
    await knex.raw('UPDATE student_payments SET subject_type = ?, subject_id = student_id WHERE subject_id IS NULL', ['STUDENT']);
    try {
      await knex.raw('ALTER TABLE student_payments MODIFY student_id INT UNSIGNED NULL');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (!message.includes('check that column/key exists')) throw err;
    }
    try {
      await knex.raw('CREATE INDEX sp_college_subject_status_idx ON student_payments (college_id, subject_type, subject_id, status)');
    } catch {}
  }

  if (!(await knex.schema.hasTable('admission_finance_demands'))) {
    await knex.schema.createTable('admission_finance_demands', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('applicant_id').unsigned().notNullable().references('id').inTable('admission_applicants').onDelete('CASCADE');
      t.integer('demand_id').unsigned().notNullable().references('id').inTable('student_fee_demands').onDelete('RESTRICT');
      t.string('purpose', 64).notNullable().defaultTo('ADMISSION_FEE');
      t.integer('created_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamps(true, true);
      t.unique(['applicant_id', 'purpose'], { indexName: 'adm_fin_app_purpose_unique' });
      t.unique(['demand_id'], { indexName: 'adm_fin_demand_unique' });
      t.index(['college_id', 'applicant_id'], 'adm_fin_college_app_idx');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('admission_finance_demands');

  if (await knex.schema.hasColumn('student_payments', 'subject_type')) {
    try {
      await knex.raw('DROP INDEX sp_college_subject_status_idx ON student_payments');
    } catch {}
    await knex.schema.alterTable('student_payments', (t) => {
      t.dropColumn('subject_type');
      t.dropColumn('subject_id');
    });
  }

  if (await knex.schema.hasColumn('student_fee_demands', 'subject_type')) {
    try {
      await knex.raw('DROP INDEX sfd_college_subject_status_idx ON student_fee_demands');
    } catch {}
    await knex.schema.alterTable('student_fee_demands', (t) => {
      t.dropColumn('subject_type');
      t.dropColumn('subject_id');
    });
  }

  if (await knex.schema.hasColumn('admission_applicants', 'password_hash')) {
    await knex.schema.alterTable('admission_applicants', (t) => {
      t.dropColumn('password_hash');
      t.dropColumn('portal_status');
    });
  }
};
