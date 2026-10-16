# SPEC-019: Optimización de Legibilidad, Ergonometría Táctil y Desbordamiento en Medios de Pago POS

## 1. Resumen Ejecutivo y Propósito (EARS Notation)
- **Problema:** En la vista de caja del Punto de Venta (`PaymentPanel.tsx`), los botones de selección de medios de pago sufrían un colapso de desbordamiento horizontal severo debido a la clase `sm:grid-cols-6` dentro de una columna lateral fija de ~340px en pantallas de escritorio y laptop (viewport $\ge 640\text{ px}$). Cada botón se comprimía a ~55px de ancho, forzando un truncado de texto que generaba etiquetas ilegibles e ininteligibles: **"Ef..."**, **"N..."**, **"D..."**, **"Q..."**, **"D..."** y **"C..."**. Además, Nequi y Daviplata compartían el mismo icono genérico telefónico (`Phone`), y existía una discrepancia de atajos entre la cabecera y el tooltip.
- **Propósito:** Reestructurar ergonómicamente el contenedor de medios de pago bajo los estándares de **Rico UI**, **Google Stitch** y los tokens canónicos de **Light Mode WCAG 2.2 AA+** (`.agents/skills/erp-pos-design-tokens/SKILL.md`).
- **Solución Acordada en `/grill-me`:**
  1. **Jerarquía 4+3:** Reducir la botonera principal a 4 botones macro en grilla ergonómica 2x2 (`[💵 Efectivo]`, `[📲 Transferencia]`, `[💳 Datáfono]`, `[🏛️ Crédito]`), con un ancho generoso de ~160px $\times \ge 50\text{px}$ cada uno.
  2. **Sub-píldoras de Transferencias:** Al seleccionar `Transferencia`, se activa una sub-barra accesible con 3 píldoras semánticas diferenciadas (`[🟣 Nequi]`, `[🔴 Daviplata]`, `[🟡 QR Bancolombia]`) de ~105px cada una, con cero truncado y colores de marca.
  3. **Atajos Armónicos:** `F1` Efectivo, `F2` Transferencia (con sub-atajos `1` Nequi, `2` Daviplata, `3` QR Bancolombia), `F3` Datáfono, `F4` Crédito; y `Enter` para Cobrar.
  4. **Modo Split (+ Split):** Grilla de 2 columnas con iconos diferenciados y inputs táctiles de $44\text{ px}$.

### Especificación de Requisitos EARS
- **[Ubiquitous]** El sistema POS siempre debe mostrar el nombre completo de cada medio de pago sin puntos suspensivos (`truncate`), con contraste de texto WCAG AAA ($\ge 7:1$) sobre fondo blanco/slate.
- **[Event-driven]** Cuando el cajero seleccione `Transferencia` (vía clic o tecla `F2`), el panel debe desplegar suavemente la barra de sub-métodos con Nequi preseleccionado, permitiendo alternar a Daviplata o QR Bancolombia en 1 solo clic o con teclas `1`, `2`, `3`.
- **[Event-driven]** Cuando el cajero presione `F1-F4`, el sistema debe enfocar o activar el medio de pago correspondiente sin necesidad de interacción con el cursor.
- **[State-driven]** Mientras el modo `+ Split` esté activo, el panel debe presentar los 6 campos de recaudo con sus iconos específicos (`Banknote`, `Smartphone`, `Wallet`, `QrCode`, `CreditCard`, `Landmark`), actualizando el estado de cuadre (Exacto / Faltante / Sobrante).
- **[Unwanted Behavior]** En ningún caso un botón de medio de pago debe tener un ancho inferior a $90\text{ px}$ ni una altura menor a $48\text{ px}$.

---

## 2. Modelado de Sistema Multi-Fase Mandatorio (Mermaid.js)

