require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const connection = process.env.DATABASE_URL || 'mysql://survey:survey@127.0.0.1:3307/skillonx_survey';

/** @type {import('knex').Knex.Config} */
module.exports = {
  client: 'mysql2',
  connection,
  migrations: {
    directory: './migrations',
    extension: 'cjs',
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: './seeds',
    extension: 'cjs',
  },
  pool: { min: 0, max: 10 },
};
