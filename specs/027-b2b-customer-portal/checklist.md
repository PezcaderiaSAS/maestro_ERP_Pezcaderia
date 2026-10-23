# Lista de Verificación de Calidad: SPEC-027 — Portal B2B HORECA

**Especificación:** SPEC-027 — Portal de Clientes B2B Auto-Servicio HORECA  
**Fase:** /speckit.checklist (SDD v3.0)  
**Fecha:** 2026-10-23  

---

## 1. Seguridad, Aislamiento y Multi-Tenancy (OWASP & Supabase RLS)
- [ ] **Aislamiento Multi-Tenant:** Cada cliente HORECA autenticado solo puede consultar sus propios pedidos, remisiones y facturas.
- [ ] **Privacidad de Tarifas:** Ningún cliente puede inferir ni acceder a las listas de precios pactadas con otros restaurantes o cadenas competidoras.
- [ ] **Sesión Bimodal Segura:** Soporte para token de acceso directo por NIT/PIN y switch rápido autorizado para ejecutivos comerciales desde el ERP.
- [ ] **Validación en Fronteras:** Esquemas Zod estrictos aplicados a la entrada de cada mutación (pedidos, plantillas recurrentes, selección de cortes).

---

## 2. Negocio, Catch Weight & Cartera B2B
- [ ] **Manejo Híbrido de Peso:** Soporte bimodal transparente: piezas fijas calibradas y peso a granel estimado en kilogramos.
- [ ] **Ajuste de Báscula en Remisión:** Trazabilidad entre el peso solicitado en la orden y el peso real marcado por báscula en la remisión WMS.
- [ ] **Control de Cupo de Crédito:** Si el valor estimado supera el cupo disponible, la orden se enruta a `PENDIENTE_APROBACION_CARTERA` sin bloquear la operación de la cocina, o permite alternar a pago anticipado.
- [ ] **Motor de Plantillas Recurrentes:** Capacidad de re-ordenar con 1 solo toque táctil a partir de compras frecuentes previas.

---

## 3. Experiencia de Usuario & Ergonomía ("Regla del Niño de 12 Años")
- [ ] **Accesibilidad Táctil:** Todos los botones de acción e inputs tienen altura mínima $\ge 48\text{ px}$ (y botón principal de confirmación $\ge 52\text{ px}$).
- [ ] **Contraste WCAG 2.2 AA+:** Modo Claro con ratios de contraste superiores a 4.5:1 en textos estándar y 7:1 en valores monetarios.
- [ ] **Iconografía Semántica a Costo $0:** 100% iconos vectoriales Lucide React, cero etiquetas `<img>` con placeholders genéricos.
- [ ] **Lenguaje Claro:** Términos de cocina y compras sin jerga críptica de base de datos (*Entero Eviscerado*, *Filete con Piel*, *Caja con Hielo*, *Cupo Disponible*).

---

## 4. Arquitectura de Software & Resiliencia Offline
- [ ] **Principio de Responsabilidad Única (SOLID):** Desacoplamiento total entre componentes de vista, hooks reactivos y servicios de dominio.
- [ ] **Offline-First:** Capacidad de navegar el catálogo y armar el pedido en borrador local incluso ante intermitencia de red en cuartos fríos o cocinas subterráneas.
- [ ] **Inmutabilidad de Datos:** Creación de nuevos objetos y arrays en cada transición de estado en Zustand / Store.

---

## 5. Calidad, Pruebas y Certificación de Calidad
- [ ] **Compilación TypeScript:** Cero errores y cero advertencias (`npx tsc --noEmit`).
- [ ] **Pruebas Unitarias & Integración:** Cobertura de tests $\ge 80\%$ en servicios, esquemas Zod y hooks de pedido B2B.
- [ ] **Pruebas E2E (Playwright):** Validación del flujo completo de creación de orden, re-orden de plantilla y visualización de remisión.
- [ ] **Certificación DevTools:** Cero errores en consola de JavaScript y renderizado responsivo verificado en viewport de 375 px y tablet de 768 px.
