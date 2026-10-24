---
tags: [handoff]
date: 2026-10-24
---

# Session log 2026-10-24

## Git publish requested — Codex

- User explicitly authorized committing and pushing the current project changes to Git.
- Destination: `origin/main` (`riwjung/Hotel_Project`); fetched remote and verified no divergence before committing.
- Included portal/login styling, dashboard photos, room galleries and photo picker, colored amenity icons, the guest-count lower-bound fix, optimized images, and project documentation.
- Kept unused `public/images/rooms/Gemini_Generated_Image_*.jpg` source images local (about 49 MB); application and seed use the renamed web images. No environment files included.
- Latest code validation in this session: typecheck/lint passed; build passed on retry with the existing Next.js security reminder. DB test fixture failure and unavailable browser QA remain documented above; this publish does not claim those checks passed.

## Manager booking branch selector — Codex

- User asked why Create booking has no Select a branch for a Manager.
- Verified in `BookingCreatePage`: the branch selector renders only for CHAIN scope with no selected working branch. Branch-scoped Manager/Staff use their assigned branch automatically; an Owner with a working branch selected also does not need the form selector.
- Verified server-side: booking creation uses `resolveBranch(scope, input.branchId)`, prioritizing session scope. No permissions, booking data, or application code changed; this was a read-only explanation of current behavior.

## Check-in blocked on booking 35 — Codex

- User reported `Every booked room must be Available before check-in` on `/bookings/35`.
- Read-only API inspection: BK-0016 is Confirmed, BKK room 301, stay 2026-10-24 to 2026-10-26. Room 301 is still Occupied by BK-0003 (`/bookings/3`), which remains Checked in with no actual check-out, planned check-out 2026-10-18 and outstanding balance 9,280.
- `checkInBooking` correctly rejects any booked room whose current status is not Available. Planned check-out dates do not automatically check guests out or release rooms.
- Normal resolution: reconcile the previous booking's payment/stay, complete check-out when appropriate, finish and verify housekeeping, then retry BK-0016. No booking, payment, room status, or business rule was modified.
- Verified using booking-list/detail, room-list and housekeeping APIs; no code changes or tests needed for this diagnosis.

## Amenities icons across room tables — Codex

### ทำแล้ว
- Added shared `AmenityTag` using the existing Ant Design icon registry, preserving amenity names and room-type notes. Missing/unknown icons keep the text label.
- Follow-up: colored the shared icon registry (blue connectivity, teal comfort/bathroom, purple entertainment, brown food/drink, green nature, gold services, terracotta warmth). Tables, detail tags, room-type checkboxes and the icon picker all reuse the same colors; text labels remain visible. Typecheck and lint passed after the color change; build passed on retry with the existing Next.js security reminder. Visual browser QA remains unavailable.
- Rooms now has a sortable Amenities column; Room types and room detail show the configured icons beside each amenity name.
- Amenities master table shows an actual icon preview with an accessible label and tooltip instead of only a component name.
- Room queries aggregate amenities (including `icon`) for both list and detail, avoiding the old separate detail query. No schema, business-rule, or data changes. Preserved the concurrent room-image picker work.

### Verify (ผลจริง)
| Check | Result |
|---|---|
| `npm run typecheck` / `npm run lint` | Passed |
| Room API | All 17 room rows checked against room-type assignments and amenity master icons/names |
| `npm run build` | Passed on retry (71 static pages); first attempt stopped after generation with the existing Next.js security upgrade reminder, which remains a warning on retry |
| Room detail API | Amenities match the list for every room type; gallery response preserved |
| Room types | ID/name ordering verified for icon lookup |
| Staff scope | BKK staff with HKT query/header still receives only BKK rooms with amenities |
| Browser QA | No connected browser; visual layout and console remain unverified |
| DB business-rule suite | Not rerun: no business-rule changes; existing completed-service cancellation fixture failure is recorded under the dashboard session above |

### ต่อไป
- [ ] Check table wrapping, icon appearance, and room detail at desktop / 375px when a browser is connected.

## Bug: check-in BK-0013 ไม่ได้ — "Enter exactly 1 guest(s) for this booking"

