$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $workspaceRoot "frontend"
$frontendPidFile = Join-Path $PSScriptRoot ".frontend.pid"
$watcherPidFile = Join-Path $PSScriptRoot ".browser-watcher.pid"
$frontendPort = 5500
$backendPort = 8080

# Evitamos arrancar una segunda instancia de Spring Boot sobre 8080.
$backendListener = Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($backendListener) {
    throw "El puerto $backendPort ya esta ocupado. Deten la instancia anterior de Spring Boot y vuelve a presionar F5."
}

# Si una ejecucion anterior de ESTE proyecto dejo el frontend abierto, lo cerramos primero.
# Esto garantiza que F5 siempre sirva los archivos actuales y no una carpeta vieja.
if (Test-Path $frontendPidFile) {
    $oldFrontendPid = Get-Content $frontendPidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($oldFrontendPid) {
        $oldFrontend = Get-Process -Id $oldFrontendPid -ErrorAction SilentlyContinue
        if ($oldFrontend) {
            Stop-Process -Id $oldFrontendPid -Force -ErrorAction SilentlyContinue
            Start-Sleep -Milliseconds 350
        }
    }
    Remove-Item $frontendPidFile -ErrorAction SilentlyContinue
}

Remove-Item $watcherPidFile -ErrorAction SilentlyContinue

# No reutilizamos cualquier proceso que ya este en 5500.
# Podria ser un servidor Python abierto desde otra copia del proyecto y mostrar un frontend antiguo.
$frontendListener = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($frontendListener) {
    $owner = Get-Process -Id $frontendListener.OwningProcess -ErrorAction SilentlyContinue
    $ownerName = if ($owner) { $owner.ProcessName } else { "PID $($frontendListener.OwningProcess)" }
    throw "El puerto $frontendPort ya esta ocupado por $ownerName. Cierra ese servidor y vuelve a presionar F5 para garantizar que se sirva el frontend de esta carpeta."
}

if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonExe = (Get-Command python).Source
    $pythonArgs = @("-m", "http.server", "$frontendPort", "--bind", "127.0.0.1")
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonExe = (Get-Command py).Source
    $pythonArgs = @("-3", "-m", "http.server", "$frontendPort", "--bind", "127.0.0.1")
} else {
    throw "No se encontro Python 3. Instala Python o inicia el frontend manualmente en el puerto $frontendPort."
}

Write-Host "[FRONT] Carpeta: $frontendPath"
Write-Host "[FRONT] Iniciando servidor limpio en http://localhost:$frontendPort ..."

Start-Process `
    -FilePath $pythonExe `
    -ArgumentList $pythonArgs `
    -WorkingDirectory $frontendPath `
    -WindowStyle Hidden | Out-Null

$frontendListener = $null
for ($i = 0; $i -lt 24; $i++) {
    Start-Sleep -Milliseconds 250
    $frontendListener = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($frontendListener) { break }
}

if (-not $frontendListener) {
    throw "El frontend no pudo iniciar en el puerto $frontendPort."
}

Set-Content -Path $frontendPidFile -Value $frontendListener.OwningProcess
Write-Host "[FRONT] Listo en http://localhost:$frontendPort"

# El query string evita que el navegador reutilice index/CSS/JS de una version anterior.
$frontendUrl = "http://localhost:$frontendPort/?ui=luxury-v5"
$watcherScript = Join-Path $PSScriptRoot "open-browser-when-ready.ps1"
$watcher = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", "`"$watcherScript`"",
        "-BackendPort", "$backendPort",
        "-FrontendUrl", "$frontendUrl"
    ) `
    -WindowStyle Hidden `
    -PassThru

Set-Content -Path $watcherPidFile -Value $watcher.Id
Write-Host "[APP] Preparacion terminada. VS Code ya puede iniciar Spring Boot en Debug."
