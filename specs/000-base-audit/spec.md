# Spec: 000-base-audit

## 1. Objetivo
Auditar el proyecto brownfield existente asegurando su estabilidad y configurando el entorno para el ciclo SDD según el protocolo v2.2.

## 2. Requisitos Funcionales
- **RF-1:** Iniciar el servidor de desarrollo (`vite`).
- **RF-2:** Ejecutar la inspección inicial obligatoria con Chrome DevTools (375 px).
- **RF-3:** Documentar errores actuales de consola (Warnings, Errors).
- **RF-4:** Inicializar `MEMORY.md` y estructura base de specs.

## 3. Requisitos No Funcionales
- No alterar la lógica existente.
- Toda información extraída de DevTools debe reflejarse en `MEMORY.md`.

## 4. Criterios de Aceptación
- [x] Aplicación levanta en `http://localhost:3000` u otro puerto asignado sin errores fatales de compilación.
- [x] Captura de vista móvil obtenida.
- [x] Lista de errores de consola compilada (0 errores, 0 advertencias).
