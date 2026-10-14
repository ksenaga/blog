"use client";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import AuthorAvatar from "@/components/AuthorAvatar";
import NextLink from "@/components/NextLink";
import type { Author } from "@/lib/api";

// 作者のアイコン。マウスを乗せると名前を表示し、押すとその作者の記事一覧（V-02）へ
// （Tooltip は子要素を複製するため、ブラウザ側で描画する）
export default function AuthorAvatarLink({ author, size = 28 }: { author: Author; size?: number }) {
  return (
    <Tooltip title={author.name}>
      <Box
        component={NextLink}
        href={`/search?author_id=${author.id}`}
        aria-label={`${author.name} の記事`}
        sx={{ display: "inline-flex", borderRadius: "50%" }}
      >
        <AuthorAvatar author={author} size={size} />
      </Box>
    </Tooltip>
  );
}
