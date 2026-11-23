(function () {
  const $ = id => document.getElementById(id);
  const { toNum, moisture, fitFlow, wAt, mean } = Calc;
  const R = Rules;
  const f1 = v => (isFinite(v) ? (Math.round(v * 10) / 10).toFixed(1) : '');
  const f2 = v => (isFinite(v) ? (Math.round(v * 100) / 100).toFixed(2) : '');

  /* ---------- state ---------- */
  const ll = [{}, {}, {}];
  const pl = [{}, {}];
  const LL_MIN = 3, LL_MAX = 5, PL_MIN = 2, PL_MAX = 6;
  let LL = NaN, PL = NaN;

  /* ---------- selects ---------- */
  function fillSel(el, obj) { el.innerHTML = Object.keys(obj).map(k => `<option value="${k}">${obj[k]}</option>`).join(''); }
  fillSel($('use'), R.USES); fillSel($('version'), R.VERSIONS);
  function refreshSub() {
    fillSel($('sub'), R.SUBS[$('use').value]);
    const c = $('use').value === 'concrete';
    $('extraConcrete').style.display = c ? '' : 'none';
    updateEarthExtra();
  }
  function updateEarthExtra() {
    const lim = (((R.LIMITS[$('use').value] || {})[$('sub').value]) || {})[$('version').value] || {};
    const show = $('use').value === 'earth' && lim.piMax === undefined && lim.llMax === undefined;
    $('extraEarth').style.display = show ? 'grid' : 'none';
  }
  $('use').onchange = () => { refreshSub(); recalc(); };
  $('sub').onchange = () => { updateEarthExtra(); recalc(); };
  $('version').onchange = () => { updateEarthExtra(); recalc(); };
  ['se', 'projLL', 'projPI'].forEach(i => $(i).addEventListener('input', recalc));
  refreshSub();

  /* ---------- tables ---------- */
  function cell(arr, i, key, ph) {
    const td = document.createElement('td');
    const inp = document.createElement('input');
    inp.type = 'text'; inp.inputMode = 'decimal'; inp.placeholder = ph || '';
    inp.value = arr[i][key] || '';
    inp.addEventListener('input', () => { arr[i][key] = inp.value; recalc(); });
    td.appendChild(inp); return td;
  }
  function renderLL() {
    const b = $('llBody'); b.innerHTML = '';
    ll.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td>`;
      tr.appendChild(cell(ll, i, 'n')); tr.appendChild(cell(ll, i, 'can'));
      tr.appendChild(cell(ll, i, 'wet')); tr.appendChild(cell(ll, i, 'dry'));
      const t = document.createElement('td'); t.className = 'res'; t.id = 'llw' + i; tr.appendChild(t);
      b.appendChild(tr);
    });
    $('llAdd').disabled = ll.length >= LL_MAX; $('llDel').disabled = ll.length <= LL_MIN;
  }
  function renderPL() {
    const b = $('plBody'); b.innerHTML = '';
    pl.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td>`;
      tr.appendChild(cell(pl, i, 'can')); tr.appendChild(cell(pl, i, 'wet')); tr.appendChild(cell(pl, i, 'dry'));
      const t = document.createElement('td'); t.className = 'res'; t.id = plw(i); tr.appendChild(t);
      b.appendChild(tr);
    });
    $('plAdd').disabled = pl.length >= PL_MAX; $('plDel').disabled = pl.length <= PL_MIN;
  }
  const plw = i => 'plw' + i;
  $('llAdd').onclick = () => { if (ll.length < LL_MAX) { ll.push({}); renderLL(); recalc(); } };
  $('llDel').onclick = () => { if (ll.length > LL_MIN) { ll.pop(); renderLL(); recalc(); } };
  $('plAdd').onclick = () => { if (pl.length < PL_MAX) { pl.push({}); renderPL(); recalc(); } };
  $('plDel').onclick = () => { if (pl.length > PL_MIN) { pl.pop(); renderPL(); recalc(); } };
  renderLL(); renderPL();

  /* ---------- chart ---------- */
  const W = 700, H = 470, ML = 58, MR = 18, MT = 18, MB = 50;
  const XMIN = 10, XMAX = 100;
  const px = N => ML + (Math.log10(N) - 1) / 1 * (W - ML - MR);
  function drawChart(pts, fit, llVal) {
    // y range
    let ys = pts.map(p => p.w);
    if (isFinite(llVal)) ys.push(llVal);
    let lo = 20, hi = 60;
    if (ys.length) { lo = Math.floor((Math.min(...ys) - 4) / 5) * 5; hi = Math.ceil((Math.max(...ys) + 4) / 5) * 5; }
    if (hi - lo < 15) hi = lo + 15;
    const py = w => MT + (hi - w) / (hi - lo) * (H - MT - MB);
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Tahoma,sans-serif">`;
    s += `<rect width="${W}" height="${H}" fill="#fff"/>`;
    // vertical grid (log)
    const minors = [];
    for (let n = XMIN; n <= XMAX; n += (n < 30 ? 1 : n < 50 ? 2 : 5)) minors.push(n);
    minors.forEach(n => { s += `<line x1="${px(n)}" y1="${MT}" x2="${px(n)}" y2="${H - MB}" stroke="#e8c9c9" stroke-width="0.5"/>`; });
    [10, 20, 30, 40, 50, 60, 70, 80, 90, 100].forEach(n => { s += `<line x1="${px(n)}" y1="${MT}" x2="${px(n)}" y2="${H - MB}" stroke="#d9a4a4" stroke-width="1"/>`; });
    s += `<line x1="${px(25)}" y1="${MT}" x2="${px(25)}" y2="${H - MB}" stroke="#c97b7b" stroke-width="1.3"/>`;
    // horizontal grid
    for (let w = lo; w <= hi + 1e-9; w += 1) {
      const major = w % 5 === 0;
      s += `<line x1="${ML}" y1="${py(w)}" x2="${W - MR}" y2="${py(w)}" stroke="${major ? '#d9a4a4' : '#e8c9c9'}" stroke-width="${major ? 1 : 0.5}"/>`;
    }
    // frame + axes labels
    s += `<rect x="${ML}" y="${MT}" width="${W - ML - MR}" height="${H - MT - MB}" fill="none" stroke="#333" stroke-width="1.4"/>`;
    [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100].forEach(n => {
      s += `<text x="${px(n)}" y="${H - MB + 16}" font-size="11" text-anchor="middle" fill="#333">${n}</text>`;
    });
    for (let w = lo; w <= hi; w += 5) s += `<text x="${ML - 6}" y="${py(w) + 4}" font-size="11" text-anchor="end" fill="#333">${w}</text>`;
    s += `<text x="${(ML + W - MR) / 2}" y="${H - 8}" font-size="12" text-anchor="middle" fill="#333">تعداد ضربه (N) — مقیاس لگاریتمی</text>`;
    s += `<text transform="translate(14 ${(MT + H - MB) / 2}) rotate(-90)" font-size="12" text-anchor="middle" fill="#333">درصد رطوبت (٪)</text>`;
    // flow line (clipped to plot area)
    if (fit) {
      let x1 = XMIN, x2 = XMAX, y1 = wAt(fit, x1), y2 = wAt(fit, x2);
      // clip in y
      const clip = (xa, ya, xb, yb) => {
        const a = Math.log10(xa), b = Math.log10(xb);
        const ts = [];
        [lo, hi].forEach(yy => { const t = (yy - ya) / (yb - ya); if (t > 0 && t < 1) ts.push(t); });
        let t0 = 0, t1 = 1;
        if (ya < lo || ya > hi) { const c = ts.filter(t => t > 0); if (c.length) t0 = Math.min(...c); }
        if (yb < lo || yb > hi) { const c = ts.filter(t => t < 1); if (c.length) t1 = Math.max(...c); }
        return [Math.pow(10, a + (b - a) * t0), ya + (yb - ya) * t0, Math.pow(10, a + (b - a) * t1), ya + (yb - ya) * t1];
      };
      [x1, y1, x2, y2] = clip(x1, y1, x2, y2);
      s += `<line x1="${px(x1)}" y1="${py(y1)}" x2="${px(x2)}" y2="${py(y2)}" stroke="#1b4f9c" stroke-width="2"/>`;
    }
    // points
    pts.forEach(p => { s += `<circle cx="${px(p.n)}" cy="${py(p.w)}" r="4.5" fill="#fff" stroke="#1b4f9c" stroke-width="2"/><circle cx="${px(p.n)}" cy="${py(p.w)}" r="1.6" fill="#1b4f9c"/>`; });
    // LL guide lines
    if (fit && isFinite(llVal) && llVal > lo && llVal < hi) {
      const X = px(25), Y = py(llVal);
      s += `<line x1="${X}" y1="${Y}" x2="${X}" y2="${H - MB}" stroke="#e00000" stroke-width="0.9" stroke-dasharray="5 4"/>`;
      s += `<line x1="${X}" y1="${Y}" x2="${ML}" y2="${Y}" stroke="#e00000" stroke-width="0.9" stroke-dasharray="5 4"/>`;
      s += `<circle cx="${X}" cy="${Y}" r="3" fill="#e00000"/>`;
      s += `<text x="${ML + 4}" y="${Y - 4}" font-size="11" fill="#e00000" font-weight="bold">${f1(llVal)}</text>`;
      s += `<text x="${X + 3}" y="${H - MB - 4}" font-size="11" fill="#e00000" font-weight="bold">25</text>`;
    }
    s += '</svg>';
    $('chartBox').innerHTML = s;
  }

  /* ---------- recalculation ---------- */
  function recalc() {
    // LL
    const pts = []; let bad = 0;
    ll.forEach((r, i) => {
      const w = moisture(toNum(r.can), toNum(r.wet), toNum(r.dry));
      $('llw' + i).textContent = f2(w);
      const n = toNum(r.n);
      const any = [r.n, r.can, r.wet, r.dry].some(v => v && String(v).trim() !== '');
      if (isFinite(w) && n > 0) pts.push({ n, w }); else if (any) bad++;
    });
    const fit = pts.length >= LL_MIN ? fitFlow(pts) : null;
    LL = fit ? wAt(fit, 25) : NaN;
    let msg = [];
    if (bad) msg.push('ردیف ناقص یا نامعتبر (باید: قوطی < خشک ≤ تر).');
    if (pts.length > 0 && pts.length < LL_MIN) msg.push(`حداقل ${LL_MIN} نقطه لازم است (${pts.length} نقطه معتبر).`);
    if (fit) {
      const ns = pts.map(p => p.n);
      if (Math.min(...ns) > 35 || Math.max(...ns) < 15) msg.push('تعداد ضربه‌ها خارج از بازه ۱۵ تا ۳۵ است.');
      else if (!(Math.min(...ns) <= 25 && Math.max(...ns) >= 25)) msg.push('بهتر است نقاط در دو طرف ۲۵ ضربه قرار گیرند.');
      if (fit.m >= 0) msg.push('شیب خط باید منفی باشد؛ داده‌ها را بررسی کنید.');
      if (fit.r2 < 0.95) msg.push('همبستگی خط پایین است (R² = ' + f2(fit.r2) + ').');
    }
    $('llMsg').textContent = msg.join(' ');
    drawChart(pts, fit, LL);
    $('llOut').value = isFinite(LL) ? f1(LL) : '';

    // PL
    const ws = []; let pbad = 0;
    pl.forEach((r, i) => {
      const w = moisture(toNum(r.can), toNum(r.wet), toNum(r.dry));
      $('plw' + i).textContent = f2(w);
      const any = [r.can, r.wet, r.dry].some(v => v && String(v).trim() !== '');
      if (isFinite(w)) ws.push(w); else if (any) pbad++;
    });
    PL = ws.length >= PL_MIN ? mean(ws) : NaN;
    let pm = [];
    if (pbad) pm.push('ردیف ناقص یا نامعتبر.');
    if (ws.length > 0 && ws.length < PL_MIN) pm.push(`حداقل ${PL_MIN} نمونه لازم است.`);
    if (ws.length >= 2 && Math.max(...ws) - Math.min(...ws) > 2) pm.push('اختلاف نمونه‌ها بیش از ۲٪ است؛ آزمایش تکرار شود.');
    $('plMsg').textContent = pm.join(' ');
    $('plOut').value = isFinite(PL) ? f1(PL) : '';

    // PI
    let PI = NaN, piTxt = '';
    if (isFinite(LL) && isFinite(PL)) {
      PI = LL - PL;
      if (PI <= 0) { piTxt = 'NP'; PI = 0; } else piTxt = f1(PI);
    }
    $('rLL').value = isFinite(LL) ? f1(LL) : '';
    $('rPL').value = isFinite(PL) ? f1(PL) : '';
    $('rPI').value = piTxt;

    // standards
    const checks = R.evaluate({
      use: $('use').value, version: $('version').value, sub: $('sub').value,
      LL: LL, PL: PL, PI: PI, SE: toNum($('se').value),
      projLL: toNum($('projLL').value), projPI: toNum($('projPI').value)
    });
    const label = { ok: 'مجاز', fail: 'غیرمجاز', warn: 'هشدار', info: 'توضیح', na: 'داده ناقص' };
    $('checks').innerHTML = checks.map(c => `<div class="chk ${c.status}">
      <b class="t">${c.title}<span class="badge">${label[c.status]}</span></b>
      مقدار: ${c.value} &nbsp;|&nbsp; ضابطه: ${c.limit}<br>
      <span class="ref">مرجع: ${c.ref}</span>
      ${c.note ? `<br><span class="ref">${c.note}</span>` : ''}
      ${c.verify ? `<br><span class="vf">⚠ مقدار/بند را با نسخه چاپی کتاب تطبیق دهید.</span>` : ''}
    </div>`).join('');
  }
  recalc();

  /* ---------- menu / PDF ---------- */
  const toast = t => { const e = $('toast'); e.textContent = t; e.style.display = 'block'; setTimeout(() => e.style.display = 'none', 3500); };
  $('menuBtn').onclick = e => { e.stopPropagation(); const m = $('menu'); m.style.display = m.style.display === 'block' ? 'none' : 'block'; };
  document.addEventListener('click', () => { $('menu').style.display = 'none'; });

  function askName() {
    return new Promise(res => {
      const m = $('modal'), inp = $('fname');
      inp.value = (($('project').value || 'Atterberg').trim() + '_' + new Date().toISOString().slice(0, 10)).replace(/\s+/g, '_');
      m.style.display = 'flex'; setTimeout(() => { inp.focus(); inp.select(); }, 50);
      const done = v => { m.style.display = 'none'; $('mOk').onclick = $('mCancel').onclick = null; res(v); };
      $('mOk').onclick = () => done(inp.value.trim() || 'Atterberg');
      $('mCancel').onclick = () => done(null);
    });
  }
  const safe = n => n.replace(/[\\/:*?"<>|]/g, '_').replace(/\.pdf$/i, '');

  async function buildPdf() {
    const el = $('report');
    const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#f3efe6', useCORS: true, ignoreElements: e => e.hasAttribute && e.hasAttribute('data-pdf-ignore') });
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    const pw = 210, ph = 297, m = 8, iw = pw - 2 * m, ih = ph - 2 * m;
    const pagePx = Math.floor(canvas.width * ih / iw);
    let y = 0, first = true;
    while (y < canvas.height) {
      const h = Math.min(pagePx, canvas.height - y);
      const part = document.createElement('canvas');
      part.width = canvas.width; part.height = h;
      part.getContext('2d').drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
      if (!first) pdf.addPage();
      pdf.addImage(part.toDataURL('image/jpeg', 0.92), 'JPEG', m, m, iw, h * iw / canvas.width);
      first = false; y += h;
    }
    return pdf;
  }
  async function exportPdf(mode) {
    const name = await askName(); if (name === null) return;
    const fn = safe(name) + '.pdf';
    try {
      toast('در حال ساخت PDF…');
      const pdf = await buildPdf();
      const cap = window.Capacitor, P = cap && cap.Plugins;
      if (!(cap && cap.isNativePlatform && cap.isNativePlatform() && P && P.Filesystem)) { pdf.save(fn); return; }
      const data = pdf.output('datauristring').split(',')[1];
      if (mode === 'print') {
        try {
          const r = await P.Filesystem.writeFile({ path: fn, data, directory: 'DOCUMENTS', recursive: true });
          toast('ذخیره شد: Documents/' + fn);
          if (P.Share) await P.Share.share({ title: fn, url: r.uri });
          return;
        } catch (e) { /* fall back to share sheet below */ }
      }
      const r = await P.Filesystem.writeFile({ path: fn, data, directory: 'CACHE' });
      await P.Share.share({ title: fn, url: r.uri, dialogTitle: 'اشتراک‌گذاری گزارش' });
    } catch (e) { if (!/cancel/i.test(String(e))) toast('خطا در ساخت PDF: ' + (e.message || e)); }
  }
  $('miPrint').onclick = () => exportPdf('print');
  $('miShare').onclick = () => exportPdf('share');
})();
