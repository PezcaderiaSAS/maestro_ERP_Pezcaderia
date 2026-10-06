import { describe, it, expect } from 'vitest';
import { 
  posOpenSessionSchema, 
  posCloseSessionSchema, 
  posCashTransferSchema, 
  posRestockSchema 
} from '../schemas/pos.schema';

describe('POS Zod Schemas', () => {
  describe('posOpenSessionSchema', () => {
    it('should validate correctly with valid data', () => {
      const validData = {
        registerId: '123e4567-e89b-12d3-a456-426614174000',
        openingAmount: 150000,
      };
      const result = posOpenSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if registerId is not a UUID', () => {
      const invalidData = {
        registerId: 'invalid-id',
        openingAmount: 150000,
      };
      const result = posOpenSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("El ID de la caja debe ser válido");
      }
    });

    it('should fail if openingAmount is negative', () => {
      const invalidData = {
        registerId: '123e4567-e89b-12d3-a456-426614174000',
        openingAmount: -500,
      };
      const result = posOpenSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('posCloseSessionSchema', () => {
    it('should validate correctly with valid data', () => {
      const validData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        declaredAmount: 500000,
      };
      const result = posCloseSessionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if declaredAmount is negative', () => {
      const invalidData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        declaredAmount: -1,
      };
      const result = posCloseSessionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('posCashTransferSchema', () => {
    it('should validate correctly with valid data', () => {
      const validData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 250000,
        reason: 'REMESACION',
      };
      const result = posCashTransferSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if reason is invalid', () => {
      const invalidData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 250000,
        reason: 'INVALID_REASON',
      };
      const result = posCashTransferSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Razón de traslado no válida");
      }
    });

    it('should fail if amount is zero or negative', () => {
      const invalidData = {
        sessionId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 0,
        reason: 'RETIRO_PARCIAL',
      };
      const result = posCashTransferSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('posRestockSchema', () => {
    it('should validate correctly with valid data', () => {
      const validData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        targetWarehouseId: '123e4567-e89b-12d3-a456-426614174001',
        requestedQuantity: 50.5,
      };
      const result = posRestockSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should fail if requestedQuantity is negative', () => {
      const invalidData = {
        productId: '123e4567-e89b-12d3-a456-426614174000',
        targetWarehouseId: '123e4567-e89b-12d3-a456-426614174001',
        requestedQuantity: -10,
      };
      const result = posRestockSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
