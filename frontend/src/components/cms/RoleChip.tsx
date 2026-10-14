"use client";

import Chip from "@mui/material/Chip";

export default function RoleChip({ role }: { role: "admin" | "user" }) {
  return role === "admin" ? (
    <Chip size="small" label="管理者" color="secondary" sx={{ fontWeight: 700 }} />
  ) : (
    <Chip size="small" label="ユーザー" variant="outlined" sx={{ fontWeight: 700 }} />
  );
}
