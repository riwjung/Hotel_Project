import { route } from "@/app/lib/server/http";
import { withTx } from "@/app/lib/server/tx";
import { createPromotion, getPromotion, listPromotions, promotionInputSchema } from "@/app/lib/server/repos/promotion.repo";

export const GET = route({ permission: "PROMOTION_MANAGE" }, async () => listPromotions());

export const POST = route(
  { permission: "PROMOTION_MANAGE", body: promotionInputSchema },
  async ({ session, body }) => {
    const promotion = await withTx(session, async (db) => getPromotion(db, await createPromotion(db, body)));
    return Response.json(promotion, { status: 201 });
  },
);
