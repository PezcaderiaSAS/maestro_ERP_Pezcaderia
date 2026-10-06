---
name: local-dates
description: Checklist estricto para operar siempre con fechas locales y nunca UTC al calcular rachas, semanas e historiales.
---

# Gestión Estricta de Fechas Locales — Protocolo v2.2

En La Pezcadería ERP, los desfases de horario con UTC provocan errores graves en:
- Cierres y arqueos de caja ciega (turnos nocturnos o matutinos registrados en fechas erróneas).
- Trazabilidad de lotes perecederos (fechas de vencimiento FEFO).
- Rachas, historiales y métricas semanales/mensuales de usuarios y clientes.

## 1. Principio Innegociable
> **NUNCA usar `new Date().toISOString()` o métodos basados en UTC directamente para lógica de negocio de usuarios o cálculos de días.**
> Operar siempre en la **zona horaria local del cliente o negocio (`America/Bogota` / Colombia UTC-5)**.

## 2. Checklist Obligatorio para Desarrolladores

- [ ] **Al formatear fechas para la UI o reportes:**
  - Usar utilidades locales como `date-fns` con locale en español (`es`) o helpers de fecha local.
  - Formato ISO con offset local explícito o representación de día `YYYY-MM-DD` basada en componentes locales (`getFullYear()`, `getMonth()`, `getDate()`).
- [ ] **Al agrupar transacciones por día o semana:**
  - Obtener el inicio y fin del día en la medianoche local:
    ```typescript
    // Correcto:
    const startOfDay = new Date(year, month, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month, day, 23, 59, 59, 999);
    ```
- [ ] **Al enviar fechas a Supabase / PostgreSQL:**
  - Almacenar marcas temporales con tipo `TIMESTAMPTZ` preservando el offset horario.
  - Para campos estrictos de fecha contable (sin hora), usar tipo `DATE` en formato `YYYY-MM-DD` basado en el calendario local.
- [ ] **Evitar el "Bug del día anterior":**
  - Si un usuario ingresa una venta a las 8:00 PM (hora Colombia), convertir a UTC la llevaría a la 1:00 AM del día siguiente. Prohibido comparar `toISOString().split('T')[0]` sin compensación horaria.

## 3. Pruebas Automatizadas
Todo test que involucre fechas debe ejecutarse considerando explícitamente el timezone local o mockeando la fecha con reloj local fijo.
