import { describe, it, expect } from 'vitest';
import { inventoryTransferSchema, inventoryAdjustmentSchema } from '../schemas/inventory.schema';

describe('Inventory Zod Schemas', () => {
  describe('inventoryTransferSchema', () => {
    const validTransfer = {
      sourceWarehouseId: '11111111-1111-1111-1111-111111111111',
      targetWarehouseId: '22222222-2222-2222-2222-222222222222',
      sku: 'SALMON-01',
      quantity: 10,
    };

    it('should pass with valid data', () => {
      const result = inventoryTransferSchema.safeParse(validTransfer);
      expect(result.success).toBe(true);
    });

    it('should fail if source and target warehouses are the same', () => {
      const result = inventoryTransferSchema.safeParse({
        ...validTransfer,
        targetWarehouseId: validTransfer.sourceWarehouseId,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('La bodega de origen y destino no pueden ser la misma');
      }
    });

    it('should fail if quantity is less than or equal to 0', () => {
      const result = inventoryTransferSchema.safeParse({
        ...validTransfer,
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('inventoryAdjustmentSchema', () => {
    const validAdjustment = {
      warehouseId: '11111111-1111-1111-1111-111111111111',
      sku: 'SALMON-01',
      quantity: -5,
      movementType: 'SCRAP',
      notes: 'Descarte por daño en cadena de frío',
    };

    it('should pass with valid data', () => {
      const result = inventoryAdjustmentSchema.safeParse(validAdjustment);
      expect(result.success).toBe(true);
    });

    it('should fail if quantity is 0', () => {
      const result = inventoryAdjustmentSchema.safeParse({
        ...validAdjustment,
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should fail if notes are less than 5 characters', () => {
      const result = inventoryAdjustmentSchema.safeParse({
        ...validAdjustment,
        notes: 'Daño',
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Debe proveer una justificación clara (mín. 5 caracteres)');
      }
    });
    
    it('should fail with invalid movementType', () => {
      const result = inventoryAdjustmentSchema.safeParse({
        ...validAdjustment,
        movementType: 'INVALID',
      });
      expect(result.success).toBe(false);
    });
  });
});
