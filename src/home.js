/* ===================== لوحة القيادة ===================== */
const DAY_ITEMS = [
  { k: 'openEnv', t: 'محضر فتح مظروف الأسئلة', per: 'ses' },
  { k: 'agree', t: 'محضر اتفاقية التصحيح وسلامة الأسئلة', per: 'ses' },
  { k: 'daily', t: 'كشف الملاحظين واستلام أوراق الإجابة', per: 'ses' },
  { k: 'obsNames', t: 'أسماء الملاحظين على اللجان (للتوقيع)', per: 'ses' },
  { k: 'obsTable', t: 'جدول توزيع الملاحظين مع التوقيع', per: 'ses' },
  { k: 'qEnv', t: 'ظروف أسئلة الطلاب (لكل لجنة)', per: 'ses', heavy: true },
  { k: 'aEnv', t: 'ظروف أوراق إجابات الطلاب', per: 'ses' },
  { k: 'dailyAbs', t: 'كشف الغياب اليومي', per: 'day' }
];
const STAGES = [
  { k: 'start', t: 'بداية العام', d: 'الإسناد ونصاب المعلمين وإقرار إنهاء المقرر', ids: ['taSheet', 'taLoad', 'stList', 'complete', 'tList'] },
  { k: 'pre', t: 'قبل الاختبارات', d: 'الجدول واللجان والكروكي والمناداة والتكليفات', ids: ['schedule', 'comCounts', 'comPlaces', 'comSchedule', 'sticker', 'callSheet', 'assign', 'receipt', 'obsInstr', 'stuGuide'] },
  { k: 'during', t: 'أثناء الاختبارات', d: 'أوراق كل الأيام والمحاضر الفارغة', ids: ['@days', 'absence', 'cheat', 'violation', 'late15', 'lateMore', 'lateList'] },
  { k: 'post', t: 'بعد الاختبارات', d: 'توزيع التصحيح وحصر الغائبين ومحاضر الأخطاء', ids: ['correct', 'absBySub', 'errQ', 'errA', 'gradeEst'] }
];
function todayIso() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function pickDay() {
  const t = todayIso(); let i = S.days.findIndex(d => d.g === t); if (i >= 0) return { i, today: true };
  i = S.days.findIndex(d => d.g > t); return { i: i >= 0 ? i : 0, today: false };
}
let HOME_DAY = null;
function bagSel() { S.s.bagSel = S.s.bagSel || { openEnv: true, agree: true, daily: true, obsTable: false, qEnv: false, aEnv: true, dailyAbs: true }; if (S.s.bagSel.obsNames == null) S.s.bagSel.obsNames = true; return S.s.bagSel; }
function fById(id) { return FORMS.find(f => f.id === id); }
function dayGroups(di) {
  const d = S.days[di]; if (!d) return [];
  const sel = bagSel(), out = [];
  DAY_ITEMS.forEach(it => {
    if (!sel[it.k]) return; const f = fById(it.k); if (!f) return;
    if (it.per === 'day') { const pages = buildForm(f, { ses: di + '_0' }); if (pages.length) out.push({ land: f.land, pages, t: `${it.t} – ${dayName(d)} ${dateShort(d)}` }); return; }
    d.p.forEach((p, pi) => { const pages = buildForm(f, { ses: `${di}_${pi}` }); if (pages.length) out.push({ land: f.land, pages, t: `${it.t} – ${dayName(d)} ${dateShort(d)}${d.p.length > 1 ? ' – الفترة ' + p.n : ''}` }); });
  });
  return out;
}
function allDaysGroups() { return S.days.flatMap((d, i) => dayGroups(i)); }
function formGroups(ids) {
  return ids.flatMap(id => { if (id === '@days') return allDaysGroups(); const f = fById(id); if (!f) return []; const pages = buildForm(f, {}); return pages.length ? [{ land: f.land, pages, t: f.t }] : []; });
}
function withCover(groups, ttl, sub) {
  const PER1 = 30, PERN = 40;
  const n = groups.length; const tocPages = n <= PER1 ? 1 : 1 + Math.ceil((n - PER1) / PERN);
  let pg = tocPages + 1; const toc = groups.map(g => { const r = { t: g.t, from: pg, n: g.pages.length }; pg += g.pages.length; return r; });
  const head = [H('م', { w: '6%' }), H('المحتوى'), H('من صفحة', { w: '12%' }), H('عدد الصفحات', { w: '13%' })];
  const tbl = (part, off) => T([head, ...part.map((x, i) => [off + i + 1, { v: esc(x.t), al: 'right' }, `<b>${x.from}</b>`, x.n])], { cls: 'dense nogrow' });
  const pages = [`<p class="dt" style="font-size:24pt;margin-top:16px">${esc(ttl)}</p><p class="ds" style="font-size:13pt">${yearLine()}</p>${sub ? `<p class="ds">${esc(sub)}</p>` : ''}` + sp(8) +
    `<p class="lbl">فهرس المحتويات (${pg - 1} صفحة):</p>` + tbl(toc.slice(0, PER1), 0) + (tocPages === 1 ? sp(10) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep], ['مدير المدرسة', S.s.principal]]) : '')];
  for (let k = PER1, pi = 2; k < n; k += PERN, pi++) {
    const last = k + PERN >= n;
    pages.push(title('فهرس المحتويات (تابع)') + tbl(toc.slice(k, k + PERN), k) + (last ? sp(10) + sigs([['وكيل الشؤون التعليمية', S.s.eduDep], ['مدير المدرسة', S.s.principal]]) : ''));
  }
  return [{ land: false, pages, t: 'الغلاف والفهرس' }, ...groups];
}
function bagGroups(kind, arg) {
  if (kind === 'day') { const d = S.days[arg]; return withCover(dayGroups(arg), 'أوراق يوم الاختبار', d ? `${dayName(d)} ${dateTxt(d, ' – ')}` : ''); }
  if (kind === 'alldays') return withCover(allDaysGroups(), 'ملف أوراق أيام الاختبارات', `${S.days.length} أيام اختبار`);
  if (kind === 'stage') { const st = STAGES.find(x => x.k === arg); return withCover(formGroups(st.ids), `ملف ${st.t}`, st.d); }
  if (kind === 'full') return withCover(STAGES.flatMap(st => formGroups(st.ids).map(g => Object.assign({}, g, { t: `${st.t}: ${g.t}` }))), 'الملف الشامل لأعمال الاختبارات', 'مقدم لإدارة المدرسة');
  return [];
}
function bagName(kind, arg) {
  if (kind === 'day') { const d = S.days[arg]; return fname(`أوراق يوم ${d ? dayName(d) + ' ' + dateShort(d).replace(/\//g, '-') : ''}`); }
  if (kind === 'alldays') return fname('ملف أوراق أيام الاختبارات');
  if (kind === 'stage') return fname('ملف ' + STAGES.find(x => x.k === arg).t);
  return fname('الملف الشامل لأعمال الاختبارات');
}
function bagPages(groups) { return groups.reduce((a, g) => a + g.pages.length, 0); }
function bagBtns(kind, arg, big) {
  const a = arg == null ? '' : ` data-arg="${arg}"`;
  return `<div class="bagb${big ? ' big' : ''}"><button class="btn sm pri" data-act="bag" data-op="pv" data-kind="${kind}"${a} type="button">معاينة</button><button class="btn sm" data-act="bag" data-op="print" data-kind="${kind}"${a} type="button">طباعة</button><button class="btn sm" data-act="bag" data-op="pdf" data-kind="${kind}"${a} type="button">PDF</button><button class="btn sm" data-act="bag" data-op="word" data-kind="${kind}"${a} type="button">Word</button></div>`;
}

