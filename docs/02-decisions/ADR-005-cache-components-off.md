---
tags: [adr, nextjs]
status: accepted
date: 2026-10-10
---

# ADR-005 · ปิด `cacheComponents` ของ Next.js 16

## Context
`create-next-app@16.4.0` เปิด `cacheComponents: true` + `partialPrefetching: true` เป็นค่าเริ่มต้น
ตอน `next build` พัง:

```
Route "/_not-found": Next.js encountered the unstable value `Math.random()` in a Client Component.
    at RootLayout (app/layout.tsx) → <AntdRegistry>
```

ต้นเหตุ: `@ant-design/nextjs-registry` เรียก `createCache()` ของ `@ant-design/cssinjs`
ซึ่งสร้าง instance id ด้วย `Math.random()` ระหว่าง render — Cache Components ห้ามค่าไม่คงที่ตอน prerender

## Options
1. ครอบ `<AntdRegistry>` ด้วย `<Suspense>` → static shell ว่างทั้งแอป เสียประโยชน์ของ PPR อยู่ดี
2. เขียน registry เองแล้ว hack `Math.random` ระหว่างสร้าง cache → เปราะ พังได้เมื่อ antd อัปเดต
3. **ปิด cacheComponents** → กลับไปใช้ rendering model ปกติของ Next

## Decision
เลือกข้อ 3 — portal นี้โหลดข้อมูลฝั่ง client ผ่าน route handler อยู่แล้ว PPR ให้ประโยชน์น้อย

## Consequences
- `app/(portal)/layout.tsx` ยัง static และโหลด session จาก `/api/auth/me` (ออกแบบไว้ตอนยังเปิด cacheComponents — ใช้ได้ทั้งสองแบบ)
- กลับมาเปิดได้เมื่อ `@ant-design/nextjs-registry` รองรับ Cache Components → ลอง `next build` ใหม่
