async function watchRun(runId) {
  const res = await fetch(`https://github.com/aditys4444/cinevault/actions/runs/${runId}`);
  const html = await res.text();
  const jobLinks = html.match(/href="\/aditys4444\/cinevault\/actions\/runs\/\d+\/job\/(\d+)"/g);
  console.log('Job link:', jobLinks);
  const status = {
    inProgress: html.includes('aria-label="in progress"'),
    completed: html.includes('aria-label="completed"'),
    failed: html.includes('aria-label="failed"'),
    success: html.includes('color-fg-success')
  };
  console.log('Run Status:', status);
}
watchRun('33304083529');
