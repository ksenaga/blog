"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import { api } from "@/lib/cms/api";
import type { CmsBlog } from "@/lib/cms/types";

// 「新規作成」：タイトル「無題の記事」の下書きを作り、すぐに編集画面を開く（screendesign.md 8章 No.1）
export function useCreateBlog() {
  const router = useRouter();
  const { toastError } = useFeedback();
  const [creating, setCreating] = useState(false);

  async function createBlog() {
    setCreating(true);
    try {
      const { data } = await api<{ data: CmsBlog }>("/cms/blogs", {
        method: "POST",
        body: { title: "無題の記事" },
      });
      router.push(`/cms/blogs/${data.id}/edit`);
    } catch (error) {
      toastError(error);
      setCreating(false);
    }
  }

  return { createBlog, creating };
}
