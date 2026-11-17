#!/usr/bin/env node
/* צייד הבאגים — משחק בכל המשחקים באתר ומחפש תקלות.
   (c) 2026 אלון מידנברג.

   הרעיון: לא לבדוק כל משחק לפי הכללים שלו (אין לזה סוף), אלא לחפש
   תקלות שנכונות לכל משחק — קריסה, לולאה שנתקעה, שליטה שלא מגיבה,
   מספרים שנהרסו, ושחקן שיצא מהמפה. הבאג של "אפשר לטוס מעל ההרים"
   הוא בדיוק מהסוג האחרון.

   הרצה:  node .bot/hunt.js            כל המשחקים
          node .bot/hunt.js zombies    משחק אחד
          node .bot/hunt.js --jobs 8   כמה במקביל
*/
'use strict';
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = path.resolve(__dirname, '..');
const PORT = 8777;
const SECONDS = 14;          /* כמה זמן לשחק בכל משחק */
const JOBS = (() => { const i = process.argv.indexOf('--jobs'); return i > 0 ? +process.argv[i + 1] : 4; })();
const LIMIT = 60000;          /* תקרה קשיחה לכל משחק */
const ONLY = process.argv.slice(2).filter(a => !a.startsWith('--') && !/^\d+$/.test(a));

/* ---------- שרת קבצים קטן, כדי לא להיות תלויים בשום דבר חיצוני ---------- */
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

/* ---------- מה שרץ בתוך הדף ----------
   המשחקים מכריזים על המצב שלהם עם let ("let P,zs,W,H"), ו-let לא יושב על
   window — אי אפשר לגלות אותו בסריקה. אבל אפשר להגיע אליו בשם. אז קוראים
   את קוד המשחק, מוציאים משם את שמות המשתנים, ושואלים עליהם אחד-אחד. */
function nameList(src) {
  const out = new Set();
  const re = /\b(?:let|var|const)\s+([A-Za-z_$][\w$]*(?:\s*(?:=[^,;\n]{0,80})?\s*,\s*[A-Za-z_$][\w$]*)*)/g;
  let m;
  while ((m = re.exec(src))) {
    for (const part of m[1].split(',')) {
      const id = part.split('=')[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(id) && id.length <= 14) out.add(id);
    }
  }
  /* שמות שאין טעם לשאול עליהם */
  for (const junk of ['i','j','k','n','x','y','e','t','s','d','a','b','c','v','r','g','h','w','l','o','p','q','u','f','m'])
    out.delete(junk);
  return [...out].slice(0, 220);
}

/* מחזיר כל שם שמצביע על ישות עם מיקום, וכל שם שמחזיק מספר שנראה כמו גודל עולם */
function probeSrc(names) {
  return `(() => {
    const NAMES = ${JSON.stringify(names)};
    const ents = {}, nums = {};
    for (const k of NAMES) {
      let v;
      try { v = eval('typeof ' + k + " !== 'undefined' ? " + k + ' : undefined') } catch (e) { continue }
      if (v == null) continue;
      if (typeof v === 'number') { if (isFinite(v) || true) nums[k] = v; continue }
      if (typeof v === 'object' && !Array.isArray(v) && !(v instanceof Node)) {
        let x, y, z; try { x = v.x; y = v.y; z = v.z } catch (e) { continue }
        if (typeof x === 'number' && typeof y === 'number') {
          const o = { x: x, y: y };
          if (typeof z === 'number') o.z = z;
          ents[k] = o;
        }
      }
    }
    return { ents, nums, t: performance.now() };
  })()`;
}

/* חתימה קטנה של מה שמצויר על המסך, כדי לזהות תמונה קפואה או ריקה */
const SHOT = `(() => {
  const cs = [...document.querySelectorAll('canvas')].filter(c => c.width > 20 && c.height > 20);
  if (!cs.length) return null;
  const c = cs.sort((a, b) => b.width * b.height - a.width * a.height)[0];
  const t = document.createElement('canvas'); t.width = 24; t.height = 24;
  const g = t.getContext('2d', { willReadFrequently: true });
  try { g.drawImage(c, 0, 0, 24, 24) } catch (e) { return null }
  let d; try { d = g.getImageData(0, 0, 24, 24).data } catch (e) { return null }
  let h = 0, lo = 255, hi = 0;
  for (let i = 0; i < d.length; i += 4) {
    const v = (d[i] + d[i+1] + d[i+2]) / 3;
    if (v < lo) lo = v; if (v > hi) hi = v;
    h = (h * 31 + v) | 0;
  }
  return { h: h, flat: hi - lo };   /* flat קטן = מסך בצבע אחד */
})()`;

