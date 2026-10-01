package com.udla.arquitectura.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ISWZ2202 - Diseno y Arquitectura de Software (UDLA)
 * Punto de entrada de la aplicacion.
 *
 * La configuracion de cache se deja en CacheConfig para no mezclar
 * responsabilidades dentro de la clase principal.
 */
@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
