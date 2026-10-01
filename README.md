# ISWZ2202 — Catálogo de productos

Aplicación de práctica con **Java 17 + Spring Boot 3.3.4** para reforzar conceptos de diseño y arquitectura de software.

La solución incluye:

- API REST de productos.
- Repositorio en memoria con latencia simulada de 1,5 segundos.
- Caché con Spring Cache.
- Implementación explícita del patrón **Proxy**.
- Configuración de **CORS** para desarrollo local.
- Frontend sencillo en HTML, CSS y JavaScript sin dependencias externas.

## 1. Requisitos

- Java 17 o superior.
- No es necesario instalar Maven: el proyecto incluye Maven Wrapper.
- Para servir el frontend puedes usar Python 3, Live Server de VS Code o cualquier servidor HTTP local.

## 2. Ejecutar el backend

### macOS / Linux

```bash
./mvnw spring-boot:run
```

### Windows

```bat
mvnw.cmd spring-boot:run
```

La API queda disponible en:

```text
http://localhost:8080
```

Endpoints:

```text
GET http://localhost:8080/api/productos
GET http://localhost:8080/api/productos/{id}
```

Ejemplos:

```bash
curl http://localhost:8080/api/productos
curl http://localhost:8080/api/productos/1
```

## 3. Caché

La caché se habilita con `@EnableCaching` en `DemoApplication`.

En `ProductoService` se usan dos cachés:

- `productos`: almacena el listado completo.
- `productoPorId`: almacena cada producto según su ID.

La primera consulta tarda aproximadamente 1,5 segundos porque llega al repositorio real. Una segunda consulta con la misma clave se responde desde memoria y debería ser mucho más rápida.

Ejemplo:

```bash
curl http://localhost:8080/api/productos/1
curl http://localhost:8080/api/productos/1
```

En la primera llamada aparecerán los mensajes del Proxy en consola. En la segunda normalmente no aparecerán porque Spring devuelve el valor directamente desde caché antes de llegar al repositorio.

## 4. Patrón Proxy

El contrato común es:

```text
ProductoRepository
```

Existen dos implementaciones relacionadas:

```text
ProductoService
      |
      v
ProductoRepository
      |
      v
ProductoRepositoryProxy  <-- @Primary
      |
      v
RepositorioProductoEnMemoria
```

`ProductoRepositoryProxy` implementa exactamente la misma interfaz que el repositorio real. Su responsabilidad es agregar trazabilidad y medir la duración de la operación antes de delegarla al objeto real.

Gracias a `@Primary`, Spring inyecta el Proxy en `ProductoService`. El Proxy recibe el repositorio real usando `@Qualifier("productoRepositoryReal")`.

Esto mantiene bajo acoplamiento: `ProductoService` conoce únicamente la abstracción `ProductoRepository`.

> Nota: Spring Cache también usa proxies internamente para interceptar llamadas a métodos anotados con `@Cacheable`. En este ejercicio se conserva además un Proxy explícito para que el patrón estructural sea visible en el código.

## 5. Frontend

El frontend está dentro de:

```text
frontend/
```

No abras `index.html` directamente con `file://`, porque para esta práctica conviene ejecutarlo desde un origen HTTP independiente y observar el escenario real de CORS.

### Opción A — Python

Desde la raíz del proyecto:

```bash
cd frontend
python -m http.server 5500
```

En algunos sistemas el comando es:

```bash
python3 -m http.server 5500
```

Después abre:

```text
http://localhost:5500
```

### Opción B — VS Code Live Server

Abre `frontend/index.html` con Live Server. Si usa el puerto 5500, funcionará con la configuración incluida.

## 6. ¿Qué es el problema de CORS?

El frontend y el backend se ejecutan en orígenes distintos:

```text
Frontend: http://localhost:5500
Backend:  http://localhost:8080
```

Aunque ambos estén en la misma computadora, el puerto forma parte del origen. El navegador aplica la política de mismo origen y puede bloquear una petición `fetch` desde el frontend hacia el backend si este no la autoriza.

La solución de desarrollo está en:

```text
src/main/java/com/udla/arquitectura/demo/config/CorsConfig.java
```

Se autorizan explícitamente varios orígenes locales habituales y únicamente los endpoints `/api/**`.

Para producción no conviene habilitar `*` indiscriminadamente. Se debería autorizar únicamente el dominio real del frontend.

## 7. Cómo comprobar la caché visualmente

1. Levanta el backend.
2. Levanta el frontend en el puerto 5500.
3. La primera carga del catálogo tardará alrededor de 1,5 segundos.
4. Presiona **Recargar API**.
5. La siguiente respuesta debería ser mucho más rápida.
6. Abre el detalle de un producto.
7. Ciérralo y vuelve a abrir el mismo producto: la segunda petición debería reducir mucho su tiempo.

## 8. Estructura principal

```text
src/main/java/com/udla/arquitectura/demo/
├── DemoApplication.java
├── config/
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

## 9. Subir a GitHub

Crea un repositorio vacío en tu cuenta de GitHub y, desde la raíz del proyecto, ejecuta:

```bash
git init
git add .
git commit -m "Implementa cache, proxy, CORS y frontend"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

Después copia la URL del repositorio y colócala en la consigna de la actividad.

## 10. Puntos para explicar en la entrega

- **Cohesión:** cada clase mantiene una responsabilidad concreta.
- **Bajo acoplamiento:** `ProductoService` depende de `ProductoRepository`, no del repositorio concreto.
- **Proxy:** agrega comportamiento antes/después de delegar al repositorio real.
- **Cache:** evita repetir operaciones costosas cuando la misma información ya fue obtenida.
- **CORS:** es una restricción aplicada por el navegador entre orígenes diferentes; se resuelve autorizando desde el backend los orígenes necesarios.
