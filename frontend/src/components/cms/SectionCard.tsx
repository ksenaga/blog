"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";

// 設定画面の区切り（基本情報・パスワード・危険な操作）
export default function SectionCard({
  title,
  description,
  danger,
  children,
}: {
  title: string;
  description?: ReactNode;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={(theme) => ({
        borderRadius: "20px",
        p: { xs: 2.5, md: 3.5 },
        ...(danger && { borderColor: `rgba(${theme.vars.palette.error.mainChannel} / 0.4)` }),
      })}
    >
      <Typography variant="h6" component="h2" sx={{ color: danger ? "error.main" : "text.primary" }}>
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          {description}
        </Typography>
      )}
      <Box sx={{ mt: 3 }}>{children}</Box>
    </Paper>
  );
}
