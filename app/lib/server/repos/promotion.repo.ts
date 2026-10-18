import "server-only";
import { z } from "zod";
import {
  DISCOUNT_TYPES,
  PROMOTION_STATUSES,
  type Promotion,
  type PromotionInput,
} from "@/app/components/portal/promotion/types";
import { query, type Db } from "../db";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const promotionInputSchema = z
  .object({
    promotionCode: z.string().trim().toUpperCase().min(2).max(30).regex(/^[A-Z0-9_-]+$/, "Use letters, digits, - or _"),
    promotionName: z.string().trim().min(1).max(100),
    discountType: z.enum(DISCOUNT_TYPES),
    discountValue: z.number().positive().multipleOf(0.01),
    minimumAmount: z.number().min(0).multipleOf(0.01),
    startDate: isoDate,
    endDate: isoDate,
    usageLimit: z.number().int().min(1).nullable(),
    promotionStatus: z.enum(PROMOTION_STATUSES),
  })
  .refine((v) => v.discountType !== "PERCENT" || v.discountValue <= 100, {
    message: "A percent discount must be between 0 and 100",
    path: ["discountValue"],
  })
  .refine((v) => v.startDate <= v.endDate, { message: "End date must be on or after start date", path: ["endDate"] }) satisfies z.ZodType<PromotionInput>;

const SELECT_PROMOTION = `
  SELECT p.promotion_id AS "promotionId", p.promotion_code AS "promotionCode", p.promotion_name AS "promotionName",
    p.discount_type AS "discountType", p.discount_value AS "discountValue", p.minimum_amount AS "minimumAmount",
    p.start_date AS "startDate", p.end_date AS "endDate", p.usage_limit AS "usageLimit",
    p.promotion_status AS "promotionStatus",
    (SELECT count(*) FROM booking b WHERE b.promotion_id = p.promotion_id AND b.booking_status <> 'CANCELLED') AS "usedCount",
    EXISTS (SELECT 1 FROM booking b WHERE b.promotion_id = p.promotion_id) AS "inUse"
  FROM promotion p`;

// Promotions are chain-level (no branch_id): only PROMOTION_MANAGE (owner) reaches these.
export function listPromotions(): Promise<Promotion[]> {
  return query<Promotion>(`${SELECT_PROMOTION} ORDER BY p.start_date DESC, p.promotion_code`);
}

export async function getPromotion(db: Db, id: number): Promise<Promotion | null> {
  const { rows } = await db.query<Promotion>(`${SELECT_PROMOTION} WHERE p.promotion_id = $1`, [id]);
  return rows[0] ?? null;
}

const values = (v: PromotionInput) => [
  v.promotionCode,
  v.promotionName,
  v.discountType,
  v.discountValue,
  v.minimumAmount,
  v.startDate,
  v.endDate,
  v.usageLimit,
  v.promotionStatus,
];

export async function createPromotion(db: Db, input: PromotionInput): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO promotion (promotion_code, promotion_name, discount_type, discount_value, minimum_amount,
                            start_date, end_date, usage_limit, promotion_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING promotion_id AS id`,
    values(input),
  );
  return rows[0].id;
}

/** R18 rejects new discount terms on a promotion that bookings already use. */
export async function updatePromotion(db: Db, id: number, input: PromotionInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE promotion SET promotion_code = $2, promotion_name = $3, discount_type = $4, discount_value = $5,
       minimum_amount = $6, start_date = $7, end_date = $8, usage_limit = $9, promotion_status = $10
     WHERE promotion_id = $1`,
    [id, ...values(input)],
  );
  return rowCount === 1;
}

/** Used promotions are still referenced by bookings → 409 IN_USE via http.ts */
export async function deletePromotion(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM promotion WHERE promotion_id = $1`, [id]);
  return rowCount === 1;
}
