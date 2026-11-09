/* ===================== التقويم الدراسي والانتقال بين الفصلين ===================== */
var CAL_DEF = { y: '1448', t1: '2026-08-30', ex1a: '2027-01-03', ex1b: '2027-01-07', mida: '2027-01-08', midb: '2027-01-16', t2: '2027-01-17', ex2a: '2027-06-27', ex2b: '2027-07-01', end: '2027-07-01' };
var CAL_IMG = 'cal-1448.webp';
function CAL() { S.cal = S.cal || {}; Object.keys(CAL_DEF).forEach(k => { if (!S.cal[k]) S.cal[k] = CAL_DEF[k]; }); return S.cal; }
function calImgs() { const c = CAL(); return c.own && c.imgs && c.imgs.length ? c.imgs : (c.y === '1448' ? [{ src: CAL_IMG, w: 481, h: 681 }, { src: 'cal-1448-t2.jpg', w: 1179, h: 1313 }] : (c.imgs || [])); }
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
  c.imgs = imgs; c.html = html; c.src = file.name; c.at = stamp(); c.own = true;
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
  const pages = imgs.length ? imgs.map(im => `<p style="text-align:center;margin:0"><img src="${im.src}" alt="التقويم الدراسي" style="width:100%;max-height:245mm;height:auto;object-fit:contain"></p>`) : [c.html];
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
  { n: 'إجازة الخريف', a: '2026-11-20', b: '2026-11-28' },
  { n: 'إجازة يوم التأسيس', a: '2027-02-21', b: '2027-02-22' },
  { n: 'إجازة عيد الفطر', a: '2027-02-26', b: '2027-03-13' },
  { n: 'إجازة عيد الأضحى', a: '2027-04-30', b: '2027-05-22' },
  { n: 'إجازة نهاية العام الدراسي', a: '2027-07-02', b: '2027-08-21' }
];
function hols() { const c = CAL(); if (!Array.isArray(c.hol)) c.hol = c.y === '1448' ? clone(HOL_DEF) : []; if (c.y === '1448' && !c.holV2) { HOL_DEF.forEach(h => { if (!c.hol.some(x => x.a === h.a)) c.hol.push(clone(h)); }); c.hol.sort((a, b) => String(a.a).localeCompare(String(b.a))); c.holV2 = 1; } return c.hol; }
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

