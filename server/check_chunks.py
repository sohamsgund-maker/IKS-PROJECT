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

# Find all chunk js files
chunks = re.findall(r'assets/[a-zA-Z0-9_\-]+\.js', js)
print('Found chunks:', len(chunks), set(chunks))

for c in set(chunks):
    chunk_url = f'https://h5-static.aoneroom.com/spa/videoPlayPage/{c}'
    try:
        creq = urllib.request.Request(chunk_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(creq, context=ctx) as cr:
            cjs = cr.read().decode('utf-8', errors='ignore')
            if 'subject/play' in cjs or 'play' in cjs:
                print('Found play in', c)
                endpoints = re.findall(r'\/[a-zA-Z0-9_\-\/]*play[a-zA-Z0-9_\-\/]*', cjs)
                print('Play endpoints in', c, ':', set(endpoints))
    except Exception as e:
        print(c, e)
