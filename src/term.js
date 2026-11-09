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
    out: `${imgs.length || c.html ? '<button class="btn sm" data-tact="calView" type="button">عرض التقويم وطباعته</button>' : ''}<details class="caldates"><summary>التواريخ المعتمدة${noUp ? '' : ' (تعديل)'}</summary><div class="acts wrap">${field('t1', 'بداية الفصل الأول')}${field('ex1a', 'اختبارات الفصل الأول من')}${field('ex1b', 'إلى')}${field('mida', 'إجازة منتصف العام من')}${field('midb', 'إلى')}${field('t2', 'بداية الفصل الثاني')}</div></details>` });
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
  if (!['home', 'assign', 'daily', 'settings', 'files'].includes(tab)) return '';
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
