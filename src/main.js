import './style.css';

// --- การตั้งค่า (Settings) ---
// รหัสผ่านและ API Key ถูกย้ายไปที่ไฟล์ .env.local เพื่อความปลอดภัยเวลายกขึ้น GitHub ครับ
// บน Vercel จะดึงจาก Environment Variables แทน
// ----------------------------

// Global state
window.appState = {
  currentView: 'home',
  history: JSON.parse(localStorage.getItem('meloflow_history') || '[]'),
};

// Simple router
window.navigate = (viewId) => {
  // Map index.html bottom nav IDs to actual views
  if (viewId === 'explore') viewId = 'level1';
  if (viewId === 'notifications') viewId = 'history';
  if (viewId === 'profile') viewId = 'settings';

  document.querySelectorAll('.page-section').forEach(el => {
    el.classList.add('hidden');
    el.classList.remove('flex');
  });
  const viewEl = document.getElementById(`view-${viewId}`);
  if (viewEl) {
    viewEl.classList.remove('hidden');
    viewEl.classList.add('flex');
  }

  // Update nav UI
  if (['home', 'explore', 'notifications', 'profile', 'level1', 'history', 'settings'].includes(viewId)) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('text-[#4A4A4A]');
      el.classList.add('text-[#a0a0b0]');
    });
    // Add active to correct icon
    const icons = { 'home': 0, 'level1': 1, 'history': 2, 'settings': 3 };
    const activeNav = document.querySelectorAll('.nav-item')[icons[viewId] !== undefined ? icons[viewId] : -1];
    if (activeNav) {
      activeNav.classList.remove('text-[#a0a0b0]');
      activeNav.classList.add('text-[#4A4A4A]');
    }
  }

  // Hook for history view
  if (viewId === 'history') {
    renderHistory();
  }
  if (viewId === 'settings') {
    document.getElementById('api-key-input').value = localStorage.getItem('meloflow_api_key') || '';
  }
};

const appDiv = document.querySelector('#app');

