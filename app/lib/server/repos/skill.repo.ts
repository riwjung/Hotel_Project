import "server-only";
import { z } from "zod";
import { SKILL_LEVELS, type SkillInput, type SkillMatrix } from "@/app/components/portal/skill/types";
import { HttpError } from "../http";
import { query, type Db } from "../db";

export const skillFilterSchema = z.object({ branchId: z.coerce.number().int().positive().optional() });

export const skillInputSchema = z.object({
  employeeId: z.number().int().positive(),
  serviceId: z.number().int().positive(),
  skillLevel: z.enum(SKILL_LEVELS).nullable(),
}) satisfies z.ZodType<SkillInput>;

/** Branch staff × services that need someone assigned (R5 checks skills only for assignments). */
export async function getSkillMatrix(scope: number | null, branchId?: number): Promise<SkillMatrix> {
  const branch = scope ?? branchId ?? null;
  const [employees, services, skills] = await Promise.all([
    query<SkillMatrix["employees"][number]>(
      `SELECT e.employee_id AS "employeeId", e.employee_code AS "employeeCode", e.first_name || ' ' || e.last_name AS "fullName",
         b.branch_code AS "branchCode", r.role_name AS "roleName"
       FROM employee e
       JOIN branch b ON b.branch_id = e.branch_id
       JOIN role r   ON r.role_id = e.role_id
       WHERE e.employee_status = 'ACTIVE' AND ($1::int IS NULL OR e.branch_id = $1)
       ORDER BY b.branch_code, e.first_name`,
      [branch],
    ),
    query<SkillMatrix["services"][number]>(
      `SELECT service_id AS "serviceId", service_code AS "serviceCode", service_name AS "serviceName",
         need_assignment AS "needAssignment"
       FROM service WHERE service_status = 'ACTIVE' AND need_assignment
       ORDER BY service_name`,
    ),
    query<SkillMatrix["skills"][number]>(
      `SELECT ess.employee_id AS "employeeId", ess.service_id AS "serviceId", ess.skill_level AS "skillLevel",
         ess.certified_date AS "certifiedDate"
       FROM employee_service_skill ess JOIN employee e ON e.employee_id = ess.employee_id
       WHERE ($1::int IS NULL OR e.branch_id = $1)`,
      [branch],
    ),
  ]);
  return { employees, services, skills };
}

/** Upsert a skill (certified today when new) or remove it when skillLevel is null. */
export async function setSkill(db: Db, scope: number | null, input: SkillInput) {
  const { rows } = await db.query(
    `SELECT 1 FROM employee WHERE employee_id = $1 AND branch_id IS NOT NULL AND ($2::int IS NULL OR branch_id = $2)`,
    [input.employeeId, scope],
  );
  if (!rows[0]) throw new HttpError(404, "NOT_FOUND", "Employee not found");
  if (input.skillLevel === null) {
    await db.query(`DELETE FROM employee_service_skill WHERE employee_id = $1 AND service_id = $2`, [input.employeeId, input.serviceId]);
    return;
  }
  await db.query(
    `INSERT INTO employee_service_skill (employee_id, service_id, skill_level, certified_date)
     VALUES ($1, $2, $3, current_date)
     ON CONFLICT (employee_id, service_id) DO UPDATE SET skill_level = EXCLUDED.skill_level`,
    [input.employeeId, input.serviceId, input.skillLevel],
  );
}
