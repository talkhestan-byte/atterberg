/* Pure calculation helpers (no DOM) */
(function (root) {
  const FA = '۰۱۲۳۴۵۶۷۸۹', AR = '٠١٢٣٤٥٦٧٨٩';
  function toNum(v) {
    if (v === null || v === undefined) return NaN;
    let s = String(v)
      .replace(/[۰-۹]/g, d => FA.indexOf(d))
      .replace(/[٠-٩]/g, d => AR.indexOf(d))
      .replace(/[٫,،]/g, '.')
      .trim();
    if (s === '') return NaN;
    return Number(s);
  }
  // water content (%) from can, can+wet, can+dry
  function moisture(can, wet, dry) {
    if ([can, wet, dry].some(isNaN)) return NaN;
    const dryMass = dry - can, water = wet - dry;
    if (!(dryMass > 0) || water < 0) return NaN;
    return (water / dryMass) * 100;
  }
  // linear regression of w against log10(N)
  function fitFlow(points) {
    const p = points.filter(q => q.n > 0 && isFinite(q.w));
    if (p.length < 2) return null;
    const xs = p.map(q => Math.log10(q.n)), ys = p.map(q => q.w);
    const n = p.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); syy += (ys[i] - my) ** 2; }
    if (sxx === 0) return null;
    const m = sxy / sxx, b = my - m * mx;
    const r2 = syy === 0 ? 1 : (sxy * sxy) / (sxx * syy);
    return { m, b, r2, n };
  }
  const wAt = (fit, N) => fit.m * Math.log10(N) + fit.b;
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const root_ = { toNum, moisture, fitFlow, wAt, mean };
  if (typeof module !== 'undefined' && module.exports) module.exports = root_;
  else root.Calc = root_;
})(typeof window !== 'undefined' ? window : globalThis);
