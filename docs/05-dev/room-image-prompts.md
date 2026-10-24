---
tags: [dev, assets, rooms]
updated: 2026-10-24
---

# Room gallery image prompts

Prompt สำหรับ gen รูปห้องไปใส่ Gallery ในหน้า Room detail (`/rooms/[id]`)
ข้อมูลห้อง/สิ่งอำนวยความสะดวกอ้างอิง seed (`db/seed/100_master.sql`, `110_demo.sql`) · โทนสีตามธีม Sand & Sky ใน [[ui-standard]]

## สเปกไฟล์
- แนวนอน **3:2** (เช่น 1536 × 1024) — Gallery ตัดเป็น thumbnail 280 × 180 แบบ cover จึงควรให้จุดสำคัญอยู่กลางภาพ
- `.jpg` หรือ `.webp` วางที่ `public/images/rooms/` ตามชื่อในตารางด้านล่าง
- ชุดรูปแยกตาม **สาขา × ประเภทห้อง** (ห้องประเภทเดียวกันในสาขาเดียวกันใช้ชุดเดียวกันได้) · 3 ช็อตต่อชุด: `bed` (รูปปก) · `bath` · `view` · Suite เพิ่ม `living`
- ยังไม่มีหน้าจออัปโหลดรูป — รูปเข้า Gallery ผ่านแถวในตาราง `room_image` (seed `110_demo.sql`) แล้ว `npm run db:reset`

| สาขา | ห้อง | ประเภท | zone | ชุดไฟล์ |
|---|---|---|---|---|
| BKK | 101 · 102 · 103 | Standard | Garden wing | `bkk-std-{bed,bath,view}.jpg` |
| BKK | 201 · 202 | Deluxe | River wing | `bkk-dlx-{bed,bath,view}.jpg` |
| BKK | 203 | Family | River wing | `bkk-fam-{bed,bath,view}.jpg` |
| BKK | 301 Chao Phraya Suite | Suite | River wing | `bkk-ste-{bed,living,bath,view}.jpg` |
| CNX | 101 · 102 | Standard | Courtyard | `cnx-std-{bed,bath,view}.jpg` |
| CNX | 201 | Deluxe | Courtyard | `cnx-dlx-{bed,bath,view}.jpg` |
| CNX | 202 | Family | Courtyard | `cnx-fam-{bed,bath,view}.jpg` |
| HKT | 101 · 102 | Deluxe | Pool side | `hkt-dlx-{bed,bath,view}.jpg` |
| HKT | 103 | Family | Pool side | `hkt-fam-{bed,bath,view}.jpg` |
| HKT | 201 Andaman Suite | Suite | Sea view | `hkt-ste-{bed,living,bath,view}.jpg` |

ถ้าเวลาน้อย: gen แค่รูปปก (`bed`) 10 รูปก่อน แล้วค่อยเติม `bath` / `view` ของ Suite

## สถานะ (2026-10-24)
gen ด้วย Gemini แล้ว 16 รูป → ย่อเป็น 1600 × 1073 (~200 KB) ตั้งชื่อตามตารางข้างบน และผูกกับห้องใน seed (`room_image`, 32 แถว · ปกห้องละ 1)
- รูปปกครบ 10 ชุด · BKK Standard มี 2 แบบ (`bkk-std-bed`, `-2`) · BKK Deluxe มี 3 แบบ (`bkk-dlx-bed`, `-2`, `-3`) ใช้สลับให้ห้องคนละรูป
- ห้องน้ำใช้ร่วม: `ste-bath.jpg` (อ่างอาบน้ำ · Suite) และ `room-bath.jpg` (rain shower · ห้องอื่น)
- `bkk-ste-living.jpg` แล้ว · **ยังไม่ได้ gen:** `hkt-ste-living` และรูป `view` ทั้ง 5 แบบ
- ไฟล์ต้นฉบับ `Gemini_Generated_Image_*.jpg` (2528 × 1696, ~3 MB) ยังอยู่ใน `public/images/rooms/` — ไม่มีที่ไหนอ้างถึง

## Style (ต่อท้ายทุก prompt)
```
Photorealistic interior photograph for a boutique hotel website, Thai contemporary design, warm ivory walls, natural linen bedding, light oak and teak wood, champagne-gold brass accents, soft sky-blue cushions and throws, calm sand-and-sky colour palette, soft natural daylight through sheer curtains, airy and uncluttered, styled but lived-in, wide-angle 24mm lens at eye level, straight vertical lines, 3:2 landscape, no people, no text, no logos
```

**Negative prompt** (ถ้าเครื่องมือรองรับ):
```
people, text, watermark, logo, signage, distorted furniture, warped walls, fisheye, extra beds, cluttered, dark, harsh flash, oversaturated, cartoon, CGI render look
```

## รูปปก (`bed`) — ห้องละ 1 prompt พร้อมใช้

**bkk-std-bed** — BKK Standard · Garden wing
```
Compact standard hotel room for one or two guests in a riverside Bangkok boutique hotel, one queen bed with crisp white linen and a sky-blue throw, slim wall-mounted smart TV, small writing ledge, split air conditioner above the window, tall window with dark teak shutters opening to a tropical garden with frangipani trees, terrazzo floor with a woven rug
```