// Inject views
appDiv.innerHTML = `
  <!-- Home View -->
  <div id="view-home" class="page-section active flex flex-col space-y-5 animate-[fadeUp_0.4s_ease-out]">
    <div class="text-center mt-6 mb-8 animate-[fadeDown_0.8s_ease-out]">
      <h1 class="text-4xl font-bold text-[#FFD8C9] mb-2 tracking-wide" style="-webkit-text-stroke: 1.5px #6e5c53; text-shadow: 2px 3px 0px rgba(0,0,0,0.05);">Melloflow</h1>
      <h2 id="greeting-text" class="text-xl font-semibold text-[#333333]">สวัสดีตอนค่ำ 🌙</h2>
    </div>

    <div id="streak-badge" class="hidden items-center justify-center gap-2 bg-white text-[#ff9800] py-2 px-4 rounded-full text-sm font-bold mb-6 mx-auto shadow-[0_4px_10px_rgba(255,152,0,0.15)]">
      <i class="fa-solid fa-fire"></i> สแกนแล้ว <span id="streak-count">0</span> วันติดต่อกัน
    </div>

    <div class="flex flex-col gap-5 animate-[fadeUp_0.8s_ease-out_0.2s_both]">
      <div class="bg-[#FFD8C9] rounded-[24px] p-8 text-center relative cursor-pointer min-h-[64px] flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] active:scale-95 active:shadow-sm" onclick="navigate('level1')">
        <div class="bubble-emoji absolute bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-lg z-10 -top-2.5 -left-2.5" style="animation-delay: 0s;">😐</div>
        <div class="bubble-emoji absolute bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-lg z-10 top-6 -right-3.5" style="animation-delay: 1.5s;">😊</div>
        <div class="bubble-emoji absolute bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-lg z-10 -bottom-3.5 left-7" style="animation-delay: 0.8s;">😢</div>
        <div class="bubble-emoji absolute bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-lg z-10 -top-6 right-5" style="animation-delay: 2s;">😤</div>
        <div class="text-5xl mb-3 w-full flex justify-center text-[#4A4A4A]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 15h8"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
        </div>
        <h3 class="text-xl font-semibold text-[#333333]">สำรวจอารมณ์</h3>
      </div>

      <div class="bg-[#E5D4FF] rounded-[24px] p-8 text-center cursor-pointer min-h-[64px] flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] active:scale-95 active:shadow-sm" onclick="navigate('level2')">
        <div class="text-5xl mb-3 w-full flex justify-center text-[#4A4A4A]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <h3 class="text-xl font-semibold text-[#333333]">สแกนกาย-ใจ</h3>
      </div>

      <div class="bg-[#C9F2E9] rounded-[24px] p-8 text-center cursor-pointer min-h-[64px] flex flex-col items-center justify-center shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] active:scale-95 active:shadow-sm" onclick="navigate('level3')">
        <div class="text-5xl mb-3 w-full flex justify-center text-[#4A4A4A]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z"></path><path d="M5 4l1 2.5L8.5 7.5l-2.5 1L5 11l-1-2.5L1.5 7.5l2.5-1L5 4z"></path></svg>
        </div>
        <h3 class="text-xl font-semibold text-[#333333]">สแกนจิตเต็มรูปแบบ</h3>
      </div>
    </div>
  </div>

  <!-- Level 1 View -->
  <div id="view-level1" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <button class="bg-white border-none text-[#4A4A4A] text-base font-semibold flex items-center justify-center gap-2 cursor-pointer py-2.5 px-5 rounded-full mb-6 w-fit shadow-[0_4px_10px_rgba(0,0,0,0.05)] hover:bg-[#F8F9FA]" onclick="navigate('home')"><i class="fa-solid fa-arrow-left"></i> กลับ</button>
    <div class="text-center mt-6 mb-8">
      <h1 class="text-2xl font-semibold text-[#333333] mb-2">สำรวจอารมณ์ 🌊</h1>
      <p class="text-base text-[#666677]">อารมณ์ไหนที่ชัดเจนที่สุดในตอนนี้?</p>
    </div>
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50">
      <div class="grid grid-cols-4 gap-4 mt-4" id="l1-moods">
        <!-- Injected via JS -->
      </div>
      
      <div class="mt-6 mb-6">
        <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">ความเข้มข้นของอารมณ์ (1-5)</h4>
        <input type="range" id="l1-intensity" class="w-full my-5 accent-[#4A4A4A]" min="1" max="5" value="3">
        <div class="flex justify-between text-xs text-[#666677]">
          <span>เบาบาง</span><span>รุนแรง</span>
        </div>
      </div>

      <div class="mb-6">
        <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">อยากระบายอะไรสั้นๆ ไหม? (ไม่บังคับ)</h4>
        <textarea id="l1-note" class="w-full bg-[#F8F9FA] border border-[#E0E0E0] rounded-2xl p-4 text-[#4A4A4A] font-sans text-base resize-y min-h-[100px] mt-3 focus:outline-none focus:border-[#E5D4FF] focus:bg-white transition-colors duration-200" placeholder="เล่าให้ฟังหน่อย..."></textarea>
      </div>

      <button class="w-full p-[18px] rounded-[20px] bg-[#4A4A4A] text-white text-lg font-semibold font-sans mt-6 shadow-[0_8px_20px_rgba(74,74,74,0.2)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] active:scale-95 active:shadow-sm" onclick="submitLevel1()">ส่งให้ Mello ✨</button>
    </div>
  </div>

  <!-- Level 2 View -->
  <div id="view-level2" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <button class="bg-white border-none text-[#4A4A4A] text-base font-semibold flex items-center justify-center gap-2 cursor-pointer py-2.5 px-5 rounded-full mb-6 w-fit shadow-[0_4px_10px_rgba(0,0,0,0.05)] hover:bg-[#F8F9FA]" onclick="navigate('home')"><i class="fa-solid fa-arrow-left"></i> กลับ</button>
    <div class="text-center mt-6 mb-8">
      <h1 class="text-2xl font-semibold text-[#333333] mb-2">สแกนกาย-ใจ 🧘</h1>
      <p class="text-base text-[#666677]">ลองแยกสังเกตร่างกายกับจิตใจดูนะ</p>
    </div>
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">1. ร่างกายคุณรู้สึกอย่างไร?</h4>
        <div class="flex flex-wrap gap-2.5 mt-3" id="l2-body"></div>
      </div>
    </div>
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">2. ความรู้สึก (เวทนา) ตอนนี้เป็นแบบไหน?</h4>
        <div class="flex flex-wrap gap-2.5 mt-3" id="l2-feeling">
          <div class="chip py-2.5 px-5 rounded-full bg-white border border-[#E0E0E0] text-[#666677] text-sm font-medium cursor-pointer transition-all duration-200 shadow-sm" onclick="toggleChip(this, 'l2-feeling', true)">สุขสบาย 💚</div>
          <div class="chip py-2.5 px-5 rounded-full bg-white border border-[#E0E0E0] text-[#666677] text-sm font-medium cursor-pointer transition-all duration-200 shadow-sm" onclick="toggleChip(this, 'l2-feeling', true)">เป็นทุกข์ ❤️</div>
          <div class="chip py-2.5 px-5 rounded-full bg-white border border-[#E0E0E0] text-[#666677] text-sm font-medium cursor-pointer transition-all duration-200 shadow-sm" onclick="toggleChip(this, 'l2-feeling', true)">เฉยๆ 💛</div>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50">
      <div class="mb-6">
        <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">3. มีความคิดอะไรอยู่ในหัวบ้าง?</h4>
        <div class="flex flex-wrap gap-2.5 mt-3" id="l2-thoughts"></div>
      </div>
      <button class="w-full p-[18px] rounded-[20px] bg-[#4A4A4A] text-white text-lg font-semibold font-sans mt-2 shadow-[0_8px_20px_rgba(74,74,74,0.2)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] active:scale-95 active:shadow-sm" onclick="submitLevel2()">ส่งให้ Mello ✨</button>
    </div>
  </div>

  <!-- Level 3 View -->
  <div id="view-level3" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <button class="bg-white border-none text-[#4A4A4A] text-base font-semibold flex items-center justify-center gap-2 cursor-pointer py-2.5 px-5 rounded-full mb-6 w-fit shadow-[0_4px_10px_rgba(0,0,0,0.05)] hover:bg-[#F8F9FA]" onclick="navigate('home')"><i class="fa-solid fa-arrow-left"></i> กลับ</button>
    <div class="text-center mt-6 mb-8">
      <h1 class="text-2xl font-semibold text-[#333333] mb-2">สแกนจิต (ขันธ์ 5) ✨</h1>
      <p class="text-base text-[#666677]">แค่เฝ้าดูตามจริง ไม่ต้องผลักไส</p>
    </div>
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">รูป (Body - กายเป็นอย่างไร)</h4>
        <select id="l3-rupa" class="w-full p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E0E0E0] text-[#4A4A4A] font-sans text-base mt-2 cursor-pointer focus:outline-none focus:border-[#E5D4FF]">
          <option value="ผ่อนคลาย">ผ่อนคลาย เบาสบาย</option>
          <option value="ตึงเครียด">ตึงเครียด เกร็ง</option>
          <option value="ปวดเมื่อย">ปวดเมื่อย หนัก</option>
          <option value="ร้อน/หนาว">ร้อน/หนาวผิดปกติ</option>
          <option value="ปกติ">ปกติ ไม่รู้สึกอะไรเด่น</option>
        </select>
      </div>
    </div>
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">เวทนา (Feeling - ความรู้สึกที่เกิดขึ้น)</h4>
        <select id="l3-vedana" class="w-full p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E0E0E0] text-[#4A4A4A] font-sans text-base mt-2 cursor-pointer focus:outline-none focus:border-[#E5D4FF]">
          <option value="สุข">สุข (พอใจ สบายใจ)</option>
          <option value="ทุกข์">ทุกข์ (ไม่พอใจ บีบคั้น)</option>
          <option value="Equanimity">Equanimity (อุเบกขา/เฉยๆ)</option>
        </select>
      </div>
    </div>
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">สัญญา (Memory/Perception - ความจำได้หมายรู้)</h4>
        <select id="l3-sanna" class="w-full p-3.5 rounded-2xl bg-[#F8F9FA] border border-[#E0E0E0] text-[#4A4A4A] font-sans text-base mt-2 cursor-pointer focus:outline-none focus:border-[#E5D4FF]">
          <option value="อดีต">จำเรื่องราวในอดีตได้</option>
          <option value="คน/หน้าตา">จำหน้าคนหรือคำพูดคน</option>
          <option value="ป้ายสี/ตัดสิน">จำและเอามาตีความหมาย</option>
          <option value="ไม่มีอะไร">ไม่มีการจำอะไรชัดเจน</option>
        </select>
      </div>
    </div>
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">สังขาร (Thoughts/Fabrication - การปรุงแต่งจิต)</h4>
        <div class="flex flex-wrap gap-2.5 mt-3" id="l3-sankhara"></div>
      </div>
    </div>
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50">
      <div class="mb-6">
        <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">วิญญาณ (Awareness - รู้ผ่านทางไหน)</h4>
        <div class="flex flex-wrap gap-2.5 mt-3" id="l3-vinnana">
          <div class="chip py-2.5 px-5 rounded-full bg-white border border-[#E0E0E0] text-[#666677] text-sm font-medium cursor-pointer transition-all duration-200 shadow-sm" onclick="toggleChip(this, 'l3-vinnana', false)">ตา (เห็นภาพ)</div>
          <div class="chip py-2.5 px-5 rounded-full bg-white border border-[#E0E0E0] text-[#666677] text-sm font-medium cursor-pointer transition-all duration-200 shadow-sm" onclick="toggleChip(this, 'l3-vinnana', false)">หู (ได้ยินเสียง)</div>
          <div class="chip py-2.5 px-5 rounded-full bg-white border border-[#E0E0E0] text-[#666677] text-sm font-medium cursor-pointer transition-all duration-200 shadow-sm" onclick="toggleChip(this, 'l3-vinnana', false)">จมูก/ลิ้น/กาย</div>
          <div class="chip py-2.5 px-5 rounded-full bg-white border border-[#E0E0E0] text-[#666677] text-sm font-medium cursor-pointer transition-all duration-200 shadow-sm" onclick="toggleChip(this, 'l3-vinnana', false)">ใจ (รับรู้ความคิด)</div>
        </div>
      </div>
      <button class="w-full p-[18px] rounded-[20px] bg-[#4A4A4A] text-white text-lg font-semibold font-sans mt-2 shadow-[0_8px_20px_rgba(74,74,74,0.2)] transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(0,0,0,0.08)] active:scale-95 active:shadow-sm" onclick="submitLevel3()">ส่งให้ Mello ✨</button>
    </div>
  </div>

  <!-- Loading View -->
  <div id="view-loading" class="page-section hidden flex-col items-center justify-center animate-[fadeUp_0.4s_ease-out] min-h-[50vh]">
    <div class="w-12 h-12 border-4 border-[#f2e8fc] rounded-full border-t-[#e4d4f4] animate-[spin_1s_ease-in-out_infinite] my-10"></div>
    <p class="text-center text-[#666677]">Melloflow กำลังฟังคุณอยู่...</p>
  </div>

  <!-- Result View -->
  <div id="view-result" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <button class="bg-white border-none text-[#4A4A4A] text-base font-semibold flex items-center justify-center gap-2 cursor-pointer py-2.5 px-5 rounded-full mb-6 w-fit shadow-[0_4px_10px_rgba(0,0,0,0.05)] hover:bg-[#F8F9FA]" onclick="navigate('home')"><i class="fa-solid fa-house"></i> กลับหน้าแรก</button>
    <div class="text-center mt-2 mb-6">
      <h1 class="text-2xl font-semibold text-[#333333] mb-2">ข้อคิดสำหรับคุณ 🌿</h1>
    </div>
    
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 mb-4 text-center relative">
      <h4 class="text-sm font-semibold text-[#666677] mb-4 flex items-center justify-center gap-2">
        Current Energy Frequency
        <button onclick="openFrequencyMap()" class="w-5 h-5 rounded-full bg-[#FDFBF7] flex items-center justify-center text-[#a0a0b0] hover:text-[#4A4A4A] transition-colors border border-gray-100 shadow-sm">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        </button>
      </h4>
      
      <div class="flex justify-center mb-3">
        <svg id="energy-avatar" width="120" height="120" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" class="transition-all duration-700">
          <!-- Aura Background -->
          <circle id="aura-bg" cx="50" cy="50" r="45" fill="#C9F2E9" opacity="0.4" class="transition-colors duration-700"/>
          
          <!-- Sparkles -->
          <path d="M20 30 L23 20 L33 17 L23 14 L20 4 L17 14 L7 17 L17 20 Z" fill="white" opacity="0.8" />
          <path d="M80 70 L82 65 L87 63 L82 61 L80 56 L78 61 L73 63 L78 65 Z" fill="white" opacity="0.8" />
          
          <!-- Meditating Cute Person -->
          <!-- Head -->
          <circle cx="50" cy="35" r="14" stroke="#4A4A4A" stroke-width="3" fill="none"/>
          <!-- Closed Eyes -->
          <path d="M43 35 Q46 38 48 35" stroke="#4A4A4A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <path d="M52 35 Q54 38 57 35" stroke="#4A4A4A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <!-- Small Smile -->
          <path d="M48 41 Q50 43 52 41" stroke="#4A4A4A" stroke-width="2.5" stroke-linecap="round" fill="none"/>
          <!-- Body / Legs -->
          <path d="M50 49 L50 65 M50 65 L32 75 M50 65 L68 75 M32 75 L45 75 M68 75 L55 75" stroke="#4A4A4A" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <!-- Arms resting -->
          <path d="M38 52 Q32 60 40 70 M62 52 Q68 60 60 70" stroke="#4A4A4A" stroke-width="3" stroke-linecap="round" fill="none"/>
        </svg>
      </div>

      <div id="energy-level-display" class="text-4xl font-bold text-[#4A4A4A] flex items-center justify-center gap-2 mt-4 transition-colors duration-700">
        ⚡ 200 Hz
      </div>
      <p id="energy-paradigm" class="text-xs font-semibold mt-2 text-[#a0a0b0] transition-colors duration-700">Courage (Reason Paradigm)</p>
    </div>

    <div class="bg-white rounded-[32px] p-6 shadow-[0_15px_35px_rgba(0,0,0,0.05)] border-2 border-white/50">
      <div class="leading-relaxed text-base text-[#4A4A4A] whitespace-pre-wrap" id="insight-text">
        <!-- AI output here -->
      </div>
    </div>
  </div>

  <!-- History View -->
  <div id="view-history" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <div class="text-center mt-6 mb-8">
      <h1 class="text-2xl font-semibold text-[#333333] mb-2">ประวัติของคุณ 🕰️</h1>
      <p class="text-base text-[#666677]">การเติบโตของการดูใจตัวเอง</p>
    </div>
    <div id="history-container" class="flex flex-col gap-4">
      <!-- Injected via JS -->
    </div>
  </div>

  <!-- Settings View -->
  <div id="view-settings" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <div class="text-center mt-6 mb-8">
      <h1 class="text-2xl font-semibold text-[#333333] mb-2">ตั้งค่า ⚙️</h1>
    </div>
    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50 mb-4">
      <h4 class="text-base font-semibold text-[#4A4A4A] mb-3">Gemini API Key</h4>
      <p class="text-xs text-[#666677] mb-3">ใส่ API Key จาก Google AI Studio เพื่อใช้งาน AI ขั้นสูง (gemini-1.5-pro)</p>
      <input type="password" id="api-key-input" class="w-full bg-[#F8F9FA] border border-[#E0E0E0] rounded-xl p-3 text-[#4A4A4A] font-sans text-sm focus:outline-none focus:border-[#E5D4FF]" placeholder="AIzaSy...">
      <button class="w-full mt-3 py-3 rounded-xl bg-[#E5D4FF] text-[#4A4A4A] font-semibold text-sm transition-all hover:bg-[#d6bdf8]" onclick="saveApiKey()">บันทึก API Key</button>
    </div>

    <div class="bg-white rounded-[32px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50">
      <div class="flex justify-between items-center mb-6">
        <div>
          <h4 class="text-base font-semibold text-[#4A4A4A] mb-1">การแจ้งเตือน</h4>
          <p class="text-xs text-[#666677]">เตือนให้แวะพักใจ</p>
        </div>
        <button id="btn-noti" class="w-auto py-2 px-4 rounded-full bg-[#4A4A4A] text-white text-sm font-semibold shadow-[0_8px_20px_rgba(74,74,74,0.2)] transition-all hover:-translate-y-1 active:scale-95" onclick="enableNotifications()">เปิด</button>
      </div>
      <hr class="border-[#F8F9FA] my-6">
      <div class="flex justify-between items-center">
        <div>
          <h4 class="text-base font-semibold text-[#4A4A4A] mb-1">ลบข้อมูล</h4>
          <p class="text-xs text-[#666677]">ลบประวัติการแสกนทั้งหมด</p>
        </div>
        <button class="py-2 px-4 rounded-full bg-red-50 text-red-500 font-semibold text-sm transition-all hover:bg-red-100" onclick="clearHistory()">ลบ</button>
      </div>
    </div>
  </div>
`;

