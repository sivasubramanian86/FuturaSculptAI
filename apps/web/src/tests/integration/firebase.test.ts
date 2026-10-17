import { describe, it, expect, beforeEach, vi } from 'vitest';
const firebaseMocks = vi.hoisted(() => {
  const listeners: Array<(user: any) => void> = [];
  const user = {
    uid: 'google-test-01',
    email: 'test.innovator@gmail.com',
    displayName: 'Test Innovator',
    photoURL: null,
    getIdToken: async () => 'verified-firebase-id-token',
    getIdTokenResult: async () => ({ claims: { role: 'ENTERPRISE_ARCHITECT' } }),
  };
  return { listeners, user };
});
vi.mock('firebase/app', () => ({ initializeApp: vi.fn(() => ({ name: 'test' })) }));
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: class {},
  onIdTokenChanged: vi.fn((_auth, listener) => {
    firebaseMocks.listeners.push(listener);
    listener(null);
    return () => undefined;
  }),
  signInWithPopup: vi.fn(async () => {
    firebaseMocks.listeners.forEach((listener) => listener(firebaseMocks.user));
    return { user: firebaseMocks.user };
  }),
  signOut: vi.fn(async () => {
    firebaseMocks.listeners.forEach((listener) => listener(null));
  }),
}));
import { firebaseAuth, PERSONA_PROFILES, UserRole } from '../../services/firebase';

describe('FirebaseAuthService', () => {
  beforeEach(async () => {
    await firebaseAuth.switchPersona('citizen_worker', 'tenant-food-mfg-01');
  });

  it('provides the default citizen_worker session initially', () => {
    const session = firebaseAuth.getCurrentSession();
    expect(session.role).toBe('citizen_worker');
    expect(session.displayName).toBe('Maya Lin');
    expect(session.tenantId).toBe('tenant-food-mfg-01');
    expect(session.permissions).toContain('submit:appeal');
  });

  it('retrieves persona profiles and handles fallback for unknown role', async () => {
    const profile = firebaseAuth.getPersonaProfile('enterprise_architect');
    expect(profile.displayName).toBe('David Vance');
    expect(profile.role).toBe('enterprise_architect');

    // Unknown role fallback
    const fallback = firebaseAuth.getPersonaProfile('unknown_role' as UserRole);
    expect(fallback.role).toBe('citizen_worker');
    expect(fallback.displayName).toBe('Maya Lin');

    const fallbackSession = await firebaseAuth.switchPersona('unknown_role' as UserRole);
    expect(fallbackSession.role).toBe('citizen_worker');
  });

  it('lists all 6 registered personas', () => {
    const personas = firebaseAuth.getAllPersonas();
    expect(personas.length).toBe(6);
    const roles = personas.map((p) => p.role);
    expect(roles).toEqual([
      'citizen_worker',
      'enterprise_architect',
      'investor',
      'hr_executive',
      'customer_care',
      'governance_officer',
    ]);
  });

  it('switches persona successfully with optional tenantId and emits notifications', async () => {
    const listener = vi.fn();
    const unsubscribe = firebaseAuth.onAuthStateChanged(listener);

    // Initial call on subscribe
    expect(listener).toHaveBeenCalledTimes(1);

    const newSession = await firebaseAuth.switchPersona('governance_officer', 'tenant-health-99');
    expect(newSession.role).toBe('governance_officer');
    expect(newSession.displayName).toBe('Dr. Marcus Vance');
    expect(newSession.tenantId).toBe('tenant-health-99');
    expect(listener).toHaveBeenCalledTimes(2);

    // Switch without tenantId preserves current tenant
    const sameTenantSession = await firebaseAuth.switchPersona('investor');
    expect(sameTenantSession.role).toBe('investor');
    expect(sameTenantSession.tenantId).toBe('tenant-health-99');
    expect(listener).toHaveBeenCalledTimes(3);

    unsubscribe();
    await firebaseAuth.switchPersona('customer_care');
    expect(listener).toHaveBeenCalledTimes(3); // no new call after unsubscribe
  });

  it('updates tenant ID and notifies listeners', () => {
    const listener = vi.fn();
    const unsubscribe = firebaseAuth.onAuthStateChanged(listener);

    firebaseAuth.setTenant('tenant-custom-retail');
    expect(firebaseAuth.getCurrentSession().tenantId).toBe('tenant-custom-retail');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('generates compliant auth headers for API requests', () => {
    const headers = firebaseAuth.getAuthHeaders();
    expect(headers['X-User-Role']).toBeDefined();
    expect(headers['X-User-Id']).toBeDefined();
    expect(headers['X-User-Email']).toBeDefined();
    expect(headers['X-Tenant-Id']).toBeDefined();
    expect(headers['Authorization']).toContain('Bearer fb-jwt-');
  });

  it('signs in with Google account and signs out cleanly', async () => {
    const listener = vi.fn();
    const unsubscribe = firebaseAuth.onAuthStateChanged(listener);

    const googleSession = await firebaseAuth.signInWithGoogle();
    expect(googleSession.email).toBe('test.innovator@gmail.com');
    expect(googleSession.displayName).toBe('Test Innovator');
    expect(googleSession.isGoogleAuthenticated).toBe(true);
    expect(googleSession.role).toBe('enterprise_architect');

    const defaultSession = await firebaseAuth.signInWithGoogle();
    expect(defaultSession.token).toBe('verified-firebase-id-token');

    const signedOutSession = await firebaseAuth.signOut();
    expect(signedOutSession.role).toBe('citizen_worker');
    expect(signedOutSession.isGoogleAuthenticated).toBeUndefined();

    unsubscribe();
  });
});


