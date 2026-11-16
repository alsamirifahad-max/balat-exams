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

/* ----- مصادر البيانات: ما يُرفع داخل نافذة النشاط يُستخدم أولاً، وإلا بيانات النظام ----- */
function actTTData() { const s = (S.act && S.act.src) || {}; return s.tt && Array.isArray(s.tt.teachers) && s.tt.teachers.length ? s.tt : D().tt; }
function actTeachers() { const s = (S.act && S.act.src) || {}; return s.tch && s.tch.length ? s.tch : tchAll(); }
function actTA() { const s = (S.act && S.act.src) || {}; return s.ta && s.ta.length ? s.ta : (S.ta || []); }
let ACT_BUILD = null, ACT_EXQ = '';
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
  actTA().forEach(x => { if (+x.g !== +r.g || !sameTeacher([x.t])(r.t)) return; const xs = normName(x.sub).replace(/\s*\d.*$/, '');
    if (sub && xs && !(xs.includes(sub) || sub.includes(xs) || xs.split(' ')[0] === sub.split(' ')[0])) return;
    String(x.sec || '').split(/[^0-9]+/).filter(Boolean).forEach(s => { const n = +s; out.add(n > off ? n : n + off); }); });
  return out;
}
function actNk(n) { const w = normName(n).split(' ').filter(Boolean); return { f: w[0] || '', l: (w[w.length - 1] || '').replace(/^ال/, ''), n: w.length }; }
function actTT(r) { const t = actTTData(); if (!t || !r.t) return null; const T0 = t.teachers;
  const ln = r.tt || ((A().links || {})[normName(r.t)]); if (ln) { const x = T0.find(y => y.n === ln); if (x) return x; }
  const k = normName(r.t), pk = personKey(r.t); let x = T0.find(y => normName(y.n) === k) || T0.find(y => personKey(y.n) === pk); if (x) return x;
  const q = actNk(r.t), c = T0.filter(y => { const z = actNk(y.n); return z.f === q.f && (z.l === q.l || z.n === 1 || q.n === 1); }); return c.length === 1 ? c[0] : null; }
function actGuess(name) { const t = actTTData(); if (!t) return []; const q = actNk(name); return t.teachers.map(y => { const z = actNk(y.n); return { n: y.n, s: (z.f === q.f ? 2 : 0) + (z.l === q.l ? 3 : 0) }; }).filter(x => x.s).sort((a, b) => b.s - a.s).map(x => x.n); }
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
function actTchOpts(r) { const list = actTeachers(); return (r.t && !list.some(n => normName(n) === normName(r.t)) ? [r.t, ...list] : list).filter(Boolean); }
function actSubOpts(r) { const s = new Set(); actTA().filter(x => +x.g === +r.g && sameTeacher([x.t])(r.t)).forEach(x => s.add(x.sub)); if (r.sub) s.add(r.sub); if (typeof currList === 'function') currList(r.g).forEach(x => s.add(x)); return [...s]; }
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
  if (!tr) return (actTTData() ? `<div class="alink"><span>لم يُعثر على «${esc(r.t)}» في الجدول المدرسي العام — اربطه بالاسم المكتوب هناك:</span><select class="in" data-af="tt" data-id="${r.id}"><option value="">— اختر من الجدول —</option>${actTTData().teachers.map(x => x.n).sort((a, b) => a.localeCompare(b, 'ar')).map(n => `<option>${esc(n)}</option>`).join('')}</select></div>` : '<p class="hint">لم يُرفع الجدول المدرسي العام بعد — اختر المواعيد يدوياً:</p>') + actGridPick(r, k => ({ on: sel.has(k), ok: true, s: '' }));
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
function actWkTarget(r) { const w = A().cfg.wk || 'auto'; return w === 'auto' ? ((+r.n || 0) >= 10 ? 2 : 1) : +w; }
function actProgress() { const a = A(), rows = a.rows, st = actStats(), tt = actTTData();
  const ex = rows.reduce((s, r) => s + Math.min(+r.ex || 0, +r.n || 0), 0), exT = rows.reduce((s, r) => s + (+r.n || 0), 0);
  return [
    { k: 0, t: 'المصادر', ok: !!tt && actTeachers().length > 0 && actTA().length > 0, s: tt ? `${tt.teachers.length} معلماً في الجدول` : 'الجدول غير مرفوع' },
    { k: 1, t: 'الحسبة', ok: rows.length > 0 && rows.every(r => actCalc(r).tot), s: `${a.cfg.pct}% · ${a.cfg.weeks} أسبوعاً` },
    { k: 2, t: 'البرامج', ok: a.doms.some(d => d.p.length), s: `${a.doms.reduce((s, d) => s + d.p.length, 0)} برنامجاً` },
    { k: 3, t: 'الإسناد', ok: rows.length > 0 && !st.over && rows.every(r => r.t && r.prog), s: `${rows.length} سطراً${st.over ? ' · ' + st.over + ' تجاوز' : ''}` },
    { k: 4, t: 'المواعيد', ok: rows.length > 0 && !st.noSlot && !st.conf, s: `${rows.length - st.noSlot} من ${rows.length}` },
    { k: 6, t: 'التنفيذ', ok: exT > 0 && ex >= exT, s: exT ? Math.round(ex / exT * 100) + '%' : '—' }
  ]; }
