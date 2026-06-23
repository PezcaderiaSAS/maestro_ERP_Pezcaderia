// src/types/common.types.ts

export interface ResultadoOperacion<T> {
  data: T | null;
  error: string | null;
}

export interface Auditable {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
