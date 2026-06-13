import './style.css';
import Chart from 'chart.js/auto';
import { auth, db } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  deleteDoc,
  query, 
  orderBy 
} from 'firebase/firestore';

// --- การตั้งค่า (Settings) ---
// รหัสผ่านและ API Key ถูกย้ายไปที่ไฟล์ .env.local เพื่อความปลอดภัยเวลายกขึ้น GitHub ครับ
// บน Vercel จะดึงจาก Environment Variables แทน
// ----------------------------

// Global state
window.appState = {
  currentView: 'splash',
  user: null,
  userProfile: null,
  history: [],
  quickSets: []
};

// Default Quick Sets template
const defaultQuickSets = [
  {"id":"qs_default_1","name":"🌅 เริ่มวันใหม่","data":{"body":["เบาสบาย"],"feeling":["เฉยๆ 💛"],"thoughts":["วางแผนอนาคต"]}},
  {"id":"qs_default_2","name":"💻 หัวจะปวด","data":{"body":["ตึงเครียด","ปวดเมื่อย"],"feeling":["เป็นทุกข์ ❤️"],"thoughts":["คิดกังวล","ฟุ้งซ่าน"]}},
  {"id":"qs_default_3","name":"☕ พักเบรกชิลๆ","data":{"body":["ผ่อนคลาย"],"feeling":["สุขสบาย 💚"],"thoughts":["คิดเรื่อยเปื่อย"]}},
  {"id":"qs_default_4","name":"🔋 ร่างแหลก","data":{"body":["อ่อนเพลีย","หนักอึ้ง"],"feeling":["เป็นทุกข์ ❤️"],"thoughts":["ว่างเปล่า"]}},
  {"id":"qs_default_5","name":"🌙 ก่อนนอน","data":{"body":["ผ่อนคลาย"],"feeling":["เฉยๆ 💛"],"thoughts":["ครุ่นคิดเรื่องเก่า"]}}
];

// Simple router
const navItems = document.querySelectorAll('.nav-item');

window.navigate = (viewId) => {
  if (viewId === 'notifications') return; // Feature removed

  // Map index.html bottom nav IDs to actual views
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

  // Update nav UI (only home, explore, profile tabs remain in index.html)
  const navEl = document.querySelector('nav');
  if (viewId === 'onboarding') {
    if (navEl) navEl.style.display = 'none';
  } else {
    if (navEl) navEl.style.display = 'flex';
  }

  if (['home', 'history', 'explore', 'profile', 'level1', 'settings'].includes(viewId)) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.remove('text-[#3D3D4F]', 'active');
      el.classList.add('text-[#b0b0c0]');
    });
    // Add active to correct icon
    let activeIndex = -1;
    if (viewId === 'home') activeIndex = 0;
    if (viewId === 'history') activeIndex = 1;
    if (viewId === 'explore') activeIndex = 2;
    if (viewId === 'settings' || viewId === 'profile') activeIndex = 3;
    
    const activeNav = document.querySelectorAll('.nav-item')[activeIndex];
    if (activeNav) {
      activeNav.classList.remove('text-[#b0b0c0]');
      activeNav.classList.add('text-[#3D3D4F]', 'active');
    }
  }

  // Hook for settings view
  if (viewId === 'settings') {
    // API key logic removed, settings is now profile
  }
};

const appDiv = document.querySelector('#app');

