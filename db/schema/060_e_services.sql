-- =====================================================================
-- 060 · Module E — Services
-- service_category, service, branch_service, booking_service,
-- service_assignment, employee_service_skill
-- SERVICE is the single master; it fans out per role:
--   branch   → branch_service          (price/availability per branch)
--   customer → booking_service         (order lines)
--   employee → employee_service_skill  (who can do what)
--   employee → service_assignment      (who did which order — append-only history)
-- =====================================================================

CREATE TABLE service_category (
  category_id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_code    varchar(20) NOT NULL,
  category_name    varchar(50) NOT NULL,
  category_status  varchar(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uq_service_category_code UNIQUE (category_code),
  CONSTRAINT ck_service_category_status CHECK (category_status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE service (
  service_id       integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_id      integer       NOT NULL,
  service_code     varchar(20)   NOT NULL,
  service_name     varchar(100)  NOT NULL,
  description      varchar(255),
  default_price    decimal(10,2) NOT NULL DEFAULT 0,
  unit             varchar(20)   NOT NULL,
  is_chargeable    boolean       NOT NULL DEFAULT true,
  need_assignment  boolean       NOT NULL DEFAULT false,
  est_minutes      integer,
  service_status   varchar(20)   NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uq_service_code UNIQUE (service_code),
  CONSTRAINT ck_service_price CHECK (default_price >= 0),
  CONSTRAINT ck_service_minutes CHECK (est_minutes IS NULL OR est_minutes > 0),
  CONSTRAINT ck_service_status CHECK (service_status IN ('ACTIVE', 'INACTIVE')),
  CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES service_category (category_id)
);
CREATE INDEX ix_service_category ON service (category_id);

CREATE TABLE branch_service (
  branch_service_id  integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id          integer       NOT NULL,
  service_id         integer       NOT NULL,
  branch_price       decimal(10,2) NOT NULL,
  is_available       boolean       NOT NULL DEFAULT true,
  open_time          time,
  close_time         time,
  CONSTRAINT uq_branch_service UNIQUE (branch_id, service_id),
  CONSTRAINT ck_branch_service_price CHECK (branch_price >= 0),
  CONSTRAINT ck_branch_service_hours CHECK (
    (open_time IS NULL AND close_time IS NULL) OR (open_time IS NOT NULL AND close_time IS NOT NULL)
  ),
  CONSTRAINT fk_branch_service_branch FOREIGN KEY (branch_id) REFERENCES branch (branch_id),
  CONSTRAINT fk_branch_service_service FOREIGN KEY (service_id) REFERENCES service (service_id)
);
CREATE INDEX ix_branch_service_service ON branch_service (service_id);

CREATE TABLE booking_service (
  booking_service_id  integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_id          integer       NOT NULL,
  branch_service_id   integer       NOT NULL,
  quantity            integer       NOT NULL DEFAULT 1,
  unit_price          decimal(10,2) NOT NULL,           -- snapshot; trigger copies branch_price when omitted
  subtotal            decimal(12,2) NOT NULL DEFAULT 0,
  requested_at        timestamptz   NOT NULL DEFAULT now(),
  scheduled_at        timestamptz,
  order_status        varchar(20)   NOT NULL DEFAULT 'REQUESTED',
  remark              varchar(255),
  CONSTRAINT ck_booking_service_qty CHECK (quantity > 0),
  CONSTRAINT ck_booking_service_price CHECK (unit_price >= 0),
  CONSTRAINT ck_booking_service_status CHECK (
    order_status IN ('REQUESTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')
  ),
  CONSTRAINT fk_booking_service_booking FOREIGN KEY (booking_id) REFERENCES booking (booking_id),
  CONSTRAINT fk_booking_service_branch_service FOREIGN KEY (branch_service_id)
    REFERENCES branch_service (branch_service_id)
);
CREATE INDEX ix_booking_service_booking ON booking_service (booking_id);
CREATE INDEX ix_booking_service_branch_service ON booking_service (branch_service_id);

-- Append-only history: changing the worker = insert a new row and mark the
-- old one REASSIGNED (never update employee_id in place).
CREATE TABLE service_assignment (
  assignment_id       integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  booking_service_id  integer     NOT NULL,
  employee_id         integer     NOT NULL,
  assigned_by_emp_id  integer,
  assigned_at         timestamptz NOT NULL DEFAULT now(),
  started_at          timestamptz,
  completed_at        timestamptz,
  quality_score       integer,
  assignment_status   varchar(20) NOT NULL DEFAULT 'ASSIGNED',
  note                varchar(255),
  CONSTRAINT ck_service_assignment_score CHECK (quality_score IS NULL OR quality_score BETWEEN 1 AND 5),
  CONSTRAINT ck_service_assignment_times CHECK (
    completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at
  ),
  CONSTRAINT ck_service_assignment_status CHECK (
    assignment_status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED', 'CANCELLED')
  ),
  CONSTRAINT fk_service_assignment_booking_service FOREIGN KEY (booking_service_id)
    REFERENCES booking_service (booking_service_id),
  CONSTRAINT fk_service_assignment_employee FOREIGN KEY (employee_id) REFERENCES employee (employee_id),
  CONSTRAINT fk_service_assignment_assigned_by FOREIGN KEY (assigned_by_emp_id) REFERENCES employee (employee_id)
);
CREATE INDEX ix_service_assignment_booking_service ON service_assignment (booking_service_id);
CREATE INDEX ix_service_assignment_employee ON service_assignment (employee_id);
CREATE INDEX ix_service_assignment_assigned_by ON service_assignment (assigned_by_emp_id);

CREATE TABLE employee_service_skill (
  employee_id     integer     NOT NULL,
  service_id      integer     NOT NULL,
  skill_level     varchar(20) NOT NULL DEFAULT 'JUNIOR',
  certified_date  date,
  PRIMARY KEY (employee_id, service_id),
  CONSTRAINT ck_employee_service_skill_level CHECK (skill_level IN ('JUNIOR', 'SENIOR', 'EXPERT')),
  CONSTRAINT fk_employee_service_skill_employee FOREIGN KEY (employee_id) REFERENCES employee (employee_id),
  CONSTRAINT fk_employee_service_skill_service FOREIGN KEY (service_id) REFERENCES service (service_id)
);
CREATE INDEX ix_employee_service_skill_service ON employee_service_skill (service_id);
