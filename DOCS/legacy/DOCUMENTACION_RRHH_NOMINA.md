# Documentación del Módulo de Recursos Humanos y Nómina (Pezcadería S.A.S)

Este documento detalla la arquitectura, funcionalidades y estándares de cálculo implementados en los módulos de **Personal (RRHH)** y **Nómina (Liquidación)** para cumplir con la legislación laboral colombiana y garantizar la integración directa con la contabilidad empresarial.

## 1. Arquitectura y Modelo de Datos

Los datos son persistidos a través del servicio central `localDb.ts` para garantizar sincronización en tiempo real y disponibilidad inter-módulos.

- **`Empleado`**: Registra toda la información vital del trabajador (ID, identificación, nombre, cargo, teléfono, fecha de ingreso, salario base, auxilio de transporte, tipo de contrato, riesgo ARL, estado y exoneración de parafiscales Ley 1607).
- **`NominaRegistro`**: Almacena el histórico inmutable de liquidaciones calculadas. Incluye un nuevo campo `tipoLiquidacion` (`REGULAR`, `VACACIONES`, `LIQUIDACION_FINAL`) que rastrea la naturaleza del pago.
- **`Gasto` (Integración Contable)**: Cuando una nómina se aprueba ("Pagar Gasto"), el sistema inyecta un registro en la matriz de gastos (`categoria: 'NÓMINA' | 'NÓMINA (VAC)' | 'LIQUIDACIÓN'`) referenciando el `id` de la nómina para un seguimiento del flujo de caja.

## 2. Motor de Personal (RRHH) - `HRView.tsx`

Este módulo actúa como el directorio maestro y centro de control documental.

### Funcionalidades Clave:
- **Gestión de Empleados:** Creación, edición, y desvinculación (cambio de estado a INACTIVO sin borrar data).
- **Historial de Pagos:** Permite visualizar los **últimos 12 registros de nómina** de un empleado específico, optimizando la consulta rápida sin sobrecargar la interfaz.
- **Motor Automático de Cartas:** 
  Generación dinámica de documentos listos para enviar, utilizando los datos en vivo del empleado:
  - **Certificado Laboral:** Construye una carta formal que certifica salario, cargo, contrato y fecha de ingreso. El tiempo verbal cambia automáticamente si el empleado está activo ("labora") o inactivo ("laboró").
  - **Carta de Recomendación:** Genera una plantilla de recomendación laboral profesional basada en el historial del empleado en la compañía.
  - *Función "Copiar Texto":* Un botón permite transferir instantáneamente el documento generado al portapapeles del sistema para pegarlo en Word o el correo electrónico.

## 3. Asistente de Liquidación (Wizard) - `PayrollView.tsx`

El motor contable ha sido refactorizado en un "Wizard" (asistente paso a paso) que previene errores humanos y separa las operaciones financieras en tres flujos distintos.

### Motor de Días Comerciales Laborales (360 días)
Para mantener consistencia total con la contabilidad colombiana, el sistema usa una función de días comerciales (`calcDiasComerciales(inicio, fin)`). 
- Asume todos los meses como de 30 días.
- Ajusta dinámicamente los meses con 31 días y los años bisiestos/febreros.
- Permite que, al escoger un periodo en el calendario, los *Días Base* se autocompleten sin cálculos manuales por parte de contabilidad.

### Flujo 1: Nómina Regular (`REGULAR`)
- Liquidación estándar quincenal o mensual.
- **Devengos:** Salario Base Proporcional, Auxilio de Transporte (si aplica, excluye a aprendices SENA o prestadores de servicios), Cálculo de Horas Extras Diurnas (recargo 1.25) y Nocturnas (recargo 1.75), Bonificaciones y Viáticos.
- **Deducciones:** Salud EPS (4%), Pensión AFP (4%), Préstamos y otras deducciones.
- **Apropiaciones de Empresa:** Calculadas en vivo (Salud empleador, Pensión empleador, Riesgos ARL, Parafiscales CCF y SENA, Provisiones de Prima, Cesantías, Intereses y Vacaciones).

### Flujo 2: Disfrute de Vacaciones (`VACACIONES`)
- Flujo especializado para cuando el empleado sale a descansar.
- **Diferencia Legal:** El empleado percibe su salario regular por el tiempo descansado, pero **no** percibe Auxilio de Transporte. 
- La ARL no se cobra por los días de disfrute vacacional.
- Su contabilización genera un Gasto específico (`NÓMINA (VAC)`).

### Flujo 3: Liquidación Definitiva (`LIQUIDACION_FINAL`)
- Destinado al pago de pasivos laborales a la finalización de un contrato.
- Calcula de forma sugerida los días base utilizando las fechas de inicio y fin que seleccione el operador.
- Calcula automáticamente los rubros basándose en las fórmulas de ley:
  - **Cesantías:** `(Salario Base + Aux. Transporte) * Días / 360`
  - **Intereses a las Cesantías:** `Cesantías * Días * 0.12 / 360`
  - **Prima de Servicios:** `(Salario Base + Aux. Transporte) * Días / 360`
  - **Vacaciones (Compensadas en dinero):** `Salario Base * Días / 720`
- El operador puede ajustar los *días pendientes* manualmente en cada cajón por separado (ej. si las vacaciones ya habían sido pagadas pero las cesantías no).
- Genera un egreso contable tipificado como `LIQUIDACIÓN`.

## 4. Notas de Implementación (Frontend & UI)
- Ambos módulos utilizan `SweetAlert2` para confirmaciones destructivas o monetarias, previniendo pagos accidentales o dobles contabilizaciones.
- Se ha incluido navegación contextual en forma de botones de **"Regresar"**, lo que permite abortar flujos en cualquier momento de manera segura.
- La tabla del panel de liquidación muestra de forma colorizada si el registro pertenece a una nómina normal, a vacaciones o a liquidaciones de finalización de contrato para facilitar auditorías de flujo de caja.
