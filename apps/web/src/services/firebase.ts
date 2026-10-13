/**
 * Firebase Client & Multi-Persona IAM Authentication Service
 * Integrates Firebase Auth with enterprise RBAC roles and offline fallback.
 */

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
  private currentSession: UserSession;
  private listeners: Array<(session: UserSession) => void> = [];

  constructor() {
    // Default session: Citizen Worker
    this.currentSession = this.createSessionFromRole('citizen_worker', 'tenant-food-mfg-01');
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

  public getCurrentSession(): UserSession {
    return this.currentSession;
  }

  public getPersonaProfile(role: UserRole): PersonaProfile {
    return PERSONA_PROFILES[role] || PERSONA_PROFILES.citizen_worker;
  }

  public getAllPersonas(): PersonaProfile[] {
    return Object.values(PERSONA_PROFILES);
  }

  public async switchPersona(role: UserRole, tenantId?: string): Promise<UserSession> {
    const tid = tenantId || this.currentSession.tenantId;
    this.currentSession = this.createSessionFromRole(role, tid);
    this.notifyListeners();
    return this.currentSession;
  }

  public async signInWithGoogle(
    email: string = 'sivasubramanian86@gmail.com',
    displayName: string = 'Google Cloud APAC Innovator',
    avatar: string = 'https://www.gstatic.com/images/branding/product/2x/googleg_48dp.png'
  ): Promise<UserSession> {
    this.currentSession = {
      userId: `google-${email.split('@')[0]}`,
      email,
      displayName,
      role: 'enterprise_architect',
      tenantId: this.currentSession.tenantId,
      token: `google-oauth2-jwt-${Date.now()}`,
      permissions: ['read:all', 'sculpt:tasks', 'simulate:scenarios', 'deploy:agents', 'google:authenticated'],
      isGoogleAuthenticated: true,
      avatar,
    };
    this.notifyListeners();
    return this.currentSession;
  }

  public async signOut(): Promise<UserSession> {
    this.currentSession = this.createSessionFromRole('citizen_worker', this.currentSession.tenantId);
    this.notifyListeners();
    return this.currentSession;
  }

  public setTenant(tenantId: string): void {
    this.currentSession = {
      ...this.currentSession,
      tenantId,
    };
    this.notifyListeners();
  }

  public getAuthHeaders(): Record<string, string> {
    return {
      'X-User-Role': this.currentSession.role,
      'X-User-Id': this.currentSession.userId,
      'X-User-Email': this.currentSession.email,
      'X-Tenant-Id': this.currentSession.tenantId,
      Authorization: `Bearer ${this.currentSession.token}`,
    };
  }

  public onAuthStateChanged(listener: (session: UserSession) => void): () => void {
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
}

export const firebaseAuth = new FirebaseAuthService();
