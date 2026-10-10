# Hotel_Project_AdvDB — ER Design (Logical)

ระบบจัดการโรงแรมแบบเครือหลายสาขา ครอบคลุม 3 บทบาท: ลูกค้า · พนักงาน · เจ้าของเครือ
**31 ตาราง · 49 ความสัมพันธ์ · 7 โมดูล** — ไฟล์ผัง: `hotel-advdb-erd.drawio` (แท็บ 1 Module Map, แท็บ 2 Full Schema)

## การตัดสินใจหลัก

**SERVICE ไม่แยก master ของพนักงานกับลูกค้า** — `SERVICE` เป็น master data ตัวเดียว แล้วแตกเป็นตาราง transaction ตามบทบาท:

| เชื่อมกับ | ผ่านตาราง | ชนิด | เก็บอะไรเพิ่ม |
|---|---|---|---|
| BRANCH | BRANCH_SERVICE | M:N | ราคาสาขา, เปิดขายไหม, เวลาเปิด–ปิด |
| CUSTOMER | BOOKING → BOOKING_SERVICE | M:N | จำนวน, ราคา ณ วันสั่ง, เวลานัด, สถานะออเดอร์ |
| EMPLOYEE | EMPLOYEE_SERVICE_SKILL | M:N | ใครทำบริการไหนเป็น + ระดับทักษะ |
| EMPLOYEE | SERVICE_ASSIGNMENT | M:N | ใครลงมือทำออเดอร์ไหน เริ่ม–เสร็จ คะแนน สถานะ = **log history รายคน** |

- เปลี่ยนคนทำ = insert แถวใหม่ + ตั้งแถวเดิมเป็น `REASSIGNED` (ห้าม update ทับ)
- งานภายในที่ไม่มีลูกค้าสั่ง/ไม่มีราคา แยกไป `HOUSEKEEPING_TASK`, `MAINTENANCE_REQUEST`
- **owner** = แถวใน `EMPLOYEE` ที่ `ROLE.role_code='OWNER'`, `scope_level='CHAIN'`, `branch_id=NULL` (ไม่มีตาราง OWNER แยก)

## ตารางตามโมดูล

### A · องค์กร & สิทธิ์เข้าถึง

**BRANCH** — สาขาในเครือ

| key | column | type |
|---|---|---|
| PK | `branch_id` | int |
| UQ | `branch_code` | varchar(10) |
|  | `branch_name` | varchar(100) |
|  | `province` | varchar(50) |
|  | `address` | varchar(255) |
|  | `phone` | varchar(20) |
|  | `check_in_time` | time |
|  | `check_out_time` | time |
|  | `branch_status` | varchar(20) |

**ROLE** — OWNER / MANAGER / STAFF

| key | column | type |
|---|---|---|
| PK | `role_id` | int |
| UQ | `role_code` | varchar(30) |
|  | `role_name` | varchar(50) |
|  | `scope_level` | varchar(20) |
|  | `role_status` | varchar(20) |

**PERMISSION** — สิทธิ์รายหน้าจอ

| key | column | type |
|---|---|---|
| PK | `permission_id` | int |
| UQ | `permission_code` | varchar(50) |
|  | `module_name` | varchar(50) |
|  | `description` | varchar(255) |

**ROLE_PERMISSION** — ตารางกลาง M:N

| key | column | type |
|---|---|---|
| PK,FK | `role_id` | int |
| PK,FK | `permission_id` | int |
|  | `granted_at` | datetime |

**EMPLOYEE** — พนักงานทุกระดับ รวม owner

| key | column | type |
|---|---|---|
| PK | `employee_id` | int |
| FK | `branch_id` | int NULL |
| FK | `role_id` | int |
| FK | `manager_id` | int NULL |
| UQ | `employee_code` | varchar(20) |
|  | `first_name` | varchar(50) |
|  | `last_name` | varchar(50) |
|  | `phone` | varchar(20) |
| UQ | `email` | varchar(100) |
|  | `password_hash` | varchar(255) |
|  | `hire_date` | date |
|  | `employee_status` | varchar(20) |

