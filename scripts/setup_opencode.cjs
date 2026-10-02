const fs = require('fs');
const path = require('path');
const config = JSON.parse(fs.readFileSync('.opencode/protocol.json', 'utf8'));

fs.mkdirSync('.opencode/commands', { recursive: true });
fs.mkdirSync('.opencode/agents', { recursive: true });

config.workflows_slash_commands.forEach(cmd => {
  const content = `# ${cmd.command}\n\n**Descripción:** ${cmd.description}\n\n**Agente Objetivo:** ${cmd.agent_target}\n\n**Prompt:**\n${cmd.prompt}\n`;
  fs.writeFileSync(cmd.file, content);
});

for (const [key, agent] of Object.entries(config.agents_at_architecture)) {
  const content = `# Agent: ${key}\n\n**Rol:** ${agent.role}\n**Modo:** ${agent.mode}\n\n**Descripción:**\n${agent.description}\n\n**Permisos:**\n\`\`\`json\n${JSON.stringify(agent.permissions, null, 2)}\n\`\`\`\n\n**Instrucciones:**\n${agent.instructions.map(i => '- ' + i).join('\n')}\n`;
  fs.writeFileSync(agent.file, content);
}

console.log('Successfully generated .opencode directories and files.');
