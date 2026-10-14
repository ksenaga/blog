"use client";

// C-11. 通知一覧
import { Suspense } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import Pagination from "@mui/material/Pagination";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Typography from "@mui/material/Typography";
import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import NotificationsOffOutlinedIcon from "@mui/icons-material/NotificationsOffOutlined";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import PageHeader from "@/components/cms/PageHeader";
import { useUnreadCount } from "@/components/cms/UnreadCountProvider";
import { useApi } from "@/components/cms/useApi";
import { useListQuery } from "@/components/cms/useListQuery";
import { useOpenNotification } from "@/components/cms/useOpenNotification";
import { api } from "@/lib/cms/api";
import { formatDateTime } from "@/lib/cms/format";
import type { Notification, Paginated } from "@/lib/cms/types";

function NotificationList() {
  const { toast, toastError } = useFeedback();
  const { refresh } = useUnreadCount();
  const { get, set, page, query } = useListQuery();
  // 初期表示は未読（screendesign.md C-11）
  const tab = get("tab") || "unread";

  const params = new URLSearchParams(query);
  params.delete("tab");
  params.set("per_page", "20");
  if (tab === "unread") params.set("unread_only", "true");
  const { data: result, reload: load } = useApi<Paginated<Notification>>(`/cms/notifications?${params}`);
  // 既読にしたら一覧を取り直す
  const openNotification = useOpenNotification(load);

  async function handleReadAll() {
    try {
      await api("/cms/notifications/read-all", { method: "POST" });
      refresh();
      toast("すべて既読にしました");
      load();
    } catch (error) {
      toastError(error);
    }
  }

  const notifications = result?.data;

  return (
    <>
      <PageHeader
        title="通知"
        description="管理者があなたのブログやアカウントを操作したときに通知されます"
        actions={
          <Button variant="outlined" startIcon={<DoneAllRoundedIcon />} onClick={handleReadAll}>
            すべて既読にする
          </Button>
        }
      />
      <Paper variant="outlined" sx={{ borderRadius: "20px", overflow: "hidden" }}>
        <Tabs value={tab} onChange={(_, value) => set({ tab: value === "unread" ? null : value })} sx={{ px: 2, borderBottom: 1, borderColor: "divider" }}>
          <Tab value="unread" label="未読" sx={{ fontWeight: 700 }} />
          <Tab value="all" label="すべて" sx={{ fontWeight: 700 }} />
        </Tabs>

        {!notifications && (
          <Box sx={{ p: 2 }}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} height={64} />
            ))}
          </Box>
        )}
        {notifications?.length === 0 && (
          <Box sx={{ py: 8, textAlign: "center", color: "text.secondary" }}>
            <NotificationsOffOutlinedIcon sx={{ fontSize: 48, opacity: 0.4 }} />
            <Typography sx={{ mt: 1 }}>{tab === "unread" ? "未読の通知はありません" : "通知はありません"}</Typography>
          </Box>
        )}
        <List disablePadding>
          {notifications?.map((notification) => {
            const unread = !notification.read_at;
            return (
              <ListItemButton
                key={notification.id}
                onClick={() => openNotification(notification)}
                sx={(theme) => ({
                  gap: 2,
                  py: 2,
                  px: 3,
                  alignItems: "flex-start",
                  borderBottom: `1px solid ${theme.vars.palette.divider}`,
                  bgcolor: unread ? `rgba(${theme.vars.palette.primary.mainChannel} / 0.04)` : "transparent",
                })}
              >
                <Box
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 40,
                    height: 40,
                    borderRadius: "12px",
                    flexShrink: 0,
                    color: "#fff",
                    background:
                      notification.type === "password_reset_by_admin"
                        ? "linear-gradient(135deg, #f59e0b, #f97316)"
                        : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }}
                >
                  {notification.type === "password_reset_by_admin" ? <KeyRoundedIcon /> : <EditNoteRoundedIcon />}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{ fontWeight: unread ? 700 : 400 }}>{notification.message}</Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary" }}>
                    {formatDateTime(notification.created_at)}
                    {notification.blog?.deleted && "・このブログは削除されています"}
                  </Typography>
                </Box>
                {unread && <Box sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: "secondary.main", mt: 1, flexShrink: 0 }} aria-label="未読" />}
              </ListItemButton>
            );
          })}
        </List>
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

export default function NotificationsPage() {
  return (
    <Suspense>
      <NotificationList />
    </Suspense>
  );
}