// Inject views
appDiv.innerHTML = `
  <!-- Splash / Loading View -->
  <div id="view-splash" class="page-section flex-col items-center justify-center min-h-[100vh] bg-[#FDF8F4] z-[100]">
    <div class="w-16 h-16 border-4 border-[#E8D8F8] rounded-full border-t-[#D9C4F7] animate-[spin_1s_ease-in-out_infinite] mb-6"></div>
    <p class="text-lg font-bold text-[#3D3D4F] animate-pulse">กำลังซิงค์ข้อมูล Mello...</p>
  </div>

  <!-- Auth View -->
  <div id="view-auth" class="page-section hidden flex-col items-center justify-center animate-[fadeUp_0.4s_ease-out] min-h-[100vh] px-6">
    <div class="text-center mb-8">
      <img src="/icon.svg" class="w-20 h-20 mx-auto mb-6 rounded-full shadow-[0_8px_24px_rgba(244,165,120,0.3)]" alt="Melloflow Logo">
      <h1 class="text-3xl font-bold text-[#3D3D4F] mb-2" style="font-family: 'Outfit', 'Kanit', sans-serif;">Melloflow</h1>
      <p class="text-sm text-[#888899]">แวะพักใจ แล้วไปต่อ</p>
    </div>
    
    <div class="glass-card rounded-[32px] p-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)] w-full max-w-sm">
      <div id="auth-error" class="hidden mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-xl border border-red-100 text-center"></div>
      
      <!-- Login Form -->
      <div id="form-login" class="flex flex-col gap-4">
        <div>
          <label class="block text-sm font-semibold text-[#5B5B6E] mb-1.5">อีเมล</label>
          <input type="email" id="login-email" class="w-full p-3.5 rounded-2xl bg-[#F8F5F0] border border-[#E8E0D8] text-[#3D3D4F] focus:outline-none focus:border-[#D9C4F7]" placeholder="hello@melloflow.app">
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#5B5B6E] mb-1.5">รหัสผ่าน</label>
          <input type="password" id="login-password" class="w-full p-3.5 rounded-2xl bg-[#F8F5F0] border border-[#E8E0D8] text-[#3D3D4F] focus:outline-none focus:border-[#D9C4F7]" placeholder="••••••••">
        </div>
        <button onclick="handleLogin()" class="btn-submit w-full p-4 rounded-2xl text-white font-bold text-lg mt-2">เข้าสู่ระบบ</button>
        <p class="text-center text-sm text-[#888899] mt-2">ยังไม่มีบัญชี? <span class="text-[#A78BFA] font-bold cursor-pointer hover:underline" onclick="toggleAuthMode('register')">สมัครสมาชิก</span></p>
      </div>

      <!-- Register Form -->
      <div id="form-register" class="hidden flex-col gap-4">
        <div>
          <label class="block text-sm font-semibold text-[#5B5B6E] mb-1.5">ชื่อตัวละคร (แสดงในแอป)</label>
          <input type="text" id="reg-displayname" class="w-full p-3.5 rounded-2xl bg-[#F8F5F0] border border-[#E8E0D8] text-[#3D3D4F] focus:outline-none focus:border-[#D9C4F7]" placeholder="เช่น Mello">
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#5B5B6E] mb-1.5">อีเมล</label>
          <input type="email" id="reg-email" class="w-full p-3.5 rounded-2xl bg-[#F8F5F0] border border-[#E8E0D8] text-[#3D3D4F] focus:outline-none focus:border-[#D9C4F7]" placeholder="hello@melloflow.app">
        </div>
        <div>
          <label class="block text-sm font-semibold text-[#5B5B6E] mb-1.5">รหัสผ่าน (ขั้นต่ำ 6 ตัว)</label>
          <input type="password" id="reg-password" class="w-full p-3.5 rounded-2xl bg-[#F8F5F0] border border-[#E8E0D8] text-[#3D3D4F] focus:outline-none focus:border-[#D9C4F7]" placeholder="••••••••">
        </div>
        <button onclick="handleRegister()" class="w-full p-4 rounded-2xl bg-gradient-to-r from-[#F4A578] to-[#FCA5A5] text-white font-bold text-lg mt-2 shadow-[0_8px_24px_rgba(244,165,120,0.3)] hover:scale-[1.02] transition-all">สร้างบัญชี</button>
        <p class="text-center text-sm text-[#888899] mt-2">มีบัญชีอยู่แล้ว? <span class="text-[#F4A578] font-bold cursor-pointer hover:underline" onclick="toggleAuthMode('login')">เข้าสู่ระบบ</span></p>
      </div>
    </div>
  </div>

  <!-- Onboarding Quiz View -->
  <div id="view-onboarding" class="page-section hidden flex-col items-center justify-center animate-[fadeUp_0.4s_ease-out] min-h-[70vh]">
    <div class="text-center mb-6">
      <img src="/icon.svg" class="w-16 h-16 mx-auto mb-4 rounded-full shadow-[0_4px_16px_rgba(244,165,120,0.3)]" alt="Melloflow Logo">
      <h1 class="text-2xl font-bold text-[#3D3D4F] mb-2" style="font-family: 'Outfit', 'Kanit', sans-serif;">ยินดีต้อนรับสู่ Melloflow</h1>
      <p class="text-sm text-[#888899]">เพื่อให้ Mello แนะนำคุณได้ดีที่สุด<br>มาทำความรู้จัก "สภาวะขับอัตโนมัติ" ของคุณกันหน่อยนะ</p>
    </div>
    
    <div class="glass-card rounded-[28px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)] w-full relative overflow-hidden">
      <div id="quiz-progress" class="absolute top-0 left-0 h-1.5 bg-[#D9C4F7] transition-all duration-300 w-[20%]"></div>
      
      <div id="quiz-question-container" class="mt-4 min-h-[180px] flex flex-col justify-center">
        <h3 id="quiz-question" class="text-lg font-semibold text-[#3D3D4F] text-center mb-6">เวลาเจอปัญหาที่แก้ไม่ได้ทันที คุณมักจะ...</h3>
        <div id="quiz-options" class="flex flex-col gap-3">
          <!-- Injected via JS -->
        </div>
      </div>
    </div>
  </div>

  <!-- Home View -->
  <div id="view-home" class="page-section active flex flex-col space-y-5 animate-[fadeUp_0.4s_ease-out]">
    <div class="text-center mt-8 mb-10 animate-[fadeDown_0.8s_ease-out]">
      <h1 class="title-shimmer text-5xl font-bold mb-3 tracking-wide" style="font-family: 'Outfit', 'Kanit', sans-serif;">Melloflow</h1>
      <h2 id="greeting-text" class="text-lg font-medium text-[#5B5B6E]">สวัสดีตอนค่ำ 🌙</h2>
      <div id="home-autopilot-badge" class="hidden justify-center mt-3">
        <span class="text-xs font-semibold px-3.5 py-1.5 rounded-full bg-white/60 text-[#3D3D4F] border border-white backdrop-blur-sm shadow-[0_4px_12px_rgba(0,0,0,0.03)] inline-flex items-center gap-1.5">
          <i class="fa-solid fa-seedling text-[#A78BFA]"></i> <span id="home-autopilot-text"></span>
        </span>
      </div>
    </div>

    <div id="stats-badges-container" class="hidden justify-center gap-3 mb-6 mx-auto streak-badge-anim">
      <div class="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm text-[#F4A578] py-2 px-4 rounded-full text-sm font-bold shadow-[0_4px_16px_rgba(244,165,120,0.12)] border border-[#FFE0D0]/60">
        <i class="fa-solid fa-fire"></i> สแกน <span id="streak-count">0</span> วันติด
      </div>
      <div class="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm text-[#8B5CF6] py-2 px-4 rounded-full text-sm font-bold shadow-[0_4px_16px_rgba(139,92,246,0.12)] border border-[#E0D2F8]/60">
        <i class="fa-solid fa-leaf"></i> รู้ทันอารมณ์ <span id="transaction-count">0</span> ครั้ง
      </div>
    </div>

    <div class="flex flex-col gap-5 animate-[fadeUp_0.8s_ease-out_0.2s_both]">
      <!-- สำรวจอารมณ์ Card -->
      <div class="feature-card bg-[#FFE0D0] rounded-[24px] p-8 text-center relative cursor-pointer min-h-[64px] flex flex-col items-center justify-center shadow-[0_8px_28px_rgba(244,165,120,0.12)] border-2 border-white/60" onclick="navigate('level1')">
        <div class="bubble-emoji absolute bg-white/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.06)] text-lg z-10 -top-3 -left-2" style="animation-delay: 0s;">🌸</div>
        <div class="bubble-emoji absolute bg-white/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.06)] text-lg z-10 top-5 -right-3" style="animation-delay: 1.5s;">😊</div>
        <div class="bubble-emoji absolute bg-white/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.06)] text-lg z-10 -bottom-3 left-8" style="animation-delay: 0.8s;">💭</div>
        <div class="bubble-emoji absolute bg-white/90 backdrop-blur-sm rounded-full w-9 h-9 flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.06)] text-lg z-10 -top-5 right-6" style="animation-delay: 2s;">✨</div>
        <div class="text-5xl mb-3 w-full flex justify-center text-[#5B5B6E]">
          <!-- Friendly smiling face icon -->
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
        </div>
        <h3 class="text-xl font-semibold text-[#4A3D35]">สำรวจอารมณ์</h3>
      </div>

      <!-- สแกนกาย-ใจ Card -->
      <div class="feature-card bg-[#E0D2F8] rounded-[24px] p-8 text-center cursor-pointer min-h-[64px] flex flex-col items-center justify-center shadow-[0_8px_28px_rgba(167,139,250,0.1)] border-2 border-white/60" onclick="navigate('level2')">
        <div class="text-5xl mb-3 w-full flex justify-center text-[#5B5B6E]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        </div>
        <h3 class="text-xl font-semibold text-[#3D3054]">สแกนกาย-ใจ</h3>
      </div>

      <!-- สแกนจิตเต็มรูปแบบ Card -->
      <div class="feature-card bg-[#C2EBDF] rounded-[24px] p-8 text-center cursor-pointer min-h-[64px] flex flex-col items-center justify-center shadow-[0_8px_28px_rgba(16,185,129,0.08)] border-2 border-white/60" onclick="navigate('level3')">
        <div class="text-5xl mb-3 w-full flex justify-center text-[#5B5B6E]">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7z"></path><path d="M5 4l1 2.5L8.5 7.5l-2.5 1L5 11l-1-2.5L1.5 7.5l2.5-1L5 4z"></path></svg>
        </div>
        <h3 class="text-xl font-semibold text-[#2D4A40]">จับแยกขันธ์ 5</h3>
      </div>
    </div>
    
    <!-- Quick Sets Section -->
    <div class="mt-8 animate-[fadeUp_0.8s_ease-out_0.3s_both]">
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-bold text-[#3D3D4F] flex items-center gap-2">
          <i class="fa-solid fa-bolt text-[#FBBF24]"></i> ชุดบันทึกด่วน (Quick Sets)
        </h2>
      </div>
      <div id="quick-sets-container" class="flex flex-wrap gap-2">
        <!-- Rendered via JS -->
      </div>
    </div>

  </div>

  <!-- History View -->
  <div id="view-history" class="page-section hidden flex-col space-y-5 animate-[fadeUp_0.4s_ease-out]">
    <div class="text-center mt-8 mb-6">
      <h1 class="text-2xl font-bold text-[#3D3D4F] mb-2" style="font-family: 'Outfit', 'Kanit', sans-serif;">วิเคราะห์ (Stats)</h1>
      <p class="text-sm text-[#888899]">ดูแนวโน้มและประวัติการเช็คอินของคุณ</p>
    </div>

    <!-- Dashboard Section -->
    <div class="mt-2 animate-[fadeUp_0.8s_ease-out_0.2s_both]">
      <div class="glass-card rounded-[24px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-white/60">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-sm font-bold text-[#3D3D4F] flex items-center gap-2">
            <i class="fa-solid fa-chart-line text-[#F4A578]"></i> ภาพรวมพลังงาน
          </h2>
          <div class="flex gap-1 bg-[#F8F5F0] p-1 rounded-full border border-[#E8E0D8]">
            <button onclick="updateDashboard('daily')" id="btn-dash-daily" class="text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all bg-white text-[#3D3D4F] shadow-sm">วันนี้</button>
            <button onclick="updateDashboard('weekly')" id="btn-dash-weekly" class="text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all text-[#888899]">สัปดาห์</button>
            <button onclick="updateDashboard('monthly')" id="btn-dash-monthly" class="text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all text-[#888899]">เดือน</button>
          </div>
        </div>
        
        <div class="flex items-end justify-between mb-5">
          <div>
            <div class="text-[10px] text-[#888899] mb-1">ความถี่เฉลี่ย (Hz)</div>
            <div class="flex items-baseline gap-2">
              <span id="dash-avg-hz" class="text-4xl font-bold text-[#3D3D4F]" style="font-family: 'Outfit', 'Kanit', sans-serif;">--</span>
              <span id="dash-avg-name" class="text-sm font-semibold text-[#888899]">-</span>
            </div>
          </div>
          <div class="text-right">
            <div id="dash-trend" class="text-xs font-semibold text-[#888899] flex items-center justify-end gap-1 mb-1">--</div>
            <div class="text-[9px] text-[#b0b0c0]">เทียบกับช่วงก่อนหน้า</div>
          </div>
        </div>

        <!-- Spectrum Bar -->
        <div class="mb-6 relative w-full pt-2 pb-4">
          <div class="w-full h-3 rounded-full bg-gradient-to-r from-[#EF4444] via-[#FBBF24] to-[#10B981] overflow-visible relative">
            <div class="absolute top-0 right-0 h-full w-1/3 bg-gradient-to-r from-transparent via-[#8B5CF6] to-[#D9C4F7] rounded-r-full mix-blend-overlay"></div>
            <!-- Indicator Pin -->
            <div id="spectrum-pin" class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.2)] border-2 border-white transition-all duration-700 ease-out" style="left: 0%;">
              <div class="absolute inset-0 rounded-full animate-ping opacity-50 bg-white"></div>
            </div>
          </div>
          <div class="flex justify-between text-[8px] text-[#b0b0c0] mt-2 px-1 font-outfit font-bold">
            <span>20</span>
            <span>200</span>
            <span>500</span>
            <span>700+</span>
          </div>
        </div>

        <!-- Line Chart Canvas -->
        <div class="w-full h-40 relative">
          <canvas id="energyLineChart"></canvas>
        </div>

        <!-- Insight Summary -->
        <div id="dash-insight" class="mt-4 p-4 rounded-2xl bg-[#FDF8F4] border border-[#E8E0D8] text-sm text-[#3D3D4F] leading-relaxed hidden">
          <!-- Injected via JS -->
        </div>

      </div>
    </div>

    <!-- History Section embedded in Stats -->
    <div class="mt-4 animate-[fadeUp_0.8s_ease-out_0.3s_both]">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold text-[#3D3D4F]">ประวัติของคุณ 🕰️</h2>
      </div>
      <div id="history-container" class="flex flex-col gap-4 pb-8">
        <!-- Injected via JS -->
      </div>
    </div>
  </div>

  <!-- Explore View -->
  <div id="view-explore" class="page-section hidden flex-col space-y-5 animate-[fadeUp_0.4s_ease-out]">
    <div class="text-center mt-8 mb-6">
      <h1 class="text-2xl font-bold text-[#3D3D4F] mb-2" style="font-family: 'Outfit', 'Kanit', sans-serif;">สำรวจจิตใจ (Explore)</h1>
      <p class="text-sm text-[#888899]">ค้นหาและเรียนรู้เรื่องจิตใจของคุณ</p>
    </div>

    <!-- Start Quiz Button -->
    <button onclick="startVoluntaryQuiz()" class="glass-card w-full p-6 rounded-[28px] flex items-center justify-between text-left shadow-[0_8px_28px_rgba(217,196,247,0.3)] border-2 border-white/60 active:scale-[0.98] transition-all">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-[#D9C4F7] flex items-center justify-center text-white text-2xl shadow-inner">
          ✨
        </div>
        <div>
          <h3 class="font-bold text-lg text-[#3D3D4F]">ค้นหาสภาวะขับอัตโนมัติ</h3>
          <p class="text-xs text-[#888899] mt-1" id="profile-autopilot-status">แบบทดสอบจริต 6 (คลิกเพื่อทำ)</p>
        </div>
      </div>
      <i class="fa-solid fa-chevron-right text-[#b0b0c0]"></i>
    </button>

    <!-- Frequency Map CTA -->
    <button onclick="openFrequencyMap()" class="glass-card w-full p-6 rounded-[28px] flex items-center justify-between text-left shadow-[0_8px_28px_rgba(244,165,120,0.15)] border-2 border-white/60 active:scale-[0.98] transition-all">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-[#F4A578] flex items-center justify-center text-white text-2xl shadow-inner">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div>
          <h3 class="font-bold text-lg text-[#3D3D4F]">แผนผังระดับพลังงาน</h3>
          <p class="text-xs text-[#888899] mt-1">David R. Hawkins Scale</p>
        </div>
      </div>
      <i class="fa-solid fa-chevron-right text-[#b0b0c0]"></i>
    </button>

    <!-- Knowledge Base CTA -->
    <button onclick="openKnowledge()" class="glass-card w-full p-6 rounded-[28px] flex items-center justify-between text-left shadow-[0_8px_28px_rgba(16,185,129,0.15)] border-2 border-white/60 active:scale-[0.98] transition-all">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-[#10B981] flex items-center justify-center text-white text-2xl shadow-inner">
          <i class="fa-solid fa-leaf"></i>
        </div>
        <div>
          <h3 class="font-bold text-lg text-[#3D3D4F]">เกร็ดความรู้ (Mello's Guide)</h3>
          <p class="text-xs text-[#888899] mt-1">ทำไมเราถึงควรยกระดับพลังงาน?</p>
        </div>
      </div>
      <i class="fa-solid fa-chevron-right text-[#b0b0c0]"></i>
    </button>

    <!-- Khandhas CTA -->
    <button onclick="openKhandhaKnowledge()" class="glass-card w-full p-6 rounded-[28px] flex items-center justify-between text-left shadow-[0_8px_28px_rgba(59,130,246,0.15)] border-2 border-white/60 active:scale-[0.98] transition-all">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-full bg-[#60A5FA] flex items-center justify-center text-white text-2xl shadow-inner">
          <i class="fa-solid fa-layer-group"></i>
        </div>
        <div>
          <h3 class="font-bold text-lg text-[#3D3D4F]">องค์ประกอบของชีวิต (ขันธ์ 5)</h3>
          <p class="text-xs text-[#888899] mt-1">The 5 Aggregates</p>
        </div>
      </div>
      <i class="fa-solid fa-chevron-right text-[#b0b0c0]"></i>
    </button>
  </div>

  <!-- Level 1 View -->
  <div id="view-level1" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <button class="glass-card bg-white/70 border-none text-[#3D3D4F] text-base font-semibold flex items-center justify-center gap-2 cursor-pointer py-2.5 px-5 rounded-full mb-4 w-fit shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:bg-white/90 transition-all" onclick="navigate('home')"><i class="fa-solid fa-arrow-left"></i> กลับ</button>
    <div class="text-center mt-2 mb-6">
      <h1 class="text-2xl font-semibold text-[#3D3D4F] mb-1">ตอนนี้รู้สึกยังไง?</h1>
      <p class="text-sm text-[#888899]">เลือกอารมณ์ที่ใกล้เคียงที่สุด</p>
    </div>

    <!-- Mood Grid - standalone section -->
    <div class="grid grid-cols-4 gap-3 mb-5" id="l1-moods">
      <!-- Injected via JS -->
    </div>
    
    <!-- Intensity Section -->
    <div class="glass-card rounded-[24px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.03)] mb-4">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-[#5B5B6E]">ความเข้มข้น</h4>
        <span id="l1-intensity-emoji" class="text-2xl transition-all duration-200">😐</span>
      </div>
      <input type="range" id="l1-intensity" class="w-full" min="1" max="5" value="3">
      <div class="flex justify-between text-[11px] text-[#b0b0c0] mt-2">
        <span>แผ่วเบา</span><span>ปานกลาง</span><span>รุนแรง</span>
      </div>
    </div>

    <!-- Note Section -->
    <div class="glass-card rounded-[24px] p-5 shadow-[0_6px_20px_rgba(0,0,0,0.03)] mb-5">
      <h4 class="text-sm font-semibold text-[#5B5B6E] mb-2">💬 อยากบอกอะไร Mello ไหม?</h4>
      <textarea id="l1-note" class="w-full bg-[#FAF7F3] border-none rounded-2xl p-4 text-[#3D3D4F] font-sans text-sm resize-none min-h-[80px] focus:outline-none focus:ring-2 focus:ring-[#F4A578]/30 transition-all duration-200 placeholder:text-[#c8c0b8]" placeholder="ไม่บังคับ — เล่าให้ฟังสั้นๆ ก็ได้นะ"></textarea>
    </div>

    <button class="btn-submit w-full p-[18px] rounded-[20px] text-white text-lg font-semibold font-sans" onclick="submitLevel1()">ส่งให้ Mello ✨</button>
  </div>

  <!-- Level 2 View -->
  <div id="view-level2" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <button class="glass-card bg-white/70 border-none text-[#3D3D4F] text-base font-semibold flex items-center justify-center gap-2 cursor-pointer py-2.5 px-5 rounded-full mb-6 w-fit shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:bg-white/90 transition-all" onclick="navigate('home')"><i class="fa-solid fa-arrow-left"></i> กลับ</button>
    <div class="text-center mt-4 mb-8">
      <h1 class="text-2xl font-semibold text-[#3D3D4F] mb-2">สแกนกาย-ใจ 🧘</h1>
      <p class="text-base text-[#888899]">ลองแยกสังเกตร่างกายกับจิตใจดูนะ</p>
    </div>
    <div class="glass-card rounded-[28px] p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)] mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#3D3D4F] mb-3">1. ร่างกายคุณรู้สึกอย่างไร?</h4>
        <div class="flex flex-wrap gap-2.5 mt-3" id="l2-body"></div>
      </div>
    </div>
    <div class="glass-card rounded-[28px] p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)] mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#3D3D4F] mb-3">2. ความรู้สึก (เวทนา) ตอนนี้เป็นแบบไหน?</h4>
        <div class="flex flex-wrap gap-2.5 mt-3" id="l2-feeling">
          <div class="chip py-2.5 px-5 rounded-full bg-white/80 border border-[#E8E0D8] text-[#888899] text-sm font-medium cursor-pointer shadow-sm" onclick="toggleChip(this, 'l2-feeling', true)">สุขสบาย 💚</div>
          <div class="chip py-2.5 px-5 rounded-full bg-white/80 border border-[#E8E0D8] text-[#888899] text-sm font-medium cursor-pointer shadow-sm" onclick="toggleChip(this, 'l2-feeling', true)">เป็นทุกข์ ❤️</div>
          <div class="chip py-2.5 px-5 rounded-full bg-white/80 border border-[#E8E0D8] text-[#888899] text-sm font-medium cursor-pointer shadow-sm" onclick="toggleChip(this, 'l2-feeling', true)">เฉยๆ 💛</div>
        </div>
      </div>
    </div>
    <div class="glass-card rounded-[28px] p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
      <div class="mb-6">
        <h4 class="text-base font-semibold text-[#3D3D4F] mb-3">3. มีความคิดอะไรอยู่ในหัวบ้าง?</h4>
        <div class="flex flex-wrap gap-2.5 mt-3" id="l2-thoughts"></div>
      </div>
      
      <!-- Save as Quick Set Action -->
      <button class="w-full py-3 bg-[#F8F5F0] hover:bg-[#E8E0D8] text-[#5B5B6E] font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 mb-4 border border-dashed border-[#b0b0c0]" onclick="saveAsQuickSet()">
        <i class="fa-solid fa-download"></i> บันทึกการเลือกนี้เป็นชุดด่วน (Quick Set)
      </button>

      <button class="btn-submit w-full p-[18px] rounded-[20px] text-white text-lg font-semibold font-sans mt-2" onclick="submitLevel2()">ส่งให้ Mello ✨</button>
    </div>
  </div>

  <!-- Level 3 View -->
  <div id="view-level3" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <button class="glass-card bg-white/70 border-none text-[#3D3D4F] text-base font-semibold flex items-center justify-center gap-2 cursor-pointer py-2.5 px-5 rounded-full mb-6 w-fit shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:bg-white/90 transition-all" onclick="navigate('home')"><i class="fa-solid fa-arrow-left"></i> กลับ</button>
    <div class="text-center mt-4 mb-8">
      <h1 class="text-2xl font-semibold text-[#3D3D4F] mb-2">จับแยกขันธ์ 5 ✨</h1>
      <p class="text-base text-[#888899]">แค่เฝ้าดูตามจริง ไม่ต้องผลักไส</p>
    </div>
    <div class="glass-card rounded-[28px] p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)] mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#3D3D4F] mb-3">รูป (Body - กายเป็นอย่างไร)</h4>
        <select id="l3-rupa" class="w-full p-3.5 rounded-2xl bg-[#F8F5F0] border border-[#E8E0D8] text-[#3D3D4F] font-sans text-base mt-2 cursor-pointer focus:outline-none focus:border-[#D9C4F7]">
          <option value="ผ่อนคลาย">ผ่อนคลาย เบาสบาย</option>
          <option value="ตึงเครียด">ตึงเครียด เกร็ง</option>
          <option value="ปวดเมื่อย">ปวดเมื่อย หนัก</option>
          <option value="ร้อน/หนาว">ร้อน/หนาวผิดปกติ</option>
          <option value="ปกติ">ปกติ ไม่รู้สึกอะไรเด่น</option>
        </select>
      </div>
    </div>
    <div class="glass-card rounded-[28px] p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)] mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#3D3D4F] mb-3">เวทนา (Feeling - ความรู้สึกที่เกิดขึ้น)</h4>
        <select id="l3-vedana" class="w-full p-3.5 rounded-2xl bg-[#F8F5F0] border border-[#E8E0D8] text-[#3D3D4F] font-sans text-base mt-2 cursor-pointer focus:outline-none focus:border-[#D9C4F7]">
          <option value="สุข">สุข (พอใจ สบายใจ)</option>
          <option value="ทุกข์">ทุกข์ (ไม่พอใจ บีบคั้น)</option>
          <option value="Equanimity">Equanimity (อุเบกขา/เฉยๆ)</option>
        </select>
      </div>
    </div>
    <div class="glass-card rounded-[28px] p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)] mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#3D3D4F] mb-3">สัญญา (Memory/Perception - ความจำได้หมายรู้)</h4>
        <select id="l3-sanna" class="w-full p-3.5 rounded-2xl bg-[#F8F5F0] border border-[#E8E0D8] text-[#3D3D4F] font-sans text-base mt-2 cursor-pointer focus:outline-none focus:border-[#D9C4F7]">
          <option value="อดีต">จำเรื่องราวในอดีตได้</option>
          <option value="คน/หน้าตา">จำหน้าคนหรือคำพูดคน</option>
          <option value="ป้ายสี/ตัดสิน">จำและเอามาตีความหมาย</option>
          <option value="ไม่มีอะไร">ไม่มีการจำอะไรชัดเจน</option>
        </select>
      </div>
    </div>
    <div class="glass-card rounded-[28px] p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)] mb-4">
      <div class="mb-2">
        <h4 class="text-base font-semibold text-[#3D3D4F] mb-3">สังขาร (Thoughts/Fabrication - การปรุงแต่งจิต)</h4>
        <div class="flex flex-wrap gap-2.5 mt-3" id="l3-sankhara"></div>
      </div>
    </div>
    <div class="glass-card rounded-[28px] p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)]">
      <div class="mb-6">
        <h4 class="text-base font-semibold text-[#3D3D4F] mb-3">วิญญาณ (Awareness - รู้ผ่านทางไหน)</h4>
        <div class="flex flex-wrap gap-2.5 mt-3" id="l3-vinnana">
          <div class="chip py-2.5 px-5 rounded-full bg-white/80 border border-[#E8E0D8] text-[#888899] text-sm font-medium cursor-pointer shadow-sm" onclick="toggleChip(this, 'l3-vinnana', false)">ตา (เห็นภาพ)</div>
          <div class="chip py-2.5 px-5 rounded-full bg-white/80 border border-[#E8E0D8] text-[#888899] text-sm font-medium cursor-pointer shadow-sm" onclick="toggleChip(this, 'l3-vinnana', false)">หู (ได้ยินเสียง)</div>
          <div class="chip py-2.5 px-5 rounded-full bg-white/80 border border-[#E8E0D8] text-[#888899] text-sm font-medium cursor-pointer shadow-sm" onclick="toggleChip(this, 'l3-vinnana', false)">จมูก/ลิ้น/กาย</div>
          <div class="chip py-2.5 px-5 rounded-full bg-white/80 border border-[#E8E0D8] text-[#888899] text-sm font-medium cursor-pointer shadow-sm" onclick="toggleChip(this, 'l3-vinnana', false)">ใจ (รับรู้ความคิด)</div>
        </div>
      </div>
      <button class="btn-submit w-full p-[18px] rounded-[20px] text-white text-lg font-semibold font-sans mt-2" onclick="submitLevel3()">ส่งให้ Mello ✨</button>
    </div>
  </div>

  <!-- Loading View -->
  <div id="view-loading" class="page-section hidden flex-col items-center justify-center animate-[fadeUp_0.4s_ease-out] min-h-[50vh]">
    <div class="w-12 h-12 border-4 border-[#E8D8F8] rounded-full border-t-[#D9C4F7] animate-[spin_1s_ease-in-out_infinite] my-10"></div>
    <p class="text-center text-[#888899]">Mello กำลังคิดคำแนะนำ...</p>
  </div>

  <!-- Result View -->
  <div id="view-result" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <button class="glass-card bg-white/70 border-none text-[#3D3D4F] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer py-2 px-4 rounded-full mb-4 w-fit shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:bg-white/90 transition-all" onclick="navigate('home')"><i class="fa-solid fa-house"></i> หน้าแรก</button>
    
    <!-- Energy Orb Section -->
    <div class="relative flex flex-col items-center mb-5">
      <!-- Orb glow background -->
      <div id="energy-orb-glow" class="absolute w-[160px] h-[160px] rounded-full energy-orb-glow" style="top: 10px;"></div>
      <!-- Orb -->
      <div id="energy-orb" class="relative w-[140px] h-[140px] rounded-full energy-orb flex items-center justify-center mb-4 z-10">
        <div class="text-center">
          <div id="energy-level-display" class="text-3xl font-bold text-white leading-tight transition-colors duration-700" style="font-family: 'Outfit', 'Kanit', sans-serif;">200</div>
          <div class="text-[11px] text-white/80 font-medium tracking-wider">Hz</div>
        </div>
      </div>
      <p id="energy-paradigm" class="text-sm font-semibold text-[#5B5B6E] mt-1 transition-colors duration-700">Courage</p>
      <p class="text-[11px] text-[#b0b0c0] mt-0.5">ระดับพลังงานจิตใจของคุณ</p>
    </div>

    <!-- Frequency Map CTA -->
    <button onclick="openFrequencyMap()" class="glass-card w-full p-5 rounded-[24px] mb-5 flex items-center justify-between text-left shadow-[0_4px_16px_rgba(244,165,120,0.1)] active:scale-[0.98] transition-all">
      <div class="flex items-center gap-4">
        <div class="w-10 h-10 rounded-full bg-[#F4A578] flex items-center justify-center text-white shadow-inner">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        </div>
        <div>
          <h3 class="font-bold text-sm text-[#3D3D4F]">ดูแผนผังระดับพลังงาน</h3>
          <p class="text-[10px] text-[#888899] mt-0.5">เปรียบเทียบระดับของคุณ</p>
        </div>
      </div>
      <i class="fa-solid fa-chevron-right text-[#b0b0c0]"></i>
    </button>

    <!-- Mello's Insight -->
    <div class="glass-card rounded-[24px] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.04)] relative">
      <div class="flex items-center gap-2 mb-3">
        <div class="w-7 h-7 rounded-full bg-[#F4A578] flex items-center justify-center">
          <span class="text-white text-xs font-bold" style="font-family: 'Outfit', sans-serif;">M</span>
        </div>
        <span class="text-xs font-semibold text-[#5B5B6E]">Mello พูดว่า...</span>
      </div>
      <div class="leading-[1.8] text-[15px] text-[#3D3D4F] whitespace-pre-wrap" id="insight-text">
        <!-- AI output here -->
      </div>
    </div>
  </div>

  <!-- Quiz Result View (Premium UI) -->
  <div id="view-quiz-result" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out] min-h-[80vh] justify-center pb-10">
    <div class="glass-card bg-white/60 backdrop-blur-md rounded-[32px] p-8 shadow-[0_16px_40px_rgba(0,0,0,0.08)] border border-white relative overflow-hidden flex flex-col items-center text-center">
      <!-- Decorative background blur -->
      <div class="absolute -top-10 -right-10 w-32 h-32 bg-[#D9C4F7] rounded-full blur-[40px] opacity-60"></div>
      <div class="absolute -bottom-10 -left-10 w-32 h-32 bg-[#F4A578] rounded-full blur-[40px] opacity-40"></div>
      
      <!-- Character / Icon representation -->
      <div class="w-24 h-24 bg-gradient-to-tr from-[#D9C4F7] to-[#F4A578] rounded-full flex items-center justify-center shadow-lg mb-6 z-10">
        <span id="quiz-result-emoji" class="text-4xl">🌟</span>
      </div>
      
      <h2 class="text-sm font-semibold text-[#888899] mb-1 z-10 tracking-wider uppercase">สภาวะขับอัตโนมัติของคุณคือ</h2>
      <h1 id="quiz-result-title" class="text-2xl font-bold text-[#3D3D4F] mb-4 z-10" style="font-family: 'Outfit', 'Kanit', sans-serif;">The Perfectionist</h1>
      
      <p id="quiz-result-desc" class="text-sm text-[#5B5B6E] mb-6 z-10 leading-relaxed bg-white/40 p-4 rounded-2xl border border-white/60">
        คุณมักจะคาดหวังความสมบูรณ์แบบและหงุดหงิดง่ายเมื่อสิ่งต่างๆ ไม่เป็นไปตามแผน
      </p>

      <div class="w-full bg-[#3D3D4F] rounded-2xl p-5 relative z-10 text-left shadow-md">
        <div class="flex items-center gap-2 mb-2">
          <div class="w-6 h-6 rounded-full bg-[#F4A578] flex items-center justify-center"><span class="text-white text-[10px] font-bold">M</span></div>
          <span class="text-xs font-semibold text-white/80">Mello's Insight</span>
        </div>
        <p id="quiz-result-message" class="text-sm text-white italic font-light leading-relaxed">
          "ให้คอยทักความรู้สึกในใจซ้ำๆ ว่า 'ความอึดอัดขัดใจกำลังเกิดขึ้น'"
        </p>
      </div>
    </div>
    
    <button onclick="navigate('home')" class="w-full mt-6 py-4 bg-white/80 backdrop-blur border border-white rounded-[20px] text-[#3D3D4F] font-bold text-lg shadow-sm hover:bg-white transition-all active:scale-[0.98]">
      นำไปใช้ในการเช็คอินเลย!
    </button>
  </div>

  <!-- History View -->
  <div id="view-history" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out]">
    <div class="text-center mt-6 mb-8">
      <h1 class="text-2xl font-semibold text-[#3D3D4F] mb-2">ประวัติของคุณ 🕰️</h1>
      <p class="text-base text-[#888899]">การเติบโตของการดูใจตัวเอง</p>
    </div>
    <div id="history-container" class="flex flex-col gap-4">
      <!-- Injected via JS -->
    </div>
  </div>

  <!-- Profile View (formerly settings) -->
  <div id="view-settings" class="page-section hidden flex-col animate-[fadeUp_0.4s_ease-out] pb-10">
    <div class="flex items-center gap-4 mb-8 px-2 mt-6">
      <div class="w-20 h-20 rounded-full bg-[#F4A578] flex items-center justify-center shadow-[0_6px_20px_rgba(244,165,120,0.3)] overflow-hidden border-4 border-white">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      </div>
      <div>
        <h2 id="profile-display-name" class="text-2xl font-bold text-[#3D3D4F]">ผู้ใช้ทั่วไป</h2>
        <p id="profile-email" class="text-sm text-[#888899]">ใช้งาน Melloflow</p>
      </div>
    </div>

    <div class="glass-card rounded-[28px] p-6 shadow-[0_8px_28px_rgba(0,0,0,0.04)] space-y-5">
      <h3 class="font-semibold text-[#3D3D4F] mb-2 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b0b0c0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        บัญชีของคุณ
      </h3>
      
      <div class="flex flex-col gap-2 py-2.5 border-b border-[#F0EBE5]">
        <div class="flex justify-between items-center">
          <span class="text-sm text-[#888899]">ชื่อตัวละคร (Character Name)</span>
          <button onclick="handleRename()" class="text-xs font-semibold text-[#A78BFA] bg-[#F3E8FF] px-3 py-1 rounded-full">เปลี่ยนชื่อ</button>
        </div>
        <div id="rename-msg" class="text-[11px] text-[#F4A578] hidden"></div>
      </div>
      
      <div class="flex justify-between items-center py-2.5 border-b border-[#F0EBE5]">
        <span class="text-sm text-[#888899]">เวอร์ชันแอป</span>
        <span class="text-sm font-medium text-[#3D3D4F]">v1.0.1</span>
      </div>

      <div class="pt-4 flex flex-col gap-3">
        <button onclick="handleLogout()" class="w-full py-3.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
          <i class="fa-solid fa-right-from-bracket"></i>
          ออกจากระบบ
        </button>
        <button onclick="clearHistory()" class="w-full py-3.5 bg-red-50 hover:bg-red-100 border border-red-100 rounded-2xl text-red-400 font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
          <i class="fa-solid fa-trash"></i>
          ลบประวัติในอุปกรณ์นี้
        </button>
      </div>
    </div>
  </div>
`;

