/**
 * Gestor y Manifiesto de Ecosistema — La Pezcadería ERP
 * Escanea, audita, indexa y detecta cambios en Workflows, Skills, Agencias y Servidores MCP.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '../../');
const WORKFLOWS_DIR = path.join(ROOT_DIR, '.agent/workflows');
const SKILLS_DIR = path.join(ROOT_DIR, '.agents/skills');
const OPENCODE_COMMANDS_DIR = path.join(ROOT_DIR, '.opencode/commands');
const OPENCODE_AGENTS_DIR = path.join(ROOT_DIR, '.opencode/agents');
const MCP_CONFIG_PATH = path.join(ROOT_DIR, '.mcp.json');
const MANIFEST_PATH = path.join(ROOT_DIR, 'DOCS/ecosystem-manifest.json');

/**
 * Escanea todos los workflows markdown (.md)
 */
function scanWorkflows() {
  const workflows = [];
  if (fs.existsSync(WORKFLOWS_DIR)) {
    const files = fs.readdirSync(WORKFLOWS_DIR).filter(f => f.endsWith('.md'));
    for (const f of files) {
      const fullPath = path.join(WORKFLOWS_DIR, f);
      const content = fs.readFileSync(fullPath, 'utf-8');
      const name = f.replace('.md', '');
      
      // Extraer primer encabezado o descripción
      const lines = content.split('\n');
      let title = name;
      let description = '';
      for (const line of lines) {
        if (line.startsWith('# ')) {
          title = line.replace('# ', '').trim();
        } else if (line.startsWith('description:') || line.startsWith('**Descripción:**')) {
          description = line.replace(/^(description:|\*\*Descripción:\*\*)\s*/i, '').trim();
        }
      }

      workflows.push({
        id: name,
        command: `/${name}`,
        title,
        description: description || title,
        file: `.agent/workflows/${f}`,
        status: 'ACTIVE'
      });
    }
  }

  // Workflows / Comandos adicionales de opencode
  if (fs.existsSync(OPENCODE_COMMANDS_DIR)) {
    const files = fs.readdirSync(OPENCODE_COMMANDS_DIR).filter(f => f.endsWith('.md'));
    for (const f of files) {
      const name = f.replace('.md', '');
      if (!workflows.some(w => w.id === name)) {
        workflows.push({
          id: name,
          command: `/${name}`,
          title: `Comando OpenCode: ${name}`,
          description: `Comando slash formal del protocolo brownfield`,
          file: `.opencode/commands/${f}`,
          status: 'ACTIVE'
        });
      }
    }
  }

  return workflows.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Escanea todas las habilidades y skills (.agents/skills)
 */
function scanSkills() {
  const skills = [];
  if (fs.existsSync(SKILLS_DIR)) {
    const dirs = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    for (const d of dirs) {
      const skillFile = path.join(SKILLS_DIR, d, 'SKILL.md');
      let description = '';
      if (fs.existsSync(skillFile)) {
        const content = fs.readFileSync(skillFile, 'utf-8');
        const match = content.match(/description:\s*(.+)/i);
        if (match) description = match[1].trim();
      }
      skills.push({
        id: d,
        name: d,
        description: description || `Habilidad de desarrollo especializada para ERP`,
        path: `.agents/skills/${d}`,
        status: 'ACTIVE'
      });
    }
  }
  return skills.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Escanea las agencias de agentes
 */
function scanAgencies() {
  const agencies = [];

  // 1. Agency Swarm
  const swarmDir = path.join(ROOT_DIR, 'tools/agency-swarm');
  agencies.push({
    id: 'agency-swarm',
    name: 'La Pezcaderia Agency Swarm',
    type: 'MULTI_AGENT_SWARM',
    model: 'Gemini 2.5 Flash Lite (Costo $0)',
    path: 'tools/agency-swarm',
    agents: ['DataEngineer', 'MasterArchitect', 'UiUxSpecialist', 'QualityEngineer'],
    status: fs.existsSync(swarmDir) ? 'ACTIVE' : 'MISSING'
  });

  // 2. Google Harness2
  const harness2Dir = path.join(ROOT_DIR, 'tools/harness2');
  agencies.push({
    id: 'google-harness2',
    name: 'Google Harness² Self-Reflection Engine',
    type: 'RECURSIVE_HARNESS_OPTIMIZATION',
    model: 'Gemini 3.8 Flash (Costo $0)',
    path: 'tools/harness2',
    status: fs.existsSync(harness2Dir) ? 'ACTIVE' : 'MISSING'
  });

  // 3. Brownfield Protocol Agents (.opencode/agents)
  if (fs.existsSync(OPENCODE_AGENTS_DIR)) {
    const agentFiles = fs.readdirSync(OPENCODE_AGENTS_DIR).filter(f => f.endsWith('.md'));
    for (const f of agentFiles) {
      const name = f.replace('.md', '');
      agencies.push({
        id: `agent-${name}`,
        name: `@${name}`,
        type: 'BROWFIELD_ROLE',
        path: `.opencode/agents/${f}`,
        status: 'ACTIVE'
      });
    }
  }

  // 4. Co-Execution Bridge
  const bridgeScript = path.join(ROOT_DIR, 'scripts/architecture/run_agency_sdd_bridge.py');
  agencies.push({
    id: 'sdd-bridge',
    name: 'Swarm + Harness² Parallel Co-Execution Bridge',
    type: 'ORCHESTRATOR',
    path: 'scripts/architecture/run_agency_sdd_bridge.py',
    status: fs.existsSync(bridgeScript) ? 'ACTIVE' : 'MISSING'
  });

  return agencies;
}

/**
 * Escanea los Servidores MCP configurados
 */
function scanMcpServers() {
  const mcps = [];
  if (fs.existsSync(MCP_CONFIG_PATH)) {
    try {
      const data = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, 'utf-8'));
      if (data.mcpServers) {
        for (const [key, config] of Object.entries(data.mcpServers)) {
          mcps.push({
            id: key,
            name: key,
            autoStart: config.autoStart !== false,
            command: config.command || 'remote-http',
            status: 'CONFIGURED'
          });
        }
      }
    } catch (err) {
      console.warn('⚠️ Error al leer .mcp.json:', err.message);
    }
  }

  // Servidores MCP Nativos del IDE Antigravity / Gemini
  const nativeIdeMcps = [
    { id: 'gemini-api-docs', name: 'Gemini API & SDK Docs', autoStart: true, status: 'BUILTIN' },
    { id: 'supabase', name: 'Supabase Database & Edge Functions', autoStart: true, status: 'BUILTIN' },
    { id: 'github', name: 'GitHub Integration & PR Management', autoStart: true, status: 'BUILTIN' },
    { id: 'google-developer-knowledge', name: 'Google Developer Knowledge Hub', autoStart: true, status: 'BUILTIN' },
    { id: 'hindsight', name: 'Hindsight Memory & Knowledge Engine', autoStart: true, status: 'BUILTIN' }
  ];

  for (const ideMcp of nativeIdeMcps) {
    if (!mcps.some(m => m.id === ideMcp.id)) {
      mcps.push(ideMcp);
    }
  }

  return mcps.sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Construye el manifiesto completo del ecosistema
 */
function buildManifest() {
  const workflows = scanWorkflows();
  const skills = scanSkills();
  const agencies = scanAgencies();
  const mcps = scanMcpServers();

  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    totals: {
      workflows: workflows.length,
      skills: skills.length,
      agencies: agencies.length,
      mcpServers: mcps.length
    },
    workflows,
    skills,
    agencies,
    mcpServers: mcps
  };
}

