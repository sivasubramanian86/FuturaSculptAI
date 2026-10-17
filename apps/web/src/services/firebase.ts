/**
 * Firebase Client & Multi-Persona IAM Authentication Service
 * Uses verified Firebase ID tokens in production and demo personas only in development.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onIdTokenChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  User,
} from 'firebase/auth';

const app = initializeApp({
  apiKey: 'AIzaSyDNrKv7J3mR0xZapRpnpTh4qgYBN3hV7_w',
  authDomain: 'genai-apac-2026-491004.firebaseapp.com',
  projectId: 'genai-apac-2026-491004',
  appId: '1:967518492968:web:22067c374c6f0fd884981d',
});
const auth = getAuth(app);

export type UserRole =
  | 'citizen_worker'
  | 'enterprise_architect'
  | 'investor'
  | 'hr_executive'
  | 'customer_care'
  | 'governance_officer';

export interface UserSession {
  userId: string;
  email: string;
  displayName: string;
  role: UserRole;
  tenantId: string;
  token: string;
  permissions: string[];
  isGoogleAuthenticated?: boolean;
  avatar?: string;
}

export interface PersonaProfile {
  role: UserRole;
  displayName: string;
  email: string;
  title: string;
  avatar: string;
  permissions: string[];
}

export const PERSONA_PROFILES: Record<UserRole, PersonaProfile> = {
  citizen_worker: {
    role: 'citizen_worker',
    displayName: 'Maya Lin',
    email: 'maya.lin@citizen.futurasculpt.internal',
    title: 'CNC Precision Operator & Worker Representative',
    avatar: '👷‍♀️',
    permissions: ['view:resilience', 'view:pathways', 'submit:appeal', 'view:citizen_faq'],
  },
  enterprise_architect: {
    role: 'enterprise_architect',
    displayName: 'David Vance',
    email: 'david.vance@enterprise.futurasculpt.internal',
    title: 'Principal WorkGraph Architect',
    avatar: '📐',
    permissions: ['read:all', 'sculpt:tasks', 'simulate:scenarios', 'deploy:agents'],
  },
  investor: {
    role: 'investor',
    displayName: 'Elena Rostova',
    email: 'elena.rostova@capital.futurasculpt.internal',
    title: 'Managing Partner - CapEx & ESG Fund',
    avatar: '📈',
    permissions: ['view:trust_board', 'view:roi_metrics', 'export:diligence_pack'],
  },
  hr_executive: {
    role: 'hr_executive',
    displayName: 'Sarah Jenkins',
    email: 'sarah.jenkins@hr.futurasculpt.internal',
    title: 'Chief People & Culture Officer',
    avatar: '🤝',
    permissions: ['view:reskilling', 'allocate:safety_net', 'manage:mobility'],
  },
  customer_care: {
    role: 'customer_care',
    displayName: 'Arun Kumar',
    email: 'arun.kumar@care.futurasculpt.internal',
    title: 'Workforce Care & Transition Advocate',
    avatar: '🛡️',
    permissions: ['triage:appeals', 'support:workers', 'view:onboarding'],
  },
  governance_officer: {
    role: 'governance_officer',
    displayName: 'Dr. Marcus Vance',
    email: 'marcus.vance@governance.futurasculpt.internal',
    title: 'Head of AI Safety & SAIF Compliance',
    avatar: '⚖️',
    permissions: ['audit:evidence', 'approve:redesign', 'manage:dlp', 'verify:integrity'],
  },
};

class FirebaseAuthService {
  private currentSession: UserSession | null;
  private tenantId = 'tenant-food-mfg-01';
  private listeners: Array<(session: UserSession | null) => void> = [];

  constructor() {
    this.currentSession = import.meta.env.DEV
      ? this.createSessionFromRole('citizen_worker', this.tenantId)
      : null;
    onIdTokenChanged(auth, (user) => {
      void this.updateFirebaseSession(user);
    });
  }

  private createSessionFromRole(role: UserRole, tenantId: string): UserSession {
    const profile = PERSONA_PROFILES[role] || PERSONA_PROFILES.citizen_worker;
    return {
      userId: `usr-${role.replace('_', '-')}-001`,
      email: profile.email,
      displayName: profile.displayName,
      role: profile.role,
      tenantId,
      token: `fb-jwt-${role}-${Date.now()}`,
      permissions: profile.permissions,
    };
  }

  public getCurrentSession(): UserSession | null {
    return this.currentSession;
  }

  public getPersonaProfile(role: UserRole): PersonaProfile {
    return PERSONA_PROFILES[role] || PERSONA_PROFILES.citizen_worker;
  }

  public getAllPersonas(): PersonaProfile[] {
    return Object.values(PERSONA_PROFILES);
  }

  public async switchPersona(role: UserRole, tenantId?: string): Promise<UserSession> {
    if (!import.meta.env.DEV) {
      throw new Error('Production roles must come from verified Firebase custom claims.');
    }
    const tid = tenantId || this.currentSession?.tenantId || this.tenantId;
    this.tenantId = tid;
    this.currentSession = this.createSessionFromRole(role, tid);
    this.notifyListeners();
    return this.currentSession;
  }

  public async signInWithGoogle(): Promise<UserSession> {
    const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
    this.currentSession = await this.createSessionFromFirebaseUser(user);
    this.tenantId = this.currentSession.tenantId;
    this.notifyListeners();
    return this.currentSession;
  }

  public async signOut(): Promise<UserSession | null> {
    await firebaseSignOut(auth);
    this.currentSession = import.meta.env.DEV
      ? this.createSessionFromRole('citizen_worker', this.tenantId)
      : null;
    this.notifyListeners();
    return this.currentSession;
  }

  public setTenant(tenantId: string): void {
    this.tenantId = tenantId;
    if (this.currentSession && import.meta.env.DEV) {
      this.currentSession = { ...this.currentSession, tenantId };
      this.notifyListeners();
    }
  }

  public getAuthHeaders(): Record<string, string> {
    if (!this.currentSession) return {};
    return {
      'X-User-Role': this.currentSession.role,
      'X-User-Id': this.currentSession.userId,
      'X-User-Email': this.currentSession.email,
      'X-Tenant-Id': this.currentSession.tenantId,
      Authorization: `Bearer ${this.currentSession.token}`,
    };
  }

  public onAuthStateChanged(listener: (session: UserSession | null) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentSession);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.currentSession);
    }
  }

  private async updateFirebaseSession(user: User | null): Promise<void> {
    if (user) {
      this.currentSession = await this.createSessionFromFirebaseUser(user);
      this.tenantId = this.currentSession.tenantId;
    } else if (!import.meta.env.DEV) {
      this.currentSession = null;
    }
    this.notifyListeners();
  }

  private async createSessionFromFirebaseUser(user: User): Promise<UserSession> {
    const { claims } = await user.getIdTokenResult();
    const claimRole = String(claims.role || '').toLowerCase() as UserRole;
    const role = PERSONA_PROFILES[claimRole] ? claimRole : 'citizen_worker';
    const profile = PERSONA_PROFILES[role];
    return {
      userId: user.uid,
      email: user.email || '',
      displayName: user.displayName || user.email || 'Google user',
      role,
      tenantId: typeof claims.tenant_id === 'string' ? claims.tenant_id : this.tenantId,
      token: await user.getIdToken(),
      permissions: profile.permissions,
      isGoogleAuthenticated: true,
      avatar: user.photoURL || undefined,
    };
  }
}

export const firebaseAuth = new FirebaseAuthService();
