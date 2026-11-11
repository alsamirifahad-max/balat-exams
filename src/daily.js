/* =====================================================================
   الأعمال اليومية: الجدول المدرسي العام، حصص الانتظار، الإشراف والمناوبة
   ===================================================================== */
var DAILY_DATE = null, DAILY_TAB = 'wait', TT_DAY = null, TT_WHICH = 'cur';
var TT_DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
var DUTY_DEF = {
  no: '9', code: 'و.ت.ع.ن-01-02', name: 'تقرير الإشراف والمناوبة اليومي',
  b: [{ t: 'الفسحة الأولى', g: 'الصف الثاني الثانوي – الثالث الثانوي', locs: ['المقصف', 'أمام وخلف الصالة', 'أمام وخلف المبنى المدرسي'] },
      { t: 'الفسحة الثانية', g: 'الصف الأول الثانوي', locs: ['المقصف', 'أمام وخلف الصالة', 'أمام وخلف المبنى المدرسي'] }],
  dutyRows: 3
};
var ADM_DEF = 'عبدالله الغامدي، كامل القرني، سالم الشهراني، عبدالعزيز الغامدي، أنور الغامدي، سليمان الشهري، فواز السلمي، نايف القاضي، حاتم السلمي، محمد السهلي، عبدالله المطيري، مطلق المحمادي، ماجد جهام';
/* الهيئة الإدارية: تظهر أولاً عند اختيار المناوب */
function admList() { const c = D().cfg; if (c.adm == null) c.adm = ADM_DEF; return String(c.adm).split(/[،,\n]+/).map(x => x.trim()).filter(Boolean); }
function admSet(list) { const seen = new Set(); D().cfg.adm = list.map(x => x.trim()).filter(x => x && !seen.has(normName(x)) && seen.add(normName(x))).join('، '); }
function admEditor() { const L = admList();
  return `<details class="admed"${ADM_OPEN ? ' open' : ''}><summary>🏢 الهيئة الإدارية (${L.length}) — تظهر أولاً عند اختيار المناوب · إضافة / حذف</summary>
    <div class="wchips">${L.map(n => `<span class="achip adm">${esc(n)}<button type="button" class="x" data-act="admDel" data-n="${esc(n)}" aria-label="حذف ${esc(n)}" title="حذف">✕</button></span>`).join('') || '<small class="mut">لا أحد بعد</small>'}</div>
    <div class="admadd"><input class="in" id="admIn" list="admDl" placeholder="اكتب اسماً أو أكثر مفصولة بفاصلة «،»" onkeydown="if(event.key==='Enter'){event.preventDefault();this.nextElementSibling.click()}"><button class="btn sm pri" data-act="admAdd" type="button">+ إضافة</button>
    <datalist id="admDl">${ttNames().filter(n => !isAdm(n)).map(n => `<option value="${esc(n)}">`).join('')}</datalist></div>
    <div class="acts"><button class="btn sm ghost" data-act="admReset" type="button">↺ القائمة الأصلية</button></div></details>`; }
var ADM_OPEN = false;
function isAdm(n) { return admList().some(a => normName(a) === normName(n)); }
function admSplit(names, absSet) { const adm = admList(), ak = new Set(adm.map(normName)); return { adm: adm.filter(n => !absSet || !absSet.has(normName(n))), rest: names.filter(n => !ak.has(normName(n))) }; }
function D() { S.daily = S.daily || {}; const d = S.daily; d.wait = d.wait || {}; d.duty = d.duty || {}; d.week = d.week || {}; d.cfg = d.cfg || clone(DUTY_DEF); if (!d.cfg.b) d.cfg = clone(DUTY_DEF); return d; }
/* ---------- التوقيت المدرسي (الجرس) ---------- */
var BELL_W = { 1: [['07:30', '08:20'], ['08:20', '09:10'], ['09:10', '09:55'], ['10:20', '11:05'], ['11:05', '11:50'], ['11:50', '12:35'], ['12:35', '13:15']],
  23: [['07:30', '08:20'], ['08:20', '09:10'], ['09:35', '10:20'], ['10:20', '11:05'], ['11:05', '11:50'], ['11:50', '12:35'], ['12:35', '13:15']] };
function bell() { const c = D().cfg; if (!c.bell) c.bell = { act: 'w', w: clone(BELL_W), s: clone(BELL_W) }; ['w', 's'].forEach(k => { if (!c.bell[k]) c.bell[k] = clone(BELL_W); }); return c.bell; }
function bellNow() { const b = bell(); return b[b.act] || b.w; }
const BELL_NAME = { w: 'الشتوي', s: 'الصيفي' };
function tMin(t) { const m = /(\d{1,2}):(\d{2})/.exec(String(t || '')); return m ? +m[1] * 60 + +m[2] : null; }
function t12(t) { const m = tMin(t); if (m == null) return ''; let h = Math.floor(m / 60); const mm = String(m % 60).padStart(2, '0'); if (h > 12) h -= 12; return `${h}:${mm}`; }
/* وقت الحصة حسب الصف: أول ثانوي له جدول، وثاني وثالث جدول */
function pTime(p, g) { const B = bellNow(), r = (B[g === 1 ? 1 : 23] || [])[p - 1]; return r ? `${t12(r[0])}–${t12(r[1])}` : ''; }
function pTimeAny(p) { const B = bellNow(), a = (B[1] || [])[p - 1], b = (B[23] || [])[p - 1]; if (!a || !b) return pTime(p, 2); return a[0] === b[0] && a[1] === b[1] ? pTime(p, 2) : `أول ${t12(a[0])} · ثاني/ثالث ${t12(b[0])}`; }
/* الحصة الجارية الآن (أو القادمة وقت الفسحة) */
function curP(atMin) { const B = bellNow(), m = atMin != null ? atMin : (() => { const t = new Date(); return t.getHours() * 60 + t.getMinutes(); })();
  for (let p = 1; p <= 7; p++) { const e = Math.max(tMin((B[1][p - 1] || [])[1]) || 0, tMin((B[23][p - 1] || [])[1]) || 0); if (m < e) return p; } return 8; }
