"use client";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

type Props = {
  publishedDate: string;
  updatedDate?: string;
  minutes: number;
};

// 公開日・更新日・読む時間
export default function ArticleMeta({ publishedDate, updatedDate, minutes }: Props) {
  const items = [`${publishedDate} 公開`, updatedDate && `${updatedDate} 更新`, `${minutes}分で読めます`].filter(Boolean);
  return (
    <Stack direction="row" sx={{ flexWrap: "wrap", columnGap: 1.5, rowGap: 0.5 }}>
      {items.map((item, i) => (
        <Typography key={item} variant="body2" sx={{ color: "text.secondary" }}>
          {i > 0 && <span aria-hidden>・</span>}
          {item}
        </Typography>
      ))}
    </Stack>
  );
}
