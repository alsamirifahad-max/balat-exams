/* =====================================================================
   النشاط الطلابي — نافذة رائد النشاط
   إسناد برامج النشاط للمعلمين بحسبة 10% من حصص المادة، ومواعيدها من الجدول العام
   ===================================================================== */
const ACT_PAL = ['#ffd966', '#f4b183', '#c9a0dc', '#76d7c4', '#9dc3e6', '#a9d18e', '#ff9e9e', '#ffb3d9', '#f8cbad', '#b4c7e7', '#e2efb3', '#d6b38a', '#9fd3ff', '#ff8a65', '#d5c6f0', '#c6efce', '#ffe699', '#bdd7ee'];
const ACT_DOMS = [
  { n: 'المواطنة والحياة', c: '#0e7490', p: ['مهارات طموحة', 'قيمنا حياة', 'إرث وطموح', 'السيرة النبوية', 'ريادة الأعمال', 'نموذج الأمم المتحدة', 'التطوع الطلابي'] },
  { n: 'العلوم والتقنية', c: '#2563eb', p: ['التصميم والابتكار التقني', 'الفضاء والاستكشاف العلمي', 'إنترنت الأشياء', 'الذكاء الاصطناعي', 'الأمن السيبراني', 'البحث العلمي', 'الاستدامة وجودة الحياة', 'برنامج تطبيقات STEM'] },
  { n: 'الثقافة والفنون', c: '#9333ea', p: ['مهارات اللغة والتواصل الثقافي', 'الخط العربي', 'الفن التراثي المعاصر', 'الثقافة الإعلامية', 'الفنون الصوتية أو الفنون الموسيقية', 'الفنون المسرحية'] },
  { n: 'الرياضة والصحة', c: '#16a34a', p: ['الرياضة والترفيه الإلكتروني', 'الرياضات الذهنية', 'الأولمبياد الرياضي', 'صحتي في بيئتي', 'منافسات مهارات رياضات الدفاع عن النفس', 'مهارات التحكيم الرياضي (أنا حكم)'] },
  { n: 'النشاط الكشفي', c: '#b45309', p: ['خيمتي الجميلة', 'بوصلة الاكتشاف', 'خيمة التجارب المسلية', 'خشبة وحبل', 'الملاحة على اليابس', 'مخيمي التقني', 'صافرة واصطفاف', 'صناع الخير', 'خطواتي الكشفية الصحية'] },
  { n: 'اللياقة والصحة', c: '#dc2626', p: ['الإسعافات الأولية'] }
];
const ACT_INTRO = 'بناءً على الصلاحيات الممنوحة لنا، وبناءً على ما ورد في دليل الخطط الدراسية (الإصدار السادس)، يُعتمد تكليفكم بتنفيذ برنامج (الأنشطة الطلابية) للفصل الدراسي {sem} ضمن برامج الفترات الصفية، وفق المحتوى المعتمد من المركز الوطني للمناهج، والتقيد بالمدة الزمنية المحددة، واستخدام أدوات التقويم المحددة له، على أن يُزوَّد رائد النشاط الطلابي بالتقارير المعتمدة مع نهاية البرنامج.';
/* الإسناد المعتمد للفصل الأول 1448هـ (من ملفات المدرسة) — [الصف، المعلم، مادة التدريس، المجال، البرنامج، عدد الحصص] */
const ACT_SEED = [
  [1, 'حمد النقيدان', 'التفسير', 'المواطنة والحياة', 'السيرة النبوية', 3], [1, 'منصور السالمي', 'التفسير', 'المواطنة والحياة', 'السيرة النبوية', 3],
  [1, 'فواز المرواني', 'اللغة الإنجليزية 1', 'العلوم والتقنية', 'الذكاء الاصطناعي', 4], [1, 'خالد اللهيبي', 'اللغة الإنجليزية 1', 'العلوم والتقنية', 'الذكاء الاصطناعي', 4],
  [1, 'سعيد الزهراني', 'أحياء 1', 'العلوم والتقنية', 'الأمن السيبراني', 4], [1, 'سعود السلمي', 'أحياء 1', 'العلوم والتقنية', 'الأمن السيبراني', 5],
  [1, 'عبدالرحمن العويدي', 'عربي 1', 'الثقافة والفنون', 'الخط العربي', 5], [1, 'عبدالله السلمي', 'عربي 1', 'الثقافة والفنون', 'الخط العربي', 5], [1, 'عواض الحارثي', 'عربي 1', 'الثقافة والفنون', 'الخط العربي', 5],
  [1, 'فهد السلماني', 'تقنية رقمية 1', 'العلوم والتقنية', 'الفضاء والاستكشاف العلمي', 5], [1, 'فايز عقباوي', 'تقنية رقمية 1', 'العلوم والتقنية', 'الفضاء والاستكشاف العلمي', 5],
  [1, 'علي القرني', 'التفكير الناقد', 'النشاط الكشفي', 'بوصلة الاكتشاف', 4], [1, 'عبدالرحمن العويدي', 'التفكير الناقد', 'النشاط الكشفي', 'خيمة التجارب المسلية', 4], [1, 'علي الزهراني', 'التفكير الناقد', 'النشاط الكشفي', 'بوصلة الاكتشاف', 4], [1, 'محمد الزهراني', 'التفكير الناقد', 'النشاط الكشفي', 'خيمة التجارب المسلية', 4],
  [1, 'أحمد حلواني', 'رياضيات 1', 'الثقافة والفنون', 'مهارات اللغة والتواصل الثقافي', 5], [1, 'علي المالكي', 'رياضيات 1', 'الثقافة والفنون', 'مهارات اللغة والتواصل الثقافي', 5], [1, 'يحيى المالكي', 'رياضيات 1', 'الثقافة والفنون', 'مهارات اللغة والتواصل الثقافي', 5],
  [2, 'علي حوائج', 'التاريخ', 'المواطنة والحياة', 'مهارات طموحة', 3], [2, 'عبدالله الغامدي', 'التاريخ', 'المواطنة والحياة', 'قيمنا حياة', 3],
  [2, 'يوسف السلمي', 'فيزياء 2', 'العلوم والتقنية', 'التصميم والابتكار التقني', 4], [2, 'حاتم الدعجاني', 'فيزياء 2', 'العلوم والتقنية', 'الفضاء والاستكشاف العلمي', 4],
  [2, 'عبدالعزيز الحربي', 'كفايات لغوية 2', 'المواطنة والحياة', 'إرث وطموح', 4], [2, 'عبدالرحمن العويدي', 'كفايات لغوية 2', 'المواطنة والحياة', 'إرث وطموح', 5],
  [2, 'عبدالله العمري', 'رياضيات 2', 'النشاط الكشفي', 'خيمتي الجميلة', 5], [2, 'محمد عبدالله الشهري', 'رياضيات 2', 'النشاط الكشفي', 'خيمتي الجميلة', 5], [2, 'يحيى عبدالله المالكي', 'رياضيات 2', 'النشاط الكشفي', 'خيمتي الجميلة', 5],
  [2, 'عبدالله الميموني', 'اللغة الإنجليزية 2', 'العلوم والتقنية', 'إنترنت الأشياء', 5], [2, 'إبراهيم هاشم الغامدي', 'اللغة الإنجليزية 2', 'العلوم والتقنية', 'إنترنت الأشياء', 5],
  [2, 'فهد سلطان المطيري', 'أحياء 2', 'الرياضة والصحة', 'الرياضة والترفيه الإلكتروني', 4], [2, 'عاتق العمري', 'أحياء 2', 'الرياضة والصحة', 'الرياضة والترفيه الإلكتروني', 4], [2, 'صالح الأزهري', 'أحياء 2', 'الرياضة والصحة', 'الرياضات الذهنية', 4], [2, 'عبدالرحمن الزهراني', 'أحياء 2', 'الرياضة والصحة', 'الرياضات الذهنية', 4],
  [2, 'متعب السلمي', 'كيمياء 2', 'الثقافة والفنون', 'مهارات اللغة والتواصل الثقافي', 5], [2, 'ماجد عسيري', 'كيمياء 2', 'الثقافة والفنون', 'مهارات اللغة والتواصل الثقافي', 5], [2, 'موسى خواجي', 'كيمياء 2', 'الثقافة والفنون', 'مهارات اللغة والتواصل الثقافي', 5],
  [3, 'عبدالله سوقان', 'اللغة الإنجليزية 3', 'المواطنة والحياة', 'ريادة الأعمال', 4], [3, 'راضي الحارثي', 'اللغة الإنجليزية 3', 'المواطنة والحياة', 'ريادة الأعمال', 4],
  [3, 'فهد المالكي', 'كيمياء 3', 'الثقافة والفنون', 'الفن التراثي المعاصر', 3], [3, 'عبدالسلام السلمي', 'كيمياء 3', 'الثقافة والفنون', 'الفن التراثي المعاصر', 3], [3, 'ماجد عسيري', 'كيمياء 3', 'الثقافة والفنون', 'الفن التراثي المعاصر', 3],
  [3, 'عبدالهادي السلمي', 'تقنية رقمية 3', 'العلوم والتقنية', 'البحث العلمي', 2], [3, 'فايز عقباوي', 'تقنية رقمية 3', 'العلوم والتقنية', 'البحث العلمي', 2],
  [3, 'حسن الشهري', 'رياضيات 3', 'النشاط الكشفي', 'خشبة وحبل', 4], [3, 'سلمان المحمدي', 'رياضيات 3', 'النشاط الكشفي', 'خشبة وحبل', 4],
  [3, 'عبدالعزيز المطيري', 'فيزياء 3', 'العلوم والتقنية', 'التصميم والابتكار التقني', 5], [3, 'محمد علي الزهراني', 'فيزياء 3', 'العلوم والتقنية', 'التصميم والابتكار التقني', 5], [3, 'حسن البشري', 'فيزياء 3', 'العلوم والتقنية', 'التصميم والابتكار التقني', 5],
  [3, 'ياسر عمار القرشي', 'أحياء 3', 'المواطنة والحياة', 'نموذج الأمم المتحدة', 4], [3, 'فهد المطيري', 'أحياء 3', 'المواطنة والحياة', 'التطوع الطلابي', 4], [3, 'علي الزهراني', 'أحياء 3', 'المواطنة والحياة', 'مهارات طموحة', 4],
  [3, 'مازن الخطابي', 'التربية الصحية والبدنية', 'الرياضة والصحة', 'الأولمبياد الرياضي', 4], [3, 'مبارك الأسمري', 'المهارات الإدارية', 'الرياضة والصحة', 'صحتي في بيئتي', 5],
  [3, 'حامد الغامدي', 'البحث ومصادر المعلومات', 'النشاط الكشفي', 'الملاحة على اليابس', 2], [3, 'فهد السميري', 'البحث ومصادر المعلومات', 'النشاط الكشفي', 'الملاحة على اليابس', 2],
  [3, 'عادل الغامدي', 'علم الأرض', 'اللياقة والصحة', 'الإسعافات الأولية', 3], [3, 'سلطان السلمي', 'علم الأرض', 'اللياقة والصحة', 'الإسعافات الأولية', 3]
];
let ACT_G = 'all', ACT_Q = '', ACT_OPEN = null, ACT_SWAP = null, ACT_SLOT = null, ACT_GRID = false;
function actNewId() { return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function actDefault() {
  let k = 0; const progs = {};
  const doms = ACT_DOMS.map(d => ({ n: d.n, c: d.c, p: d.p.map(n => { const c = ACT_PAL[k++ % ACT_PAL.length]; progs[n] = c; return { n, c }; }) }));
  return { v: 1, cfg: { weeks: 18, pct: 10, lead: 'عبدالعزيز بن جمعان الزهراني', vice: S.s.eduDep || 'سلطان بن عبدالمنعم السلمي', head: S.s.principal || '', intro: ACT_INTRO, sign: true }, doms, subj: {},
    rows: ACT_SEED.map(([g, t, sub, dom, prog, n]) => ({ id: actNewId(), g, t, sub, dom, prog, n, slots: [] })), at: '' };
}
function A() { if (!S.act || !Array.isArray(S.act.rows)) S.act = actDefault(); const a = S.act; a.cfg = Object.assign({ weeks: 18, pct: 10, intro: ACT_INTRO, sign: true }, a.cfg || {}); a.doms = a.doms || []; a.subj = a.subj || {}; return a; }
function actRO() { return typeof ROLE !== 'undefined' && ROLE && !['admin', 'act'].includes(ROLE); }
function actGuard() { if (actRO()) { toast('النشاط الطلابي للاطلاع فقط على هذا الجهاز', true); return true; } return false; }
function actSave(re = true) { A().at = new Date().toISOString(); save(); if (re) render(); }
/* ----- الكتالوج: المجالات والبرامج وألوانها ----- */
function actDom(n) { return A().doms.find(d => normName(d.n) === normName(n)); }
function actProgColor(n) { for (const d of A().doms) { const p = d.p.find(p => normName(p.n) === normName(n)); if (p) return p.c; } return '#e5e7eb'; }
function actDomColor(n) { const d = actDom(n); return d ? d.c : '#64748b'; }
function actEnsureProg(dom, prog) { const a = A(); if (!dom || !prog) return; let d = actDom(dom); if (!d) { d = { n: dom, c: '#475569', p: [] }; a.doms.push(d); }
  if (!d.p.some(p => normName(p.n) === normName(prog))) { const used = new Set(a.doms.flatMap(x => x.p.map(p => p.c))); d.p.push({ n: prog, c: ACT_PAL.find(c => !used.has(c)) || ACT_PAL[a.doms.reduce((s, x) => s + x.p.length, 0) % ACT_PAL.length] }); } }
/* ----- الحسبة: حصص المعلم الفعلية في الجدول العام ----- */
function actSecs(r) {
  const off = +S.s.secOff[r.g] || 0, out = new Set(), sub = normName(r.sub).replace(/\s*\d.*$/, '');
  (S.ta || []).forEach(x => { if (+x.g !== +r.g || !sameTeacher([x.t])(r.t)) return; const xs = normName(x.sub).replace(/\s*\d.*$/, '');
    if (sub && xs && !(xs.includes(sub) || sub.includes(xs) || xs.split(' ')[0] === sub.split(' ')[0])) return;
    String(x.sec || '').split(/[^0-9]+/).filter(Boolean).forEach(s => { const n = +s; out.add(n > off ? n : n + off); }); });
  return out;
}
function actNk(n) { const w = normName(n).split(' ').filter(Boolean); return { f: w[0] || '', l: (w[w.length - 1] || '').replace(/^ال/, ''), n: w.length }; }
function actTT(r) { const t = D().tt; if (!t || !r.t) return null; if (r.tt) { const x = t.teachers.find(y => y.n === r.tt); if (x) return x; }
  const x = typeof ttRow === 'function' ? ttRow(r.t) : null; if (x) return x; const k = actNk(r.t);
  const c = t.teachers.filter(y => { const q = actNk(y.n); return q.f === k.f && (q.l === k.l || (q.n === 1 || k.n === 1)); }); return c.length === 1 ? c[0] : null; }
function actCells(r) { /* حصص المعلم في شعب هذا الصف والمادة: [{k:'d-p', s:شعبة}] */
  const tr = actTT(r); if (!tr) return []; const secs = actSecs(r), off = +S.s.secOff[r.g] || 0, lo = off + 1, hi = off + 10;
  return Object.entries(tr.c).filter(([k, v]) => { const n = +v; return secs.size ? secs.has(n) : (n >= lo && n <= hi); }).map(([k, v]) => ({ k, s: v }));
}
function actSubKey(r) { return r.g + '|' + normName(r.sub); }
function actWeekly(r) { const o = A().subj[actSubKey(r)]; if (o && +o.w > 0) return { w: +o.w, src: 'يدوي' };
  const secs = actSecs(r), cells = actCells(r); if (!cells.length) return { w: 0, src: '' };
  const n = secs.size || new Set(cells.map(x => x.s)).size; return { w: Math.round(cells.length / Math.max(1, n) * 10) / 10, src: 'من الجدول' }; }
function actCalc(r) {
  const a = A(), o = a.subj[actSubKey(r)] || {}, wk = actWeekly(r), weeks = +a.cfg.weeks || 18, pct = +a.cfg.pct || 10;
  const tot = +o.tot > 0 ? +o.tot : Math.round(wk.w * weeks), max = tot ? Math.floor(tot * pct / 100) : 0, n = +r.n || 0;
  return { tot, max, n, pct: tot ? Math.round(n / tot * 1000) / 10 : null, over: !!tot && n > max, src: +o.tot > 0 ? 'يدوي' : wk.src, w: wk.w };
}
const DAYN = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'];
function actSlotTxt(k) { const [d, p] = String(k).split('-').map(Number); return `${DAYN[d] || ''} - الحصة ${p}`; }
function actSlotsTxt(r) { return (r.slots || []).slice().sort((a, b) => a.localeCompare(b, 'en', { numeric: true })).map(actSlotTxt).join('، '); }
function actConflicts() { const m = new Map(), bad = new Set(); A().rows.forEach(r => (r.slots || []).forEach(k => { const key = personKey(r.t) + '@' + k; if (m.has(key)) { bad.add(r.id); bad.add(m.get(key)); } else m.set(key, r.id); })); return bad; }
function actStats() { const a = A(), conf = actConflicts(); const rows = a.rows; let over = 0, noSlot = 0, per = 0;
  rows.forEach(r => { const c = actCalc(r); if (c.over) over++; if (!(r.slots || []).length) noSlot++; per += +r.n || 0; });
  return { rows: rows.length, tch: new Set(rows.map(r => personKey(r.t))).size, progs: new Set(rows.map(r => normName(r.prog))).size, per, over, noSlot, conf: conf.size }; }
function actRowsG(g) { return A().rows.filter(r => g === 'all' || +r.g === +g); }
/* ----- الواجهة ----- */
function actTchOpts(r) { const list = tchAll(); return (r.t && !list.some(n => normName(n) === normName(r.t)) ? [r.t, ...list] : list).filter(Boolean); }
function actSubOpts(r) { const s = new Set(); (S.ta || []).filter(x => +x.g === +r.g && sameTeacher([x.t])(r.t)).forEach(x => s.add(x.sub)); if (r.sub) s.add(r.sub); if (typeof currList === 'function') currList(r.g).forEach(x => s.add(x)); return [...s]; }
function actSel(attr, val, list, ph) { return `<select class="in" ${attr}>${ph ? `<option value="">${esc(ph)}</option>` : ''}${list.map(v => `<option${normName(v) === normName(val) ? ' selected' : ''}>${esc(v)}</option>`).join('')}<option value="__new">＋ كتابة جديد…</option></select>`; }
function actRowCard(r, conf) {
  const c = actCalc(r), d = actDom(r.dom), progs = d ? d.p.map(p => p.n) : [], open = ACT_OPEN === r.id, sw = ACT_SWAP === r.id, pc = actProgColor(r.prog);
  const badge = c.tot ? `<span class="acalc ${c.over ? 'bad' : 'ok'}" title="الحد الأعلى ${c.max} حصة = ${c.tot} × ${A().cfg.pct}%">${c.over ? '⚠' : '✓'} ${c.n} من ${c.max} · ${c.pct}%</span>` : `<span class="acalc na" title="أدخل حصص المادة في «الحسبة»">${c.n} حصة · الحد غير محسوب</span>`;
  const sl = (r.slots || []).length, slTxt = sl ? actSlotsTxt(r) : '';
  return `<div class="arow${open ? ' open' : ''}${sw ? ' swp' : ''}${conf.has(r.id) ? ' conf' : ''}" style="--pc:${pc};--dc:${actDomColor(r.dom)}" data-aid="${r.id}">
    <div class="arh" data-aact="open" data-id="${r.id}">
      <span class="apc" aria-hidden="true"></span>
      <div class="art"><b>${esc(r.t || '— معلم —')}</b><small>${esc(r.prog || '— البرنامج —')} <i>· ${esc(r.dom || '')}</i></small></div>
      ${badge}
      <span class="aslt${sl ? '' : ' none'}${conf.has(r.id) ? ' bad' : ''}" title="${esc(slTxt)}">🕘 ${sl ? sl + ' موعد' : 'بلا موعد'}</span>
      <span class="achev" aria-hidden="true">‹</span>
    </div>
    ${open ? `<div class="arb">
      <div class="agrid">
        <label class="plf">المعلم ${actSel(`data-af="t" data-id="${r.id}"`, r.t, actTchOpts(r), '— اختر المعلم —')}</label>
        <label class="plf">مادة التدريس ${actSel(`data-af="sub" data-id="${r.id}"`, r.sub, actSubOpts(r), '— المادة —')}</label>
        <label class="plf">الصف <select class="in" data-af="g" data-id="${r.id}">${G.map(g => `<option value="${g}"${+r.g === g ? ' selected' : ''}>${GSHORT[g]} ثانوي</option>`).join('')}</select></label>
        <label class="plf">المجال ${actSel(`data-af="dom" data-id="${r.id}"`, r.dom, A().doms.map(d => d.n), '— المجال —')}</label>
        <label class="plf w2">البرنامج المسند ${actSel(`data-af="prog" data-id="${r.id}"`, r.prog, progs, '— البرنامج —')}</label>
        <div class="plf"><span>عدد حصص البرنامج</span><div class="astep"><button type="button" class="btn sm" data-aact="n" data-d="-1" data-id="${r.id}">−</button><b>${+r.n || 0}</b><button type="button" class="btn sm" data-aact="n" data-d="1" data-id="${r.id}">+</button>${c.max && +r.n !== c.max ? `<button type="button" class="btn sm ghost" data-aact="nmax" data-id="${r.id}" title="ضبط العدد على الحد الأعلى">= ${c.max}</button>` : ''}</div></div>
      </div>
      <div class="acalcbox ${c.over ? 'bad' : ''}">${c.tot ? `حصص المادة في الفصل <b>${c.tot}</b> (${c.src}) × ${A().cfg.pct}% = الحد الأعلى <b>${c.max}</b> حصة — المسند <b>${c.n}</b> (${c.pct}%) ${c.over ? '<em>يتجاوز الحد — خفّض العدد</em>' : '✓ ضمن الحد'}` : 'لم تُحسب حصص المادة بعد — ارفع الجدول المدرسي العام أو أدخلها يدوياً في خطوة «الحسبة».'}</div>
      <div class="aslots"><div class="ash"><b>مواعيد الحصص</b>${r.tt ? `<span class="alinked">مرتبط بـ «${esc(r.tt)}» <button type="button" class="lnk" data-aact="unlink" data-id="${r.id}">فك الربط</button></span>` : ''}<small>${slTxt ? esc(slTxt) : 'المس خانات المعلم الملوّنة أدناه — من حصصه الفعلية في شعب هذا الصف'}</small></div>${actPicker(r, conf)}</div>
      <div class="acts wrap aacts">
        <button type="button" class="btn sm" data-aact="dup" data-id="${r.id}">⧉ تكرار السطر</button>
        <button type="button" class="btn sm${sw ? ' pri' : ''}" data-aact="swap" data-id="${r.id}">⇅ ${sw ? 'اختر سطراً آخر للتبديل…' : 'تبديل المعلم مع سطر آخر'}</button>
        <button type="button" class="btn sm ghost" data-aact="up" data-id="${r.id}">▲</button><button type="button" class="btn sm ghost" data-aact="dn" data-id="${r.id}">▼</button>
        <button type="button" class="btn sm danger" data-aact="del" data-id="${r.id}">حذف</button>
        <button type="button" class="btn sm ghost" data-act="qopen" data-form="actLetter" data-o='${esc(JSON.stringify({ rid: r.id }))}'>🖨 تكليف هذا المعلم</button>
      </div></div>` : ''}
  </div>`;
}
function actPicker(r, conf) {
  const tr = actTT(r), mine = new Set(actCells(r).map(x => x.k)), sel = new Set(r.slots || []);
  const others = new Map(); A().rows.forEach(x => { if (x.id !== r.id && sameTeacher([x.t])(r.t)) (x.slots || []).forEach(k => others.set(k, x.prog)); });
  if (!tr) return (D().tt ? `<div class="alink"><span>لم يُعثر على «${esc(r.t)}» في الجدول المدرسي العام — اربطه بالاسم المكتوب هناك:</span><select class="in" data-af="tt" data-id="${r.id}"><option value="">— اختر من الجدول —</option>${D().tt.teachers.map(x => x.n).sort((a, b) => a.localeCompare(b, 'ar')).map(n => `<option>${esc(n)}</option>`).join('')}</select></div>` : '<p class="hint">لم يُرفع الجدول المدرسي العام بعد — اختر المواعيد يدوياً:</p>') + actGridPick(r, k => ({ on: sel.has(k), ok: true, s: '' }));
  return actGridPick(r, k => ({ on: sel.has(k), ok: mine.has(k) && !others.has(k), s: tr.c[k] || '', busy: others.get(k) }));
}
function actGridPick(r, f) {
  let h = `<div class="apick" role="grid"><div class="apr hd"><span></span>${[1, 2, 3, 4, 5, 6, 7].map(p => `<span>${p}</span>`).join('')}</div>`;
  DAYN.forEach((dn, d) => { h += `<div class="apr"><span class="apd">${dn}</span>${[1, 2, 3, 4, 5, 6, 7].map(p => { const k = d + '-' + p, x = f(k); return `<button type="button" class="apc2${x.on ? ' on' : ''}${x.ok ? ' ok' : ''}${x.busy ? ' busy' : ''}${x.s && !x.ok && !x.busy ? ' oth' : ''}" data-aact="slot" data-id="${r.id}" data-k="${k}"${!x.ok && !x.on ? ' disabled' : ''} title="${esc(DAYN[d] + ' — الحصة ' + p + (x.s ? ' — شعبة ' + x.s : '') + (x.busy ? ' — محجوزة لبرنامج: ' + x.busy : ''))}">${x.s ? esc(x.s) : x.on ? '✓' : ''}</button>`; }).join('')}</div>`; });
  return h + `</div><div class="aleg"><span><i class="ok"></i>حصة للمعلم في هذا الصف</span><span><i class="on"></i>موعد النشاط</span><span><i class="oth"></i>حصة في صف آخر</span><span><i class="busy"></i>محجوزة لبرنامج آخر</span></div>`;
}
function actGroupHtml(g, conf) {
  const rows = actRowsG(g).filter(r => !ACT_Q || normName(r.t + ' ' + r.prog + ' ' + r.sub + ' ' + r.dom).includes(normName(ACT_Q)));
  if (!rows.length) return '';
  const bySub = []; rows.forEach(r => { let b = bySub.find(x => normName(x.sub) === normName(r.sub)); if (!b) bySub.push(b = { sub: r.sub, rows: [] }); b.rows.push(r); });
  return `<section class="agrade" style="--gc2:var(--g${g})"><header><b>${GNAME[g]}</b><span>${rows.length} معلم · ${rows.reduce((s, r) => s + (+r.n || 0), 0)} حصة</span></header>
    ${bySub.map(b => `<div class="asub"><div class="asubh"><b>${esc(b.sub || 'بدون مادة')}</b>${(() => { const c = actCalc(b.rows[0]); return c.tot ? `<small>حصص المادة ${c.tot} · الحد ${c.max}</small>` : ''; })()}<button type="button" class="btn sm ghost" data-aact="addSub" data-g="${g}" data-sub="${esc(b.sub)}">＋ معلم</button></div>${b.rows.map(r => actRowCard(r, conf)).join('')}</div>`).join('')}
  </section>`;
}
function actPeoplePanel() { const m = new Map(); A().rows.forEach(r => { const k = personKey(r.t); if (!m.has(k)) m.set(k, { n: r.t, l: [] }); m.get(k).l.push(r); });
  return [...m.values()].sort((a, b) => b.l.length - a.l.length || a.n.localeCompare(b.n, 'ar')); }
function vActivity() {
  const a = A(), st = actStats(), conf = actConflicts(), ro = actRO();
  const gchips = ['all', ...G].map(g => `<button type="button" class="${String(ACT_G) === String(g) ? 'on' : ''}" data-aact="g" data-v="${g}"${g !== 'all' ? ` style="--gc:var(--g${g})"` : ''}>${g === 'all' ? 'كل الصفوف' : GSHORT[g] + ' ثانوي'}</button>`).join('');
  const tl = `<datalist id="tlist">${tchAll().map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>`;
  const hero = `<section class="card acth keep">
    <div class="plstats ast"><div><b>${st.tch}</b><span>معلم</span></div><div><b>${st.progs}</b><span>برنامج</span></div><div><b>${st.per}</b><span>حصة نشاط</span></div><div class="${st.over || st.conf ? 'bad' : 'ok'}"><b>${st.over + st.conf || '✓'}</b><span>${st.over || st.conf ? (st.over ? 'تجاوز للحد' : '') + (st.over && st.conf ? ' · ' : '') + (st.conf ? 'تعارض مواعيد' : '') : 'ضمن الحد'}</span></div></div>
    ${st.noSlot ? `<p class="hint">${st.noSlot} سطر بلا مواعيد بعد — افتح السطر والمس خانات المعلم في جدوله.</p>` : ''}
    <div class="plout">
      <button type="button" class="btn pri" data-act="qopen" data-form="actPlan">🖨 جدول الإسناد</button>
      <button type="button" class="btn" data-act="qopen" data-form="actGrid">🖨 جدول المواعيد</button>
      <button type="button" class="btn" data-act="qopen" data-form="actLetter">🖨 خطابات التكليف</button>
      <button type="button" class="btn" data-act="qopen" data-form="actSum">🖨 ملخص البرامج</button>
    </div>
    <div class="acts wrap aio">
      <label class="btn sm" for="actFile">⬆ رفع ملف إسناد (Word · PDF · Excel)</label><input type="file" id="actFile" accept=".docx,.doc,.pdf,.xlsx,.xls,.csv" hidden>
      <button type="button" class="btn sm" data-aact="xlsx">⬇ تصدير Excel قابل للتعديل</button>
      <button type="button" class="btn sm ghost" data-aact="json">⬇ نسخة احتياطية (JSON)</button>
      <label class="btn sm ghost" for="actJson">⬆ استرجاع نسخة</label><input type="file" id="actJson" accept=".json" hidden>
    </div></section>`;
  const rowsStep = `<section class="card"><h2>إسناد البرامج للمعلمين</h2>
    <div class="amode seg agch">${gchips}</div>
    <input class="in plq" type="search" placeholder="🔎 ابحث بمعلم أو برنامج أو مادة…" value="${esc(ACT_Q)}" oninput="ACT_Q=this.value;clearTimeout(window._aq);window._aq=setTimeout(()=>{const p=this.selectionStart;render();const i=document.querySelector('.agch+.plq');if(i){i.focus();try{i.setSelectionRange(p,p)}catch(e){}}},250)">
    ${ACT_SWAP ? `<p class="hint swph">⇅ اختر السطر الذي تريد تبديل معلمه مع «${esc((a.rows.find(r => r.id === ACT_SWAP) || {}).t || '')}» — أو <button type="button" class="lnk" data-aact="swapx">إلغاء</button></p>` : ''}
    <div class="agrades">${(ACT_G === 'all' ? G : [+ACT_G]).map(g => actGroupHtml(g, conf)).join('') || '<p class="mut">لا توجد أسطر مطابقة.</p>'}</div>
    <div class="acts wrap"><button type="button" class="btn sm pri" data-aact="add">＋ سطر إسناد جديد</button><button type="button" class="btn sm ghost" data-aact="rep">🔁 إحلال معلم في كل الخطة</button></div>
  </section>`;
  const ppl = actPeoplePanel();
  const peopleStep = `<section class="card"><h2>المعلمون وأحمالهم</h2>
    <p class="hint">كل معلم وما أُسند له من برامج وحصص ومواعيد. المس أي برنامج للانتقال إلى سطره.</p>
    <div class="plppl">${ppl.map(p => { const tot = p.l.reduce((s, r) => s + (+r.n || 0), 0); return `<div class="plp${p.l.length > 1 ? ' hv' : ''}"><div class="plpn"><b>${esc(p.n)}</b><span class="plload" title="عدد البرامج">${p.l.length}</span><small class="mut">${tot} حصة</small></div>
      <div class="plch">${p.l.map(r => `<button type="button" class="plchip" style="--pc:${actDomColor(r.dom)}" data-aact="goRow" data-id="${r.id}"><b>${esc(r.prog)}</b><span>${GSHORT[r.g]} · ${esc(r.sub)} · ${+r.n || 0} حصص${(r.slots || []).length ? ' · ' + esc(actSlotsTxt(r)) : ''}</span></button>`).join('')}</div></div>`; }).join('')}</div>
  </section>`;
  const gridStep = `<section class="card"><h2>جدول المواعيد ضمن الجدول العام</h2>
    <p class="hint">الخانة الملونة حصة نشاط (اللون يدل على البرنامج)، والرقم داخلها رقم الشعبة كما في الجدول العام.</p>
    ${D().tt ? `<div class="tw agridw">${actGridHtml(ACT_G)}</div>` : '<p class="warnt">ارفع «الجدول المدرسي العام» من الملفات الأساسية ليظهر هذا الجدول.</p>'}
    ${qbar('actGrid', 'طباعة جدول المواعيد:')}</section>`;
  const calcStep = `<section class="card"><h2>الحسبة والإعدادات</h2>
    <p class="hint"><b>المعادلة:</b> الحد الأعلى لحصص النشاط = إجمالي حصص المادة في الفصل × النسبة. إجمالي حصص المادة = حصصها الأسبوعية للشعبة × عدد الأسابيع — تُحسب تلقائياً من الجدول العام، ويمكنك كتابة الرقم الرسمي بدلاً منها.</p>
    <div class="agrid">
      <label class="plf">عدد أسابيع الفصل <input class="in" type="number" min="1" max="40" data-ac="weeks" value="${esc(a.cfg.weeks)}"></label>
      <label class="plf">النسبة القصوى (%) <input class="in" type="number" min="1" max="100" data-ac="pct" value="${esc(a.cfg.pct)}"></label>
      <label class="plf">رائد النشاط <input class="in" data-ac="lead" value="${esc(a.cfg.lead || '')}" list="tlist"></label>
      <label class="plf">وكيل المدرسة <input class="in" data-ac="vice" value="${esc(a.cfg.vice || '')}"></label>
      <label class="plf">مدير المدرسة <input class="in" data-ac="head" value="${esc(a.cfg.head || S.s.principal || '')}"></label>
      <label class="ck"><input type="checkbox" data-ac="sign"${a.cfg.sign !== false ? ' checked' : ''}> عمود توقيع المعلم في جدول الإسناد</label>
    </div>
    <label class="plf">نص التكليف في رأس الجدول — «{sem}» تُستبدل تلقائياً باسم الفصل<textarea class="in" rows="4" data-ac="intro">${esc(a.cfg.intro || ACT_INTRO)}</textarea></label>
    <h3 class="ah3">حصص كل مادة</h3>
    <div class="tw"><table class="et dense asubt"><tr><th>الصف</th><th>المادة</th><th>حصص أسبوعية للشعبة</th><th>إجمالي الفصل</th><th>الحد الأعلى (${a.cfg.pct}%)</th></tr>
    ${(() => { const seen = new Map(); a.rows.forEach(r => { const k = actSubKey(r); if (!seen.has(k)) seen.set(k, r); }); return [...seen.values()].sort((x, y) => x.g - y.g || x.sub.localeCompare(y.sub, 'ar')).map(r => { const k = actSubKey(r), o = a.subj[k] || {}, c = actCalc(r), w = actWeekly(r);
      return `<tr><td>${GSHORT[r.g]}</td><td class="tnames">${esc(r.sub)}</td><td><input class="in" type="number" step="0.5" min="0" data-asw="${esc(k)}" value="${o.w || ''}" placeholder="${w.w && w.src === 'من الجدول' ? w.w : '—'}" style="width:5.5rem"></td><td><input class="in" type="number" min="0" data-ast="${esc(k)}" value="${o.tot || ''}" placeholder="${c.tot || '—'}" style="width:5.5rem"></td><td><b>${c.max || '—'}</b></td></tr>`; }).join(''); })()}
    </table></div>
    <p class="hint">الخانة الفارغة تأخذ القيمة الرمادية المحسوبة تلقائياً. اكتب «إجمالي الفصل» مباشرة إذا كان لديك الرقم الرسمي من دليل الخطط.</p>
  </section>`;
  const catStep = `<section class="card"><h2>المجالات والبرامج</h2>
    <p class="hint">قائمة المجالات وبرامجها وألوانها في الجداول المطبوعة. أضف برنامجاً جديداً أو غيّر لونه أو اسمه — يتحدث في كل الأسطر.</p>
    ${a.doms.map((d, di) => `<div class="adom" style="--dc:${d.c}"><div class="adomh"><input type="color" value="${d.c}" data-adc="${di}" aria-label="لون المجال"><input class="in" value="${esc(d.n)}" data-adn="${di}"><small>${a.rows.filter(r => normName(r.dom) === normName(d.n)).length} سطر</small><button type="button" class="x" data-aact="domDel" data-i="${di}" title="حذف المجال">×</button></div>
      <div class="aprogs">${d.p.map((p, pi) => `<span class="aprog" style="--pc:${p.c}"><input type="color" value="${p.c}" data-apc="${di}.${pi}" aria-label="لون البرنامج"><input class="in" value="${esc(p.n)}" data-apn="${di}.${pi}"><button type="button" class="x" data-aact="progDel" data-i="${di}" data-j="${pi}" title="حذف البرنامج">×</button></span>`).join('')}
      <button type="button" class="btn sm ghost" data-aact="progAdd" data-i="${di}">＋ برنامج</button></div></div>`).join('')}
    <div class="acts wrap"><button type="button" class="btn sm" data-aact="domAdd">＋ مجال جديد</button><button type="button" class="btn sm ghost" data-aact="reset">↺ استرجاع إسناد الفصل الأول 1448 الأصلي</button></div>
  </section>`;
  return `${tl}${ro ? '<div class="pend ro"><div class="pdt"><b>للاطلاع فقط</b><span>تعديل النشاط الطلابي لرائد النشاط ومسؤول الاختبارات.</span></div></div>' : ''}${hero}${rowsStep}${peopleStep}${gridStep}${calcStep}${catStep}`;
}
/* ----- جدول المواعيد (شاشة وطباعة) ----- */
function actGridTeachers(g) { const m = new Map(); actRowsG(g).forEach(r => { const tr = actTT(r); const k = tr ? tr.n : r.t; if (!m.has(k)) m.set(k, { n: tr ? tr.n : r.t, tr, rows: [] }); m.get(k).rows.push(r); }); return [...m.values()].sort((a, b) => a.n.localeCompare(b.n, 'ar')); }
function actGridHtml(g, print) {
  const list = actGridTeachers(g);
  const head = `<tr><th rowspan="2" class="agn">اسم المعلم</th>${DAYN.map(d => `<th colspan="7">${d}</th>`).join('')}</tr><tr>${DAYN.map(() => [1, 2, 3, 4, 5, 6, 7].map(p => `<th>${p}</th>`).join('')).join('')}</tr>`;
  const body = list.map(t => { const act = new Map(); t.rows.forEach(r => (r.slots || []).forEach(k => act.set(k, r)));
    return `<tr><td class="agn">${esc(t.n)}</td>${DAYN.map((_, d) => [1, 2, 3, 4, 5, 6, 7].map(p => { const k = d + '-' + p, v = t.tr ? t.tr.c[k] || '' : '', r = act.get(k); return `<td${r ? ` style="background:${actProgColor(r.prog)};font-weight:800" title="${esc(r.prog)}"` : ''}>${esc(v || (r ? '•' : ''))}</td>`; }).join('')).join('')}</tr>`; }).join('');
  return `<table class="${print ? 't agt' : 'et agt'}" dir="rtl" border="1" cellspacing="0" cellpadding="2" width="100%">${head}${body}</table>`;
}
function actLegend(rows) { const ps = []; rows.forEach(r => { if (r.prog && !ps.some(p => normName(p) === normName(r.prog))) ps.push(r.prog); });
  const cells = ps.map(p => `<td style="width:2.2%;background:${actProgColor(p)}">&nbsp;</td><td style="text-align:right;font-size:8.5pt">${esc(p)}</td>`); let h = ''; for (let i = 0; i < cells.length; i += 4) h += `<tr>${cells.slice(i, i + 4).join('')}${'<td></td><td></td>'.repeat(Math.max(0, 4 - cells.slice(i, i + 4).length))}</tr>`;
  return `<table class="t" dir="rtl" border="1" cellspacing="0" cellpadding="2" width="100%">${h}</table>`; }
function actSigs() { const a = A().cfg; return sigs([['رائد النشاط', a.lead], ['وكيل المدرسة', a.vice], ['مدير المدرسة', a.head || S.s.principal]]); }
function actSemTxt() { return `الفصل الدراسي ${esc(S.s.sem)} ${esc(S.s.yearTxt)}`; }
function actPlanPages(o) {
  const a = A(), gs = o && o.g && o.g !== 'all' ? gSel(o) : G, rows = a.rows.filter(r => gs.includes(+r.g)), sign = a.cfg.sign !== false;
  const hd = [H('م', { w: '3%' }), H('اسم المعلم', { w: '13%' }), H('مادة التدريس', { w: '11%' }), H('الصف', { w: '7%' }), H('المجال', { w: '10%' }), H('اسم البرنامج المسند', { w: '17%' }), H('عدد الحصص', { w: '5%' }), H('النسبة من حصص المادة', { w: '7%' }), H(`الحد الأعلى (${a.cfg.pct}%)`, { w: '6%' }), H('موعد الحصص (حسب الجدول العام)')]; if (sign) hd.push(H('التوقيع', { w: '8%' }));
  const notice = `<table class="t" dir="rtl" border="1" cellspacing="0" cellpadding="4" width="100%" style="border:2px solid #c00000"><tr><td style="background:#fff8e1;text-align:center"><b style="color:#c00000">تنبيه مهم — التزام صارم</b><br><span style="font-size:9.5pt">يمكن للمدرسة استثمار ما لا يتجاوز ${a.cfg.pct}% من الحد الأعلى لعدد الحصص لكل مادة في برامج النشاط الطلابي، ويُحدَّد نوع النشاط وفق مجالات الأنشطة المعتمدة.<br><b>معادلة الحساب:</b> حصص النشاط = إجمالي حصص المادة (الحد الأعلى) × ${a.cfg.pct}%</span></td></tr></table>`;
  const intro = `<p class="txt" style="font-size:10pt">${esc(String(a.cfg.intro || ACT_INTRO).replace('{sem}', S.s.sem))}</p>`;
  const per = fitPer(rows.length, 15), out = [];
  for (let s = 0; s < Math.max(1, rows.length); s += per) {
    const T1 = [hd]; let lastG = 0;
    rows.slice(s, s + per).forEach((r, i) => { const c = actCalc(r);
      const row = [s + i + 1, { v: `<b>${esc(r.t)}</b>`, al: 'right' }, esc(r.sub), `${GSHORT[r.g]} ثانوي`, { v: esc(r.dom), fs: '9pt' }, { v: `<b>${esc(r.prog)}</b>`, bg: actProgColor(r.prog) }, { v: `<b>${+r.n || 0}</b>` }, { v: c.pct == null ? '—' : `${c.pct}% ${c.over ? '⚠' : '✓'}`, color: c.over ? '#c00000' : '', b: c.over }, c.max ? `${c.max} حصة` : '—', { v: esc(actSlotsTxt(r)) || '—', fs: '8.5pt' }];
      if (sign) row.push(''); lastG = r.g; T1.push(row); });
    out.push(title(`جدول إسناد برامج النشاط للمعلمين بعد احتساب الـ ${a.cfg.pct}% من الحصص الدراسية`, actSemTxt() + (gs.length === 1 ? ' — ' + GNAME[gs[0]] : '')) + (s === 0 ? notice + sp(4) + intro : '') + T(T1, { cls: 'dense' }) + (s + per >= rows.length ? sp(10) + actSigs() : ''));
  }
  return out;
}
function actGridPages(o) {
  const a = A(), gs = o && o.g && o.g !== 'all' ? gSel(o) : G, all = actGridTeachers('all').filter(t => t.rows.some(r => gs.includes(+r.g)));
  if (!D().tt) return [title('جدول مواعيد حصص النشاط ضمن الجدول العام للمعلمين') + '<p class="txt">لم يُرفع الجدول المدرسي العام بعد.</p>'];
  const per = fitPer(all.length, 20), out = [];
  for (let s = 0; s < Math.max(1, all.length); s += per) {
    const part = all.slice(s, s + per), rows = part.flatMap(t => t.rows);
    const head = `<tr><th rowspan="2" style="background:${HCOL};width:13%">اسم المعلم</th>${DAYN.map(d => `<th colspan="7" style="background:${HCOL}">${d}</th>`).join('')}</tr><tr>${DAYN.map(() => [1, 2, 3, 4, 5, 6, 7].map(p => `<th style="background:${LCOL};font-size:8pt">${p}</th>`).join('')).join('')}</tr>`;
    const body = part.map(t => { const act = new Map(); t.rows.filter(r => gs.includes(+r.g)).forEach(r => (r.slots || []).forEach(k => act.set(k, r)));
      return `<tr><td style="text-align:right;font-weight:bold;font-size:9pt">${esc(t.n)}</td>${DAYN.map((_, d) => [1, 2, 3, 4, 5, 6, 7].map(p => { const k = d + '-' + p, v = t.tr ? t.tr.c[k] || '' : '', r = act.get(k); return `<td style="font-size:8pt;${r ? `background:${actProgColor(r.prog)};font-weight:bold` : ''}">${esc(v)}</td>`; }).join('')).join('')}</tr>`; }).join('');
    out.push(title('جدول مواعيد حصص النشاط ضمن الجدول العام للمعلمين', actSemTxt()) + `<p class="ds">الخانات الملونة هي حصص النشاط (يدل اللون على البرنامج)، والرقم داخل الخانة هو رقم الشعبة كما في الجدول العام</p>` + actLegend(rows) + sp(6) + `<table class="t dense" dir="rtl" border="1" cellspacing="0" cellpadding="1" width="100%">${head}${body}</table>` + (s + per >= all.length ? sp(8) + actSigs() : ''));
  }
  return out;
}
function actLetterPages(o) {
  const a = A(), gs = o && o.g && o.g !== 'all' ? gSel(o) : G, list = o && o.rid ? a.rows.filter(r => r.id === o.rid) : a.rows.filter(r => gs.includes(+r.g));
  return list.map(r => { const c = actCalc(r);
    return title('تكليف بتنفيذ برنامج نشاط طلابي', actSemTxt()) + sp(6) +
      `<p class="txt">المكرم الأستاذ / <b>${esc(r.t)}</b> &nbsp;&nbsp; وفقه الله</p><p class="txt">السلام عليكم ورحمة الله وبركاته، وبعد:</p>` +
      `<p class="txt">${esc(String(a.cfg.intro || ACT_INTRO).replace('{sem}', S.s.sem))}</p>` + sp(4) +
      T([[L('مادة التدريس', { w: '22%' }), esc(r.sub), L('الصف', { w: '14%' }), `${GSHORT[r.g]} ثانوي`], [L('المجال'), esc(r.dom), L('عدد الحصص'), `<b>${+r.n || 0}</b> حصة`], [L('البرنامج المسند'), { v: `<b>${esc(r.prog)}</b>`, bg: actProgColor(r.prog), cs: 3 }], [L('مواعيد الحصص'), { v: esc(actSlotsTxt(r)) || '................................................', cs: 3 }], [L(`النسبة من حصص المادة`), c.pct == null ? '—' : `${c.pct}%`, L(`الحد الأعلى (${a.cfg.pct}%)`), c.max ? `${c.max} حصة` : '—']], { cls: 'tall' }) + sp(10) +
      `<p class="txt">شاكرين لكم تعاونكم، سائلين الله لكم التوفيق والسداد.</p>` + sp(6) + T([[L('اسم المعلم'), esc(r.t), L('التوقيع', { w: '14%' }), ''], [L('تاريخ الاستلام'), '', L('ملاحظات'), '']], { cls: 'tall' }) + sp(14) + actSigs(); });
}
function actSumPages(o) {
  const a = A(), gs = o && o.g && o.g !== 'all' ? gSel(o) : G, rows = a.rows.filter(r => gs.includes(+r.g)), T1 = [[H('المجال', { w: '16%' }), H('البرنامج', { w: '24%' }), H('الصفوف', { w: '12%' }), H('المعلمون'), H('عدد الحصص', { w: '9%' })]];
  let tot = 0; a.doms.forEach(d => { const dr = rows.filter(r => normName(r.dom) === normName(d.n)); if (!dr.length) return; const ps = []; dr.forEach(r => { let p = ps.find(x => normName(x.n) === normName(r.prog)); if (!p) ps.push(p = { n: r.prog, rows: [] }); p.rows.push(r); });
    ps.forEach((p, i) => { const n = p.rows.reduce((s, r) => s + (+r.n || 0), 0); tot += n; const row = []; if (!i) row.push({ v: `<b>${esc(d.n)}</b>`, rs: ps.length, bg: planTint ? planTint(d.c) : LCOL }); row.push({ v: `<b>${esc(p.n)}</b>`, bg: actProgColor(p.n) }, [...new Set(p.rows.map(r => GSHORT[r.g]))].join('، '), { v: esc(p.rows.map(r => r.t).join('، ')), al: 'right', fs: '9pt' }, `<b>${n}</b>`); T1.push(row); }); });
  T1.push([{ v: '<b>المجموع</b>', cs: 4, bg: LCOL }, { v: `<b>${tot}</b>`, bg: LCOL }]);
  return [title('ملخص برامج النشاط الطلابي حسب المجال', actSemTxt()) + T(T1) + sp(10) + actSigs()];
}
FORMS.push(
  { id: 'actPlan', grp: 'النشاط الطلابي', t: 'جدول إسناد برامج النشاط للمعلمين (حسبة 10%)', land: 1, opts: ['grade'], build: o => actPlanPages(o) },
  { id: 'actGrid', grp: 'النشاط الطلابي', t: 'جدول مواعيد حصص النشاط ضمن الجدول العام', land: 1, opts: ['grade'], build: o => actGridPages(o) },
  { id: 'actLetter', grp: 'النشاط الطلابي', t: 'خطابات تكليف المعلمين ببرامج النشاط', opts: ['grade'], build: o => actLetterPages(o) },
  { id: 'actSum', grp: 'النشاط الطلابي', t: 'ملخص برامج النشاط حسب المجال', opts: ['grade'], build: o => actSumPages(o) }
);
FD_IDS.push('actPlan', 'actLetter', 'actSum');
/* ----- استيراد: Word / PDF / Excel ----- */
function actFixTxt(s) { return toWestern(String(s || '').normalize('NFKC')).replace(/[‎‏‪-‮]/g, '').replace(/(\S)\s(ة|ي|ى)(?=\s|$)/g, '$1$2').replace(/\s+/g, ' ').trim(); }
const ACT_SUBW = ['رياضيات', 'الرياضيات', 'فيزياء', 'الفيزياء', 'كيمياء', 'الكيمياء', 'أحياء', 'الأحياء', 'عربي', 'اللغة', 'انجليزي', 'إنجليزي', 'التاريخ', 'التفسير', 'تقنية', 'التقنية', 'التفكير', 'كفايات', 'الكفايات', 'المهارات', 'مهارات', 'التربية', 'تربية', 'البحث', 'علم', 'علوم', 'الدراسات', 'الحديث', 'التوحيد', 'الفقه', 'الفنون', 'المعرفة', 'المواطنة', 'الجغرافيا', 'جغرافيا', 'لياقة', 'اللياقة', 'القرآن'];
function actGradeOf(sub, hdrG, t) { const m = /(\d)\s*$/.exec(sub) || /\s(\d)(?:-\d)?(\s|$)/.exec(sub); if (m && +m[1] >= 1 && +m[1] <= 3) return +m[1];
  if (typeof CURR !== 'undefined' && normName(sub).length > 4) { const z = s => normName(s).replace(/[\d\-]+/g, '').replace(/(^| )ال/g, '$1').trim(), w = z(sub); const hit = G.filter(g => [...CURR[g][1], ...CURR[g][2]].some(c => { const q = z(c); return q.length > 4 && (q === w || q.startsWith(w + ' ') || w.startsWith(q + ' ')); })); if (hit.length === 1) return hit[0]; }
  if (hdrG) return hdrG;
  const gsT = [...new Set((S.ta || []).filter(x => sameTeacher([x.t])(t)).map(x => +x.g))]; return gsT.length === 1 ? gsT[0] : 1; }
function actSplitTS(pre, known) { const w = pre.split(' ').filter(Boolean); if (!w.length) return { t: '', sub: '' };
  for (let k = Math.min(4, w.length); k >= 2; k--) { const n = w.slice(0, k).join(' '); if (known(n)) return { t: n, sub: w.slice(k).join(' ') }; }
  const i = w.findIndex((x, j) => j >= 2 && ACT_SUBW.some(s => normName(x) === normName(s))); if (i >= 2) return { t: w.slice(0, i).join(' '), sub: w.slice(i).join(' ') };
  return w.length <= 3 ? { t: w.join(' '), sub: '' } : { t: w.slice(0, 2).join(' '), sub: w.slice(2).join(' ') }; }
function actParseLines(lines) {
  const doms = [...new Set([...A().doms.map(d => d.n), ...ACT_DOMS.map(d => d.n)])].sort((a, b) => b.length - a.length);
  const known = (() => { const ls = [...tchAll(), ...(D().tt ? D().tt.teachers.map(x => x.n) : []), ...A().rows.map(r => r.t)]; const a = new Set(ls.map(normName)); return n => a.has(normName(n)); })();
  let hdrG = 0, pend = '', lastSub = '', lastG = 0; const out = [];
  lines.map(actFixTxt).forEach(l => {
    const gm = /للصف\s+(الأول|الثاني|الثالث)/.exec(l); if (gm) { hdrG = { 'الأول': 1, 'الثاني': 2, 'الثالث': 3 }[gm[1]]; pend = ''; return; }
    if (!l || /^(وزارة|الإدارة|مدرسة|بناء|ضمن|النشاط الطلابي بالتقارير|رائد النشاط|اسم المعلم|م اسم)/.test(l) || /جدول اسناد|جدول إسناد/.test(l)) return;
    l = l.replace(/(^|\s)الثانوية(\s|$)/g, ' ').replace(/\s+/g, ' ').trim(); if (!l) return;
    const d = doms.map(n => ({ n, i: l.indexOf(n) })).filter(x => x.i >= 0).sort((a, b) => a.i - b.i)[0];
    if (!d) { pend = (pend + ' ' + l).trim(); return; }
    const pre = (pend + ' ' + l.slice(0, d.i)).trim(); pend = ''; let rest = l.slice(d.i + d.n.length).trim();
    const nm = /(\d+)\s*$/.exec(rest); const n = nm ? +nm[1] : 0; if (nm) rest = rest.slice(0, nm.index).trim();
    let { t, sub } = actSplitTS(pre, known); if (!sub) sub = lastSub; else lastSub = sub;
    const g = sub === lastSub && lastG && !/\d/.test(sub) && !pre.includes(sub) ? lastG : actGradeOf(sub, hdrG, t); lastG = g;
    if (t) out.push({ g, t, sub, dom: d.n, prog: rest, n });
  });
  return out;
}
function actParseTable(rows) {
  const hi = rows.findIndex(r => r.some(c => /اسم المعلم|المعلم/.test(c)) && r.some(c => /البرنامج/.test(c))); if (hi < 0) return null;
  const h = rows[hi].map(c => actFixTxt(c)), col = re => h.findIndex(c => re.test(c));
  const ci = { t: col(/المعلم/), sub: col(/مادة|المادة/), g: col(/الصف|المرحلة/), dom: col(/المجال/), prog: col(/البرنامج/), n: col(/عدد/), sl: col(/موعد|المواعيد/) };
  let lastSub = '', lastG = 0; const out = [];
  rows.slice(hi + 1).forEach(r => { const v = k => ci[k] >= 0 ? actFixTxt(r[ci[k]]) : ''; const t = v('t'); if (!t || /^المجموع/.test(t)) return;
    const sub = v('sub') || lastSub; lastSub = sub; const gt = v('g'); let g = /الأول|^1|أول/.test(gt) ? 1 : /الثاني|^2|ثاني/.test(gt) ? 2 : /الثالث|^3|ثالث/.test(gt) ? 3 : 0; if (!g) g = actGradeOf(sub, lastG, t); lastG = g;
    const slots = []; v('sl').split(/[،,]/).forEach(x => { const m = /(الأحد|الاثنين|الإثنين|الثلاثاء|الأربعاء|الخميس)\s*-?\s*الحصة\s*(\d)/.exec(x); if (m) slots.push(['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس'].indexOf(m[1].replace('الإثنين', 'الاثنين')) + '-' + m[2]); });
    out.push({ g, t, sub, dom: v('dom'), prog: v('prog'), n: +(v('n').match(/\d+/) || [0])[0], slots }); });
  return out;
}
/* قراءة PDF من Word: تُعاد بعض الحروف المتصلة معكوسة (اإل، املعلم، احلصص، هللا) — تصحيح بسيط + مطابقة بمفتاح يتجاهلها */
function actPdfFix(s) { return String(s || '').replace(/هللا/g, 'الله').replace(/اإل/g, 'الإ').replace(/األ/g, 'الأ').replace(/اآل/g, 'الآ').replace(/(^|[\s(])([وبفكل]?)امل/g, '$1$2الم').replace(/(^|[\s(])([وبفكل]?)احل/g, '$1$2الح').replace(/(^|[\s(])([وبفكل]?)اال/g, '$1$2الا').replace(/را ئد/g, 'رائد'); }
function actKey(s) { return normName(actPdfFix(actFixTxt(s))).replace(/[اليىةهإأآءئؤ\s]/g, ''); }
function actVocab() { const v = { dom: [], prog: [], t: [], sub: [] };
  [...A().doms, ...ACT_DOMS.map(d => ({ n: d.n, p: d.p.map(n => ({ n })) }))].forEach(d => { v.dom.push(d.n); d.p.forEach(p => v.prog.push(p.n)); });
  v.t = [...A().rows.map(r => r.t), ...tchAll(), ...(D().tt ? D().tt.teachers.map(x => x.n) : [])]; v.sub = [...A().rows.map(r => r.sub), ...(S.ta || []).map(x => x.sub), ...(typeof CURR !== 'undefined' ? G.flatMap(g => [...CURR[g][1], ...CURR[g][2]]) : [])];
  const m = {}; Object.keys(v).forEach(k => { m[k] = new Map(); v[k].filter(Boolean).forEach(n => { const kk = actKey(n); if (kk && !m[k].has(kk)) m[k].set(kk, n); }); }); return m; }
function actClean(val, map) { const k = actKey(val); return (k && map && map.get(k)) || actPdfFix(actFixTxt(val)); }
async function actPdfTable(buf) {
  await ensurePdfJs(); const pdf = await pdfjsLib.getDocument({ data: buf.slice(), isEvalSupported: false }).promise, V = actVocab(), out = [];
  for (let pi = 1; pi <= pdf.numPages; pi++) {
    const its = (await (await pdf.getPage(pi)).getTextContent()).items.filter(t => t.str && t.str.trim()).map(t => ({ s: actPdfFix(actFixTxt(t.str)), x: t.transform[4] + (t.width || 0) / 2, y: t.transform[5] }));
    const all = its.map(t => t.s).join(' '), gm = /للصف\s+(الأول|الثاني|الثالث)/.exec(all), hdrG = gm ? { 'الأول': 1, 'الثاني': 2, 'الثالث': 3 }[gm[1]] : 0;
    const sig = its.find(t => /التوقيع/.test(t.s)) || its.find(t => /المجال/.test(t.s)); if (!sig) continue;
    const hy = sig.y, H0 = its.filter(t => Math.abs(t.y - hy) < 9), ax = re => { const m = H0.filter(t => re.test(t.s)); return m.length ? m.reduce((s, t) => s + t.x, 0) / m.length : null; };
    const cols = { t: ax(/المعلم/), sub: ax(/مادة|التدريس/), st: ax(/المرحلة/), dom: ax(/المجال/), prog: ax(/المسند/) ?? ax(/^اسم البرنامج/), n: ax(/عدد/), sig: ax(/التوقيع/) };
    if (cols.t == null || cols.dom == null) continue;
    const C = Object.entries(cols).filter(([, x]) => x != null), colOf = x => C.reduce((b, c) => Math.abs(c[1] - x) < Math.abs(b[1] - x) ? c : b)[0];
    const foot = its.filter(t => /رائد النشاط|وكيل المدرسة/.test(t.s) && t.y < hy).reduce((m, t) => Math.max(m, t.y), -1e9);
    const body = its.filter(t => t.y < hy - 6 && t.y > foot + 4).map(t => Object.assign(t, { c: colOf(t.x) }));
    const ty = []; body.filter(t => t.c === 't').sort((a, b) => b.y - a.y).forEach(t => { const r = ty.find(r => Math.abs(r.y - t.y) < 4); if (r) r.it.push(t); else ty.push({ y: t.y, it: [t] }); });
    if (!ty.length) continue; const gap = ty.length > 1 ? Math.min(...ty.slice(1).map((r, i) => Math.abs(ty[i].y - r.y))) : 20;
    const rows = ty.map(r => ({ y: r.y, v: { t: r.it.sort((a, b) => b.x - a.x).map(t => t.s).join(' ') } })), SPAN = ['sub', 'dom', 'st'], anc = {};
    body.filter(t => t.c !== 't' && t.c !== 'sig').forEach(t => { if (SPAN.includes(t.c)) { (anc[t.c] = anc[t.c] || []).push(t); return; }
      const r = rows.reduce((b, r) => Math.abs(r.y - t.y) < Math.abs(b.y - t.y) ? r : b); r.v[t.c] = ((r.v[t.c] || '') + ' ' + t.s).trim(); });
    /* الخلايا المدمجة: تقسيم الصفوف إلى مقاطع متتالية بحيث يقع مركز كل خلية في منتصف مقطعها */
    Object.entries(anc).forEach(([c, list]) => { const grp = []; list.sort((a, b) => b.y - a.y).forEach(t => { const g = grp.find(g => Math.abs(g.last - t.y) < gap * 0.62); if (g) { g.s += ' ' + t.s; g.ys.push(t.y); g.last = t.y; } else grp.push({ s: t.s, ys: [t.y], last: t.y }); });
      if (c === 'sub') for (let q = grp.length - 2; q >= 0; q--) { const j = grp[q].s + ' ' + grp[q + 1].s; if (V.sub.has(actKey(j)) && !V.sub.has(actKey(grp[q + 1].s))) { grp[q].s = j; grp[q].ys.push(...grp[q + 1].ys); grp.splice(q + 1, 1); } }
      grp.forEach(g => g.y = (Math.max(...g.ys) + Math.min(...g.ys)) / 2); const n = rows.length, k = Math.min(grp.length, n); if (!k) return;
      const ys = rows.map(r => r.y), cost = (i, j, a) => { let s = 0; for (let q = i; q <= j; q++) s += ys[q]; const m = s / (j - i + 1); return (m - grp[a].y) ** 2; };
      const dp = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(Infinity)), bk = Array.from({ length: k + 1 }, () => new Array(n + 1).fill(-1)); dp[0][0] = 0;
      for (let a = 1; a <= k; a++) for (let j = a; j <= n - (k - a); j++) for (let i = a - 1; i < j; i++) { const v = dp[a - 1][i] + cost(i, j - 1, a - 1); if (v < dp[a][j]) { dp[a][j] = v; bk[a][j] = i; } }
      let j = n; for (let a = k; a >= 1; a--) { const i = bk[a][j]; for (let q = i; q < j; q++) rows[q].v[c] = grp[a - 1].s; j = i; } });
    let lastSub = '', lastG = 0;
    rows.forEach(r => { const v = r.v; let sub = v.sub ? actClean(v.sub, V.sub) : lastSub; lastSub = sub; const t = actClean(v.t, V.t); if (!t) return;
      const nm = /(\d+)/.exec(v.n || ''); let prog = v.prog || ''; const pn = /(\d+)\s*$/.exec(prog); let n = nm ? +nm[1] : 0; if (!nm && pn) { n = +pn[1]; prog = prog.slice(0, pn.index); }
      const g = actGradeOf(sub, hdrG, t) || hdrG; lastG = g;
      out.push({ g, t, sub, dom: actClean(v.dom || '', V.dom), prog: actClean(prog, V.prog), n }); });
  }
  return out;
}
async function actImport(file) {
  const buf = new Uint8Array(await file.arrayBuffer()); let rows = null;
  try {
    if (/\.(xlsx|xls|csv)$/i.test(file.name)) { const wb = XLSX.read(buf, { type: 'array' }); rows = actParseTable(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' }).map(r => r.map(String))); }
    else if (/\.docx$/i.test(file.name)) { const tr = docxRows(buf).map(r => r.map(String)); rows = actParseTable(tr) || actParseLines(tr.map(r => r.join(' '))); }
    else if (/\.doc$/i.test(file.name)) { const tr = docBinaryRows(buf).map(r => r.map(String)); rows = actParseTable(tr) || actParseLines(tr.map(r => r.join(' '))); }
    else if (buf[0] === 0x25 && buf[1] === 0x50) { rows = await actPdfTable(buf); }
  } catch (e) { console.error(e); return toast('تعذرت قراءة الملف: ' + (e.message || e), true); }
  { const V = actVocab(); (rows || []).forEach(r => { r.t = actClean(r.t, V.t); r.dom = actClean(r.dom, V.dom); r.prog = actClean(r.prog, V.prog); if (r.sub) r.sub = actClean(r.sub, V.sub); }); }
  rows = (rows || []).filter(r => r.t && (r.prog || r.dom));
  if (!rows.length) return toast('لم يُعثر في الملف على جدول إسناد برامج نشاط (المعلم، المجال، البرنامج، العدد)', true);
  const byG = G.map(g => `${GSHORT[g]}: ${rows.filter(r => r.g === g).length}`).join('، ');
  const replace = await choiceBox(`قُرئ ${rows.length} سطراً (${byG}). مثال: ${rows[0].t} — ${rows[0].prog} (${rows[0].n} حصص).\nاستبدال الخطة الحالية بها، أم إضافتها إلى الموجود؟`, 'استبدال الخطة', 'إضافة إليها');
  const a = A(); if (replace) a.rows = [];
  rows.forEach(r => { actEnsureProg(r.dom, r.prog); a.rows.push({ id: actNewId(), g: r.g, t: r.t, sub: r.sub, dom: r.dom, prog: r.prog, n: r.n, slots: r.slots || [] }); });
  a.src = { name: file.name, at: new Date().toISOString() }; actSave(); toast(`تم ${replace ? 'استبدال الخطة' : 'إضافة'} ${rows.length} سطراً ✓`);
}
function actXlsx() {
  const a = A(), aoa = [['الصف', 'اسم المعلم', 'مادة التدريس', 'المجال', 'اسم البرنامج المسند', 'عدد الحصص', 'النسبة من حصص المادة', `الحد الأعلى (${a.cfg.pct}%)`, 'موعد الحصص']];
  a.rows.forEach(r => { const c = actCalc(r); aoa.push([GSHORT[r.g] + ' ثانوي', r.t, r.sub, r.dom, r.prog, +r.n || 0, c.pct == null ? '' : c.pct + '%', c.max || '', actSlotsTxt(r)]); });
  const ws = XLSX.utils.aoa_to_sheet(aoa); ws['!cols'] = [8, 22, 18, 16, 30, 9, 12, 12, 40].map(w => ({ wch: w })); ws['!views'] = [{ RTL: true }];
  const wb = XLSX.utils.book_new(); wb.Workbook = { Views: [{ RTL: true }] }; XLSX.utils.book_append_sheet(wb, ws, 'إسناد النشاط');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' }); download(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), fname('إسناد برامج النشاط - ' + S.s.sem) + '.xlsx');
}
/* ----- الأحداث ----- */
function actRow(id) { return A().rows.find(r => r.id === id); }
document.addEventListener('click', async e => {
  const b = e.target.closest && e.target.closest('[data-aact]'); if (!b) return; const a = b.dataset.aact, r = b.dataset.id ? actRow(b.dataset.id) : null;
  if (a === 'g') { ACT_G = b.dataset.v === 'all' ? 'all' : +b.dataset.v; return render(); }
  if (a === 'open') { if (ACT_SWAP && ACT_SWAP !== b.dataset.id && !actGuard()) { const x = actRow(ACT_SWAP), y = r; if (x && y) { [x.t, y.t] = [y.t, x.t]; const sx = x.slots, sy = y.slots; x.slots = []; y.slots = []; ACT_SWAP = null; actSave(); toast(`بُدّل المعلمان: ${x.t} ⇄ ${y.t}${(sx || []).length + (sy || []).length ? ' — أُفرغت المواعيد لأنها مرتبطة بجدول كل معلم' : ''}`); } return; }
    ACT_OPEN = ACT_OPEN === b.dataset.id ? null : b.dataset.id; render(); if (ACT_OPEN) { const el = document.querySelector(`.arow[data-aid="${ACT_OPEN}"]`); if (el) el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } return; }
  if (a === 'goRow') { ACT_OPEN = b.dataset.id; ACT_G = 'all'; ACT_Q = ''; if (typeof SUB !== 'undefined') SUB.activity = 0; render(); const el = document.querySelector(`.arow[data-aid="${ACT_OPEN}"]`); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
  if (a === 'swapx') { ACT_SWAP = null; return render(); }
  if (a === 'xlsx') return actXlsx();
  if (a === 'json') return download(new Blob([JSON.stringify(A(), null, 1)], { type: 'application/json' }), fname('النشاط الطلابي - نسخة') + '.json');
  if (actGuard()) return;
  const A0 = A();
  switch (a) {
    case 'n': r.n = Math.max(0, (+r.n || 0) + +b.dataset.d); return actSave();
    case 'unlink': delete r.tt; r.slots = []; return actSave();
    case 'nmax': r.n = actCalc(r).max; return actSave();
    case 'slot': { const k = b.dataset.k, s = new Set(r.slots || []); s.has(k) ? s.delete(k) : s.add(k); r.slots = [...s]; return actSave(); }
    case 'dup': { const c = Object.assign(clone(r), { id: actNewId(), t: '', slots: [] }); A0.rows.splice(A0.rows.indexOf(r) + 1, 0, c); ACT_OPEN = c.id; return actSave(); }
    case 'swap': ACT_SWAP = ACT_SWAP === r.id ? null : r.id; ACT_OPEN = null; return render();
    case 'up': case 'dn': { const i = A0.rows.indexOf(r), j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= A0.rows.length) return; [A0.rows[i], A0.rows[j]] = [A0.rows[j], A0.rows[i]]; return actSave(); }
    case 'del': if (await confirmBox(`حذف إسناد «${r.prog}» للمعلم ${r.t || '—'}؟`)) { A0.rows.splice(A0.rows.indexOf(r), 1); ACT_OPEN = null; actSave(); } return;
    case 'add': { const g = ACT_G === 'all' ? 1 : +ACT_G, c = { id: actNewId(), g, t: '', sub: '', dom: '', prog: '', n: 4, slots: [] }; A0.rows.push(c); ACT_OPEN = c.id; actSave(); const el = document.querySelector(`.arow[data-aid="${c.id}"]`); if (el) el.scrollIntoView({ block: 'center' }); return; }
    case 'addSub': { const last = [...A0.rows].reverse().find(x => +x.g === +b.dataset.g && normName(x.sub) === normName(b.dataset.sub)); const c = { id: actNewId(), g: +b.dataset.g, t: '', sub: b.dataset.sub, dom: last ? last.dom : '', prog: last ? last.prog : '', n: last ? last.n : 4, slots: [] }; A0.rows.splice(last ? A0.rows.indexOf(last) + 1 : A0.rows.length, 0, c); ACT_OPEN = c.id; return actSave(); }
    case 'rep': { const names = [...new Set(A0.rows.map(x => x.t).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'ar')); const from = await actPrompt('إحلال معلم في كل الخطة', 'المعلم الحالي', names), to = from && await actPrompt(`البديل عن «${from}»`, 'المعلم البديل', tchAll()); if (!from || !to) return;
      let n = 0; A0.rows.forEach(x => { if (normName(x.t) === normName(from)) { x.t = to; x.slots = []; n++; } }); actSave(); return toast(`أُحلّ «${to}» مكان «${from}» في ${n} سطر — حدّد مواعيده من جدوله`); }
    case 'domAdd': A0.doms.push({ n: 'مجال جديد', c: '#475569', p: [] }); return actSave();
    case 'domDel': { const d = A0.doms[+b.dataset.i]; if (await confirmBox(`حذف مجال «${d.n}» وبرامجه من القائمة؟ (الأسطر المسندة تبقى كما هي)`)) { A0.doms.splice(+b.dataset.i, 1); actSave(); } return; }
    case 'progAdd': { const d = A0.doms[+b.dataset.i], used = new Set(A0.doms.flatMap(x => x.p.map(p => p.c))); d.p.push({ n: 'برنامج جديد', c: ACT_PAL.find(c => !used.has(c)) || ACT_PAL[0] }); return actSave(); }
    case 'progDel': { const d = A0.doms[+b.dataset.i]; d.p.splice(+b.dataset.j, 1); return actSave(); }
    case 'reset': if (await confirmBox('استرجاع إسناد الفصل الأول 1448 الأصلي؟ ستُستبدل الخطة الحالية بكاملها.')) { S.act = actDefault(); ACT_OPEN = null; actSave(); } return;
  }
});
function actPrompt(msg, label, list) {
  return new Promise(res => { const m = document.createElement('div'); m.className = 'modal actpm'; m.innerHTML = `<div class="mbox"><p><b>${esc(msg)}</b></p><label class="plf">${esc(label)}<input class="in" list="actpl" id="actpIn"></label><datalist id="actpl">${list.map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist><div class="acts"><button type="button" class="btn pri" id="actpY">متابعة</button><button type="button" class="btn ghost" id="actpN">إلغاء</button></div></div>`;
    document.body.appendChild(m); const i = m.querySelector('#actpIn'); setTimeout(() => i.focus(), 30); const fin = v => { m.remove(); res(v); };
    m.querySelector('#actpY').onclick = () => fin(i.value.trim()); m.querySelector('#actpN').onclick = () => fin(''); i.onkeydown = ev => { if (ev.key === 'Enter') fin(i.value.trim()); if (ev.key === 'Escape') fin(''); }; });
}
document.addEventListener('change', async e => {
  const el = e.target; if (!el.dataset) return;
  if (el.id === 'actFile' && el.files[0]) { const f = el.files[0]; el.value = ''; if (actGuard()) return; return actImport(f); }
  if (el.id === 'actJson' && el.files[0]) { const f = el.files[0]; el.value = ''; if (actGuard()) return; try { const d = JSON.parse(await f.text()); if (!Array.isArray(d.rows)) throw new Error('ليس ملف نشاط'); if (await confirmBox(`استرجاع نسخة فيها ${d.rows.length} سطراً؟ ستُستبدل الخطة الحالية.`)) { S.act = d; actSave(); toast('استُرجعت النسخة ✓'); } } catch (x) { toast('ملف غير صالح: ' + x.message, true); } return; }
  const id = el.dataset.id;
  if (el.dataset.af && id) { if (actGuard()) return render(); const r = actRow(id); let v = el.value; const f = el.dataset.af;
    if (v === '__new') { v = await actPrompt(f === 't' ? 'اسم المعلم' : f === 'sub' ? 'مادة التدريس' : f === 'dom' ? 'اسم المجال' : 'اسم البرنامج', 'الاسم', f === 't' ? tchAll() : []); if (!v) return render(); }
    if (f === 'g') r.g = +v; else if (f === 'tt') { if (v) r.tt = v; else delete r.tt; } else r[f] = v;
    if (f === 't') delete r.tt;
    if (f === 't') r.slots = (r.slots || []).filter(k => actCells(r).some(x => x.k === k));
    if (f === 'dom') { const d = actDom(v); if (d && r.prog && !d.p.some(p => normName(p.n) === normName(r.prog))) r.prog = ''; }
    if (f === 'prog' && r.dom) actEnsureProg(r.dom, v);
    if (f === 'dom' && v && !actDom(v)) A().doms.push({ n: v, c: '#475569', p: [] });
    return actSave(); }
  if (el.dataset.ac) { if (actGuard()) return render(); const k = el.dataset.ac; A().cfg[k] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? +el.value : el.value; return actSave(k !== 'intro'); }
  if (el.dataset.asw != null || el.dataset.ast != null) { if (actGuard()) return render(); const k = el.dataset.asw || el.dataset.ast, o = A().subj[k] = A().subj[k] || {}; if (el.dataset.asw != null) o.w = +el.value || 0; else o.tot = +el.value || 0; return actSave(); }
  if (el.dataset.adn != null) { if (actGuard()) return render(); const d = A().doms[+el.dataset.adn], old = d.n; d.n = el.value.trim() || old; A().rows.forEach(r => { if (normName(r.dom) === normName(old)) r.dom = d.n; }); return actSave(); }
  if (el.dataset.adc != null) { if (actGuard()) return render(); A().doms[+el.dataset.adc].c = el.value; return actSave(); }
  if (el.dataset.apn != null) { if (actGuard()) return render(); const [di, pi] = el.dataset.apn.split('.').map(Number), p = A().doms[di].p[pi], old = p.n; p.n = el.value.trim() || old; A().rows.forEach(r => { if (normName(r.prog) === normName(old)) r.prog = p.n; }); return actSave(); }
  if (el.dataset.apc != null) { if (actGuard()) return render(); const [di, pi] = el.dataset.apc.split('.').map(Number); A().doms[di].p[pi].c = el.value; return actSave(); }
});
/* ----- دمج تعديلات جهازين على خطة النشاط (ثلاثي: الأساس المشترك + نسختي + نسخة السحابة) ----- */
function actBase() { try { return JSON.parse(localStorage.getItem(LS_KEY + '-base-act') || 'null'); } catch (e) { return null; } }
function actBaseSet(d) { try { localStorage.setItem(LS_KEY + '-base-act', JSON.stringify(d || null)); } catch (e) { } }
function actMerge(base, loc, rem) {
  const J = v => JSON.stringify(v == null ? null : v); base = base || { rows: [], cfg: {}, doms: [], subj: {} }; loc = loc || {}; rem = rem || {};
  const out = Object.assign({}, rem); let n = 0;
  ['cfg', 'subj'].forEach(k => { const b = base[k] || {}, l = loc[k] || {}, r = rem[k] || {}, o = Object.assign({}, r); new Set([...Object.keys(l), ...Object.keys(b)]).forEach(x => { if (J(l[x]) !== J(b[x])) { o[x] = l[x]; n++; if (l[x] === undefined) delete o[x]; } }); out[k] = o; });
  if (J(loc.doms) !== J(base.doms)) { out.doms = loc.doms; n++; }
  const bm = new Map((base.rows || []).map(r => [r.id, r])), lm = new Map((loc.rows || []).map(r => [r.id, r])), rows = [];
  (rem.rows || []).forEach(r => { const b = bm.get(r.id), l = lm.get(r.id);
    if (!l) { if (b && J(b) === J(r)) { n++; return; } rows.push(r); return; }   /* حُذف عندي ولم يتغير هناك */
    if (b && J(l) !== J(b)) { rows.push(l); n++; } else rows.push(r); });
  (loc.rows || []).forEach((l, i) => { if (rows.some(r => r.id === l.id) || bm.has(l.id)) return; const prev = (loc.rows || [])[i - 1], at = prev ? rows.findIndex(r => r.id === prev.id) : -1; rows.splice(at + 1, 0, l); n++; });
  out.rows = rows; out.at = new Date().toISOString(); return { data: out, n };
}
/* ----- التسجيل في النظام: صفحة ودور ومزامنة ----- */
UTILS.splice(1, 0, { k: 'activity', pin: true, t: 'النشاط الطلابي', d: 'إسناد برامج النشاط للمعلمين بحسبة 10% من حصص المادة، ومواعيدها من الجدول العام — طباعة وتصدير بكل الصيغ', c: '#16a34a', ic: '<path d="M12 3l2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.3 6.8 19l1-5.8L3.6 9.1l5.8-.8z"/>' });
PAGES.push(UTILS[1]); ALL_TABS.push(['activity', 'النشاط الطلابي']);
SUBP.push('activity');
