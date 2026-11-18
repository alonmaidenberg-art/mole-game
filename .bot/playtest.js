#!/usr/bin/env node
/* המבקר — לא מחפש משחקים שבורים, מחפש משחקים שעובדים אבל לא נעשו נכון.
   (c) 2026 אלון מידנברג.

   hunt.js שואל "המשחק קרס?". זה שואל "אפשר באמת לשחק בזה בטלפון?".
   זה מודד דברים שילד מרגיש אבל לא תמיד יודע לנסח:

     · כפתורים קטנים מכדי ללחוץ עליהם עם אצבע
     · טקסט קטן מכדי לקרוא
     · כפתורים ולוחות שגולשים מחוץ למסך
     · קצב פריימים נמוך — המשחק מרגיש דביק
     · משחק שנגמר אחרי שתי שניות, כל פעם מחדש
     · משחק שבו אפשר ללחוץ חצי דקה ושום דבר לא קורה

   מודד סדרתית (משחק אחד בכל רגע), כי מדידת קצב פריימים במקביל
   מודדת את העומס על המחשב ולא את המשחק.

   הרצה:  node .bot/playtest.js            כל המשחקים
          node .bot/playtest.js zombies    משחק אחד
*/
'use strict';
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8788;
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('--'));

/* אצבע של ילד היא בערך 7 מ"מ. מתחת ל-40 פיקסלים מפספסים. */
const TAP_MIN = 40;
const TEXT_MIN = 12;
const FPS_MIN = 35;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ico': 'image/x-icon' };
function serve() {
  return new Promise(res => {
    const s = http.createServer((req, rq) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) {
        rq.writeHead(404); return rq.end('no');
      }
      rq.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rq);
    });
    s.listen(PORT, '127.0.0.1', () => res(s));
  });
}
function cap(p, ms, d) {
  return Promise.race([Promise.resolve(p).catch(() => d),
    new Promise(r => setTimeout(() => r(d), ms))]);
}

/* ---------- האם אנחנו בתוך המשחק או מול מסך ---------- */
async function overlay(page) {
  return await cap(page.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    if (!el || el.tagName === 'CANVAS') return null;
    let box = el;
    for (let i = 0; i < 6 && box.parentElement; i++) {
      const r = box.getBoundingClientRect();
      if (r.width > innerWidth * 0.5 && r.height > innerHeight * 0.3) break;
      box = box.parentElement;
    }
    const back = /תפריט|חזרה|רשימת המשחקים|back|menu|בית/i;
    const btns = [...box.querySelectorAll('button, a, .btn')]
      .filter(b => { const r = b.getBoundingClientRect(); return r.width > 40 && r.height > 18; })
      .filter(b => !back.test(b.textContent || ''));
    const main = btns.sort((a, b) => {
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return rb.width * rb.height - ra.width * ra.height;
    })[0];
    if (main) main.setAttribute('data-agbot', '1');
    return { text: (box.textContent || '').trim().slice(0, 40), btn: !!main };
  }), 2500, null);
}
async function enter(page) {
  for (let i = 0; i < 4; i++) {
    const o = await overlay(page);
    if (!o) return true;
    if (!o.btn) return false;
    await cap(page.locator('[data-agbot="1"]').first().click({ timeout: 2000 }), 2500);
    await cap(page.evaluate(() => {
      const e = document.querySelector('[data-agbot="1"]'); if (e) e.removeAttribute('data-agbot');
    }), 1500);
    await page.waitForTimeout(500);
  }
  return !(await overlay(page));
}

