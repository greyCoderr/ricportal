const { execSync } = require('child_process');
let d = '';
process.stdin.on('data', c => (d += c)).on('end', () => {
  try {
    const f = (JSON.parse(d).tool_input || {}).file_path || '';
    if (/\.(ts|tsx|js|json|css)$/i.test(f) && !/node_modules|prisma[\/]migrations/i.test(f)) {
      execSync('npx --no-install prettier --write "' + f + '"', { stdio: 'ignore' });
    }
  } catch (e) {}
  process.exit(0);
});
