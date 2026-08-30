async function checkJobs() {
  const res = await fetch('https://github.com/aditys4444/cinevault/actions/runs/33302088929');
  const html = await res.text();
  const jobLinks = html.match(/href="\/aditys4444\/cinevault\/actions\/runs\/33302088929\/job\/\d+"/g);
  console.log('Job Links:', jobLinks);
  if (jobLinks && jobLinks[0]) {
    const jobUrl = 'https://github.com' + jobLinks[0].replace('href="', '').replace('"', '');
    console.log('Fetching job:', jobUrl);
    const jobRes = await fetch(jobUrl);
    const jobHtml = await jobRes.text();
    const steps = jobHtml.match(/class="step-name"[^>]*>([^<]+)/g);
    console.log('Steps:', steps);
    const failures = jobHtml.match(/failed/gi);
    console.log('Failures count:', failures ? failures.length : 0);
  }
}
checkJobs();
