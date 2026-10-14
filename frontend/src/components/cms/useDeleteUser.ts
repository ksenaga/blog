"use client";

import { useFeedback } from "@/components/cms/FeedbackProvider";
import { api } from "@/lib/cms/api";
import type { CmsUserDetail } from "@/lib/cms/types";

// ユーザー削除（U-7）。誤操作を防ぐため、ユーザー名を入力したときだけ実行できる（screendesign.md 8章 No.3）
export function useDeleteUser() {
  const { toast, toastError, confirm } = useFeedback();

  return async (user: CmsUserDetail, options: { self?: boolean } = {}) => {
    const ok = await confirm({
      title: options.self ? "アカウントを削除しますか？" : `${user.name} を削除しますか？`,
      message: `このユーザーのブログ ${user.blog_count}件 も削除され、復活することはできません。`,
      confirmLabel: "削除する",
      danger: true,
      requireText: user.name,
    });
    if (!ok) return false;
    try {
      await api(`/cms/users/${user.id}`, { method: "DELETE" });
      toast("削除しました");
      return true;
    } catch (error) {
      toastError(error);
      return false;
    }
  };
}
