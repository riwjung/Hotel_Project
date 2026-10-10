-- =====================================================================
-- 100 · Master data
-- Explicit ids (OVERRIDING SYSTEM VALUE) keep seeds readable and stable;
-- 190_sync_identity.sql moves every identity sequence past the max id.
-- =====================================================================

-- A · roles & permissions ---------------------------------------------
INSERT INTO role (role_id, role_code, role_name, scope_level) OVERRIDING SYSTEM VALUE VALUES
  (1, 'OWNER',   'Owner',          'CHAIN'),
  (2, 'MANAGER', 'Branch Manager', 'BRANCH'),
  (3, 'STAFF',   'Staff',          'BRANCH');

INSERT INTO permission (permission_id, permission_code, module_name, description) OVERRIDING SYSTEM VALUE VALUES
  ( 1, 'DASHBOARD_VIEW',       'Dashboard',    'View the operations dashboard'),
  ( 2, 'BRANCH_VIEW',          'Organization', 'View branches'),
  ( 3, 'BRANCH_MANAGE',        'Organization', 'Create, edit and delete branches'),
  ( 4, 'EMPLOYEE_VIEW',        'Organization', 'View employees'),
  ( 5, 'EMPLOYEE_MANAGE',      'Organization', 'Create and edit employees'),
  ( 6, 'ROLE_MANAGE',          'Organization', 'Manage roles and permissions'),
  ( 7, 'SCHEDULE_VIEW',        'Workforce',    'View shifts and work schedules'),
  ( 8, 'SCHEDULE_MANAGE',      'Workforce',    'Manage shifts and work schedules'),
  ( 9, 'ATTENDANCE_VIEW',      'Workforce',    'View attendance'),
  (10, 'ATTENDANCE_MANAGE',    'Workforce',    'Correct attendance records'),
  (11, 'ROOM_VIEW',            'Rooms',        'View rooms, room types and amenities'),
  (12, 'ROOM_MANAGE',          'Rooms',        'Manage rooms, room types and amenities'),
  (13, 'RATE_MANAGE',          'Rooms',        'Manage room rates'),
  (14, 'BOOKING_VIEW',         'Reservations', 'View bookings'),
  (15, 'BOOKING_MANAGE',       'Reservations', 'Create bookings, check guests in and out'),
  (16, 'CUSTOMER_VIEW',        'Reservations', 'View customers'),
  (17, 'CUSTOMER_MANAGE',      'Reservations', 'Create and edit customers'),
  (18, 'SERVICE_VIEW',         'Services',     'View the service catalog'),
  (19, 'SERVICE_MANAGE',       'Services',     'Manage the service catalog and branch services'),
  (20, 'SERVICE_ORDER_MANAGE', 'Services',     'Take and update service orders'),
  (21, 'ASSIGNMENT_MANAGE',    'Services',     'Assign staff to service orders and manage skills'),
  (22, 'HOUSEKEEPING_VIEW',    'Operations',   'View housekeeping tasks'),
  (23, 'HOUSEKEEPING_MANAGE',  'Operations',   'Create and update housekeeping tasks'),
  (24, 'MAINTENANCE_VIEW',     'Operations',   'View maintenance requests'),
  (25, 'MAINTENANCE_MANAGE',   'Operations',   'Report and update maintenance requests'),
  (26, 'PAYMENT_VIEW',         'Finance & CX', 'View payments'),
  (27, 'PAYMENT_MANAGE',       'Finance & CX', 'Record payments and refunds'),
  (28, 'PROMOTION_MANAGE',     'Finance & CX', 'Manage promotions and member tiers'),
  (29, 'REVIEW_VIEW',          'Finance & CX', 'View reviews'),
  (30, 'REVIEW_REPLY',         'Finance & CX', 'Reply to and moderate reviews');

-- OWNER: everything
INSERT INTO role_permission (role_id, permission_id)
SELECT 1, permission_id FROM permission;

-- MANAGER: everything inside their branch, but not chain-level setup
INSERT INTO role_permission (role_id, permission_id)
SELECT 2, permission_id FROM permission
WHERE permission_code NOT IN ('BRANCH_MANAGE', 'ROLE_MANAGE', 'PROMOTION_MANAGE');

-- STAFF: front-line work only
INSERT INTO role_permission (role_id, permission_id)
SELECT 3, permission_id FROM permission
WHERE permission_code IN (
  'DASHBOARD_VIEW', 'SCHEDULE_VIEW', 'ATTENDANCE_VIEW', 'ROOM_VIEW',
  'BOOKING_VIEW', 'BOOKING_MANAGE', 'CUSTOMER_VIEW', 'CUSTOMER_MANAGE',
  'SERVICE_VIEW', 'SERVICE_ORDER_MANAGE',
  'HOUSEKEEPING_VIEW', 'HOUSEKEEPING_MANAGE', 'MAINTENANCE_VIEW', 'MAINTENANCE_MANAGE',
  'PAYMENT_VIEW', 'PAYMENT_MANAGE', 'REVIEW_VIEW'
);

