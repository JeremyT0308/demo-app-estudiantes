$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $workspaceRoot "frontend"
$frontendPidFile = Join-Path $PSScriptRoot ".frontend.pid"
$watcherPidFile = Join-Path $PSScriptRoot ".browser-watcher.pid"
$frontendPort = 5500
$backendPort = 8080

# Antes de iniciar Debug comprobamos que no exista otro backend ocupando 8080.
# Si dejamos dos instancias de Spring levantadas, el debugger no podria iniciar la nueva.
$backendListener = Get-NetTCPConnection -LocalPort $backendPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($backendListener) {
    throw "El puerto $backendPort ya esta ocupado. Deten la instancia anterior de Spring Boot y vuelve a presionar F5."
}

# Limpiamos archivos de una ejecucion anterior que ya no tenga procesos activos.
Remove-Item $frontendPidFile -ErrorAction SilentlyContinue
Remove-Item $watcherPidFile -ErrorAction SilentlyContinue

$frontendListener = Get-NetTCPConnection -LocalPort $frontendPort -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($frontendListener) {
    # Si el usuario ya tenia un servidor en 5500, lo reutilizamos.
    # No guardamos su PID para no cerrarlo cuando termine nuestro Debug.
    Write-Host "[FRONT] El puerto $frontendPort ya esta activo. Se reutiliza el servidor existente."
} else {
    # Probamos primero python y luego el launcher py de Windows.
    if (Get-Command python -ErrorAction SilentlyContinue) {
        $pythonExe = (Get-Command python).Source
        $pythonArgs = @("-m", "http.server", "$frontendPort", "--bind", "127.0.0.1")
    } elseif (Get-Command py -ErrorAction SilentlyContinue) {
        $pythonExe = (Get-Command py).Source
        $pythonArgs = @("-3", "-m", "http.server", "$frontendPort", "--bind", "127.0.0.1")
    } else {
        throw "No se encontro Python 3. Instala Python o inicia el frontend manualmente en el puerto $frontendPort."
    }

    Write-Host "[FRONT] Iniciando servidor en http://localhost:$frontendPort ..."

    # Start-Process desacopla el servidor del preLaunchTask.
    # El script puede terminar y VS Code queda libre para iniciar Java Debug.
    Start-Process `
        -FilePath $pythonExe `
        -ArgumentList $pythonArgs `
        -WorkingDirectory $frontendPath `
        -WindowStyle Hidden | Out-Null

    # Esperamos hasta que el puerto quede realmente disponible y guardamos
    # el PID del proceso que escucha. Asi Stop solo cierra nuestro servidor.
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
}

# El navegador se abre desde otro proceso. Este watcher espera a que Spring
# acepte conexiones en 8080 sin bloquear la tarea previa de VS Code.
$watcherScript = Join-Path $PSScriptRoot "open-browser-when-ready.ps1"
$watcher = Start-Process `
    -FilePath "powershell.exe" `
    -ArgumentList @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", "`"$watcherScript`"",
        "-BackendPort", "$backendPort",
        "-FrontendUrl", "http://localhost:$frontendPort"
    ) `
    -WindowStyle Hidden `
    -PassThru

Set-Content -Path $watcherPidFile -Value $watcher.Id
Write-Host "[APP] Preparacion terminada. VS Code ya puede iniciar Spring Boot en Debug."
