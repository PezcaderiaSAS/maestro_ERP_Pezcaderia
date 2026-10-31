const fs = require('fs');
const path = require('path');

const regPath = 'C:/Users/usuario/.gemini/antigravity-ide/brain/517b8833-a77d-4123-8b30-df5a151e0f60/scratch/package/src/data/registry.ts';
const content = fs.readFileSync(regPath, 'utf8');

const regex = /slug:\s*"([^"]+)",[\s\S]*?name:\s*"([^"]+)",[\s\S]*?topics:\s*\[([\s\S]*?)\],[\s\S]*?description:\s*"([^"]+)"/g;

const matches = [];
let match;
while ((match = regex.exec(content)) !== null) {
  const [_, slug, name, rawTopics, desc] = match;
  const topics = rawTopics.replace(/["'\s]/g, '').split(',').filter(Boolean);
  matches.push({ slug, name, topics, desc });
}

console.log(`Total skills found in registry: ${matches.length}`);

// Filtrar skills relevantes para Leyes de UI, Colores, Jerarquía, Accesibilidad, Sistemas
const relevantTopics = ['color', 'visual', 'systems', 'accessibility', 'typography', 'interaction'];
const filtered = matches.filter(s => s.topics.some(t => relevantTopics.includes(t)));

console.log(`Skills relevantes encontradas: ${filtered.length}\n`);
filtered.slice(0, 35).forEach(s => {
  console.log(`• [${s.slug}] (${s.topics.join(', ')})`);
  console.log(`  ${s.desc}\n`);
});