### อาการ
- `/bookings/27` (BK-0013) กด Check in แล้วได้ 422 `GUEST_COUNT` ทุกครั้ง แม้ใส่ชื่อเหมือนกันทั้งสองห้อง

### Root cause
- BK-0013 มี `guest_count = 1` แต่จอง 2 ห้อง (101, 102 Deluxe)
- Check-in บังคับ primary guest ห้องละ 1 คน (zod `min(1)` + `is_primary` ห้องละคน) → ต้องกรอกอย่างน้อย 2 คน
  แต่ `checkInBooking` บังคับให้รวม = `guest_count` = 1 พอดี → ไม่มี input ไหนผ่าน
- R11b ตรวจแค่ขาบน (`guest_count ≤ Σ capacity`) ฟอร์ม Create booking เลยรับ 1 คน 2 ห้องได้

### แก้
- R11b ขยายเป็น **จำนวนห้อง ≤ `guest_count` ≤ Σ capacity** ใน `fn_assert_booking_capacity` (`080_business_rules.sql`)
  — ใช้ deferred constraint trigger เดิม จึงตรวจตอน COMMIT และ R11c ที่เรียกฟังก์ชันเดียวกันได้ผลด้วย
- เทสต์ใหม่ใน `db/tests/business_rules.test.sql`: ลด BK-T006 (2 ห้อง) เหลือ 1 คน → ถูกปฏิเสธ
- `BookingCreatePage`: Alert เตือน + กันกด submit เมื่อแขกน้อยกว่าห้อง (แบบเดียวกับ over capacity)
- DB ที่ใช้อยู่: apply ฟังก์ชันด้วย `CREATE OR REPLACE` (ไม่ได้ `db:reset`) และแก้ข้อมูล BK-0013 เป็น `guest_count = 2`
  (ราคาไม่ขึ้นกับจำนวนแขก — `grand_total` 6,300 เท่าเดิม) — ไม่มี booking อื่นที่แขกน้อยกว่าห้อง

### Verify (ผลจริง)
| ตรวจอะไร | ผล |
|---|---|
| เทสต์ใหม่ก่อนแก้ (DB scratch `hotel_advdb_verify`) | FAIL: 1 guest across two rooms was accepted |
| `db-reset` + `db-test` หลังแก้ (DB scratch) | 31 ตาราง / 49 FK ✓, **58 passed** |
| Check-in BK-0013 แบบ dry-run (BEGIN … ROLLBACK บน DB จริง) | trigger ทั้งหมดผ่าน |
| `npm run typecheck`, eslint ไฟล์ที่แก้ | ผ่าน |
| Browser QA modal check-in / ฟอร์ม create | ยังไม่ได้ตรวจใน browser |

### ต่อไป
- [ ] Check in BK-0013 จริงจากหน้า `/bookings/27` (ใส่ 2 ชื่อ ห้องละคน — ชื่อซ้ำกันได้)
- [ ] ตรวจ Alert ใหม่บน `/bookings/new` (เลือก 2 ห้อง, Guests = 1) และ console

## Deck: 5 หัวข้อหลัก — Claude

### เป้าหมาย
- ผู้ใช้ขอให้ deck มี 5 หัวข้อหลัก: ที่ตั้ง · ลักษณะโรงแรมและบริการ · ระบบที่มี · จุดบอด · ER Diagram ที่เชื่อมกับหน้าเว็บ

### ทำแล้ว
- Deck https://claude.ai/artifact/A8UH78g1SnkrsFNGnbxdkM ขยายจาก 14 เป็น 21 หน้า; สไลด์ใหม่: agenda, location (ใช้ `public/images/Bottom.png`), hotel, systems, blindspots, limits, web-map
- สไลด์เดิมเลขหน้า /21 และ eyebrow บอกหัวข้อ; สไลด์สรุปเปลี่ยน 57/57 → 58/58 ตามเทสต์ R11b ใหม่
- อัปเดต [[presentation-script]] (สร้างจาก speaker notes ทั้ง 21 หน้า), ตาราง mapping ใน [[presentation-demo]] และเลขสไลด์ใน `docs/05-dev/demo-backup/capture-plan.txt`

