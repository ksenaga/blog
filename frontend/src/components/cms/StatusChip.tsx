"use client";

import Chip, { type ChipProps } from "@mui/material/Chip";
import { STATUS_META } from "@/lib/cms/format";
import type { BlogStatus } from "@/lib/cms/types";

// ステータスバッジ（screendesign.md 1-4）
export default function StatusChip({
  status,
  size = "small",
}: {
  status: BlogStatus | "deleted";
  size?: ChipProps["size"];
}) {
  const meta = STATUS_META[status];
  return (
    <Chip
      size={size}
      label={meta.label}
      color={meta.color}
      variant={status === "draft" ? "outlined" : "filled"}
      sx={{ fontWeight: 700, minWidth: 72 }}
    />
  );
}
