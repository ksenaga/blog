"use client";

// C-05. 削除一覧
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteSweepOutlinedIcon from "@mui/icons-material/DeleteSweepOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import RestoreRoundedIcon from "@mui/icons-material/RestoreRounded";
import { useAuth } from "@/components/cms/AuthProvider";
import { AuthorSelect, SearchField } from "@/components/cms/ListFilters";
import PageHeader from "@/components/cms/PageHeader";
import Thumb from "@/components/cms/Thumb";
import { useApi } from "@/components/cms/useApi";
import { useListQuery } from "@/components/cms/useListQuery";
import { useRestoreBlog } from "@/components/cms/useRestoreBlog";
import { formatDateTime } from "@/lib/cms/format";
import type { CmsBlog, Paginated } from "@/lib/cms/types";

function TrashList() {
  const { user } = useAuth();
  const restoreBlog = useRestoreBlog();
  const router = useRouter();
  const { get, set, page, query } = useListQuery();
  const isAdmin = user?.role === "admin";

  const params = new URLSearchParams(query);
  params.set("per_page", "20");
  const { data: result, reload: load } = useApi<Paginated<CmsBlog>>(`/cms/blogs/deleted?${params}`);

  async function handleRestore(blog: CmsBlog) {
    if (await restoreBlog(blog)) load();
  }

  const restoreButton = (blog: CmsBlog) =>
    blog.restorable ? (
      <Button
        size="small"
        variant="outlined"
        startIcon={<RestoreRoundedIcon />}
        onClick={(event) => {
          event.stopPropagation();
          handleRestore(blog);
        }}
      >
        復活
      </Button>
    ) : (
      <Tooltip title="作者が削除されているため復活できません">
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "text.disabled" }}>
          <Typography variant="body2">復活不可</Typography>
          <InfoOutlinedIcon fontSize="small" />
        </Stack>
      </Tooltip>
    );

  const blogs = result?.data;

  return (
    <>
      <PageHeader
        title="削除一覧"
        description="削除したブログを閲覧・復活できます。復活すると「非公開」（一度も公開していない場合は「下書き」）になります"
      />

      <Paper variant="outlined" sx={{ borderRadius: "20px", overflow: "hidden" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ p: 2 }}>
          <SearchField value={get("q")} onChange={(q) => set({ q })} placeholder="タイトルで検索" />
          {isAdmin && <AuthorSelect value={get("author_id")} onChange={(value) => set({ author_id: value })} />}
          <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
          {result && (
            <Typography variant="body2" sx={{ color: "text.secondary", alignSelf: { xs: "flex-end", sm: "center" } }}>
              {result.meta.total}件
            </Typography>
          )}
        </Stack>

        <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary", whiteSpace: "nowrap" } }}>
                <TableCell>タイトル</TableCell>
                {isAdmin && <TableCell>作者</TableCell>}
                <TableCell>削除日時</TableCell>
                <TableCell>削除した人</TableCell>
                <TableCell width={140} />
              </TableRow>
            </TableHead>
            <TableBody>
              {!blogs &&
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton height={44} />
                    </TableCell>
                  </TableRow>
                ))}
              {blogs?.map((blog) => (
                <TableRow
                  key={blog.id}
                  hover
                  onClick={() => router.push(`/cms/blogs/trash/${blog.id}`)}
                  sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
                >
                  <TableCell>
                    <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                      <Thumb src={blog.thumbnail_url} size={40} />
                      <Typography sx={{ fontWeight: 600 }}>{blog.title}</Typography>
                    </Stack>
                  </TableCell>
                  {isAdmin && (
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {blog.author.name}
                      {blog.author.deleted && (
                        <Typography component="span" variant="caption" sx={{ color: "error.main", ml: 0.5 }}>
                          （削除済み）
                        </Typography>
                      )}
                    </TableCell>
                  )}
                  <TableCell sx={{ whiteSpace: "nowrap", color: "text.secondary" }}>{formatDateTime(blog.deleted_at)}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{blog.deleted_by?.name ?? "-"}</TableCell>
                  <TableCell>{restoreButton(blog)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Stack spacing={1.5} sx={{ display: { md: "none" }, p: 2, pt: 0 }}>
          {!blogs && [0, 1, 2].map((i) => <Skeleton key={i} variant="rounded" height={96} />)}
          {blogs?.map((blog) => (
            <Card key={blog.id} variant="outlined">
              <CardActionArea href={`/cms/blogs/trash/${blog.id}`} sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }} noWrap>
                  {blog.title}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {formatDateTime(blog.deleted_at)}・{blog.deleted_by?.name}
                </Typography>
              </CardActionArea>
              <Box sx={{ px: 1.5, pb: 1.5 }}>{restoreButton(blog)}</Box>
            </Card>
          ))}
        </Stack>

        {blogs?.length === 0 && (
          <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
            <DeleteSweepOutlinedIcon sx={{ fontSize: 48, opacity: 0.4 }} />
            <Typography sx={{ mt: 1 }}>削除したブログはありません</Typography>
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
    </>
  );
}

export default function TrashPage() {
  return (
    <Suspense>
      <TrashList />
    </Suspense>
  );
}
