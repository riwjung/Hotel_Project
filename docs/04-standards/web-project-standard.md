---
name: xray-centralize-nextjs-iis-pattern
description: Use when creating or extending a project that should follow the X-ray Centralize standard: Next.js App Router deployed to IIS as a static export, no app/api or backend folder in the repo, external APIs only, SQL files stored under documents/sql for manual execution, and feature modules separated into types/api/hooks/components.
---

# X-Ray Centralize Project Pattern

## Use this skill when

- สร้างโปรเจกต์ใหม่ที่ต้องใช้ pattern เดียวกับ X-Ray Centralize
- เพิ่ม section หรือ feature ใหม่ในโปรเจกต์แนวนี้
- รีแฟคเตอร์โปรเจกต์ให้แยกส่วนแบบ `feature-first`
- ต้องการวางโครง `Next.js + IIS + external API + SQL docs` ให้เป็นมาตรฐานเดียว

## Non-negotiable rules

1. โปรเจกต์นี้เป็น `Next.js App Router` ฝั่ง frontend เป็นหลัก และ deploy แบบ `static export` ขึ้น `IIS`
2. ห้ามสร้าง `app/api`, `pages/api`, `api/`, `server/`, หรือ `backend/` ภายใน repo นี้
3. ถ้าต้องใช้ข้อมูลจากระบบหลังบ้าน ให้เรียกผ่าน `external API` ด้วย `fetch` และ `NEXT_PUBLIC_*` env vars เท่านั้น
4. ถ้าต้องมี schema, query, stored procedure, mock data script หรือคำอธิบายการ run SQL ให้เก็บไว้ใน `documents/sql/`
5. การ run SQL เป็นงานนอก repo ผู้พัฒนาต้องนำไฟล์ใน `documents/sql/` ไป execute เองบน SQL Server
6. Route page ต้องบางที่สุด และให้ย้าย logic ไปไว้ใน component หรือ hook ตาม feature
7. ถ้า feature ต้องแก้ไขข้อมูลแบบ admin ให้แยก `data hook`, `editor hook`, `api file`, `types` และ UI ย่อยออกจากกัน
8. ถ้าฟีเจอร์ต้อง upload/delete file ให้ใช้ util กลางใน `app/lib/file-upload-client.ts` หรือ wrapper ของ feature ที่เรียก util นี้
9. ถ้าหน้าใดต้องรองรับ `static export` ต้องหลีกเลี่ยงความสามารถที่พึ่ง Node runtime ระหว่าง request
10. ถ้าฟีเจอร์ยังไม่มี API จริง ให้ใช้ fallback/mock data ใน `app/data/` ชั่วคราว แยกจาก UI ให้ชัด

## Required platform setup

`next.config.ts` ต้องคงแนวคิดนี้ไว้เสมอ

```ts
const nextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
};
```

`public/web.config` ต้องมีไว้สำหรับ IIS rewrite ไปที่ `index.html` ของแต่ละ path ที่ export ออกมา

ผลลัพธ์ deploy ต้องมาจากโฟลเดอร์ `out/` ไม่ใช่จาก Next.js server runtime

## Directory standard

ใช้โครงสร้างนี้เป็น baseline

```text
app/
  layout.tsx
  page.tsx
  globals.css
  providers.tsx
  data/
  lib/
  components/
    landing/
      FeatureName.tsx
      feature-name/
        FeatureName.tsx
        feature-name.api.ts
        types.ts
        useFeatureNameData.ts
        useFeatureNameEditor.ts
        FeatureNameGrid.tsx
        FeatureNameCard.tsx
        FeatureNameModal.tsx
        FeatureNameEmptyState.tsx
        FeatureNameAdminBadge.tsx
    portal/
      PortalShell.tsx
      PortalOverviewPage.tsx
      PortalDetailPage.tsx
      feature-name/
        ...
  (systems)/
    [section]/
      page.tsx
      [slug]/
        page.tsx
documents/
  sql/
public/
  web.config
lib/
  utils.ts
```

## Route rules

