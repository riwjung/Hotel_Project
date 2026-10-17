import { HttpError, idParam, route } from "@/app/lib/server/http";
import { withTx } from "@/app/lib/server/tx";
import {
  customerInputSchema,
  deleteCustomer,
  getCustomer,
  updateCustomer,
} from "@/app/lib/server/repos/customer.repo";

const notFound = () => new HttpError(404, "NOT_FOUND", "Customer not found");

export const GET = route({ permission: "CUSTOMER_VIEW" }, async ({ params }) => {
  const customer = await getCustomer(idParam(params));
  if (!customer) throw notFound();
  return customer;
});

export const PATCH = route(
  { permission: "CUSTOMER_MANAGE", body: customerInputSchema },
  async ({ session, params, body }) => {
    const id = idParam(params);
    return withTx(session, async (db) => {
      if (!(await updateCustomer(db, id, body))) throw notFound();
      return getCustomer(id, db);
    });
  },
);

export const DELETE = route({ permission: "CUSTOMER_MANAGE" }, async ({ session, params }) => {
  const id = idParam(params);
  await withTx(session, async (db) => {
    if (!(await deleteCustomer(db, id))) throw notFound();
  });
  return { ok: true };
});
