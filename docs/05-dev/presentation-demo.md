---
tags: [dev, demo, presentation]
updated: 2026-10-18
---

# Presentation demo

## เตรียมก่อนพรีเซนต์

1. เปิด Docker Desktop แล้วรัน `npm run db:up`
2. รัน `npm run db:reset` เพื่อให้วันที่และข้อมูลกลับสู่ demo seed
3. รัน `npm run db:test` และเก็บหน้าจอผล `57 passed`
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
9. **Database highlight** — เปิด ERD/SQL สั้น ๆ: 31 tables, 49 FKs, 44 triggers, 3 views, R1–R22, tests 57/57
10. **Role security** — sign out แล้ว login `staff.bkk@hotel.local`; เปิด URL `/branches` เพื่อแสดง 403 และอธิบายว่า API ก็คืน 403

## คำตอบสั้นเมื่ออาจารย์ถาม

- **กันจองชนอย่างไร:** UI query ใช้ overlap เดียวกับ R3 แต่ database trigger เป็นตัวตัดสินสุดท้าย จึงกัน race condition ได้
- **กันข้ามสาขาอย่างไร:** ทุก repository รับ `branchScope`; query filter ขยาย scope ของ session ไม่ได้ และ header override ใช้ได้เฉพาะ chain-level session
- **ยอดเงินคำนวณที่ไหน:** trigger คำนวณ room/service/discount/grand total; app ไม่เขียน stored totals เอง
- **audit อยู่ไหน:** booking status trigger เขียน `booking_status_log` พร้อม employee จาก transaction setting
- **ทำไม raw SQL:** วิชา Advanced Database ต้องโชว์ constraints, triggers, views, transactions และ query plan ได้ชัดเจน
