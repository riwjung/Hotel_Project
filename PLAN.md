# แผนแบ่งงาน Hotel Project ถึง 25/10/2026

## สรุปเป้าหมาย

ทำเส้นทางเดโมหลักให้สมบูรณ์จากข้อมูล booking ที่ seed ไว้:

`Booking list → Booking detail → Check-in → Payment → Check-out → Housekeeping`

กำหนดบทบาท:

- **คน A — คุณ:** รับงาน transaction และ business flow ที่ซับซ้อน
- **คน B — เพื่อน:** รับ vertical slice ที่ขอบเขตชัด ได้แก่ Booking list และ Housekeeping พร้อมจัดทำเอกสาร Page → API → Table
- เวลาทำงาน: ไม่เกินคนละ 1 ชั่วโมง/วัน
- ทุกงานใช้ feature branch + PR และต้องอธิบาย data flow ก่อน merge
- วันที่ 24 ต.ค. code freeze; วันที่ 25 ต.ค. ใช้ส่งงานและแก้เหตุฉุกเฉินเท่านั้น

## เส้นทางหน้า → API → ตาราง

| Flow | หน้าและ API | ตารางที่อ่าน | ตารางที่เขียน/ผลข้างเคียง | เจ้าของ |
|---|---|---|---|---|
| ดูรายการจอง | `/bookings` → `GET /api/bookings` | `v_booking_overview` ซึ่งรวม `booking`, `branch`, `customer`, `member_tier`, `booking_room`, `payment` | ไม่มี | B |
| ดูรายละเอียด | `/bookings/[id]` → `GET /api/bookings/:id` | `booking`, `branch`, `customer`, `member_tier`, `promotion`, `booking_room`, `room`, `room_type`, `room_rate`, `guest`, `booking_service`, `branch_service`, `service`, `payment`, `booking_status_log`, `employee` | ไม่มี | A |
| Confirm/Cancel/No-show | `POST /api/bookings/:id/status` | `booking` | update `booking`; trigger R9 insert `booking_status_log` | A |
| Check-in | `POST /api/bookings/:id/check-in` | `booking`, `booking_room`, `room` | insert `guest`; update `booking_room.actual_check_in`, `checkin_by_emp_id`, `key_card_no`; update `room` เป็น `OCCUPIED`; update `booking`; triggerเขียน `booking_status_log` | A |
| รับชำระเงิน | action ใน `/bookings/[id]` → `POST /api/bookings/:id/payments` | `booking`, `payment` | insert `payment` สถานะ `PAID`; ยอด paid/balance ใน view เปลี่ยนตามข้อมูลใหม่ | A |
| Check-out | `POST /api/bookings/:id/check-out` | `booking`, `booking_room`, `room`, `employee` | update `booking_room.actual_check_out`; update `room` เป็น `CLEANING`; insert `housekeeping_task` ต่อห้อง; update `booking`; triggerเขียน `booking_status_log` | A |
| งานแม่บ้าน | `/housekeeping` → `GET /api/housekeeping`, `PATCH /api/housekeeping/:id` | `housekeeping_task`, `room`, `branch`, `employee` | เปลี่ยน `PENDING → IN_PROGRESS → DONE → VERIFIED`; เมื่อ VERIFIED ให้ update `room` เป็น `AVAILABLE` ใน transaction เดียวกัน | B |

อินเทอร์เฟซสำคัญ:

- Check-in รับห้องแต่ละห้องพร้อม `keyCardNo` และรายชื่อ guest โดยต้องมี primary guest หนึ่งคนต่อห้อง และจำนวน guest รวมตรงกับ booking
- Payment รองรับ `DEPOSIT`, `FULL`, `BALANCE` และ `CASH`, `CARD`, `TRANSFER`, `QR`; ยังไม่ทำ refund หรือ slip upload
- Check-out รับ `assignedEmpId` หนึ่งคนสำหรับงานทำความสะอาดทุกห้อง โดยรายละเอียด booking ส่งรายชื่อ active employee ในสาขาเดียวกันมาเป็นตัวเลือก
- ทุก write ใช้ `withTx()` และทุก query บังคับ branch scope; booking นอก scope ต้องตอบ 404
- Housekeeping ผู้ verify ต้องไม่ใช่คนเดียวกับผู้รับงาน ตาม constraint ที่มีอยู่

## การแบ่งงานและกำหนดการ

### 11–12 ต.ค. — เรียนรู้ระบบร่วมกัน

- ทั้งคู่ trace หน้า `/rooms` ตั้งแต่ page → component → client API → route → repo SQL → `room`, `room_type`, `branch`
- B สร้างเอกสาร `Page → Permission → API → Read tables → Write tables → Trigger side effects`
- ตกลง PR checklist และห้ามแก้ไฟล์ shared พร้อมกัน

