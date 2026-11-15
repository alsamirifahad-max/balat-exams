/* ===================== خارطة الطريق: كل الأعمال بالترتيب، مع المسؤول والحالة والمطبوعات ===================== */
const ROAD_PH = [
  { k: 'p1', t: 'التهيئة', w: 'قبل الاختبارات بثلاثة أسابيع', c: '#2563eb' },
  { k: 'p2', t: 'اللجان والأسئلة', w: 'قبل الاختبارات بأسبوعين', c: '#7c3aed' },
  { k: 'p3', t: 'الاستعداد الأخير', w: 'قبل الاختبارات بأسبوع', c: '#c2410c' },
  { k: 'p4', t: 'أيام الاختبار', w: 'يومياً طوال فترة الاختبارات', c: '#dc2626' },
  { k: 'p5', t: 'بعد الاختبارات', w: 'التصحيح والرصد والحفظ', c: '#0f766e' }
];
function roadObs() { return Object.values(S.obs || {}).some(l => (l || []).some(Boolean)); }
function roadSchedSubs() { const out = []; S.days.forEach(d => d.p.forEach(p => G.forEach(g => { const s = String(p.s[g] || '').trim(); if (s) out.push({ g, s }); }))); return out; }
const ROAD = [
  { id: 'files', ph: 'p1', t: 'الملفات الأساسية', d: 'ملف نور والإرشاد وقائمة المعلمين والجدول المدرسي.', go: ['files'], ok: () => stageDone('files'), f: ['tList'] },
  { id: 'assign', ph: 'p1', t: 'الإسناد', d: 'المواد والشعب لكل معلم — منه تُبنى التكليفات والإقرارات.', go: ['assign'], ok: () => S.ta.length > 0, f: ['taSheet', 'taLoad'] },
  { id: 'plan', ph: 'p1', t: 'خطة الاختبارات واللجان العاملة', d: 'أعضاء كل لجنة ومهامهم، ثم اعتماد الخطة.', go: ['plan'], who: 'exam', ok: () => !!(S.s.plan && S.s.plan.ok), f: ['planAll', 'planRoles', 'planOrg'] },
  { id: 'sched', ph: 'p1', t: 'جدول الاختبارات', d: 'الأيام والفترات ومواد كل صف.', go: ['schedule'], who: 'exam', ok: () => roadSchedSubs().length > 0, f: ['schedule'] },
  { id: 'coms', ph: 'p2', t: 'اللجان ومقارها وتوزيع الطلاب', d: 'المقرات والسعة، ثم الأسماء وأرقام الجلوس.', go: ['committees', 0], who: 'control', ok: () => !!S.distributed, f: ['comPlaces', 'comCounts', 'sticker', 'callSheet'] },
  { id: 'complete', ph: 'p2', t: 'إقرار إنهاء المنهج', d: 'توقيع كل معلم على إنهاء مقرره.', go: ['staff', 0], who: 'exam', f: ['complete'] },
  { id: 'qassign', ph: 'p2', t: 'تكليف وضع الأسئلة', d: 'معلم لكل مادة، وخطابات التكليف مع آخر موعد للتسليم.', go: ['staff', 1], who: 'exam', ok: () => { const sc = roadSchedSubs(); return sc.length > 0 && sc.every(x => { const r = S.st.find(y => +y.g === x.g && String(y.sub || '').trim() === x.s); return r && String(r.t || '').trim(); }); }, f: ['stList', 'assign', 'gradeStmt'] },
  { id: 'qrecv', ph: 'p3', t: 'استلام الأسئلة ونماذج الإجابة', d: 'بيان الاستلام وظرف الأصل والبيانات الأولية لكل مادة.', go: ['staff', 1], who: 'control', f: ['receipt', 'qOrig', 'qData'] },
  { id: 'obs', ph: 'p3', t: 'توزيع الملاحظين', d: 'ملاحظ لكل لجنة في كل فترة، وتعليمات الملاحظة بالتوقيع.', go: ['staff', 3], who: 'superv', ok: roadObs, f: ['obsNames', 'obsInstr'] },
  { id: 'special', ph: 'p3', t: 'القوائم الخاصة', d: 'طلاب الانتساب والعوق البصري وكشوفهم اليومية.', go: ['staff', 4], who: 'superv', f: ['specialRoll', 'special'] },
  { id: 'day', ph: 'p4', t: 'يوم الاختبار', d: 'حقيبة اليوم: كشوف الملاحظين وفتح المظاريف والمناداة والظروف.', go: ['today'], who: 'superv', f: ['daily', 'openEnv', 'qEnv', 'aEnv'] },
  { id: 'moves', ph: 'p4', t: 'حركة الطلاب عند الحاجة', d: 'مستجد أو منسحب أو نقل — دون إعادة التوزيع.', go: ['committees', 1], who: 'control', f: ['stuMoves'] },
  { id: 'abs', ph: 'p4', t: 'الغياب والتأخر والمحاضر', d: 'كشف الغياب اليومي ومحاضر التأخر والغش والمخالفة.', go: ['today'], who: 'superv', f: ['dailyAbs', 'late15', 'absence', 'cheat'] },
  { id: 'correct', ph: 'p5', t: 'التصحيح والمراجعة', d: 'توزيع اللجان على معلمي المادة ومحضر اتفاقية التصحيح.', go: ['committees', 2], who: 'correct', f: ['correct', 'agree', 'errQ', 'errA'] },
  { id: 'grades', ph: 'p5', t: 'الرصد والتدقيق والمطابقة', d: 'بيان تقدير الدرجات وحصر الغائبين حسب المواد.', go: ['forms'], who: 'grades', f: ['gradeEst', 'absBySub'] },
  { id: 'save', ph: 'p5', t: 'الحفظ والأرشفة', d: 'نسخة احتياطية من كل بيانات الفصل.', go: ['backup'], who: 'control' }
];
function roadMarks() { if (!S.s.road || typeof S.s.road !== 'object') S.s.road = {}; return S.s.road; }
function roadState(x) { const auto = typeof x.ok === 'function' ? !!x.ok() : null, man = !!(S.s.road || {})[x.id]; return { auto, done: auto === true || man, man }; }
function roadWho(x) { if (!x.who || typeof planGet !== 'function') return ''; const c = planGet().coms.find(c => c.id === x.who); if (!c) return ''; const h = planHead(c); return `${c.t}${h ? ' — ' + h : ''}`; }
function roadList() { return ROAD.filter(x => roleAllows(x.go[0])); }
function roadNext() { return roadList().find(x => !roadState(x).done); }
function roadGo(x) { if (x.go[1] != null && typeof SUB !== 'undefined') { SUB[x.go[0]] = x.go[1]; try { localStorage.setItem(LS_KEY + '-sub', JSON.stringify(SUB)); } catch (e) { } } go(x.go[0]); }
function vRoad() {
  const L = roadList(), done = L.filter(x => roadState(x).done).length, pct = L.length ? Math.round(done / L.length * 100) : 0, nx = roadNext();
  const fchip = id => { const f = FORMS.find(y => y.id === id); return f ? `<button type="button" class="rdf" data-act="qopen" data-form="${id}" title="معاينة وطباعة">🖨 ${esc(f.t.replace(/\s*\(.*\)\s*$/, ''))}</button>` : ''; };
  const step = (x, n) => { const st = roadState(x), who = roadWho(x), cur = nx && nx.id === x.id;
    return `<li class="rds${st.done ? ' ok' : ''}${cur ? ' cur' : ''}" id="rd_${x.id}">
      <span class="rdn">${st.done ? '✓' : n}</span>
      <div class="rdb">
        <div class="rdh"><b>${esc(x.t)}</b>${cur ? '<em class="rdnow">الخطوة التالية</em>' : ''}</div>
        <p>${esc(x.d)}</p>
        ${who ? `<small class="rdw">المسؤول: ${esc(who)}</small>` : ''}
        <div class="rda"><button type="button" class="btn sm ${cur ? 'pri' : ''}" data-road="${x.id}">${st.done ? 'فتح' : cur ? 'ابدأ الآن ←' : 'افتح ←'}</button>
          ${st.auto === null ? `<label class="rdm"><input type="checkbox" data-roadm="${x.id}"${st.man ? ' checked' : ''}> تمّت</label>` : `<span class="rdauto">${st.auto ? 'مكتملة تلقائياً' : 'تكتمل تلقائياً عند الإنجاز'}</span>`}</div>
        ${(x.f || []).length ? `<div class="rdfs">${x.f.map(fchip).join('')}</div>` : ''}
      </div></li>`; };
  let n = 0;
  const phases = ROAD_PH.map(ph => { const items = L.filter(x => x.ph === ph.k); if (!items.length) return ''; const pd = items.filter(x => roadState(x).done).length;
    return `<section class="rdp" style="--pc:${ph.c}"><header><i>${ROAD_PH.indexOf(ph) + 1}</i><div><b>${ph.t}</b><small>${ph.w}</small></div><span class="rdpc">${pd} من ${items.length}</span></header><ol class="rdl">${items.map(x => step(x, ++n)).join('')}</ol></section>`; }).join('');
  const daily = roleAllows('daily') ? `<section class="card rdd"><h2>المجال اليومي: الانتظار والمناوبة</h2>
      <ol class="rdmini"><li><b>الجدول المدرسي</b> يُرفع مرة واحدة من «الملفات الأساسية».</li><li><b>من غاب اليوم؟</b> المس اسم الغائب، ومن خرج أثناء اليوم حدّد حصته.</li><li><b>التسديد</b> يقترح الأنسب لكل حصة، أو «⚡ وزّع» دفعة واحدة.</li><li><b>الإرسال</b> طباعة الاستمارة أو إرسالها واتساب.</li><li><b>المناوبة</b> تقرير الإشراف اليومي والجدول الأسبوعي.</li></ol>
      <button type="button" class="btn pri" data-tab="daily">افتح الانتظار والمناوبة ←</button></section>` : '';
  return `<section class="card rdhero">
      <div class="rdring" style="--p:${pct}"><b>${pct}%</b><small>${done} من ${L.length}</small></div>
      <div class="rdht"><h2>أين وصلنا؟</h2>${nx ? `<p>الخطوة التالية: <b>${esc(nx.t)}</b></p><button type="button" class="btn pri rdgo" data-road="${nx.id}">ابدأ: ${esc(nx.t)} ←</button>` : '<p class="okt">اكتملت كل الخطوات — ممتاز.</p>'}
      <button type="button" class="btn sm ghost" data-act="qopen" data-form="roadmap">🖨 طباعة خارطة الطريق</button></div>
    </section>
    <div class="rdps">${phases}</div>${daily}`;
}
function roadmapPages() {
  const L = ROAD; let n = 0;
  const rows = [[H('م', { w: '5%' }), H('العمل', { w: '27%' }), H('المسؤول', { w: '30%' }), H('ما يُطبع'), H('الحالة', { w: '9%' })]];
  ROAD_PH.forEach(ph => { const items = L.filter(x => x.ph === ph.k); if (!items.length) return; rows.push([{ v: `<b>${ph.t}</b> — ${ph.w}`, cs: 5, bg: planTint ? planTint(ph.c) : LCOL, al: 'right' }]);
    items.forEach(x => { const st = roadState(x); rows.push([++n, { v: `<b>${esc(x.t)}</b>`, al: 'right' }, { v: esc(roadWho(x) || '—'), al: 'right' }, { v: esc((x.f || []).map(id => (FORMS.find(f => f.id === id) || {}).t || '').filter(Boolean).map(t => t.replace(/\s*\(.*\)\s*$/, '')).join('، ') || '—'), al: 'right', fs: '9pt' }, { v: st.done ? '✓' : '', b: true }]); }); });
  return [title('خارطة طريق أعمال الاختبارات', yearLine()) + T(rows) + sp(10) + sigs([['رئيس لجنة الاختبارات', S.s.principal]])];
}
FORMS.unshift({ id: 'roadmap', grp: 'خطة الاختبارات', t: 'خارطة طريق أعمال الاختبارات', build: () => roadmapPages() });
FD_IDS.push('roadmap');
UTILS.unshift({ k: 'road', t: 'خارطة الطريق', d: 'كل أعمال الاختبارات بالترتيب: متى، ومن المسؤول، وما يُطبع — والخطوة التالية بلمسة', c: '#0b3a46', ic: '<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>' });
PAGES.splice(FLOW.length, 0, UTILS[0]); ALL_TABS.splice(FLOW.length, 0, ['road', 'خارطة الطريق']);
if (ROLE_TABS.agent && !ROLE_TABS.agent.includes('road')) ROLE_TABS.agent.unshift('road');
if (ROLE_TABS.sup && !ROLE_TABS.sup.includes('road')) ROLE_TABS.sup.push('road');
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-road]'); if (!b) return; const x = ROAD.find(y => y.id === b.dataset.road); if (x) roadGo(x); });
document.addEventListener('change', e => { const el = e.target; if (!el.dataset || !el.dataset.roadm) return; if (typeof exReadOnly === 'function' && exReadOnly()) { el.checked = !el.checked; return toast('هذا الجهاز للاطلاع فقط', true); } roadMarks()[el.dataset.roadm] = el.checked; save(); render(); });
