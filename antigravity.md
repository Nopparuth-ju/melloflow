# Melloflow (Project Memory)

**Project Name**: Melloflow (เดิมชื่อ Mind Scanner)
**Concept**: แอปช่วยเช็คอินอารมณ์และแยกแยะสภาวะจิตใจตามหลัก "ขันธ์ 5" (แนวทางพระอาจารย์ต้น ธรรมนาวา) แต่ใช้ภาษาสากล สบายๆ ไม่ใช้ศัพท์ศาสนา
**Target Audience**: คนวัย 25-35 ปี ที่ต้องการแวะพักและทบทวนตัวเอง
**Design Aesthetic**: Light Pastel Theme (สี Peach, Lavender, Mint) โค้งมน น่ารัก เป็นมิตร มีอนิเมชั่น blob อ่อนๆ ด้านหลัง

## Tech Stack
- **Frontend**: Vanilla JavaScript, Vite, HTML/CSS
- **Backend (AI)**: Vercel Serverless Functions (`/api/guidance.js`)
- **AI Model**: Google Gemini (`gemini-2.0-flash`) ผ่าน `@google/genai`
- **PWA**: มี `manifest.json` และ `sw.js` รองรับการติดตั้งบนมือถือและแจ้งเตือน

## Core Features
1. **Level 1 (สำรวจอารมณ์)**: เช็คอินอารมณ์เร็วๆ ด้วยอีโมจิ + ระดับความเข้มข้น
2. **Level 2 (สแกนกาย-ใจ)**: แยกสังเกตร่างกาย (ตึง/ปวด/เบา) และความรู้สึก (สุข/ทุกข์/เฉยๆ) และความคิด
3. **Level 3 (สแกนจิตเต็มรูปแบบ/ขันธ์ 5)**: แยกรูป, เวทนา, สัญญา, สังขาร, วิญญาณ
4. **AI Guidance**: ส่งข้อมูลไปให้ Gemini วิเคราะห์และให้คำแนะนำสั้นๆ (3-5 ประโยค) เพื่อดึงสติกลับมาอยู่กับปัจจุบัน เน้นความเข้าใจเรื่องการเกิด-ดับ และไม่ใช่ตัวตน
5. **History**: บันทึกประวัติการสแกนด้วย `localStorage`

## Important Commands
- `npm run dev` (สำหรับการรัน Frontend ล้วนๆ บน Vite - ไม่แนะนำเพราะใช้งาน Vercel Functions ไม่ได้)
- `vercel dev` (แนะนำ! สำหรับการรันทดสอบทั้ง Frontend + Backend Serverless)
- ต้องมีไฟล์ `.env` ที่ใส่ค่า `GEMINI_API_KEY=...` ไว้ด้วยเสมอ

## Current Status (12 June 2026)
- **สถาปัตยกรรม (Architecture):** ปรับการเรียก AI กลับมาเป็นการยิง API ตรงๆ (Direct Fetch) จากฝั่ง Frontend (`main.js`) แทน Vercel Functions เพื่อเลี่ยงปัญหา Quota และย้ายการเก็บ API Key ไปไว้ใน `.env.local` (`VITE_GEMINI_API_KEY`) อย่างปลอดภัย
- **อัปเดตโมเดล AI:** เปลี่ยนไปใช้ `gemini-flash-lite-latest` หรือรุ่นที่ใช้งานได้ฟรีและเร็วเพื่อป้องกันข้อผิดพลาด Quota Limit = 0
- **เพิ่มฟีเจอร์ Map of Consciousness:** เพิ่มปุ่มและหน้าต่าง Modal เด้งขึ้นมาเพื่อแสดงระดับความถี่พลังงานตามทฤษฎีของ David R. Hawkins
- **UX/UI Revamp:** 
  - ลบเมนู 'การแจ้งเตือน' (Notifications) ที่ไม่ได้ใช้ออก
  - ปรับปรุงหน้า 'ตั้งค่า' (Settings) ให้เป็นหน้า 'โปรไฟล์' (Profile) โชว์เวอร์ชันแอป
  - นำช่องกรอก API Key แบบแมนนวลออก (เน้นตั้งค่าผ่าน `.env.local` แทน)
  - จัดระเบียบปุ่มต่างๆ ให้เคลียร์และใหญ่ขึ้น
