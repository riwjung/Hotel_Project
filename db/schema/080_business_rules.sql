-- =====================================================================
-- 080 · Business rules that a foreign key cannot express
-- (er-design.md › "กฎที่ FK บังคับไม่ได้" + a few extra integrity rules)
--
-- Every violation raises SQLSTATE P0001 (raise_exception) with a message
-- written for end users — the API passes it straight to the UI.
--
-- Actor context: the API runs writes inside withTx(), which sets
--   app.emp_id         → who is acting (used by the status log)
--   app.status_remark  → optional remark for the next status change
-- =====================================================================


-- ---------------------------------------------------------------------
-- R1 · ROOM_RATE periods must not overlap within the same (branch, room_type)
-- ---------------------------------------------------------------------
ALTER TABLE room_rate
  ADD CONSTRAINT ex_room_rate_no_overlap EXCLUDE USING gist (
    branch_id    WITH =,
    room_type_id WITH =,
    daterange(start_date, end_date, '[]') WITH &&
  ) WHERE (rate_status = 'ACTIVE');


-- ---------------------------------------------------------------------
-- R2 · EMPLOYEE branch must match the role scope
--      CHAIN roles (owner) → branch_id NULL · BRANCH roles → branch_id required
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_employee_check_scope() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_scope role.scope_level%TYPE;
BEGIN
  SELECT scope_level INTO v_scope FROM role WHERE role_id = NEW.role_id;

  IF v_scope = 'CHAIN' AND NEW.branch_id IS NOT NULL THEN
    RAISE EXCEPTION 'Chain-level roles cannot be assigned to a branch';
  ELSIF v_scope = 'BRANCH' AND NEW.branch_id IS NULL THEN
    RAISE EXCEPTION 'Branch-level roles must be assigned to a branch';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_employee_10_check_scope
  BEFORE INSERT OR UPDATE OF role_id, branch_id ON employee
  FOR EACH ROW EXECUTE FUNCTION fn_employee_check_scope();


-- ---------------------------------------------------------------------
-- R3 · BOOKING_ROOM validation
--      a) room and booking belong to the same branch
--      b) the rate is for that branch and that room's type
--      c) the room is not booked by another active booking for overlapping dates
--         (stay = [check_in, check_out) so back-to-back stays are allowed)
--      The room row is locked FOR UPDATE so two concurrent bookings of the
--      same room are serialized instead of both passing the overlap check.
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_booking_room_validate() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_booking   booking%ROWTYPE;
  v_room      room%ROWTYPE;
  v_rate      room_rate%ROWTYPE;
  v_conflict  booking.booking_code%TYPE;
BEGIN
  SELECT * INTO v_booking FROM booking WHERE booking_id = NEW.booking_id;
  SELECT * INTO v_room FROM room WHERE room_id = NEW.room_id FOR UPDATE;
  SELECT * INTO v_rate FROM room_rate WHERE rate_id = NEW.rate_id;

  IF v_room.branch_id <> v_booking.branch_id THEN
    RAISE EXCEPTION 'Room % is not in the same branch as booking %',
      v_room.room_number, v_booking.booking_code;
  END IF;

  IF v_rate.branch_id <> v_room.branch_id OR v_rate.room_type_id <> v_room.room_type_id THEN
    RAISE EXCEPTION 'Rate "%" does not apply to room %', v_rate.rate_name, v_room.room_number;
  END IF;

  IF v_booking.booking_status IN ('CANCELLED', 'NO_SHOW') THEN
    RETURN NEW;
  END IF;

  SELECT b.booking_code INTO v_conflict
  FROM booking_room br
  JOIN booking b ON b.booking_id = br.booking_id
  WHERE br.room_id = NEW.room_id
    AND br.booking_id <> NEW.booking_id
    AND b.booking_status NOT IN ('CANCELLED', 'NO_SHOW')
    AND daterange(b.check_in_date, b.check_out_date, '[)')
        && daterange(v_booking.check_in_date, v_booking.check_out_date, '[)')
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'Room % is already booked for these dates (booking %)',
      v_room.room_number, v_conflict;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_booking_room_10_validate
  BEFORE INSERT OR UPDATE ON booking_room
  FOR EACH ROW EXECUTE FUNCTION fn_booking_room_validate();


