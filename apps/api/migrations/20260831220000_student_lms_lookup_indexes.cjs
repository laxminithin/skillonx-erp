/**
 * Additive lookup indexes for Student LMS and attendance.
 * Safe on current MySQL/MariaDB: named indexes, IF NOT EXISTS via hasIndex.
 *
 * @param {import('knex').Knex} knex
 */
async function hasIndex(knex, table, indexName) {
  const [rows] = await knex.raw(
    'SELECT INDEX_NAME FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ? LIMIT 1',
    [table, indexName],
  );
  return Array.isArray(rows) && rows.length > 0;
}

exports.up = async function up(knex) {
  if ((await knex.schema.hasTable('assignment_submissions')) && !(await hasIndex(knex, 'assignment_submissions', 'asgn_sub_college_student_status_idx'))) {
    await knex.schema.alterTable('assignment_submissions', (t) => {
      t.index(['college_id', 'student_id', 'status'], 'asgn_sub_college_student_status_idx');
    });
  }
  if ((await knex.schema.hasTable('quiz_attempts')) && !(await hasIndex(knex, 'quiz_attempts', 'quiz_att_college_student_status_idx'))) {
    await knex.schema.alterTable('quiz_attempts', (t) => {
      t.index(['college_id', 'student_id', 'status'], 'quiz_att_college_student_status_idx');
    });
  }
  if ((await knex.schema.hasTable('academic_class_subjects')) && !(await hasIndex(knex, 'academic_class_subjects', 'acs_class_course_idx'))) {
    await knex.schema.alterTable('academic_class_subjects', (t) => {
      t.index(['academic_class_id', 'course_id', 'is_active'], 'acs_class_course_idx');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  if ((await knex.schema.hasTable('assignment_submissions')) && (await hasIndex(knex, 'assignment_submissions', 'asgn_sub_college_student_status_idx'))) {
    await knex.schema.alterTable('assignment_submissions', (t) => {
      t.dropIndex(['college_id', 'student_id', 'status'], 'asgn_sub_college_student_status_idx');
    });
  }
  if ((await knex.schema.hasTable('quiz_attempts')) && (await hasIndex(knex, 'quiz_attempts', 'quiz_att_college_student_status_idx'))) {
    await knex.schema.alterTable('quiz_attempts', (t) => {
      t.dropIndex(['college_id', 'student_id', 'status'], 'quiz_att_college_student_status_idx');
    });
  }
  if ((await knex.schema.hasTable('academic_class_subjects')) && (await hasIndex(knex, 'academic_class_subjects', 'acs_class_course_idx'))) {
    await knex.schema.alterTable('academic_class_subjects', (t) => {
      t.dropIndex(['academic_class_id', 'course_id', 'is_active'], 'acs_class_course_idx');
    });
  }
};
