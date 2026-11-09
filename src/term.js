/* ===================== التقويم الدراسي والانتقال بين الفصلين ===================== */
var CAL_DEF = { y: '1448', t1: '2026-08-30', ex1a: '2027-01-03', ex1b: '2027-01-07', mida: '2027-01-08', midb: '2027-01-16', t2: '2027-01-17' };
var CAL_IMG = 'cal-1448.webp';
function CAL() { S.cal = S.cal || {}; Object.keys(CAL_DEF).forEach(k => { if (!S.cal[k]) S.cal[k] = CAL_DEF[k]; }); return S.cal; }
function calImgs() { const c = CAL(); return c.imgs && c.imgs.length ? c.imgs : (c.y === '1448' ? [{ src: CAL_IMG, w: 481, h: 681 }] : []); }
function daysTo(iso) { return Math.round((isoToDate(iso) - isoToDate(todayIso())) / 864e5); }
const WDN = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
function calTxt(iso) { if (!iso) return '—'; const d = isoToDate(iso); return `${WDN[d.getUTCDay()]} ${hijriOf(iso)}هـ (${d.getUTCDate()}/${d.getUTCMonth() + 1}/${d.getUTCFullYear()}م)`; }
function inT2() { return /الثاني|2/.test(S.s.sem || ''); }
function isAdmin() { return !ROLE || ROLE === 'admin'; }

