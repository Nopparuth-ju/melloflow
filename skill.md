# World-Class UI/UX Design Standards (Skill Document)

เอกสารนี้เป็นข้อกำหนดและแนวทางสำหรับการสร้าง User Interface (UI) และ User Experience (UX) ระดับโลก (World-class app design) โดย AI Agent ทุกตัวที่เข้ามาทำงานในโปรเจกต์นี้ **ต้องปฏิบัติตามกฎเหล่านี้อย่างเคร่งครัด** เพื่อให้ได้ผลลัพธ์ที่ดู Premium, สวยงาม, และมีมาตรฐานสูงสุด

---

## 1. Design Philosophy (ปรัชญาการออกแบบ)
- **Whitespace is King**: ใช้พื้นที่ว่าง (Negative Space) ให้เป็นประโยชน์ อย่าอัดทุกอย่างเข้าด้วยกัน ปล่อยให้ UI ได้หายใจ
- **Visual Hierarchy**: กำหนดลำดับความสำคัญของสายตาให้ชัดเจน อะไรสำคัญสุดต้องใหญ่ สีชัด ที่เหลือต้องรองลงมา
- **Consistency**: ความสม่ำเสมอคือหัวใจสำคัญ ขนาดฟอนต์, ระยะห่าง, และสไตล์ของปุ่ม ต้องเหมือนกันทั้งแอป
- **Less is More**: ลดทอนสิ่งที่ไม่จำเป็นออกไป อะไรที่ซับซ้อนให้ซ่อนไว้เบื้องหลัง (Progressive Disclosure)

## 2. Spacing & Grid System (ระบบระยะห่าง)
ห้ามใช้ตัวเลขระยะห่างแบบสุ่ม (เช่น 11px, 17px, 23px) ให้ใช้ระบบ **8pt Grid System** เสมอ:
- Micro spacing: `2px`, `4px`
- Base spacing: `8px`, `12px`, `16px` (มาตรฐาน), `24px`
- Large spacing: `32px`, `48px`, `64px`

## 3. Typography (การจัดวางตัวอักษร)
ห้ามใช้ฟอนต์ตั้งต้นของเบราว์เซอร์เด็ดขาด ให้ใช้ฟอนต์ที่มีการออกแบบมาอย่างดี (เช่น Inter, SF Pro, Outfit, Noto Sans Thai, Fredoka)
- **H1 (Page Title)**: Size `2.5rem`, Weight `700/800`, Line-height `1.2`, Letter-spacing `-0.02em`
- **H2 (Section)**: Size `1.75rem`, Weight `600/700`, Line-height `1.3`, Letter-spacing `-0.01em`
- **Body**: Size `1rem`, Weight `400/500`, Line-height `1.5` ถึง `1.6` (เพื่อให้อ่านง่าย)
- **Caption/Small**: Size `0.875rem`, Weight `400/500`, Color ใช้สีเทาอ่อน (`var(--text-secondary)`)
*เคล็ดลับ: อย่าใช้สีดำสนิท `#000000` กับข้อความ ให้ใช้ `#1A1A24` หรือ `#333344` แทน เพื่อความนุ่มนวลสบายตา*

## 4. Color & Depth (สีและมิติ)
- **Soft Backgrounds**: ใช้สีพื้นหลังที่สว่างแบบนุ่มนวล (Pastel หรือ Off-white) หลีกเลี่ยงสีฉูดฉาดเป็นพื้นหลัง
- **Semantic Colors**: ใช้สีเพื่อสื่อความหมายเสมอ (เช่น แดง=ผิดพลาด/อันตราย, เขียว=สำเร็จ, เหลือง=ระวัง)
- **Layered Shadows**: ห้ามใช้เงาทื่อๆ เบลอๆ ทั่วไป ให้ใช้เงาซ้อนชั้น (Layered Shadow) เพื่อให้เกิดความลึกที่สมจริง ตัวอย่าง:
  ```css
  /* Soft Drop Shadow */
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  /* Floating/Elevated Shadow */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
  ```
- **Glassmorphism**: หากใช้เอฟเฟกต์กระจก ต้องมี `backdrop-filter: blur(10px)` ขึ้นไป และใส่เส้นขอบสีขาวบางๆ `border: 1px solid rgba(255, 255, 255, 0.5)` เพื่อเน้นขอบกระจก

## 5. Components & Icons (ส่วนประกอบและไอคอน)
- **Buttons**: 
  - ต้องมี Padding ที่สมดุล (เช่น `padding: 12px 24px`)
  - ความโค้ง (Border-radius) ต้องสัมพันธ์กับกล่องใหญ่ ถ้า UI โค้งมน ปุ่มควรโค้งมน (`16px` หรือ `9999px` สำหรับรูปแคปซูล)
- **Icons**: 
  - **ห้ามใช้อีโมจิแทนไอคอนเมนูหลักเด็ดขาด** (เว้นแต่เป็นฟีเจอร์ที่ตั้งใจให้ขี้เล่น)
  - ใช้ SVG Line-art Icon จากไลบรารีมาตรฐาน (เช่น Lucide, Feather) โดยกำหนด `stroke-width: 1.5` หรือ `2` เท่ากันทุกตัว

## 6. Micro-Interactions (การตอบสนองต่อผู้ใช้)
ทุกองค์ประกอบที่คลิกได้ (Buttons, Cards, Links) **ต้องมีการตอบสนอง (Feedback)** เมื่อ Hover หรือ Active เสมอ:
- **Transition**: `transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);`
- **Hover State**: เลื่อนขึ้นเล็กน้อย (`transform: translateY(-2px);`) หรือเพิ่มความเข้มของเงา
- **Active State (ตอนกด)**: ยุบตัวลงเล็กน้อย (`transform: scale(0.97);`) เพื่อให้ความรู้สึกเหมือนการกดปุ่มจริงๆ

## 7. Implementation Rules (กฎสำหรับ AI Agent)
- **โปรเจกต์นี้ใช้ Tailwind CSS (v4) เป็นหลัก** ในการจัดการ Styling แนะนำให้ใช้ Utility Classes ของ Tailwind แทนการเขียน Custom CSS (ยกเว้นแอนิเมชันหรือคอมโพเนนต์ที่ซับซ้อนมากๆ)
- หากต้องเขียน CSS ใหม่ ให้ใช้ CSS Variables หรือกำหนด `@theme` ของ Tailwind V4 เพื่อให้แก้ไขง่ายในอนาคต
- ต้องรองรับ Responsive Design (Mobile First) เป็นค่าเริ่มต้น
- โค้ด HTML ต้องสะอาด ใช้ Semantic Tags (`<header>`, `<main>`, `<section>`, `<nav>`) อย่างถูกต้อง
