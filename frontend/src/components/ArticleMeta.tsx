"use client";

import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

type Props = {
  publishedDate: string;
  updatedDate?: string;
  minutes: number;
};

// 公開日・更新日・読む時間（Chip の icon はサーバーから渡せないため、ブラウザ側で描画する）
export default function ArticleMeta({ publishedDate, updatedDate, minutes }: Props) {
  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: { md: "center" }, flexWrap: "wrap", rowGap: 1 }}>
      <Chip size="small" color="primary" variant="outlined" label={`${publishedDate} 公開`} />
      {updatedDate && <Chip size="small" variant="outlined" label={`${updatedDate} 更新`} />}
      <Chip size="small" variant="outlined" icon={<ScheduleRoundedIcon />} label={`${minutes}分で読めます`} />
    </Stack>
  );
}