// Helper: Toggle Chip selection
window.toggleChip = (el, containerId, singleSelect = false) => {
  const selectedClasses = ['bg-[#4A4A4A]', 'text-white', 'border-[#4A4A4A]', 'shadow-md'];
  const unselectedClasses = ['bg-white', 'text-[#666677]', 'border-[#E0E0E0]'];

  if (singleSelect) {
    document.querySelectorAll(`#${containerId} .chip`).forEach(c => {
      c.classList.remove(...selectedClasses, 'selected');
      c.classList.add(...unselectedClasses);
    });
  }
  const isSelected = el.classList.toggle('selected');
  if (isSelected) {
    el.classList.remove(...unselectedClasses);
    el.classList.add(...selectedClasses);
  } else {
    el.classList.remove(...selectedClasses);
    el.classList.add(...unselectedClasses);
  }
};

// Data for Chips/Moods
const moods = [
  { emoji: '😊', label: 'สบายใจ' }, { emoji: '😐', label: 'เฉยๆ' },
  { emoji: '😔', label: 'หนักใจ' }, { emoji: '😤', label: 'หงุดหงิด' },
  { emoji: '😰', label: 'กังวล' }, { emoji: '😴', label: 'เหนื่อย' },
  { emoji: '🤔', label: 'สับสน' }, { emoji: '✨', label: 'มีพลัง' }
];