/* ----- التنبيهات ----- */
function alerts() {
  const A = []; const add = (lvl, t, tab) => A.push({ lvl, t, tab });
  const gt = gradeTotals(), ct = comTotals();
  if (!S.students.length) add('warn', 'لم يُرفع ملف نور بعد؛ الأعداد مأخوذة من الإدخال اليدوي.', 'students');
  const mis = G.filter(g => gt[g] !== ct[g]); if (mis.length) add('bad', `أعداد اللجان لا تطابق أعداد الطلاب في: ${mis.map(g => `${GSHORT[g]} (لجان ${ct[g]} / طلاب ${gt[g]})`).join('، ')}.`, 'committees');
  if (S.students.length && !S.distributed) add('warn', 'لم يُوزّع الطلاب بالأسماء على اللجان؛ كشوف المناداة وأرقام الجلوس غير جاهزة.', 'committees');
  if (!S.ta.length) add('warn', 'لا يوجد إسناد للمعلمين.', 'assign');
  const sched = []; S.days.forEach(d => d.p.forEach(p => G.forEach(g => { const sb = (p.s[g] || '').trim(); if (sb && !sched.some(x => x.g === g && x.sub === sb)) sched.push({ g, sub: sb }); })));
  const noT = sched.filter(x => { const r = S.st.find(y => +y.g === x.g && y.sub.trim() === x.sub); return !r || !String(r.t || '').trim(); });
  if (noT.length) add('bad', `مواد في الجدول بلا معلم مكلف بالأسئلة: ${noT.map(x => x.sub).join('، ')}.`, 'staff');
  if (S.ta.length && setMeta(ACTIVE).sem === S.s.sem) { const noTa = sched.filter(x => !teachersOfSubject(x.sub, x.g).length); if (noTa.length) add('warn', `مواد في الجدول لا يوجد لها إسناد: ${noTa.map(x => x.sub).join('، ')} — تحقق من الفصل الدراسي أو أسماء المواد.`, 'assign'); }
  S.days.forEach((d, di) => { const wd = isoToDate(d.g).getUTCDay(); if (wd === 5 || wd === 6) add('warn', `يوم ${dayName(d)} ${dateShort(d)} في الجدول يوافق عطلة نهاية الأسبوع.`, 'schedule'); if (!d.p.some(p => G.some(g => (p.s[g] || '').trim()))) add('warn', `يوم ${dayName(d)} ${dateShort(d)} بلا مواد.`, 'schedule'); });
  const dupDates = S.days.map(d => d.g).filter((g, i, a) => a.indexOf(g) !== i); if (dupDates.length) add('bad', 'يوجد تاريخ مكرر في جدول الاختبارات.', 'schedule');
  let missing = 0, dups = 0, busy = 0; const anyObs = Object.keys(S.obs).some(k => obsList(k).some(Boolean));
  sessions().forEach(se => {
    const seen = {}; const bz = new Set(sessionSubjects(se).flatMap(x => teachersOfSubject(x.sub, x.g).concat(teacherOf(x.sub, x.g))).filter(Boolean).map(normName));
    S.com.forEach(c => { const l = obsList(`${se.key}_${c.no}`).filter(Boolean); if (l.length < obsNeed(c.no)) missing++; l.forEach(n => { const k = normName(n); seen[k] = (seen[k] || 0) + 1; if (bz.has(k)) busy++; }); });
    dups += Object.values(seen).filter(v => v > 1).length;
  });
  if (!anyObs) add('warn', 'لم يُوزّع الملاحظون على اللجان بعد.', 'staff');
  else { if (missing) add('warn', `${missing} موضع ملاحظة بلا ملاحظ في الفترات.`, 'staff'); if (dups) add('bad', `${dups} حالة ملاحظ مكرر في نفس الفترة.`, 'staff'); if (busy) add('warn', `${busy} حالة تكليف معلم بالملاحظة في فترة اختبار مادته.`, 'staff'); }
  return A;
}

