-- =====================================================================
-- Business-rule tests (run by `npm run db:test` inside BEGIN … ROLLBACK)
-- Depends on the demo seed (110_demo.sql).
--
-- Dates are anchored on the seeded bookings (not current_date), so the tests
-- still pass on a later day than the one the seed was loaded.
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
-- Room 4 (BKK 201) is held by BK-0001 for [in, out). Start one day before its check-out.
DO $$
DECLARE
  v_booking integer;
  v_out     date := (SELECT check_out_date FROM booking WHERE booking_code = 'BK-0001');
BEGIN
  INSERT INTO booking (booking_code, customer_id, branch_id, check_in_date, check_out_date)
  VALUES ('BK-T001', 2, 1, v_out - 1, v_out + 1)
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
  v_out     date := (SELECT check_out_date FROM booking WHERE booking_code = 'BK-0001');
BEGIN
  INSERT INTO booking (booking_code, customer_id, branch_id, check_in_date, check_out_date)
  VALUES ('BK-T002', 2, 1, v_out, v_out + 2)
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
-- BK-0002 holds room 1 for [in, in+2). BK-T005 ends exactly at its check-in, then extends into it.
DO $$
DECLARE
  v_booking integer;
  v_in      date := (SELECT check_in_date FROM booking WHERE booking_code = 'BK-0002');
BEGIN
  INSERT INTO booking (booking_code, customer_id, branch_id, check_in_date, check_out_date)
  VALUES ('BK-T005', 2, 1, v_in - 3, v_in)
  RETURNING booking_id INTO v_booking;
  INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES (v_booking, 1, 1);

  BEGIN
    UPDATE booking SET check_out_date = v_in + 1 WHERE booking_id = v_booking;
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

-- Totals · seeded BK-0001 (Kanya, Gold 10%): 3 nights × 1,800 + breakfast 2 × 350 + massage 900
--          gross 7,000 → EARLYBIRD 10% = 700 → 6,300 → member 10% = 630 → grand 5,670
--          (promotion first, then the member rate on what is left — ADR-006)
DO $$
DECLARE
  b booking%ROWTYPE;
BEGIN
  SELECT * INTO b FROM booking WHERE booking_code = 'BK-0001';
  IF b.room_total = 5400 AND b.service_total = 1600 AND b.member_discount_rate = 10
     AND b.discount_amount = 1330 AND b.grand_total = 5670 THEN
    RAISE NOTICE 'PASS: totals for BK-0001 = 7000 − 700 promo − 630 member = 5670';
  ELSE
    RAISE EXCEPTION 'FAIL: BK-0001 totals room=% service=% rate=% discount=% grand=%',
      b.room_total, b.service_total, b.member_discount_rate, b.discount_amount, b.grand_total;
  END IF;
END $$;

-- Totals · seeded BK-0003 (Mei, Platinum 15%) stacks a FIXED promotion the same way
--          13,500 rooms + 3,800 services = 17,300 → WELCOME500 = 500 → 16,800 → 15% = 2,520 → 14,280
DO $$
DECLARE
  b booking%ROWTYPE;
BEGIN
  SELECT * INTO b FROM booking WHERE booking_code = 'BK-0003';
  IF b.discount_amount = 3020 AND b.grand_total = 14280 THEN
    RAISE NOTICE 'PASS: totals for BK-0003 = 17300 − 500 promo − 2520 member = 14280';
  ELSE
    RAISE EXCEPTION 'FAIL: BK-0003 totals rate=% discount=% grand=%',
      b.member_discount_rate, b.discount_amount, b.grand_total;
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

-- R11 · a room cannot hold more guest rows than its room type's capacity -----
-- BK-0002 holds room 101 (Standard, capacity 2) and has no guests recorded yet.
DO $$
DECLARE
  v_room_line integer := (
    SELECT br.booking_room_id FROM booking_room br
    JOIN booking b ON b.booking_id = br.booking_id
    WHERE b.booking_code = 'BK-0002'
  );
BEGIN
  INSERT INTO guest (booking_room_id, full_name, is_primary)
  VALUES (v_room_line, 'Guest One', true), (v_room_line, 'Guest Two', false);

  BEGIN
    INSERT INTO guest (booking_room_id, full_name) VALUES (v_room_line, 'Guest Three');
    RAISE EXCEPTION 'FAIL: a third guest in a 2-person room was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R11 guest over room capacity rejected — %', SQLERRM;
  END;
END $$;

