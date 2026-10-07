#!/usr/bin/env node
/**
 * Master Batch Uploader & Synchronizer for Google Stitch MCP
 * Project: Maestro_Pezca (ID: 18399720576914259666)
 * Design Tokens: DESIGN.md & stitch.json (Strict Dark Glassmorphism)
 */

const cp = require('child_process');
const fs = require('fs');
const path = require('path');

// 1. Cargar credenciales desde .env.local o entorno
function loadCredentials() {
  try {
    const envPath = path.resolve(__dirname, '../../.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const match = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2];
        }
      }
    }
  } catch {}
  return process.env.STITCH_API_KEY || '';
}

const API_KEY = loadCredentials();
const PROJECT_ID = '18399720576914259666';

// 2. Definición estructurada de Pantallas y Wizards
const SCREENS_CATALOG = {
  tier1: [
    {
      id: 'pos_terminal',
      title: 'POS Terminal & Touch Grid Catalog',
      prompt: `
        La Pezcaderia ERP Point of Sale (POS) Cashier Terminal.
        Theme: Strict Dark Glassmorphism, deep canvas background #0a0f1d, translucent frosted cards (rgba(17,24,39,0.75), backdrop-blur-xl, border 1px solid rgba(255,255,255,0.12)), vibrant cyan glow (#06b6d4) and marine indigo (#4f46e5).
        Layout:
        - Top bar: Cashier name, register number #01, active shift timer, quick action buttons (Arqueo Ciego, Reabastecer, Cierre Turno).
        - Main Area (Left): Touch-friendly seafood catalog grid with categories (Pescado Entero, Filetes, Mariscos, Congelados), displaying unit prices, stock in KG, freshness badge, and quick-add buttons.
        - Sidebar (Right): High-density live cart panel with itemized list, weight inputs, discount toggle, tax subtotal, and payment methods (Efectivo, Datáfono, Transferencia, Pago Mixto).
      `.trim()
    },
    {
      id: 'pos_blind_count_wizard',
      title: 'POS Blind Cash Reconciliation Wizard',
      prompt: `
        La Pezcaderia ERP Blind Cash Count (Arqueo de Caja Ciega) Modal Wizard.
        Theme: Dark Glassmorphism modal centered overlay (backdrop-blur-2xl, border-white/10).
        Content:
        - Ergonomic numerical keypad and cash denomination inputs ($100k, $50k, $20k, $10k, $5k, $2k bills and coins).
        - Shift summary header (Cajero, Fecha, Turno) without revealing the expected system balance (Blind Arqueo principle).
        - Observations input textarea for justification of cash discrepancies.
        - Primary action: 'Confirmar y Cerrar Caja' with emerald highlight, secondary: 'Cancelar'.
      `.trim()
    },
    {
      id: 'wms_fefo_inventory',
      title: 'WMS Warehouse & FEFO Cold Room Tracking',
      prompt: `
        La Pezcaderia ERP Warehouse Management System (WMS) & FEFO Cold Storage.
        Theme: Strict Dark Glassmorphism, high data density table layout.
        Features:
        - Cold Room metrics cards at top: Cold Room #1 (-18°C Frozen), Cold Room #2 (2°C Fresh Chilled), showing humidity and capacity % with gauge sparklines.
        - FEFO Batch Table: Batch ID, Product Name, Received Date, Expiration Date with color status badges (Green >30d, Amber 10-30d, Red <10d warning), Current Stock (kg), Location Slot.
        - Action bar: Transfer Stock between warehouses, Register Yield/Scrap, Export Inventory Acta.
      `.trim()
    },
    {
      id: 'wms_meat_yield_wizard',
      title: 'WMS Seafood Butchery Yield & Scrap Wizard',
      prompt: `
        La Pezcaderia ERP Yield and Scrap Adjustment (Mermas y Rendimiento de Despiece) Modal.
        Theme: Dark Glassmorphism translucent dialog.
        Features:
        - Initial Input: Raw whole fish batch selection (e.g. Salmón Entero 50.0 kg).
        - Cut Breakdown Matrix: Resulting cuts (Filete Premium 32.5 kg, Cabeza/Espinazo 12.0 kg, Merma Vísceras 5.5 kg).
        - Real-time Yield calculation indicator: 65% Yield, 24% By-product, 11% Scrap loss with comparative benchmark indicator.
        - Mandatory justification select dropdown and supervisor approval PIN code input.
      `.trim()
    },
    {
      id: 'suppliers_purchasing',
      title: 'Suppliers Directory & Purchase Orders (Módulo 3)',
      prompt: `
        La Pezcaderia ERP Suppliers and Purchasing Management Dashboard.
        Theme: Dark Glassmorphism table with cyan and indigo accents.
        Features:
        - KPI metrics cards: Total Monthly Purchases ($ COP), Active Suppliers count, Pending Reception Orders, Average Cost variation %.
        - Purchase Orders (PO) Table: PO Code (OC-2026-001), Supplier Name (Pesquera del Pacífico), Issue Date, Delivery ETA, Total Amount, Payment Status, Reception Status (Borrador, Confirmada, En Recepción, Recibida).
        - Action: '+ Nueva Orden de Compra' button, filter by supplier category (Pescado Fresco, Mariscos Importados, Empaques y Cadena de Frío).
      `.trim()
    },
    {
      id: 'b2b_pricing_wizard',
      title: 'B2B Quotations & Margin Simulator Wizard',
      prompt: `
        La Pezcaderia ERP B2B Wholesale Pricing & Escandallo Quoter Wizard.
        Theme: Dark Glassmorphism interactive wizard.
        Features:
        - Multi-step header: 1. Cliente B2B -> 2. Selección de Lotes -> 3. Margen y Escala -> 4. Emisión PDF.
        - Margin Health Indicator: Visual color gauge showing Gross Margin % with warning if pricing goes below minimum threshold (28%).
        - Volume Tier Matrix: Tier 1 (1-50 kg), Tier 2 (51-200 kg), Tier 3 (200+ kg) with automated discount curves.
        - One-click 'Generar Cotización PDF con Validez 5 Días'.
      `.trim()
    }
  ],
  tier2: [
    {
      id: 'ar_receivables',
      title: 'Accounts Receivable (Cartera CxC) & Aging Matrix',
      prompt: `
        La Pezcaderia ERP Accounts Receivable (Cartera y CxC) Dashboard.
        Theme: Dark Glassmorphism with amber and rose aging accents.
        Features:
        - Cartera Aging Matrix: 0-30 días (Green), 31-60 días (Yellow), 61-90 días (Amber), 90+ días vencido (Rose Red).
        - Debtors List: Client Corporate Name, Total Due, Days Overdue, Credit Limit utilization bar, Contact phone.
        - Payment Registration Drawer: Record partial receipt, payment voucher upload, and automatic receipt receipt generation.
      `.trim()
    },
    {
      id: 'order_kanban',
      title: 'Logistics Order Kanban & Dispatch Board',
      prompt: `
        La Pezcaderia ERP Wholesale Orders & Cold Dispatch Kanban Board.
        Theme: Dark Glassmorphism drag-and-drop board.
        Columns:
        1. Pedidos Recibidos (Nuevos pedidos B2B y de canal digital).
        2. En Alistamiento (Pesaje y selección en cuarto frío).
        3. En Empaque y Cadena de Frío (Control térmico y precintos).
        4. Despachado en Ruta (Vehículo refrigerado asignado).
        5. Entregado y Facturado.
        Card details: Order #, Client, Total kg, Delivery schedule time badge, Cold chain temperature check badge.
      `.trim()
    },
    {
      id: 'cold_storage_3pl',
      title: '3PL Cold Room Rental Management',
      prompt: `
        La Pezcaderia ERP Third-Party Cold Storage Rental (3PL Custodia) View.
        Theme: Dark Glassmorphism with deep navy and cyan highlights.
        Features:
        - Warehouse visual slot grid: 800 kg pallet positions (Occupied in cyan, Available in translucent gray, Reserved in amber).
        - Custody Contracts Table: Client Tenant, Start Date, End Date, Daily/Monthly billing rate, Total kg in custody.
        - Entry/Exit Actas generator: Record inbound weight, seal number, and discharge certificate.
      `.trim()
    },
    {
      id: 'cash_treasury',
      title: 'Petty Cash & Minor Treasury Dashboard',
      prompt: `
        La Pezcaderia ERP Petty Cash (Caja Menor y Tesorería) Ledger.
        Theme: Dark Glassmorphism financial ledger view.
        Features:
        - Current Cash Balance KPI Card with minimum base threshold.
        - Transactions Timeline: Date, Concept (Hielo, Flete urgente, Mantenimiento báscula), Category, Amount ($ COP), Responsible cashier, Expense voucher receipt preview.
        - Action: '+ Registrar Egreso Menor' modal with expense justification.
      `.trim()
    },
    {
      id: 'hr_payroll',
      title: 'HR Staff Shifts & Payroll Settlement',
      prompt: `
        La Pezcaderia ERP Human Resources, Cold Room Worker Shifts & Payroll.
        Theme: Dark Glassmorphism employee roster.
        Features:
        - Operarios & Cold Chain Staff: Active workers list, Cold room shift hours (rotating schedules to prevent thermal fatigue), Basic salary, Overtime, Risk bonus.
        - Bi-weekly Payroll Settlement Table: Gross earnings, Health/Pension deductions, Net payable amount, Direct bank payment status.
      `.trim()
    },
    {
      id: 'executive_dashboard',
      title: 'Executive KPI Dashboard & Pareto ABC Sparklines',
      prompt: `
        La Pezcaderia ERP Executive Analytics Dashboard.
        Theme: Strict Dark Glassmorphism, ultra-high density executive summary.
        Features:
        - Real-time KPIs: Daily Sales ($ COP) with % change vs last week, Current Stock Value ($ COP), Active Margin (34.2%), Scrap Rate (2.8%).
        - Pareto ABC 80/20 Inventory Analysis Chart: Top revenue seafood products (Category A - 80% volume), Moderate (B - 15%), Low turn (C - 5%).
        - Real-time Activity Feed: Live POS transactions, WMS receipts, and urgent expiry notifications.
      `.trim()
    }
  ]
};

