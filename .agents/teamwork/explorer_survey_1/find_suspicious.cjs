const fs = require('fs');
const path = require('path');

const suspicious = ['@testing-library/react', 'vitest', 'fs', 'node:module', 'path', 'exceljs', 'jspdf', 'logrocket'];
const findings = {};
suspicious.forEach(s => findings[s] = []);

function scan(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(fullPath);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      suspicious.forEach(pkg => {
        if (content.includes(`'${pkg}'`) || content.includes(`"${pkg}"`)) {
          findings[pkg].push(fullPath.replace(/\\/g, '/'));
        }
      });
    }
  }
}

scan('src');
console.log(JSON.stringify(findings, null, 2));
