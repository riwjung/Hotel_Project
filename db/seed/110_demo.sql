-- =====================================================================
-- 110 · Demo / transactional data
-- Dates are relative to current_date so the dashboard always has
-- "today" activity after a reset. Every one of the 31 tables gets rows.
--
-- Dev logins (all share the password  Hotel@1234):
--   owner@hotel.local         OWNER   (all branches)
--   manager.bkk@hotel.local   MANAGER (Bangkok)
--   staff.bkk@hotel.local     STAFF   (Bangkok)
-- =====================================================================

-- A · employees ---------------------------------------------------------
INSERT INTO employee (employee_id, branch_id, role_id, manager_id, employee_code, first_name, last_name,
                      phone, email, password_hash, hire_date)
OVERRIDING SYSTEM VALUE VALUES
  (1, NULL, 1, NULL, 'EMP-0001', 'Anan',     'Wattana',     '081-000-0001', 'owner@hotel.local',        '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', current_date - 1500),
  (2, 1,    2, 1,    'EMP-0101', 'Busaba',   'Srisuk',      '081-000-0101', 'manager.bkk@hotel.local',  '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', current_date - 1200),
  (3, 1,    3, 2,    'EMP-0102', 'Chai',     'Meesuk',      '081-000-0102', 'staff.bkk@hotel.local',    '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', current_date - 700),
  (4, 1,    3, 2,    'EMP-0103', 'Darin',    'Thongdee',    '081-000-0103', 'darin.bkk@hotel.local',    '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', current_date - 500),
  (5, 1,    3, 2,    'EMP-0104', 'Ekkachai', 'Boonmee',     '081-000-0104', 'ekkachai.bkk@hotel.local', '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', current_date - 300),
  (6, 2,    2, 1,    'EMP-0201', 'Fon',      'Kaewmala',    '081-000-0201', 'manager.cnx@hotel.local',  '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', current_date - 1100),
  (7, 2,    3, 6,    'EMP-0202', 'Gade',     'Inthawong',   '081-000-0202', 'staff.cnx@hotel.local',    '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', current_date - 400),
  (8, 3,    2, 1,    'EMP-0301', 'Hathai',   'Rattanaporn', '081-000-0301', 'manager.hkt@hotel.local',  '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', current_date - 900),
  (9, 3,    3, 8,    'EMP-0302', 'Itsara',   'Chaiyasit',   '081-000-0302', 'staff.hkt@hotel.local',    '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', current_date - 200);

-- B · schedules & attendance -------------------------------------------
INSERT INTO work_schedule (schedule_id, employee_id, shift_id, work_date, schedule_status) OVERRIDING SYSTEM VALUE VALUES
  (1, 3, 1, current_date,     'SCHEDULED'),
  (2, 4, 2, current_date,     'SCHEDULED'),
  (3, 5, 1, current_date,     'SCHEDULED'),
  (4, 3, 1, current_date - 1, 'COMPLETED'),
  (5, 4, 2, current_date - 1, 'COMPLETED'),
  (6, 5, 1, current_date - 1, 'ABSENT'),
  (7, 9, 7, current_date,     'SCHEDULED'),
  (8, 7, 4, current_date,     'SCHEDULED');

INSERT INTO attendance (schedule_id, clock_in, clock_out, attendance_status, remark) VALUES
  (4, current_date - 1 + time '06:55', current_date - 1 + time '15:05', 'ON_TIME', NULL),
  (5, current_date - 1 + time '15:20', current_date - 1 + time '23:00', 'LATE',    'Traffic'),
  (6, NULL,                            NULL,                            'ABSENT',  'Sick leave, no notice'),
  (1, current_date + time '06:58',     NULL,                            'ON_TIME', NULL);

