// Shape of GET /api/dashboard — one row per branch from v_dashboard_branch_today.

export type DashboardBranchRow = {
  branchId: number;
  branchCode: string;
  branchName: string;
  roomsTotal: number;
  roomsAvailable: number;
  roomsOccupied: number;
  roomsCleaning: number;
  roomsMaintenance: number;
  arrivalsToday: number;
  departuresToday: number;
  inHouse: number;
  openMaintenance: number;
  housekeepingPending: number;
};

export type DashboardTotals = Omit<DashboardBranchRow, "branchId" | "branchCode" | "branchName">;

export type DashboardData = {
  today: string; // YYYY-MM-DD, database "today"
  totals: DashboardTotals;
  branches: DashboardBranchRow[];
};