**bkk-dlx-bed** — BKK Deluxe · River wing
```
Spacious deluxe hotel room in a riverside Bangkok boutique hotel, king bed with linen headboard, sitting area with two rattan armchairs and a round side table, teak work desk with brass lamp, mini bar cabinet, wall-mounted smart TV, floor-to-ceiling windows overlooking the Chao Phraya River with a long-tail boat and temple spires in the soft distance
```

**bkk-fam-bed** — BKK Family · River wing
```
Family hotel room for up to four guests in a riverside Bangkok boutique hotel, two queen beds side by side with white linen and sky-blue cushions, bench at the foot of the beds, mini bar, wall-mounted smart TV, glass door opening to a small balcony with potted palms and a view of the Chao Phraya River
```

**bkk-ste-bed** — BKK Chao Phraya Suite (bedroom)
```
Luxury suite bedroom in a riverside Bangkok boutique hotel, king bed with tall upholstered headboard, Thai silk accents in champagne gold, brass reading lamps, panoramic windows opening to a private balcony above the Chao Phraya River, Wat Arun silhouette softly in the distance, morning light
```

**cnx-std-bed** — CNX Standard · Courtyard
```
Cosy standard hotel room for one or two guests in a Lanna-style boutique hotel in Chiang Mai old city, one queen bed with handwoven cotton throw in sand and indigo tones, carved teak headboard, smart TV, terracotta-tile floor, wooden window overlooking a quiet courtyard with frangipani and a small Lanna pavilion
```

**cnx-dlx-bed** — CNX Deluxe · Courtyard
```
Spacious deluxe hotel room in a Lanna-style boutique hotel in Chiang Mai, king bed with carved teak headboard, sitting area with teak armchairs and handwoven cushions, work desk, mini bar, smart TV, warm wooden floor, large window onto a leafy courtyard with distant mountain silhouettes of Doi Suthep
```

**cnx-fam-bed** — CNX Family · Courtyard
```
Family hotel room for up to four guests in a Lanna-style boutique hotel in Chiang Mai, two queen beds with handwoven cotton bedspreads, teak furniture, mini bar, smart TV, wooden doors opening to a garden balcony above a tropical courtyard with frangipani trees
```

**hkt-dlx-bed** — HKT Deluxe · Pool side
```
Spacious deluxe hotel room in a beach boutique hotel at Kata, Phuket, king bed with white linen and pale blue throw, whitewashed walls, rattan and light oak furniture, work desk, mini bar, smart TV, sliding glass doors opening to a terrace directly facing a turquoise swimming pool with palm trees
```

**hkt-fam-bed** — HKT Family · Pool side
```
Family hotel room for up to four guests in a beach boutique hotel at Kata, Phuket, two queen beds with white linen and sky-blue cushions, rattan headboards, mini bar, smart TV, sliding doors to a pool-side balcony with loungers and palm trees
```

**hkt-ste-bed** — HKT Andaman Suite (bedroom)
```
Luxury suite bedroom in a beach boutique hotel at Kata, Phuket, king bed facing floor-to-ceiling glass, panoramic balcony with a view over Kata Bay and the Andaman Sea, whitewashed walls, light oak floor, linen curtains moving in the breeze, champagne-gold accents, late afternoon light
```

## ช็อตเสริม

**Suite living room** (`bkk-ste-living`, `hkt-ste-living`) — เปลี่ยนวิวในวงเล็บตามสาขา
```
Separate living room of a hotel suite, sofa bed in natural linen with sky-blue cushions, coffee table, second smart TV, coffee maker and complimentary mini bar on a teak sideboard, work desk by the window, [view of the Chao Phraya River | view of the Andaman Sea] through large windows
```

**Bathroom** (`*-bath`) — Suite ใช้แบบมีอ่าง ห้องอื่นใช้แบบ walk-in shower
```
Suite: Bright hotel bathroom with a freestanding white bathtub by the window, terrazzo floor, double vanity in light oak, brass fixtures, rolled white towels, potted plant, soft daylight
Other rooms: Bright compact hotel bathroom with a walk-in rain shower behind clear glass, terrazzo floor, light oak vanity, brass fixtures, rolled white towels, soft daylight
```

**View** (`*-view`) — ถ่ายจากระเบียง/หน้าต่างของห้องนั้น
```
BKK River wing: View from a hotel balcony over the Chao Phraya River at golden hour, long-tail boat, temple spires and city skyline in the distance, rattan chair and small table in the foreground
BKK Garden wing: View from a hotel window into a lush tropical garden with frangipani trees and a stone path, morning light
CNX Courtyard: View from a Lanna-style hotel balcony into a quiet courtyard with a small teak pavilion, frangipani trees and mountains faintly in the distance
HKT Pool side: Pool-side terrace of a hotel room with two loungers, turquoise pool and palm trees, bright tropical daylight
HKT Sea view: Panoramic balcony over Kata Bay and the Andaman Sea, daybed with linen cushions in the foreground, soft sunset light
```