-- R11 · booking.guest_count must fit the total capacity of its rooms --------
-- Checked by a DEFERRED constraint trigger at COMMIT; SET CONSTRAINTS … IMMEDIATE
-- forces the check now so the test can catch it.
DO $$
BEGIN
  BEGIN
    UPDATE booking SET guest_count = 3 WHERE booking_code = 'BK-0002';          -- one Standard room (2)
    SET CONSTRAINTS trg_booking_95_check_capacity IMMEDIATE;
    RAISE EXCEPTION 'FAIL: 3 guests in one 2-person room was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R11 guest_count over total capacity rejected — %', SQLERRM;
  END;
  SET CONSTRAINTS trg_booking_95_check_capacity DEFERRED;
END $$;

-- R11 · deferral lets a 4-guest booking be built one room at a time (2 + 2) --
DO $$
DECLARE
  v_booking integer;
  v_in      date := (SELECT check_out_date FROM booking WHERE booking_code = 'BK-0001') + 30;
BEGIN
  INSERT INTO booking (booking_code, customer_id, branch_id, check_in_date, check_out_date, guest_count)
  VALUES ('BK-T006', 2, 1, v_in, v_in + 2, 4)
  RETURNING booking_id INTO v_booking;
  INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES (v_booking, 1, 1);  -- Standard, 2
  INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES (v_booking, 2, 1);  -- Standard, 2
  SET CONSTRAINTS trg_booking_95_check_capacity, trg_booking_room_95_check_capacity IMMEDIATE;
  SET CONSTRAINTS trg_booking_95_check_capacity, trg_booking_room_95_check_capacity DEFERRED;
  RAISE NOTICE 'PASS: R11 4 guests across two 2-person rooms accepted at commit';
END $$;

-- R11 · every room needs its primary guest: guest_count ≥ number of rooms --
-- Reuses BK-T006 (two rooms) from the test above.
DO $$
BEGIN
  BEGIN
    UPDATE booking SET guest_count = 1 WHERE booking_code = 'BK-T006';
    SET CONSTRAINTS trg_booking_95_check_capacity IMMEDIATE;
    RAISE EXCEPTION 'FAIL: 1 guest across two rooms was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R11 fewer guests than rooms rejected — %', SQLERRM;
  END;
  SET CONSTRAINTS trg_booking_95_check_capacity DEFERRED;
END $$;

-- R12 · rate min_nights itself must be at least 1 night -------------------
DO $$
BEGIN
  BEGIN
    INSERT INTO room_rate (branch_id, room_type_id, rate_name, start_date, end_date, price_per_night, min_nights, rate_status)
    VALUES (1, 1, 'Zero-night rate', current_date, current_date + 5, 999, 0, 'INACTIVE');
    RAISE EXCEPTION 'FAIL: min_nights 0 was accepted';
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'PASS: R12 min_nights below 1 rejected (23514)';
  END;
END $$;

-- R12 · a stay shorter than the rate's min_nights is rejected ---------------
-- Rate 4 (BKK Suite rack rate) requires 2 nights; room 7 is the BKK Suite.
DO $$
DECLARE
  v_booking integer;
  v_in      date := (SELECT check_out_date FROM booking WHERE booking_code = 'BK-0001') + 40;
BEGIN
  INSERT INTO booking (booking_code, customer_id, branch_id, check_in_date, check_out_date)
  VALUES ('BK-T007', 2, 1, v_in, v_in + 1)
  RETURNING booking_id INTO v_booking;

  BEGIN
    INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES (v_booking, 7, 4);
    RAISE EXCEPTION 'FAIL: 1 night on a 2-night minimum rate was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R12 stay below min_nights rejected — %', SQLERRM;
  END;

  -- 2 nights is fine …
  UPDATE booking SET check_out_date = v_in + 2 WHERE booking_id = v_booking;
  INSERT INTO booking_room (booking_id, room_id, rate_id) VALUES (v_booking, 7, 4);

  -- … but shortening it back to 1 night afterwards is caught too
  BEGIN
    UPDATE booking SET check_out_date = v_in + 1 WHERE booking_id = v_booking;
    RAISE EXCEPTION 'FAIL: shortening below min_nights was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R12 shortening below min_nights rejected — %', SQLERRM;
  END;
END $$;

-- Booking code · omitted code comes from booking_code_seq, after the seeded BK-0007
DO $$
DECLARE
  v_code booking.booking_code%TYPE;
BEGIN
  INSERT INTO booking (customer_id, branch_id, check_in_date, check_out_date)
  VALUES (2, 1, current_date + 90, current_date + 91)
  RETURNING booking_code INTO v_code;
  IF v_code ~ '^BK-\d{4,}$' AND substring(v_code FROM 4)::int > 7 THEN
    RAISE NOTICE 'PASS: generated booking code % follows the seeded codes', v_code;
  ELSE
    RAISE EXCEPTION 'FAIL: unexpected generated booking code %', v_code;
  END IF;