-- ---------------------------------------------------------------------
-- R4 · BOOKING_SERVICE must be ordered from a service of the booking's branch
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_booking_service_validate() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_booking_branch  integer;
  v_service_branch  integer;
  v_available       boolean;
BEGIN
  SELECT branch_id INTO v_booking_branch FROM booking WHERE booking_id = NEW.booking_id;
  SELECT branch_id, is_available INTO v_service_branch, v_available
  FROM branch_service WHERE branch_service_id = NEW.branch_service_id;

  IF v_service_branch <> v_booking_branch THEN
    RAISE EXCEPTION 'This service is not offered by the booking''s branch';
  END IF;

  IF TG_OP = 'INSERT' AND NOT v_available THEN
    RAISE EXCEPTION 'This service is currently unavailable at this branch';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_booking_service_10_validate
  BEFORE INSERT OR UPDATE OF booking_id, branch_service_id ON booking_service
  FOR EACH ROW EXECUTE FUNCTION fn_booking_service_validate();


-- ---------------------------------------------------------------------
-- R5 · SERVICE_ASSIGNMENT — the worker must have the skill for that service
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_service_assignment_check_skill() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_service_id  integer;
BEGIN
  SELECT brs.service_id INTO v_service_id
  FROM booking_service bks
  JOIN branch_service brs ON brs.branch_service_id = bks.branch_service_id
  WHERE bks.booking_service_id = NEW.booking_service_id;

  IF NOT EXISTS (
    SELECT 1 FROM employee_service_skill
    WHERE employee_id = NEW.employee_id AND service_id = v_service_id
  ) THEN
    RAISE EXCEPTION 'This employee is not skilled for the ordered service';
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_service_assignment_10_check_skill
  BEFORE INSERT OR UPDATE OF employee_id, booking_service_id ON service_assignment
  FOR EACH ROW EXECUTE FUNCTION fn_service_assignment_check_skill();

-- R6 · Only one live assignment per order line. Reassigning = mark the old row
--      REASSIGNED, then insert the new one (history is never overwritten).
CREATE UNIQUE INDEX uq_service_assignment_active
  ON service_assignment (booking_service_id)
  WHERE assignment_status NOT IN ('REASSIGNED', 'CANCELLED');


-- ---------------------------------------------------------------------
-- R7 · BOOKING status workflow
--      PENDING → CONFIRMED | CANCELLED
--      CONFIRMED → CHECKED_IN | CANCELLED | NO_SHOW
--      CHECKED_IN → CHECKED_OUT
--      CHECKED_OUT, CANCELLED, NO_SHOW are final
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_booking_check_transition() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.booking_status = OLD.booking_status THEN
    RETURN NEW;
  END IF;

  IF NOT (
       (OLD.booking_status = 'PENDING'    AND NEW.booking_status IN ('CONFIRMED', 'CANCELLED'))
    OR (OLD.booking_status = 'CONFIRMED'  AND NEW.booking_status IN ('CHECKED_IN', 'CANCELLED', 'NO_SHOW'))
    OR (OLD.booking_status = 'CHECKED_IN' AND NEW.booking_status = 'CHECKED_OUT')
  ) THEN
    RAISE EXCEPTION 'Booking % cannot move from % to %',
      OLD.booking_code, OLD.booking_status, NEW.booking_status;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_booking_10_check_transition
  BEFORE UPDATE OF booking_status ON booking
  FOR EACH ROW EXECUTE FUNCTION fn_booking_check_transition();


-- ---------------------------------------------------------------------
-- R8 · BOOKING promotion must be usable: ACTIVE, booking date inside the
--      promotion window, and usage_limit not yet reached
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_booking_check_promotion() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_promo  promotion%ROWTYPE;
  v_used   integer;
