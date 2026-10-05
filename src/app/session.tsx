import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { QueryClient } from "@tanstack/react-query";
import { api } from "../api/services";
import { client } from "../api/client";
import type { AuthUser, TokenPair } from "../api/types";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, staleTime: 60_000, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
const KEY = "servexa.session";
function restore(): TokenPair | null {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY) || "null");
    return typeof v?.accessToken === "string" &&
      typeof v?.refreshToken === "string"
      ? v
      : null;
  } catch {
    return null;
  }
}
let remember = !!restore();
client.setTokens(restore());
client.onTokens = (tokens) => {
  try {
    if (tokens && remember) sessionStorage.setItem(KEY, JSON.stringify(tokens));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* Storage can be unavailable; memory remains authoritative. */
  }
};
type Session = {
  user: AuthUser | null;
  hydrating: boolean;
  error: Error | null;
  login: (
    email: string,
    password: string,
    persist: boolean,
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
};
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null),
    [hydrating, setHydrating] = useState(true),
    [error, setError] = useState<Error | null>(null);
  const reload = async () => {
    try {
      setUser(await api("E05"));
      setError(null);
    } catch (e) {
      setError(e as Error);
      throw e;
    }
  };
  useEffect(() => {
    client.onExpired = () => {
      queryClient.clear();
      setUser(null);
      setError(null);
    };
    let active = true;
    const boot = async () => {
      try {
        if (client.getTokens()) {
          const me = await api("E05");
          if (active) setUser(me);
        }
      } catch (e) {
        if (active) setError(e as Error);
      } finally {
        if (active) setHydrating(false);
      }
    };
    void boot();
    return () => {
      active = false;
    };
  }, []);
  const login = async (email: string, password: string, persist: boolean) => {
    queryClient.clear();
    setUser(null);
    client.setTokens(null);
    const tokens = await api("E02", { body: { email, password } });
    remember = persist;
    client.setTokens(tokens);
    try {
      const me = await api("E05");
      setUser(me);
      setError(null);
      return me;
    } catch (e) {
      client.setTokens(null);
      throw e;
    }
  };
  const logout = async () => {
    const token = client.getTokens()?.refreshToken;
    client.setTokens(null);
    queryClient.clear();
    setUser(null);
    setError(null);
    if (token) await api("E04", { body: { refreshToken: token } });
  };
  return (
    <Context.Provider value={{ user, hydrating, error, login, logout, reload }}>
      {children}
    </Context.Provider>
  );
}
export function useSession() {
  const value = useContext(Context);
  if (!value) throw new Error("Session provider missing");
  return value;
}
export const home = (role?: string) =>
  role === "ADMIN" ? "/admin" : role === "PROVIDER" ? "/provider" : "/customer";
export const safeReturn = (path: string | null) =>
  path?.startsWith("/") && !path.startsWith("//") && !path.includes("\\")
    ? path
    : null;