/* ----- رفع التقويم: صورة أو PDF أو Word أو Excel ----- */
async function calUpload(file) {
  const buf = new Uint8Array(await file.arrayBuffer()); let imgs = [], txt = '', html = '';
  const asUrl = (b, type) => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(new Blob([b], { type })); });
  const isImg = /^image\//.test(file.type) || /\.(png|jpe?g|webp|gif|bmp|heic|heif)$/i.test(file.name);
  if (isImg) imgs.push(await imgToJpeg(await asUrl(buf, file.type || 'image/jpeg'), 1600));
  else if (buf[0] === 0x25 && buf[1] === 0x50) {
    await ensurePdfJs(); const pdf = await pdfjsLib.getDocument({ data: buf.slice(), isEvalSupported: false }).promise;
    for (let i = 1; i <= Math.min(4, pdf.numPages); i++) {
      const pg = await pdf.getPage(i); const vp0 = pg.getViewport({ scale: 1 }); const vp = pg.getViewport({ scale: 1600 / vp0.width });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
      await pg.render({ canvasContext: x, viewport: vp }).promise; imgs.push(await imgToJpeg(c.toDataURL('image/png'), 1600));
      try { txt += ' ' + (await pg.getTextContent()).items.map(t => t.str).join(' '); } catch (e) { }
    }
  } else if (buf[0] === 0xD0 && buf[1] === 0xCF && /\.doc$/i.test(file.name)) {
    txt = docBinaryRows(buf).map(r => r.join(' ')).join('\n');
  } else if (/\.docx$/i.test(file.name) || (buf[0] === 0x50 && /\.do[ct]x?$/i.test(file.name))) {
    const z = XLSX.CFB.read(buf, { type: 'array' });
    const media = z.FullPaths.map((p, i) => ({ p, f: z.FileIndex[i] })).filter(x => /word\/media\/.+\.(png|jpe?g|gif|bmp|webp)$/i.test(x.p) && x.f.content && x.f.content.length > 8000);
    for (const m of media.slice(0, 4)) { const ext = m.p.split('.').pop().toLowerCase(); imgs.push(await imgToJpeg(await asUrl(m.f.content, 'image/' + (ext === 'jpg' ? 'jpeg' : ext)), 1600)); }
    try { txt = docxRows(buf).map(r => r.join(' ')).join('\n'); } catch (e) { }
    if (!imgs.length && txt) html = txt.split('\n').map(l => `<p style="margin:2px 0">${esc(l)}</p>`).join('');
  } else if (/\.(xlsx|xls|csv)$/i.test(file.name)) {
    const wb = XLSX.read(buf, { type: 'array' }); const sh = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sh, { header: 1, defval: '' }).filter(r => r.some(c => String(c).trim()));
    txt = rows.map(r => r.join(' ')).join('\n');
    html = `<table class="et dense"><tbody>${rows.slice(0, 80).map(r => `<tr>${r.map(c => `<td>${esc(String(c))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  } else throw new Error('صيغة غير مدعومة — ارفع صورة أو PDF أو Word أو Excel');
  if (!imgs.length && !html) throw new Error('لم أجد في الملف صورة أو نصاً للتقويم');
  const c = CAL(); const found = calDetect(txt);
  c.imgs = imgs; c.html = html; c.src = file.name; c.at = stamp();
  Object.assign(c, found);
  S.uploads.cal = { name: file.name, at: stamp(), info: imgs.length ? `${imgs.length} صفحة` : 'نص' };
  const got = Object.keys(found);
  return `حُفظ التقويم الدراسي (${file.name}). ` + (got.includes('t2') ? `قرأت منه بداية الفصل الثاني: ${calTxt(c.t2)}.` : `بداية الفصل الثاني: ${calTxt(c.t2)} — راجِع التواريخ في البطاقة وعدّلها إن لزم.`);
}
/* استخراج التواريخ من نص التقويم (هجري أو ميلادي) */
function calDetect(txt) {
  const out = {}; if (!txt) return out; const t = toWestern(String(txt)).replace(/\s+/g, ' ');
  const dateAfter = (re) => {
    const m = re.exec(t); if (!m) return null; const seg = t.slice(m.index, m.index + 140);
    let d = /(14\d\d)\s*\/\s*(\d{1,2})\s*\/\s*(\d{1,2})/.exec(seg); if (d) { const iso = hijriToIso(+d[1], +d[2], +d[3]); if (iso) return iso; }
    d = /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(14\d\d)/.exec(seg); if (d) { const iso = hijriToIso(+d[3], +d[2], +d[1]); if (iso) return iso; }
    d = /(20\d\d)\s*[\/-]\s*(\d{1,2})\s*[\/-]\s*(\d{1,2})/.exec(seg); if (d) return `${d[1]}-${String(d[2]).padStart(2, '0')}-${String(d[3]).padStart(2, '0')}`;
    d = /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(20\d\d)/.exec(seg); if (d) return `${d[3]}-${String(d[2]).padStart(2, '0')}-${String(d[1]).padStart(2, '0')}`;
    return null;
  };
  const t2 = dateAfter(/(بداية|بدء|تبدأ)\s*(الدراسة)?\s*(لل|في\s*ال)?فصل\s*(الدراسي)?\s*الثاني/) || dateAfter(/العودة\s*(إلى|ل|لل)?\s*الدراسة/);
  if (t2) out.t2 = t2;
  const y = /(14\d\d)\s*هـ?\s*\/\s*14\d\d|للعام\s*(14\d\d)/.exec(t); if (y) out.y = y[1] || y[2];
  return out;
}

/* ----- بطاقة التقويم في صفحة الملفات ----- */
function calCard(n, noUp) {
  const c = CAL(), dd = daysTo(c.t2), imgs = calImgs();
  const when = inT2() ? 'النظام على الفصل الثاني' : dd > 0 ? `بعد ${dd} يوماً` : dd === 0 ? 'يبدأ اليوم' : 'بدأ';
  const field = (k, l) => `<label class="inl">${l} <input class="in" type="date" data-k="cal.${k}" value="${esc(c[k] || '')}"${noUp ? ' disabled' : ''}></label>`;
  return fileCard('cal', { n, c: '#b45309', t: 'التقويم الدراسي', d: 'مواعيد بداية الفصلين والاختبارات والإجازات — يُذكّرك بموعد الانتقال للفصل الثاني.', has: true, noUp,
    fmt: 'صورة أو PDF أو Word أو Excel', accept: 'image/*,.png,.jpg,.jpeg,.webp,.heic,.pdf,.docx,.doc,.xlsx,.xls,.csv',
    facts: `<b>${esc(c.y)} هـ</b><span>بداية الفصل الثاني</span><em>${calTxt(c.t2)} · ${when}</em>`,
    out: `${imgs.length || c.html ? '<button class="btn sm" data-tact="calView" type="button">عرض التقويم وطباعته</button>' : ''}<details class="caldates"><summary>التواريخ المعتمدة${noUp ? '' : ' (تعديل)'}</summary><div class="acts wrap">${field('t1', 'بداية الفصل الأول')}${field('ex1a', 'اختبارات الفصل الأول من')}${field('ex1b', 'إلى')}${field('mida', 'إجازة منتصف العام من')}${field('midb', 'إلى')}${field('t2', 'بداية الفصل الثاني')}${field('ex2a', 'اختبارات الفصل الثاني من')}${field('ex2b', 'إلى')}</div>${holEditor(noUp)}</details>` });
}
function calView() {
  const c = CAL(), imgs = calImgs();
  const pages = imgs.length ? imgs.map(im => `<p style="text-align:center;margin:0"><img src="${im.src}" alt="التقويم الدراسي" style="max-width:100%;max-height:245mm;height:auto"></p>`) : [c.html];
  openPreview([{ land: false, pages, t: 'التقويم الدراسي' }], fname('التقويم الدراسي ' + c.y));
}

/* ----- فحص جاهزية الفصل الثاني ----- */
function t2Check() {
  const a = secData('ta-agent') || {}, ta = a.ta || [], tt = inT2() ? (D().tt) : (D().ttNext || null);
  const tlist = (a.teachers && a.teachers.length ? a.teachers : S.teachers) || [];
  const R = { ta, tt, issues: [], ok: [], pct: 0 };
  const taT = [...new Set(ta.map(x => String(x.t || '').trim()).filter(Boolean))];
  const ttT = tt ? tt.teachers.map(x => x.n) : [];
  if (!ta.length) R.issues.push({ k: 'bad', t: 'لا توجد إسنادات في «حفظ الوكيل» بعد.' }); else R.ok.push(`إسنادات الوكيل: ${ta.length} سطراً لـ ${taT.length} معلماً.`);
  if (!tt) R.issues.push({ k: 'warn', t: 'لم يُرفع جدول الفصل الثاني بعد (خانة «جدول الفصل القادم» في الملفات).' }); else R.ok.push(`جدول الفصل الثاني: ${ttT.length} معلماً.`);
  const inTa = sameTeacher(taT), inTt = sameTeacher(ttT), inList = sameTeacher(tlist);
  const bad = new Set();
  if (tt && ta.length) {
    const a1 = ttT.filter(n => !inTa(n)); if (a1.length) { a1.forEach(n => bad.add(normName(n))); R.issues.push({ k: 'warn', t: `في الجدول بلا إسناد (${a1.length}): ${a1.join('، ')}` }); }
    const a2 = taT.filter(n => !inTt(n)); if (a2.length) { a2.forEach(n => bad.add(normName(n))); R.issues.push({ k: 'warn', t: `مُسنَد لهم وليسوا في الجدول (${a2.length}): ${a2.join('، ')}` }); }
    const load = {}; ta.forEach(x => { const h = Number(x.h) || 0; if (h) { const k = normName(x.t); load[k] = (load[k] || 0) + h; } });
    if (Object.keys(load).length) {
      const mm = tt.teachers.map(x => ({ n: x.n, p: Object.keys(x.c).length, h: load[normName(x.n)] })).filter(x => x.h && x.h !== x.p);
      if (mm.length) { mm.forEach(x => bad.add(normName(x.n))); R.issues.push({ k: 'warn', t: `نصاب الإسناد يختلف عن حصص الجدول (${mm.length}): ${mm.map(x => `${x.n} (إسناد ${x.h} / جدول ${x.p})`).join('، ')}` }); }
    }
  }
  if (ta.length && tlist.length) { const a3 = taT.filter(n => !inList(n)); if (a3.length) R.issues.push({ k: 'info', t: `أسماء في الإسناد ليست في قائمة المعلمين (${a3.length}): ${a3.join('، ')} — قد يكونون جدداً.` }); }
  const all = new Set([...taT, ...ttT].map(normName));
  R.pct = !ta.length ? 0 : !tt ? 50 : all.size ? Math.round(100 * (all.size - bad.size) / all.size) : 0;
  return R;
}
function t2Modal() {
  const R = t2Check(), c = CAL();
  let m = $('#termModal'); if (!m) { m = document.createElement('div'); m.id = 'termModal'; m.className = 'modal'; document.body.appendChild(m); }
  m.innerHTML = `<div class="box tchbox"><h3>جاهزية الفصل الدراسي الثاني — ${R.pct}%</h3>
    <p class="hint">مقارنة «حفظ الوكيل» بجدول الفصل الثاني وقائمة المعلمين. يبدأ الفصل الثاني ${calTxt(c.t2)}.</p>
    <div class="tlist">${R.ok.map(t => `<p class="upnote ok">✓ ${esc(t)}</p>`).join('')}${R.issues.length ? R.issues.map(x => `<p class="upnote ${x.k === 'bad' ? 'bad' : x.k === 'info' ? '' : 'warn'}">${x.k === 'info' ? 'ℹ' : '⚠'} ${esc(x.t)}</p>`).join('') : '<p class="upnote ok">✓ لا توجد ملاحظات — الإسناد مطابق للجدول.</p>'}</div>
    <div class="acts">${ROLE === 'agent' || ACTIVE === 'ta-agent' ? '<button class="btn" data-tm="assign" type="button">فتح الإسناد</button>' : ''}<button class="btn ghost" data-tm="close" type="button">إغلاق</button></div></div>`;
  m.hidden = false;
  m.onclick = e => { if (e.target === m || e.target.closest('[data-tm="close"]')) m.hidden = true; else if (e.target.closest('[data-tm="assign"]')) { m.hidden = true; go('assign'); } };
}

/* ----- شريط الانتقال ----- */
function termBanner(tab) {
  if (ROLE === 'sup' || !['home', 'assign', 'daily', 'settings', 'files'].includes(tab)) return '';
  const c = CAL(); let arc = null; try { arc = JSON.parse(localStorage.getItem(LS_KEY + '-termArc') || 'null'); } catch (e) { }
  if (inT2()) {
    if (!arc || !isAdmin() || daysTo(arc.day) < -30) return '';
    return `<div class="tbar done"><div><b>النظام على الفصل الدراسي الثاني</b><span>انتقلت في ${esc(arc.at)}. أعمال الفصل الأول مؤرشفة على هذا الجهاز.</span></div><div class="tba"><button class="btn sm ghost" data-tact="termUndo" type="button">تراجع عن الانتقال</button></div></div>`;
  }
  const dd = daysTo(c.t2), R = t2Check(), exDone = todayIso() > c.ex1b, near = exDone && dd <= 14;
  if (!R.ta.length && !R.tt && dd > 45) return '';
  const col = R.pct >= 90 ? 'g' : R.pct >= 60 ? 'w' : 'b';
  return `<div class="tbar${near ? ' near' : ''}"><div class="tbi">٢</div><div><b>${dd > 0 ? `الفصل الدراسي الثاني يبدأ بعد ${dd} يوماً` : dd === 0 ? 'الفصل الدراسي الثاني يبدأ اليوم' : `بدأ الفصل الدراسي الثاني منذ ${-dd} يوماً`}</b><span>${calTxt(c.t2)} · «${esc(setMeta('ta-agent').n)}» جاهز بنسبة <em class="tp ${col}">${R.pct}%</em>${R.issues.length ? ` · ${R.issues.length} ملاحظات` : ''}</span></div>
    <div class="tba"><button class="btn sm" data-tact="t2Check" type="button">تفاصيل الجاهزية</button>${isAdmin() ? `<button class="btn sm ${near ? 'pri' : 'ghost'}" data-tact="termGo" type="button">بدء الفصل الثاني</button>` : ''}</div></div>`;
}
function htmlBox(title, html, yes, no) {
  return new Promise(res => {
    let m = $('#termModal'); if (!m) { m = document.createElement('div'); m.id = 'termModal'; m.className = 'modal'; document.body.appendChild(m); }
    m.innerHTML = `<div class="box tchbox"><h3>${title}</h3>${html}<div class="acts"><button class="btn pri" data-tm="y" type="button">${yes}</button><button class="btn ghost" data-tm="n" type="button">${no}</button></div></div>`;
    m.hidden = false; m.onclick = e => { const y = e.target.closest('[data-tm="y"]'), n = e.target.closest('[data-tm="n"]'); if (y || n || e.target === m) { m.hidden = true; res(!!y); } };
  });
}
async function termGo() {
  if (!isAdmin()) return toast('الانتقال بين الفصلين من صلاحية مدير النظام', true);
  const R = t2Check(), c = CAL(), n = D().ttNext;
  if (todayIso() <= c.ex1b && !await confirmBox(`تنبيه: اختبارات الفصل الأول لم تنتهِ بعد (تنتهي ${calTxt(c.ex1b)}). الانتقال الآن يجعل الاختبارات تُبنى على إسنادات الفصل الثاني. هل أنت متأكد أنك تريد المتابعة؟`)) return;
  const ok = await htmlBox('بدء الفصل الدراسي الثاني', `<p class="hint">سيتم بضغطة واحدة:</p><ol class="tsteps">
    <li>تحويل النظام كله إلى <b>الفصل الدراسي الثاني</b> (الكليشة والاختبارات والانتظار والمناوبة).</li>
    <li>اعتماد إسنادات «${esc(setMeta('ta-agent').n)}» (${R.ta.length} سطراً) مصدراً للاختبارات والتكليفات.</li>
    <li>${n ? `اعتماد جدول الفصل الثاني (${n.teachers.length} معلماً) جدولاً حالياً لحصص الانتظار.` : '<span class="bad">لم يُرفع جدول الفصل الثاني — يبقى الجدول الحالي إلى أن ترفعه.</span>'}</li>
    <li>أرشفة أعمال الفصل الأول كاملة على هذا الجهاز، مع زر «تراجع» متاح.</li></ol>
    <p class="upnote ${R.issues.length ? 'warn' : 'ok'}">الجاهزية ${R.pct}%${R.issues.length ? ` — ${R.issues.length} ملاحظات (اضغط «تفاصيل الجاهزية» لمراجعتها)` : ''}</p>
    <p class="hint">لا يُحذف شيء: سجلات الانتظار والمناوبة السابقة باقية، وجدول الاختبارات يبقى لتحدّثه بمواعيد الفصل الثاني.</p>`, 'ابدأ الفصل الثاني', 'إلغاء');
  if (!ok) return;
  const ex = clone(secData('ex')); delete ex.cal;
  const arc = { at: stamp(), day: todayIso(), sem: S.s.sem, active: ACTIVE, ex, sets: {}, daily: clone(S.daily || {}) };
  TA_SETS.forEach(id => arc.sets[id] = clone(secData(id)));
  try { localStorage.setItem(LS_KEY + '-termArc', JSON.stringify(arc)); } catch (e) { return toast('تعذّر حفظ الأرشيف على هذا الجهاز (المساحة ممتلئة) — نزّل نسخة احتياطية أولاً', true); }
  if (R.ta.length) copySet('ta-agent', 'ta');
  TA_SETS.forEach(id => updSetMeta(id, { sem: 'الثاني' }));
  if (n) { D().ttPrev = D().tt; D().tt = n; delete D().ttNext; if (typeof TT_WHICH !== 'undefined') TT_WHICH = 'cur'; S.uploads.tt = { name: n.src, at: stamp(), info: `${n.teachers.length} معلماً` }; }
  S.s.sem = 'الثاني'; CAL().doneAt = stamp();
  save(true); try { drawBrand(); } catch (e) { } syncSoon(); renderNav(); render(); updSetChip();
  toast('بدأ الفصل الدراسي الثاني ✓ — أعمال الفصل الأول مؤرشفة');
}
async function termUndo() {
  let arc; try { arc = JSON.parse(localStorage.getItem(LS_KEY + '-termArc') || 'null'); } catch (e) { }
  if (!arc) return toast('لا يوجد أرشيف للتراجع', true);
  if (!await confirmBox(`التراجع عن الانتقال وإعادة النظام إلى ${arc.sem === 'الأول' ? 'الفصل الأول' : arc.sem} كما كان في ${arc.at}؟ أي تعديل بعد الانتقال سيُستبدل بالنسخة المؤرشفة.`)) return;
  const cal = clone(CAL()); delete cal.doneAt;
  applySec('ex', arc.ex); S.cal = cal;
  TA_SETS.forEach(id => { if (arc.sets[id]) applySec(id, arc.sets[id]); });
  S.daily = arc.daily || {};
  try { localStorage.removeItem(LS_KEY + '-termArc'); } catch (e) { }
  save(true); try { drawBrand(); } catch (e) { } syncSoon(); renderNav(); render(); updSetChip();
  toast('أُعيد النظام إلى الفصل الأول ✓');
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tact]'); if (!b) return; const a = b.dataset.tact;
  if (a === 'calView') calView(); else if (a === 't2Check') t2Modal(); else if (a === 'termGo') termGo(); else if (a === 'termUndo') termUndo();
});

/* ===================== الإجازات وأسابيع الفصل ===================== */
var HOL_DEF = [
  { n: 'إجازة اليوم الوطني', a: '2026-09-23', b: '2026-09-24' },
  { n: 'إجازة إضافية', a: '2026-10-25', b: '2026-10-25' },
  { n: 'إجازة الخريف', a: '2026-11-20', b: '2026-11-28' }
];
function hols() { const c = CAL(); if (!Array.isArray(c.hol)) c.hol = c.y === '1448' ? clone(HOL_DEF) : []; return c.hol; }
function holOf(iso) {
  const c = CAL(); if (c.mida && c.midb && iso >= c.mida && iso <= c.midb) return 'إجازة منتصف العام';
  const h = hols().find(x => x.a && iso >= x.a && iso <= (x.b || x.a)); return h ? (h.n || 'إجازة') : '';
}
function isSchoolDay(iso) { return wdOf(iso) >= 0 && !holOf(iso); }
function addDays(iso, n) { return dateToIso(new Date(isoToDate(iso).getTime() + n * 864e5)); }
function weekSun(iso) { return addDays(iso, -isoToDate(iso).getUTCDay()); }
/* رقم الأسبوع الدراسي: تُحسب الأسابيع التي فيها يوم دراسة واحد على الأقل */
function termWeek(iso) {
  const c = CAL(); iso = iso || todayIso();
  if (!c.t1 || iso < weekSun(c.t1)) return null;
  const t2 = iso >= weekSun(c.t2 || '9999-01-01'), st = t2 ? c.t2 : c.t1, term = t2 ? 'الثاني' : 'الأول';
  if (!t2 && c.ex1b && iso > c.ex1b) return { txt: holOf(iso) || 'نهاية الفصل الأول', term, n: 0 };
  let n = 0, cur = weekSun(st); const me = weekSun(iso);
  while (cur <= me && n < 60) { const days = [0, 1, 2, 3, 4].map(k => addDays(cur, k)).filter(d => d >= st); if (days.some(isSchoolDay)) n++; cur = addDays(cur, 7); }
  const wkDays = [0, 1, 2, 3, 4].map(k => addDays(me, k)); const allHol = wkDays.every(d => !isSchoolDay(d));
  if (allHol) { const h = wkDays.map(holOf).find(Boolean); return { txt: h || 'إجازة', term, n: 0, hol: true }; }
  return { n, term, txt: `الأسبوع ${n} من الفصل ${term}` };
}
function updWeekChip() {
  const el = $('#wkChip'); if (!el) return; let w = null; try { w = termWeek(); } catch (e) { }
  el.hidden = !w; if (!w) return;
  el.textContent = w.n ? `الأسبوع ${w.n} · ${semShort(w.term)}` : w.txt; el.title = w.txt + (holOf(todayIso()) ? ` — اليوم: ${holOf(todayIso())}` : '');
  el.classList.toggle('hol', !w.n);
}
function holEditor(ro) {
  const H = hols();
  return `<div class="holed"><b>الإجازات الرسمية خلال العام</b><small>لا تظهر هذه الأيام في الانتظار والمناوبة، ولا تُحسب في أسابيع الفصل. إجازة منتصف العام محسوبة من التواريخ أعلاه.</small>
    ${H.map((h, i) => `<div class="holr"><input class="in" data-k="cal.hol.${i}.n" value="${esc(h.n || '')}" placeholder="اسم الإجازة"${ro ? ' disabled' : ''}><input class="in" type="date" data-k="cal.hol.${i}.a" value="${esc(h.a || '')}"${ro ? ' disabled' : ''}><span>إلى</span><input class="in" type="date" data-k="cal.hol.${i}.b" value="${esc(h.b || '')}"${ro ? ' disabled' : ''}>${ro ? '' : `<button class="x" data-tact="holDel" data-v="${i}" type="button" aria-label="حذف">×</button>`}</div>`).join('') || '<p class="hint">لا توجد إجازات مسجلة.</p>'}
    ${ro ? '' : '<button class="btn sm ghost" data-tact="holAdd" type="button">+ إضافة إجازة</button>'}</div>`;
}

/* ===================== اقتراح أيام الاختبار من التقويم ===================== */
function examRange() { const c = CAL(); return inT2() ? (c.ex2a ? [c.ex2a, c.ex2b || c.ex2a] : null) : (c.ex1a ? [c.ex1a, c.ex1b || c.ex1a] : null); }
function examDaysFromCal() { const r = examRange(); if (!r) return []; const out = []; for (let d = r[0]; d <= r[1] && out.length < 30; d = addDays(d, 1)) if (isSchoolDay(d)) out.push(d); return out; }
function examCalBox() {
  const r = examRange(), days = examDaysFromCal();
  if (!r) return `<div class="calsug"><span>لم يُسجّل أسبوع اختبارات الفصل ${esc(S.s.sem)} في التقويم.</span><button class="btn sm ghost" data-tab="files" type="button">إضافته من التقويم</button></div>`;
  const same = S.days.length && S.days.every((d, i) => d.g === days[i]) && S.days.length === days.length;
  return `<div class="calsug${same ? ' ok' : ''}"><span>📅 أسبوع اختبارات الفصل ${esc(S.s.sem)} في التقويم: <b>${calTxt(r[0])}</b> إلى <b>${calTxt(r[1])}</b> — ${days.length} أيام دراسية.${same ? ' ✓ أيام الجدول مطابقة للتقويم.' : ''}</span>${same || ROLE === 'agent' ? '' : `<button class="btn sm pri" data-tact="examFromCal" type="button">اعتماد هذه التواريخ لأيام الاختبار</button>`}</div>`;
}
async function examFromCal() {
  const days = examDaysFromCal(); if (!days.length) return toast('لا توجد أيام دراسية في أسبوع الاختبارات', true);
  const n = S.days.length;
  const msg = !n ? `إنشاء ${days.length} أيام اختبار بتواريخ التقويم؟ ثم تضيف مواد كل يوم.` : n === days.length ? `تعيين تواريخ أيام الاختبار الـ${n} حسب التقويم؟ المواد والفترات تبقى كما هي.` : n < days.length ? `في الجدول ${n} أيام وفي التقويم ${days.length}. تعيين تواريخ أيامك الـ${n} وإضافة ${days.length - n} أيام فارغة؟ المواد الحالية تبقى.` : `في الجدول ${n} أيام وفي أسبوع الاختبارات ${days.length} فقط. تُعيّن تواريخ أول ${days.length} أيام، وتُكمل البقية على أيام الدراسة التالية. المواد تبقى كما هي.`;
  if (!await confirmBox(msg)) return;
  let cur = days[days.length - 1];
  for (let i = 0; i < Math.max(n, days.length); i++) {
    let g; if (i < days.length) g = days[i]; else { do { cur = addDays(cur, 1); } while (!isSchoolDay(cur)); g = cur; }
    if (!S.days[i]) { const last = S.days[i - 1]; S.days.push({ g, txt: '', p: [{ n: 'الأولى', t: last && last.p[0] ? last.p[0].t : '', s: { 1: '', 2: '', 3: '' } }] }); }
    S.days[i].g = g; S.days[i].txt = ''; S.days[i].h = toHijri(g); fixDay(S.days[i]);
  }
  save(); render(); toast('اعتُمدت تواريخ أيام الاختبار من التقويم ✓');
}

/* ===================== نقل معلمي وإسنادات الفصل الأول إلى حفظ الفصل الثاني ===================== */
function rawMeta(id) { const d = id === ACTIVE ? { meta: S.taMeta } : setStore(id); return (d && d.meta) || {}; }
function mergeSet(from, to) {
  const src = secData(from), dst = clone(secData(to)); dst.ta = dst.ta || []; dst.teachers = dst.teachers || [];
  const key = x => [normName(x.t), normName(x.sub || ''), x.g || '', x.sec || ''].join('|'); const have = new Set(dst.ta.map(key));
  let a = 0, t = 0; (src.ta || []).forEach(x => { if (!have.has(key(x))) { dst.ta.push(clone(x)); have.add(key(x)); a++; } });
  const inT = sameTeacher(dst.teachers); (src.teachers || []).forEach(n => { if (!inT(n)) { dst.teachers.push(n); t++; } });
  applySec(to, dst); save(true); syncSoon(); return { a, t };
}
function seedBox() {
  if (ROLE === 'sup') return ''; const src = secData('ta'), dst = secData('ta-agent'), sm = setMeta('ta'), dm = setMeta('ta-agent');
  if (!(src.ta || []).length && !(src.teachers || []).length) return '';
  const rm = rawMeta('ta-agent'), empty = !(dst.ta || []).length && !(dst.teachers || []).length;
  const info = `${(src.teachers || []).length} معلماً و${(src.ta || []).length} سطر إسناد`;
  if (empty) return `<div class="seed"><div><b>ابدأ إسناد الفصل ${esc(dm.sem)} من معلمي الفصل ${esc(sm.sem)} وإسناداتهم</b><span>يُنسخ من «${esc(sm.n)}» إلى «${esc(dm.n)}»: ${info}. يبقى الأصل في «${esc(sm.n)}» كما هو تماماً، ولا حاجة لرفع أي ملف. تعدّل بعدها ما يتغير فقط.</span></div><button class="btn pri" data-tact="seedCopy" type="button">نقل المعلمين والإسنادات الآن</button></div>`;
  return `<details class="seed slim"><summary>${rm.seed ? `✓ نُقل معلمو «${esc(sm.n)}» وإسناداتهم إلى «${esc(dm.n)}» في ${esc(rm.seed)}` : `مزامنة «${esc(dm.n)}» مع معلمي «${esc(sm.n)}» وإسناداتهم`} — خيارات</summary>
    <p class="hint">«إضافة الناقص فقط» تضيف المعلمين والإسنادات الموجودة في «${esc(sm.n)}» وغير الموجودة في «${esc(dm.n)}»، دون أن تمس أي تعديل أجراه الوكيل. «استبدال الكل» يجعل «${esc(dm.n)}» نسخة مطابقة (يبقى السابق في سجل النسخ).</p>
    <div class="acts wrap"><button class="btn sm" data-tact="seedMerge" type="button">إضافة الناقص فقط</button><button class="btn sm ghost" data-tact="seedCopy" type="button">استبدال الكل</button></div></details>`;
}
async function seedDo(mode) {
  const sm = setMeta('ta'), dm = setMeta('ta-agent'), dst = secData('ta-agent'), empty = !(dst.ta || []).length && !(dst.teachers || []).length;
  if (mode === 'copy') {
    if (!empty && !await confirmBox(`استبدال محتوى «${dm.n}» بنسخة من «${sm.n}»؟ ستُفقد تعديلات «${dm.n}» الحالية (تبقى في سجل النسخ على السحابة).`)) return;
    copySet('ta', 'ta-agent'); updSetMeta('ta-agent', { seed: stamp(), sem: dm.sem }); render(); toast(`نُقل المعلمون والإسنادات إلى «${dm.n}» ✓ — «${sm.n}» باقٍ كما هو`);
  } else {
    const r = mergeSet('ta', 'ta-agent'); updSetMeta('ta-agent', { seed: stamp() }); render();
    toast(r.a || r.t ? `أُضيف ${r.t} معلماً و${r.a} سطر إسناد إلى «${dm.n}»` : 'لا يوجد ناقص — الحفظان متطابقان في المحتوى المشترك');
  }
}

/* ===================== تقرير عدالة الانتظار ===================== */
var STAT_P = 't';
function statRange(p) {
  const t = todayIso(), c = CAL();
  if (p === 'w') { const s = weekSun(t); return [s, addDays(s, 4), 'هذا الأسبوع']; }
  if (p === 'm') { const [y, m] = toHijri(t); const s = hijriToIso(y, m, 1), e = addDays(hijriToIso(m === 12 ? y + 1 : y, m === 12 ? 1 : m + 1, 1), -1); return [s, e, `شهر ${HMONTHS[m - 1] || m} ${y}هـ`]; }
  if (p === 't') { const t2 = t >= (c.t2 || '9999'); return t2 ? [c.t2, '9999-12-31', 'الفصل الدراسي الثاني'] : [c.t1 || '0000', addDays(c.t2 || '9999-12-31', -1), 'الفصل الدراسي الأول']; }
  return ['0000', '9999-12-31', 'كل الأيام المسجلة'];
}
var HMONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'];
function loadIn(a, b) { const m = {}; Object.entries(D().wait).forEach(([k, w]) => { if (k < a || k > b) return; (w.blocks || []).forEach(bl => Object.values(bl.rows || {}).forEach(r => { if (r && r.t) m[normName(r.t)] = (m[normName(r.t)] || 0) + 1; })); }); return m; }
function fairData(p) {
  const [a, b, lbl] = statRange(p), m = loadIn(a, b), t = D().tt;
  const names = new Map(); (t ? t.teachers : []).forEach(x => names.set(normName(x.n), { n: x.n, ld: Object.keys(x.c).length }));
  Object.keys(m).forEach(k => { if (!names.has(k)) names.set(k, { n: (ttNames().find(n => normName(n) === k) || k), ld: null }); });
  const rows = [...names.entries()].map(([k, v]) => ({ n: v.n, ld: v.ld, c: m[k] || 0 })).sort((x, y) => y.c - x.c || AR.compare(normName(x.n), normName(y.n)));
  const tot = rows.reduce((s, r) => s + r.c, 0), avg = rows.length ? tot / rows.length : 0, max = rows.length ? rows[0].c : 0;
  const days = Object.keys(D().wait).filter(k => k >= a && k <= b && (D().wait[k].blocks || []).length).length;
  rows.forEach(r => r.cls = max && r.c >= Math.max(2, avg * 1.5) ? 'hi' : r.c === 0 ? 'lo' : '');
  return { rows, tot, avg, max, lbl, days, a, b };
}
function fairHtml() {
  const F = fairData(STAT_P), zeros = F.rows.filter(r => !r.c).length;
  const chips = [['w', 'هذا الأسبوع'], ['m', 'هذا الشهر'], ['t', 'هذا الفصل'], ['a', 'الكل']].map(([k, t]) => `<button type="button" class="${STAT_P === k ? 'on' : ''}" data-tact="statP" data-v="${k}">${t}</button>`).join('');
  return `<section class="card fair"><h2>عدالة توزيع الانتظار — ${esc(F.lbl)}</h2>
    <div class="semchips" role="group" aria-label="الفترة">${chips}</div>
    <div class="fsum"><div><b>${F.tot}</b><span>حصة انتظار</span></div><div><b>${F.days}</b><span>يوماً مسجلاً</span></div><div><b>${F.avg.toFixed(1)}</b><span>المتوسط لكل معلم</span></div><div><b>${zeros}</b><span>لم يأخذوا أي حصة</span></div></div>
    <p class="hint"><span class="fk hi"></span> أعلى من المتوسط بوضوح — يُخفَّف عنه &nbsp; <span class="fk lo"></span> لم يأخذ أي حصة — أولى بالانتظار القادم. التوزيع التلقائي يختار الأقل في هذا الفصل أولاً.</p>
    <div class="acts"><button class="btn" data-act="dPrint" data-v="stats" type="button">معاينة وطباعة</button><button class="btn" data-act="dPdf" data-v="stats" type="button">PDF</button><button class="btn" data-act="dWord" data-v="stats" type="button">Word</button><button class="btn" data-act="dXls" data-v="stats" type="button">Excel</button></div>
    ${F.rows.length ? `<div class="tw"><table class="et ftab"><tr><th style="width:40px">م</th><th>المعلم</th><th style="width:70px">نصابه</th><th style="width:80px">الانتظار</th><th class="fbarh"></th></tr>${F.rows.map((r, i) => `<tr class="${r.cls}"><td>${i + 1}</td><td class="tn">${esc(r.n)}</td><td>${r.ld == null ? '—' : r.ld}</td><td><b>${r.c}</b></td><td class="fbarc">${r.c ? `<i style="width:${Math.round(100 * r.c / F.max)}%"></i>` : ''}</td></tr>`).join('')}</table></div>` : '<p class="hint">لا توجد بيانات — ارفع الجدول المدرسي وسجّل حصص الانتظار.</p>'}</section>`;
}
function fairPages() {
  const F = fairData(STAT_P);
  const rows = [[H('م', { w: '7%' }), H('المعلم'), H('النصاب', { w: '12%' }), H('حصص الانتظار', { w: '16%' }), H('الملاحظة', { w: '22%' })], ...F.rows.map((r, i) => [i + 1, { v: esc(r.n), al: 'right' }, r.ld == null ? '—' : r.ld, `<b>${r.c}</b>`, r.cls === 'hi' ? 'أعلى من المتوسط' : r.cls === 'lo' ? 'لم يُكلَّف' : ''])];
  const out = []; const per = 32;
  for (let i = 1; i < rows.length || i === 1; i += per) out.push(title('تقرير عدالة توزيع حصص الانتظار', `${F.lbl} — ${F.tot} حصة في ${F.days} يوماً — المتوسط ${F.avg.toFixed(1)} لكل معلم`) + T([rows[0], ...rows.slice(i, i + per)], { cls: 'dense' }) + (i + per >= rows.length ? sp(10) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep], ['مدير المدرسة', S.s.principal]]) : ''));
  return out;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tact]'); if (!b) return; const a = b.dataset.tact;
  if (a === 'holAdd') { hols().push({ n: '', a: '', b: '' }); save(); render(); }
  else if (a === 'holDel') { hols().splice(+b.dataset.v, 1); save(); render(); }
  else if (a === 'examFromCal') examFromCal();
  else if (a === 'seedCopy') seedDo('copy'); else if (a === 'seedMerge') seedDo('merge');
  else if (a === 'statP') { STAT_P = b.dataset.v; render(); }
});
