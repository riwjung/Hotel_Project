import { route } from "@/app/lib/server/http";
import { withTx } from "@/app/lib/server/tx";
import {
  createCustomer,
  customerInputSchema,
  getCustomer,
  listCustomers,
} from "@/app/lib/server/repos/customer.repo";

export const GET = route({ permission: "CUSTOMER_VIEW" }, async () => listCustomers());

export const POST = route(
  { permission: "CUSTOMER_MANAGE", body: customerInputSchema },
  async ({ session, body }) => {
    const customer = await withTx(session, async (db) => getCustomer(await createCustomer(db, body), db));
    return Response.json(customer, { status: 201 });
  },
);
