/**
 * Script de optimización de prompts para MaestroPescaderia utilizando la API de Context7.
 * 
 * Uso:
 *   node optimize.js --prompt "Tu prompt original" --lib "vitest" --query "mocking serial port"
 */

const https = require('https');

const API_KEY = 'ctx7sk-f3025892-9756-4e33-80ff-4d1a0c945887';
const LIBRARIES = {
  'react': '/facebook/react',
  'nextjs': '/vercel/next.js',
  'vue': '/vuejs/core',
  'vitest': '/vitest-dev/vitest',
  'typescript': '/microsoft/typescript'
};

// Parsear argumentos simples
const args = {};
process.argv.slice(2).forEach((val, index, array) => {
  if (val.startsWith('--')) {
    const key = val.substring(2);
    const nextVal = array[index + 1];
    if (nextVal && !nextVal.startsWith('--')) {
      args[key] = nextVal;
    } else {
      args[key] = true;
    }
  }
});

const rawPrompt = args.prompt || args.p;
const libKey = args.lib || args.l || 'react';
const searchQuery = args.query || args.q || rawPrompt;

if (!rawPrompt) {
  console.log(`
Uso del Optimizador de Prompts:
  node optimize.js --prompt "Tu idea/tarea" [--lib "react|vitest|nextjs"] [--query "término de búsqueda de doc"]

Ejemplo:
  node optimize.js --prompt "agregar test de balanza" --lib "vitest" --query "vitest mock fn"
`);
  process.exit(0);
}

const libraryId = LIBRARIES[libKey.toLowerCase()] || libKey;

console.log(`\x1b[36m[Context7] Buscando documentación para "${searchQuery}" en la librería "${libraryId}"...\x1b[0m`);

const url = `https://context7.com/api/v2/context?libraryId=${encodeURIComponent(libraryId)}&query=${encodeURIComponent(searchQuery)}&type=txt`;

const req = https.get(url, {
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
}, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    let contextResult = 'No se encontró documentación específica en Context7.';
    try {
      const parsed = JSON.parse(data);
      if (parsed.context || parsed.text) {
        contextResult = parsed.context || parsed.text;
      } else if (typeof parsed === 'string') {
        contextResult = parsed;
      } else {
        contextResult = JSON.stringify(parsed, null, 2);
      }
    } catch (e) {
      if (data.trim()) {
        contextResult = data;
      }
    }

    printOptimizedPrompt(rawPrompt, contextResult, libraryId);
  });
});

req.on('error', (e) => {
  console.error(`\x1b[31mError al consultar Context7: ${e.message}\x1b[0m`);
  printOptimizedPrompt(rawPrompt, 'Error al contactar con la API de Context7 (se usará el prompt básico).', libraryId);
});

function printOptimizedPrompt(original, docContext, lib) {
  console.log('\n' + '='.repeat(80));
  console.log('\x1b[32mPROMPT OPTIMIZADO PARA MAESTROPESCADERIA (Copia desde aquí abajo):\x1b[0m');
  console.log('='.repeat(80) + '\n');

  const optimized = `### ROL
Actúa como un Desarrollador Senior especializado en el ecosistema ERP MaestroPescaderia, experto en React, TypeScript y mejores prácticas de desarrollo.

### CONTEXTO
Estamos trabajando en el proyecto MaestroPescaderia.
Tecnologías de referencia de la documentación: ${lib}.

### TAREA
${original}

### DOCUMENTACIÓN Y EJEMPLO DE REFERENCIA (Obtenido vía Context7)
\`\`\`typescript
${docContext.substring(0, 1500)}${docContext.length > 1500 ? '\n... [Truncado para brevedad] ...' : ''}
\`\`\`

### RESTRICCIONES (CONSTRAINTS) Y CRITERIOS DE CALIDAD
1. **Tipado Estricto**: Asegurar que cada variable y función tenga tipos explícitos en TypeScript. Evitar 'any'.
2. **Estilo de UI Premium**: Si hay interfaces, aplicar variables CSS integradas en index.css, con bordes redondeados y micro-interacciones (Glassmorphism).
3. **Persistencia e Integridad**: Las transacciones financieras y de Kardex deben ser atómicas e incluir auditoría según las reglas de negocio (RN).
4. **Validaciones**: Validar todas las entradas de datos en el cliente (formato de peso, montos positivos).
`;

  console.log(optimized);
  console.log('='.repeat(80));
}
