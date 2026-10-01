# ISWZ2202 — Catálogo de productos

Aplicación de práctica con **Java 17 + Spring Boot 3.3.4** para reforzar caché, patrón Proxy, CORS y una integración sencilla con frontend.

La solución incluye:

- API REST de productos.
- Repositorio en memoria con latencia simulada de 1,5 segundos.
- Spring Cache con **Caffeine**, expiración y límite de entradas.
- Implementación explícita del patrón **Proxy**.
- Configuración de **CORS** para desarrollo local.
- Frontend en HTML, CSS y JavaScript.
- Configuración de VS Code para iniciar backend, frontend y navegador desde **F5 / Debug**.

## 1. Requisitos

- Java 17.
- VS Code con **Extension Pack for Java**.
- Python 3 para servir el frontend en desarrollo.
- No es necesario instalar Maven: el proyecto incluye Maven Wrapper.

## 2. Ejecutar todo desde VS Code

Abre la carpeta raíz del proyecto en VS Code, es decir, la carpeta que contiene `pom.xml`.

Después:

1. Ve a **Run and Debug**.
2. Selecciona `Aplicacion completa (Backend + Frontend)`.
3. Presiona **F5**.

La configuración hace este flujo automáticamente:

```text
F5
 |
 +--> comprueba si el frontend ya existe en el puerto 5500
 |
 +--> si hace falta, inicia el frontend como proceso separado
 |
 +--> el script termina y devuelve el control a VS Code
 |
 +--> inicia Spring Boot en Debug en el puerto 8080
 |
 +--> un watcher espera a que 8080 acepte conexiones
 |
 +--> abre http://localhost:5500 en el navegador
```

El frontend se inicia como un proceso independiente para que la tarea previa no bloquee el arranque del debugger de Java. El navegador tampoco depende de leer un mensaje concreto de los logs de Tomcat: se abre cuando el puerto 8080 realmente está disponible.

Al detener Debug, VS Code detiene el servidor de frontend que inició para esa sesión y también cancela el watcher si todavía estaba esperando.

> Si el puerto 5500 ya estaba ocupado antes de presionar F5, la configuración reutiliza ese servidor y no lo cierra al terminar.

> El puerto 8080 debe estar libre antes de iniciar `Aplicacion completa`. Si dejaste Spring Boot ejecutándose manualmente, detenlo primero para que el debugger pueda iniciar su propia instancia.

También existe la opción `Backend solamente` para probar únicamente la API.

Si quieres comprobar manualmente que ambos procesos quedaron activos:

```powershell
Test-NetConnection localhost -Port 8080
Test-NetConnection localhost -Port 5500
```

En ambos casos `TcpTestSucceeded` debe aparecer como `True`.

## 3. API

Endpoints:

```text
GET http://localhost:8080/api/productos
GET http://localhost:8080/api/productos/{id}
```

Ejemplos:

```text
http://localhost:8080/api/productos
http://localhost:8080/api/productos/1
```

## 4. Implementación de caché

La caché se configura en:

```text
src/main/java/com/udla/arquitectura/demo/config/CacheConfig.java
```

Se utiliza **Caffeine** como implementación en memoria. La configuración tiene:

- máximo de 100 entradas por caché;
- expiración después de 10 minutos;
- estadísticas internas habilitadas;
- dos cachés separadas: `productos` y `productoPorId`.

En `ProductoService` se usa `@Cacheable`:

```text
listarTodos()   -> cache "productos", clave "todos"
buscarPorId(id) -> cache "productoPorId", clave id
```

También se usa `sync = true`. Si llegan varias peticiones iguales cuando la entrada todavía no existe, Spring evita que todas ejecuten a la vez la misma carga lenta.

### Flujo sin caché

```text
Controller
   |
   v
ProductoService
   |
   v
ProductoRepositoryProxy
   |
   v
RepositorioProductoEnMemoria
   |
   v
~1500 ms
```

### Flujo cuando existe caché

```text
Controller
   |
   v
Spring Cache
   |
   v
respuesta
```

La segunda llamada no necesita llegar al Proxy ni al repositorio real.

