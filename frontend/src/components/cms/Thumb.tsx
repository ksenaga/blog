"use client";

import Box from "@mui/material/Box";

// 一覧の小さなサムネイル
export default function Thumb({ src, size = 56 }: { src: string | null; size?: number }) {
  return (
    <Box
      component="img"
      src={src ?? "/no-image.svg"}
      alt=""
      loading="lazy"
      sx={{
        width: size * (16 / 9),
        height: size,
        objectFit: "cover",
        borderRadius: "10px",
        flexShrink: 0,
        bgcolor: "action.hover",
        display: "block",
      }}
    />
  );
}