/* ---------- הכלים לשחק ---------- */
async function startGame(page) {
  /* רוב המשחקים באתר פותחים ב-#go. אחרת מחפשים כפתור שכתוב עליו משהו כמו "שחק". */
  const tries = ['#go', '#start', '#play', '#begin'];
  for (const sel of tries) {
    const el = page.locator(sel).first();
    if (await el.count() && await el.isVisible().catch(() => false)) {
      await el.click({ timeout: 2000 }).catch(() => {});
      return sel;
    }
  }
  const byText = page.locator('button, a, .btn').filter({ hasText: /שחק|התחל|המשך|start|play|צא לדרך|קדימה/i }).first();
  if (await byText.count().catch(() => 0)) {
    await byText.click({ timeout: 2000 }).catch(() => {});
    return 'text';
  }
  return null;
}

/* עוטף כל פעולה בזמן קצוב. משחק אחד תקוע לא יעצור את כל הסריקה. */
function cap(promise, ms, dflt) {
  return Promise.race([
    Promise.resolve(promise).catch(() => dflt),
    new Promise(r => setTimeout(() => r(dflt), ms))
  ]);
}

const DIRS = [['ArrowRight', 1, 0], ['ArrowLeft', -1, 0], ['ArrowUp', 0, -1], ['ArrowDown', 0, 1],
              ['d', 1, 0], ['a', -1, 0], ['w', 0, -1], ['s', 0, 1]];
async function drive(page, phase) {
  /* סדרת קלט קבועה: כל כיוון בתורו, ואז ירי/קפיצה. אותו דבר בכל משחק,
     כדי שאפשר יהיה להשוות ולשחזר, ולדעת לאיזה כיוון ביקשנו ללכת. */
  const [k, dx, dy] = DIRS[phase % DIRS.length];
  await cap(page.keyboard.down(k), 1500);
  await page.waitForTimeout(300);
  await cap(page.keyboard.up(k), 1500);
  if (phase % 3 === 0) {
    await page.keyboard.press(' ').catch(() => {});
    const box = await cap(page.locator('canvas').first().boundingBox(), 1500, null);
    if (box) {
      const x = box.x + box.width * (0.3 + 0.4 * Math.random());
      const y = box.y + box.height * (0.3 + 0.4 * Math.random());
      await cap(page.mouse.move(x, y), 1200);
      await cap(page.mouse.down(), 1200);
      await page.waitForTimeout(80);
      await cap(page.mouse.up(), 1200);
    }
  }
  return { dx, dy };
}