### 13–15 ต.ค. — Read flow

- **B:** branch `feature/bookings-list`
  - Booking list, filters, sorting, branch scope และ responsive table
  - flip `/bookings` เป็น `ready`
- **A:** branch `feature/booking-detail`
  - Booking detail พร้อม rooms, guests, services, payments และ status timeline
- Merge list ก่อน detail; แยก repo/types ของ list และ detail เพื่อลด merge conflict

### 16–19 ต.ค. — Transaction flow

- **A:** branch `feature/booking-lifecycle`
  - status actions, check-in, payment และ check-out
  - ทุก operation ต้อง atomic และแสดงข้อความจาก DB
- **B:** branch `feature/housekeeping`
  - เริ่มจาก read-only task list
  - เพิ่ม action start, done, verify หลัง query และ branch scope ผ่าน review
  - เพิ่ม housekeeping status palette และ flip nav เป็น `ready`

### 20–21 ต.ค. — Integration

- เดโม check-out แล้วเห็น task ใหม่ใน `/housekeeping`
- เดโม verify แล้วห้องกลับเป็น `AVAILABLE`
- B อัปเดต mapping document ให้ครอบคลุมทุกเส้นในตารางด้านบน
- A ตรวจ transaction, permission และ cross-branch access

### 22–23 ต.ค. — QA และแก้ defect

- ทดสอบ OWNER, MANAGER และ STAFF
- ตรวจ mobile 375px, sorting, loading, empty, error และ 403
- รัน `typecheck`, `lint`, `build`; รัน `db:test` หากแตะ SQL
- อัปเดต module docs, `docs/Home.md` และ session log

### 24–25 ต.ค. — Freeze และส่ง

- 24 ต.ค.: code freeze, reset DB, ซ้อมเดโมเต็มเส้นและเตรียม fallback screenshots
- 25 ต.ค.: submission buffer; merge เฉพาะ critical fix

## วิธี review เพื่อให้เพื่อนได้เรียนรู้จริง

ทุก PR ต้องมีคำตอบสั้น ๆ 8 ข้อ:

1. ผู้ใช้เปิดหน้าใด
2. หน้าเรียก API ใด
3. ใช้ permission อะไร
4. route ส่งต่อไป repo ใด
5. query อ่าน table/view ใด
6. operation เขียน table ใด
7. trigger หรือ constraint ใดทำงานต่อ
8. ถ้า transaction กลางทางล้มเหลว ข้อมูลใดต้อง rollback

B เป็นผู้อธิบาย `/bookings` และ `/housekeeping`; A เป็นผู้อธิบาย lifecycle แต่ให้ B ทดลอง trace และ review ก่อน merge

## Test และเกณฑ์รับงาน

- OWNER เห็น booking seed ทั้ง 7 รายการ; STAFF BKK เห็นเฉพาะ BKK
- filter booking ใช้ร่วมกันได้ และทุก column sort ได้
- เปิด booking ต่างสาขาด้วย URL/API โดยตรงต้องได้ 404
- invalid status transition ได้ 422 และไม่มีข้อมูลบางส่วนหลงเหลือ
- check-in สร้าง guest, บันทึกเวลา/ผู้ทำรายการ และเปลี่ยนห้องเป็น `OCCUPIED`
- payment ทำให้ paid total และ balance เปลี่ยนถูกต้อง; ห้ามยอดเกิน balance
- check-out เปลี่ยนห้องเป็น `CLEANING` และสร้าง housekeeping task ครบทุกห้อง
- housekeeping เดินสถานะครบ; verifier คนเดียวกับ assignee ต้องถูกปฏิเสธ
- verify สำเร็จแล้วห้องกลับเป็น `AVAILABLE`
- ไม่มี antd/React warning และไม่มี body horizontal scroll ที่ 375px
- `npm run typecheck`, `npm run lint`, `npm run build` ผ่าน

## ขอบเขตและค่าเริ่มต้น

- ไม่เปลี่ยน schema, จำนวน 31 tables หรือ 49 FKs
- ใช้ข้อมูล seed สำหรับเริ่ม lifecycle
- Create booking, Customers CRUD, standalone `/payments`, refund, slip upload, services workflow, reviews และโมดูลอื่นเป็น stretch หลัง must-have ผ่านทั้งหมด
- หากช้ากว่าแผนวันที่ 19 ต.ค. ให้ตัด payment form เหลือแสดง payment seed แต่ห้ามตัด check-in/out และ housekeeping integration
- ก่อนใช้ Next.js API ที่ยังไม่มี pattern ใน repo ต้องอ่านคู่มือใน `node_modules/next/dist/docs/`