const bodyStates = ['ผ่อนคลาย', 'ตึงเครียด', 'ปวดเมื่อย', 'เบาสบาย', 'หนักอึ้ง', 'อ่อนเพลีย'];
const thoughts = ['วางแผนอนาคต', 'คิดกังวล', 'ครุ่นคิดเรื่องเก่า', 'ตัดสินตัวเอง/ผู้อื่น', 'ว่างเปล่า', 'คิดเรื่อยเปื่อย'];
const sankhara = ['โกรธ', 'โลภ/อยาก', 'หลง/เหม่อ', 'เมตตา', 'ปล่อยวาง', 'ฟุ้งซ่าน', 'หดหู่'];

// Init UI Data
document.getElementById('l1-moods').innerHTML = moods.map(m => `
  <div class="mood-item flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 py-4 px-2 rounded-[20px] bg-[#F8F9FA] border-2 border-transparent hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]" onclick="selectMood(this, '${m.label}')">
    <span class="text-4xl">${m.emoji}</span>
    <span class="text-xs font-semibold text-[#4A4A4A]">${m.label}</span>
  </div>
`).join('');

let selectedL1Mood = null;
window.selectMood = (el, label) => {
  const selectedClasses = ['bg-[#FFD8C9]', 'border-white', 'scale-105', 'shadow-[0_4px_12px_rgba(255,216,201,0.5)]'];
  const unselectedClasses = ['bg-[#F8F9FA]', 'border-transparent'];

  document.querySelectorAll('.mood-item').forEach(m => {
    m.classList.remove(...selectedClasses, 'selected');
    m.classList.add(...unselectedClasses);
  });

  el.classList.remove(...unselectedClasses);
  el.classList.add(...selectedClasses, 'selected');
  selectedL1Mood = label;
};

