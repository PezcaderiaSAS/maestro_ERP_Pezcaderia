# The API key must be provided via the environment variable GEMINI_API_KEY
$env:PATH = "C:\Users\usuario\.local\bin;$env:PATH"

Write-Host "Iniciando proceso solo para los archivos faltantes..." -ForegroundColor Cyan

Write-Host "`n--- Procesando '.agent' ---" -ForegroundColor Yellow
graphify .agent --backend gemini
Start-Sleep -Seconds 15

Write-Host "`n--- Procesando '.agents' ---" -ForegroundColor Yellow
graphify .agents --backend gemini
Start-Sleep -Seconds 15

Write-Host "`n--- Procesando 'Ejemplos' ---" -ForegroundColor Yellow
graphify Ejemplos --backend gemini
Start-Sleep -Seconds 15

Write-Host "`n--- Procesando archivos de la Raíz ---" -ForegroundColor Yellow
graphify . --backend gemini

Write-Host "`n¡Listo! Generando el grafo global..." -ForegroundColor Cyan
graphify cluster-only .

Write-Host "`n¡Proceso finalizado! Revisa el reporte graph.html en la carpeta principal." -ForegroundColor Green
