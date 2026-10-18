---
tags: [module]
module: C
status: done
---

# C · ห้องพัก

**ตาราง:** `room_type` · `amenity` · `room_type_amenity` · `room` · `room_image` · `room_rate`
**DDL:** `db/schema/030_c_rooms.sql` · **Rules:** R1 rate ห้ามทับช่วง (EXCLUDE gist) — [[physical-design]]

- amenities แยกเป็น M:N `room_type_amenity` (แก้ 1NF จากร่างเดิม)
- `room(branch_id, room_number)` UNIQUE — เลขห้องซ้ำได้ข้ามสาขา

## หน้าจอ
| path | สถานะ | permission |
|---|---|---|
| `/rooms` | ✅ list + filter + legend, สร้าง/แก้/ลบห้อง, เปลี่ยนสถานะด่วน | `ROOM_VIEW` / `ROOM_MANAGE` |
| `/room-types` | ✅ CRUD + เลือก amenity (M:N) — แก้ได้เฉพาะ account ระดับเครือ | `ROOM_VIEW` / `ROOM_MANAGE` |
| `/amenities` | ✅ CRUD + icon — แก้ได้เฉพาะ account ระดับเครือ | `ROOM_VIEW` / `ROOM_MANAGE` |
| `/room-rates` | ✅ CRUD ต่อสาขา, ป้าย "In use today", ช่วงทับ → 409 (R1) | `RATE_MANAGE` |

## API
| method | path | สถานะ |
|---|---|---|
| GET | `/api/rooms?branchId=&status=` | ✅ (branch scope บังคับฝั่ง server) |

## Backlog
- [x] Rooms: create/edit/delete, เปลี่ยนสถานะด่วน (ห้ามตั้ง/ปลด OCCUPIED เอง; ห้องที่ซ่อมค้างยัง MAINTENANCE ตาม R15; เปลี่ยน type ระหว่างมี booking ไม่ได้ R3d) — 2026-10-18
- [ ] Room detail: Descriptions + gallery (`room_image`, cover 1 รูป)
- [x] Room types + amenity picker (checkbox → `room_type_amenity`, โน้ตเดิมยังอยู่); ลด capacity ใต้ stay ที่ active ไม่ได้ (R11c)
- [x] Room rates: ตารางต่อ (branch, type) เรียงตามวัน + ป้าย "In use today"; ช่วงทับ → 409 "overlaps another active rate …" (R1)
- [ ] หน้าตารางห้องว่าง (availability grid ห้อง × วัน) ← ใช้ร่วมกับ [[D-booking]]