/* ===================== مفتاح الفصلين في صفحة الإسناد ===================== */
function semSets() {
  const by = s => TA_SETS.filter(id => id !== 'ta-shared' && setMeta(id).sem === s)[0];
  let a = by('الأول'), b = by('الثاني'); if (!a || !b || a === b) { a = 'ta'; b = 'ta-agent'; }
  return [a, b];
}
function semSwitch() {
  const [s1, s2] = semSets();
  const card = (id, k) => {
    const m = setMeta(id), d = secData(id), on = id === ACTIVE, live = m.sem === S.s.sem, tc = new Set((d.ta || []).map(x => normName(x.t))).size;
    const ro = ROLE === 'agent' && id === 'ta';
    return `<button type="button" class="semcard s${k}${on ? ' on' : ''}" data-tact="semPick" data-v="${id}" aria-pressed="${on}">
      <span class="semn">${k}</span><span class="semt"><b>إسناد الفصل الدراسي ${esc(m.sem)}</b><small>${esc(m.n)} · ${(d.ta || []).length} سطراً · ${tc} معلماً</small>
      <em class="${live ? 'live' : 'prep'}">${live ? '● معتمد الآن في الاختبارات والانتظار' : '◐ قيد الإعداد — يُعتمد عند بدء الفصل ' + esc(m.sem)}</em></span>
      <span class="semst">${on ? '✓ تعمل عليه' : ro ? 'اطلاع' : 'انتقل إليه'}</span></button>`;
  };
  return `<section class="card semsw"><div class="semgrid">${card(s1, 1)}${card(s2, 2)}</div>
    <div class="acts wrap" style="margin:8px 0 0"><button class="btn sm" data-tact="semDiff" type="button">⇄ مقارنة الفصلين: ماذا تغيّر؟</button><span class="hint">التبديل لا يغيّر شيئاً في الاختبارات ولا الانتظار — يحدد فقط أي إسناد تعدّله الآن.</span></div>
    ${seedBox()}</section>`;
}
async function semPick(id) {
  if (id === ACTIVE) return;
  if (ROLE === 'agent' && id === 'ta') return previewSet('ta');
  try { localStorage.setItem(LS_KEY + '-taset', id); } catch (e) { }
  await setActive(id); renderNav(); render(); toast(`تعمل الآن على إسناد الفصل ${setMeta(id).sem}`);
}
function taKey(x) { return `${x.sub || ''}${x.g ? ' — ' + (GSHORT[x.g] || x.g) : ''}${x.sec ? ' / ' + x.sec : ''}`; }
function semDiff() {
  const [s1, s2] = semSets(), A = secData(s1).ta || [], B = secData(s2).ta || [];
  const group = L => { const m = new Map(); L.forEach(x => { const k = normName(x.t); if (!k) return; if (!m.has(k)) m.set(k, { n: x.t, r: [], h: 0 }); const o = m.get(k); o.r.push(taKey(x)); o.h += Number(x.h) || 0; }); return m; };
  const ga = group(A), gb = group(B), keys = [...new Set([...ga.keys(), ...gb.keys()])];
  const rows = keys.map(k => { const a = ga.get(k), b = gb.get(k); const sa = a ? a.r.slice().sort().join(' | ') : '', sb = b ? b.r.slice().sort().join(' | ') : '';
    const st = !a ? 'new' : !b ? 'gone' : (sa !== sb || a.h !== b.h) ? 'chg' : 'same'; return { n: (b || a).n, a, b, st }; })
    .sort((x, y) => ({ new: 0, gone: 1, chg: 2, same: 3 })[x.st] - ({ new: 0, gone: 1, chg: 2, same: 3 })[y.st] || AR.compare(normName(x.n), normName(y.n)));
  const cnt = s => rows.filter(r => r.st === s).length, L = { new: 'جديد في الفصل الثاني', gone: 'غير موجود في الفصل الثاني', chg: 'تغيّر إسناده', same: 'بلا تغيير' };
  const cell = o => o ? `${o.r.map(esc).join('<br>')}${o.h ? `<small> (${o.h} حصة)</small>` : ''}` : '—';
  let m = $('#termModal'); if (!m) { m = document.createElement('div'); m.id = 'termModal'; m.className = 'modal'; document.body.appendChild(m); }
  m.innerHTML = `<div class="box tchbox wide"><h3>مقارنة إسناد الفصلين</h3>
    <div class="fsum"><div><b>${cnt('chg')}</b><span>تغيّر إسناده</span></div><div><b>${cnt('new')}</b><span>جديد</span></div><div><b>${cnt('gone')}</b><span>غير موجود في ف2</span></div><div><b>${cnt('same')}</b><span>بلا تغيير</span></div></div>
    <label class="ck"><input type="checkbox" id="dfAll"> إظهار المعلمين بلا تغيير أيضاً</label>
    <div class="tw"><table class="et dft"><tr><th>المعلم</th><th>الفصل الأول</th><th>الفصل الثاني</th></tr>${rows.map(r => `<tr class="d-${r.st}"${r.st === 'same' ? ' hidden' : ''}><td class="tn"><b>${esc(r.n)}</b><small>${L[r.st]}</small></td><td>${cell(r.a)}</td><td>${cell(r.b)}</td></tr>`).join('')}</table></div>
    <div class="acts"><button class="btn ghost" data-tm="close" type="button">إغلاق</button></div></div>`;
  m.hidden = false;
  m.onclick = e => { if (e.target === m || e.target.closest('[data-tm="close"]')) m.hidden = true; };
  m.querySelector('#dfAll').onchange = e => m.querySelectorAll('tr.d-same').forEach(tr => tr.hidden = !e.target.checked);
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tact]'); if (!b) return; const a = b.dataset.tact;
  if (a === 'semPick') semPick(b.dataset.v); else if (a === 'semDiff') semDiff();
});

/* تعبئة إسناد الفصل الثاني تلقائياً بمعلمي الفصل الأول وتخصصاتهم وإسناداتهم — مرة واحدة، وفقط إن كان فارغاً على هذا الجهاز وعلى السحابة */
function autoSeed(meta) {
  try {
    if (ROLE === 'sup') return; const [s1, s2] = semSets(); const src = secData(s1), dst = secData(s2), rm = rawMeta(s2);
    if (rm.seed || rm.noSeed) return;
    if (!(src.ta || []).length && !(src.teachers || []).length) return;
    if ((dst.ta || []).length || (dst.teachers || []).length) return;
    if (meta) { const cm = meta[s2], lm = SYNC[s2] || {}; if (cm && cm.at !== lm.at) return; if (PENDING[s2]) return; }
    copySet(s1, s2); updSetMeta(s2, { seed: stamp(), sem: setMeta(s2).sem });
    renderNav(); render(); toast(`جُهّز إسناد الفصل ${setMeta(s2).sem} بمعلمي الفصل ${setMeta(s1).sem} وتخصصاتهم وإسناداتهم — عدّل ما يتغير فقط`);
  } catch (e) { }
}

