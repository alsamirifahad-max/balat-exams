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
function D() { S.daily = S.daily || {}; const d = S.daily; d.wait = d.wait || {}; d.duty = d.duty || {}; d.week = d.week || {}; d.cfg = d.cfg || clone(DUTY_DEF); if (!d.cfg.b) d.cfg = clone(DUTY_DEF); return d; }
function dIso() { if (!DAILY_DATE) DAILY_DATE = todayIso(); return DAILY_DATE; }
function wdOf(iso) { const w = isoToDate(iso).getUTCDay(); return w <= 4 ? w : -1; }
function hijriOf(iso) { const [y, m, d] = toHijri(iso); return `${d}/${m}/${y}`; }
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
function absentSet(iso) { return new Set(((D().wait[iso] || {}).blocks || []).map(b => normName(b.abs)).filter(Boolean)); }
function subsAt(iso, p, skip) { const out = {}; ((D().wait[iso] || {}).blocks || []).forEach((b, bi) => { const r = b.rows && b.rows[p]; if (r && r.t && !(skip && skip[0] === bi)) out[normName(r.t)] = (out[normName(r.t)] || 0) + 1; }); return out; }
function waitLoad(iso) { const m = {}; ((D().wait[iso] || {}).blocks || []).forEach(b => Object.values(b.rows || {}).forEach(r => { if (r && r.t) m[normName(r.t)] = (m[normName(r.t)] || 0) + 1; })); return m; }
function weekLoad() { const r = statRange('t'); return loadIn(r[0], r[1]); }
function subIssue(iso, bi, p, name) {
  if (!name) return ''; const d = wdOf(iso), k = normName(name);
  if (absentSet(iso).has(k)) return 'غائب اليوم';
  const sc = d >= 0 ? ttCell(name, d, p) : ''; if (sc) return `لديه حصة في نفس الوقت (ش ${sc})`;
  if ((subsAt(iso, p, [bi])[k] || 0) > 0) return 'مكلف بانتظار آخر في نفس الحصة';
  return '';
}
function subOptsFor(iso, bi, p) {
  const d = wdOf(iso), abs = absentSet(iso), taken = subsAt(iso, p, [bi]), load = waitLoad(iso), wk = weekLoad();
  const names = ttNames(); const free = [], busy = [], away = [];
  names.forEach(n => { const k = normName(n); if (abs.has(k)) away.push(n); else if ((d >= 0 && ttCell(n, d, p)) || taken[k]) busy.push(n); else free.push(n); });
  return [{ label: `✓ متاحون في الحصة ${p} (${free.length})`, items: free }, { label: '⚠ لديهم حصة أو انتظار في نفس الوقت', items: busy }, { label: '✕ غائبون اليوم', items: away }];
}
function autoFill(iso) {
  const w = W(iso), d = wdOf(iso); let n = 0;
  w.blocks.forEach((b, bi) => { for (let p = 1; p <= 7; p++) { if (!(d >= 0 && ttCell(b.abs, d, p))) continue; b.rows = b.rows || {}; const r = b.rows[p] = b.rows[p] || {}; if (r.t) continue;
    const ld = waitLoad(iso), wk = weekLoad(); const gr = rowGrade(iso, b, p); const g = subOptsFor(iso, bi, p)[0].items.slice().sort((a, b) => (teachesGrade(b, gr) - teachesGrade(a, gr)) || (ld[normName(a)] || 0) - (ld[normName(b)] || 0) || (wk[normName(a)] || 0) - (wk[normName(b)] || 0) || AR.compare(normName(a), normName(b))); if (g.length) { r.t = g[0]; n++; } } });
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
function dutyOptsWd(wd) { const p7 = [], here = [], none = []; ttNames().forEach(n => { if (has7(n, wd)) p7.push(n); else if (ttDayLoad(n, wd)) here.push(n); else none.push(n); });
  return [{ label: `⑦ لديهم ${lastLbl(wd)} يوم ${TT_DAYS[wd]} (${p7.length})`, items: p7 }, { label: 'متواجدون ذلك اليوم', items: here }, { label: 'ليس لديهم حصص ذلك اليوم', items: none }]; }
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
    return `<tr><td><b>${TT_DAYS[wd]}</b></td>${t.duty.slice(0, Math.max(n, t.duty.length)).map((r, j) => `<td>${pickSel(`daily.week.${wd}.duty.${j}.n`, r.n || '', opt, { ph: '— اختر —' })}${r.n && D().tt && !has7(r.n, wd) ? `<span class="cf">⚠ ليس لديه الحصة الأخيرة</span>` : ''}</td>`).join('')}</tr>`; }).join('');
  return `<section class="card wkduty"><h2>جدول المناوبة الأسبوعي الثابت</h2>
    <div class="acts wrap"><button class="btn pri" data-act="dWeekAuto" type="button">⑦ توزيع عادل على أيام الأسبوع</button><button class="btn ghost" data-act="dWeekClr" type="button">مسح الجدول</button></div>
    <div class="tw"><table class="et wkt"><tr><th style="width:80px">اليوم</th>${Array.from({ length: n }, (_, j) => `<th>المناوب ${j + 1}</th>`).join('')}</tr>${rows}</table></div></section>`;
}
function dutyRep(iso, j) {
  const u = D().duty[iso] = U(iso), d = wdOf(iso), abs = absentSet(iso), [a, b] = statRange('t');
  const used = new Set(); (u.b || []).forEach(x => { if (x.gen) used.add(normName(x.gen)); (x.rows || []).forEach(r => r.n && used.add(normName(r.n))); }); u.duty.forEach(r => r.n && used.add(normName(r.n)));
  const c = ttNames().filter(n => has7(n, d) && !abs.has(normName(n)) && !used.has(normName(n))).sort((x, y) => dutyCount(x, a, b) - dutyCount(y, a, b) || AR.compare(normName(x), normName(y)))[0];
  if (!c) return ''; const old = u.duty[j].n; u.duty[j].n = c; u.duty[j].note = old ? `بدلاً عن ${old}` : ''; return c;
}
function dutyIssue(iso, name, where) {
  if (!name) return ''; const k = normName(name);
  if (absentSet(iso).has(k)) return 'غائب اليوم';
  const u = U(iso); let c = 0; u.b.forEach(b => { if (normName(b.gen) === k) c++; b.rows.forEach(r => { if (normName(r.n) === k) c++; }); });
  if (where === 'b' && c > 1) return 'مكلف بأكثر من موقع إشراف';
  const d = wdOf(iso); if (d >= 0 && D().tt && ttRow(name) && !ttDayLoad(name, d)) return 'ليس لديه حصص اليوم';
  return '';
}
function dutyOpts(iso) {
  const d = wdOf(iso), abs = absentSet(iso), names = ttNames(); const p7 = [], here = [], none = [], away = [];
  names.forEach(n => { const k = normName(n); if (abs.has(k)) away.push(n); else if (d >= 0 && D().tt && has7(n, d)) p7.push(n); else if (d < 0 || !D().tt || ttDayLoad(n, d)) here.push(n); else none.push(n); });
  const g = [];
  if (p7.length) g.push({ label: `⑦ لديهم ${lastLbl(d)} اليوم — الأولى بالمناوبة (${p7.length})`, items: p7 });
  g.push({ label: `✓ متواجدون اليوم حسب الجدول (${here.length})`, items: here }, { label: 'ليس لديهم حصص اليوم', items: none }, { label: '✕ غائبون اليوم', items: away });
  return g;
}
function dutyCount(name, a, b) { let n = 0; const k = normName(name); Object.entries(D().duty).forEach(([iso, u]) => { if (iso < a || iso > b) return; (u.duty || []).forEach(r => { if (r.n && normName(r.n) === k) n++; }); }); return n; }
function autoDuty(iso) {
  const d = wdOf(iso); if (d < 0 || !D().tt) return -1; const u = D().duty[iso] = U(iso), abs = absentSet(iso);
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
var ABSG_OPEN = true;
function mainGrade(n) { const r = ttRow(n); if (!r) return 0; const c = { 1: 0, 2: 0, 3: 0 }; Object.values(r.c).forEach(v => String(v).split(/[^0-9]+/).filter(Boolean).forEach(x => { const g = secGrade(x); if (g) c[g]++; })); const g = [1, 2, 3].sort((a, b) => c[b] - c[a])[0]; return c[g] ? g : 0; }
function absGrid(iso) {
  const d = wdOf(iso); if (!tt0()) return `<div class="acts wrap">${pickSel(`daily.ui.addAbs`, '', [{ items: ttNames().filter(n => !absentSet(iso).has(normName(n))) }], { ph: '+ إضافة معلم غائب' })}</div>`;
  const abs = absentSet(iso), names = ttNames().slice().sort((a, b) => AR.compare(normName(a), normName(b)));
  const grp = { 1: [], 2: [], 3: [], 0: [] }; names.forEach(n => grp[mainGrade(n)].push(n));
  const chip = n => { const on = abs.has(normName(n)), c = d >= 0 ? ttDayLoad(n, d) : 0, lv = leaveOf(iso, n);
    return `<button type="button" class="achip${on ? ' on' : ''}${c ? '' : ' zero'}" data-act="wAbs" data-n="${esc(n)}" aria-pressed="${on}">${lv ? '🕘 ' : ''}${esc(n)}<i>${c}</i></button>`; };
  const nAbs = (D().wait[iso] || { blocks: [] }).blocks.length;
  return `<details class="absg"${ABSG_OPEN || !nAbs ? ' open' : ''} ontoggle="ABSG_OPEN=this.open"><summary><b>من غاب اليوم؟</b> <span>${nAbs ? `${nAbs} غائب` : 'المس الاسم'}</span><button type="button" class="hlp" data-help="المس اسم الغائب فتظهر حصصه لهذا اليوم، والمسه ثانية للإلغاء. الرقم = حصصه اليوم." aria-label="شرح">؟</button></summary>

    ${[1, 2, 3, 0].filter(g => grp[g].length).map(g => `<div class="agrp"><small class="wgl g${g}">${g ? 'معلمو ' + GSHORT[g] + ' ثانوي' : 'آخرون'}</small><div class="wchips">${grp[g].map(chip).join('')}</div></div>`).join('')}</details>`;
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
function vWait(iso) {
  const w = D().wait[iso] || { blocks: [] }, d = wdOf(iso);
  const blocks = w.blocks.map((b, bi) => {
    const rows = []; for (let p = 1; p <= 7; p++) {
      const sc = d >= 0 ? ttSecs(b.abs, d, p) : [], has = sc.length > 0 || !tt0(), r = (b.rows || {})[p] || {}, iss = subIssue(iso, bi, p, r.t);
      rows.push(`<tr class="${has ? '' : 'nocls'}${iss ? ' bad' : ''}"><td class="pn">${p}</td><td>${sc.length ? [...new Set(sc.map(s => GSHORT[secGrade(s)] || ''))].join('/') : (has ? inp(`daily.wait.${iso}.blocks.${bi}.rows.${p}.g`, r.g || '', { ph: 'الفصل' }) : '—')}</td><td>${sc.length ? sc.join('، ') : (has ? inp(`daily.wait.${iso}.blocks.${bi}.rows.${p}.s`, r.s || '', { ph: 'الشعبة' }) : '')}</td>
        <td>${has ? waitChips(iso, bi, p, r) + (iss ? `<span class="cf">⚠ ${esc(iss)}</span>` : '') : '<span class="hint">لا حصة</span>'}</td>
        <td>${has ? inp(`daily.wait.${iso}.blocks.${bi}.rows.${p}.note`, r.note || '', { ph: 'ما تم تنفيذه' }) : ''}</td></tr>`);
    }
    const n = d >= 0 ? [1, 2, 3, 4, 5, 6, 7].filter(p => ttCell(b.abs, d, p)).length : 0;
    return `<article class="wblk"><header><span>نظراً لغياب الزميل:</span>${pickSel(`daily.wait.${iso}.blocks.${bi}.abs`, b.abs || '', [{ items: ttNames() }], { ph: '— اختر المعلم الغائب —' })}<small>${b.abs ? (tt0() ? `${n} حصص اليوم` : '') : ''}</small><button class="x" data-act="wDel" data-v="${bi}" type="button" aria-label="حذف">×</button></header>${b.abs ? leaveCtl(iso, b, bi) : ''}
      <div class="tw"><table class="et wtab"><tr><th style="width:52px">الحصة</th><th style="width:70px">الفصل</th><th style="width:80px">الشعبة</th><th>المعلم المنتظر</th><th>ما تم تنفيذه</th></tr>${rows.join('')}</table></div></article>`;
  }).join('');
  const issues = w.blocks.reduce((a, b, bi) => a + [1, 2, 3, 4, 5, 6, 7].filter(p => subIssue(iso, bi, p, ((b.rows || {})[p] || {}).t)).length, 0);
  const empty = w.blocks.reduce((a, b, bi) => a + [1, 2, 3, 4, 5, 6, 7].filter(p => d >= 0 && ttCell(b.abs, d, p) && !((b.rows || {})[p] || {}).t).length, 0);
  return `<section class="card"><h2>استمارة حصص الانتظار — ${dayAr(iso)} ${hijriOf(iso)} هـ</h2>

    ${d >= 0 && !holOf(iso) ? absGrid(iso) : ''}
    <div class="acts wrap">${w.blocks.length ? `<button class="btn" data-act="wAuto" type="button">تعبئة تلقائية للمتاحين</button>` : ''}
      <span class="sp1"></span><button class="btn pri" data-act="dPrint" data-v="wait" type="button">معاينة وطباعة</button><button class="btn" data-act="dPdf" data-v="wait" type="button">PDF</button><button class="btn" data-act="dWord" data-v="wait" type="button">Word</button><button class="btn" data-act="dXls" data-v="wait" type="button">Excel</button></div>
    ${w.blocks.length ? `<div class="wsum"><span><b>${w.blocks.length}</b> غائب</span><span><b>${w.blocks.reduce((a, b) => a + Object.values(b.rows || {}).filter(r => r && r.t).length, 0)}</b> حصة مسددة</span>${empty ? `<span class="warn"><b>${empty}</b> بلا منتظر</span>` : ''}${issues ? `<span class="bad"><b>${issues}</b> تعارض</span>` : ''}</div>` : '<p class="hint" style="margin-top:10px">لا يوجد غائبون مسجلون لهذا اليوم. يمكنك طباعة استمارة فارغة.</p>'}
    <div class="wblks">${blocks}</div></section>`;
}
function tt0() { return !!D().tt; }
/* اختيار المنتظر بلمسة: المتاحون في الحصة نفسها أمامك مباشرة، مرتبين هجائياً، والأقل انتظاراً مميزون */
function waitChips(iso, bi, p, r) {
  const path = `daily.wait.${iso}.blocks.${bi}.rows.${p}.t`;
  if (r.t) return `<div class="wpick done"><span class="wname">${esc(r.t)}</span><button class="btn sm ghost" data-act="wClr" data-bi="${bi}" data-p="${p}" type="button">تغيير</button></div>`;
  const g = subOptsFor(iso, bi, p), all = g[0].items.slice().sort((a, b) => AR.compare(normName(a), normName(b)));
  if (!tt0()) return pickSel(path, '', g, { ph: '— اختر المنتظر —' });
  const gr = rowGrade(iso, D().wait[iso].blocks[bi], p), same = gr ? all.filter(n => teachesGrade(n, gr)) : [], rest = all.filter(n => !same.includes(n));
  const ld = waitLoad(iso), wk = weekLoad(), sc = n => (ld[normName(n)] || 0) * 100 + (wk[normName(n)] || 0);
  const pool = same.length ? same : all, sug = new Set(pool.slice().sort((a, b) => sc(a) - sc(b) || AR.compare(normName(a), normName(b))).slice(0, 3));
  const chip = n => `<button type="button" class="wchip${sug.has(n) ? ' sug' : ''}${same.includes(n) ? ' sg g' + gr : ''}" data-act="wSet" data-bi="${bi}" data-p="${p}" data-n="${esc(n)}"${sug.has(n) ? ' title="الأقل انتظاراً"' : ''}>${esc(n)}</button>`;
  return `<div class="wpick">${all.length ? `${same.length ? `<small class="wgl g${gr}">① معلمو ${GSHORT[gr]} ثانوي المتاحون (${same.length})</small><div class="wchips">${same.map(chip).join('')}</div>` : ''}
    ${rest.length ? (same.length ? `<details class="wrest"><summary>② بقية المتاحين (${rest.length}) — عرض</summary><div class="wchips">${rest.map(chip).join('')}</div></details>` : `<small class="wgl">المتاحون في الحصة ${p} (${rest.length})</small><div class="wchips">${rest.map(chip).join('')}</div>`) : ''}` : '<span class="hint">لا يوجد متاح في هذه الحصة</span>'}
    <details class="wother"><summary>اسم آخر…</summary>${pickSel(path, '', g, { ph: '— كل المعلمين —' })}</details></div>`;
}
function vDuty(iso) {
  const u = U(iso), cfg = D().cfg, saved = !!D().duty[iso], P = `daily.duty.${iso}`, opt = dutyOpts(iso);
  const sel = (path, v, where) => { const is = dutyIssue(iso, v, where); return pickSel(path, v, opt, { ph: '— اختر —' }) + (is ? `<span class="cf">⚠ ${esc(is)}</span>` : ''); };
  const blocks = cfg.b.map((b, i) => `<article class="dblk"><header><b>${esc(b.t)}</b><small>(${esc(b.g)})</small><label class="inl">المشرف العام ${sel(`${P}.b.${i}.gen`, u.b[i] && u.b[i].gen, 'g')}</label></header>
    <div class="tw"><table class="et"><tr><th style="width:40px">م</th><th>اسم المشرف</th><th style="width:30%">الجهة</th><th>الملاحظات</th></tr>${(u.b[i] ? u.b[i].rows : []).map((r, j) => `<tr><td>${j + 1}</td><td>${sel(`${P}.b.${i}.rows.${j}.n`, r.n, 'b')}</td><td>${inp(`${P}.b.${i}.rows.${j}.loc`, r.loc || '')}</td><td>${inp(`${P}.b.${i}.rows.${j}.note`, r.note || '')}</td></tr>`).join('')}</table></div>
    <div class="acts"><button class="btn sm ghost" data-act="dRow" data-v="${i}" type="button">+ موقع إشراف</button></div></article>`).join('');
  const duty = `<article class="dblk"><header><b>المناوبة</b><small>الموظفون المناوبون</small></header><div class="tw"><table class="et"><tr><th style="width:40px">م</th><th>اسم الموظف المناوب</th><th>ملحوظات</th></tr>${u.duty.map((r, j) => `<tr><td>${j + 1}</td><td>${sel(`${P}.duty.${j}.n`, r.n, 'd')}${r.n && absentSet(iso).has(normName(r.n)) ? `<button class="btn sm" data-act="dDutyRep" data-j="${j}" type="button">↺ بديل من أصحاب الحصة الأخيرة</button>` : ''}</td><td>${inp(`${P}.duty.${j}.note`, r.note || '')}</td></tr>`).join('')}</table></div><div class="acts"><button class="btn sm pri" data-act="dAutoDuty" type="button">⑦ تعبئة تلقائية من أصحاب الحصة الأخيرة</button><button class="btn sm ghost" data-act="dRow" data-v="duty" type="button">+ مناوب</button></div></article>`;
  return `<section class="card"><h2>تقرير الإشراف والمناوبة اليومي — ${dayAr(iso)} ${hijriOf(iso)} هـ</h2>

    <div class="acts wrap"><button class="btn pri" data-act="dPrint" data-v="duty" type="button">معاينة وطباعة</button><button class="btn" data-act="dPdf" data-v="duty" type="button">PDF</button><button class="btn" data-act="dWord" data-v="duty" type="button">Word</button><span class="sp1"></span>
      <button class="btn" data-act="dWeek" type="button">حفظ كجدول ثابت لكل يوم ${wdOf(iso) >= 0 ? TT_DAYS[wdOf(iso)] : ''}</button>${saved ? '<button class="btn ghost" data-act="dReset" type="button">مسح تعبئة هذا اليوم</button>' : ''}</div>
    <div class="dblks">${blocks}${duty}</div>
    <details class="sub"><summary>إعدادات النموذج (الفسح والمواقع)</summary><div class="grid2">${cfg.b.map((b, i) => `<label>اسم ${i + 1} ${inp(`daily.cfg.b.${i}.t`, b.t)}</label><label>الصفوف ${inp(`daily.cfg.b.${i}.g`, b.g)}</label>`).join('')}<label>رقم النموذج ${inp('daily.cfg.no', cfg.no)}</label><label>رمز النموذج ${inp('daily.cfg.code', cfg.code)}</label></div></details>
  </section>${vWeekDuty()}`;
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
  (D().wait[iso] || { blocks: [] }).blocks.forEach(b => { if (!b.abs) return; for (let p = 1; p <= 7; p++) { const sc = d >= 0 ? ttSecs(b.abs, d, p) : [], r = (b.rows || {})[p] || {}; if (!sc.length && !r.t && !r.g && !r.s) continue;
    out.push({ p, g: rowGrade(iso, b, p), sec: sc.length ? sc.join('، ') : (r.s || ''), abs: b.abs, t: r.t || '', note: r.note || '' }); } });
  return out.sort((a, b) => a.p - b.p || AR.compare(normName(a.abs), normName(b.abs)));
}
const ORD = ['أولاً', 'ثانياً', 'ثالثاً', 'رابعاً'];
function waitPages(iso) {
  const rows = waitRows(iso), all = (D().wait[iso] || { blocks: [] }).blocks.filter(b => b.abs).map(b => b.abs);
  const intro = `<p class="wl">إخواني المعلمين / نظراً لغياب ${all.length > 1 ? 'الزملاء' : 'الزميل'} هذا اليوم <b>${dayAr(iso)}</b> الموافق <b>${hijriOf(iso)} هـ</b>، آمل تسديد الحصص حسب الجدول الموضح لكل صف والتوقيع بالعلم، ولكم جزيل الشكر.</p>`;
  const hd = [H('الحصة', { w: '8%' }), H('الشعبة', { w: '9%' }), H('المعلم الغائب', { w: '20%' }), H('المعلم المنتظر', { w: '22%' }), H('ما تم تنفيذه في حصة الانتظار'), H('التوقيع', { w: '12%' })];
  const secs = [1, 2, 3, 0].map(g => ({ g, rows: rows.filter(r => r.g === g) })).filter(x => x.rows.length);
  const head = (x, k, cont) => { const ab = [...new Set(x.rows.map(r => r.abs))]; return [{ v: `<b>${ORD[k] || ''}: ${x.g ? GNAME[x.g] : 'حصص أخرى'}${cont ? ' (تابع)' : ''}</b> &nbsp;—&nbsp; نظراً لغياب ${ab.length > 1 ? 'الزملاء' : 'الزميل'}: <b>${ab.map(esc).join('، ')}</b>`, cs: 6, al: 'right', bg: GCOL[x.g] || '#eeeeee' }]; };
  const line = r => [`<b>${r.p}</b>`, esc(r.sec), esc(r.abs), `<b>${esc(r.t)}</b>`, esc(r.note), ''];
  const ttl = () => title('استمارة حصص الانتظار', `${dayAr(iso)} ${hijriOf(iso)} هـ`);
  if (!secs.length) return [ttl() + intro + T([hd, ...Array.from({ length: 14 }, () => ['', '', '', '', '', ''])], { cls: 'dense' }) + sp(10) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep]])];
  const CAP = 24, pages = []; let top = ttl() + intro, body = '', used = 2;
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
  const out = []; const per = 34; for (let i = 0; i < rows.length; i += per) out.push(title((t === D().ttNext ? 'جدول الفصل القادم' : 'الجدول المدرسي العام') + ' — يوم ' + TT_DAYS[dd]) + T([hd, ...rows.slice(i, i + per)], { cls: 'dense' }));
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
  if (a === 'wDel') { const bl = W(iso).blocks[+b.dataset.v], l = bl && (leaveOf(iso, bl.abs)); if (l) { if (await confirmBox(`${bl.abs} مسجل غائباً لعدة أيام حتى ${dayAr(l.b)} ${hijriOf(l.b)}. إزالته من اليوم وما بعده (عاد للعمل)؟`)) { endLeave(l, iso); save(); render(); } return; } if (await confirmBox('حذف هذا المعلم الغائب واستمارته لهذا اليوم؟')) { W(iso).blocks.splice(+b.dataset.v, 1); save(); render(); } return; }
  if (a === 'wAbs') { const n = b.dataset.n, w = W(iso), i = w.blocks.findIndex(x => normName(x.abs) === normName(n));
    if (i < 0) { w.blocks.push({ abs: n, rows: {} }); save(); render(); setTimeout(() => { const el = document.querySelectorAll('.wblk')[w.blocks.length - 1]; if (el && window.innerWidth < 700) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); return; }
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
  if (a === 'dDutyRep') { const c = dutyRep(iso, +b.dataset.j); save(); render(); return toast(c ? `${c} بدلاً عن الغائب ✓` : 'لا يوجد بديل متاح من أصحاب الحصة الأخيرة', !c); }
  if (a === 'dAutoDuty') { const n = autoDuty(iso); save(); render(); return toast(n < 0 ? 'ارفع الجدول المدرسي أولاً' : n ? `عُبّئ ${n} مناوب من أصحاب الحصة الأخيرة (الأقل مناوبةً أولاً)` : 'لا توجد خانات فارغة أو لا يوجد متاح من أصحاب الحصة الأخيرة'); }
  if (a === 'dRow') { const u = D().duty[iso] = U(iso); if (b.dataset.v === 'duty') u.duty.push({ n: '', note: '' }); else u.b[+b.dataset.v].rows.push({ n: '', loc: '', note: '' }); save(); return render(); }
  if (a === 'dWeek') { const w = wdOf(iso); if (w < 0) return toast('اختر يوماً دراسياً', true); D().week[w] = clone(U(iso)); save(); return toast(`حُفظ كجدول ثابت — سيُعبّأ تلقائياً في كل يوم ${TT_DAYS[w]}`); }
  if (a === 'dReset') { if (await confirmBox('مسح تعبئة المناوبة لهذا اليوم؟')) { delete D().duty[iso]; save(); render(); } return; }
  if (a === 'dPrint' || a === 'dPdf' || a === 'dWord' || a === 'dXls') {
    const k = b.dataset.v, g = dailyGroups(k), nm = dailyName(k); if (!g[0].pages.length) return toast('لا توجد بيانات', true);
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
