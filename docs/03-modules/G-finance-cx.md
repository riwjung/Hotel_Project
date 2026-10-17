---
tags: [module]
module: G
status: planned
---

# G · เงิน & ความพึงพอใจ

**ตาราง:** `member_tier` · `promotion` (DDL `040_g_master.sql`) · `payment` · `review` (DDL `075_g_transactions.sql`)
**Rules:** R8 promotion ใช้ได้ไหม, R10 review หลัง check-out — [[physical-design]]

- `review` ไม่เก็บ `customer_id` (3NF — ได้จาก `booking_id`), 1 booking : 0..1 review
- `payment` ติดลบไม่ได้ — คืนเงิน = แถว `payment_type='REFUND'` (ดู `v_booking_overview.paid_total`)

## หน้าจอ
| path | สถานะ | permission |
|---|---|---|
| `/payments` | ⏳ | `PAYMENT_VIEW` / `PAYMENT_MANAGE` |
| `/promotions` | ⏳ | `PROMOTION_MANAGE` |
| `/member-tiers` | ⏳ | `PROMOTION_MANAGE` |
| `/reviews` | ⏳ | `REVIEW_VIEW` / `REVIEW_REPLY` |

## Backlog
- [ ] Payments: บันทึกมัดจำ/ยอดเต็ม/คืนเงิน (refund ต้อง confirm), ยอดค้างชำระ = grand_total − paid_total
- [ ] แนบสลิป (`slip_url`) — ต้องตัดสินใจที่เก็บไฟล์ (local `public/uploads` หรือ object storage)
- [ ] Promotions CRUD + จำนวนที่ใช้ไปแล้ว vs `usage_limit`
- [x] เลื่อน/ลดระดับอัตโนมัติตาม `member_point` → R13 trigger (2026-10-17, [[ADR-006-member-tier-discount-and-derived-tier]])
- [ ] หน้า `/member-tiers` แก้เกณฑ์/อัตรา — DB คำนวณ tier ลูกค้าทุกคนใหม่ให้เอง (`trg_member_tier_90_resync_customers`)
- [x] ส่วนลด tier ซ้อนกับ promotion → ซ้อนได้: promotion ก่อน แล้ว tier% จากยอดที่เหลือ, อัตรา snapshot ไว้ที่ booking (ADR-006)
- [ ] ได้แต้มอัตโนมัติ (เช่นหลัง check-out) — ER ไม่ได้กำหนดอัตรา ต้องตัดสินใจก่อน
- [ ] Reviews: moderate (PUBLISHED/HIDDEN), ตอบกลับ (`reply_by_emp_id`), คะแนนเฉลี่ยต่อสาขา
