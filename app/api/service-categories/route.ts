import { requireChainScope, route } from "@/app/lib/server/http";
import { categoryInputSchema, createCategory, getCategory, listCategories } from "@/app/lib/server/repos/service.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "SERVICE_VIEW" }, async () => listCategories());

export const POST = route({ permission: "SERVICE_MANAGE", body: categoryInputSchema }, async ({ session, body }) => {
  requireChainScope(session, "Service categories");
  const category = await withTx(session, async (db) => getCategory(db, await createCategory(db, body)));
  return Response.json(category, { status: 201 });
});