### B · กำลังคน & เวลาทำงาน

**SHIFT** — กะงานของแต่ละสาขา

| key | column | type |
|---|---|---|
| PK | `shift_id` | int |
| FK | `branch_id` | int |
|  | `shift_name` | varchar(50) |
|  | `start_time` | time |
|  | `end_time` | time |
|  | `is_overnight` | boolean |

**WORK_SCHEDULE** — ตารางเวร รายวัน

| key | column | type |
|---|---|---|
| PK | `schedule_id` | int |
| FK | `employee_id` | int |
| FK | `shift_id` | int |
|  | `work_date` | date |
|  | `schedule_status` | varchar(20) |

**ATTENDANCE** — เวลาเข้า–ออกจริง

| key | column | type |
|---|---|---|
| PK | `attendance_id` | int |
| FK,UQ | `schedule_id` | int |
|  | `clock_in` | datetime |
|  | `clock_out` | datetime |
|  | `attendance_status` | varchar(20) |
|  | `remark` | varchar(255) |

### C · ห้องพัก

**ROOM_TYPE** — ประเภทห้อง (master)

| key | column | type |
|---|---|---|
| PK | `room_type_id` | int |
| UQ | `type_code` | varchar(20) |
|  | `type_name` | varchar(50) |
|  | `description` | varchar(255) |
|  | `capacity` | int |
|  | `bed_type` | varchar(30) |
|  | `base_price` | decimal(10,2) |

**AMENITY** — สิ่งอำนวยความสะดวก (master)

| key | column | type |
|---|---|---|
| PK | `amenity_id` | int |
|  | `amenity_name` | varchar(50) |
|  | `amenity_group` | varchar(30) |
|  | `icon` | varchar(50) |

**ROOM_TYPE_AMENITY** — ตารางกลาง M:N — แก้ 1NF

| key | column | type |
|---|---|---|
| PK,FK | `room_type_id` | int |
| PK,FK | `amenity_id` | int |
|  | `note` | varchar(100) |

**ROOM** — ห้องพักรายห้อง

| key | column | type |
|---|---|---|
| PK | `room_id` | int |
| FK | `branch_id` | int |
| FK | `room_type_id` | int |
|  | `room_number` | varchar(10) |
|  | `room_name` | varchar(100) |
|  | `floor` | int |
|  | `location_zone` | varchar(50) |
|  | `room_status` | varchar(20) |
|  | `description` | varchar(255) |

**ROOM_IMAGE** — รูปห้อง

| key | column | type |
|---|---|---|
| PK | `image_id` | int |
| FK | `room_id` | int |
|  | `image_url` | varchar(255) |
|  | `image_caption` | varchar(100) |
|  | `is_cover` | boolean |
|  | `sort_order` | int |

**ROOM_RATE** — ราคาตามช่วงวัน / สาขา

| key | column | type |
|---|---|---|
| PK | `rate_id` | int |
| FK | `branch_id` | int |
| FK | `room_type_id` | int |
|  | `rate_name` | varchar(50) |
|  | `start_date` | date |
|  | `end_date` | date |
|  | `price_per_night` | decimal(10,2) |
|  | `min_nights` | int |
|  | `rate_status` | varchar(20) |

### D · การจอง & เข้าพัก

**CUSTOMER** — ลูกค้า / สมาชิก

| key | column | type |
|---|---|---|
| PK | `customer_id` | int |
| FK | `tier_id` | int |
|  | `first_name` | varchar(50) |
|  | `last_name` | varchar(50) |
|  | `phone` | varchar(20) |
| UQ | `email` | varchar(100) |
|  | `password_hash` | varchar(255) |
|  | `address` | varchar(255) |
|  | `id_card_no` | varchar(30) |
|  | `member_point` | int |
|  | `created_at` | datetime |

**BOOKING** — ใบจอง — หัวใจของระบบ

