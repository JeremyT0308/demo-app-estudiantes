package com.udla.arquitectura.demo.service;

import com.udla.arquitectura.demo.model.Producto;
import com.udla.arquitectura.demo.repository.ProductoRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Logica de negocio del catalogo.
 *
 * @Cacheable hace que Spring envuelva este bean con un proxy dinamico.
 * La primera llamada ejecuta el metodo; las siguientes con la misma clave
 * se responden desde cache mientras la aplicacion siga levantada.
 */
@Service
public class ProductoService {

    private final ProductoRepository productoRepository;

    public ProductoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @Cacheable(cacheNames = "productos", key = "'todos'")
    public List<Producto> listarTodos() {
        return productoRepository.listarTodos();
    }

    @Cacheable(cacheNames = "productoPorId", key = "#id")
    public Producto buscarPorId(Long id) {
        return productoRepository.buscarPorId(id);
    }
}
