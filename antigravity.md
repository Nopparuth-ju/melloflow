# Melloflow (Project Memory)

**Project Name**: Melloflow (เดิมชื่อ Mind Scanner)
**Concept**: แอปช่วยเช็คอินอารมณ์และแยกแยะสภาวะจิตใจตามหลัก "ขันธ์ 5" (แนวทางพระอาจารย์ต้น ธรรมนาวา) แต่ใช้ภาษาสากล สบายๆ ไม่ใช้ศัพท์ศาสนา
**Target Audience**: คนวัย 25-35 ปี ที่ต้องการแวะพักและทบทวนตัวเอง
**Design Aesthetic**: Warm Pastel Theme (สี Peach #F4A578, Lavender #D9C4F7, Mint #B8E8DC) พื้นหลังครีม #FDF8F4 โค้งมน glassmorphism, shimmer title (Outfit font), micro-animations, blob blur, modern & chill vibe

## Tech Stack
- **Frontend**: Vanilla JavaScript, Vite (v8), Tailwind CSS v4, HTML/CSS
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin) + custom CSS (`style.css`)
- **Fonts**: Kanit (body), Outfit (title accent) — ผ่าน Google Fonts
- **AI Model**: Google Gemini (`gemini-flash-lite-latest`) — เรียก API ตรงจาก Frontend
- **API Key**: เก็บใน `.env.local` → `VITE_GEMINI_API_KEY`
- **PWA**: มี `manifest.json` และ `sw.js` รองรับการติดตั้งบนมือถือ

## Core Features
1. **Level 1 (สำรวจอารมณ์)**: เช็คอินอารมณ์ด้วยอีโมจิ (แต่ละอารมณ์มีสี tint เฉพาะ) + slider ความเข้มข้นพร้อม live emoji indicator + ช่องระบาย
2. **Level 2 (สแกนกาย-ใจ)**: แยกสังเกตร่างกาย (ตึง/ปวด/เบา) และความรู้สึก (สุข/ทุกข์/เฉยๆ) และความคิด
3. **Level 3 (จับแยกขันธ์ 5)**: แยกรูป, เวทนา, สัญญา, สังขาร, วิญญาณ
4. **AI Guidance (Result Page)**: ส่งข้อมูลให้ Gemini วิเคราะห์ → แสดงผลด้วย Energy Orb (วงกลม gradient เปลี่ยนสีตาม Hz) + "Mello พูดว่า..." quote card
5. **Map of Consciousness**: Modal แสดงแผนผัง Hawkins แบบ horizontal bar chart (ไม่มี scroll)
6. **History**: บันทึกประวัติการสแกนด้วย `localStorage`

## File Structure (สำคัญ)
- `index.html` — โครงหลัก, bottom nav (3 tabs: home/explore/profile), frequency map modal
- `src/main.js` — ทุก view inject ด้วย innerHTML, router, submit logic, Gemini API call
- `src/style.css` — Tailwind import + custom animations (morph, float, shimmer, orb-breathe, pulse-glow), component styles (glass-card, feature-card, btn-submit, energy-orb, freq-map-btn)
- `public/icon.svg` — App icon: flat solid peach circle + "M" wave mark (ไม่มี gradient)
- `public/manifest.json` — PWA manifest, theme_color: #FDF8F4

## Important Commands
- `npm run dev` — รัน Vite dev server (แนะนำสำหรับ Frontend dev)
- `npm run build` — Build production bundle
- ต้องมีไฟล์ `.env.local` ที่ใส่ค่า `VITE_GEMINI_API_KEY=...` ไว้ด้วยเสมอ

## Current Status (13 June 2026)
- **สถาปัตยกรรม (Architecture):** เรียก Gemini API ตรงจาก Frontend (Direct Fetch) ผ่าน `VITE_GEMINI_API_KEY` ใน `.env.local`
- **โมเดล AI:** `gemini-flash-lite-latest` (ฟรี, เร็ว)
- **MECE Navigation & Structure (13 Jun):**
  - **Home:** โฟกัส Action (ปุ่มเช็คอิน 3 ระดับ) + ประวัติการเช็คอิน (History)
  - **Explore:** โฟกัส Knowledge & Self-Discovery (แบบทดสอบสภาวะจริต 6 + แผนผังพลังงาน Hawkins)
  - **Profile:** โฟกัส System Settings (เวอร์ชันแอป + ล้างประวัติ)
- **Jharita 6 Quiz & Premium Result UI (13 Jun):**
  - แบบทดสอบ "สภาวะขับอัตโนมัติ" (Default Autopilot) ตามหลัก "จริต 6"
  - 10 คำถาม (5 ตัวเลือก + พิมพ์เอง) ซ่อนการประเมินแบบแยบยลในชีวิตประจำวัน
  - **Premium Result View:** หน้าต่างผลลัพธ์แบบ Glassmorphism สวยงาม พร้อม Icon ประจำจริต, คำอธิบายลักษณะนิสัย, และ "Mello's Insight" (ข้อคิดประจำจริต)
- **Deep Prompt Integration (13 Jun):**
  - ฝังคำสั่งใน System Prompt ให้ Mello แนะนำการ "ทักอารมณ์ซ้ำๆ" ให้สอดคล้องกับจริต 6 ของผู้ใช้ (เช่น โทสะจริต -> ให้ทัก "ความอึดอัดขัดใจกำลังเกิดขึ้น")