/* ----- الصفحة ----- */
function vHome() {
  const gt = gradeTotals(), ct = comTotals(), al = alerts();
  const sched = new Set(); S.days.forEach(d => d.p.forEach(p => G.forEach(g => { if ((p.s[g] || '').trim()) sched.add(g + p.s[g].trim()); })));
  const ses = sessions(); let filled = 0, need = 0; ses.forEach(se => S.com.forEach(c => { need += obsNeed(c.no); filled += Math.min(obsNeed(c.no), obsList(`${se.key}_${c.no}`).filter(Boolean).length); }));
  const noT = S.st.filter(x => !String(x.t || '').trim()).length;
  const cards = [
    { tab: 'students', t: 'الطلاب', v: S.students.length || gt[1] + gt[2] + gt[3], s: `أول ${gt[1]} · ثاني ${gt[2]} · ثالث ${gt[3]}`, ok: S.students.length > 0 },
    { tab: 'committees', t: 'اللجان', v: S.com.length, s: G.every(g => gt[g] === ct[g]) ? (S.distributed ? 'مطابقة وموزعة بالأسماء' : 'الأعداد مطابقة') : 'الأعداد غير مطابقة', ok: G.every(g => gt[g] === ct[g]) && (S.distributed || !S.students.length) },
    { tab: 'assign', t: 'الإسناد', v: S.ta.length, s: `${new Set(S.ta.map(x => x.t)).size} معلماً`, ok: S.ta.length > 0 },
    { tab: 'staff', t: 'المواد المختبرة', v: sched.size, s: noT ? `${noT} بلا معلم` : 'كل المواد لها معلم', ok: !noT && sched.size > 0 },
    { tab: 'schedule', t: 'أيام الاختبار', v: S.days.length, s: S.days.length ? `${dateShort(S.days[0])} ← ${dateShort(S.days[S.days.length - 1])}` : 'لم يُدخل الجدول', ok: S.days.length > 0 },
    { tab: 'staff', t: 'الملاحظون', v: need ? Math.round(filled / need * 100) + '%' : '—', s: `${filled} من ${need} موضع`, ok: need > 0 && filled >= need }
  ];
  if (HOME_DAY == null || !S.days[HOME_DAY]) HOME_DAY = pickDay().i;
  const pd = pickDay(); const day = S.days[HOME_DAY];
  const dg = day ? dayGroups(HOME_DAY) : []; const sel = bagSel();
  return `
  <section class="hero">
    <div class="hcards">${cards.map(c => `<button type="button" class="hcard ${c.ok ? 'ok' : 'todo'}" data-tab="${c.tab}"><span class="ht">${c.t}</span><b>${c.v}</b><small>${c.s}</small><i class="hdot" aria-hidden="true"></i></button>`).join('')}</div>
    <div class="searchrow"><button type="button" class="srch" data-act="palette"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><span>ابحث عن أي نموذج أو معلم أو طالب أو إجراء…</span><kbd>Ctrl K</kbd></button></div>
  </section>
  <div class="hgrid">
    <section class="card alerts">
      <h2>ما يحتاج انتباهك <span class="cnt ${al.length ? 'w' : 'g'}">${al.length || '✓'}</span></h2>
      ${al.length ? `<ul class="alist">${al.map(a => `<li class="${a.lvl}"><span>${esc(a.t)}</span><button type="button" class="btn sm ghost" data-tab="${a.tab}">إصلاح</button></li>`).join('')}</ul>` : '<p class="okt">كل شيء جاهز للطباعة.</p>'}
    </section>
    <section class="card bag today">
      <div class="bagh"><h2>حقيبة اليوم</h2>${pd.today && HOME_DAY === pd.i ? '<span class="pill">اليوم</span>' : HOME_DAY === pd.i ? '<span class="pill soft">أقرب يوم قادم</span>' : ''}</div>
      ${S.days.length ? `<div class="dchips">${S.days.map((d, i) => `<button type="button" class="dchip${i === HOME_DAY ? ' on' : ''}${i === pd.i && pd.today ? ' now' : ''}" data-act="homeDay" data-v="${i}"><b>${dayName(d)}</b><small>${dateShort(d)}</small></button>`).join('')}</div>
      <div class="dsubs">${day ? day.p.map(p => `<div class="dsub"><span class="per">${esc(p.n)} <small>${esc(p.t)}</small></span>${G.filter(g => (p.s[g] || '').trim()).map(g => `<span class="sb" style="--gc:${GCOL[g]}">${esc(p.s[g])}</span>`).join('')}</div>`).join('') : ''}</div>
      <div class="bitems">${DAY_ITEMS.map(it => `<label class="bit"><input type="checkbox" data-act-bag="${it.k}" ${sel[it.k] ? 'checked' : ''}><span>${it.t}</span>${it.heavy ? '<small>صفحات كثيرة</small>' : ''}</label>`).join('')}</div>
      <div class="bagf"><span class="hint">${bagPages(dg)} صفحة لهذا اليوم</span>${bagBtns('day', HOME_DAY, true)}</div>` : '<p class="hint">أدخل أيام الاختبار أولاً من صفحة «جدول الاختبارات».</p>'}
    </section>
  </div>
  <section class="card bags">
    <h2>الحقائب الجاهزة</h2>
    <p class="hint">كل حقيبة ملف واحد مرتب بغلاف وفهرس بأرقام الصفحات. اختيارات «حقيبة اليوم» أعلاه تنطبق على أوراق كل الأيام.</p>
    <div class="bgrid">
      <div class="bcard star"><div class="bct"><b>الملف الشامل لأعمال الاختبارات</b><small>كل المراحل وكل الأيام في ملف واحد للتقديم للإدارة</small></div>${bagBtns('full')}</div>
      <div class="bcard"><div class="bct"><b>حقيبة كل الأيام</b><small>أوراق جميع أيام الاختبار مرتبة يوماً يوماً (${S.days.length} أيام)</small></div>${bagBtns('alldays')}</div>
      ${STAGES.map((st, i) => `<div class="bcard"><div class="bct"><span class="stn">${i + 1}</span><b>${st.t}</b><small>${st.d}</small></div>${bagBtns('stage', st.k)}</div>`).join('')}
    </div>
  </section>
  <section class="card lib">
    <div class="libh"><h2>مكتبة النماذج</h2><input class="in" id="libQ" type="search" placeholder="ابحث في النماذج… مثل: غياب، لجنة، تكليف" value="${esc(LIBQ)}"></div>
    <div class="libgrid" id="libGrid">${libCards()}</div>
  </section>`;
}
let LIBQ = '';
const KW = { dailyAbs: 'غياب', absence: 'غياب', absBySub: 'غياب', cheat: 'غش مخالفة', violation: 'مخالفة غش', late15: 'تأخر', lateMore: 'تأخر', lateList: 'تأخر', sticker: 'كروكي ملصق باب', callSheet: 'مناداة جلوس', assign: 'تكليف اسئلة', receipt: 'استلام اسئلة', taSheet: 'اسناد', taLoad: 'نصاب اسناد', obsTable: 'ملاحظين ملاحظ', daily: 'ملاحظين استلام', obsInstr: 'ملاحظين تعليمات', deliver: 'تسليم لجان' };
function libCards() {
  const q = normName(LIBQ);
  const list = FORMS.filter(f => !q || normName(f.t + ' ' + f.grp + ' ' + (KW[f.id] || '')).includes(q));
  if (!list.length) return '<p class="hint">لا توجد نماذج مطابقة.</p>';
  return list.map(f => `<button type="button" class="lcard" data-act="libOpen" data-v="${f.id}"><span class="lthumb${f.land ? ' land' : ''}" data-thumb="${f.id}"></span><span class="lt">${esc(f.t)}</span><small>${esc(f.grp)}${f.land ? ' · أفقي' : ''}</small></button>`).join('');
}
window.__thumbs = window.__thumbs || {};
function renderThumbs() {
  const els = $$('[data-thumb]'); if (!els.length) return;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { fillThumb(e.target); io.unobserve(e.target); } }), { rootMargin: '200px' }) : null;
  els.forEach(el => io ? io.observe(el) : fillThumb(el));
}
function fillThumb(el) {
  const id = el.dataset.thumb; const f = fById(id); if (!f) return;
  try {
    const TH = window.__thumbs; if (!TH[id]) { const pages = buildForm(f, {}); TH[id] = pages[0] || '<p class="txt" style="text-align:center;margin-top:80px">يحتاج بيانات</p>'; }
    el.innerHTML = pageWrap(TH[id], f.land);
  } catch (e) { }
}

