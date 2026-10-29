import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import api, { AUTH_TOKEN_KEY } from "@/lib/api";
import type {
  AuthUser,
  UserProfileResponse,
} from "@/modules/auth/types/auth.types";

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionError: boolean;
  setSession: (token: string, user: AuthUser) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  retrySession: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const logout = useCallback(() => {
    window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
    setUser(null);
    setSessionError(false);

    if (router.pathname !== "/login") {
      void router.replace("/login");
    }
  }, [router]);

  const setSession = useCallback(
    (token: string, authenticatedUser: AuthUser) => {
      window.sessionStorage.setItem(AUTH_TOKEN_KEY, token);
      setUser(authenticatedUser);
      setSessionError(false);
      setIsLoading(false);
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    const response =
      await api.get<UserProfileResponse>("/users/me");

    const profile = response.data.data;

    setUser({
      id: profile.id,
      name: profile.name,
      email: profile.email,
      roles: profile.roles,
    });
  }, []);

  const retrySession = useCallback(() => {
    setIsLoading(true);
    setSessionError(false);
    setRetryCount((count) => count + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession(): Promise<void> {
      const token = window.sessionStorage.getItem(AUTH_TOKEN_KEY);

      if (!token) {
        setUser(null);
        setSessionError(false);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setSessionError(false);

      try {
        const response =
          await api.get<UserProfileResponse>("/users/me");

        if (cancelled) {
          return;
        }

        const profile = response.data.data;

        setUser({
          id: profile.id,
          name: profile.name,
          email: profile.email,
          roles: profile.roles,
        });
      } catch (error: unknown) {
        if (cancelled) {
          return;
        }

        if (
          axios.isAxiosError(error) &&
          error.response?.status === 401
        ) {
          window.sessionStorage.removeItem(AUTH_TOKEN_KEY);
          setUser(null);
          setSessionError(false);
        } else {
          setSessionError(true);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      sessionError,
      setSession,
      logout,
      refreshProfile,
      retrySession,
    }),
    [
      user,
      isLoading,
      sessionError,
      setSession,
      logout,
      refreshProfile,
      retrySession,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return context;
}