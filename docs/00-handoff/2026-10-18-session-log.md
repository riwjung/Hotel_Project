---
tags: [handoff]
date: 2026-10-18
---

# Session log 2026-10-18

## เป้าหมาย
ผู้ใช้: "ทำส่วนต่อไปให้เรียบร้อย อยากให้เสร็จ แล้วค่อยไปไล่ trace ทีหลัง" → ทำ 18 เมนูที่เหลือให้ครบตาม
[[2026-10-18-plan-remaining-modules]] (รวมการได้แต้มตอน check-out ที่เสนอไว้เมื่อวาน)

## ทำแล้ว — 6 branch ซ้อนต่อจาก `feature/member-tier-rules` (commit ในเครื่อง ยังไม่ push)
| ลำดับ | branch | โมดูล | หน้าจอ | กฎใน DB |
|---|---|---|---|---|
| 5 | `feature/maintenance` | F | `/maintenance` + dashboard ลิงก์ไปหน้าที่เกี่ยว | R15 ห้องที่มีงานซ่อมค้าง = MAINTENANCE · R16 คนที่ถูก assign อยู่สาขาเดียวกัน |
| 6 | `feature/finance-cx` | G | `/payments` (+ refund ในหน้า booking), `/promotions`, `/member-tiers`, `/reviews` | R14 ได้แต้มตอน check-out (1/฿100) · R17 ยอดชำระ/คืนเงินไม่เกิน · R18 ล็อกเงื่อนไข promotion ที่ถูกใช้ |
| 7 | `feature/rooms-setup` | C | `/rooms` CRUD + เปลี่ยนสถานะ, `/room-types`, `/amenities`, `/room-rates` | R11c ลด capacity ใต้ stay ที่ active ไม่ได้ · R3d เปลี่ยน type ห้องที่มี booking ไม่ได้ |
| 8 | `feature/services` | E | `/services`, `/branch-services`, `/service-orders` (+ สั่งจากหน้า booking), `/assignments`, `/skills` | R19 workflow order + ต้องมีคนรับก่อนเริ่ม + assignment ตาม order |
| 9 | `feature/org-access` | A | `/employees`, `/roles` | R2b หัวหน้าสาขาเดียวกัน · R20 ต้องมีคนจัดการสิทธิ์ได้เสมอ |
| 10 | `feature/workforce` | B | `/shifts`, `/schedules`, `/attendance` + รายงานรายเดือน | R21 กะห้ามทับ (tsrange) · R22 สถานะลงเวลาจากเวลาจริง · view `v_attendance_monthly` |

ของกลางที่ย้ายขึ้นมา (กติกา "ครั้งที่ 3"): `useCrudEditor`, `BranchFilter` / `useBranchOptions`, `parseQuery`,
`requireChainScope`, `GET /api/employees/options`, ข้อความ error ตามชื่อ constraint (unique / EXCLUDE / CHECK) — ดู [[project-structure]]

### การตัดสินใจระหว่างทาง (ไม่ได้ถาม — เลือกค่าที่ระวังที่สุด)
- **ข้อมูลกลางของทั้งเครือ** (room type, amenity, service catalog) แก้ได้เฉพาะ account ระดับเครือ แม้ผู้จัดการสาขาจะมี permission
  — เช็ค scope ไม่ใช่ role (`requireChainScope`)
- **ไม่มีลบพนักงาน** — booking/งาน/log อ้างถึง → ใช้ RESIGNED; ให้ role ได้เฉพาะ role ที่สิทธิ์ ⊆ สิทธิ์ของผู้ให้ (กัน privilege escalation)
- **รีวิว**: ตาราง `review` ไม่มีคอลัมน์ข้อความตอบกลับ → "ตอบ" = บันทึกผู้ดูแล (`reply_by_emp_id`) ตอน publish/hide; เพิ่มคอลัมน์ต้องถามผู้ใช้
- **คืนเงิน** เป็นระดับ booking (ER ไม่มีลิงก์ refund → payment เดิม)
- **แต้ม**: 1 แต้ม / ฿100 ของ grand_total ตอน check-out ตามที่เสนอเมื่อวาน — แก้ที่ `fn_points_for_amount()` จุดเดียว