/* ----- لوحة البحث السريع ----- */
let PAL = { items: [], i: 0 };
function palItems(q) {
  q = normName(q || ''); const out = [];
  const m = s => !q || normName(s).includes(q);
  TABS.forEach(([k, t]) => { if (m(t)) out.push({ ic: '◧', t, s: 'انتقال إلى الصفحة', run: () => go(k) }); });
  out.push(...[
    { ic: '▣', t: 'حقيبة اليوم', s: 'معاينة أوراق اليوم', kw: 'حقيبه اليوم اوراق', run: () => openPreview(bagGroups('day', HOME_DAY ?? pickDay().i), bagName('day', HOME_DAY ?? pickDay().i)) },
    { ic: '▣', t: 'حقيبة كل الأيام', s: 'معاينة أوراق جميع الأيام', kw: 'حقيبه كل الايام', run: () => openPreview(bagGroups('alldays'), bagName('alldays')) },
    { ic: '★', t: 'الملف الشامل لأعمال الاختبارات', s: 'معاينة الملف الكامل للإدارة', kw: 'ملف شامل اداره', run: () => openPreview(bagGroups('full'), bagName('full')) }
  ].filter(x => m(x.t + ' ' + x.kw)));
  FORMS.forEach(f => { if (m(f.t + ' ' + (KW[f.id] || '') + ' ' + f.grp)) out.push({ ic: '▤', t: f.t, s: 'معاينة قبل الطباعة · ' + f.grp, run: () => openPreview(groupsOf(f.id, {}), fname(f.t)) }); });
  if (q.length >= 2) {
    allTeachers().filter(m).slice(0, 6).forEach(n => { const subs = S.ta.filter(x => normName(x.t) === normName(n)).map(x => `${x.sub} (${GSHORT[x.g]})`); out.push({ ic: '◉', t: n, s: subs.length ? 'معلم · ' + [...new Set(subs)].join('، ') : 'معلم', run: () => go('assign') }); });
    S.students.filter(x => m(x.n)).slice(0, 6).forEach(x => out.push({ ic: '◌', t: x.n, s: `طالب · ${GSHORT[x.g]} ش ${x.sec}${x.seat ? ' · جلوس ' + x.seat + ' · لجنة ' + x.com : ''}`, run: () => { SF.q = x.n; SF.g = 'all'; SF.sec = 'all'; SF.src = 'noor'; saveSF(); go('students'); } }));
  }
  return out.slice(0, 14);
}
function openPalette() {
  const m = $('#palModal'); m.hidden = false; $('#palIn').value = ''; palRender(); setTimeout(() => $('#palIn').focus(), 20);
}
function closePalette() { $('#palModal').hidden = true; }
function palRender() {
  PAL.items = palItems($('#palIn').value); PAL.i = Math.min(PAL.i, Math.max(0, PAL.items.length - 1));
  $('#palList').innerHTML = PAL.items.map((x, i) => `<li class="${i === PAL.i ? 'on' : ''}" data-pi="${i}"><span class="pic">${x.ic}</span><span class="ptx"><b>${esc(x.t)}</b><small>${esc(x.s)}</small></span></li>`).join('') || '<li class="empty">لا نتائج</li>';
}
function palRun(i) { const x = PAL.items[i]; if (!x) return; closePalette(); x.run(); }
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K' || e.key === 'ك')) { e.preventDefault(); openPalette(); return; }
  if ($('#palModal') && !$('#palModal').hidden) {
    if (e.key === 'Escape') closePalette();
    else if (e.key === 'ArrowDown') { PAL.i = Math.min(PAL.items.length - 1, PAL.i + 1); palRender(); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { PAL.i = Math.max(0, PAL.i - 1); palRender(); e.preventDefault(); }
    else if (e.key === 'Enter') { palRun(PAL.i); e.preventDefault(); }
  }
});
document.addEventListener('input', e => { if (e.target.id === 'palIn') { PAL.i = 0; palRender(); } if (e.target.id === 'libQ') { LIBQ = e.target.value; $('#libGrid').innerHTML = libCards(); renderThumbs(); } });
document.addEventListener('click', e => {
  const li = e.target.closest('#palList li[data-pi]'); if (li) return palRun(+li.dataset.pi);
  if (e.target.id === 'palModal') closePalette();
});
document.addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.actBag; if (k) { bagSel()[k] = e.target.checked; save(); render(); } });
async function runBag(op, kind, arg) {
  const groups = bagGroups(kind, arg); const name = bagName(kind, arg);
  if (bagPages(groups) <= 1) return toast('لا توجد صفحات في هذه الحقيبة بعد', true);
  if (op === 'pv') return openPreview(groups, name);
  if (op === 'print') return printPages(groups);
  if (op === 'word') return wordDoc(groups, name);
  if (op === 'pdf') { const n = bagPages(groups); if (n > 60) toast(`ملف من ${n} صفحة — قد يستغرق التجهيز بضع دقائق`); return downloadPdf(groups, name); }
}

