# The API key must be provided via the environment variable GEMINI_API_KEY

Write-Host "Esperando 35 segundos para evitar el límite de la cuota de Gemini (Error 429)..." -ForegroundColor Yellow
Start-Sleep -Seconds 35

Write-Host "Iniciando el renombrado de clústeres..." -ForegroundColor Cyan
graphify cluster-only .

Write-Host "`n¡Proceso finalizado! Revisa el archivo graph.html para ver los nuevos nombres." -ForegroundColor Green