/* ---------- המדידות ---------- */
/* כפתורים קטנים, טקסט קטן, ודברים שגולשים מחוץ למסך */
const LAYOUT = `(() => {
  const small = [], tiny = [], off = [];
  const seen = new Set();
  const vis = el => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden' || +s.opacity === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const label = el => (el.id ? '#' + el.id : el.tagName.toLowerCase()) +
    (el.textContent ? ' "' + el.textContent.trim().slice(0, 14) + '"' : '');

  for (const el of document.querySelectorAll('button, a, input, select, [role="button"], .btn, .pbtn')) {
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;          /* לא על המסך עכשיו */
    const k = label(el); if (seen.has(k)) continue; seen.add(k);
    if (r.width < ${TAP_MIN} || r.height < ${TAP_MIN})
      small.push(k + ' (' + Math.round(r.width) + '×' + Math.round(r.height) + ')');
    if (r.right > innerWidth + 2 || r.left < -2)
      off.push(k + ' חורג ב-' + Math.round(Math.max(r.right - innerWidth, -r.left)) + 'px');
  }
  /* שורת הזכויות בתחתית היא הערת שוליים ולא טקסט ששחקן צריך לקרוא
     תוך כדי משחק. 10px שם היא בחירה נכונה, ולהגדיל אותה רק תפריע.
     בלי החרגה כאן היא הייתה מדווחת על כל 96 המשחקים בכל שבוע. */
  const legal = /©|כל הזכויות|נא לא להעתיק/;
  for (const el of document.querySelectorAll('body *')) {
    if (el.children.length) continue;
    const t = (el.textContent || '').trim();
    if (t.length < 2) continue;
    if (legal.test(t)) continue;
    if (!vis(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) continue;
    const fs2 = parseFloat(getComputedStyle(el).fontSize) || 16;
    if (fs2 < ${TEXT_MIN}) {
      const k = Math.round(fs2) + 'px: "' + t.slice(0, 18) + '"';
      if (!seen.has(k)) { seen.add(k); tiny.push(k); }
    }
  }
  return { small: small.slice(0, 6), tiny: tiny.slice(0, 5), off: off.slice(0, 5),
    hscroll: document.documentElement.scrollWidth > innerWidth + 2 };
})()`;

async function fps(page) {
  await cap(page.evaluate(() => {
    window.__f = 0;
    const o = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = function (cb) { return o(function (t) { window.__f++; return cb(t) }) };
  }), 2000);
  await page.waitForTimeout(3000);
  return Math.round((await cap(page.evaluate(() => window.__f || 0), 2000, 0)) / 3);
}

/* משחק, ומודד כמה זמן שורדים עד שמופיע מסך "נגמר".
   idle=true אומר לא ללחוץ על כלום — זה קו הבסיס שבלעדיו אי אפשר לדעת
   אם המשחק אכזרי או שפשוט הבוט משחק גרוע. */
async function survive(page, seconds, idle) {
  const DIRS = ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'];
  const t0 = Date.now();
  for (let i = 0; i < seconds * 4; i++) {
    if (!idle) {
      const k = DIRS[i % 4];
      await cap(page.keyboard.down(k), 1200);
      await page.waitForTimeout(140);
      await cap(page.keyboard.up(k), 1200);
      if (i % 3 === 0) await cap(page.keyboard.press(' '), 1200);
    } else {
      await page.waitForTimeout(190);
    }
    if (i % 4 === 3) {
      const o = await overlay(page);
      if (o) return (Date.now() - t0) / 1000;
    }
  }
  return null;              /* שרד עד הסוף */
}