BEGIN
  IF NEW.promotion_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.promotion_id IS NOT DISTINCT FROM OLD.promotion_id THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT * INTO v_promo FROM promotion WHERE promotion_id = NEW.promotion_id;

  IF v_promo.promotion_status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'Promotion % is not active', v_promo.promotion_code;
  END IF;

  IF NEW.booking_date::date NOT BETWEEN v_promo.start_date AND v_promo.end_date THEN
    RAISE EXCEPTION 'Promotion % is only valid from % to %',
      v_promo.promotion_code, v_promo.start_date, v_promo.end_date;
  END IF;

  IF v_promo.usage_limit IS NOT NULL THEN
    SELECT count(*) INTO v_used
    FROM booking
    WHERE promotion_id = NEW.promotion_id
      AND booking_status <> 'CANCELLED'
      AND booking_id IS DISTINCT FROM NEW.booking_id;

    IF v_used >= v_promo.usage_limit THEN
      RAISE EXCEPTION 'Promotion % has reached its usage limit', v_promo.promotion_code;
    END IF;
  END IF;

  RETURN NEW;
END $$;

CREATE TRIGGER trg_booking_20_check_promotion
  BEFORE INSERT OR UPDATE OF promotion_id ON booking
  FOR EACH ROW EXECUTE FUNCTION fn_booking_check_promotion();


-- ---------------------------------------------------------------------
-- R9 · BOOKING_STATUS_LOG — audit every status change with the actor
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_booking_log_status() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.booking_status = OLD.booking_status THEN
    RETURN NULL;
  END IF;

  INSERT INTO booking_status_log (booking_id, changed_by_emp_id, from_status, to_status, remark)
  VALUES (
    NEW.booking_id,
    NULLIF(current_setting('app.emp_id', true), '')::integer,
    CASE WHEN TG_OP = 'UPDATE' THEN OLD.booking_status END,
    NEW.booking_status,
    NULLIF(current_setting('app.status_remark', true), '')
  );
  RETURN NULL;
END $$;

CREATE TRIGGER trg_booking_90_log_status
  AFTER INSERT OR UPDATE OF booking_status ON booking
  FOR EACH ROW EXECUTE FUNCTION fn_booking_log_status();


-- ---------------------------------------------------------------------
-- R10 · REVIEW only for stays that are completed (CHECKED_OUT)
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_review_check_booking() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_status booking.booking_status%TYPE;
BEGIN
  SELECT booking_status INTO v_status FROM booking WHERE booking_id = NEW.booking_id;
  IF v_status <> 'CHECKED_OUT' THEN
    RAISE EXCEPTION 'Only checked-out bookings can be reviewed';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_review_10_check_booking
  BEFORE INSERT OR UPDATE OF booking_id ON review
  FOR EACH ROW EXECUTE FUNCTION fn_review_check_booking();


-- ---------------------------------------------------------------------
-- R11 · Guests must fit the rooms (room_type.capacity)
--      a) GUEST rows of one booked room ≤ that room type's capacity
--         (checked per row; the booked-room line is locked FOR UPDATE so two
--         concurrent check-ins into the same room are serialized)
--      b) BOOKING.guest_count ≤ Σ capacity of all its rooms
--         A booking is inserted before its rooms, and a 4-guest booking of two
--         2-person rooms is "over capacity" after the first room. So (b) is a
--         DEFERRABLE INITIALLY DEFERRED constraint trigger: it runs at COMMIT,
--         once every room is in. Bookings with no rooms yet are skipped.
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_guest_check_capacity() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_capacity  room_type.capacity%TYPE;
  v_room      room.room_number%TYPE;
  v_others    integer;
BEGIN
  SELECT rt.capacity, r.room_number INTO v_capacity, v_room
  FROM booking_room br
  JOIN room r       ON r.room_id = br.room_id
  JOIN room_type rt ON rt.room_type_id = r.room_type_id
  WHERE br.booking_room_id = NEW.booking_room_id
  FOR UPDATE OF br;

  SELECT count(*) INTO v_others
  FROM guest
  WHERE booking_room_id = NEW.booking_room_id
    AND guest_id <> NEW.guest_id;

  IF v_others + 1 > v_capacity THEN
    RAISE EXCEPTION 'Room % holds at most % guest(s)', v_room, v_capacity;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_guest_10_check_capacity
  BEFORE INSERT OR UPDATE OF booking_room_id ON guest
  FOR EACH ROW EXECUTE FUNCTION fn_guest_check_capacity();

