// src/tests/siigoComponents.test.tsx
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SiigoStatusBadge } from '../views/settings/components/SiigoStatusBadge';
import { SiigoConfigModal } from '../views/settings/components/SiigoConfigModal';
import { useSiigoConfigStore } from '../store/useSiigoConfigStore';
import { SiigoAuthService } from '../services/siigoAuthService';

vi.mock('../services/siigoAuthService', () => ({
  SiigoAuthService: {
    probarConexion: vi.fn(),
    invalidateToken: vi.fn(),
    resetForTesting: vi.fn(),
  }
}));

describe('TASK-025-05: Componentes UI Accesibles de Configuración y Diagnóstico SIIGO ("Regla del Niño de 12 Años")', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    useSiigoConfigStore.getState().resetForTesting();
  });

  describe('SiigoStatusBadge', () => {
    it('debe renderizar estado NO_CONFIGURADO por defecto con altura mínima >= 48px y cero imágenes externas', () => {
      const handleClick = vi.fn();
      const { container } = render(<SiigoStatusBadge onClick={handleClick} />);

      const badge = screen.getByRole('button', { name: /conexi[oó]n siigo/i });
      expect(badge).toBeDefined();
      expect(badge.textContent).toMatch(/Configurar SIIGO/i);

      // Regla del Niño de 12 Años: Target táctil >= 48px
      expect(badge.className).toMatch(/min-h-\[48px\]/);

      // Cero imágenes externas (100% Lucide React)
      const images = container.querySelectorAll('img');
      expect(images.length).toBe(0);

      // Clic dispara el handler
      fireEvent.click(badge);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('debe reflejar visualmente el estado ONLINE con badge verde esmeralda', () => {
      useSiigoConfigStore.setState({
        estadoConexion: 'ONLINE',
        config: {
          username: 'admin@pezcaderia.com',
          accessKey: 'key_1234567890',
          isSandbox: false,
          partnerId: 'LaPezcaderiaERP',
          urlBase: 'https://api.siigo.com'
        }
      });

      render(<SiigoStatusBadge onClick={() => {}} />);
      const badge = screen.getByRole('button', { name: /conexi[oó]n siigo/i });
      expect(badge.textContent).toMatch(/SIIGO Conectado/i);
      expect(badge.className).toContain('emerald');
    });

    it('debe reflejar visualmente el estado SANDBOX con badge ámbar', () => {
      useSiigoConfigStore.setState({
        estadoConexion: 'SANDBOX',
        config: {
          username: 'sandbox@pezcaderia.com',
          accessKey: 'sandbox_key_123',
          isSandbox: true,
          partnerId: 'LaPezcaderiaERP',
          urlBase: 'https://api.siigo.com'
        }
      });

      render(<SiigoStatusBadge onClick={() => {}} />);
      const badge = screen.getByRole('button', { name: /conexi[oó]n siigo/i });
      expect(badge.textContent).toMatch(/SIIGO Sandbox/i);
      expect(badge.className).toContain('amber');
    });

    it('debe reflejar visualmente el estado ERROR_AUTENTICACION con badge rojo carmín', () => {
      useSiigoConfigStore.setState({
        estadoConexion: 'ERROR_AUTENTICACION',
        ultimoError: 'Credenciales inválidas'
      });

      render(<SiigoStatusBadge onClick={() => {}} />);
      const badge = screen.getByRole('button', { name: /conexi[oó]n siigo/i });
      expect(badge.textContent).toMatch(/SIIGO Error/i);
      expect(badge.className).toContain('rose');
    });
  });

  describe('SiigoConfigModal', () => {
    it('no debe renderizarse en el DOM cuando isOpen = false', () => {
      const { container } = render(<SiigoConfigModal isOpen={false} onClose={() => {}} />);
      expect(container.firstChild).toBeNull();
    });

    it('debe renderizar modal accesible con inputs >= 48px, botón principal >= 56px y cero imágenes', () => {
      const { container } = render(<SiigoConfigModal isOpen={true} onClose={() => {}} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();

      // Inputs de usuario y clave deben tener altura >= 48px
      const usernameInput = screen.getByLabelText(/Correo Electr[oó]nico de Usuario/i);
      expect(usernameInput).toBeDefined();
      expect(usernameInput.className).toMatch(/h-12|min-h-\[48px\]/);

      const accessKeyInput = screen.getByLabelText(/Access Key /i);
      expect(accessKeyInput).toBeDefined();
      expect(accessKeyInput.className).toMatch(/h-12|min-h-\[48px\]/);

      // Botón principal de guardado >= 56px
      const submitBtn = screen.getByTestId('btn-save-siigo-config');
      expect(submitBtn).toBeDefined();
      expect(submitBtn.className).toMatch(/min-h-\[56px\]/);
      expect(submitBtn.textContent).toMatch(/PROBAR Y GUARDAR/i);

      // Cero imágenes externas
      const images = container.querySelectorAll('img');
      expect(images.length).toBe(0);
    });

    it('debe permitir ingresar credenciales y ejecutar prueba de conexión y guardado', async () => {
      vi.mocked(SiigoAuthService.probarConexion).mockResolvedValueOnce({
        success: true,
        latencyMs: 145,
        isSandbox: false,
        timestamp: new Date().toISOString(),
        message: 'Conexión exitosa con SIIGO Nube API v2 (145 ms)'
      });

      const handleClose = vi.fn();
      render(<SiigoConfigModal isOpen={true} onClose={handleClose} />);

      const usernameInput = screen.getByLabelText(/Correo Electr[oó]nico de Usuario/i);
      const accessKeyInput = screen.getByLabelText(/Access Key /i);
      const submitBtn = screen.getByTestId('btn-save-siigo-config');

      fireEvent.change(usernameInput, { target: { value: 'facturacion@empresa.com' } });
      fireEvent.change(accessKeyInput, { target: { value: 'clave_larga_valida_12345' } });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(SiigoAuthService.probarConexion).toHaveBeenCalledTimes(1);
        expect(useSiigoConfigStore.getState().config?.username).toBe('facturacion@empresa.com');
        expect(useSiigoConfigStore.getState().estadoConexion).toBe('ONLINE');
      });
    });

    it('debe permitir alternar el switch de Modo Sandbox / Producción', () => {
      render(<SiigoConfigModal isOpen={true} onClose={() => {}} />);

      const sandboxToggle = screen.getByRole('switch', { name: /modo simulación|modo sandbox/i });
      expect(sandboxToggle).toBeDefined();

      // Clic para activar Sandbox
      fireEvent.click(sandboxToggle);
      expect(sandboxToggle.getAttribute('aria-checked')).toBe('true');
    });

    it('debe permitir limpiar credenciales con el botón correspondiente', () => {
      useSiigoConfigStore.setState({
        config: {
          username: 'previo@empresa.com',
          accessKey: 'clave_previa_12345',
          isSandbox: false,
          partnerId: 'LaPezcaderiaERP',
          urlBase: 'https://api.siigo.com'
        },
        estadoConexion: 'ONLINE'
      });

      render(<SiigoConfigModal isOpen={true} onClose={() => {}} />);

      const clearBtn = screen.getByRole('button', { name: /limpiar credenciales/i });
      fireEvent.click(clearBtn);

      expect(useSiigoConfigStore.getState().config).toBeNull();
      expect(useSiigoConfigStore.getState().estadoConexion).toBe('NO_CONFIGURADO');
    });
  });
});
