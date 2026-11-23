/* Standards check for the Atterberg test.
   EDIT THIS FILE to match your printed copies of the documents.
   Every rule carries `verify:true` until it has been checked against the book. */
(function (root) {
  const REF = {
    aba: 'آیین‌نامه بتن ایران (آبا) – مصالح مصرفی، سنگدانه‌ها',
    n101: 'نشریه ۱۰۱ سازمان برنامه و بودجه – مشخصات فنی عمومی'
  };
  const USES = { earth: 'عملیات خاکی', concrete: 'عملیات بتنی' };
  const VERSIONS = { old: 'نسخه قدیم', new: 'نسخه جدید' };
  const SUBS = {
    earth: {
      embankment: 'خاکریز عمومی',
      subbase: 'زیراساس',
      base: 'اساس'
    },
    concrete: {
      fine: 'ماسه (سنگدانه ریز) بتن'
    }
  };

  // Numeric limits. Same for both versions until the differences are entered.
  const LIMITS = {
    earth: {
      subbase: { old: { piMax: 6 }, new: { piMax: 6 } },
      base: { old: { piMax: 6 }, new: { piMax: 6 } }
    },
    concrete: {
      fine: { old: { seMin: 75 }, new: { seMin: 75 } }
    }
  };

  const fmt = v => (isFinite(v) ? (Math.round(v * 10) / 10).toString() : '—');

  function evaluate(c) {
    // c: {use, version, sub, LL, PL, PI, SE, projLL, projPI}
    const out = [];
    const verNote = 'تفاوت جدول بین نسخه قدیم و جدید در برنامه ثبت نشده؛ با نسخه چاپی تطبیق دهید.';
    const lim = ((LIMITS[c.use] || {})[c.sub] || {})[c.version] || {};

    if (c.use === 'earth') {
      if (lim.piMax !== undefined) {
        const ok = isFinite(c.PI) ? c.PI <= lim.piMax : null;
        out.push({
          title: 'شاخص خمیری (PI)', value: fmt(c.PI), limit: 'حداکثر ' + lim.piMax,
          status: ok === null ? 'na' : ok ? 'ok' : 'fail',
          ref: REF.n101, note: verNote, verify: true
        });
      } else {
        // no built-in numeric limit: use project limits if given
        const hasProj = isFinite(c.projLL) || isFinite(c.projPI);
        if (!hasProj) {
          out.push({
            title: 'خاکریز عمومی', value: 'LL=' + fmt(c.LL) + ' ، PI=' + fmt(c.PI), limit: '—',
            status: 'info', ref: REF.n101,
            note: 'حد عددی تأییدشده‌ای برای این مورد در برنامه ثبت نشده. حدود مجاز مشخصات خصوصی پروژه را در کادرهای «حد مجاز پروژه» وارد کنید.',
            verify: true
          });
        } else {
          if (isFinite(c.projLL)) out.push({ title: 'حد روانی (LL)', value: fmt(c.LL), limit: 'حداکثر ' + c.projLL,
            status: isFinite(c.LL) ? (c.LL <= c.projLL ? 'ok' : 'fail') : 'na', ref: 'مشخصات خصوصی پروژه', note: '' });
          if (isFinite(c.projPI)) out.push({ title: 'شاخص خمیری (PI)', value: fmt(c.PI), limit: 'حداکثر ' + c.projPI,
            status: isFinite(c.PI) ? (c.PI <= c.projPI ? 'ok' : 'fail') : 'na', ref: 'مشخصات خصوصی پروژه', note: '' });
        }
      }
    }

    if (c.use === 'concrete') {
      // Atterberg itself: no direct numeric limit found; sand equivalent is the controlling requirement
      out.push({
        title: 'حدود اتربرگ ریزدانه', value: 'LL=' + fmt(c.LL) + ' ، PI=' + fmt(c.PI), limit: 'ضابطه عددی مستقیم ثبت نشده',
        status: isFinite(c.PI) && c.PI > 0 ? 'warn' : 'info', ref: REF.aba + ' / ' + REF.n101,
        note: 'برای ماسه بتن، کنترل ریزدانه‌ی رسی با آزمایش ارزش ماسه‌ای انجام می‌شود (ردیف بعد). ریزدانه‌ی خمیری (PI>0) نامطلوب است.',
        verify: true
      });
      const ok = isFinite(c.SE) ? c.SE >= lim.seMin : null;
      out.push({
        title: 'ارزش ماسه‌ای (SE)', value: fmt(c.SE), limit: 'حداقل ' + lim.seMin + '٪',
        status: ok === null ? 'na' : ok ? 'ok' : 'fail',
        ref: REF.n101 + ' / ' + REF.aba, note: verNote, verify: true
      });
    }
    return out;
  }

  const api = { REF, USES, VERSIONS, SUBS, LIMITS, evaluate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.Rules = api;
})(typeof window !== 'undefined' ? window : globalThis);
