import pathlib
d = pathlib.Path(__file__).parent
src = (d / 'index.src.html').read_text(encoding='utf-8')
app = ((d / 'app.js').read_text(encoding='utf-8') + '\n' + (d / 'home.js').read_text(encoding='utf-8') + '\n' + (d / 'daily.js').read_text(encoding='utf-8')).replace('__LOGO__', (d / 'logo_white.b64').read_text().strip())
out = src.replace('__DATA__', (d / 'data.js').read_text(encoding='utf-8')).replace('__APP__', app)
(d.parent / 'site').mkdir(exist_ok=True)
(d.parent / 'site' / 'index.html').write_text(out, encoding='utf-8')
print(len(out))
import shutil
nm=pathlib.Path(__file__).resolve().parent.parent/'tooling'/'node_modules'
shutil.copy(nm/'xlsx/dist/xlsx.full.min.js', d.parent/'site'/'xlsx.full.min.js')
(d.parent/'site'/'fonts').mkdir(exist_ok=True)
for w in (400,500,700,800):
    for sub in ('arabic','latin'):
        shutil.copy(nm/f'@fontsource/tajawal/files/tajawal-{sub}-{w}-normal.woff2', d.parent/'site'/'fonts')
shutil.copy(nm/'docx/build/index.umd.js', d.parent/'site'/'docx.umd.js')
shutil.copy(nm/'pdfjs-dist/build/pdf.min.js', d.parent/'site'/'pdf.min.js')
shutil.copy(nm/'html2canvas/dist/html2canvas.min.js', d.parent/'site'/'html2canvas.min.js')
shutil.copy(nm/'jspdf/dist/jspdf.umd.min.js', d.parent/'site'/'jspdf.umd.min.js')
shutil.copy(nm/'pdfjs-dist/build/pdf.worker.min.js', d.parent/'site'/'pdf.worker.min.js')
# ---- نسخة الملف الواحد ----
import base64, re
one = (d.parent/'site'/'index.html').read_text(encoding='utf-8')
def font_inline(m):
    f = d.parent/'site'/'fonts'/m.group(1)
    return "url(data:font/woff2;base64," + base64.b64encode(f.read_bytes()).decode() + ") format('woff2')"
one = re.sub(r"url\(fonts/([^)]+)\) format\('woff2'\)", font_inline, one)
xl = (d.parent/'site'/'xlsx.full.min.js').read_text(encoding='utf-8').replace('</script', '<\\/script')
dx = (d.parent/'site'/'docx.umd.js').read_text(encoding='utf-8').replace('</script', '<\\/script')
one = one.replace('<script src="xlsx.full.min.js"></script>', '<script>' + xl + '</script>', 1)
one = one.replace('<script src="docx.umd.js" defer></script>', '<script>' + dx + '</script>', 1)
pw=base64.b64encode((nm/'pdfjs-dist/build/pdf.worker.min.js').read_bytes()).decode()
pm=base64.b64encode((nm/'pdfjs-dist/build/pdf.min.js').read_bytes()).decode()
h2=base64.b64encode((nm/'html2canvas/dist/html2canvas.min.js').read_bytes()).decode()
jp=base64.b64encode((nm/'jspdf/dist/jspdf.umd.min.js').read_bytes()).decode()
i = one.rindex('</body>'); one = one[:i] + '<script type="text/plain" id="pdfworker-src">'+pw+'</script>\n<script type="text/plain" id="pdfjs-src">'+pm+'</script>\n<script type="text/plain" id="h2c-src">'+h2+'</script>\n<script type="text/plain" id="jspdf-src">'+jp+'</script>\n' + one[i:]
out1 = d.parent/'single'; out1.mkdir(exist_ok=True)
(out1/'index.html').write_text(one, encoding='utf-8')
print('single', len(one))
