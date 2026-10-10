---
tags: [feature]
module:
status: planned
date: {{date}}
---

# {{title}}

**โมดูล:** [[]] · **ตาราง:** `` · **permission:** ``

## ผู้ใช้ทำอะไรได้
-

## API
| method | path | permission |
|---|---|---|
| | | |

## DB rules ที่เกี่ยวข้อง
-

## Checklist ก่อนปิดงาน ([[ui-standard]] §8)
- [ ] `npm run typecheck` · `npm run lint` ผ่าน
- [ ] เปิด DevTools console — ไม่มี antd deprecation warning
- [ ] ย่อจอ 375px — ไม่มี horizontal scroll ที่ body
- [ ] ทุกคอลัมน์ sort ได้ ค่าว่างอยู่ล่าง
- [ ] action ที่ย้อนไม่ได้ถามก่อน (`modal.confirm` danger)
- [ ] role ที่ไม่มีสิทธิ์เห็น Result 403
- [ ] error แสดงข้อความจาก server
- [ ] `nav.ts` status → "ready" และอัปเดต note โมดูล
