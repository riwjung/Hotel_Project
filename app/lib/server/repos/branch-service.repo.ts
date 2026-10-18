import "server-only";
import { z } from "zod";
import type { BranchService, BranchServiceFilter, BranchServiceInput } from "@/app/components/portal/branch-service/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;

export const branchServiceFilterSchema = z.object({
  branchId: z.coerce.number().int().positive().optional(),
  available: z.enum(["true", "false"]).transform((v) => v === "true").optional(),
});

export const branchServiceInputSchema = z
  .object({
    branchId: z.number().int().positive().nullish(),
    serviceId: z.number().int().positive(),
    branchPrice: z.number().min(0).multipleOf(0.01),
    isAvailable: z.boolean(),
    openTime: z.string().regex(HHMM, "Use HH:mm").nullable(),
    closeTime: z.string().regex(HHMM, "Use HH:mm").nullable(),
  })
  .refine((v) => (v.openTime === null) === (v.closeTime === null), {
    message: "Give both opening and closing time, or neither",
    path: ["closeTime"],
  }) satisfies z.ZodType<BranchServiceInput>;

const SELECT_BRANCH_SERVICE = `
  SELECT bs.branch_service_id AS "branchServiceId", bs.branch_id AS "branchId", b.branch_code AS "branchCode",
    s.service_id AS "serviceId", s.service_code AS "serviceCode", s.service_name AS "serviceName",
    sc.category_name AS "categoryName", s.unit, s.default_price AS "defaultPrice",
    bs.branch_price AS "branchPrice", bs.is_available AS "isAvailable",
    to_char(bs.open_time, 'HH24:MI') AS "openTime", to_char(bs.close_time, 'HH24:MI') AS "closeTime",
    s.need_assignment AS "needAssignment",
    (SELECT count(*) FROM booking_service o WHERE o.branch_service_id = bs.branch_service_id) AS "orderCount"
  FROM branch_service bs
  JOIN branch b            ON b.branch_id = bs.branch_id
  JOIN service s           ON s.service_id = bs.service_id
  JOIN service_category sc ON sc.category_id = s.category_id`;

export function listBranchServices(scope: number | null, filter: BranchServiceFilter): Promise<BranchService[]> {
  return query<BranchService>(
    `${SELECT_BRANCH_SERVICE}
     WHERE ($1::int IS NULL OR bs.branch_id = $1)
       AND ($2::boolean IS NULL OR bs.is_available = $2)
     ORDER BY b.branch_code, sc.category_name, s.service_name`,
    [scope ?? filter.branchId ?? null, filter.available ?? null],
  );
}

export async function getBranchService(db: Db, id: number, scope: number | null): Promise<BranchService | null> {
  const { rows } = await db.query<BranchService>(
    `${SELECT_BRANCH_SERVICE} WHERE bs.branch_service_id = $1 AND ($2::int IS NULL OR bs.branch_id = $2)`,
    [id, scope],
  );
  return rows[0] ?? null;
}

/** One row per (branch, service): a second one → 409 via uq_branch_service. */
export async function createBranchService(db: Db, scope: number | null, input: BranchServiceInput): Promise<number> {
  const branchId = scope ?? input.branchId;
  if (!branchId) throw new HttpError(400, "VALIDATION", "Select a branch");
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO branch_service (branch_id, service_id, branch_price, is_available, open_time, close_time)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING branch_service_id AS id`,
    [branchId, input.serviceId, input.branchPrice, input.isAvailable, input.openTime, input.closeTime],
  );
  return rows[0].id;
}

/** Existing order lines keep their unit_price snapshot; a new price only affects new orders. */
export async function updateBranchService(db: Db, id: number, scope: number | null, input: BranchServiceInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE branch_service SET branch_price = $3, is_available = $4, open_time = $5, close_time = $6
     WHERE branch_service_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [id, scope, input.branchPrice, input.isAvailable, input.openTime, input.closeTime],
  );
  return rowCount === 1;
}

/** Services already ordered are still referenced → 409 IN_USE. */
export async function deleteBranchService(db: Db, id: number, scope: number | null): Promise<boolean> {
  const { rowCount } = await db.query(
    `DELETE FROM branch_service WHERE branch_service_id = $1 AND ($2::int IS NULL OR branch_id = $2)`,
    [id, scope],
  );
  return rowCount === 1;
}
