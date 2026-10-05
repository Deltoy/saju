// Offline cache: app shell (incl. bundled lunar.js) + fonts. Bump V on every release.
const V = 'saju-v2';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'saju.js', 'lunar.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css'];
// 하나씩 캐시: 한 파일이 실패해도 나머지는 남음
self.addEventListener('install', e => e.waitUntil(caches.open(V).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())));
const put = (req, r) => { if (r && r.ok) { const c = r.clone(); caches.open(V).then(x => x.put(req, c)); } return r; };   // 오류 응답은 캐시하지 않음
// own files: network first (fresh after deploy); CDN & fonts: cache first
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const own = new URL(e.request.url).origin === location.origin;
  e.respondWith(own
    ? fetch(e.request).then(r => put(e.request, r)).catch(() => caches.match(e.request, { ignoreSearch: true }))
    : caches.match(e.request).then(m => m || fetch(e.request).then(r => put(e.request, r))));
});
