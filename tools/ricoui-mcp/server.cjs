#!/usr/bin/env node
/**
 * Rico UI Brands & Google Stitch Design MCP Server (CommonJS)
 * Protocol: Model Context Protocol (MCP) Standard JSON-RPC 2.0 via stdio
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CATALOG_DIR = path.join(__dirname, 'catalog');
const BRANDS_FILE = path.join(CATALOG_DIR, 'brands.json');
const TEMPLATES_FILE = path.join(CATALOG_DIR, 'templates.json');

function loadBrands() {
  if (fs.existsSync(BRANDS_FILE)) {
    return JSON.parse(fs.readFileSync(BRANDS_FILE, 'utf8')).brands;
  }
  return {};
}

function loadTemplates() {
  if (fs.existsSync(TEMPLATES_FILE)) {
    return JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf8')).templates;
  }
  return {};
}

/**
 * Format Google Stitch prompt with design tokens
 */
function formatStitchPrompt(viewDescription, brandKey = 'pezcaderia-glass', componentType = 'dashboard') {
  const brands = loadBrands();
  const brand = brands[brandKey] || brands['pezcaderia-glass'];

  const bgHex = brand.colors.background.hex;
  const primaryHex = brand.colors.primary.hex;
  const accentHex = brand.colors.accent.hex;
  const surfaceHex = brand.colors.surface.hex;
  const textHex = brand.colors.text_primary.hex;
  const fontSans = brand.typography.font_family_sans;
  const blurLevel = brand.surfaces.backdrop_blur;
  const overlay = brand.surfaces.glass_overlay;

  const prompt = [
    `# Google Stitch Design Specification: ${viewDescription}`,
    `## Brand Design System: ${brand.name} (${brand.archetype})`,
    `## Target Component / View Type: ${componentType}`,
    '',
    '### Visual Directives & Tokens:',
    `- Background: ${bgHex} (Deep canvas)`,
    `- Surface Card: ${surfaceHex} with Backdrop Filter: ${blurLevel} and Glass Overlay: ${overlay}`,
    `- Primary Accent: ${primaryHex} | Secondary Accent: ${accentHex}`,
    `- Text Hierarchy: Primary ${textHex}, Font Sans: ${fontSans}`,
    `- Border Radius: ${brand.surfaces.radii.lg} | Ambient Shadow: ${brand.surfaces.shadow_ambient}`,
    `- Glow Effect: ${brand.surfaces.shadow_glow}`,
    '',
    '### Structural Requirements:',
    '- Strict Glassmorphism Dark Mode with translucent frosted glass cards (backdrop-blur-xl, border-white/10).',
    '- High information density and semantic typography hierarchy.',
    '- Micro-animations on hover (subtle scale, border-glow, transition-all duration-200).',
    '- Accessible WCAG 2.1 AA contrast for all interactive elements and badges.',
    '- Output compatible with React 18, Next.js 14+ App Router, Tailwind CSS and Lucide React icons.'
  ].join('\n');

  return prompt;
}

/**
 * Available MCP Tools Definition
 */
const TOOLS = [
  {
    name: 'ricoui_list_brands',
    description: 'Lista todos los sistemas de diseño de marcas disponibles en Rico UI (Linear, Stripe, Raycast, Vercel, Supabase, Apple, Pezcaderia Glass).',
    inputSchema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          description: 'Filtro opcional por arquetipo o nombre (ej: "minimal", "glass", "fintech")'
        }
      }
    }
  },
  {
    name: 'ricoui_get_brand_tokens',
    description: 'Obtiene los tokens de diseño normalizados (colores, tipografía, superficies, sombras, radios) de una marca específica.',
    inputSchema: {
      type: 'object',
      properties: {
        brand: {
          type: 'string',
          description: 'Identificador de la marca (linear, stripe, raycast, supabase, vercel, apple, pezcaderia-glass)'
        }
      },
      required: ['brand']
    }
  },
  {
    name: 'ricoui_get_component_template',
    description: 'Retorna una plantilla de componente React 18 + Tailwind CSS de alta fidelidad adaptada a un caso de uso.',
    inputSchema: {
      type: 'object',
      properties: {
        template_id: {
          type: 'string',
          description: 'ID de la plantilla (kpi_card, data_table, pricing_modal)'
        }
      },
      required: ['template_id']
    }
  },
  {
    name: 'ricoui_format_stitch_prompt',
    description: 'Genera un prompt optimizado para Google Stitch inyectando automáticamente los tokens de una marca de Rico UI y directivas Glassmorphism.',
    inputSchema: {
      type: 'object',
      properties: {
        view_description: {
          type: 'string',
          description: 'Descripción de la vista o componente a generar (ej: "Dashboard de Rendimiento Financiero y Mermas")'
        },
        brand: {
          type: 'string',
          description: 'Marca a aplicar (linear, stripe, raycast, supabase, vercel, apple, pezcaderia-glass)',
          default: 'pezcaderia-glass'
        },
        component_type: {
          type: 'string',
          description: 'Tipo de componente (dashboard, modal, form, pos, wms, pricing)',
          default: 'dashboard'
        }
      },
      required: ['view_description']
    }
  }
];

/**
 * Handle Tool Invocations
 */
