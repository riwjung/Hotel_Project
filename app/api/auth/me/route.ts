import { route } from "@/app/lib/server/http";

export const GET = route({}, async ({ session }) => session);
