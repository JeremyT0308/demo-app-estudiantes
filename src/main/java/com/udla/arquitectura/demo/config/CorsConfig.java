package com.udla.arquitectura.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS para desarrollo local.
 *
 * El frontend corre en un origen distinto (por ejemplo localhost:5500)
 * al backend (localhost:8080). El navegador bloquea esas peticiones salvo
 * que el backend autorice explicitamente el origen.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
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
