package com.udla.arquitectura.demo.service;

import com.udla.arquitectura.demo.model.Producto;
import com.udla.arquitectura.demo.repository.ProductoRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Logica de negocio del catalogo.
 *
 * La cache se queda en el service a proposito. Asi evitamos mezclarla con
 * el Proxy y cada parte tiene una responsabilidad facil de explicar.
 *
 * Flujo de la primera llamada:
 * Controller -> Service -> Proxy -> Repositorio real.
 *
 * Flujo de una llamada cacheada:
 * Controller -> cache de Spring -> respuesta.
 * En ese caso no hace falta llegar al Proxy ni repetir la consulta lenta.
 */
@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    /**
     * Guarda el listado completo con una clave fija.
     * sync=true evita que varias peticiones iguales carguen el mismo dato
     * al mismo tiempo cuando todavia no existe una entrada en cache.
     */
    @Cacheable(cacheNames = "productos", key = "'todos'", sync = true)
    public List<Producto> listarTodos() {
        return productoRepository.listarTodos();
    }

    /**
     * Cada producto se guarda usando su id como clave.
     * Pedir dos veces el mismo id reutiliza el resultado mientras siga vigente.
     */
    @Cacheable(cacheNames = "productoPorId", key = "#id", sync = true)
    public Producto buscarPorId(Long id) {
        return productoRepository.buscarPorId(id);
    }
}
