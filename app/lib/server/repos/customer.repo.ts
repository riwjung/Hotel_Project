import "server-only";
import { z } from "zod";
import type { Customer, CustomerInput, MemberTier } from "@/app/components/portal/customer/types";
import { query, queryOne, type Db } from "../db";

// Customers are chain-level master data (customer has no branch_id): a guest of
// BKK is the same guest at HKT, so these queries take no branchScope.

const optionalText = (max: number) =>
  z.string().trim().max(max).nullish().transform((v) => (v ? v : null));

// No tierId: the tier is derived from memberPoint by the database (R13).
export const customerInputSchema = z.object({
  firstName: z.string().trim().min(1).max(50),
  lastName: z.string().trim().min(1).max(50),
  email: z.string().trim().toLowerCase().max(100).pipe(z.email()),
  phone: optionalText(20),
  address: optionalText(255),
  idCardNo: optionalText(30),
  memberPoint: z.number().int().min(0),
}) satisfies z.ZodType<CustomerInput>;

const SELECT_CUSTOMER = `
  SELECT
    c.customer_id                 AS "customerId",
    c.tier_id                     AS "tierId",
    mt.tier_name                  AS "tierName",
    mt.discount_rate              AS "discountRate",
    c.first_name                  AS "firstName",
    c.last_name                   AS "lastName",
    c.email,
    c.phone,
    c.address,
    c.id_card_no                  AS "idCardNo",
    c.member_point                AS "memberPoint",
    c.password_hash IS NOT NULL   AS "hasOnlineAccount",
    c.created_at                  AS "createdAt",
    bk.booking_count              AS "bookingCount",
    bk.last_stay                  AS "lastStayDate"
  FROM customer c
  JOIN member_tier mt ON mt.tier_id = c.tier_id
  CROSS JOIN LATERAL (
    SELECT
      count(*) AS booking_count,
      max(b.check_in_date) FILTER (WHERE b.booking_status IN ('CHECKED_IN', 'CHECKED_OUT')) AS last_stay
    FROM booking b
    WHERE b.customer_id = c.customer_id
  ) bk`;

export function listCustomers(): Promise<Customer[]> {
  return query<Customer>(`${SELECT_CUSTOMER} ORDER BY c.first_name, c.last_name`);
}

export function getCustomer(id: number, db?: Db): Promise<Customer | null> {
  const sql = `${SELECT_CUSTOMER} WHERE c.customer_id = $1`;
  if (db) return db.query<Customer>(sql, [id]).then((r) => r.rows[0] ?? null);
  return queryOne<Customer>(sql, [id]);
}

export function listMemberTiers(): Promise<MemberTier[]> {
  return query<MemberTier>(
    `SELECT tier_id AS "tierId", tier_name AS "tierName", min_point AS "minPoint",
       discount_rate AS "discountRate"
     FROM member_tier ORDER BY min_point`,
  );
}

const values = (input: CustomerInput) => [
  input.firstName,
  input.lastName,
  input.email,
  input.phone,
  input.address,
  input.idCardNo,
  input.memberPoint,
];

// tier_id is omitted: trg_customer_10_set_tier fills it from member_point (R13).
export async function createCustomer(db: Db, input: CustomerInput): Promise<number> {
  const { rows } = await db.query<{ customerId: number }>(
    `INSERT INTO customer (first_name, last_name, email, phone, address, id_card_no, member_point)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING customer_id AS "customerId"`,
    values(input),
  );
  return rows[0].customerId;
}

export async function updateCustomer(db: Db, id: number, input: CustomerInput): Promise<boolean> {
  const { rowCount } = await db.query(
    `UPDATE customer SET
       first_name = $2, last_name = $3, email = $4, phone = $5,
       address = $6, id_card_no = $7, member_point = $8
     WHERE customer_id = $1`,
    [id, ...values(input)],
  );
  return rowCount === 1;
}

/** A customer with bookings is still referenced (FK) → 409 IN_USE via http.ts */
export async function deleteCustomer(db: Db, id: number): Promise<boolean> {
  const { rowCount } = await db.query(`DELETE FROM customer WHERE customer_id = $1`, [id]);
  return rowCount === 1;
}
