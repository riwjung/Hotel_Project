// Promotion types — codes match the CHECKs in db/schema/040_g_master.sql

export const DISCOUNT_TYPES = ["PERCENT", "FIXED"] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const PROMOTION_STATUSES = ["ACTIVE", "INACTIVE", "EXPIRED"] as const;
export type PromotionStatus = (typeof PROMOTION_STATUSES)[number];

export type Promotion = {
  promotionId: number;
  promotionCode: string;
  promotionName: string;
  discountType: DiscountType;
  discountValue: number;
  minimumAmount: number;
  startDate: string;
  endDate: string;
  /** null = unlimited */
  usageLimit: number | null;
  promotionStatus: PromotionStatus;
  /** bookings using it that are not cancelled — what R8 counts against usage_limit */
  usedCount: number;
  /** any booking references it → discount terms are locked (R18) and it cannot be deleted */
  inUse: boolean;
};

/** Body of POST /api/promotions and PATCH /api/promotions/:id */
export type PromotionInput = {
  promotionCode: string;
  promotionName: string;
  discountType: DiscountType;
  discountValue: number;
  minimumAmount: number;
  startDate: string;
  endDate: string;
  usageLimit: number | null;
  promotionStatus: PromotionStatus;
};
