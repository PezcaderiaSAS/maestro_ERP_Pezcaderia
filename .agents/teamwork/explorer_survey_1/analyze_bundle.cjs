const fs = require('fs');
const path = require('path');

const imports = new Set();
function scan(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.matchAll(/from\s+['"]([^'".\/][^'"]*)['"]/g);
      for (const match of matches) {
        const pkg = match[1].startsWith('@')
          ? match[1].split('/').slice(0, 2).join('/')
          : match[1].split('/')[0];
        imports.add(pkg);
      }
    }
  }
}

scan('src');
console.log('Direct 3rd party packages imported in src/:', Array.from(imports).sort());