function actFormsHub() {
  const F = [['actPlan', 'جدول الإسناد', 1], ['actGrid', 'جدول المواعيد'], ['actLetter', 'خطابات التكليف'], ['actSum', 'ملخص البرامج'], ['actExec', 'تقرير التنفيذ'], ['actTRep', 'نماذج تقارير المعلمين']];
  return `<div class="ahub">${F.map(([id, n, pri]) => `<button type="button" class="ahubb${pri ? ' pri' : ''}" data-act="qopen" data-form="${id}"><span>🖨</span><b>${n}</b></button>`).join('')}</div>`;
}
function actSrcCard(k) {
  const a = A(), s = a.src || {}, loc = !!(s[k] && (k === 'tt' ? s.tt.teachers : s[k]).length);
  const M = { tt: { t: 'الجدول الدراسي العام', d: 'جدول حصص المعلمين (صف لكل معلم، والأيام والحصص) — منه تُحسب حصص المواد وتُختار مواعيد النشاط', ic: '🗓', f: 'actSrcTT' },
    tch: { t: 'أسماء المعلمين', d: 'قائمة المعلمين لاختيار المعلم في كل سطر', ic: '👥', f: 'actSrcT' },
    ta: { t: 'إسناد المواد', d: 'المعلم والمادة والصف والشعب — منه تُقترح المواد ويُبنى الإسناد السريع', ic: '📚', f: 'actSrcTA' } }[k];
  const sys = k === 'tt' ? D().tt : k === 'tch' ? tchAll() : S.ta, sysN = k === 'tt' ? (sys ? sys.teachers.length : 0) : (sys || []).length;
  const cur = k === 'tt' ? actTTData() : k === 'tch' ? actTeachers() : actTA(), n = k === 'tt' ? (cur ? cur.teachers.length : 0) : cur.length;
  const info = !n ? '<em class="warnt">غير متوفر — ارفع الملف</em>' : k === 'tt' ? `${n} معلماً · ${cur.teachers.reduce((x, y) => x + Object.keys(y.c).length, 0)} حصة أسبوعياً` : k === 'tch' ? `${n} معلماً` : `${n} إسناداً لـ ${new Set(cur.map(x => personKey(x.t))).size} معلماً`;
  return `<article class="asrc${n ? ' ok' : ''}"><div class="asrch"><span class="asrci">${M.ic}</span><div><b>${M.t}</b><small>${M.d}</small></div><span class="asrcb">${n ? '✓' : '!'}</span></div>
    <div class="asrcm">${info}<small>${loc ? `مرفوع هنا: ${esc((s[k + 'Src'] || {}).name || '')} — ${esc((s[k + 'Src'] || {}).at || '')}` : n ? 'من بيانات النظام' : ''}</small></div>
    <div class="acts wrap"><label class="btn sm ${n ? '' : 'pri'}" for="asrc_${k}">⬆ ${n ? 'رفع ملف آخر' : 'رفع الملف'}</label><input type="file" id="asrc_${k}" data-asrc="${k}" accept=".pdf,.docx,.doc,.xlsx,.xls,.csv" hidden>
      ${n ? `<button type="button" class="btn sm" data-act="qopen" data-form="${M.f}">👁 معاينة وطباعة</button>` : ''}
      ${loc && sysN ? `<button type="button" class="btn sm ghost" data-aact="srcSys" data-k="${k}">↺ استخدام بيانات النظام (${sysN})</button>` : ''}</div>
    <small class="asrcf">PDF · Word · Excel</small></article>`;
}
function actLinkPanel() {
  const tt = actTTData(); if (!tt) return '';
  const miss = []; A().rows.forEach(r => { if (r.t && !actTT(r) && !miss.some(m => normName(m) === normName(r.t))) miss.push(r.t); });
  const linked = Object.entries(A().links || {});
  if (!miss.length && !linked.length) return '';
  const all = tt.teachers.map(x => x.n).sort((a, b) => a.localeCompare(b, 'ar'));
  return `<div class="alinks"><b>ربط الأسماء بالجدول</b><p class="hint">${miss.length ? `${miss.length} اسماً في خطة النشاط مكتوب بصيغة مختلفة عن الجدول — اختر المقابل مرة واحدة فيُطبَّق على كل أسطره.` : 'كل الأسماء مربوطة ✓'}</p>
    ${miss.map(n => { const g = actGuess(n); return `<div class="alnk"><span>${esc(n)}</span><select class="in" data-alink="${esc(n)}"><option value="">— اختر من الجدول —</option>${g.length ? `<optgroup label="الأقرب">${g.map(x => `<option>${esc(x)}</option>`).join('')}</optgroup>` : ''}<optgroup label="كل المعلمين">${all.map(x => `<option>${esc(x)}</option>`).join('')}</optgroup></select></div>`; }).join('')}
    ${linked.length ? `<details class="alnkd"><summary>الروابط المحفوظة (${linked.length})</summary>${linked.map(([k, v]) => `<div class="alnk"><span>${esc(k)} ← <b>${esc(v)}</b></span><button type="button" class="lnk" data-aact="unl" data-k="${esc(k)}">فك</button></div>`).join('')}</details>` : ''}</div>`;
}
function actBuilder() {
  const B = ACT_BUILD; if (!B) return '';
  const ta = actTA().filter(x => +x.g === +B.g), subs = []; ta.forEach(x => { if (x.sub && !subs.some(s => normName(s) === normName(x.sub))) subs.push(x.sub); });
  const tch = []; ta.filter(x => normName(x.sub) === normName(B.sub)).forEach(x => { if (!tch.some(y => personKey(y) === personKey(x.t))) tch.push(x.t); });
  const has = n => A().rows.some(r => +r.g === +B.g && personKey(r.t) === personKey(n) && normName(r.sub) === normName(B.sub));
  if (!B.pick || B.pickFor !== B.g + '|' + B.sub) { B.pick = tch.filter(n => !has(n)); B.pickFor = B.g + '|' + B.sub; }
  const d = actDom(B.dom), progs = d ? d.p.map(p => p.n) : [], sample = { g: B.g, t: tch[0] || '', sub: B.sub, n: 0 }, c = B.sub ? actCalc(sample) : null;
  return `<div class="abuild"><div class="abh"><b>⚡ بناء سريع من إسناد المواد</b><button type="button" class="x" data-aact="bX" title="إغلاق">×</button></div>
    <p class="hint">اختر الصف والمادة، ثم المجال والبرنامج — يُنشأ سطر لكل معلم يدرّس المادة، بعدد الحصص المسموح.</p>
    <div class="agrid">
      <label class="plf">الصف<select class="in" data-ab="g">${G.map(g => `<option value="${g}"${+B.g === g ? ' selected' : ''}>${GSHORT[g]} ثانوي</option>`).join('')}</select></label>
      <label class="plf w2">المادة<select class="in" data-ab="sub"><option value="">— اختر المادة —</option>${subs.map(s => `<option${normName(s) === normName(B.sub) ? ' selected' : ''}>${esc(s)}</option>`).join('')}</select></label>
      <label class="plf">المجال<select class="in" data-ab="dom"><option value="">— المجال —</option>${A().doms.map(x => `<option${normName(x.n) === normName(B.dom) ? ' selected' : ''}>${esc(x.n)}</option>`).join('')}</select></label>
      <label class="plf w2">البرنامج<select class="in" data-ab="prog"><option value="">— البرنامج —</option>${progs.map(x => `<option${normName(x) === normName(B.prog) ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <label class="plf">عدد الحصص<select class="in" data-ab="n"><option value="max"${B.n === 'max' ? ' selected' : ''}>الحد الأعلى${c && c.max ? ' (' + c.max + ')' : ''}</option>${[2, 3, 4, 5, 6, 8, 10, 12, 15, 18].map(v => `<option value="${v}"${+B.n === v ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
    </div>
    ${B.sub ? (tch.length ? `<div class="abt"><small>المعلمون الذين يدرّسون «${esc(B.sub)}»:</small>${tch.map(n => `<label class="abtc${has(n) ? ' has' : ''}"><input type="checkbox" data-abp="${esc(n)}"${B.pick.includes(n) ? ' checked' : ''}> ${esc(n)}${has(n) ? ' <i>مُسند</i>' : ''}</label>`).join('')}</div>` : '<p class="warnt">لا يوجد معلم لهذه المادة في الإسناد.</p>') : ''}
    <div class="acts wrap"><button type="button" class="btn pri" data-aact="bGo"${B.sub && B.prog && B.pick.length ? '' : ' disabled'}>إنشاء ${B.pick.length || ''} سطر</button></div></div>`;
}
function actExecRows() { const q = normName(ACT_EXQ); return A().rows.filter(r => !q || normName(r.t + ' ' + r.prog).includes(q)); }
function vActivity() {
  const a = A(), st = actStats(), conf = actConflicts(), ro = actRO(), pr = actProgress(), cur = Math.min(SUB.activity || 0, 6);
  const gchips = ['all', ...G].map(g => `<button type="button" class="${String(ACT_G) === String(g) ? 'on' : ''}" data-aact="g" data-v="${g}"${g !== 'all' ? ` style="--gc:var(--g${g})"` : ''}>${g === 'all' ? 'كل الصفوف' : GSHORT[g] + ' ثانوي'}</button>`).join('');
  const tl = `<datalist id="tlist">${actTeachers().map(n => `<option value="${esc(n)}"></option>`).join('')}</datalist>`;
  const hero = `<section class="card acth keep">
    <div class="aprog-strip">${pr.map((x, i) => `<button type="button" class="aps${x.ok ? ' ok' : ''}${cur === x.k ? ' cur' : ''}" data-sub="${x.k}"><i>${x.ok ? '✓' : i + 1}</i><b>${x.t}</b><small>${esc(x.s)}</small></button>`).join('')}</div>
    <div class="plstats ast"><div><b>${st.tch}</b><span>معلم</span></div><div><b>${st.progs}</b><span>برنامج</span></div><div><b>${st.per}</b><span>حصة نشاط</span></div><div class="${st.over || st.conf ? 'bad' : 'ok'}"><b>${st.over + st.conf || '✓'}</b><span>${st.over || st.conf ? (st.over ? 'تجاوز للحد' : '') + (st.over && st.conf ? ' · ' : '') + (st.conf ? 'تعارض مواعيد' : '') : 'ضمن الحد'}</span></div></div>
    ${actFormsHub()}
  </section>`;
  const srcStep = `<section class="card"><h2>المصادر</h2>
    <p class="hint">ثلاثة ملفات تُبنى عليها الخطة. إن كانت مرفوعة في النظام تُستخدم تلقائياً، ويمكنك رفع نسخة خاصة بالنشاط بأي صيغة (PDF · Word · Excel) دون التأثير على بقية النظام.</p>
    <div class="asrcs">${actSrcCard('tt')}${actSrcCard('tch')}${actSrcCard('ta')}</div>
    ${actLinkPanel()}
    <article class="asrc plan"><div class="asrch"><span class="asrci">⭐</span><div><b>خطة النشاط نفسها</b><small>رفع جدول إسناد برامج جاهز، أو تصدير الخطة للتعديل في Excel ثم إعادة رفعها</small></div></div>
      <div class="acts wrap"><label class="btn sm" for="actFile">⬆ رفع جدول إسناد البرامج</label><input type="file" id="actFile" accept=".docx,.doc,.pdf,.xlsx,.xls,.csv" hidden>
      <button type="button" class="btn sm" data-aact="xlsx">⬇ Excel قابل للتعديل</button><button type="button" class="btn sm ghost" data-aact="json">⬇ نسخة احتياطية</button>
      <label class="btn sm ghost" for="actJson">⬆ استرجاع نسخة</label><input type="file" id="actJson" accept=".json" hidden></div><small class="asrcf">PDF · Word · Excel</small></article>
  </section>`;
  const calcStep = `<section class="card"><h2>الحسبة</h2>
    <div class="aformula"><b>الحد الأعلى لحصص النشاط</b> = إجمالي حصص المادة في الفصل × <b>${a.cfg.pct}%</b><br><small>إجمالي حصص المادة = حصصها الأسبوعية للشعبة × ${a.cfg.weeks} أسبوعاً — تُحسب من الجدول الدراسي، واكتب الرقم الرسمي إن توفر لك.</small></div>
    <div class="agrid">
      <label class="plf">عدد أسابيع الفصل <input class="in" type="number" min="1" max="40" data-ac="weeks" value="${esc(a.cfg.weeks)}"></label>
      <label class="plf">النسبة القصوى (%) <input class="in" type="number" min="1" max="100" data-ac="pct" value="${esc(a.cfg.pct)}"></label>
      <label class="plf">مواعيد أسبوعية لكل برنامج <select class="in" data-ac="wk">${[['auto', 'تلقائي (موعدان إذا بلغت الحصص 10)'], ['1', 'موعد واحد'], ['2', 'موعدان'], ['3', 'ثلاثة']].map(([v, n]) => `<option value="${v}"${String(a.cfg.wk || 'auto') === v ? ' selected' : ''}>${n}</option>`).join('')}</select></label>
    </div>
    <div class="tw"><table class="et dense asubt"><tr><th>الصف</th><th>المادة</th><th>أسبوعياً للشعبة</th><th>إجمالي الفصل</th><th>الحد الأعلى</th></tr>
    ${(() => { const seen = new Map(); a.rows.forEach(r => { const k = actSubKey(r); if (!seen.has(k)) seen.set(k, r); }); return [...seen.values()].sort((x, y) => x.g - y.g || x.sub.localeCompare(y.sub, 'ar')).map(r => { const k = actSubKey(r), o = a.subj[k] || {}, c = actCalc(r), w = actWeekly(r);
      return `<tr><td><span class="gdot" style="--gc:var(--g${r.g})"></span>${GSHORT[r.g]}</td><td class="tnames">${esc(r.sub)}</td><td><input class="in" type="number" step="0.5" min="0" data-asw="${esc(k)}" value="${o.w || ''}" placeholder="${w.w && w.src === 'من الجدول' ? w.w : '—'}"></td><td><input class="in" type="number" min="0" data-ast="${esc(k)}" value="${o.tot || ''}" placeholder="${c.tot || '—'}"></td><td><b class="${c.max ? '' : 'mut'}">${c.max || '—'}</b></td></tr>`; }).join(''); })()}
    </table></div>
    <p class="hint">الخانة الفارغة تأخذ القيمة الرمادية المحسوبة تلقائياً.</p>
    <details class="pladv"><summary>التواقيع ونص التكليف</summary><div class="agrid">
      <label class="plf">رائد النشاط <input class="in" data-ac="lead" value="${esc(a.cfg.lead || '')}" list="tlist"></label>
      <label class="plf">وكيل المدرسة <input class="in" data-ac="vice" value="${esc(a.cfg.vice || '')}"></label>
      <label class="plf">مدير المدرسة <input class="in" data-ac="head" value="${esc(a.cfg.head || S.s.principal || '')}"></label>
      <label class="ck"><input type="checkbox" data-ac="sign"${a.cfg.sign !== false ? ' checked' : ''}> عمود توقيع المعلم في جدول الإسناد</label></div>
      <label class="plf">نص التكليف — «{sem}» تُستبدل تلقائياً باسم الفصل<textarea class="in" rows="4" data-ac="intro">${esc(a.cfg.intro || ACT_INTRO)}</textarea></label></details>
  </section>`;
  const catStep = `<section class="card"><h2>المجالات والبرامج</h2>
    <p class="hint">المجالات المعتمدة وبرامجها، وكل برنامج بلون يظهر في الجداول المطبوعة. تعديل اسم أو لون هنا يتحدث في كل الأسطر.</p>
    ${a.doms.map((d, di) => `<div class="adom" style="--dc:${d.c}"><div class="adomh"><input type="color" value="${d.c}" data-adc="${di}" aria-label="لون المجال"><input class="in" value="${esc(d.n)}" data-adn="${di}"><small>${a.rows.filter(r => normName(r.dom) === normName(d.n)).length} سطر</small><button type="button" class="x" data-aact="domDel" data-i="${di}" title="حذف المجال">×</button></div>
      <div class="aprogs">${d.p.map((p, pi) => `<span class="aprog" style="--pc:${p.c}"><input type="color" value="${p.c}" data-apc="${di}.${pi}" aria-label="لون البرنامج"><input class="in" value="${esc(p.n)}" data-apn="${di}.${pi}"><button type="button" class="x" data-aact="progDel" data-i="${di}" data-j="${pi}" title="حذف البرنامج">×</button></span>`).join('')}
      <button type="button" class="btn sm ghost" data-aact="progAdd" data-i="${di}">＋ برنامج</button></div></div>`).join('')}
    <div class="acts wrap"><button type="button" class="btn sm" data-aact="domAdd">＋ مجال جديد</button></div>
  </section>`;
  const rowsStep = `<section class="card"><h2>إسناد البرامج</h2>
    ${ACT_BUILD ? actBuilder() : `<div class="acts wrap abtop"><button type="button" class="btn pri" data-aact="bOpen">⚡ بناء سريع من إسناد المواد</button><button type="button" class="btn" data-aact="add">＋ سطر يدوي</button><button type="button" class="btn ghost" data-aact="rep">🔁 إحلال معلم في كل الخطة</button></div>`}
    <div class="amode seg agch">${gchips}</div>
    <input class="in plq" type="search" placeholder="🔎 ابحث بمعلم أو برنامج أو مادة…" value="${esc(ACT_Q)}" oninput="ACT_Q=this.value;clearTimeout(window._aq);window._aq=setTimeout(()=>{const p=this.selectionStart;render();const i=document.querySelector('.agch+.plq');if(i){i.focus();try{i.setSelectionRange(p,p)}catch(e){}}},250)">
    ${ACT_SWAP ? `<p class="hint swph">⇅ المس السطر الذي تريد تبديل معلمه مع «${esc((a.rows.find(r => r.id === ACT_SWAP) || {}).t || '')}» — أو <button type="button" class="lnk" data-aact="swapx">إلغاء</button></p>` : ''}
    <div class="agrades">${(ACT_G === 'all' ? G : [+ACT_G]).map(g => actGroupHtml(g, conf)).join('') || '<p class="mut">لا توجد أسطر بعد — ابدأ بـ «⚡ بناء سريع».</p>'}</div>
  </section>`;
  const tt = actTTData();
  const gridStep = `<section class="card"><h2>المواعيد</h2>
    <p class="hint">لكل برنامج ${a.cfg.wk && a.cfg.wk !== 'auto' ? a.cfg.wk + ' موعد أسبوعياً' : 'موعد أسبوعي (وموعدان إذا بلغت حصصه 10)'} من حصص المعلم الفعلية في شعب الصف. التوزيع التلقائي يملأ الناقص فقط، ويوزّع على أيام مختلفة دون تعارض — ويمكنك تعديل أي سطر يدوياً من «إسناد البرامج».</p>
    <div class="acts wrap"><button type="button" class="btn pri" data-aact="autoSl"${tt ? '' : ' disabled'}>⚡ توزيع المواعيد الناقصة تلقائياً</button><button type="button" class="btn ghost" data-aact="clrSl">✕ مسح كل المواعيد</button></div>
    <div class="amode seg agch">${gchips}</div>
    ${tt ? `<div class="tw agridw">${actGridHtml(ACT_G)}</div><div class="aleg2">${(() => { const ps = []; actRowsG(ACT_G).forEach(r => { if (r.prog && !ps.includes(r.prog)) ps.push(r.prog); }); return ps.map(p => `<span><i style="background:${actProgColor(p)}"></i>${esc(p)}</span>`).join(''); })()}</div>` : '<p class="warnt">ارفع «الجدول الدراسي العام» من خطوة المصادر ليظهر هذا الجدول.</p>'}
  </section>`;
  const ppl = actPeoplePanel();
  const peopleStep = `<section class="card"><h2>المعلمون وأحمالهم</h2>
    <p class="hint">كل معلم وما أُسند له من برامج وحصص ومواعيد. المس أي برنامج لفتح سطره.</p>
    <div class="plppl">${ppl.map(p => { const tot = p.l.reduce((s, r) => s + (+r.n || 0), 0); return `<div class="plp${p.l.length > 1 ? ' hv' : ''}"><div class="plpn"><b>${esc(p.n)}</b><span class="plload" title="عدد البرامج">${p.l.length}</span><small class="mut">${tot} حصة</small></div>
      <div class="plch">${p.l.map(r => `<button type="button" class="plchip" style="--pc:${actDomColor(r.dom)}" data-aact="goRow" data-id="${r.id}"><b>${esc(r.prog)}</b><span>${GSHORT[r.g]} · ${esc(r.sub)} · ${+r.n || 0} حصص${(r.slots || []).length ? ' · ' + esc(actSlotsTxt(r)) : ''}</span></button>`).join('')}</div></div>`; }).join('')}</div>
  </section>`;
  const exRows = actExecRows(), exDone = a.rows.reduce((s, r) => s + Math.min(+r.ex || 0, +r.n || 0), 0), exTot = a.rows.reduce((s, r) => s + (+r.n || 0), 0);
  const execStep = `<section class="card"><h2>التنفيذ والتقارير</h2>
    <div class="aexh"><div class="rdring sm" style="--p:${exTot ? Math.round(exDone / exTot * 100) : 0}"><b>${exTot ? Math.round(exDone / exTot * 100) : 0}%</b><small>${exDone} من ${exTot}</small></div>
      <p class="hint" style="margin:0">سجّل ما نُفّذ من حصص كل برنامج أولاً بأول. ومع نهاية البرنامج اطبع «تقرير التنفيذ» ونماذج تقارير المعلمين للتوقيع.</p></div>
    <input class="in plq" type="search" placeholder="🔎 ابحث بمعلم أو برنامج…" value="${esc(ACT_EXQ)}" oninput="ACT_EXQ=this.value;clearTimeout(window._aq2);window._aq2=setTimeout(()=>{const p=this.selectionStart;render();const i=document.querySelector('.aexl')?.previousElementSibling;if(i){i.focus();try{i.setSelectionRange(p,p)}catch(e){}}},250)">
    <div class="aexl">${exRows.map(r => { const n = +r.n || 0, e = Math.min(+r.ex || 0, n), pc = n ? Math.round(e / n * 100) : 0; return `<div class="aex${e >= n && n ? ' done' : e ? ' run' : ''}" style="--pc:${actProgColor(r.prog)}">
      <div class="aext"><b>${esc(r.t || '—')}</b><small>${esc(r.prog)} · ${GSHORT[r.g]}</small></div>
      <div class="aexbar"><span style="width:${pc}%"></span></div>
      <div class="astep sm"><button type="button" class="btn sm" data-aact="ex" data-d="-1" data-id="${r.id}">−</button><b>${e}<small>/${n}</small></b><button type="button" class="btn sm" data-aact="ex" data-d="1" data-id="${r.id}">+</button>${e < n ? `<button type="button" class="btn sm ghost" data-aact="exAll" data-id="${r.id}" title="اكتمل البرنامج">✓</button>` : ''}</div>
      <button type="button" class="btn sm ghost" data-act="qopen" data-form="actTRep" data-o='${esc(JSON.stringify({ rid: r.id }))}' title="نموذج تقرير المعلم">🖨</button></div>`; }).join('')}</div>
    <div class="acts wrap"><button type="button" class="btn pri" data-act="qopen" data-form="actExec">🖨 تقرير تنفيذ برامج النشاط</button><button type="button" class="btn" data-act="qopen" data-form="actTRep">🖨 نماذج تقارير المعلمين</button></div>
  </section>`;
  return `${tl}${ro ? '<div class="pend ro"><div class="pdt"><b>للاطلاع فقط</b><span>تعديل النشاط الطلابي لرائد النشاط ومسؤول الاختبارات.</span></div></div>' : ''}${hero}${srcStep}${calcStep}${catStep}${rowsStep}${gridStep}${peopleStep}${execStep}`;
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
  if (!actTTData()) return [title('جدول مواعيد حصص النشاط ضمن الجدول العام للمعلمين') + '<p class="txt">لم يُرفع الجدول المدرسي العام بعد.</p>'];
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
function actExecPages(o) {
  const a = A(), gs = o && o.g && o.g !== 'all' ? gSel(o) : G, rows = a.rows.filter(r => gs.includes(+r.g)), per = fitPer(rows.length, 22), out = [];
  const tot = rows.reduce((s, r) => s + (+r.n || 0), 0), done = rows.reduce((s, r) => s + Math.min(+r.ex || 0, +r.n || 0), 0);
  for (let s = 0; s < Math.max(1, rows.length); s += per) {
    const T1 = [[H('م', { w: '4%' }), H('اسم المعلم', { w: '17%' }), H('الصف', { w: '8%' }), H('المجال', { w: '13%' }), H('البرنامج'), H('المسند', { w: '7%' }), H('المنفّذ', { w: '7%' }), H('النسبة', { w: '7%' }), H('الحالة', { w: '10%' }), H('ملاحظات', { w: '12%' })]];
    rows.slice(s, s + per).forEach((r, i) => { const n = +r.n || 0, e = Math.min(+r.ex || 0, n), pc = n ? Math.round(e / n * 100) : 0, stt = e >= n && n ? 'مكتمل' : e ? 'جارٍ' : 'لم يبدأ';
      T1.push([s + i + 1, { v: `<b>${esc(r.t)}</b>`, al: 'right' }, GSHORT[r.g], { v: esc(r.dom), fs: '9pt' }, { v: `<b>${esc(r.prog)}</b>`, bg: actProgColor(r.prog) }, n, `<b>${e}</b>`, `${pc}%`, { v: stt, b: true, color: stt === 'مكتمل' ? '#16794e' : stt === 'جارٍ' ? '#b45309' : '#c00000' }, '']); });
    if (s + per >= rows.length) T1.push([{ v: '<b>الإجمالي</b>', cs: 5, bg: LCOL }, { v: `<b>${tot}</b>`, bg: LCOL }, { v: `<b>${done}</b>`, bg: LCOL }, { v: `<b>${tot ? Math.round(done / tot * 100) : 0}%</b>`, bg: LCOL }, { v: '', cs: 2, bg: LCOL }]);
    out.push(title('تقرير تنفيذ برامج النشاط الطلابي', actSemTxt()) + T(T1, { cls: 'dense' }) + (s + per >= rows.length ? sp(10) + actSigs() : ''));
  }
  return out;
}
function actTRepPages(o) {
  const a = A(), gs = o && o.g && o.g !== 'all' ? gSel(o) : G, list = o && o.rid ? a.rows.filter(r => r.id === o.rid) : a.rows.filter(r => gs.includes(+r.g));
  const box = (lbl, h) => T([[{ v: `<b>${lbl}</b>`, al: 'right', bg: LCOL }], [{ v: '&nbsp;', h }]]);
  return list.map(r => title('تقرير تنفيذ برنامج نشاط طلابي', actSemTxt()) +
    T([[L('اسم المعلم', { w: '18%' }), `<b>${esc(r.t)}</b>`, L('مادة التدريس', { w: '16%' }), esc(r.sub)], [L('الصف'), `${GSHORT[r.g]} ثانوي`, L('المجال'), esc(r.dom)], [L('البرنامج'), { v: `<b>${esc(r.prog)}</b>`, bg: actProgColor(r.prog), cs: 3 }], [L('عدد الحصص المسندة'), `${+r.n || 0} حصة`, L('المنفّذ منها'), `${Math.min(+r.ex || 0, +r.n || 0) || '.......'} حصة`], [L('مواعيد التنفيذ'), { v: esc(actSlotsTxt(r)) || '..............................', cs: 3 }], [L('عدد الطلاب المستفيدين'), '', L('الشعب'), '']], { cls: 'tall' }) + sp(6) +
    box('الأهداف التي تحققت', '70px') + sp(4) + box('الأنشطة والفعاليات المنفّذة', '90px') + sp(4) + box('الشواهد والمرفقات (صور، منتجات الطلاب، روابط)', '60px') + sp(4) + box('الصعوبات والتوصيات', '60px') + sp(8) +
    T([[L('توقيع المعلم', { w: '18%' }), '', L('التاريخ', { w: '14%' }), '']], { cls: 'tall' }) + sp(10) + sigs([['رائد النشاط', a.cfg.lead], ['مدير المدرسة', a.cfg.head || S.s.principal]]));
}
function actSrcTTPages(o) {
  const t = o && o.sys ? D().tt : actTTData(); if (!t) return [title('الجدول الدراسي العام') + '<p class="txt">لم يُرفع الجدول بعد.</p>'];
  const list = t.teachers.slice().sort((a, b) => a.n.localeCompare(b.n, 'ar')), per = fitPer(list.length, 27), out = [];
  for (let s = 0; s < list.length; s += per) {
    const head = `<tr><th rowspan="2" style="background:${HCOL};width:14%">اسم المعلم</th>${DAYN.map(d => `<th colspan="7" style="background:${HCOL}">${d}</th>`).join('')}<th rowspan="2" style="background:${HCOL};width:4%">النصاب</th></tr><tr>${DAYN.map(() => [1, 2, 3, 4, 5, 6, 7].map(p => `<th style="background:${LCOL};font-size:8pt">${p}</th>`).join('')).join('')}</tr>`;
    const body = list.slice(s, s + per).map(x => `<tr><td style="text-align:right;font-weight:bold;font-size:9pt">${esc(x.n)}</td>${DAYN.map((_, d) => [1, 2, 3, 4, 5, 6, 7].map(p => `<td style="font-size:8pt">${esc(x.c[d + '-' + p] || '')}</td>`).join('')).join('')}<td><b>${Object.keys(x.c).length}</b></td></tr>`).join('');
    out.push(title('الجدول الدراسي العام للمعلمين', actSemTxt()) + `<table class="t dense" dir="rtl" border="1" cellspacing="0" cellpadding="1" width="100%">${head}${body}</table>`);
  }
  return out;
}
function actSrcTPages(o) {
  const L0 = (o && o.sys ? tchAll() : actTeachers()).slice().sort((a, b) => a.localeCompare(b, 'ar')), half = Math.ceil(L0.length / 2), rows = [[H('م', { w: '6%' }), H('اسم المعلم', { w: '44%' }), H('م', { w: '6%' }), H('اسم المعلم', { w: '44%' })]];
  for (let i = 0; i < half; i++) rows.push([i + 1, { v: esc(L0[i]), al: 'right' }, L0[i + half] ? i + half + 1 : '', { v: esc(L0[i + half] || ''), al: 'right' }]);
  return [title('قائمة المعلمين', actSemTxt() + ` — ${L0.length} معلماً`) + T(rows)];
}
function actSrcTAPages(o) {
  const ta = o && o.sys ? (S.ta || []) : actTA(), out = [];
  G.forEach(g => { const l = ta.filter(x => +x.g === g).sort((a, b) => String(a.sub).localeCompare(String(b.sub), 'ar')); if (!l.length) return;
    const per = fitPer(l.length, 30);
    for (let s = 0; s < l.length; s += per) out.push(title('إسناد المواد', `${GNAME[g]} — ${actSemTxt()}`) + T([[H('م', { w: '6%' }), H('المادة', { w: '30%' }), H('المعلم'), H('الشعب', { w: '22%' })], ...l.slice(s, s + per).map((x, i) => [s + i + 1, { v: esc(x.sub), al: 'right' }, { v: `<b>${esc(x.t || '—')}</b>`, al: 'right' }, esc(String(x.sec || '').replace(/[-,]/g, '، '))])])); });
  return out.length ? out : [title('إسناد المواد') + '<p class="txt">لا يوجد إسناد بعد.</p>'];
}
FORMS.push(
  { id: 'actExec', grp: 'النشاط الطلابي', t: 'تقرير تنفيذ برامج النشاط', land: 1, opts: ['grade'], build: o => actExecPages(o) },
  { id: 'actTRep', grp: 'النشاط الطلابي', t: 'نموذج تقرير تنفيذ برنامج (لكل معلم)', opts: ['grade'], build: o => actTRepPages(o) },
  { id: 'actSrcTT', grp: 'النشاط الطلابي', t: 'الجدول الدراسي العام (مصدر النشاط)', land: 1, build: () => actSrcTTPages() },
  { id: 'actSrcT', grp: 'النشاط الطلابي', t: 'قائمة المعلمين (مصدر النشاط)', build: () => actSrcTPages() },
  { id: 'actSrcTA', grp: 'النشاط الطلابي', t: 'إسناد المواد (مصدر النشاط)', build: () => actSrcTAPages() },
  { id: 'srcTT', grp: 'الملفات الأساسية', t: 'الجدول المدرسي العام للمعلمين', land: 1, build: () => actSrcTTPages({ sys: 1 }) },
  { id: 'srcT', grp: 'الملفات الأساسية', t: 'قائمة المعلمين', build: () => actSrcTPages({ sys: 1 }) },
  { id: 'srcTA', grp: 'الملفات الأساسية', t: 'إسناد المواد حسب الصف', build: () => actSrcTAPages({ sys: 1 }) }
);
FD_IDS.push('actExec', 'actTRep');
/* ----- توزيع المواعيد تلقائياً ----- */
function actAutoSlots() {
  const a = A(), used = new Map(); let filled = 0, short = [];
  a.rows.forEach(r => (r.slots || []).forEach(k => used.set(personKey(r.t) + '@' + k, r.id)));
  a.rows.slice().sort((x, y) => actCells(x).length - actCells(y).length).forEach(r => {
    const need = actWkTarget(r) - (r.slots || []).length; if (need <= 0 || !r.t) return;
    const pk = personKey(r.t), mine = new Set((r.slots || []).map(k => k.split('-')[0]));
    const dayLoad = d => a.rows.filter(x => personKey(x.t) === pk).reduce((s, x) => s + (x.slots || []).filter(k => k.startsWith(d + '-')).length, 0);
    const cand = actCells(r).map(c => c.k).filter(k => !used.has(pk + '@' + k)).sort((k1, k2) => { const [d1, p1] = k1.split('-').map(Number), [d2, p2] = k2.split('-').map(Number);
      return (mine.has(String(d1)) - mine.has(String(d2))) || (dayLoad(d1) - dayLoad(d2)) || (Math.abs(p1 - 4) - Math.abs(p2 - 4)) || d1 - d2; });
    const pick = []; for (const k of cand) { if (pick.length >= need) break; const d = k.split('-')[0]; if (pick.some(x => x.startsWith(d + '-')) && cand.some(c => !c.startsWith(d + '-') && !pick.includes(c) && !pick.some(x => x.split('-')[0] === c.split('-')[0]))) continue; pick.push(k); }
    pick.forEach(k => used.set(pk + '@' + k, r.id)); r.slots = [...(r.slots || []), ...pick]; filled += pick.length; if (pick.length < need) short.push(r.t);
  });
  return { filled, short: [...new Set(short)] };
}

/* ----- استيراد: Word / PDF / Excel ----- */
function actFixTxt(s) { return toWestern(String(s || '').normalize('NFKC')).replace(/[‎‏‪-‮]/g, '').replace(/(\S)\s(ة|ي|ى)(?=\s|$)/g, '$1$2').replace(/\s+/g, ' ').trim(); }
const ACT_SUBW = ['رياضيات', 'الرياضيات', 'فيزياء', 'الفيزياء', 'كيمياء', 'الكيمياء', 'أحياء', 'الأحياء', 'عربي', 'اللغة', 'انجليزي', 'إنجليزي', 'التاريخ', 'التفسير', 'تقنية', 'التقنية', 'التفكير', 'كفايات', 'الكفايات', 'المهارات', 'مهارات', 'التربية', 'تربية', 'البحث', 'علم', 'علوم', 'الدراسات', 'الحديث', 'التوحيد', 'الفقه', 'الفنون', 'المعرفة', 'المواطنة', 'الجغرافيا', 'جغرافيا', 'لياقة', 'اللياقة', 'القرآن'];
function actGradeOf(sub, hdrG, t) { const m = /(\d)\s*$/.exec(sub) || /\s(\d)(?:-\d)?(\s|$)/.exec(sub); if (m && +m[1] >= 1 && +m[1] <= 3) return +m[1];
  if (typeof CURR !== 'undefined' && normName(sub).length > 4) { const z = s => normName(s).replace(/[\d\-]+/g, '').replace(/(^| )ال/g, '$1').trim(), w = z(sub); const hit = G.filter(g => [...CURR[g][1], ...CURR[g][2]].some(c => { const q = z(c); return q.length > 4 && (q === w || q.startsWith(w + ' ') || w.startsWith(q + ' ')); })); if (hit.length === 1) return hit[0]; }
  if (hdrG) return hdrG;
  const gsT = [...new Set(actTA().filter(x => sameTeacher([x.t])(t)).map(x => +x.g))]; return gsT.length === 1 ? gsT[0] : 1; }
function actSplitTS(pre, known) { const w = pre.split(' ').filter(Boolean); if (!w.length) return { t: '', sub: '' };
  for (let k = Math.min(4, w.length); k >= 2; k--) { const n = w.slice(0, k).join(' '); if (known(n)) return { t: n, sub: w.slice(k).join(' ') }; }
  const i = w.findIndex((x, j) => j >= 2 && ACT_SUBW.some(s => normName(x) === normName(s))); if (i >= 2) return { t: w.slice(0, i).join(' '), sub: w.slice(i).join(' ') };
  return w.length <= 3 ? { t: w.join(' '), sub: '' } : { t: w.slice(0, 2).join(' '), sub: w.slice(2).join(' ') }; }
function actParseLines(lines) {
  const doms = [...new Set([...A().doms.map(d => d.n), ...ACT_DOMS.map(d => d.n)])].sort((a, b) => b.length - a.length);
  const known = (() => { const ls = [...actTeachers(), ...(actTTData() ? actTTData().teachers.map(x => x.n) : []), ...A().rows.map(r => r.t)]; const a = new Set(ls.map(normName)); return n => a.has(normName(n)); })();
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
  v.t = [...A().rows.map(r => r.t), ...actTeachers(), ...(actTTData() ? actTTData().teachers.map(x => x.n) : [])]; v.sub = [...A().rows.map(r => r.sub), ...actTA().map(x => x.sub), ...(typeof CURR !== 'undefined' ? G.flatMap(g => [...CURR[g][1], ...CURR[g][2]]) : [])];
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

async function actSrcUpload(k, file) {
  const lbl = { tt: 'الجدول الدراسي', tch: 'أسماء المعلمين', ta: 'إسناد المواد' }[k];
  try {
    let data, msg;
    if (k === 'tt') { const list = await readTimetable(file); const tot = list.reduce((s, x) => s + Object.keys(x.c).length, 0); if (list.length < 3 || tot < 10) throw new Error('لم أتمكن من قراءة الجدول — تأكد أنه «الجدول العام للمعلمين» (صف لكل معلم، والأيام والحصص).'); data = { teachers: list, src: file.name, at: stamp() }; msg = `${list.length} معلماً و${tot} حصة أسبوعياً (مثل: ${list.slice(0, 2).map(x => x.n).join('، ')})`; }
    else if (k === 'tch') { const got = await readTeacherFile(file); const names = (got || []).map(x => typeof x === 'string' ? x : x.n || x.name || '').filter(Boolean); if (names.length < 3) throw new Error('لم يُعثر على قائمة أسماء في الملف.'); data = [...new Set(names)]; msg = `${data.length} معلماً (مثل: ${data.slice(0, 3).join('، ')})`; }
    else { const list = await readAssignFile(file); if (!list.length) throw new Error('لم يُعثر على جدول فيه أعمدة «المعلم» و«المادة».'); data = list; msg = `${list.length} إسناداً لـ ${new Set(list.map(x => personKey(x.t))).size} معلماً`; }
    if (!(await choiceBox(`قُرئ ملف ${lbl}: ${msg}.\nاعتماده مصدراً لخطة النشاط؟ (لا يغيّر بيانات بقية النظام)`, 'اعتماد', 'إلغاء'))) return;
    const A0 = A(); A0.src = A0.src || {}; A0.src[k] = data; A0.src[k + 'Src'] = { name: file.name, at: stamp() }; actSave(); toast(`اعتُمد ${lbl} ✓`);
  } catch (e) { console.error(e); toast(`${file.name}: ${e.message || e}`, true); }
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
  if (a === 'goRow') { ACT_OPEN = b.dataset.id; ACT_G = 'all'; ACT_Q = ''; if (typeof SUB !== 'undefined') SUB.activity = 3; render(); const el = document.querySelector(`.arow[data-aid="${ACT_OPEN}"]`); if (el) el.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
  if (a === 'swapx') { ACT_SWAP = null; return render(); }
  if (a === 'xlsx') return actXlsx();
  if (a === 'json') return download(new Blob([JSON.stringify(A(), null, 1)], { type: 'application/json' }), fname('النشاط الطلابي - نسخة') + '.json');
  if (actGuard()) return;
  const A0 = A();
  switch (a) {
    case 'n': r.n = Math.max(0, (+r.n || 0) + +b.dataset.d); return actSave();
    case 'ex': r.ex = Math.max(0, Math.min(+r.n || 0, (+r.ex || 0) + +b.dataset.d)); return actSave();
    case 'exAll': r.ex = +r.n || 0; return actSave();
    case 'srcSys': { const k = b.dataset.k; if (A0.src) { delete A0.src[k]; delete A0.src[k + 'Src']; } actSave(); return toast('تُستخدم الآن بيانات النظام'); }
    case 'unl': { delete (A0.links || {})[b.dataset.k]; return actSave(); }
    case 'bOpen': ACT_BUILD = { g: ACT_G === 'all' ? 1 : +ACT_G, sub: '', dom: '', prog: '', n: 'max' }; return render();
    case 'bX': ACT_BUILD = null; return render();
    case 'bGo': { const B = ACT_BUILD; if (!B || !B.sub || !B.prog || !B.pick.length) return; actEnsureProg(B.dom, B.prog); let n = 0;
      B.pick.forEach(tn => { const r2 = { id: actNewId(), g: +B.g, t: tn, sub: B.sub, dom: B.dom, prog: B.prog, n: 0, slots: [] }; r2.n = B.n === 'max' ? (actCalc(r2).max || 4) : +B.n; A0.rows.push(r2); n++; });
      ACT_BUILD = null; ACT_G = +B.g; actSave(); return toast(`أُنشئ ${n} سطراً لـ «${B.prog}» — حدّد مواعيدها من خطوة «المواعيد» أو بالتوزيع التلقائي`); }
    case 'autoSl': { const r3 = actAutoSlots(); actSave(); return toast(r3.filled ? `وُزّع ${r3.filled} موعداً تلقائياً${r3.short.length ? ` — لم تكفِ حصص: ${r3.short.slice(0, 4).join('، ')}${r3.short.length > 4 ? '…' : ''}` : ' ✓'}` : (r3.short.length ? `لا توجد حصص متاحة لـ: ${r3.short.slice(0, 4).join('، ')}` : 'كل البرامج لها مواعيدها ✓')); }
    case 'clrSl': if (await confirmBox('مسح مواعيد كل البرامج؟')) { A0.rows.forEach(x => x.slots = []); actSave(); } return;
    case 'unlink': delete r.tt; r.slots = []; return actSave();
    case 'nmax': r.n = actCalc(r).max; return actSave();
    case 'slot': { const k = b.dataset.k, s = new Set(r.slots || []); s.has(k) ? s.delete(k) : s.add(k); r.slots = [...s]; return actSave(); }
    case 'dup': { const c = Object.assign(clone(r), { id: actNewId(), t: '', slots: [] }); A0.rows.splice(A0.rows.indexOf(r) + 1, 0, c); ACT_OPEN = c.id; return actSave(); }
    case 'swap': ACT_SWAP = ACT_SWAP === r.id ? null : r.id; ACT_OPEN = null; return render();
    case 'up': case 'dn': { const i = A0.rows.indexOf(r), j = a === 'up' ? i - 1 : i + 1; if (j < 0 || j >= A0.rows.length) return; [A0.rows[i], A0.rows[j]] = [A0.rows[j], A0.rows[i]]; return actSave(); }
    case 'del': if (await confirmBox(`حذف إسناد «${r.prog}» للمعلم ${r.t || '—'}؟`)) { A0.rows.splice(A0.rows.indexOf(r), 1); ACT_OPEN = null; actSave(); } return;
    case 'add': { const g = ACT_G === 'all' ? 1 : +ACT_G, c = { id: actNewId(), g, t: '', sub: '', dom: '', prog: '', n: 4, slots: [] }; A0.rows.push(c); ACT_OPEN = c.id; actSave(); const el = document.querySelector(`.arow[data-aid="${c.id}"]`); if (el) el.scrollIntoView({ block: 'center' }); return; }
    case 'addSub': { const last = [...A0.rows].reverse().find(x => +x.g === +b.dataset.g && normName(x.sub) === normName(b.dataset.sub)); const c = { id: actNewId(), g: +b.dataset.g, t: '', sub: b.dataset.sub, dom: last ? last.dom : '', prog: last ? last.prog : '', n: last ? last.n : 4, slots: [] }; A0.rows.splice(last ? A0.rows.indexOf(last) + 1 : A0.rows.length, 0, c); ACT_OPEN = c.id; return actSave(); }
    case 'rep': { const names = [...new Set(A0.rows.map(x => x.t).filter(Boolean))].sort((x, y) => x.localeCompare(y, 'ar')); const from = await actPrompt('إحلال معلم في كل الخطة', 'المعلم الحالي', names), to = from && await actPrompt(`البديل عن «${from}»`, 'المعلم البديل', actTeachers()); if (!from || !to) return;
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
    if (v === '__new') { v = await actPrompt(f === 't' ? 'اسم المعلم' : f === 'sub' ? 'مادة التدريس' : f === 'dom' ? 'اسم المجال' : 'اسم البرنامج', 'الاسم', f === 't' ? actTeachers() : []); if (!v) return render(); }
    if (f === 'g') r.g = +v; else if (f === 'tt') { if (v) r.tt = v; else delete r.tt; } else r[f] = v;
    if (f === 't') delete r.tt;
    if (f === 't') r.slots = (r.slots || []).filter(k => actCells(r).some(x => x.k === k));
    if (f === 'dom') { const d = actDom(v); if (d && r.prog && !d.p.some(p => normName(p.n) === normName(r.prog))) r.prog = ''; }
    if (f === 'prog' && r.dom) actEnsureProg(r.dom, v);
    if (f === 'dom' && v && !actDom(v)) A().doms.push({ n: v, c: '#475569', p: [] });
    return actSave(); }
  if (el.dataset.asrc) { const f = el.files[0], k = el.dataset.asrc; el.value = ''; if (!f || actGuard()) return; return actSrcUpload(k, f); }
  if (el.dataset.alink) { if (actGuard()) return render(); const A0 = A(); A0.links = A0.links || {}; if (el.value) A0.links[normName(el.dataset.alink)] = el.value; A0.rows.forEach(r => { if (normName(r.t) === normName(el.dataset.alink)) r.slots = (r.slots || []).filter(k => actCells(r).some(x => x.k === k)); }); return actSave(); }
  if (el.dataset.ab) { const B = ACT_BUILD; if (!B) return; B[el.dataset.ab] = el.dataset.ab === 'g' ? +el.value : el.value; if (el.dataset.ab === 'g') { B.sub = ''; } if (el.dataset.ab === 'dom') B.prog = ''; return render(); }
  if (el.dataset.abp != null) { const B = ACT_BUILD; if (!B) return; const n = el.dataset.abp; B.pick = el.checked ? [...new Set([...B.pick, n])] : B.pick.filter(x => x !== n); return render(); }
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
