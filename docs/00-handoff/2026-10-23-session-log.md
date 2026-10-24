---
tags: [handoff]
date: 2026-10-23
---

# Session log 2026-10-23

## เป้าหมาย
- ทำสไลด์พรีเซนต์ใหม่ที่สั้นกว่าเดิม เน้นความสัมพันธ์ของ DB และใช้คู่กับการเปิดเว็บสด
- ตรวจว่า mock หน้าจองฝั่งลูกค้าของเพื่อนเชื่อมกับโปรเจกต์หรือไม่

## ทำแล้ว
- Deck ใหม่ 14 หน้า: https://claude.ai/artifact/A8UH78g1SnkrsFNGnbxdkM — ลำดับ ภาพรวม → 7 โมดูล → ERD → ความสัมพันธ์ 6 แบบ →
  BRANCH / สิทธิ์ / ห้อง / ใบจอง / บริการ / กำลังคน (crow’s foot ทุกผัง) → normalization → กฎใน DB → สรุป
- ทุกสไลด์มี cue “เปิดเว็บ → …” และ speaker notes — ตาราง mapping อยู่ใน [[presentation-demo]]
- ตรวจ mock หน้าจอง: ไม่อยู่ใน git, เป็น static HTML ใช้ข้อมูล seed copy มา — สรุปและสิ่งที่ขาดอยู่ใน [[presentation-demo]]
- Canva MCP ยังไม่ได้ authorize ใน session นี้ จึงใช้ claude.ai Slides แทน

## Verify (ผลจริง)
| ตรวจอะไร | ผล |
|---|---|
| ตัวเลขบนสไลด์ | 49 FK (`FOREIGN KEY` ใน db/schema), 44 triggers (42 + 2 constraint), 30 permissions ใน seed, actor FK 10 เส้น, EMPLOYEE เป็นแม่ 14 FK |
| กฎที่อ้างถึง | R1, R3, R4, R5, R6, R8–R12, R17, R21, R22 ตรงกับหัวข้อใน `080_business_rules.sql` |
| หน้าตาสไลด์ | ยังไม่ได้เปิดดู render จริง — ให้ผู้ใช้เปิดตรวจ |

## เบี่ยงจากแผน
- ใช้ claude.ai Slides แทน Canva (Canva connector ต้อง authorize ที่ claude.ai ก่อน)

## ต่อไป
- [ ] เปิด deck ตรวจ layout ภาษาไทย แล้วใส่ชื่อกลุ่มแทน `[ชื่อกลุ่ม · รายชื่อสมาชิก]` ในหน้าปก
- [ ] จับภาพหน้าจอสำรองตามรายการใน [[presentation-demo]]
- [ ] Share deck ให้เพื่อนในกลุ่ม (ตอนนี้เป็น private)
- [ ] ซ้อมตามลำดับ: `db:reset` ก่อนทุกครั้งให้ BK-0001 กลับสู่ seed

## Dashboard styling — Codex

### เป้าหมาย
- เพิ่มสีการ์ด Dashboard ให้เข้าธีม Sand & Sky และเขียน prompt สำหรับภาพ background กับภาพตกแต่งใต้ตาราง

### ทำแล้ว
- การ์ด 6 ใบใช้พื้นพาสเทล เส้นสีด้านบน และพื้นรองไอคอน: arrivals sage, departures sky, in-house sand, occupancy sea, maintenance clay, housekeeping lavender
- ปรับความสูงการ์ดให้เท่ากัน พร้อม keyboard focus outline บนลิงก์ โดยใช้ Ant Design style API และ CSS Module สำหรับ grid/focus
- ส่ง prompt ภาพ 2 แบบในแชต: พื้นหลัง ivory/blue-grey และภาพ panorama ที่เชื่อมโรงแรมริมแม่น้ำ ภูเขา และทะเล ยังไม่ได้สร้างหรือติดตั้งภาพ

### Verify (ผลจริง)
- `npm run typecheck`: ผ่าน
- `npm run lint`: ผ่าน
- `npm run build`: ผ่านเมื่อรันซ้ำ (69 static pages); ครั้งแรกคอมไพล์สำเร็จแต่จบด้วย `SecurityFatalError` แจ้งช่องโหว่ Next.js 16.4.0 ครั้งที่สองยังแจ้งเตือนแต่ exit 0 — ควรติดตามอัปเกรดแยกจากงานตกแต่งนี้
- `git diff --check`: ผ่าน
- Browser QA desktop/mobile และ console: ยังไม่ได้ตรวจ เนื่องจาก Browser runtime ไม่พบ browser ที่เชื่อมต่อ (`browsers.list()` เป็นรายการว่าง)