-- C · rooms, images, rates ---------------------------------------------
INSERT INTO room (room_id, branch_id, room_type_id, room_number, room_name, floor, location_zone, room_status) OVERRIDING SYSTEM VALUE VALUES
  ( 1, 1, 1, '101', NULL,                1, 'Garden wing', 'AVAILABLE'),
  ( 2, 1, 1, '102', NULL,                1, 'Garden wing', 'AVAILABLE'),
  ( 3, 1, 1, '103', NULL,                1, 'Garden wing', 'CLEANING'),
  ( 4, 1, 2, '201', NULL,                2, 'River wing',  'OCCUPIED'),
  ( 5, 1, 2, '202', NULL,                2, 'River wing',  'AVAILABLE'),
  ( 6, 1, 3, '203', NULL,                2, 'River wing',  'MAINTENANCE'),
  ( 7, 1, 4, '301', 'Chao Phraya Suite', 3, 'River wing',  'OCCUPIED'),
  ( 8, 2, 1, '101', NULL,                1, 'Courtyard',   'AVAILABLE'),
  ( 9, 2, 1, '102', NULL,                1, 'Courtyard',   'AVAILABLE'),
  (10, 2, 2, '201', NULL,                2, 'Courtyard',   'AVAILABLE'),
  (11, 2, 3, '202', NULL,                2, 'Courtyard',   'AVAILABLE'),
  (12, 3, 2, '101', NULL,                1, 'Pool side',   'AVAILABLE'),
  (13, 3, 2, '102', NULL,                1, 'Pool side',   'AVAILABLE'),
  (14, 3, 3, '103', NULL,                1, 'Pool side',   'AVAILABLE'),
  (15, 3, 4, '201', 'Andaman Suite',     2, 'Sea view',    'AVAILABLE');

INSERT INTO room_image (room_id, image_url, image_caption, is_cover, sort_order) VALUES
  ( 7, '/images/rooms/bkk-301-cover.svg',    'Living room with river view', true,  1),
  ( 7, '/images/rooms/bkk-301-bath.svg',     'Bathroom with bathtub',       false, 2),
  (15, '/images/rooms/hkt-201-cover.svg',    'Sea view balcony',            true,  1);

INSERT INTO room_rate (rate_id, branch_id, room_type_id, rate_name, start_date, end_date, price_per_night, min_nights)
OVERRIDING SYSTEM VALUE VALUES
  ( 1, 1, 1, 'Rack rate', current_date - 180, current_date + 365, 1200, 1),
  ( 2, 1, 2, 'Rack rate', current_date - 180, current_date + 365, 1800, 1),
  ( 3, 1, 3, 'Rack rate', current_date - 180, current_date + 365, 2600, 1),
  ( 4, 1, 4, 'Rack rate', current_date - 180, current_date + 365, 4500, 2),
  ( 5, 2, 1, 'Rack rate', current_date - 180, current_date + 365, 1000, 1),
  ( 6, 2, 2, 'Rack rate', current_date - 180, current_date + 365, 1500, 1),
  ( 7, 2, 3, 'Rack rate', current_date - 180, current_date + 365, 2200, 1),
  ( 8, 3, 2, 'Rack rate', current_date - 180, current_date + 365, 2200, 1),
  ( 9, 3, 3, 'Rack rate', current_date - 180, current_date + 365, 3000, 1),
  (10, 3, 4, 'Rack rate', current_date - 180, current_date + 365, 5500, 2);

-- E · branch services & skills -----------------------------------------
INSERT INTO branch_service (branch_service_id, branch_id, service_id, branch_price, is_available, open_time, close_time)
OVERRIDING SYSTEM VALUE VALUES
  ( 1, 1, 1,  350, true,  '06:30', '10:30'),
  ( 2, 1, 2,  450, true,  '06:00', '23:00'),
  ( 3, 1, 3,  900, true,  '10:00', '22:00'),
  ( 4, 1, 4, 1500, true,  '10:00', '22:00'),
  ( 5, 1, 5,  120, true,  NULL,    NULL),
  ( 6, 1, 6,  800, true,  NULL,    NULL),
  ( 7, 1, 7,    0, true,  NULL,    NULL),
  ( 8, 2, 1,  300, true,  '06:30', '10:00'),
  ( 9, 2, 2,  400, true,  '07:00', '22:00'),
  (10, 2, 3,  700, true,  '10:00', '21:00'),
  (11, 2, 5,  100, true,  NULL,    NULL),
  (12, 2, 7,    0, true,  NULL,    NULL),
  (13, 3, 1,  400, true,  '06:30', '10:30'),
  (14, 3, 2,  500, true,  '06:00', '23:30'),
  (15, 3, 3, 1000, true,  '09:00', '22:00'),
  (16, 3, 4, 1700, false, '09:00', '22:00'),
  (17, 3, 6, 1000, true,  NULL,    NULL),
  (18, 3, 7,    0, true,  NULL,    NULL);

