# Checklist de Calidad y Estándares de Industria: SPEC-019

**Código:** SPEC-019  
**Título:** Optimización de Legibilidad, Ergonometría Táctil y Desbordamiento en Medios de Pago POS  
**Estado:** DRAFT (Esperando Aprobación Humana)  
**Fase de Ciclo:** Spec Kit v3.0 — `/speckit.checklist`  

---

## 1. Cero Desbordamiento y Legibilidad Tipográfica (WCAG 2.2 AA / AAA)
- [ ] **CH-01:** Ninguna etiqueta de medio de pago contiene truncado artificial (`truncate`, `text-ellipsis` o `...`). Las palabras `Efectivo`, `Transferencia`, `Nequi`, `Daviplata`, `QR Bancolombia`, `Datáfono` y `Crédito` son 100% visibles y legibles en cualquier resolución de pantalla $\ge 320\text{ px}$.
- [ ] **CH-02:** Los textos de los botones principales y sub-píldoras poseen una relación de contraste cromático $\ge 4.5:1$ (AA) para textos pequeños y $\ge 7:1$ (AAA) para textos activos o primarios sobre fondo de contenedor.
- [ ] **CH-03:** En pantallas de escritorio / laptop estándar con sidebar de $340-380\text{ px}$, el contenedor de medios de pago no desborda horizontalmente ni genera barra de desplazamiento horizontal.

---

## 2. Ergonomía Táctil y Espaciado Físico (Target Size)
- [ ] **CH-04:** Los 4 botones principales (`Efectivo`, `Transferencia`, `Datáfono`, `Crédito`) tienen un tamaño táctil mínimo garantizado de $150 \times 50\text{ px}$, superando el estándar WCAG AAA de $48 \times 48\text{ px}$.
- [ ] **CH-05:** Las 3 sub-píldoras de transferencias (`Nequi`, `Daviplata`, `QR Bancolombia`) tienen un área táctil mínima de $96 \times 44\text{ px}$ con separación física (`gap-1.5`) para prevenir toques accidentales adyacentes.
- [ ] **CH-06:** En modo Split (`+ Split`), cada input numérico `NumericFormat` tiene una altura mínima de $44\text{ px}$ con borde visible `border-slate-300` y foco `ring-2 ring-indigo-500`.

---

## 3. Semántica Visual e Iconografía Diferenciada (Rico UI & Google Stitch)
- [ ] **CH-07:** Nequi y Daviplata tienen iconos y acentos cromáticos completamente diferenciados: Nequi utiliza `Smartphone` con acento morado/fucsia (`fuchsia-600`), y Daviplata utiliza `Wallet` con acento rojo (`rose-600`).
- [ ] **CH-08:** QR Bancolombia implementa el icono `QrCode` con acento ámbar/dorado (`amber-600`), Datáfono implementa `CreditCard` azul (`sky-600`), Efectivo implementa `Banknote` verde (`emerald-600`), y Crédito implementa `Landmark` gris (`slate-700`).
- [ ] **CH-09:** El estado seleccionado cuenta con doble indicador accesible: cambio de fondo a tono suave de marca, borde contrastado de 2px y anillo de foco `ring-2`.

---

## 4. Eficiencia Operativa y Atajos de Teclado Físico
- [ ] **CH-10:** Los atajos de teclado `F1` (Efectivo), `F2` (Transferencia), `F3` (Datáfono), `F4` (Crédito) responden al instante sin necesidad de usar el mouse.
- [ ] **CH-11:** Cuando `Transferencia` está activa, las teclas numéricas `1` (Nequi), `2` (Daviplata) y `3` (QR Bancolombia) permiten seleccionar el destino sin conflicto con la digitación numérica en inputs.
- [ ] **CH-12:** La tecla `Enter` y el botón primario `Cobrar` ($\ge 56\text{ px}$) ejecutan el cobro de la venta con el medio seleccionado.
- [ ] **CH-13:** El botón `Exacto` y la tecla `Espacio` en Efectivo completan el valor recibido de forma inmediata.

---

## 5. Calidad de Software, TDD y DevTools Loop
- [ ] **CH-14:** Pruebas unitarias en Vitest para `PaymentPanel.tsx` validando selección de medios principales, despliegue de sub-píldoras de transferencia y cálculo de cambio.
- [ ] **CH-15:** Verificación estricta de TypeScript (`npx tsc --noEmit`) con 0 errores de tipos.
- [ ] **CH-16:** Bucle Chrome DevTools: 0 errores y 0 warnings en la consola de JavaScript.
- [ ] **CH-17:** Inspección responsiva móvil en 375 px y laptop en 1268 px sin truncamiento ni desbordamiento.
