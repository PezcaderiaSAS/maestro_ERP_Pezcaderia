package com.pezcaderia.domain.inventario.service;

import com.pezcaderia.domain.inventario.dto.AnalisisAbcItemRecord;
import com.pezcaderia.domain.inventario.dto.AnalisisAbcItemRecord.ClasificacionAbc;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

@Service
public class AnalisisAbcService {

    /**
     * Ejecuta el analisis de Pareto (80/20) sobre el volumen de ventas del inventario.
     * Retorna una lista inmutable clasificada en A (80%), B (15%), C (5%).
     */
    public List<AnalisisAbcItemRecord> ejecutarAnalisisPareto(int diasHistorial, String userId) {
        // Mock/Simulacion funcional basada en datos de inventario del ERP.
        // En produccion se conecta via JPA a la tabla 'ventas' / 'detalle_ventas' de Supabase Postgres.
        List<AnalisisAbcItemRecord> itemsBase = List.of(
            new AnalisisAbcItemRecord("p1", "SKU-SALMON-01", "Filete de Salmón Premium", new BigDecimal("15000000.00"), BigDecimal.ZERO, ClasificacionAbc.A),
            new AnalisisAbcItemRecord("p2", "SKU-ROBALO-02", "Robalo Fresco Entero", new BigDecimal("8500000.00"), BigDecimal.ZERO, ClasificacionAbc.A),
            new AnalisisAbcItemRecord("p3", "SKU-CAMARON-03", "Camarón Tigre Gigante", new BigDecimal("4200000.00"), BigDecimal.ZERO, ClasificacionAbc.B),
            new AnalisisAbcItemRecord("p4", "SKU-ATUN-04", "Lomo de Atún Rojo", new BigDecimal("2100000.00"), BigDecimal.ZERO, ClasificacionAbc.B),
            new AnalisisAbcItemRecord("p5", "SKU-TILAPIA-05", "Mojarra Roja Limpia", new BigDecimal("800000.00"), BigDecimal.ZERO, ClasificacionAbc.C),
            new AnalisisAbcItemRecord("p6", "SKU-TRUCHA-06", "Trucha Arcoíris Deshuesada", new BigDecimal("400000.00"), BigDecimal.ZERO, ClasificacionAbc.C)
        );

        BigDecimal valorTotalGlobal = itemsBase.stream()
            .map(AnalisisAbcItemRecord::valorTotalVentas)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (valorTotalGlobal.compareTo(BigDecimal.ZERO) == 0) {
            return Collections.emptyList();
        }

        List<AnalisisAbcItemRecord> itemsOrdenados = itemsBase.stream()
            .sorted(Comparator.comparing(AnalisisAbcItemRecord::valorTotalVentas).reversed())
            .toList();

        List<AnalisisAbcItemRecord> resultadoFinal = new ArrayList<>();
        BigDecimal acumulado = BigDecimal.ZERO;

        for (AnalisisAbcItemRecord item : itemsOrdenados) {
            acumulado = acumulado.add(item.valorTotalVentas());
            BigDecimal porcentajeAcumulado = acumulado
                .multiply(new BigDecimal("100"))
                .divide(valorTotalGlobal, 2, RoundingMode.HALF_UP);

            ClasificacionAbc categoria;
            if (porcentajeAcumulado.compareTo(new BigDecimal("80.00")) <= 0) {
                categoria = ClasificacionAbc.A;
            } else if (porcentajeAcumulado.compareTo(new BigDecimal("95.00")) <= 0) {
                categoria = ClasificacionAbc.B;
            } else {
                categoria = ClasificacionAbc.C;
            }

            resultadoFinal.add(new AnalisisAbcItemRecord(
                item.productoId(),
                item.codigoSku(),
                item.nombreProducto(),
                item.valorTotalVentas(),
                porcentajeAcumulado,
                categoria
            ));
        }

        return Collections.unmodifiableList(resultadoFinal);
    }
}
