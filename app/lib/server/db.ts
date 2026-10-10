import "server-only";
import pg from "pg";

// pg returns NUMERIC and BIGINT (count(*)) as strings to avoid precision loss.
// Hotel amounts fit comfortably in a JS number, so parse them once here.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => Number(v));
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => Number(v));
// Keep DATE as 'YYYY-MM-DD'. Parsing it into a JS Date shifts it by the
// server's timezone offset and a check-in date can silently move a day.
pg.types.setTypeParser(pg.types.builtins.DATE, (v) => v);

const globalForPg = globalThis as unknown as { hotelPool?: pg.Pool };

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — copy .env.example to .env");
  }
  return new pg.Pool({ connectionString, max: 10 });
}

// Reuse one pool across hot reloads in dev (each reload re-evaluates modules).
export const pool: pg.Pool = globalForPg.hotelPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalForPg.hotelPool = pool;

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool.query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends pg.QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export type Db = Pick<pg.PoolClient, "query">;