### Verify (ผลจริง)
| ตรวจอะไร | ผล |
|---|---|
| ตัวเลขสาขา/ห้อง/บริการ/เรท | ตาม seed (สิ่งที่เว็บแสดงหลัง `db:reset`): 15 ห้อง (BKK 7 · CNX 4 · HKT 4), พนักงาน 4/2/2 + owner, บริการ 7 อย่าง 4 หมวด, เรท 10 แถว — รอบแรกใช้ตัวเลขจาก DB ที่รันอยู่ (16 ห้อง) แล้วแก้สไลด์ 02–04, 08 ให้ตรง seed |
| ER → หน้าเว็บ | ตรงกับ field `tables` ใน `app/lib/nav.ts` + `room_image` ในหน้า room detail = 31 ตาราง |
| หน้าตาสไลด์ | ยังไม่ได้เปิดดู render จริง |

### พบระหว่างทำ
- DB ที่รันอยู่มีห้องทดสอบ CNX 301 "VIP Room" (Suite) ที่เพิ่มผ่านหน้า Rooms — ไม่อยู่ใน seed และ CNX ไม่มีเรท Suite จึงจองไม่ได้ ใช้เป็นตัวอย่าง “ข้อมูลไม่ครบ ระบบไม่เตือน” ในสไลด์ limits
- รูป ERD (`hotel-erd-full-schema.png`) ยังไม่มีคอลัมน์ `booking.member_discount_rate` (ADR-006)

### ต่อไป
- [ ] เปิด deck ตรวจ layout หน้าใหม่ 02–08 และ 20 (ตาราง/การ์ดภาษาไทย)
- [ ] ตรวจว่าไม่มีการแก้ใน page ของ agenda / location / hotel / limits หายไป (publish ทับ 4 ไฟล์นี้หลังมีการ save จาก page; ไฟล์อื่นตรวจแล้วมีแค่ cover ที่แก้ และยังอยู่)

## Login background + room image prompts — Claude

### ทำแล้ว
- `/login` ใช้ `public/images/WebHotelBG.png` เป็นพื้นหลังเต็มจอผ่าน `next/image` (`fill`, `loading="eager"` — Next 16 เลิกใช้ `priority`) แบบเดียวกับ `PortalShell`; พื้นสำรองเปลี่ยนเป็น `var(--ivory)`
- การ์ด login เพิ่มเงาทองอ่อนให้แยกจากพื้นงาช้าง
- prompt gen รูปห้องสำหรับ Gallery: [[room-image-prompts]] — 10 ชุด (สาขา × ประเภท) พร้อมชื่อไฟล์

### Verify (ผลจริง)
| ตรวจอะไร | ผล |
|---|---|
| `npm run typecheck` | ผ่าน |
| eslint `app/login/page.tsx`, `LoginForm.tsx` | ผ่าน |
| `GET /login` บน dev server | 200, HTML อ้าง `WebHotelBG.png`; image optimizer ตอบ 200 image/png |
| ดูหน้าจอจริงใน browser (desktop/มือถือ) | ยังไม่ได้ตรวจ |

### ต่อไป
- [x] gen รูปตาม [[room-image-prompts]] วางที่ `public/images/rooms/` แล้วเพิ่มแถว `room_image` ใน seed (ดูหัวข้อถัดไป)

## Room photos in gallery + deck tech stack — Claude

### ทำแล้ว
- รูป Gemini 16 รูป (เรียงตามเวลาดาวน์โหลด = ลำดับ prompt) ตรวจด้วยตาว่าตรงกับ prompt ไหน แล้วทำสำเนาขนาดเว็บ (1600 px, ~200 KB) ตั้งชื่อตาม [[room-image-prompts]]; ต้นฉบับยังอยู่ ไม่ได้ลบ
- `db/seed/110_demo.sql`: `room_image` จาก 3 แถว SVG เป็น 32 แถวจริง ครบ 15 ห้อง (ปกห้องละ 1) และ apply แถวเดียวกันลง DB ที่รันอยู่ (ห้อง 1–15 ใน transaction เดียว) — ไม่ได้ `db:reset`
- Deck 23 หน้า: เพิ่ม 05 “ห้องแต่ละแบบ ในแต่ละสาขา” (รูปปก 10 ชุด ระบุว่าเป็นภาพ AI) และ 07 “Tech stack และสิ่งที่รันใน Docker” (โลโก้ Simple Icons CC0 แบบ inline SVG) · เลขหน้าทั้งหมดเป็น /23 · อัปเดต script, demo mapping, capture plan