/* ===================== توزيع الملاحظين بلمسة ===================== */
var OBS_T = null;
function obsSlots(se, c, key, list, busy, cnt, load) {
  const slots = Math.max(list.length, obsNeed(c.no)); let h = '';
  for (let i = 0; i < slots; i++) {
    const n = list[i] || '', on = OBS_T && OBS_T.key === key && OBS_T.i === i, dup = n && cnt[normName(n)] > 1, bz = n && busy.has(normName(n)), sw = SWAP && SWAP.key === key && SWAP.i === i;
    h += n ? `<span class="ob${dup ? ' dup' : ''}${bz ? ' busy' : ''}${sw ? ' sw' : ''}${on ? ' tgt' : ''}"><button type="button" class="obn" data-tact="obsT" data-k="${key}" data-i="${i}" title="${dup ? 'مكرر في نفس الفترة — ' : bz ? 'معلم مادة مختبرة في هذه الفترة — ' : ''}المس للتغيير">${esc(n)}</button>${c.no !== 'R' ? `<button type="button" class="ic rep" data-tact="obsRep" data-k="${key}" data-i="${i}" title="غائب ← استبدال من الاحتياط">↺</button>` : ''}<button type="button" class="ic" data-act="obsSwap" data-k="${key}" data-i="${i}" title="تبديل مع ملاحظ آخر">⇅</button><button type="button" class="ic x" data-act="obsDel" data-k="${key}" data-i="${i}" title="حذف">×</button></span>`
      : `<button type="button" class="obe${on ? ' on' : ''}" data-tact="obsT" data-k="${key}" data-i="${i}">＋ الملاحظ ${i + 1}</button>`;
  }
  return h + `<button type="button" class="btn sm ghost" data-act="obsAdd" data-k="${key}">+ ملاحظ</button>`;
}
function obsPickRow(key, busy, cnt, load) {
  const i = OBS_T.i, cur = obsList(key)[i] || '';
  const avail = tchAll().filter(t => !busy.has(normName(t)) && !cnt[normName(t)]).sort((a, b) => AR.compare(normName(a), normName(b)));
  const L = {}; Object.entries(load).forEach(([n, v]) => L[normName(n)] = (L[normName(n)] || 0) + v);
  const sug = new Set(avail.slice().sort((a, b) => (L[normName(a)] || 0) - (L[normName(b)] || 0) || AR.compare(normName(a), normName(b))).slice(0, 3));
  const com = key.split('_').pop();
  return `<tr class="obpick"><td colspan="5"><div class="wpick"><small>${cur ? `تغيير «${esc(cur)}» في` : 'اختر الملاحظ'} ${i + 1} للجنة ${esc(com)} — المتاحون في هذه الفترة (${avail.length})، والأقل ملاحظةً بنجمة ★. بعد الاختيار ينتقل التحديد تلقائياً للخانة الفارغة التالية.</small>
    <div class="wchips">${avail.map(n => `<button type="button" class="wchip${sug.has(n) ? ' sug' : ''}" data-tact="obsPick" data-n="${esc(n)}">${esc(n)}<i class="ld">${L[normName(n)] || 0}</i></button>`).join('') || '<span class="hint">لا يوجد معلم متاح في هذه الفترة</span>'}</div>
    <div class="acts wrap" style="margin:0"><details class="wother"><summary>اسم آخر من كل المعلمين…</summary>${pickSel(`obs.${key}.${i}`, cur, [{ label: 'جميع المعلمين', items: tchAll() }], { ph: '— كل المعلمين —' })}</details><button type="button" class="btn sm ghost" data-tact="obsT0" type="button">إنهاء الاختيار</button></div></div></td></tr>`;
}
function obsNextEmpty(key, i) {
  const se = key.slice(0, key.lastIndexOf('_')), coms = S.com.map(c => c.no); let started = false;
  for (const no of coms) { const k = `${se}_${no}`, L = obsList(k), n = Math.max(L.length, no === 'R' ? resNeed() : obsNeed(no));
    for (let j = 0; j < n; j++) { if (!started) { if (k === key && j === i) started = true; continue; } if (!L[j]) return { key: k, i: j }; } }
  return null;
}
document.addEventListener('click', e => {
  const b = e.target.closest('[data-tact]'); if (!b) return; const a = b.dataset.tact;
  if (a === 'obsT') { const t = { key: b.dataset.k, i: +b.dataset.i }; OBS_T = OBS_T && OBS_T.key === t.key && OBS_T.i === t.i ? null : t; render(); }
  else if (a === 'obsT0') { OBS_T = null; render(); }
  else if (a === 'obsPick' && OBS_T) {
    const L = obsList(OBS_T.key).slice(); while (L.length <= OBS_T.i) L.push(''); L[OBS_T.i] = b.dataset.n; S.obs[OBS_T.key] = L; save();
    OBS_T = obsNextEmpty(OBS_T.key, OBS_T.i); render();
    setTimeout(() => { const el = document.querySelector('.obpick'); if (el) { const r = el.getBoundingClientRect(); if (r.top < 80 || r.bottom > innerHeight) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } }, 40);
    if (!OBS_T) toast('اكتملت خانات الملاحظين لهذه الفترة ✓');
  }
});