function bellCard(n, noUp) {
  const b = bell(), B = bellNow(), f = D().bellF;
  const tbl = k => { const X = b[k]; return `<div class="tw"><table class="et bellt"><tr><th>الحصة</th><th>الأول الثانوي</th><th>الثاني والثالث الثانوي</th></tr>${[1, 2, 3, 4, 5, 6, 7].map(p => `<tr><td><b>${['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة', 'السابعة'][p - 1]}</b></td>${[1, 23].map(g => `<td><span class="bt">${noUp ? `${t12(X[g][p - 1][0])} – ${t12(X[g][p - 1][1])}` : `${inp(`daily.cfg.bell.${k}.${g}.${p - 1}.0`, X[g][p - 1][0], { type: 'time' })}<i>إلى</i>${inp(`daily.cfg.bell.${k}.${g}.${p - 1}.1`, X[g][p - 1][1], { type: 'time' })}`}</span></td>`).join('')}</tr>`).join('')}</table></div>`; };
  return fileCard('bell', { n, c: '#0f766e', t: 'التوقيت المدرسي', d: 'أوقات الحصص والفسح — تُعرض بجانب كل حصة في الانتظار، ويُعرف منها «الحصة الآن».', has: true, noUp,
    fmt: 'صورة أو PDF أو Word', accept: 'image/*,.png,.jpg,.jpeg,.webp,.heic,.pdf,.docx,.doc',
    facts: `<b>${BELL_NAME[b.act]}</b><span>المعتمد</span><em>الأولى ${t12(B[23][0][0])} · السابعة تنتهي ${t12(B[23][6][1])}</em>`,
    out: `${f && (f.imgs && f.imgs.length || f.html) ? '<button class="btn sm" data-act="bellView" type="button">عرض الملف</button>' : ''}
      <details class="caldates"><summary>جدول الأوقات${noUp ? '' : ' (تعديل)'}</summary>
      ${noUp ? '' : `<div class="dtabs sm" style="margin:8px 0">${['w', 's'].map(k => `<button type="button" class="${b.act === k ? 'on' : ''}" data-act="bellAct" data-v="${k}">${k === 'w' ? '❄︎' : '☀︎'} التوقيت ${BELL_NAME[k]}${b.act === k ? ' ✓' : ''}</button>`).join('')}</div><small class="hint">الزر يعتمد التوقيت مباشرة. الحصة الثالثة تختلف بين الأول وبقية الصفوف بسبب الفسحة.</small>`}
      ${tbl(b.act)}</details>` });
}
async function bellUpload(file) {
  const { imgs, txt, html } = await readDocFile(file); if (!imgs.length && !html && !txt) throw new Error('لم أجد في الملف صورة أو نصاً');
  D().bellF = { imgs: imgs.slice(0, 2), html, src: file.name, at: stamp() }; S.uploads.bell = { name: file.name, at: stamp(), info: imgs.length ? 'صورة' : 'نص' };
  const ts = (toWestern(txt || '').match(/\b\d{1,2}[:٫.,]\d{2}\b/g) || []).map(x => { let [h, m] = x.split(/[:٫.,]/).map(Number); if (h < 6) h += 12; return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`; }).filter(x => tMin(x) >= 360 && tMin(x) <= 900);
  const b = bell(), k = b.act; let got = '';
  if (ts.length === 28) { for (let p = 0; p < 7; p++) { b[k][1][p] = [ts[p * 2], ts[p * 2 + 1]]; b[k][23][p] = [ts[14 + p * 2], ts[14 + p * 2 + 1]]; } got = 'وقرأت منه الأوقات — راجعها في الجدول.'; }
  else if (ts.length === 14) { for (let p = 0; p < 7; p++) { b[k][1][p] = b[k][23][p] = [ts[p * 2], ts[p * 2 + 1]]; } got = 'وقرأت منه الأوقات — راجعها في الجدول.'; }
  return `حُفظ ملف التوقيت المدرسي (${file.name}) ${got || '— الأوقات المعتمدة في «جدول الأوقات» بالبطاقة؛ عدّلها إن اختلفت عن الملف.'}`;
}
function dIso() { if (!DAILY_DATE) DAILY_DATE = todayIso(); return DAILY_DATE; }
function wdOf(iso) { const w = isoToDate(iso).getUTCDay(); return w <= 4 ? w : -1; }
function hijriOf(iso) { const [y, m, d] = toHijri(iso); return `${d} / ${m} / ${y}`; }
function dayAr(iso) { return DAYS_AR[isoToDate(iso).getUTCDay()]; }
const secGrade = s => { s = +s; return s >= 21 ? 3 : s >= 11 ? 2 : s >= 1 ? 1 : 0; };
/* الصفوف التي يدرّسها كل معلم حسب الجدول (لأولوية الانتظار) */
let TG_CACHE = null;
function tGrades() { const t = D().tt; if (TG_CACHE && TG_CACHE.t === t) return TG_CACHE.m; const m = new Map(); (t ? t.teachers : []).forEach(x => { const g = new Set(); Object.values(x.c).forEach(v => String(v).split(/[^0-9]+/).filter(Boolean).forEach(n => { const k = secGrade(n); if (k) g.add(k); })); m.set(normName(x.n), g); }); TG_CACHE = { t, m }; return m; }
function teachesGrade(n, g) { const s = tGrades().get(normName(n)); return !!(g && s && s.has(g)); }
function gradeOfText(t) { t = String(t || ''); return /ثالث|3/.test(t) ? 3 : /ثان|2/.test(t) ? 2 : /أول|اول|1/.test(t) ? 1 : 0; }
function rowGrade(iso, b, p) { const d = wdOf(iso), sc = b && b.abs && d >= 0 ? ttSecs(b.abs, d, p) : []; if (sc.length) return secGrade(sc[0]); const r = (b && b.rows || {})[p] || {}; return gradeOfText(r.g) || (r.s ? secGrade(r.s) : 0); }

/* ---------- الجدول المدرسي ---------- */
function ttNames() { const t = D().tt; return t ? arSort(t.teachers.map(x => x.n)) : tchAll(); }
function ttRow(name) { const t = D().tt; if (!t || !name) return null; const k = normName(name), pk = personKey(name); return t.teachers.find(x => normName(x.n) === k) || t.teachers.find(x => personKey(x.n) === pk) || null; }
function ttCell(name, d, p) { const r = ttRow(name); return r && r.c[d + '-' + p] || ''; }
function ttSecs(name, d, p) { return String(ttCell(name, d, p)).split(/[^0-9]+/).filter(Boolean); }
function ttDayLoad(name, d) { let n = 0; for (let p = 1; p <= 7; p++) if (ttCell(name, d, p)) n++; return n; }
function ttParsePdfItems(items) {
  const N = s => toWestern(String(s).normalize('NFKC'));
  const it = items.map(i => ({ s: N(i.str).trim(), x: i.transform[4], y: i.transform[5], w: i.width || 0 })).filter(i => i.s);
  /* صف أرقام الحصص */
  const nums = it.filter(i => /^[1-9]$/.test(i.s)); const byY = {}; nums.forEach(i => { const k = Math.round(i.y); (byY[k] = byY[k] || []).push(i); });
  const hy = Object.keys(byY).sort((a, b) => byY[b].length - byY[a].length)[0]; if (!hy || byY[hy].length < 5) return null;
  const cols = byY[hy].map(i => ({ p: +i.s, cx: i.x + i.w / 2 }));
  const dayItems = it.filter(i => TT_DAYS.some(d => normName(i.s) === normName(d)));
  cols.forEach(c => { let best = null, bd = 1e9; dayItems.forEach(di => { const dd = Math.abs(di.x + di.w / 2 - c.cx); if (dd < bd) { bd = dd; best = di; } }); c.d = best ? TT_DAYS.findIndex(d => normName(d) === normName(best.s)) : -1; });
  if (cols.some(c => c.d < 0)) { const srt = cols.slice().sort((a, b) => b.cx - a.cx); srt.forEach((c, i) => c.d = Math.floor(i / 7)); }
  const colW = Math.min(...cols.map(a => Math.min(...cols.filter(b => b !== a).map(b => Math.abs(a.cx - b.cx))))) || 30;
  const maxX = Math.max(...cols.map(c => c.cx)) + colW / 2;
  const names = it.filter(i => i.y < +hy - 2 && i.x > maxX - 2 && /[؀-ۿ]{2}/.test(i.s) && i.s !== 'ش').sort((a, b) => b.y - a.y);
  const rowGap = names.length > 1 ? Math.min(...names.slice(1).map((n, k) => names[k].y - n.y).filter(v => v > 1)) : 11;
  const T = names.map(n => ({ n: n.s.replace(/\s+/g, ' '), y: n.y, c: {} }));
  const cells = it.filter(i => i.y < +hy - 2 && i.x < maxX && /^\d{1,2}$/.test(i.s));
  const shins = it.filter(i => i.s === 'ش');
  cells.forEach(c => {
    const row = T.find(t => Math.abs(t.y - c.y) < rowGap / 2); if (!row) return;
    const sh = shins.filter(s => Math.abs(s.y - c.y) < 2 && s.x >= c.x + c.w - 2 && s.x < c.x + c.w + 6).sort((a, b) => a.x - b.x)[0];
    const cx = sh ? (c.x + sh.x + sh.w) / 2 : c.x + c.w / 2;
    let best = null, bd = 1e9; cols.forEach(k => { const dd = Math.abs(k.cx - cx); if (dd < bd) { bd = dd; best = k; } });
    if (!best || bd > colW * 0.7) return; const key = best.d + '-' + best.p;
    row.c[key] = row.c[key] ? row.c[key] + '،' + c.s : c.s;
  });
  T.forEach(t => delete t.y);
  return T.filter(t => t.n.length > 2);
}
async function ttFromPdf(buf) {
  await ensurePdfJs(); const pdf = await pdfjsLib.getDocument({ data: buf, isEvalSupported: false, disableFontFace: true }).promise; let out = [];
  for (let pn = 1; pn <= pdf.numPages; pn++) { const pg = await pdf.getPage(pn); const tc = await pg.getTextContent({ disableNormalization: true }); const r = ttParsePdfItems(tc.items); if (r) out = out.concat(r); }
  return out;
}
function ttFromRows(rows) {
  rows = rows.map(r => (r || []).map(c => toWestern(String(c == null ? '' : c)).normalize('NFKC').trim()));
  const dr = rows.findIndex(r => r.filter(c => TT_DAYS.some(d => normName(c).includes(normName(d)))).length >= 3); if (dr < 0) return [];
  let pr = rows.findIndex((r, i) => i > dr && r.filter(c => /^[1-9]$/.test(c)).length >= 10); if (pr < 0) pr = dr;
  const colMap = {}; let curD = -1;
  const W = Math.max(rows[dr].length, rows[pr].length);
  for (let j = 0; j < W; j++) { const dn = rows[dr][j]; const di = TT_DAYS.findIndex(d => dn && normName(dn).includes(normName(d))); if (di >= 0) curD = di; const p = rows[pr][j]; if (curD >= 0 && /^[1-9]$/.test(p)) colMap[j] = curD + '-' + p; }
  /* عمود الاسم: أكثر عمود فيه نصوص عربية خارج أعمدة الحصص */
  const cnt = {}; rows.slice(pr + 1).forEach(r => r.forEach((c, j) => { if (!colMap[j] && /[؀-ۿ]{3}/.test(c) && !/^ش?\s*\d/.test(c)) cnt[j] = (cnt[j] || 0) + 1; }));
  const nc = +Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0]; if (isNaN(nc)) return [];
  const out = [];
  rows.slice(pr + 1).forEach(r => { const n = (r[nc] || '').replace(/\s+/g, ' ').trim(); if (!n || !/[؀-ۿ]{2}/.test(n)) return; const c = {};
    Object.entries(colMap).forEach(([j, k]) => { const v = (r[j] || '').match(/\d{1,2}/g); if (v) c[k] = v.join('،'); }); out.push({ n, c }); });
  return out;
}
async function readTimetable(file) {
  const buf = new Uint8Array(await file.arrayBuffer());
  if (buf[0] === 0x25 && buf[1] === 0x50) return ttFromPdf(buf);
  if (/\.docx?$/i.test(file.name)) return ttFromRows(buf[0] === 0xD0 ? docBinaryRows(buf) : docxRows(buf));
  const wb = XLSX.read(buf, { type: 'array' }); let all = [];
  wb.SheetNames.forEach(n => { all = all.concat(ttFromRows(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' }))); });
  return all;
}

/* ---------- الانتظار ---------- */
function W(iso) { const w = D().wait; w[iso] = w[iso] || { blocks: [] }; return w[iso]; }
function absentSet(iso) { return new Set(((D().wait[iso] || {}).blocks || []).filter(b => !b.part).map(b => normName(b.abs)).filter(Boolean)); }
/* الحضور الجزئي (استئذان / خروج مبكر / تأخر): b.part = {a, b} = الحصص التي يكون فيها موجوداً */
function blkNeeds(b, p) { return !b.part || p < b.part.a || p > b.part.b; }
function exitR() { const c = D().cfg; c.exitR = c.exitR || {}; return c.exitR; }
/* قاعدة دائمة: يخرج بعد آخر حصة له (كل الأيام أو أيام محددة) */
function ruleOut(n, d, p) { const r = exitR()[normName(n)]; if (!r || d < 0 || (r.days && r.days.length && !r.days.includes(d))) return false; return lastC(n, d) < p; }
function outAt(iso, p) { const s = new Set(((D().wait[iso] || {}).blocks || []).filter(b => b.abs && blkNeeds(b, p)).map(b => normName(b.abs))), d = wdOf(iso);
  if (d >= 0 && D().tt) Object.values(exitR()).forEach(r => { if (ruleOut(r.n, d, p)) s.add(normName(r.n)); }); return s; }
function partOf(iso, name) { const k = normName(name); const b = ((D().wait[iso] || {}).blocks || []).find(x => x.part && normName(x.abs) === k); return b ? b.part : null; }
function partLbl(b, L) { const P = b.part; if (!P) return ''; L = L || 7;
  if (P.a > 1 && P.b < L) return `حاضر من الحصة ${P.a} إلى ${P.b}`; if (P.b < L) return P.b === 0 ? 'غائب طوال اليوم' : `استأذن بعد الحصة ${P.b}`; if (P.a > 1) return `تأخر — حضر من الحصة ${P.a}`; return 'حاضر طوال اليوم'; }
/* بعد تسجيل غياب أو استئذان: يُفرَّغ انتظاره في الحصص التي لا يكون فيها موجوداً ويُعاد توزيعها تلقائياً */
function reflow(iso, name) {
  const w = W(iso), k = normName(name), moved = []; let freed = 0;
  w.blocks.forEach((b, bi) => { Object.entries(b.rows || {}).forEach(([p, r]) => { p = +p; if (!r) return;
    if (normName(b.abs) === k && !blkNeeds(b, p) && r.t) { r.t = ''; freed++; }
    if (r.t && normName(r.t) === k && outAt(iso, p).has(k)) { r.t = ''; moved.push({ bi, p }); } }); });
  const got = moved.map(({ bi, p }) => { const b = w.blocks[bi], r = b.rows[p], R = waitRank(iso, b, p), g = subOptsFor(iso, bi, p)[0].items.slice().sort(R.cmp); if (g.length) r.t = g[0]; return { p, abs: b.abs, t: r.t }; });
  return { got, freed };
}
function lastC(n, d) { for (let p = 7; p >= 1; p--) if (ttCell(n, d, p)) return p; return 0; }
function skipDone() { return D().cfg.skipDone !== false; }
/* من أنهى حصصه قبل هذه الحصة: غالباً خرج من المدرسة */
function doneBefore(iso, n, p) { const d = wdOf(iso); return d >= 0 && skipDone() && lastC(n, d) < p; }
function quickOut(iso, n, p) {
  const w = W(iso), k = normName(n); let b = w.blocks.find(x => normName(x.abs) === k);
  if (b && !b.part) return false;
  if (!b) { b = p > 1 ? { abs: n, rows: {}, part: { a: 1, b: p - 1 }, q: 1 } : { abs: n, rows: {}, q: 1 }; w.blocks.push(b); }
  else { if (b.prev === undefined) b.prev = clone(b.part); if (p > 1) b.part.b = Math.min(b.part.b, p - 1); else delete b.part; }
  return reflow(iso, n);
}
function quickUndo(iso, n) { const w = W(iso), k = normName(n), i = w.blocks.findIndex(x => normName(x.abs) === k); if (i < 0) return; const b = w.blocks[i];
  if (b.q) w.blocks.splice(i, 1); else if (b.prev !== undefined) { b.part = b.prev; delete b.prev; } }
function reflowMsg(name, x) { if (!x.got.length) return ''; return ` · أُعيد توزيع ${x.got.length} انتظار كان مكلفاً به: ${x.got.map(g => `ح${g.p} ← ${g.t || 'بلا بديل!'}`).join('، ')}`; }
function subsAt(iso, p, skip) { const out = {}; ((D().wait[iso] || {}).blocks || []).forEach((b, bi) => { const r = b.rows && b.rows[p]; if (r && r.t && !(skip && skip[0] === bi)) out[normName(r.t)] = (out[normName(r.t)] || 0) + 1; }); return out; }
function waitLoad(iso) { const m = {}; ((D().wait[iso] || {}).blocks || []).forEach(b => Object.values(b.rows || {}).forEach(r => { if (r && r.t) m[normName(r.t)] = (m[normName(r.t)] || 0) + 1; })); return m; }
function weekLoad() { const r = statRange('t'); return loadIn(r[0], r[1]); }
function subIssue(iso, bi, p, name) {
  if (!name) return ''; const d = wdOf(iso), k = normName(name);
  if (absentSet(iso).has(k)) return 'غائب اليوم';
  if (outAt(iso, p).has(k)) { const b = ((D().wait[iso] || {}).blocks || []).find(x => normName(x.abs) === k); return b ? `غير موجود في هذه الحصة (${partLbl(b, d >= 0 ? lastP(d) : 7)})` : `🚪 يخرج بعد آخر حصة له (${lastC(name, d) || 'لا حصص اليوم'})`; }
  const sc = d >= 0 ? ttCell(name, d, p) : ''; if (sc) return `لديه حصة في نفس الوقت (ش ${sc})`;
  if ((subsAt(iso, p, [bi])[k] || 0) > 0) return 'مكلف بانتظار آخر في نفس الحصة';
  return '';
}
function subOptsFor(iso, bi, p) {
  const d = wdOf(iso), abs = outAt(iso, p), taken = subsAt(iso, p, [bi]), load = waitLoad(iso), wk = weekLoad();
  const names = ttNames(); const free = [], busy = [], away = [];
  names.forEach(n => { const k = normName(n); if (abs.has(k)) away.push(n); else if ((d >= 0 && ttCell(n, d, p)) || taken[k]) busy.push(n); else free.push(n); });
  return [{ label: `✓ متاحون في الحصة ${p} (${free.length})`, items: free }, { label: '⚠ لديهم حصة أو انتظار في نفس الوقت', items: busy }, { label: `✕ غائبون أو مستأذنون في الحصة ${p}`, items: away }];
}
function autoFill(iso) {
  const w = W(iso), d = wdOf(iso); let n = 0;
  w.blocks.forEach((b, bi) => { for (let p = 1; p <= 7; p++) { if (!(d >= 0 && ttCell(b.abs, d, p)) || !blkNeeds(b, p)) continue; b.rows = b.rows || {}; const r = b.rows[p] = b.rows[p] || {}; if (r.t) continue;
    const R = waitRank(iso, b, p); const g = subOptsFor(iso, bi, p)[0].items.slice().sort(R.cmp); if (g.length) { r.t = g[0]; n++; } } });
  return n;
}

/* ---------- المناوبة ---------- */
function U(iso) {
  const all = D().duty; if (all[iso]) return all[iso];
  const cfg = D().cfg, wk = D().week[wdOf(iso)];
  const blank = { b: cfg.b.map(b => ({ gen: '', rows: b.locs.map(l => ({ n: '', loc: l, note: '' })) })), duty: Array.from({ length: cfg.dutyRows || 3 }, () => ({ n: '', note: '' })), sem: S.s.sem };
  if (!wk) return blank; const w = clone(wk);
  return { b: Array.isArray(w.b) && w.b.length ? w.b : blank.b, duty: Array.isArray(w.duty) && w.duty.some(r => r && r.n) ? w.duty.map(r => ({ n: r.n || '', note: '' })) : blank.duty, sem: S.s.sem, fromWeek: true };
}
/* ----- جدول المناوبة الأسبوعي الثابت المرتبط بالحصة الأخيرة ----- */
function weekTpl(wd) { const W = D().week; if (!W[wd]) W[wd] = {}; const t = W[wd], n = D().cfg.dutyRows || 3; t.duty = Array.isArray(t.duty) ? t.duty : []; while (t.duty.length < n) t.duty.push({ n: '' }); return t; }
let LP_CACHE = null;
function lastP(wd) { const t = D().tt; if (!t) return 7; if (!LP_CACHE || LP_CACHE.t !== t) LP_CACHE = { t, m: {} }; if (LP_CACHE.m[wd] == null) { let m = 0; t.teachers.forEach(x => { for (let p = 7; p > m; p--) if (x.c[wd + '-' + p]) { m = p; break; } }); LP_CACHE.m[wd] = m || 7; } return LP_CACHE.m[wd]; }
const PNAME = { 5: 'الخامسة', 6: 'السادسة', 7: 'السابعة', 8: 'الثامنة' };
function lastLbl(wd) { const p = lastP(wd); return `الحصة الأخيرة (${PNAME[p] || p})`; }
function has7(n, wd) { return !!(D().tt && ttCell(n, wd, lastP(wd))); }
function dutyOptsWd(wd) { const p7 = [], here = [], none = [], A = admSplit(ttNames()); A.rest.forEach(n => { if (has7(n, wd)) p7.push(n); else if (ttDayLoad(n, wd)) here.push(n); else none.push(n); });
  return [{ label: `🏢 الهيئة الإدارية (${A.adm.length})`, items: A.adm }, { label: `⑦ لديهم ${lastLbl(wd)} يوم ${TT_DAYS[wd]} (${p7.length})`, items: p7 }, { label: 'متواجدون ذلك اليوم', items: here }, { label: 'ليس لديهم حصص ذلك اليوم', items: none }]; }
function autoWeek() {
  if (!D().tt) return -1; const [a, b] = statRange('t'), wkCount = {}; let filled = 0;
  for (let wd = 0; wd < 5; wd++) { const t = weekTpl(wd); t.duty.forEach(r => { if (r.n) wkCount[normName(r.n)] = (wkCount[normName(r.n)] || 0) + 1; }); }
  for (let wd = 0; wd < 5; wd++) { const t = weekTpl(wd), used = new Set(t.duty.filter(r => r.n).map(r => normName(r.n)));
    const pool = ttNames().filter(n => has7(n, wd) && !used.has(normName(n))).sort((x, y) => (wkCount[normName(x)] || 0) - (wkCount[normName(y)] || 0) || dutyCount(x, a, b) - dutyCount(y, a, b) || AR.compare(normName(x), normName(y)));
    t.duty.forEach(r => { if (!r.n && pool.length) { r.n = pool.shift(); wkCount[normName(r.n)] = (wkCount[normName(r.n)] || 0) + 1; used.add(normName(r.n)); filled++; } }); }
  return filled;
}
function vWeekDuty() {
  const n = D().cfg.dutyRows || 3;
  const rows = [0, 1, 2, 3, 4].map(wd => { const t = weekTpl(wd), opt = dutyOptsWd(wd);
    return `<tr><td><b>${TT_DAYS[wd]}</b></td>${t.duty.slice(0, Math.max(n, t.duty.length)).map((r, j) => `<td>${pickSel(`daily.week.${wd}.duty.${j}.n`, r.n || '', opt, { ph: '— اختر —' })}${r.n && D().tt && !isAdm(r.n) && !has7(r.n, wd) ? `<span class="cf">⚠ ليس لديه الحصة الأخيرة</span>` : ''}</td>`).join('')}</tr>`; }).join('');
  return `<section class="card wkduty"><h2>جدول المناوبة الأسبوعي الثابت</h2>
    <div class="acts wrap"><button class="btn pri" data-act="dWeekAuto" type="button">⑦ توزيع عادل على أيام الأسبوع</button><button class="btn ghost" data-act="dWeekClr" type="button">مسح الجدول</button></div>
    <div class="tw"><table class="et wkt"><tr><th style="width:80px">اليوم</th>${Array.from({ length: n }, (_, j) => `<th>المناوب ${j + 1}</th>`).join('')}</tr>${rows}</table></div></section>`;
}
function dutyRep(iso, j) {
  const u = D().duty[iso] = U(iso), d = wdOf(iso), abs = dutyAway(iso), [a, b] = statRange('t');
  const used = new Set(); (u.b || []).forEach(x => { if (x.gen) used.add(normName(x.gen)); (x.rows || []).forEach(r => r.n && used.add(normName(r.n))); }); u.duty.forEach(r => r.n && used.add(normName(r.n)));
  const c = ttNames().filter(n => has7(n, d) && !abs.has(normName(n)) && !used.has(normName(n))).sort((x, y) => dutyCount(x, a, b) - dutyCount(y, a, b) || AR.compare(normName(x), normName(y)))[0];
  if (!c) return ''; const old = u.duty[j].n; u.duty[j].n = c; u.duty[j].note = old ? `بدلاً عن ${old}` : ''; return c;
}
function dutyIssue(iso, name, where) {
  if (!name) return ''; const k = normName(name);
  if (absentSet(iso).has(k)) return 'غائب اليوم';
  if (where === 'd' && dutyAway(iso).has(k)) return 'يستأذن قبل نهاية اليوم';
  const u = U(iso); let c = 0; u.b.forEach(b => { if (normName(b.gen) === k) c++; b.rows.forEach(r => { if (normName(r.n) === k) c++; }); });
  if (where === 'b' && c > 1) return 'مكلف بأكثر من موقع إشراف';
  const d = wdOf(iso); if (d >= 0 && D().tt && ttRow(name) && !isAdm(name) && !ttDayLoad(name, d)) return 'ليس لديه حصص اليوم';
  return '';
}
function dutyAway(iso) { const d = wdOf(iso), s = absentSet(iso); if (d >= 0) outAt(iso, lastP(d)).forEach(k => s.add(k)); return s; }
function dutyOpts(iso) {
  const d = wdOf(iso), abs = dutyAway(iso), A = admSplit(ttNames(), abs); const p7 = [], here = [], none = [], away = [];
  A.rest.forEach(n => { const k = normName(n); if (abs.has(k)) away.push(n); else if (d >= 0 && D().tt && has7(n, d)) p7.push(n); else if (d < 0 || !D().tt || ttDayLoad(n, d)) here.push(n); else none.push(n); });
  const g = [];
  if (A.adm.length) g.push({ label: `🏢 الهيئة الإدارية (${A.adm.length})`, items: A.adm });
  if (p7.length) g.push({ label: `⑦ لديهم ${lastLbl(d)} اليوم — الأولى بالمناوبة (${p7.length})`, items: p7 });
  g.push({ label: `✓ متواجدون اليوم حسب الجدول (${here.length})`, items: here }, { label: 'ليس لديهم حصص اليوم', items: none }, { label: '✕ غائبون اليوم', items: away });
  return g;
}
function dutyCount(name, a, b) { let n = 0; const k = normName(name); Object.entries(D().duty).forEach(([iso, u]) => { if (iso < a || iso > b) return; (u.duty || []).forEach(r => { if (r.n && normName(r.n) === k) n++; }); }); return n; }
function autoDuty(iso) {
  const d = wdOf(iso); if (d < 0 || !D().tt) return -1; const u = D().duty[iso] = U(iso), abs = dutyAway(iso);
  const used = new Set(); (u.b || []).forEach(x => { if (x.gen) used.add(normName(x.gen)); (x.rows || []).forEach(r => r.n && used.add(normName(r.n))); }); (u.duty || []).forEach(r => r.n && used.add(normName(r.n)));
  const [a, b] = statRange('t');
  const cand = ttNames().filter(n => has7(n, d) && !abs.has(normName(n)) && !used.has(normName(n))).sort((x, y) => dutyCount(x, a, b) - dutyCount(y, a, b) || AR.compare(normName(x), normName(y)));
  let k = 0; u.duty.forEach(r => { if (!r.n && cand[k]) { r.n = cand[k++]; } }); return k;
}

/* ---------- الصفحة ---------- */
function vDaily() {
  const iso = dIso(), d = wdOf(iso), tt = D().tt; ensureLeaves(iso);
  const bar = `<section class="card dbar"><div class="dnav"><button class="btn sm" data-act="dDay" data-v="-1" type="button" aria-label="اليوم السابق">→</button>
    <label class="ddate"><input type="date" class="in" id="dDate" value="${iso}"><b>${dayAr(iso)}</b><span>${hijriOf(iso)} هـ${(() => { const w = termWeek(iso); return w ? ' · ' + esc(w.txt) : ''; })()}</span></label>
    <button class="btn sm" data-act="dDay" data-v="1" type="button" aria-label="اليوم التالي">←</button>${iso !== todayIso() ? '<button class="btn sm pri" data-act="dDay" data-v="0" type="button">اليوم</button>' : '<em class="tdy now">اليوم</em>'}</div>
    ${d < 0 ? '<p class="al warn">هذا اليوم عطلة نهاية الأسبوع.</p>' : holOf(iso) ? `<p class="al warn">هذا اليوم إجازة رسمية: <b>${esc(holOf(iso))}</b> — لا انتظار ولا مناوبة. <button class="btn sm" data-act="dDay" data-v="1" type="button">أقرب يوم دراسي ←</button></p>` : ''}${tt ? '' : `<p class="al warn">لم يُرفع الجدول المدرسي العام بعد — ارفعه من «الملفات الأساسية» لتظهر الحصص والمتاحون تلقائياً. <button class="btn sm" data-tab="files" type="button">رفع الجدول</button></p>`}
    <div class="dtabs" role="tablist">${[['wait', 'حصص الانتظار'], ['duty', 'الإشراف والمناوبة'], ['tt', 'الجدول المدرسي'], ['log', 'السجل والإحصاء']].map(([k, t]) => `<button type="button" role="tab" class="${DAILY_TAB === k ? 'on' : ''}" data-act="dTab" data-v="${k}" aria-selected="${DAILY_TAB === k}">${t}</button>`).join('')}</div></section>`;
  return bar + ({ wait: vWait, duty: vDuty, tt: vTT, log: vLog })[DAILY_TAB](iso);
}
/* ---------- الغياب لعدة أيام ---------- */
function leaves() { const d = D(); d.leaves = d.leaves || []; return d.leaves; }
function schoolDaysBetween(a, b) { const out = []; for (let d = a; d <= b && out.length < 120; d = addDays(d, 1)) if (isSchoolDay(d)) out.push(d); return out; }
function nthSchoolDay(a, n) { let d = a, k = isSchoolDay(a) ? 1 : 0; while (k < n) { d = addDays(d, 1); if (isSchoolDay(d)) k++; } return d; }
function prevSchoolDay(iso) { let d = iso, k = 0; do { d = addDays(d, -1); } while (!isSchoolDay(d) && ++k < 60); return d; }
function leaveOf(iso, name) { const k = normName(name); return leaves().find(l => normName(l.n) === k && iso >= l.a && iso <= l.b); }
function ensureLeaves(iso) {
  if (!isSchoolDay(iso)) return; let ch = false;
  leaves().forEach(l => { if (iso < l.a || iso > l.b) return; const w = W(iso); if (!w.blocks.some(b => normName(b.abs) === normName(l.n))) { w.blocks.push({ abs: l.n, leave: l.id, rows: {} }); ch = true; } });
  if (ch) save();
}
function endLeave(l, iso) {
  l.b = prevSchoolDay(iso); Object.entries(D().wait).forEach(([k, w]) => { if (k >= iso) w.blocks = (w.blocks || []).filter(b => !(b.leave === l.id || (normName(b.abs) === normName(l.n) && b.leave))); });
  if (l.b < l.a) D().leaves = leaves().filter(x => x !== l);
}
/* ---------- لوحة «من غاب اليوم؟» ---------- */
var ABSG_OPEN = true, ABS_MODE = 'full';
function mainGrade(n) { const r = ttRow(n); if (!r) return 0; const c = { 1: 0, 2: 0, 3: 0 }; Object.values(r.c).forEach(v => String(v).split(/[^0-9]+/).filter(Boolean).forEach(x => { const g = secGrade(x); if (g) c[g]++; })); const g = [1, 2, 3].sort((a, b) => c[b] - c[a])[0]; return c[g] ? g : 0; }
function absGrid(iso) {
  const d = wdOf(iso); if (!tt0()) return `<div class="acts wrap">${pickSel(`daily.ui.addAbs`, '', [{ items: ttNames().filter(n => !absentSet(iso).has(normName(n))) }], { ph: '+ إضافة معلم غائب' })}</div>`;
  const abs = absentSet(iso), names = ttNames().slice().sort((a, b) => AR.compare(normName(a), normName(b)));
  const grp = { 1: [], 2: [], 3: [], 0: [] }; names.forEach(n => grp[mainGrade(n)].push(n));
  const chip = n => { const pt = partOf(iso, n), on = abs.has(normName(n)) || !!pt, c = d >= 0 ? ttDayLoad(n, d) : 0, lv = leaveOf(iso, n);
    return `<button type="button" class="achip${on ? ' on' : ''}${pt ? ' part' : ''}${c ? '' : ' zero'}" data-act="wAbs" data-n="${esc(n)}" aria-pressed="${on}">${lv ? '🕘 ' : pt ? '⏱ ' : ''}${esc(n)}<i>${c}</i></button>`; };
  const bl0 = (D().wait[iso] || { blocks: [] }).blocks, nAbs = bl0.length, nPart = bl0.filter(x => x.part).length;
  return `<details class="absg"${ABSG_OPEN || !nAbs ? ' open' : ''} ontoggle="ABSG_OPEN=this.open"><summary><b>من غاب اليوم؟</b> <span>${nAbs ? `${nAbs - nPart ? (nAbs - nPart) + ' غائب' : ''}${nAbs - nPart && nPart ? ' · ' : ''}${nPart ? nPart + ' مستأذن/متأخر' : ''}` : 'المس الاسم'}</span><button type="button" class="hlp" data-help="المس اسم الغائب فتظهر حصصه لهذا اليوم، والمسه ثانية للإلغاء. الرقم = حصصه اليوم." aria-label="شرح">؟</button></summary>

    <div class="amode" role="radiogroup"><span>عند لمس الاسم:</span>${[['full', 'غائب اليوم'], ['out', '⏱ استأذن / خرج مبكراً'], ['late', '⏰ تأخر']].map(([k, t]) => `<button type="button" role="radio" aria-checked="${ABS_MODE === k}" class="${ABS_MODE === k ? 'on' : ''}" data-act="absMode" data-v="${k}">${t}</button>`).join('')}</div>
    ${[1, 2, 3, 0].filter(g => grp[g].length).map(g => `<div class="agrp g${g}"><small class="wgl g${g}">${g ? 'معلمو ' + GSHORT[g] + ' ثانوي' : 'آخرون'}</small><div class="wchips">${grp[g].map(chip).join('')}</div></div>`).join('')}</details>`;
}
var NOW_P = 0, NOW_OPEN = false, RULE_OPEN = false;
function guessP(iso) { if (iso !== todayIso()) return 3; const d = wdOf(iso); return Math.max(1, Math.min(d >= 0 ? lastP(d) : 7, curP())); }
/* نداء سريع: من خرج الآن؟ */
function nowOutPanel(iso) {
  const d = wdOf(iso); if (d < 0 || !tt0()) return ''; if (!NOW_P) NOW_P = guessP(iso); const p = NOW_P, L = lastP(d);
  const full = absentSet(iso), names = ttNames().filter(n => !full.has(normName(n))).sort((a, b) => AR.compare(normName(a), normName(b)));
  const out = outAt(iso, p), grp = { 1: [], 2: [], 3: [], 0: [] }; names.forEach(n => grp[mainGrade(n)].push(n));
  const nOut = names.filter(n => out.has(normName(n))).length;
  const chip = n => { const k = normName(n), o = out.has(k), r = !!exitR()[k] && ruleOut(n, d, p), lc = lastC(n, d), dn = lc < p;
    return `<button type="button" class="achip nchip${o ? ' on part' : ''}${dn && !o ? ' dn' : ''}" data-act="${r ? 'nRule' : 'nOut'}" data-n="${esc(n)}" aria-pressed="${o}" title="${lc ? 'آخر حصة له: ' + lc : 'لا حصص له اليوم'}">${r ? '🚪 ' : o ? '⏱ ' : ''}${esc(n)}<i>${dn ? '🏁' + lc : lc}</i></button>`; };
  return `<details class="nowout"${NOW_OPEN ? ' open' : ''} ontoggle="NOW_OPEN=this.open"><summary><b>🚶 من خرج الآن؟</b> <span>${nOut ? `${nOut} خارج المدرسة في الحصة ${p}` : iso === todayIso() && curP() <= 7 ? `الآن: الحصة ${curP()} (${esc(pTimeAny(curP()))})` : 'نداء سريع أثناء اليوم'}</span></summary>
    <div class="prow"><span>الحصة الآن</span><div class="wchips">${Array.from({ length: L }, (_, i) => `<button type="button" class="wchip pch tm${p === i + 1 ? ' on' : ''}" data-act="nP" data-p="${i + 1}" title="${esc(pTimeAny(i + 1))}">${i + 1}<small>${t12(bellNow()[23][i][0])}</small></button>`).join('')}</div></div>
    <small class="hint">المس من خرج قبل الحصة ${p} (استأذن أو انصرف) — يُستبعد منها وما بعدها، وتُسدَّد حصصه المتبقية ويُعاد توزيع انتظاره. 🏁 = أنهى حصصه، والرقم = آخر حصة له. المسه ثانية للتراجع.</small>
    ${[1, 2, 3, 0].filter(g => grp[g].length).map(g => `<div class="agrp g${g}"><small class="wgl g${g}">${g ? 'معلمو ' + GSHORT[g] + ' ثانوي' : 'آخرون'}</small><div class="wchips">${grp[g].map(chip).join('')}</div></div>`).join('')}
    ${nOut ? `<div class="acts"><button class="btn sm ghost" data-act="nClr" type="button">↺ إلغاء خروج الحصة ${p}</button></div>` : ''}</details>`;
}
/* قواعد الخروج الدائمة */
function rulesPanel(iso) {
  if (!tt0()) return ''; const R = Object.values(exitR()).sort((a, b) => AR.compare(normName(a.n), normName(b.n))), d = wdOf(iso);
  const row = r => `<div class="rrow"><b>🚪 ${esc(r.n)}</b><div class="rdays">${TT_DAYS.map((t, i) => { const on = !r.days || !r.days.length || r.days.includes(i); return `<button type="button" class="rday${on ? ' on' : ''}" data-act="rDay" data-n="${esc(r.n)}" data-v="${i}" aria-pressed="${on}">${t.replace(/^ال/, '')}</button>`; }).join('')}</div><small class="mut">${d >= 0 ? (lastC(r.n, d) ? `اليوم يخرج بعد الحصة ${lastC(r.n, d)}` : 'لا حصص له اليوم') : ''}</small><button type="button" class="x" data-act="rDel" data-n="${esc(r.n)}" aria-label="حذف القاعدة">✕</button></div>`;
  return `<details class="rules"${RULE_OPEN ? ' open' : ''} ontoggle="RULE_OPEN=this.open"><summary><b>🚪 خروج دائم بعد آخر حصة</b> <span>${R.length ? `${R.length} معلم` : 'قاعدة تُضبط مرة واحدة'}</span></summary>
    <small class="hint">لمن لديه خروج معتمد أو يغادر عادةً بعد آخر حصة له: يُستبعد تلقائياً كل يوم من الانتظار والمناوبة بعد آخر حصة له، دون أي لمسة. حدّد الأيام أو اتركها كلها.</small>
    ${R.map(row).join('')}
    <div class="admadd"><input class="in" id="rIn" list="rDl" placeholder="اسم المعلم" onkeydown="if(event.key==='Enter'){event.preventDefault();this.nextElementSibling.click()}"><button class="btn sm pri" data-act="rAdd" type="button">+ إضافة</button><datalist id="rDl">${ttNames().filter(n => !exitR()[normName(n)]).map(n => `<option value="${esc(n)}">`).join('')}</datalist></div></details>`;
}
function partCtl(iso, b, bi) {
  if (b.leave) return ''; const d = wdOf(iso), L = d >= 0 ? lastP(d) : 7, P = b.part, has = p => d >= 0 && ttCell(b.abs, d, p);
  const pc = (act, p, on, t) => `<button type="button" class="wchip pch${on ? ' on' : ''}${has(p) ? ' cl' : ''}" data-act="${act}" data-bi="${bi}" data-p="${p}" title="${has(p) ? 'لديه حصة' : 'بلا حصة'}">${t}</button>`;
  const open = !!P || !!b.pend;
  return `<details class="pctl"${open ? ' open' : ''}><summary>${P ? `<b class="ptag">⏱ ${esc(partLbl(b, L))}</b>` : '⏱ استأذن أو خرج مبكراً أو تأخر؟'}</summary>
    <div class="prow${b.pend === 'out' ? ' hot' : ''}"><span>خرج بعد الحصة</span><div class="wchips">${Array.from({ length: L - 1 }, (_, i) => pc('wOut', i + 1, P && P.b === i + 1, i + 1)).join('')}</div></div>
    <div class="prow${b.pend === 'late' ? ' hot' : ''}"><span>حضر من الحصة</span><div class="wchips">${Array.from({ length: L - 1 }, (_, i) => pc('wLate', i + 2, P && P.a === i + 2, i + 2)).join('')}</div></div>
    ${P ? `<div class="acts"><button class="btn sm ghost" data-act="wFull" data-bi="${bi}" type="button">غائب طوال اليوم</button></div>` : ''}<small class="hint">الحصة المظللة = لديه فيها حصة. تُسدَّد حصصه في غير وقت وجوده فقط، ويُستبعد من الانتظار والمناوبة بعد خروجه.</small></details>`;
}
function leaveCtl(iso, b, bi) {
  const l = b.leave && leaves().find(x => x.id === b.leave) || leaveOf(iso, b.abs);
  if (l) { const days = schoolDaysBetween(l.a, l.b), k = days.indexOf(iso) + 1; return `<div class="lvbar"><span>🕘 غائب حتى <b>${dayAr(l.b)} ${hijriOf(l.b)}</b> — اليوم ${k} من ${days.length}</span><button class="btn sm ghost" data-act="wBack" data-bi="${bi}" type="button">عاد اليوم</button><button class="btn sm ghost" data-act="wLvOpen" data-bi="${bi}" type="button">تعديل المدة</button></div>`; }
  return `<div class="lvbar"><button class="btn sm ghost" data-act="wLvOpen" data-bi="${bi}" type="button">🕘 غائب لعدة أيام؟</button></div>`;
}
function leaveForm(iso, bi) {
  return `<div class="lvform" id="lvf${bi}"><b>مدة الغياب ابتداءً من اليوم:</b><div class="wchips">${[[2, 'يومان'], [3, '3 أيام'], [4, '4 أيام'], [5, 'أسبوع دراسي'], [10, 'أسبوعان']].map(([n, t]) => `<button type="button" class="wchip" data-act="wLv" data-bi="${bi}" data-n="${n}">${t}</button>`).join('')}</div>
    <label class="inl">أو حتى تاريخ <input type="date" class="in" data-lvdate="${bi}" min="${iso}"></label><small class="hint">تُتخطى نهاية الأسبوع والإجازات الرسمية تلقائياً.</small></div>`;
}
/* ===== لوحة الانتظار حسب الحصة: قائمة نظيفة + ورقة اختيار منبثقة ===== */
var WSHEET = null, WSET = -1;
function wHint(v) { try { if (v) localStorage.setItem('balat-exams-v1-whint', '1'); return localStorage.getItem('balat-exams-v1-whint') === '1'; } catch (e) { return !!v; } }
function wView() { const c = D().cfg; if (!c.wv2) { c.wview = 'p'; c.wv2 = 1; } return c.wview || 'p'; }
/* ترتيب التسديد: غائب بعد غائب، وحصصه بالترتيب */
/* صف الغائب اليوم = الصف الغالب على حصصه التي تحتاج تسديداً */
function absGrade(iso, b) { const d = wdOf(iso), c = { 1: 0, 2: 0, 3: 0 }; if (d >= 0 && b.abs) for (let p = 1; p <= 7; p++) if (ttCell(b.abs, d, p) && blkNeeds(b, p)) { const g = secGrade(ttSecs(b.abs, d, p)[0]); if (g) c[g]++; }
  const g = [1, 2, 3].sort((x, y) => c[y] - c[x] || x - y)[0]; return c[g] ? g : (mainGrade(b.abs) || 9); }
/* ترتيب الغائبين: أول ثانوي ثم ثاني ثم ثالث، وبترتيب التسجيل داخل كل صف */
function absOrder(iso) { const w = D().wait[iso] || { blocks: [] }; return w.blocks.map((b, bi) => ({ b, bi, g: absGrade(iso, b) })).sort((x, y) => x.g - y.g || x.bi - y.bi); }
function wSlots(iso) { const d = wdOf(iso), out = [];
  absOrder(iso).forEach(({ b, bi }) => { for (let p = 1; p <= 7; p++) if (b.abs && d >= 0 && ttCell(b.abs, d, p) && blkNeeds(b, p)) out.push({ p, bi, b }); }); return out; }
const slotT = x => ((x.b.rows || {})[x.p] || {}).t;
function nextEmpty(iso, after) { const S2 = wSlots(iso), i = after ? S2.findIndex(x => x.p === after.p && x.bi === after.bi) : -1;
  return S2.slice(i + 1).concat(S2.slice(0, Math.max(0, i))).find(x => !slotT(x)) || null; }
const GCL = { 1: 'أول', 2: 'ثاني', 3: 'ثالث' };
function wBoard(iso) {
  const w = D().wait[iso], d = wdOf(iso), L = d >= 0 ? lastP(d) : 7, slots = wSlots(iso), done = slots.filter(slotT).length, cnt = waitLoad(iso), dbl = Object.values(cnt).filter(v => v > 1).length;
  const ord = absOrder(iso); let lastG = -1;
  const cards = ord.map(({ b, bi, g: ag }) => { const sec = ag !== lastG ? `<h3 class="wgh g${ag}">${GNAME[ag] || 'أخرى'}</h3>` : ''; lastG = ag; const my = slots.filter(x => x.bi === bi), md = my.filter(slotT).length, lv = leaveOf(iso, b.abs);
    const head = `<header><button type="button" class="wcn" data-act="wSetOpen" data-v="${bi}"><b>${b.part ? '⏱ ' : lv ? '🕘 ' : ''}${esc(b.abs)}</b><small>${b.part ? esc(partLbl(b, L)) : lv ? 'غياب لعدة أيام' : 'غائب اليوم'} · ⚙</small></button><i class="${my.length && md === my.length ? 'ok' : ''}">${my.length ? (md === my.length ? '✓ ' : '') + md + '/' + my.length : '—'}</i></header>`;
    const set = WSET === bi ? `<div class="wsetp"><div class="acts wrap" style="margin:0 0 6px"><span class="sp1"></span><button class="btn sm ghost" data-act="wDel" data-v="${bi}" type="button">حذف من الغياب</button><button class="btn sm ghost" data-act="wSetOpen" data-v="-1" type="button">إغلاق</button></div>${partCtl(iso, b, bi)}${b.part ? '' : leaveCtl(iso, b, bi)}</div>` : '';
    const rows = my.map(x => { const r = (b.rows || {})[x.p] || {}, sc = ttSecs(b.abs, d, x.p), g = secGrade(sc[0]), iss = subIssue(iso, bi, x.p, r.t), now = iso === todayIso() && curP() === x.p;
      return `<button type="button" class="wslot g${g}${r.t ? ' ok' : ''}${iss ? ' bad' : ''}${now ? ' now' : ''}" data-act="wOpen" data-bi="${bi}" data-p="${x.p}"><span class="pp"><b>${x.p}</b><small>${t12(((bellNow()[g === 1 ? 1 : 23] || [])[x.p - 1] || [])[0])}</small></span><span class="gp">${GCL[g] || ''} <b>${esc(sc.join('، '))}</b></span><span class="tn">${r.t ? `${iss ? '⚠' : '✓'} ${esc(r.t)}${(cnt[normName(r.t)] || 0) > 1 ? `<i class="dbl" title="عليه ${cnt[normName(r.t)]} انتظارات اليوم">×${cnt[normName(r.t)]}</i>` : ''}` : 'اختر ←'}</span>${now ? '<em class="nowtag">الآن</em>' : ''}</button>`; }).join('');
    const full = my.length && md === my.length;
    if (full && WEXP !== bi && WSET !== bi) return sec + `<article class="wcard g${ag} full fold">${head}<button type="button" class="wfold" data-act="wExp" data-v="${bi}">${my.map(x => `<span class="g${secGrade(ttSecs(b.abs, d, x.p)[0])}"><b>ح${x.p}</b> ${esc(slotT(x))}${(cnt[normName(slotT(x))] || 0) > 1 ? `<i class="dbl">×${cnt[normName(slotT(x))]}</i>` : ''}</span>`).join('')}<em>تعديل</em></button></article>`;
    return sec + `<article class="wcard g${ag}${full ? ' full' : ''}">${head}${set}${rows || '<p class="hint" style="margin:6px 4px">لا حصص تحتاج تسديداً.</p>'}</article>`; }).join('');
  const pct = slots.length ? Math.round(done * 100 / slots.length) : 0;
  return `<div class="wprog"><div class="bar"><i style="width:${pct}%"></i></div><span><b>${done}</b> من <b>${slots.length}</b> حصة مسددة${slots.length - done ? ` · <em class="left">باقي ${slots.length - done}</em>` : ''}</span>${slots.length - done ? `<button class="btn sm pri" data-act="wOpenNext" type="button">▶ ابدأ التسديد</button><button class="btn sm" data-act="wAuto" type="button">⚡ وزّع الباقي تلقائياً</button>` : '<em class="okt">✓ اكتمل التسديد</em>'}</div>
    <div class="wopt"><button type="button" class="wtog${oneWait() ? ' on' : ''}" data-act="wOne" aria-pressed="${oneWait()}"><i></i>انتظار واحد لكل معلم في اليوم</button>${dbl ? `<span class="dblw">⚠ ${dbl} ${dbl > 1 ? 'معلمين عليهم' : 'معلم عليه'} أكثر من انتظار (×2)</span>` : ''}</div>
    <div class="wcards">${cards}</div>${WSHEET ? wSheet(iso) : ''}`;
}
var WMORE = false, WEXP = -1;
function wSheet(iso) {
  const { bi, p } = WSHEET, w = D().wait[iso], b = w && w.blocks[bi]; if (!b) { WSHEET = null; return ''; }
  const d = wdOf(iso), r = (b.rows || {})[p] || {}, sc = ttSecs(b.abs, d, p), g = secGrade(sc[0]), R = waitRank(iso, b, p);
  const free = subOptsFor(iso, bi, p)[0].items, all0 = free.filter(n => !R.info(n).done).sort(R.cmp), live = all0.filter(n => !R.info(n).had), had = all0.filter(n => R.info(n).had), dn = free.filter(n => R.info(n).done).sort((x, y) => (R.info(y).lc - R.info(x).lc) || R.cmp(x, y));
  const free2 = new Set(free.map(normName)), others = ttNames().filter(n => !free2.has(normName(n)) && normName(n) !== normName(b.abs)).sort((a, c) => AR.compare(normName(a), normName(c)));
  const row = (n, i, kind) => { const f = R.info(n), why = kind === 'x' ? (subIssue(iso, bi, p, n) || '') : [f.ss ? '◆ يدرّس الشعبة' : f.sg ? 'يدرّس الصف' : '', `${f.busy} حصص اليوم`, f.term ? `${f.term} انتظار بالفصل` : '', f.hadP && f.hadP.length ? `↻ انتظر اليوم ح${f.hadP.join('، ح')}` : '', f.done ? (f.lc ? `🏁 آخر حصة ${f.lc}` : 'لا حصص اليوم') : ''].filter(Boolean).join(' · ');
    return `<div class="crow${kind === 'x' ? ' x' : ''}${kind === 'l' && i === 0 ? ' top' : ''}${r.t && normName(r.t) === normName(n) ? ' cur' : ''}" data-q="${esc(normName(n))}"><button type="button" class="cpick" data-act="wPick" data-n="${esc(n)}">${kind === 'l' && i === 0 ? '<i class="st">★ الأنسب</i>' : ''}<b>${esc(n)}</b><small>${esc(why)}</small></button>${kind === 'x' ? '' : `<button type="button" class="wlv" data-act="wQOut" data-p="${p}" data-n="${esc(n)}" title="خرج قبل هذه الحصة" aria-label="${esc(n)} خرج قبل الحصة">⏱</button>`}</div>`; };
  const my = wSlots(iso).filter(x => x.bi === bi), k = my.findIndex(x => x.p === p) + 1, left = wSlots(iso).filter(x => !slotT(x)).length, nx = nextEmpty(iso, WSHEET);
  const top = live.slice(0, 4), more = live.slice(4), AL = wSlots(iso), ci = AL.findIndex(x => x.bi === bi && x.p === p);
  let pbi = -1; const strip = `<div class="wstrip" role="tablist" aria-label="كل الحصص">${AL.map(x => { const sep = x.bi !== pbi && pbi !== -1 ? '<i class="sep"></i>' : ''; pbi = x.bi; const gg = secGrade(ttSecs(x.b.abs, d, x.p)[0]), on = x.bi === bi && x.p === p;
    return sep + `<button type="button" class="sd g${gg}${slotT(x) ? ' ok' : ''}${on ? ' cur' : ''}" data-act="wJump" data-bi="${x.bi}" data-p="${x.p}" title="${esc(x.b.abs)} · ح${x.p}${slotT(x) ? ' · ' + esc(slotT(x)) : ''}" aria-current="${on}">${x.p}</button>`; }).join('')}</div>`;
  return `<div class="wsh-bg" data-act="wClose"></div><div class="wsh g${g}" role="dialog" aria-label="اختيار المنتظر">
    <div class="wsh-h"><span class="gbadge g${g}">${GCL[g] || ''}</span><div><b>${esc(b.abs)}</b><small>الحصة ${p} <span dir="ltr">${esc(pTime(p, g))}</span> · ش ${esc(sc.join('، '))} · ${k} من ${my.length}</small></div><button type="button" class="x" data-act="wClose" aria-label="إغلاق">✕</button></div>${strip}
    <div class="wsh-b">${top.length ? top.map((n, i) => row(n, i, 'l')).join('') : '<p class="hint">لا يوجد متاح ممن لديهم حصص لاحقة.</p>'}
      ${more.length ? `<details class="cg"${WMORE ? ' open' : ''} ontoggle="WMORE=this.open"><summary>بقية المتاحين (${more.length})</summary>${more.map((n, i) => row(n, i + 4, 'm')).join('')}</details>` : ''}
      ${had.length ? `<details class="cg had"${top.length ? '' : ' open'}><summary>↻ سبق له انتظار اليوم — انتظار ثانٍ (${had.length})</summary>${had.map((n, i) => row(n, i, 'h')).join('')}</details>` : ''}
      ${dn.length ? `<details class="cg"${top.length || had.length ? '' : ' open'}><summary>🏁 أنهوا حصصهم — غالباً خرجوا (${dn.length})</summary>${dn.map((n, i) => row(n, i, 'd')).join('')}</details>` : ''}
      <details class="cg"><summary>🔎 بحث أو اسم غير متاح</summary><input class="in wsq" type="search" placeholder="اكتب جزءاً من الاسم…" oninput="const q=normName(this.value),bx=this.closest('details');bx.querySelectorAll('.crow').forEach(e=>e.hidden=!q||!e.dataset.q.includes(q))">${others.concat(live, had, dn).filter((n, i, A) => A.findIndex(z => normName(z) === normName(n)) === i).map((n, i) => row(n, i, others.includes(n) ? 'x' : 'm').replace('class="crow', 'hidden class="crow')).join('')}</details></div>
    <div class="wsh-f"><button class="btn sm" data-act="wNav" data-v="-1" type="button"${ci > 0 ? '' : ' disabled'}>→ السابق</button>${r.t ? `<button class="btn sm ghost" data-act="wPick" data-n="" type="button">مسح</button>` : ''}<span class="sp1"></span><small>${left ? `باقي ${left}` : 'اكتمل ✓'}</small><button class="btn sm" data-act="wNav" data-v="1" type="button"${ci < AL.length - 1 ? '' : ' disabled'}>التالي ←</button></div></div>`;
}
/* ===== الإرسال عبر واتساب ===== */
var WA = null;
function waText(iso, k) {
  const head = `*${k === 'duty' ? 'تقرير الإشراف والمناوبة' : 'استمارة حصص الانتظار'}*\n${dayAr(iso)} ${hijriOf(iso)} هـ\n${S.s.school || ''}`.trim();
  if (k === 'duty') { const u = U(iso), cfg = D().cfg; const L = [head];
    cfg.b.forEach((b, i) => { const x = u.b[i]; if (!x) return; L.push(`\n*${b.t}* (${b.g})`); if (x.gen) L.push(`المشرف العام: ${x.gen}`); x.rows.forEach(r => r.n && L.push(`• ${r.loc}: ${r.n}`)); });
    const du = u.duty.filter(r => r.n); if (du.length) L.push(`\n*المناوبة*`, ...du.map(r => `• ${r.n}`)); return L.join('\n'); }
  const rows = waitRows(iso), DOT = { 1: '🟢', 2: '🟡', 3: '🟠', 0: '⚪' }, L = [head];
  [1, 2, 3, 0].forEach(g => { const R = rows.filter(r => r.g === g); if (!R.length) return; L.push(`\n${DOT[g]} *${g ? GNAME[g] : 'حصص أخرى'}*`); R.forEach(r => L.push(`ح${r.p} · ش ${r.sec} · بدل ${r.abs} ← ${r.t ? '*' + r.t + '*' : '— لم يُحدد'}`)); });
  if (!rows.length) L.push('\nلا يوجد غائبون مسجلون.'); return L.join('\n');
}
function waNum(v) { let n = toWestern(String(v || '')).replace(/[^\d]/g, ''); if (!n) return ''; if (n.startsWith('00')) n = n.slice(2); if (n.startsWith('05')) n = '966' + n.slice(1); else if (n.startsWith('5') && n.length === 9) n = '966' + n; return n; }
function waNums() { const c = D().cfg; c.waN = Array.isArray(c.waN) ? c.waN : []; return c.waN; }
function waSheet(iso) {
  if (!WA) return ''; const k = WA, canFile = !!(navigator.canShare && window.File && (() => { try { return navigator.canShare({ files: [new File(['x'], 'a.pdf', { type: 'application/pdf' })] }); } catch (e) { return false; } })());
  const favs = waNums();
  return `<div class="wsh-bg" data-act="waClose"></div><div class="wsh wash" role="dialog" aria-label="إرسال واتساب"><div class="wsh-h"><span class="gbadge" style="background:#25d366">📲</span><div><b>إرسال ${k === 'duty' ? 'تقرير المناوبة' : 'استمارة الانتظار'} عبر واتساب</b><small>${dayAr(iso)} ${hijriOf(iso)} هـ</small></div><button type="button" class="x" data-act="waClose" aria-label="إغلاق">✕</button></div>
    <div class="wsh-b">
      <button type="button" class="waopt" data-act="waPdf"><b>📄 الاستمارة PDF</b><small>${canFile ? 'تفتح قائمة المشاركة — اختر واتساب ثم أي شخص أو مجموعة' : 'يُنزَّل الملف ثم يُفتح واتساب لترفقه'}</small></button>
      <button type="button" class="waopt" data-act="waTxt" data-n=""><b>💬 رسالة نصية مرتبة</b><small>يفتح واتساب لتختار أي شخص أو مجموعة</small></button>
      <div class="wanum"><input class="in" id="waIn" inputmode="tel" placeholder="أو اكتب رقم جوال محدد"><button class="btn sm pri" data-act="waTxt" data-n="__in" type="button">إرسال</button></div>
      ${favs.length ? `<div class="wafav"><small>أرقام سابقة:</small>${favs.map(f => `<span><button type="button" class="wchip" data-act="waTxt" data-n="${esc(f.n)}">${esc(f.l || f.n)}</button><button type="button" class="x" data-act="waDelN" data-n="${esc(f.n)}" aria-label="حذف">✕</button></span>`).join('')}</div>` : ''}
      <details class="cg"><summary>معاينة نص الرسالة</summary><pre class="wapre">${esc(waText(iso, k))}</pre></details></div></div>`;
}
/* تنبيه قبل الاعتماد: حصص بلا منتظر أو تعارض أو انتظار مكرر */
async function waitGate(iso) {
  if (!tt0()) return true; const em = wSlots(iso).filter(x => !slotT(x)), bad = wSlots(iso).filter(x => slotT(x) && subIssue(iso, x.bi, x.p, slotT(x))), dbl = Object.entries(waitLoad(iso)).filter(([k, v]) => v > 1);
  if (!em.length && !bad.length && !(oneWait() && dbl.length)) return true;
  const L = [];
  if (em.length) L.push(`⏳ ${em.length === 1 ? 'حصة واحدة' : em.length === 2 ? 'حصتان' : em.length + (em.length <= 10 ? ' حصص' : ' حصة')} بلا منتظر:\n` + em.slice(0, 6).map(x => `• ح${x.p} ش ${ttSecs(x.b.abs, wdOf(iso), x.p).join('، ')} — بدل ${x.b.abs}`).join('\n') + (em.length > 6 ? `\n• و${em.length - 6} غيرها` : ''));
  if (bad.length) L.push(`⚠ ${bad.length} تعارض:\n` + bad.slice(0, 4).map(x => `• ح${x.p} ${slotT(x)} — ${subIssue(iso, x.bi, x.p, slotT(x))}`).join('\n'));
  if (oneWait() && dbl.length) L.push(`×2 ${dbl.length} ${dbl.length > 1 ? 'معلمين عليهم' : 'معلم عليه'} أكثر من انتظار.`);
  const go = await choiceBox('قبل الاعتماد:\n\n' + L.join('\n\n'), em.length || bad.length ? '▶ أكمل التسديد' : 'مراجعة', 'متابعة على أي حال');
  if (go) { const t = em[0] || bad[0]; if (wView() !== 'p') D().cfg.wview = 'p'; WA = null; WSHEET = t ? { bi: t.bi, p: t.p } : null; render(); return false; }
  return true;
}
function vWait(iso) {
  const w = D().wait[iso] || { blocks: [] }, d = wdOf(iso);
  const board = wView() === 'p' && tt0() && w.blocks.length && d >= 0;
  const blocks = board ? '' : w.blocks.map((b, bi) => {
    const rows = []; for (let p = 1; p <= 7; p++) {
      const sc = d >= 0 ? ttSecs(b.abs, d, p) : [], r = (b.rows || {})[p] || {};
      if (!blkNeeds(b, p)) { rows.push(`<tr class="nocls here"><td class="pn">${p}<small class="ptm">${pTime(p, rowGrade(iso, b, p))}</small></td><td colspan="4"><span class="hint">✓ حاضر${sc.length ? ` — يدرّس حصته (ش ${sc.join('، ')})` : ''}</span></td></tr>`); continue; }
      const has = sc.length > 0 || !tt0(), iss = subIssue(iso, bi, p, r.t);
      const isNow = iso === todayIso() && curP() === p;
      rows.push(`<tr class="${has ? '' : 'nocls'}${iss ? ' bad' : ''}${isNow ? ' now' : ''}"><td class="pn">${p}<small class="ptm">${pTime(p, rowGrade(iso, b, p))}</small>${isNow ? '<em class="nowtag">الآن</em>' : ''}</td><td>${sc.length ? [...new Set(sc.map(s => GSHORT[secGrade(s)] || ''))].join('/') : (has ? inp(`daily.wait.${iso}.blocks.${bi}.rows.${p}.g`, r.g || '', { ph: 'الفصل' }) : '—')}</td><td>${sc.length ? sc.join('، ') : (has ? inp(`daily.wait.${iso}.blocks.${bi}.rows.${p}.s`, r.s || '', { ph: 'الشعبة' }) : '')}</td>
        <td>${has ? waitChips(iso, bi, p, r) + (iss ? `<span class="cf">⚠ ${esc(iss)}</span>` : '') : '<span class="hint">لا حصة</span>'}</td>
        <td>${has ? inp(`daily.wait.${iso}.blocks.${bi}.rows.${p}.note`, r.note || '', { ph: 'ما تم تنفيذه' }) : ''}</td></tr>`);
    }
    const n = d >= 0 ? [1, 2, 3, 4, 5, 6, 7].filter(p => ttCell(b.abs, d, p) && blkNeeds(b, p)).length : 0;
    if (b.part && tt0() && !n && !b.pend) return `<article class="wblk wmini"><span>⏱ <b>${esc(b.abs)}</b> — ${esc(partLbl(b, d >= 0 ? lastP(d) : 7))} · لا حصص تحتاج تسديد</span><button class="btn sm ghost" data-act="wQUndo" data-n="${esc(b.abs)}" type="button">↺ تراجع</button><button class="btn sm ghost" data-act="wEdit" data-v="${bi}" type="button">تعديل</button></article>`;
    return `<article class="wblk"><header><span>${b.part ? (b.part.a > 1 && b.part.b >= (d >= 0 ? lastP(d) : 7) ? 'نظراً لتأخر الزميل:' : 'نظراً لاستئذان الزميل:') : 'نظراً لغياب الزميل:'}</span>${pickSel(`daily.wait.${iso}.blocks.${bi}.abs`, b.abs || '', [{ items: ttNames() }], { ph: '— اختر المعلم الغائب —' })}<small>${b.abs ? (tt0() ? `${n} حصص ${b.part ? 'تحتاج تسديد' : 'اليوم'}` : '') : ''}</small><button class="x" data-act="wDel" data-v="${bi}" type="button" aria-label="حذف">×</button></header>${b.abs ? partCtl(iso, b, bi) + (b.part ? '' : leaveCtl(iso, b, bi)) : ''}
      <div class="tw"><table class="et wtab"><tr><th style="width:52px">الحصة</th><th style="width:70px">الفصل</th><th style="width:80px">الشعبة</th><th>المعلم المنتظر</th><th>ما تم تنفيذه</th></tr>${rows.join('')}</table></div></article>`;
  }).join('');
  const issues = w.blocks.reduce((a, b, bi) => a + [1, 2, 3, 4, 5, 6, 7].filter(p => blkNeeds(b, p) && subIssue(iso, bi, p, ((b.rows || {})[p] || {}).t)).length, 0);
  const empty = w.blocks.reduce((a, b, bi) => a + [1, 2, 3, 4, 5, 6, 7].filter(p => d >= 0 && ttCell(b.abs, d, p) && blkNeeds(b, p) && !((b.rows || {})[p] || {}).t).length, 0);
  return `<section class="card"><h2>استمارة حصص الانتظار — ${dayAr(iso)} ${hijriOf(iso)} هـ</h2>

    ${d >= 0 && !holOf(iso) ? absGrid(iso) + nowOutPanel(iso) + rulesPanel(iso) : ''}
    <div class="acts wrap">${w.blocks.length ? `${board ? '' : '<button class="btn" data-act="wAuto" type="button">تعبئة تلقائية للمتاحين</button>'}<button class="btn sm ${skipDone() ? 'on' : 'ghost'} dnt" data-act="wSkipDone" type="button" aria-pressed="${skipDone()}" title="من أنهى حصصه قبل حصة الانتظار يُؤخَّر في الاقتراح والتعبئة التلقائية">🏁 تأخير من أنهى حصصه ${skipDone() ? '✓' : '✕'}</button>` : ''}
      <span class="sp1"></span><button class="btn pri" data-act="dPrint" data-v="wait" type="button">معاينة وطباعة</button><button class="btn" data-act="dPdf" data-v="wait" type="button">PDF</button><button class="btn wa" data-act="waOpen" data-v="wait" type="button">📲 واتساب</button><button class="btn" data-act="dWord" data-v="wait" type="button">Word</button><button class="btn" data-act="dXls" data-v="wait" type="button">Excel</button></div>
    ${w.blocks.length && !board ? `<div class="wsum"><span><b>${w.blocks.filter(b => !b.part).length}</b> غائب</span>${w.blocks.some(b => b.part) ? `<span><b>${w.blocks.filter(b => b.part).length}</b> مستأذن/متأخر</span>` : ''}<span><b>${w.blocks.reduce((a, b) => a + Object.values(b.rows || {}).filter(r => r && r.t).length, 0)}</b> حصة مسددة</span>${empty ? `<span class="warn"><b>${empty}</b> بلا منتظر</span>` : ''}${issues ? `<span class="bad"><b>${issues}</b> تعارض</span>` : ''}</div>` : '<p class="hint" style="margin-top:10px">لا يوجد غائبون مسجلون لهذا اليوم. يمكنك طباعة استمارة فارغة.</p>'}
    ${w.blocks.length && tt0() && !board ? `<div class="wlegend" aria-label="دليل الرموز"><span><b class="lg st">★</b>الأنسب (حتى 3)</span><span><b class="lg">◆</b>يدرّس الشعبة</span><span><b class="lg n">3</b>حصصه اليوم</span><span><b class="lg">⏱</b>خرج قبل الحصة</span><span><b class="lg">🏁</b>أنهى حصصه</span><button type="button" class="hlp" data-help="ترتيب الأنسب: من يدرّس الشعبة نفسها، ثم من يدرّس الصف، ثم الأقل حصصاً اليوم، ثم الأقل انتظاراً في الفصل. يُؤخَّر من بلغ 5 حصص اليوم ومن أنهى حصصه. المس «★ الأنسب» لاختياره مباشرة، أو أي اسم آخر." aria-label="شرح الترتيب">؟</button></div>` : ''}
    ${w.blocks.length && tt0() ? `<div class="wvt" role="tablist"><button type="button" class="${board ? 'on' : ''}" data-act="wView" data-v="p">☰ لوحة التسديد</button><button type="button" class="${board ? '' : 'on'}" data-act="wView" data-v="a">▦ تفصيلي</button></div>` : ''}
    ${board ? wBoard(iso) : `<div class="wblks">${blocks}</div>`}</section>${waSheet(iso)}`;
}
function tt0() { return !!D().tt; }
/* أولوية المنتظر: 1) لا يُثقَل من عنده 5 حصص فأكثر اليوم  2) يدرّس الشعبة نفسها  3) يدرّس الصف نفسه  4) الأقل انشغالاً اليوم (حصصه + انتظاره)  5) الأقل انتظاراً في الفصل */
function oneWait() { return D().cfg.oneWait !== false; }
/* أين انتظر المعلم اليوم (للتنبيه على الانتظار الثاني) */
function waitsOf(iso, n, skip) { const k = normName(n), out = []; ((D().wait[iso] || {}).blocks || []).forEach((b, bi) => Object.entries(b.rows || {}).forEach(([p, r]) => { if (r && r.t && normName(r.t) === k && !(skip && skip.bi === bi && skip.p === +p)) out.push(+p); })); return out.sort((a, c) => a - c); }
function waitRank(iso, b, p) {
  const bi0 = ((D().wait[iso] || {}).blocks || []).indexOf(b), cur = b && b.rows && b.rows[p] && b.rows[p].t ? normName(b.rows[p].t) : '';
  const d = wdOf(iso), secs = b && b.abs && d >= 0 ? ttSecs(b.abs, d, p).map(String) : [], gr = rowGrade(iso, b, p), ld = waitLoad(iso), wk = weekLoad();
  const info = n => { const k = normName(n), row = ttRow(n), cells = row ? Object.values(row.c).join(' ').split(/[^0-9]+/).filter(Boolean) : [];
    const today = (ld[k] || 0) - (cur === k ? 1 : 0), busy = (d >= 0 ? ttDayLoad(n, d) : 0) + today; return { today, had: oneWait() && today >= 1, hadP: today ? waitsOf(iso, n, { bi: bi0, p }) : [], done: doneBefore(iso, n, p), lc: d >= 0 ? lastC(n, d) : 7, ss: secs.some(s => cells.includes(s)), sg: teachesGrade(n, gr), busy, heavy: busy >= 5, term: wk[k] || 0 }; };
  const cmp = (a, b2) => { const x = info(a), y = info(b2); return (x.done - y.done) || (x.had - y.had) || (x.heavy - y.heavy) || (y.ss - x.ss) || (y.sg - x.sg) || (x.busy - y.busy) || (x.term - y.term) || AR.compare(normName(a), normName(b2)); };
  return { info, cmp, gr };
}
/* اختيار المنتظر بلمسة: المتاحون في الحصة نفسها أمامك مباشرة، مرتبين هجائياً، والأقل انتظاراً مميزون */
function waitChips(iso, bi, p, r) {
  const path = `daily.wait.${iso}.blocks.${bi}.rows.${p}.t`;
  if (r.t) return `<div class="wpick done"><span class="wname">${esc(r.t)}</span><button class="btn sm ghost" data-act="wClr" data-bi="${bi}" data-p="${p}" type="button">تغيير</button></div>`;
  const g = subOptsFor(iso, bi, p), all = g[0].items.slice().sort((a, b) => AR.compare(normName(a), normName(b)));
  if (!tt0()) return pickSel(path, '', g, { ph: '— اختر المنتظر —' });
  const gr = rowGrade(iso, D().wait[iso].blocks[bi], p), R = waitRank(iso, D().wait[iso].blocks[bi], p);
  const done = all.filter(n => R.info(n).done).sort((x, y) => (R.info(y).lc - R.info(x).lc) || R.cmp(x, y)), live = all.filter(n => !done.includes(n));
  const same = gr ? live.filter(n => teachesGrade(n, gr)) : [], rest = live.filter(n => !same.includes(n)), sug = new Set(live.slice().sort(R.cmp).slice(0, 3));
  const chip = n => { const f = R.info(n), why = [f.ss ? 'يدرّس الشعبة' : f.sg ? 'يدرّس الصف' : '', `${f.busy} حصص اليوم`, f.done ? (f.lc ? `آخر حصة له: ${f.lc}` : 'لا حصص له اليوم') : ''].filter(Boolean).join(' · ');
    return `<span class="wcw${f.done ? ' dn' : ''}"><button type="button" class="wchip${sug.has(n) ? ' sug' : ''}${same.includes(n) ? ' sg g' + gr : ''}${f.heavy ? ' heavy' : ''}" data-act="wSet" data-bi="${bi}" data-p="${p}" data-n="${esc(n)}" title="${esc(why)}">${f.ss ? '◆ ' : ''}${esc(n)}<i class="ld">${f.done ? (f.lc ? '🏁' + f.lc : '0') : f.busy}</i></button><button type="button" class="wlv" data-act="wQOut" data-p="${p}" data-n="${esc(n)}" title="${esc(n)} خارج المدرسة قبل الحصة ${p} (استأذن أو انصرف)" aria-label="${esc(n)} استأذن قبل الحصة ${p}">⏱</button></span>`; };
  const outs = ((D().wait[iso] || {}).blocks || []).filter(x => x.part && blkNeeds(x, p) && x.abs && x.abs !== D().wait[iso].blocks[bi].abs);
  const best = live.slice().sort(R.cmp)[0], bf = best && R.info(best);
  const bestLn = best ? `<button type="button" class="wbest" data-act="wSet" data-bi="${bi}" data-p="${p}" data-n="${esc(best)}"><i>★ الأنسب</i><b>${esc(best)}</b><span>${[bf.ss ? '◆ يدرّس الشعبة' : bf.sg ? 'يدرّس الصف' : '', `${bf.busy} حصص اليوم`, `${bf.term} انتظار في الفصل`].filter(Boolean).join(' · ')}</span><em>اختره ←</em></button>` : '';
  return `<div class="wpick">${bestLn}${outs.length ? `<div class="wouts"><span>⏱ خارجون في هذه الحصة:</span>${outs.map(x => `<button type="button" class="wout" data-act="wQUndo" data-n="${esc(x.abs)}" title="تراجع — ${esc(x.abs)} موجود">${esc(x.abs)} ↺</button>`).join('')}</div>` : ''}${live.length ? `${same.length ? `<small class="wgl g${gr}">① معلمو ${GSHORT[gr]} ثانوي (${same.length})</small><div class="wchips">${same.map(chip).join('')}</div>` : ''}
    ${rest.length ? (same.length ? `<details class="wrest"><summary>② بقية المتاحين (${rest.length}) — عرض</summary><div class="wchips">${rest.map(chip).join('')}</div></details>` : `<small class="wgl">المتاحون في الحصة ${p} (${rest.length})</small><div class="wchips">${rest.map(chip).join('')}</div>`) : ''}` : done.length ? '<span class="hint">كل المتاحين في هذه الحصة أنهوا حصصهم — اختر ممن ما زال موجوداً:</span>' : '<span class="hint">لا يوجد متاح في هذه الحصة</span>'}
    ${done.length ? `<details class="wrest wdone"${live.length ? '' : ' open'}><summary>🏁 أنهوا حصصهم قبل الحصة ${p} — غالباً خرجوا (${done.length})</summary><small class="hint">إن كان أحدهم ما زال موجوداً فاختره مباشرة، أو المس ⏱ لتأكيد خروجه. مرتبون من الأقرب انتهاءً (الأرجح بقاءً).</small><div class="wchips">${done.map(chip).join('')}</div></details>` : ''}
    <details class="wother"><summary>اسم آخر…</summary>${pickSel(path, '', g, { ph: '— كل المعلمين —' })}</details></div>`;
}
function vDuty(iso) {
  const u = U(iso), cfg = D().cfg, saved = !!D().duty[iso], P = `daily.duty.${iso}`, opt = dutyOpts(iso);
  const sel = (path, v, where) => { const is = dutyIssue(iso, v, where); return pickSel(path, v, opt, { ph: '— اختر —' }) + (is ? `<span class="cf">⚠ ${esc(is)}</span>` : ''); };
  const blocks = cfg.b.map((b, i) => `<article class="dblk"><header><b>${esc(b.t)}</b><small>(${esc(b.g)})</small><label class="inl">المشرف العام ${sel(`${P}.b.${i}.gen`, u.b[i] && u.b[i].gen, 'g')}</label></header>
    <div class="tw"><table class="et"><tr><th style="width:40px">م</th><th>اسم المشرف</th><th style="width:30%">الجهة</th><th>الملاحظات</th></tr>${(u.b[i] ? u.b[i].rows : []).map((r, j) => `<tr><td>${j + 1}</td><td>${sel(`${P}.b.${i}.rows.${j}.n`, r.n, 'b')}</td><td>${inp(`${P}.b.${i}.rows.${j}.loc`, r.loc || '')}</td><td>${inp(`${P}.b.${i}.rows.${j}.note`, r.note || '')}</td></tr>`).join('')}</table></div>
    <div class="acts"><button class="btn sm ghost" data-act="dRow" data-v="${i}" type="button">+ موقع إشراف</button></div></article>`).join('');
  const duty = `<article class="dblk"><header><b>المناوبة</b><small>الموظفون المناوبون</small></header><div class="tw"><table class="et"><tr><th style="width:40px">م</th><th>اسم الموظف المناوب</th><th>ملحوظات</th></tr>${u.duty.map((r, j) => `<tr><td>${j + 1}</td><td>${sel(`${P}.duty.${j}.n`, r.n, 'd')}${r.n && dutyAway(iso).has(normName(r.n)) ? `<button class="btn sm" data-act="dDutyRep" data-j="${j}" type="button">↺ بديل من أصحاب الحصة الأخيرة</button>` : ''}</td><td>${inp(`${P}.duty.${j}.note`, r.note || '')}</td></tr>`).join('')}</table></div><div class="acts"><button class="btn sm pri" data-act="dAutoDuty" type="button">⑦ تعبئة تلقائية من أصحاب الحصة الأخيرة</button><button class="btn sm ghost" data-act="dRow" data-v="duty" type="button">+ مناوب</button></div>${admEditor()}</article>`;
  return `<section class="card"><h2>تقرير الإشراف والمناوبة اليومي — ${dayAr(iso)} ${hijriOf(iso)} هـ</h2>

    <div class="acts wrap"><button class="btn pri" data-act="dPrint" data-v="duty" type="button">معاينة وطباعة</button><button class="btn" data-act="dPdf" data-v="duty" type="button">PDF</button><button class="btn wa" data-act="waOpen" data-v="duty" type="button">📲 واتساب</button><button class="btn" data-act="dWord" data-v="duty" type="button">Word</button><span class="sp1"></span>
      <button class="btn" data-act="dWeek" type="button">حفظ كجدول ثابت لكل يوم ${wdOf(iso) >= 0 ? TT_DAYS[wdOf(iso)] : ''}</button>${saved ? '<button class="btn ghost" data-act="dReset" type="button">مسح تعبئة هذا اليوم</button>' : ''}</div>
    <div class="dblks">${blocks}${duty}</div>
    <details class="sub"><summary>إعدادات النموذج (الفسح والمواقع)</summary><div class="grid2">${cfg.b.map((b, i) => `<label>اسم ${i + 1} ${inp(`daily.cfg.b.${i}.t`, b.t)}</label><label>الصفوف ${inp(`daily.cfg.b.${i}.g`, b.g)}</label>`).join('')}<label>رقم النموذج ${inp('daily.cfg.no', cfg.no)}</label><label>رمز النموذج ${inp('daily.cfg.code', cfg.code)}</label></div></details>
  </section>${vWeekDuty()}${waSheet(iso)}`;
}
function ttSrc() { return TT_WHICH === 'next' && D().ttNext ? D().ttNext : D().tt; }
function vTT(iso) {
  const t = ttSrc(); if (!t) return `<section class="card empty"><h2>لم يُرفع الجدول المدرسي العام</h2><p class="hint">ارفعه من «الملفات الأساسية» بصيغة PDF أو Excel أو Word (تصدير برنامج الجدول aSc أو غيره).</p><button class="btn pri" data-tab="files" type="button">رفع الجدول</button></section>`;
  if (TT_DAY == null) TT_DAY = Math.max(0, wdOf(iso));
  const dd = TT_DAY, free = [1, 2, 3, 4, 5, 6, 7].map(p => t.teachers.filter(x => !x.c[dd + '-' + p]).length);
  const sw = D().ttNext ? `<div class="dtabs sm" style="margin-bottom:8px"><button type="button" class="${TT_WHICH !== 'next' ? 'on' : ''}" data-act="ttWhich" data-v="cur">الجدول الحالي</button><button type="button" class="${TT_WHICH === 'next' ? 'on' : ''}" data-act="ttWhich" data-v="next">جدول الفصل القادم</button></div>` : '';
  return `<section class="card"><h2>${TT_WHICH === 'next' && D().ttNext ? 'جدول الفصل القادم' : 'الجدول المدرسي العام'} — ${esc(TT_DAYS[dd])}</h2>${sw}
    <div class="acts wrap"><div class="dtabs sm">${TT_DAYS.map((n, i) => `<button type="button" class="${i === dd ? 'on' : ''}" data-act="ttDay" data-v="${i}">${n}</button>`).join('')}</div><span class="sp1"></span><button class="btn pri" data-act="dPrint" data-v="tt" type="button">طباعة جدول اليوم</button><button class="btn" data-act="dPdf" data-v="tt" type="button">PDF</button><button class="btn" data-act="dXls" data-v="tt" type="button">Excel</button></div>
    <p class="hint">${t.teachers.length} معلماً — ${esc(t.src || '')}. الخانة الفارغة تعني أن المعلم متاح في تلك الحصة.</p>
    <div class="tw"><table class="et ttg"><tr><th>المعلم</th>${[1, 2, 3, 4, 5, 6, 7].map(p => `<th>${p}</th>`).join('')}<th>حصص</th></tr>${t.teachers.map(x => `<tr><td class="tn">${esc(x.n)}</td>${[1, 2, 3, 4, 5, 6, 7].map(p => { const v = x.c[dd + '-' + p]; return `<td class="${v ? 'g' + secGrade(String(v).split('،')[0]) : 'fr'}">${v ? esc(v) : ''}</td>`; }).join('')}<td>${[1, 2, 3, 4, 5, 6, 7].filter(p => x.c[dd + '-' + p]).length}</td></tr>`).join('')}
    <tr class="tot"><td>المتاحون</td>${free.map(f => `<td>${f}</td>`).join('')}<td></td></tr></table></div></section>`;
}
function vLog() {
  const ws = D().wait, us = D().duty; const dates = [...new Set([...Object.keys(ws).filter(k => (ws[k].blocks || []).length), ...Object.keys(us)])].sort().reverse();
  return `<section class="card"><h2>سجل الأيام</h2>${dates.length ? `<div class="tw"><table class="et"><tr><th>اليوم</th><th>التاريخ</th><th>الغائبون</th><th>حصص الانتظار</th><th>المناوبة</th><th></th></tr>${dates.map(k => { const w = ws[k] || { blocks: [] }; return `<tr><td>${dayAr(k)}</td><td>${hijriOf(k)}</td><td>${w.blocks.map(b => esc(b.abs || '')).join('، ') || '—'}</td><td>${w.blocks.reduce((a, b) => a + Object.values(b.rows || {}).filter(r => r && r.t).length, 0)}</td><td>${us[k] ? '✓' : '—'}</td><td><button class="btn sm" data-act="dOpen" data-v="${k}" type="button">فتح</button></td></tr>`; }).join('')}</table></div>` : '<p class="hint">لا توجد أيام مسجلة بعد.</p>'}</section>
  ${fairHtml()}`;
}

/* ---------- الطباعة ---------- */
function waitRows(iso) {
  const d = wdOf(iso), out = [];
  (D().wait[iso] || { blocks: [] }).blocks.forEach(b => { if (!b.abs) return; for (let p = 1; p <= 7; p++) { const sc = d >= 0 ? ttSecs(b.abs, d, p) : [], r = (b.rows || {})[p] || {}; if (!blkNeeds(b, p) || (!sc.length && !r.t && !r.g && !r.s)) continue;
    out.push({ p, g: rowGrade(iso, b, p), sec: sc.length ? sc.join('، ') : (r.s || ''), abs: b.part ? `${b.abs} (${partLbl(b, d >= 0 ? lastP(d) : 7)})` : b.abs, t: r.t || '', note: r.note || '' }); } });
  return out.sort((a, b) => a.p - b.p || AR.compare(normName(a.abs), normName(b.abs)));
}
const ORD = ['أولاً', 'ثانياً', 'ثالثاً', 'رابعاً'];
function waitPages(iso) {
  const rows = waitRows(iso), all = (D().wait[iso] || { blocks: [] }).blocks.filter(b => b.abs).map(b => b.abs);
  const intro = `<p class="wl">إخواني المعلمين / نظراً لغياب ${all.length > 1 ? 'الزملاء' : 'الزميل'} هذا اليوم <b>${dayAr(iso)}</b> الموافق <b>${hijriOf(iso)} هـ</b>، آمل تسديد الحصص حسب الجدول الموضح لكل صف والتوقيع بالعلم، ولكم جزيل الشكر.</p>`;
  const hd = [H('الحصة', { w: '10%' }), H('الشعبة', { w: '8%' }), H('المعلم الغائب', { w: '22%' }), H('المعلم المنتظر', { w: '22%' }), H('ما تم تنفيذه في حصة الانتظار'), H('التوقيع', { w: '12%' })];
  const secs = [1, 2, 3, 0].map(g => ({ g, rows: rows.filter(r => r.g === g) })).filter(x => x.rows.length);
  const head = (x, k, cont) => { const ab = [...new Set(x.rows.map(r => r.abs))]; return [{ v: `<b>${ORD[k] || ''}: ${x.g ? GNAME[x.g] : 'حصص أخرى'}${cont ? ' (تابع)' : ''}</b> &nbsp;—&nbsp; نظراً لغياب ${ab.length > 1 ? 'الزملاء' : 'الزميل'}: <b>${ab.map(esc).join('، ')}</b>`, cs: 6, al: 'right', bg: GCOL[x.g] || '#eeeeee' }]; };
  const nw = v => `<span style="white-space:nowrap">${v}</span>`, st = (p, g) => { const B = bellNow()[g === 1 ? 1 : 23][p - 1]; return B ? t12(B[0]) : ''; };
  const line = r => [`<b>${r.p}</b> <small style="font-size:7.5pt;white-space:nowrap">${st(r.p, r.g)}</small>`, esc(r.sec), nw(esc(r.abs)), `<b>${nw(esc(r.t))}</b>`, esc(r.note), ''];
  const ttl = () => title('استمارة حصص الانتظار', `${dayAr(iso)} ${hijriOf(iso)} هـ`);
  if (!secs.length) return [ttl() + intro + T([hd, ...Array.from({ length: 14 }, () => ['', '', '', '', '', ''])], { cls: 'dense' }) + sp(10) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep]])];
  const CAP = fitPer(rows.length + secs.length * 2 + 2, 36) + 1, pages = []; let top = ttl() + intro, body = '', used = 2;
  const flush = () => { pages.push(top + `<div>${body}</div>`); top = ttl(); body = ''; used = 0; };
  secs.forEach((x, k) => { let i = 0, cont = false;
    while (i < x.rows.length) { if (used + 3 > CAP) flush();
      const n = Math.min(x.rows.length - i, CAP - used - 2); body += T([head(x, k, cont), hd, ...x.rows.slice(i, i + n).map(line)], { cls: 'dense nogrow', st: 'margin-bottom:10px' }); used += n + 2; i += n; cont = true; } });
  pages.push(top + `<div>${body}</div>` + sp(8) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep]]));
  return pages;
}
function dutyPages(iso) {
  const u = U(iso), cfg = D().cfg; const C = '☐';
  const head = `<p class="ds" style="text-align:right">نموذج (${esc(cfg.no)}) — اسم النموذج: ${esc(cfg.name || DUTY_DEF.name)} — رمز النموذج: (${esc(cfg.code)})</p><p class="wl" style="text-align:center">للعام الدراسي (${esc(S.s.yearTxt)}) — الفصل الدراسي (${esc(u.sem || S.s.sem)}) — اليوم (${dayAr(iso)}) — التاريخ: ${hijriOf(iso)} هـ</p>`;
  const blk = (b, i) => T([[H(`${esc(b.t)} (${esc(b.g)})`, { cs: 2 }), H('المشرف العام'), { v: esc(u.b[i] && u.b[i].gen || ''), b: true }, H('التوقيع'), '']].concat([[H('م', { w: '6%' }), H('اسم المشرف', { w: '26%' }), H('الجهة', { w: '22%' }), H('التوقيع', { w: '16%' }), H('الملاحظات', { cs: 2 })]]).concat((u.b[i] ? u.b[i].rows : []).map((r, j) => [j + 1, esc(r.n || ''), esc(r.loc || ''), '', { v: esc(r.note || ''), cs: 2 }]))
    .concat([[{ v: 'ملاحظات المشرف العام: ' + '.'.repeat(90), cs: 6, al: 'right' }], [{ v: `التقرير العام للإشراف: &nbsp; ${C} مقبول &nbsp; ${C} جيد &nbsp; ${C} ممتاز`, cs: 6, al: 'right' }]]), { cls: 'dense nogrow' });
  const dt = T([[H('م', { w: '6%' }), H('اسم الموظف المناوب', { cs: 2 }), H('التوقيع', { w: '16%' }), H('ملحوظات', { cs: 2 })]].concat(u.duty.map((r, j) => [j + 1, { v: esc(r.n || ''), cs: 2 }, '', { v: esc(r.note || ''), cs: 2 }]))
    .concat([[{ v: 'ملاحظات المشرف المناوب: ' + '.'.repeat(90), cs: 6, al: 'right' }], [{ v: `التقرير العام للمناوبة: &nbsp; ${C} مقبول &nbsp; ${C} جيد &nbsp; ${C} ممتاز`, cs: 6, al: 'right' }]]), { cls: 'dense nogrow' });
  return [title(esc(cfg.name || DUTY_DEF.name)) + head + cfg.b.map(blk).join(sp(8)) + sp(8) + dt + sp(10) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep], ['مدير المدرسة', S.s.principal]])];
}
function ttPages(dd) {
  const t = ttSrc(); if (!t) return [];
  const rows = t.teachers.map((x, i) => [i + 1, { v: esc(x.n), al: 'right' }, ...[1, 2, 3, 4, 5, 6, 7].map(p => esc(x.c[dd + '-' + p] || '')), [1, 2, 3, 4, 5, 6, 7].filter(p => x.c[dd + '-' + p]).length]);
  const hd = [H('م', { w: '5%' }), H('المعلم', { w: '22%' }), ...[1, 2, 3, 4, 5, 6, 7].map(p => H('الحصة ' + p)), H('المجموع', { w: '8%' })];
  const out = []; const per = fitPer(rows.length, 34); for (let i = 0; i < rows.length; i += per) out.push(title((t === D().ttNext ? 'جدول الفصل القادم' : 'الجدول المدرسي العام') + ' — يوم ' + TT_DAYS[dd]) + T([hd, ...rows.slice(i, i + per)], { cls: 'dense' }));
  return out;
}
function statsPages() { return fairPages(); }
function dailyGroups(kind) {
  const iso = dIso(); ensureLeaves(iso);
  if (kind === 'wait') return [{ land: false, pages: waitPages(iso), t: 'استمارة حصص الانتظار' }];
  if (kind === 'duty') return [{ land: false, pages: dutyPages(iso), t: 'تقرير الإشراف والمناوبة اليومي' }];
  if (kind === 'tt') return [{ land: false, pages: ttPages(TT_DAY == null ? Math.max(0, wdOf(iso)) : TT_DAY), t: 'الجدول المدرسي' }];
  return [{ land: false, pages: statsPages(), t: 'تقرير عدالة توزيع حصص الانتظار' }];
}
function dailyName(kind) { const iso = dIso(); return fname(({ wait: 'استمارة حصص الانتظار', duty: 'تقرير الإشراف والمناوبة', tt: 'الجدول المدرسي - ' + TT_DAYS[TT_DAY == null ? Math.max(0, wdOf(iso)) : TT_DAY], stats: 'تقرير عدالة الانتظار - ' + statRange(STAT_P)[2] })[kind] + (kind === 'wait' || kind === 'duty' ? ' - ' + dayAr(iso) + ' ' + hijriOf(iso).replace(/\//g, '-') : '')); }

function setLeave(iso, bl, end) {
  if (!bl || !end) return; let l = leaveOf(iso, bl.abs);
  if (l) { if (end < l.b) endLeave(l, addDays(end, 1)); l.b = end; } else { l = { id: 'L' + Date.now().toString(36), n: bl.abs, a: iso, b: end }; leaves().push(l); }
  bl.leave = l.id; save(); render(); const n = schoolDaysBetween(l.a, l.b).length; toast(`${bl.abs} غائب ${n} أيام دراسية حتى ${dayAr(l.b)} ${hijriOf(l.b)} — يظهر تلقائياً كل يوم`);
}
document.addEventListener('change', e => { const el = e.target; if (!el.dataset || !el.dataset.lvdate) return; const iso = dIso(), bl = W(iso).blocks[+el.dataset.lvdate]; if (el.value && el.value >= iso) setLeave(iso, bl, isSchoolDay(el.value) ? el.value : prevSchoolDay(el.value)); });
/* ---------- الأحداث ---------- */
document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, iso = dIso();
  if (a === 'dTab') { DAILY_TAB = b.dataset.v; return render(); }
  if (a === 'dDay') { const v = +b.dataset.v; if (v === 0) DAILY_DATE = todayIso(); else { let d = iso, k = 0; do { d = addDays(d, v); } while (!isSchoolDay(d) && ++k < 60); DAILY_DATE = d; } return render(); }
  if (a === 'dOpen') { DAILY_DATE = b.dataset.v; DAILY_TAB = 'wait'; return render(); }
  if (a === 'ttDay') { TT_DAY = +b.dataset.v; return render(); }
  if (a === 'ttWhich') { TT_WHICH = b.dataset.v; return render(); }
  if (a === 'ttnView') { TT_WHICH = 'next'; DAILY_TAB = 'tt'; return go('daily'); }
  if (a === 'ttnDel') { if (await confirmBox('حذف جدول الفصل القادم؟')) { delete D().ttNext; TT_WHICH = 'cur'; save(); render(); } return; }
  if (a === 'ttnApply') { const n = D().ttNext; if (n && await confirmBox(`اعتماد جدول الفصل القادم (${n.teachers.length} معلماً) جدولاً حالياً؟ تُبنى عليه حصص الانتظار من الآن، ويُحفظ الجدول الحالي لاسترجاعه عند الحاجة.`)) { D().ttPrev = D().tt; D().tt = n; delete D().ttNext; TT_WHICH = 'cur'; S.uploads.tt = { name: n.src, at: stamp(), info: `${n.teachers.length} معلماً` }; save(); render(); toast('اعتُمد جدول الفصل الجديد ✓'); } return; }
  if (a === 'ttPrev') { const p = D().ttPrev; if (p && await confirmBox(`استرجاع الجدول السابق (${p.src || ''})؟ يحل محل الجدول الحالي، ويُحفظ الحالي بدلاً منه.`)) { D().ttPrev = D().tt; D().tt = p; save(); render(); toast('استُرجع الجدول السابق'); } return; }
  if (a === 'wDel') { WSET = -1; WSHEET = null; const bl = W(iso).blocks[+b.dataset.v], l = bl && (leaveOf(iso, bl.abs)); if (l) { if (await confirmBox(`${bl.abs} مسجل غائباً لعدة أيام حتى ${dayAr(l.b)} ${hijriOf(l.b)}. إزالته من اليوم وما بعده (عاد للعمل)؟`)) { endLeave(l, iso); save(); render(); } return; } if (await confirmBox('حذف هذا المعلم الغائب واستمارته لهذا اليوم؟')) { W(iso).blocks.splice(+b.dataset.v, 1); save(); render(); } return; }
  if (a === 'bellAct') { bell().act = b.dataset.v; save(); render(); return toast(`اعتُمد التوقيت ${BELL_NAME[bell().act]} ✓`); }
  if (a === 'bellView') { const f = D().bellF; if (!f) return; openPreview([{ land: false, pages: f.imgs && f.imgs.length ? f.imgs.map(im => `<p style="text-align:center;margin:0"><img src="${im.src || im}" alt="التوقيت المدرسي" style="width:100%;max-height:245mm;object-fit:contain"></p>`) : [f.html], t: 'التوقيت المدرسي' }], fname('التوقيت المدرسي')); return; }
  if (a === 'nP') { NOW_P = +b.dataset.p; NOW_OPEN = true; render(); return; }
  if (a === 'nOut') { NOW_OPEN = true; const n = b.dataset.n, k = normName(n), bl = W(iso).blocks.find(z => normName(z.abs) === k);
    if (bl && bl.part && blkNeeds(bl, NOW_P)) { quickUndo(iso, n); save(); render(); return toast(`↺ ${n} موجود`); }
    const x = quickOut(iso, n, NOW_P); if (x === false) return toast(`${n} مسجل غائباً اليوم`); save(); render(); return toast(`⏱ ${n} خارج من الحصة ${NOW_P}${reflowMsg(n, x)}`, x.got.some(g => !g.t)); }
  if (a === 'nClr') { NOW_OPEN = true; W(iso).blocks.filter(z => z.part && blkNeeds(z, NOW_P)).map(z => z.abs).forEach(n => quickUndo(iso, n)); save(); render(); return toast('أُلغي تسجيل الخروج'); }
  if (a === 'nRule') return toast(`🚪 ${b.dataset.n} عليه قاعدة خروج دائم — عدّلها من «خروج دائم بعد آخر حصة»`);
  if (a === 'rAdd') { RULE_OPEN = true; const el = document.getElementById('rIn'), v = (el && el.value || '').trim(); const n = ttNames().find(x => normName(x) === normName(v)) || v; if (!n) return toast('اكتب اسم المعلم', true);
    exitR()[normName(n)] = { n, days: [] }; save(); render(); return toast(`🚪 ${n}: يُستبعد بعد آخر حصة له كل يوم`); }
  if (a === 'rDel') { RULE_OPEN = true; delete exitR()[normName(b.dataset.n)]; save(); render(); return toast(`حُذفت قاعدة ${b.dataset.n}`); }
  if (a === 'rDay') { RULE_OPEN = true; const r = exitR()[normName(b.dataset.n)], i = +b.dataset.v; let ds = r.days && r.days.length ? r.days.slice() : [0, 1, 2, 3, 4]; ds = ds.includes(i) ? ds.filter(x => x !== i) : ds.concat(i).sort(); if (!ds.length) return toast('اختر يوماً واحداً على الأقل، أو احذف القاعدة', true); r.days = ds.length === 5 ? [] : ds; save(); render(); return; }
  if (a === 'waOpen') { if (b.dataset.v === 'wait' && !(await waitGate(iso))) return; WA = b.dataset.v; WSHEET = null; render(); return; }
  if (a === 'waClose') { WA = null; render(); return; }
  if (a === 'waDelN') { D().cfg.waN = waNums().filter(f => f.n !== b.dataset.n); save(); render(); return; }
  if (a === 'waTxt') { let n = b.dataset.n; if (n === '__in') { const v = (document.getElementById('waIn') || {}).value; n = waNum(v); if (!n || n.length < 10) return toast('اكتب رقم جوال صحيح', true); if (!waNums().some(f => f.n === n)) { waNums().unshift({ n, l: '0' + n.slice(3) }); D().cfg.waN = waNums().slice(0, 8); save(); } }
    const url = `https://wa.me/${n || ''}?text=${encodeURIComponent(waText(iso, WA))}`; window.open(url, '_blank'); return; }
  if (a === 'waPdf') { const k = WA, g = dailyGroups(k), nm = dailyName(k); if (!g[0].pages.length) return toast('لا توجد بيانات', true);
    const blob = await downloadPdf(g, nm, { blob: true }); if (!blob) return; const f = new File([blob], nm + '.pdf', { type: 'application/pdf' });
    try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: nm, text: waText(iso, k).split('\n').slice(0, 2).join(' — ') }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    download(blob, nm + '.pdf'); toast('نُزّل الملف — أرفقه في واتساب'); setTimeout(() => window.open(`https://wa.me/?text=${encodeURIComponent(nm)}`, '_blank'), 600); return; }
  if (a === 'wExp') { const v = +b.dataset.v; WEXP = WEXP === v ? -1 : v; render(); return; }
  if (a === 'wHintOff') { wHint(1); render(); return; }
  if (a === 'wView') { D().cfg.wview = b.dataset.v; WSHEET = null; save(); render(); return; }
  if (a === 'wSetOpen') { const v = +b.dataset.v; WSET = WSET === v ? -1 : v; render(); return; }
  if (a === 'wOpen') { WMORE = false; WSHEET = { bi: +b.dataset.bi, p: +b.dataset.p }; render(); setTimeout(() => { const q = document.querySelector('.wsh .wsq'); if (q && window.innerWidth > 700) q.focus(); }, 30); return; }
  if (a === 'wOpenNext') { const em = wSlots(iso).filter(x => !slotT(x)), n = em[0]; if (n) { WSHEET = { bi: n.bi, p: n.p }; render(); } return; }
  if (a === 'wClose') { WSHEET = null; render(); return; }
  if (a === 'wNav') { const AL = wSlots(iso), i = AL.findIndex(x => x.bi === WSHEET.bi && x.p === WSHEET.p), n = AL[i + +b.dataset.v]; if (n) { WMORE = false; WSHEET = { bi: n.bi, p: n.p }; render(); } return; }
  if (a === 'wJump') { WMORE = false; WSHEET = { bi: +b.dataset.bi, p: +b.dataset.p }; render(); return; }
  if (a === 'wSkip') { const n = nextEmpty(iso, WSHEET); WSHEET = n ? { bi: n.bi, p: n.p } : null; render(); return; }
  if (a === 'wOne') { D().cfg.oneWait = !oneWait(); save(); render(); return toast(oneWait() ? 'من أخذ انتظاراً اليوم يُؤخَّر ويُطوى، ولا تختاره التعبئة التلقائية إلا عند الضرورة' : 'أُلغي قيد الانتظار الواحد — الترتيب بالأنسب فقط'); }
  if (a === 'wPick') { wHint(1); const cur = WSHEET, prev = b.dataset.n ? waitsOf(iso, b.dataset.n, cur) : []; setPath(`daily.wait.${iso}.blocks.${cur.bi}.rows.${cur.p}.t`, b.dataset.n); save();
    const n = b.dataset.n ? nextEmpty(iso, cur) : null; WSHEET = b.dataset.n ? (n ? { bi: n.bi, p: n.p } : null) : cur; render(); if (b.dataset.n && prev.length) toast(`⚠ ${b.dataset.n}: هذا انتظاره ${prev.length === 1 ? 'الثاني' : 'رقم ' + (prev.length + 1)} اليوم (سبق في ح${prev.join('، ح')})`, true); else if (b.dataset.n) toast(`✓ ${b.dataset.n} — الحصة ${cur.p}${n ? (n.bi !== cur.bi ? ` · الغائب التالي: ${n.b.abs}` : ` · التالي: الحصة ${n.p}`) : ' · اكتمل التسديد ✓ — اطبع أو أرسل'}`); return; }
  if (a === 'wQOut') { const n = b.dataset.n, p = +b.dataset.p, x = quickOut(iso, n, p); if (x === false) return toast(`${n} مسجل غائباً اليوم`); save(); render(); const bl = W(iso).blocks.find(z => normName(z.abs) === normName(n)), dd = wdOf(iso), need = dd >= 0 ? [1, 2, 3, 4, 5, 6, 7].filter(q => ttCell(n, dd, q) && blkNeeds(bl, q)).length : 0;
    return toast(`⏱ ${n} خارج من الحصة ${p}${need ? ` · أُضيفت ${need} من حصصه للتسديد` : ''}${reflowMsg(n, x)} — للتراجع المس ↺`, x.got.some(g => !g.t)); }
  if (a === 'wQUndo') { quickUndo(iso, b.dataset.n); save(); render(); return toast(`↺ ${b.dataset.n} موجود — أُلغي الاستئذان`); }
  if (a === 'wSkipDone') { D().cfg.skipDone = !skipDone(); save(); render(); return toast(skipDone() ? 'من أنهى حصصه قبل حصة الانتظار يُؤخَّر ويُطوى في آخر القائمة' : 'يُعامل من أنهى حصصه كبقية المتاحين'); }
  if (a === 'wEdit') { const bl = W(iso).blocks[+b.dataset.v]; bl.pend = 'out'; render(); return; }
  if (a === 'absMode') { ABS_MODE = b.dataset.v; render(); return toast(ABS_MODE === 'full' ? 'المس اسم الغائب طوال اليوم' : ABS_MODE === 'out' ? 'المس اسم المستأذن، ثم اختر الحصة التي خرج بعدها' : 'المس اسم المتأخر، ثم اختر الحصة التي حضر فيها'); }
  if (a === 'wOut' || a === 'wLate' || a === 'wFull') { const bl = W(iso).blocks[+b.dataset.bi], d = wdOf(iso), L = d >= 0 ? lastP(d) : 7, p = +b.dataset.p;
    if (a === 'wFull') delete bl.part; else { const P = bl.part || { a: 1, b: L }; if (a === 'wOut') P.b = P.b === p ? L : p; else P.a = P.a === p ? 1 : p; if (P.a > P.b) return toast('وقت الحضور يسبق وقت الخروج — راجع الاختيار', true); bl.part = (P.a === 1 && P.b === L) ? null : P; if (!bl.part) delete bl.part; }
    delete bl.pend; const x = reflow(iso, bl.abs); save(); render(); return toast(`${bl.abs}: ${bl.part ? partLbl(bl, L) : 'غائب طوال اليوم'}${x.freed ? ` · أُلغي ${x.freed} انتظار لم يعد لازماً` : ''}${reflowMsg(bl.abs, x)}`, x.got.some(g => !g.t)); }
  if (a === 'wAbs') { WSET = -1; WSHEET = null; const n = b.dataset.n, w = W(iso), i = w.blocks.findIndex(x => normName(x.abs) === normName(n));
    if (i < 0) { const nb = { abs: n, rows: {} }; if (ABS_MODE !== 'full') nb.pend = ABS_MODE; w.blocks.push(nb); const x = ABS_MODE === 'full' ? reflow(iso, n) : { got: [] }; save(); render(); if (x.got.length) toast(`${n} غائب${reflowMsg(n, x)}`, x.got.some(g => !g.t)); else if (ABS_MODE !== 'full') toast(ABS_MODE === 'out' ? `اختر الحصة التي خرج ${n} بعدها` : `اختر الحصة التي حضر فيها ${n}`); setTimeout(() => { const el = document.querySelectorAll('.wblk')[w.blocks.length - 1]; if (el && window.innerWidth < 700) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); return; }
    const bl = w.blocks[i], filled = Object.values(bl.rows || {}).filter(r => r && r.t).length, l = leaveOf(iso, n);
    if (l) { if (await confirmBox(`${n} مسجل غائباً حتى ${dayAr(l.b)} ${hijriOf(l.b)}. إلغاء غيابه من اليوم وما بعده؟`)) { endLeave(l, iso); save(); render(); } return; }
    if (filled && !await confirmBox(`إلغاء غياب ${n}؟ سيُحذف ${filled} انتظار مسجل له اليوم.`)) return; w.blocks.splice(i, 1); save(); render(); return; }
  if (a === 'wLvOpen') { const bi = +b.dataset.bi, art = b.closest('.wblk'), ex = art.querySelector('.lvform'); if (ex) { ex.remove(); return; } art.querySelector('.lvbar').insertAdjacentHTML('afterend', leaveForm(iso, bi)); return; }
  if (a === 'wLv') { const bl = W(iso).blocks[+b.dataset.bi]; setLeave(iso, bl, nthSchoolDay(iso, +b.dataset.n)); return; }
  if (a === 'wBack') { const bl = W(iso).blocks[+b.dataset.bi], l = bl && leaveOf(iso, bl.abs); if (l && await confirmBox(`تسجيل عودة ${bl.abs} اليوم؟ يُزال غيابه من اليوم وما بعده.`)) { endLeave(l, iso); save(); render(); toast(`سُجّلت عودة ${bl.abs}`); } return; }
  if (a === 'wSet') { setPath(`daily.wait.${iso}.blocks.${b.dataset.bi}.rows.${b.dataset.p}.t`, b.dataset.n); save(); render(); return; }
  if (a === 'wClr') { setPath(`daily.wait.${iso}.blocks.${b.dataset.bi}.rows.${b.dataset.p}.t`, ''); save(); render(); return; }
  if (a === 'wAuto') { const n = autoFill(iso); save(); render(); return toast(n ? `عُبّئت ${n} حصة بالمعلمين المتاحين الأقل انتظاراً` : 'لا توجد حصص فارغة تحتاج تعبئة'); }
  if (a === 'dWeekAuto') { const n = autoWeek(); save(); render(); return toast(n < 0 ? 'ارفع الجدول المدرسي أولاً' : n ? `وُزّع ${n} مناوباً على أيام الأسبوع من أصحاب الحصة الأخيرة — يُعبّأ تلقائياً كل يوم` : 'الجدول مكتمل'); }
  if (a === 'dWeekClr') { if (await confirmBox('مسح جدول المناوبة الأسبوعي الثابت؟ الأيام المحفوظة لا تتأثر.')) { for (let w = 0; w < 5; w++) if (D().week[w]) D().week[w].duty = []; save(); render(); } return; }
  if (a === 'admDel') { ADM_OPEN = true; const n = b.dataset.n; admSet(admList().filter(x => normName(x) !== normName(n))); save(); render(); return toast(`حُذف ${n} من الهيئة الإدارية`); }
  if (a === 'admAdd') { ADM_OPEN = true; const el = document.getElementById('admIn'), add = (el && el.value || '').split(/[،,\n]+/).map(x => x.trim()).filter(Boolean); if (!add.length) { el && el.focus(); return toast('اكتب الاسم أولاً', true); }
    const before = admList().length; admSet(admList().concat(add)); save(); render(); const k = admList().length - before; setTimeout(() => { const e = document.getElementById('admIn'); e && e.focus(); }, 50); return toast(k ? `أُضيف ${k} إلى الهيئة الإدارية ✓` : 'الاسم موجود مسبقاً', !k); }
  if (a === 'admReset') { if (await confirmBox('إرجاع قائمة الهيئة الإدارية إلى الأسماء الأصلية الـ 13؟')) { ADM_OPEN = true; D().cfg.adm = ADM_DEF; save(); render(); } return; }
  if (a === 'dDutyRep') { const c = dutyRep(iso, +b.dataset.j); save(); render(); return toast(c ? `${c} بدلاً عن الغائب ✓` : 'لا يوجد بديل متاح من أصحاب الحصة الأخيرة', !c); }
  if (a === 'dAutoDuty') { const n = autoDuty(iso); save(); render(); return toast(n < 0 ? 'ارفع الجدول المدرسي أولاً' : n ? `عُبّئ ${n} مناوب من أصحاب الحصة الأخيرة (الأقل مناوبةً أولاً)` : 'لا توجد خانات فارغة أو لا يوجد متاح من أصحاب الحصة الأخيرة'); }
  if (a === 'dRow') { const u = D().duty[iso] = U(iso); if (b.dataset.v === 'duty') u.duty.push({ n: '', note: '' }); else u.b[+b.dataset.v].rows.push({ n: '', loc: '', note: '' }); save(); return render(); }
  if (a === 'dWeek') { const w = wdOf(iso); if (w < 0) return toast('اختر يوماً دراسياً', true); D().week[w] = clone(U(iso)); save(); return toast(`حُفظ كجدول ثابت — سيُعبّأ تلقائياً في كل يوم ${TT_DAYS[w]}`); }
  if (a === 'dReset') { if (await confirmBox('مسح تعبئة المناوبة لهذا اليوم؟')) { delete D().duty[iso]; save(); render(); } return; }
  if (a === 'dPrint' || a === 'dPdf' || a === 'dWord' || a === 'dXls') {
    const k = b.dataset.v; if (k === 'wait' && !(await waitGate(iso))) return; const g = dailyGroups(k), nm = dailyName(k); if (!g[0].pages.length) return toast('لا توجد بيانات', true);
    if (a === 'dPdf') return downloadPdf(g, nm); if (a === 'dWord') return wordDoc(g, nm);
    if (a === 'dXls') return xlsFromGroups(g, nm);
    return openPreview(g, nm);
  }
});
function xlsFromGroups(groups, nm) {
  const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] }; let n = 0;
  groups.forEach(g => g.pages.forEach((html, i) => { const div = document.createElement('div'); div.innerHTML = html; $$('table.t', div).forEach(tb => { const ws = XLSX.utils.table_to_sheet(tb, { raw: true }); ws['!views'] = [{ RTL: true }]; XLSX.utils.book_append_sheet(wb, ws, ('ورقة ' + (++n)).slice(0, 31)); }); }));
  if (!n) return toast('لا توجد جداول', true);
  download(new Blob([XLSX.write(wb, { bookType: 'xlsx', type: 'array' })]), nm + '.xlsx');
}
document.addEventListener('change', e => {
  const el = e.target;
  if (el.id === 'dDate' && el.value) { DAILY_DATE = el.value; return render(); }
});

/* الكمبيوتر: عجلة الماوس تمرّر شريط الحصص أفقياً، والأسهم تتنقل بين الحصص، وEsc يغلق الورقة */
document.addEventListener('wheel', e => { const st = e.target.closest && e.target.closest('.wstrip'); if (!st || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return; st.scrollLeft -= e.deltaY; e.preventDefault(); }, { passive: false });
document.addEventListener('keydown', e => {
  if (typeof WSHEET === 'undefined' || !WSHEET || !document.querySelector('.wsh')) return; const a = document.activeElement; if (a && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
  if (e.key === 'Escape') { WSHEET = null; render(); return; }
  const dir = e.key === 'ArrowLeft' ? 1 : e.key === 'ArrowRight' ? -1 : 0; if (!dir) return; e.preventDefault();
  const AL = wSlots(dIso()), i = AL.findIndex(x => x.bi === WSHEET.bi && x.p === WSHEET.p), n = AL[i + dir]; if (n) { WMORE = false; WSHEET = { bi: n.bi, p: n.p }; render(); }
});
