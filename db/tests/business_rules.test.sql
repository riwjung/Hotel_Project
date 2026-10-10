-- =====================================================================
-- Business-rule tests (run by `npm run db:test` inside BEGIN … ROLLBACK)
-- Depends on the demo seed (110_demo.sql).
--
-- Pattern for "must be rejected" cases:
--   try the write → RAISE 'FAIL: …' if it got through
--   EXCEPTION WHEN <expected error> → RAISE NOTICE 'PASS: …'
-- Trigger errors are raise_exception (P0001), the same code as our own
-- FAIL raise, so those handlers re-raise anything that starts with 'FAIL:'.
-- =====================================================================

-- R1 · overlapping active room rate for the same branch + room type ---------
DO $$
BEGIN
  BEGIN
    INSERT INTO room_rate (branch_id, room_type_id, rate_name, start_date, end_date, price_per_night)
    VALUES (1, 1, 'Overlapping promo rate', current_date, current_date + 10, 999);
    RAISE EXCEPTION 'FAIL: overlapping room_rate was accepted';
  EXCEPTION WHEN exclusion_violation THEN
    RAISE NOTICE 'PASS: R1 overlapping room_rate rejected (23P01)';
  END;
END $$;

-- R1 · the same period is fine once stored as INACTIVE --------------------
DO $$
BEGIN
  INSERT INTO room_rate (branch_id, room_type_id, rate_name, start_date, end_date, price_per_night, rate_status)
  VALUES (1, 1, 'Draft rate', current_date, current_date + 10, 999, 'INACTIVE');
  RAISE NOTICE 'PASS: R1 inactive rate may overlap';
END $$;

-- R2 · chain-level role tied to a branch ----------------------------------
DO $$
BEGIN
  BEGIN
    INSERT INTO employee (branch_id, role_id, employee_code, first_name, last_name, email, password_hash)
    VALUES (1, 1, 'EMP-T001', 'Test', 'Owner', 'test.owner@hotel.local', 'x');
    RAISE EXCEPTION 'FAIL: owner with branch_id was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R2 chain role with branch rejected — %', SQLERRM;
  END;
END $$;

-- R2 · branch-level role without a branch --------------------------------
DO $$
BEGIN
  BEGIN
    INSERT INTO employee (branch_id, role_id, employee_code, first_name, last_name, email, password_hash)
    VALUES (NULL, 3, 'EMP-T002', 'Test', 'Staff', 'test.staff@hotel.local', 'x');
    RAISE EXCEPTION 'FAIL: staff without branch was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R2 branch role without branch rejected — %', SQLERRM;
  END;
END $$;

-- R3 · double-booking a room for overlapping dates -------------------------
-- Room 4 (BKK 201) is held by BK-0001 from current_date-2 to current_date+1.
DO $$
DECLARE
  v_booking integer;
BEGIN
  INSERT INTO booking (booking_code, customer_id, branch_id, check_in_date, check_out_date)
  VALUES ('BK-T001', 2, 1, current_date, current_date + 2)
  RETURNING booking_id INTO v_booking;

  BEGIN
    INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES (v_booking, 4, 2);
    RAISE EXCEPTION 'FAIL: overlapping booking_room was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R3 double booking rejected — %', SQLERRM;
  END;
END $$;

