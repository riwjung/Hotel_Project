-- =====================================================================
-- 030 · Module C — Rooms
-- room_type, amenity, room_type_amenity, room, room_image, room_rate
-- room_rate no-overlap EXCLUDE constraint lives in 080_business_rules.sql
-- =====================================================================

CREATE TABLE room_type (
  room_type_id  integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type_code     varchar(20)   NOT NULL,
  type_name     varchar(50)   NOT NULL,
  description   varchar(255),
  capacity      integer       NOT NULL,
  bed_type      varchar(30)   NOT NULL,
  base_price    decimal(10,2) NOT NULL,
  CONSTRAINT uq_room_type_code UNIQUE (type_code),
  CONSTRAINT ck_room_type_capacity CHECK (capacity > 0),
  CONSTRAINT ck_room_type_price CHECK (base_price >= 0)
);

CREATE TABLE amenity (
  amenity_id     integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  amenity_name   varchar(50) NOT NULL,
  amenity_group  varchar(30) NOT NULL,
  icon           varchar(50),
  CONSTRAINT uq_amenity_name UNIQUE (amenity_name)
);

-- M:N — replaces the old multi-valued room_type.amenities string (1NF)
CREATE TABLE room_type_amenity (
  room_type_id  integer NOT NULL,
  amenity_id    integer NOT NULL,
  note          varchar(100),
  PRIMARY KEY (room_type_id, amenity_id),
  CONSTRAINT fk_room_type_amenity_room_type FOREIGN KEY (room_type_id)
    REFERENCES room_type (room_type_id) ON DELETE CASCADE,
  CONSTRAINT fk_room_type_amenity_amenity FOREIGN KEY (amenity_id)
    REFERENCES amenity (amenity_id) ON DELETE CASCADE
);
CREATE INDEX ix_room_type_amenity_amenity ON room_type_amenity (amenity_id);

CREATE TABLE room (
  room_id        integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id      integer      NOT NULL,
  room_type_id   integer      NOT NULL,
  room_number    varchar(10)  NOT NULL,
  room_name      varchar(100),
  floor          integer      NOT NULL,
  location_zone  varchar(50),
  room_status    varchar(20)  NOT NULL DEFAULT 'AVAILABLE',
  description    varchar(255),
  CONSTRAINT uq_room_branch_number UNIQUE (branch_id, room_number),
  CONSTRAINT ck_room_status CHECK (room_status IN ('AVAILABLE', 'OCCUPIED', 'CLEANING', 'MAINTENANCE', 'OUT_OF_SERVICE')),
  CONSTRAINT fk_room_branch FOREIGN KEY (branch_id) REFERENCES branch (branch_id),
  CONSTRAINT fk_room_room_type FOREIGN KEY (room_type_id) REFERENCES room_type (room_type_id)
);
CREATE INDEX ix_room_room_type ON room (room_type_id);
CREATE INDEX ix_room_status ON room (branch_id, room_status);

CREATE TABLE room_image (
  image_id       integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  room_id        integer      NOT NULL,
  image_url      varchar(255) NOT NULL,
  image_caption  varchar(100),
  is_cover       boolean      NOT NULL DEFAULT false,
  sort_order     integer      NOT NULL DEFAULT 0,
  CONSTRAINT fk_room_image_room FOREIGN KEY (room_id) REFERENCES room (room_id) ON DELETE CASCADE
);
CREATE INDEX ix_room_image_room ON room_image (room_id);
-- at most one cover image per room
CREATE UNIQUE INDEX uq_room_image_cover ON room_image (room_id) WHERE is_cover;

CREATE TABLE room_rate (
  rate_id          integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  branch_id        integer       NOT NULL,
  room_type_id     integer       NOT NULL,
  rate_name        varchar(50)   NOT NULL,
  start_date       date          NOT NULL,
  end_date         date          NOT NULL,
  price_per_night  decimal(10,2) NOT NULL,
  min_nights       integer       NOT NULL DEFAULT 1,
  rate_status      varchar(20)   NOT NULL DEFAULT 'ACTIVE',
  CONSTRAINT ck_room_rate_dates CHECK (end_date >= start_date),
  CONSTRAINT ck_room_rate_price CHECK (price_per_night >= 0),
  CONSTRAINT ck_room_rate_min_nights CHECK (min_nights >= 1),
  CONSTRAINT ck_room_rate_status CHECK (rate_status IN ('ACTIVE', 'INACTIVE')),
  CONSTRAINT fk_room_rate_branch FOREIGN KEY (branch_id) REFERENCES branch (branch_id),
  CONSTRAINT fk_room_rate_room_type FOREIGN KEY (room_type_id) REFERENCES room_type (room_type_id)
);
CREATE INDEX ix_room_rate_room_type ON room_rate (room_type_id);
