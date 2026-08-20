package com.pezcaderia.domain.inventario.dto;

import java.math.BigDecimal;

public record AnalisisAbcItemRecord(
    String productoId,
    String codigoSku,
    String nombreProducto,
    BigDecimal valorTotalVentas,
    BigDecimal porcentajeAcumulado,
    ClasificacionAbc clasificacion
) {
    public enum ClasificacionAbc {
        A, // 80% del valor total de ventas
        B, // 15% del valor total de ventas
        C  // 5% del valor total de ventas
    }
}
