"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import InputBase from "@mui/material/InputBase";
import Paper from "@mui/material/Paper";
import SearchIcon from "@mui/icons-material/Search";

type Props = {
  autoFocus?: boolean;
  size?: "medium" | "large";
  onSubmitted?: () => void;
};

// キーワードを入力して Enter で検索結果（V-02）へ移動する
export default function SearchBox({ autoFocus, size = "medium", onSubmitted }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get("q") ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const q = keyword.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
    onSubmitted?.();
  }

  const large = size === "large";

  return (
    <Paper
      component="form"
      role="search"
      onSubmit={handleSubmit}
      elevation={0}
      sx={(theme) => ({
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        height: large ? 48 : 38,
        borderRadius: "8px",
        border: `1px solid ${theme.vars.palette.divider}`,
        backgroundColor: "background.default",
        transition: "border-color 0.15s",
        "&:focus-within": { borderColor: theme.vars.palette.text.secondary },
      })}
    >
      <SearchIcon sx={{ color: "text.secondary" }} fontSize={large ? "medium" : "small"} />
      <InputBase
        value={keyword}
        onChange={(event) => setKeyword(event.target.value)}
        placeholder="記事を検索"
        autoFocus={autoFocus}
        sx={{ flex: 1, fontSize: large ? 16 : 14 }}
        slotProps={{ input: { "aria-label": "記事を検索", enterKeyHint: "search", maxLength: 100 } }}
      />
    </Paper>
  );
}