END $$;

-- R13 · a customer's tier is derived from member_point (the tier_id sent is ignored)
DO $$
DECLARE
  v_tier member_tier.tier_name%TYPE;
BEGIN
  INSERT INTO customer (tier_id, first_name, last_name, email, member_point)
  VALUES (4, 'Tier', 'Test', 'tier.test@example.com', 0);                      -- asks for Platinum
  SELECT mt.tier_name INTO v_tier
  FROM customer c JOIN member_tier mt ON mt.tier_id = c.tier_id
  WHERE c.email = 'tier.test@example.com';
  IF v_tier = 'Basic' THEN
    RAISE NOTICE 'PASS: R13 new customer with 0 points is Basic, not the tier sent';
  ELSE
    RAISE EXCEPTION 'FAIL: new 0-point customer got tier %', v_tier;
  END IF;
END $$;

-- R13 · earning and losing points moves the tier up and down; a manual tier does not stick
DO $$
DECLARE
  v_up     member_tier.tier_name%TYPE;
  v_down   member_tier.tier_name%TYPE;
  v_manual member_tier.tier_name%TYPE;
BEGIN
  UPDATE customer SET member_point = 5200 WHERE email = 'tier.test@example.com';
  SELECT mt.tier_name INTO v_up FROM customer c JOIN member_tier mt ON mt.tier_id = c.tier_id
  WHERE c.email = 'tier.test@example.com';

  UPDATE customer SET member_point = 1200 WHERE email = 'tier.test@example.com';
  SELECT mt.tier_name INTO v_down FROM customer c JOIN member_tier mt ON mt.tier_id = c.tier_id
  WHERE c.email = 'tier.test@example.com';

  UPDATE customer SET tier_id = 4 WHERE email = 'tier.test@example.com';       -- try to force Platinum
  SELECT mt.tier_name INTO v_manual FROM customer c JOIN member_tier mt ON mt.tier_id = c.tier_id
  WHERE c.email = 'tier.test@example.com';

  IF v_up = 'Gold' AND v_down = 'Silver' AND v_manual = 'Silver' THEN
    RAISE NOTICE 'PASS: R13 5200 pts → Gold, 1200 pts → Silver, forced Platinum stays Silver';
  ELSE
    RAISE EXCEPTION 'FAIL: tiers up=% down=% manual=%', v_up, v_down, v_manual;
  END IF;
END $$;

-- R13 · changing a tier threshold re-derives every customer (statement trigger on member_tier)
-- Laura has 1,312 points (1,200 + 112 from her BK-0005 stay, R14) and Somchai 1,800. Raising Silver to 1,500 drops only Laura.
DO $$
DECLARE
  v_laura   member_tier.tier_name%TYPE;
  v_somchai member_tier.tier_name%TYPE;
BEGIN
  UPDATE member_tier SET min_point = 1500 WHERE tier_name = 'Silver';
  SELECT mt.tier_name INTO v_laura FROM customer c JOIN member_tier mt ON mt.tier_id = c.tier_id
  WHERE c.email = 'laura.schmidt@example.com';
  SELECT mt.tier_name INTO v_somchai FROM customer c JOIN member_tier mt ON mt.tier_id = c.tier_id
  WHERE c.email = 'somchai@example.com';
  IF v_laura = 'Basic' AND v_somchai = 'Silver' THEN
    RAISE NOTICE 'PASS: R13 raising Silver to 1500 moved Laura (<1500) to Basic, Somchai (1800) stays Silver';
  ELSE
    RAISE EXCEPTION 'FAIL: after threshold change Laura=% Somchai=%', v_laura, v_somchai;
  END IF;
END $$;

-- R13 · the ladder must start at 0 points, otherwise a customer would have no tier
DO $$
BEGIN
  BEGIN
    UPDATE member_tier SET min_point = 100 WHERE tier_name = 'Basic';
    RAISE EXCEPTION 'FAIL: a tier ladder that leaves 0-point customers without a tier was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R13 ladder without a 0-point tier rejected — %', SQLERRM;
  END;
END $$;

-- Totals · the member rate is a snapshot: a later tier change does not reprice the booking
DO $$
DECLARE
  v_before booking%ROWTYPE;
  v_after  booking%ROWTYPE;
