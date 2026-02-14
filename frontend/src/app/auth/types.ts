export type AuthRole = 'jobseeker' | 'recruiter';

export interface AuthUser {
  id: string;
  role: AuthRole;
  name: string;
  email: string;
}

export interface AuthSession {
  user: AuthUser;
  createdAt: number;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthSignUp extends AuthCredentials {
  name: string;
  role: AuthRole;
}