### ต่อไป
- [x] ผู้ใช้ส่ง `public/images/WebHotelBG.png` และ `public/images/Bottom.png`; ใส่ภาพจริงใน Dashboard แล้ว
- [ ] ตรวจหน้าจอ desktop/375px และ console เมื่อ browser พร้อม

### Dashboard artwork follow-up
- ใช้ `next/image` แสดง WebHotelBG เป็นพื้นหลังเต็มพื้นที่ Dashboard และ Bottom เป็น panorama ใต้ตาราง
- ภาพด้านล่างคงสัดส่วน 2508 × 627 ตามต้นฉบับ ปรับความกว้างตามหน้าจอ และใช้ CSS mask ไล่ขอบบนให้กลืนกับพื้นหลัง
- ภาพเป็น decorative (`alt=""`), ไม่บังการคลิก และส่ง `sizes` ให้ Next.js เลือกขนาดไฟล์ตามอุปกรณ์
- Verification: `npm run typecheck`, `npm run lint`, `git diff --check` ผ่าน; `npm run build` ผ่านเมื่อรันซ้ำหลังคำเตือน security เดิมของ Next.js
- ทดสอบ production server ชั่วคราวที่ 127.0.0.1:3011: PNG ทั้งสองและ Next image optimizer ตอบ 200 / image content type ถูกต้อง; WebP ที่ความกว้าง 640px มีขนาด Bottom 10,126 bytes และ BG 6,070 bytes ปิด server ทดสอบแล้ว
- localhost:3000 ตอบ 404 สำหรับภาพระหว่างตรวจ จึงใช้ production server ของ checkout นี้แยกพอร์ตเพื่อยืนยันไฟล์ ไม่ได้เปลี่ยน server เดิม
- Browser runtime ของ session นี้ยังไม่มี browser เชื่อมต่อ จึงยังไม่ได้ตรวจ render/console จริง

### Shared portal artwork and favicon correction
- ผู้ใช้ระบุว่าต้องการ Bottom ใต้ตารางทุกหน้า (ตัวอย่าง Bookings); แก้จากภาพเฉพาะ Dashboard เป็นภาพร่วมใน `PortalShell`
- ย้ายทั้ง WebHotelBG และ Bottom ไปส่วนกลาง เอาภาพ/CSS ซ้ำออกจาก Dashboard; ภาพล่างอยู่ใน normal flow ใต้เนื้อหา ใช้ margin-top auto เติมท้ายหน้าที่เนื้อหาสั้น และสูงไม่เกิน 280px
- เพิ่ม `app/icon.svg` จาก BrandMark เดิม (sun/wave สีทองบน ivory) ปรับ stroke ให้ชัดในแท็บ และแทนที่ Next.js favicon เดิมด้วย ICO 16/32/48px ที่ render จาก SVG นี้
- ตรวจ preview favicon 256px แล้ว; Browser discovery ยังเป็นรายการว่าง จึงยังตรวจ layout/console จริงไม่ได้
- Final verification: typecheck/lint ผ่าน; build ผ่าน 70 static pages หลัง retry คำเตือนช่องโหว่ Next.js เดิม
- ตรวจ built HTML ของ Dashboard, Bookings, Branches, Rooms, Housekeeping, Maintenance: มี Bottom หนึ่งรูป, WebHotelBG หนึ่งรูป และ metadata ลิงก์ icon.svg ทุกหน้า
- Production HTTP smoke check: favicon.ico, icon.svg และ Bottom ผ่าน image optimizer ตอบ 200 และ content type ถูกต้อง; ปิด server ทดสอบ 3011 แล้ว
- `git diff --check` ผ่าน; ยังไม่ได้ตรวจ responsive layout และ console ใน browser

