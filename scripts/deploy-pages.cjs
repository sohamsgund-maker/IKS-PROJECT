const { execSync } = require('child_process');
const path = require('path');

const distPath = path.resolve(__dirname, '../../CineVaultapk Web/dist');
console.log('Deploying from:', distPath);

try {
  const cmd = `npx -y wrangler pages deploy "${distPath}" --project-name=cinevault-web --branch=main --commit-dirty=true`;
  const out = execSync(cmd, {
    env: {
      ...process.env,
    },
    encoding: 'utf8',
    stdio: 'inherit',
  });
  console.log('Deployment successful!');
} catch (err) {
  console.error('Deployment error:', err.message);
  process.exit(1);
}
