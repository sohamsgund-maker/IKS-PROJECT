async function checkActions() {
  const res = await fetch('https://github.com/aditys4444/cinevault/actions');
  const html = await res.text();
  const runs = [];
  const regex = /href="\/aditys4444\/cinevault\/actions\/runs\/(\d+)"/g;
  let m;
  while ((m = regex.exec(html)) !== null) {
    runs.push(m[1]);
  }
  console.log('Action runs found:', [...new Set(runs)]);
}
checkActions();
