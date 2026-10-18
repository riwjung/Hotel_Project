// Service orders = booking_service lines (codes match ck_booking_service_status).
// The workflow, the "needs someone assigned" check and the assignment sync are DB rule R19.

export const ORDER_STATUSES = ["REQUESTED", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export type ServiceOrder = {
  bookingServiceId: number;
  bookingId: number;
  bookingCode: string;
  bookingStatus: string;
  branchId: number;
  branchCode: string;
  customerName: string;
  roomNumbers: string;
  serviceName: string;
  needAssignment: boolean;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  requestedAt: string;
  scheduledAt: string | null;
  orderStatus: OrderStatus;
  remark: string | null;
  /** live assignment (ASSIGNED / IN_PROGRESS), if any */
  assignmentId: number | null;
  assigneeName: string | null;
};

export type ServiceOrderFilter = { branchId?: number; status?: OrderStatus; q?: string };

/** Body of POST /api/service-orders — unit price is snapshotted by the totals trigger */
export type ServiceOrderInput = {
  bookingId: number;
  branchServiceId: number;
  quantity: number;
  scheduledAt: string | null;
  remark: string | null;
};

/** Body of POST /api/service-orders/:id/status */
export type OrderStatusInput = {
  toStatus: Exclude<OrderStatus, "REQUESTED">;
  scheduledAt?: string | null;
};

/** Body of POST /api/service-orders/:id/assign — a reassignment keeps the old row as REASSIGNED */
export type AssignInput = { employeeId: number; note: string | null };
