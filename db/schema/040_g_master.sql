-- =====================================================================
-- 040 · Module G (master part) — created early because D depends on them
-- member_tier (← customer), promotion (← booking)
-- =====================================================================

CREATE TABLE member_tier (
  tier_id        integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tier_name      varchar(30)  NOT NULL,
  min_point      integer      NOT NULL DEFAULT 0,
  discount_rate  decimal(5,2) NOT NULL DEFAULT 0,      -- percent, 0–100
  tier_benefit   varchar(255),
  CONSTRAINT uq_member_tier_name UNIQUE (tier_name),
  CONSTRAINT uq_member_tier_min_point UNIQUE (min_point),
  CONSTRAINT ck_member_tier_point CHECK (min_point >= 0),
  CONSTRAINT ck_member_tier_discount CHECK (discount_rate BETWEEN 0 AND 100)
);

CREATE TABLE promotion (
  promotion_id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  promotion_code    varchar(30)   NOT NULL,
  promotion_name    varchar(100)  NOT NULL,
  discount_type     varchar(20)   NOT NULL,
  discount_value    decimal(10,2) NOT NULL,
  minimum_amount    decimal(10,2) NOT NULL DEFAULT 0,
  start_date        date          NOT NULL,
  end_date          date          NOT NULL,
  usage_limit       integer,                            -- NULL = unlimited
  promotion_status  varchar(20)   NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uq_promotion_code UNIQUE (promotion_code),
  CONSTRAINT ck_promotion_type CHECK (discount_type IN ('PERCENT', 'FIXED')),
  CONSTRAINT ck_promotion_value CHECK (
    discount_value > 0 AND (discount_type <> 'PERCENT' OR discount_value <= 100)
  ),
  CONSTRAINT ck_promotion_minimum CHECK (minimum_amount >= 0),
  CONSTRAINT ck_promotion_dates CHECK (end_date >= start_date),
  CONSTRAINT ck_promotion_usage CHECK (usage_limit IS NULL OR usage_limit > 0),
  CONSTRAINT ck_promotion_status CHECK (promotion_status IN ('ACTIVE', 'INACTIVE', 'EXPIRED'))
);