/* ----- الاحتياط وعدد اللجان ----- */
function resNeed() { const v = S.s.resN; return v === 0 || v === '0' ? 0 : Math.max(0, +(v == null || v === '' ? 7 : v)); }
function obsResBlock(se, busy, cnt, load) {
  const key = `${se.key}_R`, list = obsList(key);
  return `<div class="obres"><div class="obrh"><b>الاحتياط</b><label class="inl">العدد <input class="in" type="number" min="0" max="20" data-k="s.resN" data-num="1" value="${resNeed()}" style="width:4rem"></label><button class="btn sm" data-tact="resAuto" data-v="${se.key}" type="button">تعبئة الاحتياط تلقائياً (الأقل تكليفاً)</button></div>
    <div class="obsl">${obsSlots(se, { no: 'R' }, key, list, busy, cnt, load)}</div>${OBS_T && OBS_T.key === key ? obsPickRow(key, busy, cnt, load) : ''}</div>`;
}
function resAuto(sk) {
  const se = sessions().find(x => x.key === sk); if (!se) return;
  const busy = new Set(sessionSubjects(se).flatMap(x => teachersOfSubject(x.sub, x.g).concat(teacherOf(x.sub, x.g))).filter(Boolean).map(normName)); exSet(sk).forEach(n => busy.add(n));
  const used = new Set(); S.com.forEach(c => obsList(`${sk}_${c.no}`).forEach(n => n && used.add(normName(n))));
  const load = {}; Object.keys(S.obs).forEach(k => obsList(k).forEach(n => { if (n) load[normName(n)] = (load[normName(n)] || 0) + 1; }));
  const cur = obsList(`${sk}_R`).filter(Boolean).filter(n => !used.has(normName(n)) && !busy.has(normName(n)));
  const pool = tchAll().filter(t => !busy.has(normName(t)) && !used.has(normName(t)) && !cur.some(c => normName(c) === normName(t))).sort((a, b) => (load[normName(a)] || 0) - (load[normName(b)] || 0) || AR.compare(normName(a), normName(b)));
  S.obs[`${sk}_R`] = cur.concat(pool).slice(0, Math.max(resNeed(), cur.length)); save(); render(); toast(`عُبّئ الاحتياط: ${S.obs[`${sk}_R`].length}`);
}
function comCountCtl() {
  return `<div class="comcnt"><span>عدد اللجان</span><button class="btn sm" data-tact="comDel" type="button" aria-label="إنقاص لجنة">−</button><b>${S.com.length}</b><button class="btn sm" data-tact="comAdd" type="button" aria-label="زيادة لجنة">+</button><small class="hint">تُضاف اللجنة الجديدة بعد آخر لجنة بنفس المقر والسعة، وتعدّل تفاصيلها من «اللجان والأعداد».</small></div>`;
}
/* ----- كشف «أسماء الملاحظين على اللجان» بتصميم المدرسة ----- */
function obsNamesPages(o) {
  const out = [];
  sesOpt(o || {}).forEach(se => {
    const rows = []; comsOrdered().forEach(c => { const l = obsList(`${se.key}_${c.no}`).filter(Boolean); const n = Math.max(1, l.length); for (let i = 0; i < n; i++) rows.push({ c, n: l[i] || '' }); });
    const res = obsList(`${se.key}_R`).filter(Boolean);
    const plc = c => (c.fl || c.rm || '').trim(), freq = {}; S.com.forEach(c => { const k = plc(c); freq[k] = (freq[k] || 0) + 1; });
    const main = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
    const lab = c => { const p = plc(c), red = /صال|مسرح|مكتب|مصل|معمل|قاع/.test(p); return { v: `<span style="white-space:nowrap;${red ? 'color:#c0392b;' : ''}">( ${c.no} ) ${esc(p)}</span>`, fs: '8.5pt' }; };
    const n = rows.length, nr = Math.max(res.length, resNeed());
    const R = Math.max(26, Math.ceil((n + 1 + nr) / 2)), leftObs = Math.max(n - R, Math.min(10, R - 1 - nr));
    const HG = '#d9ead3', hd = t => ({ v: `<b>${t}</b>`, bg: HG });
    const head = [hd('م'), hd('اسم المعلم'), hd('اللجنة'), hd('التوقيع'), hd('م'), hd('اسم المعلم'), hd('اللجنة'), hd('التوقيع')];
    const nm = t => `<b style="white-space:nowrap">${esc(t)}</b>`;
    const obsCells = k => { const r = rows[k]; return [{ v: k + 1, bg: '#eef5e9' }, { v: r ? nm(r.n) : '', al: 'right', fs: '9pt' }, r ? lab(r.c) : '', '']; };
    const body = [];
    for (let i = 0; i < R; i++) {
      const right = obsCells(i); let left;
      if (i < leftObs) left = obsCells(R + i);
      else if (i === leftObs) left = [{ v: '<b>الاحتياط</b>', cs: 4, bg: '#dde7f0' }];
      else { const j = i - leftObs - 1; left = [{ v: j + 1, bg: '#eef5e9' }, { v: res[j] ? nm(res[j]) : '', cs: 2, al: 'right', fs: '9pt' }, '']; }
      body.push(right.concat(left));
    }
    const d = se.day, h = toHijri(d.g);
    const top = `<div style="text-align:center;margin:2px 0 6px"><span style="display:inline-block;border:2px solid #4a6b2f;background:#c5e0a5;padding:6px 46px;font-size:17pt;font-weight:800;border-radius:4px">أسماء الملاحظين على اللجان</span></div>
      <p style="text-align:center;font-weight:800;margin:4px 0;font-size:12pt">اختبار نهاية الفصل الدراسي ${esc(S.s.sem)} من العام الدراسي ${esc(S.s.yearTxt)}</p>
      <table width="100%" style="font-weight:800;font-size:11.5pt;margin:2px 0 4px" dir="rtl"><tr><td style="text-align:right">الملاحظين لهذا اليوم / ${dayName(d)}</td><td style="text-align:center">وتاريخ: ${h[2]} / ${h[1]} / ${h[0]}هـ</td><td style="text-align:left">الفترة / ${esc(se.per.n || '')}</td></tr></table>`;
    const cols = '<colgroup><col style="width:3.5%"><col style="width:21%"><col style="width:15%"><col style="width:10.5%"><col style="width:3.5%"><col style="width:21%"><col style="width:15%"><col style="width:10.5%"></colgroup>';
    const tbl = T([head, ...body], { cls: 'dense obsN' }).replace(/^(<table[^>]*>)/, '$1' + cols);
    const lg = obsLog(se.key); out.push(top + tbl + (lg.length ? `<p style="font-size:9pt;margin:4px 0 0"><b>الاستبدالات:</b> ${lg.map(x => `${esc(x.inn)} بدلاً عن ${esc(x.out)} (لجنة ${esc(x.com)})`).join('، ')}</p>` : '') + sp(10) + sigs([['نائب رئيس لجنة الاختبارات', S.s.eduDep], ['رئيس لجنة الاختبارات', S.s.principal]]));
  });
  return out;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-tact]'); if (!b) return; const a = b.dataset.tact;
  if (a === 'resAuto') resAuto(b.dataset.v);
  else if (a === 'comAdd') { const l = S.com[S.com.length - 1]; const n = S.com.length ? Math.max(...S.com.map(c => +c.no || 0)) + 1 : 1; S.com.push({ no: n, fl: l ? l.fl : '', rm: '', cap: l ? l.cap : 30, c: { 1: 0, 2: 0, 3: 0 } }); S.distributed = false; save(); render(); toast(`أُضيفت اللجنة ${n} — أصبح العدد ${S.com.length}`); }
  else if (a === 'comDel') { const l = S.com[S.com.length - 1]; if (!l) return; if (!await confirmBox(`حذف آخر لجنة (رقم ${l.no}${comSum(l) ? ` وفيها ${comSum(l)} طالباً` : ''})؟ يُحذف ملاحظوها أيضاً.`)) return; S.com.pop(); Object.keys(S.obs).forEach(k => { if (k.endsWith('_' + l.no)) delete S.obs[k]; }); S.distributed = false; save(); render(); toast(`أصبح عدد اللجان ${S.com.length}`); }
});

