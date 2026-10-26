import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../services/authService';
import { TenantOnboardingService } from '../services/tenantOnboardingService';

describe('TASK-035-02: Orquestador de Autenticación OAuth 2.0 y Servicio de Onboarding', () => {
  let authService: AuthService;
  let tenantService: TenantOnboardingService;

  beforeEach(() => {
    authService = new AuthService({ isMockMode: true });
    tenantService = new TenantOnboardingService({ isMockMode: true });
    tenantService.limpiarEstadoPruebas();
  });

  describe('1. Flujo de Autenticación Inicial & Detección de Onboarding', () => {
    it('debe iniciar sesión con mock Google OAuth y detectar que requiere Onboarding si no tiene empresa', async () => {
      const loginResult = await authService.loginWithProvider('google', {
        email: 'nuevo.fundador@empresa.com',
        nombre: 'Fundador Test',
      });

      expect(loginResult.ok).toBe(true);
      expect(loginResult.user).toBeDefined();
      expect(loginResult.user?.email).toBe('nuevo.fundador@empresa.com');

      // Verificar si tiene empresa vinculada
      const status = tenantService.verificarEstadoUsuario(loginResult.user!.id);
      expect(status.tieneEmpresa).toBe(false);
      expect(status.necesitaOnboarding).toBe(true);
    });

    it('debe permitir logout limpiando la sesión activa', async () => {
      await authService.loginWithProvider('google', {
        email: 'admin@pezcaderia.com',
        nombre: 'Yurgen Admin',
      });

      expect(authService.getUsuarioActivo()).not.toBeNull();
      await authService.logout();
      expect(authService.getUsuarioActivo()).toBeNull();
    });
  });

  describe('2. Onboarding de Primer Tenant (2 Pasos)', () => {
    it('debe registrar la empresa y aprovisionar automáticamente Bodega Principal y Caja 01', async () => {
      const loginResult = await authService.loginWithProvider('google', {
        email: 'propietario@pezcaderia.com',
        nombre: 'Propietario Pezca',
      });

      const resOnboarding = await tenantService.crearPrimerTenantConAdmin({
        userId: loginResult.user!.id,
        userEmail: loginResult.user!.email,
        razonSocial: 'La Gran Pezcadería del Norte S.A.S.',
        nit: '900.888.777-1',
        ciudad: 'Bucaramanga',
        direccion: 'Calle 34 # 12-45',
        telefono: '3158889900',
      });

      expect(resOnboarding.ok).toBe(true);
      expect(resOnboarding.tenant).toBeDefined();
      expect(resOnboarding.tenant?.razonSocial).toBe('La Gran Pezcadería del Norte S.A.S.');
      expect(resOnboarding.membership?.role).toBe('admin');
      expect(resOnboarding.membership?.isOwner).toBe(true);

      // Verificar que se aprovisionó la Bodega 1 y Caja 01
      expect(resOnboarding.bodegaPrincipalId).toBe('1');
      expect(resOnboarding.cajaPrincipalCodigo).toBe('CAJA-01');

      // El usuario ahora tiene empresa y no necesita onboarding
      const statusActualizado = tenantService.verificarEstadoUsuario(loginResult.user!.id);
      expect(statusActualizado.tieneEmpresa).toBe(true);
      expect(statusActualizado.necesitaOnboarding).toBe(false);
      expect(statusActualizado.rol).toBe('admin');
    });

    it('debe rechazar onboarding si el usuario ya es dueño de otra empresa', async () => {
      const login = await authService.loginWithProvider('google', {
        email: 'dueno.duplicado@empresa.com',
        nombre: 'Dueño Duplicado',
      });

      await tenantService.crearPrimerTenantConAdmin({
        userId: login.user!.id,
        userEmail: login.user!.email,
        razonSocial: 'Empresa 1',
        nit: '900.111.222-1',
        ciudad: 'Cali',
        telefono: '3110001122',
      });

      // Intento de crear una segunda empresa con el mismo usuario
      const intento2 = await tenantService.crearPrimerTenantConAdmin({
        userId: login.user!.id,
        userEmail: login.user!.email,
        razonSocial: 'Empresa 2',
        nit: '900.333.444-2',
        ciudad: 'Medellín',
        telefono: '3110001122',
      });

      expect(intento2.ok).toBe(false);
      expect(intento2.error).toMatch(/ya cuenta con una empresa registrada/i);
    });
  });

  describe('3. Generación y Canje de Invitaciones de Empleados', () => {
    it('debe permitir al administrador crear una invitación con token único y link copiable', async () => {
      // 1. Crear empresa primero
      const adminLogin = await authService.loginWithProvider('google', {
        email: 'gerente@pezca.com',
        nombre: 'Gerente Pezca',
      });

      const tenantRes = await tenantService.crearPrimerTenantConAdmin({
        userId: adminLogin.user!.id,
        userEmail: adminLogin.user!.email,
        razonSocial: 'Pezcaderia Central S.A.S.',
        nit: '901.222.333-4',
        ciudad: 'Bogotá',
        telefono: '3123456789',
      });

      // 2. Invitar empleado con rol 'vendedor'
      const inviteRes = await tenantService.crearInvitacionEmpleado({
        tenantId: tenantRes.tenant!.id,
        invitedByUserId: adminLogin.user!.id,
        nombre: 'Carlos Mostrador',
        email: 'carlos.vendedor@gmail.com',
        rol: 'vendedor',
      });

      expect(inviteRes.ok).toBe(true);
      expect(inviteRes.invitation).toBeDefined();
      expect(inviteRes.invitation?.token).toBeDefined();
      expect(inviteRes.inviteLink).toContain(`invite=${inviteRes.invitation?.token}`);

      // 3. Empleado canjea el token al iniciar sesión
      const empleadoLogin = await authService.loginWithProvider('google', {
        email: 'carlos.vendedor@gmail.com',
        nombre: 'Carlos Mostrador',
      });

      const canjeRes = await tenantService.canjearInvitacion({
        token: inviteRes.invitation!.token,
        userId: empleadoLogin.user!.id,
        userEmail: empleadoLogin.user!.email,
      });

      expect(canjeRes.ok).toBe(true);
      expect(canjeRes.membership?.role).toBe('vendedor');
      expect(canjeRes.membership?.tenantId).toBe(tenantRes.tenant!.id);
      expect(canjeRes.membership?.isOwner).toBe(false);

      // La invitación ahora debe figurar como aceptada y no reutilizable
      const canjeDuplicado = await tenantService.canjearInvitacion({
        token: inviteRes.invitation!.token,
        userId: 'otro-usuario-id',
        userEmail: 'otro@gmail.com',
      });
      expect(canjeDuplicado.ok).toBe(false);
      expect(canjeDuplicado.error).toMatch(/ya fue aceptada|inválida/i);
    });

    it('debe rechazar invitaciones con token inexistente o expirado', async () => {
      const res = await tenantService.canjearInvitacion({
        token: 'token-falso-inexistente',
        userId: 'user-123',
        userEmail: 'user@test.com',
      });

      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/no encontrada|inválida/i);
    });
  });
});
