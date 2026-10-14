import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

type Props = {
  code?: string;
  icon: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
};

// 非公開中・404・エラーなどの案内画面（V-04〜V-06）
export default function StatusPage({ code, icon, title, message, action }: Props) {
  return (
    <Container maxWidth="sm" sx={{ py: { xs: 10, md: 16 }, textAlign: "center" }}>
      <Box sx={{ color: "text.secondary", "& svg": { fontSize: 48 } }}>
        {icon}
      </Box>
      {code && (
        <Typography variant="overline" sx={{ display: "block", mt: 3, color: "text.secondary", fontWeight: 600, letterSpacing: "0.15em" }}>
          {code}
        </Typography>
      )}
      <Typography variant="h5" component="h1" sx={{ mt: code ? 0.5 : 3, fontSize: { xs: 20, md: 24 } }}>
        {title}
      </Typography>
      <Typography sx={{ mt: 2, color: "text.secondary", lineHeight: 1.9 }}>{message}</Typography>
      <Box sx={{ mt: 5 }}>
        {action ?? (
          <Button href="/" variant="contained">
            トップへ戻る
          </Button>
        )}
      </Box>
    </Container>
  );
}
