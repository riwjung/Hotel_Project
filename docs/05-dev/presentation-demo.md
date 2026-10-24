---
tags: [dev, demo, presentation]
updated: 2026-10-23
---

# Presentation demo

## เตรียมก่อนพรีเซนต์

1. เปิด Docker Desktop แล้วรัน `npm run db:up`
2. รัน `npm run db:reset` เพื่อให้วันที่และข้อมูลกลับสู่ demo seed
3. รัน `npm run db:test` และเก็บหน้าจอผล `58 passed`
4. รัน `npm run dev` แล้วเปิด `http://localhost:3000`
5. ใช้ Chrome Incognito หรือ sign out ก่อนเริ่ม; ตั้ง zoom 100%

บัญชี demo ใช้รหัส `Hotel@1234`: owner `owner@hotel.local`, manager `manager.bkk@hotel.local`, staff `staff.bkk@hotel.local`

## ลำดับเดโมประมาณ 10–12 นาที

1. **Login เป็น OWNER** — ชี้เมนู 7 โมดูลและ selector “All branches” บน header
2. **Dashboard** — อธิบายว่าข้อมูลมาจาก view `v_dashboard_branch_today`
3. **Branch scope** — เลือก `BKK` บน header; เปิด Rooms/Bookings แล้วชี้ว่าทั้งแอปเหลือ BKK จาก server-side scope จากนั้นกลับ `All branches`
4. **Branches** — คลิกแถว BKK เพื่อเปิด detail; ชี้จำนวนห้อง พนักงาน และ active bookings
5. **Rooms** — คลิก BKK room 301; เปิด preview รูป, amenities และ current rate; กลับ list แล้วชี้ status workflow
6. **Availability** — เลือก BKK, 14 nights; อธิบายแถบ booking, Free rooms, weekend/today shading; กด `+` ในคืนว่างเพื่อแสดง prefilled booking form
7. **Create booking** — เลือกลูกค้า/วันที่/ห้อง; อธิบาย R3 กันจองทับ, R11 capacity, R12 minimum nights และราคา snapshot (ไม่จำเป็นต้อง submit ถ้าเวลาน้อย)
8. **Booking detail** — เปิด BK-0001; ชี้ rooms, guests, services, payments, status timeline และ transaction check-in/check-out
9. **Database highlight** — เปิด ERD/SQL สั้น ๆ: 31 tables, 49 FKs, 44 triggers, 3 views, R1–R22, tests 58/58
10. **Role security** — sign out แล้ว login `staff.bkk@hotel.local`; เปิด URL `/branches` เพื่อแสดง 403 และอธิบายว่า API ก็คืน 403

## สไลด์คู่เดโม (อัปเดต 2026-10-24)

Deck: https://claude.ai/artifact/A8UH78g1SnkrsFNGnbxdkM (claude.ai Slides, 23 หน้า) — จัดตาม 5 หัวข้อหลักของรายงาน:
ที่ตั้ง · ลักษณะโรงแรมและบริการ · ระบบที่มี · จุดบอด · ER Diagram + เชื่อมหน้าเว็บ
มุมล่างซ้ายของทุกสไลด์บอกว่าต้องสลับไปเปิดหน้าไหน · speaker notes มีบทพูด + ขั้นเดโม

