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
          continue;
        }
        /* גוף שבנוי מנקודות ואין לו מיקום משלו — למשל הרכב ב"נהיגה מטורפת",
           שמורכב מגלגלים. לוקחים את הממוצע שלהן. */
        try {
          for (const pk of Object.keys(v)) {
            const arr = v[pk];
            if (!Array.isArray(arr) || arr.length < 2 || arr.length > 40) continue;
            if (typeof arr[0] !== 'object' || arr[0] === null) continue;
            if (typeof arr[0].x !== 'number' || typeof arr[0].y !== 'number') continue;
            let sx = 0, sy = 0, n = 0;
            for (const q of arr) { if (typeof q.x === 'number' && typeof q.y === 'number') { sx += q.x; sy += q.y; n++ } }
            if (n >= 2) { ents[k] = { x: sx / n, y: sy / n }; break }
          }
        } catch (e) {}
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
      let ok = true;
      await el.click({ timeout: 2500 }).catch(() => { ok = false; });
      if (ok) return sel;
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
/* הקנבס הגדול ביותר הוא שטח המשחק. בכמה דפים יש גם קנבס זעיר לקישוט,
   ולחיצה עליו במקום על המשחק נראית כאילו המשחק לא מגיב. */
async function playBox(page) {
  return await cap(page.evaluate(() => {
    const cs = [...document.querySelectorAll('canvas')].filter(c => c.width > 20 && c.height > 20);
    if (!cs.length) return null;
    const c = cs.sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const r = c.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  }), 2000, null);
}

/* האם משהו חוסם את מרכז המסך — תפריט פתיחה, מסך "נגמר", הסבר.
   בלי זה הבוט נותן ציונים לתפריטים ומדווח שהמשחק "קפוא". */
async function overlay(page) {
  return await cap(page.evaluate(() => {
    const el = document.elementFromPoint(innerWidth / 2, innerHeight / 2);
    if (!el) return null;
    if (el.tagName === 'CANVAS') return null;
    /* מטפסים למעלה עד הקופסה שחוסמת */
    let box = el;
    for (let i = 0; i < 6 && box.parentElement; i++) {
      const r = box.getBoundingClientRect();
      if (r.width > innerWidth * 0.5 && r.height > innerHeight * 0.3) break;
      box = box.parentElement;
    }
    const btns = [...box.querySelectorAll('button, a, .btn')]
      .filter(b => { const r = b.getBoundingClientRect(); return r.width > 40 && r.height > 18; });
    /* הכפתור הראשי הוא הגדול ביותר שלא מחזיר לתפריט הראשי */
    const back = /תפריט|חזרה|רשימת המשחקים|back|menu|בית/i;
    const main = btns.filter(b => !back.test(b.textContent || ''))
      .sort((a, b) => b.getBoundingClientRect().width * b.getBoundingClientRect().height
                    - a.getBoundingClientRect().width * a.getBoundingClientRect().height)[0];
    if (!main) return { text: (box.textContent || '').trim().slice(0, 40), btn: null };
    main.setAttribute('data-agbot', '1');
    return { text: (box.textContent || '').trim().slice(0, 40), btn: (main.textContent || '').trim().slice(0, 24) };
  }), 2500, null);
}

/* מנסה להיכנס למשחק: לוחץ על הכפתור הראשי של מה שחוסם, עד 4 פעמים */
async function enter(page) {
  for (let i = 0; i < 4; i++) {
    const o = await overlay(page);
    if (!o) return true;
    if (!o.btn) return false;
    await cap(page.locator('[data-agbot="1"]').first().click({ timeout: 2000 }), 2500);
    await cap(page.evaluate(() => {
      const e = document.querySelector('[data-agbot="1"]'); if (e) e.removeAttribute('data-agbot');
    }), 1500);
    await page.waitForTimeout(600);
  }
  return !(await overlay(page));
}