-- A · branches ----------------------------------------------------------
INSERT INTO branch (branch_id, branch_code, branch_name, province, address, phone, check_in_time, check_out_time)
OVERRIDING SYSTEM VALUE VALUES
  (1, 'BKK', 'Riverside Bangkok',   'Bangkok',    '88 Charoen Krung Rd, Bang Rak, Bangkok 10500', '02-123-4567',  '14:00', '12:00'),
  (2, 'CNX', 'Old City Chiang Mai', 'Chiang Mai', '12 Ratchadamnoen Rd, Si Phum, Chiang Mai 50200', '053-234-567', '14:00', '11:00'),
  (3, 'HKT', 'Kata Beach Phuket',   'Phuket',     '5 Kata Rd, Karon, Phuket 83100',               '076-345-678', '15:00', '12:00');

-- B · shifts (3 per branch) ---------------------------------------------
INSERT INTO shift (shift_id, branch_id, shift_name, start_time, end_time, is_overnight) OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'Morning', '07:00', '15:00', false),
  (2, 1, 'Evening', '15:00', '23:00', false),
  (3, 1, 'Night',   '23:00', '07:00', true),
  (4, 2, 'Morning', '07:00', '15:00', false),
  (5, 2, 'Evening', '15:00', '23:00', false),
  (6, 2, 'Night',   '23:00', '07:00', true),
  (7, 3, 'Morning', '07:00', '15:00', false),
  (8, 3, 'Evening', '15:00', '23:00', false),
  (9, 3, 'Night',   '23:00', '07:00', true);

-- C · room types & amenities --------------------------------------------
INSERT INTO room_type (room_type_id, type_code, type_name, description, capacity, bed_type, base_price) OVERRIDING SYSTEM VALUE VALUES
  (1, 'STD', 'Standard', 'Cosy room for one or two guests',            2, 'Queen',            1200),
  (2, 'DLX', 'Deluxe',   'Larger room with a sitting area',            2, 'King',             1800),
  (3, 'FAM', 'Family',   'Two queen beds for families up to four',     4, '2 Queens',         2600),
  (4, 'STE', 'Suite',    'Separate living room with a city/sea view',  3, 'King + Sofa bed',  4500);

INSERT INTO amenity (amenity_id, amenity_name, amenity_group, icon) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Wi-Fi',            'Connectivity',  'WifiOutlined'),
  (2, 'Air conditioning', 'Comfort',       'CloudOutlined'),
  (3, 'Smart TV',         'Entertainment', 'DesktopOutlined'),
  (4, 'Mini bar',         'Food & Drink',  'CoffeeOutlined'),
  (5, 'Bathtub',          'Bathroom',      'ExperimentOutlined'),
  (6, 'Balcony',          'View',          'EnvironmentOutlined'),
  (7, 'Coffee maker',     'Food & Drink',  'CoffeeOutlined'),
  (8, 'Work desk',        'Comfort',       'LaptopOutlined');

INSERT INTO room_type_amenity (room_type_id, amenity_id, note) VALUES
  (1, 1, NULL), (1, 2, NULL), (1, 3, NULL),
  (2, 1, NULL), (2, 2, NULL), (2, 3, NULL), (2, 4, NULL), (2, 8, NULL),
  (3, 1, NULL), (3, 2, NULL), (3, 3, NULL), (3, 4, NULL), (3, 6, 'Garden or pool side'),
  (4, 1, NULL), (4, 2, NULL), (4, 3, '2 TVs'), (4, 4, 'Complimentary'), (4, 5, NULL),
  (4, 6, 'Panoramic view'), (4, 7, NULL), (4, 8, NULL);

-- E · service catalog ---------------------------------------------------
INSERT INTO service_category (category_id, category_code, category_name) OVERRIDING SYSTEM VALUE VALUES
  (1, 'FNB', 'Food & Beverage'),
  (2, 'SPA', 'Spa & Wellness'),
  (3, 'LDY', 'Laundry'),
  (4, 'TRN', 'Transport');

INSERT INTO service (service_id, category_id, service_code, service_name, description,
                     default_price, unit, is_chargeable, need_assignment, est_minutes)
OVERRIDING SYSTEM VALUE VALUES
  (1, 1, 'BRKFST',   'Breakfast buffet',      'International buffet 06:30–10:30', 350, 'person',  true,  false, NULL),
  (2, 1, 'RMSVC',    'In-room dining',        'Order from the room menu',         450, 'order',   true,  true,  30),
  (3, 2, 'THAIMSG',  'Thai massage (60 min)', 'Traditional Thai massage',         900, 'session', true,  true,  60),
  (4, 2, 'AROMA',    'Aromatherapy (90 min)', 'Oil massage with essential oils', 1500, 'session', true,  true,  90),
  (5, 3, 'LAUNDRY',  'Laundry',               'Wash and fold, returned same day', 120, 'kg',      true,  true,  240),
  (6, 4, 'AIRPORT',  'Airport transfer',      'Private car, one way',             800, 'trip',    true,  true,  60),
  (7, 1, 'WELCOME',  'Welcome drink',         'Complimentary on arrival',           0, 'person',  false, false, NULL);

-- G · member tiers ------------------------------------------------------
INSERT INTO member_tier (tier_id, tier_name, min_point, discount_rate, tier_benefit) OVERRIDING SYSTEM VALUE VALUES
  (1, 'Basic',        0,  0, 'Member rates'),
  (2, 'Silver',    1000,  5, 'Late check-out on request'),
  (3, 'Gold',      5000, 10, 'Free breakfast, late check-out'),
  (4, 'Platinum', 15000, 15, 'Room upgrade, lounge access');
