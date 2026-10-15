import {
  IPaymentSettlementStrategy,
  PaymentSettlementResult,
  RegistrarEntregaEnSitioInput,
} from '../../../contracts/b2b.contracts';

/**
 * Estrategia de recaudo para pago en EFECTIVO.
 * Cumple con el principio Open/Closed (OCP).
 */
export class CashPaymentStrategy implements IPaymentSettlementStrategy {
  procesarRecaudo(
    montoOriginal: number,
    input: RegistrarEntregaEnSitioInput
  ): PaymentSettlementResult {
    const montoCobrado = input.montoCobradoFinal !== undefined ? input.montoCobradoFinal : montoOriginal;
    const efectivo = input.montoEfectivo ?? input.montoCobradoEfectivo ?? montoCobrado;
    return {
      montoEfectivo: efectivo,
      montoDigital: 0,
      montoCobradoFinal: efectivo,
    };
  }
}

/**
 * Estrategia de recaudo para pago por TRANSFERENCIA DIGITAL.
 */
export class DigitalTransferPaymentStrategy implements IPaymentSettlementStrategy {
  procesarRecaudo(
    montoOriginal: number,
    input: RegistrarEntregaEnSitioInput
  ): PaymentSettlementResult {
    const montoCobrado = input.montoCobradoFinal !== undefined ? input.montoCobradoFinal : montoOriginal;
    const digital = input.montoDigital ?? input.montoCobradoDigital ?? montoCobrado;
    return {
      montoEfectivo: 0,
      montoDigital: digital,
      montoCobradoFinal: digital,
    };
  }
}

/**
 * Estrategia de recaudo para facturación a CRÉDITO B2B (no se recibe dinero en mano).
 */
export class CreditB2BPaymentStrategy implements IPaymentSettlementStrategy {
  procesarRecaudo(
    montoOriginal: number,
    input: RegistrarEntregaEnSitioInput
  ): PaymentSettlementResult {
    const montoCobrado = input.montoCobradoFinal !== undefined ? input.montoCobradoFinal : montoOriginal;
    return {
      montoEfectivo: 0,
      montoDigital: 0,
      montoCobradoFinal: montoCobrado,
    };
  }
}

/**
 * Estrategia de recaudo para pago MIXTO (fracción efectivo + fracción digital).
 */
export class MixedPaymentStrategy implements IPaymentSettlementStrategy {
  procesarRecaudo(
    montoOriginal: number,
    input: RegistrarEntregaEnSitioInput
  ): PaymentSettlementResult {
    const efectivo = input.montoEfectivo ?? input.montoCobradoEfectivo ?? 0;
    const digital = input.montoDigital ?? input.montoCobradoDigital ?? 0;
    const montoCobrado = input.montoCobradoFinal !== undefined ? input.montoCobradoFinal : efectivo + digital;
    return {
      montoEfectivo: efectivo,
      montoDigital: digital,
      montoCobradoFinal: montoCobrado,
    };
  }
}

/**
 * Registro y fábrica de estrategias de recaudo (OCP).
 * Permite registrar nuevas estrategias sin modificar los servicios existentes.
 */
export class PaymentStrategyRegistry {
  private readonly strategies = new Map<string, IPaymentSettlementStrategy>();

  constructor() {
    this.registrar('EFECTIVO', new CashPaymentStrategy());
    this.registrar('TRANSFERENCIA_DIGITAL', new DigitalTransferPaymentStrategy());
    this.registrar('CREDITO_B2B', new CreditB2BPaymentStrategy());
    this.registrar('MIXTO', new MixedPaymentStrategy());
  }

  registrar(formaPago: string, estrategia: IPaymentSettlementStrategy): void {
    this.strategies.set(formaPago.toUpperCase(), estrategia);
  }

  obtener(formaPago: string): IPaymentSettlementStrategy {
    const estrategia = this.strategies.get((formaPago || '').toUpperCase());
    if (!estrategia) {
      // Fallback seguro a crédito o efectivo si no coincide
      return this.strategies.get('CREDITO_B2B') || new CreditB2BPaymentStrategy();
    }
    return estrategia;
  }
}

export const paymentStrategyRegistry = new PaymentStrategyRegistry();
