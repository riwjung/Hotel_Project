---
tags: [module]
module: G
status: done
---

# G · เงิน & ความพึงพอใจ

**ตาราง:** `member_tier` · `promotion` (DDL `040_g_master.sql`) · `payment` · `review` (DDL `075_g_transactions.sql`)
**Rules:** R8 promotion ใช้ได้ไหม, R10 review หลัง check-out — [[physical-design]]

- `review` ไม่เก็บ `customer_id` (3NF — ได้จาก `booking_id`), 1 booking : 0..1 review
- `payment` ติดลบไม่ได้ — คืนเงิน = แถว `payment_type='REFUND'` (ดู `v_booking_overview.paid_total`)

## หน้าจอ
| path | สถานะ | permission |
|---|---|---|
| `/payments` | ✅ list/filter + ยอดรวม, ยืนยัน/ล้มเหลว (pending), คืนเงิน (และปุ่ม Refund ในหน้า booking) | `PAYMENT_VIEW` / `PAYMENT_MANAGE` |
| `/promotions` | ✅ CRUD, ใช้ไป/limit, ล็อกเงื่อนไขส่วนลดเมื่อถูกใช้ (R18) | `PROMOTION_MANAGE` |
| `/member-tiers` | ✅ CRUD, จำนวนลูกค้าต่อ tier, เปลี่ยนเกณฑ์ → re-tier อัตโนมัติ (R13) | `PROMOTION_MANAGE` |
| `/reviews` | ✅ คะแนนเฉลี่ยต่อสาขา, list/filter, บันทึกรีวิวจากใบความเห็น, publish/hide | `REVIEW_VIEW` / `REVIEW_REPLY` |

## Backlog
- [x] Payments: บันทึกมัดจำ/ยอดเต็ม/คืนเงิน, ยอดค้างชำระ = grand_total − paid_total; DB คุมยอดไม่ให้เกิน (R17) — 2026-10-18
- [ ] แนบสลิป (`slip_url`) — ต้องตัดสินใจที่เก็บไฟล์ (local `public/uploads` หรือ object storage)
- [x] Promotions CRUD + จำนวนที่ใช้ไปแล้ว vs `usage_limit`; promotion ที่ถูกใช้แล้วล็อกเงื่อนไขส่วนลด (R18)
- [x] เลื่อน/ลดระดับอัตโนมัติตาม `member_point` → R13 trigger (2026-10-17, [[ADR-006-member-tier-discount-and-derived-tier]])
- [x] หน้า `/member-tiers` แก้เกณฑ์/อัตรา — DB คำนวณ tier ลูกค้าทุกคนใหม่ให้เอง (`trg_member_tier_90_resync_customers`)
- [x] ส่วนลด tier ซ้อนกับ promotion → ซ้อนได้: promotion ก่อน แล้ว tier% จากยอดที่เหลือ, อัตรา snapshot ไว้ที่ booking (ADR-006)
- [x] ได้แต้มอัตโนมัติตอน check-out: 1 แต้ม / ฿100 ของ grand_total (R14) — อัตราตามที่เสนอ 2026-10-17, แก้ได้ที่ `fn_points_for_amount()`
- [x] Reviews: moderate (PUBLISHED/HIDDEN), ผู้ดูแล (`reply_by_emp_id` — ER ไม่มีคอลัมน์ข้อความตอบกลับ), คะแนนเฉลี่ยต่อสาขา
- [ ] ข้อความตอบรีวิว — ต้องเพิ่มคอลัมน์ใน `review` (ถามผู้ใช้ก่อน)
