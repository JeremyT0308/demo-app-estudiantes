param(
    [int]$BackendPort = 8080,
    [string]$FrontendUrl = "http://localhost:5500"
)

$ErrorActionPreference = "SilentlyContinue"

# Esperamos hasta 60 segundos. La comprobacion usa TcpClient para evitar
# depender de un mensaje concreto de Tomcat o de la velocidad de la consola.
$ready = $false
for ($i = 0; $i -lt 120; $i++) {
    $client = New-Object System.Net.Sockets.TcpClient
    try {
        $async = $client.BeginConnect("127.0.0.1", $BackendPort, $null, $null)
        if ($async.AsyncWaitHandle.WaitOne(200)) {
            $client.EndConnect($async)
            $ready = $client.Connected
        }
    } catch {
        $ready = $false
    } finally {
        $client.Close()
    }

    if ($ready) { break }
    Start-Sleep -Milliseconds 500
}

if ($ready) {
    # El backend ya esta disponible. Abrimos el frontend con el navegador predeterminado.
    Start-Process $FrontendUrl
}