| key | column | type |
|---|---|---|
| PK | `booking_id` | int |
| UQ | `booking_code` | varchar(20) |
| FK | `customer_id` | int |
| FK | `branch_id` | int |
| FK | `promotion_id` | int NULL |
| FK | `created_by_emp_id` | int NULL |
|  | `booking_date` | datetime |
|  | `check_in_date` | date |
|  | `check_out_date` | date |
|  | `guest_count` | int |
|  | `room_total` | decimal(12,2) |
|  | `service_total` | decimal(12,2) |
|  | `discount_amount` | decimal(12,2) |
|  | `grand_total` | decimal(12,2) |
|  | `booking_channel` | varchar(20) |
|  | `booking_status` | varchar(20) |

**BOOKING_ROOM** — ห้องในใบจอง + เช็คอินจริง

| key | column | type |
|---|---|---|
| PK | `booking_room_id` | int |
| FK | `booking_id` | int |
| FK | `room_id` | int |
| FK | `rate_id` | int |
|  | `price_per_night` | decimal(10,2) |
|  | `night_count` | int |
|  | `subtotal` | decimal(12,2) |
|  | `actual_check_in` | datetime |
|  | `actual_check_out` | datetime |
| FK | `checkin_by_emp_id` | int NULL |
|  | `key_card_no` | varchar(20) |

**GUEST** — ผู้เข้าพักรายคน

| key | column | type |
|---|---|---|
| PK | `guest_id` | int |
| FK | `booking_room_id` | int |
|  | `full_name` | varchar(100) |
|  | `id_card_no` | varchar(30) |
|  | `nationality` | varchar(50) |
|  | `is_primary` | boolean |

**BOOKING_STATUS_LOG** — ประวัติเปลี่ยนสถานะ (audit)

| key | column | type |
|---|---|---|
| PK | `log_id` | int |
| FK | `booking_id` | int |
| FK | `changed_by_emp_id` | int NULL |
|  | `from_status` | varchar(20) |
|  | `to_status` | varchar(20) |
|  | `changed_at` | datetime |
|  | `remark` | varchar(255) |

### E · บริการ

**SERVICE_CATEGORY** — หมวดบริการ (master)

| key | column | type |
|---|---|---|
| PK | `category_id` | int |
| UQ | `category_code` | varchar(20) |
|  | `category_name` | varchar(50) |
|  | `category_status` | varchar(20) |

**SERVICE** — MASTER DATA ตัวเดียว ไม่แยกพนักงาน/ลูกค้า

| key | column | type |
|---|---|---|
| PK | `service_id` | int |
| FK | `category_id` | int |
| UQ | `service_code` | varchar(20) |
|  | `service_name` | varchar(100) |
|  | `description` | varchar(255) |
|  | `default_price` | decimal(10,2) |
|  | `unit` | varchar(20) |
|  | `is_chargeable` | boolean |
|  | `need_assignment` | boolean |
|  | `est_minutes` | int |
|  | `service_status` | varchar(20) |

**BRANCH_SERVICE** — สาขาไหนเปิดบริการอะไร + ราคาสาขา

| key | column | type |
|---|---|---|
| PK | `branch_service_id` | int |
| FK | `branch_id` | int |
| FK | `service_id` | int |
|  | `branch_price` | decimal(10,2) |
|  | `is_available` | boolean |
|  | `open_time` | time |
|  | `close_time` | time |

**BOOKING_SERVICE** — ฝั่งลูกค้า — ใบสั่งบริการ

| key | column | type |
|---|---|---|
| PK | `booking_service_id` | int |
| FK | `booking_id` | int |
| FK | `branch_service_id` | int |
|  | `quantity` | int |
|  | `unit_price` | decimal(10,2) |
|  | `subtotal` | decimal(12,2) |
|  | `requested_at` | datetime |
|  | `scheduled_at` | datetime |
|  | `order_status` | varchar(20) |
|  | `remark` | varchar(255) |

**SERVICE_ASSIGNMENT** — ฝั่งพนักงาน — log ประวัติการให้บริการ

| key | column | type |
|---|---|---|
| PK | `assignment_id` | int |
| FK | `booking_service_id` | int |
| FK | `employee_id` | int |
| FK | `assigned_by_emp_id` | int NULL |
|  | `assigned_at` | datetime |
|  | `started_at` | datetime |
|  | `completed_at` | datetime |
|  | `quality_score` | int |
|  | `assignment_status` | varchar(20) |
|  | `note` | varchar(255) |