| สไลด์ | หัวข้อ | เรื่อง | เปิดเว็บ |
|---|---|---|---|
| 02 | — | 5 คำถามที่จะตอบ | — |
| 03 | 1 | 3 สาขา (BKK · CNX · HKT) | Branches |
| 04 | 2 | ห้องพัก 15 ห้อง · บริการเสริม 7 อย่าง · สมาชิก 4 ระดับ | Room Types · Room Rates · Branch Services · Member Tiers |
| 05 | 2 | ภาพห้อง 10 แบบ (สาขา × ประเภท) — ภาพ AI ชุดเดียวกับ Gallery | Rooms › คลิกห้อง › Gallery |
| 06 | 3 | 7 ระบบย่อย 24 เมนู | เมนูซ้าย · staff.bkk เห็นเมนูน้อยกว่า |
| 07 | 3 | Tech stack + โลโก้ · Docker รันเฉพาะ PostgreSQL | terminal `docker ps` · `npm run dev` |
| 08 | 3 | UI → API → DB | login OWNER · Dashboard |
| 09 | 4 | จุดบอดที่ระบบปิดได้ (7 ข้อ) | — |
| 10 | 4 | จุดบอดที่ยังเหลือ (6 ข้อ) | — |
| 11 | 5 | 7 โมดูล ตั้งค่า → จอง → ตามมา | เมนูซ้าย |
| 12–13 | 5 | ERD เต็ม · ความสัมพันธ์ 6 แบบ | — |
| 14 | 5 | BRANCH แม่ของ 7 ตาราง · R3 | header เลือก BKK · Branches › BKK |
| 15 | 5 | ROLE ↔ PERMISSION · owner = EMPLOYEE | Roles & Permissions · staff.bkk → `/branches` 403 |
| 16 | 5 | ห้อง · ราคา (สาขา, ประเภท, ช่วงวัน) · R1 | Rooms › BKK 301 · Room rates |
| 17 | 5 | BOOKING และตารางลูก | Bookings › BK-0001 |
| 18 | 5 | SERVICE ตัวเดียว 4 ความสัมพันธ์ · R5/R6 | Service orders · Skills |
| 19 | 5 | ตารางเวร · actor FK 10 เส้น | Schedules · Attendance |
| 20 | 5 | 1NF–3NF + snapshot/stored totals | BK-0001 ยอดรวม 4 ช่อง |
| 21 | 5 | กฎที่ FK บังคับไม่ได้ · race condition | Availability (BKK, 14 คืน) → + → Create booking |
| 22 | 5 | ทั้ง 31 ตารางอยู่หน้าไหนของเว็บ (จาก `app/lib/nav.ts`) | Bookings › BK-0001 |
| 23 | — | สรุปตัวเลข · ถามตอบ | terminal `npm run db:test` |

บทพูดทีละสไลด์ + รายการภาพหน้าจอสำรอง: [[presentation-script]]

## Mock หน้าจองฝั่งลูกค้า (artifact ของเพื่อน)

https://claude.ai/artifact/3wLPnvGvVwK75RUbfWCd7L — **ไม่ได้อยู่ใน git และไม่ได้เชื่อมกับโปรเจกต์** (ตรวจทุก branch + origin 2026-10-23)
- เป็น HTML/JS ไฟล์เดียว copy ข้อมูล seed มาเป็นค่าคงที่ใน JS (สาขา เรท โปร tier, BK-0001) ไม่มี fetch/API — ตัวหน้าเองเขียนว่า “ยังไม่เชื่อมฐานข้อมูล”
- schema รองรับการจองจากลูกค้าแล้ว: `booking.created_by_emp_id` NULL = ลูกค้าจองเอง, `booking_channel = 'WEBSITE'`, `customer.password_hash` (NULL = walk-in)
- ที่ยังขาดถ้าจะทำจริง: route ฝั่งลูกค้านอก portal, customer login (ADR-004 เป็น staff เท่านั้น), API ลูกค้า (ค้นห้องว่าง / จอง / การจองของฉัน) ที่ไม่ใช้ staff permission และ `withTx` แบบไม่มีพนักงาน, เขียนใหม่ด้วย antd ตาม [[ui-standard]]
- ตอนพรีเซนต์: พูดเป็น “ต่อยอด” (สไลด์ 14) — อย่าเดโมเป็นของที่ใช้งานได้จริง

## คำตอบสั้นเมื่ออาจารย์ถาม

- **กันจองชนอย่างไร:** UI query ใช้ overlap เดียวกับ R3 แต่ database trigger เป็นตัวตัดสินสุดท้าย จึงกัน race condition ได้
- **กันข้ามสาขาอย่างไร:** ทุก repository รับ `branchScope`; query filter ขยาย scope ของ session ไม่ได้ และ header override ใช้ได้เฉพาะ chain-level session
- **ยอดเงินคำนวณที่ไหน:** trigger คำนวณ room/service/discount/grand total; app ไม่เขียน stored totals เอง
- **audit อยู่ไหน:** booking status trigger เขียน `booking_status_log` พร้อม employee จาก transaction setting
- **ทำไม raw SQL:** วิชา Advanced Database ต้องโชว์ constraints, triggers, views, transactions และ query plan ได้ชัดเจน
