package com.udla.arquitectura.demo.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Configuracion central de la cache.
 *
 * La idea es que la cache tenga limites claros y no crezca para siempre.
 * Caffeine mantiene los datos en memoria, expira entradas antiguas y nos
 * permite seguir usando las anotaciones de Spring Cache en el service.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    private static final int MAXIMO_ENTRADAS = 100;
    private static final Duration TIEMPO_DE_VIDA = Duration.ofMinutes(10);

    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
                "productos",
                "productoPorId"
        );

        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(MAXIMO_ENTRADAS)
                .expireAfterWrite(TIEMPO_DE_VIDA)
                .recordStats());

        return cacheManager;
    }
}
