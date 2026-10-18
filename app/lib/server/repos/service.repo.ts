import "server-only";
import { z } from "zod";
import {
  ACTIVE_STATUSES,
  type Service,
  type ServiceCategory,
  type ServiceCategoryInput,
  type ServiceInput,
} from "@/app/components/portal/service/types";
import { query, type Db } from "../db";

// The catalog is chain-level master data: routes guard writes with requireChainScope.

const code = (max: number) => z.string().trim().toUpperCase().min(2).max(max).regex(/^[A-Z0-9_-]+$/, "Use letters, digits, - or _");

export const categoryInputSchema = z.object({
  categoryCode: code(20),
  categoryName: z.string().trim().min(1).max(50),
  categoryStatus: z.enum(ACTIVE_STATUSES),
}) satisfies z.ZodType<ServiceCategoryInput>;

export const serviceInputSchema = z.object({
  categoryId: z.number().int().positive(),
  serviceCode: code(20),
  serviceName: z.string().trim().min(1).max(100),
  description: z.string().trim().max(255).nullish().transform((v) => v || null),
  defaultPrice: z.number().min(0).multipleOf(0.01),
  unit: z.string().trim().min(1).max(20),
  isChargeable: z.boolean(),
  needAssignment: z.boolean(),
  estMinutes: z.number().int().min(1).max(1440).nullable(),
  serviceStatus: z.enum(ACTIVE_STATUSES),
}) satisfies z.ZodType<ServiceInput>;

const SELECT_CATEGORY = `
  SELECT sc.category_id AS "categoryId", sc.category_code AS "categoryCode", sc.category_name AS "categoryName",
    sc.category_status AS "categoryStatus",
    (SELECT count(*) FROM service s WHERE s.category_id = sc.category_id) AS "serviceCount"
  FROM service_category sc`;

const SELECT_SERVICE = `
  SELECT s.service_id AS "serviceId", s.category_id AS "categoryId", sc.category_name AS "categoryName",
    s.service_code AS "serviceCode", s.service_name AS "serviceName", s.description,
    s.default_price AS "defaultPrice", s.unit, s.is_chargeable AS "isChargeable",
    s.need_assignment AS "needAssignment", s.est_minutes AS "estMinutes", s.service_status AS "serviceStatus",
    (SELECT count(*) FROM branch_service bs WHERE bs.service_id = s.service_id) AS "branchCount"
  FROM service s
  JOIN service_category sc ON sc.category_id = s.category_id`;

export function listCategories(): Promise<ServiceCategory[]> {
  return query<ServiceCategory>(`${SELECT_CATEGORY} ORDER BY sc.category_name`);
}

export async function getCategory(db: Db, id: number): Promise<ServiceCategory | null> {
  const { rows } = await db.query<ServiceCategory>(`${SELECT_CATEGORY} WHERE sc.category_id = $1`, [id]);
  return rows[0] ?? null;
}

export async function createCategory(db: Db, input: ServiceCategoryInput): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO service_category (category_code, category_name, category_status) VALUES ($1, $2, $3)
     RETURNING category_id AS id`,
    [input.categoryCode, input.categoryName, input.categoryStatus],
  );
  return rows[0].id;
}

export async function updateCategory(db: Db, id: number, input: ServiceCategoryInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE service_category SET category_code = $2, category_name = $3, category_status = $4 WHERE category_id = $1`,
    [id, input.categoryCode, input.categoryName, input.categoryStatus],
  );
  return rowCount === 1;
}

/** A category with services is still referenced → 409 IN_USE. */
export async function deleteCategory(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM service_category WHERE category_id = $1`, [id]);
  return rowCount === 1;
}

export function listServices(): Promise<Service[]> {
  return query<Service>(`${SELECT_SERVICE} ORDER BY sc.category_name, s.service_name`);
}

export async function getService(db: Db, id: number): Promise<Service | null> {
  const { rows } = await db.query<Service>(`${SELECT_SERVICE} WHERE s.service_id = $1`, [id]);
  return rows[0] ?? null;
}

const serviceValues = (v: ServiceInput) => [
  v.categoryId, v.serviceCode, v.serviceName, v.description, v.defaultPrice, v.unit,
  v.isChargeable, v.needAssignment, v.estMinutes, v.serviceStatus,
];

export async function createService(db: Db, input: ServiceInput): Promise<number> {
  const { rows } = await db.query<{ id: number }>(
    `INSERT INTO service (category_id, service_code, service_name, description, default_price, unit,
                          is_chargeable, need_assignment, est_minutes, service_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING service_id AS id`,
    serviceValues(input),
  );
  return rows[0].id;
}

export async function updateService(db: Db, id: number, input: ServiceInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE service SET category_id = $2, service_code = $3, service_name = $4, description = $5, default_price = $6,
       unit = $7, is_chargeable = $8, need_assignment = $9, est_minutes = $10, service_status = $11
     WHERE service_id = $1`,
    [id, ...serviceValues(input)],
  );
  return rowCount === 1;
}

/** A service sold by a branch is still referenced → 409 IN_USE. */
export async function deleteService(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM service WHERE service_id = $1`, [id]);
  return rowCount === 1;
}
