# Script para limpiar carpetas 'graphify-out' duplicadas
# Mantendremos la carpeta principal en la raíz que contiene la historia y los datos completos.

$rootDir = "c:\Users\usuario\OneDrive\Documentos\Aplicaciones Pezca\MaestroPescaderia"

# Las rutas parciales que contienen información redundante
$redundantDirs = @(
    "$rootDir\.agent\graphify-out",
    "$rootDir\.agents\graphify-out",
    "$rootDir\src\graphify-out",
    "$rootDir\Ejemplos\graphify-out"
)

Write-Host "Iniciando unificación de directorios graphify-out..." -ForegroundColor Cyan

foreach ($dir in $redundantDirs) {
    if (Test-Path -Path $dir) {
        Write-Host "Eliminando directorio duplicado: $dir" -ForegroundColor Yellow
        Remove-Item -Path $dir -Recurse -Force
    } else {
        Write-Host "Directorio no encontrado (ya eliminado): $dir" -ForegroundColor DarkGray
    }
}

Write-Host "`nEl directorio principal y más útil se conserva en:" -ForegroundColor Green
Write-Host "$rootDir\graphify-out" -ForegroundColor Green
Write-Host "`n¡Unificación completada con éxito!" -ForegroundColor Cyan