INSERT INTO employee_service_skill (employee_id, service_id, skill_level, certified_date) VALUES
  (3, 2, 'JUNIOR', current_date - 600),
  (3, 6, 'JUNIOR', current_date - 600),
  (4, 3, 'SENIOR', current_date - 450),
  (4, 4, 'EXPERT', current_date - 400),
  (5, 5, 'SENIOR', current_date - 250),
  (5, 6, 'SENIOR', current_date - 250),
  (7, 3, 'JUNIOR', current_date - 300),
  (9, 3, 'SENIOR', current_date - 150),
  (9, 6, 'SENIOR', current_date - 150);

-- D · customers & promotions -------------------------------------------
INSERT INTO customer (customer_id, tier_id, first_name, last_name, phone, email, password_hash, address, id_card_no, member_point, created_at)
OVERRIDING SYSTEM VALUE VALUES
  (1, 3, 'Kanya',     'Phromma', '089-111-2222',     'kanya@example.com',         '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', 'Nonthaburi',  '1103700000011', 6200,  now() - interval '900 days'),
  (2, 1, 'John',      'Miller',  '+1-415-555-0101',  'john.miller@example.com',   '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', 'San Francisco, USA', 'P-US-5550101', 0, now() - interval '20 days'),
  (3, 2, 'Somchai',   'Jaidee',  '086-333-4444',     'somchai@example.com',       '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', 'Khon Kaen',   '1400100000022', 1800,  now() - interval '400 days'),
  (4, 4, 'Mei',       'Tanaka',  '+81-90-5555-0102', 'mei.tanaka@example.com',    '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', 'Osaka, Japan', 'P-JP-5550102', 16000, now() - interval '1200 days'),
  (5, 1, 'Nattapong', 'Saelim',  '082-555-6666',     'nattapong@example.com',     NULL,                                                           NULL,          '1100500000033', 0,     now() - interval '3 days'),
  (6, 2, 'Laura',     'Schmidt', '+49-30-5550103',   'laura.schmidt@example.com', '$2b$10$h8Mi6RqLBS7kAtVqxr4tLe/B7jVxDDHEKynrCcsp03sqklzO/F.eq', 'Berlin, Germany', 'P-DE-5550103', 1200, now() - interval '200 days');

INSERT INTO promotion (promotion_id, promotion_code, promotion_name, discount_type, discount_value, minimum_amount,
                       start_date, end_date, usage_limit, promotion_status)
OVERRIDING SYSTEM VALUE VALUES
  (1, 'EARLYBIRD',  'Early bird 10% off',  'PERCENT', 10,  2000, current_date - 30,  current_date + 60,  100, 'ACTIVE'),
  (2, 'WELCOME500', 'Welcome ฿500 off',    'FIXED',   500, 3000, current_date - 30,  current_date + 90,  50,  'ACTIVE'),
  (3, 'SONGKRAN15', 'Songkran 15% off',    'PERCENT', 15,  0,    current_date - 200, current_date - 170, NULL, 'EXPIRED');

-- D · bookings ----------------------------------------------------------
-- All start as PENDING; the status walk below produces a realistic audit log.
INSERT INTO booking (booking_id, booking_code, customer_id, branch_id, promotion_id, created_by_emp_id,
                     booking_date, check_in_date, check_out_date, guest_count, booking_channel)
OVERRIDING SYSTEM VALUE VALUES
  (1, 'BK-0001', 1, 1, 1,    3,    now() - interval '12 days', current_date - 2, current_date + 1, 2, 'WEBSITE'),
  (2, 'BK-0002', 2, 1, NULL, 3,    now() - interval '5 days',  current_date,     current_date + 2, 1, 'PHONE'),
  (3, 'BK-0003', 4, 1, 2,    NULL, now() - interval '20 days', current_date - 3, current_date,     3, 'WEBSITE'),
  (4, 'BK-0004', 3, 2, NULL, NULL, now() - interval '1 day',   current_date + 5, current_date + 8, 2, 'OTA'),
  (5, 'BK-0005', 6, 3, NULL, NULL, now() - interval '30 days', current_date - 7, current_date - 3, 2, 'WEBSITE'),
  (6, 'BK-0006', 5, 1, NULL, 3,    now() - interval '3 days',  current_date + 1, current_date + 3, 1, 'WALK_IN'),
  (7, 'BK-0007', 1, 3, NULL, 9,    now() - interval '2 days',  current_date,     current_date + 4, 4, 'PHONE');

