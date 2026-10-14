"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  api,
  refreshSession,
  setAccessToken,
  setSessionExpiredHandler,
  type CmsUser,
  type TokenResponse,
} from "@/lib/cms/api";

type Status = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: Status;
  user: CmsUser | null;
  // ログインの有効期限が切れてログイン画面に戻ったか（M-16 を表示する）
  expired: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  // パスワード変更などで新しいトークンを受け取ったとき
  setSession: (data: TokenResponse) => void;
  // 自分が削除されたときなど、サーバーに問い合わせずにログアウト状態にする
  clearSession: () => void;
  updateUser: (user: Partial<CmsUser>) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<CmsUser | null>(null);
  const [expired, setExpired] = useState(false);

  const setSession = useCallback((data: TokenResponse) => {
    setAccessToken(data.access_token);
    setUser(data.user);
    setStatus("authenticated");
    setExpired(false);
  }, []);

  const clearSession = useCallback(() => {
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  // 画面を開いたとき：リフレッシュトークンでログイン状態を復元する
  useEffect(() => {
    let active = true;
    refreshSession().then((data) => {
      if (!active) return;
      if (data) setSession(data);
      else clearSession();
    });
    return () => {
      active = false;
    };
  }, [setSession, clearSession]);

  // API の途中でログインの有効期限が切れた場合
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setExpired(true);
      clearSession();
    });
    return () => setSessionExpiredHandler(null);
  }, [clearSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { data } = await api<{ data: TokenResponse }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      setSession(data);
    },
    [setSession],
  );

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    clearSession();
  }, [clearSession]);

  const updateUser = useCallback((patch: Partial<CmsUser>) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const value = useMemo(
    () => ({ status, user, expired, login, logout, setSession, clearSession, updateUser }),
    [status, user, expired, login, logout, setSession, clearSession, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider の中で使ってください");
  return context;
}
