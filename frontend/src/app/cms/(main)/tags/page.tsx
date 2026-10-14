"use client";

// C-13. タグ管理（タグ・テンプレート）
import { Suspense, useState, type FormEvent } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import NextLink from "@/components/NextLink";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import { SearchField } from "@/components/cms/ListFilters";
import PageHeader from "@/components/cms/PageHeader";
import TagInput from "@/components/cms/TagInput";
import { useApi } from "@/components/cms/useApi";
import { useListQuery } from "@/components/cms/useListQuery";
import { ApiError, api } from "@/lib/cms/api";
import { formatDateTime } from "@/lib/cms/format";
import type { CmsTag, TagTemplate } from "@/lib/cms/types";

function TagsPage() {
  const { get, set } = useListQuery();
  const tab = get("tab") || "tags";

  return (
    <>
      <PageHeader
        title="タグ"
        description="タグは全員で共有しています。名前の変更・削除は、全ての記事とテンプレートに反映されます"
      />
      <Tabs value={tab} onChange={(_, value) => set({ tab: value === "tags" ? null : value, q: null })} sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tab value="tags" label="タグ" sx={{ fontWeight: 600 }} />
        <Tab value="templates" label="テンプレート" sx={{ fontWeight: 600 }} />
      </Tabs>
      {tab === "templates" ? <TemplateList /> : <TagList />}
    </>
  );
}

// ---------- タグ ----------