-- price_per_night omitted → trigger snapshots it from room_rate
INSERT INTO booking_room (booking_room_id, booking_id, room_id, rate_id, actual_check_in, actual_check_out, checkin_by_emp_id, key_card_no)
OVERRIDING SYSTEM VALUE VALUES
  (1, 1,  4, 2, current_date - 2 + time '14:30', NULL,                           3, 'KC-2014'),
  (2, 2,  1, 1, NULL,                            NULL,                           NULL, NULL),
  (3, 3,  7, 4, current_date - 3 + time '15:10', NULL,                           3, 'KC-3011'),
  (4, 4,  9, 5, NULL,                            NULL,                           NULL, NULL),
  (5, 5, 12, 8, current_date - 7 + time '15:45', current_date - 3 + time '11:20', 9, 'KC-1012'),
  (6, 6,  2, 1, NULL,                            NULL,                           NULL, NULL),
  (7, 7, 13, 8, NULL,                            NULL,                           NULL, NULL),
  (8, 7, 14, 9, NULL,                            NULL,                           NULL, NULL);

INSERT INTO guest (booking_room_id, full_name, id_card_no, nationality, is_primary) VALUES
  (1, 'Kanya Phromma',   '1103700000011', 'Thai',     true),
  (1, 'Prasert Phromma', '1103700000044', 'Thai',     false),
  (3, 'Mei Tanaka',      'P-JP-5550102',  'Japanese', true),
  (3, 'Ken Tanaka',      'P-JP-5550104',  'Japanese', false),
  (3, 'Yui Tanaka',      'P-JP-5550105',  'Japanese', false),
  (5, 'Laura Schmidt',   'P-DE-5550103',  'German',   true),
  (5, 'Max Schmidt',     'P-DE-5550106',  'German',   false);

-- unit_price omitted → trigger snapshots branch_price
INSERT INTO booking_service (booking_service_id, booking_id, branch_service_id, quantity, requested_at, scheduled_at, order_status, remark)
OVERRIDING SYSTEM VALUE VALUES
  (1, 1,  1, 2, current_date - 1 + time '07:10', NULL,                           'COMPLETED',  NULL),
  (2, 1,  3, 1, current_date + time '09:00',     current_date + time '16:00',    'SCHEDULED',  'Prefers medium pressure'),
  (3, 3,  4, 2, current_date - 2 + time '11:00', current_date - 2 + time '17:00', 'COMPLETED', NULL),
  (4, 3,  6, 1, current_date - 1 + time '20:00', current_date + time '13:00',    'SCHEDULED',  'Flight TG 622, 3 bags'),
  (5, 5, 15, 2, current_date - 6 + time '10:00', current_date - 6 + time '15:00', 'COMPLETED', NULL),
  (6, 5, 17, 1, current_date - 4 + time '18:00', current_date - 3 + time '12:00', 'COMPLETED', NULL);

-- Assignment history: order 4 was reassigned from Chai (3) to Ekkachai (5)
INSERT INTO service_assignment (booking_service_id, employee_id, assigned_by_emp_id, assigned_at, started_at, completed_at,
                                quality_score, assignment_status, note)
VALUES
  (2, 4, 2, current_date + time '09:15',     NULL, NULL, NULL, 'ASSIGNED', NULL),
  (3, 4, 2, current_date - 2 + time '11:05', current_date - 2 + time '17:00', current_date - 2 + time '18:35', 5, 'COMPLETED', NULL),
  (4, 3, 2, current_date - 1 + time '20:10', NULL, NULL, NULL, 'REASSIGNED', 'Front desk shift clash'),
  (4, 5, 2, current_date + time '08:00',     NULL, NULL, NULL, 'ASSIGNED', NULL),
  (5, 9, 8, current_date - 6 + time '10:05', current_date - 6 + time '15:00', current_date - 6 + time '16:05', 4, 'COMPLETED', NULL),
  (6, 9, 8, current_date - 4 + time '18:10', current_date - 3 + time '12:00', current_date - 3 + time '13:10', 5, 'COMPLETED', NULL);

