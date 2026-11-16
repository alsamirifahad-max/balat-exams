/* ===================== لوحة المدير: الاختبارات · النشاط الطلابي · الانتظار — في شاشة واحدة ===================== */
function dashWait() {
  const t = todayIso(), sun = weekSun(t), out = { days: [], abs: 0, need: 0, done: 0, today: null };
  if (!D().tt) return out;
  for (let k = 0; k < 5; k++) { const iso = addDays(sun, k); if (iso > t) break; if (!isSchoolDay(iso)) continue;
    const wd = wdOf(iso), w = D().wait[iso] || { blocks: [] }, abs = w.blocks.filter(b => b.abs); let need = 0, done = 0;
    abs.forEach(b => { for (let p = 1; p <= 7; p++) { const has = wd >= 0 && ttCell(b.abs, wd, p) && blkNeeds(b, p), r = (b.rows || {})[p] || {}; if (has || r.t) { need++; if (r.t) done++; } } });
    const d = { iso, abs: abs.length, need, done }; out.days.push(d); out.abs += d.abs; out.need += need; out.done += done; if (iso === t) out.today = d; }
  return out;
}
function dashAct() {
  const a = S.act && Array.isArray(S.act.rows) ? A() : null; if (!a) return null;
  const sem = actWS(), wi = actCurWeek(sem), t = todayIso(), tot = a.rows.reduce((s, r) => s + (+r.n || 0), 0), ex = a.rows.reduce((s, r) => s + Math.min(+r.ex || 0, +r.n || 0), 0);
  const wk = actWeekSessions(sem, wi), late = []; a.rows.forEach(r => { const n = actSes(r, sem).filter(s => s.d < t && !s.done).length; if (n) late.push({ r, n }); });
  late.sort((x, y) => y.n - x.n); const st = actStats();
  return { tot, ex, pct: tot ? Math.round(ex / tot * 100) : 0, wk: wk.length, wkDone: wk.filter(x => x.s.done).length, wi, sem, w: actWeeks(sem)[wi], late, lateN: late.reduce((s, x) => s + x.n, 0), over: st.over, conf: st.conf, imgs: Object.values(S.actImg || {}).filter(v => v && !v.del).length };
}
function dashEx() { const L = typeof roadList === 'function' ? roadList() : [], done = L.filter(x => roadState(x).done).length, nx = typeof roadNext === 'function' ? roadNext() : null, ev = typeof evStat === 'function' ? evStat() : { n: 0, done: 0 };
  const nextDay = S.days.find(d => d.g >= todayIso()); return { pct: L.length ? Math.round(done / L.length * 100) : 0, done, n: L.length, nx, plan: !!(S.s.plan && S.s.plan.ok), ev, stu: S.students.length, moves: (S.s.moves || []).length, nextDay, dist: !!S.distributed }; }
function dashTile(o) { return `<article class="dtile" style="--dc:${o.c}"><header><i>${o.ic}</i><b>${o.t}</b>${o.go ? `<button type="button" class="btn sm ghost" data-tab="${o.go}">فتح ←</button>` : ''}</header>
  <div class="dtb"><div class="rdring sm" style="--p:${o.p}"><b>${o.big}</b><small>${o.sub}</small></div><ul>${o.l.map(x => `<li class="${x[2] || ''}"><span>${x[0]}</span><b>${x[1]}</b></li>`).join('')}</ul></div>${o.foot || ''}</article>`; }