/* =====================================================================
   الأدوار: كل شخص يرى ما يخصه، بلونه
   ===================================================================== */
var PEOPLE = {
  admin: { n: 'مسؤول الاختبارات', who: 'فهد', c: '#2563eb', d: 'كل مراحل العمل: الملفات والإسناد والجدول واللجان والتكليفات والمطبوعات', ic: 'ف', set: 'ta', home: 'files' },
  agent: { n: 'وكيل شؤون المعلمين', who: 'الوكيل', c: '#ea580c', d: 'المعلمون والإسناد بحفظه الخاص، وحصص الانتظار والمناوبة اليومية — دون المساس بالاختبارات', ic: 'و', set: 'ta-agent', home: 'daily' },
  sup: { n: 'مشرف دور / لجنة', who: 'المشرف', c: '#ca8a04', d: 'شاشة «يوم الاختبار» ومطبوعات اليوم بضغطة واحدة — للاطلاع والطباعة', ic: 'م', set: 'ta', home: 'today' }
};
var BOTH_C = '#059669';
var ROLE = (() => { try { const r = localStorage.getItem(LS_KEY + '-role'); return PEOPLE[r] ? r : ''; } catch (e) { return ''; } })();
var ROLE_TABS = { admin: null, agent: ['files', 'assign', 'daily', 'backup', 'settings'], sup: ['today', 'daily', 'forms', 'backup'] };
function roleAllows(k) { if (!ROLE_TABS) return true; const r = ROLE_TABS[ROLE || 'admin']; return !r || r.includes(k); }
function exReadOnly() { return (!!ROLE && ROLE !== 'admin') || ACTIVE === 'ta-agent'; }
function setRole(r) {
  ROLE = r; try { localStorage.setItem(LS_KEY + '-role', r); } catch (e) { }
  const want = PEOPLE[r].set; if (want !== ACTIVE && r !== 'sup') { try { localStorage.setItem(LS_KEY + '-taset', want); } catch (e) { } setActive(want); }
  TABS = ALL_TABS.filter(x => roleAllows(x[0]));
  go(PEOPLE[r].home);
}
function roleModal(first) {
  let m = $('#roleModal'); if (!m) { m = document.createElement('div'); m.id = 'roleModal'; m.className = 'modal'; document.body.appendChild(m); }
  m.innerHTML = `<div class="box rolebox" role="dialog" aria-label="اختيار الدور">
    <h3>${first ? 'أهلاً بك — من أنت؟' : 'تغيير الدور على هذا الجهاز'}</h3>
    <p class="hint">اختر دورك ليعرض لك النظام ما يخصك فقط. يمكنك تغييره لاحقاً من الشارة الملوّنة أعلى الصفحة.</p>
    <div class="rolegrid">${Object.entries(PEOPLE).map(([k, p]) => `<button type="button" class="rolec${k === ROLE ? ' on' : ''}" style="--rc:${p.c}" data-role="${k}"><span class="ric">${p.ic}</span><b>${p.n}</b><small>${p.d}</small></button>`).join('')}</div>
    <p class="hint rolelegend"><span style="--rc:${PEOPLE.admin.c}">فهد</span><span style="--rc:${PEOPLE.agent.c}">الوكيل</span><span style="--rc:${BOTH_C}">كلاهما (المشاركة)</span><span style="--rc:${PEOPLE.sup.c}">المشرف</span> — هذه الألوان تميّز عمل كل شخص في كل مكان.</p>
    ${first ? '' : '<div class="acts"><button class="btn ghost" data-rclose="1" type="button">إلغاء</button></div>'}</div>`;
  m.hidden = false;
  m.onclick = e => {
    const b = e.target.closest('[data-role]'); if (b) { m.hidden = true; const fresh = !ROLE; setRole(b.dataset.role); if (fresh) setTimeout(() => startTour(), 450); return; }
    if (e.target.closest('[data-rclose]') || (e.target === m && !first)) m.hidden = true;
  };
}
function updRoleChip() { if (!PEOPLE) return;
  const c = $('#roleChip'); if (!c) return; const p = PEOPLE[ROLE || 'admin'];
  c.innerHTML = `<i>${p.ic}</i>${p.n}`; c.style.setProperty('--rc', p.c);
}
function personColor(by) { const r = String(by || '').split('%7C')[0].split('|')[0]; return (PEOPLE[r] || {}).c || '#64748b'; }

/* =====================================================================
   يوم الاختبار: شاشة بأزرار كبيرة لأي إداري أو مشرف
   ===================================================================== */
