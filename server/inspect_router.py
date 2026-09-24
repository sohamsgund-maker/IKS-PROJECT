import urllib.request
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://h5-static.aoneroom.com/spa/videoPlayPage/assets/index.cdfc1337.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as r:
    js = r.read().decode('utf-8', errors='ignore')

for term in ['/play/', '/movies/', 'videoPlayPage']:
    pos = [m.start() for m in re.finditer(re.escape(term), js)]
    print(f'{term}:')
    for p in pos:
        print('   ', js[max(0, p-100):min(len(js), p+200)])
