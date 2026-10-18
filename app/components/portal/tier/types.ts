// Member tier types (db/schema/040_g_master.sql). The ladder drives R13 (tier follows points).
import type { MemberTier } from "../customer/types";

export type MemberTierRow = MemberTier & {
  tierBenefit: string | null;
  customerCount: number;
};

/** Body of POST /api/member-tiers and PATCH /api/member-tiers/:id */
export type MemberTierInput = {
  tierName: string;
  minPoint: number;
  discountRate: number;
  tierBenefit: string | null;
};