CREATE FUNCTION fn_assert_booking_capacity(p_booking_id integer) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_code      booking.booking_code%TYPE;
  v_guests    integer;
  v_rooms     integer;
  v_capacity  integer;
BEGIN
  SELECT b.booking_code, b.guest_count, count(br.booking_room_id), COALESCE(sum(rt.capacity), 0)
    INTO v_code, v_guests, v_rooms, v_capacity
  FROM booking b
  LEFT JOIN booking_room br ON br.booking_id = b.booking_id
  LEFT JOIN room r          ON r.room_id = br.room_id
  LEFT JOIN room_type rt    ON rt.room_type_id = r.room_type_id
  WHERE b.booking_id = p_booking_id
  GROUP BY b.booking_id;

  IF v_rooms > 0 AND v_guests > v_capacity THEN
    RAISE EXCEPTION 'Booking % has % guest(s) but its room(s) hold only %',
      v_code, v_guests, v_capacity;
  END IF;
END $$;

CREATE FUNCTION fn_booking_check_capacity() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP <> 'INSERT' THEN
    PERFORM fn_assert_booking_capacity(OLD.booking_id);
  END IF;
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.booking_id <> OLD.booking_id) THEN
    PERFORM fn_assert_booking_capacity(NEW.booking_id);
  END IF;
  RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER trg_booking_95_check_capacity
  AFTER INSERT OR UPDATE OF guest_count ON booking
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION fn_booking_check_capacity();

CREATE CONSTRAINT TRIGGER trg_booking_room_95_check_capacity
  AFTER INSERT OR UPDATE OF booking_id, room_id OR DELETE ON booking_room
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION fn_booking_check_capacity();


-- ---------------------------------------------------------------------
-- R12 · A stay must be at least the rate's min_nights
--      (min_nights ≥ 1 itself is the CHECK ck_room_rate_min_nights)
--      Runs on every booking_room write, and booking date changes touch the
--      lines (085 › fn_booking_touch_lines), so shortening a stay is caught too.
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_booking_room_check_min_nights() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_nights  integer;
  v_rate    room_rate%ROWTYPE;
BEGIN
  SELECT check_out_date - check_in_date INTO v_nights FROM booking WHERE booking_id = NEW.booking_id;
  SELECT * INTO v_rate FROM room_rate WHERE rate_id = NEW.rate_id;

  IF v_nights < v_rate.min_nights THEN
    RAISE EXCEPTION 'Rate "%" requires a stay of at least % night(s)', v_rate.rate_name, v_rate.min_nights;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_booking_room_15_check_min_nights
  BEFORE INSERT OR UPDATE ON booking_room
  FOR EACH ROW EXECUTE FUNCTION fn_booking_room_check_min_nights();


-- ---------------------------------------------------------------------
-- R13 · CUSTOMER tier follows member_point
--      tier = the member_tier with the highest min_point ≤ member_point.
--      customer.tier_id is therefore derived data (member_point → tier_id via
--      the member_tier ladder). It is kept as a column, as in the ER, and owned
--      by these triggers — the same controlled redundancy as the totals (ADR-003,
--      ADR-006). A tier_id written by the app is overwritten.
--      a) on customer insert / points change → recompute that customer
--      b) on a ladder change (new tier, new threshold) → recompute everyone;
--         a ladder that leaves some customer without a tier is rejected
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_tier_for_points(p_points integer) RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT tier_id FROM member_tier WHERE min_point <= p_points ORDER BY min_point DESC LIMIT 1
$$;

CREATE FUNCTION fn_customer_set_tier() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.tier_id := fn_tier_for_points(NEW.member_point);
  IF NEW.tier_id IS NULL THEN
    RAISE EXCEPTION 'No member tier starts at or below % points — the lowest tier must start at 0',
      NEW.member_point;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_customer_10_set_tier
  BEFORE INSERT OR UPDATE OF member_point, tier_id ON customer
  FOR EACH ROW EXECUTE FUNCTION fn_customer_set_tier();

CREATE FUNCTION fn_member_tier_resync_customers() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE customer SET tier_id = fn_tier_for_points(member_point)
  WHERE tier_id IS DISTINCT FROM fn_tier_for_points(member_point);
  RETURN NULL;
