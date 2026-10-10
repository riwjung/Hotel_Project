-- =====================================================================
-- 050 · Module D — Booking & stay
-- customer, booking, booking_room, guest, booking_status_log
-- Totals (room_total, service_total, discount_amount, grand_total, subtotal,
-- night_count) are stored and maintained by triggers — see ADR-003 and
-- 085_totals_triggers.sql. price_per_night is an intentional snapshot.
-- =====================================================================

CREATE TABLE customer (
  customer_id    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tier_id        integer      NOT NULL,
  first_name     varchar(50)  NOT NULL,
  last_name      varchar(50)  NOT NULL,
  phone          varchar(20),
  email          varchar(100) NOT NULL,
  password_hash  varchar(255),                         -- NULL = walk-in customer without online account
  address        varchar(255),
  id_card_no     varchar(30),
  member_point   integer      NOT NULL DEFAULT 0,
  created_at     timestamptz  NOT NULL DEFAULT now(),
  CONSTRAINT uq_customer_email UNIQUE (email),
  CONSTRAINT ck_customer_point CHECK (member_point >= 0),
  CONSTRAINT fk_customer_tier FOREIGN KEY (tier_id) REFERENCES member_tier (tier_id)
);
CREATE INDEX ix_customer_tier ON customer (tier_id);

CREATE TABLE booking (
  booking_id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_code       varchar(20)   NOT NULL,
  customer_id        integer       NOT NULL,
  branch_id          integer       NOT NULL,
  promotion_id       integer,
  created_by_emp_id  integer,                          -- NULL = customer booked online
  booking_date       timestamptz   NOT NULL DEFAULT now(),
  check_in_date      date          NOT NULL,
  check_out_date     date          NOT NULL,
  guest_count        integer       NOT NULL DEFAULT 1,
  room_total         decimal(12,2) NOT NULL DEFAULT 0,
  service_total      decimal(12,2) NOT NULL DEFAULT 0,
  discount_amount    decimal(12,2) NOT NULL DEFAULT 0,
  grand_total        decimal(12,2) NOT NULL DEFAULT 0,
  booking_channel    varchar(20)   NOT NULL DEFAULT 'WALK_IN',
  booking_status     varchar(20)   NOT NULL DEFAULT 'PENDING',
  CONSTRAINT uq_booking_code UNIQUE (booking_code),
  CONSTRAINT ck_booking_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT ck_booking_guest_count CHECK (guest_count >= 1),
  CONSTRAINT ck_booking_totals CHECK (
    room_total >= 0 AND service_total >= 0 AND discount_amount >= 0 AND grand_total >= 0
  ),
  CONSTRAINT ck_booking_channel CHECK (booking_channel IN ('WALK_IN', 'WEBSITE', 'PHONE', 'OTA')),
  CONSTRAINT ck_booking_status CHECK (
    booking_status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED', 'NO_SHOW')
  ),
  CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id),
  CONSTRAINT fk_booking_branch FOREIGN KEY (branch_id) REFERENCES branch (branch_id),
  CONSTRAINT fk_booking_promotion FOREIGN KEY (promotion_id) REFERENCES promotion (promotion_id),
  CONSTRAINT fk_booking_created_by FOREIGN KEY (created_by_emp_id) REFERENCES employee (employee_id)
);
CREATE INDEX ix_booking_customer ON booking (customer_id);
CREATE INDEX ix_booking_branch_dates ON booking (branch_id, check_in_date, check_out_date);
CREATE INDEX ix_booking_promotion ON booking (promotion_id);
CREATE INDEX ix_booking_created_by ON booking (created_by_emp_id);
CREATE INDEX ix_booking_status ON booking (booking_status);

CREATE TABLE booking_room (
  booking_room_id    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id         integer       NOT NULL,
  room_id            integer       NOT NULL,
  rate_id            integer       NOT NULL,
  price_per_night    decimal(10,2) NOT NULL,           -- snapshot; trigger copies from room_rate when omitted
  night_count        integer       NOT NULL DEFAULT 0,
  subtotal           decimal(12,2) NOT NULL DEFAULT 0,
  actual_check_in    timestamptz,
  actual_check_out   timestamptz,
  checkin_by_emp_id  integer,
  key_card_no        varchar(20),
  CONSTRAINT uq_booking_room UNIQUE (booking_id, room_id),
  CONSTRAINT ck_booking_room_price CHECK (price_per_night >= 0),
  CONSTRAINT ck_booking_room_stay CHECK (
    actual_check_out IS NULL OR actual_check_in IS NULL OR actual_check_out >= actual_check_in
  ),
  CONSTRAINT fk_booking_room_booking FOREIGN KEY (booking_id) REFERENCES booking (booking_id),
  CONSTRAINT fk_booking_room_room FOREIGN KEY (room_id) REFERENCES room (room_id),
  CONSTRAINT fk_booking_room_rate FOREIGN KEY (rate_id) REFERENCES room_rate (rate_id),
  CONSTRAINT fk_booking_room_checkin_by FOREIGN KEY (checkin_by_emp_id) REFERENCES employee (employee_id)
);
CREATE INDEX ix_booking_room_room ON booking_room (room_id);
CREATE INDEX ix_booking_room_rate ON booking_room (rate_id);
CREATE INDEX ix_booking_room_checkin_by ON booking_room (checkin_by_emp_id);

CREATE TABLE guest (
  guest_id         integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_room_id  integer      NOT NULL,
  full_name        varchar(100) NOT NULL,
  id_card_no       varchar(30),
  nationality      varchar(50),
  is_primary       boolean      NOT NULL DEFAULT false,
  CONSTRAINT fk_guest_booking_room FOREIGN KEY (booking_room_id)
    REFERENCES booking_room (booking_room_id) ON DELETE CASCADE
);
CREATE INDEX ix_guest_booking_room ON guest (booking_room_id);
-- one primary guest per booked room
CREATE UNIQUE INDEX uq_guest_primary ON guest (booking_room_id) WHERE is_primary;

-- Audit trail — written by trigger fn_booking_log_status (080), never by the app directly
CREATE TABLE booking_status_log (
  log_id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id         integer     NOT NULL,
  changed_by_emp_id  integer,
  from_status        varchar(20),                       -- NULL on the creation entry
  to_status          varchar(20) NOT NULL,
  changed_at         timestamptz NOT NULL DEFAULT now(),
  remark             varchar(255),
  CONSTRAINT fk_booking_status_log_booking FOREIGN KEY (booking_id) REFERENCES booking (booking_id),
  CONSTRAINT fk_booking_status_log_changed_by FOREIGN KEY (changed_by_emp_id) REFERENCES employee (employee_id)
);
CREATE INDEX ix_booking_status_log_booking ON booking_status_log (booking_id, changed_at);
CREATE INDEX ix_booking_status_log_changed_by ON booking_status_log (changed_by_emp_id);
