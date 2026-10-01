package com.udla.arquitectura.demo.proxy;

import com.udla.arquitectura.demo.model.Producto;
import com.udla.arquitectura.demo.repository.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Proxy estructural del repositorio de productos.
 *
 * El cliente (ProductoService) sigue dependiendo de ProductoRepository.
 * Este proxy implementa la misma interfaz, registra la operacion y delega
 * el trabajo al repositorio real sin acoplar el service a la implementacion.
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
        return ejecutarConTrazabilidad("listarTodos", repositorioReal::listarTodos);
    }

    @Override
    public Producto buscarPorId(Long id) {
        return ejecutarConTrazabilidad(
                "buscarPorId(" + id + ")",
                () -> repositorioReal.buscarPorId(id));
    }

    private <T> T ejecutarConTrazabilidad(String operacion, Operacion<T> operacionReal) {
        long inicio = System.currentTimeMillis();
        log.info("[PROXY] Iniciando {}", operacion);

        try {
            return operacionReal.ejecutar();
        } finally {
            long duracion = System.currentTimeMillis() - inicio;
            log.info("[PROXY] Finalizo {} en {} ms", operacion, duracion);
        }
    }

    @FunctionalInterface
    private interface Operacion<T> {
        T ejecutar();
    }
}
