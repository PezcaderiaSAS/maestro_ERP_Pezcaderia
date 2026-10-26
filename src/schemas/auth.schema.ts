import { z } from 'zod';
import type { RoleRbac } from '../types/auth.types';

export const SUPPORTED_RBAC_ROLES: RoleRbac[] = [
  'admin',
  'vendedor',
  'cajero',
  'bodeguero',
  'supervisor',
  'contador',
];

/**
 * Esquema de Onboarding de Empresa / Tenant inicial
 */
export const TenantOnboardingSchema = z.object({
  razonSocial: z
    .string({ required_error: 'La razón social es obligatoria' })
    .trim()
    .min(3, 'La razón social debe tener mínimo 3 caracteres'),
  nit: z
    .string({ required_error: 'El NIT/RUT es obligatorio' })
    .trim()
    .min(5, 'El NIT debe ser válido')
    .regex(/^[0-9.-]+$/, 'El formato del NIT es inválido'),
  ciudad: z
    .string({ required_error: 'La ciudad es obligatoria' })
    .trim()
    .min(2, 'La ciudad debe tener mínimo 2 caracteres'),
  direccion: z.string().trim().optional(),
  telefono: z
    .string({ required_error: 'El teléfono es obligatorio' })
    .trim()
    .min(7, 'El teléfono debe tener mínimo 7 dígitos'),
  regimenTributario: z.string().trim().optional().default('COMUN'),
});

export type TenantOnboardingInput = z.infer<typeof TenantOnboardingSchema>;

/**
 * Esquema de Invitación de Empleados
 */
export const EmployeeInvitationSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre del empleado es obligatorio' })
    .trim()
    .min(2, 'El nombre debe tener mínimo 2 caracteres'),
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .email('El correo electrónico no es válido')
    .toLowerCase(),
  rol: z.enum(SUPPORTED_RBAC_ROLES as [RoleRbac, ...RoleRbac[]], {
    errorMap: () => ({ message: 'El rol especificado no es válido en el sistema' }),
  }),
});

export type EmployeeInvitationInput = z.infer<typeof EmployeeInvitationSchema>;

/**
 * Esquema de Aceptación y Canje de Invitación
 */
export const AcceptInvitationSchema = z.object({
  token: z
    .string({ required_error: 'El token de invitación es obligatorio' })
    .trim()
    .min(5, 'El token de invitación no es válido'),
  userId: z
    .string({ required_error: 'El ID de usuario es obligatorio' })
    .trim()
    .min(1, 'El ID de usuario es obligatorio'),
});

export type AcceptInvitationInput = z.infer<typeof AcceptInvitationSchema>;

/**
 * Esquema de Inicio de Sesión por Correo
 */
export const LoginEmailSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .email('El correo electrónico no es válido')
    .toLowerCase(),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(6, 'La contraseña debe tener mínimo 6 caracteres'),
});

export type LoginEmailInput = z.infer<typeof LoginEmailSchema>;

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function validarTenantOnboarding(input: unknown): ValidationResult<TenantOnboardingInput> {
  const result = TenantOnboardingSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => e.message).join('. '),
    };
  }
  return { success: true, data: result.data };
}

export function validarEmployeeInvitation(input: unknown): ValidationResult<EmployeeInvitationInput> {
  const result = EmployeeInvitationSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => e.message).join('. '),
    };
  }
  return { success: true, data: result.data };
}

export function validarAcceptInvitation(input: unknown): ValidationResult<AcceptInvitationInput> {
  const result = AcceptInvitationSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => e.message).join('. '),
    };
  }
  return { success: true, data: result.data };
}

export function validarLoginEmail(input: unknown): ValidationResult<LoginEmailInput> {
  const result = LoginEmailSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => e.message).join('. '),
    };
  }
  return { success: true, data: result.data };
}
