---
tags: [module]
module: C
status: in-progress
---

# C · ห้องพัก

**ตาราง:** `room_type` · `amenity` · `room_type_amenity` · `room` · `room_image` · `room_rate`
**DDL:** `db/schema/030_c_rooms.sql` · **Rules:** R1 rate ห้ามทับช่วง (EXCLUDE gist) — [[physical-design]]

- amenities แยกเป็น M:N `room_type_amenity` (แก้ 1NF จากร่างเดิม)
- `room(branch_id, room_number)` UNIQUE — เลขห้องซ้ำได้ข้ามสาขา

## หน้าจอ
| path | สถานะ | permission |
|---|---|---|
| `/rooms` | ✅ read-only list + filter สาขา/สถานะ + legend | `ROOM_VIEW` |
| `/room-types` | ⏳ | `ROOM_VIEW` / `ROOM_MANAGE` |
| `/amenities` | ⏳ | `ROOM_VIEW` / `ROOM_MANAGE` |
| `/room-rates` | ⏳ | `RATE_MANAGE` |

## API
| method | path | สถานะ |
|---|---|---|
| GET | `/api/rooms?branchId=&status=` | ✅ (branch scope บังคับฝั่ง server) |

## Backlog
- [ ] Rooms: create/edit, เปลี่ยนสถานะด่วน (AVAILABLE ↔ CLEANING ↔ MAINTENANCE)
- [ ] Room detail: Descriptions + gallery (`room_image`, cover 1 รูป)
- [ ] Room types + amenity picker (checkbox → `room_type_amenity`)
- [ ] Room rates: timeline ต่อ (branch, type) — แสดง error 23P01 "This period overlaps an existing one"
- [ ] หน้าตารางห้องว่าง (availability grid ห้อง × วัน) ← ใช้ร่วมกับ [[D-booking]]