### Verify (ผลจริง)
| ตรวจอะไร | ผล |
|---|---|
| seed ใหม่บน DB scratch `hotel_advdb_verify` (`db-reset.mjs`) | 31 ตาราง / 49 FK ✓, `room_image` 32 แถว ปก 15 |
| DB ที่รันอยู่ | 32 แถว · 15 ห้อง · ปก 15 |
| ไฟล์รูปผ่าน dev server | `/images/rooms/*.jpg` ตอบ 200 image/jpeg |
| Tech stack บนสไลด์ | ตรง `package.json` (Next 16.4, React 19.3, antd 6.6, zod 4, jose, bcryptjs, pg), Node 20.12, PostgreSQL 17.11, `docker-compose.yml` มีแค่ service `db` |
| หน้าตา Gallery / สไลด์ใน browser | ยังไม่ได้ตรวจ |

### ต่อไป
- [ ] gen `hkt-ste-living` และรูป view ถ้าต้องการ
- [ ] ตัดสินใจเรื่องไฟล์ต้นฉบับ `Gemini_Generated_Image_*.jpg` (~49 MB ใน `public/`) ก่อน commit

## Dashboard branch photo slideshow — Codex

### เป้าหมาย / ทำแล้ว
- Added `BranchPhotoCarousel` directly below Today on `/dashboard`: Ant Design Carousel, autoplay every 5 seconds, previous/next arrows, pause/play, photo counter, branch name and caption.
- Uses existing `room_image` galleries through `/api/dashboard`; deduplicates repeated image URLs within each branch. The query applies the same server-side scope as dashboard metrics, including the header working-branch selection.
- All branches combines the scoped galleries; branches without photos show an explicit empty state. Loading and failed-image fallback are handled. Layout has mobile-specific caption spacing.
- Preserved existing uncommitted dashboard styling and other work. No schema/data changes, commits, or pushes.

### Verify (ผลจริง)
| Check | Result |
|---|---|
| `npm run typecheck` / `npm run lint` | Passed |
| `npm run build` | Passed on retry, 70 static pages. First run compiled and generated pages but stopped with a Next.js security upgrade reminder; retry retained the warning and exited 0. Dependency upgrade is outside this change |
| Dashboard API, owner | 19 photos total; BKK 10, CNX 4, HKT 5; selected branches contain only their photos; no duplicate URLs within a branch |
| Dashboard API, staff BKK with forged HKT header | Only BKK photos returned |
| Unknown branch | Empty photos, no unrelated fallback gallery |
| Gallery image URLs | Every unique URL returned HTTP 200 with image content type |
| `npm run db:test` on current DB | 19 passed, then existing totals test attempts to cancel completed service order 2 and fails: `A completed order cannot move to cancelled`; runner rolls back |
| Browser QA | Unavailable: Browser runtime reported no connected browsers. Autoplay, arrow interaction, mobile overflow, and console not visually verified |

### เบี่ยงจากแผน / ต่อไป
- Uses existing room photos because these are the branch-linked images currently available.
- [ ] Verify slideshow interactions and layout at desktop / 375px when a browser is connected.
- [ ] Separately reconcile the DB test fixture for service order 2 with its completed status.
- [ ] Review the Next.js security upgrade reminder separately.

## Dashboard photos → small postcard + deck cover logo — Claude