function handleToolCall(name, args = {}) {
  const brands = loadBrands();
  const templates = loadTemplates();

  switch (name) {
    case 'ricoui_list_brands': {
      const filter = (args.filter || '').toLowerCase();
      const list = Object.entries(brands)
        .filter(([key, b]) => {
          if (!filter) return true;
          return key.includes(filter) || b.name.toLowerCase().includes(filter) || b.archetype.toLowerCase().includes(filter);
        })
        .map(([key, b]) => ({
          id: key,
          name: b.name,
          archetype: b.archetype,
          description: b.description,
          primary_color: b.colors.primary.hex,
          accent_color: b.colors.accent.hex
        }));
      return { brands: list, total: list.length };
    }

    case 'ricoui_get_brand_tokens': {
      const key = (args.brand || '').toLowerCase().trim();
      const brand = brands[key];
      if (!brand) {
        return {
          error: `Marca '${key}' no encontrada. Marcas disponibles: ${Object.keys(brands).join(', ')}`
        };
      }
      return { brand: key, data: brand };
    }

    case 'ricoui_get_component_template': {
      const id = (args.template_id || '').trim();
      const template = templates[id];
      if (!template) {
        return {
          error: `Plantilla '${id}' no encontrada. Plantillas disponibles: ${Object.keys(templates).join(', ')}`
        };
      }
      return { template };
    }

    case 'ricoui_format_stitch_prompt': {
      const prompt = formatStitchPrompt(args.view_description, args.brand, args.component_type);
      return { prompt, brand: args.brand || 'pezcaderia-glass' };
    }

    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
}

/**
 * Run MCP Server in stdio JSON-RPC mode
 */
function runServer() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', (line) => {
    if (!line.trim()) return;

    try {
      const msg = JSON.parse(line);
      const id = msg.id;

      if (msg.method === 'initialize') {
        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            serverInfo: {
              name: 'ricoui-design-mcp',
              version: '1.0.0'
            },
            capabilities: {
              tools: {}
            }
          }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
        return;
      }

      if (msg.method === 'tools/list') {
        const response = {
          jsonrpc: '2.0',
          id,
          result: { tools: TOOLS }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
        return;
      }

      if (msg.method === 'tools/call') {
        const toolName = msg.params?.name;
        const toolArgs = msg.params?.arguments || {};
        const result = handleToolCall(toolName, toolArgs);

        const response = {
          jsonrpc: '2.0',
          id,
          result: {
            content: [
              {
                type: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
              }
            ]
          }
        };
        process.stdout.write(JSON.stringify(response) + '\n');
        return;
      }

      // Default ping / empty handler
      if (id !== undefined) {
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id, result: {} }) + '\n');
      }
    } catch (err) {
      // Ignored non-json lines
    }
  });
}

/**
 * CLI Handler for standalone running / testing
 */
function runCli() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  if (!cmd || cmd === 'help' || cmd === '--help') {
    console.log(`
Rico UI & Google Stitch MCP Server CLI
Uso:
  node server.cjs brands                     # Lista todas las marcas
  node server.cjs tokens <marca>             # Retorna tokens de la marca (ej: linear, stripe)
  node server.cjs template <id>              # Retorna código de plantilla (ej: kpi_card, data_table)
  node server.cjs prompt "<descripcion>"     # Genera prompt para Google Stitch
  node server.cjs test                       # Ejecuta tests de integridad
  node server.cjs --mcp                      # Inicia el servidor MCP JSON-RPC
    `);
    return;
  }

  if (cmd === '--mcp') {
    runServer();
    return;
  }

  if (cmd === 'brands') {
    console.log(JSON.stringify(handleToolCall('ricoui_list_brands'), null, 2));
    return;
  }

  if (cmd === 'tokens') {
    const brand = args[1] || 'pezcaderia-glass';
    console.log(JSON.stringify(handleToolCall('ricoui_get_brand_tokens', { brand }), null, 2));
    return;
  }

  if (cmd === 'template') {
    const template_id = args[1] || 'kpi_card';
    console.log(JSON.stringify(handleToolCall('ricoui_get_component_template', { template_id }), null, 2));
    return;
  }

  if (cmd === 'prompt') {
    const view_description = args[1] || 'Dashboard Financiero y Operativo';
    const brand = args[2] || 'linear';
    const res = handleToolCall('ricoui_format_stitch_prompt', { view_description, brand });
    console.log('\n--- STITCH PROMPT ---\n');
    console.log(res.prompt);
    return;
  }

  if (cmd === 'test') {
    console.log('[TEST] Probando herramientas de Rico UI MCP...');
    const brandsRes = handleToolCall('ricoui_list_brands');
    console.log(`✔ Marcas cargadas: ${brandsRes.total}`);

    const linearTokens = handleToolCall('ricoui_get_brand_tokens', { brand: 'linear' });
    if (!linearTokens.data) throw new Error('Fallo al obtener tokens de Linear');
    console.log('✔ Tokens de Linear obtenidos correctamente');

    const templateRes = handleToolCall('ricoui_get_component_template', { template_id: 'kpi_card' });
    if (!templateRes.template) throw new Error('Fallo al obtener plantilla kpi_card');
    console.log('✔ Plantilla KPI Card obtenida correctamente');

    const promptRes = handleToolCall('ricoui_format_stitch_prompt', {
      view_description: 'Vista de Caja POS',
      brand: 'stripe'
    });
    if (!promptRes.prompt.includes('Stripe')) throw new Error('Fallo al formatear prompt de Stitch');
    console.log('✔ Generación de Prompt Stitch validada');

    console.log('\n🎉 Todos los tests del servidor Rico UI MCP pasaron exitosamente.');
    return;
  }

  console.log(`Comando no reconocido: ${cmd}. Usa 'node server.cjs --help'.`);
}

if (process.argv.includes('--mcp')) {
  runServer();
} else if (require.main === module) {
  runCli();
}

module.exports = { handleToolCall, formatStitchPrompt, TOOLS };