const baseChipClass = "chip py-2.5 px-5 rounded-full bg-white border border-[#E0E0E0] text-[#666677] text-sm font-medium cursor-pointer transition-all duration-200 shadow-sm";
document.getElementById('l2-body').innerHTML = bodyStates.map(s => `<div class="${baseChipClass}" onclick="toggleChip(this, 'l2-body')">${s}</div>`).join('');
document.getElementById('l2-thoughts').innerHTML = thoughts.map(s => `<div class="${baseChipClass}" onclick="toggleChip(this, 'l2-thoughts')">${s}</div>`).join('');
document.getElementById('l3-sankhara').innerHTML = sankhara.map(s => `<div class="${baseChipClass}" onclick="toggleChip(this, 'l3-sankhara')">${s}</div>`).join('');

// Setup Greeting & Streak
const updateGreeting = () => {
  const hour = new Date().getHours();
  let text = "สวัสดี";
  if (hour < 12) text = "สวัสดีตอนเช้า ☀️";
  else if (hour < 16) text = "สวัสดีตอนบ่าย ☕";
  else if (hour < 19) text = "สวัสดีตอนเย็น 🌿";
  else text = "สวัสดีตอนค่ำ 🌙";
  document.getElementById('greeting-text').innerText = text;

  // Simple streak logic
  const history = window.appState.history;
  if (history.length > 0) {
    document.getElementById('streak-badge').style.display = 'inline-flex';
    // Dummy logic for prototype: just show total counts
    document.getElementById('streak-count').innerText = history.length;
  } else {
    document.getElementById('streak-badge').style.display = 'none';
  }
};
updateGreeting();

