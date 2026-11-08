/* הגליץ' — the real one (Cloudflare Pages Function).
   (c) 2026 Alon Maidenberg. Please do not copy.

   This runs on Cloudflare's own servers, so the model never touches the page
   and there is no key to steal. It needs one setting in the Cloudflare
   dashboard and nothing else:

     Workers & Pages -> this project -> Settings -> Functions
       -> AI bindings -> Add -> variable name:  AI

   Until that binding exists this answers {ok:false}, and the page quietly
   falls back to the word-matching Glitch in shorts/boss.js. */

const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});

/* whatever this account has, first one that answers wins */
const MODELS = [
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/qwen/qwen2.5-14b-instruct',
  '@cf/meta/llama-3.1-8b-instruct',
  '@cf/mistral/mistral-7b-instruct-v0.2'
];

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

const SYS = `אתה "הגליץ'", דמות ידידותית באתר משחקים של ילדים בעברית.
תפקידך: להפוך משפט חופשי בעברית להגדרה של משחק קצר ("שורט").

המשחקים האפשריים (g):
${Object.entries(GAMES).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

שדות:
g = מזהה משחק מהרשימה.
d = קושי, מספר שלם 1 עד 5.
len = אורך בשניות, מספר שלם 5 עד 40.
th = צבע, מספר 0 עד 5: ${THEMES.map((t, i) => i + '=' + t).join(', ')}.
cap = כיתוב קצר בעברית שיופיע מתחת לשורט, עד 48 תווים, בלי קללות.
sp = מהירות, מספר 0.6 עד 1.6 (1 = רגיל).
sz = גודל העצמים, מספר 0.6 עד 1.6 (1 = רגיל).
say = משפט אחד קצר בעברית שאתה אומר למשתמש. ידידותי, בלי אימוג'י.

כללים:
- החזר אך ורק JSON יחיד, בלי טקסט לפניו או אחריו, בלי סימני קוד.
- כלול רק שדות שהמשתמש באמת ביקש או שנובעים ישירות מדבריו. את השאר השמט.
- תמיד כלול say.
- אם לא הבנת מה המשתמש רוצה, החזר רק say ששואל שאלה קצרה אחת.
- אסור תוכן מיני, אלים קשה, או קללות. אם ביקשו כזה, החזר רק say מנומס שמסרב.`;

function clampNum(v, lo, hi, step1) {
  const n = Number(v);
  if (!isFinite(n)) return undefined;
  const c = Math.min(hi, Math.max(lo, n));
  return step1 ? Math.round(c) : Math.round(c * 100) / 100;
}

/* models like to wrap JSON in prose or fences; dig it out */
function parseSpec(text) {
  let s = String(text || '').trim();
  s = s.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
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
  if (typeof o.cap === 'string') out.cap = o.cap.replace(/[\u0000-\u001f<>&"'`\\]/g, '').trim().slice(0, 48);
  const say = typeof o.say === 'string' ? o.say.replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 220) : '';
  return { set: out, say };
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (!env.AI) return J({ ok: false, reason: 'no-binding' });

  let body;
  try { body = await request.json(); } catch (e) { return J({ ok: false, reason: 'bad-body' }, 400); }

  const msg = String(body && body.msg || '').slice(0, 300).trim();
  if (!msg) return J({ ok: false, reason: 'empty' }, 400);

  /* what the short looks like right now, so the model can change one thing */
  const st = body && body.state || {};
  const now = {
    g: GAMES[st.g] ? st.g : 'jump',
    d: clampNum(st.d, 1, 5, true) ?? 3,
    len: clampNum(st.len, 5, 40, true) ?? 15,
    th: clampNum(st.th, 0, 5, true) ?? 0,
    cap: String(st.cap || '').slice(0, 48)
  };

  const messages = [
    { role: 'system', content: SYS },
    { role: 'user', content: `המצב הנוכחי של השורט: ${JSON.stringify(now)}\nמה שהמשתמש אמר: ${msg}` }
  ];

  let lastErr = '';
  for (const model of MODELS) {
    try {
      const r = await env.AI.run(model, { messages, max_tokens: 300, temperature: 0.4 });
      const spec = parseSpec(r && (r.response ?? r.result ?? r.text ?? ''));
      if (spec && (spec.say || Object.keys(spec.set).length)) {
        return J({ ok: true, model, set: spec.set, say: spec.say });
      }
      lastErr = 'unparsable';
    } catch (e) {
      lastErr = String(e && e.message || e).slice(0, 120);
    }
  }
  return J({ ok: false, reason: lastErr || 'no-model' });
}

export async function onRequestGet(context) {
  return J({ ok: !!context.env.AI, hint: context.env.AI ? 'ready' : 'add an AI binding named AI' });
}
