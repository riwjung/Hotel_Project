import type { PermissionCode } from "./permissions";

// Single registry for the portal menu, page titles and the "coming soon" catch-all.
// status "ready"   → has its own route under app/(portal)/
// status "planned" → served by app/(portal)/[...slug] as a ComingSoon page
// Icons are referenced by key (resolved in PortalSider) so this file stays
// importable from server components.

export type ModuleKey = "dashboard" | "A" | "B" | "C" | "D" | "E" | "F" | "G";

export type NavIconKey =
  | "dashboard" | "branch" | "team" | "safety" | "clock" | "calendar" | "check"
  | "room" | "roomType" | "amenity" | "rate" | "booking" | "customer"
  | "catalog" | "branchService" | "order" | "assignment" | "skill"
  | "housekeeping" | "maintenance" | "payment" | "promotion" | "tier" | "review";

export type NavItem = {
  path: string;
  label: string;
  icon: NavIconKey;
  permission: PermissionCode;
  status: "ready" | "planned";
  /** Tables behind the screen — shown on the ComingSoon page. */
  tables: string[];
};

export type NavGroup = {
  module: ModuleKey;
  label: string;
  /** Obsidian note for the module (docs/03-modules/…) */
  note?: string;
  items: NavItem[];
};

export const NAV: NavGroup[] = [
  {
    module: "dashboard",
    label: "Overview",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: "dashboard", permission: "DASHBOARD_VIEW", status: "ready", tables: ["v_dashboard_branch_today"] },
    ],
  },
  {
    module: "A",
    label: "Organization",
    note: "03-modules/A-org-access.md",
    items: [
      { path: "/branches", label: "Branches", icon: "branch", permission: "BRANCH_VIEW", status: "ready", tables: ["branch"] },
      { path: "/employees", label: "Employees", icon: "team", permission: "EMPLOYEE_VIEW", status: "ready", tables: ["employee"] },
      { path: "/roles", label: "Roles & Permissions", icon: "safety", permission: "ROLE_MANAGE", status: "ready", tables: ["role", "permission", "role_permission"] },
    ],
  },
  {
    module: "B",
    label: "Workforce",
    note: "03-modules/B-workforce.md",
    items: [
      { path: "/shifts", label: "Shifts", icon: "clock", permission: "SCHEDULE_VIEW", status: "ready", tables: ["shift"] },
      { path: "/schedules", label: "Work Schedules", icon: "calendar", permission: "SCHEDULE_VIEW", status: "ready", tables: ["work_schedule"] },
      { path: "/attendance", label: "Attendance", icon: "check", permission: "ATTENDANCE_VIEW", status: "ready", tables: ["attendance"] },
    ],
  },
  {
    module: "C",
    label: "Rooms",
    note: "03-modules/C-rooms.md",
    items: [
      { path: "/rooms", label: "Rooms", icon: "room", permission: "ROOM_VIEW", status: "ready", tables: ["room", "room_type", "branch"] },
      { path: "/room-types", label: "Room Types", icon: "roomType", permission: "ROOM_VIEW", status: "ready", tables: ["room_type", "room_type_amenity"] },
      { path: "/amenities", label: "Amenities", icon: "amenity", permission: "ROOM_VIEW", status: "ready", tables: ["amenity"] },
      { path: "/room-rates", label: "Room Rates", icon: "rate", permission: "RATE_MANAGE", status: "ready", tables: ["room_rate"] },
    ],
  },
  {
    module: "D",
    label: "Reservations",
    note: "03-modules/D-booking.md",
    items: [
      { path: "/bookings", label: "Bookings", icon: "booking", permission: "BOOKING_VIEW", status: "ready", tables: ["booking", "booking_room", "guest", "booking_status_log"] },
      { path: "/customers", label: "Customers", icon: "customer", permission: "CUSTOMER_VIEW", status: "ready", tables: ["customer", "member_tier"] },
    ],
  },
  {
    module: "E",
    label: "Services",
    note: "03-modules/E-services.md",
    items: [
      { path: "/services", label: "Service Catalog", icon: "catalog", permission: "SERVICE_VIEW", status: "ready", tables: ["service_category", "service"] },
      { path: "/branch-services", label: "Branch Services", icon: "branchService", permission: "SERVICE_VIEW", status: "ready", tables: ["branch_service"] },
      { path: "/service-orders", label: "Service Orders", icon: "order", permission: "SERVICE_VIEW", status: "ready", tables: ["booking_service"] },
      { path: "/assignments", label: "Assignments", icon: "assignment", permission: "ASSIGNMENT_MANAGE", status: "ready", tables: ["service_assignment"] },
      { path: "/skills", label: "Staff Skills", icon: "skill", permission: "ASSIGNMENT_MANAGE", status: "ready", tables: ["employee_service_skill"] },
    ],
  },
  {
    module: "F",
    label: "Operations",
    note: "03-modules/F-operations.md",
    items: [
      { path: "/housekeeping", label: "Housekeeping", icon: "housekeeping", permission: "HOUSEKEEPING_VIEW", status: "ready", tables: ["housekeeping_task"] },
      { path: "/maintenance", label: "Maintenance", icon: "maintenance", permission: "MAINTENANCE_VIEW", status: "ready", tables: ["maintenance_request"] },
    ],
  },
  {
    module: "G",
    label: "Finance & CX",
    note: "03-modules/G-finance-cx.md",
    items: [
      { path: "/payments", label: "Payments", icon: "payment", permission: "PAYMENT_VIEW", status: "ready", tables: ["payment"] },
      { path: "/promotions", label: "Promotions", icon: "promotion", permission: "PROMOTION_MANAGE", status: "ready", tables: ["promotion"] },
      { path: "/member-tiers", label: "Member Tiers", icon: "tier", permission: "PROMOTION_MANAGE", status: "ready", tables: ["member_tier"] },
      { path: "/reviews", label: "Reviews", icon: "review", permission: "REVIEW_VIEW", status: "ready", tables: ["review"] },
    ],
  },
];

export const NAV_ITEMS: (NavItem & { group: NavGroup })[] = NAV.flatMap((group) =>
  group.items.map((item) => ({ ...item, group })),
);

export function findNavItem(pathname: string) {
  return NAV_ITEMS.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
}
