// Rebuilds the database from db/schema/*.sql then db/seed/*.sql (sorted by file name)
// and checks the result against er-design.md: 31 tables, 49 foreign keys.
// Usage: npm run db:reset   (reads DATABASE_URL from .env)

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const EXPECTED_TABLES = 31;
const EXPECTED_FKS = 49;
const DIRS = ["db/schema", "db/seed"];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — copy .env.example to .env first.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });

try {
  await client.connect();
} catch (err) {
  console.error(`Cannot connect to ${url.replace(/:[^:@/]+@/, ":***@")}`);
  console.error(`  ${err.message}`);
  console.error("Is Docker Desktop running? Try: npm run db:up");
  process.exit(1);
}

let failed = false;
try {
  for (const dir of DIRS) {
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const rel = path.posix.join(dir, file);
      process.stdout.write(`→ ${rel} … `);
      const sql = await readFile(rel, "utf8");
      try {
        await client.query(sql);
        console.log("ok");
      } catch (err) {
        console.log("FAILED");
        console.error(`  ${err.message}`);
        if (err.where) console.error(`  where: ${err.where}`);
        if (err.position) console.error(`  at character ${err.position}`);
        throw err;
      }
    }
  }

  const { rows } = await client.query(`
    SELECT
      (SELECT count(*)::int FROM information_schema.tables
        WHERE table_schema = 'public' AND table_type = 'BASE TABLE') AS tables,
      (SELECT count(*)::int FROM information_schema.table_constraints
        WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY') AS fks,
      (SELECT count(DISTINCT trigger_name)::int FROM information_schema.triggers
        WHERE trigger_schema = 'public') AS triggers,
      (SELECT count(*)::int FROM information_schema.views
        WHERE table_schema = 'public') AS views
  `);
  const { tables, fks, triggers, views } = rows[0];

  console.log("");
  console.log(`tables   ${tables} (expected ${EXPECTED_TABLES}) ${tables === EXPECTED_TABLES ? "✓" : "✗"}`);
  console.log(`FKs      ${fks} (expected ${EXPECTED_FKS}) ${fks === EXPECTED_FKS ? "✓" : "✗"}`);
  console.log(`triggers ${triggers} · views ${views}`);

  const { rows: tableNames } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
  const empty = [];
  let totalRows = 0;
  for (const { table_name } of tableNames) {
    const { rows: c } = await client.query(`SELECT count(*)::int AS n FROM "${table_name}"`);
    totalRows += c[0].n;
    if (c[0].n === 0) empty.push(table_name);
  }
  console.log(`rows     ${totalRows} seeded${empty.length ? ` · empty: ${empty.join(", ")}` : " · every table has data"}`);

  if (tables !== EXPECTED_TABLES || fks !== EXPECTED_FKS) failed = true;
} catch {
  failed = true;
} finally {
  await client.end();
}

if (failed) {
  console.error("\ndb:reset FAILED");
  process.exit(1);
}
console.log("\ndb:reset done");