- **Design Overhaul (13 Jun):**
  - ธีม Warm Pastel: พื้นหลัง #FDF8F4, blob blur(40px), glassmorphism cards & nav
  - ชื่อ "Melloflow" ใช้ shimmer gradient animation + Outfit font
  - App icon: flat peach (#F4A578) + "M" wave — ไม่มี gradient
  - Bottom nav: 3 tabs (home, explore, profile) + active dot indicator
- **Level 1 Redesign (13 Jun):**
  - Mood grid แต่ละอารมณ์มีสี tint เฉพาะ (เขียว, ฟ้า, ชมพู, ม่วง ฯลฯ)
  - Intensity slider มี live emoji indicator (😶→🙂→😐→😣→🔥) พร้อม bounce
  - แยก 3 sections: mood grid / intensity card / note card (ไม่ยัดใน card เดียว)
  - Icon สำรวจอารมณ์เป็นหน้ายิ้ม (ไม่ใช่หน้าบึ้ง), bubble emojis: 🌸😊💭✨
- **Result Page Redesign (13 Jun):**
  - แทนรูปคนนั่งสมาธิ SVG ด้วย Energy Orb (วงกลม gradient + glow pulse animation)
  - สี Orb เปลี่ยนตาม Hz: ≥500 ม่วง, ≥300 เขียว, ≥200 teal, <200 ส้ม-แดง
  - นำปุ่ม "ดูแผนผังระดับพลังงาน" กลับมาแสดงในหน้าผลลัพธ์ (ใต้ Energy Orb) เพื่อให้เปรียบเทียบได้ทันที
  - AI insight card มี "Mello พูดว่า..." header + avatar circle ตัว M
  - หน้า Loading เปลี่ยนข้อความเป็น "Mello กำลังคิดคำแนะนำ..."
- **Frequency Map Modal (13 Jun):**
  - เปลี่ยนจาก scrollable card list → compact horizontal bar chart (ไม่มี scroll)
  - แต่ละแถบสีสะท้อนระดับ (ม่วง→เขียว→เหลือง→ส้ม→แดง) ความยาวแถบตาม Hz
  - เพิ่มคำอธิบายสั้นๆ (Description) ใต้แต่ละระดับพลังงาน เพื่อบอกความหมายของสภาวะนั้นๆ
- **Quick Check-in (Quick Sets) (13 Jun):**
  - เพิ่ม Default Sets ประจำวัน 5 ชุด (เริ่มวันใหม่, หัวจะปวด, พักเบรกชิลๆ, ร่างแหลก, ก่อนนอน)
  - เปลี่ยนพฤติกรรมเป็น Pre-filled Form: กดแล้วดึงข้อมูลไปแสดงในฟอร์ม Level 2 ให้ผู้ใช้รีเช็คและแก้ไขก่อนกดส่ง (ไม่ Auto-submit)
- **Knowledge & UI Enhancements (13 Jun):**
  - **หน้า Explore:** เปลี่ยนหัวข้อเป็น "สำรวจจิตใจ" และเพิ่มปุ่ม "องค์ประกอบของชีวิต (ขันธ์ 5)" พร้อมศัพท์ภาษาอังกฤษกำกับ
  - **หน้า Home:** เพิ่ม Badge แสดงสภาวะขับอัตโนมัติ (Jharita) ใต้คำทักทาย (จะแสดงเมื่อทำแบบทดสอบเสร็จแล้ว)
  - **หน้า Home (Stats Badges):** เปลี่ยนระบบนับ Streak ให้ถูกต้อง (นับจำนวนวันที่ต่อเนื่องกันจริงๆ) และเพิ่ม Badge "รู้ทันอารมณ์ X ครั้ง" นับจำนวน Transaction ทั้งหมด
- **History Dashboard Insights (13 Jun):**
  - **การวิเคราะห์ (Stats):** เพิ่มกล่อง "ประโยคสรุป" และ "คำแนะนำเบื้องต้น" ใต้กราฟพลังงาน โดยสรุปแยกตามผลรวมเฉลี่ยของ วัน/สัปดาห์/เดือน นั้นๆ (พลังงานยอดเยี่ยม, ระดับบวก, มีความเครียดสะสม)
- **Cloud Sync & Authentication (13 Jun):**
  - อัปเกรดสถาปัตยกรรมจาก Local Storage เป็นระบบ Cloud-first อย่างเต็มรูปแบบ
  - ผสานรวม Firebase Authentication (Login ด้วย Email/Password) และ Cloud Firestore
  - ประวัติการสแกน (History) และชุดบันทึกด่วน (Quick Sets) ซิงค์ข้ามอุปกรณ์ผ่านคลาวด์
- **Character Name & Role System (13 Jun):**
  - ผู้ใช้สามารถตั้ง "ชื่อตัวละคร" ของตัวเองในแอปได้ (เปลี่ยนได้ที่หน้า Profile)
  - กำหนดสิทธิ์ Role: ผู้ใช้ทั่วไป (User) จำกัดการเปลี่ยนชื่อ 1 ครั้งต่อสัปดาห์ 
  - สิทธิ์ Admin: สามารถกดเปลี่ยนชื่อได้ไม่จำกัด (แก้ไข Role ได้ใน Firestore)