### Shared table palette
- ผู้ใช้ขอปรับสีทุกตารางให้ตัดกับพื้นหลังและเข้าธีมเว็บ
- ตั้ง `components.Table` ใน `app/providers.tsx` ให้ header ทรายทอง, body งาช้าง, เส้นคั่น warm beige และสี hover/selected/sort/filter/footer ใน palette เดียวกัน ใช้ร่วมทั้งตารางหลัก ตารางรายละเอียด และ modal
- เพิ่ม `app/table-theme.module.css` ผ่าน table semantic classes ของ ConfigProvider เพื่อสลับแถวฟ้าเทาอ่อน โดยยกเว้น selected/hover/sorted cells; inline availability status colors ยังมีลำดับความสำคัญสูงกว่า
- บันทึกแนวทางไว้ใน [[ui-standard]]
- Verify: typecheck/lint/diff check ผ่าน; contrast คู่ข้อความ/พื้นหลังใหม่ที่ตรวจอยู่ระหว่าง 5.53:1–12.27:1 (header 6.74:1)
- Build: ผ่าน 70 static pages หลัง retry คำเตือนช่องโหว่ Next.js เดิม; ยังไม่ได้ตรวจภาพจริงและ interaction ใน browser เพราะไม่มี browser เชื่อมต่อใน session

### Sidebar background on long pages
- ผู้ใช้พบพื้นสีเทาใต้ sidebar ในหน้าที่ยาว เช่น `/attendance`
- สาเหตุจาก desktop Sider มี `height: 100dvh` ทำให้พื้นหลังหยุดที่ความสูง viewport ขณะที่ layout ยาวตามเนื้อหา
- ปรับ Sider ให้ stretch เต็มความสูงหน้า และย้าย sticky/100dvh/overflow ไป wrapper ของเมนู พร้อมตั้งพื้น shell เป็น ivory ให้ต่อเนื่อง
- ใช้ร่วมทุกหน้าและทั้ง sidebar แบบขยาย/ย่อ; mobile ยังคงใช้ Drawer
- Verify: typecheck, lint, diff check ผ่าน; build ผ่าน 70 static pages หลัง retry คำเตือนช่องโหว่ Next.js เดิม; ยังไม่ได้ตรวจ scroll/ภาพจริงผ่าน browser เพราะไม่มี browser เชื่อมต่อ

## Demo backup capture request
- ผู้ใช้ขอ auto capture หน้าตามรายการสไลด์ 02/03/06–14 และใส่ในสไลด์สำรอง ยืนยันใช้ deck เดิม `https://claude.ai/artifact/A8UH78g1SnkrsFNGnbxdkM` และ GoFullPage ใน Chrome
- อ่าน Presentations skill และตรวจ Browser runtime แล้ว: Chrome เปิดอยู่ แต่ไม่มี ChatGPT Browser extension/native-host manifest; `get('chrome')` ใช้ไม่ได้ จึงยังไม่มี screenshot และยังไม่ได้แก้ deck
- ไม่มีไฟล์ PPTX ใน repo และไม่มี `load_workspace_dependencies` สำหรับ workflow local PPTX ที่ skill กำหนด
- เก็บแผน 15 ภาพพร้อม mapping สไลด์ใน `docs/05-dev/demo-backup/capture-plan.txt`
- รัน `npm run db:test` จริงและเก็บ `docs/05-dev/demo-backup/db-test-output.txt`: **54 passed, 1+ FAILED** (R21)
- ตรวจ read-only: เวร seed IDs 1/2/3/7/8 อยู่วันที่ 2026-10-18 แต่ current_date = 2026-10-23; R21 ใช้ current_date จึงไม่ชนเวร seed ในการ insert ครั้งแรก แล้วชน Mid ที่เพิ่ง insert ตอนรอบที่สอง; schedule 3 ยังเป็น COMPLETED จากข้อมูลปัจจุบัน ต้องระวัง fixture R22 ด้วย
- ไม่ reset DB และยังไม่ได้แก้ SQL/tests; งานภาพและสไลด์ยังรอการเชื่อมต่อ Chrome
- Follow-up หลังผู้ใช้ติดตั้ง GPT for Chrome: ตรวจยืนยัน ChatGPT extension ID `hehggadaopoacecdllhhajmbjkdcmajg` installed/enabled ใน Default profile แล้ว แต่ native-host manifest/registry ยังไม่มี และ `get('chrome')` ยังตอบ Browser is not available; ต้องติดตั้ง Browser plugin ใหม่ผ่าน UI ตาม troubleshooting ก่อนควบคุม Chrome ได้