// Submit Functions
window.submitLevel1 = async () => {
  if (!selectedL1Mood) return alert("กรุณาเลือกอารมณ์ก่อนครับ");
  const data = {
    mood: selectedL1Mood,
    intensity: document.getElementById('l1-intensity').value,
    note: document.getElementById('l1-note').value
  };
  await callGeminiAPI(1, data);
};

window.submitLevel2 = async () => {
  const getSelected = (id) => Array.from(document.querySelectorAll(`#${id} .selected`)).map(c => c.innerText).join(', ');
  const data = {
    body: getSelected('l2-body') || 'ไม่ได้ระบุ',
    feeling: getSelected('l2-feeling') || 'ไม่ได้ระบุ',
    thoughts: getSelected('l2-thoughts') || 'ไม่ได้ระบุ'
  };
  await callGeminiAPI(2, data);
};

window.submitLevel3 = async () => {
  const getSelected = (id) => Array.from(document.querySelectorAll(`#${id} .selected`)).map(c => c.innerText).join(', ');
  const data = {
    rupa: document.getElementById('l3-rupa').value,
    vedana: document.getElementById('l3-vedana').value,
    sanna: document.getElementById('l3-sanna').value,
    sankhara: getSelected('l3-sankhara') || 'ไม่ได้ระบุ',
    vinnana: getSelected('l3-vinnana') || 'ไม่ได้ระบุ'
  };
  await callGeminiAPI(3, data);
};

window.saveApiKey = () => {
  const key = document.getElementById('api-key-input').value;
  localStorage.setItem('meloflow_api_key', key);
  alert('บันทึก API Key เรียบร้อยแล้วครับ!');
};