/* ---------- בדיקת משחק אחד ---------- */
async function hunt(browser, game) {
  const url = `http://127.0.0.1:${PORT}/${game.url}`;
  /* שמות המשתנים נקראים מהקוד של המשחק עצמו */
  let names = [];
  try {
    const f = path.join(ROOT, game.url, 'index.html');
    let src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/<script src="([^"]+\.js)"/g)) {
      const sf = path.join(ROOT, game.url, m[1]);
      if (fs.existsSync(sf)) src += fs.readFileSync(sf, 'utf8');
    }
    names = nameList(src);
  } catch (e) {}
  const PROBE = probeSrc(names);
  const ctx = await browser.newContext({ ...devices['Pixel 5'], hasTouch: true, isMobile: true, locale: 'he-IL' });
  const page = await ctx.newPage();
  const errs = [], warn = [];
  page.on('dialog', d => { warn.push('dialog: ' + d.message().slice(0, 60)); d.dismiss().catch(() => {}); });
  page.on('pageerror', e => errs.push(String(e.message).slice(0, 200)));
  page.on('console', m => { if (m.type() === 'error') warn.push(String(m.text()).slice(0, 160)); });

  const found = [];
  let aliveOut = 0;
  const add = (sev, what, detail) => found.push({ sev, what, detail });

  try {
    await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.evaluate(() => { try { localStorage.setItem('ag_name', 'בוט'); } catch (e) {} });
    await page.goto(url, { timeout: 20000, waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1600);

    const started = await startGame(page);
    await page.waitForTimeout(900);

    /* האם בכלל יש לולאת ציור חיה */
    const alive = await cap(page.evaluate(() => new Promise(r => {
      let n = 0; const t0 = performance.now();
      const c = () => { n++; if (performance.now() - t0 < 700) requestAnimationFrame(c); else r(n); };
      requestAnimationFrame(c);
    })), 3000, 0);
    aliveOut = alive;

    const samples = [];
    const shots = [];
    /* שלב א' — קלט מעורב, לראות שהמשחק חי ומגיב */
    for (let i = 0; i < SECONDS; i++) {
      const asked = await drive(page, i);
      const s = await cap(page.evaluate(PROBE), 2500, null);
      const sh = await cap(page.evaluate(SHOT), 2500, null);
      if (s) { s.ask = asked; samples.push(s); }
      if (sh) shots.push(sh);
    }
    /* שלב ב' — דוחפים חזק לכל קיר בתורו. ככה מוצאים חור בגבול:
       הולכים לכיוון אחד עד הסוף ובודקים אם נעצרנו. */
    for (const [k, dx, dy] of [['ArrowRight', 1, 0], ['ArrowLeft', -1, 0],
                               ['ArrowUp', 0, -1], ['ArrowDown', 0, 1]]) {
      await cap(page.keyboard.down(k), 1500);
      for (let j = 0; j < 12; j++) {
        await page.waitForTimeout(280);
        const s = await cap(page.evaluate(PROBE), 2500, null);
        if (s) { s.ask = { dx, dy }; s.wall = true; samples.push(s); }
      }
      await cap(page.keyboard.up(k), 1500);
      /* גם קפיצה תוך כדי, כי בכמה משחקים ככה בורחים מהמפה */
      await cap(page.keyboard.press(' '), 1200);
    }

    /* ---- קריסה ---- */
    if (errs.length) add('high', 'שגיאה בזמן משחק', errs.slice(0, 3).join(' | '));

    /* ---- מסך קפוא או ריק ---- */
    if (shots.length > 6) {
      const uniq = new Set(shots.map(s => s.h)).size;
      const flat = shots.filter(s => s.flat < 6).length;
      if (uniq === 1) add('high', 'התמונה קפואה — שום דבר לא זז על המסך', String(shots.length) + ' דגימות זהות');
      else if (flat > shots.length * 0.8) add('high', 'המסך ריק — צבע אחד בלבד', '');
      /* זו בדיקת "חי או מת", לא בדיקת מהירות: כשרצים כמה משחקים במקביל
         על עיבוד תוכנה הקצב צונח, וזו תקלה של הבדיקה ולא של המשחק. */
      if (alive < 3) add('high', 'לולאת הציור לא רצה בכלל', 'פריימים ב-700 אלפיות: ' + alive);
    } else if (await page.locator('canvas').count()) {
      add('low', 'לא הצלחתי לקרוא את הקנבס', '');
    }

    /* ---- שליטה מתה / יציאה מהמפה / מספרים הרוסים ---- */
    if (samples.length > 6) {
      const last = samples[samples.length - 1];
      const keys = Object.keys(last.ents);
      const nums = last.nums || {};
      const W = nums.W || nums.MAPW || nums.GW || nums.WORLD;
      const H = nums.H || nums.MAPH || nums.GH;

      /* מי בכלל מגיב לקלט: סוכמים את התזוזה בכיוון שביקשנו.
         זה מבדיל בין השחקן לבין אויבים ועכבר, שזזים בלי קשר למה שלחצנו. */
      let bestResponse = 0, bestName = '';
      for (const k of keys) {
        let score = 0, n = 0;
        for (let i = 1; i < samples.length; i++) {
          const a = samples[i - 1].ents[k], b2 = samples[i].ents[k], ask = samples[i].ask;
          if (!a || !b2 || !ask) continue;
          const mx = b2.x - a.x, my = b2.y - a.y;
          if (!isFinite(mx) || !isFinite(my)) continue;
          score += mx * ask.dx + my * ask.dy;      /* חיובי = זז לאן שביקשנו */
          n++;
        }
        if (n > 4 && score > bestResponse) { bestResponse = score; bestName = k; }
      }

      for (const k of keys) {
        const trail = samples.map(s2 => s2.ents[k]).filter(Boolean);
        if (trail.length < 5) continue;

        const bad = trail.find(pt => !isFinite(pt.x) || !isFinite(pt.y) || (pt.z !== undefined && !isFinite(pt.z)));
        if (bad) add('high', 'מספר הרוס (NaN) ב-' + k, JSON.stringify(bad));

        /* יציאה מגבולות המפה — זה הבאג של "אפשר לטוס מעל ההרים".
           נבדק רק על מי שמגיב לקלט, ורק בזמן הדחיפה לקירות, כדי שישות
           אחרת שמסתובבת מחוץ למסך לא תיחשב בטעות. */
        if (W && H && (k === bestName || k === 'P' || k === 'me' || k === 'player')) {
          const pushed = samples.filter(s2 => s2.wall && s2.ents[k]).map(s2 => s2.ents[k]);
          let worst = null, by = 0;
          for (const pt of pushed) {
            const over = Math.max(-pt.x, pt.x - W, -pt.y, pt.y - H);
            if (over > by) { by = over; worst = pt; }
          }
          if (worst && by > Math.max(24, W * 0.04))
            add('med', 'יוצא מגבולות המפה (' + k + ')',
              'הגיע ל-' + Math.round(worst.x) + ',' + Math.round(worst.y) +
              ' — ' + Math.round(by) + ' פיקסלים מחוץ למפה של ' + Math.round(W) + '×' + Math.round(H));
        }
      }

      /* אם שום דבר לא זז לכיוון שביקשנו — השליטה מתה */
      if (keys.length && started && bestResponse < 12)
        add('high', 'אי אפשר לזוז — שום דבר לא הגיב לכיוונים',
          'נבדקו ' + keys.length + ' משתנים, התגובה הכי טובה הייתה ' + Math.round(bestResponse) + ' פיקסלים');
    } else if (started && await page.locator('canvas').count()) {
      add('low', 'לא מצאתי מצב משחק לבדוק', '');
    }

    if (!started && await page.locator('canvas').count())
      add('low', 'לא מצאתי כפתור התחלה', '');

    if (warn.length) add('low', 'שגיאות בקונסול', warn.slice(0, 2).join(' | '));

  } catch (e) {
    add('high', 'המשחק לא נטען', String(e.message).slice(0, 160));
  }
  await ctx.close().catch(() => {});
  return { id: game.id, name: game.name, url: game.url, found, frames: aliveOut };
}