**EMPLOYEE_SERVICE_SKILL** — ใครทำบริการไหนได้ (M:N)

| key | column | type |
|---|---|---|
| PK,FK | `employee_id` | int |
| PK,FK | `service_id` | int |
|  | `skill_level` | varchar(20) |
|  | `certified_date` | date |

### F · ปฏิบัติการหน้างาน

**HOUSEKEEPING_TASK** — งานแม่บ้านรายห้อง

| key | column | type |
|---|---|---|
| PK | `task_id` | int |
| FK | `room_id` | int |
| FK | `assigned_emp_id` | int |
| FK | `verified_by_emp_id` | int NULL |
|  | `task_type` | varchar(30) |
|  | `task_date` | date |
|  | `started_at` | datetime |
|  | `completed_at` | datetime |
|  | `task_status` | varchar(20) |
|  | `remark` | varchar(255) |

**MAINTENANCE_REQUEST** — แจ้งซ่อม / บำรุงรักษา

| key | column | type |
|---|---|---|
| PK | `maintenance_id` | int |
| FK | `branch_id` | int |
| FK | `room_id` | int NULL |
| FK | `reported_by_emp_id` | int |
| FK | `assigned_to_emp_id` | int NULL |
|  | `issue_title` | varchar(100) |
|  | `priority` | varchar(20) |
|  | `report_date` | datetime |
|  | `done_date` | datetime |
|  | `cost` | decimal(10,2) |
|  | `maintenance_status` | varchar(20) |

### G · เงิน & ความพึงพอใจ

**MEMBER_TIER** — ระดับสมาชิก (master)

| key | column | type |
|---|---|---|
| PK | `tier_id` | int |
|  | `tier_name` | varchar(30) |
|  | `min_point` | int |
|  | `discount_rate` | decimal(5,2) |
|  | `tier_benefit` | varchar(255) |

**PROMOTION** — โปรโมชั่น / ส่วนลด

| key | column | type |
|---|---|---|
| PK | `promotion_id` | int |
| UQ | `promotion_code` | varchar(30) |
|  | `promotion_name` | varchar(100) |
|  | `discount_type` | varchar(20) |
|  | `discount_value` | decimal(10,2) |
|  | `minimum_amount` | decimal(10,2) |
|  | `start_date` | date |
|  | `end_date` | date |
|  | `usage_limit` | int |
|  | `promotion_status` | varchar(20) |

**PAYMENT** — มัดจำ / ยอดเต็ม / คืนเงิน

| key | column | type |
|---|---|---|
| PK | `payment_id` | int |
| FK | `booking_id` | int |
| FK | `received_by_emp_id` | int NULL |
|  | `amount` | decimal(12,2) |
|  | `payment_type` | varchar(20) |
|  | `payment_method` | varchar(20) |
|  | `payment_date` | datetime |
|  | `slip_url` | varchar(255) |
|  | `transaction_ref` | varchar(100) |
|  | `payment_status` | varchar(20) |

**REVIEW** — รีวิว แยกคะแนนห้อง/บริการ/พนักงาน

| key | column | type |
|---|---|---|
| PK | `review_id` | int |
| FK,UQ | `booking_id` | int |
| FK | `reply_by_emp_id` | int NULL |
|  | `room_rating` | int |
|  | `service_rating` | int |
|  | `staff_rating` | int |
|  | `comment` | varchar(500) |
|  | `review_date` | datetime |
|  | `review_status` | varchar(20) |

## ความสัมพันธ์ (FK ทุกตัว)

