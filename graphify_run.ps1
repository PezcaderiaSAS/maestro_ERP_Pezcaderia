$env:GEMINI_API_KEY="YOUR_API_KEY_HERE"
$env:GOOGLE_API_KEY="YOUR_API_KEY_HERE"
Write-Host "Running graphify with configured API key..." -ForegroundColor Cyan
graphify $args
