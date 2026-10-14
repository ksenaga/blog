"use client";

import { useCallback, useEffect, useState } from "react";
import { useFeedback } from "@/components/cms/FeedbackProvider";
import { api } from "@/lib/cms/api";

// GET の結果を取得する。path が変わったら取り直し、取得中は null を返す
export function useApi<T>(path: string | null) {
  const { toastError } = useFeedback();
  const [state, setState] = useState<{ path: string; data: T } | null>(null);

  const reload = useCallback(() => {
    if (!path) return;
    api<T>(path)
      .then((data) => setState({ path, data }))
      .catch(toastError);
  }, [path, toastError]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data: state && state.path === path ? state.data : null, reload };
}
