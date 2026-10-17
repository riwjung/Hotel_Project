---
tags: [adr, database]
status: accepted
date: 2026-10-10
---

# ADR-003 · เก็บคอลัมน์ยอดรวมไว้ + ให้ trigger คำนวณ

## Context
[[er-design]] หัวข้อ Normalization ระบุ "ต้องตัดสินใจ": คอลัมน์ที่คำนวณได้
`room_total`, `service_total`, `grand_total`, `subtotal`, `night_count` — ลบแล้วทำ VIEW (3NF เข้ม) หรือเก็บไว้พร้อมเหตุผล

## Decision
**เก็บไว้ตาม diagram** และให้ DB คำนวณเองด้วย trigger (`db/schema/085_totals_triggers.sql`) — แอปห้ามเขียนค่าเหล่านี้

| คอลัมน์ | สูตร | trigger |
|---|---|---|
| booking_room.night_count | check_out − check_in ของ booking | BEFORE ins/upd booking_room |
| booking_room.subtotal | price_per_night × night_count | 〃 |
| booking_service.subtotal | unit_price × quantity | BEFORE ins/upd booking_service |
| booking.room_total / service_total | Σ subtotal (ไม่นับ order CANCELLED) | AFTER ins/upd/del ของบรรทัด → `fn_recalc_booking()` |
| booking.member_discount_rate | snapshot `member_tier.discount_rate` ของลูกค้าตอนจอง ([[ADR-006-member-tier-discount-and-derived-tier]]) | BEFORE ins/upd booking (`trg_booking_25_…`) |
| booking.discount_amount | promotion PERCENT/FIXED ถ้า gross ≥ minimum_amount **+ member rate % ของยอดที่เหลือหลัง promotion** (`fn_booking_discounts`) | BEFORE ins/upd booking |
| booking.grand_total | room + service − discount | 〃 |

`price_per_night`, `unit_price`, `member_discount_rate` เป็น **snapshot** ณ วันจอง (สองตัวแรก ER ตั้งใจไว้, ตัวสุดท้ายเพิ่มใน ADR-006) — ถ้าแอปไม่ส่งราคามา trigger ดึงจาก rate/branch price ให้

## เหตุผล (ใช้เขียนในรายงาน)
1. **Snapshot ทางการเงิน** — ใบจองต้องแสดงยอดเดิมแม้ราคา/โปรเปลี่ยนภายหลัง; VIEW จะคำนวณใหม่จากราคาปัจจุบัน
2. **Performance** — list/dashboard อ่านยอดรวมบ่อยกว่าแก้ไขมาก ไม่ต้อง aggregate ทุกครั้ง
3. **ความถูกต้องยังอยู่ที่ DB** — redundancy ควบคุมโดย trigger จุดเดียว ไม่ใช่แอปหลายที่ → ไม่เกิด update anomaly
4. 3NF ถูก "ละเมิดโดยตั้งใจ" แบบมีกลไกกำกับ — อธิบายได้ว่าเป็น controlled denormalization

## ทดสอบ
`npm run db:test` → เคส totals (ยอด BK-0001 และ BK-0003 แบบมี member discount, เพิ่มบรรทัด, ยกเลิก order, เปลี่ยนวัน, snapshot อัตรา member)

## Open
- [x] ส่วนลด member tier ซ้อนกับ promotion → ซ้อนได้ promotion ก่อน แล้ว tier% จากยอดที่เหลือ ([[ADR-006-member-tier-discount-and-derived-tier]], 2026-10-17)
