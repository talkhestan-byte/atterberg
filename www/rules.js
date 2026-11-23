/* Standards check for the Atterberg test.
   Every number below was read from the uploaded documents; `loc` gives chapter/clause/table and the PRINTED page number. */
(function (root) {
  const SRC = {
    old: 'نشریه ۱۰۱ ـ مشخصات فنی عمومی راه (تجدیدنظر دوم، ۱۳۹۲)',
    new: 'ضابطه ۸۰۰-۱۰۱ ـ مشخصات فنی عمومی راه (تجدیدنظر سوم، ۱۴۰۴)',
    n55: 'نشریه ۵۵ ـ مشخصات فنی عمومی کارهای ساختمانی',
    i302: 'استاندارد ملی ایران ۳۰۲ (تجدیدنظر چهارم، ۱۳۹۹) ـ سنگدانه‌های بتن'
  };
  const VERSIONS = {
    old: 'قدیم: نشریه ۱۰۱ (ت.۲، ۱۳۹۲)',
    new: 'جدید: ضابطه ۸۰۰-۱۰۱ (ت.۳، ۱۴۰۴)',
    n55: 'نشریه ۵۵ (کارهای ساختمانی)'
  };
  const USES = { earth: 'عملیات خاکی / راه‌سازی', concrete: 'عملیات بتنی' };

  /* ---------- earthworks / road rules ---------- */
  const E = {
    old: {
      embankment: { name: 'خاکریز (مصالح مناسب)', loc: 'فصل ۲، بند ۷-۲ (مصالح مناسب)، ص ۲۰', piMax: 50, piNote: 'خاک‌های مارنی و رسی با دامنه خمیری بیش از ۵۰٪ نباید مصرف شوند.', expansive: 'فصل ۲، جدول ۱-۲ (خاک‌های منبسط‌شونده)، ص ۲۶' },
      subbase: { name: 'زیراساس', loc: 'فصل ۱۲، بند ۲-۱ (مصالح زیراساس)، ص ۳۲۷', llMax: 25, piMax: 6 },
      base: { name: 'اساس', loc: 'فصل ۱۳، بند ۲-۱ (مصالح اساس)، ص ۳۴۸', llMax: 25, piMax: 4 },
      macadam: { name: 'ماسه پرکننده اساس ماکادامی', loc: 'فصل ۱۳، مصالح ریزدانه اساس ماکادامی، ص ۳۵۴', llMax: 30, piMax: 6 },
      gravel: { name: 'رویه شنی', loc: 'فصل ۲۱، جدول ۲-۲۱، ص ۵۷۸', llMax: 25, piMax: 6, piLow: 4, ext: { ll: 35, pi: 9 }, note: 'حد دامنه خمیری بین ۴ تا ۶ است و مقدار دقیق در مشخصات خصوصی پروژه تعیین می‌شود. اگر رویه شنی مدت زیادی بدون رویه آسفالتی بماند، LL تا ۳۵ و PI تا ۹ قابل افزایش است.' },
      shoulder: { name: 'شانه راه', loc: 'فصل ۲۱، جدول ۲-۲۱ (توضیحات)، ص ۵۷۸', llMax: 25, piMax: 6, note: 'دامنه خمیری مصالح شانه‌ها ۰ تا ۶٪.' },
      asph_base: { name: 'آسفالت ـ اساس قیری (ماسه)', loc: 'فصل ۲۰، جدول ۵-۲۰ (مصالح ریزدانه)، ص ۵۰۸', piMax: 4 },
      asph_wear: { name: 'آسفالت ـ آستر / رویه (ماسه)', loc: 'فصل ۲۰، جدول ۵-۲۰ (مصالح ریزدانه)، ص ۵۰۸', nonPlastic: true }
    },
    new: {
      embankment: { name: 'خاکریز (مصالح مناسب)', loc: 'فصل ۲، مصالح مناسب، ص ۲۰', piMax: 50, piNote: 'خاک‌های مارنی و رسی با دامنه خمیری بیش از ۵۰٪ نباید مصرف شوند.', expansive: 'فصل ۲، جدول ۱-۲ (خاک‌های منبسط‌شونده)، ص ۲۵' },
      subbase: { name: 'زیراساس', loc: 'فصل ۱۲، جدول ۳-۱۲ (ویژگی‌های مصالح دانه‌ای زیراساس)، ص ۲۲۲',
        types: { 1: { llMax: 25, piMax: 6 }, 2: { llMax: 25, piMax: 6 }, 3: { llMax: 30, piMax: 8 } } },
      base: { name: 'اساس', loc: 'فصل ۱۳، جدول ۳-۱۳ (ویژگی‌های مصالح دانه‌ای لایه اساس)، ص ۲۵۶',
        types: { 1: { llMax: 25, piMax: 4 }, 2: { llMax: 25, piMax: 6 }, 3: { llMax: 25, piMax: 6 } } },
      macadam: { name: 'ماسه پرکننده اساس ماکادامی', loc: 'فصل ۱۳، مصالح ریزدانه اساس ماکادامی، ص ۲۷۰', llMax: 30, piMax: 6 },
      gravel: { name: 'رویه شنی', loc: 'فصل ۲۱، جدول ۲-۲۱، ص ۶۳۸', llMax: 25, piMax: 6, piLow: 4, ext: { ll: 35, pi: 9 }, note: 'حد دامنه خمیری بین ۴ تا ۶ است و مقدار دقیق در مشخصات خصوصی پروژه تعیین می‌شود. اگر رویه شنی مدت زیادی بدون رویه آسفالتی بماند، LL تا ۳۵ و PI تا ۹ قابل افزایش است.' },
      shoulder: { name: 'شانه راه', loc: 'فصل ۲۱، جدول ۲-۲۱ (توضیحات)، ص ۶۳۸', llMax: 25, piMax: 6, note: 'دامنه خمیری مصالح شانه‌ها ۰ تا ۶٪.' },
      asph: { name: 'آسفالت داغ (ماسه)', loc: 'فصل ۲۰، جدول ۲-۲۰ (مصالح ریزدانه)، ص ۵۳۵', piMax: 4 }
    },
    n55: {
      site_subbase: { name: 'محوطه‌سازی ـ قشر زیراساس خیابان', loc: 'فصل ۲۳، بند ۱-۴-۱۲-۲۳ (قشر زیراساس)، ص ۶۵۸ و ۶۶۴', llMax: 25, piMax: 6 },
      site_base: { name: 'محوطه‌سازی ـ قشر اساس خیابان', loc: 'فصل ۲۳، بند ۲-۴-۱۲-۲۳ (قشر اساس)، ص ۶۶۵ و ۶۷۰', llMax: 25, piMax: 6 },
      site_asph_sand: { name: 'محوطه‌سازی ـ ماسه آسفالت', loc: 'فصل ۲۳، بند ۳-۴-۱۲-۲۳ (آسفالت)، ص ۶۸۴ و ۶۸۷', piMax: 6 },
      site_filler: { name: 'محوطه‌سازی ـ فیلر آسفالت', loc: 'فصل ۲۳، بند ۳-۴-۱۲-۲۳ (آسفالت)، ص ۶۸۵', piMax: 4 }
    }
  };
  const SUBS = { concrete: { fine: 'ماسه (سنگدانه ریز) بتن' } };
  function subsFor(use, ver) {
    if (use === 'concrete') return SUBS.concrete;
    const o = {}; Object.keys(E[ver]).forEach(k => o[k] = E[ver][k].name); return o;
  }
  const hasTypes = (use, ver, sub) => use === 'earth' && !!(E[ver] && E[ver][sub] && E[ver][sub].types);

  const f1 = v => (isFinite(v) ? (Math.round(v * 10) / 10).toString() : '—');
  const ST = { ok: 'ok', fail: 'fail', warn: 'warn', info: 'info', na: 'na' };
  const chk = (title, value, limit, status, ref, note) => ({ title, value, limit, status, ref, note: note || '' });

  function evalEarth(c) {
    const out = [];
    const rule = (E[c.version] || {})[c.sub];
    if (!rule) return out;
    const src = SRC[c.version], ref = src + ' ـ ' + rule.loc;
    const r = rule.types ? Object.assign({}, rule, rule.types[c.mtype || 1]) : rule;
    const typeTxt = rule.types ? ' (مصالح نوع ' + (c.mtype || 1) + ')' : '';
    if (isFinite(r.llMax)) {
      const ok = isFinite(c.LL) ? c.LL <= r.llMax : null;
      out.push(chk('حد روانی (LL)' + typeTxt, f1(c.LL), 'حداکثر ' + r.llMax, ok === null ? 'na' : ok ? 'ok' : (r.ext && c.LL <= r.ext.ll ? 'warn' : 'fail'), ref,
        ok === false && r.ext && c.LL <= r.ext.ll ? 'فقط در صورتی مجاز است که رویه شنی مدت زیادی بدون رویه آسفالتی بماند (تا ' + r.ext.ll + '٪).' : ''));
    }
    if (r.nonPlastic) {
      const ok = isFinite(c.PI) ? c.PI === 0 : null;
      out.push(chk('شاخص خمیری (PI)', c.PI === 0 ? 'NP' : f1(c.PI), 'غیرخمیری (NP)', ok === null ? 'na' : ok ? 'ok' : 'fail', ref));
    } else if (isFinite(r.piMax)) {
      let st = 'na';
      let note = rule.piNote || rule.note || '';
      if (isFinite(c.PI)) {
        if (c.PI <= r.piMax) st = 'ok'; else st = 'fail';
        if (r.piLow !== undefined && c.PI > r.piLow && c.PI <= r.piMax) { st = 'warn'; note = 'PI بین ' + r.piLow + ' و ' + r.piMax + ' است؛ حد دقیق را از مشخصات خصوصی پروژه کنترل کنید. ' + (rule.note || ''); }
        if (st === 'fail' && r.ext && c.PI <= r.ext.pi) { st = 'warn'; note = 'فقط در صورتی مجاز است که رویه شنی مدت زیادی بدون رویه آسفالتی بماند (تا ' + r.ext.pi + '٪).'; }
      }
      out.push(chk(rule.piNote ? 'دامنه خمیری (PI) خاک مارنی/رسی' : 'شاخص خمیری (PI)' + typeTxt, f1(c.PI), 'حداکثر ' + r.piMax, st, ref, note));
    }
    if (rule.expansive && isFinite(c.LL) && isFinite(c.PI)) {
      const hi = c.PI > 35 && c.LL > 60;
      out.push(chk('احتمال خاک منبسط‌شونده', 'LL=' + f1(c.LL) + ' ، PI=' + f1(c.PI), 'تورم زیاد: PI>35 و LL>60 و مکش خاک>4',
        hi ? 'warn' : 'info', src + ' ـ ' + rule.expansive,
        hi ? 'بر اساس حدود اتربرگ، خاک در محدوده تورم زیاد قرار می‌گیرد؛ ضابطه ملاک را مکش خاک نیز می‌داند و باید آن را جداگانه اندازه گرفت.' : 'حدود اتربرگ در محدوده تورم زیاد جدول نیست (ملاک کامل شامل مکش خاک هم هست).'));
    }
    return out;
  }

  function evalConcrete(c) {
    const out = [];
    const R302 = SRC.i302;
    // 1) clay / non-clay judgement from PI of fines passing 75 µm
    let nonClay = null;
    if (isFinite(c.PI)) nonClay = c.PI < 2;
    out.push(chk('رسی بودن ریزدانه‌ی عبوری از الک ۷۵ میکرون', c.PI === 0 ? 'NP' : f1(c.PI), 'PI کمتر از ۲ ← غیررسی',
      nonClay === null ? 'na' : nonClay ? 'ok' : 'warn', R302 + ' ـ بند ۲-۴ (دانه‌بندی)، یادآوری ۱، ص ۸',
      nonClay === false ? 'PI بیشتر یا مساوی ۲ است؛ ریزدانه را نمی‌توان غیررسی دانست. حدود افزایش‌یافته‌ی مواد ریزتر از ۷۵ میکرون قابل استفاده نیست و ارزیابی تکمیلی (مانند آزمون متیلن‌بلو) لازم است.' : 'آزمایش حد روانی باید روی ذرات ریزتر از الک ۷۵ میکرون (ASTM D4318) انجام شده باشد.'));
    // 2) fines passing 75 µm limit
    const scc = c.conType === 'scc', abr = c.abrasion === 'yes', crushed = c.aggType === 'crushed';
    let lim = scc ? 5.0 : 3.0, why = scc ? 'ردیف الک ۷۵ میکرون در جدول ۱ (ویژه بتن خودتراکم ۲ تا ۵٪)' : 'ردیف الک ۷۵ میکرون در جدول ۱ (ردهٔ ۱ و ۲: تا ۳٪)';
    if (!abr) { lim = scc ? 7.0 : 5.0; why = 'پاورقی «الف» جدول ۱ (بتن بدون سایش)'; }
    if (crushed && nonClay === true) {
      lim = abr ? (scc ? 9.0 : 5.0) : (scc ? 16.0 : 7.0);
      why = 'پاورقی «الف» جدول ۱ (ماسه شکسته با ریزدانه‌ی عاری از رس)';
    }
    if (isFinite(c.P75)) {
      const ok = c.P75 <= lim;
      out.push(chk('مواد ریزتر از الک ۷۵ میکرون (ASTM C117)', f1(c.P75) + '٪', 'حداکثر ' + lim + '٪', ok ? 'ok' : 'fail', R302 + ' ـ جدول ۱، ص ۷', why));
    } else {
      out.push(chk('مواد ریزتر از الک ۷۵ میکرون (ASTM C117)', '—', 'حداکثر ' + lim + '٪', 'na', R302 + ' ـ جدول ۱، ص ۷', 'درصد عبوری از الک ۷۵ میکرون را در مشخصات عمومی وارد کنید. ' + why));
    }
    return out;
  }

  function evaluate(c) {
    if (c.use === 'concrete') return evalConcrete(c);
    const out = [];
    ['old', 'new', 'n55'].forEach(version => {
      const groups = E[version] || {};
      Object.keys(groups).forEach(sub => {
        const rule = groups[sub];
        if (rule.types) {
          Object.keys(rule.types).forEach(mtype => {
            const rows = evalEarth(Object.assign({}, c, { version, sub, mtype }));
            rows.forEach(row => { row.title += ' — نوع ' + mtype; out.push(row); });
          });
        } else out.push(...evalEarth(Object.assign({}, c, { version, sub })));
      });
    });
    return out.map(row => { if (c.material) row.title = c.material + ' | ' + row.title; return row; });
  }
  const api = { SRC, USES, VERSIONS, subsFor, hasTypes, evaluate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Rules = api;
})(typeof window !== 'undefined' ? window : globalThis);