-- R3 · back-to-back stay (check-in on the other guest's check-out day) is OK
DO $$
DECLARE
  v_booking integer;
BEGIN
  INSERT INTO booking (booking_code, customer_id, branch_id, check_in_date, check_out_date)
  VALUES ('BK-T002', 2, 1, current_date + 1, current_date + 3)
  RETURNING booking_id INTO v_booking;

  INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES (v_booking, 4, 2);
  RAISE NOTICE 'PASS: R3 back-to-back stay accepted';
END $$;

-- R3 · room from another branch ------------------------------------------
DO $$
DECLARE
  v_booking integer;
BEGIN
  INSERT INTO booking (booking_code, customer_id, branch_id, check_in_date, check_out_date)
  VALUES ('BK-T003', 2, 1, current_date + 30, current_date + 31)
  RETURNING booking_id INTO v_booking;

  BEGIN
    INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES (v_booking, 12, 8);   -- HKT room
    RAISE EXCEPTION 'FAIL: room from another branch was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R3 branch mismatch rejected — %', SQLERRM;
  END;
END $$;

-- R3 · rate for a different room type --------------------------------------
DO $$
DECLARE
  v_booking integer;
BEGIN
  INSERT INTO booking (booking_code, customer_id, branch_id, check_in_date, check_out_date)
  VALUES ('BK-T004', 2, 1, current_date + 40, current_date + 41)
  RETURNING booking_id INTO v_booking;

  BEGIN
    INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES (v_booking, 5, 1);    -- DLX room, STD rate
    RAISE EXCEPTION 'FAIL: mismatched rate was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R3 rate/room type mismatch rejected — %', SQLERRM;
  END;
END $$;

-- R3 · extending a stay into another booking is caught too -----------------
-- BK-0002 holds room 1 for [today, today+2). Push BK-T005 into it.
DO $$
DECLARE
  v_booking integer;
BEGIN
  INSERT INTO booking (booking_code, customer_id, branch_id, check_in_date, check_out_date)
  VALUES ('BK-T005', 2, 1, current_date - 3, current_date)
  RETURNING booking_id INTO v_booking;
  INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES (v_booking, 1, 1);

  BEGIN
    UPDATE booking SET check_out_date = current_date + 1 WHERE booking_id = v_booking;
    RAISE EXCEPTION 'FAIL: date change into an existing booking was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R3 overlapping date change rejected — %', SQLERRM;
  END;
END $$;

-- R4 · ordering a service from another branch ------------------------------
DO $$
BEGIN
  BEGIN
    INSERT INTO booking_service (booking_id, branch_service_id) VALUES (1, 13);         -- BK-0001 is BKK, 13 is HKT
    RAISE EXCEPTION 'FAIL: cross-branch service order was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R4 cross-branch service rejected — %', SQLERRM;
  END;
END $$;

-- R5 · assigning someone without the skill ---------------------------------
DO $$
BEGIN
  BEGIN
    -- order 1 = breakfast (service 1); Chai (3) has no breakfast skill
    INSERT INTO service_assignment (booking_service_id, employee_id) VALUES (1, 3);
    RAISE EXCEPTION 'FAIL: unskilled assignment was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R5 unskilled assignment rejected — %', SQLERRM;
  END;
END $$;

-- R6 · two live assignments on one order line ------------------------------
DO $$
BEGIN
  BEGIN
    -- order 4 already has a live assignment (Ekkachai); Chai is also skilled
    INSERT INTO service_assignment (booking_service_id, employee_id) VALUES (4, 3);
    RAISE EXCEPTION 'FAIL: second live assignment was accepted';
  EXCEPTION WHEN unique_violation THEN
    RAISE NOTICE 'PASS: R6 second live assignment rejected (23505)';
  END;
END $$;

-- R7 · illegal status jump ------------------------------------------------
DO $$
BEGIN
  BEGIN
    UPDATE booking SET booking_status = 'PENDING' WHERE booking_code = 'BK-0005';      -- CHECKED_OUT → PENDING
    RAISE EXCEPTION 'FAIL: CHECKED_OUT → PENDING was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R7 illegal transition rejected — %', SQLERRM;
  END;
END $$;

-- R8 · expired promotion ---------------------------------------------------
DO $$
BEGIN
  BEGIN
    UPDATE booking SET promotion_id = 3 WHERE booking_code = 'BK-0002';
    RAISE EXCEPTION 'FAIL: expired promotion was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R8 inactive promotion rejected — %', SQLERRM;
  END;
END $$;

-- R9 · status change is logged with the acting employee --------------------
DO $$
DECLARE
  v_log booking_status_log%ROWTYPE;
BEGIN
  PERFORM set_config('app.emp_id', '2', true);
  PERFORM set_config('app.status_remark', 'Guest arrived early', true);
  UPDATE booking SET booking_status = 'CHECKED_IN' WHERE booking_code = 'BK-0002';

  SELECT * INTO v_log FROM booking_status_log
  WHERE booking_id = (SELECT booking_id FROM booking WHERE booking_code = 'BK-0002')
  ORDER BY log_id DESC LIMIT 1;

  IF v_log.from_status = 'CONFIRMED' AND v_log.to_status = 'CHECKED_IN'
     AND v_log.changed_by_emp_id = 2 AND v_log.remark = 'Guest arrived early' THEN
    RAISE NOTICE 'PASS: R9 status log written with actor and remark';
  ELSE
    RAISE EXCEPTION 'FAIL: unexpected status log row %', row_to_json(v_log);
  END IF;
END $$;

-- R10 · reviewing a stay that is not finished -------------------------------
DO $$
BEGIN
  BEGIN
    INSERT INTO review (booking_id, room_rating, service_rating, staff_rating)
    VALUES ((SELECT booking_id FROM booking WHERE booking_code = 'BK-0001'), 5, 5, 5);
    RAISE EXCEPTION 'FAIL: review of an in-house booking was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R10 review before check-out rejected — %', SQLERRM;
  END;
END $$;

-- Totals · seeded BK-0001: 3 nights × 1,800 + breakfast 2 × 350 + massage 900
--          gross 7,000 → EARLYBIRD 10% = 700 → grand 6,300
DO $$
DECLARE
  b booking%ROWTYPE;
BEGIN
  SELECT * INTO b FROM booking WHERE booking_code = 'BK-0001';
  IF b.room_total = 5400 AND b.service_total = 1600 AND b.discount_amount = 700 AND b.grand_total = 6300 THEN
    RAISE NOTICE 'PASS: totals for BK-0001 = 5400 + 1600 − 700 = 6300';
  ELSE
    RAISE EXCEPTION 'FAIL: BK-0001 totals room=% service=% discount=% grand=%',
      b.room_total, b.service_total, b.discount_amount, b.grand_total;
  END IF;
END $$;

-- Totals · adding a service line updates the header immediately -------------
DO $$
DECLARE
  v_before numeric;
  v_after  numeric;
BEGIN
  SELECT grand_total INTO v_before FROM booking WHERE booking_code = 'BK-0002';  -- 2 nights × 1,200, no promo
  INSERT INTO booking_service (booking_id, branch_service_id, quantity)
  VALUES ((SELECT booking_id FROM booking WHERE booking_code = 'BK-0002'), 2, 2);   -- in-room dining 2 × 450
  SELECT grand_total INTO v_after FROM booking WHERE booking_code = 'BK-0002';

  IF v_before = 2400 AND v_after = 3300 THEN
    RAISE NOTICE 'PASS: service line rolled up (2400 → 3300)';
  ELSE
    RAISE EXCEPTION 'FAIL: rollup before=% after=%', v_before, v_after;
  END IF;
END $$;

-- Totals · cancelling a service line removes it from service_total ---------
DO $$
DECLARE
  v_total numeric;
BEGIN
  UPDATE booking_service SET order_status = 'CANCELLED' WHERE booking_service_id = 2;   -- BK-0001 massage 900
  SELECT service_total INTO v_total FROM booking WHERE booking_code = 'BK-0001';
  IF v_total = 700 THEN
    RAISE NOTICE 'PASS: cancelled order excluded from service_total (1600 → 700)';
  ELSE
    RAISE EXCEPTION 'FAIL: service_total after cancel = %', v_total;
  END IF;
END $$;

-- Totals · changing dates recomputes nights and subtotal --------------------
DO $$
DECLARE
  br booking_room%ROWTYPE;
BEGIN
  UPDATE booking SET check_out_date = check_out_date + 2 WHERE booking_code = 'BK-0004';   -- 3 → 5 nights
  SELECT * INTO br FROM booking_room
  WHERE booking_id = (SELECT booking_id FROM booking WHERE booking_code = 'BK-0004');
  IF br.night_count = 5 AND br.subtotal = 5000 THEN
    RAISE NOTICE 'PASS: date change recomputed nights (5) and subtotal (5000)';
  ELSE
    RAISE EXCEPTION 'FAIL: nights=% subtotal=%', br.night_count, br.subtotal;
  END IF;
END $$;