-- Status walk (actor recorded in booking_status_log via app.emp_id) -----
SELECT set_config('app.emp_id', '3', false);
UPDATE booking SET booking_status = 'CONFIRMED' WHERE booking_id IN (1, 2, 3);
UPDATE booking SET booking_status = 'CHECKED_IN' WHERE booking_id IN (1, 3);
SELECT set_config('app.status_remark', 'Guest changed travel plans', false);
UPDATE booking SET booking_status = 'CANCELLED' WHERE booking_id = 6;
SELECT set_config('app.status_remark', '', false);

SELECT set_config('app.emp_id', '9', false);
UPDATE booking SET booking_status = 'CONFIRMED' WHERE booking_id IN (5, 7);
UPDATE booking SET booking_status = 'CHECKED_IN' WHERE booking_id = 5;
UPDATE booking SET booking_status = 'CHECKED_OUT' WHERE booking_id = 5;
SELECT set_config('app.emp_id', '', false);

-- G · payments & reviews -----------------------------------------------
INSERT INTO payment (booking_id, received_by_emp_id, amount, payment_type, payment_method, payment_date, slip_url, transaction_ref, payment_status) VALUES
  (1, NULL, 1000,                                                   'DEPOSIT', 'TRANSFER', now() - interval '12 days', '/slips/bk-0001-deposit.jpg', 'TRF-88120001', 'PAID'),
  (3, NULL, 5000,                                                   'DEPOSIT', 'CARD',     now() - interval '20 days', NULL,                         'CRD-55310003', 'PAID'),
  (5, 9,    (SELECT grand_total FROM booking WHERE booking_id = 5), 'FULL',    'CARD',     current_date - 3 + time '11:15', NULL,                    'CRD-55310005', 'PAID'),
  (6, 3,    500,                                                    'DEPOSIT', 'QR',       now() - interval '3 days',  NULL,                         'QR-77010006',  'PAID'),
  (6, 3,    500,                                                    'REFUND',  'QR',       now() - interval '1 day',   NULL,                         'QR-77010007',  'REFUNDED'),
  (2, NULL, 600,                                                    'DEPOSIT', 'QR',       now() - interval '5 days',  NULL,                         NULL,           'PENDING');

INSERT INTO review (booking_id, reply_by_emp_id, room_rating, service_rating, staff_rating, comment, review_date, review_status) VALUES
  (5, 8, 5, 4, 5, 'Lovely stay by the pool. The Thai massage was excellent and the airport pickup was on time.',
   current_date - 2 + time '19:30', 'PUBLISHED');

-- F · housekeeping & maintenance ---------------------------------------
INSERT INTO housekeeping_task (room_id, assigned_emp_id, verified_by_emp_id, task_type, task_date, started_at, completed_at, task_status, remark) VALUES
  ( 7, 5, NULL, 'CHECKOUT_CLEAN', current_date,     NULL,                            NULL,                            'PENDING',     'Suite departs today'),
  ( 4, 5, 2,    'STAYOVER_CLEAN', current_date,     current_date + time '10:00',     current_date + time '10:40',     'VERIFIED',    NULL),
  ( 3, 4, NULL, 'CHECKOUT_CLEAN', current_date,     current_date + time '11:00',     NULL,                            'IN_PROGRESS', NULL),
  (12, 9, 8,    'CHECKOUT_CLEAN', current_date - 3, current_date - 3 + time '12:00', current_date - 3 + time '12:50', 'VERIFIED',    NULL);

INSERT INTO maintenance_request (branch_id, room_id, reported_by_emp_id, assigned_to_emp_id, issue_title, priority,
                                 report_date, done_date, cost, maintenance_status) VALUES
  (1, 6,    3, 5,    'Air conditioner leaking',    'HIGH',   now() - interval '1 day',  NULL,                       NULL, 'IN_PROGRESS'),
  (1, NULL, 4, NULL, 'Lobby light flickering',     'LOW',    now() - interval '3 hours', NULL,                      NULL, 'OPEN'),
  (2, 10,   7, 7,    'Shower drain slow',          'MEDIUM', now() - interval '4 days', now() - interval '2 days',  350,  'RESOLVED'),
  (3, 15,   9, 9,    'TV remote replacement',      'LOW',    now() - interval '6 days', now() - interval '6 days' + interval '2 hours', 250, 'RESOLVED');
