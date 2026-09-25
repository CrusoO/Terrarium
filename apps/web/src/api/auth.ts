import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";

// ── Module-level token store ────────────────────────────────────────────────
// Updated by useAuth whenever Firebase auth state changes.
// Imported by sessions.ts to attach Bearer header to every API call.

let _currentToken: string | null = null;

export function setCurrentToken(token: string | null): void {
  _currentToken = token;
}

export function getAuthHeaders(): Record<string, string> {
  return _currentToken ? { Authorization: `Bearer ${_currentToken}` } : {};
}

// ── Auth operations ─────────────────────────────────────────────────────────

export async function signup(email: string, password: string): Promise<User> {
  const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  return cred.user;
}

export async function login(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return cred.user;
}

export async function logout(): Promise<void> {
  setCurrentToken(null);
  await signOut(firebaseAuth);
}