async function invokeTool(toolName, data) {
  const tmpJson = path.resolve(__dirname, `tmp_${Date.now()}_${Math.random().toString(36).substring(7)}.json`);
  fs.writeFileSync(tmpJson, JSON.stringify(data), 'utf8');

  return new Promise((resolve, reject) => {
    const cmd = `npx -y @_davideast/stitch-mcp@latest tool ${toolName} -o json -f "${tmpJson}"`;
    cp.exec(cmd, { env: { ...process.env, STITCH_API_KEY: API_KEY }, maxBuffer: 15 * 1024 * 1024 }, (err, stdout, stderr) => {
      try { fs.unlinkSync(tmpJson); } catch {}
      if (err) {
        return reject(new Error(stderr || err.message));
      }
      try {
        const parsed = JSON.parse(stdout);
        resolve(parsed);
      } catch {
        resolve(stdout);
      }
    });
  });
}

async function listCurrentScreens() {
  const res = await invokeTool('list_screens', { projectId: PROJECT_ID });
  return res.screens || [];
}

async function generateScreen(item) {
  console.log(`\n▶ [Google Stitch] Generando pantalla: "${item.title}" (${item.id}) ...`);
  const payload = {
    projectId: PROJECT_ID,
    prompt: item.prompt,
    designSystem: 'assets/b617234774454f3290fa9a0d86ed09e6'
  };
  const result = await invokeTool('generate_screen_from_text', payload);
  console.log(`✔ [Google Stitch] Pantalla "${item.title}" generada exitosamente en el proyecto!`);
  return result;
}

