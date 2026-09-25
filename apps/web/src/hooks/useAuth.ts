import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, onIdTokenChanged, type User } from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";
import { login as fbLogin, logout as fbLogout, persistSessionCookie, setCurrentToken, signup as fbSignup } from "../api/auth";

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: User };

const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

function lastSignInMs(user: User): number {
  const parsed = Date.parse(user.metadata.lastSignInTime || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function sessionExpired(user: User): boolean {
  return Date.now() - lastSignInMs(user) >= SESSION_TTL_MS;
}

function remainingSessionMs(user: User): number {
  return Math.max(0, SESSION_TTL_MS - (Date.now() - lastSignInMs(user)));
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let expiryTimer: ReturnType<typeof setTimeout> | null = null;

    function clearExpiry() {
      if (expiryTimer) {
        clearTimeout(expiryTimer);
        expiryTimer = null;
      }
    }

    function scheduleExpiry(user: User) {
      clearExpiry();
      expiryTimer = setTimeout(() => {
        void fbLogout();
      }, remainingSessionMs(user));
    }

    const unsubAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (!user) {
        clearExpiry();
        setCurrentToken(null);
        await persistSessionCookie(null);
        setState({ status: "unauthenticated" });
        return;
      }
      if (sessionExpired(user)) {
        clearExpiry();
        await fbLogout();
        return;
      }
      const token = await user.getIdToken();
      setCurrentToken(token);
      await persistSessionCookie(token);
      setState({ status: "authenticated", user });
      scheduleExpiry(user);
    });

    const unsubToken = onIdTokenChanged(firebaseAuth, async (user) => {
      if (!user) {
        setCurrentToken(null);
        await persistSessionCookie(null);
        return;
      }
      if (sessionExpired(user)) {
        await fbLogout();
        return;
      }
      const token = await user.getIdToken();
      setCurrentToken(token);
      await persistSessionCookie(token);
    });

    return () => {
      clearExpiry();
      unsubAuth();
      unsubToken();
    };
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const user = await fbSignup(email, password);
    const token = await user.getIdToken();
    setCurrentToken(token);
    await persistSessionCookie(token);
    return user;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await fbLogin(email, password);
    const token = await user.getIdToken();
    setCurrentToken(token);
    await persistSessionCookie(token);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await fbLogout();
  }, []);

  return { state, signup, login, logout };
}
