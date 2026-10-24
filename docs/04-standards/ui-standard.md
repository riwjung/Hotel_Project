---
name: antd-minimal-portal-ui
description: Use when building or extending an internal workflow portal that should match the HANA Change Management look — Ant Design v6 ONLY (no Tailwind), light minimal surfaces on soft grey, Layout+Sider shell, CSS Modules only where antd falls short, plus fixed conventions for tables, forms, modals, feedback and permission states. Pick this over lcr-web-ui-standard when the app is approval/workflow-centric and you want a light AntD-only build; pick lcr-web-ui-standard instead for the dark navy + orange Tailwind house style.
---

# Minimal Portal UI Pattern (Ant Design v6)

สรุปจากโปรเจกต์ **HANA Change Management Web** — ทุกข้อในเอกสารนี้มาจากโค้ดที่ใช้งานจริง
ไม่ใช่แนวทางที่ตั้งไว้เฉย ๆ

## Use this skill when

- สร้างหน้าจอ portal ภายในองค์กรที่ต้องดู "สะอาด อ่านง่าย ไม่ต้องสอน"
- งานสาย workflow / approval / master setup ที่ข้อมูลสำคัญกว่าลูกเล่น
- เพิ่มหน้าใหม่ในโปรเจกต์ที่ใช้ pattern นี้อยู่แล้ว
- ต้องการชุดกติกา UI ที่ตัดสินใจไว้ล่วงหน้า เพื่อไม่ต้องถกเถียงทุกครั้งที่เพิ่มหน้า

### เลือกอันไหนดี (โฟลเดอร์นี้มี UI skill 2 ชุด)

| | `antd-minimal-portal-ui` (ไฟล์นี้) | `lcr-web-ui-standard` (`UISkill.md`) |
|---|---|---|
| โทน | Sand & Sky — sidebar งาช้าง `#fbf8f2` + ทองแชมเปญ `#8a6c37` บนพื้นเทาอมฟ้า `#f4f6fb` | navy เข้ม + ส้ม |
| CSS | AntD + CSS Modules · **ไม่มี Tailwind** | AntD + Tailwind v4 |
| เหมาะกับ | workflow / approval / ตารางเยอะ | tool ภายในทั่วไป, dashboard ที่ต้องการ brand จัด |

**ห้ามผสมสองชุดในแอปเดียว** — ต้องเลือกตั้งแต่ไฟล์แรก เพราะกติกาข้อ 1 ของทั้งคู่ขัดกันตรง Tailwind

ใช้คู่กับ `Standard_WebProject_Skill.md` (โครงโปรเจกต์ Next.js + IIS) — ตัวนั้นคุมสถาปัตยกรรม
ตัวนี้คุมหน้าตา

---

## 1. หลักการ 5 ข้อ

1. **Ant Design เป็นเจ้าของหน้าตาทั้งหมด** — ไม่ใช้ Tailwind / shadcn / styled-components
   ปรับผ่าน `ConfigProvider` token ก่อนเสมอ เขียน CSS เองเป็นทางเลือกสุดท้าย
2. **CSS Modules เฉพาะสิ่งที่ antd ทำไม่ได้** — grid ที่ต้องคุมเอง, พื้นหลังวิดีโอ, timeline
   ปัจจุบันมีแค่ 8 ไฟล์ทั้งโปรเจกต์
3. **สีมีความหมาย ไม่ใช่ของตกแต่ง** — ถ้าจะใส่สี ต้องบอกได้ว่าสีนั้นแปลว่าอะไร และมี legend ให้ผู้ใช้
4. **หน้าจอต้องบอกความจริง** — ไม่มีข้อมูล/ไม่มีสิทธิ์/โหลดพลาด ต้องแสดงต่างกัน ไม่ใช่จอว่างเหมือนกันหมด
5. **การกระทำที่ย้อนไม่ได้ต้องถามก่อน** — ใช้กลไกยืนยันแบบเดียวทั้งระบบ

---

## 2. Theme tokens (`app/providers.tsx`)

