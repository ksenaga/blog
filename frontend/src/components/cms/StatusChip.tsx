"use client";

import Box from "@mui/material/Box";
import Chip, { type ChipProps } from "@mui/material/Chip";
import { STATUS_META } from "@/lib/cms/format";
import type { BlogStatus } from "@/lib/cms/types";

// ステータスの色（screendesign.md 1-4）。バッジ自体は控えめにし、色は点で示す
const DOT_COLORS: Record<BlogStatus | "deleted", string> = {
  draft: "text.disabled",
  scheduled: "info.main",
  public: "success.main",
  private: "warning.main",
  deleted: "error.main",
};

export default function StatusChip({
  status,
  size = "small",
}: {
  status: BlogStatus | "deleted";
  size?: ChipProps["size"];
}) {
  return (
    <Chip
      size={size}
      variant="outlined"
      label={STATUS_META[status].label}
      icon={<Box component="span" sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: DOT_COLORS[status], ml: "8px !important" }} />}
      sx={{ fontWeight: 500, color: "text.primary", bgcolor: "background.default" }}
    />
  );
}
