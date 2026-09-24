import urllib.request
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = 'https://h5-static.aoneroom.com/spa/videoPlayPage/assets/id.5458d247.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
with urllib.request.urlopen(req, context=ctx) as r:
    js = r.read().decode('utf-8', errors='ignore')

print('Length of id.js:', len(js))
urls = set(re.findall(r'["\'](/wefeed-[^"\']+)["\']', js))
print('wefeed urls in id.js:', urls)

play_related = [m for m in re.findall(r'["\']([^"\']*(?:play|stream|detail|video)[^"\']*)["\']', js) if len(m) < 80]
print('Play-related strings in id.js:', set(play_related)[:30])
