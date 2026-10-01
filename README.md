# ISWZ2202 — App base (Sesión 4-6)

App de catálogo de productos (Spring Boot). Cada llamada a la API tiene una
latencia simulada a propósito.

## Requisitos

- Java 17+ únicamente. No necesitas Maven instalado: el proyecto trae el
  Maven Wrapper (`mvnw` / `mvnw.cmd`).

## Ejecutar

```bash
# macOS / Linux
./mvnw spring-boot:run

# Windows
mvnw.cmd spring-boot:run
```

La API queda en `http://localhost:8080`.

```bash
curl http://localhost:8080/api/productos
curl http://localhost:8080/api/productos/1
```

## Actividad (60 min · 10% · Análisis de diseño de software)

**Objetivo:** reforzar el conocimiento adquirido en clase sobre Java y Spring Framework.

1. Completar la aplicación desarrollada en clase.
2. Implementar caché.
3. Implementar el patrón proxy.
4. Pedirle a una IA que genere un frontend para esta API. Van a encontrarse
   con un problema de CORS entre el frontend y este backend — investiguen
   qué lo causa y cómo se resuelve en un ambiente de desarrollo.
5. Suban su proyecto a un repositorio de GitHub propio y entreguen el enlace
   en la consigna.

Se evaluará el diseño de la solución (cohesión, acoplamiento, uso de
abstracciones), no solo que la aplicación funcione.
