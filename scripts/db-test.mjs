// Runs db/tests/*.sql against the seeded database.
// Each file runs inside BEGIN … ROLLBACK, so tests never change data.
// Test cases RAISE NOTICE 'PASS: …' on success and RAISE EXCEPTION 'FAIL: …' otherwise.
// Usage: npm run db:test   (run npm run db:reset first)

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set — copy .env.example to .env first.");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url });
await client.connect();

let passed = 0;
client.on("notice", (msg) => {
  if (msg.message.startsWith("PASS:")) {
    passed += 1;
    console.log(`  ✓ ${msg.message.slice(5).trim()}`);
  } else {
    console.log(`  · ${msg.message}`);
  }
});

const dir = "db/tests";
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
let failed = false;

for (const file of files) {
  const rel = path.posix.join(dir, file);
  console.log(rel);
  const sql = await readFile(rel, "utf8");
  try {
    await client.query("BEGIN");
    await client.query(sql);
  } catch (err) {
    failed = true;
    console.error(`  ✗ ${err.message}`);
  } finally {
    await client.query("ROLLBACK");
  }
}

await client.end();
console.log(`\n${passed} passed${failed ? ", 1+ FAILED" : ""}`);
process.exit(failed ? 1 : 0);
