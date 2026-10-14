"use client";

// C-09. ユーザー編集（管理者用）
import { use, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AdminOnly from "@/components/cms/AdminOnly";
import { useAuth } from "@/components/cms/AuthProvider";
import AvatarUploader from "@/components/cms/AvatarUploader";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import PageHeader from "@/components/cms/PageHeader";
import PasswordField, { PASSWORD_HELP } from "@/components/cms/PasswordField";
import SectionCard from "@/components/cms/SectionCard";
import { useDeleteUser } from "@/components/cms/useDeleteUser";
import { ApiError, api } from "@/lib/cms/api";
import type { CmsUserDetail } from "@/lib/cms/types";

function UserEdit({ id }: { id: string }) {
  const router = useRouter();
  const { user: me } = useAuth();
  const { toast, toastError, confirm } = useFeedback();
  const deleteUser = useDeleteUser();
  const [user, setUser] = useState<CmsUserDetail | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "user" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // 自分の情報はアカウント設定で変更する
    if (me && String(me.id) === id) {
      router.replace("/cms/account");
      return;
    }
    api<{ data: CmsUserDetail }>(`/cms/users/${id}`)
      .then(({ data }) => {
        setUser(data);
        setForm({ name: data.name, email: data.email, role: data.role });
      })
      .catch((error) => {
        toastError(error);
        router.replace("/cms/users");
      });
  }, [id, me, router, toastError]);

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      const { data } = await api<{ data: CmsUserDetail }>(`/cms/users/${id}`, { method: "PATCH", body: form });
      setUser(data);
      toast("保存しました");
    } catch (error) {
      if (error instanceof ApiError && error.details.length) setErrors(error.fieldErrors());
      else toastError(error);
    } finally {
      setSaving(false);
    }
  }

  async function handleReset(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    const ok = await confirm({
      title: "パスワードをリセットしますか？",
      message: `${user.name} さんのパスワードを変更します。\n${user.name} さんはログアウトされます。`,
      confirmLabel: "リセットする",
    });
    if (!ok) return;
    setPasswordError(null);
    try {
      await api(`/cms/users/${id}/password-reset`, { method: "POST", body: { new_password: newPassword } });
      setNewPassword("");
      toast("パスワードをリセットしました。本人に新しいパスワードを伝えてください");
    } catch (error) {
      if (error instanceof ApiError && error.details.length) setPasswordError(error.details[0].message);
      else toastError(error);
    }
  }

  async function handleDelete() {
    if (user && (await deleteUser(user))) router.push("/cms/users");
  }

  if (!user) return <Skeleton variant="rounded" height={480} />;

  return (
    <>
      <Button href="/cms/users" startIcon={<ArrowBackRoundedIcon />} sx={{ ml: -1.5, mb: 2 }}>
        ユーザー一覧へ
      </Button>
      <PageHeader title={user.name} description={`${user.email}・ブログ ${user.blog_count}件`} />

      <Stack spacing={3} sx={{ maxWidth: 720 }}>
        <SectionCard title="アイコン">
          <AvatarUploader user={user} onChange={setUser} />
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
              helperText={errors.email}
            />
            <div>
              <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary" }}>
                ロール
              </Typography>
              <RadioGroup row value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <FormControlLabel value="user" control={<Radio />} label="ユーザー" />
                <FormControlLabel value="admin" control={<Radio />} label="管理者" />
              </RadioGroup>
            </div>
            <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
              <Button type="submit" variant="contained" disabled={saving || !form.name || !form.email}>
                保存
              </Button>
            </Stack>
          </Stack>
        </SectionCard>

        <SectionCard title="パスワードリセット" description="新しいパスワードを設定し、本人に口頭などで伝えてください。">
          <Stack component="form" onSubmit={handleReset} noValidate direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" } }}>
            <PasswordField
              label="新しいパスワード"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              onGenerate={setNewPassword}
              error={!!passwordError}
              helperText={passwordError ?? PASSWORD_HELP}
              sx={{ flex: 1 }}
            />
            <Button type="submit" variant="outlined" disabled={!newPassword} sx={{ height: 56, whiteSpace: "nowrap" }}>
              リセット
            </Button>
          </Stack>
        </SectionCard>

        <SectionCard title="危険な操作" description="ユーザーを削除すると、そのユーザーのブログも削除され、復活できません。" danger>
          <Button color="error" variant="outlined" startIcon={<DeleteOutlineRoundedIcon />} onClick={handleDelete}>
            このユーザーを削除
          </Button>
        </SectionCard>
      </Stack>
    </>
  );
}

export default function UserEditPage({ params }: PageProps<"/cms/users/[id]/edit">) {
  const { id } = use(params);
  return (
    <AdminOnly>
      <UserEdit id={id} />
    </AdminOnly>
  );
}
