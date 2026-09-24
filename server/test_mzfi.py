import urllib.request
import re
import ssl
import json
import gzip

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://mzfi.me/spa/videoPlayPage/movies/the-mentalist-oIq4LvQlyl9?id=7845473610491125400&type=/movie/detail&detailSe=1&detailEp=1&lang=en'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
with urllib.request.urlopen(req, context=ctx) as r:
    html = r.read().decode('utf-8')
    scripts = re.findall(r'src="([^"]+\.js)"', html)
    print('scripts:', scripts)

for s in scripts:
    if s.startswith('/'):
        s = 'https://mzfi.me' + s
    print('Checking script:', s)
    s_req = urllib.request.Request(s, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(s_req, context=ctx) as sr:
        js = sr.read().decode('utf-8', errors='ignore')
        matches = re.findall(r'\/wefeed-h5api-bff\/[a-zA-Z0-9_\-\/]+', js)
        print('Endpoints in', s.split('/')[-1], ':', set(matches))
