"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

// 一覧の絞り込み条件を URL に持たせる（例：/cms/blogs?status=draft&page=2）
export function useListQuery() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const get = useCallback((key: string) => searchParams.get(key) ?? "", [searchParams]);

  // 条件を変えたら1ページ目に戻す（page 自体を変えるときは除く）
  const set = useCallback(
    (patch: Record<string, string | number | null>) => {
      const params = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "" || (key === "page" && Number(value) <= 1)) params.delete(key);
        else params.set(key, String(value));
      }
      if (!("page" in patch)) params.delete("page");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname],
  );

  return { get, set, page: Math.max(1, Number(searchParams.get("page")) || 1), query: searchParams.toString() };
}