function calculateEnergyLevel(data) {
  const map = {
    'สบายใจ': { freq: 540, name: 'Joy (Spiritual)', color: '#E5D4FF' },
    'เฉยๆ': { freq: 250, name: 'Neutrality (Reason)', color: '#C9F2E9' },
    'หนักใจ': { freq: 125, name: 'Desire (Survival)', color: '#FFD8C9' },
    'หงุดหงิด': { freq: 150, name: 'Anger (Survival)', color: '#FFD8C9' },
    'กังวล': { freq: 100, name: 'Fear (Survival)', color: '#FFD8C9' },
    'เหนื่อย': { freq: 125, name: 'Desire (Survival)', color: '#FFD8C9' },
    'สับสน': { freq: 175, name: 'Pride (Survival)', color: '#FFD8C9' },
    'มีพลัง': { freq: 500, name: 'Love (Spiritual)', color: '#E5D4FF' }
  };

  let info = { freq: 200, name: 'Courage (Reason)', color: '#C9F2E9' };
  if (data.mood && map[data.mood]) info = map[data.mood];
  if (data.sankhara) {
    if (data.sankhara.includes('โกรธ')) info = { freq: 150, name: 'Anger', color: '#FFD8C9' };
    else if (data.sankhara.includes('เมตตา')) info = { freq: 500, name: 'Love', color: '#E5D4FF' };
    else if (data.sankhara.includes('ปล่อยวาง')) info = { freq: 350, name: 'Acceptance', color: '#C9F2E9' };
    else if (data.sankhara.includes('หดหู่')) info = { freq: 50, name: 'Apathy', color: '#FFD8C9' };
  }
  return info;
}

const getSystemPrompt = () => `คุณคือ Mello ผู้ช่วยส่วนตัวที่คอยให้คำแนะนำด้านจิตใจและอารมณ์ 
การให้คำแนะนำของคุณจะอิงหลักการทางพุทธศาสนาแบบร่วมสมัย โดยใช้คำภาษาอังกฤษผสมให้เข้าใจง่าย (เช่น Body, Feeling, Memory, Thought, Awareness) แทนศัพท์เฉพาะทางที่หนักเกินไป
มีกฎการตอบดังนี้:
1. แก่นแท้: สอนให้ผู้ใช้แยก "ผู้สังเกต" ออกจาก "สิ่งที่ถูกสังเกต" จิตเป็นสิ่งหนึ่ง อารมณ์เป็นอีกสิ่งหนึ่ง อารมณ์เป็นเพียงสภาวะปรุงแต่ง เกิดขึ้นตั้งอยู่ดับไป ไม่ใช่ตัวตน
2. ถ้าผู้ใช้ส่งข้อมูล Level 1: แนะนำให้ทักอารมณ์แบบซื่อๆ เช่น "ความกังวลกำลังเกิดขึ้น" การทักอารมณ์ช่วยแยกจิตออกจากอารมณ์
3. ถ้าผู้ใช้ส่งข้อมูล Level 2: ชวนพิจารณาความจริงทางกายภาพ ทุบอีโก้ ว่าร่างกายนี้ประกอบจากธาตุตามธรรมชาติ ไม่มีใครเป็นเจ้าของใคร ไม่มีความเป็นอัตตา
4. ถ้าผู้ใช้ส่งข้อมูล Level 3: วิเคราะห์ขันธ์ 5 ว่าเป็นเพียงระบบที่ทำงานประสานกันชั่วคราว ให้ตระหนักถึง "ทุกข์" ที่ต้องกำหนดรู้ และ "สมุทัย" ความดิ้นรนอยากเปลี่ยนโลกที่ต้องละ
5. ตอนท้าย: ให้คำแนะนำสั้นๆ หรือให้กำลังใจด้วยการระลึกถึงความจริง สัจจะ หรือพระรัตนตรัยเป็นที่พึ่งที่แท้จริง
ตอบกลับด้วยข้อความที่สั้น กระชับ เป็นกันเอง (ใช้ภาษาไทย) ไม่เกิน 4-5 ประโยค และเชื่อมโยงกับการยกระดับ "ความถี่พลังงาน (Frequency)" ที่ได้รับมาให้สูงขึ้นด้วยครับ`;

