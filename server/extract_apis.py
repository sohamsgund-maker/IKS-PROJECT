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

urls = set(re.findall(r'["\'](/wefeed-[^"\']+)["\']', js))
print('wefeed urls:', urls)

all_apis = set(re.findall(r'["\'](/[^"\']+)["\']', js))
filtered = [u for u in all_apis if len(u) > 3 and not u.startswith('//') and not u.endswith('.js') and not u.endswith('.css') and not u.endswith('.png')]
print('All api paths:', [u for u in filtered if '/' in u[1:]][:50])