END $$;

-- Statement-level: one resync per ladder change, not one per tier row.
-- DELETE needs no resync: an unused tier is nobody's best match, and deleting
-- a tier still in use is stopped by fk_customer_tier first.
CREATE TRIGGER trg_member_tier_90_resync_customers
  AFTER INSERT OR UPDATE OF min_point ON member_tier
  FOR EACH STATEMENT EXECUTE FUNCTION fn_member_tier_resync_customers();


-- ---------------------------------------------------------------------
-- R15 · Rooms under repair
--      a) a maintenance request's room must be in the request's branch
--      b) workflow: OPEN → IN_PROGRESS | RESOLVED | CANCELLED,
--         IN_PROGRESS → RESOLVED | CANCELLED; RESOLVED and CANCELLED are final.
--         RESOLVED stamps done_date.
--      c) a room with an OPEN / IN_PROGRESS request is MAINTENANCE, so it cannot be
--         checked in. A guest already inside keeps it OCCUPIED, and OUT_OF_SERVICE
--         is left alone. Any write that would make it AVAILABLE / CLEANING (e.g.
--         check-out) keeps it MAINTENANCE. Closing its last open request releases
--         it: CLEANING if a housekeeping task is still unverified, else AVAILABLE.
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_room_has_open_repair(p_room_id integer) RETURNS boolean
LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM maintenance_request
    WHERE room_id = p_room_id AND maintenance_status IN ('OPEN', 'IN_PROGRESS')
  )
$$;

CREATE FUNCTION fn_room_sync_repair_status(p_room_id integer) RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  IF fn_room_has_open_repair(p_room_id) THEN
    UPDATE room SET room_status = 'MAINTENANCE'
    WHERE room_id = p_room_id AND room_status IN ('AVAILABLE', 'CLEANING');
  ELSE
    UPDATE room SET room_status = CASE
        WHEN EXISTS (
          SELECT 1 FROM housekeeping_task
          WHERE room_id = p_room_id AND task_status IN ('PENDING', 'IN_PROGRESS', 'DONE')
        ) THEN 'CLEANING'
        ELSE 'AVAILABLE'
      END
    WHERE room_id = p_room_id AND room_status = 'MAINTENANCE';
  END IF;
END $$;

CREATE FUNCTION fn_maintenance_validate() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_room_branch  integer;
  v_room_number  room.room_number%TYPE;
BEGIN
  IF NEW.room_id IS NOT NULL THEN
    SELECT branch_id, room_number INTO v_room_branch, v_room_number FROM room WHERE room_id = NEW.room_id;
    IF v_room_branch <> NEW.branch_id THEN
      RAISE EXCEPTION 'Room % is not in this request''s branch', v_room_number;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.maintenance_status <> OLD.maintenance_status THEN
    IF NOT (
         (OLD.maintenance_status = 'OPEN'        AND NEW.maintenance_status IN ('IN_PROGRESS', 'RESOLVED', 'CANCELLED'))
      OR (OLD.maintenance_status = 'IN_PROGRESS' AND NEW.maintenance_status IN ('RESOLVED', 'CANCELLED'))
    ) THEN
      RAISE EXCEPTION 'A % maintenance request cannot move to %',
        lower(replace(OLD.maintenance_status, '_', ' ')), lower(replace(NEW.maintenance_status, '_', ' '));
    END IF;
  END IF;

  IF NEW.maintenance_status = 'RESOLVED' AND NEW.done_date IS NULL THEN
    NEW.done_date := now();
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_maintenance_request_10_validate
  BEFORE INSERT OR UPDATE ON maintenance_request
  FOR EACH ROW EXECUTE FUNCTION fn_maintenance_validate();

CREATE FUNCTION fn_maintenance_sync_room() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.room_id IS NOT NULL AND OLD.room_id IS DISTINCT FROM NEW.room_id THEN
    PERFORM fn_room_sync_repair_status(OLD.room_id);
  END IF;
  IF NEW.room_id IS NOT NULL THEN
    PERFORM fn_room_sync_repair_status(NEW.room_id);
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_maintenance_request_80_sync_room
  AFTER INSERT OR UPDATE OF maintenance_status, room_id ON maintenance_request
  FOR EACH ROW EXECUTE FUNCTION fn_maintenance_sync_room();

