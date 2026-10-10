import bcrypt from "bcryptjs";
import { z } from "zod";
import { startSession } from "@/app/lib/server/auth";
import { fail, parseBody, toErrorResponse } from "@/app/lib/server/http";
import { findEmployeeForLogin, toSessionUser } from "@/app/lib/server/repos/auth.repo";

const loginSchema = z.object({
  email: z.email().trim(),
  password: z.string().min(1),
});

// Public endpoint — the only one not wrapped in route() because there is no session yet.
export async function POST(req: Request) {
  try {
    const { email, password } = await parseBody(req, loginSchema);
    const row = await findEmployeeForLogin(email);

    // Same message for unknown email and wrong password (no account probing).
    if (!row || !(await bcrypt.compare(password, row.passwordHash))) {
      return fail(401, "INVALID_CREDENTIALS", "Email or password is incorrect");
    }
    if (row.employeeStatus !== "ACTIVE" || row.roleStatus !== "ACTIVE") {
      return fail(403, "ACCOUNT_INACTIVE", "This account is not active. Please contact your manager.");
    }

    const user = toSessionUser(row);
    await startSession(user);
    return Response.json(user);
  } catch (err) {
    return toErrorResponse(err);
  }
}