async function drive(page, phase) {
  /* סדרת קלט קבועה: כל כיוון בתורו, ואז ירי/קפיצה. אותו דבר בכל משחק,
     כדי שאפשר יהיה להשוות ולשחזר, ולדעת לאיזה כיוון ביקשנו ללכת. */
  const [k, dx, dy] = DIRS[phase % DIRS.length];
  await cap(page.keyboard.down(k), 1500);
  await page.waitForTimeout(300);
  await cap(page.keyboard.up(k), 1500);
  if (phase % 3 === 0) {
    await page.keyboard.press(' ').catch(() => {});
    const box = await playBox(page);
    if (box) {
      const x = box.x + box.width * (0.3 + 0.4 * Math.random());
      const y = box.y + box.height * (0.3 + 0.4 * Math.random());
      await cap(page.mouse.move(x, y), 1200);
      await cap(page.mouse.down(), 1200);
      await page.waitForTimeout(80);
      await cap(page.mouse.up(), 1200);
    }
  }
  /* כפתורי המסך. משחקים כמו נהיגה מטורפת נשלטים בגז ובלם ולא בחיצים,
     ובלי ללחוץ עליהם הרכב פשוט עומד במקום. */
  if (phase % 2 === 1) {
    const pads = await cap(page.evaluate(() => {
      const skip = /תפריט|חזרה|בית|menu|back|הגדרות|שמע|מסך/i;
      const out = [];
      for (const b of document.querySelectorAll('button, .btn, [id^="b"]')) {
        const r = b.getBoundingClientRect();
        if (r.width < 28 || r.height < 28) continue;
        if (r.bottom < 0 || r.top > innerHeight) continue;
        if (skip.test(b.textContent || '')) continue;
        out.push({ x: r.x + r.width / 2, y: r.y + r.height / 2 });
      }
      return out.slice(0, 6);
    }), 2000, []);
    const pad = pads[(phase >> 1) % Math.max(1, pads.length)];
    if (pad) {
      await cap(page.mouse.move(pad.x, pad.y), 1200);
      await cap(page.mouse.down(), 1200);
      await page.waitForTimeout(260);
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
  /* רוב המשחקים דורשים מסך לרוחב ומציגים "סובבו את המכשיר" לאורך,
     אז משחקים לרוחב. מי שבכל זאת מתעקש — מנסים גם לאורך. */
  const LAND = { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2,
    isMobile: true, hasTouch: true, locale: 'he-IL',
    userAgent: devices['Pixel 5'].userAgent };
  const PORT_ = { ...devices['Pixel 5'], hasTouch: true, isMobile: true, locale: 'he-IL' };
  const ctx = await browser.newContext(game._portrait ? PORT_ : LAND);
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

    const blocked = await cap(page.evaluate(() => {
      const r = document.querySelector('#rot');
      if (!r) return false;
      const st = getComputedStyle(r);
      return st.display !== 'none' && st.visibility !== 'hidden' && r.offsetHeight > 50;
    }), 2000, false);
    if (blocked) {
      add('low', 'מסך "סובבו את המכשיר" חוסם את הבדיקה', 'נבדק במסך ' +
        (game._portrait ? 'לאורך' : 'לרוחב'));
      await ctx.close().catch(() => {});
      return { id: game.id, name: game.name, url: game.url, found, rotBlocked: true };
    }

    const started = await startGame(page);
    await page.waitForTimeout(900);
    /* הרבה משחקים נפתחים על מסך הסבר, ולא על המשחק עצמו */
    let playing = await enter(page);
    let playedSamples = 0, deaths = 0;

    /* האם בכלל יש לולאת ציור חיה */
    /* נרשם לידיעה בלבד. משחק שמצייר רק כשלוחצים (סיימון, מאסטרמיינד,
       פאזל) לא מבקש פריימים כלל, וזה לא תקלה — לכן אין על זה ממצא. */
    await cap(page.evaluate(() => {
      window.__raf = 0;
      const orig = window.requestAnimationFrame.bind(window);
      window.requestAnimationFrame = function (cb) {
        return orig(function (t) { window.__raf++; return cb(t); });
      };
    }), 2000);
    await page.waitForTimeout(1000);
    aliveOut = await cap(page.evaluate(() => window.__raf || 0), 2000, 0);

    const samples = [];
    const shots = [];
    /* שלב א' — קלט מעורב, לראות שהמשחק חי ומגיב */
    for (let i = 0; i < SECONDS; i++) {
      const asked = await drive(page, i);
      /* כל כמה צעדים בודקים אם מתנו או נתקענו בתפריט, ואם כן — חוזרים פנימה */
      if (i % 5 === 4) {
        const o = await overlay(page);
        if (o) { deaths++; playing = await enter(page); }
      }
      if (!playing) continue;
      const s = await cap(page.evaluate(PROBE), 2500, null);
      const sh = await cap(page.evaluate(SHOT), 2500, null);
      if (s) { s.ask = asked; samples.push(s); playedSamples++; }
      if (sh) shots.push(sh);
    }
    /* שלב א2' — הזזת מצביע. חלק מהמשחקים (מחבט, סמן, כוונת) לא מגיבים
       למקשים בכלל, ובלי זה הם היו נראים כאילו השליטה שלהם מתה. */
    {
      const box = await playBox(page);
      if (box) {
        const cx0 = box.x + box.width / 2, cy0 = box.y + box.height / 2;
        const legs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
        for (const [dx, dy] of legs) {
          for (let j = 1; j <= 6; j++) {
            await cap(page.mouse.move(
              cx0 + dx * box.width * 0.07 * j, cy0 + dy * box.height * 0.07 * j), 1200);
            await page.waitForTimeout(110);
            const s2 = await cap(page.evaluate(PROBE), 2000, null);
            if (s2) { s2.ask = { dx, dy }; s2.ptr = true; samples.push(s2); }
            const sh2 = await cap(page.evaluate(SHOT), 2000, null);
            if (sh2) shots.push(sh2);
          }
          await cap(page.mouse.move(cx0, cy0), 1200);
        }
      }
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
        const sh3 = await cap(page.evaluate(SHOT), 2000, null);
        if (sh3) shots.push(sh3);
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
      if (uniq === 1 && shots.length >= 25)
        add('high', 'התמונה קפואה — שום דבר לא זז על המסך',
          String(shots.length) + ' דגימות זהות לאורך כל הבדיקה, כולל אחרי לחיצות');
      else if (flat > shots.length * 0.8) add('high', 'המסך ריק — צבע אחד בלבד', '');
      /* זו בדיקת "חי או מת", לא בדיקת מהירות: כשרצים כמה משחקים במקביל
         על עיבוד תוכנה הקצב צונח, וזו תקלה של הבדיקה ולא של המשחק. */

    } else if (await page.locator('canvas').count()) {
      add('low', 'לא הצלחתי לקרוא את הקנבס', '');
    }

    /* ---- שליטה מתה / יציאה מהמפה / מספרים הרוסים ---- */
    if (samples.length > 6) {
      const last = samples[samples.length - 1];
      /* הסמן עצמו הוא הקלט, לא תגובה לקלט — הוא זז תמיד ולכן היה מסתיר
         בדיוק את המשחקים שבהם אי אפשר לזוז. */
      const CURSOR = /^(mouse|ptr|pointer|cursor|touch|stick|aim|cam|camera|view|scroll|drag)$/i;
      const keys = Object.keys(last.ents).filter(k => !CURSOR.test(k));
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
          /* בכמה משחקים W ו-H הם מספר המשבצות ולא פיקסלים. אם המיקום גדול
             בהרבה מהמפה, היחידות לא תואמות ואין מה להשוות. */
          const far = Math.max(...trail.map(pt => Math.max(Math.abs(pt.x), Math.abs(pt.y))));
          if (far > Math.max(W, H) * 3) continue;
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
      /* רק שיתוק מוחלט נחשב. משחק שמגיב קצת (מחבט בטווח קצר, סמן) הוא
         משחק עובד, ועדיף לפספס באג מאשר לשלוח בוט לתקן משחק תקין. */
      let anyMotion = 0;
      for (const k of keys) {
        const tr = samples.map(s2 => s2.ents[k]).filter(Boolean);
        for (let i = 1; i < tr.length; i++)
          anyMotion += Math.abs(tr[i].x - tr[i-1].x) + Math.abs(tr[i].y - tr[i-1].y);
      }
      if (keys.length && started && bestResponse < 3 && anyMotion < 6)
        add('high', 'אי אפשר לזוז — שום דבר לא הגיב לקלט',
          'נבדקו ' + keys.length + ' משתנים; תזוזה כוללת ' + Math.round(anyMotion) + ' פיקסלים');
    } else if (started && await page.locator('canvas').count()) {
      add('low', 'לא מצאתי מצב משחק לבדוק', '');
    }

    if (!started && await page.locator('canvas').count())
      add('low', 'לא מצאתי כפתור התחלה', '');
    if (playedSamples < 10) {
      const o = await overlay(page);
      found.length = 0;        /* כל מה שנאסף מתייחס לתפריט, לא למשחק */
      add('low', 'לא הצלחתי להיכנס למשחק כדי לבדוק אותו',
        o ? 'נתקעתי על: "' + o.text + '"' + (o.btn ? ' (כפתור: ' + o.btn + ')' : '') : '');
    } else if (deaths > 3) {
      add('low', 'הבוט מת הרבה פעמים', 'נכנס מחדש ' + deaths + ' פעמים');
    }

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
