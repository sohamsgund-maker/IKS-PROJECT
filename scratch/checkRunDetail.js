async function checkRun(runId) {
  const res = await fetch(`https://github.com/aditys4444/cinevault/actions/runs/${runId}`);
  const html = await res.text();
  const states = [];
  if (html.includes('aria-label="completed"')) states.push('completed');
  if (html.includes('aria-label="failed"')) states.push('failed');
  if (html.includes('aria-label="in progress"')) states.push('in progress');
  if (html.includes('aria-label="queued"')) states.push('queued');
  if (html.includes('color-fg-danger')) states.push('danger/failure');
  if (html.includes('color-fg-success')) states.push('success');
  console.log(`Run ${runId} states:`, states);
}
checkRun('33301937980');
checkRun('33301935649');