var TODAY_DI = null;
var TODAY_ONE = [
  { id: 'callSheet', t: 'كشوف المناداة', ic: '📋', d: 'لكل لجنة: أسماء الطلاب وتسليم الأوراق' },
  { id: 'sticker', t: 'ملصقات أبواب اللجان', ic: '🚪', d: 'كروكي ورقم كل لجنة' },
  { id: 'cheat', t: 'محضر حالة غش', ic: '⚠️', d: 'نموذج فارغ جاهز' },
  { id: 'absence', t: 'محضر غياب طالب', ic: '🚫', d: 'نموذج فارغ جاهز' },
  { id: 'late15', t: 'تعهد تأخر طالب', ic: '⏱', d: 'لا يتجاوز 15 دقيقة' },
  { id: 'violation', t: 'محضر مخالفة', ic: '📝', d: 'مخالفة الأنظمة والتعليمات' }
];
function vToday() {
  if (!S.days.length) return `<section class="card empty"><h2>لا يوجد جدول اختبارات بعد</h2><p class="hint">أدخل أيام الاختبار في «جدول الاختبارات» لتظهر هنا أوراق كل يوم.</p>${roleAllows('schedule') ? '<button class="btn pri" data-tab="schedule" type="button">فتح جدول الاختبارات</button>' : ''}</section>`;
  if (TODAY_DI == null || !S.days[TODAY_DI]) TODAY_DI = pickDay().i;
  const pd = pickDay(), d = S.days[TODAY_DI], di = TODAY_DI, t = todayIso();
  const diff = Math.round((isoToDate(d.g) - isoToDate(t)) / 864e5);
  const when = diff === 0 ? '<em class="tdy now">اليوم</em>' : diff === 1 ? '<em class="tdy">غداً</em>' : diff > 1 ? `<em class="tdy">بعد ${diff} أيام</em>` : '<em class="tdy past">انتهى</em>';
  const chips = S.days.map((x, i) => `<button type="button" class="dchip${i === di ? ' on' : ''}${x.g === t ? ' today' : ''}" data-act="todayDay" data-v="${i}"><b>${dayName(x)}</b><small>${dateShort(x)}</small></button>`).join('');
  const pers = d.p.map((p, pi) => `<div class="tper"><div class="tph"><b>الفترة ${esc(p.n || pi + 1)}</b><span>${esc(p.t || '')}</span></div><div class="tsubs">${G.map(g => (p.s[g] || '').trim() ? `<span class="tsub" style="--gc:${GCOL[g]}"><small>${GSHORT[g]}</small>${esc(p.s[g])}</span>` : '').join('') || '<span class="hint">لا مواد</span>'}</div></div>`).join('');
  const tile = (id, ttl, ic, sub, extra = '') => `<article class="ttile"><div class="tti">${ic}</div><div class="ttx"><b>${ttl}</b><small>${sub}</small></div><div class="tta"><button class="btn sm pri" data-act="todayForm" data-op="pv" data-f="${id}"${extra} type="button">معاينة وطباعة</button><button class="btn sm" data-act="todayForm" data-op="pdf" data-f="${id}"${extra} type="button">PDF</button></div></article>`;
  const dayTiles = DAY_ITEMS.map(it => tile(it.k, it.t, it.per === 'day' ? '📅' : '🕘', it.per === 'day' ? 'لهذا اليوم' : (d.p.length > 1 ? `لكل فترة (${d.p.length})` : 'لفترة اليوم'))).join('');
  return `<section class="card todayhero">
    <div class="tdays" role="tablist" aria-label="أيام الاختبار">${chips}</div>
    <div class="tmain"><div><small>${pd.today && di === pd.i ? 'اختبارات اليوم' : 'يوم الاختبار المختار'}</small><h2 class="tday">${dayName(d)} ${when}</h2><p class="tdate">${dateTxt(d, ' — ')}</p></div>
      <div class="tbag"><button class="btn big pri" data-act="bag" data-op="pv" data-kind="day" data-arg="${di}" type="button">🧳 حقيبة اليوم كاملة</button><button class="btn" data-act="bag" data-op="pdf" data-kind="day" data-arg="${di}" type="button">PDF للحقيبة</button></div></div>
    <div class="tpers">${pers}</div>
  </section>
  ${typeof boardHtml === 'function' ? boardHtml(di) : ''}
  <section class="card"><h2>أوراق هذا اليوم</h2><div class="ttiles">${dayTiles}</div></section>
  <section class="card"><h2>نماذج تحتاجها أثناء الاختبار</h2><div class="ttiles">${TODAY_ONE.map(x => tile(x.id, x.t, x.ic, x.d)).join('')}</div></section>`;
}
function todayGroups(fid) {
  const d = S.days[TODAY_DI], f = fById(fid); if (!d || !f) return [];
  const it = DAY_ITEMS.find(x => x.k === fid);
  if (!it) { const pages = buildForm(f, {}); return pages.length ? [{ land: f.land, pages, t: f.t }] : []; }
  if (it.per === 'day') { const pages = buildForm(f, { ses: TODAY_DI + '_0' }); return pages.length ? [{ land: f.land, pages, t: it.t }] : []; }
  return d.p.map((p, pi) => ({ land: f.land, pages: buildForm(f, { ses: `${TODAY_DI}_${pi}` }), t: `${it.t} – الفترة ${p.n}` })).filter(g => g.pages.length);
}

/* =====================================================================
   مهام المرحلة + تنبيهات المرحلة
   ===================================================================== */
function stageTasks(k) {
  const tx = s => String(s || '').trim();
  const sched = []; S.days.forEach(d => d.p.forEach(p => G.forEach(g => { const sb = tx(p.s[g]); if (sb) sched.push({ g, sub: sb }); })));
  let chosen = false; try { chosen = !!localStorage.getItem(LS_KEY + '-taset'); } catch (e) { }
  const gt = gradeTotals(), ct = comTotals(); const ses = sessions();
  let need = 0, filled = 0; ses.forEach(se => S.com.forEach(c => { need += obsNeed(c.no); filled += Math.min(obsNeed(c.no), obsList(`${se.key}_${c.no}`).filter(Boolean).length); }));
  const T = {
    files: ROLE === 'agent' ? [['رفع الجدول المدرسي العام', !!(S.daily && S.daily.tt), 'fc_tt'], ['تحديث قائمة المعلمين', S.teachers.length > 0, 'fc_tch']] : [
      ['رفع ملف نور', S.students.length > 0, 'fc_noor'], ['رفع ملف الإرشاد الطلابي', S.guide.length > 0, 'fc_guide'], ['تحديث قائمة المعلمين', S.teachers.length > 0, 'fc_tch'], ['رفع الجدول المدرسي العام', !!(S.daily && S.daily.tt), 'fc_tt']],
    assign: [['اختيار الحفظ الذي تعمل عليه', chosen, 'setsCard'], ['إدخال الإسناد (رفع ملف أو تعديل)', S.ta.length > 0, 'h:ملف الإسناد'], ['لكل سطر معلم', S.ta.length > 0 && S.ta.every(x => tx(x.t)), 'h:تعديل الإسناد']],
    schedule: [['إدخال أيام الاختبار وتواريخها', S.days.length > 0, 'first'], ['إدخال مواد كل صف', sched.length > 0, 'first']],
    committees: [['أعداد اللجان تطابق الطلاب', G.every(g => gt[g] === ct[g]), 'first'], ['توزيع الطلاب بالأسماء وأرقام الجلوس', !!S.distributed, 'first']],
    staff: [['معلم لكل مادة مختبرة', sched.length > 0 && sched.every(x => { const r = S.st.find(y => +y.g === x.g && tx(y.sub) === x.sub); return r && tx(r.t); }), 'h:معلمو المواد'], ['توزيع الملاحظين على كل اللجان', need > 0 && filled >= need, 'h:توزيع الملاحظين']]
  };
  return (T[k] || []).map(([t, ok, go]) => ({ t, ok, go }));
}
var TAB_ALIAS_AL = { students: 'files' };
function stageAlerts(k) { return alerts().filter(a => (TAB_ALIAS_AL[a.tab] || a.tab) === k); }
function tasksHtml(k) {
  const ts = stageTasks(k), al = stageAlerts(k); if (!ts.length && !al.length) return '';
  const done = ts.filter(x => x.ok).length;
  return `<section class="tasks" aria-label="مهام المرحلة">${ts.length ? `<div class="tkh"><b>مهام هذه المرحلة</b><span class="tkp"><i style="width:${Math.round(done / ts.length * 100)}%"></i></span><small>${done} من ${ts.length}${done === ts.length ? ' — مكتملة ✓' : ''}</small></div>
    <div class="tkl">${ts.map(x => `<button type="button" class="tk${x.ok ? ' ok' : ''}" data-tgo="${esc(x.go)}"><i>${x.ok ? '✓' : ''}</i>${esc(x.t)}</button>`).join('')}</div>` : ''}
    ${al.length ? `<div class="tal">${al.map(a => `<div class="al ${a.lvl}">${a.lvl === 'bad' ? '⛔' : '⚠️'} ${esc(a.t)}</div>`).join('')}</div>` : ''}</section>`;
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-tgo]'); if (!b) return;
  const g = b.dataset.tgo; let el = null;
  if (g === 'first') el = $('.sbody > section.card'); else if (g.startsWith('h:')) el = $$('.sbody > section.card > h2').find(h => h.textContent.trim().startsWith(g.slice(2))); else el = document.getElementById(g);
  if (el) { const card = el.closest('section,article') || el; scrollTo({ top: card.getBoundingClientRect().top + scrollY - 80, behavior: 'smooth' }); card.classList.add('flash'); setTimeout(() => card.classList.remove('flash'), 1400); }
});

