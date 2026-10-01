package com.udla.arquitectura.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS para el ambiente de desarrollo.
 *
 * El frontend corre en localhost:5500 y el backend en localhost:8080.
 * Como el puerto cambia, para el navegador son origenes distintos y el backend
 * debe autorizar de forma explicita desde donde acepta peticiones.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // Solo dejamos los origenes locales que usamos durante desarrollo.
                .allowedOrigins(
                        "http://localhost:5500",
                        "http://127.0.0.1:5500",
                        "http://localhost:5173",
                        "http://127.0.0.1:5173",
                        "http://localhost:3000",
                        "http://127.0.0.1:3000")
                .allowedMethods("GET", "OPTIONS")
                .allowedHeaders("*");
    }
}
