import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// 閲覧側の共通レイアウト（ヘッダー・フッター）
export default function PublicShell({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Header />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <Footer />
    </Box>
  );
}