```tsx
const themeConfig = {
  algorithm: antdTheme.defaultAlgorithm,
  token: {
    colorPrimary: "#8a6c37",   // Sand & Sky gold — 4.9:1 บนขาว ผ่าน AA
    colorInfo:    "#2f6bff",   // info ยังเป็นน้ำเงิน เพราะมีความหมาย ไม่ใช่แบรนด์
    colorLink:    "#8a6c37",
    borderRadius: 8,
    fontFamily: "var(--font-body), var(--font-thai), system-ui, sans-serif",
  },
  components: {
    Layout: { headerBg: "rgba(251, 248, 242, 0.82)", siderBg: "#fbf8f2", bodyBg: "#f4f6fb" },
    Menu:   { itemSelectedBg: "rgba(184, 151, 90, 0.15)", itemSelectedColor: "#7a5e2c", groupTitleColor: "#b8975a", ... },
  },
};

<ConfigProvider locale={enUS} theme={themeConfig}>
  <AntdApp style={{ minHeight: "100dvh" }}>{children}</AntdApp>
</ConfigProvider>
```

**`locale={enUS}` สำคัญกว่าที่คิด** — antd เป็นคนออกข้อความ Cancel/OK, `(optional)`,
pagination, Upload, Empty ถ้าตั้ง locale ผิดจะได้ UI สองภาษาปนกันโดยที่ไม่มีข้อความไหน
อยู่ในโค้ดเราเลย (เคยเจอ: `(ไม่จำเป็น)` กับ `ยกเลิก` โผล่มาเพราะตั้งเป็น `th_TH`)

**`<App>` ต้องครอบเสมอ** — ทุก `message` / `modal` / `notification` ดึงจาก `App.useApp()`
ห้าม import แบบ static (`import { message } from "antd"`) เพราะจะไม่ได้ theme context

---

## 3. Design tokens ระดับ CSS (`globals.css`)

```css
:root {
  --bg:            #f4f6fb;   /* พื้นหลังทั้งแอป — เทาอมฟ้าอ่อน ไม่ใช่ขาว */
  --surface:       #ffffff;   /* การ์ด / แผง */
  --text:          #0e1726;
  --muted:         #506690;
  --border:        #e2e8f1;
  --accent:        #8a6c37;   /* = colorPrimary */
  --accent-strong: #6f5629;
}
```

พื้นหลัง **ไม่ใช่สีขาว** โดยตั้งใจ — การ์ดขาวบนพื้นเทาอ่อนสร้างลำดับชั้นได้โดยไม่ต้องใช้เงาหนัก

**ฟอนต์ 3 ตัวผ่าน `next/font/google`** — `Hanken_Grotesk` (body) · `Fraunces` (display)
· `Noto_Sans_Thai` (ไทย) ประกาศเป็น CSS variable แล้วให้ antd token อ้างต่อ

---

### แบรนด์ Sand & Sky

- โลโก้คือ `app/components/brand/BrandLogo.tsx` (SVG เส้นทอง วาดจากโลโก้จริง) — ห้ามใช้รูป PNG/JPG
  แบบ: `layout="inline"` (sidebar) · `layout="stacked"` (login) · `markOnly` (sidebar ตอนยุบ)
- ตัวอักษรแบรนด์ `Marcellus` (`--font-brand`) ใช้เฉพาะ wordmark และชื่อหน้าใน header
- สีแบรนด์อยู่ใน `globals.css`: `--ivory` `--sand-paper` `--gold-light` `--gold` `--gold-deep` `--ink` `--ink-muted` `--hairline`
- ทองอ่อน `--gold` (`#b8975a`) ใช้กับเส้น/ของตกแต่งเท่านั้น — **ข้อความสีทองต้องใช้ `--gold-deep`/`colorPrimary`** ไม่งั้น contrast ไม่ผ่าน
- สีสถานะ (§6) **ไม่เปลี่ยนตามแบรนด์** — สีของสถานะแปลว่าความหมาย

## 4. โครงหน้า

