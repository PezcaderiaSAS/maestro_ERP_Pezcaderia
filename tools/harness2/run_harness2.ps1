# ==============================================================================
# Script PowerShell para Ejecución Segura de Harness² en Español (es-419) a Costo $0
# ==============================================================================
param (
    [switch]$Demo = $false,
    [string]$Bench = "jb",
    [string]$Mode = "sequential",
    [int]$K = 1,
    [int]$MaxTasks = 1,
    [switch]$DryRun = $false
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$VenvPython = Join-Path $ScriptDir ".venv\Scripts\python.exe"
$RunnerPy = Join-Path $ScriptDir "run_harness2.py"

if (-not (Test-Path $VenvPython)) {
    Write-Error "El entorno virtual en '$VenvPython' no fue encontrado. Ejecute 'uv venv .venv' primero."
    exit 1
}

$ArgsList = @($RunnerPy)

if ($Demo) {
    $ArgsList += "--demo"
} else {
    $ArgsList += "--bench", $Bench
}

$ArgsList += "--mode", $Mode
$ArgsList += "--k", $K
$ArgsList += "--max-tasks", $MaxTasks

if ($DryRun) {
    $ArgsList += "--dry-run"
}

# Ejecutar el runner Python con los argumentos especificados
& $VenvPython @ArgsList