### 2.1. Diagrama 1: Flujo de Proceso Secuencial (Process Flowchart)
```mermaid
graph TD
    A([Inicio: Carrito POS con Ítems]) --> B[Visualizar Resumen y Total a Cobrar]
    B --> C{¿Modo de Cobro?}
    
    %% Modo Cobro Único
    C -->|Cobro Único| D[Grid Ergonómico 2x2: Efectivo F1, Transferencia F2, Datáfono F3, Crédito F4]
    
    D -->|F1: Efectivo| E[Activar Efectivo: Input NumericFormat + Billetes Rápidos + Visor Cambio]
    D -->|F2: Transferencia| F[Activar Barra Sub-píldoras: Nequi 1, Daviplata 2, QR 3]
    D -->|F3: Datáfono| G[Activar Datáfono: Tarjeta de Crédito/Débito]
    D -->|F4: Crédito| H[Activar Crédito: Cartera AR Cliente]
    
    F --> F1{¿Sub-método elegido?}
    F1 -->|1 / Clic| F2[Nequi - Icono Smartphone Morado]
    F1 -->|2 / Clic| F3[Daviplata - Icono Wallet Rojo]
    F1 -->|3 / Clic| F4[QR Bancolombia - Icono QrCode Ámbar]
    
    %% Modo Cobro Mixto (+ Split)
    C -->|Cobro Mixto + Split| I[Grid 2 Columnas de Medios Mixtos con Iconos Diferenciados]
    I --> J[Digitar Montos Distribuidos en Inputs >= 44px]
    J --> K{¿Balance Exacto?}
    K -->|Faltante| L[Badge Ámbar: Faltante]
    K -->|Exacto| M[Badge Verde: Cuadrado Exacto]
    K -->|Sobrante| N[Badge Azul: Sobrante / Cambio]
    
    E --> Z([Pagar / Emitir Ticket])
    F2 --> Z
    F3 --> Z
    F4 --> Z
    G --> Z
    H --> Z
    M --> Z
```

### 2.2. Diagrama 2: Lógica de Decisión y Edge Cases (Decision Logic Diagram)
```mermaid
graph TD
    A{Evento: Tecla o Clic en Panel de Pago}
    
    %% Selección de Categoría
    A -->|Tecla F1 o Clic Efectivo| B[Seleccionar EFECTIVO]
    A -->|Tecla F2 o Clic Transferencia| C{¿Estaba en Transferencia?}
    C -->|No| D[Activar TRANSFERENCIA con NEQUI por defecto]
    C -->|Sí| E[Ciclar al siguiente: Nequi -> Daviplata -> QR -> Nequi]
    
    A -->|Tecla 1 mientras está en Transferencia| F[Forzar selección a NEQUI]
    A -->|Tecla 2 mientras está en Transferencia| G[Forzar selección a DAVIPLATA]
    A -->|Tecla 3 mientras está en Transferencia| H[Forzar selección a QR_BANCOLOMBIA]
    
    A -->|Tecla F3 o Clic Datáfono| I[Seleccionar DATAFONO]
    A -->|Tecla F4 o Clic Crédito| J{¿Cliente Registrado con Cupo?}
    J -->|Sí| K[Seleccionar CREDITO]
    J -->|No| L[Alerta SweetAlert2: Seleccionar Cliente B2B/Registrado]
    
    A -->|Tecla Espacio| M[Llenar Efectivo Recibido con Monto Exacto]
```

### 2.3. Diagrama 3: Modelo Entidad-Relación (Entity Relationship Diagram)
```mermaid
erDiagram
    VENTA ||--o{ PAGO_VENTA : liquida_con
    PAGO_VENTA }o--|| METODO_PAGO : clasificado_en

    VENTA {
        uuid id PK
        string consecutivo
        numeric subtotal
        numeric descuento
        numeric total_final
        string estado
        uuid tenant_id
    }

    PAGO_VENTA {
        uuid id PK
        uuid venta_id FK
        string metodo_pago "EFECTIVO|NEQUI|DAVIPLATA|QR_BANCOLOMBIA|DATAFONO|CREDITO"
        numeric monto
        numeric monto_recibido
        numeric cambio
        string referencia
        uuid tenant_id
    }

    METODO_PAGO {
        string codigo PK
        string categoria "EFECTIVO|TRANSFERENCIA|DATAFONO|CREDITO"
        string sub_metodo "NEQUI|DAVIPLATA|QR_BANCOLOMBIA|NONE"
        string label_completo
        string icono_lucide
        string color_hex
        string atajo_teclado
    }
```

