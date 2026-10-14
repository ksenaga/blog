"use client";

// C-06. 削除済みブログの閲覧
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import { useRestoreBlog } from "@/components/cms/useRestoreBlog";
import { articleStyles } from "@/components/articleStyles";
import { blogEditorExtensions } from "@/components/cms/editor/extensions";
import { api } from "@/lib/cms/api";
import { formatDateTime } from "@/lib/cms/format";
import type { CmsBlog } from "@/lib/cms/types";

export default function TrashDetailPage({ params }: PageProps<"/cms/blogs/trash/[id]">) {
  const { id } = use(params);
  const router = useRouter();
  const { toastError } = useFeedback();
  const restoreBlog = useRestoreBlog();
  const [blog, setBlog] = useState<CmsBlog | null>(null);

  // 本文は TipTap の読み取り専用モードで表示する
  const editor = useEditor({ extensions: blogEditorExtensions(""), editable: false, immediatelyRender: false });

  useEffect(() => {
    if (!editor) return;
    api<{ data: CmsBlog }>(`/cms/blogs/${id}`)
      .then(({ data }) => {
        if (!data.deleted_at) {
          router.replace(`/cms/blogs/${data.id}/edit`);
          return;
        }
        setBlog(data);
        editor.commands.setContent(data.body ?? { type: "doc", content: [] });
      })
      .catch((error) => {
        toastError(error);
        router.replace("/cms/blogs/trash");
      });
  }, [id, editor, router, toastError]);

  async function handleRestore() {
    if (!blog) return;
    const restored = await restoreBlog(blog);
    if (restored) router.push(`/cms/blogs/${restored.id}/edit`);
  }

  return (
    <>
      <Stack direction="row" sx={{ alignItems: "center", mb: 3 }}>
        <Button href="/cms/blogs/trash" startIcon={<ArrowBackRoundedIcon />} sx={{ ml: -1.5 }}>
          削除一覧へ
        </Button>
        <Box sx={{ flex: 1 }} />
        {blog && (
          <Button variant="contained" startIcon={<RestoreRoundedIcon />} onClick={handleRestore} disabled={!blog.restorable}>
            復活
          </Button>
        )}
      </Stack>

      {!blog ? (
        <>
          <Skeleton variant="rounded" height={56} />
          <Skeleton variant="rounded" height={420} sx={{ mt: 2 }} />
        </>
      ) : (
        <>
          <Alert severity="error" icon={<DeleteOutlineRoundedIcon />} sx={{ mb: 2 }}>
            このブログは削除されています（{formatDateTime(blog.deleted_at)}・{blog.deleted_by?.name ?? "不明"}）
          </Alert>
          {!blog.restorable && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              作者が削除されているため復活できません
            </Alert>
          )}
        </>
      )}

      <Paper variant="outlined" sx={{ borderRadius: "12px", p: { xs: 2, sm: 4, md: 6 }, maxWidth: 880, mx: "auto", display: blog ? "block" : "none" }}>
        <Typography variant="h4" component="h1" sx={{ fontSize: { xs: 24, md: 32 }, lineHeight: 1.4 }}>
          {blog?.title}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary", mt: 1, mb: 4 }}>
          {blog?.author.name}・作成 {formatDateTime(blog?.created_at)}
        </Typography>
        <Box sx={articleStyles}>
          <EditorContent editor={editor} />
        </Box>
      </Paper>
    </>
  );
}
