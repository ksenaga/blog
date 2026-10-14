"use client";

// C-02. ダッシュボード
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Skeleton from "@mui/material/Skeleton";
import Typography from "@mui/material/Typography";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import PublicRoundedIcon from "@mui/icons-material/PublicRounded";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import { useAuth } from "@/components/cms/AuthProvider";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import PageHeader from "@/components/cms/PageHeader";
import StatusChip from "@/components/cms/StatusChip";
import { useCreateBlog } from "@/components/cms/useCreateBlog";
import { useOpenNotification } from "@/components/cms/useOpenNotification";
import { api } from "@/lib/cms/api";
import { formatDateTime } from "@/lib/cms/format";
import type { BlogStatus, Dashboard, Notification, Paginated } from "@/lib/cms/types";

const COUNT_CARDS: { key: BlogStatus | "deleted"; label: string; icon: ReactNode; gradient: string; href: string }[] = [
  { key: "draft", label: "下書き", icon: <EditNoteRoundedIcon />, gradient: "linear-gradient(135deg, #64748b, #94a3b8)", href: "/cms/blogs?status=draft" },
  { key: "scheduled", label: "公開予定", icon: <EventRoundedIcon />, gradient: "linear-gradient(135deg, #0ea5e9, #6366f1)", href: "/cms/blogs?status=scheduled" },
  { key: "public", label: "公開中", icon: <PublicRoundedIcon />, gradient: "linear-gradient(135deg, #10b981, #14b8a6)", href: "/cms/blogs?status=public" },
  { key: "private", label: "非公開", icon: <VisibilityOffOutlinedIcon />, gradient: "linear-gradient(135deg, #f59e0b, #f97316)", href: "/cms/blogs?status=private" },
  { key: "deleted", label: "削除済み", icon: <DeleteOutlineRoundedIcon />, gradient: "linear-gradient(135deg, #ef4444, #db2777)", href: "/cms/blogs/trash" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const { toastError } = useFeedback();
  const { createBlog, creating } = useCreateBlog();
  const openNotification = useOpenNotification();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  useEffect(() => {
    api<{ data: Dashboard }>("/cms/dashboard")
      .then(({ data }) => setDashboard(data))
      .catch(toastError);
    api<Paginated<Notification>>("/cms/notifications?unread_only=true&per_page=5")
      .then(({ data }) => setNotifications(data))
      .catch(toastError);
  }, [toastError]);

  return (
    <>
      <PageHeader
        title={`こんにちは、${user?.name} さん`}
        description={user?.role === "admin" ? "サイト全体のブログの状況です" : "あなたのブログの状況です"}
        actions={
          <Button variant="contained" size="large" startIcon={<AddRoundedIcon />} onClick={createBlog} disabled={creating}>
            新規作成
          </Button>
        }
      />

      {/* 件数カード：押すとそのステータスで絞り込んだ一覧へ */}
      <Grid container spacing={2}>
        {COUNT_CARDS.map((card) => (
          <Grid key={card.key} size={{ xs: 6, sm: 4, md: 12 / 5 }}>
            <Card sx={{ height: "100%" }}>
              <CardActionArea href={card.href} sx={{ height: "100%" }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box
                    sx={{
                      display: "grid",
                      placeItems: "center",
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      color: "#fff",
                      background: card.gradient,
                      mb: 2,
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 600 }}>
                    {card.label}
                  </Typography>
                  <Typography sx={{ fontSize: 32, fontWeight: 800, lineHeight: 1.2 }}>
                    {dashboard ? dashboard.blog_counts[card.key] : <Skeleton width={40} />}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="未読の通知" moreHref="/cms/notifications">
            {notifications === null ? (
              <ListSkeleton />
            ) : notifications.length === 0 ? (
              <Empty>未読の通知はありません</Empty>
            ) : (
              <List disablePadding>
                {notifications.map((notification) => (
                  <ListItemButton key={notification.id} onClick={() => openNotification(notification)} sx={{ borderRadius: "12px", alignItems: "flex-start" }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "secondary.main", mt: 1.1, mr: 1.5, flexShrink: 0 }} />
                    <ListItemText primary={notification.message} secondary={formatDateTime(notification.created_at)} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Panel>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Panel title="最近更新したブログ" moreHref="/cms/blogs">
            {dashboard === null ? (
              <ListSkeleton />
            ) : dashboard.recent_blogs.length === 0 ? (
              <Empty>まだブログがありません</Empty>
            ) : (
              <List disablePadding>
                {dashboard.recent_blogs.map((blog) => (
                  <ListItemButton key={blog.id} onClick={() => router.push(`/cms/blogs/${blog.id}/edit`)} sx={{ borderRadius: "12px", gap: 2 }}>
                    <ListItemText
                      primary={blog.title}
                      secondary={`更新：${formatDateTime(blog.updated_at)}`}
                      slotProps={{ primary: { noWrap: true, sx: { fontWeight: 600 } } }}
                      sx={{ minWidth: 0 }}
                    />
                    <StatusChip status={blog.status} />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Panel>
        </Grid>
      </Grid>
    </>
  );
}

function Panel({ title, moreHref, children }: { title: string; moreHref: string; children: ReactNode }) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 1.5 }}>
          <Typography variant="h6" component="h2" sx={{ flex: 1 }}>
            {title}
          </Typography>
          <Button href={moreHref} size="small" endIcon={<ChevronRightRoundedIcon />}>
            すべて見る
          </Button>
        </Box>
        {children}
      </CardContent>
    </Card>
  );
}

function ListSkeleton() {
  return (
    <Box sx={{ px: 2 }}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} height={56} />
      ))}
    </Box>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <Typography sx={{ color: "text.secondary", py: 4, textAlign: "center" }}>{children}</Typography>;
}
