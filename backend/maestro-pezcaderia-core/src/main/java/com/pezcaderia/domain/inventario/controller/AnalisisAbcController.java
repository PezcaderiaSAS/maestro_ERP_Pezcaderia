package com.pezcaderia.domain.inventario.controller;

import com.pezcaderia.domain.inventario.dto.AnalisisAbcItemRecord;
import com.pezcaderia.domain.inventario.service.AnalisisAbcService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventario/abc")
public class AnalisisAbcController {

    private final AnalisisAbcService abcService;

    public AnalisisAbcController(AnalisisAbcService abcService) {
        this.abcService = abcService;
    }

    @GetMapping("/calcular")
    public ResponseEntity<List<AnalisisAbcItemRecord>> calcularAnalisisPareto(
            @RequestParam(defaultValue = "30") int diasHistorial,
            @AuthenticationPrincipal Jwt jwt) {
        
        String userId = jwt != null ? jwt.getSubject() : "anonymous";
        List<AnalisisAbcItemRecord> resultado = abcService.ejecutarAnalisisPareto(diasHistorial, userId);
        return ResponseEntity.ok(resultado);
    }
}
