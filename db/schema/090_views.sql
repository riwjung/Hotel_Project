-- =====================================================================
-- 090 · Views
-- =====================================================================

-- Today's operational snapshot per branch — feeds /api/dashboard.
-- "Today" = current_date in the DB timezone (Asia/Bangkok, see docker-compose.yml).
CREATE VIEW v_dashboard_branch_today AS
SELECT
  br.branch_id,
  br.branch_code,
  br.branch_name,
  rm.rooms_total,
  rm.rooms_available,
  rm.rooms_occupied,
  rm.rooms_cleaning,
  rm.rooms_maintenance,
  bk.arrivals_today,
  bk.departures_today,
  bk.in_house,
  mt.open_maintenance,
  hk.housekeeping_pending
FROM branch br
CROSS JOIN LATERAL (
  SELECT
    count(*)                                                   AS rooms_total,
    count(*) FILTER (WHERE r.room_status = 'AVAILABLE')        AS rooms_available,
    count(*) FILTER (WHERE r.room_status = 'OCCUPIED')         AS rooms_occupied,
    count(*) FILTER (WHERE r.room_status = 'CLEANING')         AS rooms_cleaning,
    count(*) FILTER (WHERE r.room_status IN ('MAINTENANCE', 'OUT_OF_SERVICE')) AS rooms_maintenance
  FROM room r
  WHERE r.branch_id = br.branch_id
) rm
CROSS JOIN LATERAL (
  SELECT
    count(*) FILTER (WHERE b.check_in_date = current_date
                       AND b.booking_status IN ('PENDING', 'CONFIRMED'))  AS arrivals_today,
    count(*) FILTER (WHERE b.check_out_date = current_date
                       AND b.booking_status = 'CHECKED_IN')               AS departures_today,
    count(*) FILTER (WHERE b.booking_status = 'CHECKED_IN')               AS in_house
  FROM booking b
  WHERE b.branch_id = br.branch_id
) bk
CROSS JOIN LATERAL (
  SELECT count(*) AS open_maintenance
  FROM maintenance_request m
  WHERE m.branch_id = br.branch_id
    AND m.maintenance_status IN ('OPEN', 'IN_PROGRESS')
) mt
CROSS JOIN LATERAL (
  SELECT count(*) AS housekeeping_pending
  FROM housekeeping_task h
  JOIN room r ON r.room_id = h.room_id
  WHERE r.branch_id = br.branch_id
    AND h.task_date = current_date
    AND h.task_status IN ('PENDING', 'IN_PROGRESS')
) hk;

-- Booking header + who/where, for list screens (module D).
CREATE VIEW v_booking_overview AS
SELECT
  b.booking_id,
  b.booking_code,
  b.branch_id,
  br.branch_code,
  b.customer_id,
  c.first_name || ' ' || c.last_name AS customer_name,
  mt.tier_name,
  b.check_in_date,
  b.check_out_date,
  b.check_out_date - b.check_in_date AS nights,
  b.guest_count,
  (SELECT count(*) FROM booking_room x WHERE x.booking_id = b.booking_id) AS room_count,
  b.grand_total,
  COALESCE((
    SELECT sum(CASE WHEN p.payment_type = 'REFUND' THEN -p.amount ELSE p.amount END)
    FROM payment p
    WHERE p.booking_id = b.booking_id AND p.payment_status IN ('PAID', 'REFUNDED')
  ), 0) AS paid_total,
  b.booking_channel,
  b.booking_status
FROM booking b
JOIN branch br     ON br.branch_id = b.branch_id
JOIN customer c    ON c.customer_id = b.customer_id
JOIN member_tier mt ON mt.tier_id = c.tier_id;
