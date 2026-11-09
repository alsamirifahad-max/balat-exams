/* ===================== أدوات عامة ===================== */
const CODE_HASH = '336938924d45a1c0ef5cd782a3662efa90c60c5f02ef6a27f2fcbb66cec5b1ee';
const LS_KEY = 'balat-exams-v1';
const G = [1, 2, 3];
const GNAME = { 1: 'الصف الأول ثانوي', 2: 'الصف الثاني ثانوي', 3: 'الصف الثالث ثانوي' };
const GSHORT = { 1: 'أول', 2: 'ثاني', 3: 'ثالث' };
const GCOL = { 1: '#e2efda', 2: '#fff2cc', 3: '#fce4d6' };
const HCOL = '#d9e2f3', LCOL = '#eef1f5', EMPTY = '#b4c6e7';
const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = v => String(v == null ? '' : v).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const toWestern = s => String(s == null ? '' : s).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));

let S; // الحالة
function load() {
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (e) { saved = null; }
  S = saved && saved.v ? deepMerge(clone(DEFAULT_STATE), saved) : clone(DEFAULT_STATE);
  normState();
}
function normState() {
  S.days.forEach(fixDay);
  if (!S.m2) { if (S.s.footColor === 'green') S.s.footColor = 'doc'; S.m2 = true; }
  S.guide = S.guide || []; S.uploads = S.uploads || {}; S.obsN = S.obsN || {};
  if (!S.s.semV1) { S.s.sem = 'الأول'; S.s.semV1 = true; } /* الفصل الدراسي الأول */
  if (S.s.gs && !S.s.gs.sepV1) { S.s.gs.include = false; S.s.gs.sepV1 = true; } /* البيان مستقل عن خطاب التكليف */
  if (!S.taMeta && typeof SET_DEF !== 'undefined') S.taMeta = { n: SET_DEF[ACTIVE].n, d: SET_DEF[ACTIVE].d };
  (S.ta || []).forEach(x => x.sub = spaceNum(x.sub));
  Object.keys(S.obs || {}).forEach(k => { if (!Array.isArray(S.obs[k])) S.obs[k] = S.obs[k] ? [S.obs[k]] : []; });
}
function deepMerge(base, over) {
  for (const k in over) {
    if (over[k] && typeof over[k] === 'object' && !Array.isArray(over[k]) && base[k] && typeof base[k] === 'object' && !Array.isArray(base[k])) deepMerge(base[k], over[k]);
    else base[k] = over[k];
  }
  return base;
}
let saveT;
function save(now) {
  window.__thumbs = {};
  clearTimeout(saveT);
  const f = () => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(S)); setSaved(true); }
    catch (e) { setSaved(false); }
    syncSoon();
  };
  if (now) f(); else saveT = setTimeout(f, 350);
}
function setSaved(ok) { LOCAL_OK = ok; syncBadge(); }
let LOCAL_OK = true;
function toast(msg, bad) {
  const t = $('#toast'); t.textContent = msg; t.className = 'toast show' + (bad ? ' bad' : '');
  clearTimeout(t._t); t._t = setTimeout(() => t.className = 'toast', 3200);
}

/* ===================== التاريخ الهجري / الميلادي ===================== */
const HFMT = new Intl.DateTimeFormat('en-US-u-ca-islamic-umalqura', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' });
function isoToDate(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d, 12)); }
function dateToIso(dt) { return dt.toISOString().slice(0, 10); }
function toHijri(iso) {
  const p = {}; HFMT.formatToParts(isoToDate(iso)).forEach(x => { if (x.type !== 'literal') p[x.type] = parseInt(x.value, 10); });
  return [p.year, p.month, p.day];
}
function hijriToIso(y, m, d) {
  y = +y; m = +m; d = +d; if (!y || !m || !d) return null;
  const jd = d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948439.5 - 1;
  const base = new Date(Math.round((jd - 2440587.5) * 86400000) + 12 * 3600000);
  for (let off = 0; off <= 4; off++) for (const sg of [1, -1]) {
    const dt = new Date(base.getTime() + sg * off * 86400000);
    const iso = dateToIso(dt); const h = toHijri(iso);
    if (h[0] === y && h[1] === m && h[2] === d) return iso;
  }
  return null;
}
function fixDay(day) {
  if (!day.g && day.h) day.g = hijriToIso(day.h[0], day.h[1], day.h[2]) || dateToIso(new Date());
  if (!day.g) day.g = dateToIso(new Date());
  day.h = toHijri(day.g);
  if (!day.p) day.p = [];
}
function dayName(day) { return DAYS_AR[isoToDate(day.g).getUTCDay()]; }
function hTxt(day) { const h = toHijri(day.g); return `${h[2]} / ${h[1]} / ${h[0]} هـ`; }
function gTxt(day) { const d = isoToDate(day.g); return `${d.getUTCDate()} / ${d.getUTCMonth() + 1} / ${d.getUTCFullYear()} م`; }
function dateTxt(day, sep = '<br>') {
  if (day.txt && day.txt.trim()) return esc(day.txt);
  const m = S.s.dateMode;
  if (m === 'g') return gTxt(day);
  if (m === 'both') return hTxt(day) + sep + gTxt(day);
  return hTxt(day);
}
function dateShort(day) {
  if (day.txt && day.txt.trim()) return esc(day.txt);
  if (S.s.dateMode === 'g') { const d = isoToDate(day.g); return `${d.getUTCDate()}/${d.getUTCMonth() + 1}`; }
  const h = toHijri(day.g); return `${h[2]}/${h[1]}`;
}

/* ===================== حسابات مشتركة ===================== */
function sessions() {
  const out = [];
  S.days.forEach((d, di) => d.p.forEach((p, pi) => out.push({ di, pi, day: d, per: p, key: di + '_' + pi })));
  return out;
}
function stuTotals() {
  const t = { 1: 0, 2: 0, 3: 0 };
  S.students.forEach(x => { if (t[x.g] != null) t[x.g]++; });
  return t;
}
function gradeTotals() {
  if (S.students.length) return stuTotals();
  return { 1: +S.s.manualTot[1] || 0, 2: +S.s.manualTot[2] || 0, 3: +S.s.manualTot[3] || 0 };
}
function comTotals() {
  const t = { 1: 0, 2: 0, 3: 0, all: 0 };
  S.com.forEach(c => G.forEach(g => { t[g] += +c.c[g] || 0; t.all += +c.c[g] || 0; }));
  return t;
}
function comSum(c) { return G.reduce((a, g) => a + (+c.c[g] || 0), 0); }
function comPlace(c) { return [c.fl, c.rm && c.rm !== c.fl ? (/^\d+$/.test(c.rm) ? 'ش ' + c.rm : c.rm) : ''].filter(Boolean).join(' – '); }
function teacherOf(sub, g) {
  const r = S.st.find(x => x.sub.trim() === String(sub).trim() && (+x.g === +g || !g));
  return r ? r.t : '';
}
function sessionSubjects(se) { return G.filter(g => (se.per.s[g] || '').trim()).map(g => ({ g, sub: se.per.s[g].trim() })); }
function yearLine() { return `العام الدراسي ${esc(S.s.yearTxt)} – الفصل الدراسي ${esc(S.s.sem)} – الدور ${esc(S.s.round)}`; }
function normName(s) {
  return toWestern(s).replace(/[\u064B-\u0652\u0640]/g, '').replace(/[أإآٱ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/ئ/g, 'ي')
    .replace(/عبد\s+/g, 'عبد').replace(/\s+(بن|ابن)\s+/g, ' ').replace(/^(ال)\s+/, '').replace(/\s+/g, ' ').trim();
}
function fmtPhone(p) {
  p = toWestern(p).replace(/\D/g, ''); if (!p) return '';
  let local = p;
  if (p.startsWith('966')) local = '0' + p.slice(3);
  else if (p.length === 9 && p.startsWith('5')) local = '0' + p;
  if (S.s.phoneFmt === '966') return local.startsWith('0') ? '966' + local.slice(1) : p;
  return local;
}
function secLabel(x) { return x.sec; }

/* ===================== الكليشة والتذييل (رسم بالكانفاس) ===================== */
let HDR = '', FTR = '', ARROW = { right: '', left: '' };
const FTR_H = 104;
const LOGO = new Image(); LOGO.src = 'data:image/png;base64,__LOGO__';
const FOOT_COLORS = {
  doc: ['#5d9bce', '#5bbb8f'],
  green: ['#0f6b45', '#22a06b'],
  ministry: ['#2b7fc3', '#3fb36e'],
  crimson: ['#7a0f2a', '#b3193f'],
  greencrimson: ['#13804f', '#9e1538']
};
function rr(ctx, x, y, w, h, r) {
  const t = r.tl || 0, tr = r.tr || 0, br = r.br || 0, bl = r.bl || 0;
  ctx.beginPath(); ctx.moveTo(x + t, y); ctx.lineTo(x + w - tr, y); ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br); ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h); ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl); ctx.lineTo(x, y + t); ctx.quadraticCurveTo(x, y, x + t, y); ctx.closePath();
}
function fitText(ctx, txt, maxW, size, weight) {
  let s = size; ctx.font = `${weight} ${s}px Tajawal, Arial, sans-serif`;
  while (ctx.measureText(txt).width > maxW && s > 12) { s -= 1; ctx.font = `${weight} ${s}px Tajawal, Arial, sans-serif`; }
}
async function drawBrand() {
  try { await Promise.all([document.fonts.load('700 30px Tajawal'), document.fonts.load('800 30px Tajawal')]); } catch (e) { }
  if (!LOGO.complete) await new Promise(r => { LOGO.onload = r; LOGO.onerror = r; });
  const W = 1700, H = 215, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.direction = 'rtl';
  const navy = '#0b3a46';
  const gr = x.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, '#2b7fc3'); gr.addColorStop(1, '#3fb36e');
  // الشريط العلوي
  x.fillStyle = gr; rr(x, 0, 0, W, 30, { tl: 0, tr: 0 }); x.fill();
  // الجسم
  x.fillStyle = navy; rr(x, 0, 12, W, 150, { bl: 46, br: 46 }); x.fill();
  x.strokeStyle = gr; x.lineWidth = 3; rr(x, 1.5, 12, W - 3, 150, { bl: 46, br: 46 }); x.stroke();
  // اللسان الأوسط
  const tx = 470, tw = 760;
  x.fillStyle = navy; rr(x, tx, 132, tw, 76, { bl: 20, br: 20 }); x.fill();
  x.strokeStyle = gr; x.lineWidth = 3; rr(x, tx, 132, tw, 76, { bl: 20, br: 20 }); x.stroke();
  x.fillStyle = navy; x.fillRect(tx + 2, 128, tw - 4, 10);
  x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
  fitText(x, S.s.school, tw - 40, 38, 800); x.fillText(S.s.school, tx + tw / 2, 174);
  // الشعار
  const lh = 92, lw = LOGO.naturalWidth ? lh * LOGO.naturalWidth / LOGO.naturalHeight : 180;
  const lx = W / 2 - lw / 2, ly = 26;
  try { x.drawImage(LOGO, lx, ly, lw, lh); } catch (e) { }
  x.fillStyle = '#22a06b'; x.fillRect(lx + lw + 14, ly + 6, 4, lh - 12);
  // النص الأيمن
  x.fillStyle = '#fff';
  const right = [S.s.l1, S.s.l2, S.s.l3, S.s.l4].filter(v => v && v.trim());
  const rsz = right.length > 3 ? 25 : 29, rlh = right.length > 3 ? 29 : 36;
  x.textAlign = 'center';
  const rcx = 1390;
  right.forEach((t, i) => { fitText(x, t, 470, rsz, 700); x.fillText(t, rcx, 46 + i * rlh + (right.length > 3 ? -4 : 0)); });
  // النص الأيسر
  const left = ['العام الدراسي ' + S.s.yearTxt, 'الفصل الدراسي ' + S.s.sem, 'الدور ' + S.s.round];
  left.forEach((t, i) => { fitText(x, t, 380, 28, 700); x.fillText(t, 260, 50 + i * 36); });
  HDR = c.toDataURL('image/png');
  // التذييل (بتصميم الملف المرفق: خط رفيع منحني + شريط متدرج بزاوية دائرية)
  const FW = 1700, FH = FTR_H, F = document.createElement('canvas'); F.width = FW; F.height = FH; const f = F.getContext('2d'); f.direction = 'rtl';
  const cols = FOOT_COLORS[S.s.footColor] || FOOT_COLORS.doc;
  const fg = f.createLinearGradient(0, 0, FW, 0); fg.addColorStop(0, cols[0]); fg.addColorStop(1, cols[1]);
  f.strokeStyle = fg; f.lineWidth = 3; f.beginPath(); f.moveTo(2, 10); f.lineTo(FW - 120, 10); f.quadraticCurveTo(FW - 70, 10, FW - 62, 38); f.stroke();
  f.fillStyle = fg; f.beginPath(); f.moveTo(0, 40); f.lineTo(FW - 60, 40); f.quadraticCurveTo(FW, 40, FW, 80); f.lineTo(FW, FH - 2); f.lineTo(0, FH - 2); f.closePath(); f.fill();
  f.fillStyle = '#fff'; f.textAlign = 'center'; f.textBaseline = 'middle';
  f.shadowColor = 'rgba(0,0,0,.18)'; f.shadowBlur = 3; f.shadowOffsetY = 1;
  const ft = (S.s.footTxt && S.s.footTxt.trim()) || ('العام الدراسي ' + S.s.yearTxt);
  fitText(f, ft, 1400, 32, 700); f.fillText(ft, FW / 2, 70);
  FTR = F.toDataURL('image/png');
  ARROW = { right: drawArrow(false), left: drawArrow(true) };
  $$('.brand-hdr').forEach(i => i.src = HDR); $$('.brand-ftr').forEach(i => i.src = FTR);
}
/* سهم باب الفصل: ينزل من الباب ثم ينعطف داخل القاعة نحو المسارات */
function drawArrow(mirror) {
  const W = 120, Hh = 170, c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d');
  if (mirror) { x.translate(W, 0); x.scale(-1, 1); }
  const g = x.createLinearGradient(0, 0, W, Hh); g.addColorStop(0, '#5b8fd8'); g.addColorStop(1, '#2f5fae');
  x.lineCap = 'round'; x.lineJoin = 'round';
  const path = () => { x.beginPath(); x.moveTo(84, 10); x.lineTo(84, 92); x.quadraticCurveTo(84, 128, 50, 128); };
  x.strokeStyle = '#1f4687'; x.lineWidth = 26; path(); x.stroke();
  x.strokeStyle = g; x.lineWidth = 20; path(); x.stroke();
  x.beginPath(); x.moveTo(52, 98); x.lineTo(8, 128); x.lineTo(52, 158); x.closePath();
  x.fillStyle = g; x.fill(); x.strokeStyle = '#1f4687'; x.lineWidth = 3; x.stroke();
  return c.toDataURL('image/png');
}
let brandT; function brandSoon() { clearTimeout(brandT); brandT = setTimeout(drawBrand, 300); }

/* ===================== بناء الجداول للنماذج ===================== */
function cell(c, tag) {
  if (c == null) c = '';
  if (typeof c !== 'object') return `<${tag}>${c}</${tag}>`;
  const a = [];
  if (c.cs > 1) a.push(`colspan="${c.cs}"`); if (c.rs > 1) a.push(`rowspan="${c.rs}"`);
  const st = []; if (c.bg) st.push('background:' + c.bg); if (c.w) st.push('width:' + c.w); if (c.b) st.push('font-weight:bold');
  if (c.fs) st.push('font-size:' + c.fs); if (c.al) st.push('text-align:' + c.al); if (c.color) st.push('color:' + c.color); if (c.h) st.push('height:' + c.h);
  if (c.st) st.push(c.st);
  if (st.length) a.push(`style="${st.join(';')}"`);
  return `<${c.th ? 'th' : tag} ${a.join(' ')}>${c.v == null ? '' : c.v}</${c.th ? 'th' : tag}>`;
}
function T(rows, o = {}) {
  const cls = 't' + (o.cls ? ' ' + o.cls : '');
  return `<table class="${cls}" dir="rtl" border="1" cellspacing="0" cellpadding="3" width="100%"${o.st ? ` style="${o.st}"` : ''}>` +
    rows.map(r => r == null ? '' : `<tr${r.cls ? ` class="${r.cls}"` : ''}>${r.map(c => cell(c, 'td')).join('')}</tr>`).join('') + '</table>';
}
const H = (v, x = {}) => Object.assign({ v, bg: HCOL, b: true }, x);
const L = (v, x = {}) => Object.assign({ v, bg: LCOL, b: true }, x);
const Gc = (g, v, x = {}) => Object.assign({ v, bg: GCOL[g] }, x);
function title(t, sub) { return `<p class="dt">${t}</p>` + (sub ? `<p class="ds">${sub}</p>` : ''); }
function sp(h = 6) { return `<p class="sp" style="height:${h}px;margin:0;font-size:2px">&nbsp;</p>`; }
function sigs(list) {
  return `<table class="sg" dir="rtl" border="0" cellspacing="0" cellpadding="4" width="100%"><tr>` +
    list.map(x => `<td style="text-align:center;vertical-align:top"><b>${esc(x[0])}</b><br>${x[1] ? esc(x[1]) : '&nbsp;'}<br><span class="sline">التوقيع: ....................</span></td>`).join('') + `</tr></table>`;
}
function dots(n = 40) { return '.'.repeat(n); }

/* ===================== جدول الاختبارات ===================== */
function scheduleTable(o = {}) {
  const head1 = [H('أيام الأسبوع', { w: '15%', rs: 2 }), H('الفترة', { w: '12%', rs: 2 })];
  G.forEach(g => head1.push({ v: `${GNAME[g]}${S.s.gsub[g] ? `<br><span style="font-size:8pt;color:#1f3864">${esc(S.s.gsub[g])}</span>` : ''}`, bg: GCOL[g], b: true }));
  const head2 = G.map(g => H('المادة', { fs: '9pt' }));
  const rows = [head1, head2];
  S.days.forEach(d => {
    d.p.forEach((p, pi) => {
      const r = [];
      if (pi === 0) r.push({ v: `<b>${dayName(d)}</b><br><span style="color:#c00000;font-weight:bold">${dateTxt(d)}</span>`, rs: d.p.length, bg: LCOL });
      r.push({ v: `<b>${esc(p.n)}</b><br><span style="font-size:9pt">${esc(p.t)}</span>`, bg: '#f7f9fc' });
      G.forEach(g => { const s = (p.s[g] || '').trim(); r.push(s ? Gc(g, `<b style="font-size:${o.big ? '13pt' : '11pt'}">${esc(s)}</b>`) : { v: '', bg: EMPTY }); });
      rows.push(r);
    });
  });
  return T(rows, { cls: 'sched' });
}
function countsMini(c) {
  const rows = [[H('الصف'), H('العدد')]];
  G.forEach(g => rows.push([Gc(g, `<b>${GSHORT[g]}</b>`), Gc(g, `<b>${+c.c[g] || 0}</b>`)]));
  rows.push([L('مجموع الطلاب'), L(comSum(c))]);
  return T(rows, { cls: 'mini' });
}

/* ===================== توزيع الطلاب على اللجان ===================== */
function sortStudents(list) {
  const by = S.s.stuSort;
  return list.slice().sort((a, b) => {
    if (by === 'section' && a.sec !== b.sec) return a.sec - b.sec;
    return a.n.localeCompare(b.n, 'ar');
  });
}
function distributeStudents() {
  const tot = stuTotals(), ct = comTotals();
  const bad = G.filter(g => tot[g] !== ct[g]);
  if (bad.length) return { ok: false, msg: 'أعداد اللجان لا تساوي أعداد الطلاب في: ' + bad.map(g => GSHORT[g] + ` (اللجان ${ct[g]} / الطلاب ${tot[g]})`).join('، ') + '. اضغط «توزيع الأعداد تلقائياً» أولاً أو عدّل الأعداد.' };
  G.forEach(g => {
    const list = sortStudents(S.students.filter(x => x.g === g));
    let i = 0, seat = +S.s.seatStart[g] || g * 1000 + 1;
    S.com.forEach(c => { for (let k = 0; k < (+c.c[g] || 0); k++) { const st = list[i++]; st.com = c.no; st.seat = seat++; } });
  });
  S.distributed = true; save(true);
  return { ok: true };
}
function autoCounts() {
  const tot = gradeTotals();
  const caps = S.com.map(c => Math.max(0, +c.cap || comSum(c) || 1));
  const C = caps.reduce((a, b) => a + b, 0) || 1;
  G.forEach(g => {
    const exact = caps.map(cp => tot[g] * cp / C);
    const fl = exact.map(Math.floor); let rem = tot[g] - fl.reduce((a, b) => a + b, 0);
    const order = exact.map((e, i) => [e - Math.floor(e), i]).sort((a, b) => b[0] - a[0]);
    for (let k = 0; k < rem; k++) fl[order[k % order.length][1]]++;
    S.com.forEach((c, i) => c.c[g] = fl[i]);
  });
  S.distributed = false;
  S.students.forEach(x => { x.com = null; x.seat = null; });
}

/* ===================== قراءة ملفات الإكسل ===================== */
function findCol(header, keys) { return header.findIndex(h => keys.some(k => String(h || '').replace(/\s+/g, ' ').trim().includes(k))); }
function gradeFromCode(v) {
  const s = toWestern(v).trim();
  for (const g of G) if (s === String(S.s.codes[g]).trim()) return g;
  if (/الأول|الاول|أول|اول/.test(s)) return 1; if (/الثاني|ثاني/.test(s)) return 2; if (/الثالث|ثالث/.test(s)) return 3;
  return null;
}
function parseSheetRows(rows) {
  // يبحث عن صف العناوين
  let hi = -1;
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const r = rows[i].map(x => String(x || ''));
    if (r.some(x => x.includes('اسم')) && (r.some(x => x.includes('الصف')) || r.some(x => x.includes('الفصل')) || r.some(x => x.includes('الجوال')))) { hi = i; break; }
  }
  if (hi >= 0) {
    const h = rows[hi];
    const ci = {
      n: findCol(h, ['اسم الطالب', 'الاسم']), id: findCol(h, ['رقم الطالب', 'السجل', 'الهوية', 'رقم الهوية']),
      g: findCol(h, ['رقم الصف', 'الصف']), sec: findCol(h, ['الفصل', 'الشعبة']), ph: findCol(h, ['الجوال', 'الهاتف', 'رقم الجوال'])
    };
    const data = rows.slice(hi + 1).filter(r => ci.n >= 0 && String(r[ci.n] || '').trim());
    if (ci.g >= 0 && ci.sec >= 0) {
      return { type: 'roster', list: data.map(r => ({ n: String(r[ci.n]).trim().replace(/\s+/g, ' '), id: ci.id >= 0 ? toWestern(r[ci.id]).trim() : '', gRaw: r[ci.g], secRaw: r[ci.sec], ph: ci.ph >= 0 ? toWestern(r[ci.ph]).replace(/\D/g, '') : '' })) };
    }
    return { type: 'phones', list: data.map(r => ({ n: String(r[ci.n]).trim(), ph: ci.ph >= 0 ? toWestern(r[ci.ph]).replace(/\D/g, '') : '' })) };
  }
  // بلا عناوين: نكتشف عمود الجوال وعمود الاسم
  const sample = rows.filter(r => r.some(x => String(x || '').trim())).slice(0, 60);
  const ncol = Math.max(0, ...sample.map(r => r.length));
  let phC = -1, nmC = -1, best = 0, bestN = 0;
  for (let c = 0; c < ncol; c++) {
    let p = 0, a = 0;
    sample.forEach(r => { const v = toWestern(r[c]).trim(); if (/^(9665|05|5)\d{8}$/.test(v.replace(/\D/g, '')) && v.replace(/\D/g, '').length >= 9) p++; if (/[\u0600-\u06FF]{2,}\s+[\u0600-\u06FF]{2,}/.test(v)) a++; });
    if (p > best) { best = p; phC = c; } if (a > bestN) { bestN = a; nmC = c; }
  }
  if (nmC < 0) return { type: 'unknown', list: [] };
  const list = rows.map(r => ({ n: String(r[nmC] || '').trim(), ph: phC >= 0 ? toWestern(r[phC]).replace(/\D/g, '') : '' }))
    .filter(x => /[\u0600-\u06FF]{2,}\s+[\u0600-\u06FF]{2,}/.test(x.n) && !/اسم المدرسة|مرحلة/.test(x.n));
  return { type: 'phones', list };
}
async function readExcelFile(file) {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  let best = null;
  wb.SheetNames.forEach(n => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' });
    const r = parseSheetRows(rows);
    if (r.list.length && (!best || (r.type === 'roster' && best.type !== 'roster') || (r.type === best.type && r.list.length > best.list.length))) best = r;
  });
  return best || { type: 'unknown', list: [] };
}
function applyRoster(list, mode) {
  const out = []; const skipped = [];
  list.forEach(r => {
    const g = gradeFromCode(r.gRaw);
    let sec = parseInt(toWestern(r.secRaw).replace(/\D/g, ''), 10);
    if (!g || isNaN(sec)) { skipped.push(r.n); return; }
    const off = +S.s.secOff[g] || 0; if (sec < off || (off && sec <= 9)) sec += off;
    out.push({ n: r.n, id: r.id, g, sec, ph: r.ph, com: null, seat: null });
  });
  if (mode === 'replace') S.students = out;
  else {
    const ids = new Set(S.students.map(x => x.id || normName(x.n)));
    out.forEach(x => { if (!ids.has(x.id || normName(x.n))) S.students.push(x); });
  }
  S.distributed = false; S.students.forEach(x => { x.com = null; x.seat = null; });
  return { added: out.length, skipped };
}
/* مطابقة ملف الإرشاد (الاسم والجوال) مع طلاب نور */
function mergeGuide() {
  const idx = new Map(); S.students.forEach(s => { s.ph2 = ''; const k = normName(s.n); if (!idx.has(k)) idx.set(k, []); idx.get(k).push(s); });
  let matched = 0;
  S.guide.forEach(r => {
    const m = idx.get(normName(r.n));
    if (m && m.length === 1) { matched++; m[0].ph2 = r.ph; r.g = m[0].g; r.sec = m[0].sec; } else { r.g = 0; r.sec = 0; }
  });
  return { matched, unmatched: S.guide.length - matched };
}

/* ===================== الخطة الدراسية – نظام المسارات (دليل الخطط 1447هـ – المسار العام) ===================== */
const CURR = {
  1: { 1: ['القرآن الكريم وتفسيره', 'الرياضيات 1-1', 'اللغة الإنجليزية 1-1', 'الكيمياء 1', 'الأحياء 1', 'التقنية الرقمية 1-1', 'الكفايات اللغوية 1-1', 'التفكير الناقد', 'التربية الصحية والبدنية'],
       2: ['المعرفة المالية', 'الرياضيات 1-2', 'اللغة الإنجليزية 1-2', 'الحديث', 'علم البيئة', 'التقنية الرقمية 1-2', 'الكفايات اللغوية 1-2', 'الفيزياء 1', 'التربية الصحية والبدنية', 'التربية المهنية', 'الدراسات الاجتماعية'] },
  2: { 1: ['الرياضيات 2-1', 'اللغة الإنجليزية 2-1', 'الكيمياء 2-1', 'الأحياء 2-1', 'التاريخ', 'الكفايات اللغوية 2-1', 'الفيزياء 2-1'],
       2: ['الرياضيات 2-2', 'اللغة الإنجليزية 2-2', 'التوحيد', 'الأحياء 2-2', 'التقنية الرقمية 2-2', 'الكيمياء 2-2', 'الفنون', 'اللياقة والثقافة الصحية'] },
  3: { 1: ['الرياضيات 3-1', 'اللغة الإنجليزية 3-1', 'الكيمياء 3', 'علوم الأرض والفضاء', 'التقنية الرقمية 3', 'المجال الاختياري', 'الفيزياء 3', 'التربية الصحية والبدنية', 'البحث ومصادر المعلومات'],
       2: ['الرياضيات 3-2', 'اللغة الإنجليزية 3-2', 'الفقه', 'علوم الأرض والفضاء', 'الدراسات الأدبية', 'المجال الاختياري', 'الفيزياء 3', 'الدراسات النفسية والاجتماعية', 'المواطنة الرقمية', 'الجغرافيا', 'المهارات الحياتية'] }
};
const CURR_TRACKS = ['الذكاء الاصطناعي', 'هندسة البرمجيات', 'علم البيانات', 'إنترنت الأشياء', 'الأمن السيبراني', 'التصميم الهندسي', 'مبادئ العلوم الصحية', 'أنظمة جسم الإنسان', 'الرعاية الصحية', 'مبادئ الإدارة', 'مبادئ الاقتصاد', 'المهارات الإدارية', 'التنمية المستدامة', 'مبادئ القانون', 'السلامة والصحة المهنية', 'التفسير', 'التجويد', 'أصول الفقه', 'الفرائض', 'مصطلح الحديث', 'الأدب العربي', 'البلاغة والنقد'];
function semNo() { const s = (typeof TAB !== 'undefined' && TAB === 'assign' && typeof setMeta === 'function' && typeof ACTIVE !== 'undefined') ? setMeta(ACTIVE).sem : S.s.sem; return /الثاني|2/.test(s) ? 2 : 1; }
function currList(g) { const a = CURR[g][semNo()], b = CURR[g][semNo() === 1 ? 2 : 1]; return [...a, ...b.filter(x => !a.includes(x)), ...(g > 1 ? CURR_TRACKS : [])]; }

/* ===================== بيان توزيع الدرجات ===================== */
function gsBuiltin() {
  const r1 = ['الكفايات اللغوية', 'الحديث', 'التفكير الناقد', 'الدراسات الاجتماعية', 'التربية المهنية'];
  const t1 = T([
    [H('المواد الدراسية', { rs: 2 }), H('المهام الأدائية', { cs: 2 }), H('المشاركة والتفاعل', { cs: 2 }), H('الاختبارات القصيرة', { rs: 2 }), H('اختبار نهاية الفترة', { rs: 2 }), H('الدرجة النهائية', { rs: 2 })],
    [H('واجبات', { fs: '9pt' }), H('بحوث أو مشروعات أو تقارير', { fs: '9pt' }), H('نشاطات وتطبيقات صفية', { fs: '9pt' }), H('المشاركة', { fs: '9pt' })],
    ...r1.map(n => [L(n), '10', '10', '10', '10', '20', '<b>40</b>', '<b>100</b>'])
  ], { cls: 'dense' }) + `<p class="note" style="text-align:center">الدرجة النهائية = مجموع درجات الفترات ÷ عدد الفترات</p>`;
  const t2 = T([
    [H('المواد الدراسية', { rs: 2 }), H('اختبار نهاية الفصل', { cs: 3 }), H('الدرجة النهائية', { rs: 2 })],
    [H('عملي'), H('شفهي'), H('تحريري')],
    [L('اللغة الإنجليزية'), '–', '20', '<b>80</b>', '<b>100</b>'], [L('الرياضيات'), '–', '–', '<b>100</b>', '<b>100</b>'],
    [L('العلوم الطبيعية (أحياء، فيزياء، كيمياء، علم البيئة)'), '10', '–', '<b>90</b>', '<b>100</b>'], [L('التقنية الرقمية'), '60', '–', '<b>40</b>', '<b>100</b>']
  ], { cls: 'dense' });
  return t1 + sp(6) + t2;
}
function gsContent(compact) {
  const g = S.s.gs || {};
  if (g.src === 'file' && g.file) {
    if (g.file.kind === 'img') return g.file.imgs.map(im => { const w = compact ? 640 : 700, h = Math.round(w * im.h / im.w); const mh = compact ? 380 : 900; const sc = h > mh ? mh / h : 1; return `<p style="text-align:center;margin:2px 0"><img src="${im.src}" width="${Math.round(w * sc)}" height="${Math.round(h * sc)}" alt="" style="max-width:100%;height:auto"></p>`; }).join('');
    return g.file.html;
  }
  return gsBuiltin();
}

async function imgToJpeg(src, maxW = 1500) {
  const im = new Image(); im.src = src; await new Promise((r, j) => { im.onload = r; im.onerror = () => j(new Error('تعذرت قراءة الصورة')); });
  // قص الهوامش البيضاء
  const t0 = document.createElement('canvas'); t0.width = im.naturalWidth; t0.height = im.naturalHeight; const tx = t0.getContext('2d'); tx.fillStyle = '#fff'; tx.fillRect(0, 0, t0.width, t0.height); tx.drawImage(im, 0, 0);
  const d = tx.getImageData(0, 0, t0.width, t0.height).data; let x0 = t0.width, y0 = t0.height, x1 = -1, y1 = -1;
  for (let y = 0; y < t0.height; y += 2) for (let x = 0; x < t0.width; x += 2) { const o = (y * t0.width + x) * 4; if (d[o] < 235 || d[o + 1] < 235 || d[o + 2] < 235) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  if (x1 < 0) { x0 = 0; y0 = 0; x1 = t0.width - 1; y1 = t0.height - 1; }
  const pad = 12; x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(t0.width - 1, x1 + pad); y1 = Math.min(t0.height - 1, y1 + pad);
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const sc = Math.min(1, maxW / cw), c = document.createElement('canvas'); c.width = Math.round(cw * sc); c.height = Math.round(ch * sc);
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(t0, x0, y0, cw, ch, 0, 0, c.width, c.height);
  return { src: c.toDataURL('image/jpeg', 0.88), w: c.width, h: c.height };
}
async function readStatementFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (/\.(png|jpe?g)$/i.test(file.name)) { const url = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(file); }); return { name: file.name, kind: 'img', imgs: [await imgToJpeg(url)] }; }
  if (buf[0] === 0x25 && buf[1] === 0x50) {
    await ensurePdfJs(); const pdf = await pdfjsLib.getDocument({ data: buf, isEvalSupported: false }).promise; const imgs = [];
    for (let i = 1; i <= Math.min(3, pdf.numPages); i++) { const pg = await pdf.getPage(i); const vp0 = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: 1500 / vp0.width }); const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); await pg.render({ canvasContext: x, viewport: vp }).promise; imgs.push(await imgToJpeg(c.toDataURL('image/png'))); }
    return { name: file.name, kind: 'img', imgs };
  }
  let rows;
  if (buf[0] === 0xD0 && buf[1] === 0xCF) rows = docBinaryRows(buf);
  else {
    const z = XLSX.CFB.read(buf, { type: 'array' }); const f = XLSX.CFB.find(z, 'word/document.xml') || XLSX.CFB.find(z, '/word/document.xml'); if (!f) throw new Error('الملف ليس مستند Word');
    const doc = new DOMParser().parseFromString(new TextDecoder('utf-8').decode(f.content), 'application/xml'); const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const txt = el => Array.from(el.getElementsByTagNameNS(W, 't')).map(t => t.textContent).join('');
    let html = '';
    Array.from(doc.getElementsByTagNameNS(W, 'body')[0].children).forEach(el => {
      if (el.localName === 'p') { const t = txt(el).trim(); if (t) html += `<p class="ds"><b>${esc(t)}</b></p>`; }
      else if (el.localName === 'tbl') {
        const trs = Array.from(el.children).filter(x => x.localName === 'tr'); const grid = trs.map(tr => Array.from(tr.children).filter(x => x.localName === 'tc').map(tc => { const gs = tc.getElementsByTagNameNS(W, 'gridSpan')[0], vm = tc.getElementsByTagNameNS(W, 'vMerge')[0]; const sh = tc.getElementsByTagNameNS(W, 'shd')[0]; return { t: Array.from(tc.getElementsByTagNameNS(W, 'p')).map(txt).filter(Boolean).join('<br>'), cs: gs ? +gs.getAttributeNS(W, 'val') || 1 : 1, vm: vm ? (vm.getAttributeNS(W, 'val') || 'continue') : null, bg: sh ? sh.getAttributeNS(W, 'fill') : null }; }));
        // حساب الدمج العمودي
        const pos = grid.map(r => { let c = 0; return r.map(x => { const p = c; c += x.cs; return p; }); });
        grid.forEach((r, ri) => r.forEach((x, ci) => { if (x.vm === 'restart') { let n = 1; for (let k = ri + 1; k < grid.length; k++) { const j = pos[k].indexOf(pos[ri][ci]); if (j >= 0 && grid[k][j].vm === 'continue') n++; else break; } x.rs = n; } }));
        html += T(grid.map(r => r.filter(x => x.vm !== 'continue').map(x => ({ v: esc(x.t).replace(/&lt;br&gt;/g, '<br>'), cs: x.cs, rs: x.rs, bg: x.bg && /^[0-9A-Fa-f]{6}$/.test(x.bg) ? '#' + x.bg : undefined }))), { cls: 'dense' }) + sp(6);
      }
    });
    if (!html) throw new Error('لم يُعثر على محتوى في الملف');
    return { name: file.name, kind: 'html', html };
  }
  return { name: file.name, kind: 'html', html: T(rows.filter(r => r.length > 1).map(r => r.map(c => ({ v: esc(c) })))) };
}

/* ===================== استيراد اللجان ===================== */
function docxRows(buf) {
  const z = XLSX.CFB.read(buf, { type: 'array' }); const f = XLSX.CFB.find(z, 'word/document.xml') || XLSX.CFB.find(z, '/word/document.xml'); if (!f) throw new Error('الملف ليس مستند Word');
  const doc = new DOMParser().parseFromString(new TextDecoder('utf-8').decode(f.content), 'application/xml'); const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const txt = el => Array.from(el.getElementsByTagNameNS(W, 't')).map(t => t.textContent).join('');
  const rows = [];
  Array.from(doc.getElementsByTagNameNS(W, 'body')[0].children).forEach(el => {
    if (el.localName === 'p') { const t = txt(el).trim(); if (t) rows.push([t]); }
    else if (el.localName === 'tbl') Array.from(el.children).filter(x => x.localName === 'tr').forEach(tr => { const cells = []; Array.from(tr.children).filter(x => x.localName === 'tc').forEach(tc => { const sp = tc.getElementsByTagNameNS(W, 'gridSpan')[0]; const n = sp ? +sp.getAttributeNS(W, 'val') || 1 : 1; cells.push(Array.from(tc.getElementsByTagNameNS(W, 'p')).map(txt).join(' ').trim()); for (let k = 1; k < n; k++) cells.push(''); }); rows.push(cells); });
  });
  return rows;
}
function comColOf(c) {
  c = String(c || '').replace(/\s+/g, ' ').trim(); if (!c || c.length > 30) return null;
  if (/رقم اللجنة|^اللجنة$|^رقم$/.test(c)) return 'no';
  if (/^الدور|مقر اللجنة|^الطابق|^المبنى/.test(c)) return 'fl';
  if (/المقر|الشعبة|القاعة|الفصل/.test(c)) return 'rm';
  if (/أول|اول|الأول/.test(c)) return 'g1'; if (/ثاني|الثاني/.test(c)) return 'g2'; if (/ثالث|الثالث/.test(c)) return 'g3';
  if (/المجموع|العدد الكلي/.test(c)) return 'tot';
  return null;
}
function parseComRows(rows) {
  let map = null; const out = []; let lastFl = '', lastRm = '';
  rows.forEach(r => {
    const cells = r.map(x => String(x == null ? '' : x).trim());
    const cols = cells.map(comColOf);
    if (cols.includes('no') && (cols.includes('g1') || cols.includes('rm') || cols.includes('fl'))) { map = {}; cols.forEach((k, i) => { if (k && map[k] == null) map[k] = i; }); lastFl = ''; lastRm = ''; return; }
    if (!map) return;
    const no = parseInt(toWestern(cells[map.no] || '').replace(/\D/g, ''), 10);
    if (!no || no > 300) return;
    let fl = map.fl != null ? cells[map.fl] : ''; if (fl) lastFl = fl; else fl = lastFl;
    let rm = map.rm != null ? toWestern(cells[map.rm]) : ''; if (rm) lastRm = rm; else if (lastRm && !/^\d+$/.test(lastRm)) rm = lastRm;
    const num = k => map[k] != null ? (parseInt(toWestern(cells[map[k]]).replace(/\D/g, ''), 10) || 0) : null;
    out.push({ no, fl, rm, c: { 1: num('g1'), 2: num('g2'), 3: num('g3') } });
  });
  return out;
}
function blockAssign(data, labels, rowH) {
  const n = data.length, k = labels.length; let res = new Array(n).fill('');
  if (!k) return res;
  if (k > n) return data.map(d => labels.reduce((b, l) => Math.abs(l.y - d.y) < Math.abs(b.y - d.y) ? l : b, labels[0]).s);
  const INF = 1e18; const dp = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(INF)); const from = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(0)); dp[0][0] = 0;
  for (let j = 1; j <= k; j++) for (let i = j; i <= n; i++) for (let a = j - 1; a < i; a++) { if (dp[j - 1][a] === INF) continue; const c = dp[j - 1][a] + ((data[a].y + data[i - 1].y) / 2 - labels[j - 1].y) ** 2; if (c < dp[j][i]) { dp[j][i] = c; from[j][i] = a; } }
  let i = n; for (let j = k; j >= 1; j--) { const a = from[j][i]; for (let r = a; r < i; r++) res[r] = labels[j - 1].s; i = a; }
  return res;
}
/* خطوط الجدول الأفقية من رسومات PDF (حدود الخلايا) */
async function pdfHLines(page) {
  const O = pdfjsLib.OPS; const ol = await page.getOperatorList(); const out = [];
  let m = [1, 0, 0, 1, 0, 0]; const st = [];
  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  const ap = (x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
  for (let k = 0; k < ol.fnArray.length; k++) {
    const fn = ol.fnArray[k], a = ol.argsArray[k];
    if (fn === O.save) st.push(m.slice()); else if (fn === O.restore) m = st.pop() || [1, 0, 0, 1, 0, 0]; else if (fn === O.transform) m = mul(m, a);
    else if (fn === O.constructPath) {
      const ops = a[0], args = a[1]; let j = 0, cur = null;
      for (const op of ops) {
        if (op === O.rectangle) { const [x, y, w, h] = args.slice(j, j + 4); j += 4; const p1 = ap(x, y), p2 = ap(x + w, y + h); const x0 = Math.min(p1[0], p2[0]), x1 = Math.max(p1[0], p2[0]), y0 = Math.min(p1[1], p2[1]), y1 = Math.max(p1[1], p2[1]); if (y1 - y0 < 3 && x1 - x0 > 4) out.push({ y: (y0 + y1) / 2, x0, x1 }); else if (x1 - x0 > 4 && y1 - y0 >= 3) { out.push({ y: y0, x0, x1 }); out.push({ y: y1, x0, x1 }); } }
        else if (op === O.moveTo) { cur = ap(args[j], args[j + 1]); j += 2; }
        else if (op === O.lineTo) { const q = ap(args[j], args[j + 1]); j += 2; if (cur && Math.abs(q[1] - cur[1]) < 1 && Math.abs(q[0] - cur[0]) > 4) out.push({ y: (q[1] + cur[1]) / 2, x0: Math.min(q[0], cur[0]), x1: Math.max(q[0], cur[0]) }); cur = q; }
        else if (op === O.curveTo) j += 6; else if (op === O.curveTo2 || op === O.curveTo3) j += 4;
      }
    }
  }
  return out;
}
/* إسناد عناوين الخلايا المدمجة عبر حدود الجدول؛ يرجع null إذا لم تكفِ الحدود */
function assignByLines(hl, x, data, labels) {
  if (!hl || !hl.length || !labels.length) return null;
  const ys = hl.filter(l => l.x0 - 1 <= x && l.x1 + 1 >= x).map(l => l.y).sort((a, b) => b - a);
  const u = []; ys.forEach(y => { if (!u.length || u[u.length - 1] - y > 1.5) u.push(y); });
  if (u.length < 2) return null;
  const band = y => u.filter(v => v > y).length;
  const lab = new Map(); labels.slice().sort((a, b) => b.y - a.y).forEach(l => { const k = band(l.y); lab.set(k, lab.has(k) ? lab.get(k) + ' ' + l.s : l.s); });
  const res = data.map(d => lab.get(band(d.y)) || '');
  const covered = res.filter(Boolean).length;
  const usedBands = new Set(data.map(d => band(d.y)));
  if ([...lab.keys()].some(k => !usedBands.has(k))) return null;
  if (covered < data.length * 0.6) return null;
  return res;
}
function lineSegments(items) {
  const arr = items.slice().sort((a, b) => b.x0 + b.w - (a.x0 + a.w)); const segs = [];
  arr.forEach(it => { const last = segs[segs.length - 1]; if (last && last.x0 - (it.x0 + it.w) < 2.5) { last.s += it.s; last.x0 = Math.min(last.x0, it.x0); } else segs.push({ s: it.s, x0: it.x0, x1: it.x0 + it.w }); });
  segs.forEach(g => { g.s = g.s.replace(/\s+/g, ' ').trim(); g.x = (g.x0 + g.x1) / 2; });
  return segs.filter(g => g.s);
}
async function pdfComRows(buf) {
  await ensurePdfJs();
  const pdf = await pdfjsLib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true }).promise; const out = [];
  const norm = t => toWestern(String(t).normalize('NFKC')).replace(/[\u0000-\u001f]/g, '').replace(/\s+/g, ' ');
  for (let pn = 1; pn <= pdf.numPages; pn++) {
    const page = await pdf.getPage(pn); const tc = await page.getTextContent({ disableNormalization: true });
    const items = tc.items.map(it => ({ s: norm(it.str), x0: it.transform[4], w: it.width || 0, y: it.transform[5] })).filter(i => i.s.trim() || i.s === ' ');
    items.sort((a, b) => b.y - a.y);
    const lines = []; items.forEach(it => { const l = lines.find(l => Math.abs(l.y - it.y) < 6); if (l) { l.items.push(it); l.y = l.items.reduce((a, b) => a + b.y, 0) / l.items.length; } else lines.push({ y: it.y, items: [it] }); });
    lines.sort((a, b) => b.y - a.y); lines.forEach(l => l.segs = lineSegments(l.items));
    const hIdx = lines.findIndex(l => l.segs.some(i => /اللجنة/.test(i.s)) && l.segs.some(i => ['g1', 'rm', 'fl'].includes(comColOf(i.s))));
    if (hIdx < 0) continue; const H = lines[hIdx];
    const anc = {}; lines.filter(l => Math.abs(l.y - H.y) < 16).sort((a, b) => Math.abs(a.y - H.y) - Math.abs(b.y - H.y)).flatMap(l => l.segs).forEach(i => { const k = comColOf(i.s); if (k && anc[k] == null) anc[k] = i.x; });
    if (anc.no == null) continue;
    const keys = Object.keys(anc); const colOf = x => keys.reduce((b, k) => Math.abs(anc[k] - x) < Math.abs(anc[b] - x) ? k : b, keys[0]);
    const body = lines.filter(l => l.y < H.y - 6 && !l.segs.every(g => /عدد الطلاب|^اللجنة$/.test(g.s))).map(l => { const c = {}; l.segs.forEach(i => { const k = colOf(i.x); c[k] = c[k] ? c[k] + ' ' + i.s : i.s; }); return { y: l.y, c }; });
    const data = body.filter(r => /^\d{1,3}$/.test((r.c.no || '').trim()));
    if (!data.length) continue;
    const gaps = data.slice(1).map((r, i) => data[i].y - r.y).sort((a, b) => a - b); const rowH = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 18;
    const top = data[0].y + rowH * 0.8, bot = data[data.length - 1].y - rowH * 0.8;
    const lab = body.filter(r => r.c.fl && r.y <= top && r.y >= bot && !/\d{3,}/.test(r.c.fl)).map(r => ({ y: r.y, s: r.c.fl }));
    const hl = await pdfHLines(page);
    const fls = (anc.fl != null && assignByLines(hl, anc.fl, data, lab)) || blockAssign(data, lab, rowH);
    out.push(['رقم اللجنة', 'الدور', 'المقر', 'أول', 'ثاني', 'ثالث']);
    data.forEach((d, i) => out.push([d.c.no, fls[i] || '', d.c.rm || '', d.c.g1 || '', d.c.g2 || '', d.c.g3 || '']));
  }
  return out;
}
async function readComFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  let rows;
  if (buf[0] === 0x25 && buf[1] === 0x50) rows = await pdfComRows(buf);
  else if (buf[0] === 0xD0 && buf[1] === 0xCF && /\.doc$/i.test(file.name)) rows = docBinaryRows(buf);
  else if (/\.docx$/i.test(file.name)) rows = docxRows(buf);
  else { const wb = XLSX.read(buf, { type: 'array' }); rows = []; wb.SheetNames.forEach(n => { rows = rows.concat(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' })); }); }
  const list = parseComRows(rows);
  if (!list.length) throw new Error('لم يُعثر على جدول فيه عمود «رقم اللجنة». تأكد أن الملف يحتوي جدول اللجان.');
  return list;
}
function applyComList(list) {
  const hasCounts = list.some(x => G.some(g => x.c[g] != null && x.c[g] > 0));
  if (hasCounts) {
    S.com = list.sort((a, b) => a.no - b.no).map(x => { const c = { 1: x.c[1] || 0, 2: x.c[2] || 0, 3: x.c[3] || 0 }; const old = S.com.find(y => +y.no === x.no); return { no: x.no, fl: x.fl || (old ? old.fl : ''), rm: x.rm || (old ? old.rm : ''), cap: c[1] + c[2] + c[3], c }; });
    S.distributed = false; S.students.forEach(x => { x.com = null; x.seat = null; });
    return `استُورد ${S.com.length} لجنة بأعدادها (أول ${comTotals()[1]}، ثاني ${comTotals()[2]}، ثالث ${comTotals()[3]}).`;
  }
  let upd = 0, add = 0;
  list.forEach(x => { const old = S.com.find(y => +y.no === x.no); if (old) { if (x.fl) old.fl = x.fl; if (x.rm) old.rm = x.rm; upd++; } else { S.com.push({ no: x.no, fl: x.fl, rm: x.rm, cap: 30, c: { 1: 0, 2: 0, 3: 0 } }); add++; } });
  S.com.sort((a, b) => a.no - b.no);
  return `استُوردت مقرات اللجان: حُدّثت ${upd} لجنة${add ? ` وأضيفت ${add}` : ''} (الأعداد الحالية لم تتغير).`;
}

/* ===================== إسناد المعلمين ===================== */
const KEY_H = ['عدد الحصص', 'الحصص', 'النصاب'];
const KEY_T = ['اسم المعلم', 'المعلم', 'المعلمة', 'اسم الموظف'], KEY_SUB = ['المادة', 'المقرر', 'المواد', 'اسم المادة'], KEY_G = ['رقم الصف', 'الصف', 'المرحلة'], KEY_SEC = ['الشعب', 'الشعبة', 'الفصل', 'الفصول'];
function gradeMarker(t) {
  t = String(t || '');
  if (/الصف\s*الأول|الصف\s*الاول|أول\s*ثانوي|اول\s*ثانوي/.test(t)) return 1;
  if (/الصف\s*الثاني|ثاني\s*ثانوي/.test(t)) return 2;
  if (/الصف\s*الثالث|ثالث\s*ثانوي/.test(t)) return 3;
  return 0;
}
function cellHas(c, keys) { const v = String(c || '').replace(/\s+/g, ' ').trim(); return v.length < 30 && keys.some(k => v.includes(k)); }
function parseAssignRows(rows) {
  const out = []; let map = null, curG = 0, lastSub = '', lastG = 0;
  rows.forEach(r => {
    const cells = r.map(x => String(x == null ? '' : x).trim());
    const filled = cells.filter(Boolean);
    if (!filled.length) return;
    const tI = cells.findIndex(c => cellHas(c, KEY_T)), sI = cells.findIndex(c => cellHas(c, KEY_SUB));
    if (tI >= 0 && sI >= 0 && tI !== sI) {
      map = { t: tI, sub: sI, g: cells.findIndex((c, i) => i !== sI && cellHas(c, KEY_G)), sec: cells.findIndex((c, i) => i !== sI && i !== tI && cellHas(c, KEY_SEC)), p: cells.findIndex(c => c === 'البرنامج'), h: cells.findIndex((c, i) => i !== tI && i !== sI && cellHas(c, KEY_H)) };
      if (map.g >= 0 && map.g === map.sec) map.g = -1;
      lastSub = ''; return;
    }
    if (filled.length === 1 || !map) { const gm = gradeMarker(filled.join(' ')); curG = gm || (filled.join(' ') === 'بدون صف' ? 0 : curG); if (gm) lastSub = ''; return; }
    const t = (cells[map.t] || '').replace(/\s+/g, ' ');
    let sub = (cells[map.sub] || '').replace(/\s+/g, ' '); if (sub) lastSub = sub; else sub = lastSub;
    if (!t || !sub || cellHas(t, KEY_T)) return;
    let g = map.g >= 0 ? gradeFromCode(cells[map.g]) : 0; if (!g && !curG && map.g >= 0 && !cells[map.g]) g = lastG;
    const nums = (toWestern(map.sec >= 0 ? cells[map.sec] : '').match(/\d+/g) || []).map(Number);
    if (!g) g = curG;
    if (!g && nums.length) g = nums.every(n => n >= 21) ? 3 : nums.every(n => n >= 11) ? 2 : 0;
    if (!g) { const dg = (toWestern(sub).match(/\d/) || [])[0]; if (dg && +dg >= 1 && +dg <= 3) g = +dg; }
    if (!g) return;
    lastG = g;
    const off = +S.s.secOff[g] || 0;
    const secs = [...new Set(nums.map(n => (off && n < 10) ? n + off : n))].sort((a, b) => a - b);
    const prog = (map.p >= 0 ? cells[map.p] : '') || progOf(sub) || '';
    if (/^ن(شاط)?$/.test(sub.trim()) || ['عوق بصري', 'فكري', 'نشاط'].includes(prog)) return; // تجاوز برامج العوق البصري والفكري وحصص النشاط
    const hh = map.h >= 0 ? (toWestern(cells[map.h]).match(/\d+/) || [''])[0] : '';
    out.push({ g, sub: spaceNum(toWestern(sub)), sec: secs.join('-'), t, prog, h: hh });
  });
  // دمج تكرار نفس المعلم والمادة
  const m = new Map();
  out.forEach(x => { const k = x.g + '|' + normName(x.sub) + '|' + normName(x.t) + '|' + (x.prog || ''); if (m.has(k)) { const y = m.get(k); const all = [...new Set((y.sec + '-' + x.sec).split('-').filter(Boolean).map(Number))].sort((a, b) => a - b); y.sec = all.join('-'); } else m.set(k, x); });
  return [...m.values()].sort((a, b) => a.g - b.g);
}
/* ---- قراءة Word القديم (.doc) ---- */
function docBinaryRows(buf) {
  let cfb; try { cfb = XLSX.CFB.read(buf, { type: 'array' }); } catch (e) { throw new Error('تعذرت قراءة ملف Word'); }
  const get = n => { const f = XLSX.CFB.find(cfb, n) || XLSX.CFB.find(cfb, '/' + n); return f ? new Uint8Array(f.content) : null; };
  const wd = get('WordDocument'); if (!wd) throw new Error('ملف Word غير صالح');
  const dv = new DataView(wd.buffer, wd.byteOffset, wd.byteLength);
  const tbl = get((dv.getUint16(0x0A, true) & 0x0200) ? '1Table' : '0Table'); if (!tbl) throw new Error('ملف Word غير مدعوم');
  const fcClx = dv.getUint32(0x01A2, true), lcbClx = dv.getUint32(0x01A6, true);
  const tv = new DataView(tbl.buffer, tbl.byteOffset, tbl.byteLength);
  let pos = fcClx, end = fcClx + lcbClx, text = '';
  while (pos < end) {
    const t = tbl[pos];
    if (t === 1) { pos += 3 + tv.getUint16(pos + 1, true); continue; }
    if (t !== 2) break;
    const lcb = tv.getUint32(pos + 1, true), st = pos + 5, n = (lcb - 4) / 12;
    for (let i = 0; i < n; i++) {
      const cp0 = tv.getUint32(st + i * 4, true), cp1 = tv.getUint32(st + (i + 1) * 4, true);
      let fc = tv.getUint32(st + (n + 1) * 4 + i * 8 + 2, true);
      const comp = (fc & 0x40000000) !== 0; fc &= 0x3FFFFFFF;
      const len = cp1 - cp0;
      if (comp) { const o = fc / 2; for (let k = 0; k < len; k++) text += String.fromCharCode(wd[o + k]); }
      else { for (let k = 0; k < len; k++) text += String.fromCharCode(dv.getUint16(fc + k * 2, true)); }
    }
    break;
  }
  if (!text) throw new Error('لم يُعثر على نص في ملف Word');
  // تقسيم النص إلى فقرات وخلايا جداول (0x07 نهاية خلية/صف)
  const rows = []; let row = [], b = '', k = 0, prev7 = false;
  for (const ch of text) {
    if (ch === '\x07') {
      if (b.trim() === '' && prev7 && row.length && (!k || row.length >= k)) { if (!k) k = row.length; rows.push(row.slice(0, k)); row = []; b = ''; prev7 = false; continue; }
      row.push(b.trim()); b = ''; prev7 = true; continue;
    }
    prev7 = false;
    if (ch === '\r') { if (!row.length) { if (b.trim()) rows.push([b.trim()]); b = ''; k = 0; } else b += ' '; continue; }
    if (ch.charCodeAt(0) < 32 && ch !== '\t') continue;
    b += ch;
  }
  return rows;
}
/* ---- قراءة PDF (طبقة النص) ---- */
async function ensureLib(id, file, ok) {
  if (ok()) return;
  const el = document.getElementById(id);
  if (el) { const code = new TextDecoder('utf-8').decode(Uint8Array.from(atob(el.textContent.trim()), c => c.charCodeAt(0))); const sc = document.createElement('script'); sc.textContent = code; document.head.appendChild(sc); }
  else await new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = file; sc.onload = res; sc.onerror = () => rej(new Error('تعذر تحميل مكتبة PDF')); document.head.appendChild(sc); });
  if (!ok()) throw new Error('تعذر تشغيل مكتبة PDF');
}
let PDF_BUSY = false;
async function downloadPdf(groups, name) {
  if (PDF_BUSY) return; PDF_BUSY = true;
  const pages = groups.flatMap(g => g.pages.map(pg => ({ pg, land: !!g.land })));
  if (!pages.length) { PDF_BUSY = false; return toast('لا توجد صفحات', true); }
  const box = document.createElement('div'); box.className = 'pdfstage'; document.body.appendChild(box);
  const bar = $('#pdfProg'); bar.hidden = false;
  try {
    await ensureLib('h2c-src', 'html2canvas.min.js', () => !!window.html2canvas);
    await ensureLib('jspdf-src', 'jspdf.umd.min.js', () => !!(window.jspdf && window.jspdf.jsPDF));
    try { await document.fonts.ready; } catch (e) { }
    let doc = null;
    for (let i = 0; i < pages.length; i++) {
      $('#pdfProgT').textContent = `جارٍ تجهيز ملف PDF… صفحة ${i + 1} من ${pages.length}`; $('#pdfProgB').style.width = Math.round((i / pages.length) * 100) + '%';
      box.innerHTML = pageWrap(pages[i].pg, pages[i].land);
      const el = box.firstElementChild; el.style.zoom = '';
      const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let tn; while ((tn = tw.nextNode())) { const v = tn.nodeValue; const nv = v.replace(/([\u0600-\u06FF])(\d)/g, '$1 $2').replace(/(\d)([\u0600-\u06FF])/g, '$1 $2'); if (nv !== v) tn.nodeValue = nv; }
      const imgs = $$('img', el); await Promise.all(imgs.map(im => im.complete ? 1 : new Promise(r => { im.onload = r; im.onerror = r; })));
      layoutPages([el]);
      const cv = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', logging: false, useCORS: true });
      const land = pages[i].land, W = land ? 297 : 210, Hh = land ? 210 : 297;
      if (!doc) doc = new window.jspdf.jsPDF({ orientation: land ? 'l' : 'p', unit: 'mm', format: 'a4', compress: true });
      else doc.addPage('a4', land ? 'l' : 'p');
      let w = W, h = cv.height * W / cv.width; if (h > Hh) { h = Hh; w = cv.width * Hh / cv.height; }
      doc.addImage(cv.toDataURL('image/jpeg', 0.9), 'JPEG', (W - w) / 2, 0, w, h, undefined, 'FAST');
      await new Promise(r => setTimeout(r, 0));
    }
    $('#pdfProgB').style.width = '100%';
    download(doc.output('blob'), name + '.pdf');
  } catch (e) { console.error(e); toast('تعذر إنشاء PDF: ' + (e.message || e), true); }
  finally { box.remove(); bar.hidden = true; PDF_BUSY = false; }
}
async function ensurePdfJs() {
  if (window.pdfjsLib) return;
  const inject = code => { const sc = document.createElement('script'); sc.textContent = code; document.head.appendChild(sc); };
  const w = document.getElementById('pdfworker-src'), m = document.getElementById('pdfjs-src');
  const dec = el => new TextDecoder('utf-8').decode(Uint8Array.from(atob(el.textContent.trim()), c => c.charCodeAt(0)));
  if (w && m) { inject(dec(w)); inject(dec(m)); }
  else {
    const load = src => new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = src; sc.onload = res; sc.onerror = () => rej(new Error('تعذر تحميل قارئ PDF')); document.head.appendChild(sc); });
    await load('pdf.worker.min.js'); await load('pdf.min.js');
  }
  if (!window.pdfjsLib) throw new Error('تعذر تشغيل قارئ PDF');
}
function spaceNum(t) { return String(t || '').replace(/([\u0600-\u06FF])(\d)/g, '$1 $2').replace(/\s+/g, ' ').trim(); }
function progOf(t) { t = String(t || ''); return /بصري/.test(t) ? 'عوق بصري' : /فكري/.test(t) ? 'فكري' : /النشاط|نشاط/.test(t) ? 'نشاط' : null; }
async function pdfAssignRows(buf) {
  await ensurePdfJs();
  const pdf = await pdfjsLib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true }).promise;
  const out = [];
  const norm = t => toWestern(String(t).normalize('NFKC')).replace(/\s+/g, ' ').trim();
  const joinIt = arr => arr.reduce((acc, it, i) => { if (!i) return it.s; const prev = arr[i - 1]; const gap = prev.x0 - (it.x0 + it.w); return acc + (gap < 1.2 ? '' : ' ') + it.s; }, '');
  for (let pn = 1; pn <= pdf.numPages; pn++) {
    const page = await pdf.getPage(pn); const tc = await page.getTextContent({ disableNormalization: true }); let HL = null; try { HL = await pdfHLines(page); } catch (e) { HL = null; }
    const items = tc.items.map(it => ({ s: norm(it.str), x0: it.transform[4], x: it.transform[4] + (it.width || 0) / 2, y: it.transform[5], w: it.width || 0 })).filter(it => it.s);
    if (!items.length) continue;
    items.sort((a, b) => b.y - a.y);
    const lines = []; items.forEach(it => { const l = lines.find(l => Math.abs(l.y - it.y) < 6); if (l) { l.items.push(it); l.y = l.items.reduce((a, b) => a + b.y, 0) / l.items.length; } else lines.push({ y: it.y, items: [it] }); });
    lines.sort((a, b) => b.y - a.y);
    lines.forEach(l => { l.items.sort((a, b) => b.x - a.x); l.text = joinIt(l.items); });
    const isHead = l => l.items.some(i => /^(اسم )?المعلم(ة)?$/.test(i.s)) && l.items.some(i => /^(المقرر|الماده|المادة|الشعبة|الشعب|الفصل)$/.test(i.s));
    const hIdx = lines.findIndex(isHead);
    if (hIdx < 0) continue;
    const H = lines[hIdx];
    const pre = lines.slice(0, hIdx).map(l => l.text).join(' ');
    let curG = lines.slice(0, hIdx).map(l => gradeMarker(l.text)).filter(Boolean).pop() || 0;
    let curP = progOf(lines.slice(0, hIdx).filter(l => /توزيع|توقيع|حصص|جدول/.test(l.text)).map(l => l.text).join(' ')) || '';
    const anc = {};
    lines.filter(l => Math.abs(l.y - H.y) < 14).flatMap(l => l.items).forEach(i => {
      if (/^(اسم )?المعلم(ة)?$/.test(i.s)) anc.t = i.x; else if (/المقرر|الماده|المادة/.test(i.s)) anc.sub = i.x; else if (/الشعب|الفصل|الفصول/.test(i.s)) anc.sec = i.x;
      else if (/الحصص|عدد/.test(i.s)) anc.n = i.x; else if (/ملاحظ|التوقيع/.test(i.s)) anc.note = i.x; else if (/^الصف$/.test(i.s)) anc.g = i.x;
    });
    if (anc.t == null || anc.sec == null) continue;
    const keys = Object.keys(anc);
    const colOf = x => keys.reduce((b, k) => Math.abs(anc[k] - x) < Math.abs(anc[b] - x) ? k : b, keys[0]);
    // تقسيم الجسم إلى مقاطع عند عناوين الصفوف داخل الجدول
    const segs = [{ g: curG, p: curP, rows: [] }];
    lines.filter(l => l.y < H.y - 6 && !(Math.abs(l.y - H.y) < 14 && l.items.every(i => /عدد|الحصص|ملاحظ/.test(i.s)))).forEach(l => {
      const gm = gradeMarker(l.text);
      if (gm && /ثانوي/.test(l.text) && l.text.length > 12) { segs.push({ g: gm, p: progOf(l.text) ?? segs[segs.length - 1].p, rows: [] }); return; }
      const g = {}; l.items.forEach(i => { const k = colOf(i.x); (g[k] = g[k] || []).push(i); }); const c = {}; Object.keys(g).forEach(k => c[k] = joinIt(g[k]));
      const sy = g.sub ? g.sub.reduce((a, b) => a + b.y, 0) / g.sub.length : l.y;
      segs[segs.length - 1].rows.push({ y: l.y, sy, c });
    });
    segs.forEach(seg => {
      const body = seg.rows;
      const data = body.filter(r => r.c.t && r.c.sec && /^[\d\s\-–_/,،]+$/.test(r.c.sec) && !/وكيل|مدير/.test(r.c.t));
      if (!data.length) return;
      const gaps = data.slice(1).map((r, i) => data[i].y - r.y); const sg = gaps.slice().sort((a, b) => a - b); const rowH = sg.length ? sg[Math.floor(sg.length / 2)] : 20;
      body.filter(r => r.c.t && !r.c.sec && !r.c.sub).forEach(r => { const near = data.reduce((b, d) => Math.abs(d.y - r.y) < Math.abs(b.y - r.y) ? d : b, data[0]); if (Math.abs(near.y - r.y) < rowH * 0.7) near.c.t = r.y > near.y ? r.c.t + ' ' + near.c.t : near.c.t + ' ' + r.c.t; });
      const top = data[0].y + rowH * 0.8, bot = data[data.length - 1].y - rowH * 0.8;
      let labels = body.filter(r => r.c.sub && r.y <= top && r.y >= bot && !/وكيل|مدير/.test(r.c.sub)).map(r => ({ y: r.sy, s: r.c.sub }));
      const byLines = anc.sub != null ? assignByLines(HL, anc.sub, data, labels) : null;
      const onRow = y => data.some(d => Math.abs(d.y - y) < 3); const merged = []; labels.forEach(l => { const pv = merged[merged.length - 1]; if (pv && pv.yl - l.y < rowH * 0.88) { pv.s += ' ' + l.s; pv.y = (pv.y0 + l.y) / 2; pv.yl = l.y; } else merged.push({ ...l, y0: l.y, yl: l.y }); });
      labels = merged;
      const n = data.length, k = labels.length;
      let subOf = new Array(n).fill('');
      if (byLines) subOf = byLines; else {
      // فواصل الكتل: فجوات أكبر من المعتاد بين الأسطر
      const big = gaps.map((g, i) => g > rowH * 1.18 ? i + 1 : -1).filter(i => i > 0);
      if (k && big.length + 1 === k) {
        const bounds = [0, ...big, n];
        for (let j = 0; j < k; j++) for (let r = bounds[j]; r < bounds[j + 1]; r++) subOf[r] = labels[j].s;
      } else if (k && k <= n) {
        const INF = 1e18; const dp = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(INF)); const from = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(0)); dp[0][0] = 0;
        const bigSet = new Set(big);
        for (let j = 1; j <= k; j++) for (let i = j; i <= n; i++) for (let a = j - 1; a < i; a++) {
          if (dp[j - 1][a] === INF) continue;
          const mid = (data[a].y + data[i - 1].y) / 2; let c = dp[j - 1][a] + (mid - labels[j - 1].y) ** 2;
          for (let r = a + 1; r < i; r++) if (bigSet.has(r)) c += rowH * rowH; // لا تعبر فاصلاً واضحاً
          if (c < dp[j][i]) { dp[j][i] = c; from[j][i] = a; }
        }
        let i = n; for (let j = k; j >= 1; j--) { const a = from[j][i]; for (let r = a; r < i; r++) subOf[r] = labels[j - 1].s; i = a; }
      } else if (k) subOf = data.map(d => labels.reduce((b, l) => Math.abs(l.y - d.y) < Math.abs(b.y - d.y) ? l : b, labels[0]).s);
      }
      out.push([seg.g ? GNAME[seg.g] : 'بدون صف']);
      out.push(['المادة', 'اسم المعلم', 'الشعب', 'البرنامج', 'عدد الحصص']);
      data.forEach((d, i) => out.push([subOf[i] || d.c.sub || '', d.c.t, d.c.sec, seg.p || '', d.c.n || '']));
    });
  }
  if (!out.some(r => r.length > 1)) throw new Error('لم يُعثر على جدول إسناد في ملف PDF. إن كان الملف صورة ممسوحة ضوئياً فاحفظه من Word أو Excel ثم ارفعه.');
  return out;
}
/* ===================== رفع قائمة المعلمين (Excel / Word / PDF / نص) ===================== */
async function pdfLineRows(buf) {
  await ensurePdfJs();
  const pdf = await pdfjsLib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true }).promise; const out = [];
  const norm = t => toWestern(String(t).normalize('NFKC')).replace(/[\u0000-\u001f]/g, '').replace(/\s+/g, ' ');
  for (let pn = 1; pn <= pdf.numPages; pn++) {
    const page = await pdf.getPage(pn); const tc = await page.getTextContent({ disableNormalization: true });
    const items = tc.items.map(it => ({ s: norm(it.str), x0: it.transform[4], w: it.width || 0, y: it.transform[5] })).filter(i => i.s.trim() || i.s === ' ');
    const lines = []; items.sort((a, b) => b.y - a.y).forEach(it => { const l = lines.find(l => Math.abs(l.y - it.y) < 5); if (l) l.items.push(it); else lines.push({ y: it.y, items: [it] }); });
    lines.sort((a, b) => b.y - a.y).forEach(l => out.push(lineSegments(l.items).map(g => g.s)));
  }
  return out;
}
/* PDF: يحدد عمود الاسم من صف العناوين ثم يجمع نص كل خلية (حتى لو التف الاسم على سطرين) بحدود الجدول */
async function pdfTeacherNames(buf) {
  await ensurePdfJs();
  const pdf = await pdfjsLib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true }).promise; const out = [];
  const norm = t => toWestern(String(t).normalize('NFKC')).replace(/[\u0000-\u001f]/g, '').replace(/\s+/g, ' ');
  for (let pn = 1; pn <= pdf.numPages; pn++) {
    const page = await pdf.getPage(pn); const tc = await page.getTextContent({ disableNormalization: true });
    const items = tc.items.map(it => ({ s: norm(it.str), x0: it.transform[4], w: it.width || 0, y: it.transform[5] })).filter(i => i.s.trim());
    const lines = []; items.slice().sort((a, b) => b.y - a.y).forEach(it => { const l = lines.find(l => Math.abs(l.y - it.y) < 4); if (l) l.items.push(it); else lines.push({ y: it.y, items: [it] }); });
    lines.sort((a, b) => b.y - a.y).forEach(l => l.segs = lineSegments(l.items));
    const hl = lines.find(l => l.segs.some(g => isNameHdr(g.s)));
    if (!hl) continue;
    const segs = hl.segs.slice().sort((a, b) => a.x - b.x); const hi = segs.findIndex(g => isNameHdr(g.s)); const H = segs[hi];
    const lo = hi > 0 ? (segs[hi - 1].x1 + H.x0) / 2 : -1e9, up = hi < segs.length - 1 ? (H.x1 + segs[hi + 1].x0) / 2 : 1e9;
    const inCol = it => { const cx = it.x0 + it.w / 2; return cx > lo && cx < up; };
    let rules = []; try { rules = (await pdfHLines(page)).filter(r => r.y < hl.y && r.x0 < H.x + 2 && r.x1 > H.x - 2).map(r => r.y); } catch (e) { rules = []; }
    rules = [...new Set(rules.map(y => Math.round(y)))].sort((a, b) => b - a);
    const body = lines.filter(l => l.y < hl.y - 2).map(l => ({ y: l.y, num: l.items.some(it => !inCol(it) && /^\d{1,3}$/.test(it.s.trim())), s: lineSegments(l.items.filter(inCol)).map(g => g.s).join(' ').trim() }));
    if (rules.length >= 2) {
      for (let i = 0; i < rules.length - 1; i++) { const cell = body.filter(l => l.s && l.y < rules[i] && l.y > rules[i + 1]).map(l => l.s).join(' '); if (cell) out.push(cell); }
    } else if (body.filter(l => l.num).length >= 3) {
      /* بلا حدود: سطر فيه رقم تسلسلي يبدأ صفاً جديداً، وما بعده بلا رقم تكملة للاسم الملتف */
      let cur = null; body.forEach(l => { if (l.num) { if (cur) out.push(cur); cur = l.s; } else if (cur != null && l.s) cur = (cur + ' ' + l.s).trim(); }); if (cur) out.push(cur);
    } else {
      const bl = body.filter(l => l.s); const gaps = bl.slice(1).map((l, i) => bl[i].y - l.y).sort((a, b) => a - b); const med = gaps.length ? gaps[Math.floor(gaps.length * 0.75)] : 20;
      let cur = null, py = null; bl.forEach(l => { if (cur != null && py - l.y < med * 0.7) cur += ' ' + l.s; else { if (cur) out.push(cur); cur = l.s; } py = l.y; }); if (cur) out.push(cur);
    }
  }
  return out;
}
async function readTeacherFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b;
  let rows;
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    const cells = await pdfTeacherNames(buf.slice());
    const got = parseTeacherRows(cells.map(c => [c])); if (got.length >= 3) return got;
    rows = await pdfLineRows(buf.slice());
  }
  else if (buf[0] === 0xD0 && buf[1] === 0xCF && /\.doc$/i.test(file.name)) rows = docBinaryRows(buf);
  else if (/\.docx$/i.test(file.name) || (isZip && !/\.(xlsx|xlsm|xls|csv)$/i.test(file.name))) rows = docxRows(buf);
  else if (/\.txt$/i.test(file.name)) rows = new TextDecoder('utf-8').decode(buf).split(/\r?\n/).map(l => l.split(/\t|,|؛|;/));
  else { const wb = XLSX.read(buf, { type: 'array' }); rows = []; wb.SheetNames.forEach(n => { rows = rows.concat(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' })); rows.push([]); }); }
  return parseTeacherRows(rows);
}
function fixLamAlef(s) { return String(s).replace(/(^|\s)ا([اأإآ])ل/g, '$1ال$2'); }
function isNameHdr(s) { const v = normName(fixLamAlef(String(s || '').trim())); return /^(اسم المعلم.*|اسم الموظف|الاسم( الرباعي| الثلاثي| الكامل)?|المعلم|اسم منسوب.*|اسم الموظف.*)$/.test(v); }
const TCH_STOP = /(المملكة|السعودية|وزارة|التعليم|الإدارة|الادارة|العامة|محافظة|مدرسة|المدرسة|الثانوية|المتوسطة|الابتدائية|كشف|أسماء|اسماء|قائمة|المعلمين|منسوبي|العام الدراسي|الفصل الدراسي|الاسم|التخصص|المادة|التوقيع|الجوال|السجل المدني|الهوية|الملاحظات|رقم|المجموع|العدد|الإجمالي|مدير|وكيل|قائد|الشؤون|التعليمية|المرحلة|الصف|الشعبة|النصاب|الحصص|اليوم|التاريخ|هـ$|^م$|^ت$)/;
function cleanTeacherName(s) {
  s = toWestern(String(s || '')).normalize('NFKC').replace(/[‎‏‪-‮]/g, '').replace(/\s+/g, ' ').trim();
  s = fixLamAlef(s).replace(/^[\d\s.\-–_)(/\\]+/, '').replace(/^(الأستاذ|الاستاذ|الأستاذة|المعلم|أ\s*[/.]|أ\s+|م\s*[/.])\s*/, '').replace(/[\d\s.\-–_]+$/, '').trim();
  return s;
}
function looksLikeName(s) {
  if (!s || s.length < 5 || s.length > 45) return false;
  if (/[0-9@:]/.test(s) || /[A-Za-z]/.test(s)) return false;
  if (!/^[؀-ۿ\s]+$/.test(s)) return false;
  const w = s.split(' ').filter(Boolean); if (w.length < 2 || w.length > 6) return false;
  if (TCH_STOP.test(s)) return false;
  if (w.some(x => x.length === 1 && !/^[وى]$/.test(x))) return false;
  return true;
}
function parseTeacherRows(rows) {
  rows = rows.map(r => (Array.isArray(r) ? r : [r]).map(c => String(c == null ? '' : c).trim()));
  const names = [];
  // 1) عمود الاسم من صف العناوين إن وُجد
  const hi = rows.findIndex(r => r.some(isNameHdr));
  if (hi >= 0) {
    const col = rows[hi].findIndex(isNameHdr);
    rows.slice(hi + 1).forEach(r => { const n = cleanTeacherName(r[col]); if (looksLikeName(n)) names.push(n); });
  }
  // 2) بدون عناوين واضحة: أفضل خانة تبدو اسماً في كل سطر
  if (names.length < 3) {
    names.length = 0;
    rows.forEach(r => { const c = r.map(cleanTeacherName).filter(looksLikeName).sort((a, b) => b.split(' ').length - a.split(' ').length || b.length - a.length); if (c.length) names.push(c[0]); });
  }
  const seen = new Set(); return names.filter(n => { const k = normName(n); if (seen.has(k)) return false; seen.add(k); return true; });
}
/* مفتاح الشخص: الاسم الأول + اسم العائلة، ليُعرف «علي القرني» و«علي سعيد القرني» أنهما شخص واحد */
function personKey(n) { const w = normName(n).split(' ').filter(Boolean); return w.length ? w[0] + '|' + w[w.length - 1] : ''; }
function sameTeacher(list) { const a = new Set(list.map(normName)), b = new Set(list.map(personKey)); return n => a.has(normName(n)) || b.has(personKey(n)); }
function teacherReview(found, fileName) {
  return new Promise(res => {
    const inCur = sameTeacher(S.teachers), inFile = sameTeacher(found);
    const cur = { has: n => inCur(n) };
    const removed = S.teachers.filter(n => !inFile(n));
    const newCount = found.filter(n => !inCur(n)).length;
    let m = $('#tchModal'); if (!m) { m = document.createElement('div'); m.id = 'tchModal'; m.className = 'modal'; document.body.appendChild(m); }
    m.innerHTML = `<div class="box tchbox" role="dialog" aria-label="مراجعة قائمة المعلمين">
      <h3>مراجعة أسماء المعلمين</h3>
      <p class="hint">${esc(fileName)} — وُجد <b>${found.length}</b> اسماً: <span class="tg new">${newCount} جديد</span> <span class="tg old">${found.length - newCount} موجود</span>${removed.length ? ` <span class="tg del">${removed.length} غير موجود في الملف</span>` : ''}</p>
      <div class="seg tmode" role="group"><button type="button" class="on" data-m="replace">استبدال القائمة بالكامل</button><button type="button" data-m="merge">إضافة للقائمة الحالية</button></div>
      <p class="hint tmh">ستُعتمد أسماء الملف فقط${removed.length ? `، ويُحذف ${removed.length} اسماً غير موجود فيه` : ''}. أزل علامة أي سطر لا تريده.</p>
      <div class="tlist">${found.map((n, i) => `<label class="trow"><input type="checkbox" checked data-i="${i}"><span>${esc(n)}</span>${cur.has(n) ? '' : '<em class="tg new">جديد</em>'}</label>`).join('')}
      ${removed.length ? `<div class="trem"><b>سيُحذف من القائمة (غير موجود في الملف):</b> ${removed.map(esc).join('، ')}</div>` : ''}</div>
      <div class="acts"><button class="btn pri" id="tchOk" type="button">اعتماد القائمة</button><button class="btn ghost" id="tchNo" type="button">إلغاء</button><button class="btn ghost sm" id="tchAll" type="button">تحديد/إلغاء الكل</button></div></div>`;
    m.hidden = false; let mode = 'replace';
    const setMode = v => { mode = v; $$('.tmode button', m).forEach(b => b.classList.toggle('on', b.dataset.m === v)); const tr = $('.trem', m); if (tr) tr.hidden = v !== 'replace';
      $('.tmh', m).textContent = v === 'replace' ? `ستُعتمد أسماء الملف فقط${removed.length ? `، ويُحذف ${removed.length} اسماً غير موجود فيه` : ''}. أزل علامة أي سطر لا تريده.` : 'تُضاف الأسماء الجديدة فقط وتبقى القائمة الحالية كما هي.'; };
    $$('.tmode button', m).forEach(b => b.onclick = () => setMode(b.dataset.m));
    $('#tchAll', m).onclick = () => { const bx = $$('.tlist input', m); const all = bx.every(x => x.checked); bx.forEach(x => x.checked = !all); };
    const close = v => { m.hidden = true; m.innerHTML = ''; res(v); };
    $('#tchNo', m).onclick = () => close(null);
    $('#tchOk', m).onclick = () => close({ mode, names: $$('.tlist input', m).filter(x => x.checked).map(x => found[+x.dataset.i]) });
  });
}
function tchTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([['م', 'اسم المعلم', 'التخصص', 'الجوال'], ...S.teachers.map((n, i) => [i + 1, n, '', ''])]);
  ws['!cols'] = [{ wch: 5 }, { wch: 32 }, { wch: 18 }, { wch: 14 }]; ws['!views'] = [{ RTL: true }];
  const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] }; XLSX.utils.book_append_sheet(wb, ws, 'المعلمون');
  XLSX.writeFile(wb, 'قائمة المعلمين.xlsx');
}
async function readAssignFile(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  const isZip = buf[0] === 0x50 && buf[1] === 0x4b;
  if (/\.docx$/i.test(file.name) || (isZip && !/\.xlsx?$/i.test(file.name) && !/\.csv$/i.test(file.name))) {
    let xml;
    try { const z = XLSX.CFB.read(buf, { type: 'array' }); const f = XLSX.CFB.find(z, 'word/document.xml') || XLSX.CFB.find(z, '/word/document.xml'); xml = new TextDecoder('utf-8').decode(f.content); }
    catch (e) { throw new Error('تعذرت قراءة ملف Word'); }
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const body = doc.getElementsByTagNameNS(W, 'body')[0]; const rows = [];
    const txt = el => Array.from(el.getElementsByTagNameNS(W, 't')).map(t => t.textContent).join('');
    Array.from(body.children).forEach(el => {
      if (el.localName === 'p') { const t = txt(el).trim(); if (t) rows.push([t]); }
      else if (el.localName === 'tbl') {
        Array.from(el.children).filter(x => x.localName === 'tr').forEach(tr => {
          const cells = []; Array.from(tr.children).filter(x => x.localName === 'tc').forEach(tc => {
            const span = tc.getElementsByTagNameNS(W, 'gridSpan')[0]; const n = span ? +span.getAttributeNS(W, 'val') || 1 : 1;
            cells.push(Array.from(tc.getElementsByTagNameNS(W, 'p')).map(txt).join(' ').trim()); for (let i = 1; i < n; i++) cells.push('');
          });
          rows.push(cells);
        });
      }
    });
    return parseAssignRows(rows);
  }
  if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return parseAssignRows(await pdfAssignRows(buf));
  if (buf[0] === 0xD0 && buf[1] === 0xCF && buf[2] === 0x11 && buf[3] === 0xE0 && /\.doc$/i.test(file.name)) return parseAssignRows(docBinaryRows(buf));
  const wb = XLSX.read(buf, { type: 'array' }); let rows = [];
  wb.SheetNames.forEach(n => { rows = rows.concat(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' })); rows.push([]); });
  return parseAssignRows(rows);
}
function subjTokens(s) {
  const STOP = new Set(['لغه', 'ماده', 'مقرر', 'و', 'مسار']);
  return normName(s).replace(/[\d\-–_/\\()]+/g, ' ').split(' ').map(w => { if (w.length > 3 && w.startsWith('ال')) w = w.slice(2); if (w === 'علوم') w = 'علم'; if (w.endsWith('يه')) w = w.slice(0, -1); else if (w.endsWith('ه') && w.length > 3) w = w.slice(0, -1); return w; }).filter(w => w.length >= 2 && !STOP.has(w));
}
function subjMatch(a, b) {
  const A = subjTokens(a), B = subjTokens(b); if (!A.length || !B.length) return false;
  const [sm, lg] = A.length <= B.length ? [A, B] : [B, A]; return sm.every(t => lg.includes(t));
}
function teachersOfSubject(sub, g) {
  const l = S.ta.filter(x => +x.g === +g && !['فكري', 'نشاط'].includes(x.prog) && subjMatch(x.sub, sub));
  const m = new Map(); l.forEach(x => m.set(x.t, (m.get(x.t) || 0) + (x.sec ? x.sec.split('-').length : 1)));
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(x => x[0]);
}
function buildStFromTa() {
  const sched = []; S.days.forEach(d => d.p.forEach(p => G.forEach(g => { const sb = (p.s[g] || '').trim(); if (sb && !sched.some(x => x.g === g && x.sub === sb)) sched.push({ g, sub: sb }); })));
  const miss = []; const next = [];
  sched.forEach(x => {
    const old = S.st.find(y => +y.g === x.g && y.sub.trim() === x.sub);
    const ts = teachersOfSubject(x.sub, x.g);
    const t = old && old.t && (ts.includes(old.t) || !ts.length) ? old.t : (ts[0] || (old ? old.t : ''));
    if (!ts.length) miss.push(x.sub);
    next.push({ sub: x.sub, g: x.g, t, mark: old ? old.mark : '' });
  });
  S.st.filter(y => !next.some(x => +x.g === +y.g && x.sub === y.sub.trim())).forEach(y => next.push(y));
  S.st = next;
  // ضم المعلمين الجدد لقائمة الملاحظة
  const have = new Set(S.teachers.map(normName)); S.ta.forEach(x => { if (x.t && !have.has(normName(x.t))) { S.teachers.push(x.t); have.add(normName(x.t)); } });
  return { total: sched.length, miss };
}

/* ===================== الواجهة: التبويبات ===================== */
/* ===================== مسار العمل: مراحل مرقّمة لكل منها لونها ===================== */
const FLOW = [
  { k: 'files', n: 1, t: 'الملفات الأساسية', d: 'ملف نور · ملف الإرشاد الطلابي · قائمة المعلمين — الأساس الذي يُبنى عليه كل شيء', c: '#2563eb', ic: '<path d="M4 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M12 11v5M9.5 13.5 12 11l2.5 2.5"/>' },
  { k: 'assign', n: 2, t: 'الإسناد', d: 'توزيع المواد والشعب على المعلمين — تنعكس فيه قائمة المعلمين', c: '#7c3aed', ic: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>' },
  { k: 'schedule', n: 3, t: 'جدول الاختبارات', d: 'الأيام والفترات ومواد كل صف', c: '#0f766e', ic: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>' },
  { k: 'committees', n: 4, t: 'اللجان والجلوس', d: 'أعداد اللجان وتوزيع الطلاب وأرقام الجلوس', c: '#c2410c', ic: '<path d="M4 20v-6h16v6M7 14V9h10v5M9 9V5h6v4"/>' },
  { k: 'staff', n: 5, t: 'التكليفات والملاحظة', d: 'واضعو الأسئلة وبيان الدرجات وتوزيع الملاحظين والقوائم الخاصة', c: '#be185d', ic: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="m16 11 2 2 4-4"/>' },
  { k: 'forms', n: 6, t: 'المطبوعات', d: 'كل النماذج والكشوف والمحاضر — طباعة وPDF وWord', c: '#4338ca', ic: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>' }
];
const UTILS = [
  { k: 'daily', pin: true, t: 'الانتظار والمناوبة', d: 'استمارة حصص الانتظار وتقرير الإشراف والمناوبة اليومي — بالمتاحين في كل حصة والتنبيه على التعارض', c: '#0e7490', ic: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>' },
  { k: 'today', t: 'يوم الاختبار', d: 'كل أوراق يوم الاختبار بضغطة واحدة: الحقيبة وكشوف المناداة والمحاضر', c: '#dc2626', ic: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9 15 2 2 4-4"/>' },
  { k: 'home', t: 'لوحة المتابعة', d: 'الحالة العامة والتنبيهات وحقائب الطباعة الجاهزة', c: '#0b3a46', ic: '<path d="M3 12h4l3 7 4-14 3 7h4"/>' },
  { k: 'settings', t: 'الإعدادات', d: 'الكليشة والتواقيع والصفوف والتاريخ والتعليمات', c: '#475569', ic: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>' },
  { k: 'backup', t: 'الحفظ والنسخ', d: 'المزامنة بين الأجهزة والنسخ الاحتياطية', c: '#475569', ic: '<path d="M7 18a4.5 4.5 0 0 1-.5-9A6 6 0 0 1 18 8a4 4 0 0 1 0 8"/><path d="M12 12v8M9 17l3 3 3-3"/>' }
];
const PAGES = [...FLOW, ...UTILS];
const ALL_TABS = PAGES.map(p => [p.k, p.t]);
let WS = 'ex';
let TABS = ALL_TABS;
let TAB = 'files';
const ALIAS = { students: 'files' };
function stageDone(k) {
  return { files: S.students.length > 0 && S.teachers.length > 0, assign: S.ta.length > 0, schedule: S.days.length > 0 && S.days.some(d => d.p.some(p => G.some(g => (p.s[g] || '').trim()))), committees: !!S.distributed, staff: Object.values(S.obs || {}).some(l => (l || []).some(Boolean)), forms: null }[k];
}
const svgI = (p, s = 18) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
function updSetChip() { const c = $('#setChip'); if (!c) return; const m = setMeta(ACTIVE); c.textContent = m.n + ' · ' + semShort(m.sem); c.title = `الإسناد الذي تعمل عليه: ${m.n} — الفصل الدراسي ${m.sem} ${m.y}`; c.style.setProperty('--scc', SET_DEF[ACTIVE].c); }
function roleFlow() { return FLOW.filter(s => typeof roleAllows !== 'function' || roleAllows(s.k)).map((s, i) => Object.assign({}, s, { n: i + 1 }, (typeof ROLE !== 'undefined' && ROLE === 'agent' && s.k === 'files') ? { t: 'المعلمون', d: 'قائمة معلمي المدرسة — ترفعها من Excel أو Word أو PDF وتنعكس في الإسناد' } : {})); }
function renderNav() { updSetChip(); if (typeof updWeekChip === 'function') updWeekChip(); if (typeof updRoleChip === 'function') updRoleChip();
  const RF = roleFlow();
  $('#nav').innerHTML = `<div class="steps">${RF.map(s => { const d = stageDone(s.k); return `<button class="step${s.k === TAB ? ' on' : ''}${d === true ? ' done' : ''}" style="--sc:${s.c}" data-tab="${s.k}" type="button" aria-current="${s.k === TAB ? 'page' : 'false'}"><i>${d === true ? '✓' : s.n}</i><span>${s.t}</span></button>`; }).join('<span class="sline" aria-hidden="true"></span>')}</div>
  <div class="utils">${UTILS.filter(u => typeof roleAllows !== 'function' || roleAllows(u.k)).map(u => `<button class="util${u.k === TAB ? ' on' : ''}${u.pin ? ' pin' : ''}" style="--uc:${u.c}" data-tab="${u.k}" type="button" title="${u.t}">${svgI(u.ic, 17)}<span>${u.t}</span></button>`).join('')}</div>`;
  const on = $('#nav .step.on, #nav .util.on'); if (on && on.scrollIntoView) try { on.scrollIntoView({ block: 'nearest', inline: 'center' }); } catch (e) { }
}
function stageHero(p) {
  const RF = roleFlow(), st = RF.find(s => s.k === p.k); if (st) p = Object.assign({}, p, { t: st.t, d: st.d });
  return `<header class="shero" style="--sc:${p.c}"><div class="sico">${svgI(p.ic, 26)}</div><div class="stx">${st ? `<small>المرحلة ${st.n} من ${RF.length}</small>` : '<small>أدوات</small>'}<h2>${p.t}</h2><p>${p.d}</p></div></header>`;
}
function stageNext(p) {
  const RF = roleFlow(), i = RF.findIndex(s => s.k === p.k); if (i < 0) return '';
  const prev = RF[i - 1], next = RF[i + 1];
  return `<nav class="snext" aria-label="التنقل بين المراحل">${prev ? `<button type="button" class="btn ghost" data-tab="${prev.k}">→ ${prev.t}</button>` : '<span></span>'}${next ? `<button type="button" class="btn nx" style="--sc:${next.c}" data-tab="${next.k}">التالي: ${next.t} ←</button>` : ''}</nav>`;
}
function go(tab) { tab = ALIAS[tab] || tab; if (!TABS.some(x => x[0] === tab)) tab = TABS[0] ? TABS[0][0] : 'files'; TAB = tab; try { localStorage.setItem(LS_KEY + '-tab', tab); } catch (e) { } renderNav(); render(); window.scrollTo({ top: 0 }); if (location.hash !== '#' + tab) history.replaceState(null, '', '#' + tab); }
function flowBar() {
  const st = [
    ['settings', 'الإعدادات', !!S.s.yearTxt], ['schedule', 'الجدول', S.days.length > 0], ['students', 'ملف نور', S.students.length > 0],
    ['students', 'ملف الإرشاد', S.guide.length > 0], ['assign', 'الإسناد', S.ta.length > 0], ['staff', 'الملاحظون', Object.keys(S.obs || {}).length > 0], ['committees', 'توزيع اللجان', !!S.distributed], ['forms', 'الطباعة', null]
  ];
  return `<nav class="flow" aria-label="خطوات الإعداد">${st.map((x, i) => `<button type="button" class="fstep ${x[2] === true ? 'ok' : x[2] === false ? 'todo' : ''}${TAB === x[0] ? ' cur' : ''}" data-tab="${x[0]}"><i>${x[2] === true ? '✓' : i + 1}</i>${x[1]}</button>`).join('<span class="fsep"></span>')}</nav>`;
}
function render() {
  const m = $('#main'); const p = PAGES.find(x => x.k === TAB) || PAGES[0];
  m.style.setProperty('--sc', p.c); m.dataset.page = p.k;
  const roNote = exReadOnly() && !['assign', 'backup', 'settings', 'today', 'forms'].includes(p.k) && !(p.k === 'files' && ROLE === 'agent') ? `<div class="pend ro"><div class="pdt"><b>هذا الجهاز يعمل على «${esc(setMeta('ta-agent').n)}»</b><span>بيانات الاختبارات هنا للاطلاع فقط ولا تُحفظ على السحابة، حتى لا يتداخل عملك مع عمل الاختبارات.</span></div><div class="pda"><button class="btn sm" data-tab="assign" type="button">العودة للإسناد</button></div></div>` : '';
  m.innerHTML = '<div id="pendBox"></div>' + roNote + (typeof termBanner === 'function' ? termBanner(p.k) : '') + stageHero(p) + `<div class="sbody">${tasksHtml(p.k)}${({ daily: vDaily, today: vToday, home: vHome, settings: vSettings, schedule: vSchedule, committees: vCommittees, files: vFiles, staff: vStaff, assign: vAssign, forms: vForms, backup: vBackup })[TAB]()}</div>` + stageNext(p);
  const cards = $$('.sbody > section.card > h2', m).filter(h => !/^(حذف|إعادة الضبط)/.test(h.textContent.trim()));
  if (cards.length >= 3 && TAB !== 'home') { const j = document.createElement('nav'); j.className = 'jump'; j.setAttribute('aria-label', 'أقسام الصفحة');
    j.innerHTML = cards.map((h, i) => { h.parentElement.id = h.parentElement.id || 'sec_' + i; return `<button type="button" data-jump="${h.parentElement.id}">${esc(h.textContent.replace(/[:：]\s*$/, '').trim())}</button>`; }).join('');
    const tk = $('.sbody > .tasks', m); if (tk) tk.after(j); else $('.sbody', m).prepend(j); }
  $$('.brand-hdr').forEach(i => i.src = HDR); $$('.brand-ftr').forEach(i => i.src = FTR);
  pendShow(); injectHelp(m); { const hp = $('#hlpPop'); if (hp) hp.remove(); }
  { const sc = $('#setChip'); if (sc) sc.hidden = ROLE === 'sup'; }
  if (TAB === 'forms') renderPreview();
  if (TAB === 'files') renderStuTable();
  if (TAB === 'home') setTimeout(renderThumbs, 30);
}
function inp(path, val, o = {}) {
  const t = o.type || 'text';
  return `<input class="in${o.cls ? ' ' + o.cls : ''}" type="${t}" data-k="${path}"${o.num ? ' data-num="1"' : ''} value="${esc(val)}"${o.ph ? ` placeholder="${esc(o.ph)}"` : ''}${o.list ? ` list="${o.list}"` : ''}${o.style ? ` style="${o.style}"` : ''} id="f_${path.replace(/\./g, '_')}">`;
}
function getPath(path) { return path.split('.').reduce((o, k) => o == null ? o : o[k], S); }
function setPath(path, val) {
  if (path === 'daily.ui.addAbs') { if (val && val !== '__other') W(dIso()).blocks.push({ abs: val, rows: {} }); return; }
  { const m = /^daily\.duty\.(\d{4}-\d\d-\d\d)\./.exec(path); if (m && !D().duty[m[1]]) D().duty[m[1]] = U(m[1]); }
  { const m = /^daily\.wait\.(\d{4}-\d\d-\d\d)\./.exec(path); if (m) W(m[1]); }
  const ks = path.split('.'); let o = S;
  for (let i = 0; i < ks.length - 1; i++) { if (o[ks[i]] == null || typeof o[ks[i]] !== 'object') o[ks[i]] = /^\d+$/.test(ks[i + 1]) ? [] : {}; o = o[ks[i]]; }
  o[ks[ks.length - 1]] = val;
}
const AR = new Intl.Collator('ar', { sensitivity: 'base', ignorePunctuation: true });
function arSort(list) { return list.slice().sort((a, b) => AR.compare(normName(a), normName(b)) || AR.compare(a, b)); }
function allTeachers() {
  const m = new Map(); [...S.ta.map(x => x.t), ...S.st.map(x => x.t), ...S.teachers].forEach(n => { n = String(n || '').trim(); if (n && !m.has(normName(n))) m.set(normName(n), n); });
  return arSort([...m.values()]);
}
/* قائمة منسدلة مرنة: خيارات جاهزة + «كتابة اسم آخر» تتحول لخانة كتابة */
function pickSel(path, val, groups, o = {}) {
  val = String(val == null ? '' : val).trim();
  if (!Array.isArray(groups[0] && groups[0].items)) groups = [{ items: groups }];
  const seen = new Set(), nv = normName(val), pk = o.kind === 's' ? null : personKey(val); let found = false;
  const same = x => val && (normName(x) === nv || (pk && personKey(x) === pk));
  const sk = x => { let k = normName(x); if (o.kind === 's') k = k.replace(/^ال/, ''); return k; };
  const grp = groups.map(g => { const it = g.items.filter(x => { const k = normName(x); if (!x || seen.has(k)) return false; seen.add(k); return true; }).sort((a, b) => AR.compare(sk(a), sk(b)) || AR.compare(a, b));
    const opts = it.map(x => { const sel = !found && same(x); if (sel) found = true; return `<option value="${esc(x)}"${sel ? ' selected' : ''}>${esc(x)}</option>`; }).join('');
    return it.length ? (g.label ? `<optgroup label="${esc(g.label)}">${opts}</optgroup>` : opts) : ''; }).join('');
  const extra = val && !found ? `<option value="${esc(val)}" selected>${esc(val)}</option>` : '';
  return `<span class="pwrap"><select class="in psel${val ? '' : ' empty'}" data-k="${path}" data-pick="${o.kind || 't'}" id="ps_${path.replace(/[^\w]/g, '_')}"${o.title ? ` title="${esc(o.title)}"` : ''}><option value="">${o.ph || '— اختر —'}</option>${extra}${grp}<option value="__other">✎ ${o.other || 'كتابة اسم آخر…'}</option></select><button type="button" class="pov" data-act="pickOpen" tabindex="-1" aria-hidden="true"></button></span>`;
}
/* قائمة المعلمين للاختيار: قائمة المدرسة أولاً، ثم من في الإسناد غير الموجود فيها (بلا تكرار الاسم المختصر والكامل) */
function tchAll() { const out = [...S.teachers]; const has = sameTeacher(out); allTeachers().forEach(n => { if (!has(n)) { out.push(n); } }); const seen = new Set(); return arSort(out.filter(n => { const k = personKey(n); if (seen.has(k)) return false; seen.add(k); return true; })); }
function tchOpts(first, firstLabel) { const all = tchAll(); return first && first.length ? [{ label: firstLabel, items: first }, { label: 'جميع المعلمين', items: all }] : [{ items: all }]; }
function subOpts(g) { const sched = []; S.days.forEach(d => d.p.forEach(p => { const s = (p.s[g] || '').trim(); if (s) sched.push(s); })); const ta = S.ta.filter(x => +x.g === +g).map(x => x.sub); return [{ label: 'الخطة الدراسية', items: currList(g) }, { label: 'من الإسناد والجدول', items: [...ta, ...sched] }]; }
/* نافذة اختيار مع بحث (تفتح بدل القائمة الأصلية) */
function openPicker(sel) {
  const groups = []; let cur = { label: '', items: [] }; groups.push(cur);
  Array.from(sel.children).forEach(n => {
    if (n.tagName === 'OPTGROUP') { cur = { label: n.label, items: Array.from(n.children).map(o => o.value) }; groups.push(cur); cur = { label: '', items: [] }; groups.push(cur); }
    else if (n.value && n.value !== '__other') cur.items.push(n.value);
  });
  const isSub = sel.dataset.pick === 's', ph = (sel.options[0] && sel.options[0].textContent || '').replace(/[—\-]/g, '').trim() || 'اختر';
  let m = $('#pickModal'); if (!m) { m = document.createElement('div'); m.id = 'pickModal'; m.className = 'pickm'; document.body.appendChild(m); }
  m.innerHTML = `<div class="pickbox" role="dialog" aria-label="${esc(ph)}"><div class="pickh"><b>${esc(ph)}</b><button type="button" class="x" data-pk="close" aria-label="إغلاق">×</button></div>
    <input class="in pickq" type="search" placeholder="${isSub ? 'ابحث عن مادة…' : 'ابحث بالاسم… مثل: فهد أو المالكي'}" autocomplete="off">
    <div class="pickl"></div>
    <div class="pickf"><button type="button" class="btn sm ghost" data-pk="clear">${isSub ? 'بدون مادة' : 'بدون اسم'}</button><button type="button" class="btn sm" data-pk="other">✎ ${isSub ? 'كتابة مادة أخرى' : 'كتابة اسم آخر'}</button></div></div>`;
  const q = $('.pickq', m), list = $('.pickl', m), curV = sel.value;
  /* ترتيب هجائي (تُهمل «ال» في المواد)، والبحث يبدأ بالحرف الأول */
  const key = v => { let k = normName(v); if (isSub) k = k.replace(/^ال/, ''); return k; };
  const cmp = (a, b) => AR.compare(key(a), key(b));
  groups.forEach(g => g.items.sort(cmp));
  const item = v => `<button type="button" class="picki${v === curV ? ' on' : ''}" data-v="${esc(v)}">${esc(v)}</button>`;
  const draw = () => {
    const qs = normName(q.value).trim(), qk = isSub ? qs.replace(/^ال/, '') : qs, seen = new Set(); let html = '';
    if (!qs) {
      groups.forEach(g => { const it = g.items.filter(v => { const k = normName(v); if (seen.has(k)) return false; seen.add(k); return true; }); if (!it.length) return;
        html += g.label ? `<div class="pickg">${esc(g.label)}</div>` : ''; let L = '';
        it.forEach(v => { const l = key(v).charAt(0); if (it.length > 8 && l !== L) { L = l; html += `<div class="pickl1">${esc(l)}</div>`; } html += item(v); }); });
    } else {
      const all = []; groups.forEach(g => g.items.forEach(v => { const k = normName(v); if (!seen.has(k)) { seen.add(k); all.push(v); } }));
      const words = qk.split(' ').filter(Boolean);
      const rank = v => { const k = key(v), ws = k.split(' ');
        if (k.startsWith(qk)) return 0;                                   /* يبدأ الاسم بما كُتب */
        if (words.length === 1 && ws.some(w => w.startsWith(qk) || w.replace(/^ال/, '').startsWith(qk))) return 1; /* يبدأ أحد أجزاء الاسم به (مثل اسم العائلة) */
        if (words.every(w => ws.some(x => x.startsWith(w) || x.replace(/^ال/, '').startsWith(w)))) return 2;
        return qk.length > 1 && words.every(w => k.includes(w)) ? 3 : 9; };
      const r = all.map(v => [v, rank(v)]).filter(x => x[1] < 9).sort((a, b) => a[1] - b[1] || cmp(a[0], b[0]));
      const lbl = ['يبدأ بـ «' + q.value.trim() + '»', isSub ? 'كلمة في اسم المادة تبدأ به' : 'اسم العائلة أو جزء من الاسم يبدأ به', 'مطابقة جزئية', 'يحتوي على ما كُتب'];
      let last = -1; r.forEach(([v, k]) => { if (k !== last && (k > 0 || r.some(x => x[1] > 0))) { html += `<div class="pickg">${esc(lbl[k])}</div>`; } last = k; html += item(v); });
    }
    list.innerHTML = html || `<p class="hint pickn">لا توجد نتيجة${q.value.trim() ? ` — اضغط «${isSub ? 'كتابة مادة أخرى' : 'كتابة اسم آخر'}» لإضافة «${esc(q.value.trim())}»` : ''}</p>`;
  };
  const sc = getComputedStyle($('#main')).getPropertyValue('--sc').trim(); if (sc) m.style.setProperty('--accent', sc);
  draw(); m.hidden = false; document.body.classList.add('nosc');
  setTimeout(() => { const on = $('.picki.on', list); if (on) on.scrollIntoView({ block: 'center' }); if (!/Mobi|iPhone|Android/i.test(navigator.userAgent)) q.focus(); }, 30);
  const close = () => { m.hidden = true; m.innerHTML = ''; document.body.classList.remove('nosc'); };
  const choose = v => { if (v && !Array.from(sel.options).some(o => o.value === v)) { const o = document.createElement('option'); o.value = v; o.textContent = v; sel.insertBefore(o, sel.lastElementChild); } sel.value = v; close(); sel.dispatchEvent(new Event('change', { bubbles: true })); };
  q.oninput = draw;
  q.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); const f = $('.picki', list); if (f) choose(f.dataset.v); else if (q.value.trim()) choose(q.value.trim()); } if (e.key === 'Escape') close(); };
  m.onclick = e => { if (e.target === m) return close(); const b = e.target.closest('[data-v],[data-pk]'); if (!b) return;
    if (b.dataset.v != null) return choose(b.dataset.v);
    if (b.dataset.pk === 'close') return close(); if (b.dataset.pk === 'clear') return choose('');
    if (b.dataset.pk === 'other') { if (q.value.trim()) return choose(q.value.trim()); close(); pickOther(sel); } };
}
function pickOther(el) {
  const i = document.createElement('input'); i.className = 'in'; i.dataset.k = el.dataset.k; i.id = el.id; i.placeholder = el.dataset.pick === 's' ? 'اكتب اسم المادة' : 'اكتب الاسم';
  const prev = getPath(el.dataset.k); i.value = prev && prev !== '__other' ? prev : ''; (el.closest('.pwrap') || el).replaceWith(i); i.focus();
}
function teacherDatalist() {
  return `<datalist id="tlist">${allTeachers().map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>`;
}

/* ----- الإعدادات ----- */
function vSettings() {
  const s = S.s;
  const fc = [['doc', 'تصميم الملف المرفق (أزرق ← أخضر)'], ['green', 'أخضر'], ['ministry', 'أزرق ← أخضر (هوية الوزارة)'], ['crimson', 'قرمزي'], ['greencrimson', 'أخضر ← قرمزي']];
  return `
  <section class="card">
    <h2>الكليشة الموحدة</h2>
    <p class="hint">تظهر هذه الكليشة أعلى كل نموذج، والشريط السفلي يحمل العام الدراسي. أي تعديل هنا ينعكس على جميع النماذج.</p>
    <div class="brandprev"><img class="brand-hdr" alt="الكليشة"><img class="brand-ftr" alt="الشريط السفلي"></div>
    <div class="grid">
      <label>اسم المدرسة ${inp('s.school', s.school, { cls: 'br' })}</label>
      <label>السطر الأول ${inp('s.l1', s.l1, { cls: 'br' })}</label>
      <label>السطر الثاني ${inp('s.l2', s.l2, { cls: 'br' })}</label>
      <label>السطر الثالث (إدارة التعليم) ${inp('s.l3', s.l3, { cls: 'br' })}</label>
      <label>سطر إضافي (اختياري) ${inp('s.l4', s.l4, { cls: 'br', ph: 'مثال: قسم التعليم المستمر' })}</label>
      <label>العام الدراسي ${inp('s.yearTxt', s.yearTxt, { cls: 'br', ph: '1448 هـ' })}</label>
      <label>الفصل الدراسي ${inp('s.sem', s.sem, { cls: 'br' })}</label>
      <label>الدور ${inp('s.round', s.round, { cls: 'br' })}</label>
      <label class="wide">نص الشريط السفلي (اتركه فارغاً ليُكتب «العام الدراسي ${esc(s.yearTxt)}») ${inp('s.footTxt', s.footTxt, { cls: 'br' })}</label>
    </div>
    <div class="row-label">لون الشريط السفلي</div>
    <div class="chips">${fc.map(([k, t]) => `<button type="button" class="chip${s.footColor === k ? ' on' : ''}" data-act="footColor" data-v="${k}"><i style="background:linear-gradient(90deg,${FOOT_COLORS[k][0]},${FOOT_COLORS[k][1]})"></i>${t}</button>`).join('')}</div>
  </section>
  <section class="card">
    <h2>التاريخ في النماذج</h2>
    <div class="chips">${[['h', 'هجري (أم القرى)'], ['g', 'ميلادي'], ['both', 'هجري وميلادي معاً']].map(([k, t]) => `<button type="button" class="chip${s.dateMode === k ? ' on' : ''}" data-act="dateMode" data-v="${k}">${t}</button>`).join('')}</div>
    <p class="hint">يمكن إدخال كل يوم بالهجري أو بالميلادي من صفحة «جدول الاختبارات» ويتحول الآخر تلقائياً.</p>
  </section>
  <section class="card">
    <h2>التواقيع والمسؤولون</h2>
    <div class="grid">
      <label>مدير المدرسة ${inp('s.principal', s.principal)}</label>
      <label>وكيل الشؤون التعليمية ${inp('s.eduDep', s.eduDep)}</label>
      <label>وكيل شؤون الطلاب ${inp('s.stuDep', s.stuDep)}</label>
    </div>
    <div class="row-label">أعضاء لجنة فتح مظاريف الأسئلة</div>
    <div class="tw"><table class="et"><tr><th>الاسم</th><th>العمل</th><th>الصفة</th><th></th></tr>
    ${s.openMembers.map((m, i) => `<tr><td>${inp(`s.openMembers.${i}.n`, m.n)}</td><td>${inp(`s.openMembers.${i}.w`, m.w)}</td><td>${inp(`s.openMembers.${i}.r`, m.r)}</td><td><button class="x" data-act="delOpen" data-i="${i}" type="button" title="حذف">×</button></td></tr>`).join('')}
    </table></div>
    <div class="acts"><button class="btn sm" data-act="addOpen" type="button">إضافة عضو</button>
    <label class="ck"><input type="checkbox" data-k="s.openWithTeachers" data-bool="1" ${s.openWithTeachers ? 'checked' : ''}> إضافة معلمي مواد الفترة تلقائياً إلى المحضر</label></div>
  </section>
  <section class="card">
    <h2>الصفوف والشعب</h2>
    <div class="tw"><table class="et"><tr><th>الصف</th><th>رقم الصف في ملف نور</th><th>إضافة للشعبة</th><th>بداية أرقام الجلوس</th><th>العدد اليدوي (عند عدم رفع ملف)</th><th>وصف تحت اسم الصف في الجدول</th></tr>
    ${G.map(g => `<tr><td><b>${GNAME[g]}</b></td><td>${inp(`s.codes.${g}`, s.codes[g])}</td><td>${inp(`s.secOff.${g}`, s.secOff[g], { num: 1, type: 'number' })}</td><td>${inp(`s.seatStart.${g}`, s.seatStart[g], { num: 1, type: 'number' })}</td><td>${inp(`s.manualTot.${g}`, s.manualTot[g], { num: 1, type: 'number' })}</td><td>${inp(`s.gsub.${g}`, s.gsub[g])}</td></tr>`).join('')}
    </table></div>
    <p class="hint">الصف 1314 = الأول ثانوي (شعب 1–8)، و1416 = الثاني ثانوي (شعب 11–18)، و1516 = الثالث ثانوي (شعب 21–28). يُضاف رقم «إضافة للشعبة» إلى رقم الفصل في ملف نور تلقائياً.</p>
  </section>
  <section class="card">
    <h2>تعليمات مهمة للاختبار</h2>
    <p class="hint">تُطبع أسفل الجدول العام. كل سطر تعليمة مستقلة.</p>
    <textarea class="in ta" data-k="s.instr" rows="8" id="f_instr">${esc(s.instr)}</textarea>
    <div class="grid">
      <label>آخر موعد لتسليم الأسئلة (لخطاب التكليف) ${inp('s.deadline', s.deadline, { ph: 'مثال: الأربعاء 17 / 12 / 1447 هـ' })}</label>
      <label>درجة الاختبار الافتراضية ${inp('s.mark', s.mark, { num: 1, type: 'number' })}</label>
    </div>
  </section>`;
}

/* ----- الجدول ----- */
function vSchedule() {
  return `
  <section class="card">
    <h2>أيام الاختبار والفترات</h2>
    ${typeof examCalBox === 'function' ? examCalBox() : ''}
    <p class="hint">أدخل التاريخ بالميلادي من التقويم أو اكتب اليوم/الشهر/السنة بالهجري؛ يتحول الآخر تلقائياً ويُكتب اسم اليوم من التاريخ. خانة «نص يدوي» تتجاوز التحويل إن أردت كتابة التاريخ كما تشاء.</p>
    <div class="acts wrap">
      <label class="inl">تاريخ أول يوم: <input class="in" type="date" id="genStart" value="${S.days[0] ? S.days[0].g : ''}"></label>
      <label class="ck"><input type="checkbox" id="genSkip" checked> تخطي الجمعة والسبت</label>
      <button class="btn sm" data-act="genDates" type="button">ترقيم التواريخ تلقائياً</button>
      <button class="btn sm pri" data-act="addDay" type="button">إضافة يوم</button>
    </div>
  </section>
  ${S.days.map((d, di) => {
    const h = toHijri(d.g);
    return `<section class="card day">
      <div class="dayhead">
        <span class="dname">${dayName(d)}</span>
        <label class="inl">ميلادي <input class="in" type="date" data-act-change="dayG" data-i="${di}" value="${d.g}" id="dg${di}"></label>
        <label class="inl">هجري
          <input class="in n2" type="number" min="1" max="30" data-act-change="dayH" data-i="${di}" data-part="2" value="${h[2]}" id="dh2${di}"> /
          <input class="in n2" type="number" min="1" max="12" data-act-change="dayH" data-i="${di}" data-part="1" value="${h[1]}" id="dh1${di}"> /
          <input class="in n4" type="number" min="1400" max="1600" data-act-change="dayH" data-i="${di}" data-part="0" value="${h[0]}" id="dh0${di}">
        </label>
        <label class="inl">نص يدوي ${inp(`days.${di}.txt`, d.txt, { ph: 'اختياري', style: 'width:9rem' })}</label>
        <span class="prevdate">يظهر في النماذج: <b>${dateTxt(d, ' — ')}</b></span>
        <span class="sp1"></span>
        <button class="btn sm ghost" data-act="moveDay" data-i="${di}" data-d="-1" type="button" title="تحريك لأعلى">↑</button>
        <button class="btn sm ghost" data-act="moveDay" data-i="${di}" data-d="1" type="button" title="تحريك لأسفل">↓</button>
        <button class="btn sm danger" data-act="delDay" data-i="${di}" type="button">حذف اليوم</button>
      </div>
      <div class="tw"><table class="et"><tr><th>الفترة</th><th>الوقت</th>${G.map(g => `<th style="background:${GCOL[g]}">${GNAME[g]}</th>`).join('')}<th></th></tr>
      ${d.p.map((p, pi) => `<tr><td>${inp(`days.${di}.p.${pi}.n`, p.n, { style: 'width:6rem' })}</td><td>${inp(`days.${di}.p.${pi}.t`, p.t, { style: 'width:7rem' })}</td>
        ${G.map(g => `<td>${pickSel(`days.${di}.p.${pi}.s.${g}`, p.s[g] || '', subOpts(g), { kind: 's', ph: '— بدون اختبار —', other: 'كتابة مادة أخرى…' })}</td>`).join('')}
        <td><button class="x" data-act="delPer" data-i="${di}" data-j="${pi}" type="button" title="حذف الفترة">×</button></td></tr>`).join('')}
      </table></div>
      <button class="btn sm" data-act="addPer" data-i="${di}" type="button">إضافة فترة</button>
    </section>`;
  }).join('')}
  ${G.map(g => `<datalist id="subl${g}">${[...new Set(S.st.filter(x => +x.g === g).map(x => x.sub))].map(v => `<option value="${esc(v)}"></option>`).join('')}</datalist>`).join('')}`;
}

/* ----- اللجان ----- */
function vCommittees() {
  const ct = comTotals(), gt = gradeTotals(), src = S.students.length ? 'من ملف الطلاب المرفوع' : 'من الأعداد اليدوية في الإعدادات';
  const warn = G.filter(g => ct[g] !== gt[g]);
  return `
  <section class="card">
    <h2>اللجان وأعداد الطلاب فيها</h2>
    ${qbar('comCounts', 'أعداد الطلاب في اللجان:')}
    ${qbar('comPlaces', 'مقرات اللجان:')}
    ${qbar('sticker', 'كروكي اللجان:')}
    <details class="impd"><summary>استيراد اللجان من ملف Word أو PDF أو Excel</summary>
      <p class="hint">يقبل جدول «أعداد الطلاب في اللجان» (رقم اللجنة، المقر، أول، ثاني، ثالث) فيستبدل اللجان وأعدادها، أو جدول «مقرات اللجان» فيحدّث الأدوار والمقرات فقط دون تغيير الأعداد.</p>
      <div class="drops one">${dropZone('com', 'ملف اللجان', 'Word (‎.docx/.doc) أو PDF أو Excel', '.docx,.doc,.pdf,.xlsx,.xls,.csv')}</div><div id="upMsg"></div>
    </details>
    <div class="stats">${G.map(g => `<div class="stat" style="--gc:${GCOL[g]}"><span>${GNAME[g]}</span><b>${gt[g]}</b><small>في اللجان: ${ct[g]}</small></div>`).join('')}
      <div class="stat"><span>المجموع</span><b>${gt[1] + gt[2] + gt[3]}</b><small>في اللجان: ${ct.all}</small></div></div>
    <p class="hint">أعداد الصفوف ${src}. ${warn.length ? `<span class="warnt">يوجد فرق في: ${warn.map(g => GSHORT[g]).join('، ')} – اضغط «توزيع الأعداد تلقائياً».</span>` : '<span class="okt">أعداد اللجان مطابقة لأعداد الطلاب.</span>'}</p>
    <div class="acts wrap">
      <button class="btn sm pri" data-act="autoCounts" type="button">توزيع الأعداد تلقائياً حسب سعة كل لجنة</button>
      <button class="btn sm" data-act="distribute" type="button"${S.students.length ? '' : ' disabled'}>توزيع الطلاب بالأسماء وإعطاء أرقام الجلوس</button>
      <label class="inl">ترتيب الطلاب داخل الصف:
        <select class="in" data-k="s.stuSort" id="f_stuSort"><option value="section"${S.s.stuSort === 'section' ? ' selected' : ''}>حسب الشعبة ثم الاسم</option><option value="name"${S.s.stuSort === 'name' ? ' selected' : ''}>حسب الاسم أبجدياً</option></select></label>
      <button class="btn sm" data-act="addCom" type="button">إضافة لجنة</button>
    </div>
    ${S.distributed ? '<p class="okt">تم توزيع الطلاب على اللجان وإعطاؤهم أرقام الجلوس. كشوف المناداة وكروكي اللجان أصبحت تحمل الأسماء والأرقام.</p>' : ''}
    <div class="tw"><table class="et com"><tr><th>رقم اللجنة</th><th>الدور / المبنى</th><th>المقر (الشعبة)</th><th>السعة</th>${G.map(g => `<th style="background:${GCOL[g]}">${GSHORT[g]}</th>`).join('')}<th>المجموع</th><th></th></tr>
    ${S.com.map((c, i) => `<tr><td>${inp(`com.${i}.no`, c.no, { num: 1, type: 'number', style: 'width:4.5rem' })}</td><td>${inp(`com.${i}.fl`, c.fl)}</td><td>${inp(`com.${i}.rm`, c.rm)}</td><td>${inp(`com.${i}.cap`, c.cap, { num: 1, type: 'number', style: 'width:4.5rem' })}</td>
      ${G.map(g => `<td>${inp(`com.${i}.c.${g}`, c.c[g], { num: 1, type: 'number', style: 'width:4.5rem' })}</td>`).join('')}<td class="sum" data-sum="${i}">${comSum(c)}</td>
      <td><button class="x" data-act="delCom" data-i="${i}" type="button" title="حذف اللجنة">×</button></td></tr>`).join('')}
    <tr class="tot"><td colspan="4">المجموع</td>${G.map(g => `<td>${ct[g]}</td>`).join('')}<td>${ct.all}</td><td></td></tr></table></div>
  </section>`;
}

/* ----- الطلاب ----- */
const STU_COLS = [['i', 'م'], ['n', 'اسم الطالب'], ['id', 'رقم الطالب'], ['g', 'الصف'], ['sec', 'الشعبة'], ['ph', 'رقم الجوال'], ['ph2', 'جوال ملف الإرشاد'], ['seat', 'رقم الجلوس'], ['com', 'رقم اللجنة'], ['sig', 'التوقيع'], ['note', 'ملاحظات']];
let SF = { src: 'noor', g: 'all', sec: 'all', q: '', cols: ['i', 'n', 'g', 'sec', 'ph'], sort: 'section', split: 'section', rpp: 30, title: '' };
try { Object.assign(SF, JSON.parse(localStorage.getItem(LS_KEY + '-sf') || '{}')); } catch (e) { }
function saveSF() { try { localStorage.setItem(LS_KEY + '-sf', JSON.stringify(SF)); } catch (e) { } }
function srcList() {
  if (SF.src === 'guide') return S.guide.map(x => ({ n: x.n, ph: x.ph, ph2: '', g: x.g || 0, sec: x.sec || 0, id: '', seat: null, com: null }));
  return S.students;
}
function gname(g) { return GNAME[g] || 'غير محدد الصف'; }
function filteredStudents() {
  let l = srcList().filter(x => (SF.g === 'all' || x.g === +SF.g) && (SF.sec === 'all' || x.sec === +SF.sec));
  if (SF.q.trim()) { const q = normName(SF.q); l = l.filter(x => normName(x.n).includes(q) || String(x.ph).includes(SF.q.trim()) || String(x.id).includes(SF.q.trim())); }
  const so = SF.sort;
  l.sort((a, b) => so === 'name' ? a.n.localeCompare(b.n, 'ar') : so === 'seat' ? (a.seat || 0) - (b.seat || 0) : (a.g - b.g || a.sec - b.sec || a.n.localeCompare(b.n, 'ar')));
  return l;
}
function fileCard(slot, o) {
  const u = S.uploads[slot];
  return `<article id="fc_${slot}" class="fcard${u || o.has ? ' done' : ''}" style="--fc:${o.c}">
    <div class="fhead"><span class="fnum">${o.n}</span><div><h3>${o.t}</h3><p>${o.d}</p></div></div>
    <div class="ffacts">${o.facts}</div>
    ${o.noUp ? '' : dropZone(slot, u ? 'تحديث الملف' : 'رفع الملف', o.fmt, o.accept)}
    ${o.out ? `<div class="fout"><span>تحميل:</span>${o.out}</div>` : ''}
  </article>`;
}
function ttCard(n) {
  const t = S.daily && S.daily.tt, tot = t ? t.teachers.reduce((a, x) => a + Object.keys(x.c).length, 0) : 0;
  return fileCard('tt', { n, c: '#0e7490', t: 'الجدول المدرسي العام', d: 'جدول حصص المعلمين (الأيام والحصص والشعب) — تُبنى عليه حصص الانتظار والمناوبة ومعرفة المتاحين.', has: !!t, fmt: 'PDF أو Excel أو Word (تصدير aSc أو غيره)', accept: '.pdf,.xlsx,.xls,.csv,.docx,.doc',
    facts: t ? `<b>${t.teachers.length}</b><span>معلماً</span><em>${tot} حصة أسبوعياً</em>` : '<span class="fnone">لم يُرفع بعد</span>',
    out: (t ? `<button class="btn sm" data-act="ttOpen" type="button">عرض الجدول</button><button class="btn sm" data-tab="daily" type="button">الانتظار والمناوبة ←</button>` : '') + ttNextBox() });
}
function ttNextBox() {
  const d = S.daily || {}, n = d.ttNext, p = d.ttPrev;
  return `<div class="ttnext"><b>جدول الفصل القادم</b>${n ? `<p class="hint">${n.teachers.length} معلماً — ${esc(n.src || '')} · محفوظ للمراجعة، ولا يؤثر على الانتظار الحالي.</p><div class="acts wrap" style="margin:0"><button class="btn sm" data-act="ttnView" type="button">عرضه</button><button class="btn sm pri" data-act="ttnApply" type="button">اعتماده الآن</button><button class="btn sm ghost" data-act="ttnDel" type="button">حذفه</button></div>`
    : `<p class="hint">جهّز جدول الفصل القادم مسبقاً دون أن يمس الجدول الحالي، ثم اعتمده بضغطة عند بداية الفصل.</p>${dropZone('ttn', 'رفع جدول الفصل القادم', 'PDF أو Excel أو Word', '.pdf,.xlsx,.xls,.csv,.docx,.doc')}`}
    ${p ? `<p class="hint" style="margin-top:6px">الجدول السابق محفوظ (${esc(p.src || '')}). <button class="btn sm ghost" data-act="ttPrev" type="button">استرجاعه</button></p>` : ''}<div id="upMsg_ttn"></div></div>`;
}
function vFiles() {
  const t = stuTotals(), n = S.students.length, gm = S.guide.filter(x => x.g).length;
  const agentOnly = ROLE === 'agent';
  const cards = `<div class="fcards">
    ${fileCard('noor', { n: 1, c: '#2563eb', t: 'ملف نور', d: 'قائمة الطلاب بالصف والشعبة — يُبنى عليها الحصر واللجان وأرقام الجلوس.', has: n > 0, fmt: 'Excel من نظام نور (‎.xls/.xlsx)', accept: '.xls,.xlsx,.csv',
      facts: n ? `<b>${n}</b><span>طالباً</span><em>أول ${t[1]} · ثاني ${t[2]} · ثالث ${t[3]}</em>` : '<span class="fnone">لم يُرفع بعد</span>',
      out: n ? `<button class="btn sm" data-act="stuExcelAll" type="button">Excel</button><button class="btn sm" data-act="jumpStu" data-f="pdf" type="button">PDF</button><button class="btn sm" data-act="jumpStu" data-f="word" type="button">Word</button><button class="btn sm" data-act="jumpStu" data-f="print" type="button">طباعة</button>` : '' })}
    ${fileCard('guide', { n: 2, c: '#0891b2', t: 'ملف الإرشاد الطلابي', d: 'أسماء الطلاب وأرقام جوالات أولياء الأمور — يُطابَق بالاسم مع ملف نور.', has: S.guide.length > 0, fmt: 'Excel (‎.xls/.xlsx)', accept: '.xls,.xlsx,.csv',
      facts: S.guide.length ? `<b>${S.guide.length}</b><span>اسماً</span><em>${n ? `طوبق ${gm} مع ملف نور` : 'ارفع ملف نور للمطابقة'}</em>` : '<span class="fnone">لم يُرفع بعد</span>',
      out: S.guide.length ? `<button class="btn sm" data-act="guideExcel" type="button">Excel</button><button class="btn sm" data-act="jumpStu" data-f="phones" type="button">كشف الجوالات</button>` : '' })}
    ${fileCard('tch', { n: 3, c: '#7c3aed', t: 'قائمة المعلمين', d: 'معلمو المدرسة — تنعكس في الإسناد والملاحظة وكشوف التوقيع. حدّثها متى تغيّر المعلمون.', has: S.teachers.length > 0, fmt: 'Excel أو Word أو PDF — مع مراجعة قبل الاعتماد', accept: '.xlsx,.xls,.csv,.docx,.doc,.pdf,.txt',
      facts: S.teachers.length ? `<b>${S.teachers.length}</b><span>معلماً</span><em>${S.ta.length ? (() => { const inTa = sameTeacher(S.ta.map(x => x.t)); const k = S.teachers.filter(inTa).length; return `${k} منهم في الإسناد${S.teachers.length - k ? ` · ${S.teachers.length - k} بلا إسناد` : ''}`; })() : 'لم يُرفع الإسناد بعد'}</em>` : '<span class="fnone">القائمة فارغة</span>',
      out: `<button class="btn sm" data-act="tchTpl" type="button">Excel</button><button class="btn sm" data-act="qpdf" data-form="tList" type="button">PDF</button><button class="btn sm" data-act="qword" data-form="tList" type="button">Word</button><button class="btn sm" data-act="qopen" data-form="tList" type="button">معاينة وطباعة</button>` })}
    ${ttCard(4)}
    ${calCard(5)}
  </div><div id="upMsg"></div><div id="upMsg_tch"></div><div id="upMsg_tt"></div><div id="upMsg_cal"></div>`;
  const tlist = `<section class="card" id="tchCard">
    <h2>قائمة المعلمين — تعديل يدوي</h2>
    <p class="hint">اسم في كل سطر. تُضاف أسماء معلمي الإسناد تلقائياً، وكل قوائم اختيار المعلمين في الموقع مرتبة هجائياً.</p>
    ${qbar('tList', 'كشف بأسماء المعلمين:')}
    ${qbar('obsInstr', 'تعليمات الملاحظين مع التوقيع:')}
    <div class="acts"><button class="btn sm" data-act="sortTeachers" type="button">ترتيب القائمة هجائياً</button><button class="btn sm ghost" data-act="mergeTeachers" type="button">ضم جميع معلمي الإسناد للقائمة</button></div>
    <details${S.teachers.length ? '' : ' open'}><summary>عرض القائمة وتعديلها (${S.teachers.length})</summary><textarea class="in ta" data-k="teachers" data-lines="1" rows="12" id="f_teachers">${esc(S.teachers.join('\n'))}</textarea></details>
  </section>`;
  if (agentOnly) return `<div class="fcards">${ttCard(2)}${calCard(3, true)}${fileCard('tch', { n: 1, c: PEOPLE.agent.c, t: 'قائمة المعلمين', d: 'معلمو المدرسة لحفظك — تنعكس في الإسناد. حدّثها متى تغيّر المعلمون.', has: S.teachers.length > 0, fmt: 'Excel أو Word أو PDF — مع مراجعة قبل الاعتماد', accept: '.xlsx,.xls,.csv,.docx,.doc,.pdf,.txt', facts: S.teachers.length ? `<b>${S.teachers.length}</b><span>معلماً</span>` : '<span class="fnone">القائمة فارغة</span>', out: `<button class="btn sm" data-act="tchTpl" type="button">Excel</button><button class="btn sm" data-act="qpdf" data-form="tList" type="button">PDF</button><button class="btn sm" data-act="qword" data-form="tList" type="button">Word</button>` })}</div><div id="upMsg_tch"></div><div id="upMsg_tt"></div>` + tlist;
  return cards + vStudents(true) + tlist;
}
function vStudents(noUpload) {
  const t = stuTotals(), n = S.students.length;
  const secs = {}; S.students.forEach(x => { secs[x.g] = secs[x.g] || {}; secs[x.g][x.sec] = (secs[x.g][x.sec] || 0) + 1; });
  const allSecs = G.map(g => Object.keys(secs[g] || {}).map(Number).sort((a, b) => a - b));
  return `${noUpload ? '<!--' : ''}
  <section class="card">
    <h2>رفع ملفات الطلاب</h2>
    <p class="hint">لكل ملف خانته الخاصة. الرفع يحتاج الرمز الخاص، ويمكنك سحب الملف وإفلاته داخل الخانة. البيانات تبقى في متصفح هذا الجهاز ولا تُرسل لأي خادم.</p>
    <div class="drops">
      ${dropZone('noor', 'ملف نور', 'اسم الطالب، رقم الطالب، رقم الصف، الفصل، الجوال — يُبنى عليه حصر الأعداد وتوزيع اللجان وأرقام الجلوس.', '.xls,.xlsx,.csv')}
      ${dropZone('guide', 'ملف الإرشاد الطلابي', 'أسماء الطلاب وأرقام الجوالات — يُطابَق بالاسم مع ملف نور ويُطبع منه كشف الجوالات.', '.xls,.xlsx,.csv')}
    </div>
    <div id="upMsg"></div>
  </section>${noUpload ? '-->' : ''}
  ${n || S.guide.length ? `<section class="card">
    <h2>حصر أعداد الطلاب</h2>
    <div class="stats">${G.map(g => `<div class="stat" style="--gc:${GCOL[g]}"><span>${GNAME[g]}</span><b>${t[g]}</b><small>${allSecs[g - 1].length} شعب</small></div>`).join('')}<div class="stat"><span>إجمالي الطلاب</span><b>${n}</b><small>${S.students.filter(x => x.ph).length} لديهم جوال</small></div></div>
    <div class="tw"><table class="et sm">${G.map(g => `<tr><th style="background:${GCOL[g]}">${GSHORT[g]}</th>${allSecs[g - 1].map(sc => `<td><small>ش ${sc}</small><br><b>${secs[g][sc]}</b></td>`).join('')}<td class="sum">${t[g]}</td></tr>`).join('')}</table></div>
    ${S.guide.length ? `<p class="hint">ملف الإرشاد: ${S.guide.length} اسماً، طوبق منها مع ملف نور ${S.guide.filter(x => x.g).length} (يظهر رقمه في عمود «جوال ملف الإرشاد»)، و${S.guide.filter(x => !x.g).length} اسماً غير موجود في ملف نور. <button class="btn sm ghost" data-act="exportUnmatched" type="button">تصدير غير المطابقين إلى Excel</button></p>` : ''}
  </section>
  <section class="card">
    <h2 id="stuPrintCard">كشوف الطلاب — طباعة وتصدير</h2>
    ${S.guide.length ? `<div class="seg" role="group" aria-label="مصدر الكشف"><button type="button" class="${SF.src !== 'guide' ? 'on' : ''}" data-act="stuSrc" data-v="noor">من ملف نور (${S.students.length})</button><button type="button" class="${SF.src === 'guide' ? 'on' : ''}" data-act="stuSrc" data-v="guide">من ملف الإرشاد (${S.guide.length})</button></div>` : ''}
    <div class="acts wrap">
      <label class="inl">الصف <select class="in" data-sf="g" id="sf_g"><option value="all">جميع الصفوف</option>${G.map(g => `<option value="${g}"${SF.g == g ? ' selected' : ''}>${GNAME[g]}</option>`).join('')}</select></label>
      <label class="inl">الشعبة <select class="in" data-sf="sec" id="sf_sec"><option value="all">جميع الشعب</option>${G.filter(g => SF.g === 'all' || +SF.g === g).map(g => allSecs[g - 1].map(sc => `<option value="${sc}"${SF.sec == sc ? ' selected' : ''}>${sc}</option>`).join('')).join('')}</select></label>
      <label class="inl">بحث <input class="in" data-sf="q" id="sf_q" value="${esc(SF.q)}" placeholder="اسم أو جوال"></label>
      <label class="inl">الترتيب <select class="in" data-sf="sort" id="sf_sort"><option value="section"${SF.sort === 'section' ? ' selected' : ''}>الصف ثم الشعبة ثم الاسم</option><option value="name"${SF.sort === 'name' ? ' selected' : ''}>الاسم</option><option value="seat"${SF.sort === 'seat' ? ' selected' : ''}>رقم الجلوس</option></select></label>
      <label class="inl">التقسيم <select class="in" data-sf="split" id="sf_split"><option value="section"${SF.split === 'section' ? ' selected' : ''}>كل شعبة في صفحة مستقلة</option><option value="grade"${SF.split === 'grade' ? ' selected' : ''}>كل صف في صفحات مستقلة</option><option value="none"${SF.split === 'none' ? ' selected' : ''}>قائمة متصلة</option></select></label>
      <label class="inl">صفوف في الصفحة <input class="in" type="number" min="10" max="45" data-sf="rpp" id="sf_rpp" value="${SF.rpp}" style="width:4.5rem"></label>
      <label class="inl">عنوان الكشف <input class="in" data-sf="title" id="sf_title" value="${esc(SF.title)}" placeholder="كشف أسماء الطلاب"></label>
    </div>
    <div class="row-label">الأعمدة المطبوعة</div>
    <div class="chips">${STU_COLS.map(([k, t]) => `<button type="button" class="chip${SF.cols.includes(k) ? ' on' : ''}" data-act="stuCol" data-v="${k}">${t}</button>`).join('')}</div>
    <div class="acts">
      <button class="btn pri" data-act="stuPv" type="button">معاينة قبل الطباعة</button>
      <button class="btn" data-act="stuPrint" type="button">طباعة</button>
      <button class="btn" data-act="stuPdf" type="button">تحميل PDF</button>
      <button class="btn" data-act="stuWord" type="button">تحميل Word</button>
      <button class="btn" data-act="stuExcel" type="button">تصدير Excel</button>
      <span class="hint" id="stuCount"></span>
    </div>
    <div class="tw" id="stuTable"></div>
  </section>
  <section class="card"><h2>حذف بيانات الطلاب</h2><button class="btn danger sm" data-act="clearStudents" type="button">حذف جميع الطلاب من هذا الجهاز</button></section>` : `<section class="card empty"><h2>لا توجد بيانات طلاب بعد</h2><p>ارفع ملف نور لتظهر هنا أعداد كل صف وشعبة، وتصبح كشوف الأسماء وكشوف المناداة وأرقام الجلوس متاحة. إلى حين ذلك تعتمد النماذج على الأعداد اليدوية في الإعدادات.</p></section>`}`;
}
function dropZone(slot, ttl, desc, accept) {
  const u = S.uploads[slot];
  const ic = slot === 'tt' || slot === 'ttn' ? '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M3 9h18M9 9v12M15 9v12"/>' : slot === 'tch' ? '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 6.5a3 3 0 0 1 0 5.6M18 14.5c1.8.7 3 2.6 3 5"/>' : slot === 'ta' ? '<path d="M8 7h8M8 11h8M8 15h5"/><rect x="4" y="3" width="16" height="18" rx="2"/>' : '<path d="M4 4h16v16H4z"/><path d="M4 9h16M9 4v16"/>';
  return `<div class="drop${u ? ' done' : ''}" data-slot="${slot}">
    <div class="dic"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ic}</svg></div>
    <div class="dtx"><b>${ttl}</b><small>${desc}</small>
    <span class="dst">${u ? `✓ ${esc(u.name)} — ${esc(u.info)} <i>${esc(u.at)}</i>` : 'لم يُرفع بعد — اسحب الملف هنا أو اضغط اختيار'}</span></div>
    <label class="btn ${u ? '' : 'pri'} sm" for="file_${slot}" role="button" tabindex="0">${u ? 'استبدال الملف' : 'اختيار الملف'}</label>
    <input type="file" class="slotfile vh" data-slot="${slot}" id="file_${slot}" accept="${accept}" tabindex="-1">
  </div>`;
}
function stamp() { const d = new Date(); return `${d.getDate()}/${d.getMonth() + 1} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; }
async function processSlot(slot, file) {
  let msg = '', ok = true;
  try {
    if (slot === 'noor') {
      const r = await readExcelFile(file);
      if (r.type !== 'roster') throw new Error('الملف لا يحتوي على عمودي «رقم الصف» و«الفصل». هل اخترت ملف الإرشاد بدلاً من ملف نور؟');
      const x = applyRoster(r.list, 'replace'); const t = stuTotals();
      if (S.guide.length) mergeGuide();
      S.uploads.noor = { name: file.name, at: stamp(), info: `${S.students.length} طالباً` };
      msg = `تم رفع ملف نور: ${S.students.length} طالباً — أول ${t[1]}، ثاني ${t[2]}، ثالث ${t[3]}${x.skipped.length ? ` (تم تجاهل ${x.skipped.length} سطراً بلا صف أو فصل واضح)` : ''}. الخطوة التالية: صفحة «اللجان والأعداد».`;
    } else if (slot === 'guide') {
      const r = await readExcelFile(file);
      if (!r.list.length) throw new Error('لم يُعثر على أسماء وأرقام جوالات في الملف');
      S.guide = r.list.map(x => ({ n: x.n, ph: x.ph || '' }));
      const m = mergeGuide();
      S.uploads.guide = { name: file.name, at: stamp(), info: `${S.guide.length} اسماً` };
      msg = `تم رفع ملف الإرشاد: ${S.guide.length} اسماً${S.students.length ? ` — طوبق ${m.matched} مع ملف نور` : ' — ارفع ملف نور لمطابقة الأسماء بالصف والشعبة'}.`;
    } else if (slot === 'com') {
      const list = await readComFile(file);
      msg = applyComList(list);
      S.uploads.com = { name: file.name, at: stamp(), info: `${list.length} لجنة` };
    } else if (slot === 'gs') {
      const f = await readStatementFile(file);
      S.s.gs = Object.assign({}, S.s.gs, { file: f, src: 'file', include: true });
      S.uploads.gs = { name: file.name, at: stamp(), info: f.kind === 'img' ? `${f.imgs.length} صفحة` : 'جدول' };
      msg = `تم رفع بيان توزيع الدرجات الجديد (${file.name}) وأصبح هو المستخدم في خطابات التكليف. يمكنك العودة للبيان المعتمد من خانة «المصدر».`;
    } else if (slot === 'tt' || slot === 'ttn') {
      const nxt = slot === 'ttn';
      const list = await readTimetable(file);
      const tot = list.reduce((a, x) => a + Object.keys(x.c).length, 0);
      if (list.length < 3 || tot < 10) throw new Error('لم أتمكن من قراءة الجدول. تأكد أن الملف هو «الجدول العام للمعلمين» (صف لكل معلم، وأعمدة الأيام والحصص).');
      const smp = list.slice(0, 3).map(x => `${x.n}: ${Object.keys(x.c).length} حصة`).join('، ');
      if (!(await choiceBox(`قُرئ ${nxt ? 'جدول الفصل القادم' : 'الجدول'}: ${list.length} معلماً و${tot} حصة أسبوعياً (مثل: ${smp}). ${nxt ? 'حفظه جدولاً للفصل القادم دون التأثير على الجدول الحالي؟' : 'اعتماده جدولاً مدرسياً؟'}`, nxt ? 'حفظ للفصل القادم' : 'اعتماد الجدول', 'إلغاء'))) { toast('أُلغي الرفع'); return; }
      if (nxt) { D().ttNext = { teachers: list, src: file.name, at: stamp() }; msg = `حُفظ جدول الفصل القادم (${list.length} معلماً). الجدول الحالي والانتظار لم يتأثرا — اعتمده بضغطة عند بداية الفصل.`; }
      else {
        if (D().tt) D().ttPrev = D().tt;
        D().tt = { teachers: list, src: file.name, at: stamp() };
        S.uploads.tt = { name: file.name, at: stamp(), info: `${list.length} معلماً` };
        msg = `اعتُمد الجدول المدرسي العام: ${list.length} معلماً و${tot} حصة. تظهر الآن الحصص والمتاحون في «الانتظار والمناوبة».`;
      }
    } else if (slot === 'cal') {
      msg = await calUpload(file);
    } else if (slot === 'tch') {
      const found = await readTeacherFile(file);
      if (!found.length) throw new Error('لم يُعثر على أسماء معلمين في الملف. اجعل الأسماء في عمود عنوانه «اسم المعلم» أو اسماً في كل سطر، أو نزّل القالب واملأه.');
      const r = await teacherReview(found, file.name);
      if (!r) { toast('أُلغي الرفع'); return; }
      const before = S.teachers.length;
      if (r.mode === 'replace') S.teachers = arSort(r.names);
      else {
        r.names.forEach(n => {
          const i = S.teachers.findIndex(x => normName(x) === normName(n) || personKey(x) === personKey(n));
          if (i < 0) S.teachers.push(n); else if (normName(n).split(' ').length > normName(S.teachers[i]).split(' ').length) S.teachers[i] = n; /* يُستكمل الاسم الأقصر بالأطول */
        });
        S.teachers = arSort(S.teachers);
      }
      S.uploads.tch = { name: file.name, at: stamp(), info: `${S.teachers.length} معلماً` };
      msg = r.mode === 'replace' ? `اعتُمدت قائمة المعلمين الجديدة: ${S.teachers.length} معلماً (كانت ${before}). القائمة مرتبة هجائياً وتظهر في توزيع الملاحظين وكشوف التوقيع.` : `أُضيف ${S.teachers.length - before} معلماً جديداً — المجموع ${S.teachers.length}.`;
    } else if (slot === 'ta') {
      const list = await readAssignFile(file);
      if (!list.length) throw new Error('لم يُعثر على جدول فيه أعمدة «المعلم» و«المادة». نزّل القالب واملأه ثم ارفعه.');
      S.ta = list; const b = buildStFromTa();
      const tc = new Set(list.map(x => x.t)).size;
      S.uploads.ta = { name: file.name, at: stamp(), info: `${list.length} إسناداً لـ ${tc} معلماً` };
      msg = `تم رفع الإسناد: ${list.length} سطراً لـ ${tc} معلماً. رُبطت ${b.total - b.miss.length} من ${b.total} مادة في الجدول بمعلميها${b.miss.length ? `؛ لم يُعثر على معلم لـ: ${b.miss.join('، ')} — اختره يدوياً من الجدول أدناه` : ''}.`;
    }
  } catch (e) { ok = false; msg = `${file.name}: ${e.message || e}`; }
  save(true); render();
  const box = $('#upMsg_' + slot) || $('#upMsg'); if (box) box.innerHTML = `<p class="upnote ${ok ? 'ok' : 'bad'}">${esc(msg)}</p>`;
  toast(ok ? 'تم الرفع بنجاح' : 'تعذر رفع الملف', !ok);
}
async function pickSlot(slot, files) {
  if (!files || !files.length) return;
  if (!(await unlock('رفع ' + SLOT_NAMES[slot]))) return;
  processSlot(slot, files[0]);
}
document.addEventListener('dragover', e => { const d = e.target.closest && e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.add('over'); } });
document.addEventListener('dragleave', e => { const d = e.target.closest && e.target.closest('.drop'); if (d && !d.contains(e.relatedTarget)) d.classList.remove('over'); });
document.addEventListener('drop', e => { const d = e.target.closest && e.target.closest('.drop'); if (d) { e.preventDefault(); d.classList.remove('over'); pickSlot(d.dataset.slot, e.dataTransfer.files); } });
function renderStuTable() {
  const box = $('#stuTable'); if (!box) return;
  const l = filteredStudents();
  $('#stuCount').textContent = `${l.length} طالباً`;
  const cols = STU_COLS.filter(c => SF.cols.includes(c[0]));
  box.innerHTML = `<table class="et sm"><tr>${cols.map(c => `<th>${c[1]}</th>`).join('')}</tr>${l.slice(0, 300).map((x, i) => `<tr>${cols.map(c => `<td>${stuVal(x, c[0], i)}</td>`).join('')}</tr>`).join('')}</table>${l.length > 300 ? `<p class="hint">يعرض أول 300 فقط هنا؛ الطباعة والتصدير تشمل الجميع (${l.length}).</p>` : ''}`;
}
function stuVal(x, k, i) {
  switch (k) {
    case 'i': return i + 1; case 'n': return esc(x.n); case 'id': return esc(x.id); case 'g': return GSHORT[x.g] || '—'; case 'ph2': return `<span dir="ltr">${fmtPhone(x.ph2)}</span>`;
    case 'sec': return x.sec || '—'; case 'ph': return `<span dir="ltr">${fmtPhone(x.ph)}</span>`; case 'seat': return x.seat || ''; case 'com': return x.com || '';
    default: return '';
  }
}

/* ----- المعلمون والمواد ----- */
let OBS_SEL = '0_0';
function obsList(key) { const v = S.obs[key]; if (Array.isArray(v)) return v; return v ? [v] : []; }
function obsNeed(no) { return Math.max(1, +(S.obsN[no] || S.s.obsDef || 1)); }
let SWAP = null;
function hSelect(i, v) {
  v = String(v || ''); const opts = Array.from({ length: 23 }, (_, k) => String(k + 2)); if (v && !opts.includes(v)) opts.unshift(v);
  return `<select class="in hsel" data-k="ta.${i}.h" id="f_ta_${i}_h" title="عدد الحصص"><option value="">—</option>${opts.map(o => `<option value="${o}"${o === v ? ' selected' : ''}>${o}</option>`).join('')}</select>`;
}
function secsOf(g) {
  const st = [...new Set(S.students.filter(x => x.g === +g).map(x => x.sec))].sort((a, b) => a - b);
  if (st.length) return st;
  const off = +S.s.secOff[g] || 0; return Array.from({ length: 8 }, (_, i) => off + i + 1);
}
function openSecPicker(btn) {
  closeSecPicker();
  const i = +btn.dataset.i, g = +btn.dataset.g, cur = new Set((S.ta[i].sec || '').split('-').filter(Boolean).map(Number));
  const pop = document.createElement('div'); pop.className = 'secpop'; pop.id = 'secPop';
  pop.innerHTML = `<div class="secgrid">${secsOf(g).map(n => `<label class="secb${cur.has(n) ? ' on' : ''}"><input type="checkbox" value="${n}" ${cur.has(n) ? 'checked' : ''}>${n}</label>`).join('')}</div>
    <div class="acts"><button type="button" class="btn sm" data-sp="all">الكل</button><button type="button" class="btn sm ghost" data-sp="none">مسح</button><span class="sp1"></span><button type="button" class="btn sm pri" data-sp="ok">تم</button></div>`;
  document.body.appendChild(pop);
  const r = btn.getBoundingClientRect(); pop.style.top = (window.scrollY + r.bottom + 4) + 'px';
  pop.style.left = Math.max(8, Math.min(window.scrollX + r.right - pop.offsetWidth, document.documentElement.clientWidth - pop.offsetWidth - 8)) + 'px';
  const apply = () => { const v = $$('input', pop).filter(c => c.checked).map(c => +c.value).sort((a, b) => a - b).join('-'); S.ta[i].sec = v; save(); btn.innerHTML = v ? esc(v) : '<span class="hint">اختر الشعب ▾</span>'; $$('.secb', pop).forEach(l => l.classList.toggle('on', l.firstElementChild.checked)); };
  pop.addEventListener('change', apply);
  pop.addEventListener('click', e => { const a = e.target.closest('[data-sp]'); if (!a) return; if (a.dataset.sp === 'ok') return closeSecPicker(true); $$('input', pop).forEach(c => c.checked = a.dataset.sp === 'all'); apply(); });
  pop._i = i;
}
function closeSecPicker(rerender) { const p = $('#secPop'); if (p) { p.remove(); if (rerender) render(); } }
document.addEventListener('mousedown', e => { const p = $('#secPop'); if (p && !p.contains(e.target) && !e.target.closest('.secpick')) closeSecPicker(true); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSecPicker(true); });
function vStaff() {
  const ses = sessions(); if (!ses.find(x => x.key === OBS_SEL) && ses[0]) OBS_SEL = ses[0].key;
  const se = ses.find(x => x.key === OBS_SEL);
  const tcount = new Set(S.ta.map(x => x.t)).size;
  const gsx = S.s.gs || {};
  // أحمال الملاحظة
  const load = {}; Object.keys(S.obs).forEach(k => obsList(k).forEach(n => { if (n) load[n] = (load[n] || 0) + 1; }));
  let obsHtml = '<p class="hint">أضف أيام الجدول أولاً.</p>';
  if (se) {
    const busy = new Set(sessionSubjects(se).flatMap(x => teachersOfSubject(x.sub, x.g).concat(teacherOf(x.sub, x.g))).filter(Boolean).map(normName));
    const cnt = {}; S.com.map(c => c.no).concat(['R']).forEach(no => obsList(`${se.key}_${no}`).forEach(n => { if (n) cnt[normName(n)] = (cnt[normName(n)] || 0) + 1; }));
    obsHtml = `<div class="tw"><table class="et obs"><tr><th>اللجنة</th><th>المقر</th><th>الطلاب</th><th title="عدد الملاحظين المطلوب">العدد المطلوب</th><th>الملاحظون</th></tr>${S.com.map(c => {
      const key = `${se.key}_${c.no}`, list = obsList(key);
      return `<tr><td><b>${c.no}</b></td><td class="tnames">${esc(comPlace(c))}</td><td>${comSum(c)}</td>
      <td><input class="in" type="number" min="1" max="5" data-k="obsN.${c.no}" data-num="1" value="${obsNeed(c.no)}" style="width:4rem" id="on_${c.no}"></td>
      <td><div class="obsl">${obsSlots(se, c, key, list, busy, cnt, load)}</div></td></tr>${typeof OBS_T !== 'undefined' && OBS_T && OBS_T.key === key ? obsPickRow(key, busy, cnt, load) : ''}`; }).join('')}</table></div>
      ${typeof obsResBlock === 'function' ? obsResBlock(se, busy, cnt, load) : ''}
      ${SWAP ? `<p class="upnote ok">اخترت «${esc(obsList(SWAP.key)[SWAP.i] || '')}» للتبديل — اضغط ⇅ عند الملاحظ الآخر لإتمام التبديل، أو <button class="btn sm ghost" data-act="obsSwapCancel" type="button">إلغاء</button></p>` : ''}
      <details><summary>أحمال الملاحظة لكل معلم (جميع الفترات)</summary><div class="loadl">${Object.entries(load).sort((a, b) => b[1] - a[1]).map(([n, v]) => `<span>${esc(n)} <b>${v}</b></span>`).join('') || '<span class="hint">لا يوجد توزيع بعد</span>'}</div></details>`;
  }
  const taByG = g => S.ta.map((x, i) => [x, i]).filter(([x]) => +x.g === g);
  return `${teacherDatalist()}${G.map(g => `<datalist id="curr${g}">${currList(g).map(v => `<option value="${esc(v)}"></option>`).join('')}</datalist>`).join('')}


  <section class="card">
    <h2>معلمو المواد المختبرة (واضعو الأسئلة)</h2>
    ${qbar('stList', 'كشف المعلمين المكلفين:')}
    ${qbar('assign', 'خطابات التكليف:')}
    ${qbar('receipt', 'بيان استلام الأسئلة:')}
    <p class="hint">يُملأ من الإسناد: لكل مادة في الجدول المعلم الأكثر شعباً، ويمكنك تغييره. جميع معلمي المادة يظهرون في محضر اتفاقية التصحيح.</p>
    <div class="tw"><table class="et stack strows"><tr><th>المادة</th><th>الصف</th><th>المعلم المكلف بالأسئلة</th><th>معلمو المادة في الإسناد</th><th>درجة الاختبار</th><th></th></tr>
    ${S.st.map((x, i) => `<tr><td>${pickSel(`st.${i}.sub`, x.sub, subOpts(x.g), { kind: 's', ph: '— اختر المادة —', other: 'كتابة مادة أخرى…' })}</td><td><select class="in" data-k="st.${i}.g" data-num="1" id="st_g_${i}">${G.map(g => `<option value="${g}"${+x.g === g ? ' selected' : ''}>${GSHORT[g]}</option>`).join('')}</select></td><td>${pickSel(`st.${i}.t`, x.t, tchOpts(teachersOfSubject(x.sub, x.g), 'معلمو المادة في الإسناد'), { ph: '— اختر المعلم —' })}</td><td class="tnames">${esc(teachersOfSubject(x.sub, x.g).join('، ')) || '<span class="warnt">لا يوجد</span>'}</td><td>${inp(`st.${i}.mark`, x.mark || '', { num: 1, type: 'number', ph: String(S.s.mark), style: 'width:5rem' })}</td><td><button class="x" data-act="delSt" data-i="${i}" type="button" title="حذف">×</button></td></tr>`).join('')}
    </table></div>
    <div class="acts"><button class="btn sm" data-act="addSt" type="button">إضافة مادة</button><button class="btn sm ghost" data-act="stFromSchedule" type="button">إضافة مواد الجدول الناقصة</button></div>
  </section>
  <section class="card">
    <h2>بيان توزيع الدرجات</h2>
    ${qbar('gradeStmt', 'بيان توزيع الدرجات:')}
    <p class="hint">يُرفق مع خطابات تكليف وضع الأسئلة حسب اختيارك. إذا صدر بيان جديد فارفعه بصيغة Word أو PDF أو صورة، وسيُستخدم بدلاً من البيان المعتمد.</p>
    <div class="acts wrap">
      <label class="ck"><input type="checkbox" data-k="s.gs.include" ${gsx.include ? 'checked' : ''}> إرفاق البيان مع تكليف وضع الأسئلة (افتراضياً يُطبع مستقلاً)</label>
      <label class="inl">موضعه <select class="in" data-k="s.gs.place" id="gs_place"><option value="page"${gsx.place !== 'inside' ? ' selected' : ''}>صفحة مستقلة بعد كل تكليف</option><option value="inside"${gsx.place === 'inside' ? ' selected' : ''}>داخل خطاب التكليف</option></select></label>
      <label class="inl">المصدر <select class="in" data-k="s.gs.src" id="gs_src"><option value="builtin"${gsx.src !== 'file' ? ' selected' : ''}>البيان المعتمد (المسارات)</option><option value="file"${gsx.src === 'file' ? ' selected' : ''}${gsx.file ? '' : ' disabled'}>الملف المرفوع${gsx.file ? ': ' + esc(gsx.file.name) : ''}</option></select></label>
    </div>
    <div class="drops one">${dropZone('gs', 'رفع بيان توزيع درجات جديد', 'Word (‎.docx/.doc) أو PDF أو صورة — يحل محل البيان المعتمد عند اختياره', '.docx,.doc,.pdf,.png,.jpg,.jpeg')}</div>
    <details><summary>معاينة البيان الحالي</summary><div class="gsprev page-lite">${gsContent(false)}</div></details>
  </section>
  <section class="card">
    <h2>توزيع الملاحظين على اللجان</h2>
    ${se ? qbar('obsNames', 'أسماء الملاحظين على اللجان (الفترة المختارة):', '', { ses: OBS_SEL }) : ''}
    ${qbar('obsNames', 'أسماء الملاحظين على اللجان (كل الفترات):')}
    <details class="setadv"><summary>نموذج آخر: جدول توزيع الملاحظين مع المقر وعدد الطلاب</summary>${qbar('obsTable', 'كل الفترات:')}${se ? qbar('obsTable', 'الفترة المختارة:', '', { ses: OBS_SEL }) : ''}</details>
    ${typeof comCountCtl === 'function' ? comCountCtl() : ''}
    <div class="acts wrap">
      <label class="inl">الفترة <select class="in" id="obsSel">${ses.map(x => `<option value="${x.key}"${x.key === OBS_SEL ? ' selected' : ''}>${dayName(x.day)} ${dateShort(x.day)} – ${esc(x.per.n)}</option>`).join('')}</select></label>
      <label class="inl">عدد الملاحظين الافتراضي لكل لجنة <input class="in" type="number" min="1" max="5" data-k="s.obsDef" data-num="1" value="${S.s.obsDef || 1}" style="width:4rem" id="f_obsDef"></label>
      <button class="btn sm pri" data-act="autoObs" type="button">توزيع تلقائي عادل لجميع الفترات</button>
      <button class="btn sm ghost" data-act="clearObs" type="button">مسح التوزيع</button>
    </div>
    <p class="hint">المس خانة «＋ الملاحظ» أو اسم أي ملاحظ فتظهر تحت اللجنة أسماء المتاحين في هذه الفترة (الأقل ملاحظةً بنجمة)، والمس الاسم فيُوضع وينتقل التحديد تلقائياً للخانة التالية. للتبديل اضغط ⇅ عند ملاحظ ثم ⇅ عند ملاحظ آخر. الإطار الأحمر يعني اسماً مكرراً في نفس الفترة، والبرتقالي معلم مادة تُختبر في نفس الفترة.</p>
    ${obsHtml}
  </section>

  <section class="card">
    <h2>القوائم الخاصة (الانتساب، ذوو الإعاقة البصرية، وغيرها)</h2>
    <p class="hint">يُطبع لكل قائمة كشف يومي بمواد الطالب من الجدول، بعمود «الدرجة» أو «التوقيع».</p>
    ${S.special.map((sl, li) => `<div class="sub">
      <div class="acts wrap"><label class="inl">العنوان ${inp(`special.${li}.title`, sl.title, { style: 'width:18rem' })}</label>
      <label class="inl">العمود الأخير <select class="in" data-k="special.${li}.kind" id="sp_k_${li}"><option value="grade"${sl.kind === 'grade' ? ' selected' : ''}>الدرجة</option><option value="sign"${sl.kind === 'sign' ? ' selected' : ''}>التوقيع</option></select></label>
      <button class="btn sm danger" data-act="delSpecial" data-i="${li}" type="button">حذف القائمة</button></div>
      ${qbar('special', 'كشف هذه القائمة:', '', { li })}
      <div class="tw"><table class="et"><tr><th>اسم الطالب</th><th>الصف</th><th></th></tr>
      ${sl.rows.map((r, ri) => `<tr><td>${inp(`special.${li}.rows.${ri}.n`, r.n, { list: 'stulist' })}</td><td><select class="in" data-k="special.${li}.rows.${ri}.g" data-num="1" id="sp_${li}_${ri}">${G.map(g => `<option value="${g}"${+r.g === g ? ' selected' : ''}>${GSHORT[g]}</option>`).join('')}</select></td><td><button class="x" data-act="delSpRow" data-i="${li}" data-j="${ri}" type="button" title="حذف">×</button></td></tr>`).join('')}
      </table></div><button class="btn sm" data-act="addSpRow" data-i="${li}" type="button">إضافة طالب</button></div>`).join('')}
    <button class="btn sm pri" data-act="addSpecial" type="button">إضافة قائمة جديدة</button>
    <datalist id="stulist">${S.students.slice(0, 1500).map(x => `<option value="${esc(x.n)}"></option>`).join('')}</datalist>
  </section>`;
}
function setChooser() {
  let chosen = false; try { chosen = !!localStorage.getItem(LS_KEY + '-taset'); } catch (e) { }
  return `<section class="card sets" id="setsCard">
    <h2>أي إسناد تعمل عليه؟</h2>
    <p class="hint">ثلاثة حفظ مستقلة تماماً، لا يتداخل أحدها مع الآخر، وكلها محفوظة على السحابة. اختر الحفظ الذي تعمل عليه على هذا الجهاز؛ <b>الاختبارات والتكليفات والملاحظة تُبنى على الحفظ النشط</b>. يمكنك تعديل الاسم والوصف بالضغط عليهما.</p>
    <div class="setnow" style="--sc2:${SET_DEF[ACTIVE].c}"><span class="setic">${SET_DEF[ACTIVE].ic}</span><div><small>تعمل الآن على</small><b>${esc(setMeta(ACTIVE).n)} — الفصل الدراسي ${esc(setMeta(ACTIVE).sem)} ${esc(setMeta(ACTIVE).y)}</b><span>كشوف الإسناد ونصاب المعلمين تُطبع بهذا الفصل، وقائمة المواد تُقترح من خطته. بقية النظام (الاختبارات والانتظار والمناوبة) يبقى على الفصل ${esc(S.s.sem)}.</span></div></div>
    ${chosen ? '' : `<p class="setcall">هذه أول مرة على هذا الجهاز — اختر الحفظ الذي ستعمل عليه: فهد يعمل على «حفظ فهد»، والوكيل على «حفظ الوكيل». <button class="btn sm" data-act="setUse" data-v="${ACTIVE}" type="button">متابعة على «${esc(setMeta(ACTIVE).n)}»</button></p>`}
    <div class="setgrid">${TA_SETS.map(id => { const d = secData(id), m = setMeta(id), on = id === ACTIVE, sy = SYNC[id], tc = new Set((d.ta || []).map(x => normName(x.t))).size;
      return `<article class="setc${on ? ' on' : ''}" style="--sc2:${SET_DEF[id].c}">
        <div class="seth"><span class="setic">${SET_DEF[id].ic}</span><div><input class="setn" data-setmeta="${id}" data-f="n" value="${esc(m.n)}" aria-label="اسم الحفظ" maxlength="30"><input class="setd" data-setmeta="${id}" data-f="d" value="${esc(m.d)}" placeholder="وصف، مثل: إسناد الفصل الثاني 1447" aria-label="وصف الحفظ" maxlength="60"></div></div>
        <div class="semchips" role="group" aria-label="الفصل الدراسي لهذا الحفظ">${['الأول', 'الثاني'].map(s => `<button type="button" class="${m.sem === s ? 'on' : ''}" data-act="setSem" data-v="${id}" data-s="${s}">الفصل ${s}</button>`).join('')}<input class="in sy" data-setmeta="${id}" data-f="y" value="${esc(m.y)}" aria-label="العام الدراسي" maxlength="12"></div>
        <div class="setst"><b>${(d.ta || []).length}</b> سطراً · <b>${tc}</b> معلماً في الإسناد · ${(d.teachers || []).length} في القائمة</div>
        <small>${sy && sy.at ? 'آخر حفظ على السحابة: ' + esc(fmtAt(sy.at)) : SYNC_CODE ? 'بانتظار أول حفظ' : 'محفوظ على هذا الجهاز فقط — فعّل المزامنة'}</small>
        ${on ? '<span class="setbadge">✓ تعمل عليه الآن</span>' : (ROLE === 'agent' && id === 'ta') ? `<button class="btn" data-act="setView" data-v="${id}" type="button">عرض كشف الإسناد (اطلاع فقط)</button>` : `<button class="btn pri" data-act="setUse" data-v="${id}" type="button">العمل على هذا الحفظ</button><button class="btn sm ghost" data-act="setView" data-v="${id}" type="button">عرض الكشف</button>`}
        <details class="setmore"><summary>نسخ المحتوى…</summary>${TA_SETS.filter(o => o !== id && !(ROLE === 'agent' && o === 'ta')).map(o => `<button class="btn sm ghost" data-act="setCopy" data-from="${id}" data-to="${o}" type="button">نسخه إلى «${esc(setMeta(o).n)}»</button>`).join('')}</details>
      </article>`; }).join('')}</div>
  </section>`;
}
function vAssign() {
  const tcount = new Set(S.ta.map(x => x.t)).size;
  const taByG = g => S.ta.map((x, i) => [x, i]).filter(([x]) => +x.g === g);
  return `${teacherDatalist()}${G.map(g => `<datalist id="curr${g}">${currList(g).map(v => `<option value="${esc(v)}"></option>`).join('')}</datalist>`).join('')}
  ${typeof semSwitch === 'function' ? semSwitch() : ''}
  <details class="setadv"><summary>خيارات متقدمة للحفظ: الأسماء والفصل والنسخ والحفظ المشترك</summary>${setChooser()}</details>
  <section class="card">
    <h2>ملف الإسناد</h2>
    <p class="hint">الإسناد هو الأساس الذي تُبنى عليه: تكليفات وضع الأسئلة، بيان استلام الأسئلة، محضر فتح المظاريف، محضر اتفاقية التصحيح، إقرار إنهاء المقرر، وتوزيع التصحيح. يقبل الموقع ملف PDF أو Word (‎.docx و‎.doc) أو Excel، وتُتجاوز تلقائياً إسنادات العوق البصري والتربية الفكرية وحصص النشاط.</p>
    <div class="drops one">${dropZone('ta', 'ملف إسناد المعلمين', `PDF أو Word أو Excel — الإسناد الحالي: ${S.ta.length} سطراً لـ ${tcount} معلماً`, '.xlsx,.xls,.csv,.docx,.doc,.pdf')}</div>
    <div class="acts wrap"><button class="btn sm ghost" data-act="exportTa" type="button">تنزيل الإسناد كملف Excel</button><button class="btn sm" data-act="buildSt" type="button">ربط مواد الجدول بمعلميها من الإسناد</button></div>
    <div id="upMsg"></div>
    <div class="dens" style="margin-top:14px"><label class="inl">كثافة الطباعة لكشوف المعلمين <select class="in" data-k="s.taPrint.dens" id="st_dens"><option value="cmp"${((S.s.taPrint || {}).dens || 'cmp') === 'cmp' ? ' selected' : ''}>مضغوطة — أكبر عدد من المعلمين في الصفحة</option><option value="mid"${(S.s.taPrint || {}).dens === 'mid' ? ' selected' : ''}>متوسطة</option><option value="std"${(S.s.taPrint || {}).dens === 'std' ? ' selected' : ''}>مريحة — أسطر واسعة للكتابة</option></select></label></div>
    ${qbar('taSheet', 'كشف الإسناد:')}
  </section>
  <section class="card">
    <h2>تعديل الإسناد</h2>
    ${qbar('taSheet', 'كشف الإسناد:', `<label class="ck"><input type="checkbox" data-k="s.taPrint.h" ${(S.s.taPrint || {}).h !== false ? 'checked' : ''}> عمود عدد الحصص</label><label class="ck"><input type="checkbox" data-k="s.taPrint.sign" ${(S.s.taPrint || {}).sign !== false ? 'checked' : ''}> عمود التوقيع</label><label class="ck"><input type="checkbox" data-k="s.taPrint.note" ${(S.s.taPrint || {}).note ? 'checked' : ''}> ملاحظات</label><label class="ck"><input type="checkbox" data-k="s.taPrint.split" ${(S.s.taPrint || {}).split !== false ? 'checked' : ''}> كل صف في صفحة</label>`)}
    ${qbar('taLoad', 'نصاب المعلمين:')}
    <p class="hint">عدّل أي خانة مباشرة، أو احذف سطراً، أو أضف معلماً أو مادة. قائمة المواد مأخوذة من الخطة الدراسية للمرحلة الثانوية – نظام المسارات (الفصل ${esc(S.s.sem)} أولاً)، ويمكنك كتابة أي مادة أخرى. اضغط خانة الشعب لاختيارها من قائمة شعب الصف نفسه.</p>
    ${G.map(g => { const rows = taByG(g); const have = new Set(rows.map(([x]) => normName(x.sub)));
      const miss = CURR[g][semNo()].filter(n => !rows.some(([x]) => subjMatch(x.sub, n)));
      return `<div class="tagrp"><div class="tagh" style="--gc:${GCOL[g]}"><b>${GNAME[g]}</b><span>${rows.length} سطراً — ${new Set(rows.map(([x]) => x.t)).size} معلماً</span></div>
      <div class="tw"><table class="et stack tarows"><tr><th style="width:30%">المادة</th><th style="width:8%">الحصص</th><th style="width:22%">الشعب</th><th>المعلم</th><th></th></tr>
      ${rows.map(([x, i]) => `<tr><td>${pickSel(`ta.${i}.sub`, x.sub, subOpts(g), { kind: 's', ph: '— اختر المادة —', other: 'كتابة مادة أخرى…' })}</td><td>${hSelect(i, x.h)}</td><td><button type="button" class="secpick" data-act="secPick" data-i="${i}" data-g="${g}" id="sp_ta_${i}">${x.sec ? esc(x.sec) : '<span class="hint">اختر الشعب ▾</span>'}</button></td><td>${pickSel(`ta.${i}.t`, x.t, tchOpts(), { ph: '— اختر المعلم —' })}</td><td><button class="x" data-act="delTa" data-i="${i}" type="button" title="حذف السطر">×</button></td></tr>`).join('') || `<tr><td colspan="5" class="hint">لا يوجد إسناد لهذا الصف بعد.</td></tr>`}
      </table></div>
      <div class="acts wrap"><button class="btn sm" data-act="addTa" data-g="${g}" type="button">+ إضافة معلم / مادة</button>
      ${miss.length ? `<span class="hint">مواد في الخطة بلا إسناد:</span>${miss.map(n => `<button type="button" class="chip" data-act="addTa" data-g="${g}" data-sub="${esc(n)}">+ ${esc(n)}</button>`).join('')}` : '<span class="okt">جميع مواد الخطة مُسندة</span>'}</div></div>`; }).join('')}
  </section>
  <section class="card linkcard"><h2>قائمة المعلمين</h2><p class="hint">${S.teachers.length} معلماً في القائمة — تُدار من «الملفات الأساسية» (رفع من Excel أو Word أو PDF، أو تعديل يدوي).</p><button class="btn sm" data-tab="files" type="button">فتح قائمة المعلمين ←</button></section>`;
}
function autoObservers() {
  const ses = sessions(); const load = {}; S.teachers.forEach(t => load[t] = 0);
  if (!S.teachers.length) return false;
  let rot = 0;
  ses.forEach(se => {
    const busy = new Set(sessionSubjects(se).flatMap(x => teachersOfSubject(x.sub, x.g).concat(teacherOf(x.sub, x.g))).filter(Boolean).map(normName));
    const used = new Set();
    S.com.forEach(c => {
      const list = [];
      for (let k = 0; k < obsNeed(c.no); k++) {
        const cand = S.teachers.filter(t => !used.has(t) && !busy.has(normName(t)));
        const pool = cand.length ? cand : S.teachers.filter(t => !used.has(t));
        if (!pool.length) break;
        pool.sort((a, b) => load[a] - load[b] || ((S.teachers.indexOf(a) - rot + 999) % S.teachers.length) - ((S.teachers.indexOf(b) - rot + 999) % S.teachers.length));
        const t = pool[0]; used.add(t); load[t]++; list.push(t);
      }
      S.obs[`${se.key}_${c.no}`] = list;
    });
    if (typeof resNeed === 'function') { const rp = S.teachers.filter(t => !used.has(t) && !busy.has(normName(t))).sort((a, b) => load[a] - load[b] || AR.compare(normName(a), normName(b))); S.obs[`${se.key}_R`] = rp.slice(0, resNeed()); }
    rot = (rot + 7) % S.teachers.length;
  });
  return true;
}

/* ----- النسخ الاحتياطي ----- */
function vBackup() {
  const conf = ALL_SECS.map(s => { try { const c = JSON.parse(localStorage.getItem(LS_KEY + '-conflict-' + s) || 'null'); return c ? [s, c] : null; } catch (e) { return null; } }).filter(Boolean);
  return `<section class="card">
    <h2>الحفظ والمزامنة بين الأجهزة</h2>
    <p class="hint">كل قسم يُحفظ مستقلاً: <b>قسم الإسناد</b> (الإسناد وقائمة المعلمين) و<b>قسم الاختبارات</b> (الجدول واللجان والطلاب والملاحظون والإعدادات). عند تفعيل المزامنة بالرمز تُحفظ البيانات تلقائياً على هذا الجهاز وعلى السحابة، وتظهر على أي جهاز تدخل منه بالرمز — فما يحفظه وكيل المعلمين في الإسناد يظهر عندك مباشرة.</p>
    <div class="syncgrid">${ALL_SECS.map(s => `<div class="synccard"><b>${s === 'ex' ? 'قسم الاختبارات' : esc(SYNC_SECS[s])}${s === ACTIVE ? ' <em class="tg new">نشط على هذا الجهاز</em>' : ''}</b><span>${SYNC[s] && SYNC[s].at ? 'آخر مزامنة: ' + esc(fmtAt(SYNC[s].at)) : SYNC_CODE ? 'بانتظار أول مزامنة' : 'محفوظ على هذا الجهاز فقط'}</span>${SYNC_CODE && syncDirty(s) ? '<em class="tg del">تعديلات لم تُرفع بعد</em>' : SYNC_CODE ? '<em class="tg new">متزامن</em>' : ''}<label class="inl mode">تعديلات الأجهزة الأخرى <select class="in" data-mode="${s}" id="mode_${s}"><option value="ask"${syncMode(s) === 'ask' ? ' selected' : ''}>اسألني قبل تطبيقها</option><option value="auto"${syncMode(s) === 'auto' ? ' selected' : ''}>طبّقها تلقائياً</option></select></label><div class="acts wrap" style="margin:0">${SYNC_CODE ? `<button class="btn sm" data-act="hist" data-v="${s}" type="button">سجل النسخ</button>` : ''}<button class="btn sm ghost" data-act="exportSec" data-v="${s}" type="button">تصدير هذا القسم فقط</button></div></div>`).join('')}</div>
    <div class="acts wrap"><label class="inl">اسم هذا الجهاز <input class="in" id="devName" value="${esc(devName())}" placeholder="مثل: جوال وكيل المعلمين" style="width:14rem" maxlength="24"></label></div>
    <div class="acts wrap">${SYNC_CODE ? `<button class="btn pri" data-act="syncNow" type="button">مزامنة الآن</button><button class="btn ghost" data-act="syncOff" type="button">إيقاف المزامنة على هذا الجهاز</button>` : `<button class="btn pri" data-act="syncOn" type="button">تفعيل المزامنة بالرمز</button>`}</div>
    ${conf.length ? `<div class="sub"><b>نسخ محفوظة من تعارض سابق</b><p class="hint">حين يُعدَّل القسم نفسه من جهازين في الوقت نفسه، تُعتمد النسخة الأحدث على السحابة وتُحفظ تعديلاتك هنا لتستعيدها إن احتجت.</p>${conf.map(([s, c]) => `<div class="acts wrap"><span>${SYNC_SECS[s]} — ${esc(fmtAt(c.at))}</span><button class="btn sm" data-act="restoreConf" data-v="${s}" type="button">استعادة هذه النسخة</button><button class="btn sm ghost" data-act="dropConf" data-v="${s}" type="button">حذفها</button></div>`).join('')}</div>` : ''}
  </section>
  <section class="card">
    <h2>النسخ الاحتياطي</h2>
    <p class="hint">كل البيانات محفوظة في متصفح هذا الجهاز. صدّر نسخة احتياطية لنقل العمل لجهاز آخر أو للاحتفاظ به، ثم استوردها هناك (يتطلب الرمز الخاص).</p>
    <div class="acts wrap"><button class="btn pri" data-act="exportJson" type="button">تصدير نسخة احتياطية</button>
    <label class="btn" for="jsonIn" role="button" tabindex="0">استيراد نسخة احتياطية…</label><input type="file" class="vh" id="jsonIn" accept=".json" tabindex="-1"></div>
  </section>
  <section class="card"><h2>إعادة الضبط</h2><p class="hint">يعيد الإعدادات والجدول واللجان إلى البيانات الأصلية من نماذج المدرسة، ويحذف الطلاب. يتطلب الرمز الخاص.</p>
  <button class="btn danger" data-act="resetAll" type="button">إعادة ضبط كل البيانات</button></section>`;
}

/* ===================== النماذج ===================== */
let FORM = 'schedule';
let FO = {}; // خيارات النموذج الحالي
function sesOpt(o) { return o.ses && o.ses !== 'all' ? sessions().filter(x => x.key === o.ses) : sessions(); }
function comOpt(o) { const a = +o.from || 1, b = +o.to || 9999; return S.com.filter(c => c.no >= a && c.no <= b); }
function sesInfo(se) {
  const subs = G.map(g => ({ g, sub: (se.per.s[g] || '').trim() }));
  const live = subs.filter(x => x.sub);
  const n = Math.max(1, live.length);
  const rows = [[H('اليوم'), H('التاريخ'), H('المادة', { cs: 2 }), H('المرحلة'), H('الفترة')]];
  live.forEach((x, i) => {
    const r = [];
    if (i === 0) { r.push({ v: `<b>${dayName(se.day)}</b>`, rs: n }, { v: `<b style="color:#c00000">${dateTxt(se.day)}</b>`, rs: n }); }
    r.push(Gc(x.g, `<b>${esc(x.sub)}</b>`, { cs: 2 }), Gc(x.g, GSHORT[x.g]));
    if (i === 0) r.push({ v: `<b>${esc(se.per.n)}</b><br><small>${esc(se.per.t)}</small>`, rs: n });
    rows.push(r);
  });
  if (!live.length) rows.push([{ v: dayName(se.day) }, { v: dateTxt(se.day) }, { v: '', cs: 2 }, '', { v: esc(se.per.n) }]);
  return T(rows);
}
const OPT = {
  ses: o => `<label class="inl">الفترة <select class="in fo" data-o="ses" id="fo_ses"><option value="all">جميع الأيام والفترات</option>${sessions().map(x => `<option value="${x.key}"${o.ses === x.key ? ' selected' : ''}>${dayName(x.day)} ${dateShort(x.day)} – ${esc(x.per.n)}</option>`).join('')}</select></label>`,
  com: o => `<label class="inl">من لجنة <input class="in fo" type="number" data-o="from" id="fo_from" value="${o.from || 1}" style="width:4.5rem"></label><label class="inl">إلى <input class="in fo" type="number" data-o="to" id="fo_to" value="${o.to || S.com.length}" style="width:4.5rem"></label>`,
  grade: o => `<span class="inl">الصفوف ${gradeChips(o.g, 'foG', '')}</span>`,
  copies: o => `<label class="inl">عدد النسخ <input class="in fo" type="number" min="1" max="60" data-o="copies" id="fo_copies" value="${o.copies || 1}" style="width:4.5rem"></label>`
};
const FORMS = [
  // ===== الجداول
  { id: 'schedule', grp: 'الجداول', t: 'جدول الاختبارات العام', build: () => [
    title(`جدول الاختبارات العام للمرحلة الثانوية – الفصل الدراسي ${esc(S.s.sem)} ${esc(S.s.yearTxt)} – الدور ${esc(S.s.round)}`) + scheduleTable({ big: true }) + sp(8) +
    `<div class="insbox"><p class="ih">تعليمات مهمة للاختبار</p><ul class="ins">${S.s.instr.split('\n').filter(x => x.trim()).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` + sp(10) +
    `<table class="sg" dir="rtl" border="0" width="100%"><tr><td style="text-align:center;width:33%"><div class="sbox"><b>وكيل الشؤون التعليمية</b><br><br>${esc(S.s.eduDep)}</div></td><td style="text-align:center;width:34%"><b>ختم المدرسة</b><div class="stamp"></div></td><td style="text-align:center;width:33%"><div class="sbox"><b>مدير المدرسة</b><br><br>${esc(S.s.principal)}</div></td></tr></table>`] },
  { id: 'comSchedule', grp: 'الجداول', t: 'جدول اللجنة (يُعلّق على باب كل لجنة)', land: 1, opts: ['com'], build: o => comOpt(o).map(c => comHead(c) + sp(8) + scheduleTable()) },
  { id: 'qFile', grp: 'الجداول', t: 'ملف توزيع الأسئلة ونماذج الإجابة على اللجان', land: 1, opts: ['com'], build: o => comOpt(o).map(c => comHead(c, true) + sp(8) + scheduleTable()) },
  // ===== اللجان
  { id: 'comCounts', grp: 'اللجان', t: 'أعداد الطلاب في اللجان', build: () => [title('أعداد الطلاب في اللجان', yearLine()) + comCountsTable()] },
  { id: 'comPlaces', grp: 'اللجان', t: 'مقرات لجان الاختبارات', build: () => [title('مقرات لجان الاختبارات', yearLine()) + comPlacesTable()] },
  { id: 'sticker', grp: 'اللجان', t: 'كروكي اللجان (ملصق باب اللجنة)', opts: ['com', 'cols', 'door'], build: o => comOpt(o).map(c => stickerPage(c, o)) },
  { id: 'callSheet', grp: 'اللجان', t: 'كشف المناداة وتسليم أوراق الإجابة', needs: 'dist', opts: ['com'], build: o => comOpt(o).flatMap(callSheetPages) },
  { id: 'deliver', grp: 'اللجان', t: 'لوحات تسليم اللجان', land: 1, opts: ['grpsize'], build: o => deliverPages(+o.size || 6) },
  // ===== أعمال يومية
  { id: 'daily', grp: 'الأعمال اليومية', t: 'كشف الملاحظين واستلام أوراق الإجابة', opts: ['ses'], build: o => sesOpt(o).map(se => title('كشف الملاحظين واستلام أوراق الإجابة') + sesInfo(se) + sp(6) + dailyTable(se)) },
  { id: 'obsNames', grp: 'الأعمال اليومية', t: 'أسماء الملاحظين على اللجان (كشف التوقيع اليومي)', opts: ['ses'], build: o => obsNamesPages(o) },
  { id: 'obsTable', grp: 'الأعمال اليومية', t: 'جدول توزيع الملاحظين على اللجان (مع التوقيع)', opts: ['ses'], build: o => obsTablePages(o) },
  { id: 'gradeStmt', grp: 'المعلمون والأسئلة', t: 'بيان توزيع الدرجات', build: () => [title('بيان توزيع الدرجات', yearLine()) + gsContent(false)] },
  { id: 'openEnv', grp: 'الأعمال اليومية', t: 'محضر فتح مظروف أسئلة', opts: ['ses'], build: o => sesOpt(o).map(openEnvPage) },
  { id: 'agree', grp: 'الأعمال اليومية', t: 'محضر اتفاقية التصحيح وسلامة الأسئلة', opts: ['ses'], build: o => sesOpt(o).map(agreePage) },
  { id: 'qEnv', grp: 'الأعمال اليومية', t: 'ظرف أسئلة الطلاب (لكل لجنة)', opts: ['ses', 'com'], build: o => qEnvPages(o) },
  { id: 'aEnv', grp: 'الأعمال اليومية', t: 'ظرف أوراق إجابات الطلاب (لكل مادة)', opts: ['ses'], build: o => aEnvPages(o) },
  { id: 'special', grp: 'الأعمال اليومية', t: 'القوائم الخاصة (انتساب / عوق بصري)', opts: ['list'], build: o => specialPages(o) },
  // ===== المعلمون
  { id: 'taSheet', grp: 'المعلمون والأسئلة', t: 'كشف إسناد المعلمين', opts: ['grade', 'taopts'], build: o => taSheetPages(o) },
  { id: 'taLoad', grp: 'المعلمون والأسئلة', t: 'نصاب المعلمين', opts: ['dens'], build: () => taLoadPages() },
  { id: 'stList', grp: 'المعلمون والأسئلة', t: 'معلمو المواد المختبرة (واضعو الأسئلة)', opts: ['grade', 'dens'], build: o => stListPages(o) },
  { id: 'tList', grp: 'المعلمون والأسئلة', t: 'كشف بأسماء المعلمين مع التوقيع', opts: ['dens'], build: () => tListPages() },
  { id: 'receipt', grp: 'المعلمون والأسئلة', t: 'بيان استلام أسئلة الاختبارات من المعلمين', build: () => [title('بيان استلام أسئلة الاختبارات من المعلمين', yearLine()) + receiptTable()] },
  { id: 'assign', grp: 'المعلمون والأسئلة', t: 'تكليف وضع أسئلة الاختبارات', opts: ['grade', 'gs'], build: o => assignPages(o) },
  { id: 'complete', grp: 'المعلمون والأسئلة', t: 'إقرار إنهاء المقرر الدراسي', opts: ['grade'], build: o => completePages(o) },
  { id: 'correct', grp: 'المعلمون والأسئلة', t: 'توزيع أوراق اللجان على المصححين', opts: ['grade'], build: o => correctPages(o) },
  { id: 'obsInstr', grp: 'المعلمون والأسئلة', t: 'تعليمات ملاحظي اللجان مع توقيع المعلمين', build: () => obsInstrPages() },
  // ===== نماذج فارغة
  { id: 'absence', grp: 'المحاضر والنماذج', t: 'محضر غياب طالب عن الاختبار', opts: ['copies'], build: o => rep(o, absencePage) },
  { id: 'violation', grp: 'المحاضر والنماذج', t: 'محضر مخالفة الأنظمة والتعليمات – طالب', opts: ['copies'], build: o => rep(o, violationPage) },
  { id: 'cheat', grp: 'المحاضر والنماذج', t: 'محضر حالة غش', opts: ['copies'], build: o => rep(o, cheatPage) },
  { id: 'dailyAbs', grp: 'المحاضر والنماذج', t: 'كشف الغياب اليومي أثناء الاختبارات', opts: ['day'], build: o => dailyAbsPages(o) },
  { id: 'late15', grp: 'المحاضر والنماذج', t: 'تعهد طالب تأخر بما لا يتجاوز 15 دقيقة', opts: ['copies'], build: o => rep(o, late15Page) },
  { id: 'lateMore', grp: 'المحاضر والنماذج', t: 'محضر تأخر طالب أكثر من 15 دقيقة', opts: ['copies'], build: o => rep(o, lateMorePage) },
  { id: 'lateList', grp: 'المحاضر والنماذج', t: 'بيان بأسماء الطلاب المتأخرين', build: () => [lateListPage()] },
  { id: 'absBySub', grp: 'المحاضر والنماذج', t: 'بيان حصر الطلاب الغائبين حسب المواد', build: () => [absBySubPage()] },
  { id: 'errQ', grp: 'المحاضر والنماذج', t: 'محضر اكتشاف خطأ في الأسئلة', opts: ['copies'], build: o => rep(o, () => errPage('الأسئلة')) },
  { id: 'errA', grp: 'المحاضر والنماذج', t: 'محضر اكتشاف خطأ في الإجابة النموذجية', opts: ['copies'], build: o => rep(o, () => errPage('الإجابة النموذجية')) },
  { id: 'qData', grp: 'المحاضر والنماذج', t: 'البيانات الأولية لورقة الأسئلة', opts: ['grade'], build: o => subjectPages(o, qDataPage) },
  { id: 'qOrig', grp: 'المحاضر والنماذج', t: 'ظرف أصل الأسئلة / أصل الإجابة النموذجية', opts: ['grade'], build: o => subjectPages(o, origEnvPage) },
  { id: 'gradeEst', grp: 'المحاضر والنماذج', t: 'بيان تقدير الدرجات', opts: ['grade'], build: o => subjectPages(o, gradeEstPage) },
  { id: 'stuGuide', grp: 'المحاضر والنماذج', t: 'إرشادات هامة للطلاب', build: () => [stuGuidePage()] }
];
OPT.cols = o => `<label class="inl">عدد المسارات في الكروكي <input class="in fo" type="number" min="2" max="10" data-o="cols" id="fo_cols" value="${o.cols || 6}" style="width:4.5rem"></label>`;
OPT.door = o => `<label class="inl">موقع باب الفصل <select class="in fo" data-o="door" id="fo_door"><option value="right"${o.door !== 'left' ? ' selected' : ''}>يمين القاعة</option><option value="left"${o.door === 'left' ? ' selected' : ''}>يسار القاعة</option></select></label>`;
OPT.day = o => `<label class="inl">اليوم <select class="in fo" data-o="ses" id="fo_day"><option value="all">جميع الأيام</option>${S.days.map((d, i) => `<option value="${i}_0"${o.ses === i + '_0' ? ' selected' : ''}>${dayName(d)} ${dateShort(d)}</option>`).join('')}</select></label>`;
OPT.gs = o => { const g = S.s.gs || {}; return `<label class="ck"><input type="checkbox" data-k="s.gs.include" ${g.include ? 'checked' : ''}> إرفاق بيان توزيع الدرجات</label><label class="inl">موضعه <select class="in" data-k="s.gs.place" id="fo_gsp"><option value="page"${g.place !== 'inside' ? ' selected' : ''}>صفحة مستقلة</option><option value="inside"${g.place === 'inside' ? ' selected' : ''}>داخل الخطاب</option></select></label><label class="inl">المصدر <select class="in" data-k="s.gs.src" id="fo_gss"><option value="builtin"${g.src !== 'file' ? ' selected' : ''}>البيان المعتمد</option><option value="file"${g.src === 'file' ? ' selected' : ''}${g.file ? '' : ' disabled'}>الملف المرفوع</option></select></label>`; };
OPT.dens = o => { const t = S.s.taPrint || {}; return `<label class="inl">كثافة الصفحة <select class="in" data-k="s.taPrint.dens" id="fo_dens"><option value="cmp"${(t.dens || 'cmp') === 'cmp' ? ' selected' : ''}>مضغوطة (أكبر عدد في الصفحة)</option><option value="mid"${t.dens === 'mid' ? ' selected' : ''}>متوسطة</option><option value="std"${t.dens === 'std' ? ' selected' : ''}>مريحة (أسطر واسعة)</option></select></label>`; };
OPT.taopts = o => { const t = S.s.taPrint || {}; return OPT.dens(o) + `<label class="ck"><input type="checkbox" data-k="s.taPrint.split" ${t.split !== false ? 'checked' : ''}> كل صف في صفحة مستقلة</label>` + `<label class="inl">العنوان <input class="in" data-k="s.taPrint.title" value="${esc(t.title || 'إسناد المعلمين')}" id="fo_tat" style="width:13rem"></label><label class="ck"><input type="checkbox" data-k="s.taPrint.sign" ${t.sign !== false ? 'checked' : ''}> عمود التوقيع</label><label class="ck"><input type="checkbox" data-k="s.taPrint.h" ${t.h !== false ? 'checked' : ''}> عدد الحصص</label><label class="ck"><input type="checkbox" data-k="s.taPrint.note" ${t.note ? 'checked' : ''}> عمود ملاحظات</label>`; };
OPT.grpsize = o => `<label class="inl">عدد اللجان في كل لوحة <input class="in fo" type="number" min="1" max="20" data-o="size" id="fo_size" value="${o.size || 6}" style="width:4.5rem"></label>`;
OPT.list = o => `<label class="inl">القائمة <select class="in fo" data-o="li" id="fo_li">${S.special.map((x, i) => `<option value="${i}"${+o.li === i ? ' selected' : ''}>${esc(x.title)}</option>`).join('')}</select></label>`;

function rep(o, fn) { const n = Math.min(60, Math.max(1, +o.copies || 1)); return Array.from({ length: n }, () => fn()); }
function comHead(c, qfile) {
  const left = qfile ? `<td style="width:30%;vertical-align:middle;text-align:center;background:#dae3f3"><b>ملف توزيع الأسئلة ونماذج الإجابة على اللجان</b><br><br>ترتب الأوراق حسب رقم الجلوس.<br>محاضر الغياب إن وجدت توضع منفصلة ومرتبة في مقدمة الأوراق.</td>` : '';
  return `<table dir="rtl" border="0" cellspacing="0" cellpadding="0" width="100%"><tr>
    <td style="width:${qfile ? 34 : 50}%;vertical-align:top">${T([[H('اللجنة', { w: '35%' }), H('مقر اللجنة')], [{ v: `<b style="font-size:30pt">${c.no}</b>`, bg: '#fce4d6' }, { v: `<b style="font-size:13pt">${esc(comPlace(c))}</b>` }]])}</td>
    <td style="width:2%"></td>${left}${left ? '<td style="width:2%"></td>' : ''}
    <td style="vertical-align:top">${countsMini(c)}</td></tr></table>`;
}
function comCountsTable() {
  const rows = [[H('الدور', { rs: 2 }), H('رقم اللجنة', { rs: 2 }), H('المقر', { rs: 2 }), ...G.map(g => Gc(g, `<b>${GSHORT[g]} ث</b>`)), H('المجموع بحسب اللجنة', { rs: 2 })], G.map(g => Gc(g, 'عدد الطلاب', { fs: '8pt' }))];
  const grp = groupRuns(S.com, c => c.fl);
  grp.forEach(run => run.items.forEach((c, i) => {
    const r = []; if (i === 0) r.push(L(esc(run.key), { rs: run.items.length }));
    r.push({ v: `<b>${c.no}</b>` }, { v: esc(c.rm) }, ...G.map(g => Gc(g, +c.c[g] || 0)), { v: `<b>${comSum(c)}</b>` });
    rows.push(r);
  }));
  const t = comTotals(); rows.push([L('المجموع', { cs: 3 }), ...G.map(g => L(t[g])), L(t.all)]);
  return T(rows, { cls: 'dense' });
}
function comPlacesTable() {
  const rows = [[H('مقر اللجنة'), H('رقم اللجنة'), H('المقر ( الشعبة )')]];
  groupRuns(S.com, c => c.fl).forEach(run => run.items.forEach((c, i) => { const r = []; if (i === 0) r.push(L(esc(run.key), { rs: run.items.length })); r.push({ v: `<b>${c.no}</b>` }, { v: esc(c.rm) }); rows.push(r); }));
  return T(rows, { cls: 'dense' });
}
function groupRuns(arr, f) { const out = []; arr.forEach(x => { const k = f(x); if (out.length && out[out.length - 1].key === k) out[out.length - 1].items.push(x); else out.push({ key: k, items: [x] }); }); return out; }
function stickerPage(c, o) {
  const N = Math.max(2, Math.min(10, +o.cols || 6)), doorLeft = o.door === 'left';
  const order = [2, 3, 1].filter(g => (+c.c[g] || 0) > 0); const pat = order.length ? order : [2, 3, 1];
  const laneG = Array.from({ length: N }, (_, i) => pat[i % pat.length]);
  const lanesOf = {}; laneG.forEach((g, i) => (lanesOf[g] = lanesOf[g] || []).push(i));
  const counts = new Array(N).fill(0), seats = new Array(N).fill('');
  const stu = S.distributed ? S.students.filter(x => x.com === c.no) : [];
  Object.keys(lanesOf).forEach(g => {
    const idx = lanesOf[g], n = +c.c[g] || 0, k = idx.length;
    const list = stu.filter(x => x.g === +g).sort((a, b) => a.seat - b.seat);
    let st = 0;
    idx.forEach((li, j) => { const cnt = Math.floor(n / k) + (j < n % k ? 1 : 0); counts[li] = cnt; const part = list.slice(st, st + cnt); if (part.length) seats[li] = part.length > 1 ? `${part[0].seat} – ${part[part.length - 1].seat}` : `${part[0].seat}`; st += cnt; });
  });
  // أعلى الصفحة: جدول الأعداد ثم عنوان الكروكي
  const cnt = T([...G.map(g => [Gc(g, `<b style="font-size:14pt">${GSHORT[g]}</b>`, { w: '45%' }), Gc(g, `<b style="font-size:14pt">${+c.c[g] || 0}</b>`)]), [{ v: '<b style="font-size:14pt">المجموع</b>' }, { v: `<b style="font-size:14pt">${comSum(c)}</b>` }]]);
  const center = (html, w) => `<table dir="rtl" border="0" cellspacing="0" cellpadding="0" width="100%"><tr><td style="width:${(100 - w) / 2}%"></td><td style="width:${w}%">${html}</td><td style="width:${(100 - w) / 2}%"></td></tr></table>`;
  const ttl = T([[{ v: '<b style="font-size:26pt;color:#c00000">كروكي اللجان</b>', h: '58px' }]]);
  // الجدول الرئيسي
  const TC = 2 * N - 1; // أعمدة المسارات مع الممرات
  const doorW = 9, gapW = 2.2, laneW = (100 - doorW - gapW * (N - 1)) / N;
  const base = Math.floor(TC / 5), extra = TC - base * 5;
  const spans = [base, base, base + extra, base, base];
  const blue = '#dae3f3', gray = '#f2f2f2';
  const head = [
    { v: '<b style="font-size:15pt">رقم<br>اللجنة</b>', bg: blue }, { v: `<b style="font-size:26pt">${c.no}</b>`, bg: '#fff' },
    { v: `<span style="font-size:11pt">العام الدراسي ${esc(S.s.yearTxt)}<br>الفصل الدراسي ${esc(S.s.sem)} – الدور ${esc(S.s.round)}</span>`, bg: gray },
    { v: '<b style="font-size:15pt">مقر<br>اللجنة</b>', bg: blue }, { v: `<b style="font-size:14pt">${esc(c.rm && c.rm !== c.fl ? (/^\d+$/.test(c.rm) ? 'ش ' + c.rm : c.rm) : '')}<br>${esc(c.fl)}</b>`, bg: blue }
  ].map((x, i) => Object.assign(x, { cs: spans[i], h: '74px' }));
  const door = { v: '<b style="font-size:12pt">باب<br>الفصل</b>', bg: '#d9d9d9', w: doorW + '%' };
  const arrow = { v: `<img src="${doorLeft ? ARROW.left : ARROW.right}" width="54" height="76" alt="">`, rs: 3, w: doorW + '%', st: 'vertical-align:top;border-bottom:0' };
  const lanes = Array.from({ length: N }, (_, i) => i); if (doorLeft) lanes.reverse();
  const gap = () => ({ v: '', st: 'background:#fff' });
  const r2 = [], r3 = [], r4 = [];
  lanes.forEach((li, k) => {
    const g = laneG[li];
    if (k > 0) { r2.push(Object.assign(gap(), { rs: 3, w: gapW + '%' })); }
    r2.push(Gc(g, `<b style="font-size:16pt">${GSHORT[g]}</b>`, { w: laneW + '%', h: '60px' }));
    r3.push(Gc(g, `<b style="font-size:16pt">مسار<br>${li + 1}</b>${seats[li] ? `<br><span style="font-size:10pt">أرقام الجلوس<br>${seats[li]}</span>` : ''}`, { h: '230px' }));
    r4.push({ v: `<b style="font-size:13pt">العدد: ${counts[li]}</b>`, h: '34px' });
  });
  r3.cls = 'gr';
  const rows = doorLeft ? [[...head, door], [...r2, arrow], r3, r4] : [[door, ...head], [arrow, ...r2], r3, r4];
  return center(cnt, 56) + sp(28) + center(ttl, 64) + sp(22) + T(rows, { cls: 'kroki grow' }) + sp(10) +
    `<p class="ds">مقدمة القاعة (السبورة) في الأعلى — جميع أماكن الطلاب ثابتة طوال فترة الاختبارات حسب أرقام الجلوس</p>`;
}
function callSheetPages(c) {
  const stu = S.students.filter(x => x.com === c.no).sort((a, b) => a.seat - b.seat);
  const per = 34, pages = [];
  const dayCols = S.days.map(d => H(`${dayName(d)}<br><span style="font-size:8pt">${dateShort(d)}</span>`, { fs: '9pt' }));
  for (let i = 0; i < Math.max(1, stu.length); i += per) {
    const part = stu.slice(i, i + per);
    const rows = [[H('م', { w: '4%' }), H('رقم الجلوس', { w: '8%' }), H('اسم الطالب', { w: '33%' }), H('الصف', { w: '5%' }), H('الشعبة', { w: '6%' }), ...dayCols]];
    part.forEach((x, k) => rows.push([i + k + 1, `<b>${x.seat}</b>`, { v: esc(x.n), al: 'right' }, Gc(x.g, GSHORT[x.g]), x.sec, ...S.days.map(() => '')]));
    pages.push(title(`كشف المناداة وتسليم أوراق الإجابة – لجنة رقم ( ${c.no} ) – ${esc(comPlace(c))}`, `أول: ${+c.c[1] || 0} — ثاني: ${+c.c[2] || 0} — ثالث: ${+c.c[3] || 0} — المجموع: ${comSum(c)}${stu.length > per ? ` — صفحة ${Math.floor(i / per) + 1} من ${Math.ceil(stu.length / per)}` : ''}`) + T(rows, { cls: 'call' }) + sp(6) + sigs([['اسم الملاحظ', ''], ['مشرف الدور', '']]));
  }
  return pages;
}
function deliverPages(size) {
  const out = []; const nos = S.com.map(c => c.no);
  for (let i = 0; i < nos.length; i += size) { const a = nos[i], b = nos[Math.min(nos.length, i + size) - 1]; out.push(`<p style="text-align:center;font-size:40pt;font-weight:bold;margin:40px 0 20px">تسليم لجـــــان</p><p style="text-align:center;font-size:120pt;font-weight:bold;margin:0;line-height:1.2" dir="ltr">${a} <span style="color:#c00000">–</span> ${b}</p>`); }
  return out;
}
function dailyTable(se) {
  const subs = G.map(g => (se.per.s[g] || '').trim());
  const rows = [[H('رقم اللجنة', { rs: 2, w: '11%' }), H('المقر', { rs: 2, w: '17%' }), H('عدد الطلاب', { cs: 3 }), H('العدد الكلي', { rs: 2, w: '12%' }), H('توقيع الملاحظ', { rs: 2, w: '26%' })], G.map(g => Gc(g, `<b>${GSHORT[g]}</b>`))];
  const t = { 1: 0, 2: 0, 3: 0 };
  S.com.forEach(c => {
    const n = G.map(g => subs[g - 1] ? (+c.c[g] || 0) : 0); G.forEach((g, i) => t[g] += n[i]);
    rows.push([{ v: `<b>${c.no}</b>` }, { v: esc(comPlace(c)), fs: '8.5pt' }, ...G.map((g, i) => Gc(g, subs[g - 1] ? n[i] : '–')), { v: `<b>${n.reduce((a, b) => a + b, 0)}</b>` }, '']);
  });
  rows.push([L('المجموع', { cs: 2 }), ...G.map(g => L(t[g])), L(t[1] + t[2] + t[3]), L('')]);
  return T(rows, { cls: 'dense' });
}
function obsTablePages(o) {
  const out = [];
  sesOpt(o || {}).forEach(se => {
    const rows = [];
    S.com.forEach(c => { const l = obsList(`${se.key}_${c.no}`).filter(Boolean); const n = Math.max(1, l.length); for (let i = 0; i < n; i++) rows.push({ c, name: l[i] || '', first: i === 0, n }); });
    const per = 32;
    for (let k = 0; k < rows.length; k += per) {
      const part = rows.slice(k, k + per);
      const tr = [[H('رقم اللجنة', { w: '10%' }), H('المقر', { w: '19%' }), H('عدد الطلاب', { w: '10%' }), H('اسم الملاحظ'), H('التوقيع', { w: '22%' })]];
      part.forEach((r, i) => { const row = []; if (r.first || i === 0) { const span = r.first ? r.n : r.n - rows.slice(0, k).filter(x => x.c === r.c).length; row.push({ v: `<b>${r.c.no}</b>`, rs: Math.min(span, part.length - i) }, { v: esc(comPlace(r.c)), fs: '8.5pt', rs: Math.min(span, part.length - i) }, { v: comSum(r.c), rs: Math.min(span, part.length - i) }); } row.push({ v: `<b>${esc(r.name)}</b>`, al: 'right' }, ''); tr.push(row); });
      out.push(title('جدول توزيع الملاحظين على اللجان') + sesInfo(se) + sp(6) + T(tr, { cls: 'dense obsT' }) + sp(8) + sigs([['وكيل شؤون الطلاب', S.s.stuDep], ['مدير المدرسة', S.s.principal]]));
    }
  });
  return out;
}
function openEnvPage(se) {
  const mem = S.s.openMembers.map(m => ({ ...m }));
  if (S.s.openWithTeachers) sessionSubjects(se).forEach(x => { const t = teacherOf(x.sub, x.g); if (t && !mem.some(m => normName(m.n) === normName(t))) mem.push({ n: t, w: 'معلم ' + x.sub, r: 'عضواً' }); });
  const rows = [[H('م', { w: '6%' }), H('الاسم'), H('عمله'), H('الصفة', { w: '12%' }), H('التوقيع', { w: '20%' })]];
  mem.forEach((m, i) => rows.push([i + 1, { v: `<b>${esc(m.n)}</b>`, al: 'right' }, esc(m.w), esc(m.r), '']));
  return title('محضر فتح مظروف أسئلة', yearLine()) + sesInfo(se) + sp(10) +
    `<p class="txt">تم فتح مظروف الأسئلة عند الساعة (&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;) ووجد:</p><p class="txt">☐ سليم &nbsp;&nbsp;&nbsp;&nbsp; ☐ غير سليم وتم تحرير محضر بذلك.</p>` +
    `<p class="lbl">أعضاء اللجنة:</p>` + T(rows) + `<p class="note">تفتح مظاريف الأسئلة قبل بدء الاختبار بـ ( 15 ) دقيقة.</p>` + sp(16) + sigs([['مدير المدرسة', S.s.principal]]);
}
function agreePage(se) {
  const rows = [[H('المعلم'), H('مادة التدريس'), H('التوقيع', { w: '25%' })]];
  const ts = []; sessionSubjects(se).forEach(x => { let l = teachersOfSubject(x.sub, x.g); if (!l.length) l = S.st.filter(s => s.sub.trim() === x.sub && +s.g === x.g).map(s => s.t).filter(Boolean); l.forEach(t => ts.push([t, x.sub])); });
  ts.forEach(r => rows.push([{ v: `<b>${esc(r[0])}</b>`, al: 'right' }, esc(r[1]), '']));
  for (let i = ts.length; i < Math.max(6, ts.length + 2); i++) rows.push(['&nbsp;', '', '']);
  return title('محضر اتفاقية التصحيح وسلامة الأسئلة ونموذج الإجابة من الأخطاء', yearLine()) + sesInfo(se) + sp(10) +
    `<p class="txt">تم مراجعة نموذج الأسئلة مع نموذج الإجابة وتبين لنا صحة وسلامة فقرات الأسئلة وفق جدول المواصفات وخلوها من الأخطاء وتوافقها مع المقرر الدراسي، وصحة نموذج الإجابة.</p><p class="txt">وعلى هذا تم تحرير هذا المحضر.</p>` + T(rows, { cls: 'tall' }) + sp(16) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep], ['مدير المدرسة', S.s.principal]]);
}
function envBox(rows) { return T(rows.map(r => r.map((c, i) => i % 2 === 0 ? L(c, { w: '22%' }) : { v: `<b>${c}</b>` }))); }
function qEnvPages(o) {
  const out = []; const cs = comOpt(o);
  sesOpt(o).forEach(se => sessionSubjects(se).forEach(x => cs.forEach(c => {
    if (!(+c.c[x.g] > 0)) return;
    out.push(`<div class="env">` + title('ظرف أسئلة الطلاب') + envBox([
      ['العام الدراسي', esc(S.s.yearTxt), 'الفصل الدراسي', esc(S.s.sem)], ['الدور', esc(S.s.round), 'المادة', esc(x.sub)],
      ['الصف', GNAME[x.g], 'الشعبة', 'جميع الشعب'], ['اليوم', dayName(se.day), 'التاريخ', dateTxt(se.day)],
      ['الفترة', esc(se.per.n) + ' ' + esc(se.per.t), 'رقم اللجنة', `<span style="font-size:20pt">${c.no}</span>`], ['المقر', esc(comPlace(c)), 'عدد طلاب اللجنة', `<span style="font-size:20pt">${+c.c[x.g]}</span>`]
    ]) + `</div>`);
  })));
  const pages = []; for (let i = 0; i < out.length; i += 2) pages.push(out[i] + (out[i + 1] ? `<p class="cut">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</p>` + out[i + 1] : ''));
  return pages;
}
function aEnvPages(o) {
  const out = [];
  sesOpt(o).forEach(se => sessionSubjects(se).forEach(x => {
    const ncom = S.com.filter(c => +c.c[x.g] > 0).length, n = S.com.reduce((a, c) => a + (+c.c[x.g] || 0), 0);
    out.push(title('ظرف أوراق إجابات الطلاب') + envBox([
      ['العام الدراسي', esc(S.s.yearTxt), 'الفصل الدراسي', esc(S.s.sem)], ['الدور', esc(S.s.round), 'المادة', esc(x.sub)],
      ['الصف', GNAME[x.g], 'الشعبة', 'جميع الشعب'], ['اليوم', dayName(se.day), 'التاريخ', dateTxt(se.day)],
      ['الفترة', esc(se.per.n), 'عدد اللجان', ncom], ['عدد ظروف المادة', '', 'ظرف المادة رقم', ''],
      ['عدد المتقدمين', n, 'عدد الحاضرين', ''], ['عدد الغائبين', '', 'المجموع', '']
    ]) + sp(14) + T([[H('المصحح الأول'), H('المصحح الثاني'), H('المراجع'), H('الراصد')], [{ v: '&nbsp;', h: '60px' }, '', '', '']]));
  }));
  return out;
}
function specialPages(o) {
  const sl = S.special[+o.li || 0]; if (!sl) return ['<p class="txt">أضف قائمة من صفحة «المعلمون والمواد».</p>'];
  const rows = [[H('اليوم', { w: '18%' }), H('اسم الطالب'), H('الصف', { w: '9%' }), H('المادة', { w: '22%' }), H(sl.kind === 'grade' ? 'الدرجة' : 'التوقيع', { w: '14%' })]];
  S.days.forEach(d => {
    const items = [];
    sl.rows.filter(r => r.n && r.n.trim()).forEach(r => { const subs = d.p.map(p => (p.s[r.g] || '').trim()).filter(Boolean); subs.forEach(sb => items.push([r, sb])); });
    items.forEach(([r, sb], i) => { const row = []; if (i === 0) row.push(L(`${dayName(d)}<br><span style="color:#c00000">${dateTxt(d)}</span>`, { rs: items.length })); row.push({ v: `<b>${esc(r.n)}</b>`, al: 'right' }, Gc(r.g, GSHORT[r.g]), Gc(r.g, esc(sb)), ''); rows.push(row); });
  });
  if (rows.length === 1) rows.push([{ v: 'لا يوجد طلاب في القائمة بعد', cs: 5 }]);
  return [title(esc(sl.title), yearLine()) + T(rows)];
}
function receiptTable() {
  const tot = gradeTotals();
  const rows = [[H('اسم المعلم'), H('المادة'), H('الصف'), H('عدد الأوراق'), H('الإجابة النموذجية بالداخل'), H('التوقيع', { w: '16%' })]];
  G.forEach(g => { const l = S.st.filter(x => +x.g === g); l.forEach((x, i) => { const r = [{ v: `<b>${esc(x.t)}</b>`, al: 'right' }, Gc(g, `<b>${esc(x.sub)}</b>`)]; if (i === 0) r.push(Gc(g, `<b>${GNAME[g].replace('الصف ', '')}</b>`, { rs: l.length }), Gc(g, `<b>${tot[g]}</b>`, { rs: l.length })); r.push('☐', ''); rows.push(r); }); });
  return T(rows, { cls: 'tall' });
}
function assignPages(o) {
  const tot = gradeTotals(); const gs = S.s.gs || {};
  return S.st.filter(x => gOk(o, x.g)).flatMap(x => { const letter =
    T([[{ v: `<b style="font-size:15pt">تكليف وضع أسئلة الاختبارات النهائية</b><br>للعام الدراسي ${esc(S.s.yearTxt)} ( الفصل الدراسي ${esc(S.s.sem)} )`, bg: HCOL, cs: 3 }], [L('الأخ المعلم', { w: '25%' }), { v: `<b style="font-size:14pt">${esc(x.t)}</b>` }, L('وفقه الله', { w: '20%' })]]) + sp(10) +
    `<p class="txt">السلام عليكم ورحمة الله وبركاته</p><p class="txt">نظراً لقرب موعد الاختبارات النهائية للفصل الدراسي ${esc(S.s.sem)}، وبناءً على الصلاحيات الممنوحة لمدير المدرسة، وبناءً على ما تقتضيه مصلحة العمل، واستناداً إلى ما ورد في الدليل التنظيمي للاختبارات النهائية،</p>
    <p class="txt">عليه فقد تم تكليفكم بوضع أسئلة الاختبار الموضحة أدناه بالجدول ( ورقياً ) مع مراعاة شروط إعداد أسئلة الاختبارات ووضع نماذج الإجابة وتسليمها لإدارة المدرسة في موعد أقصاه ${S.s.deadline ? `<b>${esc(S.s.deadline)}</b>` : 'يوم ........................ الموافق &nbsp;&nbsp; / &nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; هـ'} أسئلة ( الدور الأول + الدور الثاني + نموذج الإجابة ).</p><p class="txt">وتقبلوا تحياتنا ...</p>` +
    T([[H('المقرر'), H('الشعب الدراسية'), H('العدد المطلوب'), H('درجة الاختبار')], [Gc(x.g, `<b>${esc(x.sub)}</b>`), GNAME[x.g].replace('الصف ', ''), `<b>${tot[x.g]}</b>`, `<b>${x.mark || S.s.mark}</b>`]]) + sp(8) +
    T([[H('يتم تقسيم درجات الأسئلة وفق التالي :', { cs: 2 })], ['........ فقرة', 'اختيار من متعدد'], ['........ فقرة', 'مزاوجة'], ['........ فقرة', 'صواب وخطأ'], ['........ فقرة', 'أخرى: ....................']]) + sp(20) +
    sigs([['المعلم', x.t], ['وكيل الشؤون التعليمية', S.s.eduDep], ['مدير المدرسة', S.s.principal]]);
  if (!gs.include) return [letter];
  if (gs.place === 'inside') return [letter.replace(/<table class="sg"[\s\S]*$/, '') + `<p class="lbl" style="text-align:center">بيان توزيع الدرجات</p>` + gsContent(true) + sp(6) + sigs([['المعلم', x.t], ['وكيل الشؤون التعليمية', S.s.eduDep], ['مدير المدرسة', S.s.principal]])];
  return [letter, title('بيان توزيع الدرجات', `مرفق بتكليف وضع أسئلة مادة ${esc(x.sub)} – ${GNAME[x.g]}`) + gsContent(false)];
  });
}
function completePages(o) {
  return G.filter(g => gOk(o, g)).map(g => {
    const l = S.ta.filter(x => +x.g === g);
    const runs = groupRuns(l, x => x.sub);
    const rows = [[H('المقرر'), H('الشعبة'), H('المعلم'), H('التوقيع', { w: '20%' })]];
    runs.forEach(run => run.items.forEach((x, i) => { const r = []; if (i === 0) r.push(Gc(g, `<b>${esc(run.key)}</b>`, { rs: run.items.length })); r.push({ v: esc(x.sec), st: 'direction:ltr' }, { v: `<b>${esc(x.t)}</b>`, al: 'right' }, ''); rows.push(r); }));
    return title(`إقرار بإنهاء شرح كامل المقرر الدراسي للفصل الدراسي ${esc(S.s.sem)} من العام الدراسي ${esc(S.s.yearTxt)}`, GNAME[g]) +
      `<p class="txt">أُقر أنا المعلم الموقع أدناه بأنني أنهيت تدريس كامل المقررات الدراسية في الوقت المحدد، وعلى ذلك جرى التوقيع.</p>` + T(rows, { cls: 'dense' });
  });
}
function correctPages(o) {
  return G.filter(g => gOk(o, g)).map(g => {
    const subs = []; S.days.forEach(d => d.p.forEach(p => { const s = (p.s[g] || '').trim(); if (s && !subs.includes(s)) subs.push(s); }));
    const coms = S.com.filter(c => +c.c[g] > 0);
    const k = Math.max(1, subs.length), per = Math.ceil(coms.length / k);
    const rows = [[H('المادة'), H('الشعب'), H('رقم اللجنة'), H('مقرها'), H('عدد الطلاب'), H('المعلم')]];
    let total = 0;
    subs.forEach((s, si) => {
      const part = coms.slice(si * per, si * per + per);
      part.forEach((c, i) => { total += +c.c[g]; const r = []; if (i === 0) r.push(Gc(g, `<b>${esc(s)}</b>`, { rs: part.length })); if (si === 0 && i === 0) r.push({ v: 'جميع الشعب', rs: coms.length }); r.push(`<b>${c.no}</b>`, { v: esc(comPlace(c)), fs: '8pt' }, +c.c[g]); if (i === 0) r.push({ v: `<b>${esc(teacherOf(s, g))}</b>`, rs: part.length }); rows.push(r); });
    });
    rows.push([L('عدد الطلاب', { cs: 4 }), L(total), L('')]);
    return title(`توزيع أوراق طلاب ${GNAME[g].replace('الصف ', '')} على المصححين حسب اللجان`, yearLine()) + T(rows, { cls: 'dense' });
  });
}
const DENS = { cmp: { per: 38, cls: 'cmp' }, mid: { per: 30, cls: 'mid' }, std: { per: 24, cls: 'tall' } };
function densOf() { return DENS[(S.s.taPrint || {}).dens] || DENS.cmp; }
function taSheetPages(o) {
  const op = S.s.taPrint || {}; const D = densOf(); const showH = op.h !== false, showS = op.sign !== false, showN = !!op.note;
  const ncol = 3 + (showH ? 1 : 0) + (showS ? 1 : 0) + (showN ? 1 : 0);
  const head = [H('المقرر', { w: '24%' })]; if (showH) head.push(H('عدد الحصص', { w: '8%' })); head.push(H('الشعبة', { w: '19%' }), H('المعلم')); if (showS) head.push(H('التوقيع', { w: '15%' })); if (showN) head.push(H('ملاحظات', { w: '13%' }));
  // وحدات الطباعة: شريط الصف ثم مجموعات المواد (لا تُقسم المادة بين صفحتين)
  const grades = G.filter(g => gOk(o, g) && S.ta.some(x => +x.g === g));
  const pages = []; let cur = [], used = 0;
  const flush = () => { if (cur.length) pages.push(cur); cur = []; used = 0; };
  grades.forEach(g => {
    if (op.split !== false) flush();
    const runs = groupRuns(S.ta.filter(x => +x.g === g), x => normName(x.sub));
    const firstRun = runs[0] ? runs[0].items.length : 0;
    if (used && used + 1 + firstRun > D.per) flush();
    cur.push({ band: g, cont: false }); used++;
    runs.forEach(r => {
      if (used + r.items.length > D.per && used > 1) { flush(); cur.push({ band: g, cont: true }); used = 1; }
      cur.push({ run: r, g }); used += r.items.length;
    });
  });
  flush();
  if (!pages.length) return ['<p class="txt">لا يوجد إسناد بعد.</p>'];
  return pages.map((pg, pi) => {
    const rows = [head];
    pg.forEach(u => {
      if (u.band) { rows.push([{ v: `<b>${GNAME[u.band]}${u.cont ? ' (تابع)' : ''}</b>`, cs: ncol, bg: GCOL[u.band], st: 'text-align:right;padding-right:10px' }]); return; }
      u.run.items.forEach((x, i) => { const row = []; if (i === 0) row.push(Gc(u.g, `<b>${esc(u.run.items[0].sub)}</b>`, { rs: u.run.items.length })); if (showH) row.push(esc(x.h || '')); row.push({ v: esc(x.sec), st: 'direction:ltr' }, { v: `<b>${esc(x.t)}</b>`, al: 'right' }); if (showS) row.push(''); if (showN) row.push(''); rows.push(row); });
    });
    return title(`${esc(op.title || 'إسناد المعلمين')} للعام الدراسي ${esc(S.s.yearTxt)}`, `الفصل الدراسي ${esc(S.s.sem)}${pages.length > 1 ? ` — صفحة ${pi + 1} من ${pages.length}` : ''}`) + T(rows, { cls: D.cls }) + sp(8) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep], ['مدير المدرسة', S.s.principal]]);
  });
}
function packWeighted(list, cap, wf) { const pages = []; let cur = [], u = 0; list.forEach(x => { const w = wf(x); if (cur.length && u + w > cap) { pages.push(cur); cur = []; u = 0; } cur.push(x); u += w; }); if (cur.length) pages.push(cur); return pages.length ? pages : [[]]; }
function stListPages(o = {}) {
  const D = densOf(), op = S.s.taPrint || {}, out = [];
  const list = S.st.filter(x => gOk(o, x.g)).sort((a, b) => a.g - b.g); let k = 0;
  packWeighted(list, D.per, x => Math.max(1, Math.ceil(teachersOfSubject(x.sub, x.g).join('، ').length / 44))).forEach(part => {
    const rows = [[H('م', { w: '4%' }), H('المادة', { w: '17%' }), H('الصف', { w: '7%' }), H('المعلم المكلف بوضع الأسئلة', { w: '22%' }), H('معلمو المادة في الإسناد'), H('الدرجة', { w: '6%' }), ...(op.sign !== false ? [H('التوقيع', { w: '12%' })] : [])]];
    part.forEach((x, i) => rows.push([k + i + 1, Gc(x.g, `<b>${esc(x.sub)}</b>`), Gc(x.g, GSHORT[x.g]), { v: `<b>${esc(x.t)}</b>`, al: 'right' }, { v: esc(teachersOfSubject(x.sub, x.g).join('، ')), al: 'right', fs: '8.5pt' }, esc(x.mark || S.s.mark), ...(op.sign !== false ? [''] : [])]));
    k += part.length;
    out.push(title('معلمو المواد المختبرة (واضعو الأسئلة)', yearLine()) + T(rows, { cls: D.cls }) + sp(8) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep], ['مدير المدرسة', S.s.principal]]));
  });
  return out;
}
function tListPages() {
  const t = arSort(S.teachers.filter(Boolean)), D = densOf(), half = D.per, out = [];
  for (let k = 0; k < Math.max(1, t.length); k += half * 2) {
    const rows = [[H('م', { w: '5%' }), H('اسم المعلم'), H('التوقيع', { w: '14%' }), H('م', { w: '5%' }), H('اسم المعلم'), H('التوقيع', { w: '14%' })]];
    const a = t.slice(k, k + half), b = t.slice(k + half, k + half * 2);
    for (let i = 0; i < Math.max(a.length, b.length); i++) rows.push([a[i] ? k + i + 1 : '', { v: esc(a[i] || ''), al: 'right' }, '', b[i] ? k + half + i + 1 : '', { v: esc(b[i] || ''), al: 'right' }, '']);
    out.push(title('كشف بأسماء المعلمين', yearLine()) + T(rows, { cls: D.cls }));
  }
  return out;
}
function taLoadPages() {
  const m = new Map();
  S.ta.forEach(x => { const k = normName(x.t); if (!m.has(k)) m.set(k, { t: x.t, subs: [], secs: 0, h: 0, hasH: false }); const r = m.get(k); r.subs.push(`${x.sub} (${GSHORT[x.g]})`); const n = x.sec ? x.sec.split('-').filter(Boolean).length : 0; r.secs += n; if (+x.h) { r.h += (+x.h) * Math.max(1, n); r.hasH = true; } });
  const list = [...m.values()].sort((a, b) => b.h - a.h || b.secs - a.secs || a.t.localeCompare(b.t, 'ar'));
  const D = densOf(), out = []; let k = 0;
  packWeighted(list, D.per - 2, r => Math.max(1, Math.ceil([...new Set(r.subs)].join('، ').length / 46))).forEach(part => {
    const rows = [[H('م', { w: '5%' }), H('المعلم', { w: '24%' }), H('المواد المسندة'), H('عدد الشعب', { w: '9%' }), H('مجموع الحصص', { w: '10%' }), H('التوقيع', { w: '13%' })]];
    part.forEach((r, i) => rows.push([k + i + 1, { v: `<b>${esc(r.t)}</b>`, al: 'right' }, { v: esc([...new Set(r.subs)].join('، ')), fs: '9pt', al: 'right' }, r.secs, r.hasH ? `<b>${r.h}</b>` : '—', '']));
    k += part.length;
    out.push(title('نصاب المعلمين من الإسناد', yearLine()) + T(rows, { cls: D.cls }) + `<p class="note">مجموع الحصص = عدد حصص المادة × عدد الشعب المسندة (يظهر عند تعبئة عمود «عدد الحصص» في الإسناد).</p>`);
  });
  return out;
}
const OBS_INSTR = ['التأكد من أن الأسئلة وورقة الإجابة الموزعة تخص الطالب.', 'التأكد من أن الطالب قام بكتابة اسمه على ورقة الأسئلة.', 'يحل الطالب جميع الأسئلة بورقة الأسئلة بقلم أزرق، وبعد مضي نصف ساعة يتم توزيع ورقة الإجابة ليظلل الإجابات بالقلم الرصاص المعتمد من إدارة المدرسة، والتأكد من أن الطالب قام بعملية التظليل لكافة الإجابات.', 'عند انتهاء الطالب من الإجابة تجمع أوراق الأسئلة والإجابات وأقلام الرصاص.', 'التأكد من أن الطالب في مكانه المخصص حسب الكروكي المعلق بالباب.', 'يجب وجود الملاحظ داخل اللجنة قبل دخول الطلاب (بربع ساعة) وعليه أن يأخذ وضعاً مناسباً أثناء الملاحظة.', 'لا ينبغي جلوس الملاحظ في اللجنة حتى خروج آخر طالب، وفي حالة وجود ما يبرر ذلك عليه إبلاغ المشرف فوراً لاستبداله بملاحظ آخر.', 'يجب العمل على إيجاد الهدوء داخل اللجنة والبعد عن الضجيج.', 'ينبغي للملاحظ أن يتصرف بحكمة وأن يأخذ الأمور بروية وأن يبتعد عن الانفعال.', 'عند ملاحظة أي أمر يؤثر على سير الاختبار يقوم الملاحظ بإبلاغ أقرب مسؤول ولا ينشغل عن ملاحظة اللجنة.', 'لا يجوز السماح داخل اللجنة بتبادل الأدوات المكتبية بين الطلاب، أو أوراق الأسئلة أو سواها.', 'ممنوع الانشغال بترتيب أوراق الإجابة وتنظيمها أو أي أمر آخر داخل اللجنة طالما أن فيها طلاباً.', 'لا يسمح الملاحظ بخروج أي طالب من اللجنة قبل مضي نصف الوقت وسماع الجرس، وينبغي أن يتم توقيع الطالب في كشف تسليم أوراق الإجابة على مقعده دون قيامه.', 'الزمن المقرر للإجابة ملك الطالب وعلى الملاحظ تركه حتى نهاية الوقت المقرر لكل مادة.', 'في حالة غياب طالب يتم تظليل ورقة الإجابة بقلم الرصاص في المكان المخصص لذلك وتوضع في ترتيبها مع أوراق الإجابة، ويكتب محضر غياب للطالب المتغيب ويوقع من قبل الملاحظ ومراقب اللجنة ويسلم للكنترول.', 'لا يحق لأحد قراءة أسئلة الاختبار ويجوز ذلك لواضع الأسئلة عند الحاجة وبعد موافقة المشرف على الاختبار.', 'اللجنة تحت مسؤولية الملاحظ وحده وعليه ألا يسمح لأحد بدخولها ما لم تكن له صفة رسمية.', 'عند ملاحظة غش طالب أو محاولته على الملاحظ ضبط وسيلة الغش واستدعاء المشرف على الاختبار لاتخاذ الإجراء المناسب وإعداد المحضر اللازم بهذا الشأن.', 'يجب ترتيب أوراق الإجابة حسب الكشف وكل مرحلة على حدة قبل تسليمها للجنة الكنترول.', 'إذا احتاج أحد الطلاب الذهاب إلى دورة المياه على الملاحظ استدعاء أحد المشرفين على اللجان بعد التأكد من جدية الطالب.', 'يمنع طرد أي طالب من اللجنة عند أي مشكلة وعلى الملاحظ استدعاء المشرف لاتخاذ اللازم.', 'التأكيد على الطلاب بعدم طي أو ثني أوراق الإجابات.'];
function obsInstrPages() {
  const p1 = title('مهام ومسؤوليات ملاحظي اللجان', yearLine()) + `<p class="txt">فيما يلي بعض مهام ومسؤوليات ملاحظي اللجان آمل الاطلاع عليها والتقيد بها :</p><ol class="ins small">${OBS_INSTR.map(x => `<li>${x}</li>`).join('')}</ol>`;
  const t = S.teachers, half = Math.ceil(t.length / 2), pages = [p1];
  const per = 26;
  for (let s = 0; s < Math.max(1, half); s += per) {
    const rows = [[H('م', { w: '5%' }), H('اسم المعلم'), H('التوقيع', { w: '14%' }), H('م', { w: '5%' }), H('اسم المعلم'), H('التوقيع', { w: '14%' })]];
    for (let i = s; i < Math.min(half, s + per); i++) { const a = t[i], b = t[i + half]; rows.push([i + 1, { v: esc(a || ''), al: 'right' }, '', b ? i + half + 1 : '', { v: esc(b || ''), al: 'right' }, '']); }
    pages.push(title('أخي المعلم، آمل قراءة تعليمات الملاحظة والتقيد بها أثناء الملاحظة على اللجان') + T(rows, { cls: 'tall' }));
  }
  return pages;
}
function yearRow() { return T([[L('العام الدراسي'), { v: `<b>${esc(S.s.yearTxt)}</b>` }, L('الفصل الدراسي'), { v: `<b>${esc(S.s.sem)}</b>` }, L('الدور'), { v: `<b>${esc(S.s.round)}</b>` }]]); }
const BLANKDATE = '&nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; هـ';
function auth(roles) { return `<p class="lbl">المصادقة:</p>` + T(roles.map(r => [{ v: 'الاسم:', al: 'right', w: '38%', h: '30px' }, { v: 'الصفة: ' + r, al: 'right' }, { v: 'التوقيع:', al: 'right', w: '24%' }])); }
function absencePage() {
  return title('محضر غياب طالب عن الاختبار') + yearRow() + sp(8) +
    T([[L('اسم الطالب'), { v: '', cs: 3, h: '30px' }], [L('رقم الجلوس'), '', L('اللجنة'), ''], [L('اليوم'), '', L('التاريخ'), BLANKDATE], [L('المادة'), '', L('الفترة'), ''], [L('الصف'), '', L('الشعبة'), '']], { cls: 'tall' }) + sp(10) +
    auth(['رئيس لجنة الإشراف والملاحظة', 'عضو لجنة الإشراف والملاحظة', 'ملاحظ اللجنة']) + `<ul class="ins small"><li>يوضع محضر الغياب حسب رقم جلوس الطالب في تسلسل أوراق الإجابة.</li><li>يسجل في بيان الغائبين.</li></ul>`;
}
function violationPage() {
  return title('محضر مخالفة الأنظمة والتعليمات – طالب') + yearRow() + sp(6) +
    T([[L('اليوم'), '', L('التاريخ'), BLANKDATE, L('المادة'), '', L('الفترة'), '']], { cls: 'tall' }) + `<p class="lbl">بيانات الطالب:</p>` +
    T([[H('اسم الطالب'), H('رقم الجلوس'), H('الصف / الشعبة'), H('التوقيع')], [{ v: '', h: '32px' }, '', '', '']]) + `<p class="lbl">تكرار المخالفة:</p>` +
    T([[H('☐ المرة الأولى'), H('☐ المرة الثانية'), H('☐ المرة الثالثة')]]) + `<p class="lbl">وصف المخالفة: &nbsp;&nbsp; ☐ فردي &nbsp;&nbsp; ☐ جماعي</p>` +
    `<p class="txt">${dots(140)}</p><p class="txt">${dots(140)}</p><p class="txt">${dots(140)}</p>` + auth(['', '', '']) +
    `<ul class="ins small"><li>يوضح مدير المدرسة الإجراء المتخذ نحو المخالفة.</li></ul>`;
}
function dailyAbsPages(o) {
  const days = o.ses && o.ses !== 'all' ? [S.days[+o.ses.split('_')[0]]] : S.days;
  return days.filter(Boolean).map(d => {
    const subs = []; d.p.forEach(p => G.forEach(g => { const sb = (p.s[g] || '').trim(); if (sb) subs.push({ sb, g, per: p }); }));
    return title('كشف الغياب اليومي للطلاب أثناء فترة الاختبارات') +
      T([[H('اليوم'), H('التاريخ'), H('العام الدراسي'), H('الفصل الدراسي'), H('الدور')], [`<b>${dayName(d)}</b>`, `<b style="color:#c00000">${dateTxt(d)}</b>`, esc(S.s.yearTxt), esc(S.s.sem), esc(S.s.round)]]) + sp(6) +
      T([[H('م', { w: '5%' }), H('رقم اللجنة', { w: '9%' }), H('رقم الجلوس', { w: '9%' }), H('اسم الطالب', { w: '30%' }), H('المادة'), H('المرحلة', { w: '8%' }), H('الشعبة', { w: '7%' }), H('سبب الغياب', { w: '16%' })], ...Array.from({ length: 20 }, (_, i) => [i + 1, '', '', '', '', '', '', ''])], { cls: 'tall grow' }) + sp(10) +
      sigs([['وكيل شؤون الطلاب', S.s.stuDep], ['مشرف اللجنة / الدور', 'الاسم: ..................................']]);
  });
}
function late15Page() {
  return title('تعهد طالب تأخر عن الاختبار بما لا يتجاوز خمس عشرة دقيقة') + yearRow() + sp(6) +
    T([[L('اسم الطالب'), { v: '', cs: 3, h: '30px' }], [L('الصف'), '', L('الشعبة'), ''], [L('اليوم'), '', L('التاريخ'), BLANKDATE], [L('المادة'), '', L('الفترة'), ''], [L('وقت بدء الاختبار'), '', L('وقت حضور الطالب'), ''], [L('مقدار التأخر'), { v: '', cs: 3 }]], { cls: 'tall' }) + sp(10) +
    `<p class="txt">أتعهد أنا الطالب / ${dots(60)} الالتزام بالحضور المبكر أيام الاختبارات وعدم تكرار التأخر، وأُشعرت أنه في حال التكرار يتم حسم درجة من درجات المواظبة عن كل تأخر، وعلى ذلك أوقع: ${dots(30)}</p>` + sp(10) +
    sigs([['رئيس لجنة الإشراف والملاحظة', ''], ['رئيس لجنة التحكم والضبط', '']]) + `<ul class="ins small"><li>يسجل في بيان المتأخرين، وفي حالة التكرار يطبق على الطالب لائحة السلوك والمواظبة.</li></ul>`;
}
function lateMorePage() {
  return title('محضر تأخر طالب عن الاختبار أكثر من خمس عشرة دقيقة وبما لا يتجاوز نصف الزمن') + yearRow() + sp(6) +
    T([[L('اسم الطالب'), { v: '', cs: 3, h: '28px' }], [L('الصف'), '', L('الشعبة'), ''], [L('اليوم'), '', L('التاريخ'), BLANKDATE], [L('المادة'), '', L('الفترة'), ''], [L('وقت بدء الاختبار'), '', L('وقت حضور الطالب'), ''], [L('مقدار التأخر'), '', L('توقيع الطالب'), ''], [L('اسم الملاحظ'), '', L('توقيع الملاحظ'), '']], { cls: 'tall' }) +
    `<p class="lbl">أسباب التأخر / تكرار التأخر حسب إفادة الطالب / ولي أمره / أوراق رسمية:</p><p class="txt">${dots(140)}</p><p class="txt">${dots(140)}</p>` +
    `<p class="txt">بعد دراسة أسباب التأخر المقدمة من الطالب المذكور أعلاه، وبناءً على ما توصلت له لجنة التحكم والضبط فقد تقرر ما يلي:</p>` +
    T([['☐ قبول عذر الطالب وتصحح أوراق إجابته', '☐ عدم قبول عذر الطالب ولا تعتمد إجابته'], ['☐ يحسم على الطالب درجة من درجات المواظبة', '☐ إجراء آخر: ..............................']]) + sp(8) +
    sigs([['رئيس لجنة التحكم والضبط', ''], ['توقيع الطالب بالعلم', ''], ['توقيع ولي الأمر بالعلم', ''], ['اعتماد مدير المدرسة', S.s.principal]]);
}
function cheatPage() {
  const yr = (String(S.s.yearTxt).match(/\d{4}/) || [''])[0];
  const LB = (v, x = {}) => L(v, Object.assign({ w: '17%' }, x));
  const full = (v, x = {}) => Object.assign({ v, cs: 4, al: 'right' }, x);
  return `<table dir="rtl" border="0" width="100%"><tr><td style="width:30%"></td><td style="width:40%">${T([[{ v: '<b style="font-size:18pt">محضر حالة غش</b>', h: '46px', st: 'border:2px solid #5a9e4b' }]])}</td><td style="width:30%"></td></tr></table>` + sp(10) +
    T([
      [full(`<b>إنه في يوم : ...................................... الموافق : &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp;&nbsp; / &nbsp;&nbsp; ${yr}هـ</b>`, { h: '34px' })],
      [LB('اسم الطالب'), { v: '', w: '33%' }, LB('الصف / الشعبة'), ''],
      [LB('رقم الجلوس'), '', LB('المادة'), ''],
      [LB('الفصل الدراسي'), `<b>${esc(S.s.sem)}</b>`, LB('العام الدراسي'), `<b>${esc(S.s.yearTxt)}</b>`],
      [LB('رقم اللجنة'), '', LB('الفترة'), ''],
      [full(`<span style="font-size:11pt;line-height:1.9">أقر أنا الطالب المذكور أعلاه بالغش في المادة المذكورة أعلاه وهي المرة ( &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ) وأتعهد بعدم التكرار أو محاولة الغش في مادة أخرى، حيث إنه تم تنبيهي أن الغش للمرة الأولى يلغي درجات السؤال أو الأسئلة التي ثبت غشي فيها وأُعطى فيها صفراً، وأن الغش للمرة الثانية يلغي اختباري في المادة وأعتبر مكملاً، وفي حالة التكرار للمرة الثالثة أُحرم من دخول الاختبارات في بقية المواد.</span>`, { h: '96px' })],
      [LB('اسم الطالب بخط يده'), '', LB('التوقيع'), ''],
      [full(`<b>نحن الأعضاء بملاحظة ومراقبة اللجنة نحيل الطالب المذكور أعلاه إلى رئيس لجنة الاختبارات لاتخاذ اللازم بعدما ثبت لنا ارتكابه الغش في المادة المذكورة أعلاه:</b><br><u><b>ملاحظة:</b></u><br>${dots(120)}<br>${dots(120)}`, { h: '96px' })],
      [LB('ملاحظ اللجنة'), '', LB('التوقيع'), ''],
      [LB('ملاحظ اللجنة'), '', LB('التوقيع'), ''],
      [LB('مراقب اللجنة'), '', LB('التوقيع'), '']
    ], { cls: 'tall' }) + sp(10) +
    `<p class="lbl">** رأي رئيس لجنة الاختبارات بالمدرسة :</p><p class="txt">${dots(140)}</p><p class="txt">${dots(140)}</p>` + sp(8) +
    T([[{ v: '<b>ملحوظة</b>', bg: LCOL, w: '14%' }, { v: '1ـ يرجى إرفاق الدليل المادي على الغش إن وجد، أو نقله إن كان مكتوباً في مكان يتعذر إرفاقه، ويتم نقله خلف هذه الورقة والتصديق بالتوقيع على النص المكتوب والمنقول من قبل الطالب وملاحظي ومراقب اللجنة، والتنويه عن امتناع الطالب عن التوقيع في حالة رفضه.<br>2ـ تُسلَّم هذه الورقة والدليل المادي لمدير المدرسة لاتخاذ اللازم.', al: 'right', fs: '9.5pt' }]], { cls: 'nogrow' });
}
function lateListPage() {
  return title('بيان بأسماء الطلاب المتأخرين عن الاختبار بما لا يتجاوز خمس عشرة دقيقة') + yearRow() + sp(6) +
    T([[H('م', { w: '4%' }), H('اسم الطالب', { w: '24%' }), H('الصف'), H('الشعبة'), H('اليوم'), H('التاريخ'), H('الفترة'), H('المادة'), H('مقدار التأخر'), H('إيضاحات')], ...Array.from({ length: 18 }, (_, i) => [i + 1, '', '', '', '', '', '', '', '', ''])], { cls: 'tall' });
}
function absBySubPage() {
  const subs = []; S.days.forEach(d => d.p.forEach(p => G.forEach(g => { const s = (p.s[g] || '').trim(); if (s) subs.push(s); })));
  return title('بيان حصر الطلاب الغائبين عن الاختبارات حسب المواد الدراسية') + yearRow() + sp(6) +
    T([[H('م', { w: '5%' }), H('اسم الطالب', { w: '35%' }), H('الصف'), H('الشعبة'), H('رقم الجلوس'), H('المادة')], ...Array.from({ length: 16 }, (_, i) => [i + 1, '', '', '', '', ''])], { cls: 'tall' }) +
    `<p class="lbl">الخلاصة:</p>` + T([[L('المادة'), ...subs.slice(0, 13).map(s => ({ v: esc(s), fs: '8pt' }))], [L('عدد الغائبين'), ...subs.slice(0, 13).map(() => '')]]);
}
function errPage(what) {
  return title(`محضر اكتشاف خطأ في ${what}`) + yearRow() + sp(8) +
    `<p class="txt">إنه في يوم ...................... الموافق ${BLANKDATE} تم اكتشاف خطأ في ${what} لمادة ................................... للصف ............................ الشعبة ................... وذلك في:</p>` +
    T([[H('رقم السؤال'), H('رقم الفقرة'), H('الدرجة'), H('نوع الخطأ', { w: '25%' }), H('الإجراء المتخذ', { w: '30%' })], ...Array.from({ length: 6 }, () => ['', '', '', '', ''])], { cls: 'tall' }) + sp(6) +
    `<p class="lbl">لجنة التصحيح والمراجعة:</p>` + T(['رئيس اللجنة', 'عضواً', 'عضواً'].map(r => [{ v: 'الاسم:', al: 'right', h: '28px' }, { v: 'الصفة: ' + r, al: 'right' }, { v: 'التوقيع:', al: 'right' }])) +
    `<ul class="ins small"><li>وفق ما ورد في الفصل السابع من دليل نظم وإجراءات الاختبارات.</li></ul>`;
}
function subjectPages(o, fn) { return S.st.filter(x => gOk(o, x.g)).map(fn); }
function qDataPage(x) {
  return title('البيانات الأولية لورقة الأسئلة') + yearRow() + sp(8) +
    T([[L('الصف', { w: '30%' }), `<b>${GNAME[x.g]}</b>`], [L('الشعبة'), 'جميع الشعب'], [L('المادة'), `<b>${esc(x.sub)}</b>`], [L('الزمن'), ''], [L('عدد الأسئلة'), ''], [L('عدد الأوراق'), ''], [L('اسم المعلم'), `<b>${esc(x.t)}</b>`], [L('التوقيع'), '']], { cls: 'xtall' });
}
function origEnvPage(x) {
  const box = k => title(k) + T([[L('العام الدراسي', { w: '30%' }), esc(S.s.yearTxt)], [L('الفصل الدراسي'), esc(S.s.sem)], [L('الدور'), '☐ الأول &nbsp;&nbsp; ☐ الثاني'], [L('الأسئلة'), '☐ الأساسية &nbsp;&nbsp; ☐ البديلة'], [L('المادة'), `<b>${esc(x.sub)}</b>`], [L('الصف'), GNAME[x.g]], [L('الشعبة'), 'جميع الشعب'], [L('اسم المعلم'), `<b>${esc(x.t)}</b>`], [L('توقيع المعلم'), '']], { cls: 'tall' });
  return `<div class="env">${box('ظرف أصل الأسئلة')}</div><p class="cut">✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -</p><div class="env">${box('ظرف أصل الإجابة النموذجية')}</div>`;
}
function gradeEstPage(x) {
  return title('بيان تقدير الدرجات') + T([[H('المادة'), H('الصف'), H('الشعب الدراسية')], [`<b>${esc(x.sub)}</b>`, GNAME[x.g], 'جميع الشعب']]) + sp(8) +
    T([[H('رقم السؤال', { rs: 2 }), H('نوع السؤال ( صح أو خطأ ) ( اختيار من متعدد ) ( مقالي ) ...', { rs: 2 }), H('الدرجة المستحقة', { cs: 2 })], [H('رقماً'), H('كتابة')], ...Array.from({ length: 8 }, (_, i) => [i + 1, '', '', '']), [L('المجموع', { cs: 2 }), L(x.mark || S.s.mark), L('')]], { cls: 'tall' }) + sp(12) + sigs([['اسم المعلم', x.t]]);
}
function stuGuidePage() {
  const l = ['التأكد من جدول الاختبارات ومواعيدها وأزمنتها.', 'الدخول إلى لجنة الاختبار مع قرع الجرس الأول لكل فترة.', 'عدم اصطحاب أي ورقة أو دفتر أو كتاب أو مفكرة أو جهاز خازن للمعلومات داخل لجنة الاختبار.', 'عدم الكتابة بالرموز أو التلميح أو التصريح على أي شيء أو مكان كطريقة للغش.', 'يجب إحضار قلم أزرق سائل ومسطرة وممحاة وقلم رصاص وأدوات هندسية حيث لن يسمح بالاستعارة داخل اللجان.', 'عدم الالتفات أو التحدث إلى أي زميل أو مع الملاحظين داخل صالات الاختبار، وتكون ورقة الإجابة والأسئلة على الماصة وعدم رفعها في وضع يسمح لزميل آخر بالاطلاع عليها.', 'عدم كتابة أي عبارات أو مواضيع خارجة عن موضوع المادة على ورقة الإجابة.', 'التزام الهدوء التام واحترام النظام داخل صالات الاختبار وفي فناء المدرسة وممراتها.', 'تكتب الإجابة بالقلم الأزرق السائل، والتأكد من تعبئة بيانات الطالب كالاسم ورقم الجلوس والصف والفترة واليوم والتاريخ على ورقة الإجابة عند بدء الاختبار، وكتابة اسم الطالب كاملاً على ورقة الأسئلة قبل بدء الإجابة.', 'عدم استخدام المزيل لتعديل الإجابة.', 'عندما تتطلب الإجابة بعض الرسومات تكون الرسمة بالقلم الرصاص والبيانات بالقلم الأزرق السائل.', 'الحفاظ على الكتب المدرسية وإعادتها كاملة وسليمة قبل استلام النتيجة.'];
  return title('إرشادات هامة للطلاب', yearLine()) + `<ol class="ins">${l.map(x => `<li>${x}</li>`).join('')}</ol>` + sp(20) + sigs([['إدارة المدرسة', S.s.principal]]);
}

/* ----- عرض النماذج ----- */
function qbar(id, label, extra = '', opts) {
  const od = opts ? ` data-o='${esc(JSON.stringify(opts))}'` : '';
  const fd = FORMS.find(x => x.id === id); if (fd && (fd.opts || []).includes('grade') && !(opts && opts.g)) extra = gradeChips(QG[id], 'qG', id) + extra;
  return `<div class="qbar"><span class="qlbl">${label}</span>${extra}<span class="sp1"></span><button class="btn sm pri" data-act="qopen" data-form="${id}"${od} type="button">معاينة قبل الطباعة</button><button class="btn sm" data-act="qprint" data-form="${id}"${od} type="button">طباعة</button><button class="btn sm" data-act="qpdf" data-form="${id}"${od} type="button">PDF</button><button class="btn sm" data-act="qword" data-form="${id}"${od} type="button">Word</button></div>`;
}
let PV = null;
function openPreview(groups, name) {
  const pages = groups.flatMap(g => g.pages.map(pg => ({ pg, land: !!g.land })));
  if (!pages.length) return toast('لا توجد صفحات للمعاينة', true);
  PV = { groups, name, pages, z: 0 };
  $('#pvTitle').textContent = name.replace(/ - [^-]*$/, '');
  $('#pvCount').textContent = `${pages.length} صفحة`;
  const LIM = 40;
  $('#pvBody').innerHTML = pages.slice(0, LIM).map((x, i) => `<div class="pvp"><span class="pvn">${i + 1}</span>${pageWrap(x.pg, x.land)}</div>`).join('') + (pages.length > LIM ? `<div class="emptyp">تعرض المعاينة أول ${LIM} صفحة؛ الطباعة والتحميل تشمل جميع الصفحات (${pages.length}).</div>` : '');
  $('#pvModal').hidden = false; document.body.classList.add('noscroll');
  waitImgs($('#pvBody')).then(() => { const els = $$('#pvBody .page'); layoutPages(els); const sc = fitScales(els); els.forEach((p, i) => { p.dataset.fit = sc[i]; p.classList.toggle('fitted', sc[i] < 1); }); pvFit(); });
  pvFit();
}
function pvFit() {
  if (!PV) return; const w = $('#pvBody').clientWidth - 24;
  $$('#pvBody .page').forEach(p => { const pw = p.classList.contains('land') ? 1123 : 794; const sc = Math.min(PV.z ? PV.z : 1, PV.z ? 9 : (w / pw)); const f = +(p.dataset.fit || 1); p.style.zoom = sc * (f < 1 ? f : 1); });
}
function closePreview() { $('#pvModal').hidden = true; $('#pvBody').innerHTML = ''; document.body.classList.remove('noscroll'); PV = null; }
function qopts(b) { let o = {}; try { o = b.dataset.o ? JSON.parse(b.dataset.o) : {}; } catch (e) { o = {}; } const id = b.dataset.form; if (id && QG[id] && QG[id].length) o.g = QG[id]; return o; }
/* اختيار الصفوف للطباعة: جميع الصفوف أو أي مجموعة منها */
const QG = {};
function gSel(o) { const v = o && o.g; if (v == null || v === '' || v === 'all') return G.slice(); const r = (Array.isArray(v) ? v : String(v).split(',')).map(Number).filter(g => G.includes(g)); return r.length ? r : G.slice(); }
function gOk(o, g) { return gSel(o).includes(+g); }
const GORD = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث' };
function gradeChips(cur, act, id) {
  const sel = cur && cur.length && cur !== 'all' ? gSel({ g: cur }) : [], all = !sel.length || sel.length === G.length;
  return `<span class="gchips" role="group" aria-label="الصفوف المطبوعة" data-form="${id}"><button type="button" class="gchip all${all ? ' on' : ''}" data-act="${act}" data-v="all" data-form="${id}" aria-pressed="${all}">جميع الصفوف</button>${G.map(g => { const on = !all && sel.includes(g); return `<button type="button" class="gchip${on ? ' on' : ''}" style="--gc:${GCOL[g]}" data-act="${act}" data-v="${g}" data-form="${id}" aria-pressed="${on}">${GORD[g]}</button>`; }).join('')}</span>`;
}
function toggleG(cur, v) {
  if (v === 'all') return [];
  let s = cur && cur.length && cur !== 'all' ? gSel({ g: cur }) : []; if (s.length === G.length) s = [];
  s = s.includes(+v) ? s.filter(x => x !== +v) : [...s, +v].sort();
  return s.length === G.length ? [] : s;
}
function groupsOf(id, o) { const f = FORMS.find(x => x.id === id); return [{ land: f.land, pages: buildForm(f, o || {}), t: f.t }]; }
function formDef() { return FORMS.find(f => f.id === FORM) || FORMS[0]; }
function vForms() {
  const grps = groupRuns(FORMS, f => f.grp);
  const f = formDef();
  const needWarn = f.needs === 'dist' && !S.distributed;
  return `<div class="forms">
    <aside class="flist">${grps.map(g => `<div class="fgrp">${g.key}</div>${g.items.map(x => `<button type="button" class="fbtn${x.id === FORM ? ' on' : ''}" data-act="form" data-v="${x.id}">${x.t}${x.land ? '<small>أفقي</small>' : ''}</button>`).join('')}`).join('')}</aside>
    <div class="fmain">
      <div class="ftool card">
        <h2>${f.t}</h2>
        <div class="acts wrap">${(f.opts || []).map(k => OPT[k](FO)).join('')}</div>
        ${needWarn ? `<p class="warnt">هذا النموذج يحتاج رفع ملف الطلاب ثم «توزيع الطلاب بالأسماء» من صفحة اللجان.</p>` : ''}
        <div class="acts wrap">
          <button class="btn pri" data-act="pvOpen" type="button">معاينة بملء الشاشة</button>
          <button class="btn" data-act="print" type="button">طباعة</button>
          <button class="btn" data-act="pdf" type="button">تحميل PDF</button>
          <button class="btn" data-act="word" type="button">تحميل Word</button>
          <button class="btn" data-act="excel" type="button">تصدير Excel</button>
          <button class="btn ghost" data-act="printAll" type="button">طباعة الملف الشامل (كل النماذج الأساسية)</button>
          <span class="hint" id="pgCount"></span>
        </div>
      </div>
      <div id="preview" class="preview"></div>
    </div></div>`;
}
function pageWrap(content, land) {
  return `<div class="page${land ? ' land' : ''}"><img class="brand-hdr phdr" src="${HDR}" alt=""><div class="pbody">${content}</div><img class="brand-ftr pftr" src="${FTR}" alt=""></div>`;
}
function buildForm(f, o) {
  if (f.needs === 'dist' && !S.distributed) return [];
  try { return f.build(o || {}) || []; } catch (e) { console.error(e); return [`<p class="txt">تعذر بناء النموذج: ${esc(e.message)}</p>`]; }
}
function renderPreview() {
  const f = formDef(); const pages = buildForm(f, FO);
  const pv = $('#preview');
  if (!pages.length) { pv.innerHTML = '<div class="emptyp">لا توجد صفحات لهذا الاختيار.</div>'; $('#pgCount').textContent = ''; return; }
  const LIM = 12;
  pv.innerHTML = pages.slice(0, LIM).map(p => pageWrap(p, f.land)).join('') + (pages.length > LIM ? `<div class="emptyp">تعرض المعاينة أول ${LIM} صفحات؛ الطباعة والتصدير تشمل جميع الصفحات (${pages.length}).</div>` : '');
  $('#pgCount').textContent = `${pages.length} صفحة`;
  waitImgs(pv).then(() => layoutPages($$('.page', pv)));
  fitPreview();
}
function fitPreview() {
  const pv = $('#preview'); if (!pv) return;
  const w = pv.clientWidth;
  $$('.page', pv).forEach(p => {
    const pw = p.classList.contains('land') ? 1123 : 794;
    const sc = Math.min(1, (w - 8) / pw);
    p.style.zoom = sc < 1 ? sc : '';
  });
}
const ALL_SET = ['schedule', 'comCounts', 'comPlaces', 'comSchedule', 'sticker', 'callSheet', 'daily', 'openEnv', 'agree', 'receipt', 'assign', 'complete', 'correct', 'obsInstr'];

/* ===================== الطباعة والتصدير ===================== */
/* ملاءمة الصفحة: يقيس كل صفحة بعرض الورق الفعلي ويصغّرها إن زادت عن ورقة واحدة */
const PAPER = { p: { w: 741, h: 1060 }, l: { w: 1070, h: 731 } };
function fitScales(pagesEls) {
  const st = document.createElement('div'); st.className = 'measure'; document.body.appendChild(st);
  const res = pagesEls.map(el => {
    const land = el.classList.contains('land'), P = land ? PAPER.l : PAPER.p;
    st.style.width = P.w + 'px';
    const c = el.cloneNode(true); c.style.zoom = ''; c.style.width = 'auto'; c.style.minHeight = '0'; c.style.padding = '0'; st.appendChild(c);
    let h = c.getBoundingClientRect().height, s = 1;
    if (h > P.h) {
      s = P.h / h;
      for (let k = 0; k < 6; k++) { c.style.zoom = s; const hz = c.getBoundingClientRect().height; if (hz <= P.h - 2) break; s *= (P.h - 4) / hz; }
      s = Math.max(0.45, s - 0.003);
    }
    c.remove(); return s;
  });
  st.remove(); st.style.width = ''; return res;
}
/* تنسيق الصفحة: يملأ الفراغ السفلي بتوسيع أسطر الجدول الرئيسي ثم بإنزال التواقيع */
function isHeadRow(tr) { const c = tr.cells[0]; return !!c && /217, 226, 243|d9e2f3/i.test(c.getAttribute('style') || ''); }
function planFill(el) {
  if (el.querySelector('.env') || el.dataset.nofill) return null;
  const land = el.classList.contains('land'), P = land ? PAPER.l : PAPER.p;
  const st = document.createElement('div'); st.className = 'measure'; document.body.appendChild(st);
  const c = el.cloneNode(true); c.style.zoom = ''; c.style.width = P.w + 'px'; c.style.minHeight = '0'; c.style.padding = '0'; st.appendChild(c);
  const h = c.scrollHeight; let extra = P.h - h - 6;
  const plan = { rows: [], sg: 0 };
  if (extra < 24) { st.remove(); return null; }
  const tables = $$('table.t', c); let ti = tables.findIndex(t => t.classList.contains('grow'));
  if (ti < 0) { let best = -1, bn = 0; tables.forEach((t, i) => { const n = t.rows.length; if (n > bn && n >= 5 && !t.classList.contains('nogrow')) { bn = n; best = i; } }); ti = best; }
  if (ti >= 0) {
    const grRows = Array.from(tables[ti].rows).filter(r => r.classList.contains('gr'));
    const rows = grRows.length ? grRows : Array.from(tables[ti].rows).filter(r => !isHeadRow(r));
    if (rows.length) {
      const hs = rows.map(r => r.getBoundingClientRect().height);
      const avg = hs.reduce((a, b) => a + b, 0) / hs.length;
      const per = Math.min((extra * 0.88) / rows.length, grRows.length ? 600 : Math.max(12, avg * (rows.length <= 8 ? 1.8 : 1.6)));
      const realRows = Array.from(tables[ti].rows);
      rows.forEach((r, k) => plan.rows.push({ ti, ri: realRows.indexOf(r), h: Math.round(hs[k] + per) }));
      extra -= per * rows.length;
    }
  }
  // ما تبقى يوزع بالتساوي بين أقسام الصفحة (المسافات والعناوين) ثم قبل التواقيع
  const lis = $$('.pbody ol.ins > li, .pbody ul.ins:not(.small) > li', c);
  if (extra > 20 && lis.length >= 4) { const each = Math.min((extra * 0.75) / lis.length, 16); plan.li = Math.round(each * 10) / 10; extra -= each * lis.length; }
  if (extra > 10) {
    const gaps = $$('.pbody > .sp, .pbody > p.lbl, .pbody > table.t, .pbody > ul.ins, .pbody > ol.ins, .pbody > .insbox', c).slice(1);
    const hasSg = !!c.querySelector('table.sg');
    const slots = gaps.length + (hasSg ? 2 : 0);
    if (slots) { const each = Math.min(extra / slots, 90); plan.gap = Math.round(each); extra -= each * gaps.length; if (hasSg) plan.sg = Math.min(Math.round(extra), 240); }
  }
  st.remove(); return plan;
}
function applyFill(el, plan) {
  if (!plan) return; const tables = $$('table.t', el);
  plan.rows.forEach(x => { const tr = tables[x.ti] && tables[x.ti].rows[x.ri]; if (tr) Array.from(tr.cells).forEach(td => { if ((td.rowSpan || 1) === 1) td.style.height = x.h + 'px'; }); });
  if (plan.li) $$('.pbody ol.ins > li, .pbody ul.ins:not(.small) > li', el).forEach(li => { li.style.paddingBottom = plan.li + 'px'; });
  if (plan.gap) $$('.pbody > .sp, .pbody > p.lbl, .pbody > table.t, .pbody > ul.ins, .pbody > ol.ins, .pbody > .insbox', el).slice(1).forEach(e => { e.style.marginTop = ((parseFloat(getComputedStyle(e).marginTop) || 0) + plan.gap) + 'px'; });
  if (plan.sg) { const sg = $$('table.sg', el).pop(); if (sg) sg.style.marginTop = ((parseFloat(sg.style.marginTop) || 0) + Math.round(plan.sg)) + 'px'; }
}
function layoutPages(els) { els.forEach(el => { try { applyFill(el, planFill(el)); } catch (e) { } }); }
function waitImgs(root) { return Promise.all($$('img', root).map(i => i.complete ? 1 : new Promise(r => { i.onload = r; i.onerror = r; }))); }
async function printPages(groups) {
  const root = $('#printRoot');
  root.innerHTML = groups.map(g => g.pages.map(p => pageWrap(p, g.land)).join('')).join('');
  await waitImgs(root);
  const els = $$('.page', root); layoutPages(els); const sc = fitScales(els);
  els.forEach((p, i) => { p.style.zoom = sc[i] < 1 ? sc[i] : ''; p.dataset.fit = sc[i]; });
  setTimeout(() => { window.print(); }, 80);
}
window.addEventListener('afterprint', () => { $('#printRoot').innerHTML = ''; });
function currentGroups(all) {
  if (all) return ALL_SET.map(id => { const f = FORMS.find(x => x.id === id); return { land: f.land, pages: buildForm(f, {}), t: f.t }; }).filter(g => g.pages.length);
  const f = formDef(); return [{ land: f.land, pages: buildForm(f, FO), t: f.t }];
}
/* ----- تصدير Word (docx أصلي يفتح في Word و Google Docs و LibreOffice) ----- */
function b64ToBytes(d) { const bin = atob(d.split(',')[1]); const u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u; }
function hexOf(c) {
  if (!c) return null; c = c.trim();
  if (c[0] === '#') { c = c.slice(1); if (c.length === 3) c = c.split('').map(x => x + x).join(''); return c.toUpperCase(); }
  const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); if (m) return [m[1], m[2], m[3]].map(x => (+x).toString(16).padStart(2, '0')).join('').toUpperCase();
  return null;
}
function ptOf(v) { if (!v) return null; const m = String(v).match(/([\d.]+)\s*(pt|px)?/); if (!m) return null; return m[2] === 'px' ? +m[1] * 0.75 : +m[1]; }
function wordDoc(groups, name) {
  const D = window.docx;
  if (!D) return toast('مكتبة Word لم تُحمّل بعد، أعد المحاولة', true);
  const NOB = { style: D.BorderStyle.NONE, size: 0, color: 'FFFFFF' };
  const LINE = { style: D.BorderStyle.SINGLE, size: 6, color: '333333' };
  const HDRB = b64ToBytes(HDR), FTRB = b64ToBytes(FTR);
  const BLOCK = new Set(['TABLE', 'P', 'DIV', 'UL', 'OL']);
  const CLS = { ih: { size: 11, bold: true }, dt: { size: 15, bold: true, center: true }, ds: { size: 10.5, center: true }, txt: { size: 12.5, justify: true }, lbl: { size: 12, bold: true }, note: { size: 9.5 }, cut: { size: 10, center: true, color: '999999' } };
  function runs(node, st, out) {
    node.childNodes.forEach(n => {
      if (n.nodeType === 3) { const t = n.nodeValue.replace(/\s+/g, ' '); if (t.trim() || (t === ' ' && out.length)) out.push(new D.TextRun({ text: t, bold: st.bold, boldComplexScript: st.bold, color: st.color || undefined, size: Math.round(st.size * 2), sizeComplexScript: Math.round(st.size * 2), rightToLeft: true, font: { ascii: 'Arial', hAnsi: 'Arial', cs: 'Arial' } })); return; }
      if (n.nodeType !== 1) return;
      if (n.tagName === 'BR') { out.push(new D.TextRun({ text: '', break: 1 })); return; }
      if (n.tagName === 'IMG') { const src = n.getAttribute('src') || ''; if (src.startsWith('data:image/')) out.push(new D.ImageRun({ data: b64ToBytes(src), transformation: { width: +n.getAttribute('width') || 50, height: +n.getAttribute('height') || 50 } })); return; }
      const s2 = Object.assign({}, st);
      if (/^(B|STRONG|TH)$/.test(n.tagName) || /bold|[6-9]00/.test(n.style.fontWeight)) s2.bold = true;
      const c = hexOf(n.style.color); if (c) s2.color = c;
      const f = ptOf(n.style.fontSize); if (f) s2.size = Math.min(f, 60);
      runs(n, s2, out);
    });
    return out;
  }
  function para(node, st, opt = {}) {
    const al = opt.center ? D.AlignmentType.CENTER : opt.justify ? D.AlignmentType.JUSTIFIED : undefined;
    return new D.Paragraph({ bidirectional: true, alignment: al, spacing: { after: opt.after == null ? 60 : opt.after, before: opt.before || 0 }, children: runs(node, st, []) });
  }
  function blocks(container, st, width) {
    const out = [];
    let inlineBuf = null;
    const flush = () => { if (inlineBuf && inlineBuf.childNodes.length && inlineBuf.textContent.trim()) out.push(para(inlineBuf, st, { center: true })); inlineBuf = null; };
    container.childNodes.forEach(n => {
      if (n.nodeType === 1 && BLOCK.has(n.tagName)) {
        flush();
        if (n.tagName === 'TABLE') { out.push(table(n, width)); out.push(new D.Paragraph({ bidirectional: true, spacing: { after: 40 }, children: [] })); }
        else if (n.tagName === 'P') {
          const k = (n.className || '').split(' ').find(x => CLS[x]); const o = CLS[k] || {};
          if (n.classList.contains('sp')) { out.push(new D.Paragraph({ spacing: { after: 0 }, children: [new D.TextRun({ text: '', size: 8 })] })); return; }
          const s2 = Object.assign({}, st, o.size ? { size: o.size } : {}, o.bold ? { bold: true } : {}, o.color ? { color: o.color } : {});
          const f = ptOf(n.style.fontSize); if (f) s2.size = Math.min(f, 60);
          if (n.style.textAlign === 'center') o.center = true;
          out.push(para(n, s2, o));
        } else if (n.tagName === 'UL' || n.tagName === 'OL') {
          const small = n.classList.contains('small');
          Array.from(n.children).forEach((li, i) => {
            const s2 = Object.assign({}, st, { size: small ? 10 : 10.5, bold: false });
            const r = runs(li, s2, []); r.unshift(new D.TextRun({ text: (n.tagName === 'OL' ? (i + 1) + '. ' : '• '), bold: s2.bold, size: s2.size * 2, sizeComplexScript: s2.size * 2, rightToLeft: true }));
            out.push(new D.Paragraph({ bidirectional: true, indent: { start: 280 }, spacing: { after: 30 }, children: r }));
          });
        } else {
          if (n.classList.contains('stamp')) { out.push(new D.Paragraph({ spacing: { after: 900 }, children: [] })); return; }
          blocks(n, st, width).forEach(x => out.push(x));
        }
      } else {
        if (!inlineBuf) inlineBuf = document.createElement('span');
        inlineBuf.appendChild(n.cloneNode(true));
      }
    });
    flush();
    return out;
  }
  function table(tb, width) {
    const bordered = tb.classList.contains('t');
    const cls = tb.className;
    const minH = /\bxtall\b/.test(cls) ? 44 : /\btall\b/.test(cls) ? 27 : /\bcall\b/.test(cls) ? 21 : /\bmid\b/.test(cls) ? 22 : /\bcmp\b/.test(cls) ? 17 : 0;
    const baseSize = /\bcmp\b/.test(cls) ? 9.5 : /\bdense\b|\bcall\b|\bmid\b/.test(cls) ? 10 : 10.5;
    const trs = Array.from(tb.rows);
    // شبكة الأعمدة
    let ncol = 0; let firstW = [];
    if (trs[0]) Array.from(trs[0].cells).forEach(td => { const cs = td.colSpan || 1; ncol += cs; const w = parseFloat(td.style.width) || 0; for (let i = 0; i < cs; i++) firstW.push(w / cs); });
    ncol = Math.max(1, ncol);
    // اختيار الصف الذي يحدد عرض أكبر عدد من الأعمدة
    let bestN = firstW.filter(Boolean).length;
    trs.slice(1).forEach(tr => {
      const cs = Array.from(tr.cells); if (cs.reduce((a, td) => a + (td.colSpan || 1), 0) !== ncol) return;
      const ws = []; cs.forEach(td => { const c = td.colSpan || 1, w = parseFloat(td.style.width) || 0; for (let i = 0; i < c; i++) ws.push(w / c); });
      const n = ws.filter(Boolean).length; if (n > bestN) { bestN = n; firstW = ws; }
    });
    const fixed = firstW.reduce((a, b) => a + b, 0), free = firstW.filter(w => !w).length;
    const colsPct = firstW.map(w => w || Math.max(3, (100 - fixed) / Math.max(1, free)));
    const tot = colsPct.reduce((a, b) => a + b, 0);
    const colTw = colsPct.map(p => Math.round(width * p / tot));
    const rows = trs.map(tr => {
      const h = Math.max(minH, ...Array.from(tr.cells).map(td => parseFloat(td.style.height) || 0));
      return new D.TableRow({
        height: h ? { value: Math.round(h * 15), rule: D.HeightRule.ATLEAST } : undefined,
        children: Array.from(tr.cells).map(td => {
          const st = { size: ptOf(td.style.fontSize) || baseSize, bold: td.tagName === 'TH' || /bold/.test(td.style.fontWeight), color: hexOf(td.style.color) };
          const hasBlock = Array.from(td.children).some(c => BLOCK.has(c.tagName));
          const cw = Math.round(width * ((td.colSpan || 1) / ncol));
          let kids = hasBlock ? blocks(td, st, cw - 200) : [new D.Paragraph({ bidirectional: true, alignment: td.style.textAlign === 'right' ? undefined : D.AlignmentType.CENTER, spacing: { after: 0 }, children: runs(td, st, []) })];
          if (!kids.length) kids = [new D.Paragraph({ children: [] })];
          const bg = hexOf(td.style.background || td.style.backgroundColor);
          return new D.TableCell({
            children: kids, columnSpan: td.colSpan > 1 ? td.colSpan : undefined, rowSpan: td.rowSpan > 1 ? td.rowSpan : undefined,
            verticalAlign: td.style.verticalAlign === 'top' ? D.VerticalAlign.TOP : D.VerticalAlign.CENTER,
            shading: bg ? { fill: bg, type: D.ShadingType.CLEAR, color: 'auto' } : undefined,
            margins: { top: 30, bottom: 30, left: 70, right: 70 },
            borders: bordered ? { top: LINE, bottom: LINE, left: LINE, right: LINE } : { top: NOB, bottom: NOB, left: NOB, right: NOB }
          });
        })
      });
    });
    return new D.Table({
      rows, visuallyRightToLeft: true, columnWidths: colTw, width: { size: width, type: D.WidthType.DXA }, layout: D.TableLayoutType.FIXED,
      borders: bordered ? { top: LINE, bottom: LINE, left: LINE, right: LINE, insideHorizontal: LINE, insideVertical: LINE } : { top: NOB, bottom: NOB, left: NOB, right: NOB, insideHorizontal: NOB, insideVertical: NOB }
    });
  }
  const sections = [];
  const tmp = document.createElement('div');
  groups.forEach(g => g.pages.forEach(pg => {
    const land = !!g.land;
    const pageW = land ? 16838 : 11906, M = 567, W = pageW - 2 * M;
    const imgW = Math.round(W / 15) - 4;
    tmp.innerHTML = pg;
    sections.push({
      properties: { page: { size: { orientation: land ? D.PageOrientation.LANDSCAPE : D.PageOrientation.PORTRAIT, width: 11906, height: 16838 }, margin: { top: 450 + Math.round(imgW * 215 / 1700 * 15), bottom: 420 + Math.round(imgW * FTR_H / 1700 * 15), left: M, right: M, header: 280, footer: 280 } } },
      headers: { default: new D.Header({ children: [new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.ImageRun({ data: HDRB, transformation: { width: imgW, height: Math.round(imgW * 215 / 1700) } })] })] }) },
      footers: { default: new D.Footer({ children: [new D.Paragraph({ alignment: D.AlignmentType.CENTER, children: [new D.ImageRun({ data: FTRB, transformation: { width: imgW, height: Math.round(imgW * FTR_H / 1700) } })] })] }) },
      children: blocks(tmp, { size: 11, bold: false }, W)
    });
  }));
  const doc = new D.Document({
    creator: S.s.school, title: name, styles: { default: { document: { run: { font: 'Arial', size: 22, rightToLeft: true }, paragraph: { } } } },
    sections
  });
  toast('جارٍ تجهيز ملف Word…');
  D.Packer.toBlob(doc).then(blob => download(blob, name + '.docx')).catch(e => { console.error(e); toast('تعذر إنشاء ملف Word: ' + e.message, true); });
}
function download(blob, name) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  toast('تم تجهيز الملف: ' + name);
}
function excelFromGroups(groups, name) {
  const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] };
  const tmp = document.createElement('div'); let n = 0;
  groups.forEach(g => g.pages.forEach(p => {
    tmp.innerHTML = p;
    $$('table.t', tmp).forEach(tb => {
      if (n >= 200) return;
      const ws = XLSX.utils.table_to_sheet(tb, { raw: true }); ws['!cols'] = Array(12).fill({ wch: 16 });
      ws['!views'] = [{ RTL: true }];
      XLSX.utils.book_append_sheet(wb, ws, ('ورقة ' + (++n)).slice(0, 31));
    });
  }));
  if (!n) return toast('لا توجد جداول في هذا النموذج', true);
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  download(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), name + '.xlsx');
}
function fname(t) { return (t + ' - ' + S.s.yearTxt).replace(/[\\/:*?"<>|]/g, '-'); }

/* ----- كشوف الطلاب ----- */
function stuPages() {
  const l = filteredStudents(); const cols = STU_COLS.filter(c => SF.cols.includes(c[0]));
  const ttl = SF.title.trim() || 'كشف أسماء الطلاب';
  const groups = [];
  if (SF.split === 'section') { groupRuns(l.slice().sort((a, b) => a.g - b.g || a.sec - b.sec), x => x.g + '-' + x.sec).forEach(r => groups.push({ sub: r.items[0].sec ? `${gname(r.items[0].g)} – الشعبة ( ${r.items[0].sec} )` : gname(r.items[0].g), items: sortWithin(r.items) })); }
  else if (SF.split === 'grade') { groupRuns(l.slice().sort((a, b) => a.g - b.g), x => x.g).forEach(r => groups.push({ sub: gname(r.items[0].g), items: sortWithin(r.items) })); }
  else groups.push({ sub: SF.g !== 'all' ? GNAME[SF.g] : '', items: l });
  const rpp = Math.max(10, Math.min(45, +SF.rpp || 30)), pages = [];
  groups.forEach(gr => {
    for (let i = 0; i < Math.max(1, gr.items.length); i += rpp) {
      const part = gr.items.slice(i, i + rpp);
      const rows = [cols.map(c => H(c[1], c[0] === 'n' ? { w: '34%' } : c[0] === 'i' ? { w: '5%' } : {}))];
      part.forEach((x, k) => rows.push(cols.map(c => c[0] === 'n' ? { v: esc(x.n), al: 'right' } : c[0] === 'g' ? Gc(x.g, GSHORT[x.g] || '—') : c[0] === 'i' ? i + k + 1 : stuVal(x, c[0], i + k))));
      pages.push(title(esc(ttl), `${gr.sub ? gr.sub + ' — ' : ''}عدد الطلاب: ${gr.items.length}${gr.items.length > rpp ? ` — صفحة ${Math.floor(i / rpp) + 1} من ${Math.ceil(gr.items.length / rpp)}` : ''}`) + T(rows, { cls: 'stu' }));
    }
  });
  return pages;
}
function sortWithin(items) { return items.slice().sort((a, b) => SF.sort === 'seat' ? (a.seat || 0) - (b.seat || 0) : a.n.localeCompare(b.n, 'ar')); }
function stuExcel() {
  const l = filteredStudents(); const cols = STU_COLS.filter(c => SF.cols.includes(c[0]) && !['sig', 'note'].includes(c[0]));
  const data = l.map((x, i) => { const o = {}; cols.forEach(c => { o[c[1]] = c[0] === 'i' ? i + 1 : c[0] === 'g' ? gname(x.g) : c[0] === 'ph' ? fmtPhone(x.ph) : c[0] === 'ph2' ? fmtPhone(x.ph2) : c[0] === 'n' ? x.n : x[c[0]] || ''; }); return o; });
  const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] };
  const ws = XLSX.utils.json_to_sheet(data); ws['!cols'] = cols.map(c => ({ wch: c[0] === 'n' ? 36 : 14 })); ws['!views'] = [{ RTL: true }];
  XLSX.utils.book_append_sheet(wb, ws, 'الطلاب');
  download(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), fname(SF.title.trim() || 'كشف الطلاب') + '.xlsx');
}

/* ===================== الرمز الخاص ===================== */
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join(''); }
/* ===================== المزامنة بين الأجهزة ===================== */
const API = '/api/sync';
/* ===== ثلاثة حفظ مستقلة للإسناد + قسم الاختبارات ===== */
const TA_SETS = ['ta', 'ta-agent', 'ta-shared'];
const SET_DEF = { ta: { n: 'حفظ فهد', d: 'الإسناد الذي تُبنى عليه الاختبارات', c: '#2563eb', ic: 'ف' }, 'ta-agent': { n: 'حفظ الوكيل', d: 'إسناد يُحضّره وكيل المعلمين', c: '#ea580c', ic: 'و' }, 'ta-shared': { n: 'المشاركة معاً', d: 'إسناد مشترك يعدّله الجميع', c: '#059669', ic: 'م' } };
const ALL_SECS = ['ex', ...TA_SETS, 'daily'];
const isSet = s => TA_SETS.includes(s);
let ACTIVE = (() => { try { const v = localStorage.getItem(LS_KEY + '-taset'); return TA_SETS.includes(v) ? v : 'ta'; } catch (e) { return 'ta'; } })();
function setStore(id) { try { return JSON.parse(localStorage.getItem(LS_KEY + '-set-' + id) || 'null'); } catch (e) { return null; } }
function setStoreSave(id, d) { try { localStorage.setItem(LS_KEY + '-set-' + id, JSON.stringify(d)); } catch (e) { } }
function emptySet(id) { return { ta: [], teachers: [], taPrint: clone(DEFAULT_STATE.s.taPrint), up: { ta: null, tch: null }, meta: { n: SET_DEF[id].n, d: SET_DEF[id].d } }; }
const SET_SEM_DEF = { ta: null, 'ta-agent': 'الثاني', 'ta-shared': null };
function setMeta(id) { const d = id === ACTIVE ? { meta: S.taMeta } : setStore(id); const m = (d && d.meta) || {}; return { n: m.n || SET_DEF[id].n, d: m.d != null ? m.d : SET_DEF[id].d, sem: m.sem || SET_SEM_DEF[id] || S.s.sem, y: m.y || S.s.yearTxt }; }
function updSetMeta(id, patch) { if (id === ACTIVE) { S.taMeta = Object.assign({}, setMeta(id), S.taMeta || {}, patch); save(); } else { const d = secData(id); d.meta = Object.assign({}, setMeta(id), d.meta || {}, patch); setStoreSave(id, d); syncSoon(); } }
const semShort = s => /الثاني|2/.test(s) ? 'ف2' : /الثالث|3/.test(s) ? 'ف3' : 'ف1';
/* نماذج الإسناد تُطبع بفصل وعام الحفظ الذي بُنيت منه، دون تغيير إعدادات بقية النظام */
const TA_FORMS = ['taSheet', 'taLoad'];
/* للطباعة والتحميل: يبقى الفصل الخاص بالحفظ حتى تُغلق المعاينة أو ينتهي التحميل */
async function withSetSemAsync(id, fn) {
  const m = setMeta(id), keep = { sem: S.s.sem, y: S.s.yearTxt };
  if (m.sem === keep.sem && m.y === keep.y) return fn();
  S.s.sem = m.sem; S.s.yearTxt = m.y; await drawBrand();
  const restore = async () => { S.s.sem = keep.sem; S.s.yearTxt = keep.y; await drawBrand(); };
  try { await fn(); } catch (e) { console.error(e); }
  if (PV) { const iv = setInterval(async () => { if (!PV) { clearInterval(iv); await restore(); } }, 400); } else await restore();
}
async function withSetSem(id, fn) {
  const m = setMeta(id), keep = { sem: S.s.sem, y: S.s.yearTxt };
  if (m.sem === keep.sem && m.y === keep.y) return fn();
  S.s.sem = m.sem; S.s.yearTxt = m.y; await drawBrand();
  let out; try { out = fn(); } finally { S.s.sem = keep.sem; S.s.yearTxt = keep.y; await drawBrand(); }
  return out;
}
const freezeHdr = groups => groups.map(g => Object.assign({}, g, { pages: g.pages.map(p => p.replace(/class="brand-hdr phdr"/g, 'class="phdr"').replace(/class="brand-ftr pftr"/g, 'class="pftr"')) }));

const SYNC_SECS = new Proxy({ ex: 'الاختبارات', daily: 'الانتظار والمناوبة والجدول المدرسي' }, { get: (o, k) => isSet(k) ? 'إسناد ' + setMeta(k).n : o[k] });
let SYNC = (() => { try { return JSON.parse(localStorage.getItem(LS_KEY + '-sync') || '{}'); } catch (e) { return {}; } })();
let SYNC_CODE = (() => { try { return localStorage.getItem(LS_KEY + '-code') || ''; } catch (e) { return ''; } })();
let SYNC_ST = { state: 'idle', err: '' }, syncT = null, syncBusy = false, syncOnline = true;
function syncSave() { try { localStorage.setItem(LS_KEY + '-sync', JSON.stringify(SYNC)); } catch (e) { } }
function syncSetCode(c) { SYNC_CODE = c; try { localStorage.setItem(LS_KEY + '-code', c); } catch (e) { } UNLOCKED = true; syncNow(); }
async function verifyCode(c) {
  try {
    const r = await fetch(API + '?check', { method: 'POST', headers: { 'x-code': c }, cache: 'no-store' });
    if (r.status === 200) return true; if (r.status === 429) return 'locked'; if (r.status === 401) return false;
    throw new Error('svc');
  } catch (e) { return (await sha(c)) === CODE_HASH; } /* بدون اتصال: تحقق محلي */
}
function secData(sec) {
  if (isSet(sec)) {
    if (sec !== ACTIVE) return setStore(sec) || (sec === 'ta' && !setStore('ta') ? emptySet(sec) : emptySet(sec));
    return { ta: S.ta, teachers: S.teachers, taPrint: S.s.taPrint, up: { ta: S.uploads.ta || null, tch: S.uploads.tch || null }, meta: S.taMeta || { n: SET_DEF[sec].n, d: SET_DEF[sec].d } };
  }
  if (sec === 'daily') return S.daily || {};
  const o = Object.assign({}, S); delete o.ta; delete o.teachers; delete o.taMeta; delete o.daily;
  o.s = Object.assign({}, S.s); delete o.s.taPrint;
  o.uploads = Object.assign({}, S.uploads); delete o.uploads.ta; delete o.uploads.tch;
  return o;
}
function applySec(sec, d) {
  if (sec === 'daily') { S.daily = d || {}; return; }
  if (isSet(sec)) {
    if (sec !== ACTIVE) { setStoreSave(sec, d); return; }
    S.ta = d.ta || []; S.teachers = d.teachers || []; if (d.taPrint) S.s.taPrint = d.taPrint;
    S.uploads.ta = d.up && d.up.ta || undefined; S.uploads.tch = d.up && d.up.tch || undefined;
    S.taMeta = d.meta || { n: SET_DEF[sec].n, d: SET_DEF[sec].d };
  } else {
    const keep = secData(ACTIVE), keepDaily = S.daily;
    S = deepMerge(clone(DEFAULT_STATE), d); S.daily = keepDaily;
    S.ta = keep.ta; S.teachers = keep.teachers; S.s.taPrint = keep.taPrint; S.uploads = S.uploads || {}; S.uploads.ta = keep.up.ta || undefined; S.uploads.tch = keep.up.tch || undefined; S.taMeta = keep.meta;
  }
  normState();
}
/* التبديل بين الحفظ على هذا الجهاز: الاختبارات والتكليفات تُبنى على الحفظ النشط */
async function setActive(id) {
  if (id === ACTIVE) { try { localStorage.setItem(LS_KEY + '-taset', id); } catch (e) { } return render(); }
  setStoreSave(ACTIVE, clone(secData(ACTIVE)));
  const d = setStore(id) || emptySet(id);
  ACTIVE = id; try { localStorage.setItem(LS_KEY + '-taset', id); } catch (e) { }
  applySec(id, d); save(true); window.__thumbs = {}; renderNav(); render();
  toast(`تعمل الآن على «${setMeta(id).n}» — ${S.ta.length} سطراً`);
  syncNow({ silent: true });
}
function buildStFromTaSafe() { try { if (S.ta.length && typeof buildStFromTa === 'function') buildStFromTa(); } catch (e) { } }
function previewSet(id) {
  const keep = { ta: S.ta, teachers: S.teachers }; const d = secData(id); let pages;
  try { S.ta = d.ta || []; S.teachers = d.teachers || []; pages = buildForm(FORMS.find(x => x.id === 'taSheet'), {}); }
  finally { S.ta = keep.ta; S.teachers = keep.teachers; }
  return withSetSemAsync(id, () => openPreview([{ land: false, pages, t: 'كشف الإسناد' }], fname('كشف الإسناد - ' + setMeta(id).n + ' - الفصل ' + setMeta(id).sem)));
}
function copySet(from, to) {
  const d = clone(secData(from)); d.meta = clone(secData(to).meta || { n: SET_DEF[to].n, d: SET_DEF[to].d });
  applySec(to, d); save(true); syncSoon();
}
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36) + ':' + s.length; }
async function gz(str) {
  if (typeof CompressionStream === 'undefined') return { body: new TextEncoder().encode(str), enc: 'json' };
  const cs = new Blob([str]).stream().pipeThrough(new CompressionStream('gzip'));
  return { body: new Uint8Array(await new Response(cs).arrayBuffer()), enc: 'gzip' };
}
async function ungz(buf, enc) {
  if (enc !== 'gzip') return new TextDecoder().decode(buf);
  const ds = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'));
  return await new Response(ds).text();
}
/* هل بيانات القسم على هذا الجهاز ما زالت افتراضية (لم يُعمل عليها)؟ تُتجاهل تفضيلات العرض */
function coreOf(sec) { const d = secData(sec); if (isSet(sec)) return JSON.stringify([d.ta, d.teachers]); const s = {}; Object.keys(DEFAULT_STATE.s).forEach(k => s[k] = d.s[k]); return JSON.stringify([s, d.days, d.com, d.students, d.guide, d.obs, d.st, d.special]); }
function pristine(sec) { if (sec === 'daily') { const d = S.daily || {}; return !d.tt && !Object.keys(d.wait || {}).length && !Object.keys(d.duty || {}).length; } if (isSet(sec) && sec !== 'ta') { const d = secData(sec); return !(d.ta || []).length && !(d.teachers || []).length; } const cur = S; let h; try { S = clone(DEFAULT_STATE); normState(); h = coreOf(sec); } finally { S = cur; } return h === coreOf(sec); }
function syncDirty(sec) { const s = SYNC[sec] || {}; return hashStr(JSON.stringify(secData(sec))) !== s.h; }
function syncSoon() { if (!SYNC_CODE) return; clearTimeout(syncT); syncT = setTimeout(syncNow, 1800); syncBadge(); }
function devName() { try { const n = localStorage.getItem(LS_KEY + '-dev'); if (n) return n; } catch (e) { } return /Mobi|iPhone|Android/i.test(navigator.userAgent) ? 'جوال' : 'كمبيوتر'; }
function whoAmI() { return encodeURIComponent((ROLE || 'admin') + '|' + devName().slice(0, 24)); }
function byLabel(b) { b = String(b || ''); if (!b) return ''; if (/^(ta|ex)-[md]$/.test(b)) return b.endsWith('m') ? 'جوال' : 'كمبيوتر'; try { const v = decodeURIComponent(b); if (v.includes('|')) { const [r, n] = v.split('|'); return (PEOPLE[r] ? PEOPLE[r].who + ' — ' : '') + n; } return v; } catch (e) { return b; } }
async function api(method, q, opt = {}) {
  const r = await fetch(API + q, { method, cache: 'no-store', headers: Object.assign({ 'x-code': SYNC_CODE, 'x-by': whoAmI() }, opt.headers || {}), body: opt.body });
  if (r.status === 401) { SYNC_CODE = ''; try { localStorage.removeItem(LS_KEY + '-code'); } catch (e) { } throw Object.assign(new Error('auth'), { code: 401 }); }
  return r;
}
async function pullSec(sec) {
  const r = await api('GET', '?sec=' + sec); if (r.headers.get('content-type').includes('json')) return null;
  const at = r.headers.get('x-at'), enc = r.headers.get('x-enc') || 'gzip';
  const txt = await ungz(new Uint8Array(await r.arrayBuffer()), enc);
  return { at, data: JSON.parse(txt), by: byLabel(r.headers.get('x-by')), byRaw: r.headers.get('x-by') || '' };
}
async function pushSec(sec, force) {
  let d = secData(sec), str = JSON.stringify(d), note = '';
  let p = await gz(str);
  if (p.body.byteLength > 5.3e6 && sec === 'ex' && S.s.gs && S.s.gs.file) { d = clone(d); d.s.gs = Object.assign({}, d.s.gs, { file: null, src: 'builtin' }); p = await gz(JSON.stringify(d)); note = ' (بيان الدرجات المرفوع كبير فبقي على هذا الجهاز فقط)'; }
  const r = await api('PUT', '?sec=' + sec, { body: p.body, headers: { 'x-base': (SYNC[sec] || {}).at || '', 'x-enc': p.enc, 'content-type': 'application/octet-stream', ...(force ? { 'x-force': '1' } : {}) } });
  if (r.status === 409) return 'conflict';
  if (!r.ok) throw new Error('push ' + r.status);
  const m = await r.json(); SYNC[sec] = { at: m.at, h: hashStr(str), t: Date.now() }; syncSave(); if (note) toast('تمت المزامنة' + note);
  return 'ok';
}
function busyTyping() { const a = document.activeElement; return a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && !/checkbox|radio|file/.test(a.type))) && !a.closest('.modal,.pickm'); }
async function syncNow(opts = {}) {
  if (!SYNC_CODE || syncBusy) return; syncBusy = true; SYNC_ST = { state: 'busy' }; syncBadge();
  try {
    const meta = await (await api('GET', '?meta')).json(); let changed = false;
    for (const sec of ALL_SECS) {
      const rm = meta[sec], lm = SYNC[sec] || {}, dirty = syncDirty(sec);
      /* جهاز يعمل على «حفظ الوكيل»: قسم الاختبارات للقراءة فقط، فلا يمس عمله بيانات الاختبارات */
      if (sec === 'ex' && exReadOnly()) { if (rm && (rm.at !== lm.at || dirty)) { const p = await pullSec('ex'); if (p) { applySec('ex', p.data); SYNC.ex = { at: p.at, h: hashStr(JSON.stringify(secData('ex'))), t: Date.now() }; syncSave(); changed = true; } } continue; }
      if (PENDING[sec] && rm && rm.at === lm.at) { delete PENDING[sec]; pendShow(); }
      if (rm && rm.at !== lm.at) {
        /* يوجد إصدار أحدث من جهاز آخر */
        if (!lm.at && dirty && !pristine(sec)) {
          const useCloud = await choiceBox(`يوجد على السحابة نسخة من «${SYNC_SECS[sec]}» حُفظت ${fmtAt(rm.at)}${rm.by ? ' من ' + byLabel(rm.by) : ''}، وعلى هذا الجهاز بيانات أخرى. أيهما تعتمد؟`, 'نسخة السحابة', 'بيانات هذا الجهاز');
          if (!useCloud) { await pushSec(sec, true); continue; }
        } else if (lm.at && syncMode(sec) === 'ask') {
          /* وضع «اسألني»: لا يُطبَّق التعديل حتى توافق */
          if (!PENDING[sec] || PENDING[sec].at !== rm.at) { const p = await pullSec(sec); if (p) { PENDING[sec] = { at: p.at, by: p.by, byRaw: p.byRaw, data: p.data, diff: secDiff(sec, secData(sec), p.data) }; pendShow(); } }
          continue;
        } else if (dirty && lm.at) { localStorage.setItem(LS_KEY + '-conflict-' + sec, JSON.stringify({ at: new Date().toISOString(), data: secData(sec) })); toast(`حُدّث «${SYNC_SECS[sec]}» من جهاز آخر — حُفظت تعديلاتك غير المتزامنة كنسخة في «النسخ الاحتياطي»`); }
        else if (busyTyping()) continue;
        const p = await pullSec(sec); if (!p) continue;
        applySec(sec, p.data); SYNC[sec] = { at: p.at, h: hashStr(JSON.stringify(secData(sec))), t: Date.now() }; syncSave(); changed = true;
      } else if ((dirty || !rm) && !PENDING[sec]) {
        if ((await pushSec(sec)) === 'conflict') { opts.retry = (opts.retry || 0) + 1; if (opts.retry < 3) { syncBusy = false; return syncNow(opts); } }
      }
    }
    if (changed) { try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { } window.__thumbs = {}; await drawBrand(); renderNav(); render(); }
    syncOnline = true; SYNC_ST = { state: 'ok' };
    if (typeof autoSeed === 'function') autoSeed(meta);
  } catch (e) {
    syncOnline = false; SYNC_ST = { state: e.code === 401 ? 'auth' : 'off' };
  } finally { syncBusy = false; syncBadge(); }
}
/* ===== التحكم في تعديلات الأجهزة الأخرى: اسألني / تلقائي ===== */
let PENDING = {};
function syncMode(sec) { const def = sec === 'ta-shared' ? 'ask' : 'auto'; try { const m = JSON.parse(localStorage.getItem(LS_KEY + '-mode2') || '{}'); return m[sec] || def; } catch (e) { return def; } }
function setSyncMode(sec, v) { let m = {}; try { m = JSON.parse(localStorage.getItem(LS_KEY + '-mode2') || '{}'); } catch (e) { } m[sec] = v; try { localStorage.setItem(LS_KEY + '-mode2', JSON.stringify(m)); } catch (e) { } }
/* ملخص الفرق بين نسختين من القسم */
function secDiff(sec, A, B) {
  const out = []; let short = [];
  if (isSet(sec)) {
    const key = x => `${x.g}|${normName(x.sub)}|${String(x.sec || '').replace(/\s/g, '')}`, lab = x => `${x.sub} (${GSHORT[x.g] || ''}${x.sec ? '، ش ' + x.sec : ''})`;
    const ma = new Map((A.ta || []).map(x => [key(x), x])), mb = new Map((B.ta || []).map(x => [key(x), x]));
    let add = 0, del = 0, chg = 0;
    mb.forEach((x, k) => { const y = ma.get(k); if (!y) { add++; out.push(['add', `إضافة: ${lab(x)} — ${x.t || 'بلا معلم'}`]); } else if (normName(y.t) !== normName(x.t)) { chg++; out.push(['chg', `تغيير المعلم: ${lab(x)} — ${y.t || 'بلا معلم'} ← ${x.t || 'بلا معلم'}`]); } else if (String(y.h || '') !== String(x.h || '')) { out.push(['chg', `تغيير الحصص: ${lab(x)} — ${y.h || '–'} ← ${x.h || '–'}`]); chg++; } });
    ma.forEach((x, k) => { if (!mb.has(k)) { del++; out.push(['del', `حذف: ${lab(x)} — ${x.t || ''}`]); } });
    const ta = new Set((A.teachers || []).map(normName)), tb = new Set((B.teachers || []).map(normName));
    const tAdd = (B.teachers || []).filter(n => !ta.has(normName(n))), tDel = (A.teachers || []).filter(n => !tb.has(normName(n)));
    tAdd.forEach(n => out.push(['add', `معلم جديد في القائمة: ${n}`])); tDel.forEach(n => out.push(['del', `حُذف من قائمة المعلمين: ${n}`]));
    const nn = (n, one, many) => n === 1 ? one : `${n} ${many}`; if (add) short.push('أضاف ' + nn(add, 'سطراً', 'أسطر')); if (chg) short.push('غيّر ' + nn(chg, 'سطراً', 'أسطر')); if (del) short.push('حذف ' + nn(del, 'سطراً', 'أسطر')); if (tAdd.length || tDel.length) short.push(`المعلمون: +${tAdd.length} −${tDel.length}`);
  } else {
    const J = v => JSON.stringify(v == null ? null : v);
    const sa = (A.students || []).length, sb = (B.students || []).length; if (sa !== sb) out.push(['chg', `عدد الطلاب: ${sa} ← ${sb}`]); else if (J(A.students) !== J(B.students)) out.push(['chg', 'تعديل في بيانات الطلاب أو توزيعهم على اللجان']);
    if (J(A.days) !== J(B.days)) out.push(['chg', 'تغيير في جدول الاختبارات']);
    if (J(A.com) !== J(B.com)) out.push(['chg', 'تغيير في اللجان أو أعدادها']);
    const oa = A.obs || {}, ob = B.obs || {}; let oc = 0; new Set([...Object.keys(oa), ...Object.keys(ob)]).forEach(k => { if (J(oa[k]) !== J(ob[k])) oc++; }); if (oc) out.push(['chg', `تغيير في توزيع الملاحظين (${oc} موضع)`]);
    if (J(A.st) !== J(B.st)) out.push(['chg', 'تغيير في المواد المختبرة أو واضعي الأسئلة']);
    if (J(A.special) !== J(B.special)) out.push(['chg', 'تغيير في القوائم الخاصة']);
    if (J(A.guide) !== J(B.guide)) out.push(['chg', 'تغيير في ملف الإرشاد']);
    if (J(A.s) !== J(B.s)) out.push(['chg', 'تغيير في الإعدادات']);
    short = out.slice(0, 2).map(x => x[1]); if (out.length > 2) short.push(`و${out.length - 2} تغييرات أخرى`);
  }
  return { lines: out, short: short.join('، ') || 'لا فرق ظاهر في البيانات' };
}
function pendShow() {
  const box = $('#pendBox'); if (!box) return;
  box.innerHTML = Object.entries(PENDING).map(([sec, p]) => `<div class="pend" role="alert" style="--pc:${personColor(p.byRaw)}"><div class="pdt"><b>تحديث لـ«${SYNC_SECS[sec]}» من ${esc(p.by || 'جهاز آخر')}</b><span>${esc(fmtAt(p.at))} — ${esc(p.diff.short)}</span></div>
    <div class="pda"><button class="btn sm ghost" data-act="pendView" data-v="${sec}" type="button">عرض التغييرات</button><button class="btn sm pri" data-act="pendApply" data-v="${sec}" type="button">اعتماد تعديله</button><button class="btn sm" data-act="pendKeep" data-v="${sec}" type="button">الإبقاء على نسختي</button></div></div>`).join('');
  syncBadge();
}
function diffModal(title, d, actions) {
  let m = $('#diffModal'); if (!m) { m = document.createElement('div'); m.id = 'diffModal'; m.className = 'modal'; document.body.appendChild(m); }
  m.innerHTML = `<div class="box tchbox"><h3>${esc(title)}</h3><p class="hint">${esc(d.short)}</p><div class="tlist dlist">${d.lines.length ? d.lines.map(([k, s]) => `<div class="dl ${k}">${esc(s)}</div>`).join('') : '<p class="hint">لا توجد فروق</p>'}</div><div class="acts">${actions || ''}<button class="btn ghost" data-dm="close" type="button">إغلاق</button></div></div>`;
  m.hidden = false; m.onclick = e => { if (e.target === m || e.target.closest('[data-dm="close"]')) m.hidden = true; if (e.target.closest('[data-act]')) m.hidden = true; };
}
async function pendApply(sec) { const p = PENDING[sec]; if (!p) return; applySec(sec, p.data); SYNC[sec] = { at: p.at, h: hashStr(JSON.stringify(secData(sec))), t: Date.now() }; syncSave(); delete PENDING[sec]; try { localStorage.setItem(LS_KEY, JSON.stringify(S)); } catch (e) { } pendShow(); window.__thumbs = {}; await drawBrand(); renderNav(); render(); toast(`اعتُمد تعديل «${SYNC_SECS[sec]}»`); }
async function pendKeep(sec) {
  const p = PENDING[sec]; if (!p) return;
  if (!(await confirmBox(`الإبقاء على نسختك من «${SYNC_SECS[sec]}» واعتمادها على السحابة؟ ستصل نسختك للأجهزة الأخرى، وتبقى نسخة ${p.by || 'الجهاز الآخر'} محفوظة في «سجل النسخ» لتستعيدها متى شئت.`))) return;
  delete PENDING[sec]; try { await pushSec(sec, true); toast('اعتُمدت نسختك ✓'); } catch (e) { toast('تعذّر الاتصال — حاول مرة أخرى', true); } pendShow(); render();
}
async function showHistory(sec) {
  let list; try { list = await (await api('GET', '?sec=' + sec + '&hist')).json(); } catch (e) { return toast('تعذّر جلب السجل — تحقق من الاتصال', true); }
  let m = $('#diffModal'); if (!m) { m = document.createElement('div'); m.id = 'diffModal'; m.className = 'modal'; document.body.appendChild(m); }
  m.innerHTML = `<div class="box tchbox"><h3>سجل نسخ «${SYNC_SECS[sec]}»</h3><p class="hint">آخر ${list.length} إصداراً محفوظاً على السحابة قبل الإصدار الحالي. «معاينة» تعرض الفرق عن نسختك الحالية، و«استعادة» تعيده نسخةً معتمدة.</p>
    <div class="tlist">${list.length ? list.map(h => `<div class="hrow"><div><b>${esc(fmtAt(h.at))}</b><small>${esc(new Date(h.at).toLocaleDateString('ar-SA-u-nu-latn-ca-gregory'))} · ${esc(byLabel(h.by) || '—')}</small></div><button class="btn sm ghost" data-hv="${esc(h.at)}" type="button">معاينة</button><button class="btn sm" data-hr="${esc(h.at)}" type="button">استعادة</button></div>`).join('') : '<p class="hint">لا توجد إصدارات سابقة بعد.</p>'}</div>
    <div class="acts"><button class="btn ghost" data-dm="close" type="button">إغلاق</button></div></div>`;
  m.hidden = false;
  const getVer = async at => { const r = await api('GET', '?sec=' + sec + '&ver=' + encodeURIComponent(at)); if (r.headers.get('content-type').includes('json')) return null; return JSON.parse(await ungz(new Uint8Array(await r.arrayBuffer()), r.headers.get('x-enc') || 'gzip')); };
  m.onclick = async e => {
    if (e.target === m || e.target.closest('[data-dm="close"]')) { m.hidden = true; return; }
    const v = e.target.closest('[data-hv]'), r = e.target.closest('[data-hr]');
    if (v) { const d = await getVer(v.dataset.hv); if (d) diffModal(`الفرق بين نسختك الحالية ونسخة ${fmtAt(v.dataset.hv)}`, secDiff(sec, secData(sec), d), `<button class="btn pri" data-hr2="${esc(v.dataset.hv)}" type="button">استعادة هذه النسخة</button>`); const dm = $('#diffModal'); dm.onclick = async ev => { if (ev.target === dm || ev.target.closest('[data-dm="close"]')) { dm.hidden = true; return; } const r2 = ev.target.closest('[data-hr2]'); if (r2) { dm.hidden = true; await restoreVer(sec, r2.dataset.hr2, getVer); } }; return; }
    if (r) { m.hidden = true; await restoreVer(sec, r.dataset.hr, getVer); }
  };
}
async function restoreVer(sec, at, getVer) {
  if (!(await confirmBox(`استعادة نسخة «${SYNC_SECS[sec]}» المحفوظة ${fmtAt(at)}؟ تصبح هي المعتمدة على كل الأجهزة، ونسختك الحالية تُحفظ في السجل.`))) return;
  const d = await getVer(at); if (!d) return toast('تعذّر جلب النسخة', true);
  applySec(sec, d); delete PENDING[sec]; try { await pushSec(sec, true); } catch (e) { } save(true); window.__thumbs = {}; await drawBrand(); renderNav(); render(); toast('تمت الاستعادة ✓');
}
function fmtAt(iso) { try { const d = new Date(iso); return d.toLocaleString('ar-SA-u-nu-latn-ca-gregory', { weekday: 'long', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso; } }
function syncBadge() {
  const el = $('#saveState'); if (!el) return;
  let txt, cls;
  if (!LOCAL_OK) { txt = 'تعذّر الحفظ في المتصفح — صدّر نسخة احتياطية'; cls = 'bad'; }
  else if (!SYNC_CODE) { txt = SYNC_ST.state === 'auth' ? 'انتهت صلاحية الرمز — اضغط لإعادة التفعيل' : 'محفوظ على هذا الجهاز · اضغط لتفعيل المزامنة'; cls = 'ok local'; }
  else if (Object.keys(PENDING).length) { txt = 'تحديث من جهاز آخر بانتظار قرارك'; cls = 'warn'; }
  else if (SYNC_ST.state === 'busy' || syncT && ALL_SECS.some(syncDirty)) { txt = 'جارٍ الحفظ والمزامنة…'; cls = 'busy'; }
  else if (SYNC_ST.state === 'off') { txt = 'محفوظ على الجهاز · المزامنة متوقفة (لا اتصال)'; cls = 'warn'; }
  else { txt = 'محفوظ ومتزامن'; cls = 'ok'; }
  el.textContent = txt; el.className = 'savestate ' + cls; el.setAttribute('role', 'button'); el.tabIndex = 0;
  el.title = ALL_SECS.map(s => `${SYNC_SECS[s]}: ${SYNC[s] && SYNC[s].at ? 'آخر مزامنة ' + fmtAt(SYNC[s].at) : 'لم يُزامن بعد'}`).join('\n');
}
function syncStart() {
  syncBadge();
  if (SYNC_CODE) syncNow();
  setInterval(() => { if (document.visibilityState === 'visible') syncNow({ silent: true }); }, 25000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') syncNow({ silent: true }); else if (SYNC_CODE && ALL_SECS.some(syncDirty)) syncNow({ silent: true }); });
  window.addEventListener('online', () => syncNow({ silent: true }));
  document.addEventListener('focusout', () => setTimeout(() => { if (!busyTyping() && SYNC_CODE) syncSoon(); }, 50));
}
function choiceBox(msg, yes, no) {
  return new Promise(res => { const m = $('#confModal'), Y = $('#confYes'), N = $('#confNo'), oy = Y.textContent, on = N.textContent;
    $('#confMsg').textContent = msg; Y.textContent = yes; N.textContent = no; Y.className = 'btn pri'; m.hidden = false;
    const fin = v => { m.hidden = true; Y.textContent = oy; N.textContent = on; Y.className = 'btn danger'; res(v); };
    Y.onclick = () => fin(true); N.onclick = () => fin(false); });
}
const SLOT_NAMES = { cal: 'التقويم الدراسي', ttn: 'جدول الفصل القادم', tt: 'الجدول المدرسي العام', tch: 'قائمة المعلمين', noor: 'ملف نور', guide: 'ملف الإرشاد', ta: 'ملف إسناد المعلمين', gs: 'بيان توزيع الدرجات', com: 'ملف اللجان' };
/* يُطلب الرمز مرة واحدة في الجلسة؛ اختيار الملف يتم أولاً بلمسة مباشرة (متطلب سفاري في الآيفون) ثم التحقق */
let UNLOCKED = (() => { try { return sessionStorage.getItem('balat-unlock') === '1' || !!localStorage.getItem('balat-exams-v1-code'); } catch (e) { return false; } })();
async function unlock(reason) {
  if (UNLOCKED) return true;
  const ok = await askCode(reason);
  if (ok) { UNLOCKED = true; try { sessionStorage.setItem('balat-unlock', '1'); } catch (e) { } }
  return ok;
}
function askCode(reason) {
  return new Promise(res => {
    const m = $('#codeModal'); $('#codeReason').textContent = reason; $('#codeIn').value = ''; $('#codeErr').textContent = ''; m.hidden = false; setTimeout(() => $('#codeIn').focus(), 30);
    const done = v => { m.hidden = true; $('#codeOk').onclick = $('#codeCancel').onclick = null; $('#codeForm').onsubmit = null; res(v); };
    $('#codeForm').onsubmit = async e => {
      e.preventDefault(); const c = toWestern($('#codeIn').value.trim()); $('#codeErr').textContent = 'جارٍ التحقق…';
      const r = await verifyCode(c);
      if (r === true) { syncSetCode(c); done(true); }
      else { $('#codeErr').textContent = r === 'locked' ? 'تجاوزت عدد المحاولات — حاول بعد 15 دقيقة' : 'الرمز غير صحيح'; $('#codeIn').select(); }
    };
    $('#codeCancel').onclick = () => done(false);
  });
}
function confirmBox(msg) {
  return new Promise(res => { const m = $('#confModal'); $('#confMsg').textContent = msg; m.hidden = false; $('#confYes').onclick = () => { m.hidden = true; res(true); }; $('#confNo').onclick = () => { m.hidden = true; res(false); }; });
}

/* ===================== الأحداث ===================== */
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.setmeta) { updSetMeta(el.dataset.setmeta, { [el.dataset.f]: el.value }); updSetChip(); return; }
  if (el.dataset.pick && el.value === '__other') return;
  if (el.dataset.k) {
    let v = el.type === 'checkbox' ? el.checked : el.value;
    if (el.dataset.num) v = v === '' ? '' : Number(v);
    if (el.dataset.lines) v = String(v).split('\n').map(x => x.trim()).filter(Boolean);
    setPath(el.dataset.k, v); save();
    if (el.classList.contains('br') || /^s\.(yearTxt|footTxt)/.test(el.dataset.k)) brandSoon();
    const m = el.dataset.k.match(/^com\.(\d+)\.c\./); if (m) { const s = $(`[data-sum="${m[1]}"]`); if (s) s.textContent = comSum(S.com[+m[1]]); }
  }
  if (el.dataset.sf) { SF[el.dataset.sf] = el.value; saveSF(); if (el.dataset.sf === 'q') renderStuTable(); }
  if (el.classList.contains('fo') && el.type === 'number') { FO[el.dataset.o] = el.value; clearTimeout(window._pt); window._pt = setTimeout(renderPreview, 250); }
});
document.addEventListener('change', async e => {
  const el = e.target;
  if (el.dataset.pick && el.value === '__other') return pickOther(el);
  if (el.dataset.k && (el.tagName === 'SELECT' || el.type === 'checkbox')) { setPath(el.dataset.k, el.type === 'checkbox' ? el.checked : el.dataset.num ? Number(el.value) : el.value); save(); render(); return; }
  if (el.dataset.k && /^(days|com|s\.(codes|secOff|manualTot))/.test(el.dataset.k) && TAB !== 'forms') { if (TAB === 'committees' || /txt$/.test(el.dataset.k)) render(); return; }
  if (el.dataset.sf) { SF[el.dataset.sf] = el.value; if (el.dataset.sf === 'g') SF.sec = 'all'; saveSF(); render(); return; }
  if (el.classList.contains('fo')) { FO[el.dataset.o] = el.value; renderPreview(); return; }
  if (el.id === 'devName') { try { localStorage.setItem(LS_KEY + '-dev', el.value.trim()); } catch (e) { } toast('حُفظ اسم الجهاز — يظهر للأجهزة الأخرى عند وصول تعديلاتك'); return; }
  if (el.dataset.mode) { setSyncMode(el.dataset.mode, el.value); toast(el.value === 'ask' ? 'سيُعرض عليك أي تعديل من جهاز آخر قبل تطبيقه' : 'ستُطبَّق تعديلات الأجهزة الأخرى تلقائياً'); if (el.value === 'auto') syncNow({ silent: true }); return; }
  if (el.id === 'obsSel') { OBS_SEL = el.value; SWAP = null; render(); return; }
  const act = el.dataset.actChange;
  if (act === 'dayG' && el.value) { const d = S.days[+el.dataset.i]; d.g = el.value; d.h = toHijri(d.g); save(); render(); }
  if (act === 'dayH') {
    const i = +el.dataset.i, h = [+$('#dh0' + i).value, +$('#dh1' + i).value, +$('#dh2' + i).value];
    const iso = hijriToIso(h[0], h[1], h[2]);
    if (iso) { S.days[i].g = iso; S.days[i].h = h; save(); render(); } else toast('تاريخ هجري غير صالح', true);
  }
  if (el.classList.contains('slotfile') && el.files.length) { const f = el.files[0]; el.value = ''; if (await unlock('رفع ' + SLOT_NAMES[el.dataset.slot])) processSlot(el.dataset.slot, f); return; }
  if (el.id === 'jsonIn' && el.files[0]) {
    if (!(await unlock('استيراد نسخة احتياطية'))) { el.value = ''; return; }
    try { const d = JSON.parse(await el.files[0].text());
      if (d.kind === 'balat-section' && SYNC_SECS[d.sec]) { applySec(d.sec, d.data); save(true); await drawBrand(); toast(`تم استيراد «${SYNC_SECS[d.sec]}»`); render(); el.value = ''; return; }
      if (!d.v || !d.s) throw 0; S = deepMerge(clone(DEFAULT_STATE), d); S.days.forEach(fixDay); save(true); await drawBrand(); toast('تم استيراد النسخة الاحتياطية'); render(); }
    catch (x) { toast('الملف ليس نسخة احتياطية صالحة', true); }
    el.value = '';
  }
});
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act],[data-tab]'); if (!b) return;
  if (b.dataset.tab) return go(b.dataset.tab);
  const a = b.dataset.act, i = +b.dataset.i, j = +b.dataset.j;
  const re = () => { save(); render(); };
  switch (a) {
    case 'footColor': S.s.footColor = b.dataset.v; await drawBrand(); return re();
    case 'dateMode': S.s.dateMode = b.dataset.v; return re();
    case 'addOpen': S.s.openMembers.push({ n: '', w: 'معلم', r: 'عضواً' }); return re();
    case 'delOpen': S.s.openMembers.splice(i, 1); return re();
    case 'addDay': { const last = S.days[S.days.length - 1]; const d = { g: last ? nextWorkDay(last.g, true) : dateToIso(new Date()), txt: '', p: [{ n: 'الأولى', t: last && last.p[0] ? last.p[0].t : '', s: { 1: '', 2: '', 3: '' } }] }; fixDay(d); S.days.push(d); return re(); }
    case 'delDay': if (await confirmBox('حذف هذا اليوم وكل فتراته؟')) { S.days.splice(i, 1); re(); } return;
    case 'moveDay': { const k = i + +b.dataset.d; if (k < 0 || k >= S.days.length) return; const [d] = S.days.splice(i, 1); S.days.splice(k, 0, d); return re(); }
    case 'addPer': S.days[i].p.push({ n: S.days[i].p.length ? 'الثانية' : 'الأولى', t: '', s: { 1: '', 2: '', 3: '' } }); return re();
    case 'delPer': S.days[i].p.splice(j, 1); return re();
    case 'genDates': { const st = $('#genStart').value; if (!st) return toast('اختر تاريخ أول يوم', true); const skip = $('#genSkip').checked; let cur = st; if (skip) cur = nextWorkDay(dateToIso(new Date(isoToDate(st).getTime() - 86400000)), true); S.days.forEach((d, k) => { if (k > 0) cur = nextWorkDay(cur, skip); d.g = cur; d.h = toHijri(cur); }); toast('تم ترقيم التواريخ'); return re(); }
    case 'addCom': { const n = S.com.length ? Math.max(...S.com.map(c => +c.no || 0)) + 1 : 1; const l = S.com[S.com.length - 1]; S.com.push({ no: n, fl: l ? l.fl : '', rm: '', cap: l ? l.cap : 30, c: { 1: 0, 2: 0, 3: 0 } }); return re(); }
    case 'delCom': if (await confirmBox('حذف اللجنة رقم ' + S.com[i].no + '؟')) { S.com.splice(i, 1); S.distributed = false; re(); } return;
    case 'autoCounts': autoCounts(); toast('تم توزيع الأعداد على اللجان حسب السعة'); return re();
    case 'distribute': { const r = distributeStudents(); if (!r.ok) toast(r.msg, true); else toast('تم توزيع الطلاب وإعطاء أرقام الجلوس'); return render(); }
    case 'pick': $('#file_' + b.dataset.slot).click(); return;
    case 'stuSrc': SF.src = b.dataset.v; SF.g = 'all'; SF.sec = 'all'; saveSF(); return render();
    case 'buildSt': { const r = buildStFromTa(); toast(r.miss.length ? 'لم يُعثر على معلم لـ: ' + r.miss.join('، ') : 'تم ربط جميع مواد الجدول بمعلميها', !!r.miss.length); return re(); }
    case 'exportTa': { const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] }; const ws = XLSX.utils.json_to_sheet((S.ta.length ? S.ta : [{ g: 1, sub: 'رياضيات 1', sec: '1-2-3', t: 'اسم المعلم' }]).map(x => ({ 'اسم المعلم': x.t, 'المادة': x.sub, 'الصف': GNAME[x.g], 'الشعب': x.sec }))); ws['!cols'] = [{ wch: 28 }, { wch: 22 }, { wch: 18 }, { wch: 26 }]; ws['!views'] = [{ RTL: true }]; XLSX.utils.book_append_sheet(wb, ws, 'الإسناد'); return download(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), 'إسناد المعلمين.xlsx'); }
    case 'clearStudents': if (await askCode('حذف بيانات الطلاب')) { S.students = []; S.guide = []; S.uploads = {}; S.distributed = false; re(); toast('تم حذف الطلاب'); } return;
    case 'exportUnmatched': { const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] }; XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(S.guide.filter(x => !x.g).map(x => ({ 'الاسم': x.n, 'الجوال': fmtPhone(x.ph) }))), 'غير مطابق'); return download(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), 'أسماء غير مطابقة.xlsx'); }
    case 'stuCol': { const k = b.dataset.v; SF.cols = SF.cols.includes(k) ? SF.cols.filter(x => x !== k) : STU_COLS.map(c => c[0]).filter(x => x === k || SF.cols.includes(x)); saveSF(); b.classList.toggle('on'); return renderStuTable(); }
    case 'stuPrint': return printPages([{ land: false, pages: stuPages() }]);
    case 'stuWord': return wordDoc([{ land: false, pages: stuPages() }], fname(SF.title.trim() || 'كشف الطلاب'));
    case 'stuExcel': return stuExcel();
    case 'addSt': S.st.push({ sub: '', g: 1, t: '' }); return re();
    case 'delSt': S.st.splice(i, 1); return re();
    case 'stFromSchedule': { let n = 0; S.days.forEach(d => d.p.forEach(p => G.forEach(g => { const s = (p.s[g] || '').trim(); if (s && !S.st.some(x => x.sub.trim() === s && +x.g === g)) { S.st.push({ sub: s, g, t: '' }); n++; } }))); toast(n ? `أضيفت ${n} مادة` : 'كل مواد الجدول موجودة'); return re(); }
    case 'autoObs': if (!autoObservers()) toast('أضف أسماء المعلمين أولاً', true); else toast('تم توزيع الملاحظين على جميع الفترات'); return re();
    case 'clearObs': S.obs = {}; return re();
    case 'addTa': { const g = +b.dataset.g || 1; let at = -1; S.ta.forEach((x, k) => { if (+x.g === g) at = k; }); S.ta.splice(at + 1, 0, { g, sub: b.dataset.sub || '', sec: '', t: '' }); re(); setTimeout(() => { const el = $(`#f_ta_${at + 1}_${b.dataset.sub ? 't' : 'sub'}`); if (el) el.focus(); }, 30); return; }
    case 'obsAdd': { const k = b.dataset.k; S.obs[k] = obsList(k).concat(['']); re(); setTimeout(() => { const el = $(`#ob_${k}_${S.obs[k].length - 1}`); if (el) el.focus(); }, 30); return; }
    case 'obsDel': { const k = b.dataset.k; const l = obsList(k); l.splice(i, 1); S.obs[k] = l; SWAP = null; return re(); }
    case 'obsSwap': { const k = b.dataset.k; if (!SWAP) { SWAP = { key: k, i }; return render(); } if (SWAP.key === k && SWAP.i === i) { SWAP = null; return render(); } const A = obsList(SWAP.key), B = obsList(k); const t = A[SWAP.i]; A[SWAP.i] = B[i]; B[i] = t; S.obs[SWAP.key] = A; S.obs[k] = B; SWAP = null; toast('تم التبديل'); return re(); }
    case 'obsSwapCancel': SWAP = null; return render();
    case 'secPick': return openSecPicker(b);
    case 'homeDay': HOME_DAY = +b.dataset.v; return render();
    case 'bag': return runBag(b.dataset.op, b.dataset.kind, b.dataset.arg == null ? undefined : (/^\d+$/.test(b.dataset.arg) ? +b.dataset.arg : b.dataset.arg));
    case 'palette': return openPalette();
    case 'libOpen': { const f = FORMS.find(x => x.id === b.dataset.v); return openPreview(groupsOf(f.id, {}), fname(f.t)); }
    case 'tchTpl': tchTemplate(); return;
    case 'setUse': return setActive(b.dataset.v);
    case 'setSem': updSetMeta(b.dataset.v, { sem: b.dataset.s }); renderNav(); render(); return toast(`«${setMeta(b.dataset.v).n}» على الفصل الدراسي ${b.dataset.s}`);
    case 'ttOpen': DAILY_TAB = 'tt'; return go('daily');
    case 'todayDay': TODAY_DI = +b.dataset.v; return render();
    case 'todayForm': { const g = todayGroups(b.dataset.f); if (!g.length) return toast('لا توجد صفحات لهذا النموذج — تحقق من البيانات', true); const nm = fname(g[0].t + ' - ' + dayName(S.days[TODAY_DI]) + ' ' + dateShort(S.days[TODAY_DI]).replace(/\//g, '-')); return b.dataset.op === 'pdf' ? downloadPdf(g, nm) : openPreview(g, nm); }
    case 'setView': return previewSet(b.dataset.v);
    case 'setCopy': { const f = b.dataset.from, to = b.dataset.to; if (await confirmBox(`نسخ محتوى «${setMeta(f).n}» إلى «${setMeta(to).n}»؟ سيحل محل ما فيه الآن، ويبقى المحتوى السابق في «سجل النسخ».`)) { copySet(f, to); render(); toast(`نُسخ إلى «${setMeta(to).n}»`); } return; }
    case 'pendApply': return pendApply(b.dataset.v);
    case 'pendKeep': return pendKeep(b.dataset.v);
    case 'pendView': { const p = PENDING[b.dataset.v]; if (p) diffModal(`تعديلات ${p.by || 'الجهاز الآخر'} على «${SYNC_SECS[b.dataset.v]}»`, p.diff, `<button class="btn pri" data-act="pendApply" data-v="${b.dataset.v}" type="button">اعتماد تعديله</button><button class="btn" data-act="pendKeep" data-v="${b.dataset.v}" type="button">الإبقاء على نسختي</button>`); return; }
    case 'hist': return showHistory(b.dataset.v);
    case 'qG': { const id = b.dataset.form; QG[id] = toggleG(QG[id], b.dataset.v); $$(`.gchips[data-form="${id}"]`).forEach(s => s.outerHTML = gradeChips(QG[id], 'qG', id)); return; }
    case 'foG': FO.g = toggleG(FO.g, b.dataset.v); $$('.gchips[data-form=""]').forEach(s => s.outerHTML = gradeChips(FO.g, 'foG', '')); return renderPreview();
    case 'pickOpen': { const s = b.parentElement.querySelector('select'); if (s) openPicker(s); return; }
    case 'sortTeachers': S.teachers = arSort(S.teachers); toast('رُتبت القائمة هجائياً'); return re();
    case 'mergeTeachers': { const have = new Set(S.teachers.map(normName)); let n = 0; allTeachers().forEach(t => { if (!have.has(normName(t))) { S.teachers.push(t); n++; } }); S.teachers = arSort(S.teachers); toast(n ? `أضيف ${n} معلماً` : 'القائمة مكتملة'); return re(); }
    case 'qprint': case 'qword': case 'qpdf': case 'qopen': {
      const f = b.dataset.form, o = qopts(b), nm = fname(FORMS.find(x => x.id === f).t + (TA_FORMS.includes(f) ? ' - ' + setMeta(ACTIVE).n + ' - الفصل ' + setMeta(ACTIVE).sem : ''));
      const run = () => { const g = groupsOf(f, o); return a === 'qprint' ? printPages(g) : a === 'qword' ? wordDoc(g, nm) : a === 'qpdf' ? downloadPdf(g, nm) : openPreview(g, nm); };
      return TA_FORMS.includes(f) ? withSetSemAsync(ACTIVE, run) : run();
    }
    case 'qedit': FORM = b.dataset.form; FO = {}; return go('forms');
    case 'pvOpen': { const g = currentGroups(); return openPreview(g, fname(formDef().t)); }
    case 'stuExcelAll': { const k = clone(SF); Object.assign(SF, { src: 'noor', g: 'all', sec: 'all', q: '', cols: ['i', 'n', 'id', 'g', 'sec', 'ph', 'ph2', 'seat', 'com'].filter(c => c !== 'ph2' || S.guide.length), title: 'طلاب المدرسة - ملف نور' }); stuExcel(); SF = k; return; }
    case 'guideExcel': { const ws = XLSX.utils.aoa_to_sheet([['م', 'اسم الطالب', 'الجوال', 'الصف (من نور)', 'الشعبة (من نور)'], ...S.guide.map((x, i) => [i + 1, x.n, fmtPhone(x.ph), x.g ? gname(x.g) : '', x.sec || ''])]); ws['!cols'] = [{ wch: 5 }, { wch: 36 }, { wch: 14 }, { wch: 16 }, { wch: 10 }]; ws['!views'] = [{ RTL: true }]; const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] }; XLSX.utils.book_append_sheet(wb, ws, 'الإرشاد'); return download(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), 'ملف الإرشاد الطلابي.xlsx'); }
    case 'jumpStu': {
      const f = b.dataset.f, k = clone(SF);
      if (f === 'phones') { Object.assign(SF, { src: S.guide.length && !S.students.length ? 'guide' : 'noor', g: 'all', sec: 'all', q: '', cols: ['i', 'n', 'g', 'sec', S.students.length && S.guide.length ? 'ph2' : 'ph'], title: 'كشف جوالات أولياء الأمور' }); saveSF(); render(); const c = $('#stuPrintCard'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); return toast('جُهّز كشف الجوالات — اختر الصف أو الشعبة ثم اطبع أو حمّل'); }
      Object.assign(SF, { src: 'noor', g: 'all', sec: 'all', q: '' }); const pages = stuPages(), nm = fname(SF.title.trim() || 'كشف الطلاب'); SF = k;
      if (f === 'pdf') return downloadPdf([{ land: false, pages }], nm);
      if (f === 'word') return wordDoc([{ land: false, pages }], nm);
      return openPreview([{ land: false, pages }], nm);
    }
    case 'stuPv': return openPreview([{ land: false, pages: stuPages() }], fname(SF.title.trim() || 'كشف الطلاب'));
    case 'pvPrint': if (PV) printPages(PV.groups); return;
    case 'pvPdf': if (PV) downloadPdf(PV.groups, PV.name); return;
    case 'pvWord': if (PV) wordDoc(PV.groups, PV.name); return;
    case 'pvExcel': if (PV) excelFromGroups(PV.groups, PV.name); return;
    case 'pvZoom': if (PV) { PV.z = b.dataset.v === 'fit' ? 0 : +b.dataset.v; $$('[data-act=pvZoom]').forEach(x => x.classList.toggle('on', x === b)); pvFit(); } return;
    case 'pvClose': return closePreview();
    case 'pdf': { const g = currentGroups(); if (!g[0].pages.length) return toast('لا توجد صفحات', true); return downloadPdf(g, fname(formDef().t)); }
    case 'stuPdf': return downloadPdf([{ land: false, pages: stuPages() }], fname(SF.title.trim() || 'كشف الطلاب'));
    case 'delTa': S.ta.splice(i, 1); return re();
    case 'addSpecial': S.special.push({ title: 'قائمة جديدة', kind: 'sign', rows: [] }); return re();
    case 'delSpecial': if (await confirmBox('حذف القائمة؟')) { S.special.splice(i, 1); re(); } return;
    case 'addSpRow': S.special[i].rows.push({ n: '', g: 1 }); return re();
    case 'delSpRow': S.special[i].rows.splice(j, 1); return re();
    case 'form': FORM = b.dataset.v; FO = {}; try { localStorage.setItem(LS_KEY + '-form', FORM); } catch (x) { } return render();
    case 'print': { const g = currentGroups(); if (!g[0].pages.length) return toast('لا توجد صفحات', true); return printPages(g); }
    case 'printAll': return printPages(currentGroups(true));
    case 'word': { const g = currentGroups(); if (!g[0].pages.length) return toast('لا توجد صفحات', true); return wordDoc(g, fname(formDef().t)); }
    case 'excel': return excelFromGroups(currentGroups(), fname(formDef().t));
    case 'exportSec': return download(new Blob([JSON.stringify({ kind: 'balat-section', sec: b.dataset.v, at: new Date().toISOString(), data: secData(b.dataset.v) })], { type: 'application/json' }), `${b.dataset.v === 'ta' ? 'قسم الإسناد' : 'قسم الاختبارات'} - ${dateToIso(new Date())}.json`);
    case 'syncNow': await syncNow(); toast(SYNC_ST.state === 'ok' ? 'كل شيء محفوظ ومتزامن ✓' : 'تعذّر الاتصال — ستتم المزامنة تلقائياً عند توفره', SYNC_ST.state !== 'ok'); return render();
    case 'syncOn': if (await askCode('تفعيل الحفظ والمزامنة بين الأجهزة')) { await syncNow(); toast('فُعّلت المزامنة'); render(); } return;
    case 'syncOff': if (await confirmBox('إيقاف المزامنة على هذا الجهاز؟ تبقى البيانات محفوظة عليه، ولن تصله تحديثات الأجهزة الأخرى.')) { SYNC_CODE = ''; try { localStorage.removeItem(LS_KEY + '-code'); } catch (e) { } syncBadge(); render(); } return;
    case 'restoreConf': { const c = JSON.parse(localStorage.getItem(LS_KEY + '-conflict-' + b.dataset.v) || 'null'); if (c && await confirmBox('استعادة هذه النسخة؟ ستحل محل القسم الحالي وتُرفع للسحابة.')) { applySec(b.dataset.v, c.data); localStorage.removeItem(LS_KEY + '-conflict-' + b.dataset.v); save(true); render(); toast('تمت الاستعادة'); } return; }
    case 'dropConf': localStorage.removeItem(LS_KEY + '-conflict-' + b.dataset.v); return render();
    case 'exportJson': return download(new Blob([JSON.stringify(S)], { type: 'application/json' }), `نسخة احتياطية - الاختبارات - ${dateToIso(new Date())}.json`);
    case 'importJson': $('#jsonIn').click(); return;
    case 'resetAll': if (await askCode('إعادة ضبط كل البيانات')) { S = clone(DEFAULT_STATE); S.days.forEach(fixDay); save(true); await drawBrand(); toast('تمت إعادة الضبط'); render(); } return;
  }
});
function nextWorkDay(iso, skip) { let d = isoToDate(iso); do { d = new Date(d.getTime() + 86400000); } while (skip && (d.getUTCDay() === 5 || d.getUTCDay() === 6)); return dateToIso(d); }
/* ===================== التشغيل ===================== */
window.addEventListener('resize', () => { clearTimeout(window._rz); window._rz = setTimeout(() => { fitPreview(); pvFit(); }, 120); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && PV) closePreview(); });
window.addEventListener('hashchange', () => { const h = location.hash.slice(1); if (TABS.some(t => t[0] === h) && h !== TAB) go(h); });
(async function init() {
  load();
  try { const f = localStorage.getItem(LS_KEY + '-form'); if (f) FORM = f; } catch (e) { }
  const h = ALIAS[location.hash.slice(1)] || location.hash.slice(1); if (TABS.some(t => t[0] === h)) TAB = h;
  renderNav(); setSaved(true);
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) { }
  await drawBrand();
  TABS = ALL_TABS.filter(x => roleAllows(x[0])); if (!location.hash.slice(1) || !TABS.some(x => x[0] === TAB)) TAB = PEOPLE[ROLE || 'admin'].home;
  renderNav(); render();
  if (!SYNC_CODE && typeof autoSeed === 'function') autoSeed(null);
  syncStart();
  if (!ROLE) roleModal(true);
})();
document.addEventListener('click', e => { const j = e.target.closest && e.target.closest('[data-jump]'); if (!j) return; const el = document.getElementById(j.dataset.jump); if (el) { const y = el.getBoundingClientRect().top + scrollY - 70; scrollTo({ top: y, behavior: 'smooth' }); } });
document.addEventListener('click', async e => {
  if (!e.target.closest || !e.target.closest('#saveState')) return;
  if (!SYNC_CODE) { if (await askCode('تفعيل الحفظ والمزامنة بين الأجهزة')) toast('فُعّلت المزامنة — بياناتك محفوظة ومتاحة على أي جهاز تدخل منه بالرمز'); }
  else { await syncNow(); toast(SYNC_ST.state === 'ok' ? 'كل شيء محفوظ ومتزامن ✓' : 'لا يوجد اتصال — البيانات محفوظة على الجهاز وستُزامن تلقائياً', SYNC_ST.state !== 'ok'); }
});
document.addEventListener('keydown', e => { const l = e.target.closest && e.target.closest('label.btn[for]'); if (l && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); const f = document.getElementById(l.htmlFor); if (f) f.click(); } });
