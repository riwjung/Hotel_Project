import "server-only";
import type {
  DashboardBranchRow,
  DashboardData,
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
  const [branches, today] = await Promise.all([
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
  ]);

  const totals = Object.fromEntries(
    METRICS.map((k) => [k, branches.reduce((sum, b) => sum + b[k], 0)]),
  ) as DashboardTotals;

  return { today: today?.today ?? "", totals, branches };
}
