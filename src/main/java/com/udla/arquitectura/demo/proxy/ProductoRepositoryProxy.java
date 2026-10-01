package com.udla.arquitectura.demo.proxy;

import com.udla.arquitectura.demo.model.Producto;
import com.udla.arquitectura.demo.repository.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Proxy estructural del repositorio de productos.
 *
 * Este objeto implementa el mismo contrato que el repositorio real. Para el
 * service los dos se ven como ProductoRepository, pero Spring entrega este
 * Proxy porque esta marcado con @Primary.
 *
 * El Proxy no guarda la cache. Su trabajo es controlar el acceso, registrar
 * lo que pasa y despues delegar la operacion al objeto real. De esta forma
 * podemos agregar comportamiento sin modificar RepositorioProductoEnMemoria.
 */
@Repository
@Primary
public class ProductoRepositoryProxy implements ProductoRepository {

    private static final Logger log = LoggerFactory.getLogger(ProductoRepositoryProxy.class);

    private final ProductoRepository repositorioReal;

    public ProductoRepositoryProxy(
            @Qualifier("productoRepositoryReal") ProductoRepository repositorioReal) {
        this.repositorioReal = repositorioReal;
    }

    @Override
    public List<Producto> listarTodos() {
        return ejecutarConProxy("listarTodos", repositorioReal::listarTodos);
    }

    @Override
    public Producto buscarPorId(Long id) {
        return ejecutarConProxy(
                "buscarPorId(" + id + ")",
                () -> repositorioReal.buscarPorId(id)
        );
    }

    /**
     * Toda llamada que realmente llega al repositorio pasa primero por aqui.
     * Si una respuesta sale desde cache, estos mensajes no aparecen porque
     * Spring resuelve la peticion antes de llegar al repositorio.
     */
    private <T> T ejecutarConProxy(String operacion, Operacion<T> operacionReal) {
        long inicio = System.nanoTime();
        log.info("[PROXY] {} -> acceso interceptado", operacion);
        log.info("[PROXY] {} -> delegando al repositorio real", operacion);

        try {
            T resultado = operacionReal.ejecutar();
            long duracionMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - inicio);
            log.info("[PROXY] {} -> respuesta recibida en {} ms", operacion, duracionMs);
            return resultado;
        } catch (RuntimeException ex) {
            long duracionMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - inicio);
            log.warn("[PROXY] {} -> termino con error despues de {} ms: {}",
                    operacion, duracionMs, ex.getMessage());
            throw ex;
        }
    }

    @FunctionalInterface
    private interface Operacion<T> {
        T ejecutar();
    }
}
