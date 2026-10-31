# Lista de Verificación de Calidad: SPEC-050
## Reestructuración UI/UX Integral de Compras, Muelle & Devoluciones B2B

- **Código:** SPEC-050
- **Fase:** Spec Kit SDD v3.0 — `/speckit.checklist`
- **Gobernanza:** Flujo Continuo Kanban (`WIP = 1`). TDD Quirúrgico estricto.
- **Estado:** PENDIENTE DE APROBACIÓN DEL USUARIO

---

## 1. Estándares de Ergonomía Táctil e Industrial (Ley de Fitts)

- [ ] **Targets Táctiles Sobredimensionados:** Botones de pesaje (*Capturar Pesada*, *Tara*, *Estabilizar*) con altura $\ge 48\text{px} - 64\text{px}$ (`min-h-[56px]`) y espaciado $\ge 12\text{px}$ entre botones para evitar pulsaciones erróneas de operarios con guantes.
- [ ] **Display Numérico de Alta Legibilidad:** Display de báscula con números en `font-mono text-3xl font-black text-slate-100` con indicador de estabilidad visual (punto pulsante esmeralda `#10B981` al estabilizar).
- [ ] **Acceso Rápido por Teclado Físico:** Atajos opcionales de teclado en muelle (Barra espaciadora o Enter para *Capturar Pesada*, `T` para *Tara*, `Esc` para *Cancelar*).

---

## 2. Atmósfera Visual Dark Glassmorphism 60-30-10 & WCAG 2.1 AAA

- [ ] **Superficie 60%:** Fondo Void Deep Blue (`bg-[#0B0F19]`).
- [ ] **Superficie 30%:** Tarjetas de paso translúcidas en Slate (`bg-[#131C2E]/70 backdrop-blur-xl border border-slate-800/80 rounded-2xl`).
- [ ] **Acentos 10%:**
  - Cian `#00F2FE`: Lectura de báscula activa, pesada en curso.
  - Esmeralda `#10B981`: Pesada estable y confirmada, merma tolerable $\le 3\%$.
  - Ámbar `#F59E0B`: Merma en alerta ($3\% - 7\%$), tara activa.
  - Rojo Merma `#EF4444`: Merma crítica $> 7\%$, rechazo organoléptico INVIMA.
- [ ] **Contraste WCAG AAA:** Ratios de contraste $\ge 7:1$ para todos los textos numéricos y etiquetas operativas sobre superficies oscuras.

---

## 3. Integridad de Datos y Esquemas Zod

- [ ] **Validación de Pesaje:** Todo registro de pesada debe validar contra `purchasesBucaramanga.schema.ts` (`pesoBruto > tara`, `tara > 0`, `pesoNeto > 0`).
- [ ] **Inspección Organoléptica INVIMA:** Cumplimiento de `dockReceiving.schema.ts` con opciones estrictas:
  - Ojos: *Brillantes y salientes* vs *Opacos y hundidos*.
  - Agallas: *Rojo vivo* vs *Pálidas / Marrón*.
  - Olor: *Fresco a mar / neutro* vs *Fuerte / amoniacal*.
  - Textura muscular: *Firme y elástica* vs *Blanda / flácida*.
- [ ] **Conciliación de Mermas de Transporte:** Cálculo matemático determinista:
  $$\text{Merma \%} = \frac{\text{Kilos Guía} - \text{Kilos Báscula}}{\text{Kilos Guía}} \times 100$$

---

## 4. Resiliencia y Cero Regresiones

- [ ] **Compatibilidad de Tests:** La suite existente `bucaramangaReceivingWizard.test.tsx` (10/10) debe seguir pasando al 100%.
- [ ] **Soporte Offline & Báscula RS232 / WebUSB:** `useBalanza` debe alternar fluidamente entre hardware físico y modo simulación sin bloquear la interfaz.
- [ ] **DevTools MCP en Vivo:** Verificación de 0 errores fatales en consola JS y renderizado en escritorio (1280px) y móvil (375px).
