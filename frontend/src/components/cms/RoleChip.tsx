"use client";

import Chip from "@mui/material/Chip";

export default function RoleChip({ role }: { role: "admin" | "user" }) {
  return (
    <Chip
      size="small"
      variant="outlined"
      label={role === "admin" ? "管理者" : "ユーザー"}
      sx={{ fontWeight: 500, ...(role === "admin" && { borderColor: "text.primary" }) }}
    />
  );
}
