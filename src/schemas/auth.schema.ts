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

/**
 * Esquema de Creación de Usuarios con Cédula como Contraseña Inicial
 */
export const UserCreationSchema = z.object({
  nombre: z
    .string({ required_error: 'El nombre completo es obligatorio' })
    .trim()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(255, 'El nombre excede el límite permitido'),
  identificacion: z
    .string({ required_error: 'El número de identificación es obligatorio' })
    .trim()
    .min(5, 'La identificación debe tener mínimo 5 dígitos')
    .max(20, 'La identificación es demasiado larga')
    .regex(/^\d+$/, 'La identificación solo debe contener números'),
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .trim()
    .email('El correo electrónico no es válido')
    .toLowerCase()
    .max(255, 'El correo excede el límite permitido'),
  telefono: z
    .string({ required_error: 'El teléfono/celular es obligatorio' })
    .trim()
    .min(7, 'El teléfono debe tener mínimo 7 dígitos')
    .max(20, 'El teléfono es demasiado largo'),
  rol: z.enum(
    ['ADMINISTRADOR', 'VENDEDOR', 'CAJERO', 'BODEGUERO', 'SUPERVISOR', 'CONTADOR', 'GERENTE'],
    { errorMap: () => ({ message: 'El rol especificado no es válido en el sistema' }) }
  ),
  permisosPersonalizados: z.record(z.string(), z.boolean()).optional().default({}),
});

export type UserCreationInput = z.infer<typeof UserCreationSchema>;

export function validarUserCreation(input: unknown): ValidationResult<UserCreationInput> {
  const result = UserCreationSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => e.message).join('. '),
    };
  }
  return { success: true, data: result.data };
}

/**
 * Esquema de Cambio Forzoso de Contraseña (Primer Login)
 */
export const MandatoryPasswordChangeSchema = z
  .object({
    newPassword: z
      .string({ required_error: 'La nueva contraseña es obligatoria' })
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
      .max(100, 'La contraseña es demasiado larga')
      .regex(/[A-Z]/, 'La contraseña debe incluir al menos una letra mayúscula')
      .regex(/[0-9]/, 'La contraseña debe incluir al menos un número'),
    confirmPassword: z.string({ required_error: 'La confirmación es obligatoria' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type MandatoryPasswordChangeInput = z.infer<typeof MandatoryPasswordChangeSchema>;

export function validarMandatoryPasswordChange(
  input: unknown
): ValidationResult<MandatoryPasswordChangeInput> {
  const result = MandatoryPasswordChangeSchema.safeParse(input);
  if (!result.success) {
    return {
      success: false,
      error: result.error.errors.map((e) => e.message).join('. '),
    };
  }
  return { success: true, data: result.data };
}

