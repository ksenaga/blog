"use client";

// C-10. アカウント設定（本人用）
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { useAuth } from "@/components/cms/AuthProvider";
import AvatarUploader from "@/components/cms/AvatarUploader";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import PageHeader from "@/components/cms/PageHeader";
import PasswordField, { PASSWORD_HELP } from "@/components/cms/PasswordField";
import RoleChip from "@/components/cms/RoleChip";
import SectionCard from "@/components/cms/SectionCard";
import { useDeleteUser } from "@/components/cms/useDeleteUser";
import { ApiError, api, type TokenResponse } from "@/lib/cms/api";
import type { CmsUserDetail } from "@/lib/cms/types";

export default function AccountPage() {
  const router = useRouter();
  const { user: me, setSession, updateUser, clearSession } = useAuth();
  const { toast, toastError } = useFeedback();
  const deleteUser = useDeleteUser();
  const [account, setAccount] = useState<CmsUserDetail | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!me) return;
    api<{ data: CmsUserDetail }>(`/cms/users/${me.id}`)
      .then(({ data }) => {
        setAccount(data);
        setForm({ name: data.name, email: data.email });
      })
      .catch(toastError);
  }, [me, toastError]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    if (!me) return;
    setSaving(true);
    setErrors({});
    try {
      // ロールは送らない（ユーザーは自分のロールを変更できない）
      const { data } = await api<{ data: CmsUserDetail }>(`/cms/users/${me.id}`, { method: "PATCH", body: form });
      setAccount(data);
      updateUser({ name: data.name, email: data.email });
      toast("保存しました");
    } catch (error) {
      if (error instanceof ApiError && error.details.length) setErrors(error.fieldErrors());
      else toastError(error);
    } finally {
      setSaving(false);
    }
  }

  async function handlePasswordChange(event: FormEvent) {
    event.preventDefault();
    if (!me) return;
    if (passwords.next !== passwords.confirm) {
      setPasswordErrors({ confirm: "新しいパスワードが一致しません" });
      return;
    }
    setPasswordErrors({});
    try {
      // 他の端末はログアウトされ、この端末には新しいトークンが発行される
      const { data } = await api<{ data: TokenResponse }>(`/cms/users/${me.id}/password`, {
        method: "PUT",
        body: { current_password: passwords.current, new_password: passwords.next },
      });
      setSession(data);
      setPasswords({ current: "", next: "", confirm: "" });
      toast("パスワードを変更しました");
    } catch (error) {
      if (error instanceof ApiError && error.details.length) {
        const fields = error.fieldErrors();
        setPasswordErrors({ current: fields.current_password, next: fields.new_password });
      } else toastError(error);
    }
  }

  async function handleDelete() {
    if (!account) return;
    if (await deleteUser(account, { self: true })) {
      clearSession();
      router.replace("/cms/login");
    }
  }

  if (!account) return <Skeleton variant="rounded" height={480} />;

  return (
    <>
      <PageHeader title="アカウント設定" />
      <Stack spacing={3} sx={{ maxWidth: 720 }}>
        <SectionCard title="アイコン" description="ブログの一覧や記事の最後に表示されます。">
          <AvatarUploader
            user={account}
            onChange={(data) => {
              setAccount(data);
              updateUser({ avatar_url: data.avatar_url });
            }}
          />
        </SectionCard>

        <SectionCard title="基本情報">
          <Stack component="form" onSubmit={handleSave} noValidate spacing={2.5}>
            <TextField
              label="名前"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              error={!!errors.name}
              helperText={errors.name}
              slotProps={{ htmlInput: { maxLength: 50 } }}
            />
            <TextField
              label="メールアドレス"
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              error={!!errors.email}
              helperText={errors.email ?? "ログインに使います"}
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 700 }}>
                ロール
              </Typography>
              <RoleChip role={account.role} />
            </Stack>
            <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
              <Button type="submit" variant="contained" disabled={saving || !form.name || !form.email}>
                保存
              </Button>
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard title="パスワード変更" description="変更すると、他の端末ではログアウトされます。">
          <Stack component="form" onSubmit={handlePasswordChange} noValidate spacing={2.5}>
            <PasswordField
              label="現在のパスワード"
              autoComplete="current-password"
              value={passwords.current}
              onChange={(event) => setPasswords({ ...passwords, current: event.target.value })}
              error={!!passwordErrors.current}
              helperText={passwordErrors.current}
            />
            <PasswordField
              label="新しいパスワード"
              autoComplete="new-password"
              value={passwords.next}
              onChange={(event) => setPasswords({ ...passwords, next: event.target.value })}
              error={!!passwordErrors.next}
              helperText={passwordErrors.next ?? PASSWORD_HELP}
            />
            <PasswordField
              label="新しいパスワード（確認）"
              autoComplete="new-password"
              value={passwords.confirm}
              onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })}
              error={!!passwordErrors.confirm}
              helperText={passwordErrors.confirm}
            />
            <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
              <Button type="submit" variant="contained" disabled={!passwords.current || !passwords.next || !passwords.confirm}>
                変更する
              </Button>
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard title="退会" description="アカウントを削除すると、あなたのブログも削除され、復活できません。" danger>
          <Button color="error" variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} onClick={handleDelete}>
            アカウントを削除
          </Button>
        </SectionCard>
      </Stack>
    </>
  );
}
