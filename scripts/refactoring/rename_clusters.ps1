# The API key must be provided via the environment variable OPENAI_API_KEY
$env:OPENAI_BASE_URL = "https://api.groq.com/openai/v1"
$env:PATH = "C:\Users\usuario\.local\bin;$env:PATH"

Write-Host "Iniciando el renombrado de clústeres usando Groq (Llama 3 8B)..." -ForegroundColor Cyan
graphify cluster-only . --backend openai --model llama3-8b-8192

Write-Host "`n¡Proceso finalizado! Revisa el archivo graph.html para ver los nuevos nombres." -ForegroundColor Green
