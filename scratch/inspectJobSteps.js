async function inspectJob() {
  const jobUrl = 'https://github.com/aditys4444/cinevault/actions/runs/33302860252/job/99234091376';
  const jobRes = await fetch(jobUrl);
  const jobHtml = await jobRes.text();
  const failedSteps = jobHtml.match(/class="[^"]*step[^"]*"[^>]*>[\s\S]*?<\/div>/g);
  console.log('Failed steps length:', failedSteps ? failedSteps.length : 0);
  const lines = jobHtml.split('\n');
  const errorLines = lines.filter(l => l.includes('Error:') || l.includes('failed') || l.includes('exit code'));
  console.log('Error lines:', errorLines.slice(0, 10));
}
inspectJob();
