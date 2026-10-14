"use client";

// C-07. ユーザー一覧（管理者のみ）
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import PersonAddAlt1RoundedIcon from "@mui/icons-material/PersonAddAlt1Rounded";
import AuthorAvatar from "@/components/AuthorAvatar";
import AdminOnly from "@/components/cms/AdminOnly";
import { useAuth } from "@/components/cms/AuthProvider";
import { SearchField } from "@/components/cms/ListFilters";
import PageHeader from "@/components/cms/PageHeader";
import RoleChip from "@/components/cms/RoleChip";
import { useApi } from "@/components/cms/useApi";
import { useListQuery } from "@/components/cms/useListQuery";
import { formatDateTime } from "@/lib/cms/format";
import type { CmsUserDetail, Paginated } from "@/lib/cms/types";

function UserList() {
  const { user: me } = useAuth();
  const router = useRouter();
  const { get, set, page, query } = useListQuery();
  const params = new URLSearchParams(query);
  params.set("per_page", "20");
  const { data: result } = useApi<Paginated<CmsUserDetail>>(`/cms/users?${params}`);

  // 自分の行を押した場合はアカウント設定へ
  const open = (user: CmsUserDetail) =>
    router.push(user.id === me?.id ? "/cms/account" : `/cms/users/${user.id}/edit`);

  const users = result?.data;

  return (
    <>
      <PageHeader
        title="ユーザー一覧"
        actions={
          <Button variant="contained" size="large" startIcon={<PersonAddAlt1RoundedIcon />} href="/cms/users/new">
            ユーザー作成
          </Button>
        }
      />
      <Paper variant="outlined" sx={{ borderRadius: "12px", overflow: "hidden" }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ p: 2 }}>
          <SearchField value={get("q")} onChange={(q) => set({ q })} placeholder="名前・メールアドレスで検索" />
          <TextField select size="small" label="ロール" value={get("role")} onChange={(event) => set({ role: event.target.value })} sx={{ minWidth: 140 }}>
            <MenuItem value="">すべて</MenuItem>
            <MenuItem value="admin">管理者</MenuItem>
            <MenuItem value="user">ユーザー</MenuItem>
          </TextField>
          <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
          {result && (
            <Typography variant="body2" sx={{ color: "text.secondary", alignSelf: { xs: "flex-end", sm: "center" } }}>
              {result.meta.total}人
            </Typography>
          )}
        </Stack>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ "& th": { fontWeight: 700, color: "text.secondary", whiteSpace: "nowrap" } }}>
                <TableCell>名前</TableCell>
                <TableCell sx={{ display: { xs: "none", sm: "table-cell" } }}>メールアドレス</TableCell>
                <TableCell>ロール</TableCell>
                <TableCell align="right">記事数</TableCell>
                <TableCell sx={{ display: { xs: "none", md: "table-cell" } }}>作成日</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!users &&
                [0, 1, 2].map((i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton height={40} />
                    </TableCell>
                  </TableRow>
                ))}
              {users?.map((user) => (
                <TableRow key={user.id} hover onClick={() => open(user)} sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                      <AuthorAvatar author={user} size={30} />
                      <Box>
                        <Typography sx={{ fontWeight: 600 }}>
                          {user.name}
                          {user.id === me?.id && (
                            <Typography component="span" variant="caption" sx={{ color: "primary.main", ml: 1, fontWeight: 700 }}>
                              あなた
                            </Typography>
                          )}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "text.secondary", display: { sm: "none" } }}>
                          {user.email}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", sm: "table-cell" }, color: "text.secondary" }}>{user.email}</TableCell>
                  <TableCell>
                    <RoleChip role={user.role} />
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    {user.blog_count}
                  </TableCell>
                  <TableCell sx={{ display: { xs: "none", md: "table-cell" }, color: "text.secondary", whiteSpace: "nowrap" }}>
                    {formatDateTime(user.created_at).slice(0, 10)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {users?.length === 0 && (
          <Typography sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>該当するユーザーはいません</Typography>
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

export default function UsersPage() {
  return (
    <AdminOnly>
      <Suspense>
        <UserList />
      </Suspense>
    </AdminOnly>
  );
}
