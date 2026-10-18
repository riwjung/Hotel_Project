import { HttpError, idParam, requireChainScope, route } from "@/app/lib/server/http";
import { amenityInputSchema, deleteAmenity, getAmenity, updateAmenity } from "@/app/lib/server/repos/amenity.repo";
import { withTx } from "@/app/lib/server/tx";

const notFound = () => new HttpError(404, "NOT_FOUND", "Amenity not found");

export const PATCH = route({ permission: "ROOM_MANAGE", body: amenityInputSchema }, async ({ session, params, body }) => {
  requireChainScope(session, "Amenities");
  const id = idParam(params);
  return withTx(session, async (db) => {
    if (!(await updateAmenity(db, id, body))) throw notFound();
    return getAmenity(db, id);
  });
});

export const DELETE = route({ permission: "ROOM_MANAGE" }, async ({ session, params }) => {
  requireChainScope(session, "Amenities");
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteAmenity(db, id))) throw notFound();
  });
  return { ok: true };
});
