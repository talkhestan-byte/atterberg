(function () {
  const $ = id => document.getElementById(id);
  const { toNum, moisture, fitFlow, wAt, mean } = Calc;
  const R = Rules;
  const f1 = v => (isFinite(v) ? (Math.round(v * 10) / 10).toFixed(1) : '');
  const f2 = v => (isFinite(v) ? (Math.round(v * 100) / 100).toFixed(2) : '');

  /* ---------- state ---------- */
  const ll = [{}, {}, {}];
  const pl = [{}, {}, {}];
  const LL_MIN = 3, LL_MAX = 5, PL_MIN = 3, PL_MAX = 3;
  let LL = NaN, PL = NaN;

  /* ---------- selects ---------- */
  function fillSel(el, obj, keep) { el.innerHTML = Object.keys(obj).map(k => `<option value="${k}">${obj[k]}</option>`).join(''); if (keep && obj[keep]) el.value = keep; }
  fillSel($('use'), R.USES);
  function updateExtras() { $('concExtra').style.display = $('use').value === 'concrete' ? 'grid' : 'none'; }
  $('use').onchange = () => { updateExtras(); recalc(); };
  ['p75'].forEach(i => $(i).addEventListener('input', recalc));
  ['aggType', 'conType', 'abrasion'].forEach(i => $(i).addEventListener('change', recalc));
  updateExtras();

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
  }
  const plw = i => 'plw' + i;
  $('llAdd').onclick = () => { if (ll.length < LL_MAX) { ll.push({}); renderLL(); recalc(); } };
  $('llDel').onclick = () => { if (ll.length > LL_MIN) { ll.pop(); renderLL(); recalc(); } };
  renderLL(); renderPL();

  /* ---------- chart ---------- */
  const W = 700, H = 490, ML = 82, MR = 28, MT = 18, MB = 78;
  const XMIN = 9, XMAX = 60;
  const LOG_RANGE = Math.log10(XMAX / XMIN);
  const X_PAD = 15;
  const px = N => ML + X_PAD + (Math.log10(N / XMIN) / LOG_RANGE) * (W - ML - MR - 2 * X_PAD);
  function drawChart(pts, fit, llVal) {
    // y range
    let ys = pts.map(p => p.w);
    if (isFinite(llVal)) ys.push(llVal);
    let lo = 20, hi = 60;
    if (ys.length) { lo = Math.floor((Math.min(...ys) - 4) / 5) * 5; hi = Math.ceil((Math.max(...ys) + 4) / 5) * 5; }
    if (hi - lo < 15) hi = lo + 15;
    const py = w => MT + (hi - w) / (hi - lo) * (H - MT - MB);
    const plotBottom = H - MB, plotRight = W - MR;
    let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" font-family="Tahoma,sans-serif">`;
    s += `<rect width="${W}" height="${H}" fill="#fff"/>`;
    // vertical grid (log)
    const majorX = [9, 10, 15, 20, 25, 30, 40, 50, 60];
    const minors = [];
    for (let n = 10; n < 60; n += (n < 20 ? 1 : n < 30 ? 2 : 5)) if (!majorX.includes(n)) minors.push(n);
    minors.forEach(n => { s += `<line x1="${px(n)}" y1="${MT}" x2="${px(n)}" y2="${plotBottom}" stroke="#e8c9c9" stroke-width="0.5"/>`; });
    majorX.forEach(n => { s += `<line x1="${px(n)}" y1="${MT}" x2="${px(n)}" y2="${plotBottom}" stroke="#d9a4a4" stroke-width="1"/>`; });
    s += `<line x1="${px(25)}" y1="${MT}" x2="${px(25)}" y2="${H - MB}" stroke="#c97b7b" stroke-width="1.3"/>`;
    // horizontal grid
    for (let w = lo; w <= hi + 1e-9; w += 1) {
      const major = w % 5 === 0;
      s += `<line x1="${ML}" y1="${py(w)}" x2="${W - MR}" y2="${py(w)}" stroke="${major ? '#d9a4a4' : '#e8c9c9'}" stroke-width="${major ? 1 : 0.5}"/>`;
    }
    // frame + axes labels
    s += `<rect x="${ML}" y="${MT}" width="${W - ML - MR}" height="${H - MT - MB}" fill="none" stroke="#333" stroke-width="1.4"/>`;
    [9, 10, 15, 20, 25, 30, 40, 50, 60].forEach(n => {
      s += `<text x="${px(n)}" y="${H - MB + 16}" font-size="11" text-anchor="middle" fill="#333">${n}</text>`;
    });
    for (let w = lo; w <= hi; w += 5) s += `<text x="${ML - 18}" y="${py(w) + 4}" font-size="11" text-anchor="end" fill="#333">${w}</text>`;
    s += `<text x="${(ML + W - MR) / 2}" y="${H - 8}" font-size="12" text-anchor="middle" fill="#333">تعداد ضربه (N) — مقیاس لگاریتمی</text>`;
    s += `<text transform="translate(14 ${(MT + H - MB) / 2}) rotate(-90)" font-size="12" text-anchor="middle" fill="#333">درصد رطوبت (٪)</text>`;
    // flow line (clipped to plot area)
    if (fit) {
      const sortedPts = [...pts].sort((a,b) => a.n-b.n);
      const xStart = sortedPts[0].n, xEnd = sortedPts[sortedPts.length - 1].n;
      const yStart = wAt(fit, xStart), yEnd = wAt(fit, xEnd);
      const innerLo = lo + 0.7, innerHi = hi - 0.7;
      let t0 = 0, t1 = 1;
      const dy = yEnd - yStart;
      if (Math.abs(dy) > 1e-9) {
        const ta = (innerLo - yStart) / dy, tb = (innerHi - yStart) / dy;
        const enter = Math.min(ta, tb), leave = Math.max(ta, tb);
        t0 = Math.max(0, enter); t1 = Math.min(1, leave);
      } else if (yStart < innerLo || yStart > innerHi) { t0 = 1; t1 = 0; }
      if (t1 > t0) {
        const a = Math.log10(xStart), b = Math.log10(xEnd);
        const x1 = Math.pow(10, a + (b - a) * t0), x2 = Math.pow(10, a + (b - a) * t1);
        const y1 = yStart + dy * t0, y2 = yStart + dy * t1;
        s += `<line x1="${px(x1)}" y1="${py(y1)}" x2="${px(x2)}" y2="${py(y2)}" stroke="#1b4f9c" stroke-width="2.2" stroke-linecap="round"/>`;
      }
    }
    // points
    pts.forEach(p => { s += `<circle cx="${px(p.n)}" cy="${py(p.w)}" r="4.5" fill="#fff" stroke="#1b4f9c" stroke-width="2"/><circle cx="${px(p.n)}" cy="${py(p.w)}" r="1.6" fill="#1b4f9c"/>`; });
    // LL guide lines
    if (fit && isFinite(llVal) && llVal > lo && llVal < hi) {
      const X = px(25), Y = py(llVal);
      s += `<line x1="${X}" y1="${Y}" x2="${X}" y2="${H - MB}" stroke="#e00000" stroke-width="0.9" stroke-dasharray="5 4"/>`;
      s += `<line x1="${X}" y1="${Y}" x2="${ML}" y2="${Y}" stroke="#e00000" stroke-width="0.9" stroke-dasharray="5 4"/>`;
      s += `<circle cx="${X}" cy="${Y}" r="3" fill="#e00000"/>`;
      s += `<rect x="${ML - 76}" y="${Y - 19}" width="48" height="16" rx="3" fill="#fff"/>`;
      s += `<text x="${ML - 31}" y="${Y - 7}" font-size="11" text-anchor="end" fill="#e00000" font-weight="bold">${f1(llVal)}</text>`;
      s += `<rect x="${X - 11}" y="${H - MB + 37}" width="22" height="15" rx="3" fill="#fff"/>`;
      s += `<text x="${X}" y="${H - MB + 49}" font-size="11" text-anchor="middle" fill="#e00000" font-weight="bold">25</text>`;
    }
    s += '</svg>';
    $('chartBox').innerHTML = s;
  }

  /* ---------- recalculation ---------- */
  function recalc() {
    // LL
    const pts = []; let bad = 0, outRange = 0;
    ll.forEach((r, i) => {
      const w = moisture(toNum(r.can), toNum(r.wet), toNum(r.dry));
      $('llw' + i).textContent = f2(w);
      const n = toNum(r.n);
      const any = [r.n, r.can, r.wet, r.dry].some(v => v && String(v).trim() !== '');
      if (isFinite(w) && n > 0) { if (n >= XMIN && n <= XMAX) pts.push({ n, w }); else outRange++; } else if (any) bad++;
    });
    const fit = pts.length >= LL_MIN ? fitFlow(pts) : null;
    LL = fit ? wAt(fit, 25) : NaN;
    let msg = [];
    if (bad) msg.push('ردیف ناقص یا نامعتبر (باید: قوطی < خشک ≤ تر).');
    if (outRange) msg.push('تعداد ضربه بعضی نمونه‌ها خارج از محدوده نمودار ۹ تا ۶۰ است.');
    if (pts.length > 0 && pts.length < LL_MIN) msg.push(`حداقل ${LL_MIN} نقطه لازم است (${pts.length} نقطه معتبر).`);
    if (fit) {
      const ns = pts.map(p => p.n);
      if (Math.min(...ns) < 9 || Math.max(...ns) > 60) msg.push('برای نمودار، تعداد ضربه‌ها باید در محدوده ۹ تا ۶۰ باشد.');
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
      use: $('use').value, material: $('stype').value,
      LL: LL, PL: PL, PI: PI, P75: toNum($('p75').value),
      aggType: $('aggType').value, conType: $('conType').value, abrasion: $('abrasion').value,

    });
    const label = { ok: 'مجاز', fail: 'غیرمجاز', warn: 'هشدار', info: 'توضیح', na: 'داده ناقص' };
    $('checks').innerHTML = checks.map(c => `<div class="chk ${c.status}">
      <b class="t">${c.title}<span class="badge">${label[c.status]}</span></b>
      مقدار: ${c.value} &nbsp;|&nbsp; ضابطه: ${c.limit}<br>
      <span class="ref">مرجع: ${c.ref}</span>
      ${c.note ? `<br><span class="ref">${c.note}</span>` : ''}
      
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
      inp.value = (($('project').value || 'Atterberg').trim() + '_' + new Date().toISOString().slice(0, 10)).replace(/\\s+/g, '_');
      m.style.display = 'flex'; setTimeout(() => { inp.focus(); inp.select(); }, 50);
      const done = v => { m.style.display = 'none'; $('mOk').onclick = $('mCancel').onclick = null; res(v); };
      $('mOk').onclick = () => done(inp.value.trim() || 'Atterberg');
      $('mCancel').onclick = () => done(null);
    });
  }
  const safe = n => n.replace(/[\\\\/:*?"<>|]/g, '_').replace(/\\.pdf$/i, '');

  const esc = value => String(value == null ? '' : value).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  function makePrintReport() {
    const date = new Date().toLocaleDateString('fa-IR');
    const metadata = [
      ['نام پروژه', $('project').value], ['تاریخ نمونه‌برداری', $('sdate').value],
      ['محل نمونه‌برداری', $('splace').value], ['نوع نمونه', $('stype').value],
      ['نوع استفاده', $('use').selectedOptions[0]?.textContent]
    ].filter(([,v]) => v);
    const metaRows = [];
    for (let i=0;i<metadata.length;i+=2) {
      const a=metadata[i], b=metadata[i+1];
      metaRows.push('<tr><td>'+esc(a[0])+'</td><td>'+esc(a[1])+'</td><td>'+(b?esc(b[0]):'')+'</td><td>'+(b?esc(b[1]):'')+'</td></tr>');
    }
    const llRows = ll.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.n)+'</td><td>'+esc(r.can)+'</td><td>'+esc(r.wet)+'</td><td>'+esc(r.dry)+'</td><td>'+esc($('llw'+i).textContent)+'</td></tr>').join('');
    const plRows = pl.map((r,i)=>'<tr><td>'+(i+1)+'</td><td>'+esc(r.can)+'</td><td>'+esc(r.wet)+'</td><td>'+esc(r.dry)+'</td><td>'+esc($('plw'+i).textContent)+'</td></tr>').join('');
    const pi = $('rPI').value || '—';
    const interpretation = !isFinite(LL) || !isFinite(PL)
      ? 'برای ارائه تفسیر نهایی، ورود داده‌های معتبر هر دو آزمون حد روانی و حد خمیری لازم است.'
      : (pi === 'NP'
        ? 'شاخص خمیری صفر یا منفی است؛ نمونه در این آزمون به‌صورت غیرخمیری (NP) گزارش می‌شود.'
        : 'شاخص خمیری برابر اختلاف حد روانی و حد خمیری است. این مقدار بیانگر دامنه رطوبتی رفتار خمیری خاک است؛ تعیین گروه‌بندی نهایی خاک مستلزم اطلاعات دانه‌بندی و در صورت نیاز نمودار خمیری است.');
    $('printReport').innerHTML = `<article class="print-sheet">
      <h1>گزارش آزمایش حدود اتربرگ</h1><div style="text-align:center;color:#555">حد روانی (کاساگرانده)، حد خمیری و شاخص خمیری</div>
      <div style="text-align:left;font-size:10px;color:#666">تاریخ تهیه گزارش: ${esc(date)}</div>
      <h2>۱. مشخصات نمونه و پروژه</h2>
      <table class="meta"><tbody>${metaRows.join('')}</tbody></table>
      <h2>۲. نتایج آزمون</h2>
      <table><thead><tr><th colspan="6">حد روانی (LL)</th></tr><tr><th>ردیف</th><th>تعداد ضربه</th><th>وزن قوطی (g)</th><th>قوطی + تر (g)</th><th>قوطی + خشک (g)</th><th>رطوبت (%)</th></tr></thead><tbody>${llRows}</tbody></table>
      <table><thead><tr><th colspan="5">حد خمیری (PL)</th></tr><tr><th>ردیف</th><th>وزن قوطی (g)</th><th>قوطی + تر (g)</th><th>قوطی + خشک (g)</th><th>رطوبت (%)</th></tr></thead><tbody>${plRows}</tbody></table>
      <h2>۳. نمودار جریان</h2><div id="printGraph">${$('chartBox').innerHTML}</div>
      <h2>۴. نتایج نهایی</h2>
      <div class="final-values"><div>حد روانی (LL)<strong>${esc($('rLL').value || '—')}٪</strong></div><div>حد خمیری (PL)<strong>${esc($('rPL').value || '—')}٪</strong></div><div>شاخص خمیری (PI)<strong>${esc(pi)}${pi==='NP'?'':'٪'}</strong></div></div>
      <h2>۵. تفسیر نتیجه</h2><div class="interpretation">${esc(interpretation)}<hr><b>کنترل ضوابط و توضیحات مرتبط:</b>${$('checks').innerHTML || '<p>موردی برای نمایش ثبت نشده است.</p>'}</div>
    </article>`;
  }

  async function buildPdf() {
    makePrintReport();
    const el = $('printReport'); el.classList.add('rendering');
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
      const pw = 210, m = 8, iw = pw - 2 * m, ih = 297 - 2 * m;
      const pagePx = Math.floor(canvas.width * ih / iw);
      let y = 0, first = true;
      while (y < canvas.height) {
        const h = Math.min(pagePx, canvas.height - y);
        const part = document.createElement('canvas'); part.width = canvas.width; part.height = h;
        part.getContext('2d').drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h);
        if (!first) pdf.addPage();
        pdf.addImage(part.toDataURL('image/jpeg', 0.94), 'JPEG', m, m, iw, h * iw / canvas.width);
        first = false; y += h;
      }
      return pdf;
    } finally { el.classList.remove('rendering'); }
  }

  async function shareReport() {
    const name = await askName(); if (name === null) return;
    try {
      toast('در حال آماده‌سازی گزارش برای اشتراک‌گذاری…');
      const pdf = await buildPdf(), fn = safe(name) + '.pdf';
      const cap = window.Capacitor, P = cap && cap.Plugins;
      if (!(cap && cap.isNativePlatform && cap.isNativePlatform() && P && P.Filesystem && P.Share)) {
        pdf.save(fn); toast('فایل گزارش ذخیره شد.'); return;
      }
      const data = pdf.output('datauristring').split(',')[1];
      const r = await P.Filesystem.writeFile({ path: fn, data, directory: 'CACHE' });
      await P.Share.share({ title: fn, url: r.uri, dialogTitle: 'اشتراک‌گذاری گزارش آزمایش' });
    } catch (e) { if (!/cancel/i.test(String(e))) toast('خطا در اشتراک‌گذاری: ' + (e.message || e)); }
  }

  async function printReport() {
    makePrintReport();
    try {
      const cap = window.Capacitor;
      const printer = cap && cap.Plugins && cap.Plugins.WebviewPrint;
      if (cap && cap.isNativePlatform && cap.isNativePlatform()) {
        if (!printer || typeof printer.print !== 'function') throw new Error('افزونه چاپ نصب نشده است؛ نسخه جدید برنامه را بسازید.');
        await printer.print({ name: 'گزارش آزمایش حدود اتربرگ' });
      } else { window.print(); }
    } catch (e) { toast('خطا در چاپ: ' + (e.message || e)); }
  }
  $('miPrint').onclick = () => { $('menu').style.display = 'none'; printReport(); };
  $('miShare').onclick = () => { $('menu').style.display = 'none'; shareReport(); };
})();