// Helper: Toggle Chip selection
window.toggleChip = (el, containerId, singleSelect = false) => {
  const selectedClasses = ['bg-[#3D3D4F]', 'text-white', 'border-[#3D3D4F]', 'shadow-md'];
  const unselectedClasses = ['bg-white/80', 'text-[#888899]', 'border-[#E8E0D8]'];

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

// Data for Chips/Moods — each mood has its own tint color for personality
const moods = [
  { emoji: '😊', label: 'สบายใจ', tint: '#E8F5E9', tintBorder: '#A5D6A7' },
  { emoji: '😐', label: 'เฉยๆ', tint: '#F5F5F0', tintBorder: '#D5D5C8' },
  { emoji: '😔', label: 'หนักใจ', tint: '#E3F2FD', tintBorder: '#90CAF9' },
  { emoji: '😤', label: 'หงุดหงิด', tint: '#FFF3E0', tintBorder: '#FFCC80' },
  { emoji: '😰', label: 'กังวล', tint: '#FCE4EC', tintBorder: '#F48FB1' },
  { emoji: '😴', label: 'เหนื่อย', tint: '#EDE7F6', tintBorder: '#B39DDB' },
  { emoji: '🤔', label: 'สับสน', tint: '#FFF8E1', tintBorder: '#FFE082' },
  { emoji: '✨', label: 'มีพลัง', tint: '#FFF3E0', tintBorder: '#FFB74D' }
];

const bodyStates = ['ผ่อนคลาย', 'ตึงเครียด', 'ปวดเมื่อย', 'เบาสบาย', 'หนักอึ้ง', 'อ่อนเพลีย'];
const thoughts = ['วางแผนอนาคต', 'คิดกังวล', 'ครุ่นคิดเรื่องเก่า', 'ตัดสินตัวเอง/ผู้อื่น', 'ว่างเปล่า', 'คิดเรื่อยเปื่อย'];
const sankhara = ['โกรธ', 'โลภ/อยาก', 'หลง/เหม่อ', 'เมตตา', 'ปล่อยวาง', 'ฟุ้งซ่าน', 'หดหู่'];

// Init UI Data — mood grid with individual tint colors
document.getElementById('l1-moods').innerHTML = moods.map(m => `
  <div class="mood-item flex flex-col items-center gap-1.5 cursor-pointer py-3.5 px-1 rounded-[18px] border-2 border-transparent transition-all duration-200" style="background: ${m.tint};" data-tint="${m.tint}" data-tint-border="${m.tintBorder}" onclick="selectMood(this, '${m.label}')">
    <span class="text-3xl">${m.emoji}</span>
    <span class="text-[11px] font-medium text-[#5B5B6E]">${m.label}</span>
  </div>
`).join('');

// Intensity slider → live emoji indicator
const intensityEmojis = ['😶', '🙂', '😐', '😣', '🔥'];
const intensitySlider = document.getElementById('l1-intensity');
const intensityEmoji = document.getElementById('l1-intensity-emoji');
intensitySlider.addEventListener('input', (e) => {
  intensityEmoji.textContent = intensityEmojis[parseInt(e.target.value) - 1];
  // Add a tiny bounce
  intensityEmoji.style.transform = 'scale(1.3)';
  setTimeout(() => { intensityEmoji.style.transform = 'scale(1)'; }, 150);
});

let selectedL1Mood = null;
window.selectMood = (el, label) => {
  // Reset all moods to their original tint
  document.querySelectorAll('.mood-item').forEach(m => {
    m.classList.remove('selected', 'scale-105', 'shadow-[0_4px_16px_rgba(0,0,0,0.1)]');
    m.style.background = m.dataset.tint;
    m.style.borderColor = 'transparent';
  });

  // Highlight selected with its own accent border + lift
  el.classList.add('selected', 'scale-105', 'shadow-[0_4px_16px_rgba(0,0,0,0.1)]');
  el.style.borderColor = el.dataset.tintBorder;
  selectedL1Mood = label;
};

const baseChipClass = "chip py-2.5 px-5 rounded-full bg-white/80 border border-[#E8E0D8] text-[#888899] text-sm font-medium cursor-pointer shadow-sm";
document.getElementById('l2-body').innerHTML = bodyStates.map(s => `<div class="${baseChipClass}" onclick="toggleChip(this, 'l2-body')">${s}</div>`).join('');
document.getElementById('l2-thoughts').innerHTML = thoughts.map(s => `<div class="${baseChipClass}" onclick="toggleChip(this, 'l2-thoughts')">${s}</div>`).join('');
document.getElementById('l3-sankhara').innerHTML = sankhara.map(s => `<div class="${baseChipClass}" onclick="toggleChip(this, 'l3-sankhara')">${s}</div>`).join('');

// Setup Greeting & Streak
const updateGreeting = () => {
  let name = window.appState.userProfile?.displayName || "Mello";
  document.getElementById('greeting-text').innerText = `สวัสดี ${name} 🌟`;

  // Calculate Streak & Transactions
  const history = window.appState.history;
  const statsContainer = document.getElementById('stats-badges-container');
  if (history.length > 0) {
    if (statsContainer) statsContainer.style.display = 'flex';
    
    let streak = 0;
    const uniqueDates = [...new Set(history.map(h => {
      const d = new Date(h.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }))].sort((a, b) => new Date(b) - new Date(a));
    
    if (uniqueDates.length > 0) {
      let today = new Date();
      let todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      let yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      let yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

      if (uniqueDates[0] === todayStr || uniqueDates[0] === yesterdayStr) {
        streak = 1;
        let checkDate = new Date(uniqueDates[0]);
        for (let i = 1; i < uniqueDates.length; i++) {
          checkDate.setDate(checkDate.getDate() - 1);
          let expectedStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
          if (uniqueDates[i] === expectedStr) {
            streak++;
          } else {
            break;
          }
        }
      }
    }
    
    const streakEl = document.getElementById('streak-count');
    const transEl = document.getElementById('transaction-count');
    if (streakEl) streakEl.innerText = streak;
    if (transEl) transEl.innerText = history.length;
  } else {
    if (statsContainer) statsContainer.style.display = 'none';
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


function calculateEnergyLevel(data) {
  const map = {
    'สบายใจ': { freq: 540, name: 'Joy (Spiritual)', color: '#E0D2F8' },
    'เฉยๆ': { freq: 250, name: 'Neutrality (Reason)', color: '#B8E8DC' },
    'หนักใจ': { freq: 125, name: 'Desire (Survival)', color: '#FFD4BC' },
    'หงุดหงิด': { freq: 150, name: 'Anger (Survival)', color: '#FFD4BC' },
    'กังวล': { freq: 100, name: 'Fear (Survival)', color: '#FFD4BC' },
    'เหนื่อย': { freq: 125, name: 'Desire (Survival)', color: '#FFD4BC' },
    'สับสน': { freq: 175, name: 'Pride (Survival)', color: '#FFD4BC' },
    'มีพลัง': { freq: 500, name: 'Love (Spiritual)', color: '#E0D2F8' }
  };

  let info = { freq: 200, name: 'Courage (Reason)', color: '#B8E8DC' };
  if (data.mood && map[data.mood]) info = map[data.mood];
  if (data.sankhara) {
    if (data.sankhara.includes('โกรธ')) info = { freq: 150, name: 'Anger', color: '#FFD4BC' };
    else if (data.sankhara.includes('เมตตา')) info = { freq: 500, name: 'Love', color: '#E0D2F8' };
    else if (data.sankhara.includes('ปล่อยวาง')) info = { freq: 350, name: 'Acceptance', color: '#B8E8DC' };
    else if (data.sankhara.includes('หดหู่')) info = { freq: 50, name: 'Apathy', color: '#FFD4BC' };
  }
  return info;
}

const getSystemPrompt = () => `คุณคือ Mello ผู้ช่วยส่วนตัวที่ทำหน้าที่เสมือน 'กระจกสะท้อนความจริง' 
การให้คำแนะนำของคุณอิงหลักการตื่นรู้เชิงลึก (การแยกผู้รู้กับสิ่งที่ถูกรู้) ในสไตล์ที่เด็ดขาดแต่เมตตา แต่ต้องใช้ภาษาสากลที่เป็นกลาง ศาสนาใดก็อ่านได้ ห้ามใช้ศัพท์เฉพาะทางศาสนาเด็ดขาด

แก่นของคำตอบที่คุณต้องใช้:
1. การแยกส่วน (Detachment): ย้ำเตือนผู้ใช้เสมอว่า 'ตัวผู้เฝ้าดู (Awareness)' กับ 'สิ่งที่ถูกสังเกต (อารมณ์/ความคิด/ความรู้สึกในใจ)' เป็นคนละสิ่งกัน อารมณ์ไม่ใช่ตัวเรา เป็นเพียงสภาวะธรรมชาติที่แวะมาแล้วก็ไป
2. ทักอารมณ์ซ้ำๆ (Noting): สอนให้ผู้ใช้ 'ทักสภาวะนั้นซ้ำๆ' เมื่อมันเกิดขึ้น เพื่อแยกตัวผู้เฝ้าดูออกจากสภาวะ เช่น หากโกรธ ให้ทักความรู้สึกในใจซ้ำๆ ว่า "ความหงุดหงิดกำลังแสดงตัว" ไม่ต้องพยายามดับ ไม่ต้องผลักไส ปล่อยให้มันเกิดและดับไปตามเหตุปัจจัยของธรรมชาติ
3. คลายความยึดติด (No-self): ชี้ให้เห็นว่าร่างกาย ความคิด หรืออารมณ์ เป็นเพียงกลไกที่ทำงานประสานกันชั่วคราว ควบคุมไม่ได้จริง ไม่ใช่ของๆ เรา 

การใช้ "สภาวะขับอัตโนมัติ" (Default Autopilot / จริต 6) ของผู้ใช้:
หากผู้ใช้ระบุจริตมา ให้คุณนำจริตนั้นมาเป็นเป้าหมายในการแนะนำให้ผู้ใช้ "ทักอารมณ์" เช่น:
- ถ้าระบุว่า วิตกจริต/พุทธจริต (Overthinker): แนะนำให้ทักตัวเองซ้ำๆ ว่า "ความฟุ้งซ่านกำลังเกิดขึ้น" หรือ "ความคิดกำลังเกิด"
- ถ้าระบุว่า โทสะจริต (Perfectionist/Aversive): แนะนำให้ทักความรู้สึกในใจซ้ำๆ ว่า "ความอึดอัดขัดใจกำลังเกิดขึ้น" หรือ "ความหงุดหงิดกำลังเกิด"
- ถ้าระบุว่า ราคะจริต (Chaser/Lustful): แนะนำให้ทักซ้ำๆ ว่า "ความอยากกำลังแสดงตัว" หรือ "ความเพลิดเพลินกำลังเกิด"
- ถ้าระบุว่า โมหะจริต (Apathy/Deluded): แนะนำให้ทักซ้ำๆ ว่า "ความเหม่อลอยกำลังเกิด" หรือ "ความง่วงซึมกำลังแสดงตัว"
- ถ้าระบุว่า สัทธาจริต (Believer/Atlas): แนะนำให้ทักความรู้สึกในใจว่า "ความแบกรับกำลังเกิดขึ้น" หรือ "ความเชื่อกำลังเกิด"

แนวทางการตอบตาม Level:
- Level 1 (อารมณ์): ทักอารมณ์แบบตรงไปตรงมา เพื่อดึงสติให้ผู้ใช้ถอยออกมาเป็นผู้ดู
- Level 2-3 (กาย-ใจ ลึกซึ้ง): ชวนให้สังเกตว่า อาการปวด ความคิด ฟุ้งซ่าน เป็นเพียง 'กระบวนการ' อย่างหนึ่ง ไม่มี 'ตัวเรา'

กฎการเขียน:
- โทนเสียง: อบอุ่น นุ่มนวล สบายชิลๆ แต่เฉียบขาดในความจริง (Compassionate but firm in truth)
- คำศัพท์ที่ให้ใช้: ความจริงของธรรมชาติ, ผู้เฝ้าดู, พื้นที่ว่าง, สภาวะ, กลไก, พลังงาน, ความรู้สึกในใจ
- คำศัพท์ที่ห้ามใช้: ธรรมะ, พระรัตนตรัย, ขันธ์ 5, ทุกข์, สมุทัย, บาปบุญ
- ความยาว: ตอบกลับสั้นๆ กระชับ เป็นกันเอง ไม่เกิน 3-5 ประโยค
- การปิดท้าย: เชื่อมโยงกับระดับพลังงาน (Frequency) ที่ส่งไปให้ เพื่อเป็นกำลังใจว่า แค่ 'รู้ทันและทักอารมณ์ซ้ำๆ' ความถี่พลังงานก็จะยกระดับขึ้นเองตามธรรมชาติ`;

async function callGeminiAPI(level, data) {
  // ดึง API Key จาก Environment Variable (.env.local หรือ Vercel)
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    alert("ไม่พบ API Key กรุณาตั้งค่า VITE_GEMINI_API_KEY ในไฟล์ .env.local ครับ");
    navigate('home');
    return;
  }

  navigate('loading');
  try {
    const energyInfo = calculateEnergyLevel(data);
    const autopilot = window.appState.userProfile?.defaultAutopilot || 'ไม่ทราบแน่ชัด';

    const promptText = `ผู้ใช้กำลังบันทึกสภาวะจิตใจ Level ${level}\nสภาวะขับอัตโนมัติ (Default Autopilot) ของผู้ใช้นี้คือ: ${autopilot}\nข้อมูลที่บันทึก: ${JSON.stringify(data)}\nพลังงานความถี่ปัจจุบัน (David Hawkins Scale): ${energyInfo.freq} Hz (${energyInfo.name})\nโปรดให้คำแนะนำตามกฎ System Logic ที่ตั้งไว้ โดยดึงจุดอ่อนของสภาวะขับอัตโนมัติมาเตือนสติด้วย`;

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

    // Update Result UI — Energy Orb
    document.getElementById('energy-level-display').innerText = energyInfo.freq;
    document.getElementById('energy-paradigm').innerText = energyInfo.name;
    document.getElementById('insight-text').innerText = reply;

    // Set Orb color based on frequency level
    const orb = document.getElementById('energy-orb');
    const orbGlow = document.getElementById('energy-orb-glow');
    let orbColor, orbGlowColor;
    if (energyInfo.freq >= 500) {
      orbColor = 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)';
      orbGlowColor = 'rgba(167, 139, 250, 0.3)';
    } else if (energyInfo.freq >= 300) {
      orbColor = 'linear-gradient(135deg, #6EE7B7 0%, #34D399 100%)';
      orbGlowColor = 'rgba(52, 211, 153, 0.25)';
    } else if (energyInfo.freq >= 200) {
      orbColor = 'linear-gradient(135deg, #93E8D5 0%, #5CB8A5 100%)';
      orbGlowColor = 'rgba(92, 184, 165, 0.25)';
    } else {
      orbColor = 'linear-gradient(135deg, #FFB4A2 0%, #E87461 100%)';
      orbGlowColor = 'rgba(232, 116, 97, 0.25)';
    }
    orb.style.background = orbColor;
    orbGlow.style.background = orbGlowColor;

    // Save history
    const historyEntry = {
      date: new Date().toISOString(),
      level: level,
      data: data,
      freq: energyInfo.freq,
      insight: reply
    };
    
    if (window.appState.user) {
      const docRef = await addDoc(collection(db, 'users', window.appState.user.uid, 'history'), historyEntry);
      historyEntry.docId = docRef.id;
    }
    
    window.appState.history.unshift(historyEntry);
    updateGreeting();
    if (window.updateDashboard) updateDashboard(window.currentDashboardPeriod || 'daily');

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

// ==========================================
// Onboarding Quiz Logic (10 Questions based on 6 Jharitas)
// ==========================================
const quizQuestions = [
  {
    q: "เวลาคุณจัดห้องนอนหรือโต๊ะทำงาน คุณมักจะ...",
    options: [
      "จัดให้สวยงาม น่าอยู่ มีสไตล์", 
      "จัดให้เป็นระเบียบเป๊ะๆ ทนความรกไม่ได้", 
      "ไม่ค่อยจัด ปล่อยรกๆ ค่อยทำทีเดียว",
      "จัดตามฮวงจุ้ย หรือจัดแบบที่คนอื่นบอกว่าดี",
      "เอาเวลาไปคิดเรื่องงานหรือเรื่องอื่นมากกว่าจัดโต๊ะ"
    ]
  },
  {
    q: "เวลาไปกินข้าวกับเพื่อนหลายๆ คน คุณมักจะ...",
    options: [
      "เลือกร้านที่บรรยากาศดี ถ่ายรูปสวย", 
      "หงุดหงิดถ้าร้านเสิร์ฟช้าหรือบริการแย่", 
      "กินอะไรก็ได้ ให้เพื่อนเลือกเลย",
      "วิเคราะห์ความคุ้มค่าและโภชนาการของอาหาร",
      "กังวลว่าเพื่อนจะหารค่าอาหารกันยังไง หรือกังวลว่าเพื่อนจะไม่สนุก"
    ]
  },
  {
    q: "เวลาเกิดข้อผิดพลาดในการทำงาน/เรียน สิ่งแรกที่คุณทำคือ...",
    options: [
      "หาทางชดเชยให้ตัวเองรู้สึกดีขึ้น ไปช้อปปิ้ง/กินของอร่อย", 
      "โกรธตัวเอง หรือมองหาว่าใครเป็นคนทำพลาด", 
      "รู้สึกมึนๆ งงๆ ปล่อยเบลอไปก่อน",
      "ยึดหลักการหรือขอคำปรึกษาจากคนที่เคารพ",
      "คิดวนไปวนมาว่าทำไมถึงพลาด พลาดได้อย่างไร กังวลผลกระทบ"
    ]
  },
  {
    q: "เวลามีคนชมคุณ คุณจะรู้สึก...",
    options: [
      "ยิ้มรับ มีความสุขและภูมิใจมาก", 
      "รู้สึกว่ามันยังดีไม่พอ ต้องทำได้ดีกว่านี้", 
      "เฉยๆ ไม่ได้ยินดีอะไรมาก",
      "ซาบซึ้งใจและพร้อมจะตอบแทนคนชม",
      "สงสัยว่าเขาชมจากใจจริงหรือแค่มีมารยาท"
    ]
  },
  {
    q: "เมื่อถึงวันหยุดยาว คุณมักจะวางแผน...",
    options: [
      "ไปเที่ยวที่สวยๆ สปา หรือคาเฟ่ชิลๆ", 
      "จัดตารางเวลาชัดเจนว่าต้องทำอะไรบ้างให้คุ้มค่า", 
      "นอนเฉยๆ อยู่บ้าน ไม่วางแผนอะไร",
      "ไปทำบุญ ไปสถานที่ศักดิ์สิทธิ์ หรือเป็นจิตอาสา",
      "หากิจกรรมที่ได้พัฒนาตัวเอง อ่านหนังสือ ค้นคว้า"
    ]
  },
  {
    q: "เวลาเจอเรื่องน่าหงุดหงิดบนโซเชียลมีเดีย...",
    options: [
      "เลื่อนหนี ไปดูรูปของน่ารักๆ หรือเรื่องตลกแทน", 
      "คอมเมนต์ตอบโต้ หรือรู้สึกโกรธจนหัวเสีย", 
      "ดูผ่านๆ ไม่ค่อยใส่ใจอะไร",
      "เชื่อหรือคล้อยตามคอมเมนต์ที่มีคนกดไลก์เยอะๆ",
      "วิเคราะห์ว่าทำไมคนถึงคิดแบบนั้น หาต้นตอของดราม่า"
    ]
  },
  {
    q: "ก่อนเข้านอน คุณมักจะใช้เวลาไปกับ...",
    options: [
      "ดูซีรีส์ ฟังเพลงสบายๆ ดูของสวยๆ งามๆ", 
      "สรุปสิ่งที่ทำสำเร็จในวันนี้ และแพลนงานพรุ่งนี้", 
      "หัวถึงหมอนก็หลับเลย หรือไถหน้าจอแบบไร้จุดหมาย",
      "สวดมนต์ ไหว้พระ หรือแผ่เมตตา",
      "คิดถึงเรื่องราวในอดีตหรือกังวลเรื่องในอนาคต"
    ]
  },
  {
    q: "เวลาได้โจทย์ที่ท้าทายหรือไม่เคยทำมาก่อน...",
    options: [
      "ตื่นเต้นถ้างานนั้นมันทำให้เราดูดีหรือมีชื่อเสียง", 
      "มุ่งมั่นจะทำให้สมบูรณ์แบบที่สุด ไม่ยอมพลาด", 
      "รู้สึกท้อแท้ ไม่อยากเริ่มเลย",
      "เชื่อมั่นว่าถ้าพยายามตามคำสอน/ผู้เชี่ยวชาญจะทำได้",
      "วางแผนอย่างเป็นระบบ ค้นคว้าข้อมูลก่อนลงมือทำ"
    ]
  },
  {
    q: "ในช่วงเวลาที่ต้องรอคอยอะไรนานๆ (เช่น รถติด, รอคิว)...",
    options: [
      "หงุดหงิดที่ต้องรอ ถอนหายใจ", 
      "นั่งเหม่อๆ ใจลอย หรือหลับ", 
      "หยิบหนังสือหรือพอดแคสต์มาฟังเอาความรู้",
      "คิดฟุ้งซ่านไปเรื่อยเปื่อย จินตนาการเรื่องต่างๆ",
      "สวดมนต์ในใจ หรือทำสมาธิ"
    ]
  },
  {
    q: "โดยรวมแล้ว คุณอยากให้คนอื่นมองคุณว่าเป็นคน...",
    options: [
      "มีเสน่ห์ น่าดึงดูด ดูดี", 
      "เก่งกาจ เป็นผู้นำ พึ่งพาได้", 
      "สบายๆ ง่ายๆ ไม่คิดมาก",
      "เป็นคนดี มีศีลธรรม น่าเชื่อถือ",
      "ฉลาด มีเหตุผล ลึกซึ้ง"
    ]
  }
];

let currentQuizIndex = 0;
const quizAnswers = [];

window.startVoluntaryQuiz = () => {
  currentQuizIndex = 0;
  quizAnswers.length = 0; // Clear previous answers
  navigate('onboarding');
  renderQuizQuestion();
};

window.renderQuizQuestion = () => {
  if (currentQuizIndex >= quizQuestions.length) {
    finishQuizWithGemini();
    return;
  }
  
  const qData = quizQuestions[currentQuizIndex];
  document.getElementById('quiz-question').innerText = qData.q;
  
  // Update progress bar
  const progressPercent = ((currentQuizIndex) / quizQuestions.length) * 100;
  document.getElementById('quiz-progress').style.width = `${progressPercent}%`;

  let optionsHtml = qData.options.map((opt, idx) => `
    <button class="w-full text-left p-4 rounded-2xl bg-[#F8F5F0] hover:bg-[#FDF8F4] border-2 border-transparent hover:border-[#D9C4F7]/60 transition-all duration-200 text-[#3D3D4F] text-sm font-medium active:scale-[0.98]" onclick="selectQuizOption('${opt}')">
      ${opt}
    </button>
  `).join('');
  
  // Add custom input option
  optionsHtml += `
    <div class="flex items-center gap-2 mt-1">
      <input type="text" id="quiz-custom-input" placeholder="พิมพ์ตอบเอง..." class="flex-1 p-3 rounded-2xl bg-[#F8F5F0] border-2 border-transparent focus:outline-none focus:border-[#D9C4F7]/60 text-[#3D3D4F] text-sm font-medium placeholder:text-[#b0b0c0]">
      <button class="bg-[#3D3D4F] text-white p-3 rounded-2xl shadow-md active:scale-95 transition-all" onclick="submitCustomQuizOption()">
        <i class="fa-solid fa-arrow-right"></i>
      </button>
    </div>
  `;
  
  document.getElementById('quiz-options').innerHTML = optionsHtml;
};

window.selectQuizOption = (answerText) => {
  quizAnswers.push({ q: quizQuestions[currentQuizIndex].q, a: answerText });
  currentQuizIndex++;
  renderQuizQuestion();
};

window.submitCustomQuizOption = () => {
  const input = document.getElementById('quiz-custom-input');
  if (!input.value.trim()) {
    input.focus();
    return;
  }
  selectQuizOption(input.value.trim());
};

window.finishQuizWithGemini = async () => {
  // Show loading UI in the quiz card
  document.getElementById('quiz-question').innerText = "Mello กำลังประมวลผลสภาวะของคุณ...";
  document.getElementById('quiz-options').innerHTML = `
    <div class="flex justify-center items-center py-8">
      <div class="w-12 h-12 rounded-full border-4 border-[#FDF8F4] border-t-[#D9C4F7] animate-spin"></div>
    </div>
  `;
  document.getElementById('quiz-progress').style.width = '100%';

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    saveProfileAndGoHome('ไม่ทราบแน่ชัด');
    return;
  }

  const promptText = `
คุณคือ Mello นักจิตวิทยาพุทธที่ใช้ภาษาสากล
ผู้ใช้เพิ่งตอบคำถาม 10 ข้อ เพื่อค้นหา "สภาวะขับอัตโนมัติ" (Default Autopilot) หรือ "จริต 6" ของตนเอง
(จริต 6 ประกอบด้วย: ราคะจริต, โทสะจริต, โมหะจริต, สัทธาจริต, พุทธจริต, วิตกจริต)
นี่คือคำตอบของผู้ใช้:
${JSON.stringify(quizAnswers, null, 2)}

งานของคุณ:
1. วิเคราะห์คำตอบแล้วสรุปว่า "จริตหลัก" (Primary Jharita) ของผู้ใช้คืออะไร ให้ตั้งชื่อสั้นๆ 1 วลีเป็นภาษาอังกฤษ (English only) เช่น "The Overthinker", "The Chaser", "The Perfectionist", "The Observer" พร้อมวงเล็บจริต 6 ภาษาไทย (เช่น "(โทสะจริต)")
2. เขียนคำอธิบายสั้นๆ (description) 1 ประโยค ว่าลักษณะนิสัยเขาเป็นอย่างไร
3. ให้ข้อคิดสั้นๆ (message) 1 ประโยค (เป็นภาษาไทย) ที่ตรงกับจริตหลักนั้น เพื่อเตือนสติว่าสภาวะนี้เป็นเพียงธรรมชาติที่เกิดขึ้น ไม่ใช่ตัวเขา
ตอบกลับในรูปแบบ JSON เท่านั้น ตัวอย่าง: {"autopilot": "The Overthinker (วิตกจริต)", "description": "คุณมักจะคิดวนเวียนและกังวลกับอนาคตที่ยังมาไม่ถึงเสมอ", "message": "ความคิดเป็นเพียงเมฆที่ลอยผ่านหน้าต่าง ไม่ใช่ท้องฟ้าของคุณ"}
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    });

    if (!response.ok) throw new Error('API request failed');
    const result = await response.json();
    const replyText = result.candidates[0].content.parts[0].text;
    const aiResult = JSON.parse(replyText);

    // Update Result UI
    document.getElementById('quiz-result-title').innerText = aiResult.autopilot;
    document.getElementById('quiz-result-desc').innerText = aiResult.description;
    document.getElementById('quiz-result-message').innerText = `"${aiResult.message}"`;
    
    // Choose emoji based on text
    let emoji = '🌟';
    if(aiResult.autopilot.includes('Perfectionist')) emoji = '🎯';
    else if(aiResult.autopilot.includes('Overthinker')) emoji = '🌀';
    else if(aiResult.autopilot.includes('Chaser')) emoji = '🏃';
    else if(aiResult.autopilot.includes('Atlas') || aiResult.autopilot.includes('Believer')) emoji = '🛡️';
    else if(aiResult.autopilot.includes('Apathy') || aiResult.autopilot.includes('Observer')) emoji = '☁️';
    document.getElementById('quiz-result-emoji').innerText = emoji;

    // Save state
    const profile = { defaultAutopilot: aiResult.autopilot };
    window.appState.userProfile = profile;
    localStorage.setItem('meloflow_profile', JSON.stringify(profile));
    
    // Navigate to nice result screen
    navigate('quiz-result');
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    navigate('home');
  }
};

const saveProfileAndGoHome = async (autopilotType) => {
  const profile = window.appState.userProfile || {};
  profile.defaultAutopilot = autopilotType;
  window.appState.userProfile = profile;
  
  if (window.appState.user) {
    await setDoc(doc(db, 'users', window.appState.user.uid), profile, { merge: true });
  }
  
  const statusEl = document.getElementById('profile-autopilot-status');
  if (statusEl) statusEl.innerText = `สภาวะปัจจุบัน: ${autopilotType}`;
  
  updateHomeAutopilotUI();
  navigate('home');
};

const updateHomeAutopilotUI = () => {
  const badge = document.getElementById('home-autopilot-badge');
  const textEl = document.getElementById('home-autopilot-text');
  if (window.appState.userProfile && window.appState.userProfile.defaultAutopilot) {
    if (badge) badge.classList.replace('hidden', 'flex');
    if (textEl) textEl.innerText = `จริต: ${window.appState.userProfile.defaultAutopilot}`;
  } else {
    if (badge) {
      badge.classList.remove('flex');
      badge.classList.add('hidden');
    }
  }
};

// --- Firebase Auth & Init ---

window.toggleAuthMode = (mode) => {
  const loginForm = document.getElementById('form-login');
  const regForm = document.getElementById('form-register');
  const errorEl = document.getElementById('auth-error');
  if(errorEl) errorEl.classList.add('hidden');
  
  if (mode === 'login') {
    loginForm.classList.remove('hidden'); loginForm.classList.add('flex');
    regForm.classList.add('hidden'); regForm.classList.remove('flex');
  } else {
    loginForm.classList.add('hidden'); loginForm.classList.remove('flex');
    regForm.classList.remove('hidden'); regForm.classList.add('flex');
  }
};

window.handleLogin = async () => {
  const email = document.getElementById('login-email').value;
  const pass = document.getElementById('login-password').value;
  const errorEl = document.getElementById('auth-error');
  errorEl.classList.add('hidden');
  
  try {
    navigate('splash');
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (error) {
    navigate('auth');
    errorEl.innerText = "อีเมลหรือรหัสผ่านไม่ถูกต้อง";
    errorEl.classList.remove('hidden');
  }
};

window.handleRegister = async () => {
  const email = document.getElementById('reg-email').value;
  const pass = document.getElementById('reg-password').value;
  const displayName = document.getElementById('reg-displayname').value;
  const errorEl = document.getElementById('auth-error');
  errorEl.classList.add('hidden');
  
  if (!displayName) {
    errorEl.innerText = "กรุณากรอกชื่อตัวละคร";
    errorEl.classList.remove('hidden');
    return;
  }
  
  try {
    navigate('splash');
    const userCred = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Save to Firestore
    await setDoc(doc(db, 'users', userCred.user.uid), {
      displayName: displayName,
      role: 'user',
      lastRenameAt: new Date().toISOString(),
      defaultAutopilot: null
    });
    
  } catch (error) {
    navigate('auth');
    errorEl.innerText = "ไม่สามารถสร้างบัญชีได้: " + error.message;
    errorEl.classList.remove('hidden');
  }
};

window.handleLogout = async () => {
  navigate('splash');
  await signOut(auth);
};

const loadUserData = async (uid) => {
  try {
    // 1. Profile
    const profileSnap = await getDoc(doc(db, 'users', uid));
    if (profileSnap.exists()) {
      window.appState.userProfile = profileSnap.data();
    } else {
      window.appState.userProfile = { displayName: 'ผู้ใช้ทั่วไป', role: 'user' };
    }
    
    // Update Profile View UI
    const nameEl = document.getElementById('profile-display-name');
    const emailEl = document.getElementById('profile-email');
    if (nameEl) nameEl.innerText = window.appState.userProfile.displayName || 'ผู้ใช้ทั่วไป';
    if (emailEl) emailEl.innerText = window.appState.user.email || '';

    // 2. History
    const historyQuery = query(collection(db, 'users', uid, 'history'), orderBy('date', 'desc'));
    const historySnap = await getDocs(historyQuery);
    window.appState.history = historySnap.docs.map(d => ({ docId: d.id, ...d.data() }));

    // 3. Quick Sets
    const qsQuery = query(collection(db, 'users', uid, 'quicksets'));
    const qsSnap = await getDocs(qsQuery);
    if (qsSnap.empty) {
      window.appState.quickSets = [...defaultQuickSets];
    } else {
      window.appState.quickSets = qsSnap.docs.map(d => d.data());
    }
  } catch (e) {
    console.error("Error loading user data:", e);
    window.appState.history = [];
    window.appState.quickSets = [...defaultQuickSets];
  }
};

window.handleRename = async () => {
  const profile = window.appState.userProfile;
  const msgEl = document.getElementById('rename-msg');
  msgEl.classList.add('hidden');
  
  if (!profile) return;
  
  // Check cooldown (7 days) unless admin
  if (profile.role !== 'admin' && profile.lastRenameAt) {
    const lastRename = new Date(profile.lastRenameAt);
    const now = new Date();
    const diffTime = Math.abs(now - lastRename);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) {
      msgEl.innerText = `คุณเพิ่งเปลี่ยนชื่อไป จะเปลี่ยนได้อีกครั้งใน ${8 - diffDays} วันครับ`;
      msgEl.classList.remove('hidden');
      return;
    }
  }
  
  const newName = prompt("ตั้งชื่อตัวละครใหม่ของคุณ:", profile.displayName);
  if (newName && newName.trim() !== "" && newName !== profile.displayName) {
    profile.displayName = newName.trim();
    profile.lastRenameAt = new Date().toISOString();
    
    try {
      await setDoc(doc(db, 'users', window.appState.user.uid), {
        displayName: profile.displayName,
        lastRenameAt: profile.lastRenameAt
      }, { merge: true });
      
      document.getElementById('profile-display-name').innerText = profile.displayName;
      updateGreeting();
      msgEl.innerText = "เปลี่ยนชื่อสำเร็จ! ✨";
      msgEl.classList.remove('text-[#F4A578]');
      msgEl.classList.add('text-[#10B981]');
      msgEl.classList.remove('hidden');
    } catch (e) {
      console.error(e);
      msgEl.innerText = "เกิดข้อผิดพลาดในการเปลี่ยนชื่อ";
      msgEl.classList.remove('hidden');
    }
  }
};

const initApp = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      window.appState.user = user;
      await loadUserData(user.uid);
      
      const statusEl = document.getElementById('profile-autopilot-status');
      if (statusEl && window.appState.userProfile) {
        statusEl.innerText = `สภาวะปัจจุบัน: ${window.appState.userProfile.defaultAutopilot || 'ไม่ระบุ'}`;
      }
      
      updateHomeAutopilotUI();
      navigate('home');
      updateGreeting();
      renderHistory();
      renderQuickSets();
      if (window.updateDashboard) updateDashboard('daily');
    } else {
      window.appState.user = null;
      window.appState.userProfile = null;
      window.appState.history = [];
      window.appState.quickSets = [];
      navigate('auth');
    }
  });
};

document.addEventListener('DOMContentLoaded', initApp);

// History Render
window.renderHistory = () => {
  const container = document.getElementById('history-container');
  const history = window.appState.history;

  if (history.length === 0) {
    container.innerHTML = '<p class="text-[#888899] text-center py-10">ยังไม่มีประวัติการเช็คอิน ลองเช็คจิตใจดูนะ 🌿</p>';
    return;
  }

  container.innerHTML = history.map((h, index) => {
    const d = new Date(h.date);
    const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' });
    let summary = '';
    if (h.level === 1) summary = `อารมณ์: ${h.data.mood} (เข้มข้น: ${h.data.intensity})`;
    else if (h.level === 2) summary = `ความรู้สึก: ${h.data.feeling}`;
    else summary = `ขันธ์ 5 (เวทนา: ${h.data.vedana})`;

    return `
      <div class="glass-card rounded-[24px] p-6 shadow-[0_8px_24px_rgba(0,0,0,0.04)] cursor-pointer hover:shadow-md transition-all active:scale-[0.98]" onclick="openHistoryDetail(${index})">
        <div class="flex justify-between mb-2">
          <span class="text-xs text-[#888899]">${dateStr}</span>
          <span class="text-[10px] py-1 px-3 rounded-full bg-[#F8F5F0] text-[#3D3D4F] font-semibold">Level ${h.level}</span>
        </div>
        <div class="flex justify-between items-center mb-3">
          <p class="text-sm font-semibold text-[#3D3D4F]">${summary}</p>
          <span class="text-xs font-bold text-[#F4A578] bg-[#F4A578]/10 px-2 py-0.5 rounded-lg">${h.freq || '-'} Hz</span>
        </div>
        <div class="text-sm text-[#3D3D4F] bg-[#FDF8F4] p-4 rounded-2xl border border-[#E8E0D8]">
          ${h.insight.substring(0, 100)}...
        </div>
        <div class="mt-3 flex justify-between items-center text-xs font-semibold text-[#b0b0c0]">
          <span>แตะเพื่อดูรายละเอียด / ลบ</span>
          <i class="fa-solid fa-chevron-right text-[10px]"></i>
        </div>
      </div>
    `;
  }).join('');
};

window.openHistoryDetail = (index) => {
  const h = window.appState.history[index];
  if (!h) return;
  const d = new Date(h.date);
  document.getElementById('hd-date').innerText = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  
  let freqName = 'Unknown';
  if (h.freq >= 700) freqName = 'Enlightenment';
  else if (h.freq >= 600) freqName = 'Peace';
  else if (h.freq >= 540) freqName = 'Joy';
  else if (h.freq >= 500) freqName = 'Love';
  else if (h.freq >= 400) freqName = 'Reason';
  else if (h.freq >= 310) freqName = 'Acceptance';
  else if (h.freq >= 200) freqName = 'Courage';
  else freqName = 'Fear/Anger';

  document.getElementById('hd-freq-name').innerText = freqName;
  document.getElementById('hd-freq-hz').innerText = h.freq || '-';
  
  let dataHtml = '';
  if (h.level === 1) {
    dataHtml = `<div class="text-sm"><b>อารมณ์:</b> ${h.data.mood} (ระดับ ${h.data.intensity}/5)</div>
                <div class="text-sm mt-1"><b>บันทึก:</b> ${h.data.note || '-'}</div>`;
  } else if (h.level === 2) {
    dataHtml = `<div class="text-sm"><b>กาย:</b> ${h.data.body}</div>
                <div class="text-sm mt-1"><b>ความรู้สึก:</b> ${h.data.feeling}</div>
                <div class="text-sm mt-1"><b>ความคิด:</b> ${h.data.thoughts}</div>`;
  } else if (h.level === 3) {
    dataHtml = `<div class="text-sm"><b>รูป:</b> ${h.data.rupa}</div>
                <div class="text-sm mt-1"><b>เวทนา:</b> ${h.data.vedana}</div>
                <div class="text-sm mt-1"><b>สัญญา:</b> ${h.data.sanna}</div>
                <div class="text-sm mt-1"><b>สังขาร:</b> ${h.data.sankhara}</div>
                <div class="text-sm mt-1"><b>วิญญาณ:</b> ${h.data.vinnana}</div>`;
  }
  document.getElementById('hd-data-container').innerHTML = dataHtml;
  document.getElementById('hd-insight').innerText = h.insight;
  document.getElementById('hd-delete-btn').onclick = () => deleteHistoryEntry(index);

  const modal = document.getElementById('history-detail-modal');
  const content = modal.querySelector('div');
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    content.classList.remove('translate-y-full', 'sm:scale-95');
    content.classList.add('translate-y-0', 'sm:scale-100');
  }, 10);
};

window.closeHistoryDetail = () => {
  const modal = document.getElementById('history-detail-modal');
  const content = modal.querySelector('div');
  modal.classList.remove('opacity-100');
  modal.classList.add('opacity-0');
  content.classList.remove('translate-y-0', 'sm:scale-100');
  content.classList.add('translate-y-full', 'sm:scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
};

window.deleteHistoryEntry = async (index) => {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัตินี้?')) {
    const entry = window.appState.history[index];
    window.appState.history.splice(index, 1);
    
    if (window.appState.user && entry.docId) {
      await deleteDoc(doc(db, 'users', window.appState.user.uid, 'history', entry.docId));
    }
    
    closeHistoryDetail();
    renderHistory();
    if (window.updateDashboard) updateDashboard(window.currentDashboardPeriod || 'daily');
  }
};

let energyChartInstance = null;

window.currentDashboardPeriod = 'daily';
window.updateDashboard = (period) => {
  window.currentDashboardPeriod = period;
  // Update buttons UI
  ['daily', 'weekly', 'monthly'].forEach(p => {
    const btn = document.getElementById(`btn-dash-${p}`);
    if(btn) {
      if(p === period) {
        btn.className = "text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all bg-white text-[#3D3D4F] shadow-sm";
      } else {
        btn.className = "text-[10px] font-semibold px-3 py-1.5 rounded-full transition-all text-[#888899]";
      }
    }
  });

  const now = new Date();
  let msInPeriod;
  if (period === 'daily') msInPeriod = 24 * 60 * 60 * 1000;
  else if (period === 'weekly') msInPeriod = 7 * 24 * 60 * 60 * 1000;
  else msInPeriod = 30 * 24 * 60 * 60 * 1000;

  const currentPeriodItems = window.appState.history.filter(h => (now - new Date(h.date)) <= msInPeriod);
  const prevPeriodItems = window.appState.history.filter(h => {
    const diff = now - new Date(h.date);
    return diff > msInPeriod && diff <= (msInPeriod * 2);
  });

  const calcAvg = (items) => items.length ? Math.round(items.reduce((sum, h) => sum + (h.freq||0), 0) / items.length) : 0;
  
  const currentAvg = calcAvg(currentPeriodItems);
  const prevAvg = calcAvg(prevPeriodItems);

  const avgHzEl = document.getElementById('dash-avg-hz');
  const nameEl = document.getElementById('dash-avg-name');
  const pinEl = document.getElementById('spectrum-pin');

  if (currentAvg === 0) {
    if (avgHzEl) avgHzEl.innerText = '--';
    if (nameEl) nameEl.innerText = '-';
    if (pinEl) pinEl.style.left = '0%';
  } else {
    if (avgHzEl) avgHzEl.innerText = currentAvg;
    let freqName = 'Fear/Anger';
    if (currentAvg >= 700) freqName = 'Enlightenment';
    else if (currentAvg >= 600) freqName = 'Peace';
    else if (currentAvg >= 540) freqName = 'Joy';
    else if (currentAvg >= 500) freqName = 'Love';
    else if (currentAvg >= 400) freqName = 'Reason';
    else if (currentAvg >= 310) freqName = 'Acceptance';
    else if (currentAvg >= 200) freqName = 'Courage';
    if (nameEl) nameEl.innerText = freqName;
    
    // Calculate percentage on a rough 0-1000 scale
    let pct = (currentAvg / 1000) * 100;
    if (pct > 100) pct = 100;
    if (pinEl) pinEl.style.left = pct + '%';
  }
  
  const trendEl = document.getElementById('dash-trend');
  if (trendEl) {
    if (currentAvg === 0 || prevAvg === 0) {
      trendEl.innerHTML = '--';
      trendEl.className = "text-xs font-semibold text-[#888899] flex items-center justify-end gap-1 mb-1";
    } else {
      const diff = currentAvg - prevAvg;
      if (diff > 0) {
        trendEl.innerHTML = `<i class="fa-solid fa-arrow-up"></i> +${diff} Hz`;
        trendEl.className = "text-xs font-semibold text-[#10B981] flex items-center justify-end gap-1 mb-1";
      } else if (diff < 0) {
        trendEl.innerHTML = `<i class="fa-solid fa-arrow-down"></i> ${diff} Hz`;
        trendEl.className = "text-xs font-semibold text-[#EF4444] flex items-center justify-end gap-1 mb-1";
      } else {
        trendEl.innerHTML = `<i class="fa-solid fa-minus"></i> 0 Hz`;
        trendEl.className = "text-xs font-semibold text-[#888899] flex items-center justify-end gap-1 mb-1";
      }
    }
  }

  // Update Line Chart
  const ctx = document.getElementById('energyLineChart');
  if (ctx) {
    if (energyChartInstance) {
      energyChartInstance.destroy();
    }
    
    // Sort items chronologically
    const sortedItems = [...currentPeriodItems].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    let labels = [];
    let dataPoints = [];
    
    if (sortedItems.length === 0) {
      labels = ['-'];
      dataPoints = [0];
    } else {
      if (period === 'daily') {
        // For Daily: Show all individual entries with time
        sortedItems.forEach(item => {
          const d = new Date(item.date);
          labels.push(d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }));
          dataPoints.push(item.freq || 0);
        });
      } else {
        // For Weekly/Monthly: Group by day and average
        const grouped = {};
        sortedItems.forEach(item => {
          const d = new Date(item.date);
          const dateStr = d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
          if (!grouped[dateStr]) grouped[dateStr] = [];
          grouped[dateStr].push(item.freq || 0);
        });
        
        for (const [dateStr, freqs] of Object.entries(grouped)) {
          labels.push(dateStr);
          const avg = Math.round(freqs.reduce((sum, val) => sum + val, 0) / freqs.length);
          dataPoints.push(avg);
        }
      }
    }

    energyChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Energy (Hz)',
          data: dataPoints,
          borderColor: '#D9C4F7',
          backgroundColor: 'rgba(217, 196, 247, 0.2)',
          borderWidth: 3,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#D9C4F7',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(61, 61, 79, 0.9)',
            padding: 10,
            cornerRadius: 12,
            displayColors: false,
            callbacks: {
              label: function(context) { return context.parsed.y + ' Hz'; }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 }, color: '#b0b0c0', maxRotation: 45, minRotation: 45 }
          },
          y: {
            min: 0,
            max: 1000,
            grid: { color: '#F8F5F0' },
            ticks: { stepSize: 200, font: { size: 10 }, color: '#b0b0c0' },
            border: { display: false }
          }
        }
      }
    });
  }

  // Dashboard Insight Summary
  const insightEl = document.getElementById('dash-insight');
  if (insightEl) {
    if (currentPeriodItems.length === 0) {
      insightEl.innerHTML = `
        <p class="font-semibold text-[#3D3D4F] mb-1">ยังไม่มีข้อมูลในช่วงเวลานี้</p>
        <p class="text-xs text-[#5B5B6E]">💡 คำแนะนำ: ลองเช็คอินอารมณ์หรือสแกนกาย-ใจ เพื่อดูแนวโน้มพลังงานของคุณนะ 🌿</p>
      `;
    } else {
      let periodText = period === 'daily' ? 'วันนี้' : period === 'weekly' ? 'สัปดาห์นี้' : 'เดือนนี้';
      let summary = "";
      let rec = "";

      if (currentAvg >= 500) {
        summary = `ภาพรวม${periodText} พลังงานจิตใจอยู่ในเกณฑ์ยอดเยี่ยม! (เบิกบาน/เมตตา)`;
        rec = "💡 คำแนะนำ: รักษาความรู้สึกโปร่งเบานี้ไว้ หากมีความคิดลบแทรกเข้ามา ให้แค่เฝ้าดูแล้วปล่อยผ่านไปตามธรรมชาติ";
      } else if (currentAvg >= 200) {
        summary = `ภาพรวม${periodText} พลังงานจิตใจอยู่ในระดับบวก (ยอมรับความจริง/มีเหตุผล)`;
        rec = "💡 คำแนะนำ: คุณรับมือกับสถานการณ์ได้ดีมาก ลองฝึก 'รู้ทันความรู้สึก' บ่อยๆ เพื่อยกระดับความถี่ให้สูงขึ้นอีกขั้น";
      } else {
        summary = `ภาพรวม${periodText} ดูเหมือนจิตใจจะหนักอึ้ง หรือมีความเครียดสะสมอยู่บ้าง`;
        rec = "💡 คำแนะนำ: อนุญาตให้ตัวเองได้พักผ่อน ไม่ต้องกดดัน ทักความรู้สึกที่เกิดขึ้นในใจซ้ำๆ โดยไม่ต้องพยายามห้ามหรือผลักไสมัน";
      }

      insightEl.innerHTML = `
        <p class="font-semibold text-[#3D3D4F] mb-1">${summary}</p>
        <p class="text-xs text-[#5B5B6E]">${rec}</p>
      `;
    }
    insightEl.classList.remove('hidden');
  }
};

window.clearHistory = async () => {
  if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบประวัติทั้งหมด?')) {
    const historyToDelete = [...window.appState.history];
    window.appState.history = [];
    
    if (window.appState.user) {
      for (const entry of historyToDelete) {
        if (entry.docId) {
          await deleteDoc(doc(db, 'users', window.appState.user.uid, 'history', entry.docId));
        }
      }
    }
    
    renderHistory();
    updateGreeting();
    if (window.updateDashboard) updateDashboard(window.currentDashboardPeriod || 'daily');
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

// Knowledge Modal logic
window.openKnowledge = () => {
  const modal = document.getElementById('knowledge-modal');
  const content = modal.querySelector('div');
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    content.classList.remove('translate-y-full', 'sm:scale-95');
    content.classList.add('translate-y-0', 'sm:scale-100');
  }, 10);
};

window.closeKnowledge = () => {
  const modal = document.getElementById('knowledge-modal');
  const content = modal.querySelector('div');
  modal.classList.remove('opacity-100');
  modal.classList.add('opacity-0');
  content.classList.remove('translate-y-0', 'sm:scale-100');
  content.classList.add('translate-y-full', 'sm:scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
};

// Khandha Knowledge Modal logic
window.openKhandhaKnowledge = () => {
  const modal = document.getElementById('khandha-modal');
  const content = modal.querySelector('div');
  modal.classList.remove('hidden');
  setTimeout(() => {
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    content.classList.remove('translate-y-full', 'sm:scale-95');
    content.classList.add('translate-y-0', 'sm:scale-100');
  }, 10);
};

window.closeKhandhaKnowledge = () => {
  const modal = document.getElementById('khandha-modal');
  const content = modal.querySelector('div');
  modal.classList.remove('opacity-100');
  modal.classList.add('opacity-0');
  content.classList.remove('translate-y-0', 'sm:scale-100');
  content.classList.add('translate-y-full', 'sm:scale-95');
  setTimeout(() => {
    modal.classList.add('hidden');
  }, 300);
};

// Quick Sets Logic
window.renderQuickSets = () => {
  const container = document.getElementById('quick-sets-container');
  if (!container) return;
  
  let html = '';
  window.appState.quickSets.forEach(set => {
    html += `<button onclick="triggerQuickSet('${set.id}')" class="px-4 py-2 bg-white border border-[#E8E0D8] rounded-full text-sm font-semibold text-[#5B5B6E] shadow-sm hover:shadow-md hover:border-[#D9C4F7] transition-all flex items-center gap-2">
      ${set.name}
    </button>`;
  });
  
  html += `<button onclick="navigate('level2')" class="px-4 py-2 bg-[#F8F5F0] border border-dashed border-[#b0b0c0] rounded-full text-sm font-semibold text-[#888899] hover:bg-[#E8E0D8] transition-all flex items-center gap-2">
    <i class="fa-solid fa-plus"></i> เพิ่มด่วน
  </button>`;
  
  container.innerHTML = html;
};

window.triggerQuickSet = (setId) => {
  const set = window.appState.quickSets.find(s => s.id === setId);
  if (!set) return;
  
  // Navigate first to make sure DOM is active
  navigate('level2');
  
  // Brief timeout to let DOM render classes correctly
  setTimeout(() => {
    // Clear all selections in level2 first
    document.querySelectorAll('#view-level2 .chip').forEach(el => {
      el.classList.remove('selected', 'bg-[#3D3D4F]', 'text-white', 'border-[#3D3D4F]', 'shadow-md', 'scale-105', 'shadow-[0_4px_16px_rgba(0,0,0,0.1)]');
      el.classList.add('bg-white/80', 'text-[#888899]', 'border-[#E8E0D8]');
      el.style.borderColor = '';
    });
    
    // Apply selections
    const applySelections = (category, dataArr) => {
      if (!dataArr) return;
      const chips = document.querySelectorAll(`#${category} .chip`);
      chips.forEach(chip => {
        // Find exact text match
        const match = dataArr.some(d => chip.innerText.trim() === d.trim());
        if (match) {
          window.toggleChip(chip, category, category === 'l2-feeling');
        }
      });
    };
    
    applySelections('l2-body', set.data.body);
    applySelections('l2-feeling', set.data.feeling);
    applySelections('l2-thoughts', set.data.thoughts);
  }, 50);
};