function vDash() {
  const ex = dashEx(), ac = dashAct(), wt = dashWait(), t = todayIso(), tw = typeof termWeek === 'function' ? termWeek(t) : null;
  const alerts = [];
  if (ac && ac.lateN) alerts.push(['bad', `${ac.lateN} حصة نشاط فات موعدها ولم تُسجَّل منفّذة (${ac.late.length} برنامجاً)`, 'activity']);
  if (wt.today && wt.today.need > wt.today.done) alerts.push(['bad', `حصص انتظار اليوم غير مسددة: ${wt.today.need - wt.today.done} من ${wt.today.need}`, 'daily']);
  if (ac && ac.over) alerts.push(['warn', `${ac.over} برنامج نشاط يتجاوز حد الـ ${A().cfg.pct}%`, 'activity']);
  if (!ex.plan) alerts.push(['warn', 'خطة الاختبارات لم تُعتمد بعد', 'plan']);
  if (ex.nextDay && daysTo(ex.nextDay.g) <= 14 && !ex.dist) alerts.push(['warn', `الاختبارات بعد ${daysTo(ex.nextDay.g)} يوماً ولم يُوزَّع الطلاب على اللجان`, 'committees']);
  return `<h1 class="acttl">📊 لوحة المدير <small>${esc(dayAr ? dayAr(t) : '')} ${esc(hijriOf ? hijriOf(t) : '')}${tw && tw.txt ? ' · ' + esc(tw.txt) : ''}</small></h1>
  ${alerts.length ? `<section class="dalerts">${alerts.map(a => `<button type="button" class="dal ${a[0]}" data-tab="${a[2]}"><i>${a[0] === 'bad' ? '!' : '•'}</i><span>${esc(a[1])}</span><b>←</b></button>`).join('')}</section>` : '<section class="dalerts"><div class="dal ok"><i>✓</i><span>لا تنبيهات — كل شيء يسير حسب الخطة</span></div></section>'}
  <div class="dtiles">
    ${dashTile({ t: 'أعمال الاختبارات', ic: '📝', c: '#0e7490', go: 'road', p: ex.pct, big: ex.pct + '%', sub: `${ex.done} من ${ex.n}`, l: [['الخطوة التالية', esc(ex.nx ? ex.nx.t : 'اكتملت ✓')], ['خطة الاختبارات', ex.plan ? 'معتمدة ✓' : 'لم تُعتمد', ex.plan ? 'ok' : 'warn'], ['الطلاب', `${ex.stu}${ex.moves ? ` · ${ex.moves} حركة` : ''}`], ['أقرب اختبار', ex.nextDay ? `بعد ${daysTo(ex.nextDay.g)} يوماً` : '—'], ['التقويم الذاتي', `${ex.ev.done} من ${ex.ev.n}`]] })}
    ${ac ? dashTile({ t: 'النشاط الطلابي', ic: '⭐', c: '#16a34a', go: 'activity', p: ac.pct, big: ac.pct + '%', sub: `${ac.ex} من ${ac.tot} حصة`, l: [[`هذا الأسبوع (${ac.wi + 1})`, `${ac.wkDone} من ${ac.wk} حصة`, ac.wk && ac.wkDone < ac.wk ? 'warn' : 'ok'], ['متأخرة عن موعدها', ac.lateN ? `${ac.lateN} حصة` : 'لا يوجد ✓', ac.lateN ? 'bad' : 'ok'], ['المناسبة', esc((ac.w && ac.w.o) || '—')], ['صور الشواهد', ac.imgs], ['حد الـ 10%', ac.over ? `${ac.over} تجاوز` : 'ملتزم ✓', ac.over ? 'bad' : 'ok']],
      foot: ac.late.length ? `<div class="dlate"><small>الأكثر تأخراً:</small>${ac.late.slice(0, 5).map(x => `<span>${esc(x.r.t)} <i>${x.n}</i></span>`).join('')}</div>` : '' }) : dashTile({ t: 'النشاط الطلابي', ic: '⭐', c: '#16a34a', go: 'activity', p: 0, big: '—', sub: 'لم يُفتح', l: [['الحالة', 'لم يبدأ رائد النشاط بعد']] })}
    ${dashTile({ t: 'الانتظار هذا الأسبوع', ic: '⏱', c: '#c2410c', go: 'daily', p: wt.need ? Math.round(wt.done / wt.need * 100) : 100, big: wt.need ? Math.round(wt.done / wt.need * 100) + '%' : '—', sub: `${wt.done} من ${wt.need} حصة`, l: [['اليوم', wt.today ? `${wt.today.abs} غائب · ${wt.today.done}/${wt.today.need} مسددة` : (D().tt ? 'لا دراسة اليوم' : 'الجدول غير مرفوع'), wt.today && wt.today.need > wt.today.done ? 'bad' : 'ok'], ['غياب الأسبوع', `${wt.abs} حالة`], ...wt.days.map(d => [dayAr(d.iso).split(' ')[0], `${d.abs} غائب · ${d.done}/${d.need}`, d.need > d.done ? 'warn' : ''])] })}
  </div>
  <div class="acts wrap"><button type="button" class="btn pri" data-act="qopen" data-form="dashRep">🖨 التقرير الأسبوعي للمدير</button></div>`;
}
function dashRepPages() {
  const ex = dashEx(), ac = dashAct(), wt = dashWait(), t = todayIso();
  const sec = (h, rows) => T([[{ v: `<b>${h}</b>`, cs: 2, bg: HCOL }], ...rows.map(r => [{ v: r[0], al: 'right', bg: LCOL, w: '38%' }, { v: r[1], al: 'right' }])]) + sp(6);
  let h = title('التقرير الأسبوعي لمدير المدرسة', `${esc(dayAr(t))} ${esc(hijriOf(t))}`) +
    sec('أعمال الاختبارات', [['نسبة الإنجاز', `${ex.pct}% (${ex.done} من ${ex.n} خطوة)`], ['الخطوة التالية', esc(ex.nx ? ex.nx.t : 'اكتملت')], ['خطة الاختبارات', ex.plan ? 'معتمدة' : 'لم تُعتمد'], ['الطلاب وحركتهم', `${ex.stu} طالباً · ${ex.moves} حركة`], ['التقويم الذاتي', `${ex.ev.done} من ${ex.ev.n} عنصراً`]]);
  if (ac) h += sec('النشاط الطلابي', [['نسبة التنفيذ', `${ac.pct}% (${ac.ex} من ${ac.tot} حصة)`], [`الأسبوع ${ac.wi + 1}`, `${ac.wkDone} من ${ac.wk} حصة منفّذة${ac.w && ac.w.o ? ' — ' + esc(ac.w.o) : ''}`], ['حصص فات موعدها', ac.lateN ? `${ac.lateN} حصة: ${ac.late.slice(0, 8).map(x => `${esc(x.r.t)} (${x.n})`).join('، ')}` : 'لا يوجد'], ['الالتزام بحد الـ 10%', ac.over ? `${ac.over} تجاوز` : 'ملتزم'], ['صور الشواهد', String(ac.imgs)]]);
  h += sec('حصص الانتظار هذا الأسبوع', [['الإجمالي', `${wt.done} من ${wt.need} حصة مسددة · ${wt.abs} حالة غياب`], ...wt.days.map(d => [esc(dayAr(d.iso)), `${d.abs} غائب · ${d.done} من ${d.need} مسددة`])]);
  h += T([[{ v: '<b>ملاحظات وتوجيهات المدير</b>', al: 'right', bg: LCOL }], [{ v: '&nbsp;', h: '70px' }]]) + sp(10) + sigs([['مدير المدرسة', S.s.principal]]);
  return [h];
}
FORMS.push({ id: 'dashRep', grp: 'خطة الاختبارات', t: 'التقرير الأسبوعي لمدير المدرسة', build: () => dashRepPages() });
UTILS.unshift({ k: 'dash', t: 'لوحة المدير', d: 'نسبة إنجاز الاختبارات والنشاط الطلابي والانتظار في شاشة واحدة، مع التنبيهات والتقرير الأسبوعي', c: '#0b3a46', ic: '<path d="M3 13h8V3H3zM13 21h8V11h-8zM13 3v6h8V3zM3 21h8v-6H3z"/>' });
PAGES.push(UTILS[0]); ALL_TABS.push(['dash', 'لوحة المدير']);
