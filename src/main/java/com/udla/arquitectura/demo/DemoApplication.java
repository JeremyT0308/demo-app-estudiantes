package com.udla.arquitectura.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

/**
 * ISWZ2202 - Diseno y Arquitectura de Software (UDLA)
 * App de catalogo de productos con cache, proxy y API REST.
 */
@EnableCaching
@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
