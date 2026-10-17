import { route } from "@/app/lib/server/http";
import { listMemberTiers } from "@/app/lib/server/repos/customer.repo";

// Read-only tier list for the customer form. Managing tiers is module G (PROMOTION_MANAGE).
export const GET = route({ permission: "CUSTOMER_VIEW" }, async () => listMemberTiers());
