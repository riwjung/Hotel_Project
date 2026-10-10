-- =====================================================================
-- 075 · Module G (transaction part) — Money & satisfaction
-- payment, review
-- review has no customer_id on purpose (3NF: derived via booking_id)
-- =====================================================================

CREATE TABLE payment (
  payment_id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id          integer       NOT NULL,
  received_by_emp_id  integer,                         -- NULL = paid online
  amount              decimal(12,2) NOT NULL,
  payment_type        varchar(20)   NOT NULL,
  payment_method      varchar(20)   NOT NULL,
  payment_date        timestamptz   NOT NULL DEFAULT now(),
  slip_url            varchar(255),
  transaction_ref     varchar(100),
  payment_status      varchar(20)   NOT NULL DEFAULT 'PENDING',
  CONSTRAINT ck_payment_amount CHECK (amount > 0),
  CONSTRAINT ck_payment_type CHECK (payment_type IN ('DEPOSIT', 'FULL', 'BALANCE', 'REFUND')),
  CONSTRAINT ck_payment_method CHECK (payment_method IN ('CASH', 'CARD', 'TRANSFER', 'QR')),
  CONSTRAINT ck_payment_status CHECK (payment_status IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES booking (booking_id),
  CONSTRAINT fk_payment_received_by FOREIGN KEY (received_by_emp_id) REFERENCES employee (employee_id)
);
CREATE INDEX ix_payment_booking ON payment (booking_id);
CREATE INDEX ix_payment_received_by ON payment (received_by_emp_id);

CREATE TABLE review (
  review_id        integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id       integer      NOT NULL,
  reply_by_emp_id  integer,
  room_rating      integer      NOT NULL,
  service_rating   integer      NOT NULL,
  staff_rating     integer      NOT NULL,
  comment          varchar(500),
  review_date      timestamptz  NOT NULL DEFAULT now(),
  review_status    varchar(20)  NOT NULL DEFAULT 'PENDING',
  CONSTRAINT uq_review_booking UNIQUE (booking_id),               -- 1 : 0..1
  CONSTRAINT ck_review_ratings CHECK (
    room_rating BETWEEN 1 AND 5 AND service_rating BETWEEN 1 AND 5 AND staff_rating BETWEEN 1 AND 5
  ),
  CONSTRAINT ck_review_status CHECK (review_status IN ('PENDING', 'PUBLISHED', 'HIDDEN')),
  CONSTRAINT fk_review_booking FOREIGN KEY (booking_id) REFERENCES booking (booking_id),
  CONSTRAINT fk_review_reply_by FOREIGN KEY (reply_by_emp_id) REFERENCES employee (employee_id)
);
CREATE INDEX ix_review_reply_by ON review (reply_by_emp_id);
