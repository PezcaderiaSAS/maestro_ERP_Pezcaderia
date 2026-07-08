import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const graphPath = path.join(__dirname, '..', 'graphify-out', 'graph.json');

const query = process.argv[2];
if (!query) {
  console.log("Usage: node query_graph.js <query>");
  process.exit(1);
}

try {
  const data = JSON.parse(fs.readFileSync(graphPath, 'utf-8'));
  const nodes = data.nodes || [];
  const links = data.links || [];
  const lowercaseQuery = query.toLowerCase();

  console.log(`Searching for nodes matching: "${query}"...\n`);
  const matches = nodes.filter(n => 
    (n.label && n.label.toLowerCase().includes(lowercaseQuery)) ||
    (n.source_file && n.source_file.toLowerCase().includes(lowercaseQuery)) ||
    (n.id && n.id.toLowerCase().includes(lowercaseQuery))
  );

  console.log(`Found ${matches.length} matching nodes:`);
  const matchIds = new Set(matches.map(n => n.id));
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  matches.slice(0, 15).forEach(n => {
    console.log(`- Node: [${n.id}] Label: ${n.label} | File: ${n.source_file} | Location: ${n.source_location}`);
    
    // Find links for this node
    const connectedLinks = links.filter(l => l.source === n.id || l.target === n.id);
    if (connectedLinks.length > 0) {
      console.log(`  Relationships (${connectedLinks.length}):`);
      connectedLinks.slice(0, 8).forEach(l => {
        const otherId = l.source === n.id ? l.target : l.source;
        const otherNode = nodeMap.get(otherId);
        const direction = l.source === n.id ? '->' : '<-';
        const otherLabel = otherNode ? `${otherNode.label} (${otherNode.source_file})` : otherId;
        console.log(`    * ${direction} [${l.relation}] ${otherLabel}`);
      });
      if (connectedLinks.length > 8) {
        console.log(`    * ... and ${connectedLinks.length - 8} more connections`);
      }
    }
  });

  if (matches.length > 15) {
    console.log(`\n... and ${matches.length - 15} more matching nodes.`);
  }

} catch (err) {
  console.error("Error reading or parsing graph.json:", err.message);
}
