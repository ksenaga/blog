"use client";

// C-03. ブログ一覧
import { Suspense, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import CardActionArea from "@mui/material/CardActionArea";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
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
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import MoreHorizRoundedIcon from "@mui/icons-material/MoreHorizRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import { useAuth } from "@/components/cms/AuthProvider";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import { AuthorSelect, SearchField } from "@/components/cms/ListFilters";
import PageHeader from "@/components/cms/PageHeader";
import StatusChip from "@/components/cms/StatusChip";
import Thumb from "@/components/cms/Thumb";
import { useCreateBlog } from "@/components/cms/useCreateBlog";
import { useApi } from "@/components/cms/useApi";
import { useListQuery } from "@/components/cms/useListQuery";
import { api } from "@/lib/cms/api";
import { formatDateTime } from "@/lib/cms/format";
import type { CmsBlog, Paginated } from "@/lib/cms/types";

const STATUS_TABS = [
  { value: "", label: "すべて" },
  { value: "draft", label: "下書き" },
  { value: "scheduled", label: "公開予定" },
  { value: "public", label: "公開中" },
  { value: "private", label: "非公開" },
];

const SORTS = [
  { value: "updated_at", label: "更新日時" },
  { value: "created_at", label: "作成日時" },
  { value: "published_at", label: "公開日時" },
];

function BlogList() {
  const { user } = useAuth();
  const { toast, toastError, confirm } = useFeedback();
  const { createBlog, creating } = useCreateBlog();
  const router = useRouter();
  const { get, set, page, query } = useListQuery();
  const [menu, setMenu] = useState<{ anchor: HTMLElement; blog: CmsBlog } | null>(null);
  const isAdmin = user?.role === "admin";

  const params = new URLSearchParams(query);
  params.set("per_page", "20");
  if (!params.get("sort")) params.set("sort", "updated_at");
  const { data: result, reload: load } = useApi<Paginated<CmsBlog>>(`/cms/blogs?${params}`);

  const openMenu = (event: MouseEvent<HTMLElement>, blog: CmsBlog) => {
    event.stopPropagation();
    setMenu({ anchor: event.currentTarget, blog });
  };

  async function handleDelete(blog: CmsBlog) {
    setMenu(null);
    const ok = await confirm({
      title: "ブログを削除しますか？",
      message: `「${blog.title}」を削除します。削除したブログは削除一覧から復活できます。`,
      confirmLabel: "削除する",
      danger: true,
    });
    if (!ok) return;
    try {
      await api(`/cms/blogs/${blog.id}`, { method: "DELETE" });
      toast("削除しました");
      load();
    } catch (error) {
      toastError(error);
    }
  }

  const blogs = result?.data;

  return (
    <>
      <PageHeader
        title="ブログ一覧"
        description={isAdmin ? "全てのユーザーのブログを管理できます" : "あなたのブログを管理できます"}
        actions={
          <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={createBlog} disabled={creating}>
            新規作成
          </Button>
        }
      />

      <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
        <Tabs
          value={get("status")}
          onChange={(_, value) => set({ status: value })}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}
        >
          {STATUS_TABS.map((tab) => (
            <Tab key={tab.value} value={tab.value} label={tab.label} sx={{ fontWeight: 700, minWidth: 80 }} />
          ))}
        </Tabs>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ p: 2, flexWrap: "wrap", rowGap: 1.5 }}>
          <SearchField value={get("q")} onChange={(q) => set({ q })} placeholder="タイトルで検索" />
          {isAdmin && <AuthorSelect value={get("author_id")} onChange={(value) => set({ author_id: value })} />}
          {get("tag") && (
            <Chip label={`#${get("tag")}`} onDelete={() => set({ tag: null })} sx={{ alignSelf: "center" }} />
          )}
          <TextField
            select
            size="small"
            label="並び順"
            value={get("sort") || "updated_at"}
            onChange={(event) => set({ sort: event.target.value })}
            sx={{ minWidth: 140 }}
          >
            {SORTS.map((sort) => (
              <MenuItem key={sort.value} value={sort.value}>
                {sort.label}（新しい順）
              </MenuItem>
            ))}
          </TextField>
          <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
          {result && (
            <Typography variant="body2" sx={{ color: "text.secondary", alignSelf: { xs: "flex-end", sm: "center" } }}>
              {result.meta.total}件
            </Typography>
          )}
        </Stack>

        {/* PC・タブレット：表 */}
        <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary", whiteSpace: "nowrap" } }}>
                <TableCell>タイトル</TableCell>
                <TableCell>ステータス</TableCell>
                {isAdmin && <TableCell>作者</TableCell>}
                <TableCell>公開日時</TableCell>
                <TableCell>更新日時</TableCell>
                <TableCell width={56} />
              </TableRow>
            </TableHead>
            <TableBody>
              {!blogs &&
                [0, 1, 2, 3, 4].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={isAdmin ? 6 : 5}>
                      <Skeleton height={44} />
                    </TableCell>
                  </TableRow>
                ))}
              {blogs?.map((blog) => (
                <TableRow
                  key={blog.id}
                  hover
                  onClick={() => router.push(`/cms/blogs/${blog.id}/edit`)}
                  sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                      <Thumb src={blog.thumbnail_url} size={40} />
                      <Typography sx={{ fontWeight: 600, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {blog.title}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={blog.status} />
                  </TableCell>
                  {isAdmin && <TableCell sx={{ whiteSpace: "nowrap" }}>{blog.author.name}</TableCell>}
                  <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>
                    {blog.status === "draft" ? "-" : formatDateTime(blog.published_at)}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>{formatDateTime(blog.updated_at)}</TableCell>
                  <TableCell>
                    <IconButton aria-label="操作" onClick={(event) => openMenu(event, blog)}>
                      <MoreHorizRoundedIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* スマートフォン：カード */}
        <Stack spacing={1.5} sx={{ display: { md: "none" }, p: 2, pt: 0 }}>
          {!blogs && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={96} />)}
          {blogs?.map((blog) => (
            <Card key={blog.id} variant="outlined">
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <CardActionArea href={`/cms/blogs/${blog.id}/edit`} sx={{ p: 1.5, display: "flex", gap: 1.5, justifyContent: "flex-start" }}>
                  <Thumb src={blog.thumbnail_url} size={48} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 15 }} noWrap>
                      {blog.title}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.75, alignItems: "center" }}>
                      <StatusChip status={blog.status} />
                      <Typography variant="caption" sx={{ color: "text.secondary" }} noWrap>
                        {isAdmin ? `${blog.author.name}・` : ""}
                        {formatDateTime(blog.updated_at)}
                      </Typography>
                    </Stack>
                  </Box>
                </CardActionArea>
                <IconButton aria-label="操作" onClick={(event) => openMenu(event, blog)} sx={{ mr: 0.5 }}>
                  <MoreHorizRoundedIcon />
                </IconButton>
              </Box>
            </Card>
          ))}
        </Stack>

        {blogs?.length === 0 && (
          <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
            <ArticleOutlinedIcon sx={{ fontSize: 48, opacity: 0.4 }} />
            <Typography sx={{ mt: 1 }}>該当するブログはありません</Typography>
          </Box>
        )}
      </Paper>

      {result && result.meta.total_pages > 1 && (
        <Pagination
          page={page}
          count={result.meta.total_pages}
          onChange={(_, value) => set({ page: value })}
          color="primary"
          shape="rounded"
          sx={{ display: "flex", justifyContent: "center", mt: 3 }}
        />
      )}

      <Menu anchorEl={menu?.anchor} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => menu && router.push(`/cms/blogs/${menu.blog.id}/edit`)}>
          <ListItemIcon>
            <EditOutlinedIcon fontSize="small" />
          </ListItemIcon>
          編集
        </MenuItem>
        {menu?.blog.status === "public" && (
          <MenuItem component="a" href={`/blog/${menu.blog.slug}`} target="_blank" onClick={() => setMenu(null)}>
            <ListItemIcon>
              <OpenInNewRoundedIcon fontSize="small" />
            </ListItemIcon>
            公開ページを見る
          </MenuItem>
        )}
        {menu && menu.blog.status !== "public" && (
          <MenuItem onClick={() => handleDelete(menu.blog)} sx={{ color: "error.main" }}>
            <ListItemIcon>
              <DeleteOutlineRoundedIcon fontSize="small" color="error" />
            </ListItemIcon>
            削除
          </MenuItem>
        )}
      </Menu>
    </>
  );
}

export default function BlogListPage() {
  return (
    <Suspense>
      <BlogList />
    </Suspense>
  );
}