async function runBatch(tierName = 'tier1') {
  console.log(`======================================================================`);
  console.log(`GOOGLE STITCH MCP - SINCRONIZADOR UI/UX PARA LA PEZCADERIA ERP`);
  console.log(`Proyecto: Maestro_Pezca (ID: ${PROJECT_ID})`);
  console.log(`Modo: Lote ${tierName.toUpperCase()}`);
  console.log(`======================================================================\n`);

  const initialScreens = await listCurrentScreens();
  console.log(`Pantallas existentes en canvas actualmente: ${initialScreens.length}`);
  initialScreens.forEach(s => console.log(` - [${s.deviceType || 'DESKTOP'}] ${s.title} (ID: ${s.name?.split('/').pop()})`));

  const items = SCREENS_CATALOG[tierName];
  if (!items) {
    console.error(`Lote no reconocido: ${tierName}`);
    process.exit(1);
  }

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`\n[${i + 1}/${items.length}] Verificando "${item.title}"...`);

    const alreadyExists = initialScreens.some(s => {
      const existing = (s.title || '').toLowerCase();
      const target = item.title.toLowerCase();
      return existing.includes(target) || (existing.includes('pos cashier terminal') && item.id === 'pos_terminal');
    });

    if (alreadyExists) {
      console.log(`ℹ [Google Stitch] "${item.title}" ya existe en el proyecto. Omitiendo.`);
      continue;
    }

    try {
      await generateScreen(item);
      console.log(`Pausa de 4 segundos para respetar cuota...`);
      await new Promise(r => setTimeout(r, 4000));
    } catch (err) {
      console.error(`✖ Error generando ${item.title}:`, err.message);
    }
  }

  const finalScreens = await listCurrentScreens();
  console.log(`\n======================================================================`);
  console.log(`SINCRONIZACIÓN COMPLETADA: Total pantallas en Stitch: ${finalScreens.length}`);
  console.log(`======================================================================`);
}

const arg = process.argv[2] || 'tier1';
if (arg === 'list') {
  listCurrentScreens().then(screens => {
    console.log(`Total pantallas en proyecto: ${screens.length}`);
    screens.forEach(s => console.log(`• ${s.title}: ${s.name}`));
  });
} else {
  runBatch(arg).catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });
}
