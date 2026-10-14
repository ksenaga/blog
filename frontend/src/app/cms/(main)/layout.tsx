"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { useAuth } from "@/components/cms/AuthProvider";
import CmsShell from "@/components/cms/CmsShell";
import { UnreadCountProvider } from "@/components/cms/UnreadCountProvider";

// ログインしていなければログイン画面へ（元の画面の URL を覚えておく。screendesign.md 1-5）
export default function CmsMainLayout({ children }: LayoutProps<"/cms">) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status !== "unauthenticated") return;
    const current = `${pathname}${window.location.search}`;
    router.replace(`/cms/login?next=${encodeURIComponent(current)}`);
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <UnreadCountProvider>
      <CmsShell>{children}</CmsShell>
    </UnreadCountProvider>
  );
}
