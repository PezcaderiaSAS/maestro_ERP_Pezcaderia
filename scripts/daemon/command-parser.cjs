/**
 * scripts/daemon/command-parser.cjs
 * Lexer and parser for user WhatsApp directives in MaestroPescadería Autonomous Agency.
 */

/**
 * Normalizes input text by trimming and stripping leading slashes or exclamation marks
 */
function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.trim().replace(/^[/!#]/, '').trim();
}

/**
 * Detects domain role from free-form text
 */
function detectRoleFromText(text) {
  const lower = text.toLowerCase();
  if (/\b(redis|supabase|sql|tabla|migraci[oó]n|base de datos|db|postgres|cache)\b/i.test(lower)) {
    return 'data';
  }
  if (/\b(ui|ux|css|color|dise[ñn]o|vista|pantalla|bot[oó]n|modal|layout|375px|responsive|tailwind)\b/i.test(lower)) {
    return 'ui';
  }
  if (/\b(test|vitest|prueba|coverage|fallo|bug|failing|assert|regresi[oó]n)\b/i.test(lower)) {
    return 'quality';
  }
  return 'architect';
}

/**
 * Parses raw WhatsApp message string into an AST command object
 */
function parseCommand(rawMessage) {
  const cleaned = cleanText(rawMessage);
  if (!cleaned) {
    return { type: 'HELP', rawText: rawMessage, error: 'Mensaje vacío.' };
  }

  const parts = cleaned.split(/\s+/);
  const verb = parts[0].toUpperCase();
  const rest = parts.slice(1).join(' ').trim();

  // 1. ESTADO
  if (['ESTADO', 'STATUS', 'INFO', 'VER'].includes(verb)) {
    return { type: 'STATUS', rawText: rawMessage };
  }

  // 2. AUDITAR
  if (['AUDITAR', 'AUDIT', 'CHECK', 'REVISAR'].includes(verb)) {
    return { type: 'AUDIT', rawText: rawMessage };
  }

  // 3. ORDEN <ids...>
  if (['ORDEN', 'ORDER', 'PRIORIDAD'].includes(verb)) {
    const rawIds = rest.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    const taskIds = rawIds.map((id) => parseInt(id, 10)).filter((n) => !isNaN(n));
    if (taskIds.length === 0) {
      return {
        type: 'HELP',
        rawText: rawMessage,
        error: 'Sintaxis inválida. Uso correcto: ORDEN 1 3 2',
      };
    }
    return { type: 'REORDER', rawText: rawMessage, taskIds };
  }

  // 4. EJECUTAR <id>
  if (['EJECUTAR', 'RUN', 'HAZ', 'INICIAR'].includes(verb)) {
    const targetId = parseInt(parts[1], 10);
    if (isNaN(targetId)) {
      return {
        type: 'HELP',
        rawText: rawMessage,
        error: 'Sintaxis inválida. Uso correcto: EJECUTAR <id>',
      };
    }
    return { type: 'EXECUTE', rawText: rawMessage, targetId };
  }

  // 5. APROBAR <id>
  if (['APROBAR', 'SI', 'OK', 'CONFIRMAR'].includes(verb)) {
    const targetId = parts[1] ? parseInt(parts[1], 10) : undefined;
    return { type: 'APPROVE', rawText: rawMessage, targetId: isNaN(targetId) ? undefined : targetId };
  }

  // 6. RECHAZAR <id>
  if (['RECHAZAR', 'NO', 'DESCARTAR', 'CANCELAR'].includes(verb)) {
    const targetId = parseInt(parts[1], 10);
    if (isNaN(targetId)) {
      return {
        type: 'HELP',
        rawText: rawMessage,
        error: 'Sintaxis inválida. Uso correcto: RECHAZAR <id>',
      };
    }
    return { type: 'REJECT', rawText: rawMessage, targetId };
  }

  // 7. TAREA <texto>
  if (['TAREA', 'TASK', 'NUEVA', 'AGREGAR'].includes(verb)) {
    if (!rest) {
      return {
        type: 'HELP',
        rawText: rawMessage,
        error: 'Sintaxis inválida. Uso correcto: TAREA <descripción>',
      };
    }
    const role = detectRoleFromText(rest);
    return {
      type: 'CUSTOM_TASK',
      rawText: rawMessage,
      customPayload: rest,
      suggestedRole: role,
    };
  }

  // 8. PAUSAR
  if (['PAUSAR', 'PAUSE', 'DETENER', 'STOP'].includes(verb)) {
    return { type: 'PAUSE', rawText: rawMessage };
  }

  // 9. REANUDAR
  if (['REANUDAR', 'RESUME', 'CONTINUAR', 'PLAY'].includes(verb)) {
    return { type: 'RESUME', rawText: rawMessage };
  }

  // 10. AYUDA
  if (['AYUDA', 'HELP', 'COMANDOS', '?'].includes(verb)) {
    return { type: 'HELP', rawText: rawMessage };
  }

  // Si no coincide con ningún verbo, tratar como mensaje de ayuda o consulta no reconocida
  return {
    type: 'UNKNOWN',
    rawText: rawMessage,
    error: `Comando '${verb}' no reconocido. Envía AYUDA para ver la lista.`,
  };
}

/**
 * Formats system status into WhatsApp Markdown string
 */
function formatStatusMessage(state) {
  const d = state.daemon;
  const q = state.queue || [];
  const active = q.find((t) => t.id === state.activeTask);
  const todo = q.filter((t) => t.status === 'DETECTED' || t.status === 'QUEUED');

  let text = `🤖 *MaestroPescadería 24/7 Agency Status*\n\n`;
  text += `🟢 *Estado:* \`${d.status}\`\n`;
  text += `⏱️ *Uptime:* ${Math.floor(d.uptimeSeconds / 60)} min (${d.uptimeSeconds}s)\n`;
  text += `🔄 *Último Ciclo:* #${state.audit.lastAuditCycle} (${state.audit.lastAuditAt || 'N/A'})\n\n`;

  text += `⚡ *Tarea en Proceso (WIP = 1):*\n`;
  if (active) {
    text += `👉 [#${active.numericIndex}] *${active.title}* (@${active.role})\n\n`;
  } else {
    text += `_Ninguna tarea activa (En espera)_\n\n`;
  }

  text += `📋 *Cola Pendiente (${todo.length}):*\n`;
  if (todo.length === 0) {
    text += `_Cola vacía. El repositorio está limpio._\n\n`;
  } else {
    todo.slice(0, 5).forEach((t) => {
      text += `[${t.numericIndex}] *${t.title}* (@${t.role} | ${t.priority})\n`;
    });
    if (todo.length > 5) {
      text += `_...y ${todo.length - 5} más._\n`;
    }
    text += `\n💡 _Para autorizar: \`EJECUTAR <id>\` o \`ORDEN 1 2 3\`_\n`;
  }

  return text;
}

/**
 * Formats audit findings into WhatsApp Markdown string
 */
function formatAuditReportMessage(auditResults, candidateTasks = []) {
  let text = `🔍 *Reporte de Auditoría Continua*\n\n`;
  text += `• TypeScript: ${auditResults.tsc === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n`;
  text += `• SOLID Boundaries: ${auditResults.solidBoundaries === 'PASS' ? '✅ PASS' : '⚠️ WARNING'}\n`;
  text += `• ESLint: ${auditResults.lint.errors} errores, ${auditResults.lint.warnings} advertencias\n`;
  text += `• Vitest: ${auditResults.vitest === 'PASS' ? '✅ PASS' : '❌ FAIL'}\n\n`;

  if (candidateTasks.length === 0) {
    text += `✨ *Todo impecable.* No se detectaron problemas nuevos.\n`;
  } else {
    text += `🚨 *Tareas Propuestas (${candidateTasks.length}):*\n`;
    candidateTasks.slice(0, 5).forEach((t) => {
      text += `[${t.numericIndex}] *${t.title}* (@${t.role})\n`;
    });
    text += `\n👉 _Responde \`EJECUTAR <id>\` para autorizar o \`ORDEN <ids>\` para reordenar._\n`;
  }
  return text;
}

/**
 * Formats command help message
 */
function formatHelpMessage(extraError = null) {
  let text = '';
  if (extraError) {
    text += `⚠️ *${extraError}*\n\n`;
  }
  text += `📖 *Guía de Comandos WhatsApp — Agencia 24/7*\n\n`;
  text += `• *ESTADO*: Consulta el estado del servicio y tareas.\n`;
  text += `• *AUDITAR*: Lanza auditoría completa inmediata.\n`;
  text += `• *ORDEN 1 3 2*: Reordena las tareas de la cola.\n`;
  text += `• *EJECUTAR 2*: Autoriza la tarea 2 (WIP = 1).\n`;
  text += `• *APROBAR [id]*: Confirma un plan o checkpoint SDD.\n`;
  text += `• *RECHAZAR <id>*: Descarta la tarea indicada.\n`;
  text += `• *TAREA <texto>*: Inyecta una tarea manual.\n`;
  text += `• *PAUSAR*: Pausa la ejecución automática.\n`;
  text += `• *REANUDAR*: Reanuda el bucle de trabajo.\n`;
  text += `• *AYUDA*: Muestra esta guía.\n`;
  return text;
}

module.exports = {
  cleanText,
  detectRoleFromText,
  parseCommand,
  formatStatusMessage,
  formatAuditReportMessage,
  formatHelpMessage,
};
