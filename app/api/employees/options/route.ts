import { z } from "zod";
import { branchScope } from "@/app/lib/server/auth";
import { parseQuery, route } from "@/app/lib/server/http";
import { listEmployeeOptions } from "@/app/lib/server/repos/employee.repo";

const filterSchema = z.object({ branchId: z.coerce.number().int().positive().optional() });

// Any signed-in employee: names for assignment dropdowns, always inside the caller's branch scope.
export const GET = route({}, async ({ req, session }) =>
  listEmployeeOptions(branchScope(session), parseQuery(req, filterSchema).branchId),
);
