---
tags: [handoff]
date: 2026-10-17
---

# Session log 2026-10-17

## เป้าหมาย
- ผู้ใช้ตัดสินใจ: จำนวน guest ต้องไม่เกิน capacity ของห้อง และ `min_nights` ต้องบังคับใน DB (ขั้นต่ำ 1 คืน)
- ทำ `/bookings` และ `/housekeeping` ให้เสร็จตาม `PLAN.md` ที่ root ของ repo (visual QA ที่ค้างจาก [[2026-10-11-session-log]])
- ถ้าทันให้ทำ Customers CRUD และ Create booking ต่อ

## ทำแล้ว
แยกเป็น 3 branch ซ้อนกัน (commit ในเครื่องแล้ว **ยังไม่ push**) — merge ตามลำดับนี้:

| ลำดับ | branch | เนื้อหา |
|---|---|---|
| 1 | `feature/booking-qa` | R11 + R12 ใน DB + tests; แก้ defect ที่เจอจาก QA ใน browser |
| 2 | `feature/customers` | `/customers` CRUD + `GET /api/member-tiers` |
| 3 | `feature/create-booking` | `/bookings/new`, `GET /api/bookings/availability`, `POST /api/bookings`, `booking_code_seq` |

**DB rules ใหม่** (รายละเอียด [[physical-design]])
- R11a `guest` ต่อห้อง ≤ `room_type.capacity` — trigger BEFORE บน `guest` + lock แถว booking_room
- R11b `booking.guest_count` ≤ Σ capacity ของห้อง — `CONSTRAINT TRIGGER … DEFERRABLE INITIALLY DEFERRED` ตรวจตอน COMMIT
  (booking ถูก insert ก่อนห้อง: 4 คน/ห้อง 2+2 จะ "เกิน" หลังห้องแรก ถ้าตรวจทันที)
- R12 จำนวนคืน ≥ `room_rate.min_nights`; `min_nights ≥ 1` เป็น CHECK เดิม `ck_room_rate_min_nights`
- `booking.booking_code` default = `fn_next_booking_code()` จาก `booking_code_seq` (190 sync ต่อจาก BK-0007)

**Defect ที่เจอจาก QA และแก้แล้ว**
- **Check-in ผ่าน UI ใช้ไม่ได้เลยตอน `npm run dev`**: `Form.List` ซ้อนกับ `preserve={false}` โดน React StrictMode
  remount ล้างค่า → hidden `bookingRoomId` ส่งไปเป็นค่าว่าง → 400. รอบก่อนทดสอบ check-in ด้วย curl จึงไม่เจอ
  แก้โดยไม่เก็บ id ในฟอร์ม แล้วประกอบ payload จาก `booking.rooms` ตอน submit
- ฟอร์ม check-in กระจาย guest ตาม capacity และกันเพิ่มเกินความจุห้อง (เดิมใส่ทุกคนในห้องแรก ซึ่งตอนนี้ R11 จะปฏิเสธ)
- Timeline `items.children` → `items.content` (antd v6 deprecation)
- Verify stay-over clean เคยทำให้ห้องที่แขกยังอยู่กลายเป็น `AVAILABLE` → ตอนนี้ปล่อยเฉพาะห้อง `CLEANING`
- รับเงินของ booking ที่ CANCELLED / NO_SHOW ได้ → 422
- Check-out modal เตือนเมื่อยังมียอดค้าง
- `codeLabel()` ซ้ำ 4 ไฟล์ → ย้ายไป `app/lib/format.ts`

## Verify (ผลจริง)
| ตรวจอะไร | ผล |
|---|---|
| `npm run db:reset` | ผ่าน; 31 tables, 49 FKs, 18 triggers (เดิม 14), 2 views |
| `npm run db:test` | 27/27 (เดิม 20 + R11 ×3, R12 ×3, booking code ×1) |
| `npm run typecheck` / `npm run lint` | ผ่าน |
| `npm run build` | ผ่าน; 40 pages, `/customers` และ `/bookings/new` เป็น route จริง |
| Headless Chrome — bookings/housekeeping | 42/42: OWNER 7 / STAFF BKK 4, ทุกคอลัมน์ sort ได้, filter รวมกันได้, cross-branch 404, branchId ใน query ขยาย scope ไม่ได้, lifecycle เต็มเส้นผ่าน UI (check-in → payment → check-out → housekeeping start/done → assignee verify เองโดนปฏิเสธ → manager verify → ห้อง AVAILABLE), 375px ไม่มี horizontal scroll, ไม่มี console warning |
| Stay-over verify | ห้อง 301 ที่ OCCUPIED ยัง OCCUPIED หลัง verify |
| Headless Chrome — customers | 20/20: 401 ไม่ login, CRUD, email ซ้ำ 409, ลูกค้ามี booking ลบไม่ได้ (409 + ปุ่ม disabled), tier hint, 375px, console สะอาด |
| Headless Chrome — create booking | 32/32: สร้าง BK-0008 ผ่าน UI (2×2×1,200 − WELCOME500 = 4,300 จาก trigger), log Pending → Confirmed, suite 1 คืนเลือกไม่ได้, สร้างลูกค้าใหม่จากหน้า booking แล้วถูกเลือกให้อัตโนมัติ; API: R3 ทับวัน, R12, R11 ตอน COMMIT, R8 promo หมดอายุ, promo ไม่มีจริง, วันย้อนหลัง → 422 ทั้งหมดและไม่ทิ้งแถวค้าง; staff จอง HKT ไม่ได้; owner ต้องเลือกสาขา |
| ไม่ได้ตรวจ | role ที่ไม่มี `CUSTOMER_VIEW` / `BOOKING_MANAGE` → 403 (seed ไม่มี role แบบนั้น; `route()` เป็นตัวเดียวกับที่ทดสอบแล้วใน Branches) |