| parent | child | FK | cardinality | ประเภท |
|---|---|---|---|---|
| BRANCH | EMPLOYEE | `branch_id` | 0..1 : 0..N | core |
| ROLE | EMPLOYEE | `role_id` | 1 : 0..N | core |
| ROLE | ROLE_PERMISSION | `role_id` | 1 : 0..N | core |
| PERMISSION | ROLE_PERMISSION | `permission_id` | 1 : 0..N | core |
| EMPLOYEE | EMPLOYEE | `manager_id` | 0..1 : 0..N | actor (ใครเป็นคนทำ) |
| BRANCH | SHIFT | `branch_id` | 1 : 0..N | core |
| EMPLOYEE | WORK_SCHEDULE | `employee_id` | 1 : 0..N | core |
| SHIFT | WORK_SCHEDULE | `shift_id` | 1 : 0..N | core |
| WORK_SCHEDULE | ATTENDANCE | `schedule_id` | 1 : 0..1 | core |
| BRANCH | ROOM | `branch_id` | 1 : 0..N | core |
| ROOM_TYPE | ROOM | `room_type_id` | 1 : 0..N | core |
| ROOM | ROOM_IMAGE | `room_id` | 1 : 0..N | core |
| ROOM_TYPE | ROOM_TYPE_AMENITY | `room_type_id` | 1 : 0..N | core |
| AMENITY | ROOM_TYPE_AMENITY | `amenity_id` | 1 : 0..N | core |
| BRANCH | ROOM_RATE | `branch_id` | 1 : 0..N | core |
| ROOM_TYPE | ROOM_RATE | `room_type_id` | 1 : 0..N | core |
| MEMBER_TIER | CUSTOMER | `tier_id` | 1 : 0..N | core |
| CUSTOMER | BOOKING | `customer_id` | 1 : 0..N | core |
| BRANCH | BOOKING | `branch_id` | 1 : 0..N | core |
| PROMOTION | BOOKING | `promotion_id` | 0..1 : 0..N | core |
| EMPLOYEE | BOOKING | `created_by_emp_id` | 0..1 : 0..N | actor (ใครเป็นคนทำ) |
| BOOKING | BOOKING_ROOM | `booking_id` | 1 : 0..N | core |
| ROOM | BOOKING_ROOM | `room_id` | 1 : 0..N | core |
| ROOM_RATE | BOOKING_ROOM | `rate_id` | 1 : 0..N | core |
| EMPLOYEE | BOOKING_ROOM | `checkin_by_emp_id` | 0..1 : 0..N | actor (ใครเป็นคนทำ) |
| BOOKING_ROOM | GUEST | `booking_room_id` | 1 : 0..N | core |
| BOOKING | BOOKING_STATUS_LOG | `booking_id` | 1 : 0..N | core |
| EMPLOYEE | BOOKING_STATUS_LOG | `changed_by_emp_id` | 0..1 : 0..N | actor (ใครเป็นคนทำ) |
| SERVICE_CATEGORY | SERVICE | `category_id` | 1 : 0..N | core |
| BRANCH | BRANCH_SERVICE | `branch_id` | 1 : 0..N | core |
| SERVICE | BRANCH_SERVICE | `service_id` | 1 : 0..N | core |
| BOOKING | BOOKING_SERVICE | `booking_id` | 1 : 0..N | core |
| BRANCH_SERVICE | BOOKING_SERVICE | `branch_service_id` | 1 : 0..N | core |
| BOOKING_SERVICE | SERVICE_ASSIGNMENT | `booking_service_id` | 1 : 0..N | core |
| EMPLOYEE | SERVICE_ASSIGNMENT | `employee_id` | 1 : 0..N | core |
| EMPLOYEE | SERVICE_ASSIGNMENT | `assigned_by_emp_id` | 0..1 : 0..N | actor (ใครเป็นคนทำ) |
| EMPLOYEE | EMPLOYEE_SERVICE_SKILL | `employee_id` | 1 : 0..N | core |
| SERVICE | EMPLOYEE_SERVICE_SKILL | `service_id` | 1 : 0..N | core |
| ROOM | HOUSEKEEPING_TASK | `room_id` | 1 : 0..N | core |
| EMPLOYEE | HOUSEKEEPING_TASK | `assigned_emp_id` | 1 : 0..N | core |
| EMPLOYEE | HOUSEKEEPING_TASK | `verified_by_emp_id` | 0..1 : 0..N | actor (ใครเป็นคนทำ) |
| BRANCH | MAINTENANCE_REQUEST | `branch_id` | 1 : 0..N | core |
| ROOM | MAINTENANCE_REQUEST | `room_id` | 0..1 : 0..N | core |
| EMPLOYEE | MAINTENANCE_REQUEST | `reported_by_emp_id` | 1 : 0..N | actor (ใครเป็นคนทำ) |
| EMPLOYEE | MAINTENANCE_REQUEST | `assigned_to_emp_id` | 0..1 : 0..N | actor (ใครเป็นคนทำ) |
| BOOKING | PAYMENT | `booking_id` | 1 : 0..N | core |
| EMPLOYEE | PAYMENT | `received_by_emp_id` | 0..1 : 0..N | actor (ใครเป็นคนทำ) |
| BOOKING | REVIEW | `booking_id` | 1 : 0..1 | core |
| EMPLOYEE | REVIEW | `reply_by_emp_id` | 0..1 : 0..N | actor (ใครเป็นคนทำ) |

