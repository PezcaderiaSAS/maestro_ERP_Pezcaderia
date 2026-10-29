const fs = require('fs');
const path = require('path');

// Analisis de anchuras fijas y clases en EnterpriseTopbar.tsx
const topbarPath = path.resolve(__dirname, '../src/components/layout/EnterpriseTopbar.tsx');
const topbarContent = fs.readFileSync(topbarPath, 'utf-8');

console.log('--- AUDITORÍA DE ANCHURA Y OVERFLOW EN TOPBAR (375px) ---');

// 1. Contenedor Header:
// mx-2.5 = 10px margin-left + 10px margin-right = 20px
// px-2.5 = 10px padding-left + 10px padding-right = 20px
// border: 1px left + 1px right = 2px
const viewportWidth = 375;
const marginX = 20;
const paddingX = 20;
const borderX = 2;
const headerInnerAvailableWidth = viewportWidth - marginX - paddingX - borderX;
console.log(`Ancho total viewport: ${viewportWidth}px`);
console.log(`Ancho útil interior del header: ${headerInnerAvailableWidth}px`);

// 2. Elementos de la Izquierda:
// Menu button: p-1.5 (6px*2=12px) + 18px icon = 30px
// gap-2 = 8px
// Home button: 14px icon + padding/margins = 14px (texto ERP is hidden sm:inline)
// ChevronRight: 12px
// Breadcrumb.domain: hidden md:inline (0px)
// ChevronRight 2: hidden md:inline (0px)
// Breadcrumb.sub: max-w-[100px] truncate
const menuBtnWidth = 30;
const gapLeft1 = 8;
const homeBtnWidth = 14;
const gapLeft2 = 6;
const chevron1Width = 12;
const gapLeft3 = 6;
const breadcrumbMaxWidth = 100;
const leftMinWidth = menuBtnWidth + gapLeft1 + homeBtnWidth + gapLeft2 + chevron1Width + gapLeft3 + 20; // con sub corto 'POS'
const leftMaxWidth = menuBtnWidth + gapLeft1 + homeBtnWidth + gapLeft2 + chevron1Width + gapLeft3 + breadcrumbMaxWidth; // con sub truncado al max
console.log(`Sección izquierda (min): ${leftMinWidth}px`);
console.log(`Sección izquierda (max): ${leftMaxWidth}px`);

// 3. Elementos de la Derecha:
// Tenant button:
//   px-2 = 16px
//   Building2 icon = 14px
//   gap-1.5 = 6px
//   span max-w-[80px] = 80px
//   ChevronDown icon = 12px
//   gap-1.5 = 6px
//   Total Tenant si visible = 134px
const isTenantHiddenMobile = topbarContent.includes('hidden sm:flex items-center gap-1.5 px-2');
const tenantBtnWidth = isTenantHiddenMobile ? 0 : (16 + 14 + 6 + 80 + 6 + 12);
console.log(`Selector de empresa en móvil (< sm): ${isTenantHiddenMobile ? 'OCULTO (0px)' : 'VISIBLE (134px)'}`);

// Omnibox: hidden sm:flex = 0px
// Bodega: hidden lg:flex = 0px
// NetworkSyncStatusBadge: hidden sm:inline-flex = 0px

// POS button:
//   px-2.5 = 20px
//   ShoppingCart icon = 14px
//   Texto "Facturar POS": hidden sm:inline = 0px
//   Total POS button = 34px
const posBtnWidth = 20 + 14;

// Theme menu: hidden sm:flex = 0px

// User button:
//   p-1 pl-1.5 pr-2.5 = 16px
//   avatar w-7 = 28px
//   ring/border = 2px
//   Text block: hidden lg:flex = 0px
//   Total User button = 46px
const userBtnWidth = 16 + 28 + 2;

// Gaps en seccion derecha:
// Si tenant oculto, solo hay gap entre POS y User (8px)
const rightGaps = isTenantHiddenMobile ? 8 : (8 + 8);
const rightTotalWidth = tenantBtnWidth + posBtnWidth + userBtnWidth + rightGaps;
console.log(`Sección derecha total: ${rightTotalWidth}px`);

const totalCombinedMin = leftMinWidth + rightTotalWidth;
const totalCombinedMax = leftMaxWidth + rightTotalWidth;
console.log(`Ancho total combinado (min): ${totalCombinedMin}px`);
console.log(`Ancho total combinado (max): ${totalCombinedMax}px`);
console.log(`Disponible interior: ${headerInnerAvailableWidth}px`);

if (totalCombinedMax > headerInnerAvailableWidth) {
  console.log(`⚠️ ALERTA DE OVERFLOW: ${totalCombinedMax}px > ${headerInnerAvailableWidth}px (exceso de ${totalCombinedMax - headerInnerAvailableWidth}px)`);
} else {
  console.log('✅ SE ADAPTA SIN OVERFLOW');
}
