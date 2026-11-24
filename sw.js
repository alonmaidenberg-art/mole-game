/* ה-Service Worker של האתר.
   (c) 2026 אלון מידנברג.

   האתר מתעדכן הרבה — הבוט השבועי דוחף תיקונים ומשחקים חדשים — ולכן
   הכלל כאן הוא **רשת קודם**: מי שמחובר תמיד מקבל את הגרסה העדכנית,
   והמטמון משמש רק כגיבוי כשאין אינטרנט. ההפך (מטמון קודם) היה מהיר
   יותר אבל היה מגיש משחקים ישנים אחרי כל תיקון, וזה גרוע יותר. */
const V = 'ag-v1';
const SHELL = ['/', '/index.html', '/games.json', '/theme.css', '/hub.js',
               '/assets/icon-192.png', '/assets/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(V);
    /* addAll נכשל כולו אם קובץ אחד נופל, אז כל אחד בנפרד */
    await Promise.all(SHELL.map(u => c.add(u).catch(() => {})));
    self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== V) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const url = new URL(r.url);
  if (url.origin !== location.origin) return;      /* לא נוגעים בבקשות החוצה */

  e.respondWith((async () => {
    try {
      const fresh = await fetch(r);
      /* שומרים עותק לשעת חירום, אבל רק של תשובות תקינות */
      if (fresh && fresh.ok && fresh.type === 'basic') {
        const c = await caches.open(V);
        c.put(r, fresh.clone()).catch(() => {});
      }
      return fresh;
    } catch (err) {
      const hit = await caches.match(r);
      if (hit) return hit;
      /* דף שלא נשמר ואין רשת — מחזירים את הלובי אם הוא במטמון */
      if (r.mode === 'navigate') {
        const home = await caches.match('/index.html') || await caches.match('/');
        if (home) return home;
      }
      throw err;
    }
  })());
});
