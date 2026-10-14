"use client";

// C-04. ブログ編集
import { use, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputBase from "@mui/material/InputBase";
import LinearProgress from "@mui/material/LinearProgress";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import ImageOutlinedIcon from "@mui/icons-material/ImageOutlined";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { useAuth } from "@/components/cms/AuthProvider";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import StatusChip from "@/components/cms/StatusChip";
import TagInput from "@/components/cms/TagInput";
import TemplateMenu from "@/components/cms/TemplateMenu";
import EditorToolbar from "@/components/cms/editor/EditorToolbar";
import { editorStyles } from "@/components/cms/editor/editorStyles";
import { blogEditorExtensions } from "@/components/cms/editor/extensions";
import { ApiError, api } from "@/lib/cms/api";
import { formatDateTime, toDateTimeLocal } from "@/lib/cms/format";
import type { BlogImage, CmsBlog } from "@/lib/cms/types";

const TITLE_MAX = 100;
const IMAGE_MAX_SIZE_MB = Number(process.env.NEXT_PUBLIC_IMAGE_MAX_SIZE_MB) || 10;

export default function BlogEditPage({ params }: PageProps<"/cms/blogs/[id]/edit">) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { toast, toastError, confirm } = useFeedback();

  const [blog, setBlog] = useState<CmsBlog | null>(null);
  const [title, setTitle] = useState("");
  const [savedTitle, setSavedTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [savedTags, setSavedTags] = useState<string[]>([]);
  const [bodyDirty, setBodyDirty] = useState(false);
  // 最後に読み込み・保存した本文。エディタが読み込み時に整える内容（末尾の空の段落など）を変更と数えないよう、比べて判定する
  const savedBody = useRef("");
  const dirty = bodyDirty || title !== savedTitle || tags.join("\n") !== savedTags.join("\n");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(0);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleKey, setScheduleKey] = useState(0);
  // 画像アップロードの処理をエディタのイベントから呼ぶため
  const uploadRef = useRef<(files: File[], pos?: number) => void>(() => undefined);

  const editor = useEditor({
    extensions: blogEditorExtensions(),
    immediatelyRender: false,
    editable: false,
    onUpdate: ({ editor: e }) => setBodyDirty(JSON.stringify(e.getJSON()) !== savedBody.current),
    editorProps: {
      // 画像のドラッグ＆ドロップ
      handleDrop: (view, event, _slice, moved) => {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((file) => file.type.startsWith("image/"));
        if (moved || files.length === 0 || !view.editable) return false;
        event.preventDefault();
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos;
        uploadRef.current(files, pos);
        return true;
      },
      // 画像の貼り付け
      handlePaste: (view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []).filter((file) => file.type.startsWith("image/"));
        if (files.length === 0 || !view.editable) return false;
        uploadRef.current(files);
        return true;
      },
    },
  });

  // 読み込んだ内容をエディタに反映する
  const applyBlog = useCallback(
    (data: CmsBlog, options: { content?: boolean } = { content: true }) => {
      setBlog(data);
      if (options.content && editor) {
        setTitle(data.title);
        setSavedTitle(data.title);
        setTags(data.tags);
        setSavedTags(data.tags);
        editor.commands.setContent(data.body ?? { type: "doc", content: [] }, { emitUpdate: false });
        savedBody.current = JSON.stringify(editor.getJSON());
        setBodyDirty(false);
      }
      editor?.setEditable(data.editable);
    },
    [editor],
  );

  const load = useCallback(
    () =>
      api<{ data: CmsBlog }>(`/cms/blogs/${id}`)
        .then(({ data }) => {
          if (data.deleted_at) router.replace(`/cms/blogs/trash/${data.id}`);
          else applyBlog(data);
        })
        .catch((error) => {
          // 存在しない・権限がない場合は一覧へ戻す
          toastError(error);
          router.replace("/cms/blogs");
        }),
    [id, applyBlog, router, toastError],
  );

  useEffect(() => {
    if (editor) load();
  }, [editor, load]);

  // 保存していない変更がある状態で画面を離れるとき
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // 他の人が先に更新していた場合（M-10）
  const handleConflict = useCallback(async () => {
    const reload = await confirm({
      title: "他の人がこのブログを更新しました",
      message: "最新の内容を読み込みますか？\n読み込むと、保存していないあなたの変更は消えます。",
      confirmLabel: "最新の内容を読み込む",
    });
    if (reload) await load();
  }, [confirm, load]);

  // 保存（B-4）。成功したら最新のブログを返す
  const save = useCallback(async (): Promise<CmsBlog | null> => {
    if (!blog || !editor) return null;
    if (!title.trim()) {
      toast("タイトルを入力してください", "error");
      return null;
    }
    setSaving(true);
    const body = editor.getJSON();
    try {
      const { data } = await api<{ data: CmsBlog }>(`/cms/blogs/${blog.id}`, {
        method: "PATCH",
        body: { title: title.trim(), body, tags, version: blog.version },
      });
      applyBlog(data, { content: false });
      // 保存した内容を基準にする
      savedBody.current = JSON.stringify(body);
      setSavedTitle(data.title);
      setTitle(data.title);
      setSavedTags(data.tags);
      setTags(data.tags);
      setBodyDirty(JSON.stringify(editor.getJSON()) !== savedBody.current);
      return data;
    } catch (error) {
      if (error instanceof ApiError && error.code === "VERSION_CONFLICT") await handleConflict();
      else toastError(error);
      return null;
    } finally {
      setSaving(false);
    }
  }, [blog, editor, title, tags, applyBlog, handleConflict, toast, toastError]);

  async function handleSave() {
    if (await save()) toast("保存しました");
  }

  // ステータス変更（B-5）。未保存の変更があれば先に保存する
  async function changeStatus(status: "public" | "scheduled" | "private", publishedAt?: string) {
    let current = blog;
    if (dirty && current?.editable) {
      current = await save();
      if (!current) return;
    }
    if (!current) return;
    try {
      const { data } = await api<{ data: CmsBlog }>(`/cms/blogs/${current.id}/status`, {
        method: "PATCH",
        body: { status, version: current.version, ...(publishedAt && { published_at: publishedAt }) },
      });
      applyBlog(data, { content: false });
      if (status === "public") toast("公開しました");
      if (status === "private") toast("非公開にしました");
      if (status === "scheduled") toast(`${formatDateTime(data.published_at)} に公開予定として設定しました`);
    } catch (error) {
      if (error instanceof ApiError && error.code === "VERSION_CONFLICT") await handleConflict();
      else toastError(error);
    }
  }

  async function handlePublish() {
    const ok = await confirm({
      title: "ブログを公開しますか？",
      message: "公開すると、閲覧者がこのブログを見られるようになります。\n公開中は編集できません。",
      confirmLabel: "公開する",
    });
    if (ok) await changeStatus("public");
  }

  async function handleMakePrivate() {
    const ok = await confirm({
      title: "ブログを非公開にしますか？",
      message: "非公開にすると、閲覧者には「非公開中です」と表示されます。",
      confirmLabel: "非公開にする",
    });
    if (ok) await changeStatus("private");
  }

  async function handleDelete() {
    if (!blog) return;
    const ok = await confirm({
      title: "ブログを削除しますか？",
      message: "削除したブログは削除一覧から復活できます。",
      confirmLabel: "削除する",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/cms/blogs/${blog.id}`, { method: "DELETE" });
      savedBody.current = JSON.stringify(editor?.getJSON());
      setSavedTitle(title);
      setSavedTags(tags);
      setBodyDirty(false);
      toast("削除しました");
      router.push("/cms/blogs");
    } catch (error) {
      toastError(error);
    }
  }

  async function handleBack() {
    if (dirty) {
      const ok = await confirm({ title: "保存されていない変更があります。移動しますか？", confirmLabel: "移動する" });
      if (!ok) return;
    }
    router.push("/cms/blogs");
  }

  // 画像のアップロード（B-9）。終わったら指定位置（なければカーソル位置）に挿入する
  const uploadImages = async (files: File[], pos?: number) => {
    if (!blog || !editor) return;
    for (const file of files) {
      if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        toast(`${file.name}：PNG・JPEG・WebP の画像を選択してください`, "error");
        continue;
      }
      if (file.size > IMAGE_MAX_SIZE_MB * 1024 * 1024) {
        toast(`画像のサイズが上限（${IMAGE_MAX_SIZE_MB}MB）を超えています`, "error");
        continue;
      }
      setUploading((count) => count + 1);
      try {
        const form = new FormData();
        form.append("file", file);
        const { data } = await api<{ data: BlogImage }>(`/cms/blogs/${blog.id}/images`, { method: "POST", formData: form });
        const node: JSONContent = {
          type: "image",
          attrs: { src: data.url, alt: data.alt, imageId: data.id, width: data.width, height: data.height },
        };
        if (pos !== undefined) editor.chain().focus().insertContentAt(pos, node).run();
        else editor.chain().focus().insertContent(node).run();
      } catch (error) {
        toastError(error);
      } finally {
        setUploading((count) => count - 1);
      }
    }
  };
  // エディタのイベント（ドロップ・貼り付け）からは ref 経由で最新の処理を呼ぶ
  useEffect(() => {
    uploadRef.current = uploadImages;
  });

  if (!blog || !editor) {
    return (
      <Box>
        <Skeleton width={160} height={40} />
        <Skeleton variant="rounded" height={64} sx={{ mt: 3 }} />
        <Skeleton variant="rounded" height={420} sx={{ mt: 2 }} />
      </Box>
    );
  }

  const othersBlog = user?.id !== blog.author.id;
  const can = (status: string) => blog.allowed_transitions.includes(status as never);
  const publicUrl = typeof window === "undefined" ? `/blog/${blog.slug}` : `${window.location.origin}/blog/${blog.slug}`;

  return (
    <>
      {/* 上部：戻る・ステータス・保存 */}
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 3 }}>
        <Button startIcon={<ArrowBackRoundedIcon />} onClick={handleBack} sx={{ ml: -1.5 }}>
          ブログ一覧へ
        </Button>
        <Box sx={{ flex: 1 }} />
        {dirty && (
          <Typography variant="caption" sx={{ color: "warning.main", fontWeight: 700, display: { xs: "none", sm: "block" } }}>
            保存されていない変更があります
          </Typography>
        )}
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <SaveRoundedIcon />}
          onClick={handleSave}
          disabled={!blog.editable || saving || !dirty}
        >
          保存
        </Button>
      </Stack>

      <Stack spacing={1.5} sx={{ mb: 3 }}>
        {blog.status === "public" && (
          <Alert
            severity="warning"
            action={
              <Button color="inherit" size="small" onClick={handleMakePrivate} sx={{ fontWeight: 700 }}>
                非公開にする
              </Button>
            }
          >
            公開中のため編集できません。編集するには非公開にしてください
          </Alert>
        )}
        {blog.status === "scheduled" && (
          <Alert severity="info" icon={<EventRoundedIcon />}>
            {formatDateTime(blog.published_at)} に公開される予定です
          </Alert>
        )}
        {othersBlog && (
          <Alert severity="info">{blog.author.name}さんのブログです。操作した内容は作者に通知されます</Alert>
        )}
      </Stack>

      <Grid container spacing={3}>
        {/* 左：タイトルと本文 */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper variant="outlined" sx={{ borderRadius: "12px", p: { xs: 2, sm: 3, md: 4 } }}>
            <InputBase
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, TITLE_MAX))}
              placeholder="タイトル"
              multiline
              fullWidth
              readOnly={!blog.editable}
              slotProps={{ input: { "aria-label": "タイトル", maxLength: TITLE_MAX } }}
              sx={{ fontSize: { xs: 24, md: 30 }, fontWeight: 700, lineHeight: 1.4 }}
            />
            <Typography variant="caption" sx={{ display: "block", textAlign: "right", color: title.length >= TITLE_MAX ? "error.main" : "text.secondary" }}>
              残り {TITLE_MAX - title.length} 文字
            </Typography>
            <Divider sx={{ my: 2 }} />

            {blog.editable && (
              <EditorToolbar editor={editor} onPickImages={(files) => uploadImages(files)} />
            )}
            {uploading > 0 && (
              <Box sx={{ mt: 1.5 }}>
                <LinearProgress sx={{ borderRadius: 1 }} />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  画像をアップロードしています（残り{uploading}件）…
                </Typography>
              </Box>
            )}
            {blog.editable && <ImagePanel editor={editor} />}

            <Box sx={(theme) => ({ ...editorStyles(theme), mt: 3 })}>
              <EditorContent editor={editor} />
            </Box>
          </Paper>
        </Grid>

        {/* 右：ステータス・公開URL・削除 */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Stack spacing={2} sx={{ position: { md: "sticky" }, top: { md: 92 } }}>
            <SideCard title="ステータス">
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <StatusChip status={blog.status} size="medium" />
                {blog.status !== "draft" && blog.published_at && (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {blog.status === "scheduled" ? "公開予定：" : "公開日時："}
                    {formatDateTime(blog.published_at)}
                  </Typography>
                )}
              </Stack>
              <Stack spacing={1} sx={{ mt: 2.5 }}>
                {can("public") && (
                  <Button variant="contained" startIcon={<PublicRoundedIcon />} onClick={handlePublish} fullWidth>
                    公開する
                  </Button>
                )}
                {can("scheduled") && (
                  <Button variant="outlined" startIcon={<EventRoundedIcon />} onClick={() => {
                      setScheduleKey((key) => key + 1);
                      setScheduleOpen(true);
                    }}
                    fullWidth
                  >
                    公開予定にする
                  </Button>
                )}
                {can("private") && (
                  <Button variant="outlined" color="warning" startIcon={<VisibilityOffOutlinedIcon />} onClick={handleMakePrivate} fullWidth>
                    非公開にする
                  </Button>
                )}
              </Stack>
            </SideCard>

            <SideCard title="タグ">
              <TagInput value={tags} onChange={setTags} disabled={!blog.editable} />
              <TemplateMenu value={tags} onChange={setTags} disabled={!blog.editable} />
            </SideCard>

            <SideCard title="公開URL">
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography variant="body2" sx={{ flex: 1, minWidth: 0, fontFamily: "monospace", color: "text.secondary" }} noWrap>
                  /blog/{blog.slug}
                </Typography>
                <Tooltip title="URLをコピー">
                  <IconButton
                    size="small"
                    onClick={() => navigator.clipboard.writeText(publicUrl).then(() => toast("URLをコピーしました", "info"))}
                  >
                    <ContentCopyRoundedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                {blog.status === "public" && (
                  <Tooltip title="公開ページを開く">
                    <IconButton size="small" component="a" href={`/blog/${blog.slug}`} target="_blank">
                      <OpenInNewRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
              {!blog.first_published_at && (
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  公開するまで、このURLは閲覧者には表示されません
                </Typography>
              )}
            </SideCard>

            <SideCard title="情報">
              <Info label="作者" value={blog.author.name} />
              <Info label="作成" value={formatDateTime(blog.created_at)} />
              <Info label="更新" value={formatDateTime(blog.updated_at)} />
              <Info label="画像" value={`${blog.images.length}枚`} />
              <Info label="いいね" value={`${blog.like_count}件`} />
            </SideCard>

            {can("deleted") && (
              <Button color="error" variant="text" startIcon={<DeleteOutlineRoundedIcon />} onClick={handleDelete}>
                このブログを削除
              </Button>
            )}
          </Stack>
        </Grid>
      </Grid>

      <ScheduleDialog
        key={scheduleKey}
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
        onSubmit={async (date) => {
          setScheduleOpen(false);
          await changeStatus("scheduled", date.toISOString());
        }}
      />
    </>
  );
}

// 選択中の画像の代替テキストと削除
function ImagePanel({ editor }: { editor: Editor }) {
  const image = useEditorState({
    editor,
    selector: ({ editor: e }) => (e.isActive("image") ? { alt: String(e.getAttributes("image").alt ?? "") } : null),
  });
  if (!image) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        mt: 1.5,
        p: 1.5,
        borderRadius: "8px",
        display: "flex",
        gap: 1.5,
        alignItems: "center",
        flexWrap: "wrap",
        bgcolor: "action.hover",
      }}
    >
      <ImageOutlinedIcon sx={{ color: "text.secondary" }} />
      <TextField
        size="small"
        label="代替テキスト（alt）"
        placeholder="画像の内容を短く説明してください"
        value={image.alt}
        onChange={(event) => editor.commands.updateAttributes("image", { alt: event.target.value.slice(0, 200) })}
        sx={{ flex: 1, minWidth: 220 }}
      />
      <Button color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => editor.chain().focus().deleteSelection().run()}>
        画像を削除
      </Button>
    </Paper>
  );
}

// 公開予定の日時を選ぶ。過去の日時は選べない
function ScheduleDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (date: Date) => void;
}) {
  // 開くたびに key を変えて作り直すため、初期値はここで決める
  const [now] = useState(() => new Date());
  const [value, setValue] = useState(() => {
    // 初期値は翌日の朝9時
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    return toDateTimeLocal(tomorrow);
  });

  const date = value ? new Date(value) : null;
  const invalid = !date || Number.isNaN(date.getTime()) || date <= now;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>公開予定にする</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>指定した日時になると、自動で公開されます。</DialogContentText>
        <TextField
          type="datetime-local"
          label="公開日時"
          fullWidth
          value={value}
          onChange={(event) => setValue(event.target.value)}
          error={!!value && invalid}
          helperText={!!value && invalid ? "未来の日時を指定してください" : " "}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: toDateTimeLocal(now) } }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button color="inherit" onClick={onClose}>
          キャンセル
        </Button>
        <Button variant="contained" disabled={invalid} onClick={() => date && onSubmit(date)}>
          公開予定にする
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SideCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ mt: 1 }}>{children}</Box>
      </CardContent>
    </Card>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ py: 0.5 }}>
      <Typography variant="body2" sx={{ color: "text.secondary", width: 56, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {value}
      </Typography>
    </Stack>
  );
}
