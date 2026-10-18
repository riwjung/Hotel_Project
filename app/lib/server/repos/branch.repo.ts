import "server-only";
import { z } from "zod";
import { BRANCH_STATUSES, type Branch, type BranchInput } from "@/app/components/portal/branch/types";
import { query, queryOne, type Db } from "../db";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const optionalText = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));

export const branchInputSchema = z.object({
  branchCode: z.string().trim().toUpperCase().min(2).max(10),
  branchName: z.string().trim().min(1).max(100),
  province: z.string().trim().min(1).max(50),
  address: optionalText(255),
  phone: optionalText(20),
  checkInTime: z.string().regex(HHMM, "Use HH:mm"),
  checkOutTime: z.string().regex(HHMM, "Use HH:mm"),
  branchStatus: z.enum(BRANCH_STATUSES),
}) satisfies z.ZodType<BranchInput>;

const SELECT_BRANCH = `
  SELECT
    b.branch_id                         AS "branchId",
    b.branch_code                       AS "branchCode",
    b.branch_name                       AS "branchName",
    b.province,
    b.address,
    b.phone,
    to_char(b.check_in_time,  'HH24:MI') AS "checkInTime",
    to_char(b.check_out_time, 'HH24:MI') AS "checkOutTime",
    b.branch_status                     AS "branchStatus",
    (SELECT count(*) FROM room r WHERE r.branch_id = b.branch_id) AS "roomCount",
    (SELECT count(*) FROM employee e
      WHERE e.branch_id = b.branch_id AND e.employee_status <> 'RESIGNED') AS "employeeCount",
    (SELECT count(*) FROM booking bk
      WHERE bk.branch_id = b.branch_id
        AND bk.booking_status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN')) AS "activeBookingCount"
  FROM branch b`;

/** @param scope null = all branches (chain), otherwise only that branch */
export function listBranches(scope: number | null): Promise<Branch[]> {
  return query<Branch>(
    `${SELECT_BRANCH}
     WHERE ($1::int IS NULL OR b.branch_id = $1)
     ORDER BY b.branch_code`,
    [scope],
  );
}

export function getBranch(id: number, scope: number | null, db?: Db): Promise<Branch | null> {
  const sql = `${SELECT_BRANCH} WHERE b.branch_id = $1 AND ($2::int IS NULL OR b.branch_id = $2)`;
  if (db) return db.query<Branch>(sql, [id, scope]).then((r) => r.rows[0] ?? null);
  return queryOne<Branch>(sql, [id, scope]);
}

export async function createBranch(db: Db, input: BranchInput): Promise<number> {
  const { rows } = await db.query<{ branchId: number }>(
    `INSERT INTO branch (branch_code, branch_name, province, address, phone,
                         check_in_time, check_out_time, branch_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING branch_id AS "branchId"`,
    [
      input.branchCode,
      input.branchName,
      input.province,
      input.address,
      input.phone,
      input.checkInTime,
      input.checkOutTime,
      input.branchStatus,
    ],
  );
  return rows[0].branchId;
}

export async function updateBranch(db: Db, id: number, input: BranchInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE branch SET
       branch_code = $2, branch_name = $3, province = $4, address = $5, phone = $6,
       check_in_time = $7, check_out_time = $8, branch_status = $9
     WHERE branch_id = $1`,
    [
      id,
      input.branchCode,
      input.branchName,
      input.province,
      input.address,
      input.phone,
      input.checkInTime,
      input.checkOutTime,
      input.branchStatus,
    ],
  );
  return rowCount === 1;
}

/** FK violations (rooms, staff, bookings …) surface as 409 via http.ts */
export async function deleteBranch(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM branch WHERE branch_id = $1`, [id]);
  return rowCount === 1;
}