/* =====================================================================
   مساعدة «؟» بجانب كل قسم
   ===================================================================== */
var HELP = {
  'أي إسناد تعمل عليه': 'ثلاثة حفظ مستقلة للإسناد. «حفظ فهد» تُبنى عليه الاختبارات، و«حفظ الوكيل» للفصل القادم، و«المشاركة معاً» للعمل المشترك. الحفظ النشط هو الذي تعدّله الآن.',
  'ملف الإسناد': 'ارفع ملف إسناد المعلمين (Excel أو Word أو PDF) فيُقرأ تلقائياً: المادة والشعب والمعلم وعدد الحصص. ثم اطبع كشف الإسناد بأي صف.',
  'تعديل الإسناد': 'عدّل أي سطر مباشرة: اختر المادة والمعلم من القوائم، وحدد الشعب والحصص. التعديل يُحفظ فوراً.',
  'قائمة المعلمين': 'معلمو المدرسة لهذا الحفظ. تظهر أسماؤهم في كل قوائم الاختيار وكشوف التوقيع والملاحظة.',
  'حصر أعداد الطلاب': 'أعداد الطلاب في كل صف وشعبة من ملف نور، وعليها تُبنى اللجان.',
  'كشوف الطلاب': 'اطبع أو حمّل كشوف الطلاب بأي ترتيب: حسب الصف أو الشعبة، مع الجوالات أو أرقام الجلوس.',
  'معلمو المواد': 'لكل مادة في الجدول معلم يكلّف بوضع أسئلتها. يُقترح تلقائياً من الإسناد ويمكنك تغييره.',
  'بيان توزيع الدرجات': 'بيان مستقل يُطبع وحده. يمكنك رفع بيان جديد (Word أو PDF) ليحل محل البيان المعتمد.',
  'توزيع الملاحظين': 'ملاحظ أو أكثر لكل لجنة في كل فترة. التوزيع التلقائي يتجنب معلم المادة المختبرة في فترتها، ويمكنك الإحلال والتبديل.',
  'القوائم الخاصة': 'طلاب الانتساب والعوق البصري الذين يُختبرون في لجان خاصة.',
  'الحفظ والمزامنة': 'فعّل المزامنة بالرمز لتُحفظ بياناتك على السحابة وتظهر على أي جهاز. لكل قسم سجل آخر 20 نسخة.',
  'أوراق هذا اليوم': 'كل أوراق يوم الاختبار المختار. «حقيبة اليوم كاملة» تجمعها كلها في ملف واحد بغلاف وفهرس.',
  'استمارة حصص الانتظار': 'العرض «حسب الحصة»: كل حصة تحتاج تسديداً في سطر؛ المسه فتظهر ورقة مرتبة من الأنسب (★) وتنتقل تلقائياً للحصة التالية، أو «⚡ وزّع الباقي» لتعبئتها كلها ثم راجع بالنظر (أخضر ✓ تم، برتقالي ينتظر، أحمر ⚠ تعارض). المس اسم الغائب فتظهر حصصه لهذا اليوم. ترتيب أولوية المنتظر: من يدرّس الشعبة نفسها (◆)، ثم من يدرّس الصف، ثم الأقل انشغالاً اليوم (الرقم بجانب الاسم = حصصه مع انتظاره اليوم)، ثم الأقل انتظاراً في الفصل؛ ومن بلغ 5 حصص اليوم يؤخَّر. النجمة ★ لأفضل 3، و«تعبئة تلقائية» تتبع الترتيب نفسه. الغياب لعدة أيام من 🕘. وبجانب كل اسم في قائمة المتاحين زر ⏱: المسه إذا كان المعلم قد خرج قبل هذه الحصة فيُستبعد ويُعاد التوزيع (↺ للتراجع). ومن أنهى حصصه قبل حصة الانتظار يُطوى في «🏁 أنهوا حصصهم» لأنه غالباً خرج. ولمن استأذن أو خرج مبكراً أو تأخر: اختر «⏱ استأذن / خرج مبكراً» أو «⏰ تأخر» أعلى القائمة ثم المس اسمه وحدد الحصة؛ فتُسدَّد حصصه بعد خروجه فقط، ويُستبعد من الانتظار والمناوبة، ويُعاد توزيع أي انتظار كان مكلفاً به تلقائياً. تُطبع مقسّمة حسب الصف.',
  'تقرير الإشراف والمناوبة': 'المناوبة أولويتها لمن لديه الحصة الأخيرة اليوم — السابعة، أو السادسة إن انتهى اليوم بها (⑦ في القائمة)، وزر التعبئة التلقائية يختار منهم الأقل مناوبةً في الفصل. القوائم تنبّه للغائب والمكرر. احفظ اليوم «جدولاً ثابتاً» ليُعبّأ تلقائياً كل أسبوع.',
  'جدول المناوبة الأسبوعي': 'يُجهَّز مرة واحدة: مناوبو كل يوم من أصحاب الحصة الأخيرة في ذلك اليوم (السابعة، أو السادسة في الأيام التي تنتهي بها)، موزعين بعدل على الأسبوع. يُعبّأ به تقرير كل يوم تلقائياً، وإن غاب أحدهم يظهر زر «بديل» من أصحاب الحصة الأخيرة في اليوم نفسه.',
  'الجدول المدرسي العام': 'حصص كل معلم في اليوم المختار؛ الخانة الفارغة تعني أنه متاح.',
  'نماذج تحتاجها أثناء الاختبار': 'محاضر ونماذج فارغة جاهزة للطباعة عند الحاجة أثناء الاختبار.'
};
function injectHelp(root) {
  $$('.sbody > section.card > h2', root).forEach(h => {
    const k = Object.keys(HELP).find(x => h.textContent.trim().startsWith(x)); if (!k || h.querySelector('.hlp')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'hlp'; b.textContent = '؟'; b.setAttribute('aria-label', 'شرح: ' + k); b.dataset.help = HELP[k]; h.appendChild(b);
  });
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('.hlp'); const old = $('#hlpPop');
  if (!b) { if (old && !e.target.closest('#hlpPop')) old.remove(); return; }
  if (old) old.remove();
  const p = document.createElement('div'); p.id = 'hlpPop'; p.className = 'hlppop'; p.textContent = b.dataset.help; document.body.appendChild(p);
  const r = b.getBoundingClientRect(); const w = Math.min(320, innerWidth - 24);
  p.style.width = w + 'px'; p.style.top = (r.bottom + scrollY + 8) + 'px'; p.style.left = Math.max(12, Math.min(innerWidth - w - 12, r.left + r.width / 2 - w / 2)) + 'px';
});

