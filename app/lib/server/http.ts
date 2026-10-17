import "server-only";
import type { NextRequest } from "next/server";
import { z } from "zod";
import type { PermissionCode } from "@/app/lib/permissions";
import { getSession, type Session } from "./auth";

// Error body shape for every API response: { error: { code, message } }.
// `message` is written for end users — the UI shows it as-is.

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function fail(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status });
}

type PgError = Error & {
  code: string;
  detail?: string;
  table?: string;
  column?: string;
  constraint?: string;
};

function isPgError(err: unknown): err is PgError {
  return (
    err instanceof Error &&
    typeof (err as PgError).code === "string" &&
    "severity" in err
  );
}

const humanize = (s: string) => s.replace(/_id$/, "").replace(/_/g, " ");
const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// Friendly messages for CHECK constraints the UI can trip over.
const CHECK_MESSAGES: Record<string, string> = {
  ck_branch_status: "Unknown branch status",
  ck_booking_dates: "Check-out must be after check-in",
  ck_booking_guest_count: "A booking needs at least one guest",
  ck_room_rate_min_nights: "Minimum stay must be at least 1 night",
  ck_customer_point: "Member points cannot be negative",
  ck_room_rate_dates: "End date must be on or after start date",
  ck_promotion_dates: "End date must be on or after start date",
};

function mapPgError(err: PgError): [number, string, string] | null {
  switch (err.code) {
    case "23505": {
      const m = /Key \((.+?)\)=\((.+?)\) already exists/.exec(err.detail ?? "");
      return [409, "DUPLICATE", m ? `${capitalize(humanize(m[1]))} "${m[2]}" already exists` : "This record already exists"];
    }
    case "23503": {
      const inUse = /is still referenced from table "(.+?)"/.exec(err.detail ?? "");
      if (inUse) {
        return [409, "IN_USE", `Cannot delete: it is still used by ${humanize(inUse[1])} records`];
      }
      const missing = /Key \((.+?)\)=\((.+?)\) is not present/.exec(err.detail ?? "");
      return [422, "INVALID_REFERENCE", missing ? `Selected ${humanize(missing[1])} does not exist` : "A referenced record does not exist"];
    }
    case "23P01":
      return [409, "OVERLAP", "This period overlaps an existing one"];
    case "23514":
      return [422, "INVALID_VALUE", CHECK_MESSAGES[err.constraint ?? ""] ?? `Invalid value (${err.constraint})`];
    case "23502":
      return [422, "REQUIRED", `${humanize(err.column ?? "A field")} is required`];
    case "22001":
      return [422, "TOO_LONG", "A value is longer than allowed"];
    case "22P02":
    case "22007":
    case "22008":
      return [400, "INVALID_INPUT", "A value has the wrong format"];
    case "P0001": // RAISE EXCEPTION from a business-rule trigger — message is user-facing
      return [422, "BUSINESS_RULE", err.message];
    default:
      return null;
  }
}

export function toErrorResponse(err: unknown): Response {
  if (err instanceof HttpError) return fail(err.status, err.code, err.message);
  if (isPgError(err)) {
    const mapped = mapPgError(err);
    if (mapped) return fail(...mapped);
    if (err.code === "ECONNREFUSED" || err.code === "57P03") {
      return fail(503, "DB_UNAVAILABLE", "The database is not reachable. Is it running?");
    }
  }
  if (err instanceof Error && (err as { code?: string }).code === "ECONNREFUSED") {
    return fail(503, "DB_UNAVAILABLE", "The database is not reachable. Is it running?");
  }
  console.error("[api] unexpected error", err);
  return fail(500, "INTERNAL", "Something went wrong on the server");
}

export async function parseBody<S extends z.ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  const json = await req.json().catch(() => {
    throw new HttpError(400, "INVALID_JSON", "Request body must be JSON");
  });
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue.path.length ? `${issue.path.join(".")}: ` : "";
    throw new HttpError(400, "VALIDATION", `${field}${issue.message}`);
  }
  return parsed.data;
}

export function idParam(params: Record<string, string | string[]>, name = "id"): number {
  const raw = params[name];
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError(400, "INVALID_ID", `Invalid ${name}`);
  }
  return id;
}

type RouteContext = { params: Promise<Record<string, string | string[]>> };

type HandlerArgs<S extends z.ZodType | undefined> = {
  req: NextRequest;
  session: Session;
  body: S extends z.ZodType ? z.infer<S> : undefined;
  params: Record<string, string | string[]>;
};

/**
 * Wraps a route handler: session → permission → body validation → handler → JSON,
 * mapping thrown HttpError / Postgres errors to `{ error }` responses.
 * Returning a Response passes it through; anything else is sent as JSON.
 */
export function route<S extends z.ZodType | undefined = undefined>(
  options: { permission?: PermissionCode; body?: S },
  handler: (args: HandlerArgs<S>) => Promise<unknown>,
) {
  return async (req: NextRequest, ctx: RouteContext): Promise<Response> => {
    try {
      const session = await getSession();
      if (!session) {
        return fail(401, "UNAUTHENTICATED", "Your session has expired. Please sign in again.");
      }
      if (options.permission && !session.permissions.includes(options.permission)) {
        return fail(403, "FORBIDDEN", "You do not have permission to do this");
      }
      const body = (options.body ? await parseBody(req, options.body) : undefined) as HandlerArgs<S>["body"];
      const params = ctx?.params ? await ctx.params : {};
      const result = await handler({ req, session, body, params });
      if (result instanceof Response) return result;
      return Response.json(result ?? { ok: true });
    } catch (err) {
      return toErrorResponse(err);
    }
  };
}
