@echo off
title Iniciar La Pezcadería ERP
echo ======================================================
echo   Iniciando Servidor de Desarrollo - La Pezcaderia ERP
echo ======================================================
echo.

:: Abre el navegador en el puerto por defecto de Vite
echo Abriendo aplicacion en el navegador...
start "" "http://localhost:3000"

:: Inicia el servidor de desarrollo de acuerdo al lockfile disponible
if exist pnpm-lock.yaml (
    echo [INFO] pnpm-lock.yaml detectado. Usando pnpm...
    pnpm dev
) else if exist package-lock.json (
    echo [INFO] package-lock.json detectado. Usando npm...
    npm run dev
) else (
    echo [INFO] Usando ejecucion por defecto (npm run dev)...
    npm run dev
)

pause
