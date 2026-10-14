"""把 src/ 的原始檔組合成 docs/index.html（GitHub Pages 發布的網站）。
修改 src/ 後執行：python3 build.py
"""
import pathlib
R = pathlib.Path(__file__).parent
src = R / 'src'
css = (src / 'style.css').read_text()
body = (src / 'body.html').read_text()
js = '\n'.join((src / f).read_text() for f in ['core.js', 'views.js', 'sheets.js', 'main.js'])
fonts = '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700;900&family=Barlow+Condensed:wght@500;600;700&display=swap">'

head = f'''<!doctype html>
<html lang="zh-Hant-TW">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>匹克球教練筆記</title>
<meta name="description" content="給匹克球教練的學生、課表、收費與學習紀錄管理工具，資料存在你自己的 Google 雲端硬碟。">
<meta name="theme-color" content="#1E5D78">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="教練筆記">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
{fonts}
<style>
html,body{{height:100%}}
:root{{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}}
[hidden]{{display:none!important}}
img{{max-width:100%}}
{css}
</style>
</head>
<body>
{body}
<script>
{js}
</script>
</body>
</html>
'''
dist = R / 'docs'; dist.mkdir(exist_ok=True)
(dist / 'index.html').write_text(head)

preview = f'''<title>匹克球教練筆記</title>
<meta name="claude:viewport-fit-sides" content="cover">
{fonts}
<style>
{css}
</style>
{body}
<script>
{js}
</script>
'''
(R / 'preview.html').write_text(preview)  # 預覽用，已列入 .gitignore
(R / 'check.js').write_text(js)  # 語法檢查用：node --check check.js，已列入 .gitignore
print('ok', len(head))
