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

# Search for mentions of subject/play or play? or streams
matches = re.finditer(r'subject/play|subject_play|\/play\?', js)
for m in matches:
    p = m.start()
    print('Match at', p, ':', js[max(0, p-80):min(len(js), p+120)])

# Search for any endpoint returning video streams
matches2 = re.finditer(r'streams|qualities|resolution', js)
for m in list(matches2)[:10]:
    p = m.start()
    print('Stream/quality match at', p, ':', js[max(0, p-60):min(len(js), p+100)])