BEGIN
  SELECT * INTO v_before FROM booking WHERE booking_code = 'BK-0001';
  UPDATE customer SET member_point = 0 WHERE customer_id = 1;                      -- Kanya: Gold → Basic
  UPDATE booking SET booking_channel = booking_channel WHERE booking_code = 'BK-0001';  -- forces a recompute
  UPDATE booking SET member_discount_rate = 50 WHERE booking_code = 'BK-0001';     -- the app cannot overwrite it
  SELECT * INTO v_after FROM booking WHERE booking_code = 'BK-0001';
  IF v_after.member_discount_rate = 10 AND v_after.grand_total = v_before.grand_total THEN
    RAISE NOTICE 'PASS: BK-0001 keeps its 10%% member rate and total after Kanya drops to Basic';
  ELSE
    RAISE EXCEPTION 'FAIL: BK-0001 rate % → %, grand % → %',
      v_before.member_discount_rate, v_after.member_discount_rate, v_before.grand_total, v_after.grand_total;
  END IF;
END $$;

-- Totals · a new booking snapshots the customer's tier rate at the time it is made
DO $$
DECLARE
  v_rate booking.member_discount_rate%TYPE;
BEGIN
  INSERT INTO booking (customer_id, branch_id, check_in_date, check_out_date)
  VALUES (4, 1, current_date + 100, current_date + 101)                            -- Mei: Platinum 15%
  RETURNING member_discount_rate INTO v_rate;
  IF v_rate = 15 THEN
    RAISE NOTICE 'PASS: new booking for a Platinum member snapshots 15%%';
  ELSE
    RAISE EXCEPTION 'FAIL: new booking snapshot rate = %', v_rate;
  END IF;
END $$;

-- R15 · opening a repair on an AVAILABLE room takes it out of use; a later write
--       that would free it (e.g. check-out → CLEANING) keeps it MAINTENANCE;
--       resolving the last repair releases it and stamps done_date
DO $$
DECLARE
  v_id      integer;
  v_open    varchar;
  v_kept    varchar;
  v_after   varchar;
  v_done    timestamptz;
BEGIN
  INSERT INTO maintenance_request (branch_id, room_id, reported_by_emp_id, issue_title)
  VALUES (1, 2, 3, 'Door lock jammed')                                           -- room 102 is AVAILABLE
  RETURNING maintenance_id INTO v_id;
  SELECT room_status INTO v_open FROM room WHERE room_id = 2;

  UPDATE room SET room_status = 'CLEANING' WHERE room_id = 2;
  SELECT room_status INTO v_kept FROM room WHERE room_id = 2;

  UPDATE maintenance_request SET maintenance_status = 'RESOLVED' WHERE maintenance_id = v_id;
  SELECT room_status INTO v_after FROM room WHERE room_id = 2;
  SELECT done_date INTO v_done FROM maintenance_request WHERE maintenance_id = v_id;

  IF v_open = 'MAINTENANCE' AND v_kept = 'MAINTENANCE' AND v_after = 'AVAILABLE' AND v_done IS NOT NULL THEN
    RAISE NOTICE 'PASS: R15 room 102 AVAILABLE → MAINTENANCE (kept) → AVAILABLE when resolved';
  ELSE
    RAISE EXCEPTION 'FAIL: room 102 statuses open=% kept=% after=% done=%', v_open, v_kept, v_after, v_done;
  END IF;
END $$;

-- R15 · a room still waiting for its clean goes back to CLEANING, an occupied room is left alone
DO $$
DECLARE
  v_id      integer;
  v_cleaning varchar;
  v_occupied varchar;
BEGIN
  -- room 103 is CLEANING with an unverified housekeeping task
  INSERT INTO maintenance_request (branch_id, room_id, reported_by_emp_id, issue_title)
  VALUES (1, 3, 3, 'Shower head broken') RETURNING maintenance_id INTO v_id;
  UPDATE maintenance_request SET maintenance_status = 'CANCELLED' WHERE maintenance_id = v_id;
  SELECT room_status INTO v_cleaning FROM room WHERE room_id = 3;

  -- room 201 is OCCUPIED (BK-0001 in house): the guest stays, the room stays OCCUPIED
  INSERT INTO maintenance_request (branch_id, room_id, reported_by_emp_id, issue_title)
  VALUES (1, 4, 3, 'TV not working');
  SELECT room_status INTO v_occupied FROM room WHERE room_id = 4;

  IF v_cleaning = 'CLEANING' AND v_occupied = 'OCCUPIED' THEN
    RAISE NOTICE 'PASS: R15 cancelled repair returns room 103 to CLEANING; occupied room 201 stays OCCUPIED';
  ELSE
    RAISE EXCEPTION 'FAIL: room 103=% room 201=%', v_cleaning, v_occupied;
  END IF;
