"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/components/cms/AuthProvider";
import ForbiddenView from "@/components/cms/ForbiddenView";

// 管理者だけが使える画面。ユーザーが開いた場合は 403 を表示する（screendesign.md 1-5）
export default function AdminOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user?.role === "admin" ? children : <ForbiddenView />;
}
