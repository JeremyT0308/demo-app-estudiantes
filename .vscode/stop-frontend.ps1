$pidFile = Join-Path $PSScriptRoot ".frontend.pid"

if (-not (Test-Path $pidFile)) {
    Write-Host "[FRONT] No hay un servidor iniciado por VS Code para detener."
    exit 0
}

$frontendPid = Get-Content $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1

if ($frontendPid) {
    $process = Get-Process -Id $frontendPid -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $frontendPid -Force
        Write-Host "[FRONT] Servidor detenido."
    }
}

Remove-Item $pidFile -ErrorAction SilentlyContinue
