-- =====================================================================
-- 070 · Module F — On-site operations
-- housekeeping_task, maintenance_request
-- Internal work with no customer order and no price (kept out of SERVICE).
-- =====================================================================

CREATE TABLE housekeeping_task (
  task_id             integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id             integer     NOT NULL,
  assigned_emp_id     integer     NOT NULL,
  verified_by_emp_id  integer,
  task_type           varchar(30) NOT NULL,
  task_date           date        NOT NULL DEFAULT current_date,
  started_at          timestamptz,
  completed_at        timestamptz,
  task_status         varchar(20) NOT NULL DEFAULT 'PENDING',
  remark              varchar(255),
  CONSTRAINT ck_housekeeping_type CHECK (
    task_type IN ('CHECKOUT_CLEAN', 'STAYOVER_CLEAN', 'DEEP_CLEAN', 'INSPECTION')
  ),
  CONSTRAINT ck_housekeeping_status CHECK (
    task_status IN ('PENDING', 'IN_PROGRESS', 'DONE', 'VERIFIED', 'CANCELLED')
  ),
  CONSTRAINT ck_housekeeping_times CHECK (
    completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at
  ),
  -- a task cannot be verified by the person who did it
  CONSTRAINT ck_housekeeping_verifier CHECK (
    verified_by_emp_id IS NULL OR verified_by_emp_id <> assigned_emp_id
  ),
  CONSTRAINT fk_housekeeping_task_room FOREIGN KEY (room_id) REFERENCES room (room_id),
  CONSTRAINT fk_housekeeping_task_assigned FOREIGN KEY (assigned_emp_id) REFERENCES employee (employee_id),
  CONSTRAINT fk_housekeeping_task_verified_by FOREIGN KEY (verified_by_emp_id) REFERENCES employee (employee_id)
);
CREATE INDEX ix_housekeeping_task_room ON housekeeping_task (room_id);
CREATE INDEX ix_housekeeping_task_assigned ON housekeeping_task (assigned_emp_id);
CREATE INDEX ix_housekeeping_task_verified_by ON housekeeping_task (verified_by_emp_id);
CREATE INDEX ix_housekeeping_task_date ON housekeeping_task (task_date, task_status);

CREATE TABLE maintenance_request (
  maintenance_id       integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id            integer       NOT NULL,
  room_id              integer,                          -- NULL = common area (lobby, pool, ...)
  reported_by_emp_id   integer       NOT NULL,
  assigned_to_emp_id   integer,
  issue_title          varchar(100)  NOT NULL,
  priority             varchar(20)   NOT NULL DEFAULT 'MEDIUM',
  report_date          timestamptz   NOT NULL DEFAULT now(),
  done_date            timestamptz,
  cost                 decimal(10,2),
  maintenance_status   varchar(20)   NOT NULL DEFAULT 'OPEN',
  CONSTRAINT ck_maintenance_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  CONSTRAINT ck_maintenance_status CHECK (
    maintenance_status IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED')
  ),
  CONSTRAINT ck_maintenance_cost CHECK (cost IS NULL OR cost >= 0),
  CONSTRAINT ck_maintenance_done CHECK (done_date IS NULL OR done_date >= report_date),
  CONSTRAINT fk_maintenance_request_branch FOREIGN KEY (branch_id) REFERENCES branch (branch_id),
  CONSTRAINT fk_maintenance_request_room FOREIGN KEY (room_id) REFERENCES room (room_id),
  CONSTRAINT fk_maintenance_request_reported_by FOREIGN KEY (reported_by_emp_id) REFERENCES employee (employee_id),
  CONSTRAINT fk_maintenance_request_assigned_to FOREIGN KEY (assigned_to_emp_id) REFERENCES employee (employee_id)
);
CREATE INDEX ix_maintenance_request_branch ON maintenance_request (branch_id, maintenance_status);
CREATE INDEX ix_maintenance_request_room ON maintenance_request (room_id);
CREATE INDEX ix_maintenance_request_reported_by ON maintenance_request (reported_by_emp_id);
CREATE INDEX ix_maintenance_request_assigned_to ON maintenance_request (assigned_to_emp_id);
