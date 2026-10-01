$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$frontendPath = Join-Path $workspaceRoot "frontend"
$pidFile = Join-Path $PSScriptRoot ".frontend.pid"
$port = 5500

# Si el puerto ya esta ocupado no levantamos otro servidor encima.
# Tampoco guardamos ese PID porque puede ser un proceso que el usuario inicio manualmente.
$existing = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -First 1

if ($existing) {
    Remove-Item $pidFile -ErrorAction SilentlyContinue
    Write-Host "[FRONT] El puerto $port ya esta activo. Se reutiliza el servidor existente."
    exit 0
}

# Probamos primero 'python' y luego el launcher 'py' de Windows.
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonExe = (Get-Command python).Source
    $pythonArgs = @("-m", "http.server", "$port", "--bind", "127.0.0.1")
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonExe = (Get-Command py).Source
    $pythonArgs = @("-3", "-m", "http.server", "$port", "--bind", "127.0.0.1")
} else {
    throw "No se encontro Python 3. Instala Python o inicia el frontend manualmente en el puerto 5500."
}

Write-Host "[FRONT] Iniciando servidor en http://localhost:$port ..."
Start-Process `
    -FilePath $pythonExe `
    -ArgumentList $pythonArgs `
    -WorkingDirectory $frontendPath `
    -WindowStyle Hidden | Out-Null

# Esperamos unos segundos hasta que el puerto realmente quede escuchando.
$listener = $null
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 250
    $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
    if ($listener) { break }
}

if (-not $listener) {
    throw "El frontend no pudo iniciar en el puerto $port."
}

# Guardamos el PID que realmente esta escuchando. Asi Stop solo cierra
# el servidor que fue iniciado por esta configuracion de Debug.
Set-Content -Path $pidFile -Value $listener.OwningProcess
Write-Host "[FRONT] Listo en http://localhost:$port"
