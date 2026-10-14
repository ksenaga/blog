"use client";

// C-12. 403（権限がありません）
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import GppMaybeOutlinedIcon from "@mui/icons-material/GppMaybeOutlined";

export default function ForbiddenView({ message = "この操作を行う権限がありません" }: { message?: string }) {
  return (
    <Box sx={{ py: 12, textAlign: "center" }}>
      <GppMaybeOutlinedIcon sx={{ fontSize: 64, color: "warning.main" }} />
      <Typography variant="overline" sx={{ display: "block", mt: 2, fontWeight: 800, letterSpacing: "0.3em", color: "text.secondary" }}>
        403 FORBIDDEN
      </Typography>
      <Typography variant="h5" component="h1">
        {message}
      </Typography>
      <Button href="/cms" variant="contained" sx={{ mt: 4 }}>
        ダッシュボードへ戻る
      </Button>
    </Box>
  );
}
