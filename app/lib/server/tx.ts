import "server-only";
import type pg from "pg";
import { pool } from "./db";
import type { Session } from "./auth";

type TxOptions = {
  /** Remark stored in booking_status_log for status changes made in this transaction. */
  statusRemark?: string;
};

/**
 * Runs `fn` in a transaction with the acting employee exposed to triggers.
 * `app.emp_id` / `app.status_remark` are transaction-local (set_config … true),
 * so they never leak to another request that reuses the pooled connection.
 */
export async function withTx<T>(
  session: Session,
  fn: (client: pg.PoolClient) => Promise<T>,
  options: TxOptions = {},
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "SELECT set_config('app.emp_id', $1, true), set_config('app.status_remark', $2, true)",
      [String(session.employeeId), options.statusRemark ?? ""],
    );
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
