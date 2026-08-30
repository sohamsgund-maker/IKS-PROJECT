async function checkAllReleases() {
  const res = await fetch('https://github.com/aditys4444/cinevault/releases');
  const html = await res.text();
  console.log('Releases page length:', html.length);
  const titles = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/g);
  console.log('Titles:', titles);
  const links = html.match(/href="\/aditys4444\/cinevault\/releases\/[^"]+"/g);
  console.log('Release Links:', links);
}
checkAllReleases();