- `app/page.tsx` ใช้ compose landing sections หลัก
- route ที่เป็น overview/detail ของระบบย่อยให้ใช้ `app/(systems)/[section]/page.tsx` และ `app/(systems)/[section]/[slug]/page.tsx`
- ถ้ามีหน้าพิเศษ เช่น `news`, `documents` ให้สร้าง route ของตัวเองแยกจาก `(systems)`
- route file ควรทำหน้าที่แค่รับ params, validate, เลือก component ที่จะแสดง, และส่ง props ต่อ
- ถ้าเป็น dynamic route ที่ต้อง export static ให้ใส่ `generateStaticParams()`

## Feature module rules

ทุก feature ที่มีข้อมูลและ UI หลายส่วนให้แยกแบบนี้

### 1. Stable wrapper

สร้างไฟล์ import entry ที่ path สั้น เช่น

- `app/components/landing/MenuShortcutSection.tsx`
- `app/components/landing/BentoArticles.tsx`

ไฟล์นี้ควรทำหน้าที่ `export { default } from ".../feature-folder/..."` หรือเป็น wrapper บาง ๆ เท่านั้น

### 2. Feature folder

ภายในโฟลเดอร์ feature ให้ใช้การแยกบทบาทดังนี้

- `types.ts` เก็บ DTO, form type, UI model
- `<feature>.api.ts` เก็บ `fetch`, mapper, request payload, response normalization
- `use<Feature>Data.ts` เก็บ logic ดึงข้อมูลหลัก
- `use<Feature>Editor.ts` เก็บ logic modal/edit/upload/delete/save
- `FeatureSection.tsx` หรือ component หลักของ feature เป็นตัวประกอบ UI และเรียก hooks
- `Grid`, `Card`, `Modal`, `EmptyState`, `AdminBadge` แยกตามหน้าที่ ไม่ยัดรวมไฟล์เดียว

### 3. State and browser APIs

- ถ้าต้องใช้ state, effect, sessionStorage, upload, modal หรือ browser API ให้ใส่ `"use client"`
- ถ้าเป็น page shell หรือ route composition ธรรมดา ให้คงเป็น server component ตาม default

### 4. API integration

- ใช้ `fetch` ตรง ๆ เป็นหลัก
- ใส่ `cache: "no-store"` กับข้อมูลที่ต้องสด
- แยก function `getApiBase()` ไว้ในไฟล์ API ของแต่ละ feature หรือใช้ util กลางเมื่อเหมาะสม
- ใช้ env vars ที่ขึ้นต้นด้วย `NEXT_PUBLIC_` เท่านั้นสำหรับ endpoint ฝั่ง client
- ถ้า response รูปแบบไม่ตรงกัน ให้ normalize ในไฟล์ `*.api.ts` ก่อนส่งต่อเข้า UI

## Shared module rules

ใช้ `app/lib/` สำหรับของกลางระดับแอป เช่น

- config หรือ registry ของ section เช่น `portal-sections.ts`
- auth helper ฝั่ง client เช่น `admin-auth-client.ts`
- file upload helper เช่น `file-upload-client.ts`

ใช้ `app/data/` สำหรับ

- mock data
- fallback data เมื่อ API ยังไม่พร้อม
- seed content สำหรับ draft page

ใช้ `lib/utils.ts` สำหรับ generic utility ที่ไม่ผูกกับ business domain

## SQL workspace standard

ทุกอย่างที่เกี่ยวกับฐานข้อมูลของโปรเจกต์นี้ให้อยู่ใน `documents/sql/`

ใช้แนวการตั้งชื่อไฟล์นี้

- `00_schema_for_dbdiagram.dbml` สำหรับดู relationship
- `00_schema_create_all.sql` สำหรับ create schema/set เริ่มต้น
- `01_tbl_<TableName>.samples.sql` สำหรับ sample query ของ table
- `01_tbl_<TableName>.samples.md` สำหรับอธิบาย field หรือวิธีใช้ query ชุดนั้น
- `07_sp_<feature>_update.sql` หรือ `08_sp_<feature>_get.sql` สำหรับ stored procedures
- `09_tbl_<TableName>.mock-<feature>.sql` สำหรับ mock/seed data
- `90_cross_section_dashboard.samples.sql` สำหรับ query ข้ามหลายหมวด

ถ้ามี SQL file ใหม่ ให้พยายามมี `.md` คู่กันเมื่อ query นั้นไม่ชัดจากชื่อไฟล์

## Admin/edit pattern

ถ้าฟีเจอร์รองรับ admin mode ให้ยึด pattern นี้

