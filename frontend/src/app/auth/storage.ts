import type { AuthSession, AuthUser } from './types';

const USERS_KEY = 'jsp.auth.users.v1';
const SESSION_KEY = 'jsp.auth.session.v1';
const SESSION_STORAGE_KEY = 'jsp.auth.session-storage.v1';

type StoredUser = AuthUser & { passwordHash: string };

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadUsers(): StoredUser[] {
  return safeJsonParse<StoredUser[]>(localStorage.getItem(USERS_KEY), []);
}

export function saveUsers(users: StoredUser[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function loadSession(): AuthSession | null {
  const storage = getSessionStorage();
  if (storage === 'session') {
    return safeJsonParse<AuthSession | null>(sessionStorage.getItem(SESSION_KEY), null);
  }
  return safeJsonParse<AuthSession | null>(localStorage.getItem(SESSION_KEY), null);
}

export type SessionStorageMode = 'local' | 'session';

export function getSessionStorage(): SessionStorageMode {
  return safeJsonParse<SessionStorageMode>(localStorage.getItem(SESSION_STORAGE_KEY), 'local');
}

export function setSessionStorage(mode: SessionStorageMode) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mode));
}

export function saveSession(session: AuthSession) {
  const storage = getSessionStorage();
  if (storage === 'session') {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_KEY);
}

export function toPublicUser(u: StoredUser): AuthUser {
  const { passwordHash: _passwordHash, ...publicUser } = u;
  return publicUser;
}

const PROFILE_STATUS_KEY = 'jsp.auth.profile-status.v1';

type ProfileStatusMap = Record<string, boolean>; // key: `${role}:${email}`

function profileKey(role: string, email: string) {
  return `${role}:${email.trim().toLowerCase()}`;
}

export function getProfileCompleted(role: string, email: string): boolean {
  const map = safeJsonParse<ProfileStatusMap>(localStorage.getItem(PROFILE_STATUS_KEY), {});
  return Boolean(map[profileKey(role, email)]);
}

export function setProfileCompleted(role: string, email: string, completed: boolean) {
  const map = safeJsonParse<ProfileStatusMap>(localStorage.getItem(PROFILE_STATUS_KEY), {});
  map[profileKey(role, email)] = completed;
  localStorage.setItem(PROFILE_STATUS_KEY, JSON.stringify(map));
}
