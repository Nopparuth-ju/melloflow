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
- ปรับเปลี่ยน Design จาก Dark Mode (Aurora) เป็น **Light Pastel Theme**
- ก็อปปี้โฟลเดอร์จาก `07_` เป็น `Melloflow` เรียบร้อยแล้ว
