"use client";

// ヘッダーの通知アイコンに出す未読件数
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/cms/api";
import type { Paginated, Notification } from "@/lib/cms/types";

const UnreadCountContext = createContext<{ count: number; refresh: () => void }>({
  count: 0,
  refresh: () => undefined,
});

export function UnreadCountProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  const refresh = useCallback(() => {
    api<Paginated<Notification>>("/cms/notifications?unread_only=true&per_page=1")
      .then(({ meta }) => setCount(meta.total))
      .catch(() => undefined);
  }, []);

  // 画面を移動するたびに取り直す
  useEffect(() => {
    refresh();
  }, [refresh, pathname]);

  return <UnreadCountContext.Provider value={{ count, refresh }}>{children}</UnreadCountContext.Provider>;
}

export const useUnreadCount = () => useContext(UnreadCountContext);
