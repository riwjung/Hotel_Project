import { requireChainScope, route } from "@/app/lib/server/http";
import { amenityInputSchema, createAmenity, getAmenity, listAmenities } from "@/app/lib/server/repos/amenity.repo";
import { withTx } from "@/app/lib/server/tx";

export const GET = route({ permission: "ROOM_VIEW" }, async () => listAmenities());

export const POST = route({ permission: "ROOM_MANAGE", body: amenityInputSchema }, async ({ session, body }) => {
  requireChainScope(session, "Amenities");
  const amenity = await withTx(session, async (db) => getAmenity(db, await createAmenity(db, body)));
  return Response.json(amenity, { status: 201 });
});
