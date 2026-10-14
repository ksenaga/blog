"use client";

import { useFeedback } from "@/components/cms/FeedbackProvider";
import { api } from "@/lib/cms/api";
import type { CmsBlog } from "@/lib/cms/types";

// ブログの復活（B-8）。確認ダイアログを出してから復活する
export function useRestoreBlog() {
  const { toast, toastError, confirm } = useFeedback();

  return async (blog: CmsBlog): Promise<CmsBlog | null> => {
    const ok = await confirm({
      title: "ブログを復活しますか？",
      message: `「${blog.title}」を復活します。\n復活すると「非公開」（一度も公開していない場合は「下書き」）になります。`,
      confirmLabel: "復活する",
    });
    if (!ok) return null;
    try {
      const { data } = await api<{ data: CmsBlog }>(`/cms/blogs/${blog.id}/restore`, { method: "POST" });
      toast("復活しました");
      return data;
    } catch (error) {
      toastError(error);
      return null;
    }
  };
}
