/* Shared leaderboard for Alon's games (Cloudflare Pages Function).
   Needs a KV namespace bound to this project with the variable name SCORES.
   (c) Alon Maidenberg 2026 - please do not copy. */
const ADMIN_HASH = 'a28e690a3b6d041970a632d16ad8d54a2ae463d1319f7990a490a5ffd8431884';
const TOP = 30;
const BAD = /(fuck|shit|bitch|cunt|dick|porn|nazi|hitler|rape|sex|nigg|http|www|\.com|זונה|שרמוט|כוס|זין|מניאק|הומו|נאצי|היטלר|אנס|סקס)/i;
const J = (o, s = 200) => new Response(JSON.stringify(o), {
  status: s,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }
});
async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
}
function cleanName(n) {
  n = String(n || '').replace(/[\u0000-\u001f<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 14);
  return n.length >= 2 && !BAD.test(n.replace(/[\s._-]/g, '')) ? n : '';
}
async function load(env) {
  try { return (await env.SCORES.get('board', 'json')) || { g: {}, banned: [] }; }
  catch (e) { return { g: {}, banned: [] }; }
}
export async function onRequest({ request, env }) {
  if (!env.SCORES) return J({ error: 'not-configured' }, 503);
  if (request.method === 'GET') {
    const b = await load(env);
    return J({ g: b.g });
  }
  if (request.method !== 'POST') return J({ error: 'method' }, 405);
  let body;
  try { body = await request.json(); } catch (e) { return J({ error: 'json' }, 400); }
  const b = await load(env);
  b.banned = b.banned || [];

  if (body.action === 'delete') {
    if (await sha('alon-games|' + String(body.code || '').trim().toUpperCase()) !== ADMIN_HASH) return J({ error: 'auth' }, 403);
    const name = String(body.name || '').toLowerCase();
    for (const id in b.g) b.g[id] = b.g[id].filter(e => e.n.toLowerCase() !== name);
    if (body.ban && name && !b.banned.includes(name)) b.banned.push(name);
    await env.SCORES.put('board', JSON.stringify(b));
    return J({ ok: true, g: b.g });
  }

  const name = cleanName(body.name);
  if (!name) return J({ error: 'name' }, 400);
  if (b.banned.includes(name.toLowerCase())) return J({ error: 'banned' }, 403);
  const sc = body.scores && typeof body.scores === 'object' ? body.scores : {};
  let changed = 0, n = 0;
  for (const id of Object.keys(sc)) {
    if (++n > 80) break;
    if (!/^[a-z0-9]{2,20}$/.test(id)) continue;
    const v = Math.floor(+sc[id]);
    if (!isFinite(v) || v <= 0 || v > 1e9) continue;
    const arr = b.g[id] || (b.g[id] = []);
    const mine = arr.find(e => e.n.toLowerCase() === name.toLowerCase());
    if (mine) { if (v > mine.s) { mine.s = v; mine.n = name; changed++; } }
    else { arr.push({ n: name, s: v }); changed++; }
    arr.sort((x, y) => y.s - x.s);
    if (arr.length > TOP) arr.length = TOP;
  }
  if (changed) await env.SCORES.put('board', JSON.stringify(b));
  return J({ ok: true, changed, g: b.g });
}
