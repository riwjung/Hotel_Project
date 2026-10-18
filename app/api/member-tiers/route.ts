import { route } from "@/app/lib/server/http";
import { withTx } from "@/app/lib/server/tx";
import {
  createMemberTier,
  getMemberTier,
  listMemberTiers,
  memberTierInputSchema,
} from "@/app/lib/server/repos/member-tier.repo";

// Read by the customer form too (tier preview), so viewing needs only CUSTOMER_VIEW.
export const GET = route({ permission: "CUSTOMER_VIEW" }, async () => listMemberTiers());

export const POST = route(
  { permission: "PROMOTION_MANAGE", body: memberTierInputSchema },
  async ({ session, body }) => {
    const tier = await withTx(session, async (db) => getMemberTier(db, await createMemberTier(db, body)));
    return Response.json(tier, { status: 201 });
  },
);
