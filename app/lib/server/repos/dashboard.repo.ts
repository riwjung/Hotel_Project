import "server-only";
import type {
  DashboardBranchRow,
  DashboardData,
  DashboardPhoto,
  DashboardTotals,
} from "@/app/components/portal/dashboard/types";
import { query, queryOne } from "../db";

const METRICS: (keyof DashboardTotals)[] = [
  "roomsTotal",
  "roomsAvailable",
  "roomsOccupied",
  "roomsCleaning",
  "roomsMaintenance",
  "arrivalsToday",
  "departuresToday",
  "inHouse",
  "openMaintenance",
  "housekeepingPending",
];

export async function getDashboard(scope: number | null): Promise<DashboardData> {
  const [branches, today, photos] = await Promise.all([
    query<DashboardBranchRow>(
      `SELECT
         branch_id            AS "branchId",
         branch_code          AS "branchCode",
         branch_name          AS "branchName",
         rooms_total          AS "roomsTotal",
         rooms_available      AS "roomsAvailable",
         rooms_occupied       AS "roomsOccupied",
         rooms_cleaning       AS "roomsCleaning",
         rooms_maintenance    AS "roomsMaintenance",
         arrivals_today       AS "arrivalsToday",
         departures_today     AS "departuresToday",
         in_house             AS "inHouse",
         open_maintenance     AS "openMaintenance",
         housekeeping_pending AS "housekeepingPending"
       FROM v_dashboard_branch_today
       WHERE ($1::int IS NULL OR branch_id = $1)
       ORDER BY branch_code`,
      [scope],
    ),
    queryOne<{ today: string }>(`SELECT current_date AS today`),
    // Cover photos only, one per file per branch, alternating branches so consecutive slides differ.
    query<DashboardPhoto>(
      `SELECT "imageId", "imageUrl", "imageCaption", "branchId", "branchCode", "branchName"
       FROM (
         SELECT DISTINCT ON (b.branch_id, i.image_url)
           i.image_id AS "imageId", i.image_url AS "imageUrl",
           i.image_caption AS "imageCaption", b.branch_id AS "branchId",
           b.branch_code AS "branchCode", b.branch_name AS "branchName"
         FROM room_image i
         JOIN room r ON r.room_id = i.room_id
         JOIN branch b ON b.branch_id = r.branch_id
         WHERE i.is_cover AND ($1::int IS NULL OR b.branch_id = $1)
         ORDER BY b.branch_id, i.image_url, i.image_id
       ) covers
       ORDER BY row_number() OVER (PARTITION BY "branchId" ORDER BY "imageId"), "branchId"`,
      [scope],
    ),
  ]);

  const totals = Object.fromEntries(
    METRICS.map((k) => [k, branches.reduce((sum, b) => sum + b[k], 0)]),
  ) as DashboardTotals;

  return { today: today?.today ?? "", totals, branches, photos };
}
