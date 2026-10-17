---
tags: [adr, database]
status: accepted
date: 2026-10-17
---

# ADR-006 · ส่วนลด member tier ซ้อนกับ promotion + tier ตามแต้มอัตโนมัติ

## Context
ค้างจาก [[ADR-003-stored-totals-with-triggers]] › Open และ backlog ของ [[G-finance-cx]]
- `discount_amount` เดิมมีแค่ส่วนลด promotion; `member_tier.discount_rate` ไม่ถูกใช้ที่ไหนเลย
- `customer.tier_id` ให้พนักงานเลือกเอง จึงไม่ตรงกับ `member_point` ได้

ผู้ใช้ตัดสินใจ (2026-10-17): **ส่วนลด tier ใช้ร่วมกับ promotion ได้** และ **tier ต้องเปลี่ยนตามแต้มอัตโนมัติใน DB**

## Options
**ลำดับการลด**
1. ลดทั้งสองอย่างจาก gross แล้วรวมกัน (promo + tier% × gross) — ส่วนลดรวมอาจเกิน gross ถ้าเปอร์เซ็นต์สูง
2. **promotion ก่อน แล้วคิด tier% จากยอดที่เหลือ** — ไม่ติดลบแน่นอน และเป็นวิธี "ลดซ้อน" ที่ใช้กันทั่วไป

**อัตรา tier ที่ใช้คิด**
1. อ่าน tier ปัจจุบันของลูกค้าทุกครั้งที่คำนวณ — ถ้าแต้มเปลี่ยน ยอดของ booking เก่าจะเปลี่ยนตามเมื่อมีการ UPDATE แถวนั้น
   (เช่นเปลี่ยนสถานะ) → update anomaly ทางการเงิน
2. **เก็บ snapshot อัตราไว้ที่ booking ตอนจอง** — แบบเดียวกับ `price_per_night` / `unit_price`

**tier ตามแต้ม**
1. คำนวณใน VIEW / query ทุกครั้ง แล้วลบ `customer.tier_id` — เปลี่ยน ER (ลบ FK 1 ตัว)
2. **คง `tier_id` ไว้ตาม ER แต่ให้ trigger เป็นเจ้าของค่า** — controlled redundancy แบบเดียวกับยอดรวม

## Decision
เลือกข้อ 2 ทั้งสามเรื่อง

| อะไร | กลไก | ไฟล์ |
|---|---|---|
| `booking.member_discount_rate` (**คอลัมน์ใหม่**) | trigger `trg_booking_25_snapshot_member_rate` คัดลอก `discount_rate` ของ tier ลูกค้าตอน INSERT หรือเมื่อ `customer_id` เปลี่ยน; write อื่นคงค่าเดิม (แอปเขียนทับไม่ได้) | `050`, `085` |
| แยกส่วนลด | `fn_booking_discounts(gross, promotion_id, rate)` → `promotion_discount`, `member_discount`; ใช้ทั้งใน trigger ยอดรวมและ query หน้า detail จึงไม่มีทางคำนวณไม่ตรงกัน | `085` |
| สูตร | `discount_amount = promo + round((gross − promo) × rate / 100, 2)` · `grand_total = gross − discount_amount` | `085` |
| R13 tier ตามแต้ม | `trg_customer_10_set_tier` (BEFORE INSERT/UPDATE OF member_point, tier_id) ตั้ง `tier_id` = tier ที่ `min_point` สูงสุดที่ ≤ แต้ม; `trg_member_tier_90_resync_customers` (AFTER INSERT/UPDATE OF min_point, FOR EACH STATEMENT) คำนวณลูกค้าทุกคนใหม่เมื่อเกณฑ์เปลี่ยน; ถ้าเกณฑ์ทำให้ลูกค้าบางคนไม่มี tier → reject | `080` |

ตัวอย่าง (seed): BK-0001 Kanya (Gold 10%) gross 7,000 → EARLYBIRD 10% = 700 → 6,300 → member 10% = 630 → **5,670**

## เหตุผล (ใช้เขียนในรายงาน)
1. **Snapshot ทางการเงิน** — เหตุผลเดียวกับ ADR-003: ใบจองต้องคงยอดเดิมแม้ tier ของลูกค้าเปลี่ยนภายหลัง
2. **3NF** — `customer.tier_id` ขึ้นกับ `member_point` (ผ่านตาราง ladder `member_tier`) จึงเป็นค่าที่ derive ได้
   การเก็บไว้คือ denormalization ที่ตั้งใจ; trigger จุดเดียวคุมความถูกต้อง ไม่มี update anomaly
3. **กฎอยู่ใน DB** — ไม่ว่าจะแก้ผ่านหน้าจอ, SQL ตรง หรือระบบอื่น tier กับยอดเงินถูกเสมอ

## Consequences
- **ER เปลี่ยน 1 คอลัมน์**: `BOOKING.member_discount_rate decimal(5,2)` (ไม่เพิ่มตาราง/FK — ยัง 31 / 49)
  → ต้องอัปเดตรูป ERD (`attachments/hotel-erd-full-schema.png`) ก่อนส่งงาน
- ยอดของ seed เปลี่ยน (grand_total): BK-0001 6,300 → 5,670 · BK-0003 16,800 → 14,280 · BK-0004 3,000 → 2,850 ·
  BK-0005 11,800 → 11,210 (payment ของ seed อ่าน grand_total จึงยังจ่ายครบ) · BK-0007 20,800 → 18,720 ·
  BK-0002 / BK-0006 (Basic) เท่าเดิม
- API ลูกค้าไม่รับ `tierId` แล้ว (zod ตัดทิ้ง; ถ้าส่งมาตรงๆ ใน SQL trigger ก็เขียนทับ)
- หน้า booking detail แสดง promotion และ member discount แยกกัน; หน้า create booking บอก tier ของลูกค้าที่เลือก
- **ยังไม่ได้ทำ**: การได้แต้มเพิ่มอัตโนมัติ (เช่นหลัง check-out) — ER ไม่ได้กำหนดอัตราไว้ ต้องให้ผู้ใช้ตัดสินใจก่อน
- promotion ยังอ่านค่าปัจจุบันทุกครั้ง (ไม่ได้ snapshot) — ถ้าภายหลังทำหน้าแก้ promotion ควรพิจารณา snapshot ด้วย

## ทดสอบ
`npm run db:test` (34 cases): totals BK-0001/BK-0003, R13 ×4 (insert, ขึ้น/ลง tier, tier ที่ส่งมาถูกเขียนทับ,
เปลี่ยนเกณฑ์แล้ว resync, ladder ไม่เริ่มที่ 0 ถูก reject), snapshot ไม่เปลี่ยนเมื่อ tier ลูกค้าเปลี่ยน, booking ใหม่ได้อัตราปัจจุบัน