## 5. Implementación del patrón Proxy

El contrato común es `ProductoRepository`.

```text
ProductoService
      |
      v
ProductoRepository
      |
      v
ProductoRepositoryProxy   <-- @Primary
      |
      v
RepositorioProductoEnMemoria
```

`ProductoRepositoryProxy` implementa la misma interfaz que el objeto real. El service no necesita saber qué implementación recibió.

El Proxy agrega comportamiento antes y después de delegar:

- registra cuándo intercepta una operación;
- registra cuándo delega al repositorio real;
- mide cuánto tarda la operación;
- registra errores sin ocultarlos;
- finalmente devuelve exactamente el resultado del repositorio real.

La caché **no** se implementa dentro del Proxy. Se mantiene en la capa de servicio para que Proxy y Cache tengan responsabilidades separadas y sean fáciles de explicar.

En consola, una consulta que llega al repositorio se ve parecido a esto:

```text
[PROXY] listarTodos -> acceso interceptado
[PROXY] listarTodos -> delegando al repositorio real
[REPOSITORY] listarTodos -> simulando consulta lenta
[PROXY] listarTodos -> respuesta recibida en 1500 ms
```

Si repites inmediatamente la misma petición y sale desde caché, esos mensajes no vuelven a aparecer.

## 6. CORS

Frontend y backend usan puertos diferentes:

```text
Frontend: http://localhost:5500
Backend:  http://localhost:8080
```

Para el navegador son orígenes diferentes. La autorización de desarrollo está en:

```text
src/main/java/com/udla/arquitectura/demo/config/CorsConfig.java
```

Solo se habilitan orígenes locales conocidos y endpoints `/api/**`.

## 7. Probar visualmente la caché

1. Reinicia la aplicación con F5 para empezar con la caché vacía.
2. La primera carga del catálogo tarda aproximadamente 1,5 segundos.
3. Presiona **Recargar API**.
4. La siguiente respuesta debería ser mucho más rápida.
5. Abre el detalle de un producto.
6. Ciérralo y abre el mismo producto otra vez.
7. Compara el tiempo y los logs de la consola.

El frontend mide el tiempo de respuesta, pero la evidencia más clara de la caché está en los logs: si la petición sale de caché, el Proxy y el repositorio no vuelven a ejecutarse.

## 8. Ejecución manual

Si quieres arrancar el backend sin Debug:

### Windows

```powershell
.\mvnw.cmd spring-boot:run
```

### macOS / Linux

```bash
./mvnw spring-boot:run
```

Para el frontend:

```powershell
cd frontend
python -m http.server 5500
```

Después abre:

```text
http://localhost:5500
```

## 9. Estructura principal

```text
.vscode/
├── launch.json
├── tasks.json
├── start-dev.ps1
├── open-browser-when-ready.ps1
└── stop-dev.ps1

src/main/java/com/udla/arquitectura/demo/
├── DemoApplication.java
├── config/
│   ├── CacheConfig.java
│   └── CorsConfig.java
├── controller/
│   └── ProductoController.java
├── model/
│   └── Producto.java
├── proxy/
│   └── ProductoRepositoryProxy.java
├── repository/
│   ├── ProductoRepository.java
│   └── RepositorioProductoEnMemoria.java
└── service/
    └── ProductoService.java

frontend/
├── index.html
├── styles.css
└── app.js
```

## 10. Puntos para explicar en la entrega

- **Caché:** evita repetir una operación costosa cuando ya existe un resultado válido.
- **Caffeine:** pone límites y expiración a la caché en memoria.
- **Proxy:** controla el acceso al repositorio real y agrega trazabilidad sin modificarlo.
- **Bajo acoplamiento:** `ProductoService` depende de la interfaz `ProductoRepository`.
- **Separación de responsabilidades:** la caché está en service y el Proxy se concentra en interceptar/delegar.
- **CORS:** permite que el frontend de desarrollo en `5500` consuma la API en `8080`.
- **Automatización:** VS Code inicia todo con F5 para evitar comandos manuales durante desarrollo.
