@echo off
echo =======================================================
echo ERP Maestro Pescaderia - Restructuracion de Documentos
echo =======================================================
echo Creando directorio DOCS\legacy...
if not exist "DOCS\legacy" mkdir "DOCS\legacy"

echo Moviendo archivos historicos y de referencia a DOCS\legacy...

move "DOCUMENTACION.md" "DOCS\legacy\" >nul 2>&1
move "DOCUMENTACION_FASE_5.md" "DOCS\legacy\" >nul 2>&1
move "reporte_evaluacion_completo.md" "DOCS\legacy\" >nul 2>&1
move "flujos_funcionales_pezca_erp.md" "DOCS\legacy\" >nul 2>&1
move "DOCUMENTACION_ERP_WMS_PEZCADERIA.md" "DOCS\legacy\" >nul 2>&1
move "plan_arquitectura_unificada_pezca.md" "DOCS\legacy\" >nul 2>&1
move "DOCUMENTACION_DEVOLUCIONES_FINANZAS.md" "DOCS\legacy\" >nul 2>&1
move "DOCUMENTACION_INTEGRACION_RAPPI.md" "DOCS\legacy\" >nul 2>&1
move "DOCUMENTACION_PRODUCTOS.md" "DOCS\legacy\" >nul 2>&1
move "DOCUMENTACION_RRHH_NOMINA.md" "DOCS\legacy\" >nul 2>&1

echo Proceso completado exitosamente.
echo =======================================================
pause
