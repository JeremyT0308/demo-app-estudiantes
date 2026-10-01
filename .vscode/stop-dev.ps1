$frontendPidFile = Join-Path $PSScriptRoot ".frontend.pid"
$watcherPidFile = Join-Path $PSScriptRoot ".browser-watcher.pid"

# El watcher normalmente termina solo despues de abrir el navegador.
# Si Debug se detiene antes, lo cerramos para que no abra una pagina mas tarde.
if (Test-Path $watcherPidFile) {
    $watcherPid = Get-Content $watcherPidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($watcherPid) {
        $watcher = Get-Process -Id $watcherPid -ErrorAction SilentlyContinue
        if ($watcher) {
            Stop-Process -Id $watcherPid -Force -ErrorAction SilentlyContinue
        }
    }
    Remove-Item $watcherPidFile -ErrorAction SilentlyContinue
}

# Solo detenemos el frontend si fue creado por esta sesion de Debug.
# Si 5500 ya estaba ocupado antes de F5, start-dev no guarda ningun PID.
if (Test-Path $frontendPidFile) {
    $frontendPid = Get-Content $frontendPidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($frontendPid) {
        $frontend = Get-Process -Id $frontendPid -ErrorAction SilentlyContinue
        if ($frontend) {
            Stop-Process -Id $frontendPid -Force -ErrorAction SilentlyContinue
            Write-Host "[FRONT] Servidor detenido."
        }
    }
    Remove-Item $frontendPidFile -ErrorAction SilentlyContinue
}
