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
- [ ] Member tiers + เลื่อนระดับอัตโนมัติตาม `member_point` (trigger หรือ job)
- [ ] ตัดสินใจเรื่องส่วนลด tier ซ้อนกับ promotion ([[ADR-003-stored-totals-with-triggers]] › Open)
- [ ] Reviews: moderate (PUBLISHED/HIDDEN), ตอบกลับ (`reply_by_emp_id`), คะแนนเฉลี่ยต่อสาขา
