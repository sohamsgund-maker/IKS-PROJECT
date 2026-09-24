const endpoints = ["set", "sethd", "sab", "sabhd", "pal", "yay", "mix", "six", "ten1", "ten2", "ten3", "ten4", "ten5", "max", "max2", "wah", "bbcearthhd", "marathi", "aath"];
for (const ep of endpoints) {
  const u = `https://cloudplay-sonyliv.pages.dev/${ep}.m3u8`;
  fetch(u).then(async r => {
    if (r.ok) {
      const t = await r.text();
      console.log(`[OK ${r.status}] ${ep}: ${u} (len: ${t.length})`);
    } else {
      console.log(`[FAIL ${r.status}] ${ep}`);
    }
  }).catch(e => console.log(`[ERR] ${ep}`));
}