```
Layout (minHeight: 100dvh)
├── Sider   — เมนู, ยุบได้, มือถือเปลี่ยนเป็น Drawer
└── Layout
    ├── Header  — ชื่อหน้า + ผู้ใช้ + logout
    └── Content — padding: clamp(16px, 3vw, 28px), minWidth: 0
```

- `minWidth: 0` บน Content **จำเป็น** ไม่งั้นตารางกว้าง ๆ จะดัน layout แตกแทนที่จะ scroll ในตัวเอง
- padding ใช้ `clamp()` ไม่ใช่ media query — ลื่นกว่าและโค้ดน้อยกว่า
- Sider บนจอเล็กต้องเป็น Drawer เสมอ ไม่ใช่ยุบให้แคบลง
- Desktop Sider ต้อง stretch ตามความสูงหน้า; จำกัด `height: 100dvh` และ sticky/overflow ที่ wrapper ของเมนูด้านในเท่านั้น เพื่อไม่ให้มีพื้นเทาใต้ sidebar ในหน้ายาว เช่น Attendance

### Metric grid

```css
.metricGrid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
}
@media (max-width: 575px) {
  .metricGrid { grid-template-columns: repeat(2, 1fr); }
  /* การ์ดสุดท้ายที่เหลือเดี่ยว ให้กินเต็มแถว ไม่ปล่อยช่องว่าง */
  .metricGrid > :last-child:nth-child(odd) { grid-column: 1 / -1; }
}
```

---

## 5. กติกาต่อ component

### Card
```tsx
<Card variant="outlined" title="..." extra={<Space wrap>...</Space>}>
```
- ใช้ `variant="outlined"` เสมอ — เส้นขอบบาง ไม่ใช้เงา
- **การ์ดที่ใส่ตาราง** ต้อง `styles={{ body: { padding: 0 } }}` ให้ตารางชนขอบการ์ด
- filter/search อยู่ใน `extra` ไม่ใช่ลอยเหนือการ์ด

### Table

**Shared Sand & Sky table theme (2026-10-23):** กำหนดสีทุกตารางผ่าน `components.Table` ใน
`app/providers.tsx`: header ทรายทอง `#e9ddc7` / ตัวอักษร `#57462c`, body งาช้าง `#fffdf9`,
hover `#efe3cc`, selected `#e8d6b2` และเส้นคั่น `#e2d7c4`.
แถวสลับฟ้าเทา `#f3f6f8` ใช้ `app/table-theme.module.css` ผ่าน ConfigProvider table semantic classes
เพราะ AntD ไม่มี alternating-row token; ไม่ทับ hover, selected, sorted column หรือสี inline ของ Availability.
ใช้ theme กลางนี้กับตารางใหม่ด้วย ไม่กำหนดสี header แยกในแต่ละ feature.

```tsx
<Table
  rowKey="id"
  size="middle"
  loading={loading}
  scroll={{ x: "max-content" }}
  pagination={{ pageSize: 8, hideOnSinglePage: true, size: "small" }}
/>
```
- **ทุกคอลัมน์ที่เรียงได้ต้องมี `sorter`** — แยก helper ไว้ที่เดียว (`lib/table-sort.ts`)
  - ค่าว่าง**จมลงล่างเสมอ** ไม่ว่าเรียงขึ้นหรือลง (ช่องว่าง = ไม่มีค่า ไม่ใช่ค่าน้อยสุด)
  - ตัวเลขในข้อความใช้ `localeCompare(…, { numeric: true })`
  - สถานะ workflow เรียงตาม**ลำดับกระบวนการ ไม่ใช่ ก-ฮ**
- คลิกทั้งแถวเปิดรายละเอียด → ปุ่มในแถวต้อง `e.stopPropagation()`
- คอลัมน์ action `fixed: "right"`
- **ห้ามใช้ `<List>`** — deprecated ใน antd 6 เขียน markup เองด้วย `theme.useToken()`

