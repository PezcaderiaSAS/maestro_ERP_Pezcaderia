#!/usr/bin/env node
/**
 * Agent-Reach Web & Documentation Runner (CLI Companion)
 * Zero-config Markdown fetcher via Jina Reader & GitHub Search
 */

const https = require('https');

async function fetchJinaReader(url) {
  const target = `https://r.jina.ai/${url}`;
  return new Promise((resolve, reject) => {
    https.get(target, { headers: { 'User-Agent': 'Mozilla/5.0 Agent-Reach/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function searchGitHub(query) {
  const target = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`;
  return new Promise((resolve, reject) => {
    https.get(target, { headers: { 'User-Agent': 'Agent-Reach-Swarm/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const items = json.items || [];
          let out = `Resultados encontrados para "${query}":\n\n`;
          items.forEach(it => {
            out += `• ${it.full_name} (${it.stargazers_count} ★)\n  Link: ${it.html_url}\n  Descripción: ${it.description || 'Sin descripción'}\n\n`;
          });
          resolve(out);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function main() {
  const [,, command, ...args] = process.argv;
  const input = args.join(' ');

  if (!command || !input) {
    console.log('Uso: node agent_reach_runner.cjs [read|search] "<url o consulta>"');
    process.exit(1);
  }

  if (command === 'read') {
    console.log(`[Agent-Reach: Jina Reader] Leyendo: ${input} ...\n`);
    const content = await fetchJinaReader(input);
    console.log(content);
  } else if (command === 'search') {
    console.log(`[Agent-Reach: Technical Search] Buscando: "${input}" ...\n`);
    const content = await searchGitHub(input);
    console.log(content);
  } else {
    console.error('Comando inválido. Usa read o search.');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