สคริปต์ QA (puppeteer-core) อยู่ใน scratchpad ของ session ไม่ได้อยู่ใน repo

## เบี่ยงจากแผน
- ทำงานของ "คน B" (Booking list, Housekeeping, Customers) ไปแล้วทั้งหมด → B ควรเรียนรู้ด้วยการ review/trace 3 branch นี้แทน
- commit แยก branch ในเครื่องเพราะผู้ใช้สั่งให้ทำ `feature/create-booking` และ `feature/customers`; ยังไม่ push และยังไม่ merge
- ~~Tier ของลูกค้าเลือกเอง~~ → รอบ 2 ด้านล่างเปลี่ยนเป็น tier ตามแต้มอัตโนมัติแล้ว

## รอบ 2 — ส่วนลด tier + tier ตามแต้ม (branch 4: `feature/member-tier-rules`)
ผู้ใช้ตัดสินใจ: ส่วนลด tier **ใช้ร่วมกับ promotion ได้** และ tier **ต้องเปลี่ยนตามแต้มอัตโนมัติใน DB** → [[ADR-006-member-tier-discount-and-derived-tier]]
- R13: `trg_customer_10_set_tier` + `trg_member_tier_90_resync_customers` (statement-level); ladder ต้องเริ่มที่ 0
- ส่วนลด: promotion ก่อน แล้ว tier% จากยอดที่เหลือ (`fn_booking_discounts` ใช้ทั้ง trigger และหน้า detail)
- **คอลัมน์ใหม่ `booking.member_discount_rate`** = snapshot อัตราตอนจอง → tier ที่เปลี่ยนทีหลังไม่แก้ยอดของ booking เก่า
  (ยังเป็น 31 ตาราง / 49 FK แต่ **รูป ERD ต้องเพิ่มคอลัมน์นี้ก่อนส่ง**)
- UI: ฟอร์มลูกค้าไม่มีช่องเลือก tier แล้ว (แสดง tier ล่วงหน้าใต้ช่องแต้ม), ตารางลูกค้าแสดง % ส่วนลด,
  detail แยก promotion / member discount, หน้า create booking บอกส่วนลด member ของลูกค้าที่เลือก

| ตรวจอะไร | ผล |
|---|---|
| `npm run db:test` | 34/34 (BK-0001 = 7,000 − 700 − 630 = 5,670; BK-0003 = 17,300 − 500 − 2,520 = 14,280; R13 ×4; snapshot ×2) |
| `npm run db:reset` | 31 tables, 49 FKs, 21 triggers, 2 views |
| typecheck / lint / build | ผ่าน (40 pages) |
| Headless Chrome | bookings 44/44 · customers 22/22 · create booking 34/34 (Gold booking 2,400 − 10% = 2,160; PATCH ที่ส่ง `tierId` มาถูกเมิน) |

## ความคืบหน้า (ประเมิน ณ 2026-10-17)
| มุมมอง | ฐานการนับ | % |
|---|---|---|
| Must-have ตาม `PLAN.md` (เดโมหลัก) | ฟีเจอร์ครบและผ่าน QA; เหลือ review/merge, ซ้อมเดโม, screenshot, อัปเดต ERD | ~90% |
| ฐานข้อมูล (ส่วนที่ให้คะแนนหลัก) | 31/31 ตาราง, 49 FK, R1–R13, 21 triggers, 2 views, 34 tests; เหลือกฎ assignee สาขาเดียวกัน, การได้แต้ม, query รายงาน | ~90% |
| หน้าจอทั้งระบบ | เมนูที่ใช้งานได้ 6/24 | 25% |
| Backlog ของ 7 โมดูล | 12/41 ข้อ | 29% |
| **รวมถ่วงน้ำหนัก** | DB 50% · แอป 30% · เอกสาร/รายงาน/เดโม 20% (สมมติฐาน) | **~65%** |

## ต่อไป
- [ ] B trace + review 4 branch ด้วย [[page-api-table-map]] (ตอบคำถาม 8 ข้อ) แล้วค่อย merge ตามลำดับ 1 → 2 → 3 → 4
- [x] ตัดสินใจ: ส่วนลด tier ซ้อน promotion · tier ตามแต้มอัตโนมัติ → ADR-006
- [ ] ตัดสินใจ: ได้แต้มอัตโนมัติไหม (เช่นทุก ฿100 ของ grand_total = 1 แต้ม ตอน check-out) — ถ้าใช่ทำเป็น trigger
- [ ] อัปเดตรูป ERD ให้มี `booking.member_discount_rate`
- [ ] Stretch ที่เหลือ (ถ้ามีเวลาก่อน 22 ต.ค.): Maintenance (F), Payments list (G)
- [ ] 24 ต.ค.: `npm run db:reset` แล้วซ้อมเดโมเต็มเส้น + เก็บ screenshot สำรอง
