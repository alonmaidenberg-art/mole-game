/* הגליץ' — Claude himself, running on the server.
   (c) 2026 Alon Maidenberg. Please do not copy.

   This is a Netlify Function, which is what this site actually runs on. It
   talks to Anthropic's API, so the key never reaches the page and nobody can
   read it out of the site. It needs one secret, set once:

     app.netlify.com -> alon-games -> Site configuration
       -> Environment variables -> Add
          key:   ANTHROPIC_API_KEY
          value: the key from console.anthropic.com
          (mark it "secret")

   Without that key this answers {ok:false} and the page quietly falls back to
   the word-matching Glitch in shorts/boss.js. Nothing breaks either way. */

const J = (o, s = 200) => ({
  statusCode: s,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  body: JSON.stringify(o)
});

/* cheapest first; if the account cannot use one, the next is tried */
const MODELS = ['claude-haiku-5-5', 'claude-sonnet-5-5'];

const GAMES = {
  jump: 'קפיצה מעל מכשולים',
  flap: 'ציפור שעפה בין שערים',
  stop: 'לעצור מחוג בתוך אזור ירוק',
  dodge: 'להתחמק ממטאורים נופלים',
  ring: 'ללחוץ כשעיגול מתכווץ לגודל הנכון',
  taps: 'ללחוץ כמה שיותר מהר',
  pop: 'לפוצץ בלונים',
  memo: 'לזכור ולחזור על סדר'
};
const THEMES = ['סגול', 'ים', 'שקיעה', 'לילה', 'ורוד', 'ירוק'];

const SYS = `את/ה "הגליץ'", דמות באתר משחקים של ילדים בעברית. הילד מדבר איתך ואת/ה בונה לו משחק קצר ("שורט").

המשחקים שאפשר לבנות (g):
${Object.entries(GAMES).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

שדות אפשריים:
g = מזהה משחק מהרשימה.
d = קושי, מספר שלם 1 עד 5.
len = אורך בשניות, מספר שלם 5 עד 40.
th = צבע, מספר 0 עד 5: ${THEMES.map((t, i) => i + '=' + t).join(', ')}.
sp = מהירות, 0.6 עד 1.6 (1 = רגיל).
sz = גודל העצמים, 0.6 עד 1.6 (1 = רגיל).
cap = כיתוב קצר בעברית מתחת לשורט, עד 48 תווים.
say = משפט אחד קצר וידידותי בעברית שאת/ה אומר/ת לילד.

כללים:
- החזר/י אך ורק אובייקט JSON יחיד, בלי טקסט מסביב ובלי סימני קוד.
- כלול/י רק שדות שהילד ביקש או שנובעים ישירות מדבריו. את השאר השמט/י.
- תמיד כלול/י say.
- אם לא הבנת, החזר/י רק say עם שאלה קצרה אחת.
- הקהל הוא ילדים: בלי תוכן מיני, בלי אלימות קשה ובלי קללות. אם ביקשו כאלה,
  החזר/י רק say שמסרב בנימוס ומציע משהו אחר.`;

function clampNum(v, lo, hi, whole) {
  const n = Number(v);
  if (!isFinite(n)) return undefined;
  const c = Math.min(hi, Math.max(lo, n));
  return whole ? Math.round(c) : Math.round(c * 100) / 100;
}

/* models like to wrap JSON in prose or fences; dig it out */
function parseSpec(text) {
  let s = String(text || '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b <= a) return null;
  let o;
  try { o = JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
  if (!o || typeof o !== 'object') return null;
  const out = {};
  if (typeof o.g === 'string' && GAMES[o.g]) out.g = o.g;
  const d = clampNum(o.d, 1, 5, true); if (d !== undefined) out.d = d;
  const len = clampNum(o.len, 5, 40, true); if (len !== undefined) out.len = len;
  const th = clampNum(o.th, 0, 5, true); if (th !== undefined) out.th = th;
  const sp = clampNum(o.sp, 0.6, 1.6); if (sp !== undefined) out.sp = sp;
  const sz = clampNum(o.sz, 0.6, 1.6); if (sz !== undefined) out.sz = sz;
  if (typeof o.cap === 'string')
    out.cap = o.cap.replace(/[\u0000-\u001f<>&"'`\\]/g, '').trim().slice(0, 48);
  const say = typeof o.say === 'string'
    ? o.say.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 220) : '';
  return { set: out, say };
}

async function ask(key, model, msg, now) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: 400,
      system: SYS,
      messages: [{
        role: 'user',
        content: `המצב הנוכחי של השורט: ${JSON.stringify(now)}\nמה שהילד אמר: ${msg}`
      }]
    })
  });
  if (!r.ok) throw new Error(model + ' ' + r.status);
  const j = await r.json();
  const text = (j && Array.isArray(j.content))
    ? j.content.filter(c => c.type === 'text').map(c => c.text).join('') : '';
  return parseSpec(text);
}

export async function handler(event) {
  const key = process.env.ANTHROPIC_API_KEY;

  if (event.httpMethod === 'GET') return J({ ok: !!key, hint: key ? 'ready' : 'set ANTHROPIC_API_KEY' });
  if (event.httpMethod !== 'POST') return J({ ok: false, reason: 'method' }, 405);
  if (!key) return J({ ok: false, reason: 'no-key' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return J({ ok: false, reason: 'bad-body' }, 400); }

  const msg = String(body.msg || '').slice(0, 300).trim();
  if (!msg) return J({ ok: false, reason: 'empty' }, 400);

  const st = body.state || {};
  const now = {
    g: GAMES[st.g] ? st.g : 'jump',
    d: clampNum(st.d, 1, 5, true) ?? 3,
    len: clampNum(st.len, 5, 40, true) ?? 15,
    th: clampNum(st.th, 0, 5, true) ?? 0,
    cap: String(st.cap || '').slice(0, 48)
  };

  let lastErr = '';
  for (const model of MODELS) {
    try {
      const spec = await ask(key, model, msg, now);
      if (spec && (spec.say || Object.keys(spec.set).length))
        return J({ ok: true, model, set: spec.set, say: spec.say });
      lastErr = 'unparsable';
    } catch (e) {
      lastErr = String(e && e.message || e).slice(0, 120);
    }
  }
  return J({ ok: false, reason: lastErr || 'no-model' });
}
