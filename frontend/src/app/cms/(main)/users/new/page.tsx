"use client";

// C-08. ユーザー作成（管理者のみ）
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Paper from "@mui/material/Paper";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import AdminOnly from "@/components/cms/AdminOnly";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import PageHeader from "@/components/cms/PageHeader";
import PasswordField, { PASSWORD_HELP } from "@/components/cms/PasswordField";
import { ApiError, api } from "@/lib/cms/api";

function NewUserForm() {
  const router = useRouter();
  const { toast, toastError } = useFeedback();
  const [form, setForm] = useState({ name: "", email: "", role: "user", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const update = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await api("/cms/users", { method: "POST", body: form });
      toast("ユーザーを作成しました。初期パスワードを本人に伝えてください");
      router.push("/cms/users");
    } catch (error) {
      if (error instanceof ApiError && error.details.length) setErrors(error.fieldErrors());
      else toastError(error);
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button href="/cms/users" startIcon={<ArrowBackRoundedIcon />} sx={{ ml: -1.5, mb: 2 }}>
        ユーザー一覧へ
      </Button>
      <PageHeader title="ユーザー作成" />
      <Paper component="form" onSubmit={handleSubmit} noValidate variant="outlined" sx={{ borderRadius: "12px", p: { xs: 2.5, md: 4 }, maxWidth: 640 }}>
        <Stack spacing={3}>
          <TextField
            label="名前"
            required
            value={form.name}
            onChange={(event) => update("name")(event.target.value)}
            error={!!errors.name}
            helperText={errors.name ?? "1〜50文字"}
            slotProps={{ htmlInput: { maxLength: 50 } }}
          />
          <TextField
            label="メールアドレス"
            type="email"
            required
            value={form.email}
            onChange={(event) => update("email")(event.target.value)}
            error={!!errors.email}
            helperText={errors.email ?? "ログインに使います"}
          />
          <FormControl>
            <FormLabel sx={{ fontWeight: 700, mb: 0.5 }}>ロール</FormLabel>
            <RadioGroup row value={form.role} onChange={(event) => update("role")(event.target.value)}>
              <FormControlLabel value="user" control={<Radio />} label="ユーザー（自分のブログのみ管理）" />
              <FormControlLabel value="admin" control={<Radio />} label="管理者（全て管理）" />
            </RadioGroup>
          </FormControl>
          <PasswordField
            label="初期パスワード"
            required
            value={form.password}
            onChange={(event) => update("password")(event.target.value)}
            onGenerate={update("password")}
            error={!!errors.password}
            helperText={errors.password ?? PASSWORD_HELP}
          />
          <Stack direction="row" spacing={1.5} sx={{ justifyContent: "flex-end" }}>
            <Button href="/cms/users" color="inherit">
              キャンセル
            </Button>
            <Button type="submit" variant="contained" disabled={submitting || !form.name || !form.email || !form.password}>
              作成する
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}

export default function NewUserPage() {
  return (
    <AdminOnly>
      <NewUserForm />
    </AdminOnly>
  );
}