async function check(browser, game) {
  const url = `http://127.0.0.1:${PORT}/${game.url}`;
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 },
    deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'he-IL',
    userAgent: devices['Pixel 5'].userAgent });
  const page = await ctx.newPage();
  const notes = [];
  const add = (sev, what, detail) => notes.push({ sev, what, detail });
  try {
    await page.goto(url, { timeout: 25000, waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { try { localStorage.setItem('ag_name', 'בוט') } catch (e) {} });
    await page.goto(url, { timeout: 25000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    const inGame = await enter(page);
    if (!inGame) { add('low', 'לא הצלחתי להיכנס למשחק', ''); await ctx.close(); return { ...game, notes }; }
    await page.waitForTimeout(600);

    const L = await cap(page.evaluate(LAYOUT), 4000, null);
    if (L) {
      if (L.small.length)
        add('med', 'כפתורים קטנים מדי לאצבע (פחות מ-' + TAP_MIN + 'px)', L.small.join(' · '));
      if (L.tiny.length)
        add('med', 'טקסט קטן מדי לקריאה בטלפון (פחות מ-' + TEXT_MIN + 'px)', L.tiny.join(' · '));
      if (L.off.length)
        add('high', 'משהו גולש מחוץ למסך', L.off.join(' · '));
      if (L.hscroll)
        add('med', 'אפשר לגלול את הדף לצדדים', 'זה מזיז את המשחק תוך כדי משחק');
    }

    const f = await fps(page);
    if (f > 0 && f < FPS_MIN) add('med', 'המשחק רץ לאט', f + ' פריימים בשנייה');

    /* שלוש מיתות מהירות ברצף. אבל הבוט לוחץ כיוונים אקראיים, ובנחש
       זה אומר להסתובב לתוך עצמך — אז לפני שמאשימים את המשחק בודקים
       כמה זורדים בלי ללחוץ בכלל. אם בלי לגעת שורדים הרבה יותר, הבוט
       הוא הבעיה ולא המשחק. */
    const runs = [];
    for (let i = 0; i < 3; i++) {
      if (!(await enter(page))) break;
      const s = await survive(page, 9);
      runs.push(s);
      if (s === null) break;
    }
    const died = runs.filter(x => x !== null);
    let idle = null;
    if (died.length >= 3 && died.every(x => x < 3)) {
      if (await enter(page)) idle = await survive(page, 9, true);
      if (idle !== null && idle < 3)
        add('med', 'נגמר כמעט מיד גם בלי לגעת',
          'שלושה ניסיונות: ' + died.map(x => x.toFixed(1) + 'ש׳').join(', ') +
          ' · בלי ללחוץ בכלל: ' + idle.toFixed(1) + 'ש׳ — ההתחלה אכזרית מדי');
      else
        add('low', 'הבוט מת מהר, אבל הוא פשוט שחקן גרוע',
          'בלי ללחוץ הוא שרד ' + (idle === null ? 'עד הסוף' : idle.toFixed(1) + 'ש׳') +
          ' — כנראה הקלט האקראי ולא המשחק');
    }

    return { ...game, notes, fps: f, runs, idle };
  } catch (e) {
    add('low', 'הבדיקה לא הסתיימה', String(e.message).slice(0, 120));
    return { ...game, notes };
  } finally {
    await ctx.close().catch(() => {});
  }
}

(async () => {
  const server = await serve();
  let games = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8'));
  if (ONLY.length) games = games.filter(g => ONLY.some(o => g.url.includes(o) || g.id === o));
  console.log('המבקר מתחיל — ' + games.length + ' משחקים, אחד-אחד\n');
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox'] });
  const out = [];
  for (let i = 0; i < games.length; i++) {
    const r = await Promise.race([
      check(browser, games[i]).catch(e => ({ ...games[i],
        notes: [{ sev: 'low', what: 'הבדיקה נפלה', detail: String(e.message).slice(0, 100) }] })),
      new Promise(r2 => setTimeout(() => r2({ ...games[i],
        notes: [{ sev: 'low', what: 'הבדיקה לקחה יותר מדי זמן', detail: '' }] }), 120000))
    ]);
    out.push(r);
    const real = r.notes.filter(n => n.sev !== 'low');
    process.stdout.write(String(i + 1).padStart(3) + '/' + games.length + '  ' +
      (real.length ? '• ' : '· ') + r.url.padEnd(20) +
      (r.fps ? String(r.fps).padStart(3) + 'fps ' : '      ') +
      real.map(n => n.what).join('; ') + '\n');
  }
  await browser.close();
  server.close();
  fs.writeFileSync(path.join(ROOT, '.bot', 'last-playtest.json'),
    JSON.stringify({ when: new Date().toISOString(), results: out }, null, 1));

  console.log('\n' + '─'.repeat(60));
  const withNotes = out.filter(r => r.notes.some(n => n.sev !== 'low'));
  console.log('נבדקו ' + out.length + ' משחקים. יש מה לשפר ב-' + withNotes.length + '.\n');
  for (const r of withNotes) {
    console.log('▸ ' + r.name + '  (' + r.url + ')');
    for (const n of r.notes) if (n.sev !== 'low')
      console.log('   [' + n.sev + '] ' + n.what + (n.detail ? ' — ' + n.detail : ''));
  }
  console.log('\nהדוח המלא: .bot/last-playtest.json');
  process.exit(0);
})();