/* ---------- ריצה ---------- */
(async () => {
  const server = await serve();
  let games = JSON.parse(fs.readFileSync(path.join(ROOT, 'games.json'), 'utf8'));
  if (ONLY.length) games = games.filter(g => ONLY.some(o => g.url.includes(o) || g.id === o));
  console.log('צד הבאגים יוצא לדרך — ' + games.length + ' משחקים, ' + JOBS + ' במקביל\n');

  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--no-sandbox'] });
  const out = [];
  let i = 0, done = 0;
  async function worker() {
    while (i < games.length) {
      const g = games[i++];
      const deadline = new Promise(r => setTimeout(() => r({ id: g.id, name: g.name, url: g.url,
        found: [{ sev: 'high', what: 'המשחק תקע את הבדיקה', detail: 'לא סיים תוך ' + LIMIT / 1000 + ' שניות' }] }), LIMIT));
      const r = await Promise.race([
        hunt(browser, g).catch(e => ({ id: g.id, name: g.name, url: g.url,
          found: [{ sev: 'high', what: 'הבדיקה עצמה נפלה', detail: String(e.message).slice(0, 140) }] })),
        deadline]);
      out.push(r);
      done++;
      const bad = r.found.filter(f => f.sev !== 'low').length;
      process.stdout.write(String(done).padStart(3) + '/' + games.length + '  ' +
        (bad ? '✗ ' : '· ') + r.url.padEnd(22) + (bad ? r.found.filter(f => f.sev !== 'low').map(f => f.what).join('; ') : '') + '\n');
    }
  }
  await Promise.all(Array.from({ length: Math.min(JOBS, games.length) }, worker));
  await browser.close();
  server.close();

  out.sort((a, b) => b.found.filter(f => f.sev === 'high').length - a.found.filter(f => f.sev === 'high').length);
  const real = out.filter(r => r.found.some(f => f.sev !== 'low'));
  const report = { when: new Date().toISOString(), games: games.length, withFindings: real.length, results: out };
  fs.mkdirSync(path.join(ROOT, '.bot'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, '.bot', 'last-run.json'), JSON.stringify(report, null, 1));

  console.log('\n' + '─'.repeat(60));
  console.log('נבדקו ' + games.length + ' משחקים. נמצאו ממצאים ב-' + real.length + '.\n');
  for (const r of real) {
    console.log('▸ ' + r.name + '  (' + r.url + ')');
    for (const f of r.found) if (f.sev !== 'low')
      console.log('   [' + f.sev + '] ' + f.what + (f.detail ? ' — ' + f.detail : ''));
  }
  console.log('\nהדוח המלא: .bot/last-run.json');
  process.exit(0);
})();