### 2.4. Diagrama 4: Secuencia Temporal de Interacción (Sequence Diagram)
```mermaid
sequenceDiagram
    autonumber
    actor Cajero
    participant PaymentPanel as PaymentPanel.tsx
    participant SubPills as TransferSubPills
    participant CartPanel as CartPanel.tsx
    participant Supabase as Supabase RPC

    Cajero->>PaymentPanel: Clic en [📲 Transferencia] o presiona [F2]
    PaymentPanel->>PaymentPanel: setCategoriaPrincipal('TRANSFERENCIA')
    PaymentPanel->>PaymentPanel: setMetodoPago('NEQUI')
    PaymentPanel->>SubPills: Renderiza píldoras [Nequi* | Daviplata | QR]
    
    opt Cajero cambia a Daviplata
        Cajero->>SubPills: Clic en [🔴 Daviplata] o tecla [2]
        SubPills->>PaymentPanel: setMetodoPago('DAVIPLATA')
        PaymentPanel-->>PaymentPanel: Actualiza píldora activa con anillo rojo
    end

    Cajero->>PaymentPanel: Clic en [Cobrar Venta F2/Enter]
    PaymentPanel->>CartPanel: onPagar([{ metodo: 'DAVIPLATA', monto: totalFinal }])
    CartPanel->>Supabase: rpc('registrar_venta_pos', payload)
    Supabase-->>CartPanel: { ok: true, ticket: 'FAC-0981' }
    CartPanel-->>Cajero: Feedback de éxito y ticket térmico
```

### 2.5. Diagrama 5: Arquitectura de Componentes (Component Architecture)
```mermaid
graph TD
    subgraph CartPanel [src/views/pos/components/CartPanel.tsx]
        subgraph PaymentPanel [src/views/pos/components/PaymentPanel.tsx]
            Header[Header: 'Medio de Pago' F1-F4 + Botón '+ Split']
            
            subgraph SingleMode [Modo Cobro Único]
                Grid2x2[Grid 2x2: Macro-Medios de Pago ~160px cada uno]
                BtnEf[Botón Efectivo F1]
                BtnTr[Botón Transferencia F2]
                BtnDa[Botón Datáfono F3]
                BtnCr[Botón Crédito F4]
                
                SubTrans[Sub-Barra Transferencias ~105px cada píldora]
                PillNequi[Píldora Nequi 1]
                PillDavi[Píldora Daviplata 2]
                PillQR[Píldora QR Bancolombia 3]
            end
            
            subgraph CashDetails [Detalles de Efectivo]
                InputRecibido[NumericFormat Recibido + Botón Exacto]
                QuickBills[Billetes Rápidos: 10k, 20k, 50k, 100k]
                ChangeVisor[Visor de Cambio / Vuelto Grande]
            end
            
            subgraph SplitMode [Modo Split Mixto]
                SplitGrid[Grid 2 Columnas con Iconos Semánticos Diferenciados]
                SplitStatus[Insignia Dinámica: Exacto / Faltante / Sobrante]
            end
            
            MainAction[Botón Primario Cobrar >= 56px + Botón Limpiar]
        end
    end

    Grid2x2 --> BtnEf
    Grid2x2 --> BtnTr
    Grid2x2 --> BtnDa
    Grid2x2 --> BtnCr
    BtnTr -.->|Al activarse| SubTrans
    SubTrans --> PillNequi
    SubTrans --> PillDavi
    SubTrans --> PillQR
```

---

## 3. Matriz Canónica de Tokens UI/UX y Acentos

| Medio / Sub-método | Label Completo | Icono Lucide | Contenedor Activo | Borde Activo | Texto / Icono Activo | Shortcut |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Efectivo** | `Efectivo` | `Banknote` | `bg-emerald-50` | `border-emerald-500` | `text-emerald-700` | `[F1]` |
| **Transferencia** | `Transferencia` | `Smartphone` | `bg-indigo-50` | `border-indigo-500` | `text-indigo-700` | `[F2]` |
| *↳ Sub: Nequi* | `Nequi` | `Smartphone` | `bg-fuchsia-50` | `border-fuchsia-500` | `text-fuchsia-700` | `[1]` |
| *↳ Sub: Daviplata* | `Daviplata` | `Wallet` | `bg-rose-50` | `border-rose-500` | `text-rose-700` | `[2]` |
| *↳ Sub: QR Bancolombia*| `QR Bancolombia` | `QrCode` | `bg-amber-50` | `border-amber-500` | `text-amber-700` | `[3]` |
| **Datáfono** | `Datáfono` | `CreditCard` | `bg-sky-50` | `border-sky-500` | `text-sky-700` | `[F3]` |
| **Crédito** | `Crédito` | `Landmark` | `bg-slate-100` | `border-slate-500` | `text-slate-800` | `[F4]` |
