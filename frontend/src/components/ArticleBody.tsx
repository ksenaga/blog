"use client";

import Box from "@mui/material/Box";
import { articleStyles } from "@/components/articleStyles";

// 本文の表示。HTML は backend でサニタイズ済み（APIdesign.md 5-7）
export default function ArticleBody({ html }: { html: string }) {
  return (
    <Box
      className="article-body"
      dangerouslySetInnerHTML={{ __html: html }}
      sx={articleStyles}
    />
  );
}
