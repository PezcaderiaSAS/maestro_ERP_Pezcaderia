import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ManualWeightModal, CHIPS_PESO_FRECUENTE } from '../views/pos/components/ManualWeightModal';
import type { Product } from '../types/erp.types';

/**
 * Suite de Pruebas de Estrés y Casos Límite Adversarial
 * M3 Weighing Stress Challenger (Instance 1)
 * Archivo exclusivo: src/tests/posManualWeightStressChallenger.test.tsx
 */
describe('M3 Weighing Stress Challenger: ManualWeightModal Adversarial & Boundary Suite', () => {
  const mockProductPargo: Product = {
    id: 'prod-pargo-rojo',
    sku: 'PAR-ROJ-01',
    nombre: 'Pargo Rojo Fresco del Caribe',
    categoria: 'PESCADOS',
    unidadMedida: 'kg',
    precio_venta_pos: 45000,
    precio_compra: 30000,
    buffer_seguridad: 5,
    codigo_barras: '7709998881112',
    activo: true,
  } as Product;

  const mockOnConfirm = vi.fn();
  const mockOnConfirmWeight = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. CASOS LÍMITE NUMÉRICOS: 0, NEGATIVO, INICIAR CON PUNTO DECIMAL
  // =========================================================================
  describe('1. Casos Límite Numéricos (0, Negativos, Iniciar con Punto)', () => {
    it('1.1 Bloquea intento de confirmar peso 0 tras limpiar con C o digitar 0', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={1.0}
          onConfirm={mockOnConfirm}
          onConfirmWeight={mockOnConfirmWeight}
          onClose={mockOnClose}
        />
      );

      // Limpiar el valor inicial
      const btnClear = screen.getByTestId('keypad-btn-clear');
      fireEvent.click(btnClear);

      // Digitar 0
      const btn0 = screen.getByTestId('keypad-btn-0');
      fireEvent.click(btn0);

      const confirmBtn = screen.getByTestId('manual-weight-confirm-btn');
      fireEvent.click(confirmBtn);

      // Verificaciones
      expect(screen.getByText(/Por favor ingresa un peso mayor a 0 kg/i)).toBeInTheDocument();
      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnConfirmWeight).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('1.2 Bloquea intento de confirmar peso negativo ingresado en el input directo', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          onConfirm={mockOnConfirm}
          onConfirmWeight={mockOnConfirmWeight}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '-2.5' } });

      const confirmBtn = screen.getByTestId('manual-weight-confirm-btn');
      fireEvent.click(confirmBtn);

      expect(screen.getByText(/Por favor ingresa un peso mayor a 0 kg/i)).toBeInTheDocument();
      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnConfirmWeight).not.toHaveBeenCalled();
    });

    it('1.3 Iniciar con punto decimal en teclado táctil: "." -> "0." y luego "500" -> 0.5 kg', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={0}
          precioUnitario={45000}
          onConfirm={mockOnConfirm}
          onConfirmWeight={mockOnConfirmWeight}
          onClose={mockOnClose}
        />
      );

      const btnDot = screen.getByTestId('keypad-btn-dot');
      const btn5 = screen.getByTestId('keypad-btn-5');
      const btn0 = screen.getByTestId('keypad-btn-0');
      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;

      // Presionar '.' con visor inicialmente vacío
      fireEvent.click(btnDot);
      expect(input.value).toBe('0.');

      // Digitar 5, 0, 0
      fireEvent.click(btn5);
      expect(input.value).toBe('0.5');
      fireEvent.click(btn0);
      expect(input.value).toBe('0.50');
      fireEvent.click(btn0);
      expect(input.value).toBe('0.500');

      // Subtotal projected: 0.500 * 45000 = $22.500 COP
      const subtotalDisplay = screen.getByTestId('manual-weight-subtotal');
      expect(subtotalDisplay.textContent).toMatch(/22\.500/);

      // Confirmar
      const confirmBtn = screen.getByTestId('manual-weight-confirm-btn');
      fireEvent.click(confirmBtn);

      expect(mockOnConfirm).toHaveBeenCalledWith(mockProductPargo, 0.5);
      expect(mockOnConfirmWeight).toHaveBeenCalledWith(0.5);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('1.4 Iniciar con punto decimal directo en input (".750") calcula subtotal y confirma correctamente', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          precioUnitario={40000}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '.750' } });

      const subtotal = screen.getByTestId('manual-weight-subtotal');
      expect(subtotal.textContent).toMatch(/30\.000/);

      fireEvent.click(screen.getByTestId('manual-weight-confirm-btn'));
      expect(mockOnConfirm).toHaveBeenCalledWith(mockProductPargo, 0.75);
    });
  });

  // =========================================================================
  // 2. MÚLTIPLES PUNTOS DECIMALES (CONSECUTIVOS Y DISPERSOS)
  // =========================================================================
  describe('2. Múltiples Puntos Decimales (Consecutivos, Dispersos y Límite de 3 Decimales)', () => {
    it('2.1 Ignora puntos decimales consecutivos en teclado táctil ("1" -> "." -> "." -> "2" resulta en "1.2")', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const btn1 = screen.getByTestId('keypad-btn-1');
      const btnDot = screen.getByTestId('keypad-btn-dot');
      const btn2 = screen.getByTestId('keypad-btn-2');
      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;

      fireEvent.click(btn1);
      fireEvent.click(btnDot);
      fireEvent.click(btnDot); // Segundo punto consecutivo, debe ser ignorado
      fireEvent.click(btn2);

      expect(input.value).toBe('1.2');

      const dotCount = (input.value.match(/\./g) || []).length;
      expect(dotCount).toBe(1);
    });

    it('2.2 Ignora puntos decimales dispersos en teclado táctil ("1" -> "." -> "2" -> "." -> "3" resulta en "1.23")', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const btn1 = screen.getByTestId('keypad-btn-1');
      const btnDot = screen.getByTestId('keypad-btn-dot');
      const btn2 = screen.getByTestId('keypad-btn-2');
      const btn3 = screen.getByTestId('keypad-btn-3');
      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;

      fireEvent.click(btn1);
      fireEvent.click(btnDot);
      fireEvent.click(btn2);
      fireEvent.click(btnDot); // Punto disperso cuando ya existe uno
      fireEvent.click(btn3);

      expect(input.value).toBe('1.23');
      expect((input.value.match(/\./g) || []).length).toBe(1);
    });

    it('2.3 Limita a máximo 3 decimales para balanza de alta precisión (ignora 4to decimal)', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const btn1 = screen.getByTestId('keypad-btn-1');
      const btnDot = screen.getByTestId('keypad-btn-dot');
      const btn2 = screen.getByTestId('keypad-btn-2');
      const btn3 = screen.getByTestId('keypad-btn-3');
      const btn4 = screen.getByTestId('keypad-btn-4');
      const btn5 = screen.getByTestId('keypad-btn-5');
      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;

      fireEvent.click(btn1);
      fireEvent.click(btnDot);
      fireEvent.click(btn2);
      fireEvent.click(btn3);
      fireEvent.click(btn4);
      expect(input.value).toBe('1.234');

      // Intentar 4to decimal
      fireEvent.click(btn5);
      expect(input.value).toBe('1.234'); // No debe permitir el 5
    });

    it('2.4 Manejo resiliente si el input recibe texto anómalo con múltiples puntos directos ("1..2" o "1.2.3")', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          precioUnitario={50000}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '1.2.3' } });

      // parseFloat('1.2.3') es 1.2 en JS estándar, el subtotal debe ser 1.2 * 50000 = 60000
      const subtotal = screen.getByTestId('manual-weight-subtotal');
      expect(subtotal.textContent).not.toContain('NaN');
      expect(subtotal.textContent).toMatch(/60\.000/);

      fireEvent.click(screen.getByTestId('manual-weight-confirm-btn'));
      expect(mockOnConfirm).toHaveBeenCalledWith(mockProductPargo, 1.2);
    });
  });

  // =========================================================================
  // 3. PESOS MICROSCÓPICOS (1 GRAMO) Y PESOS MASIVOS (999.999 KG)
  // =========================================================================
  describe('3. Pesos Microscópicos (0.001 kg = 1g) y Pesos Masivos (999.999 kg)', () => {
    it('3.1 Procesa peso microscópico de 0.001 kg (1 gramo de azafrán o caviar) con subtotal exacto en COP', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={{
            ...mockProductPargo,
            nombre: 'Caviar Oscietra Importado',
            precio_venta_pos: 1500000, // 1.500.000 COP x kg
          }}
          pesoInicial={0}
          precioUnitario={1500000}
          onConfirm={mockOnConfirm}
          onConfirmWeight={mockOnConfirmWeight}
          onClose={mockOnClose}
        />
      );

      const btn0 = screen.getByTestId('keypad-btn-0');
      const btnDot = screen.getByTestId('keypad-btn-dot');
      const btn1 = screen.getByTestId('keypad-btn-1');
      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;

      fireEvent.click(btn0);
      fireEvent.click(btnDot);
      fireEvent.click(btn0);
      fireEvent.click(btn0);
      fireEvent.click(btn1);

      expect(input.value).toBe('0.001');

      // 0.001 * 1.500.000 = 1.500 COP
      const subtotal = screen.getByTestId('manual-weight-subtotal');
      expect(subtotal.textContent).toMatch(/1\.500.*COP/);

      fireEvent.click(screen.getByTestId('manual-weight-confirm-btn'));
      expect(mockOnConfirm).toHaveBeenCalledWith(expect.anything(), 0.001);
      expect(mockOnConfirmWeight).toHaveBeenCalledWith(0.001);
    });

    it('3.2 Procesa peso masivo de 999.999 kg (venta mayorista a granel) sin overflow ni distorsión', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={0}
          precioUnitario={35000}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '999.999' } });

      // 999.999 * 35000 = 34.999.965 COP
      const subtotal = screen.getByTestId('manual-weight-subtotal');
      expect(subtotal.textContent).toMatch(/34\.999\.965.*COP/);

      fireEvent.click(screen.getByTestId('manual-weight-confirm-btn'));
      expect(mockOnConfirm).toHaveBeenCalledWith(mockProductPargo, 999.999);
    });
  });

  // =========================================================================
  // 4. RÁFAGA RÁPIDA DE PULSACIONES DE TECLADO (100 PULSACIONES EN BUCLE)
  // =========================================================================
  describe('4. Ráfaga Rápida de Pulsaciones de Teclado en Pantalla (Stress Harness)', () => {
    it('4.1 Ejecuta ráfaga de 100 pulsaciones mixtas sin que el visor o subtotal caigan en NaN o provoquen crash', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={1.0}
          precioUnitario={45000}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const btnDigits = [
        screen.getByTestId('keypad-btn-1'),
        screen.getByTestId('keypad-btn-2'),
        screen.getByTestId('keypad-btn-3'),
        screen.getByTestId('keypad-btn-4'),
        screen.getByTestId('keypad-btn-5'),
        screen.getByTestId('keypad-btn-6'),
        screen.getByTestId('keypad-btn-7'),
        screen.getByTestId('keypad-btn-8'),
        screen.getByTestId('keypad-btn-9'),
        screen.getByTestId('keypad-btn-0'),
      ];
      const btnDot = screen.getByTestId('keypad-btn-dot');
      const btnBackspace = screen.getByTestId('keypad-btn-backspace');
      const btnClear = screen.getByTestId('keypad-btn-clear');
      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      const subtotal = screen.getByTestId('manual-weight-subtotal');

      // Simular ráfaga táctil rápida de 100 toques alternando dígitos, puntos, borrados y limpiezas
      for (let i = 0; i < 100; i++) {
        const mod = i % 15;
        if (mod === 5) {
          fireEvent.click(btnDot);
        } else if (mod === 9) {
          fireEvent.click(btnBackspace);
        } else if (mod === 14) {
          fireEvent.click(btnClear);
        } else {
          const digitBtn = btnDigits[i % btnDigits.length];
          fireEvent.click(digitBtn);
        }

        // En NINGÚN momento durante las 100 iteraciones el subtotal debe ser NaN
        expect(subtotal.textContent).not.toContain('NaN');
        expect(subtotal.textContent).not.toContain('undefined');
        expect(input.value).not.toContain('NaN');
      }

      // Al final de la ráfaga el sistema debe permanecer responsivo y confirmar limpiamente si hay valor
      fireEvent.click(btnClear);
      fireEvent.click(btnDigits[2]); // '3'
      fireEvent.click(btnDot);
      fireEvent.click(btnDigits[5]); // '6'

      expect(input.value).toBe('3.6');
      expect(subtotal.textContent).toMatch(/162\.000.*COP/); // 3.6 * 45000 = 162.000

      fireEvent.click(screen.getByTestId('manual-weight-confirm-btn'));
      expect(mockOnConfirm).toHaveBeenCalledWith(mockProductPargo, 3.6);
    });

    it('4.2 Ráfaga de 100 backspaces consecutivos sobre input vacío no causa excepciones de índice negativo', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const btnBackspace = screen.getByTestId('keypad-btn-backspace');
      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;

      // 100 pulsaciones de borrar en estado vacío
      for (let i = 0; i < 100; i++) {
        fireEvent.click(btnBackspace);
      }

      expect(input.value).toBe('');
      const subtotal = screen.getByTestId('manual-weight-subtotal');
      expect(subtotal.textContent).toMatch(/\$0.*COP/);
    });
  });

  // =========================================================================
  // 5. COMPORTAMIENTO DEL BOTÓN LIMPIAR 'C' EN ESTADOS INTERMEDIOS
  // =========================================================================
  describe('5. Comportamiento del Botón Limpiar "C" en Estados Intermedios', () => {
    it('5.1 Limpia peso existente y resetea el subtotal a $0 COP', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={3.5}
          precioUnitario={45000}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(input.value).toBe('3.5');

      const btnClear = screen.getByTestId('keypad-btn-clear');
      fireEvent.click(btnClear);

      expect(input.value).toBe('');
      const subtotal = screen.getByTestId('manual-weight-subtotal');
      expect(subtotal.textContent).toMatch(/\$0.*COP/);
    });

    it('5.2 Limpia mensaje de error previo al presionar "C"', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      // Provocar error intentando confirmar sin peso
      fireEvent.click(screen.getByTestId('manual-weight-confirm-btn'));
      expect(screen.getByText(/Por favor ingresa un peso mayor a 0 kg/i)).toBeInTheDocument();

      // Presionar tecla C
      const btnClear = screen.getByTestId('keypad-btn-clear');
      fireEvent.click(btnClear);

      // El mensaje de error debe desaparecer inmediatamente
      expect(screen.queryByText(/Por favor ingresa un peso mayor a 0 kg/i)).not.toBeInTheDocument();
    });

    it('5.3 Permite ingresar nuevo valor limpio inmediatamente después de presionar "C" sin concatenar basura', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={1.5}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      const btnClear = screen.getByTestId('keypad-btn-clear');
      const btn7 = screen.getByTestId('keypad-btn-7');

      fireEvent.click(btnClear);
      expect(input.value).toBe('');

      fireEvent.click(btn7);
      expect(input.value).toBe('7'); // Debe ser '7' exacto, no '1.57' ni '07'
    });

    it('5.4 Soporta múltiples clicks repetidos en "C" sin degradación de estado', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          pesoInicial={2.0}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const btnClear = screen.getByTestId('keypad-btn-clear');
      for (let i = 0; i < 10; i++) {
        fireEvent.click(btnClear);
      }

      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(input.value).toBe('');
    });
  });

  // =========================================================================
  // 6. REDONDEO CONTABLE DEL SUBTOTAL PROJECTED EN COP (SIN FRACCIONES EXTRAÑAS)
  // =========================================================================
  describe('6. Redondeo Contable del Subtotal Proyectado en COP (Moneda Legal)', () => {
    const testCasesCOP = [
      { peso: '0.333', precio: 17550, esperado: 5844 }, // 0.333 * 17550 = 5844.15 -> 5844
      { peso: '0.125', precio: 43333, esperado: 5417 }, // 0.125 * 43333 = 5416.625 -> 5417
      { peso: '0.003', precio: 99999, esperado: 300 },  // 0.003 * 99999 = 299.997 -> 300
      { peso: '0.777', precio: 28450, esperado: 22106 }, // 0.777 * 28450 = 22105.65 -> 22106
      { peso: '1.414', precio: 32900, esperado: 46521 }, // 1.414 * 32900 = 46520.6 -> 46521
    ];

    testCasesCOP.forEach(({ peso, precio, esperado }) => {
      it(`6.x Redondea contablemente ${peso} kg x $${precio} = $${esperado.toLocaleString('es-CO')} COP sin decimales en display ni botón`, () => {
        const { unmount } = render(
          <ManualWeightModal
            isOpen={true}
            producto={mockProductPargo}
            precioUnitario={precio}
            pesoInicial={0}
            onConfirm={mockOnConfirm}
            onClose={mockOnClose}
          />
        );

        const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
        fireEvent.change(input, { target: { value: peso } });

        const subtotalSpan = screen.getByTestId('manual-weight-subtotal');
        const confirmBtn = screen.getByTestId('manual-weight-confirm-btn');

        const formatoEsperado = esperado.toLocaleString('es-CO');

        // El display debe contener el valor entero con separador de miles colombiano
        expect(subtotalSpan.textContent).toContain(`$${formatoEsperado} COP`);
        // El botón gigante de confirmar también debe reflejar la cifra redondeada
        expect(confirmBtn.textContent).toContain(`$${formatoEsperado}`);

        // No debe contener fracciones flotantes con coma o punto decimal tras los enteros
        expect(subtotalSpan.textContent).not.toMatch(new RegExp(`\\$${formatoEsperado}[,\\.]\\d+`));

        unmount();
      });
    });
  });

  // =========================================================================
  // 7. INTERACCIÓN HÍBRIDA: CHIPS FRECUENTES VS TECLADO TÁCTIL VS TECLADO FÍSICO
  // =========================================================================
  describe('7. Interacción Híbrida: Chips Frecuentes, Teclado Táctil y Teclas Enter/Escape', () => {
    it('7.1 Cambiar de un chip a edición táctil preserva consistencia y no concatena de forma errática', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          precioUnitario={45000}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      // Clic en chip 0.5 kg
      const chip05 = screen.getByTestId('chip-weight-0.5');
      fireEvent.click(chip05);

      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      expect(input.value).toBe('0.5');

      // Presionar tecla '5' -> debe quedar '0.55' (porque ya tiene '.')
      const btn5 = screen.getByTestId('keypad-btn-5');
      fireEvent.click(btn5);
      expect(input.value).toBe('0.55');

      // Presionar chip 2 kg -> debe sobrescribir a '2'
      const chip2 = screen.getByTestId('chip-weight-2');
      fireEvent.click(chip2);
      expect(input.value).toBe('2');

      // Presionar '.' y luego '75'
      fireEvent.click(screen.getByTestId('keypad-btn-dot'));
      fireEvent.click(screen.getByTestId('keypad-btn-7'));
      fireEvent.click(screen.getByTestId('keypad-btn-5'));
      expect(input.value).toBe('2.75');

      fireEvent.click(screen.getByTestId('manual-weight-confirm-btn'));
      expect(mockOnConfirm).toHaveBeenCalledWith(mockProductPargo, 2.75);
    });

    it('7.2 Presionar Enter en el input confirma con el peso ingresado', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          precioUnitario={30000}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      fireEvent.change(input, { target: { value: '1.85' } });
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

      expect(mockOnConfirm).toHaveBeenCalledWith(mockProductPargo, 1.85);
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('7.3 Presionar Escape en el input cancela y cierra el modal sin confirmar', () => {
      render(
        <ManualWeightModal
          isOpen={true}
          producto={mockProductPargo}
          onConfirm={mockOnConfirm}
          onClose={mockOnClose}
        />
      );

      const input = screen.getByTestId('manual-weight-input') as HTMLInputElement;
      fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

      expect(mockOnConfirm).not.toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
