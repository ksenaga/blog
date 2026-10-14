"use client";

// C-01. ログイン
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { useAuth } from "@/components/cms/AuthProvider";
import { ApiError, errorMessage } from "@/lib/cms/api";
import { SITE_NAME } from "@/lib/site";

// ログイン後に戻る画面。/cms 以外の URL には移動しない
function safeNext(value: string | null) {
  return value && value.startsWith("/cms") && !value.startsWith("//") ? value : "/cms";
}

function LoginForm() {
  const { status, login, expired } = useAuth();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError("メールアドレスの形式で入力してください");
      return;
    }
    setEmailError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "VALIDATION_ERROR"
          ? "メールアドレスまたはパスワードが正しくありません"
          : errorMessage(err),
      );
      setSubmitting(false);
    }
  }

  return (
    <Paper
      component="form"
      onSubmit={handleSubmit}
      noValidate
      elevation={0}
      sx={(theme) => ({
        width: "100%",
        maxWidth: 420,
        p: { xs: 3.5, sm: 5 },
        borderRadius: "24px",
        border: `1px solid ${theme.vars.palette.divider}`,
        boxShadow: "0 24px 64px rgba(15, 23, 42, 0.14)",
      })}
    >
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 56,
            height: 56,
            borderRadius: "18px",
            color: "#fff",
            background: "linear-gradient(135deg, #6366f1, #db2777)",
            boxShadow: "0 10px 24px rgba(99, 102, 241, 0.35)",
          }}
        >
          <AutoStoriesRoundedIcon />
        </Box>
        <Typography variant="h5" component="h1" sx={{ mt: 2 }}>
          {SITE_NAME} 管理画面
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 0.5 }}>
          メールアドレスとパスワードでログイン
        </Typography>
      </Box>

      {expired && !error && (
        <Alert severity="info" sx={{ mb: 2 }}>
          ログインの有効期限が切れました。再度ログインしてください
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="メールアドレス"
        type="email"
        autoComplete="email"
        fullWidth
        required
        autoFocus
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={!!emailError}
        helperText={emailError}
        sx={{ mb: 2.5 }}
      />
      <TextField
        label="パスワード"
        type={showPassword ? "text" : "password"}
        autoComplete="current-password"
        fullWidth
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示する"}
                  onClick={() => setShowPassword((value) => !value)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />

      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={submitting || !email || !password}
        sx={{ mt: 4, height: 50 }}
      >
        {submitting ? <CircularProgress size={22} color="inherit" /> : "ログイン"}
      </Button>
      <Typography variant="caption" sx={{ display: "block", mt: 2.5, color: "text.secondary", textAlign: "center" }}>
        ※パスワードを忘れた場合は、管理者に連絡してください
      </Typography>
    </Paper>
  );
}

export default function LoginPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        background:
          "radial-gradient(50% 60% at 20% 20%, rgba(99, 102, 241, 0.22), transparent 70%)," +
          "radial-gradient(50% 60% at 80% 80%, rgba(219, 39, 119, 0.18), transparent 70%)",
      }}
    >
      <Suspense>
        <LoginForm />
      </Suspense>
    </Box>
  );
}
