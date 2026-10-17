// Customer domain types — shared by the API (repo) and the UI.
// Customers belong to the whole chain (no branch_id), so the list is not branch-scoped.

export type MemberTier = {
  tierId: number;
  tierName: string;
  minPoint: number;
  discountRate: number;
};

export type Customer = {
  customerId: number;
  /** derived from memberPoint by the database (rule R13) */
  tierId: number;
  tierName: string;
  /** the tier's discount_rate (percent), applied after any promotion */
  discountRate: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  idCardNo: string | null;
  memberPoint: number;
  /** password_hash is set → the customer can sign in online */
  hasOnlineAccount: boolean;
  createdAt: string;
  bookingCount: number;
  /** latest check-in date of a stay that actually happened (checked in / out) */
  lastStayDate: string | null;
};

/** Body of POST /api/customers and PATCH /api/customers/:id — no tier: it follows memberPoint */
export type CustomerInput = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  address: string | null;
  idCardNo: string | null;
  memberPoint: number;
};