/* =====================================================================
   جولة تعريفية
   ===================================================================== */
function tourSteps() {
  const s = [];
  s.push({ sel: '#roleChip', t: 'دورك على هذا الجهاز', d: 'الشارة الملوّنة تبيّن من أنت: الأزرق فهد، والبرتقالي الوكيل، والذهبي المشرف. اضغطها لتغيير الدور.' });
  if (ROLE !== 'sup') s.push({ sel: '#nav .steps', t: 'مراحل العمل بالترتيب', d: 'كل مرحلة برقم ولون. ابدأ من الأولى، وتتحول إلى ✓ عند اكتمالها.' });
  if (ROLE !== 'sup') s.push({ sel: '.tasks', t: 'مهام المرحلة', d: 'ما المطلوب في هذه الصفحة، وما أُنجز منه. اضغط أي مهمة لتنتقل لمكانها. والتنبيهات الحمراء أخطاء يجب إصلاحها.' });
  if (ROLE === 'sup') s.push({ sel: '.tdays', t: 'أيام الاختبار', d: 'اختر اليوم، ويُختار يوم اليوم تلقائياً.' }, { sel: '.tbag', t: 'حقيبة اليوم', d: 'كل أوراق اليوم في ملف واحد بضغطة.' });
  if (ROLE !== 'sup') s.push({ sel: '#setChip', t: 'الإسناد الذي تعمل عليه', d: 'كل شخص يعمل على حفظه: «حفظ فهد» أو «حفظ الوكيل» أو «المشاركة معاً» — فلا يتداخل العمل.' });
  s.push({ sel: '#saveState', t: 'الحفظ والمزامنة', d: 'كل تعديل يُحفظ تلقائياً. فعّل المزامنة بالرمز لتظهر بياناتك على أي جهاز.' });
  s.push({ sel: '#helpBtn', t: 'المساعدة', d: 'أعد هذه الجولة متى شئت من هنا، وزر «؟» بجانب كل قسم يشرحه بسطر واحد.' });
  return s.filter(x => document.querySelector(x.sel));
}
function startTour() {
  const steps = tourSteps(); if (!steps.length) return; let i = 0;
  let o = $('#tour'); if (!o) { o = document.createElement('div'); o.id = 'tour'; document.body.appendChild(o); }
  const show = () => {
    const st = steps[i], el = document.querySelector(st.sel); if (!el) { i++; return i < steps.length ? show() : end(); }
    el.scrollIntoView({ block: 'center', behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
    const r = el.getBoundingClientRect(), pad = 6;
    o.innerHTML = `<div class="thole" style="top:${r.top - pad}px;left:${r.left - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px"></div>
      <div class="tcard" role="dialog" aria-live="polite"><small>${i + 1} من ${steps.length}</small><b>${st.t}</b><p>${st.d}</p><div class="tbtns"><button class="btn sm ghost" data-tour="end" type="button">إنهاء</button>${i ? '<button class="btn sm" data-tour="prev" type="button">السابق</button>' : ''}<button class="btn sm pri" data-tour="next" type="button">${i === steps.length - 1 ? 'تم ✓' : 'التالي'}</button></div></div>`;
    const c = $('.tcard', o), cw = Math.min(330, innerWidth - 24); c.style.width = cw + 'px';
    const below = r.bottom + 14 + 170 < innerHeight; c.style.top = (below ? r.bottom + 14 : Math.max(10, r.top - 14 - c.offsetHeight)) + 'px';
    c.style.left = Math.max(12, Math.min(innerWidth - cw - 12, r.left + r.width / 2 - cw / 2)) + 'px';
  };
  const end = () => { o.remove(); try { localStorage.setItem(LS_KEY + '-tour', '1'); } catch (e) { } };
  o.onclick = e => { const b = e.target.closest('[data-tour]'); if (!b) return; if (b.dataset.tour === 'end') return end(); if (b.dataset.tour === 'prev') i--; else i++; if (i >= steps.length) return end(); show(); };
  show();
}
document.addEventListener('click', e => {
  if (e.target.closest && e.target.closest('#roleChip')) return roleModal(false);
  if (e.target.closest && e.target.closest('#helpBtn')) return startTour();
});
