// Service Worker for Melloflow PWA

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Setup scheduled notifications
const scheduledTimes = [
  { hour: 10, minute: 0, title: "อรุณสวัสดิ์ ☀️", body: "แวะพักสักนิด ตอนนี้ใจเป็นยังไงบ้าง?" },
  { hour: 12, minute: 30, title: "พักเที่ยงแล้ว ☕", body: "ทานข้าวเสร็จแล้ว ลองสำรวจใจตัวเองหน่อยไหม?" },
  { hour: 15, minute: 0, title: "บ่ายนี้เป็นไงบ้าง 🌿", body: "ได้เวลา Melloflow แล้ว มาเช็คอารมณ์กันหน่อย" }
];

// Note: In a real app, Push API from a backend server is preferred.
// For standalone PWA without backend push, we simulate via active service worker / setInterval when open.
// Since SW can sleep, reliable scheduling requires Push API or Alarms API (extensions only).
// Here we just handle push events.

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : "มาเช็คใจกันเถอะ ✨",
    icon: '/vite.svg',
    badge: '/vite.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  event.waitUntil(
    self.registration.showNotification('Melloflow 🌿', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('https://meloflow.vercel.app')
  );
});
