import { route } from "@/app/lib/server/http";
import { listMine } from "@/app/lib/server/repos/attendance.repo";

// Any signed-in employee: their own shifts around today, for clocking in and out.
export const GET = route({}, async ({ session }) => listMine(session.employeeId));
