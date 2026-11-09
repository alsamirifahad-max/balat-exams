/* =====================================================================
   الأعمال اليومية: الجدول المدرسي العام، حصص الانتظار، الإشراف والمناوبة
   ===================================================================== */
var DAILY_DATE = null, DAILY_TAB = 'wait', TT_DAY = null;
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
function weekLoad() { const m = {}; Object.values(D().wait).forEach(w => (w.blocks || []).forEach(b => Object.values(b.rows || {}).forEach(r => { if (r && r.t) m[normName(r.t)] = (m[normName(r.t)] || 0) + 1; }))); return m; }
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
  free.sort((a, b) => (load[normName(a)] || 0) - (load[normName(b)] || 0) || (wk[normName(a)] || 0) - (wk[normName(b)] || 0) || AR.compare(a, b));
  return [{ label: `✓ متاحون في الحصة ${p} (${free.length}) — الأقل انتظاراً أولاً`, items: free }, { label: '⚠ لديهم حصة أو انتظار في نفس الوقت', items: busy }, { label: '✕ غائبون اليوم', items: away }];
}
function autoFill(iso) {
  const w = W(iso), d = wdOf(iso); let n = 0;
  w.blocks.forEach((b, bi) => { for (let p = 1; p <= 7; p++) { if (!(d >= 0 && ttCell(b.abs, d, p))) continue; b.rows = b.rows || {}; const r = b.rows[p] = b.rows[p] || {}; if (r.t) continue;
    const g = subOptsFor(iso, bi, p)[0].items; if (g.length) { r.t = g[0]; n++; } } });
  return n;
}

/* ---------- المناوبة ---------- */
function U(iso) {
  const all = D().duty; if (all[iso]) return all[iso];
  const cfg = D().cfg, wk = D().week[wdOf(iso)];
  const blank = { b: cfg.b.map(b => ({ gen: '', rows: b.locs.map(l => ({ n: '', loc: l, note: '' })) })), duty: Array.from({ length: cfg.dutyRows || 3 }, () => ({ n: '', note: '' })), sem: S.s.sem };
  return wk ? Object.assign(clone(wk), { sem: S.s.sem }) : blank;
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
  const d = wdOf(iso), abs = absentSet(iso), names = ttNames(); const here = [], none = [], away = [];
  names.forEach(n => { const k = normName(n); if (abs.has(k)) away.push(n); else if (d < 0 || !D().tt || ttDayLoad(n, d)) here.push(n); else none.push(n); });
  return [{ label: `✓ متواجدون اليوم حسب الجدول (${here.length})`, items: here }, { label: 'ليس لديهم حصص اليوم', items: none }, { label: '✕ غائبون اليوم', items: away }];
}

