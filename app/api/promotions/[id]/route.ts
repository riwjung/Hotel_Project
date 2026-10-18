import { HttpError, idParam, route } from "@/app/lib/server/http";
import { withTx } from "@/app/lib/server/tx";
import { deletePromotion, getPromotion, promotionInputSchema, updatePromotion } from "@/app/lib/server/repos/promotion.repo";

const notFound = () => new HttpError(404, "NOT_FOUND", "Promotion not found");

export const PATCH = route(
  { permission: "PROMOTION_MANAGE", body: promotionInputSchema },
  async ({ session, params, body }) => {
    const id = idParam(params);
    return withTx(session, async (db) => {
      if (!(await updatePromotion(db, id, body))) throw notFound();
      return getPromotion(db, id);
    });
  },
);

export const DELETE = route({ permission: "PROMOTION_MANAGE" }, async ({ session, params }) => {
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deletePromotion(db, id))) throw notFound();
  });
  return { ok: true };
});