- อ่าน session จาก `sessionStorage`
- รวมข้อมูล auth เป็น type เดียว เช่น `AdminSession`
- มี helper แบบ `read...Session`, `persist...Session`, `clear...Session`, `hasAdminRole`
- ยิง event กลางเช่น `admin-auth-changed` เมื่อ auth state เปลี่ยน
- แยก edit mode ออกจาก view mode ให้ชัด
- modal, upload, delete, save state ต้องถูกควบคุมใน `use...Editor.ts`

## File upload pattern

- ใช้ file service ภายนอก ไม่เก็บ logic upload ไว้ใน route ของ Next.js
- รองรับการแปลง `url <-> full path` ผ่าน util กลาง
- ถ้า feature ต้องการชื่อ function เฉพาะ เช่น `uploadHeroSectionPicture()` ให้ทำ wrapper จาก util กลางได้
- URL public และ file API base ต้องมาจาก env vars

## What to avoid

- อย่าสร้าง backend folder ภายใน repo นี้
- อย่าใส่ SQL ปะปนใน component หรือ page
- อย่าให้ route page มี business logic หนา
- อย่าให้ component ใหญ่ตัวเดียวทำทั้ง fetch, normalize, edit form, modal, upload, delete และ render
- อย่าใช้ feature ที่ขัดกับ `output: "export"` เช่น route handlers, server-only API flows, หรือ dynamic runtime ที่พึ่ง request-time server
- อย่ากระจาย section metadata ไปหลายไฟล์ ถ้าข้อมูลนั้นเป็น registry กลางควรรวมไว้ใน `app/lib/`

## New project recipe

เมื่อต้องขึ้นโปรเจกต์ใหม่ตาม pattern นี้ ให้ทำตามลำดับนี้

1. สร้าง `Next.js App Router + TypeScript`
2. ตั้งค่า `next.config.ts` ให้เป็น `output: "export"`, `images.unoptimized`, `trailingSlash`
3. สร้าง `public/web.config` สำหรับ IIS rewrite
4. วาง baseline folders: `app`, `app/components`, `app/lib`, `app/data`, `documents/sql`, `public`
5. สร้าง landing page shell ใน `app/page.tsx`
6. สร้าง section registry กลางใน `app/lib/portal-sections.ts` ถ้ามีหลายระบบย่อย
7. สร้าง route pattern ใต้ `app/(systems)/[section]` และ `[slug]` ถ้าต้องมี portal style navigation
8. สร้าง feature แรกโดยใช้รูปแบบ `types + api + data hook + editor hook + UI components`
9. ถ้าต้องเรียกข้อมูลจริง ให้ต่อ external API ผ่าน env vars
10. ถ้าต้องมี schema/query ให้สร้างไฟล์ใน `documents/sql/` ทันที ไม่ไปสร้าง backend folder ใน repo
11. ตรวจ `npm run lint`
12. ตรวจ `npm run build` และยืนยันว่า output ใช้งานจาก `out/` ได้

## Definition of done

งานถือว่าเสร็จเมื่อครบทุกข้อ

- โปรเจกต์ build แบบ static export ได้
- ไม่มี `app/api` หรือ backend folder ใน repo
- IIS ใช้ `public/web.config` ได้
- feature ใหม่ถูกแยกเป็นสัดส่วนตามมาตรฐาน
- SQL ที่เกี่ยวข้องถูกเพิ่มใน `documents/sql/`
- config endpoint อยู่ใน env vars ไม่ hardcode กระจายหลายจุดโดยไม่จำเป็น
- route pages บางและ maintain ง่าย

## Default decision policy

ถ้าต้องตัดสินใจระหว่าง “ทำเร็วแบบรวมทุกอย่างในไฟล์เดียว” กับ “แยกเป็น feature module” ให้เลือกแยกส่วน

ถ้าต้องตัดสินใจระหว่าง “เพิ่ม backend logic ใน repo นี้” กับ “ทำเอกสาร SQL และเชื่อม external API” ให้เลือกแบบหลัง

ถ้าต้องตัดสินใจระหว่าง “ทำให้รันบน Next server” กับ “คงความเข้ากันได้กับ IIS static export” ให้เลือกแบบที่เข้ากับ static export ก่อนเสมอ
