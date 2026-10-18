import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { listPayments, paymentFilterSchema } from "@/app/lib/server/repos/payment.repo";

export const GET = route({ permission: "PAYMENT_VIEW" }, async ({ req, session }) =>
  listPayments(branchScope(session), parseQuery(req, paymentFilterSchema)),
);
