async function inspectJob() {
  const res = await fetch('https://github.com/aditys4444/cinevault/actions/runs/33303656915');
  const html = await res.text();
  const jobLinks = html.match(/href="\/aditys4444\/cinevault\/actions\/runs\/33303656915\/job\/\d+"/g);
  console.log('Job Links:', jobLinks);
  if (jobLinks && jobLinks[0]) {
    const jobUrl = 'https://github.com' + jobLinks[0].replace('href="', '').replace('"', '');
    console.log('Fetching job:', jobUrl);
    const jobRes = await fetch(jobUrl);
    const jobHtml = await jobRes.text();
    const isCompleted = jobHtml.includes('completed');
    const isFailed = jobHtml.includes('failed');
    const isInProgress = jobHtml.includes('in progress');
    console.log('Job status:', { isCompleted, isFailed, isInProgress });
    const artifacts = jobHtml.match(/href="\/aditys4444\/cinevault\/actions\/runs\/\d+\/artifacts\/\d+"/g);
    console.log('Artifacts:', artifacts);
  }
}
inspectJob();