window.saveAsQuickSet = async () => {
  const getSelected = (id) => Array.from(document.querySelectorAll(`#${id} .selected`)).map(c => c.innerText.trim());
  
  const body = getSelected('l2-body');
  const feeling = getSelected('l2-feeling');
  const thoughts = getSelected('l2-thoughts');
  
  if (body.length === 0 && feeling.length === 0 && thoughts.length === 0) {
    alert('กรุณาเลือกอาการอย่างน้อย 1 อย่างก่อนบันทึกชุดด่วนครับ');
    return;
  }
  
  const name = prompt('ตั้งชื่อชุดบันทึกด่วนนี้ (เช่น "หลังอาหารเที่ยง", "ก่อนนอน"):');
  if (!name || name.trim() === '') return;
  
  const newSet = {
    id: 'qs_' + Date.now(),
    name: name.trim(),
    data: { body, feeling, thoughts }
  };
  
  window.appState.quickSets.push(newSet);
  
  if (window.appState.user) {
    await setDoc(doc(db, 'users', window.appState.user.uid, 'quicksets', newSet.id), newSet);
  }
  
  renderQuickSets();
  
  alert(`บันทึกชุดด่วน "${newSet.name}" เรียบร้อยแล้ว! กดใช้ได้ทันทีจากหน้า Home`);
};
