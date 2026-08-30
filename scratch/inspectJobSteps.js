async function inspectJob() {
  const jobUrl = 'https://github.com/aditys4444/cinevault/actions/runs/33303024128/job/99234537361';
  const jobRes = await fetch(jobUrl);
  const jobHtml = await jobRes.text();
  const stepMatches = jobHtml.match(/<div class="[^"]*step-item[^"]*"[^>]*>[\s\S]*?<\/div>/g) || [];
  console.log('Step items found:', stepMatches.length);
  const re = /<span class="[^"]*step-title[^"]*"[^>]*>([^<]+)<\/span>/g;
  let m;
  const titles = [];
  while ((m = re.exec(jobHtml)) !== null) {
    titles.push(m[1].trim());
  }
  console.log('Step titles:', titles);
  const lines = jobHtml.split('\n');
  const errorLines = lines.filter(l => l.includes('Process completed with exit code') || l.includes('Error:') || l.includes('FAILED'));
  console.log('Error logs:', errorLines);
}
inspectJob();