END $$;

-- R15 · closed requests are final, and the room must be in the request's branch
DO $$
BEGIN
  BEGIN
    UPDATE maintenance_request SET maintenance_status = 'OPEN' WHERE issue_title = 'Shower drain slow';  -- RESOLVED
    RAISE EXCEPTION 'FAIL: RESOLVED → OPEN was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R15 reopening a resolved request rejected — %', SQLERRM;
  END;
  BEGIN
    INSERT INTO maintenance_request (branch_id, room_id, reported_by_emp_id, issue_title)
    VALUES (1, 12, 3, 'Wrong branch room');                                       -- room 12 is HKT
    RAISE EXCEPTION 'FAIL: a BKK request for an HKT room was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R15 room from another branch rejected — %', SQLERRM;
  END;
END $$;

-- R16 · people assigned to branch work must belong to that branch (chain-level staff may help anywhere)
DO $$
DECLARE
  v_rejected integer := 0;
BEGIN
  BEGIN   -- maintenance technician from CNX on a BKK request
    INSERT INTO maintenance_request (branch_id, room_id, reported_by_emp_id, assigned_to_emp_id, issue_title)
    VALUES (1, NULL, 3, 7, 'Lobby door squeaks');
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  BEGIN   -- HKT staff cleaning a BKK room
    INSERT INTO housekeeping_task (room_id, assigned_emp_id, task_type) VALUES (1, 9, 'DEEP_CLEAN');
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  BEGIN   -- HKT therapist (skilled in Thai massage) on a BKK massage order
    INSERT INTO service_assignment (booking_service_id, employee_id) VALUES (2, 9);
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  BEGIN   -- CNX staff on a BKK shift
    INSERT INTO work_schedule (employee_id, shift_id, work_date) VALUES (7, 1, current_date + 1);
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;

  -- the owner (no branch) may still be assigned
  INSERT INTO maintenance_request (branch_id, room_id, reported_by_emp_id, assigned_to_emp_id, issue_title)
  VALUES (1, NULL, 3, 1, 'Owner checks the generator');

  IF v_rejected = 4 THEN
    RAISE NOTICE 'PASS: R16 cross-branch assignee rejected for maintenance, housekeeping, service and shift (owner allowed)';
  ELSE
    RAISE EXCEPTION 'FAIL: only % of 4 cross-branch assignments were rejected', v_rejected;
  END IF;
END $$;

-- R14 · checking out earns floor(grand_total / 100) points, and the tier follows (R13)
-- Somchai (Silver) is given 4,990 points, then BK-0004 (2,850) is walked to CHECKED_OUT: +28 → 5,018 = Gold
DO $$
DECLARE
  v_points integer;
  v_tier   member_tier.tier_name%TYPE;
BEGIN
  UPDATE customer SET member_point = 4990 WHERE customer_id = 3;
  UPDATE booking SET booking_status = 'CONFIRMED'   WHERE booking_code = 'BK-0004';
  UPDATE booking SET booking_status = 'CHECKED_IN'  WHERE booking_code = 'BK-0004';
  UPDATE booking SET booking_status = 'CHECKED_OUT' WHERE booking_code = 'BK-0004';
  SELECT c.member_point, mt.tier_name INTO v_points, v_tier
  FROM customer c JOIN member_tier mt ON mt.tier_id = c.tier_id WHERE c.customer_id = 3;
  IF v_points = 4990 + (SELECT floor(grand_total / 100) FROM booking WHERE booking_code = 'BK-0004') AND v_tier = 'Gold' THEN
    RAISE NOTICE 'PASS: R14 check-out earned % points and lifted Somchai to Gold', v_points - 4990;
  ELSE
    RAISE EXCEPTION 'FAIL: after check-out points=% tier=%', v_points, v_tier;
  END IF;
END $$;

-- R17 · a payment cannot exceed the outstanding balance; paying it exactly is fine
DO $$
DECLARE
  v_id      integer := (SELECT booking_id FROM booking WHERE booking_code = 'BK-0001');
  v_balance numeric := (SELECT grand_total FROM booking WHERE booking_code = 'BK-0001')
                     - (SELECT COALESCE(sum(amount), 0) FROM payment
                        WHERE booking_id = (SELECT booking_id FROM booking WHERE booking_code = 'BK-0001')
                          AND payment_status = 'PAID' AND payment_type <> 'REFUND');