/* ===================== ترتيب اللجان، المعتذرون، الاستبدال من الاحتياط ===================== */
const OUTSIDE = /صال|مسرح|مصل|مكتب|معمل|ملعب|قاع/;
function comsOrdered() { const L = S.com.slice(); if ((S.s.obsOrd || 'place') === 'num') return L.sort((a, b) => (+a.no) - (+b.no)); return L.sort((a, b) => (OUTSIDE.test((a.fl || '') + ' ' + (a.rm || '')) - OUTSIDE.test((b.fl || '') + ' ' + (b.rm || ''))) || (+a.no) - (+b.no)); }
function exAll() { S.obsEx = S.obsEx || {}; return S.obsEx; }
function exSet(sk) { return new Set((exAll()[sk] || []).map(normName)); }
function obsLog(sk) { S.obsLog = S.obsLog || {}; return S.obsLog[sk] = S.obsLog[sk] || []; }
var EX_DAY = true;
function obsExBlock(se) {
  const ex = exAll()[se.key] || [], exs = exSet(se.key), all = tchAll().slice().sort((a, b) => AR.compare(normName(a), normName(b)));
  return `<div class="obres obex"><div class="obrh"><b>المعتذرون في هذه الفترة</b><small class="hint">لا يظهرون ضمن المتاحين ولا يضعهم التوزيع التلقائي.</small></div>
    <div class="wchips">${ex.length ? ex.map(n => `<span class="exn">${esc(n)}<button type="button" data-tact="exDel" data-v="${se.key}" data-n="${esc(n)}" aria-label="إزالة">×</button></span>`).join('') : '<span class="hint">لا يوجد معتذرون.</span>'}</div>
    <details class="wrest"><summary>+ إضافة معتذر</summary><label class="ck" style="margin:6px 0"><input type="checkbox" id="exDay" ${EX_DAY ? 'checked' : ''}> لكل فترات يوم ${dayName(se.day)} ${dateShort(se.day)}</label>
    <div class="wchips">${all.filter(n => !exs.has(normName(n))).map(n => `<button type="button" class="wchip" data-tact="exAdd" data-v="${se.key}" data-n="${esc(n)}">${esc(n)}</button>`).join('')}</div></details></div>`;
}
function obsLogBlock(se) {
  const lg = obsLog(se.key); if (!lg.length) return '';
  return `<div class="obres"><div class="obrh"><b>الاستبدالات في هذه الفترة</b></div>${lg.map((x, i) => `<div class="lvbar"><span>${esc(x.inn)} بدلاً عن ${esc(x.out)} — لجنة ${esc(x.com)} <small>(${esc(x.at)})</small></span><button class="btn sm ghost" data-tact="repUndo" data-v="${se.key}" data-i="${i}" type="button">تراجع</button></div>`).join('')}</div>`;
}
function exAddName(sk, n, wholeDay) {
  const se = sessions().find(x => x.key === sk); const keys = wholeDay && se ? sessions().filter(x => x.di === se.di).map(x => x.key) : [sk];
  let moved = 0;
  keys.forEach(k => { const L = exAll()[k] = exAll()[k] || []; if (!L.some(x => normName(x) === normName(n))) L.push(n);
    Object.keys(S.obs).forEach(ok => { if (ok.slice(0, ok.lastIndexOf('_')) !== k) return; const l = obsList(ok); l.forEach((v, i) => { if (v && normName(v) === normName(n)) { l[i] = ''; moved++; } }); S.obs[ok] = l; }); });
  save(); render(); toast(`${n} معتذر ${keys.length > 1 ? 'لكل فترات اليوم' : 'في هذه الفترة'}${moved ? ` — أُزيل من ${moved} خانة، اختر بديلاً أو استخدم الاحتياط` : ''}`);
}
function obsReplace(key, i) {
  const sk = key.slice(0, key.lastIndexOf('_')), com = key.slice(key.lastIndexOf('_') + 1), L = obsList(key).slice(), out = L[i];
  const R = obsList(`${sk}_R`).slice(), ex = exSet(sk); const j = R.findIndex(n => n && !ex.has(normName(n)) && normName(n) !== normName(out));
  if (j < 0) return toast('لا يوجد اسم في الاحتياط لهذه الفترة — أضف احتياطاً أو اختر بديلاً بلمسة', true);
  const inn = R[j]; R.splice(j, 1); L[i] = inn; S.obs[key] = L; S.obs[`${sk}_R`] = R;
  const E = exAll()[sk] = exAll()[sk] || []; if (out && !E.some(x => normName(x) === normName(out))) E.push(out);
  obsLog(sk).push({ com, out, inn, at: stamp(), i }); save(); render(); toast(`${inn} بدلاً عن ${out} في لجنة ${com} ✓ — الكشف محدّث`);
}
function repUndo(sk, idx) {
  const lg = obsLog(sk), x = lg[idx]; if (!x) return; const key = `${sk}_${x.com}`, L = obsList(key).slice(); const p = L.findIndex(n => n && normName(n) === normName(x.inn));
  if (p >= 0) L[p] = x.out; else L.push(x.out); S.obs[key] = L; const R = obsList(`${sk}_R`).slice(); R.unshift(x.inn); S.obs[`${sk}_R`] = R;
  exAll()[sk] = (exAll()[sk] || []).filter(n => normName(n) !== normName(x.out)); lg.splice(idx, 1); save(); render(); toast('تم التراجع عن الاستبدال');
}
document.addEventListener('change', e => { if (e.target && e.target.id === 'exDay') EX_DAY = e.target.checked; });
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-tact]'); if (!b) return; const a = b.dataset.tact;
  if (a === 'obsRep') { const n = obsList(b.dataset.k)[+b.dataset.i]; if (await confirmBox(`${n} غائب أو معتذر؟ يحل محله أول اسم في الاحتياط، ويُسجَّل الاستبدال.`)) obsReplace(b.dataset.k, +b.dataset.i); }
  else if (a === 'exAdd') exAddName(b.dataset.v, b.dataset.n, EX_DAY);
  else if (a === 'exDel') { const k = b.dataset.v; exAll()[k] = (exAll()[k] || []).filter(n => normName(n) !== normName(b.dataset.n)); save(); render(); }
  else if (a === 'repUndo') repUndo(b.dataset.v, +b.dataset.i);
});