### Descriptions
```tsx
<Descriptions bordered size="small" column={{ xs: 1, sm: 2, lg: 3 }}
              styles={{ label: { fontWeight: 600 } }} />
```
- 3 คอลัมน์บนจอใหญ่ ไม่ใช่ 4 — ค่ายาว ๆ จะถูกบีบขึ้นบรรทัดกลางคำ
- ฟิลด์สำคัญที่สุดอยู่บนสุดและ `span: "filled"`
- ตั้ง `fontWeight` ที่ระดับ `<Descriptions>` ไม่ใช่ไล่ใส่ทีละ item

### Form
```tsx
<Form form={form} layout="vertical" preserve={false} requiredMark="optional">
```
- `layout="vertical"` เสมอ — label บนช่องกรอก อ่านง่ายบนมือถือ
- **Modal/Drawer ที่มี `destroyOnHidden` ต้องใช้ `preserve={false}` และห้ามเรียก
  `form.resetFields()` ตอนปิด** — Form ถูก unmount ไปแล้ว antd จะเตือน
  `useForm is not connected to any Form element`
- **เติมค่าตอนแก้ไขผ่าน `initialValues` ไม่ใช่ `setFieldsValue()` ก่อนเปิด** —
  ตอนนั้น Form ยังไม่ mount ค่าจะหายเงียบ ๆ
- ช่องที่ backend แก้ไม่ได้จริง ต้อง `disabled` + บอกเหตุผล ไม่ใช่ปล่อยให้พิมพ์แล้วเงียบ

### Modal / การยืนยัน
- **กลไกเดียวทั้งระบบ ไม่ใช้ Popconfirm ปนกับ Modal**
  - action ที่ไม่ต้องกรอกอะไร → `modal.confirm()`
  - action ที่มีฟอร์ม → Modal เต็ม ปุ่ม OK คือการยืนยันในตัว (**ห้ามถามซ้ำ 2 ชั้น**)
- ทุก action ที่ย้อนไม่ได้ต้องถาม: ลบ, ลบไฟล์, ตัดสินใจอนุมัติ, ส่งออกให้ผู้อื่นเห็น
- ปุ่มอันตรายใช้ `okButtonProps={{ danger: true }}` และข้อความบอกผลที่ตามมา
  ("This cannot be undone") ไม่ใช่แค่ "Are you sure?"

### Feedback
- `message.success` / `message.error` เท่านั้นสำหรับผลของ action (ไม่ใช้ notification)
- **error ต้องแสดงข้อความจาก server** ไม่ใช่ข้อความทั่วไปที่เราแต่งเอง
  ```ts
  message.error(err instanceof Error ? err.message : "Action failed");
  ```
- ปุ่มที่กำลังทำงานใช้ `loading` ไม่ใช่ `disabled` เฉย ๆ

### สถานะพิเศษของหน้า
| สถานการณ์ | ใช้อะไร |
|---|---|
| ไม่มีสิทธิ์ | `<Result status="403">` + ปุ่มกลับหน้าหลัก |
| ไม่มีข้อมูล | `<Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="...">` บอกด้วยว่าทำยังไงถึงจะมี |
| กำลังโหลด | `loading` prop ของ Card/Table ไม่ใช่ spinner กลางจอ |
| โหลดพลาด | `<Alert type="error">` คาที่เดิม ไม่ใช่แค่ toast แล้วหาย |

### ชื่อไฟล์/ข้อความยาว
```tsx
<div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
  <PaperClipOutlined style={{ flexShrink: 0 }} />
  <Text ellipsis={{ tooltip: fileName }}>{fileName}</Text>
</div>
```
**`minWidth: 0` คือตัวที่ทำให้ `ellipsis` ทำงาน** — ถ้าไม่ใส่ flex item จะไม่ยอมหด
แล้วดันปุ่มตกบรรทัด (อาการที่เจอบ่อยที่สุดใน list ที่มี action ข้างขวา)

---

## 6. Palette ของสถานะ

