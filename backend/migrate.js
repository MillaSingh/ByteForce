const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
  host: 'clinic-app-db.postgres.database.azure.com',
  port: 5432,
  database: 'postgres',
  user: 'bdw',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();

  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`Running migration: ${file}`);
    await pool.query(sql);
    console.log(`✓ Done: ${file}`);
  }

  await pool.end();
  console.log('All migrations complete!');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});