### ทำแล้ว
- ผู้ใช้ขอให้ slideshow บน Dashboard เล็กลง เข้ากับธีม และเป็นแค่ลูกเล่นไม่เด่น: เปลี่ยน `BranchPhotoCarousel` จาก hero เต็มกว้าง (240–360px, ลูกศร, ตัวนับ, caption ดำ) เป็น “postcard” กรอบงาช้างข้างการ์ดตัวเลข (≥ 992px: การ์ด 3 × 2 + รูป 220–290px) · fade ทุก 6 วินาที · caption บรรทัดเดียว · เหลือปุ่ม pause เล็กปุ่มเดียว · หยุดเองเมื่อ `prefers-reduced-motion` · ซ่อนใต้ 992px
- รูปใช้ `next/image` (`sizes="320px"`) → ~11 KB ต่อรูป แทนไฟล์ 1600px; URL ที่ไม่ใช่ local เป็น `unoptimized`
- `dashboard.repo.ts`: ดึงเฉพาะรูปปก (ไม่เอารูปห้องน้ำซ้ำทุกสาขา) และเรียงสลับสาขาให้รูปติดกันไม่ซ้ำแบบ
- Deck หน้าปก: พื้นหลัง `WebHotelBG.png` + โลโก้ Sand & Sky (BrandMark เป็น inline SVG) + wordmark ฟอนต์ Marcellus; เปลี่ยนหน้าปกจากพื้นกรมท่าเป็นโทนงาช้าง ข้อความชื่อ/รหัสนักศึกษาของผู้ใช้คงเดิม

### Verify (ผลจริง)
| ตรวจอะไร | ผล |
|---|---|
| `npm run typecheck`, eslint `dashboard/` + `dashboard.repo.ts` | ผ่าน |
| `/api/dashboard` (owner, All branches) | 12 รูปปก ไม่ซ้ำ เรียง BKK → CNX → HKT สลับกัน |
| `/_next/image` ของรูปห้อง w=384 | 200 image/jpeg ~11 KB |
| `GET /dashboard` | 200 |
| หน้าตา postcard / fade / หน้าปกสไลด์ใน browser | ยังไม่ได้ตรวจ (ไม่มี browser) |

## Room modal: เลือกรูป gallery จากรูปที่มีอยู่ — Claude

### ทำแล้ว
- `GET /api/room-images` (`ROOM_MANAGE`): รูปที่อยู่ใน `room_image` ของห้องใน branch scope (owner เห็นทุกสาขา) + caption + ป้าย “BKK · Deluxe”
- `RoomInput.imageUrls?` → `createRoom` / `updateRoom` แทนที่ gallery ของห้องใน transaction เดียวกัน (ลำดับ = `sort_order`, รูปแรก = ปก) · ไม่ส่ง = คงเดิม · URL ที่ไม่อยู่ใน library ของ scope → 422 `UNKNOWN_IMAGE` · ซ้ำ → 400
- `RoomImagePicker`: antd Select multiple + thumbnail ในตัวเลือก + แถบ preview (รูปแรกติด Tag “Cover”, ปุ่ม “Make cover”) · ตอนแก้ห้อง modal โหลด gallery ปัจจุบันจาก `/api/rooms/:id` ก่อน (ระหว่างโหลดไม่ส่ง `imageUrls`)
- อัปเดต [[C-rooms]]

### Verify (ผลจริง)
| ตรวจอะไร | ผล |
|---|---|
| `npm run typecheck`, eslint `room/`, `room.repo.ts`, `api/room-images` | ผ่าน |
| library: owner / manager.bkk / staff.bkk | 16 รูป / 10 รูปเฉพาะ BKK / 403 |
| สร้างห้องทดสอบ T99 พร้อม 2 รูป → reorder + เพิ่มรูป → PATCH ไม่ส่งรูป | ปกตามรูปแรก · caption มาจาก library · gallery คงเดิมเมื่อไม่ส่ง |
| รูปที่ไม่มีใน library / รูปซ้ำ / manager.bkk ใช้รูป HKT | 422 / 400 / 422 และ gallery ไม่เปลี่ยน (rollback) |
| ลบห้องทดสอบ | 200 · `room_image` กลับเป็น 32 แถว (ON DELETE CASCADE) |
| หน้าตา modal ใน browser | ยังไม่ได้ตรวจ |
