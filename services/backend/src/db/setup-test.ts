import postgres from 'postgres';

async function setupTestDb() {
  const dbName = 'odyssey_test';
  const adminUrl =
    process.env.DATABASE_URL?.replace(/\/[^/]+$/, '/postgres') ??
    'postgresql://odyssey:odyssey@localhost:5432/postgres';

  const admin = postgres(adminUrl, { max: 1 });

  const result = await admin<{ exists: boolean }[]>`
    SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = ${dbName}) AS exists
  `;
  const exists = result[0]?.exists ?? false;

  if (!exists) {
    await admin.unsafe(`CREATE DATABASE ${dbName}`);
    console.log(`Created database ${dbName}`);
  }

  await admin.end();
}

setupTestDb().catch((err) => {
  console.error('Test DB setup failed:', err);
  process.exit(1);
});
