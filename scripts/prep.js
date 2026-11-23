// Copies the PDF libraries from node_modules into www/lib (works offline inside the APK)
const fs = require('fs'), path = require('path');
const out = path.join(__dirname, '..', 'www', 'lib');
fs.mkdirSync(out, { recursive: true });
const files = [
  ['jspdf/dist/jspdf.umd.min.js', 'jspdf.umd.min.js'],
  ['html2canvas/dist/html2canvas.min.js', 'html2canvas.min.js']
];
for (const [src, dst] of files) {
  const from = path.join(__dirname, '..', 'node_modules', src);
  if (!fs.existsSync(from)) { console.error('Missing: ' + from); process.exit(1); }
  fs.copyFileSync(from, path.join(out, dst));
  console.log('copied', dst);
}