## Verify (ผลจริง)
| ตรวจอะไร | ผล |
|---|---|
| `npm run db:reset` | 31 tables, 49 FKs, 44 triggers, 3 views |
| `npm run db:test` | 57/57 |
| typecheck / lint / build | ผ่านทั้งหมด; Next build สร้าง 69 pages (เดิม 66, เพิ่ม detail 2 หน้า + options API) |
| Headless Chrome — regression ก่อน availability/detail/switcher | 11 suites, 436 checks ผ่าน |
| QA รอบปัจจุบัน | HTTP/API ผ่าน; browser runtime ไม่มี instance เชื่อมต่อ จึงยังไม่ได้ rerun visual/console/375px หลังเพิ่ม 4 งานล่าสุด |

Suite ของรอบนี้ (ผ่านครบทุกข้อก่อน commit แต่ละ branch): maintenance 20 · finance 40 · rooms-setup 36 · services 48 (+ skill matrix 3)
· org 30 · workforce 26 · smoke 24 เมนู × 3 role (403 สำหรับ role ที่ไม่มีสิทธิ์, ไม่มี console warning, 375px ไม่มี scroll แนวนอน)

### Bug ที่เจอระหว่าง QA และแก้แล้ว
- `inconsistent types deduced for parameter` — parameter เดียวใช้ทั้ง `SET … = $3` และ `$3 = '…'` → cast `$3::varchar`
- ตาราง service orders ไม่แสดงหมายเหตุของ order (เช่น "Flight TG 622, 3 bags") → เพิ่มคอลัมน์ Note
- ข้อความ R21 อ่านไม่รู้เรื่อง → "The employee already works the Evening shift on 18 Oct — shifts may not overlap"
- dev server เสิร์ฟ `employee.repo.ts` เวอร์ชันเก่าหลังเขียนไฟล์ทับ (export ใหม่ = undefined) → restart `npm run dev`

## เบี่ยงจากแผน / ข้อสังเกต
- `alias` ใน SQL ห้ามใช้คำสงวน (`from`, `to`) โดยไม่ใส่ `"…"`
- สคริปต์ QA (puppeteer-core) อยู่ใน scratchpad ไม่ได้อยู่ใน repo — `run-all.sh` รันทุก suite จาก DB ที่ reset ใหม่

## ต่อไป
- [ ] B (เพื่อน) trace / review ทีละ branch ด้วย [[page-api-table-map]] แล้ว merge: `git checkout main && git merge --ff-only feature/workforce` (ได้ครบทั้ง 10 branch)
- [ ] อัปเดตรูป ERD: `booking.member_discount_rate` (ADR-006) — นอกนั้นไม่มีตาราง/คอลัมน์ใหม่
- [ ] ตัดสินใจ: แนบสลิป (ที่เก็บไฟล์), ข้อความตอบรีวิว (เพิ่มคอลัมน์), เว็บฝั่งลูกค้า
- [x] Availability grid ห้อง × คืน, branch detail, OWNER header branch switcher, room detail/gallery — 2026-10-18
- [ ] 24 ต.ค.: `npm run db:reset` แล้วซ้อมเดโม + เก็บ screenshot สำรอง

## งานต่อท้ายรอบ 2026-10-18 (Codex)

- `/availability`: grid ห้อง × คืน 7/14/30 คืน, แถบ booking, free-room count, ปุ่ม `+` prefill หน้า create booking
- `/branches/[id]`: Descriptions + จำนวนห้อง/พนักงาน/active booking
- `/rooms/[id]`: Descriptions + rate ปัจจุบัน + amenities + `room_image` gallery; เพิ่ม SVG demo assets จริงและ fallback ใน `public/images/rooms`
- Header OWNER: working-branch switcher ส่ง `X-Hotel-Branch-Id`; `route()` สร้าง effective request scope โดยไม่แก้ JWT; branch-scoped user ปลอม header ข้ามสาขาไม่ได้
- อัปเดต [[A-org-access]], [[C-rooms]], [[D-booking]], [[page-api-table-map]], [[presentation-demo]] และ Home

### QA ต่อท้าย (ผลจริง)

- `npm run typecheck`, `npm run lint`, `npm run build` ผ่าน; build 69 pages
- `npm run db:reset`: 31 tables / 49 FKs / 44 triggers / 3 views / 318 seed rows
- `npm run db:test`: 57/57
- HTTP integration: OWNER all branches = 3; เลือก BKK = 1; BKK grid = 7 rooms; room 301 = 2 images / 8 amenities / ฿4,500 current rate; BKK scope เปิด HKT room = 404; manager BKK ปลอม header HKT ยังได้ 7 ห้อง BKK เท่านั้น
