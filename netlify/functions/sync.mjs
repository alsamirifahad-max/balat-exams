// مزامنة أقسام النظام (الإسناد / الاختبارات) بين الأجهزة — محمية بالرمز ومحدودة المحاولات
import { getStore } from '@netlify/blobs';
import { createHash } from 'node:crypto';

const SECS = ['ta', 'ex'];
const MAX_FAILS = 8, WINDOW = 15 * 60 * 1000;
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const sha = s => createHash('sha256').update(s).digest('hex');

export async function handle(req, ip, store, env) {
  const url = new URL(req.url);
  if (url.searchParams.has('ping')) return json({ ok: true, ready: !!(env.SYNC_SALT && env.SYNC_HASH) });
  if (!env.SYNC_SALT || !env.SYNC_HASH) return json({ error: 'not-configured' }, 503);

  // تحديد المحاولات الخاطئة لكل عنوان IP وعلى مستوى الموقع
  const rk = 'rl/' + String(ip || 'x').replace(/[^0-9a-zA-Z.:]/g, '_');
  const now = Date.now();
  const rl = (await store.get(rk, { type: 'json' })) || { n: 0, t: now };
  if (now - rl.t > WINDOW) { rl.n = 0; rl.t = now; }
  const g = (await store.get('rl/_all', { type: 'json' })) || { n: 0, t: now };
  if (now - g.t > WINDOW) { g.n = 0; g.t = now; }
  if (rl.n >= MAX_FAILS || g.n >= 60) return json({ error: 'locked', retry: Math.ceil((WINDOW - (now - rl.t)) / 60000) }, 429);

  const code = (req.headers.get('x-code') || '').trim();
  if (!code || sha(env.SYNC_SALT + '|' + code) !== env.SYNC_HASH) {
    rl.n++; g.n++; await store.setJSON(rk, rl); await store.setJSON('rl/_all', g);
    return json({ error: 'auth', left: Math.max(0, MAX_FAILS - rl.n) }, 401);
  }
  if (rl.n) await store.delete(rk);

  const by = (req.headers.get('x-by') || '').replace(/[^a-z-]/g, '').slice(0, 12);
  const enc = req.headers.get('x-enc') === 'json' ? 'json' : 'gzip';
  if (req.method === 'POST' && url.searchParams.has('check')) return json({ ok: true });
  if (req.method === 'GET' && url.searchParams.has('meta')) {
    const out = {}; for (const s of SECS) out[s] = (await store.get('meta/' + s, { type: 'json' })) || null;
    return json(out);
  }
  const sec = url.searchParams.get('sec');
  if (!SECS.includes(sec)) return json({ error: 'sec' }, 400);
  if (req.method === 'GET') {
    const meta = await store.get('meta/' + sec, { type: 'json' });
    const data = await store.get('data/' + sec, { type: 'arrayBuffer' });
    if (!data || !meta) return json({ none: true });
    return new Response(data, { headers: { 'content-type': 'application/octet-stream', 'x-at': meta.at, 'x-by': meta.by || '', 'x-enc': meta.enc || 'gzip', 'cache-control': 'no-store' } });
  }
  if (req.method === 'PUT') {
    const base = req.headers.get('x-base') || '';
    const cur = await store.get('meta/' + sec, { type: 'json' });
    if (cur && base !== cur.at && req.headers.get('x-force') !== '1') return json({ error: 'conflict', meta: cur }, 409);
    const body = await req.arrayBuffer();
    if (!body.byteLength || body.byteLength > 5.5 * 1024 * 1024) return json({ error: 'size' }, 413);
    const at = new Date().toISOString();
    // نسخة احتياطية من الإصدار السابق قبل الكتابة
    if (cur) { const prev = await store.get('data/' + sec, { type: 'arrayBuffer' }); if (prev) await store.set('prev/' + sec, prev, { metadata: cur }); }
    await store.set('data/' + sec, body);
    const meta = { at, by, enc, size: body.byteLength };
    await store.setJSON('meta/' + sec, meta);
    return json(meta);
  }
  return json({ error: 'method' }, 405);
}

export default async (req, context) => {
  const store = getStore({ name: 'balat-exams-sync', consistency: 'strong' });
  return handle(req, context.ip, store, { SYNC_SALT: Netlify.env.get('SYNC_SALT'), SYNC_HASH: Netlify.env.get('SYNC_HASH') });
};
export const config = { path: '/api/sync' };