/* ---------- الصفحة ---------- */
function vDaily() {
  const iso = dIso(), d = wdOf(iso), tt = D().tt;
  const bar = `<section class="card dbar"><div class="dnav"><button class="btn sm" data-act="dDay" data-v="-1" type="button" aria-label="اليوم السابق">→</button>
    <label class="ddate"><input type="date" class="in" id="dDate" value="${iso}"><b>${dayAr(iso)}</b><span>${hijriOf(iso)} هـ</span></label>
    <button class="btn sm" data-act="dDay" data-v="1" type="button" aria-label="اليوم التالي">←</button>${iso !== todayIso() ? '<button class="btn sm pri" data-act="dDay" data-v="0" type="button">اليوم</button>' : '<em class="tdy now">اليوم</em>'}</div>
    ${d < 0 ? '<p class="al warn">هذا اليوم عطلة نهاية الأسبوع.</p>' : ''}${tt ? '' : `<p class="al warn">لم يُرفع الجدول المدرسي العام بعد — ارفعه من «الملفات الأساسية» لتظهر الحصص والمتاحون تلقائياً. <button class="btn sm" data-tab="files" type="button">رفع الجدول</button></p>`}
    <div class="dtabs" role="tablist">${[['wait', 'حصص الانتظار'], ['duty', 'الإشراف والمناوبة'], ['tt', 'الجدول المدرسي'], ['log', 'السجل والإحصاء']].map(([k, t]) => `<button type="button" role="tab" class="${DAILY_TAB === k ? 'on' : ''}" data-act="dTab" data-v="${k}" aria-selected="${DAILY_TAB === k}">${t}</button>`).join('')}</div></section>`;
  return bar + ({ wait: vWait, duty: vDuty, tt: vTT, log: vLog })[DAILY_TAB](iso);
}
function vWait(iso) {
  const w = D().wait[iso] || { blocks: [] }, d = wdOf(iso);
  const blocks = w.blocks.map((b, bi) => {
    const rows = []; for (let p = 1; p <= 7; p++) {
      const sc = d >= 0 ? ttSecs(b.abs, d, p) : [], has = sc.length > 0 || !tt0(), r = (b.rows || {})[p] || {}, iss = subIssue(iso, bi, p, r.t);
      rows.push(`<tr class="${has ? '' : 'nocls'}${iss ? ' bad' : ''}"><td class="pn">${p}</td><td>${sc.length ? [...new Set(sc.map(s => GSHORT[secGrade(s)] || ''))].join('/') : (has ? inp(`daily.wait.${iso}.blocks.${bi}.rows.${p}.g`, r.g || '', { ph: 'الفصل' }) : '—')}</td><td>${sc.length ? sc.join('، ') : (has ? inp(`daily.wait.${iso}.blocks.${bi}.rows.${p}.s`, r.s || '', { ph: 'الشعبة' }) : '')}</td>
        <td>${has ? pickSel(`daily.wait.${iso}.blocks.${bi}.rows.${p}.t`, r.t || '', subOptsFor(iso, bi, p), { ph: '— اختر المنتظر —' }) + (iss ? `<span class="cf">⚠ ${esc(iss)}</span>` : '') : '<span class="hint">لا حصة</span>'}</td>
        <td>${has ? inp(`daily.wait.${iso}.blocks.${bi}.rows.${p}.note`, r.note || '', { ph: 'ما تم تنفيذه' }) : ''}</td></tr>`);
    }
    const n = d >= 0 ? [1, 2, 3, 4, 5, 6, 7].filter(p => ttCell(b.abs, d, p)).length : 0;
    return `<article class="wblk"><header><span>نظراً لغياب الزميل:</span>${pickSel(`daily.wait.${iso}.blocks.${bi}.abs`, b.abs || '', [{ items: ttNames() }], { ph: '— اختر المعلم الغائب —' })}<small>${b.abs ? (tt0() ? `${n} حصص اليوم` : '') : ''}</small><button class="x" data-act="wDel" data-v="${bi}" type="button" aria-label="حذف">×</button></header>
      <div class="tw"><table class="et wtab"><tr><th style="width:52px">الحصة</th><th style="width:70px">الفصل</th><th style="width:80px">الشعبة</th><th>المعلم المنتظر</th><th>ما تم تنفيذه</th></tr>${rows.join('')}</table></div></article>`;
  }).join('');
  const issues = w.blocks.reduce((a, b, bi) => a + [1, 2, 3, 4, 5, 6, 7].filter(p => subIssue(iso, bi, p, ((b.rows || {})[p] || {}).t)).length, 0);
  const empty = w.blocks.reduce((a, b, bi) => a + [1, 2, 3, 4, 5, 6, 7].filter(p => d >= 0 && ttCell(b.abs, d, p) && !((b.rows || {})[p] || {}).t).length, 0);
  return `<section class="card"><h2>استمارة حصص الانتظار — ${dayAr(iso)} ${hijriOf(iso)} هـ</h2>
    <p class="hint">أضف المعلم الغائب فتظهر حصصه وشعبه لهذا اليوم من الجدول المدرسي، ثم اختر المنتظر: القائمة تعرض <b>المتاحين في تلك الحصة بالضبط</b> (الأقل انتظاراً أولاً)، وينبّهك النظام عند أي تعارض.</p>
    <div class="acts wrap">${pickSel(`daily.ui.addAbs`, '', [{ items: ttNames().filter(n => !absentSet(iso).has(normName(n))) }], { ph: '+ إضافة معلم غائب' })}
      ${w.blocks.length ? `<button class="btn" data-act="wAuto" type="button">تعبئة تلقائية للمتاحين</button>` : ''}
      <span class="sp1"></span><button class="btn pri" data-act="dPrint" data-v="wait" type="button">معاينة وطباعة</button><button class="btn" data-act="dPdf" data-v="wait" type="button">PDF</button><button class="btn" data-act="dWord" data-v="wait" type="button">Word</button><button class="btn" data-act="dXls" data-v="wait" type="button">Excel</button></div>
    ${w.blocks.length ? `<div class="wsum"><span><b>${w.blocks.length}</b> غائب</span><span><b>${w.blocks.reduce((a, b) => a + Object.values(b.rows || {}).filter(r => r && r.t).length, 0)}</b> حصة مسددة</span>${empty ? `<span class="warn"><b>${empty}</b> بلا منتظر</span>` : ''}${issues ? `<span class="bad"><b>${issues}</b> تعارض</span>` : ''}</div>` : '<p class="hint" style="margin-top:10px">لا يوجد غائبون مسجلون لهذا اليوم. يمكنك طباعة استمارة فارغة.</p>'}
    <div class="wblks">${blocks}</div></section>`;
}
function tt0() { return !!D().tt; }
function vDuty(iso) {
  const u = U(iso), cfg = D().cfg, saved = !!D().duty[iso], P = `daily.duty.${iso}`, opt = dutyOpts(iso);
  const sel = (path, v, where) => { const is = dutyIssue(iso, v, where); return pickSel(path, v, opt, { ph: '— اختر —' }) + (is ? `<span class="cf">⚠ ${esc(is)}</span>` : ''); };
  const blocks = cfg.b.map((b, i) => `<article class="dblk"><header><b>${esc(b.t)}</b><small>(${esc(b.g)})</small><label class="inl">المشرف العام ${sel(`${P}.b.${i}.gen`, u.b[i] && u.b[i].gen, 'g')}</label></header>
    <div class="tw"><table class="et"><tr><th style="width:40px">م</th><th>اسم المشرف</th><th style="width:30%">الجهة</th><th>الملاحظات</th></tr>${(u.b[i] ? u.b[i].rows : []).map((r, j) => `<tr><td>${j + 1}</td><td>${sel(`${P}.b.${i}.rows.${j}.n`, r.n, 'b')}</td><td>${inp(`${P}.b.${i}.rows.${j}.loc`, r.loc || '')}</td><td>${inp(`${P}.b.${i}.rows.${j}.note`, r.note || '')}</td></tr>`).join('')}</table></div>
    <div class="acts"><button class="btn sm ghost" data-act="dRow" data-v="${i}" type="button">+ موقع إشراف</button></div></article>`).join('');
  const duty = `<article class="dblk"><header><b>المناوبة</b><small>الموظفون المناوبون</small></header><div class="tw"><table class="et"><tr><th style="width:40px">م</th><th>اسم الموظف المناوب</th><th>ملحوظات</th></tr>${u.duty.map((r, j) => `<tr><td>${j + 1}</td><td>${sel(`${P}.duty.${j}.n`, r.n, 'd')}</td><td>${inp(`${P}.duty.${j}.note`, r.note || '')}</td></tr>`).join('')}</table></div><div class="acts"><button class="btn sm ghost" data-act="dRow" data-v="duty" type="button">+ مناوب</button></div></article>`;
  return `<section class="card"><h2>تقرير الإشراف والمناوبة اليومي — ${dayAr(iso)} ${hijriOf(iso)} هـ</h2>
    <p class="hint">القوائم تعرض أولاً المعلمين <b>المتواجدين اليوم حسب الجدول</b>، وتنبّه إلى الغائب أو المكلف بأكثر من موقع. ${saved ? '' : D().week[wdOf(iso)] ? 'عُبّئ من الجدول الثابت لهذا اليوم من الأسبوع.' : ''}</p>
    <div class="acts wrap"><button class="btn pri" data-act="dPrint" data-v="duty" type="button">معاينة وطباعة</button><button class="btn" data-act="dPdf" data-v="duty" type="button">PDF</button><button class="btn" data-act="dWord" data-v="duty" type="button">Word</button><span class="sp1"></span>
      <button class="btn" data-act="dWeek" type="button">حفظ كجدول ثابت لكل يوم ${wdOf(iso) >= 0 ? TT_DAYS[wdOf(iso)] : ''}</button>${saved ? '<button class="btn ghost" data-act="dReset" type="button">مسح تعبئة هذا اليوم</button>' : ''}</div>
    <div class="dblks">${blocks}${duty}</div>
    <details class="sub"><summary>إعدادات النموذج (الفسح والمواقع)</summary><div class="grid2">${cfg.b.map((b, i) => `<label>اسم ${i + 1} ${inp(`daily.cfg.b.${i}.t`, b.t)}</label><label>الصفوف ${inp(`daily.cfg.b.${i}.g`, b.g)}</label>`).join('')}<label>رقم النموذج ${inp('daily.cfg.no', cfg.no)}</label><label>رمز النموذج ${inp('daily.cfg.code', cfg.code)}</label></div></details>
  </section>`;
}
function vTT(iso) {
  const t = D().tt; if (!t) return `<section class="card empty"><h2>لم يُرفع الجدول المدرسي العام</h2><p class="hint">ارفعه من «الملفات الأساسية» بصيغة PDF أو Excel أو Word (تصدير برنامج الجدول aSc أو غيره).</p><button class="btn pri" data-tab="files" type="button">رفع الجدول</button></section>`;
  if (TT_DAY == null) TT_DAY = Math.max(0, wdOf(iso));
  const dd = TT_DAY, free = [1, 2, 3, 4, 5, 6, 7].map(p => t.teachers.filter(x => !x.c[dd + '-' + p]).length);
  return `<section class="card"><h2>الجدول المدرسي العام — ${esc(TT_DAYS[dd])}</h2>
    <div class="acts wrap"><div class="dtabs sm">${TT_DAYS.map((n, i) => `<button type="button" class="${i === dd ? 'on' : ''}" data-act="ttDay" data-v="${i}">${n}</button>`).join('')}</div><span class="sp1"></span><button class="btn pri" data-act="dPrint" data-v="tt" type="button">طباعة جدول اليوم</button><button class="btn" data-act="dPdf" data-v="tt" type="button">PDF</button><button class="btn" data-act="dXls" data-v="tt" type="button">Excel</button></div>
    <p class="hint">${t.teachers.length} معلماً — ${esc(t.src || '')}. الخانة الفارغة تعني أن المعلم متاح في تلك الحصة.</p>
    <div class="tw"><table class="et ttg"><tr><th>المعلم</th>${[1, 2, 3, 4, 5, 6, 7].map(p => `<th>${p}</th>`).join('')}<th>حصص</th></tr>${t.teachers.map(x => `<tr><td class="tn">${esc(x.n)}</td>${[1, 2, 3, 4, 5, 6, 7].map(p => { const v = x.c[dd + '-' + p]; return `<td class="${v ? 'g' + secGrade(String(v).split('،')[0]) : 'fr'}">${v ? esc(v) : ''}</td>`; }).join('')}<td>${ttDayLoad(x.n, dd)}</td></tr>`).join('')}
    <tr class="tot"><td>المتاحون</td>${free.map(f => `<td>${f}</td>`).join('')}<td></td></tr></table></div></section>`;
}
function vLog() {
  const ws = D().wait, us = D().duty; const dates = [...new Set([...Object.keys(ws).filter(k => (ws[k].blocks || []).length), ...Object.keys(us)])].sort().reverse();
  const wk = weekLoad(); const top = Object.entries(wk).sort((a, b) => b[1] - a[1]);
  const nm = k => (ttNames().find(n => normName(n) === k) || k);
  return `<section class="card"><h2>سجل الأيام</h2>${dates.length ? `<div class="tw"><table class="et"><tr><th>اليوم</th><th>التاريخ</th><th>الغائبون</th><th>حصص الانتظار</th><th>المناوبة</th><th></th></tr>${dates.map(k => { const w = ws[k] || { blocks: [] }; return `<tr><td>${dayAr(k)}</td><td>${hijriOf(k)}</td><td>${w.blocks.map(b => esc(b.abs || '')).join('، ') || '—'}</td><td>${w.blocks.reduce((a, b) => a + Object.values(b.rows || {}).filter(r => r && r.t).length, 0)}</td><td>${us[k] ? '✓' : '—'}</td><td><button class="btn sm" data-act="dOpen" data-v="${k}" type="button">فتح</button></td></tr>`; }).join('')}</table></div>` : '<p class="hint">لا توجد أيام مسجلة بعد.</p>'}</section>
  <section class="card"><h2>إحصاء حصص الانتظار لكل معلم</h2><p class="hint">لتوزيع عادل للانتظار — الأكثر أولاً.</p>
    <div class="acts"><button class="btn" data-act="dPrint" data-v="stats" type="button">معاينة وطباعة</button><button class="btn" data-act="dXls" data-v="stats" type="button">Excel</button></div>
    ${top.length ? `<div class="tw"><table class="et"><tr><th>م</th><th>المعلم</th><th>عدد حصص الانتظار</th></tr>${top.map(([k, v], i) => `<tr><td>${i + 1}</td><td>${esc(nm(k))}</td><td><b>${v}</b></td></tr>`).join('')}</table></div>` : '<p class="hint">لا توجد بيانات.</p>'}</section>`;
}

