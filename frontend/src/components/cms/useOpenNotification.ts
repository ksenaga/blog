"use client";

import { useRouter } from "next/navigation";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import { useUnreadCount } from "@/components/cms/UnreadCountProvider";
import { api } from "@/lib/cms/api";
import type { Notification } from "@/lib/cms/types";

// 通知を押したとき：既読にして、ブログの通知なら対象のブログへ移動する（C-11）
export function useOpenNotification(onRead?: () => void) {
  const router = useRouter();
  const { toastError } = useFeedback();
  const { refresh } = useUnreadCount();

  return async (notification: Notification) => {
    if (!notification.read_at) {
      try {
        await api(`/cms/notifications/${notification.id}/read`, { method: "PATCH" });
        onRead?.();
        refresh();
      } catch (error) {
        toastError(error);
        return;
      }
    }
    if (notification.blog) {
      router.push(
        notification.blog.deleted
          ? `/cms/blogs/trash/${notification.blog.id}`
          : `/cms/blogs/${notification.blog.id}/edit`,
      );
    }
  };
}
