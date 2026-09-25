import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { firebaseAuth } from "../lib/firebase";
import { login as fbLogin, logout as fbLogout, setCurrentToken, signup as fbSignup } from "../api/auth";

export type AuthState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: User };

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      if (user) {
        // Refresh and store the token; Firebase auto-refreshes every hour.
        const token = await user.getIdToken();
        setCurrentToken(token);
        setState({ status: "authenticated", user });

        // Keep token fresh by listening for token refresh.
        const refreshUnsub = onAuthStateChanged(firebaseAuth, async (u) => {
          if (u) {
            const t = await u.getIdToken(/* forceRefresh */ false);
            setCurrentToken(t);
          }
        });
        return refreshUnsub;
      } else {
        setCurrentToken(null);
        setState({ status: "unauthenticated" });
      }
    });
    return unsubscribe;
  }, []);

  const signup = useCallback(async (email: string, password: string) => {
    const user = await fbSignup(email, password);
    const token = await user.getIdToken();
    setCurrentToken(token);
    return user;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await fbLogin(email, password);
    const token = await user.getIdToken();
    setCurrentToken(token);
    return user;
  }, []);

  const logout = useCallback(async () => {
    await fbLogout();
  }, []);

  return { state, signup, login, logout };
}