/* ---------- الطباعة ---------- */
function waitBlockHtml(iso, b) {
  const d = wdOf(iso), rows = [[H('الحصة', { w: '8%' }), H('الفصل', { w: '10%' }), H('الشعبة', { w: '10%' }), H('المعلم المنتظر', { w: '24%' }), H('ما تم تنفيذه في حصة الانتظار'), H('التوقيع', { w: '14%' })]];
  for (let p = 1; p <= 7; p++) { const sc = b && d >= 0 ? ttSecs(b.abs, d, p) : [], r = b && b.rows && b.rows[p] || {};
    rows.push([`<b>${p}</b>`, sc.length ? [...new Set(sc.map(s => GSHORT[secGrade(s)] || ''))].join('/') : esc(r.g || '/'), sc.length ? sc.join('، ') : esc(r.s || ''), esc(r.t || ''), esc(r.note || ''), '']); }
  return `<p class="wl">إخواني المعلمين / نظراً لغياب الزميل: <b>${b && b.abs ? esc(b.abs) : '..................................'}</b></p><p class="wl">هذا اليوم <b>${dayAr(iso)}</b> الموافق <b>${hijriOf(iso)} هـ</b>، آمل تسديد مكانه حسب الجدول الموضح والتوقيع بالعلم، ولكم جزيل الشكر.</p>` + T(rows, { cls: 'dense' });
}
function waitPages(iso) {
  const bl = (D().wait[iso] || { blocks: [] }).blocks.filter(b => b.abs); const list = bl.length ? bl : [null, null, null];
  const pages = []; for (let i = 0; i < list.length; i += 3) {
    const part = list.slice(i, i + 3);
    pages.push(title('استمارة حصص الانتظار', `${dayAr(iso)} ${hijriOf(iso)} هـ`) + part.map(b => waitBlockHtml(iso, b)).join(sp(8)) + sp(8) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep]]));
  }
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
  const t = D().tt; if (!t) return [];
  const rows = t.teachers.map((x, i) => [i + 1, { v: esc(x.n), al: 'right' }, ...[1, 2, 3, 4, 5, 6, 7].map(p => esc(x.c[dd + '-' + p] || '')), ttDayLoad(x.n, dd)]);
  const hd = [H('م', { w: '5%' }), H('المعلم', { w: '22%' }), ...[1, 2, 3, 4, 5, 6, 7].map(p => H('الحصة ' + p)), H('المجموع', { w: '8%' })];
  const out = []; const per = 34; for (let i = 0; i < rows.length; i += per) out.push(title('الجدول المدرسي العام — يوم ' + TT_DAYS[dd]) + T([hd, ...rows.slice(i, i + per)], { cls: 'dense' }));
  return out;
}
function statsPages() {
  const wk = weekLoad(); const top = Object.entries(wk).sort((a, b) => b[1] - a[1]); const nm = k => (ttNames().find(n => normName(n) === k) || k);
  return [title('إحصاء حصص الانتظار', yearLine()) + T([[H('م', { w: '8%' }), H('المعلم'), H('عدد حصص الانتظار', { w: '22%' })], ...top.map(([k, v], i) => [i + 1, { v: esc(nm(k)), al: 'right' }, `<b>${v}</b>`])]) + sp(10) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep]])];
}
function dailyGroups(kind) {
  const iso = dIso();
  if (kind === 'wait') return [{ land: false, pages: waitPages(iso), t: 'استمارة حصص الانتظار' }];
  if (kind === 'duty') return [{ land: false, pages: dutyPages(iso), t: 'تقرير الإشراف والمناوبة اليومي' }];
  if (kind === 'tt') return [{ land: false, pages: ttPages(TT_DAY == null ? Math.max(0, wdOf(iso)) : TT_DAY), t: 'الجدول المدرسي' }];
  return [{ land: false, pages: statsPages(), t: 'إحصاء حصص الانتظار' }];
}
function dailyName(kind) { const iso = dIso(); return fname(({ wait: 'استمارة حصص الانتظار', duty: 'تقرير الإشراف والمناوبة', tt: 'الجدول المدرسي - ' + TT_DAYS[TT_DAY == null ? Math.max(0, wdOf(iso)) : TT_DAY], stats: 'إحصاء حصص الانتظار' })[kind] + (kind === 'wait' || kind === 'duty' ? ' - ' + dayAr(iso) + ' ' + hijriOf(iso).replace(/\//g, '-') : '')); }

/* ---------- الأحداث ---------- */
document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act, iso = dIso();
  if (a === 'dTab') { DAILY_TAB = b.dataset.v; return render(); }
  if (a === 'dDay') { const v = +b.dataset.v; DAILY_DATE = v === 0 ? todayIso() : dateToIso(new Date(isoToDate(iso).getTime() + v * 864e5)); return render(); }
  if (a === 'dOpen') { DAILY_DATE = b.dataset.v; DAILY_TAB = 'wait'; return render(); }
  if (a === 'ttDay') { TT_DAY = +b.dataset.v; return render(); }
  if (a === 'wDel') { if (await confirmBox('حذف هذا المعلم الغائب واستمارته لهذا اليوم؟')) { W(iso).blocks.splice(+b.dataset.v, 1); save(); render(); } return; }
  if (a === 'wAuto') { const n = autoFill(iso); save(); render(); return toast(n ? `عُبّئت ${n} حصة بالمعلمين المتاحين الأقل انتظاراً` : 'لا توجد حصص فارغة تحتاج تعبئة'); }
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
