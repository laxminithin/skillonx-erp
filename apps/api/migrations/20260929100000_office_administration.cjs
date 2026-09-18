/** Office Administration operational registers and role-scoped workspace. */
exports.up = async function up(knex) {
  if (!(await knex.schema.hasTable('office_number_sequences'))) {
    await knex.schema.createTable('office_number_sequences', (t) => { t.increments('id').primary(); t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE'); t.string('series', 16).notNullable(); t.integer('last_number').notNullable().defaultTo(0); t.unique(['college_id', 'series']); });
  }
  if (!(await knex.schema.hasTable('office_inward_register'))) {
    await knex.schema.createTable('office_inward_register', (t) => {
      t.increments('id').primary(); t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('inward_number', 64).notNullable(); t.timestamp('received_at').notNullable().defaultTo(knex.fn.now());
      t.string('sender', 255).notNullable(); t.string('organization', 255).nullable(); t.string('subject', 500).notNullable();
      t.string('mode', 32).notNullable().defaultTo('HAND'); t.string('recipient_department', 255).nullable();
      t.integer('assigned_to_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.string('status', 32).notNullable().defaultTo('RECEIVED'); t.text('remarks').nullable(); t.timestamp('acknowledged_at').nullable();
      t.integer('created_by_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT'); t.timestamps(true, true);
      t.unique(['college_id', 'inward_number'], { indexName: 'oir_college_number_uq' }); t.index(['college_id', 'status', 'received_at'], 'oir_status_idx');
    });
  }
  if (!(await knex.schema.hasTable('office_outward_register'))) {
    await knex.schema.createTable('office_outward_register', (t) => {
      t.increments('id').primary(); t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('outward_number', 64).notNullable(); t.date('outward_date').notNullable(); t.string('recipient', 255).notNullable();
      t.string('organization', 255).nullable(); t.string('address', 1000).nullable(); t.string('subject', 500).notNullable();
      t.string('dispatch_mode', 32).notNullable().defaultTo('HAND_DELIVERY'); t.string('tracking_reference', 255).nullable();
      t.string('dispatch_state', 32).notNullable().defaultTo('PREPARED'); t.integer('department_id').unsigned().nullable().references('id').inTable('departments').onDelete('SET NULL');
      t.integer('prepared_by_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT');
      t.integer('approved_by_faculty_id').unsigned().nullable().references('id').inTable('faculty_users').onDelete('SET NULL');
      t.timestamp('dispatched_at').nullable(); t.timestamp('delivered_at').nullable(); t.text('remarks').nullable(); t.timestamps(true, true);
      t.unique(['college_id', 'outward_number'], { indexName: 'oor_college_number_uq' }); t.index(['college_id', 'dispatch_state', 'outward_date'], 'oor_dispatch_idx');
    });
  }
  if (!(await knex.schema.hasTable('office_file_records'))) {
    await knex.schema.createTable('office_file_records', (t) => {
      t.increments('id').primary(); t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE');
      t.string('file_number', 64).notNullable(); t.string('title', 500).notNullable(); t.string('category', 128).nullable();
      t.string('current_custodian', 255).nullable(); t.string('department', 255).nullable(); t.string('status', 32).notNullable().defaultTo('OPEN'); t.text('remarks').nullable(); t.timestamps(true, true);
      t.unique(['college_id', 'file_number'], { indexName: 'ofr_college_number_uq' }); t.index(['college_id', 'status', 'updated_at'], 'ofr_status_idx');
    });
  }
  if (!(await knex.schema.hasTable('office_file_movements'))) {
    await knex.schema.createTable('office_file_movements', (t) => {
      t.increments('id').primary(); t.integer('file_id').unsigned().notNullable().references('id').inTable('office_file_records').onDelete('CASCADE');
      t.integer('college_id').unsigned().notNullable().references('id').inTable('colleges').onDelete('CASCADE'); t.string('sent_by', 255).nullable(); t.string('sent_to', 255).notNullable();
      t.timestamp('sent_at').notNullable().defaultTo(knex.fn.now()); t.timestamp('received_at').nullable(); t.string('purpose', 500).nullable(); t.string('status', 32).notNullable().defaultTo('IN_TRANSIT');
      t.integer('created_by_faculty_id').unsigned().notNullable().references('id').inTable('faculty_users').onDelete('RESTRICT'); t.index(['college_id', 'file_id', 'sent_at'], 'ofm_file_sent_idx');
    });
  }
};
exports.down = async function down(knex) { for (const table of ['office_file_movements', 'office_file_records', 'office_outward_register', 'office_inward_register', 'office_number_sequences']) if (await knex.schema.hasTable(table)) await knex.schema.dropTable(table); };
