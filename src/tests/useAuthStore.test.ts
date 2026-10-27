import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore, mapRoleRbacToUserRole } from '../store/useAuthStore';
import { useAppStore } from '../store/useAppStore';
import { tenantOnboardingService } from '../services/tenantOnboardingService';
import * as localDb from '../services/localDb';

describe('TASK-035-03: useAuthStore - Gestión de Sesión y Onboarding Multi-Tenant', () => {
  beforeEach(() => {
    // Resetear almacenes y servicios
    tenantOnboardingService.limpiarEstadoPruebas();
    localDb.remove('auth_session');
    useAuthStore.setState({
      status: 'unauthenticated',
      currentUser: null,
      activeTenant: null,
      token: null,
      pendingInviteToken: null,
      isLoading: false,
      error: null,
      tenantInvitations: [],
    });
  });

  it('debe mapear correctamente los roles RBAC a los roles operativos del ERP', () => {
    expect(mapRoleRbacToUserRole('admin')).toBe('admin');
    expect(mapRoleRbacToUserRole('vendedor')).toBe('vendedor');
    expect(mapRoleRbacToUserRole('cajero')).toBe('vendedor');
    expect(mapRoleRbacToUserRole('bodeguero')).toBe('bodega');
    expect(mapRoleRbacToUserRole('supervisor')).toBe('administrativo');
    expect(mapRoleRbacToUserRole('contador')).toBe('administrativo');
  });

  it('inicia en estado unauthenticated con usuario nulo', () => {
    const state = useAuthStore.getState();
    expect(state.status).toBe('unauthenticated');
    expect(state.currentUser).toBeNull();
    expect(state.activeTenant).toBeNull();
  });

  it('al autenticar por primera vez un usuario sin empresa, debe requerir onboarding (needs_onboarding)', async () => {
    const result = await useAuthStore.getState().loginWithProvider('google', {
      email: 'nuevo.dueno@pezcaderia.com',
      nombre: 'Nuevo Dueño',
    });

    expect(result.ok).toBe(true);
    const state = useAuthStore.getState();
    expect(state.status).toBe('needs_onboarding');
    expect(state.currentUser?.email).toBe('nuevo.dueno@pezcaderia.com');
    expect(state.activeTenant).toBeNull();
  });

  it('completa el onboarding del primer tenant, crea la empresa y asigna al usuario como admin propietario', async () => {
    // 1. Loguear usuario nuevo
    await useAuthStore.getState().loginWithProvider('google', {
      email: 'fundador@pezcaderia.com',
      nombre: 'Carlos Fundador',
    });

    // 2. Completar onboarding
    const onboardingRes = await useAuthStore.getState().completeOnboarding({
      razonSocial: 'Pescadería San Jerónimo S.A.S.',
      nit: '901.456.789-1',
      ciudad: 'Cartagena',
      direccion: 'Muelle La Bodeguita Local 4',
      telefono: '3001234567',
      regimenTributario: 'COMUN',
    });

    expect(onboardingRes.ok).toBe(true);

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.currentUser?.rol).toBe('admin');
    expect(state.currentUser?.isOwner).toBe(true);
    expect(state.activeTenant?.razonSocial).toBe('Pescadería San Jerónimo S.A.S.');
    expect(state.activeTenant?.nit).toBe('901.456.789-1');

    // Sincronización con useAppStore
    const appState = useAppStore.getState();
    expect(appState.userRole).toBe('admin');
    expect(appState.currentUser?.nombre).toBe('Carlos Fundador');
  });

  it('permite al administrador generar enlaces de invitación para empleados con roles RBAC', async () => {
    // 1. Registrar admin y tenant
    await useAuthStore.getState().loginWithProvider('google', {
      email: 'admin@pezcaderia.com',
      nombre: 'Admin General',
    });
    await useAuthStore.getState().completeOnboarding({
      razonSocial: 'Distribuidora del Mar S.A.S.',
      nit: '900.111.222-3',
      ciudad: 'Barranquilla',
      telefono: '3109876543',
    });

    // 2. Invitar a un cajero
    const invRes = await useAuthStore.getState().sendInvitation({
      nombre: 'Juana Cajera',
      email: 'juana.cajera@pezcaderia.com',
      rol: 'cajero',
    });

    expect(invRes.ok).toBe(true);
    expect(invRes.inviteLink).toContain('invite=');
    expect(useAuthStore.getState().tenantInvitations).toHaveLength(1);
    expect(useAuthStore.getState().tenantInvitations[0].role).toBe('cajero');
  });

  it('permite a un empleado invitado canjear su invitación y autenticarse con el rol asignado', async () => {
    // 1. Admin crea empresa e invitación
    await useAuthStore.getState().loginWithProvider('google', {
      email: 'admin.sede@pezcaderia.com',
      nombre: 'Admin Sede',
    });
    await useAuthStore.getState().completeOnboarding({
      razonSocial: 'Mariscos del Caribe',
      nit: '900.333.444-5',
      ciudad: 'Santa Marta',
      telefono: '3157778899',
    });
    const invRes = await useAuthStore.getState().sendInvitation({
      nombre: 'Pedro Bodeguero',
      email: 'pedro.bodega@pezcaderia.com',
      rol: 'bodeguero',
    });
    const token = invRes.invitation!.token;

    // 2. Cerrar sesión del admin
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().status).toBe('unauthenticated');

    // 3. Empleado inicia sesión con token de invitación pendiente
    useAuthStore.getState().setPendingInviteToken(token);
    await useAuthStore.getState().loginWithProvider('google', {
      email: 'pedro.bodega@pezcaderia.com',
      nombre: 'Pedro Bodeguero',
    });

    // 4. Canjear invitación
    const canjeRes = await useAuthStore.getState().acceptInvitation(token);
    expect(canjeRes.ok).toBe(true);

    const state = useAuthStore.getState();
    expect(state.status).toBe('authenticated');
    expect(state.currentUser?.rol).toBe('bodeguero');
    expect(state.currentUser?.isOwner).toBe(false);

    // Sincronización con useAppStore
    expect(useAppStore.getState().userRole).toBe('bodega');
  });

  it('soporta switchRoleDev para testing ágil en modo desarrollo', () => {
    useAuthStore.setState({
      status: 'authenticated',
      currentUser: {
        id: 'usr-dev-1',
        email: 'dev@pezcaderia.com',
        nombre: 'Dev Tester',
        authProvider: 'mock',
        rol: 'admin',
      },
    });

    useAuthStore.getState().switchRoleDev('cajero');
    expect(useAuthStore.getState().currentUser?.rol).toBe('cajero');
    expect(useAppStore.getState().userRole).toBe('vendedor');

    useAuthStore.getState().switchRoleDev('bodeguero');
    expect(useAuthStore.getState().currentUser?.rol).toBe('bodeguero');
    expect(useAppStore.getState().userRole).toBe('bodega');
  });

  it('cierra sesión correctamente y limpia ambos stores', async () => {
    useAuthStore.setState({
      status: 'authenticated',
      currentUser: {
        id: 'usr-123',
        email: 'test@pezcaderia.com',
        nombre: 'Test User',
        authProvider: 'google',
        rol: 'admin',
      },
    });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().currentUser).toBeNull();
    expect(useAppStore.getState().currentUser).toBeNull();
    expect(useAuthStore.getState().tenantInvitations).toHaveLength(0);
  });

  it('aislamiento estricto multi-tenant: los datos e invitaciones de un tenant NUNCA se mezclan con otro (Zero Leakage)', async () => {
    // 1. Tenant A (Empresa A)
    await useAuthStore.getState().loginWithProvider('google', {
      email: 'admin.a@empresa-a.com',
      nombre: 'Admin Empresa A',
    });
    const onboardingA = await useAuthStore.getState().completeOnboarding({
      razonSocial: 'Empresa A S.A.S.',
      nit: '900.000.001-1',
      ciudad: 'Bogotá',
      telefono: '3110000001',
    });
    const tenantAId = onboardingA.tenant!.id;

    await useAuthStore.getState().sendInvitation({
      nombre: 'Empleado A1',
      email: 'empleado.a1@empresa-a.com',
      rol: 'vendedor',
    });
    expect(useAuthStore.getState().tenantInvitations).toHaveLength(1);
    expect(useAuthStore.getState().tenantInvitations[0].email).toBe('empleado.a1@empresa-a.com');

    // 2. Cerrar sesión de Tenant A
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().tenantInvitations).toHaveLength(0);

    // 3. Tenant B (Empresa B)
    await useAuthStore.getState().loginWithProvider('google', {
      email: 'admin.b@empresa-b.com',
      nombre: 'Admin Empresa B',
    });
    const onboardingB = await useAuthStore.getState().completeOnboarding({
      razonSocial: 'Empresa B S.A.S.',
      nit: '900.000.002-2',
      ciudad: 'Medellín',
      telefono: '3110000002',
    });
    const tenantBId = onboardingB.tenant!.id;
    expect(tenantBId).not.toBe(tenantAId);

    // Al cargar invitaciones de Tenant B, debe estar vacío (no se filtran las de Tenant A)
    useAuthStore.getState().loadTenantInvitations();
    expect(useAuthStore.getState().tenantInvitations).toHaveLength(0);

    // Tenant B crea su propia invitación
    await useAuthStore.getState().sendInvitation({
      nombre: 'Empleado B1',
      email: 'empleado.b1@empresa-b.com',
      rol: 'cajero',
    });
    expect(useAuthStore.getState().tenantInvitations).toHaveLength(1);
    expect(useAuthStore.getState().tenantInvitations[0].email).toBe('empleado.b1@empresa-b.com');
    expect(useAuthStore.getState().tenantInvitations[0].tenantId).toBe(tenantBId);

    // Las invitaciones de Tenant A siguen existiendo pero completamente aisladas
    const invitacionesA = tenantOnboardingService.obtenerInvitacionesPorTenant(tenantAId);
    expect(invitacionesA).toHaveLength(1);
    expect(invitacionesA[0].email).toBe('empleado.a1@empresa-a.com');
    expect(invitacionesA[0].tenantId).toBe(tenantAId);
  });
});
