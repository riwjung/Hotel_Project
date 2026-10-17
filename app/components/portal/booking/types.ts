// Booking types shared by route repositories and client components.
import type { RoomStatus } from "../room/types";

export const BOOKING_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "CHECKED_OUT",
  "CANCELLED",
  "NO_SHOW",
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const BOOKING_CHANNELS = ["WALK_IN", "WEBSITE", "PHONE", "OTA"] as const;
export type BookingChannel = (typeof BOOKING_CHANNELS)[number];

export const PAYMENT_TYPES = ["DEPOSIT", "FULL", "BALANCE"] as const;
export type PaymentType = (typeof PAYMENT_TYPES)[number];
export const PAYMENT_METHODS = ["CASH", "CARD", "TRANSFER", "QR"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export type BookingFilter = {
  branchId?: number;
  status?: BookingStatus;
  from?: string;
  to?: string;
  q?: string;
};

export type BookingListItem = {
  bookingId: number;
  bookingCode: string;
  branchId: number;
  branchCode: string;
  customerId: number;
  customerName: string;
  tierName: string;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  guestCount: number;
  roomCount: number;
  grandTotal: number;
  paidTotal: number;
  bookingChannel: BookingChannel;
  bookingStatus: BookingStatus;
};

export type BookingRoomDetail = {
  bookingRoomId: number;
  roomId: number;
  roomNumber: string;
  roomName: string | null;
  typeName: string;
  /** room_type.capacity — max guests in this room (DB rule R11) */
  capacity: number;
  rateName: string;
  pricePerNight: number;
  nightCount: number;
  subtotal: number;
  actualCheckIn: string | null;
  actualCheckOut: string | null;
  keyCardNo: string | null;
};

export type BookingGuest = {
  guestId: number;
  bookingRoomId: number;
  roomNumber: string;
  fullName: string;
  idCardNo: string | null;
  nationality: string | null;
  isPrimary: boolean;
};

export type BookingService = {
  bookingServiceId: number;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  scheduledAt: string | null;
  orderStatus: string;
  remark: string | null;
};

export type BookingPayment = {
  paymentId: number;
  amount: number;
  paymentType: PaymentType | "REFUND";
  paymentMethod: PaymentMethod;
  paymentDate: string;
  transactionRef: string | null;
  paymentStatus: PaymentStatus;
  receivedByName: string | null;
};

export type BookingStatusLog = {
  logId: number;
  fromStatus: BookingStatus | null;
  toStatus: BookingStatus;
  changedAt: string;
  changedByName: string | null;
  remark: string | null;
};

export type EmployeeOption = {
  employeeId: number;
  employeeCode: string;
  fullName: string;
};

export type BookingDetail = BookingListItem & {
  bookingDate: string;
  promotionCode: string | null;
  promotionName: string | null;
  createdByName: string | null;
  roomTotal: number;
  serviceTotal: number;
  discountAmount: number;
  balance: number;
  rooms: BookingRoomDetail[];
  guests: BookingGuest[];
  services: BookingService[];
  payments: BookingPayment[];
  statusLog: BookingStatusLog[];
  housekeepingAssignees: EmployeeOption[];
};

export type CheckInInput = {
  rooms: Array<{
    bookingRoomId: number;
    keyCardNo: string;
    guests: Array<{
      fullName: string;
      idCardNo?: string | null;
      nationality?: string | null;
      isPrimary: boolean;
    }>;
  }>;
};

export type PaymentInput = {
  amount: number;
  paymentType: PaymentType;
  paymentMethod: PaymentMethod;
  transactionRef?: string | null;
};

export type CheckOutInput = { assignedEmpId: number; remark?: string | null };

/** Query of GET /api/bookings/availability (branchId is ignored for branch-scoped users) */
export type AvailabilityFilter = { branchId?: number; checkIn: string; checkOut: string };

/** A room with no overlapping active booking, plus the ACTIVE rate that covers the check-in date. */
export type AvailableRoom = {
  roomId: number;
  roomNumber: string;
  roomName: string | null;
  floor: number;
  roomStatus: RoomStatus;
  typeName: string;
  capacity: number;
  bedType: string;
  rateId: number;
  rateName: string;
  pricePerNight: number;
  minNights: number;
};

/** Body of POST /api/bookings. Prices, nights and totals are filled by DB triggers. */
export type BookingCreateInput = {
  customerId: number;
  branchId?: number | null;
  checkInDate: string;
  checkOutDate: string;
  guestCount: number;
  bookingChannel: BookingChannel;
  promotionCode?: string | null;
  roomIds: number[];
  /** true → move PENDING → CONFIRMED in the same transaction */
  confirm: boolean;
};

export type BookingCreated = { bookingId: number; bookingCode: string };
