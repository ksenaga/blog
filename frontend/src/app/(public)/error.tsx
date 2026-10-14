"use client";

// V-06. エラー
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import StatusPage from "@/components/StatusPage";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <StatusPage
      code="ERROR"
      icon={<ErrorOutlineRoundedIcon />}
      title="エラーが発生しました"
      message="時間をおいて再度お試しください。"
      action={
        <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
          <Button variant="contained" size="large" onClick={reset}>
            再読み込み
          </Button>
          <Button href="/" variant="outlined" size="large">
            トップへ戻る
          </Button>
        </Stack>
      }
    />
  );
}