## Normalization

- **1NF** — ไม่มีช่องหลายค่า: amenities → ROOM_TYPE_AMENITY, ผู้เข้าพัก → GUEST, สิทธิ์ → ROLE_PERMISSION
- **2NF** — ตาราง composite PK (ROLE_PERMISSION, ROOM_TYPE_AMENITY, EMPLOYEE_SERVICE_SKILL) คอลัมน์ที่เหลือขึ้นกับ key ทั้งคู่
- **3NF** — แยก MEMBER_TIER; ATTENDANCE ไม่เก็บ employee_id (ได้จาก schedule_id); REVIEW ไม่เก็บ customer_id (ได้จาก booking_id)
- **ตั้งใจเก็บซ้ำ (snapshot)** — `BOOKING_ROOM.price_per_night`, `BOOKING_SERVICE.unit_price` = ราคา ณ วันจอง
- **ต้องตัดสินใจ** — คอลัมน์คำนวณได้จากร่างเดิม (`room_total`, `service_total`, `grand_total`, `subtotal`, `night_count`): ลบแล้วทำ VIEW ถ้าตรวจ 3NF เข้ม หรือเก็บไว้พร้อมเหตุผลในรายงาน

## กฎที่ FK บังคับไม่ได้ (ทำตอน physical design)

- ห้องเดียวกันห้ามจองช่วงวันทับกัน
- `BOOKING.branch_id` ต้องตรงกับสาขาของ ROOM และ BRANCH_SERVICE
- ROOM_RATE ช่วงวันห้ามทับกันใน (branch, room_type) เดียวกัน
- SERVICE_ASSIGNMENT ต้องมีคู่ (employee, service) ใน EMPLOYEE_SERVICE_SKILL

## เปลี่ยนจากร่างเดิม (11 → 31 ตาราง)

- ROOM_TYPE.amenities (string) → AMENITY + ROOM_TYPE_AMENITY (แก้ 1NF)
- BOOKING_SERVICE: service_id → branch_service_id, + scheduled_at, order_status
- ROOM, BOOKING + branch_id; BOOKING + created_by_emp_id
- BOOKING_ROOM + rate_id, actual_check_in/out, checkin_by_emp_id, key_card_no
- CUSTOMER + tier_id, member_point; password → password_hash
- PAYMENT + payment_type, received_by_emp_id; REVIEW แยกคะแนน ห้อง/บริการ/พนักงาน + reply_by_emp_id
- ตารางใหม่ 20: BRANCH, ROLE, PERMISSION, ROLE_PERMISSION, EMPLOYEE, SHIFT, WORK_SCHEDULE, ATTENDANCE, AMENITY, ROOM_TYPE_AMENITY, ROOM_RATE, GUEST, BOOKING_STATUS_LOG, SERVICE_CATEGORY, BRANCH_SERVICE, SERVICE_ASSIGNMENT, EMPLOYEE_SERVICE_SKILL, HOUSEKEEPING_TASK, MAINTENANCE_REQUEST, MEMBER_TIER
