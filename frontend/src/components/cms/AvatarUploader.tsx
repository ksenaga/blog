"use client";

// アイコン画像の変更・削除（C-09・C-10）
import { useRef, useState } from "react";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AuthorAvatar from "@/components/AuthorAvatar";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import { api } from "@/lib/cms/api";
import type { CmsUserDetail } from "@/lib/cms/types";

const IMAGE_MAX_SIZE_MB = Number(process.env.NEXT_PUBLIC_IMAGE_MAX_SIZE_MB) || 10;

export default function AvatarUploader({
  user,
  onChange,
}: {
  user: CmsUserDetail;
  onChange: (user: CmsUserDetail) => void;
}) {
  const { toast, toastError, confirm } = useFeedback();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function upload(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      toast("PNG・JPEG・WebP の画像を選択してください", "error");
      return;
    }
    if (file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
      toast(`画像のサイズが上限（${IMAGE_MAX_SIZE_MB}MB）を超えています`, "error");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const { data } = await api<{ data: CmsUserDetail }>(`/cms/users/${user.id}/avatar`, { method: "POST", formData: form });
      onChange(data);
      toast("アイコンを変更しました");
    } catch (error) {
      toastError(error);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = await confirm({ title: "アイコン画像を削除しますか？", message: "削除すると、名前の1文字目が表示されます。", confirmLabel: "削除する", danger: true });
    if (!ok) return;
    setBusy(true);
    try {
      const { data } = await api<{ data: CmsUserDetail }>(`/cms/users/${user.id}/avatar`, { method: "DELETE" });
      onChange(data);
      toast("アイコン画像を削除しました");
    } catch (error) {
      toastError(error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
      <AuthorAvatar author={user} size={72} />
      <Stack spacing={1}>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" size="small" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <CircularProgress size={16} /> : "画像を変更"}
          </Button>
          {user.avatar_url && (
            <Button color="error" size="small" onClick={remove} disabled={busy}>
              削除
            </Button>
          )}
        </Stack>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          PNG・JPEG・WebP（{IMAGE_MAX_SIZE_MB}MBまで）。正方形に切り抜いて表示します
        </Typography>
      </Stack>
      <input
        ref={input}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) upload(file);
        }}
      />
    </Stack>
  );
}
