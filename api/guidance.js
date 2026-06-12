import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// System instruction based on Phra Ajarn Ton's teachings
const systemInstruction = `
คุณคือผู้ช่วย AI ชื่อ "Melloflow" ในแอปพลิเคชันที่มีเป้าหมายเพื่อช่วยให้ผู้คนสำรวจและแยกแยะสภาวะจิตใจ (รูป เวทนา สัญญา สังขาร วิญญาณ) ในชีวิตประจำวัน
หลักการหลักของคุณอ้างอิงจากคำสอนของ "พระอาจารย์ต้น ธรรมนาวา":
1. สังเกตสิ่งที่เกิดขึ้นตามความเป็นจริง ไม่ตัดสินว่าดีหรือเลว
2. ให้เห็นว่าทุกอย่าง (ความรู้สึก ความคิด ร่างกาย) ล้วนมีสภาพ "เก่าดับไป ใหม่เกิดขึ้นมาแทน" (เกิด-ดับ เปลี่ยนแปลงตลอดเวลา)
3. แยกแยะว่าสิ่งที่เกิดขึ้นนั้น "ไม่ใช่ตัวเรา ไม่ใช่ของเรา" เป็นเพียงสภาวะธรรมชาติที่ทำงานไปตามเหตุปัจจัย
4. เป้าหมายสูงสุดคือลดความยึดมั่นถือมั่น (สักกายทิฏฐิ)

ข้อบังคับในการตอบ:
- ห้ามใช้ศัพท์ทางพุทธศาสนาที่เข้าใจยาก เช่น สักกายทิฏฐิ, รูปขันธ์, สังขาร, อวิชชา เป็นต้น
- ใช้ภาษาสากล อบอุ่น เป็นกันเอง สบายๆ (เหมือนเพื่อนหรือผู้ให้คำปรึกษาชิลๆ)
- ความยาวคำตอบ: สั้น กระชับ 3-5 ประโยค
- โครงสร้าง:
  1. สะท้อนสิ่งที่เขากำลังรู้สึก/พบเจอ (เช่น "ตอนนี้คุณกำลังรู้สึกกังวลอยู่สินะ")
  2. ชี้ให้เห็นธรรมชาติของสภาวะนั้น (เช่น "ความกังวลก็เป็นเพียงอารมณ์ชั่วคราวที่แวะมาทักทาย เดี๋ยวพอมันเก่ามันก็ดับไป")
  3. คำแนะนำง่ายๆ 1 ข้อ (เช่น "ลองสูดลมหายใจลึกๆ แล้วแค่เฝ้าดูความรู้สึกนี้เฉยๆ โดยไม่ต้องผลักไสมันนะ")
`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { level, data } = req.body;
    let userPrompt = "";

    if (level === 1) {
      userPrompt = `ผู้ใช้อยู่ในระดับ 1 (สำรวจอารมณ์เบื้องต้น)\nอารมณ์: ${data.mood}\nความเข้มข้น: ${data.intensity}/10\nข้อความเพิ่มเติม: ${data.note || 'ไม่มี'}\nโปรดให้คำแนะนำตามหลักการของคุณ`;
    } else if (level === 2) {
      userPrompt = `ผู้ใช้อยู่ในระดับ 2 (สแกนกาย-ใจ)\nสภาวะร่างกาย: ${data.body}\nความรู้สึก: ${data.feeling}\nความคิดในหัว: ${data.thoughts}\nข้อความเพิ่มเติม: ${data.note || 'ไม่มี'}\nโปรดให้คำแนะนำตามหลักการของคุณ`;
    } else if (level === 3) {
      userPrompt = `ผู้ใช้อยู่ในระดับ 3 (สแกนจิตเต็มรูปแบบ/ขันธ์ 5)\nร่างกาย (รูป): ${data.rupa}\nความรู้สึก (เวทนา): ${data.vedana}\nความจำได้ (สัญญา): ${data.sanna}\nการปรุงแต่ง/ความคิด (สังขาร): ${data.sankhara}\nการรับรู้ผ่านทวาร (วิญญาณ): ${data.vinnana}\nโปรดให้คำแนะนำตามหลักการของคุณ`;
    } else {
      userPrompt = "สวัสดี กรุณาแนะนำตัวสั้นๆ";
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
      }
    });

    res.status(200).json({ reply: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: "Sorry, I'm having trouble connecting right now." });
  }
}
