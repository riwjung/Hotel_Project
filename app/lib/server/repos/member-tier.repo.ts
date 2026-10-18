import "server-only";
import { z } from "zod";
import type { MemberTierInput, MemberTierRow } from "@/app/components/portal/tier/types";
import { query, type Db } from "../db";

export const memberTierInputSchema = z.object({
  tierName: z.string().trim().min(1).max(30),
  minPoint: z.number().int().min(0),
  discountRate: z.number().min(0).max(100).multipleOf(0.01),
  tierBenefit: z.string().trim().max(255).nullish().transform((v) => v || null),
}) satisfies z.ZodType<MemberTierInput>;

const SELECT_TIER = `
  SELECT mt.tier_id AS "tierId", mt.tier_name AS "tierName", mt.min_point AS "minPoint",
    mt.discount_rate AS "discountRate", mt.tier_benefit AS "tierBenefit",
    (SELECT count(*) FROM customer c WHERE c.tier_id = mt.tier_id) AS "customerCount"
  FROM member_tier mt`;

/** The ladder, lowest threshold first (tierForPoints() on the client relies on this order). */
export function listMemberTiers(): Promise<MemberTierRow[]> {
  return query<MemberTierRow>(`${SELECT_TIER} ORDER BY mt.min_point`);
}

export async function getMemberTier(db: Db, id: number): Promise<MemberTierRow | null> {
  const { rows } = await db.query<MemberTierRow>(`${SELECT_TIER} WHERE mt.tier_id = $1`, [id]);
  return rows[0] ?? null;
}

// A new tier or a moved threshold re-tiers every customer (R13, statement trigger on member_tier).
export async function createMemberTier(db: Db, input: MemberTierInput): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO member_tier (tier_name, min_point, discount_rate, tier_benefit)
     VALUES ($1, $2, $3, $4) RETURNING tier_id AS id`,
    [input.tierName, input.minPoint, input.discountRate, input.tierBenefit],
  );
  return rows[0].id;
}

export async function updateMemberTier(db: Db, id: number, input: MemberTierInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE member_tier SET tier_name = $2, min_point = $3, discount_rate = $4, tier_benefit = $5 WHERE tier_id = $1`,
    [id, input.tierName, input.minPoint, input.discountRate, input.tierBenefit],
  );
  return rowCount === 1;
}

/** A tier that customers hold is still referenced → 409 IN_USE via http.ts */
export async function deleteMemberTier(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM member_tier WHERE tier_id = $1`, [id]);
  return rowCount === 1;
}
