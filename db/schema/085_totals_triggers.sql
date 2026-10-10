-- =====================================================================
-- 085 · Stored totals maintained by triggers (ADR-003)
--
--   booking_room.night_count  = booking.check_out_date - booking.check_in_date
--   booking_room.subtotal     = price_per_night × night_count
--   booking_service.subtotal  = unit_price × quantity
--   booking.room_total        = Σ booking_room.subtotal
--   booking.service_total     = Σ booking_service.subtotal (excluding CANCELLED orders)
--   booking.discount_amount   = promotion discount (if gross ≥ minimum_amount)
--   booking.grand_total       = room_total + service_total − discount_amount
--
-- Snapshots: price_per_night / unit_price default to the current rate /
-- branch price when the app omits them, and are never changed afterwards.
-- =====================================================================


-- booking_room: snapshot price + derive nights/subtotal ------------------
CREATE FUNCTION fn_booking_room_compute() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_nights integer;
BEGIN
  IF NEW.price_per_night IS NULL THEN
    SELECT price_per_night INTO NEW.price_per_night FROM room_rate WHERE rate_id = NEW.rate_id;
  END IF;

  SELECT check_out_date - check_in_date INTO v_nights FROM booking WHERE booking_id = NEW.booking_id;

  NEW.night_count := v_nights;
  NEW.subtotal    := NEW.price_per_night * v_nights;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_booking_room_20_compute
  BEFORE INSERT OR UPDATE ON booking_room
  FOR EACH ROW EXECUTE FUNCTION fn_booking_room_compute();


-- booking_service: snapshot price + subtotal ------------------------------
CREATE FUNCTION fn_booking_service_compute() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.unit_price IS NULL THEN
    SELECT branch_price INTO NEW.unit_price
    FROM branch_service WHERE branch_service_id = NEW.branch_service_id;
  END IF;

  NEW.subtotal := NEW.unit_price * NEW.quantity;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_booking_service_20_compute
  BEFORE INSERT OR UPDATE ON booking_service
  FOR EACH ROW EXECUTE FUNCTION fn_booking_service_compute();


-- booking: discount + grand total on every write --------------------------
CREATE FUNCTION fn_booking_compute_totals() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE
  v_gross  numeric(12,2);
  v_promo  promotion%ROWTYPE;
BEGIN
  v_gross := NEW.room_total + NEW.service_total;
  NEW.discount_amount := 0;

  IF NEW.promotion_id IS NOT NULL THEN
    SELECT * INTO v_promo FROM promotion WHERE promotion_id = NEW.promotion_id;
    IF v_gross >= v_promo.minimum_amount THEN
      NEW.discount_amount := CASE v_promo.discount_type
        WHEN 'PERCENT' THEN round(v_gross * v_promo.discount_value / 100, 2)
        ELSE least(v_promo.discount_value, v_gross)
      END;
    END IF;
  END IF;

  NEW.grand_total := v_gross - NEW.discount_amount;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_booking_30_compute_totals
  BEFORE INSERT OR UPDATE ON booking
  FOR EACH ROW EXECUTE FUNCTION fn_booking_compute_totals();


-- roll line items up into the booking header ------------------------------
CREATE FUNCTION fn_recalc_booking(p_booking_id integer) RETURNS void
LANGUAGE sql AS $$
  UPDATE booking b SET
    room_total = COALESCE((
      SELECT sum(subtotal) FROM booking_room WHERE booking_id = p_booking_id
    ), 0),
    service_total = COALESCE((
      SELECT sum(subtotal) FROM booking_service
      WHERE booking_id = p_booking_id AND order_status <> 'CANCELLED'
    ), 0)
  WHERE b.booking_id = p_booking_id;
$$;

CREATE FUNCTION fn_line_item_rollup() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM fn_recalc_booking(NEW.booking_id);
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM fn_recalc_booking(OLD.booking_id);
  ELSE
    PERFORM fn_recalc_booking(NEW.booking_id);
    IF NEW.booking_id <> OLD.booking_id THEN      -- line moved to another booking
      PERFORM fn_recalc_booking(OLD.booking_id);
    END IF;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_booking_room_80_rollup
  AFTER INSERT OR UPDATE OR DELETE ON booking_room
  FOR EACH ROW EXECUTE FUNCTION fn_line_item_rollup();

CREATE TRIGGER trg_booking_service_80_rollup
  AFTER INSERT OR UPDATE OR DELETE ON booking_service
  FOR EACH ROW EXECUTE FUNCTION fn_line_item_rollup();


-- booking dates / branch changed → re-run line-item triggers --------------
-- Touching the rows re-fires R3/R4 validation (overlap, branch match) and
-- recomputes night_count/subtotal, which then rolls up via the AFTER trigger.
CREATE FUNCTION fn_booking_touch_lines() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  UPDATE booking_room SET booking_id = booking_id WHERE booking_id = NEW.booking_id;
  IF NEW.branch_id <> OLD.branch_id THEN
    UPDATE booking_service SET booking_id = booking_id WHERE booking_id = NEW.booking_id;
  END IF;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_booking_70_touch_lines
  AFTER UPDATE OF check_in_date, check_out_date, branch_id ON booking
  FOR EACH ROW EXECUTE FUNCTION fn_booking_touch_lines();
