/**
 * Student LMS learning experience.
 *
 * Student-specific tables store membership side-effects only:
 * progress, last location, notifications, reads, bookmarks, profile corrections.
 * Canonical subjects, modules, lessons, assignments, quizzes, assessments, and PYQs
 * remain the lecturer records.
 *
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('student_learning_progress'))) {
    await knex.schema.createTable('student_learning_progress', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().nullable().references('id').inTable('academic_classes').onDelete('SET NULL');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
      t.integer('module_id').unsigned().nullable();
      t.integer('topic_id').unsigned().nullable();
      t.string('activity_type', 32).notNullable();
      t.string('activity_id', 64).notNullable();
      t.string('status', 32).notNullable().defaultTo('COMPLETED');
      t.decimal('progress_percentage', 5, 2).notNullable().defaultTo(100);
      t.timestamp('completed_at').nullable();
      t.timestamps(true, true);
      t.unique(['student_id', 'course_id', 'activity_type', 'activity_id'], {
        indexName: 'slp_student_activity_unique',
      });
      t.index(['college_id', 'student_id', 'academic_class_id'], 'slp_student_class_idx');
      t.index(['college_id', 'student_id', 'course_id'], 'slp_student_course_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_learning_positions'))) {
    await knex.schema.createTable('student_learning_positions', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().nullable().references('id').inTable('academic_classes').onDelete('SET NULL');
      t.integer('course_id').unsigned().notNullable().references('id').inTable('courses').onDelete('CASCADE');
      t.integer('module_id').unsigned().nullable();
      t.integer('topic_id').unsigned().nullable();
      t.string('path', 255).notNullable();
      t.string('label', 255).notNullable();
      t.timestamps(true, true);
      t.unique(['student_id', 'course_id'], { indexName: 'slpos_student_course_unique' });
      t.index(['college_id', 'student_id', 'updated_at'], 'slpos_student_updated_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_notifications'))) {
    await knex.schema.createTable('student_notifications', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('academic_class_id').unsigned().nullable().references('id').inTable('academic_classes').onDelete('SET NULL');
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
      t.string('type', 64).notNullable();
      t.string('title', 255).notNullable();
      t.text('body').nullable();
      t.string('link', 255).nullable();
      t.string('related_type', 32).nullable();
      t.string('related_id', 64).nullable();
      t.string('dedupe_key', 191).notNullable();
      t.string('status', 16).notNullable().defaultTo('UNREAD');
      t.timestamp('read_at').nullable();
      t.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['student_id', 'dedupe_key'], { indexName: 'sn_student_dedupe_unique' });
      t.index(['college_id', 'student_id', 'status', 'created_at'], 'sn_student_status_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_announcement_reads'))) {
    await knex.schema.createTable('student_announcement_reads', (t) => {
      t.increments('id').primary();
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('announcement_id').unsigned().notNullable().references('id').inTable('academic_class_announcements').onDelete('CASCADE');
      t.timestamp('read_at').notNullable().defaultTo(knex.fn.now());
      t.unique(['student_id', 'announcement_id'], { indexName: 'sar_student_announcement_unique' });
    });
  }

  if (!(await knex.schema.hasTable('student_bookmarks'))) {
    await knex.schema.createTable('student_bookmarks', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.integer('course_id').unsigned().nullable().references('id').inTable('courses').onDelete('SET NULL');
      t.string('kind', 32).notNullable();
      t.string('ref_id', 64).notNullable();
      t.string('title', 255).notNullable();
      t.string('path', 255).notNullable();
      t.timestamps(true, true);
      t.unique(['student_id', 'kind', 'ref_id'], { indexName: 'sb_student_ref_unique' });
      t.index(['college_id', 'student_id'], 'sb_college_student_idx');
    });
  }

  if (!(await knex.schema.hasTable('student_profile_corrections'))) {
    await knex.schema.createTable('student_profile_corrections', (t) => {
      t.increments('id').primary();
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.integer('student_id').unsigned().notNullable().references('id').inTable('students').onDelete('CASCADE');
      t.string('field', 64).notNullable();
      t.string('current_value', 255).nullable();
      t.string('requested_value', 255).notNullable();
      t.text('reason').nullable();
      t.string('status', 32).notNullable().defaultTo('PENDING');
      t.integer('reviewed_by').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('reviewed_at').nullable();
      t.timestamps(true, true);
      t.index(['college_id', 'student_id', 'status'], 'spc_student_status_idx');
    });
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  await knex.schema.dropTableIfExists('student_profile_corrections');
  await knex.schema.dropTableIfExists('student_bookmarks');
  await knex.schema.dropTableIfExists('student_announcement_reads');
  await knex.schema.dropTableIfExists('student_notifications');
  await knex.schema.dropTableIfExists('student_learning_positions');
  await knex.schema.dropTableIfExists('student_learning_progress');
};
