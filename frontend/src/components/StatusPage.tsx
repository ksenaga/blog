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
      <Box
        sx={{
          mx: "auto",
          width: 96,
          height: 96,
          display: "grid",
          placeItems: "center",
          borderRadius: "28px",
          color: "#fff",
          background: "linear-gradient(135deg, #6366f1, #db2777)",
          boxShadow: "0 18px 40px rgba(99, 102, 241, 0.35)",
          "& svg": { fontSize: 44 },
        }}
      >
        {icon}
      </Box>
      {code && (
        <Typography variant="overline" sx={{ display: "block", mt: 4, color: "primary.main", fontWeight: 800, letterSpacing: "0.3em" }}>
          {code}
        </Typography>
      )}
      <Typography variant="h4" component="h1" sx={{ mt: code ? 1 : 4, fontSize: { xs: 24, md: 30 } }}>
        {title}
      </Typography>
      <Typography sx={{ mt: 2, color: "text.secondary", lineHeight: 1.9 }}>{message}</Typography>
      <Box sx={{ mt: 5 }}>
        {action ?? (
          <Button href="/" variant="contained" size="large">
            トップへ戻る
          </Button>
        )}
      </Box>
    </Container>
  );
}
