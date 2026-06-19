@echo off
echo =======================================================
echo ERP Maestro Pescaderia - Agrupacion de Diagramas
echo =======================================================
echo Creando directorio DOCS\Diagramas...
if not exist "DOCS\Diagramas" mkdir "DOCS\Diagramas"

echo Moviendo archivos de diagramas (.mmd) a DOCS\Diagramas...

move "diagrama_flujo_10_creditos_proveedores.mmd" "DOCS\Diagramas\" >nul 2>&1
move "diagrama_flujo_11_creacion_productos.mmd" "DOCS\Diagramas\" >nul 2>&1
move "diagrama_flujo_12_creacion_categorias_precios.mmd" "DOCS\Diagramas\" >nul 2>&1
move "diagrama_flujo_13_empleados_roles.mmd" "DOCS\Diagramas\" >nul 2>&1
move "diagrama_flujo_14_flujos_caja.mmd" "DOCS\Diagramas\" >nul 2>&1
move "diagrama_flujo_15_registros_contables.mmd" "DOCS\Diagramas\" >nul 2>&1
move "diagrama_flujo_16_gastos_egresos.mmd" "DOCS\Diagramas\" >nul 2>&1
move "diagrama_flujo_cotizacion.mmd" "DOCS\Diagramas\" >nul 2>&1
move "diagrama_funcional_erp.mmd" "DOCS\Diagramas\" >nul 2>&1
move "diagrama_secuencia_pos.mmd" "DOCS\Diagramas\" >nul 2>&1
move "diagrama_secuencia_pos_manual.mmd" "DOCS\Diagramas\" >nul 2>&1

echo Proceso completado exitosamente.
echo =======================================================
pause