/**
 * Guarda el manifiesto en DOCS/ecosystem-manifest.json
 */
function saveManifest() {
  const docsDir = path.dirname(MANIFEST_PATH);
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  const manifest = buildManifest();
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  return manifest;
}

/**
 * Detecta nuevos elementos comparando con el manifiesto previo
 */
function detectDeltas() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    return { isNew: true, newWorkflows: [], newSkills: [], newMcps: [] };
  }

  try {
    const oldManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));
    const currentManifest = buildManifest();

    const oldWorkflowIds = new Set((oldManifest.workflows || []).map(w => w.id));
    const oldSkillIds = new Set((oldManifest.skills || []).map(s => s.id));
    const oldMcpIds = new Set((oldManifest.mcpServers || []).map(m => m.id));

    const newWorkflows = currentManifest.workflows.filter(w => !oldWorkflowIds.has(w.id));
    const newSkills = currentManifest.skills.filter(s => !oldSkillIds.has(s.id));
    const newMcps = currentManifest.mcpServers.filter(m => !oldMcpIds.has(m.id));

    return {
      isNew: false,
      newWorkflows,
      newSkills,
      newMcps,
      hasChanges: newWorkflows.length > 0 || newSkills.length > 0 || newMcps.length > 0
    };
  } catch (err) {
    return { isNew: true, newWorkflows: [], newSkills: [], newMcps: [] };
  }
}

/**
 * Imprime resumen visual formateado en consola
 */
function printSummary(manifest) {
  console.log('\n┌──────────────────────────────────────────────────────────┐');
  console.log('│  🌐 ECOSISTEMA DE CAPACIDADES, AGENTES Y HERRAMIENTAS    │');
  console.log('├───────────────────────────────┬──────────────────────────┤');
  console.log(`│  ⚡ Workflows Activos (Slash /) │  ${String(manifest.totals.workflows).padEnd(24)}│`);
  console.log(`│  🧠 Habilidades / Skills       │  ${String(manifest.totals.skills).padEnd(24)}│`);
  console.log(`│  🤖 Agencias de Agentes       │  ${String(manifest.totals.agencies).padEnd(24)}│`);
  console.log(`│  🔌 Servidores MCP            │  ${String(manifest.totals.mcpServers).padEnd(24)}│`);
  console.log('└───────────────────────────────┴──────────────────────────┘\n');
}

module.exports = {
  buildManifest,
  saveManifest,
  detectDeltas,
  printSummary,
  MANIFEST_PATH
};

if (require.main === module) {
  const manifest = saveManifest();
  printSummary(manifest);
  console.log(`✅ Manifiesto generado en: ${MANIFEST_PATH}`);
}