BEGIN
  BEGIN
    INSERT INTO payment (booking_id, amount, payment_type, payment_method, payment_status)
    VALUES (v_id, v_balance + 1, 'BALANCE', 'CASH', 'PAID');
    RAISE EXCEPTION 'FAIL: overpayment was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R17 overpayment rejected — %', SQLERRM;
  END;
  INSERT INTO payment (booking_id, amount, payment_type, payment_method, payment_status)
  VALUES (v_id, v_balance, 'BALANCE', 'CASH', 'PAID');
  RAISE NOTICE 'PASS: R17 paying the exact balance accepted';
END $$;

-- R17 · a refund cannot exceed what was paid; a pending payment is checked when it is confirmed
DO $$
DECLARE
  v_rejected integer := 0;
BEGIN
  BEGIN   -- BK-0006 had 500 paid and 500 refunded already: nothing left to refund
    INSERT INTO payment (booking_id, amount, payment_type, payment_method, payment_status)
    VALUES ((SELECT booking_id FROM booking WHERE booking_code = 'BK-0006'), 1, 'REFUND', 'QR', 'REFUNDED');
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  BEGIN   -- confirming BK-0002's pending 600 deposit after raising it above the grand total
    UPDATE payment SET amount = 99999 WHERE booking_id = (SELECT booking_id FROM booking WHERE booking_code = 'BK-0002')
      AND payment_status = 'PENDING';
    UPDATE payment SET payment_status = 'PAID' WHERE booking_id = (SELECT booking_id FROM booking WHERE booking_code = 'BK-0002')
      AND payment_status = 'PENDING';
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  BEGIN   -- a failed payment is final
    UPDATE payment SET payment_status = 'FAILED' WHERE booking_id = (SELECT booking_id FROM booking WHERE booking_code = 'BK-0002')
      AND payment_status = 'PENDING';
    UPDATE payment SET payment_status = 'PAID' WHERE booking_id = (SELECT booking_id FROM booking WHERE booking_code = 'BK-0002')
      AND payment_status = 'FAILED';
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  IF v_rejected = 3 THEN
    RAISE NOTICE 'PASS: R17 over-refund, over-confirm and FAILED → PAID rejected';
  ELSE
    RAISE EXCEPTION 'FAIL: only % of 3 payment violations rejected', v_rejected;
  END IF;
END $$;

-- R18 · a promotion already used by bookings keeps its discount terms; other fields can change
DO $$
BEGIN
  BEGIN
    UPDATE promotion SET discount_value = 20 WHERE promotion_code = 'EARLYBIRD';      -- used by BK-0001
    RAISE EXCEPTION 'FAIL: changing a used promotion''s discount was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R18 used promotion discount locked — %', SQLERRM;
  END;
  UPDATE promotion SET promotion_name = 'Early bird 10% (renamed)' WHERE promotion_code = 'EARLYBIRD';
  UPDATE promotion SET discount_value = 20 WHERE promotion_code = 'SONGKRAN15';       -- never used
  RAISE NOTICE 'PASS: R18 renaming a used promotion and re-pricing an unused one accepted';
END $$;

-- R11c · shrinking a room type's capacity cannot strand an active stay; growing it is fine
DO $$
BEGIN
  BEGIN
    UPDATE room_type SET capacity = 1 WHERE type_code = 'DLX';                 -- BK-0001 has 2 guests in DLX room 201
    RAISE EXCEPTION 'FAIL: shrinking Deluxe below an in-house stay was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R11c capacity shrink below an active stay rejected — %', SQLERRM;
  END;
  UPDATE room_type SET capacity = 3 WHERE type_code = 'DLX';
  UPDATE room_type SET capacity = 2 WHERE type_code = 'DLX';
  RAISE NOTICE 'PASS: R11c growing (and restoring) a capacity accepted';
END $$;

-- R3d · a room's type cannot change while it has active bookings (their rates are for the old type)
DO $$
BEGIN
  BEGIN
    UPDATE room SET room_type_id = 1 WHERE room_id = 4;                         -- room 201, BK-0001 in house
    RAISE EXCEPTION 'FAIL: retyping a room with an active booking was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R3d retyping a booked room rejected — %', SQLERRM;
  END;
  UPDATE room SET room_type_id = 3 WHERE room_id = 5;                           -- room 202 has no bookings
  UPDATE room SET room_type_id = 2 WHERE room_id = 5;
  RAISE NOTICE 'PASS: R3d retyping a room without bookings accepted';
END $$;

-- R19 · the assignment follows its order: start → IN_PROGRESS (started_at), complete → COMPLETED (completed_at)
-- order 4 = BK-0003 airport transfer, SCHEDULED, live assignment to Ekkachai
DO $$
DECLARE
  a1 service_assignment%ROWTYPE;
  a2 service_assignment%ROWTYPE;
