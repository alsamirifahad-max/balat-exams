/* عامل الخدمة: يعمل الموقع بدون إنترنت — الصفحة من الشبكة أولاً ثم من النسخة المحفوظة */
const V = '1794461519', CACHE = 'balat-' + V;
const ASSETS = ["./", "cal-1448-t2.jpg", "cal-1448.webp", "docx.umd.js", "html2canvas.min.js", "icon-180.png", "icon-192.png", "icon-512.png", "jspdf.umd.min.js", "manifest.webmanifest", "pdf.min.js", "pdf.worker.min.js", "xlsx.full.min.js", "fonts/tajawal-arabic-400-normal.woff2", "fonts/tajawal-arabic-500-normal.woff2", "fonts/tajawal-arabic-700-normal.woff2", "fonts/tajawal-arabic-800-normal.woff2", "fonts/tajawal-latin-400-normal.woff2", "fonts/tajawal-latin-500-normal.woff2", "fonts/tajawal-latin-700-normal.woff2", "fonts/tajawal-latin-800-normal.woff2"];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('balat-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/.netlify/') || u.pathname.endsWith('version.txt')) return;
  const isPage = r.mode === 'navigate' || u.pathname === '/' || u.pathname.endsWith('.html');
  if (isPage) { e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(CACHE).then(c => c.put('./', cp)); return res; }).catch(() => caches.match('./').then(m => m || caches.match('index.html')))); return; }
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; })));
});
