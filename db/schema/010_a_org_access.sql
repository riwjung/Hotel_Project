-- =====================================================================
-- 010 · Module A — Organization & access
-- branch, role, permission, role_permission, employee
-- owner = employee whose role has role_code='OWNER', scope_level='CHAIN', branch_id NULL
-- =====================================================================

CREATE TABLE branch (
  branch_id       integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_code     varchar(10)  NOT NULL,
  branch_name     varchar(100) NOT NULL,
  province        varchar(50)  NOT NULL,
  address         varchar(255),
  phone           varchar(20),
  check_in_time   time         NOT NULL DEFAULT '14:00',
  check_out_time  time         NOT NULL DEFAULT '12:00',
  branch_status   varchar(20)  NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uq_branch_code UNIQUE (branch_code),
  CONSTRAINT ck_branch_status CHECK (branch_status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE role (
  role_id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role_code    varchar(30) NOT NULL,
  role_name    varchar(50) NOT NULL,
  scope_level  varchar(20) NOT NULL,
  role_status  varchar(20) NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uq_role_code UNIQUE (role_code),
  CONSTRAINT ck_role_scope CHECK (scope_level IN ('CHAIN', 'BRANCH')),
  CONSTRAINT ck_role_status CHECK (role_status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE permission (
  permission_id    integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  permission_code  varchar(50) NOT NULL,
  module_name      varchar(50) NOT NULL,
  description      varchar(255),
  CONSTRAINT uq_permission_code UNIQUE (permission_code)
);

CREATE TABLE role_permission (
  role_id        integer     NOT NULL,
  permission_id  integer     NOT NULL,
  granted_at     timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id),
  CONSTRAINT fk_role_permission_role FOREIGN KEY (role_id)
    REFERENCES role (role_id) ON DELETE CASCADE,
  CONSTRAINT fk_role_permission_permission FOREIGN KEY (permission_id)
    REFERENCES permission (permission_id) ON DELETE CASCADE
);
CREATE INDEX ix_role_permission_permission ON role_permission (permission_id);

CREATE TABLE employee (
  employee_id      integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id        integer,                       -- NULL for chain-level roles (owner)
  role_id          integer      NOT NULL,
  manager_id       integer,
  employee_code    varchar(20)  NOT NULL,
  first_name       varchar(50)  NOT NULL,
  last_name        varchar(50)  NOT NULL,
  phone            varchar(20),
  email            varchar(100) NOT NULL,
  password_hash    varchar(255) NOT NULL,
  hire_date        date         NOT NULL DEFAULT current_date,
  employee_status  varchar(20)  NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT uq_employee_code UNIQUE (employee_code),
  CONSTRAINT uq_employee_email UNIQUE (email),
  CONSTRAINT ck_employee_status CHECK (employee_status IN ('ACTIVE', 'ON_LEAVE', 'RESIGNED')),
  CONSTRAINT ck_employee_not_own_manager CHECK (manager_id IS NULL OR manager_id <> employee_id),
  CONSTRAINT fk_employee_branch FOREIGN KEY (branch_id) REFERENCES branch (branch_id),
  CONSTRAINT fk_employee_role FOREIGN KEY (role_id) REFERENCES role (role_id),
  CONSTRAINT fk_employee_manager FOREIGN KEY (manager_id)
    REFERENCES employee (employee_id) ON DELETE SET NULL
);
CREATE INDEX ix_employee_branch ON employee (branch_id);
CREATE INDEX ix_employee_role ON employee (role_id);
CREATE INDEX ix_employee_manager ON employee (manager_id);