BEGIN
  UPDATE booking_service SET order_status = 'IN_PROGRESS' WHERE booking_service_id = 4;
  SELECT * INTO a1 FROM service_assignment WHERE booking_service_id = 4 AND assignment_status <> 'REASSIGNED';
  UPDATE booking_service SET order_status = 'COMPLETED' WHERE booking_service_id = 4;
  SELECT * INTO a2 FROM service_assignment WHERE booking_service_id = 4 AND assignment_status <> 'REASSIGNED';
  IF a1.assignment_status = 'IN_PROGRESS' AND a1.started_at IS NOT NULL
     AND a2.assignment_status = 'COMPLETED' AND a2.completed_at IS NOT NULL THEN
    RAISE NOTICE 'PASS: R19 assignment followed the order to IN_PROGRESS and COMPLETED';
  ELSE
    RAISE EXCEPTION 'FAIL: assignment states % / %', a1.assignment_status, a2.assignment_status;
  END IF;
END $$;

-- R19 · order workflow guards
DO $$
DECLARE
  v_massage   integer;
  v_breakfast integer;
  v_rejected  integer := 0;
BEGIN
  -- BK-0003 (in house, BKK) orders a massage (needs a therapist) and a breakfast (does not)
  INSERT INTO booking_service (booking_id, branch_service_id) VALUES (3, 3) RETURNING booking_service_id INTO v_massage;
  INSERT INTO booking_service (booking_id, branch_service_id) VALUES (3, 1) RETURNING booking_service_id INTO v_breakfast;

  BEGIN   -- a massage cannot start before someone is assigned
    UPDATE booking_service SET order_status = 'IN_PROGRESS' WHERE booking_service_id = v_massage;
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  BEGIN   -- SCHEDULED needs a time
    UPDATE booking_service SET order_status = 'SCHEDULED' WHERE booking_service_id = v_massage;
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  -- a breakfast can be served straight away, and then it is final
  UPDATE booking_service SET order_status = 'COMPLETED' WHERE booking_service_id = v_breakfast;
  BEGIN
    UPDATE booking_service SET order_status = 'IN_PROGRESS' WHERE booking_service_id = v_breakfast;
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  BEGIN   -- no orders on a cancelled booking (BK-0006)
    INSERT INTO booking_service (booking_id, branch_service_id) VALUES (6, 2);
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  BEGIN   -- no new live assignment on a closed order (order 3 is COMPLETED; Darin is skilled and in BKK)
    INSERT INTO service_assignment (booking_service_id, employee_id) VALUES (3, 4);
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;

  IF v_rejected = 5 THEN
    RAISE NOTICE 'PASS: R19 start without assignee, schedule without time, reopen, order on cancelled booking, assign closed order — all rejected';
  ELSE
    RAISE EXCEPTION 'FAIL: only % of 5 order violations rejected', v_rejected;
  END IF;
END $$;

-- R20 · someone must always be able to manage roles: an ACTIVE employee in an ACTIVE role holding ROLE_MANAGE
DO $$
DECLARE
  v_rejected  integer := 0;
  v_role_mgmt integer := (SELECT permission_id FROM permission WHERE permission_code = 'ROLE_MANAGE');
BEGIN
  BEGIN   -- take ROLE_MANAGE away from OWNER, the only role that has it
    DELETE FROM role_permission WHERE role_id = 1 AND permission_id = v_role_mgmt;
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  BEGIN   -- deactivate the OWNER role
    UPDATE role SET role_status = 'INACTIVE' WHERE role_id = 1;
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;
  BEGIN   -- the only owner resigns
    UPDATE employee SET employee_status = 'RESIGNED' WHERE employee_id = 1;
  EXCEPTION WHEN raise_exception THEN v_rejected := v_rejected + 1;
  END;

  -- once managers can manage roles too, the owner role may give it up
  INSERT INTO role_permission (role_id, permission_id) VALUES (2, v_role_mgmt);
  DELETE FROM role_permission WHERE role_id = 1 AND permission_id = v_role_mgmt;

  IF v_rejected = 3 THEN
    RAISE NOTICE 'PASS: R20 revoke / deactivate / resign that would leave nobody to manage roles rejected; handing it over accepted';
  ELSE
    RAISE EXCEPTION 'FAIL: only % of 3 lock-outs rejected', v_rejected;
  END IF;
END $$;