/* ===================== لوحة يوم الاختبار: حضور الملاحظين على اللجان ===================== */
var BOARD_PI = 0;
function attOf(sk) { const d = D(); d.att = d.att || {}; return d.att[sk] = d.att[sk] || {}; }
function boardHtml(di) {
  const day = S.days[di]; if (!day || !S.com.length) return '';
  if (BOARD_PI >= day.p.length) BOARD_PI = 0;
  const sk = `${di}_${BOARD_PI}`, att = attOf(sk), canEdit = !exReadOnly();
  const res = obsList(`${sk}_R`).filter(Boolean);
  let tot = 0, here = 0, emptyC = 0;
  const cards = comsOrdered().map(c => {
    const key = `${sk}_${c.no}`, L = obsList(key), n = Math.max(L.length, obsNeed(c.no)); let ok = 0, cnt = 0;
    const people = Array.from({ length: n }, (_, i) => { const nm = L[i]; if (!nm) { emptyC++; return `<div class="bob empty"><span>— لا يوجد ملاحظ —</span>${canEdit ? `<button type="button" class="btn sm" data-tact="bFill" data-k="${key}" data-i="${i}">من الاحتياط</button>` : ''}</div>`; }
      cnt++; tot++; const a = att[`${c.no}_${i}`]; if (a && a.n === nm) { ok++; here++; }
      const on = a && a.n === nm;
      return `<div class="bob${on ? ' on' : ''}"><button type="button" class="bname" data-tact="bAtt" data-s="${sk}" data-c="${c.no}" data-i="${i}" data-n="${esc(nm)}" aria-pressed="${!!on}">${on ? '✓ ' : ''}${esc(nm)}${on ? `<small>${esc(a.at)}</small>` : ''}</button>${!on && canEdit ? `<button type="button" class="ic rep" data-tact="bRep" data-k="${key}" data-i="${i}" title="غائب ← استبدال من الاحتياط">↺</button>` : ''}</div>`; });
    const st = !cnt ? 'none' : ok === cnt ? 'ok' : ok ? 'part' : 'wait';
    return `<article class="bcard ${st}"><header><b>${c.no}</b><span>${esc((c.fl || c.rm || '').trim())}</span><small>${comSum(c)} طالباً</small></header>${people.join('')}</article>`;
  }).join('');
  const pct = tot ? Math.round(100 * here / tot) : 0;
  return `<section class="card board"><div class="bhead"><div><h2>لوحة الملاحظين — ${dayName(day)} ${dateShort(day)}</h2><p class="hint">المس اسم الملاحظ عند حضوره فيصبح أخضر. ↺ يستبدل الغائب بأول اسم في الاحتياط. التحديث يظهر على أجهزة الجميع.</p></div>
    <div class="bcount"><b>${here}</b><span>من ${tot} حضروا</span><i style="--p:${pct}%"></i></div></div>
    ${day.p.length > 1 ? `<div class="semchips" role="group">${day.p.map((p, i) => `<button type="button" class="${i === BOARD_PI ? 'on' : ''}" data-tact="bPer" data-v="${i}">الفترة ${esc(p.n || i + 1)}</button>`).join('')}</div>` : ''}
    <div class="bbar"><span>الاحتياط المتاح: <b>${res.length}</b>${res.length ? ` — ${res.slice(0, 4).map(esc).join('، ')}${res.length > 4 ? '…' : ''}` : ''}</span>${emptyC ? `<span class="bad">${emptyC} لجنة بلا ملاحظ</span>` : ''}
      <span class="sp1"></span><button class="btn sm" data-tact="bAll" data-s="${sk}" type="button">تأشير الكل حاضر</button><button class="btn sm ghost" data-tact="bClr" data-s="${sk}" type="button">مسح التأشير</button><button class="btn sm pri" data-tact="bPrint" data-s="${sk}" type="button">طباعة كشف الملاحظين</button></div>
    <div class="bgrid2">${cards}</div></section>`;
}
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-tact]'); if (!b) return; const a = b.dataset.tact;
  if (a === 'bAtt') { const att = attOf(b.dataset.s), k = `${b.dataset.c}_${b.dataset.i}`; if (att[k] && att[k].n === b.dataset.n) delete att[k]; else att[k] = { n: b.dataset.n, at: stamp().split(' ')[1] }; save(); render(); }
  else if (a === 'bRep') { const n = obsList(b.dataset.k)[+b.dataset.i]; if (await confirmBox(`${n} لم يحضر؟ يحل محله أول اسم في الاحتياط.`)) obsReplace(b.dataset.k, +b.dataset.i); }
  else if (a === 'bFill') { const k = b.dataset.k, i = +b.dataset.i, sk = k.slice(0, k.lastIndexOf('_')), R = obsList(`${sk}_R`).slice(); if (!R.length) return toast('لا يوجد احتياط لهذه الفترة', true); const L = obsList(k).slice(); while (L.length <= i) L.push(''); L[i] = R.shift(); S.obs[k] = L; S.obs[`${sk}_R`] = R; obsLog(sk).push({ com: k.slice(k.lastIndexOf('_') + 1), out: '—', inn: L[i], at: stamp(), i }); save(); render(); }
  else if (a === 'bAll') { const sk = b.dataset.s, att = attOf(sk); S.com.forEach(c => obsList(`${sk}_${c.no}`).forEach((n, i) => { if (n) att[`${c.no}_${i}`] = att[`${c.no}_${i}`] && att[`${c.no}_${i}`].n === n ? att[`${c.no}_${i}`] : { n, at: stamp().split(' ')[1] }; })); save(); render(); }
  else if (a === 'bClr') { if (await confirmBox('مسح تأشير الحضور لهذه الفترة؟')) { D().att[b.dataset.s] = {}; save(); render(); } }
  else if (a === 'bPer') { BOARD_PI = +b.dataset.v; render(); }
  else if (a === 'bPrint') { const f = FORMS.find(x => x.id === 'obsNames'); openPreview([{ land: false, pages: buildForm(f, { ses: b.dataset.s }), t: 'أسماء الملاحظين على اللجان' }], fname('أسماء الملاحظين على اللجان')); }
});
