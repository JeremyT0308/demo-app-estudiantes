package com.udla.arquitectura.demo.repository;

import com.udla.arquitectura.demo.model.Producto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Repository;

import java.util.Comparator;
import java.util.List;
import java.util.Map;

/**
 * Repositorio real de la practica.
 *
 * Los datos estan en memoria, pero agregamos una latencia de 1.5 segundos
 * para representar una operacion costosa como una consulta a base de datos.
 * Esto hace visible la diferencia entre consultar el repositorio y usar cache.
 */
@Repository("productoRepositoryReal")
public class RepositorioProductoEnMemoria implements ProductoRepository {

    private static final Logger log = LoggerFactory.getLogger(RepositorioProductoEnMemoria.class);
    private static final long LATENCIA_SIMULADA_MS = 1500;

    private final Map<Long, Producto> datos = Map.of(
            1L, new Producto(1L, "Teclado mecanico", "Perifericos", 45.90),
            2L, new Producto(2L, "Monitor 27\"", "Pantallas", 189.00),
            3L, new Producto(3L, "Mouse inalambrico", "Perifericos", 19.50),
            4L, new Producto(4L, "Laptop 14\"", "Computadores", 780.00),
            5L, new Producto(5L, "Audifonos USB-C", "Audio", 32.75)
    );

    @Override
    public List<Producto> listarTodos() {
        log.info("[REPOSITORY] listarTodos -> simulando consulta lenta");
        simularLatencia();

        return datos.values().stream()
                .sorted(Comparator.comparing(Producto::id))
                .toList();
    }

    @Override
    public Producto buscarPorId(Long id) {
        log.info("[REPOSITORY] buscarPorId({}) -> simulando consulta lenta", id);
        simularLatencia();

        Producto producto = datos.get(id);
        if (producto == null) {
            throw new IllegalArgumentException("Producto no encontrado: " + id);
        }
        return producto;
    }

    private void simularLatencia() {
        try {
            Thread.sleep(LATENCIA_SIMULADA_MS);
        } catch (InterruptedException e) {
            // Si la aplicacion se esta cerrando respetamos la interrupcion del hilo.
            Thread.currentThread().interrupt();
            throw new IllegalStateException("La consulta fue interrumpida", e);
        }
    }
}
