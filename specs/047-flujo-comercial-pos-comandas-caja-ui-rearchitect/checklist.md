# Checklist de Calidad UI/UX e Ingeniería — SPEC-047

## 1. Cumplimiento de Leyes de UI y Ergonomía
- [ ] **Ley de Fitts:** Todos los botones táctiles en Mostrador y Modal de Cobro poseen una altura mínima $\ge 48\text{px}$ y padding táctil generoso.
- [ ] **Ley de Fitts (Teclado):** En la Taquilla de Caja Supermercado, los atajos de teclado primarios (F1-F12, Enter, Espacio, Escape) tienen asignación ergonómica y foco visible de teclado (`ring-2 ring-cyan-400`).
- [ ] **Ley de Hick:** El flujo en mostrador se ejecuta en un solo paso predecible sin sub-menús innecesarios (Selección $\rightarrow$ Peso $\rightarrow$ Despacho).
- [ ] **Ley de Miller:** La información tabular de las comandas y del desglose de cobro dividido está segmentada en bloques digeribles ($\le 7$ elementos por grupo visual).
- [ ] **Ley de Proximidad:** El total a pagar, los abonos asignados y el saldo pendiente/vuelto se agrupan en una tarjeta unificada de alto impacto visual.

## 2. Armonía Cromática y Accesibilidad WCAG 2.1 (AA / AAA)
- [ ] **Regla 60-30-10:**
  - 60% Fondo dominante oscuro (`#0a0f1d` / `bg-slate-950`).
  - 30% Superficies y tarjetas estructuradas (`rgba(17, 24, 39, 0.75)` con borde `border-slate-800`).
  - 10% Acentos semánticos de alta luminosidad (Cian `#06b6d4`, Esmeralda `#10b981`, Ámbar `#f59e0b`, Rosa `#ef4444`).
- [ ] **Contraste WCAG:** Todo texto primario supera el ratio de contraste 4.5:1 (blanco `#f8fafc` sobre pizarra profunda supera 13:1).
- [ ] **Cero Texto Ilisible:** Eliminadas clases de texto atenuado de bajo contraste (`text-slate-600` sobre fondos oscuros).
- [ ] **Tipografía Tabular Monospace:** Todos los importes monetarios, gramajes de balanza y números de turno utilizan obligatoriamente `font-mono` (`JetBrains Mono`).

## 3. Funcionalidad del Flujo Comercial (Mostrador -> Caja Supermercado)
- [ ] **Mostrador POS Ágil:** Selección de producto + pesaje rápido (balanza o barra espaciadora) + chips de corte + despacho instantáneo a caja con consecutivo de turno.
- [ ] **Cintillo / Ticker de Cola Interno:** Componente compacto presente en la cabecera del Mostrador y de la Caja mostrando el turno activo y comandas en espera.
- [ ] **Taquilla de Caja Modo Supermercado:** Lista tabular ultradensa navegable 100% con teclas de flecha `Arriba/Abajo`, llamada verbal del cliente y apertura rápida con `Enter` o `F9`.
- [ ] **Atajos F1-F12 Operativos:**
  - F1 (Ayuda), F2 (Efectivo directo), F3 (Datáfono), F4 (QR / Transferencia), F5 (Refrescar), F6 (Búsqueda turno), F8 (Anular comanda), F9 (Cobro Dividido), F12 (Emitir/Imprimir).
- [ ] **Cobro Dividido / Mixto Dinámico:** Permite fraccionar el pago en múltiples métodos, recalculando reactivamente el saldo restante y las vueltas en tiempo real hasta alcanzar exactamente `$0.00`.
- [ ] **Persistencia Local-First & Outbox:** Al emitir o cobrar una comanda, los datos se guardan de inmediato en IndexedDB y se sincronizan en segundo plano con Supabase.

## 4. Bucle DevTools y Automatización
- [ ] **Consola JS Limpia:** 0 errores y 0 advertencias críticas en la consola del navegador.
- [ ] **Auditoría Responsiva:** Renderizado verificado en vista de escritorio (1280px) y vista móvil compacta (375px).
- [ ] **Suite de Pruebas Vitest:** 100% de las pruebas automatizadas pasando exitosamente con cobertura $\ge 80\%$.