```ts
Draft:            #8c8c8c  (default)   EditOutlined
Waiting Customer: #d4a017  (gold)      SendOutlined
Approved:         #16a34a  (green)     CheckOutlined
Revise:           #e7515a  (red)       RollbackOutlined
In progress:      #2f6bff  (blue)      FileDoneOutlined
Archived:         #13c2c2  (success)   InboxOutlined
```

**สถานะต้องมีทั้งสีและไอคอน** — สีอย่างเดียวคนตาบอดสีแยกไม่ออก

**เก็บ code ใน DB แต่แสดง label ที่คนอ่านรู้เรื่อง**
```ts
export const STATUS_LABELS: Record<Status, string> = { Form15PD: "Form.15 Pending", ... };
```
ห้าม render ค่า raw ให้ผู้ใช้เห็น — ทั้ง badge, dropdown filter และข้อความ toast

---

## 7. โครงไฟล์ของ feature (feature-first)

```
app/components/portal/<feature>/
├── types.ts            # domain type + constant (STATUSES, ACTION_PRECONDITIONS, LABELS)
├── <feature>.api.ts    # เรียก API + adapter แปลงชื่อ field + mock fallback
├── <Feature>Table.tsx  # ตาราง
├── <Feature>Modal.tsx  # 1 modal = 1 ไฟล์
└── <feature>.module.css (ถ้าจำเป็นจริง)

app/lib/                # ของใช้ร่วมข้าม feature
├── api-client.ts       # fetch + token + error mapping ที่เดียว
├── table-sort.ts       # sorter ที่ใช้ร่วมทุกตาราง
└── auth-client.ts      # session + helper เช็คสิทธิ์ (ห้ามเช็ค role กระจาย)
```

**กติกา:** ถ้าเขียน logic เดียวกันเป็นครั้งที่ 3 ให้ย้ายขึ้น `lib/` ทันที
(บทเรียนจริง: การเช็ค `roles.includes("ADMIN")` เคยกระจายอยู่ 8 ที่ พอเพิ่ม role ใหม่
ต้องไล่แก้ทุกจุดและมีโอกาสตกหล่น — รวมเป็น `isStaffUser()` ตัวเดียวแล้วปัญหาหมดไป)

---

## 8. Checklist ก่อนปิดงานหน้าจอ

- [ ] `npx tsc --noEmit` และ `npx next lint` ผ่าน
- [ ] เปิดหน้าโดยเปิด DevTools console — **ต้องไม่มี antd deprecation warning**
      (เช็คแบบ static ไม่ได้ ต้องคลิกดูจริง)
- [ ] ลองย่อจอถึง 375px — ไม่มี horizontal scroll ที่ระดับ body
- [ ] ทุกตารางเรียงได้ และค่าว่างไปอยู่ล่าง
- [ ] ทุก action ที่ย้อนไม่ได้ถามก่อน
- [ ] role ที่ไม่มีสิทธิ์เห็น `Result 403` ไม่ใช่หน้าเปล่าหรือ error
- [ ] ข้อความทั้งหมดเป็นภาษาเดียวกัน (รวมข้อความที่ antd ออกให้)

---

## 9. กับดักที่เคยเจอมาแล้ว

| อาการ | สาเหตุ |
|---|---|
| ปุ่มใน list ตกบรรทัด | ลืม `minWidth: 0` บน flex item |
| `useForm is not connected` | เรียก `resetFields()` ตอน Modal ปิดอยู่ (`destroyOnHidden`) |
| กด Edit แล้วฟอร์มว่าง | `setFieldsValue()` ก่อน Form mount — ต้องใช้ `initialValues` |
| UI สองภาษาปนกัน | `ConfigProvider locale` ผิด |
| Table ดัน layout แตก | ขาด `minWidth: 0` บน Content หรือ `scroll={{ x: "max-content" }}` |
| หน้า login วิดีโอมืดสนิท | หรี่ `opacity` ที่วิดีโอ **แล้วยังใส่ scrim ทับอีกชั้น** — เลือกอย่างเดียว |
| Hydration mismatch กับ framer-motion | ค่า style เป็น string ตอน SSR แต่เป็น number ตอน client |
