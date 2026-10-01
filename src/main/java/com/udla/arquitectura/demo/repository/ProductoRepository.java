package com.udla.arquitectura.demo.repository;

import com.udla.arquitectura.demo.model.Producto;

import java.util.List;

/**
 * Contrato comun para acceder a productos.
 *
 * Tanto el repositorio real como el Proxy implementan esta interfaz. Gracias
 * a eso el service depende de una abstraccion y no de una clase concreta.
 */
public interface ProductoRepository {

    List<Producto> listarTodos();

    Producto buscarPorId(Long id);
}