function TagList() {
  const { toast, toastError, confirm } = useFeedback();
  const { get, set } = useListQuery();
  const q = get("q");
  const { data, reload } = useApi<{ data: CmsTag[] }>(`/cms/tags${q ? `?q=${encodeURIComponent(q)}` : ""}`);
  // null：閉じている / "new"：作成 / CmsTag：名前の変更
  const [editing, setEditing] = useState<CmsTag | "new" | null>(null);

  async function handleDelete(tag: CmsTag) {
    const ok = await confirm({
      title: `「#${tag.name}」を削除しますか？`,
      message: `このタグを付けている記事 ${tag.blog_count}件・テンプレート ${tag.template_count}件 から外れます。\n元に戻すことはできません。`,
      confirmLabel: "削除する",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/cms/tags/${tag.id}`, { method: "DELETE" });
      toast("削除しました");
      reload();
    } catch (error) {
      toastError(error);
    }
  }

  const tags = data?.data;

  return (
    <>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mb: 2, alignItems: { sm: "center" } }}>
        <SearchField value={q} onChange={(value) => set({ q: value })} placeholder="タグ名で検索" />
        <Box sx={{ flex: 1 }} />
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing("new")}>
          タグを作成
        </Button>
      </Stack>

      <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 600, color: "text.secondary", whiteSpace: "nowrap" } }}>
                <TableCell>タグ</TableCell>
                <TableCell align="right">記事数</TableCell>
                <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" } }}>
                  テンプレート
                </TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>作成日</TableCell>
                <TableCell width={96} />
              </TableRow>
            </TableHead>
            <TableBody>
              {!tags &&
                [0, 1, 2, 3].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton height={32} />
                    </TableCell>
                  </TableRow>
                ))}
              {tags?.map((tag) => (
                <TableRow key={tag.id} hover sx={{ "&:last-child td": { borderBottom: 0 } }}>
                  <TableCell sx={{ fontWeight: 600 }}>#{tag.name}</TableCell>
                  <TableCell align="right">
                    {tag.blog_count > 0 ? (
                      <Link component={NextLink} href={`/cms/blogs?tag=${encodeURIComponent(tag.name)}`} underline="hover" sx={{ color: "text.primary" }}>
                        {tag.blog_count}
                      </Link>
                    ) : (
                      <Typography component="span" variant="body2" sx={{ color: "text.disabled" }}>
                        0
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: "none", sm: "table-cell" }, color: tag.template_count ? "text.primary" : "text.disabled" }}>
                    {tag.template_count}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" }, color: "text.secondary", whiteSpace: "nowrap" }}>
                    {formatDateTime(tag.created_at).slice(0, 10)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Tooltip title="名前を変更">
                      <IconButton size="small" onClick={() => setEditing(tag)} aria-label={`#${tag.name} の名前を変更`}>
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="削除">
                      <IconButton size="small" onClick={() => handleDelete(tag)} aria-label={`#${tag.name} を削除`}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {tags?.length === 0 && (
          <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
            <LocalOfferOutlinedIcon sx={{ fontSize: 40, opacity: 0.4 }} />
            <Typography sx={{ mt: 1 }}>{q ? "該当するタグはありません" : "まだタグがありません"}</Typography>
          </Box>
        )}
      </Paper>

      {editing && (
        <TagDialog
          tag={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}

// タグの作成・名前の変更
function TagDialog({ tag, onClose, onSaved }: { tag: CmsTag | null; onClose: () => void; onSaved: () => void }) {
  const { toast, toastError } = useFeedback();
  const [name, setName] = useState(tag?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api(tag ? `/cms/tags/${tag.id}` : "/cms/tags", { method: tag ? "PATCH" : "POST", body: { name } });
      toast(tag ? "名前を変更しました" : "タグを作成しました");
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.details.length) setError(err.details[0].message);
      else toastError(err);
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="xs" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>{tag ? "タグ名の変更" : "タグを作成"}</DialogTitle>
        <DialogContent>
          {tag && tag.blog_count > 0 && (
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
              このタグを付けている記事 {tag.blog_count}件 の表示も変わります。
            </Typography>
          )}
          <TextField
            autoFocus
            fullWidth
            label="タグ名"
            value={name}
            onChange={(event) => setName(event.target.value)}
            error={!!error}
            helperText={error ?? "30文字以内。先頭の「#」は不要です"}
            slotProps={{ htmlInput: { maxLength: 31 } }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" variant="contained" disabled={saving || !name.trim()}>
            {tag ? "変更する" : "作成する"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

// ---------- テンプレート ----------

function TemplateList() {
  const { toast, toastError, confirm } = useFeedback();
  const { data, reload } = useApi<{ data: TagTemplate[] }>("/cms/tag-templates");
  const [editing, setEditing] = useState<TagTemplate | "new" | null>(null);

  async function handleDelete(template: TagTemplate) {
    const ok = await confirm({
      title: `テンプレート「${template.name}」を削除しますか？`,
      message: "テンプレートを削除しても、タグや記事はそのまま残ります。",
      confirmLabel: "削除する",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/cms/tag-templates/${template.id}`, { method: "DELETE" });
      toast("削除しました");
      reload();
    } catch (error) {
      toastError(error);
    }
  }

  const templates = data?.data;

  return (
    <>
      <Stack direction="row" sx={{ mb: 2, alignItems: "center" }}>
        <Typography variant="body2" sx={{ color: "text.secondary", flex: 1 }}>
          よく使うタグの組み合わせを登録しておくと、記事の編集画面でまとめて追加できます
        </Typography>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={() => setEditing("new")} sx={{ flexShrink: 0, ml: 2 }}>
          テンプレートを作成
        </Button>
      </Stack>

      <Grid container spacing={2}>
        {!templates &&
          [0, 1, 2].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Skeleton variant="rounded" height={140} />
            </Grid>
          ))}
        {templates?.map((template) => (
          <Grid key={template.id} size={{ xs: 12, sm: 6, lg: 4 }}>
            <Card sx={{ height: "100%" }}>
              <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 1.5 }}>
                <Stack direction="row" sx={{ alignItems: "flex-start" }}>
                  <Typography sx={{ fontWeight: 700, flex: 1 }}>{template.name}</Typography>
                  {template.editable && (
                    <Box sx={{ mt: -0.5, mr: -1, whiteSpace: "nowrap" }}>
                      <Tooltip title="編集">
                        <IconButton size="small" onClick={() => setEditing(template)} aria-label={`${template.name} を編集`}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="削除">
                        <IconButton size="small" onClick={() => handleDelete(template)} aria-label={`${template.name} を削除`}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  )}
                </Stack>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                  {template.tags.map((tag) => (
                    <Chip key={tag} size="small" variant="outlined" label={`#${tag}`} />
                  ))}
                  {template.tags.length === 0 && (
                    <Typography variant="body2" sx={{ color: "text.disabled" }}>
                      タグがありません
                    </Typography>
                  )}
                </Stack>
                <Typography variant="caption" sx={{ color: "text.secondary", mt: "auto" }}>
                  作成：{template.created_by.name}・更新 {formatDateTime(template.updated_at)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      {templates?.length === 0 && (
        <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
          <Typography>まだテンプレートがありません</Typography>
        </Box>
      )}

      {editing && (
        <TemplateDialog
          template={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}
    </>
  );
}

// テンプレートの作成・編集
function TemplateDialog({
  template,
  onClose,
  onSaved,
}: {
  template: TagTemplate | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast, toastError } = useFeedback();
  const [name, setName] = useState(template?.name ?? "");
  const [tags, setTags] = useState<string[]>(template?.tags ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    try {
      await api(template ? `/cms/tag-templates/${template.id}` : "/cms/tag-templates", {
        method: template ? "PATCH" : "POST",
        body: { name, tags },
      });
      toast(template ? "テンプレートを保存しました" : "テンプレートを作成しました");
      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.details.length) setErrors(err.fieldErrors());
      else toastError(err);
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit} noValidate>
        <DialogTitle sx={{ fontWeight: 700, fontSize: 18 }}>{template ? "テンプレートの編集" : "テンプレートを作成"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="テンプレート名"
              placeholder="例：旅行記"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={!!errors.name}
              helperText={errors.name ?? "50文字以内"}
              slotProps={{ htmlInput: { maxLength: 50 } }}
            />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                タグ
              </Typography>
              <TagInput value={tags} onChange={setTags} />
              {errors.tags && (
                <Typography variant="caption" sx={{ color: "error.main" }}>
                  {errors.tags}
                </Typography>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button color="inherit" onClick={onClose}>
            キャンセル
          </Button>
          <Button type="submit" variant="contained" disabled={saving || !name.trim() || tags.length === 0}>
            {template ? "保存する" : "作成する"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default function Page() {
  return (
    <Suspense>
      <TagsPage />
    </Suspense>
  );
}