-- R2b · an employee's manager works at the same branch (or is chain-level, like the owner)
DO $$
BEGIN
  BEGIN
    UPDATE employee SET manager_id = 6 WHERE employee_id = 3;                  -- BKK staff under the CNX manager
    RAISE EXCEPTION 'FAIL: a manager from another branch was accepted';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM LIKE 'FAIL:%' THEN RAISE; END IF;
    RAISE NOTICE 'PASS: R2b manager from another branch rejected — %', SQLERRM;
  END;
  UPDATE employee SET manager_id = 1 WHERE employee_id = 3;                    -- the owner may manage anyone
  RAISE NOTICE 'PASS: R2b chain-level manager accepted';
END $$;

-- R21 · an employee's shifts may not overlap in time (back-to-back and cancelled shifts are fine)
DO $$
DECLARE
  v_mid      integer;
  v_rejected boolean := false;
BEGIN
  INSERT INTO shift (branch_id, shift_name, start_time, end_time) VALUES (1, 'Mid', '12:00', '20:00')
  RETURNING shift_id INTO v_mid;
  BEGIN   -- Darin already works the Evening shift (15:00–23:00) today
    INSERT INTO work_schedule (employee_id, shift_id, work_date) VALUES (4, v_mid, current_date);
  EXCEPTION WHEN raise_exception THEN v_rejected := true;
  END;
  -- Chai works Morning today (07:00–15:00); last night's Night shift (23:00–07:00) ends exactly as it starts
  INSERT INTO work_schedule (employee_id, shift_id, work_date) VALUES (3, 3, current_date - 1);
  -- once Darin's Evening shift is cancelled, the Mid shift fits
  UPDATE work_schedule SET schedule_status = 'CANCELLED' WHERE schedule_id = 2;
  INSERT INTO work_schedule (employee_id, shift_id, work_date) VALUES (4, v_mid, current_date);
  IF v_rejected THEN
    RAISE NOTICE 'PASS: R21 overlapping shift rejected; overnight back-to-back and replacing a cancelled shift accepted';
  ELSE
    RAISE EXCEPTION 'FAIL: an overlapping shift was accepted';
  END IF;
END $$;

-- R22 · attendance status comes from the clock times (5-minute grace); the shift's status follows
DO $$
DECLARE
  v_late    attendance.attendance_status%TYPE;
  v_done    work_schedule.schedule_status%TYPE;
  v_absent  attendance.attendance_status%TYPE;
  v_absent_schedule work_schedule.schedule_status%TYPE;
BEGIN
  -- Ekkachai, Morning 07:00–15:00 today: in at 07:20 → LATE, then clocks out → shift COMPLETED
  INSERT INTO attendance (schedule_id, clock_in, attendance_status) VALUES (3, current_date + time '07:20', 'ON_TIME');
  UPDATE attendance SET clock_out = current_date + time '15:00' WHERE schedule_id = 3;
  SELECT attendance_status INTO v_late FROM attendance WHERE schedule_id = 3;
  SELECT schedule_status INTO v_done FROM work_schedule WHERE schedule_id = 3;

  -- Itsara (HKT Morning) never clocked in → ABSENT, and so is the shift
  INSERT INTO attendance (schedule_id, attendance_status) VALUES (7, 'ON_TIME');
  SELECT attendance_status INTO v_absent FROM attendance WHERE schedule_id = 7;
  SELECT schedule_status INTO v_absent_schedule FROM work_schedule WHERE schedule_id = 7;

  IF v_late = 'LATE' AND v_done = 'COMPLETED' AND v_absent = 'ABSENT' AND v_absent_schedule = 'ABSENT' THEN
    RAISE NOTICE 'PASS: R22 07:20 → LATE (shift completed at clock-out); no clock-in → ABSENT';
  ELSE
    RAISE EXCEPTION 'FAIL: late=% done=% absent=% schedule=%', v_late, v_done, v_absent, v_absent_schedule;
  END IF;
END $$;

-- R22 · leaving more than 5 minutes early is EARLY_LEAVE (Gade, CNX Morning 07:00–15:00)
DO $$
DECLARE
  v_status attendance.attendance_status%TYPE;
BEGIN
  INSERT INTO attendance (schedule_id, clock_in, clock_out, attendance_status)
  VALUES (8, current_date + time '06:58', current_date + time '13:30', 'ON_TIME')
  RETURNING attendance_status INTO v_status;
  IF v_status = 'EARLY_LEAVE' THEN
    RAISE NOTICE 'PASS: R22 out at 13:30 from a 15:00 shift → EARLY_LEAVE';
  ELSE
    RAISE EXCEPTION 'FAIL: early leave recorded as %', v_status;
  END IF;
END $$;