CREATE FUNCTION fn_room_keep_under_repair() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.room_status IN ('AVAILABLE', 'CLEANING') AND fn_room_has_open_repair(NEW.room_id) THEN
    NEW.room_status := 'MAINTENANCE';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_room_10_keep_under_repair
  BEFORE INSERT OR UPDATE OF room_status ON room
  FOR EACH ROW EXECUTE FUNCTION fn_room_keep_under_repair();


-- ---------------------------------------------------------------------
-- R16 · People assigned to branch work belong to that branch
--      maintenance technician, housekeeping assignee and verifier, service
--      worker and shift worker must have employee.branch_id = the work's branch.
--      Chain-level staff (branch_id NULL, e.g. the owner) may be assigned anywhere.
-- ---------------------------------------------------------------------
CREATE FUNCTION fn_assert_employee_in_branch(p_employee_id integer, p_branch_id integer) RETURNS void
LANGUAGE plpgsql AS $$
DECLARE
  v_name    text;
  v_branch  integer;
  v_code    branch.branch_code%TYPE;
  v_target  branch.branch_code%TYPE;
BEGIN
  IF p_employee_id IS NULL THEN
    RETURN;
  END IF;
  SELECT e.first_name || ' ' || e.last_name, e.branch_id, b.branch_code
    INTO v_name, v_branch, v_code
  FROM employee e LEFT JOIN branch b ON b.branch_id = e.branch_id
  WHERE e.employee_id = p_employee_id;

  IF v_branch IS NOT NULL AND v_branch <> p_branch_id THEN
    SELECT branch_code INTO v_target FROM branch WHERE branch_id = p_branch_id;
    RAISE EXCEPTION '% works at %, not %', v_name, v_code, v_target;
  END IF;
END $$;

CREATE FUNCTION fn_maintenance_check_assignee() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM fn_assert_employee_in_branch(NEW.assigned_to_emp_id, NEW.branch_id);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_maintenance_request_20_check_assignee
  BEFORE INSERT OR UPDATE OF assigned_to_emp_id, branch_id ON maintenance_request
  FOR EACH ROW EXECUTE FUNCTION fn_maintenance_check_assignee();

CREATE FUNCTION fn_housekeeping_check_staff() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_branch integer;
BEGIN
  SELECT branch_id INTO v_branch FROM room WHERE room_id = NEW.room_id;
  PERFORM fn_assert_employee_in_branch(NEW.assigned_emp_id, v_branch);
  PERFORM fn_assert_employee_in_branch(NEW.verified_by_emp_id, v_branch);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_housekeeping_task_10_check_staff
  BEFORE INSERT OR UPDATE OF assigned_emp_id, verified_by_emp_id, room_id ON housekeeping_task
  FOR EACH ROW EXECUTE FUNCTION fn_housekeeping_check_staff();

CREATE FUNCTION fn_service_assignment_check_branch() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_branch integer;
BEGIN
  SELECT b.branch_id INTO v_branch
  FROM booking_service bs JOIN booking b ON b.booking_id = bs.booking_id
  WHERE bs.booking_service_id = NEW.booking_service_id;
  PERFORM fn_assert_employee_in_branch(NEW.employee_id, v_branch);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_service_assignment_20_check_branch
  BEFORE INSERT OR UPDATE OF employee_id, booking_service_id ON service_assignment
  FOR EACH ROW EXECUTE FUNCTION fn_service_assignment_check_branch();

CREATE FUNCTION fn_work_schedule_check_branch() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_branch integer;
BEGIN
  SELECT branch_id INTO v_branch FROM shift WHERE shift_id = NEW.shift_id;
  PERFORM fn_assert_employee_in_branch(NEW.employee_id, v_branch);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_work_schedule_10_check_branch
  BEFORE INSERT OR UPDATE OF employee_id, shift_id ON work_schedule
  FOR EACH ROW EXECUTE FUNCTION fn_work_schedule_check_branch();
