/* Player accounts for Alon's games (Cloudflare Pages Function).
   Each player gets a random secret code. Only a hash of the code is stored, so the
   storage never contains anyone's code. Uses the same KV namespace as the leaderboard
   (variable name SCORES), keys "acct:<hash>".
   (c) Alon Maidenberg 2026 - please do not copy. */
const ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O, 1/I/L - easy to copy from paper
const MAX = 120000;            // bytes of saved progress per player
const TRIES = 25;              // wrong codes allowed per address per 10 minutes
const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ag-acct|' + s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function newCode() {
  const r = crypto.getRandomValues(new Uint8Array(8));
  let c = '';
  for (let i = 0; i < 8; i++) c += ABC[r[i] % ABC.length];
  return c.slice(0, 4) + '-' + c.slice(4);
}
function norm(c) {
  c = String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/0/g, 'O').replace(/[1IL]/g, 'I');
  return c.length === 8 ? c.slice(0, 4) + '-' + c.slice(4) : '';
}
function cleanData(d) {
  if (!d || typeof d !== 'object' || Array.isArray(d)) return null;
  const o = {};
  let n = 0;
  for (const k of Object.keys(d)) {
    if (++n > 400) break;
    if (typeof k !== 'string' || k.length > 60 || typeof d[k] !== 'string') continue;
    o[k] = d[k];
  }
  return JSON.stringify(o).length <= MAX ? o : null;
}
async function limited(env, ip) {
  const k = 'rl:' + ip + ':' + Math.floor(Date.now() / 600000);
  const n = +(await env.SCORES.get(k)) || 0;
  return { over: n >= TRIES, bump: () => env.SCORES.put(k, String(n + 1), { expirationTtl: 900 }) };
}
export async function onRequest({ request, env }) {
  if (!env.SCORES) return J({ error: 'not-configured' }, 503);
  if (request.method !== 'POST') return J({ error: 'method' }, 405);
  let b;
  try { b = await request.json(); } catch (e) { return J({ error: 'json' }, 400); }
  const ip = request.headers.get('cf-connecting-ip') || 'x';

  if (b.action === 'create') {
    const data = cleanData(b.data) || {};
    let code, key;
    for (let i = 0; i < 5; i++) {
      code = newCode(); key = 'acct:' + await sha(code);
      if (!(await env.SCORES.get(key))) break;
    }
    const rec = { v: 1, t: Date.now(), d: data };
    await env.SCORES.put(key, JSON.stringify(rec));
    return J({ ok: true, code, v: rec.v, t: rec.t });
  }

  const code = norm(b.code);
  if (!code) return J({ error: 'code' }, 400);
  const rl = await limited(env, ip);
  if (rl.over) return J({ error: 'slow' }, 429);
  const key = 'acct:' + await sha(code);
  const rec = await env.SCORES.get(key, 'json');
  if (!rec) { await rl.bump(); return J({ error: 'nouser' }, 404); }

  if (b.action === 'load') return J({ ok: true, code, v: rec.v, t: rec.t, d: rec.d });
  if (b.action === 'peek') return J({ ok: true, v: rec.v, t: rec.t });
  if (b.action === 'save') {
    const data = cleanData(b.data);
    if (!data) return J({ error: 'big' }, 413);
    // another device saved in between: tell the caller so it can take the newer copy
    if (b.base !== undefined && +b.base < rec.v && !b.force) return J({ error: 'newer', v: rec.v, t: rec.t, d: rec.d }, 409);
    const nrec = { v: rec.v + 1, t: Date.now(), d: data };
    await env.SCORES.put(key, JSON.stringify(nrec));
    return J({ ok: true, v: nrec.v, t: nrec.t });
  }
  return J({ error: 'action' }, 400);
}