async function callGeminiAPI(level, data) {
  // ดึง API Key จาก Environment Variable (.env.local หรือ Vercel), ถ้าไม่มีให้ดึงจาก LocalStorage
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('meloflow_api_key');

  if (!apiKey) {
    alert("กรุณาตั้งค่า Gemini API Key ในโค้ดหรือในเมนู 'ตั้งค่า' (Profile) ก่อนใช้งานครับ");
    navigate('settings');
    return;
  }

  navigate('loading');
  try {
    const energyInfo = calculateEnergyLevel(data);

    const promptText = `ผู้ใช้กำลังบันทึกสภาวะจิตใจ Level ${level}\nข้อมูลที่บันทึก: ${JSON.stringify(data)}\nพลังงานความถี่ปัจจุบัน (David Hawkins Scale): ${energyInfo.freq} Hz (${energyInfo.name})\nโปรดให้คำแนะนำตามกฎ System Logic ที่ตั้งไว้`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        systemInstruction: { parts: [{ text: getSystemPrompt() }] }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }
    const result = await response.json();
    const reply = result.candidates[0].content.parts[0].text;

    // Update Result UI
    document.getElementById('energy-level-display').innerText = `⚡ ${energyInfo.freq} Hz`;
    document.getElementById('energy-level-display').style.color = `${energyInfo.freq >= 400 ? '#A78BFA' : (energyInfo.freq >= 200 ? '#34D399' : '#F87171')}`;

    // Set Aura color
    document.getElementById('aura-bg').setAttribute('fill', energyInfo.color);

    document.getElementById('energy-paradigm').innerText = energyInfo.name;
    document.getElementById('insight-text').innerText = reply;

    // Save history
    window.appState.history.unshift({
      date: new Date().toISOString(),
      level: level,
      data: data,
      freq: energyInfo.freq,
      insight: reply
    });
    localStorage.setItem('meloflow_history', JSON.stringify(window.appState.history));
    updateGreeting();

    navigate('result');
  } catch (error) {
    console.error("Gemini Fetch Error:", error);
    alert("เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ Gemini:\n\n" + error.message);
    navigate(`level${level}`);
  }
}

// Global functions for Frequency Map Modal
window.openFrequencyMap = () => {
  const modal = document.getElementById('frequency-modal');
  const content = modal.querySelector('div');
  modal.classList.remove('hidden');
  // Small delay to allow display:block to apply before animating opacity/transform
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    content.classList.remove('scale-95');
    content.classList.add('scale-100');
  }, 10);
};

window.closeFrequencyMap = () => {
  const modal = document.getElementById('frequency-modal');
  const content = modal.querySelector('div');
  modal.classList.remove('opacity-100');
  modal.classList.add('opacity-0');
  content.classList.remove('scale-100');
  content.classList.add('scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300); // Wait for transition
};

document.addEventListener('DOMContentLoaded', initApp);

// History Render
window.renderHistory = () => {
  const container = document.getElementById('history-container');
  const history = window.appState.history;

  if (history.length === 0) {
    container.innerHTML = '<p class="text-[#666677] text-center py-10">ยังไม่มีประวัติการเช็คอิน ลองเช็คใจดูนะ 🌿</p>';
    return;
  }

  container.innerHTML = history.map(h => {
    const d = new Date(h.date);
    const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    let summary = '';
    if (h.level === 1) summary = `อารมณ์: ${h.data.mood} (เข้มข้น: ${h.data.intensity})`;
    else if (h.level === 2) summary = `ความรู้สึก: ${h.data.feeling}`;
    else summary = `ขันธ์ 5 (เวทนา: ${h.data.vedana})`;

    return `
      <div class="bg-white rounded-[24px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.05)] border-2 border-white/50">
        <div class="flex justify-between mb-2">
          <span class="text-xs text-[#666677]">${dateStr}</span>
          <span class="text-[10px] py-1 px-3 rounded-full bg-[#F8F9FA] text-[#4A4A4A] font-semibold">Level ${h.level}</span>
        </div>
        <p class="text-sm font-semibold text-[#4A4A4A] mb-3">${summary}</p>
        <div class="text-sm text-[#4A4A4A] bg-[#FDFBF7] p-4 rounded-2xl border border-[#E0E0E0]">
          ${h.insight.substring(0, 100)}...
        </div>
      </div>
    `;
  }).join('');
};

window.clearHistory = () => {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัติทั้งหมด?')) {
    window.appState.history = [];
    localStorage.removeItem('meloflow_history');
    renderHistory();
    updateGreeting();
  }
};

window.enableNotifications = () => {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    alert("เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน");
    return;
  }
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      document.getElementById('btn-noti').innerText = "เปิดแล้ว";
      document.getElementById('btn-noti').style.background = "var(--color-teal)";

      navigator.serviceWorker.register('/sw.js')
        .then(reg => console.log('SW registered', reg))
        .catch(err => console.error('SW error', err));

      alert("เปิดการแจ้งเตือนสำเร็จ! Melloflow จะทักไปเวลา 10:00, 12:30 และ 15:00 น.");
    }
  });
};

// Auto register SW for caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
