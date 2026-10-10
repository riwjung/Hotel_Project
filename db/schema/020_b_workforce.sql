-- =====================================================================
-- 020 · Module B — Workforce & time
-- shift, work_schedule, attendance
-- attendance has no employee_id on purpose (3NF: derived via schedule_id)
-- =====================================================================

CREATE TABLE shift (
  shift_id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id     integer     NOT NULL,
  shift_name    varchar(50) NOT NULL,
  start_time    time        NOT NULL,
  end_time      time        NOT NULL,
  is_overnight  boolean     NOT NULL DEFAULT false,
  CONSTRAINT uq_shift_branch_name UNIQUE (branch_id, shift_name),
  -- an overnight shift ends "earlier" than it starts (e.g. 23:00–07:00)
  CONSTRAINT ck_shift_times CHECK (is_overnight OR end_time > start_time),
  CONSTRAINT fk_shift_branch FOREIGN KEY (branch_id) REFERENCES branch (branch_id)
);

CREATE TABLE work_schedule (
  schedule_id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  employee_id      integer     NOT NULL,
  shift_id         integer     NOT NULL,
  work_date        date        NOT NULL,
  schedule_status  varchar(20) NOT NULL DEFAULT 'SCHEDULED',
  CONSTRAINT uq_work_schedule_slot UNIQUE (employee_id, work_date, shift_id),
  CONSTRAINT ck_schedule_status CHECK (schedule_status IN ('SCHEDULED', 'COMPLETED', 'ABSENT', 'CANCELLED')),
  CONSTRAINT fk_work_schedule_employee FOREIGN KEY (employee_id) REFERENCES employee (employee_id),
  CONSTRAINT fk_work_schedule_shift FOREIGN KEY (shift_id) REFERENCES shift (shift_id)
);
CREATE INDEX ix_work_schedule_shift ON work_schedule (shift_id);
CREATE INDEX ix_work_schedule_date ON work_schedule (work_date);

CREATE TABLE attendance (
  attendance_id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  schedule_id        integer     NOT NULL,
  clock_in           timestamptz,
  clock_out          timestamptz,
  attendance_status  varchar(20) NOT NULL,
  remark             varchar(255),
  CONSTRAINT uq_attendance_schedule UNIQUE (schedule_id),          -- 1 : 0..1
  CONSTRAINT ck_attendance_status CHECK (attendance_status IN ('ON_TIME', 'LATE', 'EARLY_LEAVE', 'ABSENT')),
  CONSTRAINT ck_attendance_clock CHECK (clock_out IS NULL OR clock_in IS NULL OR clock_out >= clock_in),
  CONSTRAINT fk_attendance_schedule FOREIGN KEY (schedule_id) REFERENCES work_schedule (schedule_id)
);
